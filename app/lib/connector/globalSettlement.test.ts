// Test del núcleo de liquidación del 0,5% del lado Global (SIMULADO · ADR 0003 §6).
// Runner nativo node:test (sin dependencias). Ejecuta con: npm run test:unit
//
// Verifica: el 0,5% se aplica SOLO a las modalidades globales (no a redsys_local),
// la aritmética cuadra (fee + neto = bruto), y la simulación se marca honestamente
// como NO verificada on-ledger.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  COMMISSION_RATE_1503,
  computeGlobalSettlement,
  isGlobalModality,
} from './globalSettlement.ts'

test('la tasa del hub es 0,5%', () => {
  assert.equal(COMMISSION_RATE_1503, 0.005)
})

test('redsys_local NO devenga comisión (PYME suelta · 1503 no interviene)', () => {
  const s = computeGlobalSettlement({
    gross: 1000,
    currency: 'EUR',
    modality: 'redsys_local',
    orderRef: 'ord-1',
  })
  assert.equal(s.fee_1503, 0)
  assert.equal(s.net_to_seller, 1000)
  assert.equal(s.rate, 0)
  assert.equal(s.status, 'not_applicable_local')
  assert.equal(s.rail, 'none_local')
  assert.equal(s.ledger_ref, null)
})

test('modalidad global aplica el 0,5% y el neto sale por resta exacta', () => {
  const s = computeGlobalSettlement({
    gross: 1000,
    currency: 'EUR',
    modality: '04_importacion',
    orderRef: 'ord-2',
  })
  assert.equal(s.fee_1503, 5) // 0,5% de 1000
  assert.equal(s.net_to_seller, 995)
  assert.equal(s.fee_1503 + s.net_to_seller, s.gross, 'fee + neto debe sumar el bruto')
  assert.equal(s.rate, COMMISSION_RATE_1503)
})

test('la liquidación global es SIMULADA y honesta (no verificada on-ledger)', () => {
  const s = computeGlobalSettlement({
    gross: 250.5,
    currency: 'EUR',
    modality: '01_directo',
    orderRef: 'ord-3',
  })
  assert.equal(s.status, 'settled_simulated')
  assert.equal(s.rail, 'xrpl_rlusd_testnet_sim')
  assert.equal(s.verified_on_ledger, false, 'mientras sea simulación NO se afirma verificación')
  assert.equal(s.ledger_ref, 'sim:xrpl-testnet:ord-3')
})

test('redondeo a céntimos: importe con decimales no genera descuadre', () => {
  const s = computeGlobalSettlement({
    gross: 333.33,
    currency: 'EUR',
    modality: '02_b2b_nacional',
    orderRef: 'ord-4',
  })
  // 0,5% de 333,33 = 1,66665 → 1,67 (céntimos); neto = 331,66
  assert.equal(s.fee_1503, 1.67)
  assert.equal(s.net_to_seller, 331.66)
  assert.equal(Math.round((s.fee_1503 + s.net_to_seller) * 100) / 100, 333.33)
})

test('isGlobalModality distingue local de global', () => {
  assert.equal(isGlobalModality('redsys_local'), false)
  assert.equal(isGlobalModality('04_importacion'), true)
})

test('entradas inválidas se rechazan (fail-closed)', () => {
  assert.throws(() => computeGlobalSettlement({ gross: -1, currency: 'EUR', modality: '01_directo', orderRef: 'x' }))
  assert.throws(() => computeGlobalSettlement({ gross: 10, currency: 'eur', modality: '01_directo', orderRef: 'x' }))
  assert.throws(() => computeGlobalSettlement({ gross: 10, currency: 'EUR', modality: '01_directo', orderRef: '' }))
})
