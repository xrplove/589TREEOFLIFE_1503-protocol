// Tests del núcleo puro de las firmas del e-CMR (C2 · puente firmas→estado).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEcmrSignaturePayload,
  isTimestampWithinWindow,
  allowedEcmrPurposes,
  deriveTransportStatus,
  isEcmrPurpose,
  type EcmrPurpose,
} from './ecmrSignatures.ts'
import { generateKeyPair, signString, verifyString } from '../ed25519Crypto.ts'

const BASE = {
  order_id: '918bf57d-501b-4426-9528-9ec22e4d538c',
  document_reference: 'EBL-OP-2026-00001',
  timestamp: '2026-07-02T20:00:00.000Z',
  signer_user_id: '373a6756-6e54-4117-b341-038725d3a413',
}

test('payload canónico: determinista, claves ordenadas (RFC 8785) y sensible a cada campo', () => {
  const a = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier' })
  const b = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier' })
  assert.equal(a, b) // determinista: cliente y servidor reconstruyen IDÉNTICO
  const parsed = JSON.parse(a)
  assert.deepEqual(Object.keys(parsed), ['action', 'document_reference', 'order_id', 'purpose', 'signer_user_id', 'timestamp'])
  assert.equal(parsed.action, 'ecmr_signature')
  // cambiar cualquier campo cambia el payload (nada se firma "por fuera")
  assert.notEqual(a, buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_sender' }))
  assert.notEqual(a, buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier', timestamp: '2026-07-02T20:00:01.000Z' }))
})

test('el ciclo firmar→verificar cierra con la lib canónica ed25519 (misma que la custodia)', async () => {
  const kp = await generateKeyPair()
  const payload = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_delivery' })
  const sig = await signString(payload, kp.privateKey)
  assert.equal(await verifyString(sig.signature, payload, kp.publicKey), true)
  // firma sobre OTRO payload no verifica (anti-transplante)
  const otro = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_sender' })
  assert.equal(await verifyString(sig.signature, otro, kp.publicKey), false)
})

test('ventana anti-replay ±5 min', () => {
  const now = Date.parse('2026-07-02T20:00:00.000Z')
  assert.equal(isTimestampWithinWindow('2026-07-02T19:56:00.000Z', now), true)
  assert.equal(isTimestampWithinWindow('2026-07-02T20:04:59.000Z', now), true)
  assert.equal(isTimestampWithinWindow('2026-07-02T19:54:59.000Z', now), false)
  assert.equal(isTimestampWithinWindow('no-es-fecha', now), false)
})

test('matriz de autorización: vendedor=remitente · custodio=porteador · comprador=entrega', () => {
  const seller = 'S', buyer = 'B', transitario = 'T'
  const ctx = (callerUserId: string, custodian = false) => ({
    callerUserId, sellerUserId: seller, buyerUserId: buyer, callerIsCustodianCarrier: custodian,
  })
  assert.deepEqual(allowedEcmrPurposes(ctx(seller)), ['ecmr_sender'])
  assert.deepEqual(allowedEcmrPurposes(ctx(buyer)), ['ecmr_delivery'])
  assert.deepEqual(allowedEcmrPurposes(ctx(transitario, true)), ['ecmr_carrier'])
  assert.deepEqual(allowedEcmrPurposes(ctx('otro')), []) // tercero: nada (404 opaco en la ruta)
  // un vendedor que además custodiara firmaría ambas (caso borde legal admitido)
  assert.deepEqual(allowedEcmrPurposes(ctx(seller, true)), ['ecmr_sender', 'ecmr_carrier'])
})

test('puente firmas→estado: draft → issued (2 firmas Art. 5) → in_transit (pedido) → delivered (Art. 13)', () => {
  const s = (...p: EcmrPurpose[]) => new Set(p)
  assert.equal(deriveTransportStatus(s(), 'confirmed'), 'draft')
  assert.equal(deriveTransportStatus(s('ecmr_sender'), 'confirmed'), 'draft') // 1 sola firma NO emite
  assert.equal(deriveTransportStatus(s('ecmr_sender', 'ecmr_carrier'), 'confirmed'), 'issued')
  assert.equal(deriveTransportStatus(s('ecmr_sender', 'ecmr_carrier'), 'in_transit'), 'in_transit')
  assert.equal(deriveTransportStatus(s('ecmr_sender', 'ecmr_carrier', 'ecmr_delivery'), 'delivered'), 'delivered')
  assert.equal(deriveTransportStatus(s('ecmr_delivery'), 'closed'), 'delivered') // la entrega manda
  // honesto: pedido en tránsito SIN firmas de emisión → el documento no avanza
  assert.equal(deriveTransportStatus(s('ecmr_sender'), 'in_transit'), 'draft')
})

test('re-verificación desde BD: el timestamp se NORMALIZA — la forma de Postgres reconstruye el payload byte-idéntico', () => {
  // El cliente firma con toISOString; Postgres devuelve '+00:00' (u otra forma).
  // buildEcmrSignaturePayload normaliza ambos → mismo payload → firma re-verificable.
  const conZ = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier', timestamp: '2026-07-02T20:00:00.000Z' })
  const dePostgres = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier', timestamp: '2026-07-02 20:00:00+00' })
  const conOffset = buildEcmrSignaturePayload({ ...BASE, purpose: 'ecmr_carrier', timestamp: '2026-07-02T22:00:00.000+02:00' })
  assert.equal(conZ, dePostgres)
  assert.equal(conZ, conOffset) // mismo instante en otra zona → mismo payload
})

test('isEcmrPurpose gatea el enum', () => {
  assert.equal(isEcmrPurpose('ecmr_sender'), true)
  assert.equal(isEcmrPurpose('creation'), false)
  assert.equal(isEcmrPurpose(42), false)
})
