import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TRADE_PAYMENT_METHODS,
  planEscrowTranches,
  validateTranches,
  sumTrancheBps,
  trancheAmount,
  type TradePaymentMethod,
} from './tradePaymentTerms.ts'

const ALL: TradePaymentMethod[] = [
  'cash_in_advance',
  'documentary_credit',
  'documentary_collection',
  'open_account',
  'consignment',
]

test('los 5 métodos canónicos existen y suman 100% en su plan base', () => {
  assert.equal(Object.keys(TRADE_PAYMENT_METHODS).length, 5)
  for (const m of ALL) {
    const spec = TRADE_PAYMENT_METHODS[m]
    assert.equal(spec.method, m)
    assert.equal(sumTrancheBps(spec.tranches), 10_000)
    validateTranches(spec.tranches) // no lanza
  }
})

test('crédito documentario = UCP 600, libera con documentos (papel del oráculo)', () => {
  const spec = TRADE_PAYMENT_METHODS.documentary_credit
  assert.equal(spec.iccRule, 'UCP 600')
  assert.equal(spec.tranches[0].release, 'on_documents')
  assert.equal(spec.riskBearer, 'shared')
})

test('cobranza documentaria = URC 522; cuenta abierta libera a vencimiento', () => {
  assert.equal(TRADE_PAYMENT_METHODS.documentary_collection.iccRule, 'URC 522')
  assert.equal(TRADE_PAYMENT_METHODS.open_account.tranches[0].release, 'on_terms_date')
  assert.equal(TRADE_PAYMENT_METHODS.consignment.tranches[0].release, 'on_resale')
})

test('pago anticipado: el escrow retiene hasta la entrega (protege al importador)', () => {
  const spec = TRADE_PAYMENT_METHODS.cash_in_advance
  assert.equal(spec.riskBearer, 'importer')
  assert.equal(spec.tranches[0].release, 'on_delivery')
})

test('split 30/70 produce depósito on_funding + saldo con la liberación del método', () => {
  const tranches = planEscrowTranches('documentary_credit', { depositPctBps: 3000 })
  assert.equal(tranches.length, 2)
  assert.deepEqual(
    tranches.map((t) => [t.label, t.pctBps, t.release]),
    [
      ['deposit', 3000, 'on_funding'],
      ['balance', 7000, 'on_documents'],
    ],
  )
  assert.equal(sumTrancheBps(tranches), 10_000)
})

test('sin depósito devuelve un solo tramo full', () => {
  const tranches = planEscrowTranches('cash_in_advance')
  assert.equal(tranches.length, 1)
  assert.equal(tranches[0].label, 'full')
})

test('depósito inválido (0, 10000, no entero) lanza', () => {
  assert.throws(() => planEscrowTranches('open_account', { depositPctBps: 0 }))
  assert.throws(() => planEscrowTranches('open_account', { depositPctBps: 10_000 }))
  assert.throws(() => planEscrowTranches('open_account', { depositPctBps: 1500.5 }))
})

test('validateTranches rechaza sumas != 10000', () => {
  assert.throws(() => validateTranches([{ label: 'full', pctBps: 9000, release: 'on_delivery' }]))
})

test('trancheAmount reparte el importe por bps', () => {
  assert.equal(trancheAmount(1000, 3000), 300)
  assert.equal(trancheAmount(1000, 7000), 700)
  assert.equal(trancheAmount(22941.9, 5000), 11470.95)
})
