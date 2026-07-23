// ════════════════════════════════════════════════════════════════════════════
// A4+A5 · Escrow + ACREDITACIÓN DE OPERACIÓN del pedido demo en XRPL testnet
// ────────────────────────────────────────────────────────────────────────────
// Sobre el pedido REAL `918bf57d` (ES→CO · CIF · EUR 22.941,90), de punta a punta:
//   1. ORÁCULO 1503 verifica la custodia 3/3 (ed25519) del DPP líder → gate de liberación.
//   2. Calcula el HASH CANÓNICO (RFC8785) del registro de la operación (partes+DPP+settlement+custodia).
//   3. Escrow nativo XRP en testnet (crédito documentario · liberación contra "documentos conformes"
//      = custodia 3/3 verificada). El oráculo revela el fulfillment → fondos al vendedor.
//   4. ACREDITA la operación: ancla el hash de la operación on-ledger (certificado verificable).
//   5. Persiste en las tablas 044 (escrow_contracts + escrow_events) y marca el settlement
//      verificado on-ledger con la referencia real de la tx de acreditación.
//
// Dinero de JUGUETE del grifo (el importe XRP es una representación simbólica del pedido EUR).
// NO mainnet. Aditivo y seguro. Ejecutar:
//   node --import tsx --env-file=.env.local scripts/seed/escrowOrderTestnet.mjs
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { verifyDppCustody } from '../../app/lib/custodyVerify.ts'
import { canonicalHash } from '../../app/lib/dppHash.ts'
import { connectTestnet, generateCondition, createEscrow, finishEscrow, xrpBalance } from '../../app/lib/blockchain/xrplEscrow.ts'
import { anchorHashOnTestnet } from '../../app/lib/blockchain/xrplAnchor.ts'
import { planEscrowTranches } from '../../app/lib/tradePaymentTerms.ts'

const ORDER_ID = '918bf57d-501b-4426-9528-9ec22e4d538c'
const DPP_ID = '6985589f-5b31-4000-8b31-c178884a4727'
const SETTLEMENT_ID = '682a601e-70ce-497f-affa-6a070602839c'
const AMOUNT_XRP = '20' // representación simbólica del pedido en testnet (dinero de juguete)
const PAYMENT_METHOD = 'documentary_credit' // crédito documentario: libera contra documentos conformes

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const log = (s, m) => console.log(`\n[${s}] ${m}`)

// Guard de idempotencia: no re-acreditar si ya hay un escrow liberado para este pedido.
const { data: prior } = await sb.from('escrow_contracts').select('id, state').eq('order_id', ORDER_ID).eq('state', 'released')
if (prior && prior.length > 0) {
  console.log(`⚠️ El pedido ya tiene un escrow liberado (${prior[0].id}). Operación ya acreditada — nada que hacer.`)
  process.exit(0)
}

// ── 1. ORÁCULO: gate por custodia 3/3 ───────────────────────────────────────
log('1', 'ORÁCULO 1503: verificando la custodia 3/3 (ed25519) del DPP líder…')
const seal = await verifyDppCustody(sb, DPP_ID)
console.log(`   eslabones: ${seal.links} · firmas válidas: ${seal.signaturesOk} · cadena íntegra: ${seal.chainOk} · verificado: ${seal.verified}`)
if (!seal.verified) {
  console.error('❌ Custodia NO verificada → el oráculo NO libera (correcto). Abortando.')
  process.exit(1)
}

// ── 2. Hash canónico de la OPERACIÓN ─────────────────────────────────────────
const { data: order } = await sb.from('orders').select('id, origin_country, destination_country, incoterm, currency, total_amount, buyer_user_id, seller_user_id').eq('id', ORDER_ID).single()
const { data: stl } = await sb.from('order_settlements').select('id, gross, fee_1503, net_to_seller, currency, rail').eq('id', SETTLEMENT_ID).single()

const tranches = planEscrowTranches(PAYMENT_METHOD)
const operationRecord = {
  type: 'trade-operation@1',
  order: { id: order.id, route: `${order.origin_country}->${order.destination_country}`, incoterm: order.incoterm, currency: order.currency, total: order.total_amount },
  payment: { method: PAYMENT_METHOD, tranches, fee_1503: stl.fee_1503, net_to_seller: stl.net_to_seller, rail: stl.rail },
  dpp: { id: DPP_ID },
  custody: { links: seal.links, signaturesOk: seal.signaturesOk, verified: seal.verified },
}
const opHash = canonicalHash(operationRecord)
log('2', `Hash canónico (RFC8785) de la operación: ${opHash.hash}`)

// ── 3. Escrow en testnet (liberación contra "documentos conformes" = custodia 3/3) ──
log('3', 'Abriendo escrow en testnet (3 wallets del grifo: comprador · vendedor · oráculo)…')
const client = await connectTestnet()
let result
try {
  const [buyer, seller, oracle] = await Promise.all([
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
  ])
  const sellerBefore = await xrpBalance(client, seller.address)
  const { condition, fulfillment } = generateCondition()
  const cancelAfter = new Date(Date.now() + 2 * 60 * 60 * 1000)

  const created = await createEscrow({ client, buyerWallet: buyer, destinationAddr: seller.address, amountXrp: AMOUNT_XRP, condition, cancelAfter })
  console.log(`   EscrowCreate: ${created.explorerUrl}  (OfferSequence ${created.offerSequence})`)

  log('3b', 'Documentos conformes (custodia 3/3 verificada) → el oráculo libera…')
  const finished = await finishEscrow({ client, senderWallet: oracle, ownerAddr: created.owner, offerSequence: created.offerSequence, condition, fulfillment })
  console.log(`   EscrowFinish: ${finished.explorerUrl}`)
  const sellerAfter = await xrpBalance(client, seller.address)
  console.log(`   vendedor: ${sellerBefore} → ${sellerAfter} XRP (Δ +${(sellerAfter - sellerBefore).toFixed(6)})`)

  // ── 4. ACREDITAR la operación: anclar su hash on-ledger ────────────────────
  log('4', 'Acreditando la operación: anclando su hash on-ledger…')
  const anchor = await anchorHashOnTestnet(opHash.hash, { client, wallet: oracle, memoType: 'op-sha256' })
  console.log(`   Acreditación: ${anchor.explorerUrl}`)

  result = { buyer, seller, created, finished, anchor, condition, cancelAfter }
} finally {
  await client.disconnect()
}

// ── 5. Persistir en BD (tablas 044) + marcar settlement verificado ───────────
log('5', 'Persistiendo el contrato de escrow + bitácora + acreditación en BD…')
const { data: ec, error: ecErr } = await sb
  .from('escrow_contracts')
  .insert({
    order_id: ORDER_ID,
    settlement_id: SETTLEMENT_ID,
    tranche_label: 'full',
    pct_bps: 10_000,
    amount: Number(AMOUNT_XRP),
    asset_code: 'XRP',
    buyer_xrpl_addr: result.buyer.address,
    seller_xrpl_addr: result.seller.address,
    offer_sequence: result.created.offerSequence,
    condition_hex: result.condition,
    cancel_after: result.cancelAfter.toISOString(),
    create_tx_hash: result.created.txHash,
    finish_tx_hash: result.finished.txHash,
    state: 'released',
    dpp_id: DPP_ID,
  })
  .select('id')
  .single()
if (ecErr) throw new Error(`insert escrow_contracts: ${ecErr.message}`)

const events = [
  { escrow_id: ec.id, from_state: null, to_state: 'created', note: 'instrucción generada por 1503' },
  { escrow_id: ec.id, from_state: 'created', to_state: 'funded', tx_hash: result.created.txHash, note: 'comprador bloqueó fondos (testnet)' },
  { escrow_id: ec.id, from_state: 'funded', to_state: 'oracle_verified', oracle_attestation: opHash.hash, note: 'custodia 3/3 verificada · hash de operación acreditado' },
  { escrow_id: ec.id, from_state: 'oracle_verified', to_state: 'released', tx_hash: result.finished.txHash, note: 'oráculo liberó · fondos al vendedor' },
]
const { error: evErr } = await sb.from('escrow_events').insert(events)
if (evErr) throw new Error(`insert escrow_events: ${evErr.message}`)

const { error: stErr } = await sb
  .from('order_settlements')
  .update({ verified_on_ledger: true, ledger_ref: `xrpl-testnet:op:${result.anchor.txHash}`, fee_1503_status: 'invoiced' })
  .eq('id', SETTLEMENT_ID)
if (stErr) throw new Error(`update order_settlements: ${stErr.message}`)

console.log('\n────────────────────────────────────────────────────────')
console.log('✅ OPERACIÓN ACREDITADA Y ESCROW LIBERADO EN TESTNET (verificable por cualquiera)')
console.log(`   escrow_contracts: ${ec.id} (state=released)`)
console.log(`   EscrowCreate : https://testnet.xrpl.org/transactions/${result.created.txHash}`)
console.log(`   EscrowFinish : https://testnet.xrpl.org/transactions/${result.finished.txHash}`)
console.log(`   Acreditación : ${result.anchor.explorerUrl}`)
console.log(`   hash operación: ${opHash.hash}`)
console.log('   settlement: verified_on_ledger=true · ledger_ref=tx de acreditación real')
