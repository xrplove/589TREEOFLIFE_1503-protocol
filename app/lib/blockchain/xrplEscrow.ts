// ════════════════════════════════════════════════════════════════════════════
// ESCROW CONDICIONAL EN XRPL TESTNET · espina del PoC de pago (Fase A · grant)
// ────────────────────────────────────────────────────────────────────────────
// Escrow NATIVO de XRP con cripto-condición PREIMAGE-SHA-256. Es el "raíl" del pago
// no-custodial:
//   · El COMPRADOR bloquea fondos con EscrowCreate (destino = VENDEDOR). 1503 no toca el dinero.
//   · 1503 = ORÁCULO: guarda el `fulfillment` (la llave) y solo lo revela en EscrowFinish
//     cuando la condición logística se cumple (custodia 3/3 verificada). Liberar ≠ custodiar.
//   · `CancelAfter` = BACKSTOP: si el oráculo no libera, cualquiera ejecuta EscrowCancel
//     tras esa fecha y los fondos VUELVEN al comprador. → 1503 no puede secuestrar fondos.
//
// CRIPTO-CONDICIÓN (sin dependencias · formato XRPL/crypto-conditions, tipo 0 PREIMAGE-SHA-256):
//   condition   = A0258020 + SHA256(preimage)         + 810120     (cost = 32 = 0x20)
//   fulfillment = A0228020 + preimage(32 bytes)
//
// ALCANCE / SEGURIDAD:
//   · TESTNET only (mismo endpoint que xrplAnchor). Dinero de JUGUETE del grifo. Cero regulación.
//   · Mainnet + RLUSD (TokenEscrow XLS-85) = Fase B/C, tras 3 bloqueantes + auditoría.
//   · El `fulfillment` es secreto del oráculo: NUNCA se persiste on-chain hasta el Finish.
// ════════════════════════════════════════════════════════════════════════════

import { createHash, randomBytes } from 'node:crypto'
import { Client, Wallet, xrpToDrops, type EscrowCreate, type EscrowFinish, type EscrowCancel } from 'xrpl'

export const XRPL_TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233'
export const XRPL_TESTNET_EXPLORER = 'https://testnet.xrpl.org/transactions'

/** Epoch de Ripple = 2000-01-01T00:00:00Z (segundos desde la época Unix). */
const RIPPLE_EPOCH = 946_684_800
const toRippleTime = (unixMs: number): number => Math.floor(unixMs / 1000) - RIPPLE_EPOCH

export type EscrowCondition = {
  /** Condición pública (va en EscrowCreate · se puede compartir). */
  condition: string
  /** Cumplimiento SECRETO (la llave · solo el oráculo, se revela en EscrowFinish). */
  fulfillment: string
}

/**
 * Genera un par condición/cumplimiento PREIMAGE-SHA-256 (formato XRPL, sin librerías).
 * El `fulfillment` es la llave que abre el escrow: guárdalo en secreto (lo tiene 1503=oráculo).
 */
export function generateCondition(): EscrowCondition {
  const preimage = randomBytes(32)
  const hash = createHash('sha256').update(preimage).digest('hex').toUpperCase()
  return {
    condition: `A0258020${hash}810120`,
    fulfillment: `A0228020${preimage.toString('hex').toUpperCase()}`,
  }
}

export type EscrowCreateResult = {
  txHash: string
  /** Sequence del EscrowCreate — IMPRESCINDIBLE para Finish/Cancel (junto al Owner). */
  offerSequence: number
  ledgerIndex: number | undefined
  owner: string
  explorerUrl: string
}

export type EscrowTxResult = {
  txHash: string
  ledgerIndex: number | undefined
  explorerUrl: string
}

const explorer = (hash: string): string => `${XRPL_TESTNET_EXPLORER}/${hash}`

function resultCode(meta: unknown): string | undefined {
  return meta && typeof meta === 'object' ? (meta as { TransactionResult?: string }).TransactionResult : undefined
}

/**
 * EscrowCreate: el COMPRADOR bloquea `amountXrp` con destino = `destinationAddr` (vendedor),
 * cerrado por `condition` y con `cancelAfter` (backstop). Lo firma el comprador (su llave).
 */
export async function createEscrow(args: {
  client: Client
  buyerWallet: Wallet
  destinationAddr: string
  amountXrp: string
  condition: string
  cancelAfter: Date
  finishAfter?: Date
}): Promise<EscrowCreateResult> {
  const { client, buyerWallet, destinationAddr, amountXrp, condition, cancelAfter, finishAfter } = args

  const tx: EscrowCreate = {
    TransactionType: 'EscrowCreate',
    Account: buyerWallet.address,
    Amount: xrpToDrops(amountXrp),
    Destination: destinationAddr,
    Condition: condition,
    CancelAfter: toRippleTime(cancelAfter.getTime()),
    ...(finishAfter ? { FinishAfter: toRippleTime(finishAfter.getTime()) } : {}),
  }

  const prepared = await client.autofill(tx)
  const signed = buyerWallet.sign(prepared)
  const res = await client.submitAndWait(signed.tx_blob)
  const code = resultCode(res.result.meta)
  if (code !== 'tesSUCCESS') throw new Error(`EscrowCreate no validado: ${code ?? 'desconocido'}`)

  // El OfferSequence del Finish/Cancel es la Sequence de ESTA transacción.
  const offerSequence = (prepared as { Sequence?: number }).Sequence
  if (typeof offerSequence !== 'number') throw new Error('EscrowCreate sin Sequence tras autofill')

  return {
    txHash: res.result.hash,
    offerSequence,
    ledgerIndex: res.result.ledger_index,
    owner: buyerWallet.address,
    explorerUrl: explorer(res.result.hash),
  }
}

/** Coste extra del EscrowFinish con fulfillment: base × (33 + ceil(bytes/16)). */
function finishFeeDrops(baseFeeDrops: string, fulfillmentHex: string): string {
  const bytes = fulfillmentHex.length / 2
  const base = Number(baseFeeDrops || '10')
  return String(base * (33 + Math.ceil(bytes / 16)))
}

/**
 * EscrowFinish: el ORÁCULO revela el `fulfillment` → libera los fondos al vendedor.
 * Lo puede enviar cualquiera (no toca el dinero, solo paga la comisión). Requiere coste extra
 * por llevar fulfillment. Owner + OfferSequence identifican el escrow.
 */
export async function finishEscrow(args: {
  client: Client
  senderWallet: Wallet
  ownerAddr: string
  offerSequence: number
  condition: string
  fulfillment: string
}): Promise<EscrowTxResult> {
  const { client, senderWallet, ownerAddr, offerSequence, condition, fulfillment } = args

  const tx: EscrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: senderWallet.address,
    Owner: ownerAddr,
    OfferSequence: offerSequence,
    Condition: condition,
    Fulfillment: fulfillment,
  }

  const prepared = await client.autofill(tx)
  // autofill no sube la comisión por el fulfillment → la calculamos.
  prepared.Fee = finishFeeDrops(prepared.Fee ?? '10', fulfillment)
  const signed = senderWallet.sign(prepared)
  const res = await client.submitAndWait(signed.tx_blob)
  const code = resultCode(res.result.meta)
  if (code !== 'tesSUCCESS') throw new Error(`EscrowFinish no validado: ${code ?? 'desconocido'}`)

  return { txHash: res.result.hash, ledgerIndex: res.result.ledger_index, explorerUrl: explorer(res.result.hash) }
}

/**
 * EscrowCancel (BACKSTOP): tras `CancelAfter`, devuelve los fondos al comprador (owner).
 * Lo puede ejecutar cualquiera. Antes de esa fecha, el ledger lo rechaza (tecNO_PERMISSION).
 */
export async function cancelEscrow(args: {
  client: Client
  senderWallet: Wallet
  ownerAddr: string
  offerSequence: number
}): Promise<EscrowTxResult> {
  const { client, senderWallet, ownerAddr, offerSequence } = args

  const tx: EscrowCancel = {
    TransactionType: 'EscrowCancel',
    Account: senderWallet.address,
    Owner: ownerAddr,
    OfferSequence: offerSequence,
  }

  const prepared = await client.autofill(tx)
  const signed = senderWallet.sign(prepared)
  const res = await client.submitAndWait(signed.tx_blob)
  const code = resultCode(res.result.meta)
  if (code !== 'tesSUCCESS') throw new Error(`EscrowCancel no validado: ${code ?? 'desconocido'}`)

  return { txHash: res.result.hash, ledgerIndex: res.result.ledger_index, explorerUrl: explorer(res.result.hash) }
}

/** Lee el balance en XRP de una cuenta (number · para verificar el movimiento on-ledger). */
export async function xrpBalance(client: Client, address: string): Promise<number> {
  return client.getXrpBalance(address)
}

/** Conecta a testnet si hace falta (helper para scripts). El caller decide el cierre. */
export async function connectTestnet(): Promise<Client> {
  const client = new Client(XRPL_TESTNET_WSS)
  if (!client.isConnected()) await client.connect()
  return client
}
