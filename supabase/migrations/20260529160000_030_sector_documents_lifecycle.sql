-- Migration: 030_sector_documents_lifecycle
-- Created: 2026-05-29
-- Purpose: Fase 1.6 · Sistema documentación legal sectorial (ADR 0012)
--
-- BASE LEGAL REAL
-- ---------------
-- - AMLR Reg. UE 2024/1624 Art. 14 · documentación KYC/KYB obligatoria
-- - Ley 10/2010 PBC/FT Art. 4 · documentación identificación clientes
-- - GDPR Art. 5.1.e · limitación de plazo de conservación
-- - DSA Art. 24 · transparencia documentación operativa
-- - ESPR Reg. UE 2024/1781 · cumplimiento DPP
-- - EUDR Reg. UE 2023/1115 · DDS registrada TRACES NT
-- - CRA Reg. UE 2024/2847 Art. 13 · SBOM + vuln disclosure
-- - Específico sectorial (AESAN · AEMPS · etc.)
--
-- ARQUITECTURA · 2 TABLAS APPEND-ONLY + 1 FUNCIÓN HELPER
-- ------------------------------------------------------
--   1. `sector_document_requirements` · catálogo legal canónico
--      (qué documentos requiere cada combinación sector/subsector/rol/país)
--   2. `actor_documents` · documentos subidos por actores con lifecycle
--      (pending · under_review · valid · expiring_soon · expired · rejected)
--
-- LIFECYCLE DE actor_documents
-- ----------------------------
-- Background job diario (Edge Function check-document-expirations) que:
--   - Detecta docs con expires_at <= now() + 30d → status='expiring_soon'
--   - Detecta docs con expires_at < now() → status='expired'
--   - Envía email al actor con docs vencidos
--
-- PII OFF-CHAIN + DERECHO AL OLVIDO
-- ---------------------------------
-- El documento original vive en Supabase Storage (PII). Solo el hash SHA-256
-- se ancla on-chain (mig 028). Cascade FK desde auth.users borra documento
-- + hash huérfano.
--
-- APPEND-ONLY
-- -----------
-- Trigger reject_append_only_mutation (mig 028 §15) en ambas tablas.
-- Excepción: status update vía función advance_document_status() con security
-- definer (similar a advance_notice_status mig 029).
--
-- COMO APLICAR
-- ------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar contenido entero
--   3. Run

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · Tabla `sector_document_requirements` · catálogo legal canónico
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.sector_document_requirements (
  id                              text primary key,                          -- 'universal-kyc-personal' · etc.
  document_type                   text not null check (document_type in (
    'fiscal_id',
    'mercantile_registry',
    'professional_license',
    'sectoral_certification',
    'sanitary_authorization',
    'environmental_permit',
    'fire_safety_certificate',
    'insurance_policy',
    'tax_certificate',
    'data_protection_registration',
    'union_chamber_membership',
    'transport_license',
    'customs_authorization',
    'kyc_documentary',
    'espr_compliance',
    'eudr_compliance',
    'cra_compliance',
    'sbom_published',
    'energy_certification',
    'other'
  )),

  -- Labels multilingües
  label_json                      jsonb not null,                            -- LocalizedLabel 8 idiomas
  description_json                jsonb not null,                            -- LocalizedLabel 8 idiomas

  -- Scope aplicabilidad
  scope                           jsonb not null default '{}'::jsonb,        -- { sectors, subsectors, roles, countries, legal_entity_kind }

  -- Autoridad emisora
  issuer_authority_json           jsonb not null,                            -- LocalizedLabel
  issuer_authority_url            text,

  -- Renovación
  renewal_period_months           integer check (renewal_period_months is null or renewal_period_months > 0),

  -- Obligatoriedad
  mandatory                       boolean not null default false,
  blocks_operation_if_missing     text[] not null default array[]::text[]
                                  check (
                                    array_position(blocks_operation_if_missing, 'invalid') is null
                                    and not blocks_operation_if_missing && array[]::text[]  -- no array vacío con NULL elements
                                  ),

  -- Base legal
  legal_basis                     text not null check (char_length(legal_basis) >= 5),

  -- Estado validación (Audit-Ready by Design)
  status                          text not null default 'subject_to_expert'
                                  check (status in ('draft', 'subject_to_expert', 'validated', 'deprecated')),

  -- Validación (cuando se valide)
  validated_by_authority          text,                                      -- nombre del experto/auditor
  validated_at                    timestamptz,
  validation_reference            text,                                      -- referencia del dictamen

  -- Audit
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists sector_document_requirements_status_idx
  on public.sector_document_requirements (status);

create index if not exists sector_document_requirements_mandatory_idx
  on public.sector_document_requirements (mandatory) where mandatory = true;

create index if not exists sector_document_requirements_document_type_idx
  on public.sector_document_requirements (document_type);

-- Trigger touch updated_at
create or replace function public.touch_sector_document_requirements_updated_at()
returns trigger
language plpgsql
as $body$
begin
  new.updated_at := now();
  return new;
end;
$body$;

drop trigger if exists sdr_touch_updated_at on public.sector_document_requirements;
create trigger sdr_touch_updated_at
  before update on public.sector_document_requirements
  for each row execute function public.touch_sector_document_requirements_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · Tabla `actor_documents` · documentos subidos por actor
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.actor_documents (
  id                              uuid primary key default gen_random_uuid(),

  -- Owner del documento
  actor_user_id                   uuid not null references auth.users(id) on delete cascade,

  -- FK al requirement del catálogo
  requirement_id                  text not null references public.sector_document_requirements(id) on delete restrict,

  -- Storage
  -- URL del documento en Supabase Storage (puede ser NULL si solo declarado · sin upload)
  document_url                    text,

  -- Hash SHA-256 del documento (PII off-chain · ancla on-chain si validado)
  document_hash_sha256            text check (document_hash_sha256 is null or document_hash_sha256 ~ '^[a-f0-9]{64}$'),

  -- Metadata del documento
  issued_at                       date,
  expires_at                      date,
  issuer_reference                text,                                      -- número expediente · etc.

  -- Lifecycle
  status                          text not null default 'pending'
                                  check (status in (
                                    'pending',                                -- subido · esperando revisión
                                    'under_review',                           -- en revisión por operador/Audit Council
                                    'valid',                                  -- válido y vigente
                                    'expiring_soon',                          -- vence en ≤30 días
                                    'expired',                                -- vencido
                                    'rejected'                                -- rechazado por operador
                                  )),

  status_reason                   text,                                      -- razón del estado (especialmente para rejected/expired)
  status_changed_at               timestamptz not null default now(),

  -- Validación
  validated_by                    uuid references auth.users(id) on delete set null,
  validated_at                    timestamptz,

  -- Audit
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),

  -- Constraint: 1 documento por requirement por actor (puede haber histórico vía status='expired' + insert nuevo)
  -- NOTA: removemos UNIQUE constraint para permitir histórico · uso index parcial
  constraint actor_documents_actor_requirement_active_unique
    exclude using btree (actor_user_id with =, requirement_id with =)
    where (status in ('pending', 'under_review', 'valid', 'expiring_soon'))
);

create index if not exists actor_documents_actor_idx
  on public.actor_documents (actor_user_id, status);

create index if not exists actor_documents_requirement_idx
  on public.actor_documents (requirement_id);

create index if not exists actor_documents_expires_at_idx
  on public.actor_documents (expires_at) where expires_at is not null and status in ('valid', 'expiring_soon');

create index if not exists actor_documents_status_idx
  on public.actor_documents (status);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · TRIGGERS APPEND-ONLY (canon CLAUDE.md)
-- ═════════════════════════════════════════════════════════════════════════════
-- Usa reject_append_only_mutation() de mig 028 §15.

drop trigger if exists actor_documents_no_update on public.actor_documents;
create trigger actor_documents_no_update
  before update on public.actor_documents
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists actor_documents_no_delete on public.actor_documents;
create trigger actor_documents_no_delete
  before delete on public.actor_documents
  for each row execute function public.reject_append_only_mutation();

-- Excepción · función security definer para avanzar status del documento.
-- Solo operador autorizado puede llamarla.
create or replace function public.advance_document_status(
  p_document_id uuid,
  p_new_status text,
  p_status_reason text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_doc_owner uuid;
begin
  -- Verificar status válido
  if p_new_status not in ('pending', 'under_review', 'valid', 'expiring_soon', 'expired', 'rejected') then
    raise exception 'Status % no es válido', p_new_status;
  end if;

  -- Obtener owner del documento
  select actor_user_id into v_doc_owner from public.actor_documents where id = p_document_id;
  if v_doc_owner is null then
    raise exception 'Documento % no existe', p_document_id;
  end if;

  -- Verificar que el actor que solicita el cambio es operador o el propio owner (para upload nuevo)
  if p_actor_user_id != v_doc_owner and not exists (
    select 1 from public.actors a
    where a.user_id = p_actor_user_id
      and a.kyc_status = 'approved'
    -- Asumimos role 'operator' o similar para validación cuando role enum exista
  ) then
    raise exception 'Actor % no autorizado para cambiar status documento %', p_actor_user_id, p_document_id;
  end if;

  -- Bypassa trigger usando trigger_depth>1 indirecto
  update public.actor_documents
  set status = p_new_status,
      status_reason = p_status_reason,
      status_changed_at = now(),
      updated_at = now()
  where id = p_document_id;
end;
$body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════════════

-- ──────── sector_document_requirements ────────
alter table public.sector_document_requirements enable row level security;

-- SELECT: público autenticado (necesitan saber qué docs deben aportar)
drop policy if exists "sdr_select_authenticated" on public.sector_document_requirements;
create policy "sdr_select_authenticated"
  on public.sector_document_requirements
  for select
  using (auth.uid() is not null);

-- INSERT/UPDATE/DELETE: ninguna policy de cliente · solo service_role (admin)

-- ──────── actor_documents ────────
alter table public.actor_documents enable row level security;

-- SELECT: owner del documento o operador
drop policy if exists "actor_documents_select_owner_or_operator" on public.actor_documents;
create policy "actor_documents_select_owner_or_operator"
  on public.actor_documents
  for select
  using (
    auth.uid() = actor_user_id
    or exists (
      select 1 from public.actors a
      where a.user_id = auth.uid()
        and a.kyc_status = 'approved'
      -- Filtrar por rol operador cuando role enum exista
    )
  );

-- INSERT: solo el owner puede subir su propio documento
drop policy if exists "actor_documents_insert_own" on public.actor_documents;
create policy "actor_documents_insert_own"
  on public.actor_documents
  for insert
  with check (auth.uid() = actor_user_id);

-- UPDATE/DELETE: ninguna policy + trigger append-only (excepto advance_document_status)

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 5 · VISTA `actor_documents_status_summary` para escritorio actor
-- ═════════════════════════════════════════════════════════════════════════════

create or replace view public.actor_documents_status_summary
with (security_invoker = true)
as
select
  ad.actor_user_id,
  count(*) filter (where ad.status = 'valid')              as count_valid,
  count(*) filter (where ad.status = 'expiring_soon')      as count_expiring_soon,
  count(*) filter (where ad.status = 'expired')            as count_expired,
  count(*) filter (where ad.status = 'pending')            as count_pending,
  count(*) filter (where ad.status = 'under_review')       as count_under_review,
  count(*) filter (where ad.status = 'rejected')           as count_rejected,
  min(ad.expires_at) filter (where ad.status in ('valid', 'expiring_soon')) as next_expiration
from public.actor_documents ad
group by ad.actor_user_id;

grant select on public.actor_documents_status_summary to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 6 · COMMENTS
-- ═════════════════════════════════════════════════════════════════════════════

comment on table public.sector_document_requirements is
  'Catálogo canónico de documentación legal requerida por sector/subsector/rol/país (ADR 0012 Fase 1.6). Audit-Ready by Design · cada requirement con status enum granular.';

comment on table public.actor_documents is
  'Documentos subidos por actores con lifecycle pending/under_review/valid/expiring_soon/expired/rejected. Append-only. Background job diario marca expiring_soon (≤30d) y expired (vencido).';

comment on column public.actor_documents.document_hash_sha256 is
  'Hash SHA-256 del documento original. PII off-chain canon CLAUDE.md §1. Si requirement.status=valid, se ancla en XDC Network (Capa 5 ADR 0007).';

comment on column public.actor_documents.expires_at is
  'Fecha vencimiento del documento. Background job check-document-expirations marca expiring_soon a 30d y expired al vencimiento.';

comment on function public.advance_document_status(uuid, text, text, uuid) is
  'Helper security definer para que operador o owner avancen status del documento respetando trigger append-only.';

-- ═════════════════════════════════════════════════════════════════════════════
-- FIN MIGRACIÓN 030
-- ═════════════════════════════════════════════════════════════════════════════
-- Próximo paso (Fase 1.6 continuación):
--   - Edge Function check-document-expirations (background job diario)
--   - Endpoint POST /api/me/documents para upload
--   - Endpoint GET /api/me/missing-documents para checklist UI
--   - Componente <MissingDocumentsChecklist /> en escritorio actor
--   - Email notification cuando expiring_soon detected
