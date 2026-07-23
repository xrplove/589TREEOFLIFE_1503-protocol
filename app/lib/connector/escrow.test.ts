// Test del escrow simulado (retener → fondear → liberar · 0,5%).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openEscrow, fundEscrow, releaseEscrow, refundEscrow } from './escrow.ts'

test('ciclo feliz: opened → funded → released reparte el 0,5%', () => {
  let e = openEscrow({ orderRef: 'ORD-1', gross: 5000, currency: 'EUR', modality: '04_importacion' })
  assert.equal(e.state, 'opened')
  e = fundEscrow(e)
  assert.equal(e.state, 'funded')
  e = releaseEscrow(e)
  assert.equal(e.state, 'released')
  assert.equal(e.settlement?.fee_1503, 25) // 0,5% de 5000
  assert.equal(e.settlement?.net_to_seller, 4975)
  assert.equal(e.settlement?.verified_on_ledger, false) // simulado
  assert.equal(e.events.length, 3)
})

test('modalidad local (Redsys): liberar NO aplica comisión 1503', () => {
  let e = openEscrow({ orderRef: 'ORD-2', gross: 5000, currency: 'EUR', modality: 'redsys_local' })
  e = releaseEscrow(fundEscrow(e))
  assert.equal(e.settlement?.fee_1503, 0)
  assert.equal(e.settlement?.net_to_seller, 5000)
})

test('transiciones inválidas se rechazan (no se libera sin fondear)', () => {
  const e = openEscrow({ orderRef: 'ORD-3', gross: 100, currency: 'EUR', modality: '01_directo' })
  assert.throws(() => releaseEscrow(e), /transición inválida/)
})

test('reembolso desde opened o funded', () => {
  const e = openEscrow({ orderRef: 'ORD-4', gross: 100, currency: 'EUR', modality: '01_directo' })
  const r = refundEscrow(e, 'operación cancelada')
  assert.equal(r.state, 'refunded')
  assert.throws(() => releaseEscrow(r), /transición inválida/)
})

test('entradas inválidas (gross negativo / currency mala) se rechazan', () => {
  assert.throws(() => openEscrow({ orderRef: 'x', gross: -1, currency: 'EUR', modality: '01_directo' }))
  assert.throws(() => openEscrow({ orderRef: 'x', gross: 1, currency: 'eur', modality: '01_directo' }))
})
