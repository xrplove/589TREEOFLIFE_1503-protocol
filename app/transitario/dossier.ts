// ════════════════════════════════════════════════════════════════════════════
// DOSSIER DEL PEDIDO · capa de datos (BD real) para el escritorio del transitario
// ────────────────────────────────────────────────────────────────────────────
// Reúne TODO lo de un pedido desde la BD y lo deja listo para pintar en el
// escritorio: pedido + líneas + corredor (motor real) + carga 3D (motor real) +
// documentos + liquidación 0,5% + cadena de custodia firmada (con verificación
// del precinto). Lectura con service_role (el caller ya pasó el gate en la page).
//
// CANON: la liquidación es SIMULADA (verify-on-ledger pendiente · paso 5). Los
// importes son referencia (1503 no custodia). PII fuera.
// ════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getCorridorRequirements,
  groupByLayer,
  splitConditional,
  type TradeRule,
} from '../data/tradeCompliance'
import { assignContainer, type ContainerAssignment, type CargoItem } from '../lib/containerAssign'
import { verifyDppCustody } from '../lib/custodyVerify'

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export type DossierLine = {
  sku: string
  title: Record<string, string> | null
  quantity: number
  unit_price: number
  amount: number
  hs_code: string | null
  dpp_registry_id: string | null
}

export type DossierSettlement = {
  gross: number
  currency: string
  fee_1503: number
  net_to_seller: number
  rail: string
  status: string
  verified_on_ledger: boolean
  simulated: boolean
}

export type DossierCustodyLink = {
  custody_role: string
  started_at: string
  ended_at: string | null
  signer_public_key: string
  link_hash: string | null
}

export type DossierData = {
  order: {
    id: string
    status: string
    origin_country: string | null
    destination_country: string | null
    incoterm: string | null
    total_amount: number | null
    currency: string | null
  }
  lines: DossierLine[]
  corridor: {
    exit: TradeRule[]
    entry: TradeRule[]
    alwaysCount: number
    conditionalCount: number
  }
  cargo: ContainerAssignment | null
  documents: { doc_type: string; reference: string }[]
  settlement: DossierSettlement | null
  custody: DossierCustodyLink[]
  precinto: { leadDppId: string | null; chainOk: boolean; signaturesOk: number; links: number }
}

/** Reúne el dossier completo de un pedido desde la BD. */
export async function fetchOrderDossier(
  sb: SupabaseClient,
  orderId: string,
): Promise<DossierData | null> {
  const { data: order } = await sb
    .from('orders')
    .select('id, status, origin_country, destination_country, incoterm, total_amount, currency')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return null

  const [linesRes, docsRes, setRes] = await Promise.all([
    sb.from('order_lines').select('sku_snapshot, title_snapshot, quantity, unit_price, product_id, dpp_registry_id').eq('order_id', orderId),
    sb.from('order_documents').select('doc_type, reference').eq('order_id', orderId).order('doc_type'),
    sb.from('order_settlements').select('gross, currency, fee_1503, net_to_seller, rail, status, verified_on_ledger, simulated').eq('order_id', orderId).maybeSingle(),
  ])
  const rawLines = linesRes.data ?? []

  // Medidas de bulto desde products.sector_data (para la carga + el HS).
  const productIds = rawLines.map((l) => l.product_id).filter(Boolean) as string[]
  const { data: prods } = productIds.length
    ? await sb.from('products').select('id, hs_code, sector_data').in('id', productIds)
    : { data: [] as { id: string; hs_code: string | null; sector_data: Record<string, unknown> }[] }
  const prodById = Object.fromEntries((prods ?? []).map((p) => [p.id, p]))

  const lines: DossierLine[] = rawLines.map((l) => ({
    sku: l.sku_snapshot ?? '—',
    title: (l.title_snapshot as Record<string, string>) ?? null,
    quantity: Number(l.quantity),
    unit_price: Number(l.unit_price ?? 0),
    amount: round2(Number(l.quantity) * Number(l.unit_price ?? 0)),
    hs_code: (prodById[l.product_id as string]?.hs_code as string) ?? null,
    dpp_registry_id: l.dpp_registry_id,
  }))

  // ── Carga 3D (motor real) ──
  const cargoItems: CargoItem[] = rawLines
    .map((l) => {
      const sd = prodById[l.product_id as string]?.sector_data as Record<string, number> | undefined
      if (!sd?.package_length_mm) return null
      return {
        id: l.sku_snapshot ?? l.product_id ?? 'x',
        length_mm: sd.package_length_mm,
        width_mm: sd.package_width_mm,
        height_mm: sd.package_height_mm,
        weight_kg: sd.package_weight_kg,
        quantity: Number(l.quantity),
      }
    })
    .filter((x): x is CargoItem => x !== null)
  const cargo = cargoItems.length ? assignContainer(cargoItems) : null

  // ── Corredor (motor real) ──
  const reqs = getCorridorRequirements({ origin: order.origin_country ?? undefined, destination: order.destination_country ?? undefined })
  const byLayer = groupByLayer(reqs)
  const { always, conditional } = splitConditional(reqs)

  // ── Custodia + verificación del precinto (helper compartido con el resolutor) ──
  const leadDppId = rawLines.find((l) => l.dpp_registry_id)?.dpp_registry_id ?? null
  const seal = leadDppId ? await verifyDppCustody(sb, leadDppId) : null
  const custody: DossierCustodyLink[] = seal?.chain ?? []
  const chainOk = seal?.chainOk ?? false
  const signaturesOk = seal?.signaturesOk ?? 0

  return {
    order: {
      id: order.id,
      status: order.status,
      origin_country: order.origin_country,
      destination_country: order.destination_country,
      incoterm: order.incoterm,
      total_amount: order.total_amount != null ? Number(order.total_amount) : null,
      currency: order.currency,
    },
    lines,
    corridor: { exit: byLayer.exit, entry: byLayer.entry, alwaysCount: always.length, conditionalCount: conditional.length },
    cargo,
    documents: (docsRes.data ?? []).map((d) => ({ doc_type: d.doc_type, reference: d.reference })),
    settlement: setRes.data
      ? {
          gross: Number(setRes.data.gross),
          currency: setRes.data.currency,
          fee_1503: Number(setRes.data.fee_1503),
          net_to_seller: Number(setRes.data.net_to_seller),
          rail: setRes.data.rail,
          status: setRes.data.status,
          verified_on_ledger: setRes.data.verified_on_ledger,
          simulated: setRes.data.simulated,
        }
      : null,
    custody,
    precinto: { leadDppId, chainOk, signaturesOk, links: custody.length },
  }
}
