-- Migration: 038_orders_order_lines
-- Created: 2026-06-04
-- Purpose: Pedido maestro (orders) + líneas (order_lines) para el test mínimo
--          fábrica→transitario. Persiste el "Pedido Vivo" (hoy solo UI React) y
--          conecta producto/DPP con la cadena de custodia (dpp_custody_chain, mig 028).
--
-- CONTEXTO (sesión 4-jun · marca 1503)
-- ------------------------------------
-- 1503 = capa de cumplimiento / trazabilidad / confianza ("la Casa de Contratación
-- digital"), NO un marketplace. El pedido es el registro maestro COMERCIAL; la
-- trazabilidad física firmada vive en dpp_custody_chain + dpp_state_transitions
-- (mig 028, append-only). El pedido lleva el corredor (origin→destination) que
-- alimenta el motor de cumplimiento (app/data/tradeCompliance.ts · Capa 1 EXIT UE)
-- vía /api/trade-compliance/analyze.
--
-- ALCANCE / NO-ALCANCE (decisiones canónicas 4-jun)
-- -------------------------------------------------
-- - SÍ: pedido + líneas + estado + corredor + audit.
-- - NO (aparcado): pagos / escrow / RLUSD / XDC. 1503 es NO CUSTODIAL: verifica y
--   registra que la liquidación ocurrió (leyendo el ledger XRPL), NO mueve ni
--   custodia dinero (esquiva MiCA/PSD2/EMI). El cobro (suscripción / 0,5% de
--   certificación) se factura APARTE (TPV/Stripe), nunca desde el flujo. Por eso
--   esta migración NO crea columnas de importe-en-custodia ni integración de pago:
--   `total_amount` es INFORMATIVO. La firma multiparte (3/3) de la entrega vive
--   como ATESTACIÓN en dpp_signatures (signature_purpose='multi_sig_quorum') +
--   dpp_custody_chain (mig 028), no como autorización de liberación de fondos.
--
-- RLS (cerrada por defecto · canon ~/.claude/CLAUDE.md §1)
-- -------------------------------------------------------
-- - SELECT: solo comprador o vendedor del pedido.
-- - INSERT/UPDATE/DELETE: ninguna policy de cliente → solo API server-side con
--   service_role (valida sesión + KYC + gate de cumplimiento). DELETE bloqueado;
--   cascade FK desde auth.users sí borra (GDPR Art. 17 prevalece).
--
-- IDEMPOTENCIA: CREATE TABLE IF NOT EXISTS · DROP POLICY IF EXISTS · DO blocks.
-- Reaplicable sin error.
--
-- ESTADO: APLICADA a la BD viva (proyecto sqsjmmybzokcwurgruaw) el 2026-06-04
--         vía MCP apply_migration (luz verde explícita de José esta sesión).
--         Verificado: orders/order_lines con RLS + 1 policy SELECT cada una · 0 advisors nuevos.
--
-- COMO APLICAR (canal histórico · MANUAL DESDE DASHBOARD · feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero · Run (Ctrl+Enter)
--   3. Esperar "Success. No rows returned."
--   4. Verificar en Table Editor: existen `orders` y `order_lines` con RLS activa.
--
-- PRECONDICIONES
-- --------------
-- - mig 001 (actors) · mig 028 (products · dpp_registry · dpp_custody_chain).
-- - auth.users (Supabase Auth) · gen_random_uuid() (pgcrypto · default Supabase).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · TABLA `orders` (pedido maestro · registro comercial)
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),

  -- ──────────────── PARTES ────────────────
  -- Comprador y vendedor (el vendedor es el fabricante en el test fábrica→transitario).
  -- Ambos son usuarios KYC-approved (validado server-side en la API).
  buyer_user_id         uuid not null references auth.users(id) on delete cascade,
  seller_user_id        uuid not null references auth.users(id) on delete cascade,

  -- ──────────────── ESTADO ────────────────
  -- Estado del pedido maestro. La cadena de custodia detallada y firmada
  -- (manufacturer→freight_forwarder→…→consignee) vive en dpp_custody_chain (mig 028).
  status                text not null default 'draft' check (status in (
    'draft',                                   -- en preparación
    'confirmed',                               -- confirmado por las partes · ficha(s) con gate OK
    'in_transit',                              -- entregado a transitario · custodia en curso
    'delivered',                               -- entrega firmada por el consignatario (3/3 atestación)
    'closed',                                  -- cerrado (cumplimiento + entrega completos)
    'cancelled'                                -- cancelado
  )),

  -- ──────────────── CORREDOR (alimenta el motor de cumplimiento) ────────────────
  origin_country        text check (origin_country is null or origin_country ~ '^[A-Z]{2}$'),
  destination_country   text check (destination_country is null or destination_country ~ '^[A-Z]{2}$'),

  -- Incoterm 2020 ICC (opcional · se fija al confirmar · mismo enum que dpp_registry).
  incoterm              text check (incoterm is null or incoterm in (
    'EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'
  )),

  -- ──────────────── IMPORTE (INFORMATIVO · NO custodial) ────────────────
  -- 1503 NO mueve dinero (ver cabecera). Este importe es referencia comercial;
  -- el cobro real se factura aparte y la liquidación RLUSD se VERIFICA, no se custodia.
  total_amount          numeric(14,4) check (total_amount is null or total_amount >= 0),
  currency              text default 'EUR' check (currency is null or currency ~ '^[A-Z]{3}$'),

  notes                 text,

  -- ──────────────── AUDIT ────────────────
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id) on delete set null,
  updated_by            uuid references auth.users(id) on delete set null,

  -- Comprador y vendedor no pueden ser el mismo usuario.
  constraint orders_distinct_parties check (buyer_user_id <> seller_user_id)
);

create index if not exists orders_buyer_idx   on public.orders (buyer_user_id);
create index if not exists orders_seller_idx  on public.orders (seller_user_id);
create index if not exists orders_status_idx  on public.orders (status);

-- Trigger touch updated_at (mismo patrón que products · mig 028 §1).
create or replace function public.touch_orders_updated_at()
returns trigger
language plpgsql
set search_path = ''                           -- hardening (mig 035) · evita function_search_path_mutable
as $body$
begin
  new.updated_at := now();
  return new;
end;
$body$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_orders_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · TABLA `order_lines` (líneas del pedido)
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.order_lines (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete cascade,

  -- Producto y DPP asociados. on delete set null: si el producto/DPP se borra
  -- (p.ej. cascade GDPR del owner), la línea SOBREVIVE con el snapshot mínimo.
  product_id            uuid references public.products(id) on delete set null,
  dpp_registry_id       uuid references public.dpp_registry(id) on delete set null,

  -- Snapshot mínimo (preserva la línea aunque el producto desaparezca).
  sku_snapshot          text check (sku_snapshot is null or char_length(sku_snapshot) between 1 and 64),
  title_snapshot        jsonb,

  -- Cantidad (numeric para permitir unidades fraccionables · m², kg, etc.).
  quantity              numeric(14,4) not null check (quantity > 0),
  unit_price            numeric(14,4) check (unit_price is null or unit_price >= 0),

  created_at            timestamptz not null default now()
);

create index if not exists order_lines_order_idx    on public.order_lines (order_id);
create index if not exists order_lines_product_idx  on public.order_lines (product_id)      where product_id is not null;
create index if not exists order_lines_dpp_idx      on public.order_lines (dpp_registry_id) where dpp_registry_id is not null;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · RLS (cerrada por defecto)
-- ═════════════════════════════════════════════════════════════════════════════

-- ──────────── RLS `orders` ────────────
alter table public.orders enable row level security;

drop policy if exists "orders_select_participant" on public.orders;
create policy "orders_select_participant"
  on public.orders
  for select
  using (auth.uid() = buyer_user_id or auth.uid() = seller_user_id);

-- INSERT/UPDATE: ninguna policy de cliente → solo API server-side con service_role
-- (valida sesión + KYC + gate). DELETE: ninguna policy → bloqueado; cascade FK
-- desde auth.users sí borra (GDPR Art. 17).

-- ──────────── RLS `order_lines` ────────────
alter table public.order_lines enable row level security;

drop policy if exists "order_lines_select_participant" on public.order_lines;
create policy "order_lines_select_participant"
  on public.order_lines
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_lines.order_id
        and (o.buyer_user_id = auth.uid() or o.seller_user_id = auth.uid())
    )
  );

-- INSERT/UPDATE/DELETE: ninguna policy de cliente → solo API server-side service_role.

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · COMMENTS (auto-documentación)
-- ═════════════════════════════════════════════════════════════════════════════

comment on table public.orders is
  'Pedido maestro (registro comercial) para el test fábrica→transitario (marca 1503). 1503 es capa de cumplimiento NO marketplace: el pedido envuelve la operación; la trazabilidad física firmada vive en dpp_custody_chain + dpp_state_transitions (mig 028, append-only). NO custodial: sin pagos/escrow aquí · total_amount es informativo · la liquidación RLUSD se VERIFICA leyendo el ledger XRPL, no se custodia.';

comment on column public.orders.status is
  'Estado del pedido maestro. La cadena de custodia detallada (manufacturer→freight_forwarder→carrier→customs→consignee) vive en dpp_custody_chain. in_transit = entregado a transitario · delivered = firma del consignatario (parte de la atestación multiparte 3/3 · dpp_signatures multi_sig_quorum).';

comment on column public.orders.origin_country is
  'País de origen del corredor (ISO 3166-1 alpha-2). Alimenta el motor de cumplimiento (app/data/tradeCompliance.ts · Capa 1 EXIT UE) en /api/trade-compliance/analyze.';

comment on table public.order_lines is
  'Líneas del pedido. product_id/dpp_registry_id on delete set null + snapshot (sku/title) para que la línea sobreviva a un cascade GDPR del producto.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN MIGRACIÓN 038
-- ─────────────────────────────────────────────────────────────────────────────
-- Tablas nuevas:
--   - public.orders        (pedido maestro · RLS select participante)
--   - public.order_lines   (líneas · RLS select participante)
-- NO append-only (estado mutable); la auditoría física firmada vive en las tablas
-- append-only de mig 028 (dpp_custody_chain · dpp_state_transitions · dpp_signatures).
