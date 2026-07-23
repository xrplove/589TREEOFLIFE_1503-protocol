-- Migration: 031_multifirma_3de3_carga_contenedor
-- Created: 2026-05-29
-- Purpose: Fase 1.7 · Multi-firma 3-de-3 carga contenedor (comprador + vendedor + transitario)
--
-- BASE LEGAL REAL
-- ---------------
-- - MLETR UNCITRAL 2017 · 4 requisitos para documento transferible electrónico
--   (singularidad · identificabilidad · integridad · control exclusivo)
--   · este sistema MATERIALIZA control exclusivo trino
-- - CISG Convención Viena 1980 · acuerdo expreso entre comprador + vendedor
-- - Convenios marítimos (Hague-Visby + Hamburgo) · transitario/oráculo como
--   3a parte que confirma carga física
-- - ESPR Reg. UE 2024/1781 · DPP refleja estado real del producto en transit
-- - ADR 0007 §2.2 (G10 cadena custodia) · expresión expresa José 28-may
-- - ADR 0007 §2.4 (grupaje LCL cross-tenant) · firma transitario consolida
--
-- ARQUITECTURA · AMPLIACIÓN dpp_signatures + función SQL helper
-- ------------------------------------------------------------
-- 1. CHECK constraint dpp_signatures.signature_purpose ampliado con 3 valores:
--    · 'container_load_confirmation_buyer'
--    · 'container_load_confirmation_seller'
--    · 'container_load_confirmation_oracle' (transitario/operador logístico)
--
-- 2. Función SQL `verify_container_load_signatures(dpp_id)` que devuelve:
--    {
--      buyer_signed: bool,
--      seller_signed: bool,
--      oracle_signed: bool,
--      all_three_signed: bool,
--      buyer_signed_at: timestamp,
--      seller_signed_at: timestamp,
--      oracle_signed_at: timestamp
--    }
--
-- 3. Función SQL `trigger_container_load_complete()` que se invoca tras INSERT
--    en dpp_signatures con signature_purpose container_load_confirmation_*:
--    Si las 3 firmas están presentes para un dpp_id · auto-avanza
--    dpp_registry.lifecycle_state a 'loaded' (state machine canónica).
--
-- FILOSOFÍA · 3-de-3 multi-firma vs 2-de-3
-- ----------------------------------------
-- ADR 0007 menciona 2-de-3 multi-firma para envíos de alto valor (G4). Pero
-- para CARGA DE CONTENEDOR específicamente, hay 3 partes inevitables:
--   - Comprador: confirma que la carga corresponde a su pedido
--   - Vendedor: confirma que la carga es lo que vendió
--   - Transitario/Oráculo: confirma que la carga es lo que se carga físicamente
--
-- Si falta una, hay riesgo de:
--   - Carga incorrecta (no coincide con pedido)
--   - Vendedor disputa entregas erróneas
--   - Transitario carga algo distinto al BL/DPP
--
-- Por eso aquí 3-de-3 (más estricto · canónico para "container load
-- confirmation" event).
--
-- COMO APLICAR
-- ------------
--   1. Asegurar mig 028 aplicada (dpp_signatures · dpp_registry existen)
--   2. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   3. Pegar contenido entero · Run

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · Ampliar CHECK constraint signature_purpose
-- ═════════════════════════════════════════════════════════════════════════════
-- mig 028 §10 creó dpp_signatures con signature_purpose limitado a 5 valores:
--   'creation' · 'transfer' · 'event' · 'custody_handover' · 'multi_sig_quorum'
--
-- Ampliamos a 8 valores añadiendo 3 nuevos para carga contenedor.

do $body$
begin
  -- Drop check constraint anterior si existe (con cualquier nombre auto)
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.dpp_signatures'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%signature_purpose%'
  ) then
    -- Encontrar el nombre exacto del constraint y eliminarlo
    declare
      v_constraint_name text;
    begin
      select conname into v_constraint_name
      from pg_constraint
      where conrelid = 'public.dpp_signatures'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) like '%signature_purpose%'
      limit 1;

      if v_constraint_name is not null then
        execute format('alter table public.dpp_signatures drop constraint %I', v_constraint_name);
      end if;
    end;
  end if;

  -- Crear nuevo constraint con 8 valores (5 + 3 nuevos)
  alter table public.dpp_signatures
    add constraint dpp_signatures_signature_purpose_v031_check
    check (signature_purpose in (
      'creation',                                                            -- fabricante al crear DPP
      'transfer',                                                            -- transferencia de propiedad
      'event',                                                               -- evento logístico individual
      'custody_handover',                                                    -- entrega custodia entre actores
      'multi_sig_quorum',                                                    -- multi-sig 2-de-3 envíos altos
      -- v031 · multi-firma 3-de-3 carga contenedor (Fase 1.7)
      'container_load_confirmation_buyer',                                   -- comprador confirma carga corresponde a pedido
      'container_load_confirmation_seller',                                  -- vendedor confirma carga es lo vendido
      'container_load_confirmation_oracle'                                   -- transitario/oráculo confirma carga física
    ));
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · Función `verify_container_load_signatures`
-- ═════════════════════════════════════════════════════════════════════════════
-- Devuelve estado de las 3 firmas requeridas para confirmar carga contenedor.
-- Útil para:
--   - Edge Function sign-container-load (decide si auto-avanzar lifecycle)
--   - Endpoint API que muestra al actor qué firmas faltan
--   - Smart contract XDC oráculo que verifica antes de liberar escrow

create or replace function public.verify_container_load_signatures(p_dpp_id uuid)
returns table (
  dpp_id                  uuid,
  buyer_signed            boolean,
  seller_signed           boolean,
  oracle_signed           boolean,
  all_three_signed        boolean,
  buyer_signed_at         timestamptz,
  seller_signed_at        timestamptz,
  oracle_signed_at        timestamptz,
  buyer_signer_user_id    uuid,
  seller_signer_user_id   uuid,
  oracle_signer_user_id   uuid
)
language sql
stable
security invoker
as $body$
  with sig_data as (
    select
      s.signature_purpose,
      max(s.signed_at) as latest_signed_at,
      (array_agg(s.signer_user_id order by s.signed_at desc))[1] as latest_signer
    from public.dpp_signatures s
    where s.dpp_id = p_dpp_id
      and s.signature_purpose in (
        'container_load_confirmation_buyer',
        'container_load_confirmation_seller',
        'container_load_confirmation_oracle'
      )
    group by s.signature_purpose
  )
  select
    p_dpp_id                                                                 as dpp_id,
    bool_or(signature_purpose = 'container_load_confirmation_buyer')         as buyer_signed,
    bool_or(signature_purpose = 'container_load_confirmation_seller')        as seller_signed,
    bool_or(signature_purpose = 'container_load_confirmation_oracle')        as oracle_signed,
    (
      bool_or(signature_purpose = 'container_load_confirmation_buyer')
      and bool_or(signature_purpose = 'container_load_confirmation_seller')
      and bool_or(signature_purpose = 'container_load_confirmation_oracle')
    )                                                                        as all_three_signed,
    max(latest_signed_at) filter (where signature_purpose = 'container_load_confirmation_buyer')  as buyer_signed_at,
    max(latest_signed_at) filter (where signature_purpose = 'container_load_confirmation_seller') as seller_signed_at,
    max(latest_signed_at) filter (where signature_purpose = 'container_load_confirmation_oracle') as oracle_signed_at,
    -- FIX (4-jun): max(uuid) no existe en Postgres → cast a text y de vuelta a uuid.
    -- Cada grupo signature_purpose tiene un único valor, así que max sobre uno = ese valor.
    (max(latest_signer::text) filter (where signature_purpose = 'container_load_confirmation_buyer'))::uuid  as buyer_signer_user_id,
    (max(latest_signer::text) filter (where signature_purpose = 'container_load_confirmation_seller'))::uuid as seller_signer_user_id,
    (max(latest_signer::text) filter (where signature_purpose = 'container_load_confirmation_oracle'))::uuid as oracle_signer_user_id
  from sig_data;
$body$;

grant execute on function public.verify_container_load_signatures(uuid) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · Trigger auto-avance lifecycle a 'loaded' cuando 3-de-3 firmas
-- ═════════════════════════════════════════════════════════════════════════════
-- Cuando se inserta una firma container_load_confirmation_*, verifica si las
-- 3 están presentes. Si sí: avanza dpp_registry.lifecycle_state a 'loaded'.
--
-- Lifecycle state machine canónica (mig 028 §7):
--   created_pending_completion → created → loaded → in_transit → arrived →
--   delivered → in_use → decommissioned/recycled/repaired/resold
--
-- Solo avanza si estado actual es 'created' (transición válida).

create or replace function public.trigger_container_load_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_verification record;
  v_current_lifecycle public.dpp_lifecycle_state;
begin
  -- Solo procesar firmas de carga contenedor
  if new.signature_purpose not in (
    'container_load_confirmation_buyer',
    'container_load_confirmation_seller',
    'container_load_confirmation_oracle'
  ) then
    return new;
  end if;

  -- Verificar las 3 firmas
  select * into v_verification
  from public.verify_container_load_signatures(new.dpp_id);

  if not v_verification.all_three_signed then
    return new;  -- Aún faltan firmas · no avanzar lifecycle
  end if;

  -- Obtener lifecycle actual
  select lifecycle_state into v_current_lifecycle
  from public.dpp_registry where id = new.dpp_id;

  -- Solo avanzar si está en 'created' (transición canónica)
  if v_current_lifecycle = 'created' then
    update public.dpp_registry
    set lifecycle_state = 'loaded',
        state_changed_at = now(),
        state_changed_by = new.signer_user_id,
        updated_at = now()
    where id = new.dpp_id;

    -- Insertar transición en dpp_state_transitions (audit append-only)
    insert into public.dpp_state_transitions (
      dpp_id,
      from_state,
      to_state,
      transitioned_at,
      transitioned_by,
      evidence,
      reason
    ) values (
      new.dpp_id,
      'created',
      'loaded',
      now(),
      new.signer_user_id,
      jsonb_build_object(
        'trigger', 'container_load_3_of_3_signed',
        'buyer_signed_at', v_verification.buyer_signed_at,
        'seller_signed_at', v_verification.seller_signed_at,
        'oracle_signed_at', v_verification.oracle_signed_at
      ),
      'Auto-avance lifecycle por completarse 3-de-3 firmas carga contenedor (multifirma multi-parte ADR 0007 §2.2 G10)'
    );
  end if;

  return new;
end;
$body$;

-- Crear trigger en dpp_signatures
drop trigger if exists dpp_signatures_trigger_container_load on public.dpp_signatures;
create trigger dpp_signatures_trigger_container_load
  after insert on public.dpp_signatures
  for each row execute function public.trigger_container_load_complete();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · COMMENTS
-- ═════════════════════════════════════════════════════════════════════════════

comment on function public.verify_container_load_signatures(uuid) is
  'Devuelve estado 3-de-3 multifirma carga contenedor (Fase 1.7 ADR 0007 §2.2). Usado por Edge Function sign-container-load · API endpoint missing-signatures · smart contract XDC oráculo.';

comment on function public.trigger_container_load_complete() is
  'Auto-avanza dpp_registry.lifecycle_state de "created" a "loaded" cuando las 3 firmas (buyer + seller + oracle) están presentes. Mantiene audit append-only via dpp_state_transitions.';

-- ═════════════════════════════════════════════════════════════════════════════
-- FIN MIGRACIÓN 031
-- ═════════════════════════════════════════════════════════════════════════════
-- Próximo paso · Edge Function sign-container-load
--   POST /functions/v1/sign-container-load
--   Body: { dpp_id, signature_purpose (buyer|seller|oracle), signature, signer_public_key }
--   Flujo:
--     1. Verificar firma Ed25519 contra payload canónico (RFC 8785 JCS)
--     2. Insertar en dpp_signatures (RLS valida que actor puede firmar)
--     3. Trigger auto-avanza lifecycle si 3-de-3 presente
--     4. Devolver verify_container_load_signatures(dpp_id) actualizado
--
-- Smart contract XDC oráculo (Capa 5 ADR 0007 · futuro):
--   - Suscribe a evento "lifecycle_state changed to loaded"
--   - Libera fondos según Incoterm:
--     · EXW/FCA/FAS → trigger at recogida origen (puede ser ahora)
--     · FOB/CFR/CIF → trigger at embarque (in_transit)
--     · DAP/DPU/DDP → trigger at entrega destino (delivered)
