-- Migration: 007_auth_attempt_log
-- Created: 2026-05-16
-- Purpose: Bloque C — rate limit del OTP de acceso + audit log de auth.
--
-- El flujo /acceso (request-otp + verify-otp) no tenía ni rate limit ni
-- registro de intentos. La OTP de 6 dígitos (espacio 10^6, validez ~1 h en
-- Supabase) era fuerza-bruteable sin fricción, y request-otp se podía
-- martillear para inundar buzones y quemar cuota de email. Gap CRÍTICO del
-- ADR 0003.
--
-- Esta tabla cumple DOS funciones con una sola fuente de verdad:
--   1. Audit log inmutable de cada intento de auth (forense + AML/SEPBLAC).
--   2. Fuente del rate limit: el conteo de filas recientes por email/IP en
--      una ventana deslizante determina si se bloquea el siguiente intento.
--
-- Append-only (mismo patrón que public.geofence_log): RLS service-only +
-- reglas SQL que anulan UPDATE/DELETE, de modo que un operador deshonesto
-- no pueda borrar el rastro de un ataque en curso.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. auth_attempt_log (inmutable — append only)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.auth_attempt_log (
  id           uuid primary key default gen_random_uuid(),

  -- Identidad intentada. Se guarda en minúsculas. Puede no existir como
  -- cuenta (un intento contra un email inexistente también se audita).
  email        text not null,

  ip_address   inet,

  -- 'request_otp'  → solicitud de envío de código
  -- 'verify_otp'   → intento de canje de código
  action       varchar(20) not null check (action in ('request_otp', 'verify_otp')),

  -- Resultado de ESTE intento. 'rate_limited' = bloqueado por umbral.
  outcome      varchar(20) not null check (outcome in (
                 'sent',
                 'success',
                 'rate_limited',
                 'invalid_code',
                 'not_found',
                 'not_approved',
                 'operator',
                 'error'
               )),

  user_agent   text,
  created_at   timestamptz not null default now()
);

comment on table public.auth_attempt_log is
  'Registro inmutable de cada intento de auth (request/verify OTP). Doble función: audit forense/AML + fuente del rate limit por ventana deslizante.';

-- Índices que sirven exactamente las consultas del rate limit:
-- "intentos de este email/IP, para esta acción, en los últimos N minutos".
create index if not exists auth_attempt_log_email_idx
  on public.auth_attempt_log (email, action, created_at desc);
create index if not exists auth_attempt_log_ip_idx
  on public.auth_attempt_log (ip_address, action, created_at desc);
create index if not exists auth_attempt_log_created_idx
  on public.auth_attempt_log (created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Row-Level Security + append-only
-- ─────────────────────────────────────────────────────────────────────
-- Solo service_role lee/escribe. Los endpoints server-side usan service
-- role; el cliente nunca toca esta tabla.
alter table public.auth_attempt_log enable row level security;

drop policy if exists "auth_attempt_log_service_insert" on public.auth_attempt_log;
create policy "auth_attempt_log_service_insert" on public.auth_attempt_log
  for insert with check (auth.role() = 'service_role');

drop policy if exists "auth_attempt_log_service_read" on public.auth_attempt_log;
create policy "auth_attempt_log_service_read" on public.auth_attempt_log
  for select using (auth.role() = 'service_role');

-- Reglas SQL que impiden modificar el log: ni un operador con service role
-- puede borrar/alterar el rastro de un ataque (integridad forense).
create or replace rule auth_attempt_log_no_update as
  on update to public.auth_attempt_log do instead nothing;

create or replace rule auth_attempt_log_no_delete as
  on delete to public.auth_attempt_log do instead nothing;
