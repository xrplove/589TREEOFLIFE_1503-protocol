-- Migration: 003_consent_log
-- Created: 2026-05-10
-- Purpose: Bloque 3b.3 — append-only audit log of every consent acceptance,
-- with the IP address and user agent captured server-side at the time the
-- /api/auth/persist-consents endpoint receives the snapshot.
--
-- The denormalised public.actors.consents column (populated by the trigger
-- from raw_user_meta_data on signUp) stays as the "latest snapshot" pointer
-- for fast reads. public.consent_log is the legal-grade immutable record:
-- one row per acceptance, never updated, never deleted from the client side.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Tabla public.consent_log
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Snapshot completo enviado por el cliente:
  -- { accepted: { kycIdentity, kycSocietary, ... }, versions: { tos, privacy, ... },
  --   acceptedAt: ISO8601, userAgent: string }
  consents jsonb not null,

  -- Capturados server-side desde headers del request, no del cliente.
  ip_address text,
  user_agent text,

  created_at timestamptz not null default now()
);

-- Búsquedas habituales: "todas las aceptaciones de un usuario, más recientes primero".
create index if not exists consent_log_user_id_idx
  on public.consent_log (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Row-Level Security
-- ─────────────────────────────────────────────────────────────────────
-- Cada Actor lee sus propias entradas. NO se permite INSERT/UPDATE/DELETE
-- desde el cliente: las escrituras vienen del endpoint server-side que usa
-- service_role para saltarse RLS, lo que hace el log tamper-evident.
alter table public.consent_log enable row level security;

drop policy if exists "consent_log_select_own" on public.consent_log;
create policy "consent_log_select_own" on public.consent_log
  for select using (auth.uid() = user_id);
