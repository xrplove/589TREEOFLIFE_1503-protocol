-- Migration: 033_actors_subsector
-- Created: 2026-06-01
-- Purpose: Cerrar la cadena vertical país→sector→SUBSECTOR→documentación/KYC.
--          El motor de documentación (getApplicableRequirements en
--          app/data/sectorDocumentRequirements.ts) y el endpoint
--          /api/me/missing-documents YA esperan `subsector_id`, pero la tabla
--          public.actors no tenía la columna ni el trigger de alta la copiaba
--          desde los metadatos del signUp. Sin este dato el motor no puede
--          afinar la documentación por subsector (= grupo de actorGroups, p.ej.
--          inmobiliario → proyectos / edificación / obra-civil / instalaciones).
--
-- CONTEXTO
-- --------
-- "Subsector" en 1503 = el GRUPO de actorGroups.ts (NO las categorías de
-- producto del schema). DocumentApplicabilityScope.subsectors se indexa contra
-- estos ids de grupo. El alta (app/register/[code]/RegistrationFlow.tsx) ahora
-- captura sector → subsector → rol y lo pasa en options.data del signUp como
-- `subsector_id`, que el trigger handle_new_actor copia a public.actors.
--
-- Aditiva y segura: columna nullable (el alta puede llegar con metadatos
-- parciales; el Actor completa después). NO toca RLS ni datos existentes.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Columna subsector_id en public.actors
-- ─────────────────────────────────────────────────────────────────────
-- Va junto a sector_id + role_id (creados en 001). Nullable por la misma
-- razón de resiliencia que el resto de columnas del alta.
alter table public.actors
  add column if not exists subsector_id text;

comment on column public.actors.subsector_id is
  'Subsector del Actor = id de grupo en app/data/actorGroups.ts (p.ej. ''proyectos'', ''edificacion''). Determina, junto a sector_id + role_id + country_code, la documentación/KYC aplicable vía getApplicableRequirements. Nullable: el alta puede llegar con metadatos parciales.';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Recrear handle_new_actor() para copiar subsector_id del signUp
-- ─────────────────────────────────────────────────────────────────────
-- Misma función que en 001 (security definer · search_path = public), con
-- subsector_id añadido al INSERT entre sector_id y role_id, en paralelo a
-- como el cliente lo envía en raw_user_meta_data. create or replace es
-- idempotente; el trigger on_auth_user_created ya apunta a esta función y
-- no necesita recrearse, pero lo dejamos explícito por claridad.
create or replace function public.handle_new_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $body$
begin
  insert into public.actors (
    user_id, entity_code, entity_kind, country_code,
    sector_id, subsector_id, role_id,
    first_name, last_name, tax_id, company_name, legal_rep, email,
    phone, address, postal_code, city, years_in_sector, consents
  )
  values (
    new.id,
    new.raw_user_meta_data->>'entity_code',
    new.raw_user_meta_data->>'entity_kind',
    new.raw_user_meta_data->>'country_code',
    new.raw_user_meta_data->>'sector_id',
    new.raw_user_meta_data->>'subsector_id',
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
$body$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_actor();
