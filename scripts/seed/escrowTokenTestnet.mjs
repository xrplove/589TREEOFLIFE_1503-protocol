// ════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN TESTNET · escrow de TOKEN EMITIDO (TokenEscrow / XLS-85) — forma RLUSD
// ────────────────────────────────────────────────────────────────────────────
// Antes de construir el incremento en RLUSD (opción A de José), probamos EN TESTNET que:
//   · un token emitido (aquí RLUSD emitido por un issuer de PRUEBA) se puede meter en escrow,
//   · con NUESTRA condición derivada (escrowSecret · HMAC · sin almacenamiento),
//   · el oráculo re-deriva el fulfillment y libera al vendedor,
//   · el vendedor recibe el TOKEN (no XRP).
// Si esto pasa, RLUSD-real = cambiar el issuer de prueba por el issuer RLUSD de testnet.
//
// Requisitos que probamos empíricamente: trustlines comprador/vendedor · flags del issuer
// (DefaultRipple + AllowTrustLineLocking que exige XLS-85) · Amount como IOU {currency,issuer,value}.
// Dinero de juguete. Ejecutar: node --import tsx scripts/seed/escrowTokenTestnet.mjs
// ════════════════════════════════════════════════════════════════════════════
import { deriveEscrowCondition } from '../../app/lib/blockchain/escrowSecret.ts'
import { connectTestnet, finishEscrow } from '../../app/lib/blockchain/xrplEscrow.ts'

const RLUSD = '524C555344000000000000000000000000000000' // "RLUSD" en hex de 40 (código >3 chars)
const SERVER_ESCROW_KEY = 'clave-de-servidor-SOLO-para-esta-prueba'
const ESCROW_ID = 'demo-token-escrow-1'
const VALUE = '15' // 15 RLUSD

const client = await connectTestnet()
const log = (m) => console.log(m)
try {
  log('\n[1] Fondeando issuer · comprador · vendedor · oráculo (grifo)…')
  const [issuer, buyer, seller, oracle] = await Promise.all([
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
    client.fundWallet().then((r) => r.wallet),
  ])

  async function submit(wallet, tx, label) {
    const prepared = await client.autofill(tx)
    const signed = wallet.sign(prepared)
    const res = await client.submitAndWait(signed.tx_blob)
    const code = res.result.meta?.TransactionResult
    if (code !== 'tesSUCCESS') throw new Error(`${label}: ${code}`)
    return { hash: res.result.hash, sequence: prepared.Sequence }
  }
  const iou = (value) => ({ currency: RLUSD, issuer: issuer.address, value })

  log('[2] Flags del issuer: DefaultRipple + AllowTrustLineLocking (XLS-85)…')
  await submit(issuer, { TransactionType: 'AccountSet', Account: issuer.address, SetFlag: 8 }, 'DefaultRipple')
  try {
    await submit(issuer, { TransactionType: 'AccountSet', Account: issuer.address, SetFlag: 17 }, 'AllowTrustLineLocking')
    log('    AllowTrustLineLocking OK (asf 17)')
  } catch (e) {
    log('    ⚠️ AllowTrustLineLocking falló (' + e.message + ') → seguimos; el escrow dirá si hace falta')
  }

  log('[3] Trustlines RLUSD del comprador y del vendedor…')
  await submit(buyer, { TransactionType: 'TrustSet', Account: buyer.address, LimitAmount: iou('1000000') }, 'trust buyer')
  await submit(seller, { TransactionType: 'TrustSet', Account: seller.address, LimitAmount: iou('1000000') }, 'trust seller')

  log('[4] El issuer paga 100 RLUSD al comprador (para que tenga saldo que bloquear)…')
  await submit(issuer, { TransactionType: 'Payment', Account: issuer.address, Destination: buyer.address, Amount: iou('100') }, 'fund buyer RLUSD')

  const balOf = async (addr) => {
    const r = await client.request({ command: 'account_lines', account: addr })
    const line = r.result.lines.find((l) => l.currency === RLUSD && l.account === issuer.address)
    return line ? Number(line.balance) : 0
  }
  const sellerBefore = await balOf(seller.address)

  log('[5] Oráculo deriva la condición (sin guardar) y el comprador crea el escrow de TOKEN…')
  const { condition, fulfillment } = deriveEscrowCondition(ESCROW_ID, SERVER_ESCROW_KEY)
  const cancelAfter = Math.floor(Date.now() / 1000) - 946684800 + 2 * 3600 // Ripple time +2h
  const created = await submit(buyer, {
    TransactionType: 'EscrowCreate', Account: buyer.address,
    Amount: iou(VALUE), Destination: seller.address, Condition: condition, CancelAfter: cancelAfter,
  }, 'EscrowCreate(token)')
  log(`    EscrowCreate: https://testnet.xrpl.org/transactions/${created.hash} (Seq ${created.sequence})`)

  log('[6] Al entregar, el oráculo RE-DERIVA el fulfillment y libera…')
  const reDerived = deriveEscrowCondition(ESCROW_ID, SERVER_ESCROW_KEY).fulfillment
  const finished = await finishEscrow({
    client, senderWallet: oracle, ownerAddr: buyer.address,
    offerSequence: created.sequence, condition, fulfillment: reDerived,
  })
  log(`    EscrowFinish: ${finished.explorerUrl}`)

  const sellerAfter = await balOf(seller.address)
  const delta = sellerAfter - sellerBefore
  log(`\n[7] Vendedor RLUSD: ${sellerBefore} → ${sellerAfter} (Δ +${delta})`)
  const ok = reDerived === fulfillment && delta === Number(VALUE)
  log('\n' + (ok ? '✅ TOKENESCROW VERIFICADO' : '❌ FALLO') +
    `: escrow de RLUSD (token emitido) liberado por el oráculo re-derivando la llave. RLUSD-real = cambiar issuer.`)
  process.exitCode = ok ? 0 : 1
} catch (e) {
  console.error('\n❌ ERROR:', e.message)
  console.error('   (si es por un flag/amendment, aquí aprendemos el requisito exacto de TokenEscrow en testnet)')
  process.exitCode = 1
} finally {
  await client.disconnect()
}
