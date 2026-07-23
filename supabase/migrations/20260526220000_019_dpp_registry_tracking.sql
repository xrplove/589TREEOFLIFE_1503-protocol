-- Migration: 019_dpp_registry_tracking
-- Created: 2026-05-26
-- Purpose: DPP Módulo 1 · Pasaporte Digital de Productos (Digital Product Passport).
--
-- BASE LEGAL REAL
-- ---------------
--   - Reg. UE 2024/1781 ESPR (Ecodesign for Sustainable Products Regulation ·
--     13-jun-2024 · DPP obligatorio escalonado 2026-2030 por categoría)
--   - Reg. UE 2023/1542 Baterías (DPP obligatorio baterías desde 18-feb-2027)
--   - Estrategia UE Textil sostenible (Reg. 2024/1781 DPP textil escalonado)
--   - Reg. UE 2024/1252 (materias primas críticas · obligaciones trazabilidad)
--   - GDPR art. 5 + art. 17 (PII off-chain · cascade delete derecho al olvido)
--
-- ARQUITECTURA · 2 TABLAS + 1 VISTA + FUNCIÓN HELPER + ENUM
-- ---------------------------------------------------------
-- El flujo del DPP cruza 3 sectores 1503:
--
--   SECTOR FABRICANTE (D.8 metalurgico / textil / automocion / agroalimentario):
--     Crea el registro estático en `dpp_registry` (materiales · huella carbono ·
--     origen). Calcula `hash_canonical_sha256` del payload canónico inmutable.
--     Fase 8+: hash se ancla en XDC Network → `onchain_tx_hash`.
--
--   SECTOR TRANSPORTE (D.1 transitarios · navieras · operadores portuarios):
--     Inserta eventos en `dpp_tracking_events` cada vez que la mercancía pasa
--     por un hub validado (fábrica · puerto · aduana · destino). La inserción
--     se hace SOLO vía Edge Function (Módulo 2 · validación geofence MaxMind
--     + JWT verificador con role específico). El cliente NO inserta directo.
--
--   SECTOR FINANZAS (D.7 transversal · futura D.X financiero):
--     Lee eventos para disparar lógica de smart contract (Módulo 3): validar
--     hash + ejecutar pago automático tasas portuarias · liberar escrow.
--
-- PII OFF-CHAIN · HASHES ON-CHAIN
-- -------------------------------
-- Datos personales (nombre fabricante · contacto operario · dirección planta)
-- viven SOLO en Postgres. En XDC se ancla SOLO el hash SHA-256 del payload
-- canónico. Si se ejerce derecho al olvido (GDPR Art. 17): cascade FK borra
-- la fila → el hash on-chain queda huérfano sin posibilidad de re-identificar.
--
-- APPEND-ONLY
-- -----------
-- `dpp_tracking_events` lleva trigger `reject_dpp_event_mutation` que bloquea
-- UPDATE y DELETE manuales (incluso desde service_role). El derecho al
-- olvido SÍ se aplica vía cascade FK desde auth.users (intencional).
--
-- FILTRADO POSITIVO PARA AUTORIDADES (RGPD + Confidencialidad Comercial)
-- ---------------------------------------------------------------------
-- Las autoridades aduaneras y portuarias NO acceden a `dpp_registry` directo.
-- Acceden vía vista `dpp_public_view` con `security_invoker = false`, que
-- expone SOLO los campos públicos relevantes para su función (sostenibilidad ·
-- origen · materiales · hash). NUNCA ven datos comerciales (PVL · márgenes ·
-- costes · proveedores upstream · contraparte).
--
-- COMO APLICAR (MANUAL DESDE DASHBOARD · feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (Ctrl + Enter)
--   4. Esperar "Success. No rows returned."
--   5. Verificar en Table Editor que aparecen `dpp_registry` y
--      `dpp_tracking_events`, y en Database → Views que aparece `dpp_public_view`.
--
-- PRECONDICIONES
-- --------------
-- - Migración 008 (actors con CHECK) aplicada · `public.actors` existe.
-- - `auth.users` existe (Supabase Auth default).
-- - `gen_random_uuid()` disponible (pgcrypto · default Supabase).

-- ─────────────────────────────────────────────────────────────────────
-- 1. ENUM · tipos canónicos de evento logístico DPP
-- ─────────────────────────────────────────────────────────────────────
-- Catálogo cerrado para garantizar consistencia cross-sector. Si en el
-- futuro hace falta ampliar (e.g. 'inspeccion_fito'), se hace con
-- ALTER TYPE ADD VALUE en una migración nueva.
do $body$
begin
  if not exists (select 1 from pg_type where typname = 'dpp_event_type') then
    create type public.dpp_event_type as enum (
      -- Fase fabricación
      'fabricacion_inicio',
      'fabricacion_fin',
      'control_calidad_aprobado',
      -- Logística origen
      'salida_planta_fabricante',
      'entrada_almacen_origen',
      'consolidacion_envio',
      'salida_almacen_origen',
      -- Transporte internacional
      'embarque_origen',
      'en_transito_maritimo',
      'en_transito_terrestre',
      'en_transito_ferroviario',
      'en_transito_aereo',
      'transbordo_intermedio',
      -- Llegada destino
      'entrada_puerto_destino',
      'despacho_aduanero_iniciado',
      'despacho_aduanero_completado',
      'salida_puerto_destino',
      'entrada_almacen_destino',
      -- Entrega y fin de vida
      'entrega_destinatario_final',
      'devolucion',
      'reciclaje_fin_vida',
      'incidencia_reportada'
    );
  end if;
end $body$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Tabla `dpp_registry` · datos estáticos del producto (sector fabricante)
-- ─────────────────────────────────────────────────────────────────────
-- Una fila por SKU lote de producto registrado. Los campos estáticos
-- (composición · huella · origen) NO mutan tras la primera firma: cualquier
-- corrección posterior debería ir a un nuevo `schema_version` y una nueva
-- fila + invalidación de la anterior (TODO Módulo 3).
create table if not exists public.dpp_registry (
  id                              uuid primary key default gen_random_uuid(),

  -- ──────────────── OWNERSHIP ────────────────
  -- Propietario de la mercancía (puede vender/transferir). Sujeto a GDPR
  -- Art. 17 vía cascade FK.
  owner_user_id                   uuid not null references auth.users(id) on delete cascade,

  -- Fabricante real (puede ser distinto del propietario · e.g. white-label,
  -- distribuidor importador, etc.). NULL si el propietario es a la vez
  -- fabricante directo.
  manufacturer_actor_user_id      uuid references auth.users(id) on delete set null,

  -- ──────────────── CLASIFICACIÓN 1503 ────────────────
  -- Sector 1503 donde el DPP nace (refleja el actor del fabricante).
  -- Coincide con `public.actors.sector_id` para coherencia cross-sector.
  sector_id                       text not null check (char_length(sector_id) between 2 and 64),

  -- ──────────────── IDENTIFICACIÓN COMERCIAL ────────────────
  -- GTIN (Global Trade Item Number · GS1) · longitud 8/12/13/14.
  gtin                            text check (gtin is null or gtin ~ '^[0-9]{8}$|^[0-9]{12,14}$'),

  -- SKU interno del fabricante (único por owner).
  product_sku                     text not null check (char_length(product_sku) between 1 and 64),

  -- Nombre comercial × 8 idiomas (LocalizedLabel · es/en/fr/de/it/pt/zh/ja).
  product_name                    jsonb not null,

  -- Código HS arancelario (Sistema Armonizado · 6-10 dígitos · obligatorio
  -- aduanas cross-border).
  hs_code                         text check (hs_code is null or hs_code ~ '^[0-9]{6,10}$'),

  -- ──────────────── DATOS DE SOSTENIBILIDAD (ESPR Art. 9-12) ────────────────
  -- Composición de materiales en formato canónico:
  --   [{name: "PET reciclado", percentage: 65, supplier_hashed?: "sha256:..."}]
  -- Los proveedores upstream se serializan como hash si son confidenciales
  -- (proteger relación comercial · NO se publica en vista pública).
  materials                       jsonb not null default '[]'::jsonb,

  -- Huella de carbono (kg CO2 equivalente por unidad de producto). Metodología
  -- recomendada PEF (Product Environmental Footprint · Recomendación UE 2021/2279).
  carbon_footprint_kg_co2eq       numeric(10,4),

  -- Huella hídrica (litros agua por unidad).
  water_footprint_l               numeric(10,2),

  -- Porcentaje de material reciclado (0-100).
  recycled_content_pct            numeric(5,2) check (recycled_content_pct is null or (recycled_content_pct >= 0 and recycled_content_pct <= 100)),

  -- Índice de reciclabilidad estimado al fin de vida (0-100).
  recyclability_pct               numeric(5,2) check (recyclability_pct is null or (recyclability_pct >= 0 and recyclability_pct <= 100)),

  -- Otros datos ESG estructurados (energía renovable · biodiversidad ·
  -- social compliance · etc.). Schema libre para flexibilidad evolutiva.
  sustainability_data             jsonb not null default '{}'::jsonb,

  -- ──────────────── ORIGEN ────────────────
  -- País de fabricación (ISO 3166-1 alpha-2).
  manufacturing_country           text not null check (manufacturing_country ~ '^[A-Z]{2}$'),

  -- Identificador opaco de planta/instalación. NO publicar dirección física
  -- exacta en vista pública (PII de la planta · datos personales operarios).
  manufacturing_facility_id       text,

  -- Fecha de producción.
  production_date                 date not null,

  -- Lote del fabricante (trazabilidad interna).
  manufacturer_batch_number       text,

  -- ──────────────── INMUTABILIDAD / ANCLAJE ON-CHAIN ────────────────
  -- Versión del schema del payload canónico para hashing. Migrar campos
  -- futuros bumpea esta versión para no romper hashes pre-existentes.
  schema_version                  text not null default 'dpp@1.0',

  -- Hash SHA-256 del payload canónico estático (64 chars hex). Calculado
  -- en cliente o Edge Function antes del INSERT. Es lo que se ancla en XDC.
  -- Si NULL, el DPP aún no se ha congelado para anclaje.
  hash_canonical_sha256           text check (hash_canonical_sha256 is null or hash_canonical_sha256 ~* '^[0-9a-f]{64}$'),

  -- TX hash de XDC Network donde se ancló el hash canonical (Fase 8+).
  onchain_tx_hash                 text,
  onchain_anchored_at             timestamptz,

  -- ──────────────── AUDIT ────────────────
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),

  -- ──────────────── CONSTRAINTS ────────────────
  -- (owner_user_id, product_sku) único: cada owner no puede repetir SKU.
  constraint dpp_registry_owner_sku_unique unique (owner_user_id, product_sku)
);

-- Índices: el caso primario es leer todos los DPPs de un owner o filtrar
-- por sector/país.
create index if not exists dpp_registry_owner_idx
  on public.dpp_registry (owner_user_id);

create index if not exists dpp_registry_sector_idx
  on public.dpp_registry (sector_id);

create index if not exists dpp_registry_manufacturing_country_idx
  on public.dpp_registry (manufacturing_country);

create index if not exists dpp_registry_gtin_idx
  on public.dpp_registry (gtin) where gtin is not null;

create index if not exists dpp_registry_hs_code_idx
  on public.dpp_registry (hs_code) where hs_code is not null;

create index if not exists dpp_registry_hash_idx
  on public.dpp_registry (hash_canonical_sha256) where hash_canonical_sha256 is not null;

-- Trigger touch updated_at en cada UPDATE (campos no-críticos).
create or replace function public.touch_dpp_registry_updated_at()
returns trigger
language plpgsql
as $body$
begin
  new.updated_at := now();
  return new;
end;
$body$;

drop trigger if exists dpp_registry_touch_updated_at on public.dpp_registry;
create trigger dpp_registry_touch_updated_at
  before update on public.dpp_registry
  for each row execute function public.touch_dpp_registry_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 3. Tabla `dpp_tracking_events` · eventos logísticos append-only
--    (sector transporte · operadores portuarios · autoridades aduana)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.dpp_tracking_events (
  id                              uuid primary key default gen_random_uuid(),

  -- FK al DPP. Cascade delete: si el DPP se borra (derecho al olvido del
  -- owner), sus eventos también se borran. Los hashes on-chain quedan
  -- huérfanos sin posibilidad de re-identificación.
  dpp_id                          uuid not null references public.dpp_registry(id) on delete cascade,

  -- ──────────────── EVENTO ────────────────
  event_type                      public.dpp_event_type not null,
  event_at                        timestamptz not null,

  -- ──────────────── VERIFICADOR ────────────────
  -- Quién registra el evento. NULL si la cuenta se borra (cascade set null
  -- por GDPR Art. 17 sobre auth.users · pero la fila del evento NO se borra
  -- porque la integridad del timeline es interés legítimo del owner).
  verifier_user_id                uuid references auth.users(id) on delete set null,

  -- Rol que ostenta el verificador en el momento del registro (cacheado del
  -- JWT · app_metadata.role). Permite distinguir eventos registrados por
  -- 'transportista' vs 'aduanas_es' vs 'autoridad_portuaria_valencia'.
  -- Importante: este campo NO se valida server-side aquí · la validación
  -- real se hace en la Edge Function dpp-validator (Módulo 2) ANTES de
  -- insertar la fila. Aquí solo se persiste lo que la Edge Function pasó.
  verifier_role                   text not null check (char_length(verifier_role) between 3 and 64),

  -- ──────────────── LOCALIZACIÓN ────────────────
  -- País del evento (ISO 3166-1 alpha-2). Validado contra MaxMind GeoIP +
  -- GPS del dispositivo en Edge Function.
  location_country                text not null check (location_country ~ '^[A-Z]{2}$'),

  -- UN/LOCODE del hub logístico (e.g. 'ESVLC' Valencia · 'NLRTM' Rotterdam ·
  -- 'CNSHA' Shanghai · 'USNYC' Nueva York).
  location_un_locode              text check (location_un_locode is null or location_un_locode ~ '^[A-Z]{2}[A-Z2-9]{3}$'),

  -- Coordenadas GPS WGS84. Si PostGIS se habilita más adelante, migrar a
  -- geography(POINT, 4326).
  location_lat                    numeric(9,6) check (location_lat is null or (location_lat >= -90 and location_lat <= 90)),
  location_lng                    numeric(9,6) check (location_lng is null or (location_lng >= -180 and location_lng <= 180)),

  -- Precisión del fix GPS en metros (para descartar lecturas malas).
  location_accuracy_m             numeric(8,2),

  -- ──────────────── PAYLOAD EVENTO ────────────────
  -- Datos específicos del tipo de evento (referencia B/L · CMR ·
  -- declaración aduanera DUA · número precinto · temperatura registrada
  -- si reefer · resultado control fito · etc.). Schema libre por evento.
  event_payload                   jsonb not null default '{}'::jsonb,

  -- ──────────────── INMUTABILIDAD / ANCLAJE ON-CHAIN ────────────────
  -- Hash SHA-256 del evento canónico (dpp_id + event_type + event_at +
  -- verifier_role + location + payload). Hex 64 chars o NULL.
  event_hash_sha256               text check (event_hash_sha256 is null or event_hash_sha256 ~* '^[0-9a-f]{64}$'),

  -- TX hash de XDC Network donde se ancló este evento (Fase 8+).
  onchain_tx_hash                 text,
  onchain_anchored_at             timestamptz,

  -- ──────────────── FORENSE / DEFENSA EN PROFUNDIDAD ────────────────
  -- IP del dispositivo desde el que se registró el evento. Para verificación
  -- forense (¿el operario estaba realmente en el hub declarado?). NO se
  -- expone en vistas públicas.
  device_ip                       inet,

  -- User-Agent del dispositivo (móvil · tablet · scanner industrial).
  device_user_agent               text,

  created_at                      timestamptz not null default now()
);

-- Índices: caso primario es leer timeline de un DPP cronológicamente, o
-- filtrar por tipo de evento, o por verificador.
create index if not exists dpp_tracking_events_dpp_event_at_idx
  on public.dpp_tracking_events (dpp_id, event_at desc);

create index if not exists dpp_tracking_events_event_type_idx
  on public.dpp_tracking_events (event_type);

create index if not exists dpp_tracking_events_verifier_idx
  on public.dpp_tracking_events (verifier_user_id);

create index if not exists dpp_tracking_events_un_locode_idx
  on public.dpp_tracking_events (location_un_locode) where location_un_locode is not null;

-- ─────────────────────────────────────────────────────────────────────
-- 4. Trigger append-only sobre `dpp_tracking_events`
-- ─────────────────────────────────────────────────────────────────────
-- Defensa en profundidad: aunque RLS bloquee UPDATE/DELETE del cliente, el
-- service_role los saltaría. Este trigger lanza error en cualquier intento
-- manual, garantizando que el timeline NO se reescribe ni desde el server.
--
-- CASCADE FK desde auth.users (GDPR Art. 17 derecho al olvido) DEBE poder
-- borrar filas — el derecho al olvido prevalece sobre la inmutabilidad.
-- Discriminamos cascade vs DELETE manual usando `pg_trigger_depth()`:
--   - DELETE manual directo sobre dpp_tracking_events  →  depth = 1  →  BLOCK
--   - DELETE manual sobre dpp_registry (cascade a tracking_events)
--                                                       →  depth = 2  →  ALLOW
--   - DELETE auth.users → cascade dpp_registry → cascade tracking_events
--                                                       →  depth = 3  →  ALLOW
--
-- Regla: depth > 1 indica que NO somos la raíz del DELETE, sino un cascade
-- propagado. En ese caso, devolvemos `OLD` para permitir el borrado.
create or replace function public.reject_dpp_event_mutation()
returns trigger
language plpgsql
as $body$
begin
  -- Permitir cascades FK (GDPR Art. 17 prevalece sobre inmutabilidad).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'dpp_tracking_events is append-only; DELETE manual prohibido; use cascade FK desde auth.users para GDPR Art. 17';
end;
$body$;

drop trigger if exists dpp_tracking_events_no_update on public.dpp_tracking_events;
create trigger dpp_tracking_events_no_update
  before update on public.dpp_tracking_events
  for each row execute function public.reject_dpp_event_mutation();

drop trigger if exists dpp_tracking_events_no_delete on public.dpp_tracking_events;
create trigger dpp_tracking_events_no_delete
  before delete on public.dpp_tracking_events
  for each row execute function public.reject_dpp_event_mutation();

-- ─────────────────────────────────────────────────────────────────────
-- 5. Función helper · ¿el JWT actual tiene rol de autoridad DPP?
-- ─────────────────────────────────────────────────────────────────────
-- Se consulta desde la VISTA dpp_public_view (sección 7). El rol se inyecta
-- en el JWT en el Auth Hook que construiremos en el Módulo 2.
--
-- Lista canónica de roles autoridad (ampliable con nuevas migraciones):
--   - 'aduanas_es'                   · AEAT Aduanas (España)
--   - 'aduanas_eu_dg_taxud'          · DG TAXUD (UE)
--   - 'autoridad_portuaria_valencia' · APV
--   - 'autoridad_portuaria_barcelona'· APB
--   - 'autoridad_portuaria_algeciras'· APBA
--   - 'autoridad_portuaria_bilbao'   · APV
--   - 'inspector_espr_ue'            · Inspector vigilancia mercado ESPR
--   - 'inspector_aemps'              · Inspector AEMPS (productos sanitarios)
create or replace function public.is_dpp_authority_role()
returns boolean
language sql
stable
security invoker
as $body$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in (
      'aduanas_es',
      'aduanas_eu_dg_taxud',
      'autoridad_portuaria_valencia',
      'autoridad_portuaria_barcelona',
      'autoridad_portuaria_algeciras',
      'autoridad_portuaria_bilbao',
      'inspector_espr_ue',
      'inspector_aemps'
    ),
    false
  );
$body$;

-- ─────────────────────────────────────────────────────────────────────
-- 6. Row-Level Security · RLS cerrada por defecto
-- ─────────────────────────────────────────────────────────────────────
-- PATRÓN: la tabla base `dpp_registry` solo es legible/escribible por su
-- owner y por el manufacturer si distinto. Las AUTORIDADES NO acceden a la
-- tabla base · acceden EXCLUSIVAMENTE vía la vista `dpp_public_view`
-- (sección 7) que tiene filtrado positivo de columnas.
--
-- INSERT/UPDATE/DELETE en `dpp_tracking_events`: ninguna política → cliente
-- BLOQUEADO. Solo el server con service_role escribe (via Edge Function
-- dpp-validator del Módulo 2). El trigger append-only previene además que
-- el service_role pueda actualizar o borrar filas existentes.

alter table public.dpp_registry enable row level security;
alter table public.dpp_tracking_events enable row level security;

-- ──────────── RLS `dpp_registry` ────────────
-- SELECT: owner del DPP O fabricante registrado.
drop policy if exists "dpp_registry_select_owner_or_manufacturer" on public.dpp_registry;
create policy "dpp_registry_select_owner_or_manufacturer"
  on public.dpp_registry
  for select
  using (
    auth.uid() = owner_user_id
    or auth.uid() = manufacturer_actor_user_id
  );

-- INSERT: solo el owner puede crear. El fabricante se establece declarado
-- por el owner (puede ser él mismo o un tercero).
drop policy if exists "dpp_registry_insert_owner" on public.dpp_registry;
create policy "dpp_registry_insert_owner"
  on public.dpp_registry
  for insert
  with check (auth.uid() = owner_user_id);

-- UPDATE: solo el owner puede actualizar y SOLO mientras el DPP no esté
-- aún anclado on-chain (una vez anclado, los datos estáticos son
-- inmutables · cualquier corrección requiere nueva fila + nuevo
-- schema_version). Defensa adicional: campos críticos
-- (hash_canonical_sha256 · onchain_*) NO deberían cambiar tras anclaje;
-- la lógica de prohibirlo a nivel campo se hace en la API server-side
-- (filtrado positivo de campos al UPDATE).
drop policy if exists "dpp_registry_update_owner_pre_onchain" on public.dpp_registry;
create policy "dpp_registry_update_owner_pre_onchain"
  on public.dpp_registry
  for update
  using (
    auth.uid() = owner_user_id
    and onchain_tx_hash is null
  )
  with check (
    auth.uid() = owner_user_id
    and onchain_tx_hash is null
  );

-- DELETE: ninguna policy → cliente bloqueado. El cascade FK desde
-- auth.users SÍ borra (derecho al olvido GDPR Art. 17 prevalece sobre
-- inmutabilidad).

-- ──────────── RLS `dpp_tracking_events` ────────────
-- SELECT: el owner del DPP padre Y el fabricante padre pueden ver el
-- timeline completo. El verificador puede ver SUS propios eventos. Las
-- autoridades NO acceden por aquí · acceden por vista pública (sección 7).
drop policy if exists "dpp_tracking_events_select_owner_or_manufacturer_or_verifier" on public.dpp_tracking_events;
create policy "dpp_tracking_events_select_owner_or_manufacturer_or_verifier"
  on public.dpp_tracking_events
  for select
  using (
    -- Owner del DPP padre
    exists (
      select 1 from public.dpp_registry r
      where r.id = dpp_tracking_events.dpp_id
        and (r.owner_user_id = auth.uid() or r.manufacturer_actor_user_id = auth.uid())
    )
    -- O verificador del evento concreto
    or auth.uid() = verifier_user_id
  );

-- INSERT: ninguna policy de cliente. Solo service_role inserta vía Edge
-- Function dpp-validator (Módulo 2). En PRO conviene reforzar denegando
-- explícitamente al rol authenticated, pero RLS sin policy ya es deniega
-- por defecto.

-- UPDATE/DELETE: ninguna policy + trigger reject_dpp_event_mutation hace
-- cinturón + tirantes.

-- ─────────────────────────────────────────────────────────────────────
-- 7. VISTA `dpp_public_view` · filtrado positivo para autoridades
-- ─────────────────────────────────────────────────────────────────────
-- Las autoridades aduaneras y portuarias hacen SELECT contra esta vista,
-- NUNCA contra dpp_registry directo. La vista:
--   - Solo expone columnas relevantes para la función fiscalizadora
--     (sostenibilidad · origen · materiales · trazabilidad · hash).
--   - NUNCA expone: owner_user_id · manufacturer_actor_user_id reales ·
--     product_sku interno · manufacturing_facility_id · costes · márgenes ·
--     proveedores upstream (estos vienen ya hasheados en `materials`).
--   - Filtra por rol JWT mediante public.is_dpp_authority_role().
--   - Se crea con `security_invoker = false` (ejecuta con permisos del
--     creador postgres) para que las autoridades puedan leer sin
--     necesidad de tener policy de SELECT en la tabla base.
create or replace view public.dpp_public_view
with (security_invoker = false, security_barrier = true)
as
select
  r.id,
  r.sector_id,
  r.gtin,
  r.product_name,
  r.hs_code,
  r.materials,
  r.carbon_footprint_kg_co2eq,
  r.water_footprint_l,
  r.recycled_content_pct,
  r.recyclability_pct,
  r.sustainability_data,
  r.manufacturing_country,
  r.production_date,
  r.schema_version,
  r.hash_canonical_sha256,
  r.onchain_tx_hash,
  r.onchain_anchored_at,
  r.created_at
from public.dpp_registry r
where public.is_dpp_authority_role();

-- Acceso a la vista solo para usuarios autenticados (el filtro de rol
-- autoridad lo hace la cláusula WHERE de la vista).
grant select on public.dpp_public_view to authenticated;

-- Vista análoga para eventos de tracking (autoridades pueden ver timeline
-- pero NO ven device_ip · device_user_agent del verificador).
create or replace view public.dpp_tracking_events_public_view
with (security_invoker = false, security_barrier = true)
as
select
  e.id,
  e.dpp_id,
  e.event_type,
  e.event_at,
  e.verifier_role,
  e.location_country,
  e.location_un_locode,
  e.location_lat,
  e.location_lng,
  e.location_accuracy_m,
  e.event_payload,
  e.event_hash_sha256,
  e.onchain_tx_hash,
  e.onchain_anchored_at,
  e.created_at
from public.dpp_tracking_events e
where public.is_dpp_authority_role();

grant select on public.dpp_tracking_events_public_view to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 8. Función helper · timeline canónico ordenado de un DPP
-- ─────────────────────────────────────────────────────────────────────
-- Returns: timeline ordenado cronológicamente para uso de UI (Módulo 4) +
-- generación de hash agregado para anclaje on-chain.
-- Visible solo si el caller pasa la RLS de dpp_tracking_events (owner,
-- manufacturer o autoridad vía vista pública).
create or replace function public.get_dpp_timeline(p_dpp_id uuid)
returns table (
  event_id              uuid,
  event_type            public.dpp_event_type,
  event_at              timestamptz,
  verifier_role         text,
  location_country      text,
  location_un_locode    text,
  event_hash_sha256     text,
  onchain_tx_hash       text,
  onchain_anchored_at   timestamptz
)
language sql
stable
security invoker
as $body$
  select
    id, event_type, event_at, verifier_role,
    location_country, location_un_locode,
    event_hash_sha256, onchain_tx_hash, onchain_anchored_at
  from public.dpp_tracking_events
  where dpp_id = p_dpp_id
  order by event_at asc, created_at asc;
$body$;

grant execute on function public.get_dpp_timeline(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 9. Comentarios de tabla (auto-documentación)
-- ─────────────────────────────────────────────────────────────────────
comment on table public.dpp_registry is
  'DPP Módulo 1 · Registro estático del Pasaporte Digital de Productos (Reg. UE 2024/1781 ESPR). Datos del fabricante: composición, huella ambiental, origen. PII off-chain · hash SHA-256 ancla en XDC.';

comment on table public.dpp_tracking_events is
  'DPP Módulo 1 · Timeline append-only de eventos logísticos. Inserts SOLO vía Edge Function dpp-validator (Módulo 2) con validación geofence MaxMind + JWT role verificador.';

comment on view public.dpp_public_view is
  'Vista filtrado positivo · Autoridades aduaneras/portuarias acceden por aquí. Expone SOLO campos públicos relevantes para fiscalización (sostenibilidad/origen/materiales/hash). NUNCA datos comerciales privados.';

comment on view public.dpp_tracking_events_public_view is
  'Vista filtrado positivo · Timeline público para autoridades. Sin device_ip ni device_user_agent.';

comment on function public.is_dpp_authority_role() is
  'Comprueba si el JWT actual tiene un rol autorizado para acceder a las vistas públicas del DPP. Roles inyectados en JWT por Auth Hook del Módulo 2.';

comment on function public.get_dpp_timeline(uuid) is
  'Helper que devuelve el timeline ordenado de un DPP (eventos cronológicos asc). Respeta RLS de dpp_tracking_events.';
