// ════════════════════════════════════════════════════════════════════════════
// CONDICIONES DE PAGO DEL COMERCIO INTERNACIONAL → PLAN DE ESCROW (Fase A · grant)
// ────────────────────────────────────────────────────────────────────────────
// Mapea los métodos canónicos de pago import/export (US Dept. of Commerce / ITA ·
// reglas ICC) a un plan de tramos de escrow XRPL. Fundamento legal en
// docs/architecture/2026-06-21-pago-verify-no-custodia-rlusd.md §1.
//
// ENCUADRE LEGAL (honesto · canon):
//   · NUESTRO escrow NO es una Carta de Crédito (instrumento BANCARIO · el banco asume
//     la obligación de pago → licencia). REPLICA la FUNCIÓN (asignación de riesgo) con un
//     escrow no-custodial + oráculo. No se comercializa como "emitimos LCs".
//   · El ORÁCULO (1503) hace el papel que en un LC hace el banco: VERIFICA que se cumple
//     la condición (documentos conformes / custodia 3/3 / precinto) y revela el fulfillment.
//     No toca el dinero. La línea exacta la firma el abogado (bloqueante final).
//   · Incoterms 2020 = términos de ENTREGA, NO de pago → ejes distintos (no se mezclan aquí).
// ════════════════════════════════════════════════════════════════════════════

/** Métodos canónicos de pago en comercio internacional (ITA/trade.gov). */
export type TradePaymentMethod =
  | 'cash_in_advance' // pago anticipado
  | 'documentary_credit' // crédito documentario (estilo LC · UCP 600)
  | 'documentary_collection' // cobranza documentaria (URC 522)
  | 'open_account' // cuenta abierta (30/60/90 d)
  | 'consignment' // consignación (pago tras reventa)

/** Qué dispara la liberación de un tramo (cómo se traduce a la condición del escrow XRPL). */
export type ReleaseTrigger =
  | 'on_funding' // al bloquearse (depósito) — condición satisfecha de inicio
  | 'on_delivery' // entrega confirmada (custodia 3/3 · abrir precinto)
  | 'on_documents' // documentos conformes (custodia 3/3 + docs + precinto) — papel "banco" del oráculo
  | 'on_terms_date' // a fecha de vencimiento (cuenta abierta) — escrow con FinishAfter
  | 'on_resale' // tras la reventa (consignación) — atestación posterior del oráculo

export type RiskBearer = 'importer' | 'exporter' | 'shared'
export type TrancheLabel = 'deposit' | 'balance' | 'full' // coherente con escrow_contracts.tranche_label

export type EscrowTranche = {
  label: TrancheLabel
  /** Porcentaje en basis points (3000 = 30%). La suma de los tramos = 10000. */
  pctBps: number
  release: ReleaseTrigger
}

export type PaymentTermsSpec = {
  method: TradePaymentMethod
  label: string
  /** Regla ICC aplicable (null si no la rige una). */
  iccRule: 'UCP 600' | 'URC 522' | null
  riskBearer: RiskBearer
  /** Qué papel juega el oráculo de 1503 en este método (analogía honesta, no equivalencia legal). */
  oracleActsAs: string
  description: string
  tranches: EscrowTranche[]
}

const FULL = (release: ReleaseTrigger): EscrowTranche[] => [{ label: 'full', pctBps: 10_000, release }]

/** Catálogo base de los 5 métodos (un solo tramo `full`; el split se aplica con planEscrowTranches). */
export const TRADE_PAYMENT_METHODS: Record<TradePaymentMethod, PaymentTermsSpec> = {
  cash_in_advance: {
    method: 'cash_in_advance',
    label: 'Pago anticipado',
    iccRule: null,
    riskBearer: 'importer',
    oracleActsAs: 'custodio neutral: el escrow protege al importador (fondos bloqueados, no del exportador hasta la entrega)',
    description:
      'El importador compromete el 100% antes del envío, PERO el escrow lo retiene hasta la entrega confirmada → mejora el prepago puro (el exportador no cobra hasta entregar).',
    tranches: FULL('on_delivery'),
  },
  documentary_credit: {
    method: 'documentary_credit',
    label: 'Crédito documentario (estilo LC)',
    iccRule: 'UCP 600',
    riskBearer: 'shared',
    oracleActsAs: 'verificador de documentos conformes (papel que en un LC hace el banco · NO es un LC bancario)',
    description:
      'Liberación contra documentos conformes. El oráculo verifica custodia 3/3 + documentos + precinto antes de liberar. Riesgo compartido.',
    tranches: FULL('on_documents'),
  },
  documentary_collection: {
    method: 'documentary_collection',
    label: 'Cobranza documentaria',
    iccRule: 'URC 522',
    riskBearer: 'exporter',
    oracleActsAs: 'liberador de documentos contra pago (sin garantía, más ligero que el crédito documentario)',
    description: 'Documentos liberados contra pago/aceptación. Sin la garantía del crédito documentario.',
    tranches: FULL('on_documents'),
  },
  open_account: {
    method: 'open_account',
    label: 'Cuenta abierta',
    iccRule: null,
    riskBearer: 'exporter',
    oracleActsAs: 'temporizador: liberación a fecha de vencimiento (FinishAfter), no por condición logística',
    description: 'Se entrega primero y se paga a 30/60/90 días. Alto riesgo para el exportador; el escrow con FinishAfter encaja el plazo.',
    tranches: FULL('on_terms_date'),
  },
  consignment: {
    method: 'consignment',
    label: 'Consignación',
    iccRule: null,
    riskBearer: 'exporter',
    oracleActsAs: 'atestador del evento de reventa (libera tras la venta al cliente final)',
    description: 'Se paga tras la reventa. Riesgo máximo para el exportador; el escrow se libera con la atestación de la reventa.',
    tranches: FULL('on_resale'),
  },
}

/** Suma los bps de los tramos (debe dar 10000). */
export function sumTrancheBps(tranches: EscrowTranche[]): number {
  return tranches.reduce((acc, t) => acc + t.pctBps, 0)
}

/** Valida un plan de tramos: ≥1 tramo, cada bps en [1,10000], suma exacta = 10000. */
export function validateTranches(tranches: EscrowTranche[]): void {
  if (tranches.length === 0) throw new Error('plan de escrow sin tramos')
  for (const t of tranches) {
    if (!Number.isInteger(t.pctBps) || t.pctBps < 1 || t.pctBps > 10_000) {
      throw new Error(`tramo ${t.label}: pctBps inválido (${t.pctBps})`)
    }
  }
  const sum = sumTrancheBps(tranches)
  if (sum !== 10_000) throw new Error(`la suma de tramos debe ser 10000 bps (100%), es ${sum}`)
}

/**
 * Construye el plan de tramos de escrow para un método de pago.
 * Si se da `depositPctBps` (> 0 y < 10000), aplica el split de riesgo compartido (p.ej. 30/70):
 *   · depósito `on_funding` (anticipo al pedido) + saldo con la liberación propia del método.
 * Sin depósito → un solo tramo `full` con la liberación del método.
 */
export function planEscrowTranches(
  method: TradePaymentMethod,
  opts?: { depositPctBps?: number },
): EscrowTranche[] {
  const spec = TRADE_PAYMENT_METHODS[method]
  const deposit = opts?.depositPctBps

  if (deposit === undefined) {
    validateTranches(spec.tranches)
    return spec.tranches
  }
  if (!Number.isInteger(deposit) || deposit <= 0 || deposit >= 10_000) {
    throw new Error(`depositPctBps inválido (${deposit}): debe estar entre 1 y 9999`)
  }
  const balanceRelease = spec.tranches[spec.tranches.length - 1].release
  const tranches: EscrowTranche[] = [
    { label: 'deposit', pctBps: deposit, release: 'on_funding' },
    { label: 'balance', pctBps: 10_000 - deposit, release: balanceRelease },
  ]
  validateTranches(tranches)
  return tranches
}

/** Importe de un tramo (en la misma unidad que `total`), redondeado a 6 decimales. */
export function trancheAmount(total: number, pctBps: number): number {
  return Math.round(((total * pctBps) / 10_000) * 1e6) / 1e6
}
