-- Migration: 042_dpp_data_carrier
-- Created: 2026-06-07
-- Purpose: DPP · rodaja 2 de integración de estándares (ADR 0023).
--          Portador de datos (data carrier) + identidad a nivel de ÍTEM.
--
-- BASE LEGAL / ESTÁNDAR
-- --------------------
--   - Reg. UE 2024/1781 (ESPR) Art. 9-13 · portador de datos + identificador único.
--   - CEN/CENELEC prEN 18220 (data carriers / vínculo físico↔digital · JTC 24 · M/604).
--   - GS1 Digital Link · patrón de URI RECOMENDADO por ESPR para el portador.
--
-- QUÉ AÑADE (idempotente · ADD COLUMN IF NOT EXISTS)
-- --------------------------------------------------
-- Sobre `public.dpp_registry` (esquema vigente tras la mig 028 v1.1, donde
-- `gtin`/`product_sku`/`product_name` viven YA en `public.products` y el DPP se
-- enlaza por FK `dpp_registry.product_id`):
--
--   1. `serial_number`    — nº de serie (GS1 AI 21). Su PRESENCIA distingue la
--                           granularidad del pasaporte:
--                             · NULL  → pasaporte a NIVEL DE MODELO (p.ej. textil).
--                             · valor → pasaporte a NIVEL DE ÍTEM  (obligatorio p.ej.
--                               baterías · Reg. 2023/1542 desde 18-feb-2027).
--   2. `data_carrier_uri` — el URI acuñado (GS1 Digital Link si el `products.gtin`
--                           enlazado existe; si no, URI interino resoluble por el
--                           resolver propio de 1503: `{resolver}/dpp/{id}`). Es lo
--                           que se imprime como QR. Se acuña en cliente/Edge con
--                           `app/lib/dppDataCarrier.ts` (mismo orden canónico que
--                           la librería testeada `gs1DigitalLink.ts`).
--   3. `data_carrier_minted_at` — sello temporal de acuñación.
--
-- IDENTIFICADOR ÚNICO DEL PASAPORTE (dpp_uid)
-- -------------------------------------------
-- NO se añade columna nueva: el `dpp_registry.id` (uuid v4) YA es el identificador
-- único estable del pasaporte. Para PYME sin GTIN, ese `id` es la clave del URI
-- interino, hasta que el acto de ejecución del Registro UE (esperado jun-2026)
-- defina su propio esquema de identificador (rodaja 5 · ADR 0023).
--
-- INMUTABILIDAD
-- -------------
-- `data_carrier_uri` forma parte de la identidad del pasaporte: una vez anclado
-- on-chain (`onchain_tx_hash` no nulo) NO debe cambiar. La política RLS de
-- `dpp_registry` (mig 019 §6) ya impide UPDATE del owner tras el anclaje; el
-- filtrado positivo de campos al UPDATE se refuerza en la API server-side.
--
-- COMO APLICAR (MANUAL DESDE DASHBOARD · feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Run (Ctrl + Enter) → "Success. No rows returned."
--   4. Verificar en Table Editor que `dpp_registry` tiene serial_number,
--      data_carrier_uri y data_carrier_minted_at.
--
-- PRECONDICIONES
-- --------------
-- - Migración 019 (dpp_registry) y 028 (refactor v1.1) aplicadas.

alter table public.dpp_registry
  add column if not exists serial_number           text,
  add column if not exists data_carrier_uri        text,
  add column if not exists data_carrier_minted_at  timestamptz;

-- Validación de formato del portador: debe ser una URL http(s) si está presente.
do $body$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dpp_registry_data_carrier_uri_https'
  ) then
    alter table public.dpp_registry
      add constraint dpp_registry_data_carrier_uri_https
      check (data_carrier_uri is null or data_carrier_uri ~ '^https?://');
  end if;
end $body$;

-- Índice para resolver por nº de serie (búsqueda a nivel de ítem · baterías).
create index if not exists dpp_registry_serial_idx
  on public.dpp_registry (serial_number) where serial_number is not null;

-- Índice para resolver el portador → pasaporte (lo usará el resolver de la
-- rodaja 3). No unique: la unicidad efectiva la garantiza el `id`/GTIN+serie a
-- la hora de acuñar (lógica de `mintDppDataCarrier`).
create index if not exists dpp_registry_data_carrier_idx
  on public.dpp_registry (data_carrier_uri) where data_carrier_uri is not null;

-- Auto-documentación.
comment on column public.dpp_registry.serial_number is
  'GS1 AI 21 · nº de serie. NULL = pasaporte a nivel de modelo; valor = a nivel de ítem (obligatorio p.ej. baterías Reg. 2023/1542).';
comment on column public.dpp_registry.data_carrier_uri is
  'Portador de datos del DPP (GS1 Digital Link si hay GTIN; si no, URI interino {resolver}/dpp/{id}). Es el contenido del QR. Acuñado con app/lib/dppDataCarrier.ts. Inmutable tras anclaje on-chain.';
comment on column public.dpp_registry.data_carrier_minted_at is
  'Sello temporal de acuñación del data_carrier_uri.';
