-- Migration: 024_dpp_hubs_h1_schema_only
-- Created: 2026-05-28 (REESCRITA v3: + sub_locode para complejos fragmentados)
-- Purpose: H1.0 mig 024 SOLO SCHEMA - ampliacion dpp_hubs sin INSERTs
--
-- ADR: docs/architecture/0006-catalogo-hubs-dpp-pautas-canonicas.md v1.2
--      Anexo D PROHIBE tier_3 en produccion + protocolo VVJ obligatorio
-- DOC: docs/audit/2026-05-28-hubs-gaps-prioritarios-v1.md
--
-- HISTORIA DE ESTA MIG (3 versiones, esta es la 3ª)
-- -------------------------------------------------
-- v1 (commit 132521e · DESCARTADA): schema + 27 INSERTs incluyendo
--    11 tier_3. Rechazada tras observacion Jose "barco/escrow/pago
--    bloqueado". Archivo eliminado del repo en commit 37d39ae.
-- v2 (commit 37d39ae): schema-only sin INSERTs. Aprobada
--    arquitectonicamente pero detectado al iniciar VVJ que faltaba
--    soporte para complejos portuarios fragmentados (Tokio = 4
--    terminales separados km).
-- v3 (esta · aun sin commit): anade columna sub_locode + UNIQUE
--    compuesto 3-cols + actualiza is_point_in_hub_geofence para
--    iterar sub-hubs del mismo un_locode. Sin INSERTs.
--
-- CONTEXTO ARQUITECTONICO (RAZON DE sub_locode)
-- ---------------------------------------------
-- Algunos puertos del top mundial NO son una unica instalacion sino
-- complejos fragmentados con terminales separados varios km:
--   - JPTYO Tokio: Oi + Aomi + Shinagawa + Tatsumi
--   - USNYC NY/NJ: Port Newark + Elizabeth + Bayonne + Brooklyn +
--     Howland Hook
--   - NLRTM Rotterdam: Maasvlakte 1+2 + Botlek + Waalhaven + Eemhaven
--   - CNSHA Shanghai: Yangshan + Waigaoqiao + Wusong
--   - CNSZX Shenzhen: Yantian + Shekou + Chiwan
--   - KRPUS Busan: BNCT + PNIT + HPNT + PNC
--   - BEANR Antwerp: Deurganck + Europa + Noordzee
--   - Otros que apareceran en B2-B10
--
-- Modelar cada complejo con UNA sola coord seria imposible (centroide
-- caeria en mar abierto · caso JPTYO observado en VVJ tanda 1 #1).
-- Modelar con UN/LOCODE distinto por terminal violaria el estandar
-- ONU (los terminales no tienen UN/LOCODE propio · todos comparten
-- el del puerto raiz).
--
-- Solucion: columna sub_locode text + UNIQUE compuesto
-- (un_locode, hub_type, sub_locode) con NULLS NOT DISTINCT. Esto
-- permite:
--   - Hubs simples: 1 fila con sub_locode=NULL (Valencia, Barcelona,
--     Algeciras, etc.)
--   - Hubs fragmentados: N filas con sub_locode='OI'/'AO'/etc.
--     compartiendo un_locode='JPTYO' base
--
-- La funcion is_point_in_hub_geofence se actualiza con bool_or() para
-- devolver TRUE si el GPS cae en CUALQUIERA de los sub-hubs del
-- mismo un_locode.
--
-- CONTENIDO DE ESTA MIG
-- ---------------------
--   1. ALTER TYPE dpp_hub_type ADD VALUE (3 nuevos · Anexo A.1 ADR)
--   2. ALTER TABLE dpp_hubs ADD COLUMN (11 nuevas columnas · Pauta 4
--      ADR + sub_locode para fragmentacion)
--   3. DROP UNIQUE simple un_locode + CREATE UNIQUE compuesto 3-cols
--      (un_locode, hub_type, sub_locode) NULLS NOT DISTINCT
--   4. UNIQUE iata_code + UNIQUE icao_code (parciales)
--   5. CREATE OR REPLACE FUNCTION is_point_in_hub_geofence con
--      bool_or() para iterar sub-hubs del mismo un_locode
--   6. NO HAY INSERTs · cero hubs nuevos · NO afecta 20 filas mig 022
--
-- IMPACTO SOBRE LAS 20 FILAS EXISTENTES (mig 022)
-- -----------------------------------------------
--   - sub_locode: NULL (todas las 20 actuales son hubs simples)
--   - source_quality: NULL → debe poblarse en H1.5 tras VVJ
--   - source_url / source_verified_date: NULL idem
--   - iata_code: NULL salvo ESMAD (Madrid Barajas) que sera 'MAD' en
--     mig posterior tras VVJ aero
--   - icao_code: idem 'LEMD' para ESMAD
--
-- NOTA POSTGRES SOBRE NULLS NOT DISTINCT
-- --------------------------------------
-- Postgres 15+ soporta `UNIQUE NULLS NOT DISTINCT` que trata NULL
-- como valor igual entre si (en lugar de la semantica SQL estandar
-- donde NULL nunca es igual a NULL). Esto evita el riesgo de
-- insertar dos filas (JPVLC, puerto_maritimo, NULL) duplicadas.
-- Supabase usa Postgres 15+ por defecto → OK.
--
-- NOTA POSTGRES SOBRE ALTER TYPE ADD VALUE
-- ----------------------------------------
-- ALTER TYPE ADD VALUE IF NOT EXISTS como statement independiente.
-- Supabase Dashboard SQL Editor usa autocommit por defecto · OK.
--
-- IDEMPOTENCIA
-- ------------
-- Todas las operaciones son idempotentes (IF NOT EXISTS / IF EXISTS).
--
-- COMO APLICAR (NO se aplica todavia · pendiente OK Jose v3)
-- -----------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Borrar editor (Ctrl+A, Delete)
--   3. Pegar este archivo entero (Ctrl+V)
--   4. Run (Ctrl+Enter)
--   5. Esperar "Success. No rows returned."
--   6. Verificar:
--        select count(*) from public.dpp_hubs;
--          -- debe seguir devolviendo 20 (mig 022 intacto)
--        select unnest(enum_range(null::public.dpp_hub_type));
--          -- debe incluir puerto_fluvial, puerto_especializado, puerto_seco_icd
--        select column_name from information_schema.columns
--          where table_name = 'dpp_hubs' and table_schema = 'public'
--          order by column_name;
--          -- debe incluir las 11 nuevas (sub_locode + 10 mas)

-- ============================================================
-- 1. ALTER TYPE dpp_hub_type ADD VALUE
-- ============================================================

alter type public.dpp_hub_type add value if not exists 'puerto_fluvial';
alter type public.dpp_hub_type add value if not exists 'puerto_especializado';
alter type public.dpp_hub_type add value if not exists 'puerto_seco_icd';

-- ============================================================
-- 2. ALTER TABLE dpp_hubs ADD COLUMN (Pauta 4 ADR + sub_locode)
-- ============================================================

alter table public.dpp_hubs
  add column if not exists sub_locode text check (sub_locode is null or sub_locode ~ '^[A-Z0-9]{1,5}$'),
  add column if not exists iata_code text,
  add column if not exists icao_code text,
  add column if not exists teu_annual integer,
  add column if not exists cargo_tons_annual integer,
  add column if not exists strategic_chokepoint boolean not null default false,
  add column if not exists source_url text,
  add column if not exists source_verified_date date,
  add column if not exists source_quality text check (source_quality in ('tier_1', 'tier_2', 'tier_3')),
  add column if not exists fragmented_complex boolean not null default false,
  add column if not exists complex_root_locode text;

comment on column public.dpp_hubs.sub_locode is
  'DPP Modulo 2 - Identificador opcional del terminal dentro de un complejo portuario fragmentado (Tokio Oi/Aomi/Shinagawa/Tatsumi, Rotterdam Maasvlakte/Botlek, etc.). NULL para hubs simples. Codigo ASCII mayusculas+digitos 1-5 chars.';
comment on column public.dpp_hubs.iata_code is
  'DPP Modulo 2 - Codigo IATA 3 letras del aeropuerto (NULL si no aero).';
comment on column public.dpp_hubs.icao_code is
  'DPP Modulo 2 - Codigo ICAO 4 letras del aeropuerto (NULL si no aero).';
comment on column public.dpp_hubs.teu_annual is
  'DPP Modulo 2 - Volumen anual TEU contenedor (NULL si no aplica).';
comment on column public.dpp_hubs.cargo_tons_annual is
  'DPP Modulo 2 - Volumen anual carga toneladas (NULL si no aplica).';
comment on column public.dpp_hubs.strategic_chokepoint is
  'DPP Modulo 2 - true si hub esta en chokepoint geopolitico critico (Suez/Panama/Gibraltar/Bosforo/Malaca/Hormuz/Bab-el-Mandeb/Magallanes).';
comment on column public.dpp_hubs.source_url is
  'DPP Modulo 2 - URL trazable de la fuente oficial usada para coord (Pauta 6 ADR 0006).';
comment on column public.dpp_hubs.source_verified_date is
  'DPP Modulo 2 - Fecha (YYYY-MM-DD) en que se verifico la coord contra source_url Y se valido visualmente contra recinto real (Anexo D ADR · VVJ bloqueante produccion).';
comment on column public.dpp_hubs.source_quality is
  'DPP Modulo 2 - tier_1 = coord oficial AP/aeropuerto explicita + VVJ | tier_2 = CEFACT/OurAirports/OSM polygon claro + VVJ | tier_3 = aproximacion sin VVJ · PROHIBIDO produccion Anexo D ADR.';
comment on column public.dpp_hubs.fragmented_complex is
  'DPP Modulo 2 - true si hub es parte de un complejo portuario fragmentado modelado como N sub-hubs con mismo un_locode + sub_locode distinto.';
comment on column public.dpp_hubs.complex_root_locode is
  'DPP Modulo 2 - DEPRECATED (sub_locode lo reemplaza). Se mantiene en schema para forward-compat. NULL para todos los hubs.';

-- ============================================================
-- 3. UNIQUE compuesto 3-cols (un_locode, hub_type, sub_locode)
--    con NULLS NOT DISTINCT
-- ============================================================
-- Permite:
--   - 1 fila Valencia puerto: (ESVLC, puerto_maritimo, NULL)
--   - 1 fila Barcelona aero: (ESBCN, aeropuerto_carga, NULL) [futuro]
--   - 1 fila Barcelona puerto: (ESBCN, puerto_maritimo, NULL)
--     [ya existe en mig 022 · 2 filas Barcelona OK por hub_type distinto]
--   - 4 filas Tokio: (JPTYO, puerto_maritimo, 'OI'), (JPTYO, puerto_maritimo, 'AO'),
--     (JPTYO, puerto_maritimo, 'SH'), (JPTYO, puerto_maritimo, 'TA')
--
-- NULLS NOT DISTINCT (Postgres 15+) evita que dos (JPTYO, puerto, NULL)
-- pudieran coexistir (que es el bug que queremos prevenir).

alter table public.dpp_hubs
  drop constraint if exists dpp_hubs_un_locode_key;

drop index if exists public.dpp_hubs_unique_locode_type_idx;

create unique index if not exists dpp_hubs_unique_locode_type_sub_idx
  on public.dpp_hubs (un_locode, hub_type, sub_locode)
  nulls not distinct;

-- ============================================================
-- 4. UNIQUE parcial iata_code + icao_code
-- ============================================================

create unique index if not exists dpp_hubs_unique_iata_idx
  on public.dpp_hubs (iata_code)
  where iata_code is not null;

create unique index if not exists dpp_hubs_unique_icao_idx
  on public.dpp_hubs (icao_code)
  where icao_code is not null;

-- ============================================================
-- 5. Funcion is_point_in_hub_geofence actualizada para sub-hubs
-- ============================================================
-- Original (mig 022 §4): SELECT con LIMIT 1 sobre la unica fila del
-- un_locode dado. Devuelve true/false si esa unica fila cumple.
--
-- Nueva (esta mig): SELECT con bool_or() sobre TODAS las filas del
-- un_locode (que pueden ser N si es complejo fragmentado con sub_locode).
-- Devuelve true si CUALQUIERA de los sub-hubs cumple geofence.
--
-- Garantia: para hubs simples (1 fila con sub_locode=NULL), bool_or()
-- sobre 1 fila devuelve el mismo resultado que la version original.
-- Backwards-compatible 100%.
--
-- TODO H1.5: anadir filtro `coalesce(h.source_quality, '') in
-- ('tier_1', 'tier_2')` para defensa-en-profundidad Anexo D §D.6.
-- Hoy no se anade porque las 20 filas mig 022 tienen source_quality=NULL
-- y rompperia funcionalidad existente. Se anade en mig posterior tras
-- que H1.5 haya poblado source_quality en las 20 actuales.

create or replace function public.is_point_in_hub_geofence(
  p_un_locode text,
  p_lat numeric,
  p_lng numeric
)
returns boolean
language sql
stable
parallel safe
as $body$
  select coalesce(
    (
      select bool_or(
        public.haversine_distance_m(h.coordinates_lat, h.coordinates_lng, p_lat, p_lng) <= h.geofence_radius_m
      )
      from public.dpp_hubs h
      where h.un_locode = p_un_locode
        and h.is_active = true
    ),
    false
  );
$body$;

comment on function public.is_point_in_hub_geofence(text, numeric, numeric) is
  'DPP Modulo 2 - Valida si un punto GPS esta dentro del radio geofence de ALGUNO de los sub-hubs del hub UN/LOCODE dado. Soporta complejos portuarios fragmentados (mig 024 v3). TODO mig posterior: anadir filtro source_quality IN (tier_1, tier_2) defensa-en-profundidad Anexo D §D.6.';

grant execute on function public.is_point_in_hub_geofence(text, numeric, numeric) to authenticated, service_role;

-- ============================================================
-- 6. Comentarios indices
-- ============================================================
comment on index public.dpp_hubs_unique_locode_type_sub_idx is
  'DPP Modulo 2 H1.0 mig 024 v3 - UNIQUE 3-cols (un_locode, hub_type, sub_locode) NULLS NOT DISTINCT. Permite complejos portuarios fragmentados (Tokio Oi/Aomi/Shinagawa/Tatsumi) + puerto+aero misma ciudad como filas distintas.';

comment on index public.dpp_hubs_unique_iata_idx is
  'DPP Modulo 2 H1.0 mig 024 v3 - UNIQUE parcial sobre iata_code para aeropuertos (NULL en puertos).';

comment on index public.dpp_hubs_unique_icao_idx is
  'DPP Modulo 2 H1.0 mig 024 v3 - UNIQUE parcial sobre icao_code para aeropuertos (NULL en puertos).';

-- Fin mig 024 v3 schema-only.
-- Proximos pasos (NO en esta mig):
--   - VVJ tanda 1 Jose: 4 sub-hubs JPTYO (Oi/Aomi/Shinagawa/Tatsumi) +
--     4 simples JPOSA/JPUKB/JPNGO/JPHKT = 8 validaciones visuales.
--   - Mig 025 (datos): INSERT de los hubs que pasen VVJ con
--     source_quality=tier_1, fragmented_complex=true para JPTYO sub-hubs.
