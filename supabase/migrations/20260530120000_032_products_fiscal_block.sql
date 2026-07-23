-- Migration: 032_products_fiscal_block
-- Created: 2026-05-30
-- Purpose: Completar la persistencia de la ficha en `products` con 2 columnas
--          jsonb: `sector_data` (campos específicos del sector + sub_categoria)
--          y `fiscal` (bloque fiscal transversal IVA + facturación + comercio
--          intracom/global · FiscalInvoicingData de _fiscal.ts). Habilita el
--          write-path server-side con gate de cumplimiento (POST /api/products).
--
-- CONTEXTO
-- --------
-- La Capa fiscal transversal (commit feat(fiscal)) añadió el bloque opcional
-- `fiscal?` a `UniversalProduct` y el enforcement `validateFiscalCompliance`
-- fusionado en `validateSectorCompliance`. Esta migración da a ese bloque un
-- lugar donde vivir en la BD, completando la ruta crítica para que el
-- cumplimiento fiscal sea efectivo "a falta de supervisión".
--
-- Contenido del bloque (resumen · ver _fiscal.ts para el schema completo):
--   · vat_number_seller / vat_number_buyer (+ resultados VIES cacheados)
--   · operacion_tipo · regimen_iva · lugar_realizacion · reverse_charge
--   · modelo_349_clave (declaración recapitulativa ES)
--   · oss_ioss (ventanilla única B2C)
--   · einvoice (ViDA EN 16931 / Facturae / Verifactu) + factura_b2b_obligatoria_es
--
-- CUMPLIMIENTO RGPD (canon hard rule · CLAUDE.md §1)
-- -------------------------------------------------
-- El NIF-IVA de una EMPRESA no es dato personal, pero el de un AUTÓNOMO sí
-- (derivado de su DNI). Por tanto el bloque `fiscal` se considera potencialmente
-- PII y queda sujeto a:
--   · PII OFF-CHAIN SIEMPRE: el bloque `fiscal` NUNCA se ancla en XDC/blockchain.
--     Si la ficha se ancla on-chain, solo viaja el hash SHA-256 del payload
--     canónico (que puede excluir o incluir el fiscal según política de hashing),
--     nunca el NIF en claro.
--   · Derecho al olvido (Art. 17): la columna vive en `products`, que ya tiene
--     cascade FK `owner_user_id → auth.users(id) on delete cascade` (mig 028).
--     Al borrar el usuario, sus productos y su bloque fiscal se borran.
--   · RLS: hereda la RLS de `products` (select own-or-published / insert-update
--     own / sin delete). El filtrado POSITIVO de campos para vistas públicas
--     (no exponer NIF del comprador/vendedor a terceros) se aplica server-side
--     en el endpoint/vista pública, NO por exclusión.
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS (no rompe si se re-aplica).

-- ============================================================================
-- Columna sector_data jsonb · payload específico del sector
-- ============================================================================
-- La tabla `products` (mig 028) materializa la capa COMERCIAL/universal. Los
-- campos ESPECÍFICOS de cada sector (composición textil · RoHS electrónica ·
-- NRA turismo · homologación vehículo · etc.) más el discriminador
-- `sub_categoria` viven aquí como jsonb, validados server-side por el schema
-- sectorial (Zod) + la Capa 2 de cumplimiento antes de persistir.
alter table public.products
  add column if not exists sector_data jsonb;

alter table public.products
  drop constraint if exists products_sector_data_has_subcat;
alter table public.products
  add constraint products_sector_data_has_subcat
  check (
    sector_data is null
    or (
      jsonb_typeof(sector_data) = 'object'
      and (sector_data ? 'sub_categoria')
      and jsonb_typeof(sector_data -> 'sub_categoria') = 'string'
    )
  );

create index if not exists products_sector_data_subcat_idx
  on public.products ((sector_data ->> 'sub_categoria'))
  where sector_data is not null;

comment on column public.products.sector_data is
  'Payload específico del sector (campos no universales + sub_categoria). '
  'Validado server-side por el schema sectorial + Capa 2 (validateSectorCompliance) '
  'antes de persistir. PII sectorial (si la hubiera) off-chain · solo hash on-chain.';

-- ============================================================================
-- Columna fiscal jsonb
-- ============================================================================

alter table public.products
  add column if not exists fiscal jsonb;

-- Coherencia mínima a nivel BD: si está presente, debe ser un objeto JSON con
-- `operacion_tipo` (campo obligatorio del bloque · resto valida la Capa 2 +
-- Zod server-side). El enum completo se valida en _fiscal.ts (no se duplica el
-- enum en SQL para no desincronizar · principio interfaces extensibles ADR 0011).
alter table public.products
  drop constraint if exists products_fiscal_is_object;
alter table public.products
  add constraint products_fiscal_is_object
  check (
    fiscal is null
    or (
      jsonb_typeof(fiscal) = 'object'
      and (fiscal ? 'operacion_tipo')
      and jsonb_typeof(fiscal -> 'operacion_tipo') = 'string'
    )
  );

-- Índice de faceta para filtrar por tipo de operación fiscal (informes IVA ·
-- modelo 349 · operaciones intracom). Expresión inmutable sobre jsonb.
create index if not exists products_fiscal_operacion_tipo_idx
  on public.products ((fiscal ->> 'operacion_tipo'))
  where fiscal is not null;

comment on column public.products.fiscal is
  'Bloque fiscal transversal (FiscalInvoicingData · _fiscal.ts): IVA + '
  'facturación + comercio intracom/global. PII OFF-CHAIN: el NIF-IVA de '
  'autónomo es dato personal · este bloque NUNCA se ancla on-chain (solo hash '
  'SHA-256). Filtrado positivo de campos en vistas públicas (no exponer NIF de '
  'terceros). Enforcement: validateFiscalCompliance + FiscalInvoicingDataSchema.';
