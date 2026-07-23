// Test unitario del acuñador del portador de datos DPP (rodaja 2 · ADR 0023).
// Runner node:test. Ejecuta: node --import tsx --test app/lib/dppDataCarrier.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mintDppDataCarrier,
  classifyDataCarrier,
  DEFAULT_DPP_RESOLVER,
} from './dppDataCarrier.ts'

const UID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301' // uuid v4 de ejemplo

// ── Acuñación con GTIN → GS1 Digital Link ──
test('con GTIN acuña un GS1 Digital Link (nivel modelo)', () => {
  const uri = mintDppDataCarrier({ dppUid: UID, gtin: '5901234123457', resolver: 'https://1503.com' })
  assert.equal(uri, 'https://1503.com/01/05901234123457')
})

test('con GTIN + serial acuña a nivel de ítem (AI 21)', () => {
  const uri = mintDppDataCarrier({ dppUid: UID, gtin: '05901234123457', serial: 'SN-7', lot: 'L1' })
  assert.equal(uri, `${DEFAULT_DPP_RESOLVER}/01/05901234123457/10/L1/21/SN-7`)
})

test('GTIN inválido propaga el error de la libreria GS1', () => {
  assert.throws(() => mintDppDataCarrier({ dppUid: UID, gtin: '05901234123456' }))
})

// ── Acuñación sin GTIN → URI interino resoluble ──
test('sin GTIN acuña URI interino {resolver}/dpp/{id}', () => {
  const uri = mintDppDataCarrier({ dppUid: UID, resolver: 'https://1503.com/' })
  assert.equal(uri, `https://1503.com/dpp/${UID}`)
})

test('sin GTIN exige dppUid uuid válido', () => {
  assert.throws(() => mintDppDataCarrier({ dppUid: 'no-uuid' }))
})

test('usa el resolver por defecto si no se pasa', () => {
  const uri = mintDppDataCarrier({ dppUid: UID })
  assert.ok(uri.startsWith(`${DEFAULT_DPP_RESOLVER}/dpp/`))
})

// ── Clasificación inversa (para el resolver de la rodaja 3) ──
test('classifyDataCarrier distingue Digital Link de interino', () => {
  assert.deepEqual(classifyDataCarrier('https://1503.com/01/05901234123457'), {
    kind: 'gs1',
    uri: 'https://1503.com/01/05901234123457',
  })
  assert.deepEqual(classifyDataCarrier(`https://1503.com/dpp/${UID}`), {
    kind: 'interim',
    dppUid: UID,
    uri: `https://1503.com/dpp/${UID}`,
  })
})

test('classifyDataCarrier roundtrip con mintDppDataCarrier (interino)', () => {
  const uri = mintDppDataCarrier({ dppUid: UID })
  const ref = classifyDataCarrier(uri)
  assert.equal(ref.kind, 'interim')
  if (ref.kind === 'interim') assert.equal(ref.dppUid, UID)
})

test('classifyDataCarrier lanza con URI irreconocible o no válido', () => {
  assert.throws(() => classifyDataCarrier('https://1503.com/algo/raro'))
  assert.throws(() => classifyDataCarrier('no-es-url'))
})
