// ════════════════════════════════════════════════════════════════════════════
// LIQUIDACIÓN DEL LADO GLOBAL DEL HUB 1503 · 0,5% · SIMULADA (verify-on-ledger)
// ────────────────────────────────────────────────────────────────────────────
// Calcula la comisión del hub (0,5%) cuando un pedido se liquida por el rail
// GLOBAL de 1503. Pieza del conector (ADR 0003 de Artikalia · §6 frontera de pagos):
//
//   - Modalidad `redsys_local` → el escritorio PYME opera SUELTO (la PYME cobra
//     su propia venta en local). 1503 NO interviene → comisión 0.
//   - Modalidades GLOBALES (01..04) → el pedido entra por el hub; se aplica la
//     comisión del 0,5% y se liquida por el rail no-custodial (XRPL/RLUSD).
//
// CANON (José): el dinero NO viaja por el conector. 1503 NO custodia. La liquidación
// real se VERIFICA leyendo el ledger (verify-on-ledger), no se mueve aquí. Hoy esto
// es una SIMULACIÓN: `status='settled_simulated'`, `verified_on_ledger=false`,
// `ledger_ref` es una referencia ficticia (no hay anclaje on-chain todavía: el
// adapter XRPL está dormido · Fase 7-8). Sirve para PROBAR que el mecanismo del
// 0,5% funciona punta a punta, sin tocar dinero real ni regulación.
// ════════════════════════════════════════════════════════════════════════════

/** Comisión del hub global 1503 · 0,5%. Fuente única de verdad de la tasa. */
export const COMMISSION_RATE_1503 = 0.005

/** Modalidad de pago que viaja en el `PedidoCanonico` del conector (referencia · ADR 0003). */
export type SettlementModality =
  | 'redsys_local' // PYME suelta · Artihome cobra por Redsys · 1503 NO interviene
  | '01_directo'
  | '02_b2b_nacional'
  | '03_servicios'
  | '04_importacion'

/** Modalidades que pasan por el rail GLOBAL de 1503 (las que devengan el 0,5%). */
export const GLOBAL_MODALITIES: readonly SettlementModality[] = [
  '01_directo',
  '02_b2b_nacional',
  '03_servicios',
  '04_importacion',
]

export function isGlobalModality(m: SettlementModality): boolean {
  return GLOBAL_MODALITIES.includes(m)
}

/** Resultado de liquidar un pedido por el lado Global (simulado). */
export type GlobalSettlement = {
  /** Importe bruto del pedido (referencia · la misma moneda). */
  gross: number
  /** Moneda ISO 4217 (3 letras). */
  currency: string
  /** Modalidad de pago declarada por el conector. */
  modality: SettlementModality
  /** Tasa aplicada (0,005 en global · 0 en local). */
  rate: number
  /** Comisión del hub 1503 (0,5% del bruto · 0 si es local). */
  fee_1503: number
  /** Neto que recibe el vendedor (bruto − comisión). */
  net_to_seller: number
  /** Rail de liquidación. Hoy SIMULADO (XRPL/RLUSD testnet aún no cableado). */
  rail: 'none_local' | 'xrpl_rlusd_testnet_sim'
  /** Estado de la liquidación. */
  status: 'not_applicable_local' | 'settled_simulated'
  /** Referencia de liquidación (ficticia en simulación · no es un txhash on-chain real). */
  ledger_ref: string | null
  /** ¿Verificada contra el ledger? false mientras sea simulación. */
  verified_on_ledger: boolean
}

const isFiniteNonNeg = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0

/** Redondeo a 2 decimales (céntimos) · half-up estable evitando coma flotante sucia. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Referencia de liquidación simulada · determinista a partir del pedido (sin azar:
 *  `Math.random`/`Date.now` no son fiables aquí y rompen reproducibilidad). El llamador
 *  pasa un identificador estable del pedido. */
function simulatedLedgerRef(orderRef: string): string {
  return `sim:xrpl-testnet:${orderRef}`
}

/**
 * Liquida un pedido por el lado Global (SIMULADO).
 *
 * @param input.gross     importe bruto (> 0)
 * @param input.currency  ISO 4217 (3 letras mayúsculas)
 * @param input.modality  modalidad de pago del conector
 * @param input.orderRef  identificador estable del pedido (para la referencia simulada)
 */
export function computeGlobalSettlement(input: {
  gross: number
  currency: string
  modality: SettlementModality
  orderRef: string
}): GlobalSettlement {
  const { gross, currency, modality, orderRef } = input

  if (!isFiniteNonNeg(gross)) {
    throw new Error('computeGlobalSettlement: gross debe ser un número finito >= 0')
  }
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('computeGlobalSettlement: currency debe ser ISO 4217 (3 letras mayúsculas)')
  }
  if (typeof orderRef !== 'string' || orderRef.trim() === '') {
    throw new Error('computeGlobalSettlement: orderRef estable es obligatorio')
  }

  // Modalidad LOCAL (Redsys) → 1503 no interviene. Comisión 0, sin liquidación de hub.
  if (modality === 'redsys_local') {
    return {
      gross,
      currency,
      modality,
      rate: 0,
      fee_1503: 0,
      net_to_seller: gross,
      rail: 'none_local',
      status: 'not_applicable_local',
      ledger_ref: null,
      verified_on_ledger: false,
    }
  }

  // Modalidad GLOBAL → 0,5% del bruto. El neto sale por resta para que sumen exacto.
  const fee = round2(gross * COMMISSION_RATE_1503)
  const net = round2(gross - fee)

  return {
    gross,
    currency,
    modality,
    rate: COMMISSION_RATE_1503,
    fee_1503: fee,
    net_to_seller: net,
    rail: 'xrpl_rlusd_testnet_sim',
    status: 'settled_simulated',
    ledger_ref: simulatedLedgerRef(orderRef),
    verified_on_ledger: false, // SIMULACIÓN · pasará a true cuando se cablee testnet real
  }
}
