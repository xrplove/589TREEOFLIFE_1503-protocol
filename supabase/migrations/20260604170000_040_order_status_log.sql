-- Migration: 040_order_status_log
-- Created: 2026-06-04
-- Purpose: Auditoría APPEND-ONLY de las transiciones de estado del pedido maestro
--          (orders · mig 038). El quién/cuándo/de→a queda inmutable, no solo el
--          último updated_by/updated_at. Canon ~/.claude/CLAUDE.md §1 (append-only
--          para decisiones auditables).
--
-- CONTEXTO (sesión 4-jun · marca 1503 · test fábrica→transitario)
-- ---------------------------------------------------------------
-- Complementa /api/orders/[id]/transition (máquina de estados + gate de corredor).
-- Cada confirmación guarda además el SNAPSHOT de las obligaciones del corredor
-- vigentes en ese momento (corridor_compliance), para que la decisión sea
-- reconstruible en auditoría aunque el motor cambie después.
--
-- APPEND-ONLY (patrón canónico mig 020/028)
-- -----------------------------------------
-- Triggers no_update/no_delete con la función compartida reject_append_only_mutation()
-- (mig 028 §15): bloquea UPDATE/DELETE manual; permite el cascade FK (GDPR Art. 17,
-- pg_trigger_depth() > 1). El cascade GDPR llega vía orders → auth.users.
--
-- RLS (cerrada por defecto): SELECT solo participantes del pedido. Sin policy de
-- escritura de cliente → solo el canal server-side (service_role) inserta, y solo
-- a través del RPC transition_order_write (atómico con el cambio de estado).
--
-- ESTADO: APLICADA a la BD viva (proyecto sqsjmmybzokcwurgruaw) el 2026-06-04
--         vía MCP apply_migration (luz verde de José · feedback_sql_manual act.).
--
-- PRECONDICIONES: mig 038 (orders) · mig 028 (reject_append_only_mutation).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · TABLA order_status_log (append-only)
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.order_status_log (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,

  -- Transición registrada. from_status null = evento inicial (reservado · no usado aún).
  from_status     text check (from_status is null or from_status in (
    'draft','confirmed','in_transit','delivered','closed','cancelled'
  )),
  to_status       text not null check (to_status in (
    'draft','confirmed','in_transit','delivered','closed','cancelled'
  )),

  -- Quién la ejecutó (participante). on delete set null: si ese usuario ejerce
  -- el derecho al olvido pero el pedido es de otros, la fila de auditoría
  -- sobrevive con el actor anonimizado.
  actor_user_id   uuid references auth.users(id) on delete set null,

  -- Snapshot de las obligaciones del corredor al confirmar (o null). Reconstruye
  -- la decisión en auditoría aunque app/data/tradeCompliance.ts cambie luego.
  corridor_compliance jsonb,

  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists order_status_log_order_idx
  on public.order_status_log (order_id, created_at);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · RLS (cerrada por defecto · SELECT participantes)
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.order_status_log enable row level security;

drop policy if exists "order_status_log_select_participant" on public.order_status_log;
create policy "order_status_log_select_participant"
  on public.order_status_log
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_log.order_id
        and (o.buyer_user_id = auth.uid() or o.seller_user_id = auth.uid())
    )
  );

-- INSERT/UPDATE/DELETE: ninguna policy de cliente → solo service_role (RPC).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · TRIGGERS APPEND-ONLY (función compartida mig 028 §15)
-- ═════════════════════════════════════════════════════════════════════════════

drop trigger if exists order_status_log_no_update on public.order_status_log;
create trigger order_status_log_no_update
  before update on public.order_status_log
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists order_status_log_no_delete on public.order_status_log;
create trigger order_status_log_no_delete
  before delete on public.order_status_log
  for each row execute function public.reject_append_only_mutation();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · RPC transition_order_write (cambio de estado + log · ATÓMICO)
-- ═════════════════════════════════════════════════════════════════════════════
-- Hace en una sola transacción: UPDATE optimista del estado (where status=p_from,
-- guarda contra carrera) + INSERT del registro de auditoría. Si el log falla, el
-- cambio de estado revierte también. La validación de transición legal + gate de
-- corredor vive en la ruta; aquí solo la escritura atómica.
--
-- 0 filas (carrera de estado: el estado cambió entre lectura y update) → devuelve
-- vacío y NO inserta log; el caller lo mapea a 409.
--
-- SECURITY INVOKER · search_path='' · EXECUTE solo service_role (canal server-side).

create or replace function public.transition_order_write(
  p_order_id   uuid,
  p_from       text,
  p_to         text,
  p_actor      uuid,
  p_compliance jsonb default null,
  p_note       text  default null
)
returns table (id uuid, status text, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $body$
declare
  v_id      uuid;
  v_status  text;
  v_updated timestamptz;
begin
  update public.orders o
    set status = p_to, updated_by = p_actor
    where o.id = p_order_id and o.status = p_from
    returning o.id, o.status, o.updated_at into v_id, v_status, v_updated;

  if not found then
    return; -- carrera de estado → el caller responde 409
  end if;

  insert into public.order_status_log (
    order_id, from_status, to_status, actor_user_id, corridor_compliance, note
  ) values (
    p_order_id, p_from, p_to, p_actor, p_compliance, p_note
  );

  return query select v_id, v_status, v_updated;
end;
$body$;

revoke execute on function public.transition_order_write(uuid, text, text, uuid, jsonb, text) from public;
grant  execute on function public.transition_order_write(uuid, text, text, uuid, jsonb, text) to service_role;

comment on table public.order_status_log is
  'Auditoría append-only de transiciones de estado de orders (marca 1503). Inmutable (triggers no_update/no_delete · cascade GDPR permitido). Guarda from→to + actor + snapshot del cumplimiento del corredor al confirmar.';
comment on function public.transition_order_write(uuid, text, text, uuid, jsonb, text) is
  'Cambio de estado de orders + inserción del log de auditoría en una sola transacción (atómico). SECURITY INVOKER · EXECUTE solo service_role · usado por /api/orders/[id]/transition.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN MIGRACIÓN 040
-- ─────────────────────────────────────────────────────────────────────────────
