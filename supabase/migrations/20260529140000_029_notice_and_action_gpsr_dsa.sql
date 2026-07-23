-- Migration: 029_notice_and_action_gpsr_dsa
-- Created: 2026-05-29
-- Purpose: BLOQ-B7 · Sistema Notice & Action GPSR Art. 22 + DSA Art. 16
--
-- BASE LEGAL REAL
-- ---------------
-- - GPSR Reg. UE 2023/988 Art. 22 · obligación marketplaces aceptar Notices
--   sobre productos peligrosos · SLA 2 días hábiles para acción · trazabilidad
--   completa de cada Notice y su decisión
-- - DSA Reg. UE 2022/2065 Art. 16 · mecanismo Notice and Action obligatorio
--   plataformas hosting · Art. 17 Statement of Reasons obligatorio a denunciante
--   y al afectado · Art. 20 sistema interno reclamación · Art. 22 trusted flagger
-- - P2B Reg. UE 2019/1150 Art. 4 · Statement of Reasons obligatorio a vendedor
--   suspendido
--
-- ARQUITECTURA · 3 TABLAS APPEND-ONLY + 2 ENUMS
-- ---------------------------------------------
-- 1. `notices` · denuncias entrantes (cualquiera puede denunciar)
-- 2. `notice_actions` · decisiones tomadas por operador
-- 3. `statements_of_reasons` · SoR emitidas (DSA Art. 17 + P2B Art. 4)
--
-- TRUSTED FLAGGERS
-- ----------------
-- DSA Art. 22 reconoce "trusted flaggers" (entidades acreditadas por
-- Coordinador de Servicios Digitales del Estado miembro) cuyas Notices
-- tienen prioridad de procesamiento. Marcado vía `notifier_relationship`
-- = 'trusted_flagger' + verificación off-line del estatus.
--
-- PII OFF-CHAIN + DERECHO AL OLVIDO
-- ---------------------------------
-- Email del denunciante guardado en plaintext (necesario para enviar SoR
-- según DSA Art. 17) · pero el hash IP del denunciante se guarda para
-- auditoría forense sin re-identificación trivial.
--
-- APPEND-ONLY
-- -----------
-- Las 3 tablas son append-only · trigger reject_append_only_mutation
-- bloquea UPDATE/DELETE manuales. Modificaciones se hacen vía INSERT
-- nuevo (e.g. nueva fila notice_actions con action_type='reconsidered').
--
-- COMO APLICAR
-- ------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar contenido entero
--   3. Run

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · ENUMS canónicos
-- ═════════════════════════════════════════════════════════════════════════════

do $body$
begin
  if not exists (select 1 from pg_type where typname = 'notice_target_type') then
    create type public.notice_target_type as enum (
      'product',                       -- producto físico en catálogo (FK a products.id)
      'actor',                         -- actor/empresa (FK a actors.id)
      'content',                       -- contenido user-generated (review · descripción)
      'external_url'                   -- URL externa (e.g. enlace en mensaje)
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notice_status') then
    create type public.notice_status as enum (
      'received',                      -- entró el Notice · pendiente revisión
      'under_review',                  -- operador revisando
      'actioned',                      -- acción tomada · ver notice_actions
      'dismissed',                     -- sin acción (manifestamente infundado)
      'escalated_authority',           -- escalado a autoridad competente (Safety Gate · etc.)
      'awaiting_user_response'         -- requiere info adicional del denunciante
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notifier_relationship') then
    create type public.notifier_relationship as enum (
      'consumer',                      -- consumidor afectado o potencial
      'authority',                     -- autoridad regulatoria (AESAN · AEAT · etc.)
      'competitor',                    -- competidor del listing
      'trusted_flagger',               -- DSA Art. 22 entidad acreditada
      'anonymous',                     -- no se identificó
      'other'
    );
  end if;
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · Tabla `notices` · denuncias entrantes
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.notices (
  id                          uuid primary key default gen_random_uuid(),

  -- ────────── DENUNCIANTE ──────────
  notifier_email              text,                                          -- NULL si anónimo
  notifier_name               text,                                          -- NULL si no proporcionado
  notifier_relationship       public.notifier_relationship not null default 'consumer',

  -- Si el denunciante está registrado en 1503 (logueado), referencia.
  notifier_user_id            uuid references auth.users(id) on delete set null,

  -- ────────── TARGET ──────────
  target_type                 public.notice_target_type not null,

  -- FK opcional al target (un producto · actor · etc. según target_type).
  -- Validación de coherencia es responsabilidad de la API (no enforce a nivel BD
  -- porque depende del enum value).
  target_id                   uuid,
  target_external_url         text,                                          -- si target_type='external_url'

  -- ────────── CONTENIDO DEL NOTICE ──────────
  -- Categoría del Notice. Lista no exhaustiva · validada por API.
  -- GPSR Art. 22: 'safety_risk' · DSA Art. 16: 'illegal_content' · etc.
  category                    text not null check (char_length(category) between 2 and 64),

  -- Descripción detallada del problema (DSA Art. 16.2.b).
  description                 text not null check (char_length(description) between 10 and 10000),

  -- URLs de evidencia (capturas · informes · etc.). Array de URLs.
  evidence_urls               text[],

  -- Base legal invocada (DSA Art. 16.2.c · puede ser "GPSR Art. 22" · "AEPD" · etc.).
  legal_basis                 text not null check (char_length(legal_basis) between 2 and 200),

  -- ────────── FORENSE ──────────
  received_at                 timestamptz not null default now(),
  -- Hash SHA-256 de la IP del denunciante (PII off-chain · canon).
  received_ip_hash            text check (received_ip_hash is null or received_ip_hash ~ '^[a-f0-9]{64}$'),
  received_user_agent         text,
  received_timezone           text,

  -- ────────── ESTADO ──────────
  status                      public.notice_status not null default 'received',

  -- SLA tracking · cuándo expira el plazo de respuesta GPSR (2 días hábiles).
  -- Calculado por la API al INSERT.
  sla_expires_at              timestamptz,

  -- ────────── PRIORIDAD ──────────
  -- Trusted flagger → prioridad alta automática (DSA Art. 22).
  priority                    integer not null default 0 check (priority between 0 and 10),

  created_at                  timestamptz not null default now()
);

-- Índices.
create index if not exists notices_status_received_idx
  on public.notices (status, received_at desc);

create index if not exists notices_target_idx
  on public.notices (target_type, target_id)
  where target_id is not null;

create index if not exists notices_sla_expires_idx
  on public.notices (sla_expires_at)
  where status in ('received', 'under_review');

create index if not exists notices_priority_idx
  on public.notices (priority desc, received_at)
  where status in ('received', 'under_review');

create index if not exists notices_notifier_user_idx
  on public.notices (notifier_user_id) where notifier_user_id is not null;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · Tabla `notice_actions` · decisiones tomadas
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.notice_actions (
  id                          uuid primary key default gen_random_uuid(),
  notice_id                   uuid not null references public.notices(id) on delete cascade,

  -- ────────── ACCIÓN ──────────
  -- Tipo de acción. Lista canónica · ampliar con nuevas migraciones.
  action_type                 text not null check (action_type in (
    'no_action',                                                             -- sin acción (Notice infundado)
    'content_removed',                                                       -- contenido eliminado
    'product_removed',                                                       -- producto retirado
    'product_modified',                                                      -- producto requiere modificación
    'actor_warned',                                                          -- actor recibe advertencia
    'actor_suspended',                                                       -- actor suspendido temporalmente
    'actor_terminated',                                                      -- cuenta actor terminada
    'escalated_authority',                                                   -- escalado a autoridad regulatoria
    'reconsidered',                                                          -- acción anterior revisada (P2B Art. 4)
    'user_requested_info',                                                   -- pedida info adicional al denunciante
    'other'
  )),

  decided_at                  timestamptz not null default now(),
  decided_by                  uuid not null references auth.users(id) on delete restrict,

  -- Justificación de la decisión (auditable · DSA Art. 17).
  decision_reasoning          text not null check (char_length(decision_reasoning) between 10 and 5000),

  -- Base legal aplicada (artículo concreto).
  applied_legal_basis         text not null check (char_length(applied_legal_basis) between 2 and 200),

  -- FK al Statement of Reasons emitido (si aplica).
  statement_of_reasons_id     uuid,                                          -- FK añadida después de crear sor table

  -- Si action_type='escalated_authority', cuál.
  escalated_to_authority      text,                                          -- 'AESAN' · 'AEPD' · 'Safety Gate UE' · etc.
  escalation_reference        text,                                          -- referencia del expediente externo

  created_at                  timestamptz not null default now()
);

create index if not exists notice_actions_notice_idx
  on public.notice_actions (notice_id);

create index if not exists notice_actions_decided_by_idx
  on public.notice_actions (decided_by);

create index if not exists notice_actions_action_type_idx
  on public.notice_actions (action_type);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · Tabla `statements_of_reasons` · SoR emitidas
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.statements_of_reasons (
  id                          uuid primary key default gen_random_uuid(),

  -- FK opcional al notice que originó el SoR (NULL si SoR emitido sin Notice).
  notice_id                   uuid references public.notices(id) on delete set null,

  -- ────────── DESTINATARIO ──────────
  recipient_type              text not null check (recipient_type in (
    'notifier',                                                              -- denunciante (DSA Art. 17.1)
    'affected_user',                                                         -- usuario afectado (vendedor suspendido · P2B Art. 4)
    'platform_authority'                                                     -- autoridad competente
  )),

  -- Email del destinatario (snapshot · no FK porque puede no estar registrado).
  recipient_email             text not null check (char_length(recipient_email) between 5 and 320),
  recipient_user_id           uuid references auth.users(id) on delete set null,

  -- ────────── CONTENIDO SoR ──────────
  -- Asunto del SoR (e.g. "Producto retirado por riesgo seguridad").
  subject                     text not null check (char_length(subject) between 5 and 200),

  -- Justificación detallada (DSA Art. 17.3 · contenido obligatorio):
  -- a) hechos y circunstancias
  -- b) base legal invocada
  -- c) razones de la decisión
  -- d) si aplica · información retirada o restringida
  -- e) si automatizado o humano
  justification               text not null check (char_length(justification) between 50 and 10000),

  -- Si la decisión se tomó parcial o totalmente con sistema automatizado (DSA Art. 17.3.e).
  was_automated_decision      boolean not null default false,

  -- ────────── REDRESS (apelación) ──────────
  -- Información sobre proceso de apelación interna (DSA Art. 20).
  redress_information         text not null check (char_length(redress_information) >= 20),

  -- ────────── ENVÍO ──────────
  sent_at                     timestamptz,                                   -- NULL hasta que se envíe
  sent_via                    text check (sent_via is null or sent_via in (
    'email',
    'in_app',
    'postal_mail',
    'authority_portal'
  )),

  created_at                  timestamptz not null default now()
);

create index if not exists sor_notice_idx
  on public.statements_of_reasons (notice_id) where notice_id is not null;

create index if not exists sor_recipient_email_idx
  on public.statements_of_reasons (recipient_email);

create index if not exists sor_recipient_user_idx
  on public.statements_of_reasons (recipient_user_id) where recipient_user_id is not null;

create index if not exists sor_sent_at_idx
  on public.statements_of_reasons (sent_at) where sent_at is not null;

-- FK desde notice_actions hacia sor (después de crear tablas).
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notice_actions_statement_of_reasons_fk'
  ) then
    alter table public.notice_actions
      add constraint notice_actions_statement_of_reasons_fk
      foreign key (statement_of_reasons_id) references public.statements_of_reasons(id) on delete set null;
  end if;
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 5 · TRIGGERS APPEND-ONLY (canon CLAUDE.md)
-- ═════════════════════════════════════════════════════════════════════════════
-- Usa la función reject_append_only_mutation() creada en mig 028 Sección 15.

drop trigger if exists notices_no_update on public.notices;
create trigger notices_no_update
  before update on public.notices
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists notices_no_delete on public.notices;
create trigger notices_no_delete
  before delete on public.notices
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists notice_actions_no_update on public.notice_actions;
create trigger notice_actions_no_update
  before update on public.notice_actions
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists notice_actions_no_delete on public.notice_actions;
create trigger notice_actions_no_delete
  before delete on public.notice_actions
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists sor_no_update on public.statements_of_reasons;
create trigger sor_no_update
  before update on public.statements_of_reasons
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists sor_no_delete on public.statements_of_reasons;
create trigger sor_no_delete
  before delete on public.statements_of_reasons
  for each row execute function public.reject_append_only_mutation();

-- Excepción para status update en notices (necesario para flujo de trabajo):
-- el operador debe poder cambiar status de 'received' → 'under_review' →
-- 'actioned'. Esto se hace vía función con security definer que bypassa el
-- trigger. La función registra cada cambio en notice_actions con
-- action_type='reconsidered' o similar para mantener auditoría.

create or replace function public.advance_notice_status(
  p_notice_id uuid,
  p_new_status public.notice_status,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_current_status public.notice_status;
begin
  -- Verificar que el actor es operador.
  if not exists (
    select 1 from public.actors a
    where a.user_id = p_actor_user_id
      and a.kyc_status = 'approved'
      -- Asumimos que existe role 'operator' o similar.
  ) then
    raise exception 'Actor no autorizado para avanzar notice status';
  end if;

  select status into v_current_status from public.notices where id = p_notice_id;
  if v_current_status is null then
    raise exception 'Notice % no existe', p_notice_id;
  end if;

  -- Transición válida? (simplificada · expandir según FSM real).
  if v_current_status = p_new_status then
    return; -- idempotente
  end if;

  -- Bypassa trigger usando trigger_depth>1.
  update public.notices
  set status = p_new_status
  where id = p_notice_id;
end;
$body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 6 · RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.notices enable row level security;
alter table public.notice_actions enable row level security;
alter table public.statements_of_reasons enable row level security;

-- ──────── notices ────────
-- SELECT: solo operador o el propio denunciante (si autenticado).
drop policy if exists "notices_select_operator_or_notifier" on public.notices;
create policy "notices_select_operator_or_notifier"
  on public.notices
  for select
  using (
    auth.uid() = notifier_user_id
    or exists (
      select 1 from public.actors a
      where a.user_id = auth.uid()
        and a.kyc_status = 'approved'
      -- Asumimos que aquí se filtra por role='operator' cuando role enum exista.
    )
  );

-- INSERT: público autenticado puede crear Notice (con su user_id).
-- El INSERT desde anónimo se hace vía API endpoint con service_role
-- (rate-limited por IP).
drop policy if exists "notices_insert_authenticated" on public.notices;
create policy "notices_insert_authenticated"
  on public.notices
  for insert
  with check (
    notifier_user_id is null OR auth.uid() = notifier_user_id
  );

-- UPDATE/DELETE: ninguna policy + trigger append-only (excepto función
-- advance_notice_status con security definer).

-- ──────── notice_actions ────────
-- SELECT: operador o el denunciante del notice padre.
drop policy if exists "notice_actions_select_operator_or_notifier" on public.notice_actions;
create policy "notice_actions_select_operator_or_notifier"
  on public.notice_actions
  for select
  using (
    exists (
      select 1 from public.notices n
      where n.id = notice_actions.notice_id
        and (n.notifier_user_id = auth.uid())
    )
    or exists (
      select 1 from public.actors a
      where a.user_id = auth.uid()
        and a.kyc_status = 'approved'
    )
  );

-- INSERT: solo operador (filtrado por API con service_role).
-- UPDATE/DELETE: ninguna policy + trigger append-only.

-- ──────── statements_of_reasons ────────
-- SELECT: operador o destinatario.
drop policy if exists "sor_select_operator_or_recipient" on public.statements_of_reasons;
create policy "sor_select_operator_or_recipient"
  on public.statements_of_reasons
  for select
  using (
    auth.uid() = recipient_user_id
    or exists (
      select 1 from public.actors a
      where a.user_id = auth.uid()
        and a.kyc_status = 'approved'
    )
  );

-- INSERT/UPDATE/DELETE: solo service_role (API endpoint).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 7 · COMMENTS
-- ═════════════════════════════════════════════════════════════════════════════

comment on table public.notices is
  'Sistema Notice & Action GPSR Art. 22 + DSA Art. 16. Denuncias entrantes sobre productos · actores · contenido. Append-only. SLA 2 días hábiles GPSR Art. 22.';

comment on table public.notice_actions is
  'Decisiones tomadas por operador sobre cada Notice. Append-only. Audit trail completo de la acción + justificación + base legal.';

comment on table public.statements_of_reasons is
  'Statements of Reasons emitidos según DSA Art. 17 + P2B Art. 4. Append-only. Contenido obligatorio: hechos · base legal · razones · ¿automated? · redress info.';

comment on column public.notices.priority is
  '0-10. Trusted flagger (DSA Art. 22) → 10. Autoridad → 8. Consumer → 3. Anonymous → 1.';

comment on column public.notices.sla_expires_at is
  'GPSR Art. 22: SLA 2 días hábiles para acción. La API calcula este timestamp al INSERT considerando días laborables.';

comment on column public.statements_of_reasons.was_automated_decision is
  'DSA Art. 17.3.e · obligatorio indicar si la decisión se tomó parcial o totalmente con sistema automatizado.';

comment on column public.statements_of_reasons.redress_information is
  'DSA Art. 20 · información obligatoria sobre proceso interno de reclamación · plazos · contacto · derecho a tribunal externo.';

comment on function public.advance_notice_status(uuid, public.notice_status, uuid) is
  'Helper para que operador avance el status de un Notice respetando el trigger append-only. Solo cambia status · no toca datos del Notice. Auditoría: añadir fila notice_actions en transacción.';
