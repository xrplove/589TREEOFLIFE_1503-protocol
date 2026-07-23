// Test unitario del portador de datos GS1 Digital Link (DPP · prEN 18220 / ESPR).
// Runner nativo node:test + node:assert (sin dependencias). Ejecuta con:
//   npm run test:unit   (o: node --import tsx --test app/lib/gs1DigitalLink.test.ts)
//
// GTINs usados (dígito de control verificado a mano, mod-10):
//   05901234123457  GTIN-14 (check 7)        · ejemplo GS1
//   5901234123457   EAN-13  (= GTIN-14 sin el 0 de relleno)
//   036000291452    UPC-A / GTIN-12 (check 2) · → GTIN-14 00036000291452
//   95012346        GTIN-8  (check 6)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeGtinCheckDigit,
  isValidGtin,
  toGtin14,
  buildGs1DigitalLink,
  parseGs1DigitalLink,
  gtinCandidates,
  GS1_CANONICAL_RESOLVER,
} from './gs1DigitalLink.ts'

// ── Dígito de control ──
test('computeGtinCheckDigit calcula el dígito mod-10 correcto', () => {
  assert.equal(computeGtinCheckDigit('0590123412345'), 7) // GTIN-14 body
  assert.equal(computeGtinCheckDigit('590123412345'), 7) // EAN-13 body (mismo check)
  assert.equal(computeGtinCheckDigit('03600029145'), 2) // UPC-A body
  assert.equal(computeGtinCheckDigit('9501234'), 6) // GTIN-8 body
})

test('computeGtinCheckDigit rechaza entrada no numérica', () => {
  assert.throws(() => computeGtinCheckDigit('12a45'))
})

// ── Validación ──
test('isValidGtin acepta GTIN-8/12/13/14 válidos', () => {
  assert.ok(isValidGtin('05901234123457')) // 14
  assert.ok(isValidGtin('5901234123457')) // 13
  assert.ok(isValidGtin('036000291452')) // 12
  assert.ok(isValidGtin('95012346')) // 8
  assert.ok(isValidGtin('5901234-123457')) // tolera guiones/espacios de cortesía
})

test('isValidGtin rechaza dígito de control erróneo y longitudes raras', () => {
  assert.equal(isValidGtin('05901234123456'), false) // check incorrecto
  assert.equal(isValidGtin('1234567890'), false) // longitud 10 no es GTIN
  assert.equal(isValidGtin('abcdefgh'), false) // no numérico
  assert.equal(isValidGtin(''), false)
})

// ── Normalización a GTIN-14 ──
test('toGtin14 rellena por la izquierda sin cambiar el dígito de control', () => {
  assert.equal(toGtin14('5901234123457'), '05901234123457') // EAN-13 → GTIN-14
  assert.equal(toGtin14('036000291452'), '00036000291452') // UPC-A → GTIN-14
  assert.equal(toGtin14('95012346'), '00000095012346') // GTIN-8 → GTIN-14
  assert.equal(toGtin14('05901234123457'), '05901234123457') // ya GTIN-14
})

test('toGtin14 lanza con GTIN inválido', () => {
  assert.throws(() => toGtin14('05901234123456'))
  assert.throws(() => toGtin14('123'))
})

// ── Construcción del Digital Link ──
test('buildGs1DigitalLink forma canónica (solo GTIN)', () => {
  assert.equal(
    buildGs1DigitalLink({ gtin: '5901234123457' }),
    `${GS1_CANONICAL_RESOLVER}/01/05901234123457`,
  )
})

test('buildGs1DigitalLink respeta el orden canónico de cualificadores (22 → 10 → 21)', () => {
  assert.equal(
    buildGs1DigitalLink({ gtin: '05901234123457', serial: 'SN123', lot: 'L-A', cpv: 'V1' }),
    `${GS1_CANONICAL_RESOLVER}/01/05901234123457/22/V1/10/L-A/21/SN123`,
  )
})

test('buildGs1DigitalLink añade fechas como query y valida YYMMDD', () => {
  assert.equal(
    buildGs1DigitalLink({ gtin: '05901234123457', serial: 'SN123', expiry: '271231' }),
    `${GS1_CANONICAL_RESOLVER}/01/05901234123457/21/SN123?17=271231`,
  )
  assert.throws(() => buildGs1DigitalLink({ gtin: '05901234123457', expiry: '2027-12-31' }))
})

test('buildGs1DigitalLink URL-encodea valores con caracteres reservados', () => {
  const uri = buildGs1DigitalLink({ gtin: '05901234123457', serial: 'SN/123' })
  assert.match(uri, /\/21\/SN%2F123$/)
})

test('buildGs1DigitalLink admite resolver propio (self-hosted) y limpia barra final', () => {
  assert.equal(
    buildGs1DigitalLink({ gtin: '05901234123457', resolver: 'https://1503.com/' }),
    'https://1503.com/01/05901234123457',
  )
})

test('buildGs1DigitalLink lanza con GTIN inválido', () => {
  assert.throws(() => buildGs1DigitalLink({ gtin: '05901234123456' }))
})

// ── Parseo inverso + roundtrip ──
test('parseGs1DigitalLink hace roundtrip de build', () => {
  const input = { gtin: '05901234123457', lot: 'L-A', serial: 'SN/123', expiry: '271231', resolver: 'https://1503.com' }
  const parsed = parseGs1DigitalLink(buildGs1DigitalLink(input))
  assert.equal(parsed.resolver, 'https://1503.com')
  assert.equal(parsed.gtin14, '05901234123457')
  assert.equal(parsed.lot, 'L-A')
  assert.equal(parsed.serial, 'SN/123') // decodificado
  assert.equal(parsed.expiry, '271231')
})

test('parseGs1DigitalLink tolera cualificadores en otro orden', () => {
  const parsed = parseGs1DigitalLink('https://id.gs1.org/01/05901234123457/21/SN123/10/L-A')
  assert.equal(parsed.serial, 'SN123')
  assert.equal(parsed.lot, 'L-A')
})

test('parseGs1DigitalLink lanza si falta la clave primaria 01', () => {
  assert.throws(() => parseGs1DigitalLink('https://id.gs1.org/21/SN123'))
})

test('parseGs1DigitalLink lanza con URI no válido', () => {
  assert.throws(() => parseGs1DigitalLink('no-es-una-url'))
})

// ── gtinCandidates ──
test('gtinCandidates incluye gtin14 y sus variantes con ceros a la izquierda', () => {
  // EAN-13: gtin14 con un 0 de relleno → candidato de 13
  assert.deepEqual(new Set(gtinCandidates('05901234123457')), new Set(['05901234123457', '5901234123457']))
  // UPC-A: gtin14 con dos 0 → candidatos de 13 y 12
  assert.deepEqual(
    new Set(gtinCandidates('00036000291452')),
    new Set(['00036000291452', '0036000291452', '036000291452']),
  )
  // GTIN-14 sin ceros a la izquierda → solo él mismo
  assert.deepEqual(gtinCandidates('19501234123457'), ['19501234123457'])
})
