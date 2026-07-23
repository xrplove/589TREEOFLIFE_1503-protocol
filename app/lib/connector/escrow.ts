// ════════════════════════════════════════════════════════════════════════════
// ESCROW SIMULADO del lado Global · retener → fondear → liberar · ligado al 0,5%
// ────────────────────────────────────────────────────────────────────────────
// Máquina de estados de una garantía (escrow) para la PRUEBA SERIA. Es una
// SIMULACIÓN: ningún dinero se mueve, nada se custodia. Modela el ciclo
// comprador→garantía→entrega→liberación para demostrar que el mecanismo (incluido
// el reparto del 0,5% del hub) funciona de punta a punta.
//
// CANON (José · ADR 0003 §6): 1503 NO custodia. La liquidación real es
// verify-on-ledger (XRPL/RLUSD), hoy DORMIDA (Fase 7-8). Aquí `state` y los
// importes son simulados y así se marcan (`simulated: true`). NUNCA presentar
// esto como movimiento de dinero real.
// ════════════════════════════════════════════════════════════════════════════

import {
  computeGlobalSettlement,
  type GlobalSettlement,
  type SettlementModality,
} from './globalSettlement.ts'

export type EscrowState = 'opened' | 'funded' | 'released' | 'refunded'

export type EscrowEvent = { state: EscrowState; note: string }

export type Escrow = {
  id: string
  order_ref: string
  gross: number
  currency: string
  modality: SettlementModality
  state: EscrowState
  simulated: true
  /** Liquidación (0,5%) · solo presente tras `release`. */
  settlement: GlobalSettlement | null
  events: EscrowEvent[]
}

const isFiniteNonNeg = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0

/** Abre la garantía (comprador compromete el importe · estado 'opened'). */
export function openEscrow(input: {
  orderRef: string
  gross: number
  currency: string
  modality: SettlementModality
}): Escrow {
  if (typeof input.orderRef !== 'string' || input.orderRef.trim() === '') {
    throw new Error('openEscrow: orderRef obligatorio')
  }
  if (!isFiniteNonNeg(input.gross)) throw new Error('openEscrow: gross debe ser >= 0')
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error('openEscrow: currency ISO 4217')
  return {
    id: `escrow:sim:${input.orderRef}`,
    order_ref: input.orderRef,
    gross: input.gross,
    currency: input.currency,
    modality: input.modality,
    state: 'opened',
    simulated: true,
    settlement: null,
    events: [{ state: 'opened', note: 'Garantía abierta (comprador compromete el importe · simulado)' }],
  }
}

/** Fondea la garantía (los fondos quedan retenidos · estado 'funded'). */
export function fundEscrow(e: Escrow): Escrow {
  if (e.state !== 'opened') throw new Error(`fundEscrow: transición inválida desde '${e.state}'`)
  return {
    ...e,
    state: 'funded',
    events: [...e.events, { state: 'funded', note: 'Fondos retenidos en garantía (simulado · no custodial)' }],
  }
}

/**
 * Libera la garantía tras la entrega: calcula el 0,5% del hub y reparte
 * (comisión 1503 + neto al vendedor). Solo desde 'funded'.
 */
export function releaseEscrow(e: Escrow): Escrow {
  if (e.state !== 'funded') throw new Error(`releaseEscrow: transición inválida desde '${e.state}'`)
  const settlement = computeGlobalSettlement({
    gross: e.gross,
    currency: e.currency,
    modality: e.modality,
    orderRef: e.order_ref,
  })
  const note =
    settlement.status === 'settled_simulated'
      ? `Liberado: 0,5% al hub (${settlement.fee_1503} ${e.currency}), neto al vendedor (${settlement.net_to_seller} ${e.currency}) · verify-on-ledger SIMULADO`
      : `Liberado: modalidad local (Redsys) · 1503 no interviene · sin comisión`
  return {
    ...e,
    state: 'released',
    settlement,
    events: [...e.events, { state: 'released', note }],
  }
}

/** Reembolsa la garantía al comprador (p. ej. operación cancelada). Desde 'opened'|'funded'. */
export function refundEscrow(e: Escrow, reason: string): Escrow {
  if (e.state !== 'opened' && e.state !== 'funded') {
    throw new Error(`refundEscrow: transición inválida desde '${e.state}'`)
  }
  return {
    ...e,
    state: 'refunded',
    events: [...e.events, { state: 'refunded', note: `Reembolso al comprador: ${reason} (simulado)` }],
  }
}
