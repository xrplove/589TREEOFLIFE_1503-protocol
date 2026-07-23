// Test del resolver DPP (lógica pura · rodaja 3 · ADR 0023). Runner node:test.
//   node --import tsx --test app/lib/dppResolver.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isUuid,
  toConsumerPassport,
  toJsonLd,
  escapeHtml,
  renderPassportHtml,
  type DppResolverRow,
} from './dppResolver.ts'

const UID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

// Fila completa con campos SENSIBLES extra (simulando la fila real de dpp_registry).
function rowWithSecrets(): DppResolverRow & Record<string, unknown> {
  return {
    id: UID,
    hs_code: '940360',
    materials: [{ name: 'roble', percentage: 80 }],
    carbon_footprint_kg_co2eq: 12.5,
    water_footprint_l: 30,
    recycled_content_pct: 20,
    recyclability_pct: 90,
    manufacturing_country: 'ES',
    production_date: '2026-05-01',
    serial_number: 'SN-7',
    data_carrier_uri: 'https://1503.com/dpp/' + UID,
    hash_canonical_sha256: 'a'.repeat(64),
    onchain_tx_hash: '0xabc',
    onchain_anchored_at: '2026-05-02T00:00:00Z',
    created_at: '2026-05-01T00:00:00Z',
    products: { title: { es: 'Silla', en: 'Chair' }, gtin: '05901234123457' },
    // campos que NUNCA deben salir:
    owner_user_id: 'secret-owner',
    manufacturing_facility_id: 'PLANT-X',
    eori_seller: 'ES123',
    vat_number_seller: 'ESB123',
  }
}

test('isUuid valida uuid', () => {
  assert.ok(isUuid(UID))
  assert.equal(isUuid('no-uuid'), false)
  assert.equal(isUuid(''), false)
})

test('toConsumerPassport: filtrado positivo (no filtra PII/comercial)', () => {
  const p = toConsumerPassport(rowWithSecrets())
  // contiene lo público
  assert.equal(p.name, 'Silla')
  assert.equal(p.gtin, '05901234123457')
  assert.equal(p.serial, 'SN-7')
  assert.equal(p.manufacturingCountry, 'ES')
  assert.equal(p.integrity.hashSha256, 'a'.repeat(64))
  // NO contiene lo sensible (ni como clave del objeto)
  const json = JSON.stringify(p)
  for (const secret of ['secret-owner', 'PLANT-X', 'ES123', 'ESB123', 'owner_user_id', 'manufacturing_facility_id']) {
    assert.equal(json.includes(secret), false, `el pasaporte público NO debe incluir "${secret}"`)
  }
})

test('toConsumerPassport: tolera products como array (join de Supabase)', () => {
  const row = rowWithSecrets()
  ;(row as DppResolverRow).products = [{ title: { es: 'Mesa' }, gtin: null }]
  const p = toConsumerPassport(row)
  assert.equal(p.name, 'Mesa')
  assert.equal(p.gtin, null)
})

test('toJsonLd: forma JSON-LD válida y sin nulos en additionalProperty', () => {
  const p = toConsumerPassport(rowWithSecrets())
  const ld = toJsonLd(p, 'https://1503.com/dpp/' + UID) as Record<string, unknown>
  assert.ok(ld['@context'])
  assert.equal(ld['@type'], 'Product')
  assert.equal(ld['@id'], 'https://1503.com/dpp/' + UID)
  assert.equal(ld.gtin, '05901234123457')
  const props = ld.additionalProperty as { name: string; value: unknown }[]
  assert.ok(props.every((x) => x.value !== null && x.value !== undefined))
  assert.ok(props.some((x) => x.name === 'hsCode' && x.value === '940360'))
})

test('escapeHtml neutraliza inyección', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;')
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(42), '42')
})

test('renderPassportHtml escapa el nombre (anti-XSS) y no inyecta script crudo', () => {
  const p = toConsumerPassport(rowWithSecrets())
  p.name = '<img src=x onerror=alert(1)>'
  const html = renderPassportHtml(p)
  assert.equal(html.includes('<img src=x onerror=alert(1)>'), false)
  assert.ok(html.includes('&lt;img'))
  assert.ok(html.includes('05901234123457')) // dato público presente
})
