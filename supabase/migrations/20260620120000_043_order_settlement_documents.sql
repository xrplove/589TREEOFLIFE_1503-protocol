-- Migration: 043_order_settlement_documents
-- ─────────────────────────────────────────────────────────────────────────────
-- Paso 2 del conector: persistir el RESULTADO DEL PAGO (liquidación del 0,5%,
-- SIMULADA · verify-on-ledger) y los DOCUMENTOS de comercio adjuntos al pedido.
--
-- CANON: 1503 NO custodia. `order_settlements` es el REGISTRO de la liquidación
-- (no mueve dinero); `simulated`=true y `verified_on_ledger`=false hasta que se
-- cablee XRPL testnet (paso 5). RLS CERRADA: solo las PARTES del pedido leen;
-- nadie escribe desde el cliente (solo service_role / RPC). PII fuera (datos de
-- comercio, no personales).
--
-- IDEMPOTENTE: CREATE TABLE IF NOT EXISTS · DROP POLICY IF EXISTS.
-- COMO APLICAR: dashboard SQL (convención del proyecto) o MCP apply_migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- 1 · order_settlements — registro de liquidación (0,5% · simulado)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.order_settlements (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  gross               numeric(14,4) not null check (gross >= 0),
  currency            text not null check (currency ~ '^[A-Z]{3}$'),
  modality            text not null,
  fee_1503            numeric(14,4) not null check (fee_1503 >= 0),
  net_to_seller       numeric(14,4) not null check (net_to_seller >= 0),
  rail                text not null,
  status              text not null,
  ledger_ref          text,
  verified_on_ledger  boolean not null default false,
  simulated           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index if not exists order_settlements_order_idx on public.order_settlements (order_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2 · order_documents — documentos de comercio adjuntos (factura/packing/seguro/DUA)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.order_documents (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  doc_type    text not null check (doc_type in (
    'commercial_invoice', 'packing_list', 'insurance_certificate', 'dua_sad'
  )),
  reference   text not null,
  payload     jsonb not null,
  demo        boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists order_documents_order_idx on public.order_documents (order_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3 · RLS CERRADA · solo las partes del pedido LEEN · nadie escribe desde cliente
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.order_settlements enable row level security;
alter table public.order_documents   enable row level security;

drop policy if exists order_settlements_select_parties on public.order_settlements;
create policy order_settlements_select_parties on public.order_settlements
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_settlements.order_id
        and (auth.uid() = o.buyer_user_id or auth.uid() = o.seller_user_id)
    )
  );

drop policy if exists order_documents_select_parties on public.order_documents;
create policy order_documents_select_parties on public.order_documents
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_documents.order_id
        and (auth.uid() = o.buyer_user_id or auth.uid() = o.seller_user_id)
    )
  );

-- Sin policies de INSERT/UPDATE/DELETE: la escritura ocurre SOLO server-side
-- (service_role, que bypassa RLS). El cliente no puede crear/alterar liquidaciones
-- ni documentos. Defensa en profundidad (canon).

comment on table public.order_settlements is
  'Registro de liquidacion del 0,5% del hub 1503 (SIMULADO · verify-on-ledger). 1503 NO custodia: este registro no mueve dinero. RLS: solo las partes del pedido leen.';
comment on table public.order_documents is
  'Documentos de comercio (factura/packing/seguro/DUA) adjuntos al pedido. payload jsonb. demo=true en pruebas. RLS: solo las partes del pedido leen.';
