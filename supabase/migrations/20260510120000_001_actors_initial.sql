-- Migration: 001_actors_initial
-- Created: 2026-05-10
-- Purpose: Bloque 3b.1 — primera estructura de auth real en Supabase.
--
-- Crea la tabla public.actors (1 fila por usuario registrado),
-- las RLS policies para que cada Actor solo pueda ver y editar su
-- propio registro, y un trigger sobre auth.users que rellena la fila
-- automáticamente con los metadatos pasados en options.data del
-- supabase.auth.signUp() del cliente.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Tabla public.actors
-- ─────────────────────────────────────────────────────────────────────
-- Columnas anchas y nullables para resiliencia: el alta puede llegar
-- con metadatos parciales y el Actor completa después desde su panel.
create table if not exists public.actors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- legal entity
  entity_code text,
  entity_kind text check (entity_kind in ('individual', 'company')),

  -- localization
  country_code text,

  -- sector + role
  sector_id text,
  role_id text,

  -- registration data
  first_name text,
  last_name text,
  tax_id text,
  company_name text,
  legal_rep text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  years_in_sector text,

  -- consents snapshot (JSON: { accepted, versions, acceptedAt, userAgent })
  consents jsonb default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Row-Level Security
-- ─────────────────────────────────────────────────────────────────────
-- El Actor solo puede leer y modificar SU propio registro.
alter table public.actors enable row level security;

drop policy if exists "actors_select_own" on public.actors;
create policy "actors_select_own" on public.actors
  for select using (auth.uid() = user_id);

drop policy if exists "actors_insert_own" on public.actors;
create policy "actors_insert_own" on public.actors
  for insert with check (auth.uid() = user_id);

drop policy if exists "actors_update_own" on public.actors;
create policy "actors_update_own" on public.actors
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Trigger on auth.users insert → public.actors
-- ─────────────────────────────────────────────────────────────────────
-- Cada vez que se inserta un user en auth.users (signUp), se crea su
-- fila en public.actors copiando los metadatos pasados en options.data
-- del signUp del cliente. security definer para que la función pueda
-- escribir aunque el caller (auth) no tenga permisos sobre public.actors.
create or replace function public.handle_new_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.actors (
    user_id, entity_code, entity_kind, country_code, sector_id, role_id,
    first_name, last_name, tax_id, company_name, legal_rep, email,
    phone, address, postal_code, city, years_in_sector, consents
  )
  values (
    new.id,
    new.raw_user_meta_data->>'entity_code',
    new.raw_user_meta_data->>'entity_kind',
    new.raw_user_meta_data->>'country_code',
    new.raw_user_meta_data->>'sector_id',
    new.raw_user_meta_data->>'role_id',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'tax_id',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'legal_rep',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'years_in_sector',
    coalesce(new.raw_user_meta_data->'consents', '{}'::jsonb)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_actor();

-- ─────────────────────────────────────────────────────────────────────
-- 4. Trigger updated_at en public.actors
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists actors_updated_at on public.actors;
create trigger actors_updated_at
  before update on public.actors
  for each row execute function public.handle_updated_at();
