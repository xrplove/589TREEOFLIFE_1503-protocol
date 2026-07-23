-- Migration: 028_dpp_v1_1_full_refactor
-- Created: 2026-05-29
-- Purpose: DPP v1.1 full materialization · Bloque B commit 3/7 ADR 0007
--
-- CONTEXTO Y SCOPE
-- ----------------
-- Esta es la migración MÁS GRANDE del Bloque B (1.1/7-7/7). Materializa
-- simultáneamente:
--
--   1. **Refactor Opción B** (decisión José a1.1.3-B del 2026-05-28)
--      - Crea tabla `products` separada con datos comerciales
--      - Mueve columnas comerciales duplicadas de `dpp_registry` → `products`
--      - Añade FK `dpp_registry.product_id` → `products.id`
--      - Resultado: separación limpia DPP ↔ Producto comercial
--
--   2. **DPP v1.1 schema completo** (decisión José a1.1.1=SÍ + a1.1.2=SÍ)
--      - Materializa Capa A · sustainability (CBAM + EU Taxonomy + IMDG granular)
--      - Materializa Capa B · packaging completa (cubicaje 3D + PPWR)
--      - Materializa Capa C · erp_link completa (UCC + CRA + ViDA)
--      - Materializa Capa D · lifecycle state machine
--      - Materializa Capa E · custody chain + signatures + Incoterms + marítimos
--      - Materializa Capa F · origin + EUDR
--      - Bump DPP_SCHEMA_VERSION → 'dpp@1.1'
--
--   3. **KYB hash en actors** (cotejo Gemini 28-may · 3 piezas a incorporar)
--      - id_registro_mercantil_hash + autoridad + verificación timestamp
--      - eidas_signature_hash + verificación timestamp
--      - SHA-256 off-chain · solo el hash · PII original NUNCA en blockchain
--
--   4. **MLETR canonization** (ley UNCITRAL 2017 · gap matriz normativa)
--      - Comments documentando cumplimiento técnico en custody chain
--      - Pendiente añadir como ley #45 matriz normativa v1.1 (Fase 4.bis)
--
--   5. **Completeness CHECK constraints**
--      - EUDR · si in_eudr_scope=true → dds_reference + origin_geolocation obligatorios
--      - CRA · si has_digital_elements=true → 4 campos CRA obligatorios
--      - IMDG · si imdg_class set → un_number + pg_packing_group obligatorios
--
-- BASE LEGAL REAL
-- ---------------
-- 10 normas materializadas simultáneamente (v1.1):
--   - Reg. UE 2024/1781 ESPR (Capa A + B + F sustainability/packaging/origin)
--   - Reg. UE 2025/40 PPWR (Capa B packaging · 12-ago-2026)
--   - Reg. UE 2024/2847 CRA (Capa C cybersecurity · 11-dic-2027)
--   - Reg. UE 952/2013 UCC (Capa C aduanas)
--   - Dir. UE 2025/516 + Reg. 517/518 ViDA (Capa C IVA digital)
--   - Reg. UE 2023/956 CBAM (Capa A carbono frontera · 1-ene-2026 fase definitiva)
--   - Reg. UE 2020/852 EU Taxonomy (Capa A taxonomy_alignment)
--   - IMDG Code SOLAS (Capa A mercancías peligrosas marítimas)
--   - Incoterms 2020 ICC (Capa E logística internacional)
--   - Convenios marítimos Hague-Visby/Hamburgo (Capa E · España Ley 14/2014)
--   - Reg. UE 2023/1115 EUDR (Capa F anti-deforestación · 30-dic-2026 grandes)
--   - MLETR UNCITRAL 2017 (Capa E e-BoL · pendiente matriz normativa v1.1)
--
-- + Decisiones José canónicas integradas:
--   - a1.1.3-B refactor tabla products separada (28-may)
--   - Matiz aviación: AWB documental OK · cubicaje aéreo + W&B NO (29-may)
--   - Audit Council Opción C híbrido para certificaciones (29-may · futura ADR 0009)
--
-- PII OFF-CHAIN + DERECHO AL OLVIDO
-- ---------------------------------
-- Todos los hashes SHA-256 son evidencia · NUNCA contienen PII. Si se ejerce
-- derecho al olvido (GDPR Art. 17), cascade FK desde auth.users borra fila →
-- hash on-chain queda huérfano sin posibilidad de re-identificación.
--
-- APPEND-ONLY
-- -----------
-- Nuevas tablas append-only con trigger `pg_trigger_depth() > 1` (mismo patrón
-- que mig 019 dpp_tracking_events):
--   - dpp_custody_chain
--   - dpp_state_transitions
--   - actor_keys (rotación · NO updates manuales)
--
-- IDEMPOTENCIA
-- ------------
-- Esta migración es 100% idempotente. Se puede aplicar múltiples veces sin
-- error. Usa: ADD COLUMN IF NOT EXISTS · CREATE TABLE IF NOT EXISTS ·
-- DROP POLICY IF EXISTS · DO blocks para constraints · INSERT ON CONFLICT.
--
-- ESTIMACIÓN APLICACIÓN
-- ---------------------
-- 15-30 segundos en BD vacía · puede subir a 1-2 min si hay datos en
-- dpp_registry (migración de datos a products).
--
-- COMO APLICAR (MANUAL DESDE DASHBOARD · feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (Ctrl + Enter)
--   4. Esperar "Success. No rows returned." (puede tardar 30s-2min)
--   5. Verificar en Table Editor:
--      - Existe tabla `products` con 25+ columnas
--      - `dpp_registry` tiene columna `product_id` con FK
--      - `dpp_registry` tiene 30+ columnas nuevas (capas B-F)
--      - Existen tablas: `dpp_custody_chain` · `dpp_state_transitions` ·
--        `actor_keys` · `dpp_signatures`
--      - `actors` tiene columnas: `id_registro_mercantil_hash` ·
--        `eidas_signature_hash`
--
-- PRECONDICIONES
-- --------------
-- - Migración 019 (dpp_registry + tracking events) aplicada · `public.dpp_registry`
--   existe con columnas comerciales (gtin · product_sku · product_name · hs_code)
-- - Migración 001 (actors) aplicada · `public.actors` existe
-- - `auth.users` existe (Supabase Auth default)
-- - `gen_random_uuid()` disponible (pgcrypto · default Supabase)

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · CREAR TABLA `products` (REFACTOR OPCIÓN B · decisión a1.1.3-B)
-- ═════════════════════════════════════════════════════════════════════════════
-- Tabla nueva separada con datos comerciales del producto. Vivirá como base
-- comercial · permite catálogo público + escritorio fabricante + pedidos.
-- El DPP (dpp_registry) se asocia vía FK product_id.

create table if not exists public.products (
  id                                uuid primary key default gen_random_uuid(),

  -- ──────────────── OWNERSHIP ────────────────
  owner_user_id                     uuid not null references auth.users(id) on delete cascade,

  -- ──────────────── CLASIFICACIÓN 1503 ────────────────
  -- Sector 1503 (canónico desde memoria taxonomia_cnae · 17 sectores).
  sector_id                         text not null check (char_length(sector_id) between 2 and 64),

  -- Subsector opcional (granularidad mayor · e.g. 'agroalimentario.oleo' bajo 'agroalimentario').
  subsector_id                      text check (subsector_id is null or char_length(subsector_id) between 2 and 64),

  -- Rol del actor publicador (opcional · contexto de publicación).
  role_id                           text,

  -- Códigos estadísticos internacionales (anclaje a CNAE/NACE/ISIC · canon 16-may).
  isic                              text,
  cnae                              text,

  -- ──────────────── IDENTIFICACIÓN COMERCIAL ────────────────
  -- SKU interno del owner (único por owner).
  sku                               text not null check (char_length(sku) between 1 and 64),

  -- EAN-13 (subset de GTIN-13 · 13 dígitos · validación con check digit GS1
  -- delegada a application layer · _validators.ts).
  ean13                             text check (ean13 is null or ean13 ~ '^[0-9]{13}$'),

  -- GTIN (Global Trade Item Number · GS1) · longitud 8/12/13/14.
  gtin                              text check (gtin is null or gtin ~ '^[0-9]{8}$|^[0-9]{12,14}$'),

  -- ──────────────── LOCALIZACIÓN ────────────────
  -- Título multilingüe (LocalizedLabel · es/en/fr/de/it/pt/zh/ja).
  title                             jsonb not null,

  -- Descripción multilingüe (opcional).
  description                       jsonb,

  -- ──────────────── CÓDIGOS ADUANEROS (UCC · base · espejados a Capa C DPP) ────────────────
  -- HS code (Sistema Armonizado · 6-10 dígitos · obligatorio aduanas cross-border).
  -- Canonización v1.1: vive en products · DPP toma snapshot al anclar.
  hs_code                           text check (hs_code is null or hs_code ~ '^[0-9]{6,10}$'),

  -- País de origen aduanero (UCC Art. 60 · distinto de manufacturing_country
  -- de la Capa F del DPP si hay transformación sustancial).
  country_of_origin                 text check (country_of_origin is null or country_of_origin ~ '^[A-Z]{2}$'),

  -- ──────────────── COMERCIAL BÁSICO ────────────────
  -- Precio unitario base (multi-currency vía currency · IVA aparte).
  price                             numeric(14,4) check (price is null or price >= 0),
  currency                          text default 'EUR' check (currency is null or currency ~ '^[A-Z]{3}$'),
  iva_rate                          numeric(5,2) check (iva_rate is null or (iva_rate >= 0 and iva_rate <= 100)),

  -- Stock disponible (NULL = sin control de stock).
  stock                             integer check (stock is null or stock >= 0),

  -- ──────────────── MODALIDAD PAGO ────────────────
  -- 4 modalidades canónicas (memoria modelos_pago · ratificadas 12-may):
  -- 'direct' (<500€) · 'escrow_b2b_full' (100% escrow nacional) ·
  -- 'split_50_50' (servicios) · 'split_30_70' (importación).
  payment_modality                  text check (payment_modality is null or payment_modality in (
    'direct',
    'escrow_b2b_full',
    'split_50_50',
    'split_30_70'
  )),

  -- ──────────────── VISUAL ────────────────
  -- Imágenes del producto (estructura: [{url, alt: {locale: text}, order, is_primary}]).
  images                            jsonb not null default '[]'::jsonb,

  -- ──────────────── CUMPLIMIENTO ────────────────
  -- Certificados subidos por el fabricante (estructura por sector · validación
  -- contra Audit Council · ver memoria modelo_c · futura ADR 0009).
  certificates                      jsonb not null default '[]'::jsonb,

  -- Certificados requeridos del comprador (filtro pre-checkout).
  required_certs_for_buyer          jsonb not null default '[]'::jsonb,

  -- ──────────────── RESTRICCIONES GEOGRÁFICAS ────────────────
  -- Lista de países donde el producto se puede vender (ISO 3166-1 alpha-2).
  available_countries               text[],
  -- Lista de países excluidos explícitamente.
  excluded_countries                text[],

  -- ──────────────── VERSIÓN SCHEMA ────────────────
  schema_version                    text not null default 'universal@1.0',
  schema_status                     text not null default 'validated' check (schema_status in ('draft', 'validated', 'deprecated')),

  -- ──────────────── ESTADO DEL PRODUCTO ────────────────
  status                            text not null default 'draft' check (status in (
    'draft',                                          -- en edición · no publicado
    'pending_audit',                                  -- esperando verificación certificaciones (Audit Council Opción C)
    'published',                                      -- publicado en catálogo
    'archived',                                       -- archivado por owner
    'suspended'                                       -- suspendido por operador (vulneración T&C)
  )),

  -- ──────────────── AUDIT ────────────────
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now(),
  created_by                        uuid references auth.users(id) on delete set null,
  updated_by                        uuid references auth.users(id) on delete set null,

  -- ──────────────── CONSTRAINTS ────────────────
  -- (owner_user_id, sku) único: cada owner no puede repetir SKU.
  constraint products_owner_sku_unique unique (owner_user_id, sku)
);

-- Índices para queries comunes.
create index if not exists products_owner_idx
  on public.products (owner_user_id);

create index if not exists products_sector_idx
  on public.products (sector_id);

create index if not exists products_status_idx
  on public.products (status) where status = 'published';

create index if not exists products_gtin_idx
  on public.products (gtin) where gtin is not null;

create index if not exists products_hs_code_idx
  on public.products (hs_code) where hs_code is not null;

create index if not exists products_country_of_origin_idx
  on public.products (country_of_origin) where country_of_origin is not null;

-- Trigger touch updated_at.
create or replace function public.touch_products_updated_at()
returns trigger
language plpgsql
as $body$
begin
  new.updated_at := now();
  return new;
end;
$body$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_products_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · MIGRAR DATOS COMERCIALES DPP_REGISTRY → PRODUCTS
-- ═════════════════════════════════════════════════════════════════════════════
-- Si hay filas en dpp_registry con datos comerciales (gtin/product_sku/
-- product_name/hs_code), las migramos a products. ON CONFLICT por idempotencia.

insert into public.products (
  owner_user_id,
  sector_id,
  sku,
  gtin,
  title,
  hs_code,
  created_at,
  updated_at,
  schema_version,
  status
)
select
  r.owner_user_id,
  r.sector_id,
  r.product_sku,
  r.gtin,
  r.product_name,
  r.hs_code,
  r.created_at,
  r.updated_at,
  'universal@1.0',
  'draft'
from public.dpp_registry r
where exists (
  -- Solo migrar si las columnas comerciales aún existen en dpp_registry
  -- (idempotencia: si ya se ejecutó esta migración, las columnas se habrán
  -- DROP en sección 3 · este SELECT fallará silenciosamente).
  select 1 from information_schema.columns
  where table_schema = 'public'
    and table_name = 'dpp_registry'
    and column_name = 'product_sku'
)
on conflict (owner_user_id, sku) do nothing;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · AÑADIR FK PRODUCT_ID + DROP COLUMNAS COMERCIALES DPP_REGISTRY
-- ═════════════════════════════════════════════════════════════════════════════

-- FIX (4-jun): dropear la vista dpp_public_view ANTES de quitar columnas de
-- dpp_registry. La vista de mig 019 depende de gtin/product_name; sin este drop
-- el `drop column gtin` (más abajo) falla con "view ... depends on column gtin".
-- La vista se recrea con su forma v1.1 en la SECCIÓN 17.
drop view if exists public.dpp_public_view;

-- Añadir columna product_id (FK a products).
alter table public.dpp_registry
  add column if not exists product_id uuid references public.products(id) on delete cascade;

-- Poblar product_id matching por (owner_user_id, product_sku) si las columnas
-- comerciales aún existen.
do $body$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dpp_registry'
      and column_name = 'product_sku'
  ) then
    update public.dpp_registry r
    set product_id = p.id
    from public.products p
    where r.owner_user_id = p.owner_user_id
      and r.product_sku = p.sku
      and r.product_id is null;
  end if;
end $body$;

-- DROP constraint UNIQUE (owner_user_id, product_sku) si existe (ya no aplica
-- · la unicidad ahora vive en products).
do $body$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'dpp_registry_owner_sku_unique'
  ) then
    alter table public.dpp_registry
      drop constraint dpp_registry_owner_sku_unique;
  end if;
end $body$;

-- DROP columnas duplicadas que ahora viven en products.
-- NOTA: hs_code se mantiene en dpp_registry como SNAPSHOT del momento del
-- anclaje on-chain (canónico spec v1.1 §0.1: "vive en products · DPP toma
-- snapshot al anclar para preservar hash canónico si products cambia").
alter table public.dpp_registry
  drop column if exists gtin,
  drop column if exists product_sku,
  drop column if exists product_name;

-- DROP index obsoleto (gtin ya no está en dpp_registry).
drop index if exists public.dpp_registry_gtin_idx;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · CAPA A · DPPSustainability v1.1 (EU Taxonomy + IMDG + CBAM)
-- ═════════════════════════════════════════════════════════════════════════════
-- Mig 019 ya tiene: materials · carbon_footprint_kg_co2eq · water_footprint_l ·
-- recycled_content_pct · recyclability_pct · sustainability_data · hs_code.
-- v1.1 añade: taxonomy_alignment · carbon_footprint_cbam · un_number ·
-- imdg_class · pg_packing_group.

alter table public.dpp_registry
  add column if not exists taxonomy_alignment              jsonb,  -- EU Taxonomy 6 objetivos × DNSH × MSS
  add column if not exists carbon_footprint_cbam           jsonb,  -- CBAM Anexo IV emisiones embebidas
  add column if not exists un_number                       text
    check (un_number is null or un_number ~ '^UN[0-9]{4}$'),
  add column if not exists imdg_class                      text
    check (imdg_class is null or imdg_class in (
      '1','2.1','2.2','2.3','3','4.1','4.2','4.3','5.1','5.2','6.1','6.2','7','8','9'
    )),
  add column if not exists pg_packing_group                text
    check (pg_packing_group is null or pg_packing_group in ('I','II','III'));

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 5 · CAPA B · DPPPackaging v1.1 (cubicaje 3D + PPWR)
-- ═════════════════════════════════════════════════════════════════════════════
-- Capa B NUEVA · NO existía en mig 019. Materializa cubicaje 3D + PPWR.
-- Nota canónica aviación: el algoritmo cubicaje 3D aplica SOLO a marítimo +
-- terrestre + ferroviario + fluvial. NO se aplica a aviación (cubicaje aéreo
-- + W&B excluidos · ADR 0007 §2.7).

alter table public.dpp_registry
  -- Dimensiones físicas del bulto (mm).
  add column if not exists package_length_mm               integer
    check (package_length_mm is null or package_length_mm > 0),
  add column if not exists package_width_mm                integer
    check (package_width_mm is null or package_width_mm > 0),
  add column if not exists package_height_mm               integer
    check (package_height_mm is null or package_height_mm > 0),
  add column if not exists package_weight_kg               numeric(10,3)
    check (package_weight_kg is null or package_weight_kg > 0),

  -- Tipo de embalaje (8 valores canónicos).
  add column if not exists package_type                    text
    check (package_type is null or package_type in (
      'box','pallet','ibc','sack','drum','crate','roll','other'
    )),

  -- v1.1 · capa PPWR Art. 3.
  add column if not exists packaging_layer                 text
    check (packaging_layer is null or packaging_layer in ('primary','secondary','tertiary')),

  -- Apilable + carga máxima soportada arriba.
  add column if not exists stackable                       boolean,
  add column if not exists max_stack_load_kg               numeric(10,2),

  -- Orientación obligatoria (this-way-up).
  add column if not exists required_orientation            text
    check (required_orientation is null or required_orientation in (
      'this_way_up','any','horizontal_only'
    )),

  -- Refrigerado · temperatura permitida.
  add column if not exists reefer_temp_min_c               numeric(5,2),
  add column if not exists reefer_temp_max_c               numeric(5,2),

  -- @deprecated v1.1 · clase peligrosa simplificada (canonizado IMDG granular Capa A).
  add column if not exists un_dangerous_class              text
    check (un_dangerous_class is null or un_dangerous_class in (
      '1','2','3','4','5','6','7','8','9'
    )),
  -- @deprecated v1.1 · detalle peligrosa (canonizado un_number Capa A).
  add column if not exists dangerous_goods_codes           jsonb,

  -- Foto del bulto para escritorio transitario.
  add column if not exists photo_url                       text,

  -- v1.1 · PPWR ampliaciones (Reg. UE 2025/40 · 12-ago-2026).
  add column if not exists package_recycled_content_pct    numeric(5,2)
    check (package_recycled_content_pct is null or (package_recycled_content_pct >= 0 and package_recycled_content_pct <= 100)),
  add column if not exists reusable                        boolean,
  add column if not exists reusability_cycles              integer
    check (reusability_cycles is null or reusability_cycles >= 1),
  add column if not exists epr_registration_by_country     jsonb,  -- {"ES":"ECOEMBES-123456","FR":"CITEO-789012"}
  add column if not exists packaging_materials             jsonb;  -- [{code,percentage,recyclable}]

-- Reefer temp coherence: si ambas definidas, min ≤ max.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_reefer_temp_coherence'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_reefer_temp_coherence check (
        reefer_temp_min_c is null
        or reefer_temp_max_c is null
        or reefer_temp_min_c <= reefer_temp_max_c
      );
  end if;
end $body$;

-- PPWR reusability coherence: si reusable=true, reusability_cycles ≥ 1.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_ppwr_reusability_coherence'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_ppwr_reusability_coherence check (
        reusable is not true
        or (reusability_cycles is not null and reusability_cycles >= 1)
      );
  end if;
end $body$;

-- Stack load coherence: si stackable=false, NO max_stack_load_kg.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_stack_load_coherence'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_stack_load_coherence check (
        stackable is not false
        or max_stack_load_kg is null
      );
  end if;
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 6 · CAPA C · DPPERPLink v1.1 (sync ERP + UCC + CRA + ViDA)
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.dpp_registry
  -- Sync ERP base.
  add column if not exists erp_provider                    text
    check (erp_provider is null or erp_provider in (
      'holded','odoo','sage_business_cloud','sage_50','sap_s4hana','custom'
    )),
  add column if not exists erp_external_id                 text,
  add column if not exists erp_last_synced_at              timestamptz,
  add column if not exists erp_last_sync_status            text
    check (erp_last_sync_status is null or erp_last_sync_status in (
      'success','partial','failed','pending'
    )),
  add column if not exists erp_sync_details                jsonb,

  -- v1.1 · UCC (aduanas · Reg. UE 952/2013).
  -- Nota: hs_code y country_of_origin viven en products · aquí solo eori.
  add column if not exists eori_seller                     text,
  add column if not exists eori_importer                   text,

  -- v1.1 · CRA (Reg. UE 2024/2847 · 11-dic-2027).
  add column if not exists has_digital_elements            boolean,
  add column if not exists ce_marking_cra                  boolean,
  add column if not exists sbom_url                        text,
  add column if not exists vulnerability_disclosure_url    text,
  add column if not exists security_support_until          date,
  add column if not exists cra_class                       text
    check (cra_class is null or cra_class in ('default','class_I','class_II')),

  -- v1.1 · ViDA (Dir. UE 2025/516 + Reg. 517/518 · E-invoicing UE B2B 1-jul-2030).
  add column if not exists vat_number_seller               text,
  add column if not exists vat_number_buyer                text,
  add column if not exists intracommunity_supply           boolean,
  add column if not exists reverse_charge_applies          boolean,
  add column if not exists einvoice_reference              text;

-- Index UNIQUE para upsert ERP por (owner_user_id, erp_provider, erp_external_id).
create unique index if not exists dpp_registry_erp_external_unique
  on public.dpp_registry (owner_user_id, erp_provider, erp_external_id)
  where erp_external_id is not null;

-- ERP sync coherence: si erp_provider, erp_external_id obligatorio.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_erp_sync_coherence'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_erp_sync_coherence check (
        erp_provider is null or erp_external_id is not null
      );
  end if;
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 7 · CAPA D · DPPLifecycle (state machine DPP-centric)
-- ═════════════════════════════════════════════════════════════════════════════

-- ENUM canónico dpp_lifecycle_state (11 estados).
do $body$
begin
  if not exists (select 1 from pg_type where typname = 'dpp_lifecycle_state') then
    create type public.dpp_lifecycle_state as enum (
      'created_pending_completion',
      'created',
      'loaded',
      'in_transit',                  -- Incluye modo aéreo registrado vía AWB · NO opera W&B
      'arrived',
      'delivered',                   -- TRIGGER smart contract escrow XDC libera fondos
      'in_use',
      'decommissioned',
      'recycled',
      'repaired',
      'resold'
    );
  end if;
end $body$;

alter table public.dpp_registry
  add column if not exists lifecycle_state public.dpp_lifecycle_state
    default 'created_pending_completion',
  add column if not exists state_changed_at timestamptz default now(),
  add column if not exists state_changed_by uuid references auth.users(id) on delete set null;

-- Index para queries por estado (e.g. "todos los DPPs in_transit").
create index if not exists dpp_registry_lifecycle_state_idx
  on public.dpp_registry (lifecycle_state);

-- Tabla append-only de transiciones de estado (auditoría).
create table if not exists public.dpp_state_transitions (
  id                  uuid primary key default gen_random_uuid(),
  dpp_id              uuid not null references public.dpp_registry(id) on delete cascade,
  from_state          public.dpp_lifecycle_state,
  to_state            public.dpp_lifecycle_state not null,
  transitioned_at     timestamptz not null default now(),
  transitioned_by     uuid references auth.users(id) on delete set null,
  evidence            jsonb,                                          -- documento + foto + GPS · firmado
  signature_id        uuid,                                           -- FK futura a dpp_signatures (Capa E)
  reason              text,                                           -- razón humana de la transición
  created_at          timestamptz not null default now()
);

create index if not exists dpp_state_transitions_dpp_idx
  on public.dpp_state_transitions (dpp_id, transitioned_at desc);

create index if not exists dpp_state_transitions_to_state_idx
  on public.dpp_state_transitions (to_state);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 8 · CAPA E · actor_keys (rotación claves Ed25519)
-- ═════════════════════════════════════════════════════════════════════════════
-- Cada Actor mantiene UN par de claves Ed25519 activo a la vez. La rotación
-- crea una fila nueva con is_active=true y marca la anterior como rotated.
-- Las claves anteriores se conservan para verificación de firmas históricas.

create table if not exists public.actor_keys (
  id                    uuid primary key default gen_random_uuid(),
  actor_user_id         uuid not null references auth.users(id) on delete cascade,

  -- Clave pública en hex (Ed25519 = 64 chars · secp256k1 = 66 chars compressed).
  public_key            text not null check (char_length(public_key) between 64 and 130),

  -- Algoritmo de la clave (Ed25519 por defecto · secp256k1 reservado).
  key_algorithm         text not null default 'ed25519'
    check (key_algorithm in ('ed25519','secp256k1')),

  -- ¿Es la clave activa actualmente? Solo UNA por actor a la vez (unique index).
  is_active             boolean not null default true,

  -- Razón de rotación (si la anterior fue rotada · NULL si es la primera).
  rotation_reason       text,

  created_at            timestamptz not null default now(),
  rotated_at            timestamptz
);

-- Solo UNA clave activa por actor a la vez (deferred constraint para permitir
-- transición atómica al rotar: deactivate vieja + insert nueva en una tx).
create unique index if not exists actor_keys_active_unique
  on public.actor_keys (actor_user_id)
  where is_active = true;

create index if not exists actor_keys_actor_idx
  on public.actor_keys (actor_user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 9 · CAPA E · dpp_custody_chain (cadena custodia criptográfica G10)
-- ═════════════════════════════════════════════════════════════════════════════
-- Decisión expresa José 2026-05-28 (G10 ADR 0007 §2.2): cada actor que toca
-- la mercancía deja huella firmada Ed25519 en el DPP. Cadena cronológica
-- inmutable encadenada por hash con eslabón anterior.
--
-- CUMPLIMIENTO MLETR (UNCITRAL 2017)
-- ---------------------------------
-- Esta tabla materializa los 4 requisitos MLETR para documentos transferibles
-- electrónicos:
--   1. SINGULARIDAD · 1 fila por eslabón · UNIQUE constraints
--   2. IDENTIFICABILIDAD · actor_user_id + signer_public_key identifican
--      unívocamente al holder en cada eslabón
--   3. INTEGRIDAD · firma Ed25519 + previous_link_hash encadenado SHA-256
--   4. CONTROL EXCLUSIVO · solo el holder activo (último eslabón con
--      custody_ended_at NULL) puede transferir · validado server-side
--
-- Pendiente añadir MLETR como ley #45 matriz normativa v1.1 (Fase 4.bis).

create table if not exists public.dpp_custody_chain (
  id                    uuid primary key default gen_random_uuid(),
  dpp_id                uuid not null references public.dpp_registry(id) on delete cascade,

  -- Actor que toma custodia.
  actor_user_id         uuid not null references auth.users(id) on delete cascade,

  -- Rol del actor cuando tiene custodia (G10 ADR 0007 §2.2).
  custody_role          text not null check (custody_role in (
    'manufacturer',                                    -- fabricante original (primer eslabón siempre)
    'owner',                                           -- propietario (puede vender/transferir)
    'freight_forwarder',                               -- transitario (gestiona logística)
    'carrier',                                         -- transportista (incluye aéreo · NO opera W&B nosotros)
    'customs',                                         -- aduana
    'consignee'                                        -- consignatario destino final
  )),

  -- Periodo de custodia (custody_ended_at NULL si vigente).
  custody_started_at    timestamptz not null,
  custody_ended_at      timestamptz check (
    custody_ended_at is null or custody_ended_at >= custody_started_at
  ),

  -- Clave pública Ed25519 del actor en el momento de la firma (snapshot · hex 64).
  signer_public_key     text not null check (signer_public_key ~ '^[a-f0-9]{64}$'),

  -- Firma Ed25519 sobre payload canónico del eslabón (hex 128 chars).
  signature             text not null check (signature ~ '^[a-f0-9]{128}$'),

  -- GPS del momento de transferencia (WGS84).
  gps_lat               numeric(9,6) check (gps_lat is null or (gps_lat >= -90 and gps_lat <= 90)),
  gps_lng               numeric(9,6) check (gps_lng is null or (gps_lng >= -180 and gps_lng <= 180)),

  -- Evidencia documental adicional (foto · BL · CMR · AWB · etc.).
  -- Estructura JSON: { photo_url, document_type, document_url, document_hash_sha256 }
  -- document_type incluye: 'BL' · 'CMR' · 'AWB' · 'rail_consignment' ·
  -- 'delivery_note' · 'inland_waterway_bl' (matiz aviación canonizado ADR 0007 §2.7).
  transfer_evidence     jsonb,

  -- Hash SHA-256 del eslabón anterior (encadenamiento integridad).
  -- NULL solo en el primer eslabón (manufacturer).
  previous_link_hash    text check (previous_link_hash is null or previous_link_hash ~ '^[a-f0-9]{64}$'),

  created_at            timestamptz not null default now()
);

-- Coherencia GPS pair: gps_lat y gps_lng se definen juntos o ninguno.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_custody_chain_gps_pair'
  ) then
    alter table public.dpp_custody_chain
      add constraint dpp_custody_chain_gps_pair check (
        (gps_lat is null and gps_lng is null)
        or (gps_lat is not null and gps_lng is not null)
      );
  end if;
end $body$;

create index if not exists dpp_custody_chain_dpp_started_idx
  on public.dpp_custody_chain (dpp_id, custody_started_at);

create index if not exists dpp_custody_chain_actor_idx
  on public.dpp_custody_chain (actor_user_id);

create index if not exists dpp_custody_chain_role_idx
  on public.dpp_custody_chain (custody_role);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 10 · CAPA E · dpp_signatures (firmas adicionales sobre DPP completo)
-- ═════════════════════════════════════════════════════════════════════════════
-- Firmas que NO son sobre un eslabón específico de custodia, sino sobre el
-- DPP completo. Usadas para multi-firma 2-de-3 en envíos de alto valor
-- (Capa 4 ADR 0007 G4).

create table if not exists public.dpp_signatures (
  id                    uuid primary key default gen_random_uuid(),
  dpp_id                uuid not null references public.dpp_registry(id) on delete cascade,

  signer_user_id        uuid not null references auth.users(id) on delete cascade,
  signer_public_key     text not null check (signer_public_key ~ '^[a-f0-9]{64}$'),

  -- Firma Ed25519 sobre payload canónico del DPP (hex 128 chars).
  signature             text not null check (signature ~ '^[a-f0-9]{128}$'),

  signed_at             timestamptz not null default now(),

  -- Propósito de la firma.
  signature_purpose     text not null check (signature_purpose in (
    'creation',                                        -- fabricante al crear DPP (completado ESPR)
    'transfer',                                        -- transferencia de propiedad
    'event',                                           -- evento logístico individual
    'custody_handover',                                -- entrega custodia entre actores
    'multi_sig_quorum'                                 -- parte de multi-sig 2-de-3
  )),

  created_at            timestamptz not null default now()
);

create index if not exists dpp_signatures_dpp_idx
  on public.dpp_signatures (dpp_id, signed_at desc);

create index if not exists dpp_signatures_signer_idx
  on public.dpp_signatures (signer_user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 11 · CAPA E · DPPCustody columnas básicas en dpp_registry
-- ═════════════════════════════════════════════════════════════════════════════
-- Columnas a nivel DPP (no relación · escalares). Las relaciones detalladas
-- viven en dpp_custody_chain (sección 9) y dpp_signatures (sección 10).

alter table public.dpp_registry
  -- Clave pública Ed25519 del propio DPP (entidad criptográfica soberana ·
  -- G6 ADR 0007 · permite transferencias verificables en venta del DPP).
  add column if not exists dpp_public_key                  text
    check (dpp_public_key is null or dpp_public_key ~ '^[a-f0-9]{64}$'),

  -- v1.1 · Incoterms 2020 ICC (scope transaccional · NULL en catálogo · se
  -- completa al firmar pedido).
  add column if not exists incoterm                        text
    check (incoterm is null or incoterm in (
      'EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'
    )),

  -- v1.1 · lugar entrega según Incoterm (UN/LOCODE alineado mig 019).
  add column if not exists delivery_location               text
    check (delivery_location is null or delivery_location ~ '^[A-Z]{2}[A-Z2-9]{3}$'),

  -- v1.1 · convenios marítimos.
  add column if not exists bl_reference                    text,
  add column if not exists carrier_id                      text,
  add column if not exists maritime_convention             text
    check (maritime_convention is null or maritime_convention in (
      'hague_visby',                                       -- España Ley 14/2014 · ~70 estados
      'hamburg',                                           -- ~35 estados
      'rotterdam',                                         -- no en vigor (5 ratificadores)
      'not_applicable'                                     -- terrestre/ferroviario/fluvial/aéreo
    ));

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 12 · CAPA F · DPPOrigin v1.1 (EUDR · anti-deforestación)
-- ═════════════════════════════════════════════════════════════════════════════
-- Mig 019 ya tiene: manufacturing_country · manufacturing_facility_id ·
-- production_date · manufacturer_batch_number · manufacturer_actor_user_id.
-- v1.1 añade: EUDR (in_eudr_scope + dds_reference + origin_geolocation +
-- eudr_compliance_attested).

alter table public.dpp_registry
  add column if not exists in_eudr_scope                   boolean,
  add column if not exists dds_reference                   text,
  add column if not exists origin_geolocation              jsonb,  -- GeoJSON Point/Polygon + producción
  add column if not exists eudr_compliance_attested        boolean;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 13 · KYB HASH EN ACTORS (cotejo Gemini 28-may · 2 piezas)
-- ═════════════════════════════════════════════════════════════════════════════
-- Hashes SHA-256 de documentos legales de la empresa:
--   1. Registro Mercantil (BORME España · INPI Francia · Handelsregister
--      Alemania · Companies House UK · SEC US · etc.)
--   2. Firma eIDAS 2.0 (preparación EUDI Wallet 2027)
--
-- PII OFF-CHAIN: el documento original con PII vive en Supabase Storage
-- (o en el ERP del actor). Solo el hash se ancla on-chain. Si se ejerce
-- derecho al olvido (GDPR Art. 17), cascade FK borra fila → hash huérfano.

alter table public.actors
  -- Hash SHA-256 del documento de registro mercantil del actor.
  add column if not exists id_registro_mercantil_hash      text
    check (id_registro_mercantil_hash is null or id_registro_mercantil_hash ~ '^[a-f0-9]{64}$'),

  -- Autoridad emisora del registro (BORME · INPI · Handelsregister · etc.).
  add column if not exists id_registro_mercantil_authority text,

  -- Timestamp de la verificación (re-verificar periódicamente · ej. 365d).
  add column if not exists id_registro_mercantil_verified_at timestamptz,

  -- Hash SHA-256 de la firma eIDAS 2.0 del actor (cuando EUDI Wallet productiva).
  add column if not exists eidas_signature_hash            text
    check (eidas_signature_hash is null or eidas_signature_hash ~ '^[a-f0-9]{64}$'),

  -- Timestamp verificación firma eIDAS.
  add column if not exists eidas_signature_verified_at     timestamptz;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 14 · CHECK CONSTRAINTS COMPLETENESS (EUDR + CRA + IMDG)
-- ═════════════════════════════════════════════════════════════════════════════
-- Replican los refines Zod cross-field en `_dppValidators.ts` como capa SQL.
-- Defensa en profundidad: Zod en API · SQL CHECK como cinturón + tirantes.

-- EUDR completeness · si in_eudr_scope=true → dds_reference + origin_geolocation obligatorios.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_eudr_completeness'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_eudr_completeness check (
        in_eudr_scope is not true
        or (dds_reference is not null and origin_geolocation is not null)
      );
  end if;
end $body$;

-- EUDR compliance attested coherence · solo se puede atestar si en scope.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_eudr_attested_coherence'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_eudr_attested_coherence check (
        eudr_compliance_attested is not true
        or in_eudr_scope is true
      );
  end if;
end $body$;

-- CRA completeness · si has_digital_elements=true → 4 campos CRA obligatorios.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_cra_completeness'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_cra_completeness check (
        has_digital_elements is not true
        or (
          ce_marking_cra is not null
          and sbom_url is not null
          and vulnerability_disclosure_url is not null
          and security_support_until is not null
        )
      );
  end if;
end $body$;

-- IMDG completeness · si imdg_class set → un_number + pg_packing_group obligatorios.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_imdg_completeness'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_imdg_completeness check (
        imdg_class is null
        or (un_number is not null and pg_packing_group is not null)
      );
  end if;
end $body$;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 15 · TRIGGERS APPEND-ONLY PARA NUEVAS TABLAS
-- ═════════════════════════════════════════════════════════════════════════════
-- Mismo patrón que mig 019 dpp_tracking_events: pg_trigger_depth() > 1 permite
-- cascade FK (GDPR Art. 17 derecho al olvido prevalece). DELETE manual = error.

-- Función genérica reutilizable (si no existe ya en mig 019).
create or replace function public.reject_append_only_mutation()
returns trigger
language plpgsql
as $body$
begin
  -- Permitir cascades FK (GDPR Art. 17 prevalece sobre inmutabilidad).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'tabla % es append-only; DELETE/UPDATE manual prohibido; use cascade FK desde auth.users para GDPR Art. 17', tg_table_name;
end;
$body$;

-- dpp_custody_chain
drop trigger if exists dpp_custody_chain_no_update on public.dpp_custody_chain;
create trigger dpp_custody_chain_no_update
  before update on public.dpp_custody_chain
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists dpp_custody_chain_no_delete on public.dpp_custody_chain;
create trigger dpp_custody_chain_no_delete
  before delete on public.dpp_custody_chain
  for each row execute function public.reject_append_only_mutation();

-- dpp_state_transitions
drop trigger if exists dpp_state_transitions_no_update on public.dpp_state_transitions;
create trigger dpp_state_transitions_no_update
  before update on public.dpp_state_transitions
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists dpp_state_transitions_no_delete on public.dpp_state_transitions;
create trigger dpp_state_transitions_no_delete
  before delete on public.dpp_state_transitions
  for each row execute function public.reject_append_only_mutation();

-- dpp_signatures
drop trigger if exists dpp_signatures_no_update on public.dpp_signatures;
create trigger dpp_signatures_no_update
  before update on public.dpp_signatures
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists dpp_signatures_no_delete on public.dpp_signatures;
create trigger dpp_signatures_no_delete
  before delete on public.dpp_signatures
  for each row execute function public.reject_append_only_mutation();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 16 · RLS POLICIES PARA PRODUCTS + NUEVAS TABLAS
-- ═════════════════════════════════════════════════════════════════════════════

-- ──────────── RLS `products` ────────────
alter table public.products enable row level security;

drop policy if exists "products_select_own_or_published" on public.products;
create policy "products_select_own_or_published"
  on public.products
  for select
  using (
    auth.uid() = owner_user_id
    or status = 'published'   -- producto publicado es visible para todos los autenticados
  );

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
  on public.products
  for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
  on public.products
  for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- DELETE: no policy → bloqueado · cascade FK desde auth.users sí borra.

-- ──────────── RLS `actor_keys` ────────────
alter table public.actor_keys enable row level security;

drop policy if exists "actor_keys_select_own" on public.actor_keys;
create policy "actor_keys_select_own"
  on public.actor_keys
  for select
  using (auth.uid() = actor_user_id);

drop policy if exists "actor_keys_insert_own" on public.actor_keys;
create policy "actor_keys_insert_own"
  on public.actor_keys
  for insert
  with check (auth.uid() = actor_user_id);

-- UPDATE/DELETE: ninguna policy (rotación se hace vía INSERT nueva + service_role
-- updatea is_active=false en una transacción · trigger append-only previene
-- updates manuales).

-- ──────────── RLS `dpp_custody_chain` ────────────
alter table public.dpp_custody_chain enable row level security;

drop policy if exists "dpp_custody_chain_select_dpp_visible" on public.dpp_custody_chain;
create policy "dpp_custody_chain_select_dpp_visible"
  on public.dpp_custody_chain
  for select
  using (
    -- Owner del DPP padre
    exists (
      select 1 from public.dpp_registry r
      where r.id = dpp_custody_chain.dpp_id
        and (r.owner_user_id = auth.uid() or r.manufacturer_actor_user_id = auth.uid())
    )
    -- O actor del eslabón (transitario · carrier · etc.)
    or auth.uid() = actor_user_id
  );

-- INSERT/UPDATE/DELETE: ninguna policy de cliente · solo Edge Function service_role.

-- ──────────── RLS `dpp_state_transitions` ────────────
alter table public.dpp_state_transitions enable row level security;

drop policy if exists "dpp_state_transitions_select_dpp_visible" on public.dpp_state_transitions;
create policy "dpp_state_transitions_select_dpp_visible"
  on public.dpp_state_transitions
  for select
  using (
    exists (
      select 1 from public.dpp_registry r
      where r.id = dpp_state_transitions.dpp_id
        and (r.owner_user_id = auth.uid() or r.manufacturer_actor_user_id = auth.uid())
    )
    or auth.uid() = transitioned_by
  );

-- INSERT/UPDATE/DELETE: ninguna policy de cliente · solo Edge Function service_role.

-- ──────────── RLS `dpp_signatures` ────────────
alter table public.dpp_signatures enable row level security;

drop policy if exists "dpp_signatures_select_dpp_visible" on public.dpp_signatures;
create policy "dpp_signatures_select_dpp_visible"
  on public.dpp_signatures
  for select
  using (
    exists (
      select 1 from public.dpp_registry r
      where r.id = dpp_signatures.dpp_id
        and (r.owner_user_id = auth.uid() or r.manufacturer_actor_user_id = auth.uid())
    )
    or auth.uid() = signer_user_id
  );

-- INSERT: solo el signer puede firmar.
drop policy if exists "dpp_signatures_insert_own" on public.dpp_signatures;
create policy "dpp_signatures_insert_own"
  on public.dpp_signatures
  for insert
  with check (auth.uid() = signer_user_id);

-- UPDATE/DELETE: ninguna policy + trigger append-only.

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 17 · UPDATE VISTAS PÚBLICAS (autoridades) CON NUEVOS CAMPOS v1.1
-- ═════════════════════════════════════════════════════════════════════════════
-- La vista `dpp_public_view` (mig 019 §7) debe ampliarse con los campos v1.1
-- relevantes para autoridades (CBAM · EU Taxonomy · CRA · EUDR · etc.).
-- Las columnas comerciales DROPEADAS (gtin · product_sku · product_name)
-- ahora vienen de products mediante JOIN.

create or replace view public.dpp_public_view
with (security_invoker = false, security_barrier = true)
as
select
  r.id,
  r.sector_id,
  -- Comercial vía JOIN a products (público para autoridades).
  p.gtin,
  p.title                                              as product_name,
  -- HS code: prefer products (canonizado) · fallback a snapshot dpp_registry.
  coalesce(p.hs_code, r.hs_code)                       as hs_code,
  -- Sostenibilidad ESPR (v1.0).
  r.materials,
  r.carbon_footprint_kg_co2eq,
  r.water_footprint_l,
  r.recycled_content_pct,
  r.recyclability_pct,
  r.sustainability_data,
  -- v1.1 · CBAM + EU Taxonomy + IMDG.
  r.carbon_footprint_cbam,
  r.taxonomy_alignment,
  r.un_number,
  r.imdg_class,
  r.pg_packing_group,
  -- v1.1 · PPWR (envase reciclado · reusable).
  r.package_recycled_content_pct,
  r.reusable,
  r.reusability_cycles,
  r.epr_registration_by_country,
  r.packaging_materials,
  -- v1.1 · CRA (productos digitales).
  r.has_digital_elements,
  r.ce_marking_cra,
  r.sbom_url,
  r.vulnerability_disclosure_url,
  r.security_support_until,
  r.cra_class,
  -- v1.1 · UCC (aduanas).
  p.country_of_origin,
  r.eori_seller,
  r.eori_importer,
  -- Origen (Capa F · v1.0 + EUDR v1.1).
  r.manufacturing_country,
  r.production_date,
  r.in_eudr_scope,
  r.dds_reference,
  r.origin_geolocation,
  r.eudr_compliance_attested,
  -- Lifecycle (Capa D).
  r.lifecycle_state,
  r.state_changed_at,
  -- v1.1 · Incoterms + marítimos.
  r.incoterm,
  r.delivery_location,
  r.bl_reference,
  r.carrier_id,
  r.maritime_convention,
  -- Anclaje on-chain.
  r.schema_version,
  r.hash_canonical_sha256,
  r.onchain_tx_hash,
  r.onchain_anchored_at,
  r.created_at
from public.dpp_registry r
left join public.products p on r.product_id = p.id
where public.is_dpp_authority_role();

grant select on public.dpp_public_view to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 18 · COMMENTS (auto-documentación + MLETR + matiz aviación)
-- ═════════════════════════════════════════════════════════════════════════════

comment on table public.products is
  'Tabla comercial del producto · refactor Opción B (decisión José a1.1.3-B del 2026-05-28). Datos comerciales separados del DPP. El DPP (dpp_registry) se asocia vía FK product_id. Permite catálogo público + escritorio fabricante + pedidos.';

comment on column public.products.payment_modality is
  '4 modalidades canónicas (memoria modelos_pago · ratificadas 12-may): direct (<500€) · escrow_b2b_full (100% escrow nacional) · split_50_50 (servicios) · split_30_70 (importación).';

comment on column public.products.status is
  'Estado del producto. pending_audit = esperando verificación certificaciones por Audit Council (Modelo C híbrido · memoria auditoria_certificaciones_modelo_c · futura ADR 0009).';

comment on column public.dpp_registry.product_id is
  'FK a products · refactor Opción B. Cada DPP pertenece a un producto comercial. Cascade delete: si se borra el producto, se borran sus DPPs.';

comment on column public.dpp_registry.un_number is
  'IMDG · número UN de mercancía peligrosa (formato UN0000-UN3999). v1.1 canonizado en Capa A (antes solo un_dangerous_class simplificado en Capa B).';

comment on column public.dpp_registry.imdg_class is
  'IMDG · clase granular de mercancía peligrosa según Código IMDG SOLAS IMO ed. 41-22. v1.1 nuevo. CLASE 1 explosivos sin distinción división (1.1-1.6 documentado en proper_shipping_name).';

comment on column public.dpp_registry.carbon_footprint_cbam is
  'CBAM Anexo IV · huella carbono metodología específica Reg. UE 2023/956. Fase definitiva 1-ene-2026. Obligatorio importadores cemento/electricidad/fertilizantes/hierro-acero/aluminio/hidrógeno.';

comment on column public.dpp_registry.taxonomy_alignment is
  'EU Taxonomy alignment · 6 objetivos ambientales × DNSH × MSS (Reg. UE 2020/852). Diferenciador comercial · presión indirecta VCs sujetos SFDR.';

comment on column public.dpp_registry.has_digital_elements is
  'CRA Reg. UE 2024/2847 · ¿producto con elementos digitales? Si true, sbom_url + vulnerability_disclosure_url + ce_marking_cra + security_support_until obligatorios (CHECK dpp_registry_cra_completeness).';

comment on column public.dpp_registry.incoterm is
  'Incoterm 2020 ICC · scope transaccional. NULL en catálogo · se completa al firmar pedido. Smart contract escrow XDC (Capa 5 ADR 0007) parametriza trigger según valor (DAP/DPU/DDP → trigger entrega · FOB/CFR/CIF → trigger embarque · EXW/FCA/FAS → trigger recogida).';

comment on column public.dpp_registry.maritime_convention is
  'Convenio marítimo aplicable. España aplica Hague-Visby (Ley 14/2014 Navegación Marítima). Hamburgo ~35 estados. Rotterdam NO en vigor (solo 5 ratificadores).';

comment on column public.dpp_registry.in_eudr_scope is
  'EUDR Reg. UE 2023/1115 · ¿producto en alcance? Aplica a: ganado bovino · cacao · café · aceite palma · caucho · soja · madera + derivados Anexo I. Si true, dds_reference + origin_geolocation obligatorios (CHECK dpp_registry_eudr_completeness). Aplicación 30-dic-2026 grandes · 30-jun-2027 micro/PYME.';

comment on table public.dpp_custody_chain is
  'Cadena custodia digital criptográfica G10 (decisión expresa José 2026-05-28 · ADR 0007 §2.2). Cada actor que toca la mercancía firma Ed25519. Cumplimiento MLETR UNCITRAL 2017 (singularidad + identificabilidad + integridad + control exclusivo). Pendiente añadir MLETR como ley #45 matriz normativa v1.1 (Fase 4.bis).';

comment on column public.dpp_custody_chain.custody_role is
  'Rol del actor con custodia. carrier incluye aéreo (transportista aéreo registrado en cadena · 1503 NO opera W&B · ADR 0007 §2.7 matiz aviación canonizado 29-may).';

comment on column public.dpp_custody_chain.transfer_evidence is
  'Evidencia documental. document_type acepta: BL · CMR · AWB · rail_consignment · delivery_note · inland_waterway_bl. AWB incluido por matiz aviación (documento legal en custody chain · ADR 0007 §2.7).';

comment on table public.dpp_state_transitions is
  'Historial inmutable de transiciones lifecycle del DPP. Append-only (pg_trigger_depth>1 cascade GDPR Art. 17). Cada transición puede asociarse con firma Ed25519 (signature_id FK futura a dpp_signatures).';

comment on table public.dpp_signatures is
  'Firmas Ed25519 sobre el DPP completo (no eslabón específico). Usadas para multi-firma 2-de-3 envíos altos (Capa 4 ADR 0007 G4). Append-only.';

comment on table public.actor_keys is
  'Claves Ed25519 del Actor. Solo UNA activa a la vez (actor_keys_active_unique). Rotación: deactivate vieja + insert nueva en transacción. Las claves anteriores se conservan para verificación de firmas históricas.';

comment on column public.actors.id_registro_mercantil_hash is
  'Hash SHA-256 del documento Registro Mercantil (PII off-chain · canon CLAUDE.md §1). Multi-jurisdicción: BORME España · INPI Francia · Handelsregister Alemania · Companies House UK · SEC US. Cotejo Gemini 28-may incorporado.';

comment on column public.actors.eidas_signature_hash is
  'Hash SHA-256 de la firma eIDAS 2.0 (preparación EUDI Wallet 2027). NULL hasta que EUDI Wallet productivo. Cotejo Gemini 28-may incorporado.';

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 19 · ÍNDICES OPTIMIZACIÓN PARA QUERIES COMUNES v1.1
-- ═════════════════════════════════════════════════════════════════════════════

-- Queries por estado de scope EUDR (autoridad TRACES NT).
create index if not exists dpp_registry_in_eudr_scope_idx
  on public.dpp_registry (in_eudr_scope) where in_eudr_scope = true;

-- Queries por elementos digitales (CRA).
create index if not exists dpp_registry_has_digital_elements_idx
  on public.dpp_registry (has_digital_elements) where has_digital_elements = true;

-- Queries por mercancía peligrosa IMDG.
create index if not exists dpp_registry_imdg_class_idx
  on public.dpp_registry (imdg_class) where imdg_class is not null;

-- Queries por país de origen aduanero (UCC).
create index if not exists dpp_registry_eori_seller_idx
  on public.dpp_registry (eori_seller) where eori_seller is not null;

-- Queries por product_id (FK).
create index if not exists dpp_registry_product_id_idx
  on public.dpp_registry (product_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 20 · BUMP DPP_SCHEMA_VERSION → 'dpp@1.1'
-- ═════════════════════════════════════════════════════════════════════════════
-- Actualizar el default de schema_version a 'dpp@1.1' para nuevos DPPs.
-- Los existentes mantienen su versión (no se tocan).

alter table public.dpp_registry
  alter column schema_version set default 'dpp@1.1';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN MIGRACIÓN 028
-- ─────────────────────────────────────────────────────────────────────────────
-- Tablas afectadas:
--   - public.products                  (NUEVA · refactor Opción B)
--   - public.dpp_registry              (refactor + 30+ columnas v1.1)
--   - public.dpp_custody_chain         (NUEVA · G10 + MLETR)
--   - public.dpp_state_transitions     (NUEVA · lifecycle audit)
--   - public.dpp_signatures            (NUEVA · multi-sig 2-de-3)
--   - public.actor_keys                (NUEVA · rotación Ed25519)
--   - public.actors                    (KYB hash · cotejo Gemini)
--
-- Vistas afectadas:
--   - public.dpp_public_view           (ampliada v1.1 + JOIN a products)
--
-- Tipos afectados:
--   - public.dpp_lifecycle_state       (NUEVO · enum 11 estados)
--
-- Constraints añadidos:
--   - dpp_registry_eudr_completeness
--   - dpp_registry_eudr_attested_coherence
--   - dpp_registry_cra_completeness
--   - dpp_registry_imdg_completeness
--   - dpp_registry_reefer_temp_coherence
--   - dpp_registry_ppwr_reusability_coherence
--   - dpp_registry_stack_load_coherence
--   - dpp_registry_erp_sync_coherence
--   - dpp_custody_chain_gps_pair
--
-- Próximo paso (commit 4/7): actualizar 7 schemas sectoriales TypeScript
-- para extender DPPProduct v1.1 cuando producto físico.
