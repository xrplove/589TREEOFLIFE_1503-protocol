// Test del secreto derivado del escrow: determinismo, aislamiento por operación,
// que el comprador NO puede derivarlo (necesita la clave del servidor), y que el
// cumplimiento ABRE la condición (formato XRPL PREIMAGE-SHA-256).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deriveEscrowCondition } from './escrowSecret.ts'

const KEY = 'clave-de-servidor-de-prueba-0123456789'
const ID = '918bf57d-501b-4426-9528-9ec22e4d538c'

test('determinista: mismo escrowId + clave → misma condición y cumplimiento (el oráculo re-deriva)', () => {
  const a = deriveEscrowCondition(ID, KEY)
  const b = deriveEscrowCondition(ID, KEY)
  assert.equal(a.condition, b.condition)
  assert.equal(a.fulfillment, b.fulfillment)
})

test('aislamiento por operación: distinto escrowId → distinta condición (no colisiona)', () => {
  const a = deriveEscrowCondition(ID, KEY)
  const b = deriveEscrowCondition('otra-operacion-uuid', KEY)
  assert.notEqual(a.condition, b.condition)
  assert.notEqual(a.fulfillment, b.fulfillment)
})

test('el comprador NO puede derivar el cumplimiento: sin la clave del servidor sale otro', () => {
  const oraculo = deriveEscrowCondition(ID, KEY)
  const atacante = deriveEscrowCondition(ID, 'clave-adivinada-por-el-comprador')
  assert.notEqual(oraculo.fulfillment, atacante.fulfillment)
})

test('formato XRPL PREIMAGE-SHA-256 (idéntico a xrplEscrow): 39B condición · 36B cumplimiento', () => {
  const { condition, fulfillment } = deriveEscrowCondition(ID, KEY)
  assert.equal(condition.length, 78)
  assert.ok(condition.startsWith('A0258020') && condition.endsWith('810120'))
  assert.equal(fulfillment.length, 72)
  assert.ok(fulfillment.startsWith('A0228020'))
})

test('el cumplimiento ABRE la condición: SHA256(preimage) == hash de la condición', () => {
  const { condition, fulfillment } = deriveEscrowCondition(ID, KEY)
  const preimage = Buffer.from(fulfillment.slice(8), 'hex') // quita A0228020
  const hash = createHash('sha256').update(preimage).digest('hex').toUpperCase()
  assert.equal(condition, `A0258020${hash}810120`)
})

test('sin clave de servidor lanza (fail-closed: no se crea un escrow inabrible)', () => {
  assert.throws(() => deriveEscrowCondition(ID, ''), /SERVER_ESCROW_KEY/)
})
