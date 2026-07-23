-- Migration: 044_escrow_contracts
-- Created: 2026-06-21
-- Purpose: Contratos de ESCROW on-ledger (XRPL) por tramo de un pedido + su bitácora
--          append-only. Soporte del PoC de pago en TESTNET (escrow + oráculo + splits
--          + credencial), spec en docs/architecture/2026-06-21-spec-escrow-oraculo-
--          credencial-testnet.md.
--
-- PRINCIPIO NO-CUSTODIAL (clave · canon)
-- --------------------------------------
-- Aquí SOLO viven direcciones PÚBLICAS de XRPL y hashes. NUNCA llaves privadas.
-- El dinero va comprador → escrow → vendedor; 1503 nunca lo toca. La columna
-- `cancel_after` es el BACKSTOP: si 1503 (oráculo) no libera, el escrow expira y
-- los fondos vuelven al comprador → 1503 no puede secuestrar fondos.
--
-- APPEND-ONLY (patrón canónico mig 028/040)
-- -----------------------------------------
-- escrow_events: triggers no_update/no_delete con reject_append_only_mutation()
-- (mig 028 §15) — bloquea UPDATE/DELETE manual; permite el cascade FK (GDPR Art. 17,
-- pg_trigger_depth() > 1). El cascade GDPR llega vía escrow_contracts → orders → auth.users.
--
-- RLS (cerrada por defecto): SELECT solo participantes del pedido (comprador/vendedor).
-- Sin policy de escritura de cliente → solo el canal server-side (service_role) inserta,
-- tras verificar contra el ledger / la custodia.
--
-- ESTADO: NO APLICADA · pendiente de revisión de José (no se aplica hasta su luz verde).
--
-- PRECONDICIONES: mig 038 (orders) · mig 043 (order_settlements) · mig 028
--                 (reject_append_only_mutation) · mig 019 (dpp_registry).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1 · TABLA escrow_contracts (un tramo de escrow on-ledger por pedido)
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.escrow_contracts (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  settlement_id     uuid references public.order_settlements(id) on delete set null,

  -- Tramo (splits 30/70, 50/50): un pedido puede tener N tramos; suma de pct = 100%.
  -- Enum CERRADO (decisión José · orden coherente del negocio).
  tranche_label     text not null check (tranche_label in ('deposit','balance','full')),
  pct_bps           int  not null check (pct_bps between 1 and 10000),  -- 3000 = 30%

  -- Importe del tramo + activo (IOU). RLUSD/EURC son issued currencies (necesitan issuer).
  amount            numeric(20,6) not null check (amount > 0),
  asset_code        text not null check (asset_code ~ '^[A-Za-z0-9]{3,40}$'),
  asset_issuer      text,                                 -- emisor del IOU (null si XRP nativo)

  -- Identidades on-ledger (PÚBLICAS · clásicas r... base58). NO son llaves privadas.
  -- El comprador firma el EscrowCreate desde SU ERP; el destino es el vendedor (no 1503).
  buyer_xrpl_addr   text not null check (buyer_xrpl_addr ~ '^r[1-9A-HJ-NP-Za-km-z]{24,34}$'),
  seller_xrpl_addr  text not null check (seller_xrpl_addr ~ '^r[1-9A-HJ-NP-Za-km-z]{24,34}$'),

  -- Lo necesario para EscrowFinish/EscrowCancel del objeto escrow en XRPL.
  offer_sequence    bigint,                               -- Sequence del EscrowCreate
  condition_hex     text check (condition_hex is null or condition_hex ~ '^[0-9A-Fa-f]+$'),
  finish_after      timestamptz,                          -- no liberable antes
  cancel_after      timestamptz not null,                 -- BACKSTOP → vuelve al comprador

  -- Hashes de transacción on-ledger (prueba verificable · 64 hex en XRPL).
  create_tx_hash    text check (create_tx_hash is null or create_tx_hash ~ '^[0-9A-Fa-f]{64}$'),
  finish_tx_hash    text check (finish_tx_hash is null or finish_tx_hash ~ '^[0-9A-Fa-f]{64}$'),
  cancel_tx_hash    text check (cancel_tx_hash is null or cancel_tx_hash ~ '^[0-9A-Fa-f]{64}$'),

  -- Máquina de estados del contrato.
  state             text not null default 'created' check (state in (
    'created',          -- instrucción generada por 1503 (aún no on-ledger)
    'funded',           -- EscrowCreate confirmado on-ledger (comprador bloqueó fondos)
    'oracle_verified',  -- 1503 verificó el hito (custodia 3/3 + docs) → liberable
    'released',         -- EscrowFinish confirmado → fondos al vendedor
    'cancelled',        -- = DEVOLUCIÓN: expiró (cancel_after) → fondos al comprador (decisión José: cubre el reembolso · sin estado 'refunded' aparte)
    'disputed'          -- hito no cumplido / en disputa (antes de resolverse a released o cancelled)
  )),

  -- Vínculo LOGÍSTICO: el hito que el oráculo verifica.
  dpp_id            uuid references public.dpp_registry(id) on delete set null,
  bl_reference      text,                                 -- e-B/L / evidencia de entrega

  -- Credencial XLS-70 de la parte (4ª pieza · "verificada por 1503"). Referencia, no PII.
  credential_ref    text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Coherencia: si hay finish_after, no puede ser posterior al backstop.
  constraint escrow_finish_before_cancel check (finish_after is null or finish_after <= cancel_after)
);

create index if not exists escrow_contracts_order_idx   on public.escrow_contracts (order_id);
create index if not exists escrow_contracts_state_idx    on public.escrow_contracts (state);
create index if not exists escrow_contracts_dpp_idx      on public.escrow_contracts (dpp_id) where dpp_id is not null;

-- updated_at automático (mismo patrón que products/orders · mig 028).
create or replace function public.touch_escrow_contracts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists escrow_contracts_touch_updated_at on public.escrow_contracts;
create trigger escrow_contracts_touch_updated_at
  before update on public.escrow_contracts
  for each row execute function public.touch_escrow_contracts_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2 · TABLA escrow_events (bitácora APPEND-ONLY de transiciones)
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.escrow_events (
  id                 uuid primary key default gen_random_uuid(),
  escrow_id          uuid not null references public.escrow_contracts(id) on delete cascade,

  from_state         text,
  to_state           text not null,

  -- Tx on-ledger que causó la transición (si aplica) + atestación del oráculo.
  tx_hash            text check (tx_hash is null or tx_hash ~ '^[0-9A-Fa-f]{64}$'),
  oracle_attestation text,                                -- p.ej. hash de la custodia 3/3
  note               text,
  created_at         timestamptz not null default now()
);

create index if not exists escrow_events_escrow_idx on public.escrow_events (escrow_id, created_at);

-- APPEND-ONLY: bloquea UPDATE/DELETE manual (permite cascade FK · GDPR).
drop trigger if exists escrow_events_no_update on public.escrow_events;
create trigger escrow_events_no_update
  before update on public.escrow_events
  for each row execute function public.reject_append_only_mutation();

drop trigger if exists escrow_events_no_delete on public.escrow_events;
create trigger escrow_events_no_delete
  before delete on public.escrow_events
  for each row execute function public.reject_append_only_mutation();

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3 · order_settlements: referencia del 0,5% (NUESTRO beneficio)
-- ═════════════════════════════════════════════════════════════════════════════
-- El 0,5% es TASA TECNOLÓGICA de 1503, facturada APARTE (no es un corte del pago).
-- `order_settlements.fee_1503` ya guarda el IMPORTE; aquí añadimos su REFERENCIA de
-- facturación + el estado de cobro, para seguir nuestro beneficio de punta a punta
-- (decisión José · orden coherente del negocio). El fee vive en el settlement (1 por
-- pedido); los escrows lo alcanzan vía `escrow_contracts.settlement_id`.

alter table public.order_settlements
  add column if not exists fee_1503_ref    text,
  add column if not exists fee_1503_status text not null default 'pending'
    check (fee_1503_status in ('pending','invoiced','paid','waived'));
-- 'pending' devengado · 'invoiced' facturado al tenant · 'paid' cobrado · 'waived' sin cargo (local/Redsys).

-- ═════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4 · RLS (cerrada por defecto · SELECT participantes del pedido)
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.escrow_contracts enable row level security;

drop policy if exists "escrow_contracts_select_participant" on public.escrow_contracts;
create policy "escrow_contracts_select_participant"
  on public.escrow_contracts
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = escrow_contracts.order_id
        and (o.buyer_user_id = auth.uid() or o.seller_user_id = auth.uid())
    )
  );
-- INSERT/UPDATE: ninguna policy de cliente → solo server-side (service_role) tras verificar.
-- DELETE: ninguna policy → bloqueado; cascade FK desde orders → auth.users (GDPR) sí borra.

alter table public.escrow_events enable row level security;

drop policy if exists "escrow_events_select_participant" on public.escrow_events;
create policy "escrow_events_select_participant"
  on public.escrow_events
  for select
  using (
    exists (
      select 1
      from public.escrow_contracts ec
      join public.orders o on o.id = ec.order_id
      where ec.id = escrow_events.escrow_id
        and (o.buyer_user_id = auth.uid() or o.seller_user_id = auth.uid())
    )
  );
-- Escritura: solo server-side; append-only por trigger.
