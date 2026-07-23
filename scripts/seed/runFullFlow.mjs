// ════════════════════════════════════════════════════════════════════════════
// PRUEBA SERIA · flujo completo Artikalia → 1503 · ES→CO · HASTA EL PAGO (simulado)
// ────────────────────────────────────────────────────────────────────────────
// Orquesta, EN MEMORIA y sin tocar BD, el flujo de punta a punta usando los MOTORES
// REALES de 1503 (corredor de cumplimiento + cubicaje) y los módulos del conector:
//
//   ingesta 100 fichas → preparación 2028 → pedido ES→CO → corredor + carga 3D
//   → precinto digital (DPP) → docs (factura/packing/seguro/DUA) → escrow → 0,5%
//
// CANON: todo SIMULADO y etiquetado. Sin PII. Ningún dinero se mueve. Sirve para
// demostrar que el mecanismo funciona de punta a punta. NO es go-live.
//
// USO:  node --import tsx scripts/seed/runFullFlow.mjs
// Salida: scripts/seed/dossier-flujo.json  +  resumen por consola.
// ════════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

import { fichaCanonicaToProductBody } from '../../app/lib/connector/contract.ts'
import { esprReadiness } from '../../app/data/espr/furnitureDpp.ts'
import { getCorridorRequirements, groupByLayer, splitConditional } from '../../app/data/tradeCompliance.ts'
import { assignContainer } from '../../app/lib/containerAssign.ts'
import { buildTradeDocs } from '../../app/lib/connector/tradeDocs.ts'
import { openEscrow, fundEscrow, releaseEscrow } from '../../app/lib/connector/escrow.ts'
import { buildDppRecord } from '../../app/lib/dppCreate.ts'
import { DEFAULT_DPP_RESOLVER } from '../../app/lib/dppDataCarrier.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const log = (...a) => console.log(...a)

// ── 0 · Cargar el catálogo generado (100 fichas) ──
const catalogo = JSON.parse(readFileSync(join(__dirname, 'artikalia-100.json'), 'utf8'))

// ── 1 · INGESTA simulada: todas legales hoy · medir preparación 2028 ──
let ingestadas = 0
let ready2028 = 0
for (const ficha of catalogo) {
  const body = fichaCanonicaToProductBody(ficha, { sectorId: 'inmobiliario', subCategoria: 'producto_interiorismo' })
  // Hoy el mueble es legal sin ESPR → todas se ingestan; medimos preparación 2028.
  ingestadas++
  if (esprReadiness(body).ready) ready2028++
}
log(`\n① INGESTA (conector · gate hoy=legal):`)
log(`   · ${ingestadas}/100 fichas ingestadas (todas legales hoy)`)
log(`   · ${ready2028}/100 ya listas para la ley de 2028 (DPP ESPR completo)`)

// ── 2 · PEDIDO ES→CO: 6 artículos 2028-ready ──
const elegidas = catalogo.filter((f) => f._demo.ready2028).slice(0, 6)
const QTYS = [10, 4, 6, 2, 8, 3]
const ORDER_REF = 'ORD-PRUEBA-001'

const lines = elegidas.map((f, i) => {
  const grossUnit = f.bulto.peso_kg
  return {
    sku: f.sku,
    description: f.titulo,
    quantity: QTYS[i] ?? 2,
    unit_price: f.precio.valor,
    currency: 'EUR',
    hs_code: f.hs_code,
    origin_country: 'ES',
    net_weight_kg: round2(grossUnit * 0.9),
    gross_weight_kg: grossUnit,
    package: { length_mm: f.bulto.largo_mm, width_mm: f.bulto.ancho_mm, height_mm: f.bulto.alto_mm, type: f.bulto.tipo },
  }
})

const shipment = {
  reference: ORDER_REF,
  exporter: { name: 'Artihome SL (Artikalia · demo)', country: 'ES', role: 'exporter', tax_ref: 'ESB-DEMO' },
  importer: { name: 'Importadora Andina SAS (demo)', country: 'CO', role: 'importer' },
  origin_country: 'ES',
  destination_country: 'CO',
  incoterm: 'CIF',
  currency: 'EUR',
}
const total = round2(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0))
log(`\n② PEDIDO ${ORDER_REF} · ${shipment.exporter.country}→${shipment.importer.country} · ${lines.length} líneas · total ${total} EUR (CIF)`)

// ── 3 · CORREDOR (motor real de cumplimiento) ──
const reqs = getCorridorRequirements({ origin: 'ES', destination: 'CO' })
const byLayer = groupByLayer(reqs)
const { always, conditional } = splitConditional(reqs)
log(`\n③ CORREDOR ES→CO (motor real · ${reqs.length} reglas):`)
log(`   · salida UE: ${byLayer.exit.length} · entrada CO: ${byLayer.entry.length}`)
log(`   · siempre exigibles: ${always.map((r) => r.id).join(', ')}`)
log(`   · condicionales: ${conditional.map((r) => r.id).join(', ')}`)

// ── 4 · CARGA / CUBICAJE 3D (motor real) ──
const cargoItems = lines.map((l) => ({
  id: l.sku,
  length_mm: l.package.length_mm,
  width_mm: l.package.width_mm,
  height_mm: l.package.height_mm,
  weight_kg: l.gross_weight_kg,
  quantity: l.quantity,
}))
const cargo = assignContainer(cargoItems)
log(`\n④ CARGA 3D (motor real): modo ${cargo.mode} · ${cargo.count} contenedor(es) ${cargo.container ?? ''} · ${cargo.utilization_pct}% ocupación · ${cargo.total_volume_m3} m³ · ${cargo.total_weight_kg} kg`)
log(`   · ${cargo.reason}`)

// ── 5 · PRECINTO DIGITAL (DPP) por línea ──
const precintos = lines.map((l) => {
  const built = buildDppRecord({
    input: {
      product_id: randomUUID(),
      manufacturing_country: 'ES',
      production_date: '2026-05-01',
      materials: [{ name: 'madera', percentage: 90 }],
      carbon_footprint_kg_co2eq: null,
      water_footprint_l: null,
      recycled_content_pct: null,
      recyclability_pct: null,
      hs_code: l.hs_code,
      serial_number: null,
    },
    product: { sector_id: 'inmobiliario', gtin: null },
    ownerUserId: 'artikalia-pilot',
    dppUid: randomUUID(),
    resolver: DEFAULT_DPP_RESOLVER,
  })
  return { sku: l.sku, ok: built.ok, hash: built.ok ? built.record.hash_canonical_sha256 : null, uri: built.ok ? built.dataCarrierUri : null }
})
const precintosOk = precintos.filter((p) => p.ok).length
log(`\n⑤ PRECINTO DIGITAL (DPP): ${precintosOk}/${lines.length} acuñados (hash canónico SHA-256 + portador GS1)`)
log(`   · ej: ${precintos[0].sku} → ${precintos[0].hash?.slice(0, 16)}…`)

// ── 6 · DOCUMENTACIÓN (factura · packing · seguro · DUA) ──
const docs = buildTradeDocs(shipment, lines)
log(`\n⑥ DOCUMENTACIÓN del transitario:`)
log(`   · Factura ${docs.commercial_invoice.reference}: ${docs.commercial_invoice.total} EUR`)
log(`   · Packing list ${docs.packing_list.reference}: ${docs.packing_list.totals.packages} bultos · ${docs.packing_list.totals.gross_weight_kg} kg · ${docs.packing_list.totals.volume_m3} m³`)
log(`   · Seguro ${docs.insurance_certificate.reference}: asegurado ${docs.insurance_certificate.insured_value} EUR (CIF+10% · ICC-A)`)
log(`   · DUA ${docs.dua.reference}: régimen ${docs.dua.customs_regime} · valor estadístico ${docs.dua.total_statistical_value} EUR`)

// ── 7 · ESCROW → PAGO (0,5% simulado) ──
let escrow = openEscrow({ orderRef: ORDER_REF, gross: total, currency: 'EUR', modality: '04_importacion' })
escrow = fundEscrow(escrow)
escrow = releaseEscrow(escrow)
const s = escrow.settlement
log(`\n⑦ ESCROW → PAGO (simulado · verify-on-ledger):`)
log(`   · estado: ${escrow.state}`)
log(`   · bruto ${s.gross} EUR → comisión 1503 (0,5%) = ${s.fee_1503} EUR · neto vendedor = ${s.net_to_seller} EUR`)
log(`   · rail: ${s.rail} · verificado on-ledger: ${s.verified_on_ledger} (SIMULADO)`)

// ── Dossier completo (para revisar) ──
const dossier = {
  generated: 'demo · prueba seria · sin BD · sin dinero real',
  ingesta: { ingestadas, ready2028 },
  pedido: { reference: ORDER_REF, ...shipment, lines, total },
  corredor: { total: reqs.length, always: always.map((r) => r.id), conditional: conditional.map((r) => r.id) },
  carga: cargo,
  precintos,
  documentos: docs,
  escrow,
}
const outFile = join(__dirname, 'dossier-flujo.json')
writeFileSync(outFile, JSON.stringify(dossier, null, 2), 'utf8')

log(`\n✔ FLUJO COMPLETO HASTA EL PAGO — dossier en ${outFile}`)
log(`  Nada aplicado a BD · nada de dinero real · todo verificable.\n`)
