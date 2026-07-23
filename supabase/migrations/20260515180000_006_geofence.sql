-- Migration: 006_geofence
-- Created: 2026-05-15
-- Purpose: Sprint 1 del compliance MiCA — geofence básico.
--
-- Crea las tres tablas que soportan el bloqueo por país y la captación
-- de leads en mercados aún no abiertos:
--
--   1. public.country_restrictions   — lista configurable de países y su
--      estado (allowed / blocked_sanctions / blocked_pending_license /
--      waitlist). Se actualiza desde el panel del operador (Admin role)
--      sin redeploy.
--
--   2. public.geofence_log           — registro inmutable de cada intento
--      bloqueado. Auditoría regulatoria (Banco España, SEPBLAC).
--
--   3. public.waitlist               — emails de leads en mercados que
--      aún no atendemos (US, UK, Asia...). Permite captar interés sin
--      operar y comunicar cuando el mercado se abra.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. country_restrictions
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.country_restrictions (
  country_code     varchar(2) primary key,
  status           varchar(30) not null check (status in (
                     'allowed',
                     'blocked_sanctions',
                     'blocked_pending_license',
                     'waitlist'
                   )),
  reason           text,
  estimated_until  date,
  updated_by       uuid references auth.users(id),
  updated_at       timestamptz not null default now()
);

comment on table public.country_restrictions is
  'Lista configurable de países y su estado de habilitación. Editable desde panel operador (rol admin).';

-- RLS: solo service_role lee/escribe esta tabla. El middleware accede vía
-- service role en server-side.
alter table public.country_restrictions enable row level security;

drop policy if exists "country_restrictions_service_role_all" on public.country_restrictions;
create policy "country_restrictions_service_role_all" on public.country_restrictions
  for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────
-- 2. geofence_log (inmutable — append only)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.geofence_log (
  id                uuid primary key default gen_random_uuid(),
  ip_address        inet not null,
  detected_country  varchar(2),
  detected_via      varchar(30),
  vpn_detected      boolean default false,
  tor_detected      boolean default false,
  proxy_detected    boolean default false,
  path_attempted    text not null,
  action_taken      varchar(30) not null,
  user_agent        text,
  created_at        timestamptz not null default now()
);

comment on table public.geofence_log is
  'Registro inmutable de cada decisión del geofence (allowed/blocked). Auditoría regulatoria.';

create index if not exists geofence_log_created_idx
  on public.geofence_log (created_at desc);
create index if not exists geofence_log_country_idx
  on public.geofence_log (detected_country);

-- Append-only: bloquear UPDATE y DELETE para garantizar integridad del log.
alter table public.geofence_log enable row level security;

drop policy if exists "geofence_log_service_insert" on public.geofence_log;
create policy "geofence_log_service_insert" on public.geofence_log
  for insert with check (auth.role() = 'service_role');

drop policy if exists "geofence_log_service_read" on public.geofence_log;
create policy "geofence_log_service_read" on public.geofence_log
  for select using (auth.role() = 'service_role');

-- Reglas SQL que impiden modificar el log (operator deshonesto no puede borrar rastro)
create or replace rule geofence_log_no_update as
  on update to public.geofence_log do instead nothing;

create or replace rule geofence_log_no_delete as
  on delete to public.geofence_log do instead nothing;

-- ─────────────────────────────────────────────────────────────────────
-- 3. waitlist (leads de mercados no abiertos)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  country_code       varchar(2) not null,
  sector_id          text,
  consent_marketing  boolean default false,
  ip_address         inet,
  user_agent         text,
  created_at         timestamptz not null default now(),
  unique (email, country_code)
);

comment on table public.waitlist is
  'Leads en mercados aún no atendidos por 1503 (US, UK, Asia...). Para comunicar cuando se abra.';

create index if not exists waitlist_country_idx on public.waitlist (country_code);
create index if not exists waitlist_created_idx on public.waitlist (created_at desc);

-- RLS: cualquier usuario anónimo puede insertar (form público), solo service_role lee.
alter table public.waitlist enable row level security;

drop policy if exists "waitlist_anon_insert" on public.waitlist;
create policy "waitlist_anon_insert" on public.waitlist
  for insert with check (true);

drop policy if exists "waitlist_service_read" on public.waitlist;
create policy "waitlist_service_read" on public.waitlist
  for select using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────
-- 4. Seed inicial de country_restrictions
-- ─────────────────────────────────────────────────────────────────────
-- Política agosto 2026: solo UE-27 + EFTA-4 (CH, IS, LI, NO) permitidos.
-- Roll-out futuro por mercado según licencias obtenidas (ver ADR 0001).

-- Permitidos: UE 27 + EFTA 4 = 31 países
insert into public.country_restrictions (country_code, status, reason) values
  -- UE 27
  ('AT', 'allowed', 'UE — MiCA'),
  ('BE', 'allowed', 'UE — MiCA'),
  ('BG', 'allowed', 'UE — MiCA'),
  ('HR', 'allowed', 'UE — MiCA'),
  ('CY', 'allowed', 'UE — MiCA'),
  ('CZ', 'allowed', 'UE — MiCA'),
  ('DK', 'allowed', 'UE — MiCA'),
  ('EE', 'allowed', 'UE — MiCA'),
  ('FI', 'allowed', 'UE — MiCA'),
  ('FR', 'allowed', 'UE — MiCA'),
  ('DE', 'allowed', 'UE — MiCA'),
  ('GR', 'allowed', 'UE — MiCA'),
  ('HU', 'allowed', 'UE — MiCA'),
  ('IE', 'allowed', 'UE — MiCA'),
  ('IT', 'allowed', 'UE — MiCA'),
  ('LV', 'allowed', 'UE — MiCA'),
  ('LT', 'allowed', 'UE — MiCA'),
  ('LU', 'allowed', 'UE — MiCA'),
  ('MT', 'allowed', 'UE — MiCA'),
  ('NL', 'allowed', 'UE — MiCA'),
  ('PL', 'allowed', 'UE — MiCA'),
  ('PT', 'allowed', 'UE — MiCA'),
  ('RO', 'allowed', 'UE — MiCA'),
  ('SK', 'allowed', 'UE — MiCA'),
  ('SI', 'allowed', 'UE — MiCA'),
  ('ES', 'allowed', 'UE — MiCA + sede social'),
  ('SE', 'allowed', 'UE — MiCA'),
  -- EFTA 4
  ('IS', 'allowed', 'EFTA — alineado con MiCA'),
  ('LI', 'allowed', 'EFTA — alineado con MiCA'),
  ('NO', 'allowed', 'EFTA — alineado con MiCA'),
  ('CH', 'blocked_pending_license', 'FINMA registration pendiente')
on conflict (country_code) do nothing;

-- Sancionados (OFAC / UE / UN) — bloqueo permanente
insert into public.country_restrictions (country_code, status, reason) values
  ('KP', 'blocked_sanctions', 'OFAC + UN — sanción total'),
  ('IR', 'blocked_sanctions', 'OFAC + UE — sanción comprehensiva'),
  ('SY', 'blocked_sanctions', 'OFAC + UE'),
  ('CU', 'blocked_sanctions', 'OFAC'),
  ('RU', 'blocked_sanctions', 'UE + UK + US — sanciones post-2022'),
  ('BY', 'blocked_sanctions', 'UE — sanciones post-2022'),
  ('MM', 'blocked_sanctions', 'UE — Myanmar'),
  ('AF', 'blocked_sanctions', 'OFAC + UN — Talibán'),
  ('YE', 'blocked_sanctions', 'UN — guerra civil'),
  ('SD', 'blocked_sanctions', 'OFAC — guerra civil'),
  ('SS', 'blocked_sanctions', 'OFAC + UN'),
  ('LY', 'blocked_sanctions', 'UN — inestabilidad'),
  ('VE', 'blocked_sanctions', 'OFAC sectorial'),
  ('NI', 'blocked_sanctions', 'OFAC + UE'),
  ('CF', 'blocked_sanctions', 'UN'),
  ('CD', 'blocked_sanctions', 'OFAC sectorial'),
  ('SO', 'blocked_sanctions', 'UN'),
  ('IQ', 'blocked_sanctions', 'OFAC sectorial residual')
on conflict (country_code) do nothing;

-- Pendientes de licencia local
insert into public.country_restrictions (country_code, status, reason, estimated_until) values
  ('US', 'blocked_pending_license', 'Esperando firma CLARITY Act + MTLs estatales', '2027-06-30'),
  ('GB', 'blocked_pending_license', 'FCA registration', '2026-12-31'),
  ('SG', 'blocked_pending_license', 'MAS DPT licence', '2027-03-31'),
  ('HK', 'blocked_pending_license', 'SFC VATP licence', '2027-03-31'),
  ('JP', 'blocked_pending_license', 'JFSA registration', '2027-06-30'),
  ('AU', 'blocked_pending_license', 'AUSTRAC + ASIC', '2027-06-30'),
  ('CA', 'blocked_pending_license', 'CSA + FINTRAC', '2027-06-30'),
  ('AE', 'blocked_pending_license', 'VARA + ADGM', '2027-06-30')
on conflict (country_code) do nothing;

-- Todos los demás países: waitlist por defecto (insertar uno a uno cuando aparezcan).
-- El middleware tratará "país sin registro" como waitlist automáticamente.

-- ─────────────────────────────────────────────────────────────────────
-- 5. Trigger updated_at en country_restrictions
-- ─────────────────────────────────────────────────────────────────────
drop trigger if exists country_restrictions_updated_at on public.country_restrictions;
create trigger country_restrictions_updated_at
  before update on public.country_restrictions
  for each row execute function public.handle_updated_at();
