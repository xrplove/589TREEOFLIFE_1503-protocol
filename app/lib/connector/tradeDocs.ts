// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTACIÓN DE COMERCIO · transitario · factura · packing list · seguro · DUA
// ────────────────────────────────────────────────────────────────────────────
// Generadores PUROS (sin BD, deterministas, testeables) de los documentos de una
// expedición ES→destino. Operan sobre un `ShipmentInput` (pedido + partes + líneas)
// y devuelven documentos estructurados (datos, no PDF) con los campos estándar.
//
// CANON: documentos de DEMO etiquetados (`demo: true`). Sin PII real. Los importes
// son referencia comercial (1503 NO custodia). Cada documento es trazable al pedido.
// ════════════════════════════════════════════════════════════════════════════

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export type ShipmentParty = {
  name: string
  country: string // ISO alpha-2
  role: 'exporter' | 'importer' | 'forwarder' | 'insurer'
  tax_ref?: string
  address?: string
}

export type ShipmentLine = {
  sku: string
  description: string
  quantity: number
  unit_price: number
  currency: string
  hs_code?: string
  origin_country?: string // ISO alpha-2
  net_weight_kg: number
  gross_weight_kg: number
  package: { length_mm: number; width_mm: number; height_mm: number; type: string }
}

export type ShipmentInput = {
  reference: string // referencia del pedido
  exporter: ShipmentParty
  importer: ShipmentParty
  origin_country: string // ISO alpha-2
  destination_country: string // ISO alpha-2
  incoterm: string // EXW/FOB/CIF/…
  currency: string
}

// ── Helpers de totales (compartidos por los documentos) ──
function lineAmount(l: ShipmentLine): number {
  return round2(l.quantity * l.unit_price)
}
function volumeM3(l: ShipmentLine): number {
  const { length_mm, width_mm, height_mm } = l.package
  return round2((length_mm * width_mm * height_mm * l.quantity) / 1_000_000_000)
}
export function shipmentTotals(lines: ShipmentLine[]): {
  amount: number
  packages: number
  net_weight_kg: number
  gross_weight_kg: number
  volume_m3: number
} {
  return lines.reduce(
    (t, l) => ({
      amount: round2(t.amount + lineAmount(l)),
      packages: t.packages + l.quantity,
      net_weight_kg: round2(t.net_weight_kg + l.net_weight_kg * l.quantity),
      gross_weight_kg: round2(t.gross_weight_kg + l.gross_weight_kg * l.quantity),
      volume_m3: round2(t.volume_m3 + volumeM3(l)),
    }),
    { amount: 0, packages: 0, net_weight_kg: 0, gross_weight_kg: 0, volume_m3: 0 },
  )
}

// ════════════════════════════════════════════════════════════════════════════
// 1 · FACTURA COMERCIAL (commercial invoice)
// ════════════════════════════════════════════════════════════════════════════
export type CommercialInvoice = {
  doc_type: 'commercial_invoice'
  reference: string
  seller: ShipmentParty
  buyer: ShipmentParty
  incoterm: string
  currency: string
  lines: { sku: string; description: string; quantity: number; unit_price: number; amount: number; hs_code?: string; origin_country?: string }[]
  total: number
  demo: true
}

export function buildCommercialInvoice(s: ShipmentInput, lines: ShipmentLine[]): CommercialInvoice {
  return {
    doc_type: 'commercial_invoice',
    reference: `INV-${s.reference}`,
    seller: s.exporter,
    buyer: s.importer,
    incoterm: s.incoterm,
    currency: s.currency,
    lines: lines.map((l) => ({
      sku: l.sku,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      amount: lineAmount(l),
      hs_code: l.hs_code,
      origin_country: l.origin_country ?? s.origin_country,
    })),
    total: shipmentTotals(lines).amount,
    demo: true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2 · PACKING LIST (lista de contenido / bultos)
// ════════════════════════════════════════════════════════════════════════════
export type PackingList = {
  doc_type: 'packing_list'
  reference: string
  exporter: ShipmentParty
  importer: ShipmentParty
  lines: { sku: string; description: string; packages: number; package_type: string; dims_mm: string; net_weight_kg: number; gross_weight_kg: number }[]
  totals: { packages: number; net_weight_kg: number; gross_weight_kg: number; volume_m3: number }
  demo: true
}

export function buildPackingList(s: ShipmentInput, lines: ShipmentLine[]): PackingList {
  return {
    doc_type: 'packing_list',
    reference: `PL-${s.reference}`,
    exporter: s.exporter,
    importer: s.importer,
    lines: lines.map((l) => ({
      sku: l.sku,
      description: l.description,
      packages: l.quantity,
      package_type: l.package.type,
      dims_mm: `${l.package.length_mm}×${l.package.width_mm}×${l.package.height_mm}`,
      net_weight_kg: round2(l.net_weight_kg * l.quantity),
      gross_weight_kg: round2(l.gross_weight_kg * l.quantity),
    })),
    totals: (() => {
      const t = shipmentTotals(lines)
      return { packages: t.packages, net_weight_kg: t.net_weight_kg, gross_weight_kg: t.gross_weight_kg, volume_m3: t.volume_m3 }
    })(),
    demo: true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3 · CERTIFICADO DE SEGURO DE CARGA (cargo insurance certificate)
// ════════════════════════════════════════════════════════════════════════════
export type InsuranceCertificate = {
  doc_type: 'insurance_certificate'
  reference: string
  insured: ShipmentParty // normalmente el exportador/importador según incoterm
  currency: string
  // Valor asegurado estándar = CIF + 10% (uso de mercado · Institute Cargo Clauses).
  invoice_value: number
  insured_value: number
  coverage: 'Institute Cargo Clauses (A)'
  route: string
  demo: true
}

export function buildInsuranceCertificate(s: ShipmentInput, lines: ShipmentLine[]): InsuranceCertificate {
  const invoiceValue = shipmentTotals(lines).amount
  // CIF aproximado = factura (+ flete/seguro si EXW/FOB se asume incluido en demo) → +10%.
  const insuredValue = round2(invoiceValue * 1.1)
  return {
    doc_type: 'insurance_certificate',
    reference: `INS-${s.reference}`,
    insured: s.exporter,
    currency: s.currency,
    invoice_value: invoiceValue,
    insured_value: insuredValue,
    coverage: 'Institute Cargo Clauses (A)',
    route: `${s.origin_country} → ${s.destination_country}`,
    demo: true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4 · DUA / SAD (declaración aduanera de exportación · Documento Único Administrativo)
// ════════════════════════════════════════════════════════════════════════════
export type Dua = {
  doc_type: 'dua_sad'
  reference: string
  // Régimen aduanero: 10 = exportación definitiva (casilla 37 del DUA).
  customs_regime: '10 00'
  exporter: ShipmentParty
  importer: ShipmentParty
  origin_country: string
  destination_country: string
  currency: string
  items: { sku: string; hs_code?: string; origin_country?: string; quantity: number; gross_weight_kg: number; statistical_value: number }[]
  total_statistical_value: number
  total_gross_weight_kg: number
  demo: true
}

export function buildDua(s: ShipmentInput, lines: ShipmentLine[]): Dua {
  const t = shipmentTotals(lines)
  return {
    doc_type: 'dua_sad',
    reference: `DUA-${s.reference}`,
    customs_regime: '10 00',
    exporter: s.exporter,
    importer: s.importer,
    origin_country: s.origin_country,
    destination_country: s.destination_country,
    currency: s.currency,
    items: lines.map((l) => ({
      sku: l.sku,
      hs_code: l.hs_code,
      origin_country: l.origin_country ?? s.origin_country,
      quantity: l.quantity,
      gross_weight_kg: round2(l.gross_weight_kg * l.quantity),
      statistical_value: lineAmount(l),
    })),
    total_statistical_value: t.amount,
    total_gross_weight_kg: t.gross_weight_kg,
    demo: true,
  }
}

/** Construye el juego documental completo de una expedición. */
export function buildTradeDocs(s: ShipmentInput, lines: ShipmentLine[]) {
  return {
    commercial_invoice: buildCommercialInvoice(s, lines),
    packing_list: buildPackingList(s, lines),
    insurance_certificate: buildInsuranceCertificate(s, lines),
    dua: buildDua(s, lines),
  }
}
