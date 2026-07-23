-- Migration: 021_dpp_roles_delegations_auth_hook
-- Created: 2026-05-27
-- Purpose: DPP Modulo 2 - pieza 1/4 - infraestructura BD para Edge Function dpp-validator.
--
-- CONTENIDO
-- ---------
--   1. Tabla actor_roles (mapeo user_id -> rol con append-only audit + GDPR cascade)
--   2. Tabla dpp_delegations (consentimiento explicito owner -> verificador para registrar eventos)
--   3. Funcion custom_access_token_hook (inyecta app_metadata.roles array en JWT en cada refresh)
--   4. Upgrade de is_dpp_authority_role() para comprobar array de roles (no string singular)
--
-- BASE LEGAL
-- ----------
--   - GDPR Art. 17 (cascade delete derecho al olvido)
--   - Reg. UE 2024/1781 ESPR Art. 9.5 (acceso diferenciado por rol al DPP)
--   - Trazabilidad y consentimiento explicito segun GDPR Art. 6.1.a
--
-- COMO APLICAR (manual desde Dashboard - feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Borrar editor (Ctrl+A, Delete)
--   3. Pegar contenido entero
--   4. Run (Ctrl + Enter)
--   5. Esperar "Success. No rows returned."
--
-- POST-APLICACION
-- ---------------
-- La funcion custom_access_token_hook se crea aqui pero NO se activa
-- automaticamente. Hay que activarla manualmente en Dashboard:
--   Authentication -> Hooks -> Custom Access Token Hook
--   Seleccionar funcion: public.custom_access_token_hook
--   Habilitar
-- Solo entonces los JWT empezaran a llevar app_metadata.roles.

-- ============================================================
-- 1. Tabla actor_roles
-- ============================================================
-- Mapeo user_id -> rol(es). Cada fila representa una concesion de rol
-- vigente o pasada. Append-only para audit + GDPR cascade.
create table if not exists public.actor_roles (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  role                    text not null check (char_length(role) between 3 and 64),
  granted_by_user_id      uuid references auth.users(id) on delete set null,
  granted_at              timestamptz not null default now(),
  valid_until             timestamptz,
  revoked_at              timestamptz,
  revoked_by_user_id      uuid references auth.users(id) on delete set null,
  pdf_proof_url           text,
  created_at              timestamptz not null default now()
);

create index if not exists actor_roles_user_idx on public.actor_roles (user_id);
create index if not exists actor_roles_role_idx on public.actor_roles (role);
create index if not exists actor_roles_active_idx on public.actor_roles (user_id, role)
  where revoked_at is null;

-- Append-only enforcement con cascade GDPR Art. 17.
-- Patron canonico pg_trigger_depth() > 1.
create or replace function public.reject_actor_roles_mutation()
returns trigger
language plpgsql
as $body$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'actor_roles is append-only; use revocacion logica via revoked_at; DELETE solo via cascade FK GDPR Art. 17';
end;
$body$;

drop trigger if exists actor_roles_no_delete on public.actor_roles;
create trigger actor_roles_no_delete
  before delete on public.actor_roles
  for each row execute function public.reject_actor_roles_mutation();

-- UPDATE permitido solo para revocar (poner revoked_at + revoked_by).
-- El resto de campos NO se pueden modificar.
create or replace function public.actor_roles_only_revoke()
returns trigger
language plpgsql
as $body$
begin
  if new.user_id is distinct from old.user_id
     or new.role is distinct from old.role
     or new.granted_by_user_id is distinct from old.granted_by_user_id
     or new.granted_at is distinct from old.granted_at
     or new.valid_until is distinct from old.valid_until
     or new.pdf_proof_url is distinct from old.pdf_proof_url
     or new.created_at is distinct from old.created_at then
    raise exception 'actor_roles UPDATE solo permite revocar (revoked_at + revoked_by_user_id)';
  end if;
  return new;
end;
$body$;

drop trigger if exists actor_roles_only_revoke on public.actor_roles;
create trigger actor_roles_only_revoke
  before update on public.actor_roles
  for each row execute function public.actor_roles_only_revoke();

alter table public.actor_roles enable row level security;

drop policy if exists "actor_roles_select_own" on public.actor_roles;
create policy "actor_roles_select_own" on public.actor_roles
  for select using (auth.uid() = user_id);

-- INSERT/UPDATE solo via service_role (no policy de cliente).

-- ============================================================
-- 2. Tabla dpp_delegations
-- ============================================================
-- Consentimiento explicito del owner del DPP autorizando a un
-- verificador a registrar eventos sobre su mercancia.
create table if not exists public.dpp_delegations (
  id                      uuid primary key default gen_random_uuid(),
  dpp_id                  uuid not null references public.dpp_registry(id) on delete cascade,
  granted_by_user_id      uuid not null references auth.users(id) on delete cascade,
  granted_to_user_id      uuid not null references auth.users(id) on delete cascade,
  allowed_event_types     public.dpp_event_type[],
  allowed_un_locodes      text[],
  allowed_verifier_roles  text[],
  valid_from              timestamptz not null default now(),
  valid_until             timestamptz,
  revoked_at              timestamptz,
  revoked_by_user_id      uuid references auth.users(id) on delete set null,
  notes                   text,
  created_at              timestamptz not null default now()
);

create index if not exists dpp_delegations_dpp_idx on public.dpp_delegations (dpp_id);
create index if not exists dpp_delegations_grantee_idx on public.dpp_delegations (granted_to_user_id);
create index if not exists dpp_delegations_active_idx on public.dpp_delegations (dpp_id, granted_to_user_id)
  where revoked_at is null;

-- Append-only con cascade GDPR. UPDATE solo para revocar (mismo patron actor_roles).
create or replace function public.reject_dpp_delegations_mutation()
returns trigger
language plpgsql
as $body$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'dpp_delegations is append-only; use revocacion via revoked_at';
end;
$body$;

drop trigger if exists dpp_delegations_no_delete on public.dpp_delegations;
create trigger dpp_delegations_no_delete
  before delete on public.dpp_delegations
  for each row execute function public.reject_dpp_delegations_mutation();

create or replace function public.dpp_delegations_only_revoke()
returns trigger
language plpgsql
as $body$
begin
  if new.dpp_id is distinct from old.dpp_id
     or new.granted_by_user_id is distinct from old.granted_by_user_id
     or new.granted_to_user_id is distinct from old.granted_to_user_id
     or new.allowed_event_types is distinct from old.allowed_event_types
     or new.allowed_un_locodes is distinct from old.allowed_un_locodes
     or new.allowed_verifier_roles is distinct from old.allowed_verifier_roles
     or new.valid_from is distinct from old.valid_from
     or new.valid_until is distinct from old.valid_until
     or new.notes is distinct from old.notes
     or new.created_at is distinct from old.created_at then
    raise exception 'dpp_delegations UPDATE solo permite revocar (revoked_at + revoked_by_user_id)';
  end if;
  return new;
end;
$body$;

drop trigger if exists dpp_delegations_only_revoke on public.dpp_delegations;
create trigger dpp_delegations_only_revoke
  before update on public.dpp_delegations
  for each row execute function public.dpp_delegations_only_revoke();

alter table public.dpp_delegations enable row level security;

-- SELECT: owner del DPP padre + verificador grantee.
drop policy if exists "dpp_delegations_select_grantor_or_grantee" on public.dpp_delegations;
create policy "dpp_delegations_select_grantor_or_grantee" on public.dpp_delegations
  for select using (
    auth.uid() = granted_by_user_id
    or auth.uid() = granted_to_user_id
  );

-- INSERT: solo el owner del DPP.
drop policy if exists "dpp_delegations_insert_owner" on public.dpp_delegations;
create policy "dpp_delegations_insert_owner" on public.dpp_delegations
  for insert with check (
    auth.uid() = granted_by_user_id
    and exists (
      select 1 from public.dpp_registry r
      where r.id = dpp_delegations.dpp_id
        and r.owner_user_id = auth.uid()
    )
  );

-- UPDATE: solo el grantor (para revocar).
drop policy if exists "dpp_delegations_update_grantor_revoke" on public.dpp_delegations;
create policy "dpp_delegations_update_grantor_revoke" on public.dpp_delegations
  for update using (auth.uid() = granted_by_user_id)
  with check (auth.uid() = granted_by_user_id);

-- ============================================================
-- 3. Funcion helper - rol activo del usuario
-- ============================================================
-- Devuelve array de roles activos (no revocados, dentro de ventana
-- valid_from/valid_until si aplica) para un user_id dado.
create or replace function public.get_active_actor_roles(p_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $body$
  select coalesce(array_agg(distinct role order by role), array[]::text[])
  from public.actor_roles
  where user_id = p_user_id
    and revoked_at is null
    and (valid_until is null or valid_until > now())
    and granted_at <= now();
$body$;

grant execute on function public.get_active_actor_roles(uuid) to authenticated, service_role;

-- ============================================================
-- 4. Custom Access Token Hook
-- ============================================================
-- Funcion que Supabase Auth invoca en cada token refresh para
-- enriquecer el JWT. Inyecta app_metadata.roles (array) leyendo
-- de actor_roles via get_active_actor_roles.
--
-- Schema del event JSON (Supabase Custom Access Token Hook):
--   {
--     "user_id": "uuid",
--     "claims": {
--        "app_metadata": { ... },
--        "user_metadata": { ... },
--        ...otros claims estandar JWT
--     }
--   }
-- La funcion devuelve el event modificado con claims actualizados.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $body$
declare
  v_user_id uuid;
  v_roles   text[];
  v_claims  jsonb;
begin
  v_user_id := (event ->> 'user_id')::uuid;
  v_roles := public.get_active_actor_roles(v_user_id);
  v_claims := event -> 'claims';

  -- Inyectar roles activos en app_metadata.roles (array).
  -- Si app_metadata no existe, crearlo.
  if v_claims -> 'app_metadata' is null then
    v_claims := jsonb_set(v_claims, '{app_metadata}', '{}'::jsonb);
  end if;
  v_claims := jsonb_set(
    v_claims,
    '{app_metadata,roles}',
    to_jsonb(v_roles),
    true
  );

  return jsonb_set(event, '{claims}', v_claims);
end;
$body$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

-- ============================================================
-- 5. Upgrade is_dpp_authority_role() para array de roles
-- ============================================================
-- Comprueba si el array app_metadata.roles del JWT contiene al menos
-- un rol de la lista canonica de autoridades DPP.
create or replace function public.is_dpp_authority_role()
returns boolean
language sql
stable
security invoker
as $body$
  select exists (
    select 1
    from jsonb_array_elements_text(
      coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)
    ) as r(role_name)
    where r.role_name in (
      'aduanas_es',
      'aduanas_eu_dg_taxud',
      'autoridad_portuaria_valencia',
      'autoridad_portuaria_barcelona',
      'autoridad_portuaria_algeciras',
      'autoridad_portuaria_bilbao',
      'inspector_espr_ue',
      'inspector_aemps'
    )
  );
$body$;

-- ============================================================
-- 6. Funcion helper - role check generico via JWT
-- ============================================================
-- Util para comprobar cualquier rol arbitrario (no solo autoridades).
-- Edge Function dpp-validator usara esto para verificar que el
-- verificador tiene el rol que declara.
create or replace function public.jwt_has_role(p_role text)
returns boolean
language sql
stable
security invoker
as $body$
  select exists (
    select 1
    from jsonb_array_elements_text(
      coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb)
    ) as r(role_name)
    where r.role_name = p_role
  );
$body$;

-- ============================================================
-- 7. Comentarios auto-documentacion
-- ============================================================
comment on table public.actor_roles is
  'DPP Modulo 2 - Mapeo user_id -> rol con append-only + GDPR cascade. UPDATE solo para revocar.';

comment on table public.dpp_delegations is
  'DPP Modulo 2 - Consentimiento explicito owner -> verificador para registrar eventos del DPP.';

comment on function public.custom_access_token_hook(jsonb) is
  'DPP Modulo 2 - Custom Access Token Hook que inyecta app_metadata.roles array en JWT. Activar en Dashboard > Authentication > Hooks.';

comment on function public.get_active_actor_roles(uuid) is
  'DPP Modulo 2 - Devuelve array de roles activos (no revocados + dentro de ventana temporal) para un user_id.';

comment on function public.is_dpp_authority_role() is
  'DPP Modulo 2 - Comprueba si el JWT contiene algun rol de autoridad DPP (upgrade migracion 019 para array de roles).';

comment on function public.jwt_has_role(text) is
  'DPP Modulo 2 - Helper generico para comprobar si el JWT contiene un rol arbitrario.';
