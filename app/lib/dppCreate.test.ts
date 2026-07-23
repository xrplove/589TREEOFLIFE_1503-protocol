// Test del alta de DPP (lógica pura · keystone · ADR 0023). Runner node:test.
//   node --import tsx --test app/lib/dppCreate.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDppRecord, DPP_SCHEMA_VERSION, type DppCreateInput } from './dppCreate.ts'
import { verifyCanonicalHash } from './dppHash.ts'

const UID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
const OWNER = '11111111-2222-3333-4444-555555555555'

function baseInput(): DppCreateInput {
  return {
    product_id: 'prod-1',
    manufacturing_country: 'ES',
    production_date: '2026-05-01',
    materials: [{ name: 'roble', percentage: 80 }],
    carbon_footprint_kg_co2eq: 12.5,
    recyclability_pct: 90,
    hs_code: '940360',
  }
}

test('con GTIN acuña GS1 Digital Link y calcula hash íntegro', () => {
  const r = buildDppRecord({
    input: baseInput(),
    product: { sector_id: 'inmobiliario', gtin: '05901234123457' },
    ownerUserId: OWNER,
    dppUid: UID,
    resolver: 'https://1503.com',
  })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.record.id, UID)
  assert.equal(r.record.owner_user_id, OWNER)
  assert.equal(r.record.sector_id, 'inmobiliario')
  assert.equal(r.dataCarrierUri, 'https://1503.com/01/05901234123457')
  assert.equal(r.record.schema_version, DPP_SCHEMA_VERSION)
  assert.match(r.hash, /^[0-9a-f]{64}$/)
})

test('sin GTIN acuña portador interino /dpp/{id}', () => {
  const r = buildDppRecord({
    input: baseInput(),
    product: { sector_id: 'inmobiliario', gtin: null },
    ownerUserId: OWNER,
    dppUid: UID,
    resolver: 'https://1503.com',
  })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.dataCarrierUri, `https://1503.com/dpp/${UID}`)
})

test('el hash es determinista y verificable (JCS RFC 8785)', () => {
  const args = {
    input: baseInput(),
    product: { sector_id: 'inmobiliario', gtin: null },
    ownerUserId: OWNER,
    dppUid: UID,
    resolver: 'https://1503.com',
  }
  const a = buildDppRecord(args)
  const b = buildDppRecord(args)
  assert.ok(a.ok && b.ok)
  if (!a.ok || !b.ok) return
  assert.equal(a.hash, b.hash) // determinista
  assert.ok(verifyCanonicalHash(JSON.parse(a.canonicalPayload), a.hash)) // verificable
})

test('el payload hasheado NO contiene PII (owner)', () => {
  const r = buildDppRecord({
    input: baseInput(),
    product: { sector_id: 'inmobiliario', gtin: null },
    ownerUserId: OWNER,
    dppUid: UID,
  })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.canonicalPayload.includes(OWNER), false)
})

test('rechaza datos inválidos', () => {
  const bad = (patch: Partial<DppCreateInput>) =>
    buildDppRecord({
      input: { ...baseInput(), ...patch },
      product: { sector_id: 'x', gtin: null },
      ownerUserId: OWNER,
      dppUid: UID,
    })
  assert.equal(bad({ manufacturing_country: 'ESP' }).ok, false) // no ISO2
  assert.equal(bad({ production_date: '01/05/2026' }).ok, false) // formato
  assert.equal(bad({ production_date: '2026-13-40' }).ok, false) // fecha imposible
  assert.equal(bad({ hs_code: 'AB' }).ok, false) // hs inválido
  assert.equal(bad({ recyclability_pct: 150 }).ok, false) // fuera de rango
  assert.equal(bad({ materials: 'no-array' as unknown as unknown[] }).ok, false)
})

test('rechaza dppUid no-uuid', () => {
  const r = buildDppRecord({
    input: baseInput(),
    product: { sector_id: 'x', gtin: null },
    ownerUserId: OWNER,
    dppUid: 'no-uuid',
  })
  assert.equal(r.ok, false)
})
