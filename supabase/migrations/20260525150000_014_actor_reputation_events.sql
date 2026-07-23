-- Migration: 014_actor_reputation_events
-- Created: 2026-05-25
-- Purpose: Fase 3c — Capa 1 del sistema de reputación verificable.
--
-- Tabla append-only que registra eventos relevantes en la trayectoria de
-- un Actor: operaciones cerradas, entregas a tiempo, pagos puntuales,
-- credenciales verificadas, incidencias resueltas. Es la base sobre la
-- que se computa el "currículum" público (sin almacenarlo) y, en Fase 8+,
-- se ancla en XDC por hash SHA-256 (RGPD-safe: datos personales off-chain,
-- solo el hash on-chain).
--
-- v1 (HOY): tabla creada vacía. No hay productores todavía. La ficha
-- pública leerá la tabla y mostrará slots "—" hasta que existan eventos.
--
-- Productores futuros (Fase 5-8):
--   - Cierre de operación (oferta aceptada → escrow liberado)
--   - Cumplimiento de entrega vs SLA
--   - Cumplimiento de pago vs términos
--   - Apertura/resolución de disputa
--   - Verificación de credencial profesional (Fase 3a-bis)
--   - Renovación periódica de KYC
--
-- Catálogo de event_type NO se constringe en CHECK (flexibilidad). El
-- canónico vive en docs/plan-reputacion.md.
--
-- RGPD: counterparty_user_id puede ser NULL si la contraparte no consintió
-- ser visible. El derecho al olvido (Art. 17) se ejecuta borrando filas
-- (cascade desde auth.users); el hash on-chain (Fase 8+) queda huérfano
-- sin posibilidad de re-identificación.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Tabla append-only de eventos de reputación
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.actor_reputation_events (
  id                    uuid primary key default gen_random_uuid(),

  -- Actor titular del evento (el "currículum" pertenece a este user).
  user_id               uuid not null references auth.users(id) on delete cascade,

  -- Tipo de evento. Texto libre por flexibilidad; catálogo en docs/.
  event_type            text not null check (char_length(event_type) between 3 and 64),

  -- Contraparte (si aplica). NULL si el evento es solo del titular
  -- (p.ej. credencial verificada) o si la contraparte no consintió
  -- aparecer en la trayectoria pública. El gating de visibilidad de la
  -- contraparte se aplica en la API server-side, no aquí.
  counterparty_user_id  uuid references auth.users(id) on delete set null,

  -- Payload arbitrario: importes, fechas, refs a operación/contrato (que
  -- serán entidades de Fase 5+), hashes de documentos asociados. v1 vacío.
  payload               jsonb not null default '{}'::jsonb,

  -- Hash SHA-256 del evento canónico (calculado en server) para anclar
  -- on-chain en Fase 8+. Hex 64 chars o NULL.
  event_hash            text check (event_hash is null or event_hash ~* '^[0-9a-f]{64}$'),

  -- Si y cuándo se ancló en XDC. NULL hasta Fase 8+.
  onchain_tx_hash       text,
  onchain_anchored_at   timestamptz,

  created_at            timestamptz not null default now()
);

-- Índices: el caso de uso primario es leer la trayectoria de un Actor
-- ordenada cronológicamente descendente.
create index if not exists actor_reputation_events_user_created_idx
  on public.actor_reputation_events (user_id, created_at desc);

-- Filtrado por tipo (p.ej. solo 'operation_closed') para métricas.
create index if not exists actor_reputation_events_type_idx
  on public.actor_reputation_events (event_type);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Append-only enforcement (defensa en profundidad)
-- ─────────────────────────────────────────────────────────────────────
-- Aunque la RLS bloquea UPDATE/DELETE del cliente, el service_role los
-- saltaría. Un trigger lanza error en cualquier intento, garantizando
-- que la trayectoria NO se puede reescribir ni desde el server (excepto
-- borrando explícitamente la tabla, que sería un acto deliberado).
create or replace function public.reject_reputation_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'actor_reputation_events is append-only';
end;
$$;

drop trigger if exists actor_reputation_events_no_update on public.actor_reputation_events;
create trigger actor_reputation_events_no_update
  before update on public.actor_reputation_events
  for each row execute function public.reject_reputation_mutation();

drop trigger if exists actor_reputation_events_no_delete on public.actor_reputation_events;
create trigger actor_reputation_events_no_delete
  before delete on public.actor_reputation_events
  for each row execute function public.reject_reputation_mutation();

-- NOTA: el `on delete cascade` desde auth.users SÍ borra filas (RGPD
-- Art. 17). El trigger anterior se dispara para DELETE manuales pero
-- NO bloquea cascadas de FK — eso es comportamiento intencional: el
-- derecho al olvido prevalece sobre la inmutabilidad.

-- ─────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security
-- ─────────────────────────────────────────────────────────────────────
-- SELECT: cada Actor ve SU propia trayectoria. Las trayectorias ajenas
-- se sirven solo por API server-side (service_role) que filtra campos
-- públicos. Igual patrón que public.actors.
--
-- INSERT/UPDATE/DELETE: ninguna política → cliente bloqueado. Solo el
-- server con service_role escribe (Fase 5+).
alter table public.actor_reputation_events enable row level security;

drop policy if exists "reputation_select_own" on public.actor_reputation_events;
create policy "reputation_select_own" on public.actor_reputation_events
  for select using (auth.uid() = user_id);
