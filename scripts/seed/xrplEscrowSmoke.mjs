// ════════════════════════════════════════════════════════════════════════════
// HUMO · Escrow condicional en XRPL testnet (Fase A · espina del PoC del grant)
// ────────────────────────────────────────────────────────────────────────────
// Demuestra el raíl no-custodial de punta a punta con dinero de JUGUETE del grifo:
//   1. Comprador bloquea fondos (EscrowCreate · destino = vendedor · condición + backstop).
//   2. ORÁCULO (1503) verifica el hito logístico (custodia 3/3 · aquí simulado) y SOLO
//      entonces revela el fulfillment → EscrowFinish → los fondos van al VENDEDOR.
//   3. Se comprueba on-ledger que el vendedor cobró. El oráculo solo pagó la comisión:
//      NO tocó el dinero (prueba de no-custodia).
//
// NO toca la BD. NO usa mainnet. Ejecutar:
//   node --import tsx scripts/seed/xrplEscrowSmoke.mjs
// ════════════════════════════════════════════════════════════════════════════

import {
  connectTestnet,
  generateCondition,
  createEscrow,
  finishEscrow,
  xrpBalance,
  XRPL_TESTNET_EXPLORER,
} from '../../app/lib/blockchain/xrplEscrow.ts'

const AMOUNT_XRP = '10'

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`)
}

const client = await connectTestnet()
try {
  log('0', 'Conectado a XRPL testnet. Pidiendo 3 wallets al grifo (comprador · vendedor · oráculo)…')
  const [buyer, seller, oracle] = await Promise.all([
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
  ])
  console.log('   comprador:', buyer.address)
  console.log('   vendedor :', seller.address)
  console.log('   oráculo  :', oracle.address, '(1503 · solo atesta, no custodia)')

  const sellerBefore = await xrpBalance(client, seller.address)
  log('1', `Balance del vendedor ANTES: ${sellerBefore} XRP`)

  // 1503 genera la cripto-condición; el fulfillment es SECRETO del oráculo.
  const { condition, fulfillment } = generateCondition()
  log('2', `Condición generada (pública): ${condition.slice(0, 24)}…  · fulfillment guardado en secreto por el oráculo`)

  // Backstop a 2h: si el oráculo no libera, los fondos vuelven al comprador.
  const cancelAfter = new Date(Date.now() + 2 * 60 * 60 * 1000)
  log('3', `Comprador bloquea ${AMOUNT_XRP} XRP en escrow (destino = vendedor · backstop ${cancelAfter.toISOString()})…`)
  const created = await createEscrow({
    client,
    buyerWallet: buyer,
    destinationAddr: seller.address,
    amountXrp: AMOUNT_XRP,
    condition,
    cancelAfter,
  })
  console.log('   EscrowCreate tx:', created.explorerUrl)
  console.log('   OfferSequence  :', created.offerSequence)

  // El oráculo verifica el hito (en producción: verifyDppCustody 3/3). Aquí lo simulamos.
  log('4', 'ORÁCULO 1503: custodia 3/3 verificada (simulada) → revelo el fulfillment y libero el escrow…')
  const finished = await finishEscrow({
    client,
    senderWallet: oracle, // el oráculo envía el Finish; NO es origen ni destino del dinero
    ownerAddr: created.owner,
    offerSequence: created.offerSequence,
    condition,
    fulfillment,
  })
  console.log('   EscrowFinish tx:', finished.explorerUrl)

  const sellerAfter = await xrpBalance(client, seller.address)
  const delta = Number(sellerAfter) - Number(sellerBefore)
  log('5', `Balance del vendedor DESPUÉS: ${sellerAfter} XRP  (Δ = +${delta.toFixed(6)} XRP)`)

  const ok = delta > Number(AMOUNT_XRP) - 1 // margen por reservas/comisiones
  console.log('\n────────────────────────────────────────────────────────')
  if (ok) {
    console.log('✅ ESCROW LIBERADO. El vendedor cobró; el oráculo solo pagó comisión (no custodió fondos).')
    console.log('   Verificable por cualquiera en el explorer:', XRPL_TESTNET_EXPLORER)
  } else {
    console.log('⚠️ El vendedor no recibió el importe esperado — revisar.')
    process.exitCode = 1
  }
} catch (err) {
  console.error('\n❌ ERROR en el humo del escrow:', err?.message ?? err)
  process.exitCode = 1
} finally {
  await client.disconnect()
}
