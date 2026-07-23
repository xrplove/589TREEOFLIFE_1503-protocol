// Test de los generadores de documentación de comercio (factura/packing/seguro/DUA).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTradeDocs,
  shipmentTotals,
  type ShipmentInput,
  type ShipmentLine,
} from './tradeDocs.ts'

const S: ShipmentInput = {
  reference: 'ORD-001',
  exporter: { name: 'Artihome SL', country: 'ES', role: 'exporter', tax_ref: 'ESB-DEMO' },
  importer: { name: 'Importadora Andina SAS (demo)', country: 'CO', role: 'importer' },
  origin_country: 'ES',
  destination_country: 'CO',
  incoterm: 'CIF',
  currency: 'EUR',
}

const LINES: ShipmentLine[] = [
  {
    sku: 'ART-SILLA-1001', description: 'Silla roble', quantity: 10, unit_price: 320, currency: 'EUR',
    hs_code: '940161', origin_country: 'ES', net_weight_kg: 6, gross_weight_kg: 7,
    package: { length_mm: 600, width_mm: 550, height_mm: 900, type: 'box' },
  },
  {
    sku: 'ART-MESA-1002', description: 'Mesa comedor', quantity: 2, unit_price: 900, currency: 'EUR',
    hs_code: '940360', origin_country: 'ES', net_weight_kg: 38, gross_weight_kg: 42,
    package: { length_mm: 1800, width_mm: 950, height_mm: 200, type: 'crate' },
  },
]

test('totales de expedición: importe, bultos, pesos, volumen', () => {
  const t = shipmentTotals(LINES)
  assert.equal(t.amount, 10 * 320 + 2 * 900) // 5000
  assert.equal(t.packages, 12)
  assert.equal(t.gross_weight_kg, 10 * 7 + 2 * 42) // 154
})

test('factura comercial: líneas con amount y total correctos', () => {
  const { commercial_invoice } = buildTradeDocs(S, LINES)
  assert.equal(commercial_invoice.doc_type, 'commercial_invoice')
  assert.equal(commercial_invoice.lines[0].amount, 3200)
  assert.equal(commercial_invoice.total, 5000)
  assert.equal(commercial_invoice.incoterm, 'CIF')
  assert.equal(commercial_invoice.demo, true)
})

test('packing list: bultos, dims y pesos por línea + totales', () => {
  const { packing_list } = buildTradeDocs(S, LINES)
  assert.equal(packing_list.lines[0].packages, 10)
  assert.equal(packing_list.lines[0].dims_mm, '600×550×900')
  assert.equal(packing_list.totals.packages, 12)
  assert.equal(packing_list.totals.gross_weight_kg, 154)
})

test('certificado de seguro: valor asegurado = factura + 10% (CIF+10)', () => {
  const { insurance_certificate } = buildTradeDocs(S, LINES)
  assert.equal(insurance_certificate.invoice_value, 5000)
  assert.equal(insurance_certificate.insured_value, 5500)
  assert.equal(insurance_certificate.coverage, 'Institute Cargo Clauses (A)')
  assert.equal(insurance_certificate.route, 'ES → CO')
})

test('DUA: régimen exportación 10 00 + items con HS y valor estadístico', () => {
  const { dua } = buildTradeDocs(S, LINES)
  assert.equal(dua.customs_regime, '10 00')
  assert.equal(dua.items[0].hs_code, '940161')
  assert.equal(dua.total_statistical_value, 5000)
  assert.equal(dua.origin_country, 'ES')
  assert.equal(dua.destination_country, 'CO')
})
