-- Migration: 004_kyc_state_machine
-- Created: 2026-05-10
-- Purpose: Bloque 3b.5 — máquina de estados de revisión KYC. Hasta hoy un Actor
-- con email confirmado podía acceder al workspace sin que sus documentos
-- legales hubiesen sido revisados por el Operador. Eso choca con la promesa
-- de la Privacy Policy y con el modelo de marketplace serio. Esta migración
-- añade:
--
--   1. Columna kyc_status en public.actors con 5 estados explícitos.
--   2. Tabla append-only public.kyc_review_log con la historia inmutable de
--      cada decisión (auto del sistema o manual del Operador).
--   3. Trigger en auth.users que auto-transiciona pending_email → pending_kyc
--      cuando el Actor verifica su correo.
--   4. Backfill para usuarios existentes que ya tenían email_confirmed_at
--      poblado antes de esta migración.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Columna kyc_status en public.actors
-- ─────────────────────────────────────────────────────────────────────
-- Estados:
--   pending_email — alta recién creada, esperando que verifique el correo.
--   pending_kyc   — correo verificado, esperando revisión humana de docs.
--   approved      — Operador aprobó los docs. Acceso operativo concedido.
--   rejected      — Operador rechazó. Acceso denegado. Puede aportar más info.
--   suspended     — bloqueo temporal por el Operador (sospecha, requerimiento
--                   legal, etc). Distinto de rejected: es reversible sin
--                   re-revisión completa.
--
-- text + check en lugar de enum porque añadir un valor a un enum postgres
-- exige migración pesada; esto permite ampliar el dominio sin downtime.
alter table public.actors
  add column if not exists kyc_status text not null default 'pending_email'
    check (kyc_status in ('pending_email', 'pending_kyc', 'approved', 'rejected', 'suspended'));

-- Index para el panel del Operador: "lista todos los pending_kyc, los más
-- antiguos primero" es la query más caliente.
create index if not exists actors_kyc_status_idx
  on public.actors (kyc_status, created_at);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Tabla public.kyc_review_log (audit append-only)
-- ─────────────────────────────────────────────────────────────────────
-- Historia inmutable de cada cambio de kyc_status. Cada fila es una decisión.
-- Nunca se actualiza ni se borra desde el cliente. Las escrituras vienen del
-- trigger (auto, reviewer_user_id NULL) o del endpoint del Operador (con
-- service role, reviewer_user_id = el operador que decidió).
create table if not exists public.kyc_review_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id),  -- NULL si decisión automatizada
  previous_status text,
  new_status text not null
    check (new_status in ('pending_email', 'pending_kyc', 'approved', 'rejected', 'suspended')),
  reason text,                                       -- motivo opcional, útil sobre todo en rejected/suspended
  created_at timestamptz not null default now()
);

-- Búsqueda: "historia completa de un Actor, decisiones más recientes primero".
create index if not exists kyc_review_log_actor_idx
  on public.kyc_review_log (actor_user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS — el Actor lee su propio log; nadie escribe desde cliente
-- ─────────────────────────────────────────────────────────────────────
alter table public.kyc_review_log enable row level security;

drop policy if exists "kyc_review_log_select_own" on public.kyc_review_log;
create policy "kyc_review_log_select_own" on public.kyc_review_log
  for select using (auth.uid() = actor_user_id);

-- Sin políticas INSERT/UPDATE/DELETE → bloqueadas por defecto. Las escrituras
-- llegan vía service_role (trigger SECURITY DEFINER + endpoint del Operador).

-- ─────────────────────────────────────────────────────────────────────
-- 4. Trigger: auto-transición pending_email → pending_kyc
-- ─────────────────────────────────────────────────────────────────────
-- Cuando auth.users.email_confirmed_at pasa de NULL a poblado, el Actor ha
-- demostrado control de su bandeja. Movemos su kyc_status a pending_kyc para
-- que aparezca en la cola del Operador, y registramos la transición.
--
-- SECURITY DEFINER porque el caller (Supabase auth) puede no tener permisos
-- directos sobre public.actors / public.kyc_review_log. set search_path es
-- defensa estándar contra hijacking de schema.
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.actors
      set kyc_status = 'pending_kyc'
      where user_id = new.id and kyc_status = 'pending_email';

    -- El IF FOUND captura si efectivamente actualizamos algo. Si el Actor
    -- ya estaba en otro estado (p.ej. approved manualmente antes de
    -- confirmar correo, caso raro pero posible), no escribimos log falso.
    if found then
      insert into public.kyc_review_log
        (actor_user_id, reviewer_user_id, previous_status, new_status, reason)
      values
        (new.id, null, 'pending_email', 'pending_kyc', 'auto: email verificado');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_email_confirmed on auth.users;
create trigger on_email_confirmed
  after update on auth.users
  for each row execute function public.handle_email_confirmed();

-- ─────────────────────────────────────────────────────────────────────
-- 5. Backfill — Actores existentes con email ya verificado
-- ─────────────────────────────────────────────────────────────────────
-- Los Actores que ya tenían email_confirmed_at antes de esta migración no
-- pasaron por el trigger. Los movemos manualmente a pending_kyc y dejamos
-- traza en el log con motivo "backfill".
do $$
declare
  rec record;
begin
  for rec in
    select a.user_id
    from public.actors a
    join auth.users u on u.id = a.user_id
    where u.email_confirmed_at is not null
      and a.kyc_status = 'pending_email'
  loop
    update public.actors
      set kyc_status = 'pending_kyc'
      where user_id = rec.user_id;

    insert into public.kyc_review_log
      (actor_user_id, reviewer_user_id, previous_status, new_status, reason)
    values
      (rec.user_id, null, 'pending_email', 'pending_kyc', 'backfill: migration 004');
  end loop;
end;
$$;
