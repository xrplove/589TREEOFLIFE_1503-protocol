// Tests de la atestación de entrega M2M (EJ-1) · parte PURA (sin red · sin BD).
// Prueba de oro (como telemetría/x402): la firma ed25519 del robot sobre el
// payload canónico RE-VERIFICA reconstruyéndolo; una alteración la rompe. Y se
// fija que el payload usa LOS MISMOS bytes canónicos que la telemetría (una sola
// fuente) y que el contrato Zod no diverge de la validación de la ingesta.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildM2mAttestationPayload,
  signM2mAttestation,
  verifyM2mAttestation,
  validateM2mAttestationValue,
  type M2mAttestationInput,
} from './m2mAttestation.ts'
import { buildReadingPayload, validateReading } from '../iot/telemetry.ts'
import { splitReadingValue } from '../iot/ingest.ts'
import { generateKeyPair } from '../ed25519Crypto.ts'

const DPP = '0b25de4e-3f10-4c8a-9d55-1c2a7e9b1a11'
const ORDER = 'f495a1d2-f084-4c20-bc8e-fae199faffb8'

const BASE: M2mAttestationInput = {
  device_public_key: 'a'.repeat(64),
  dpp_id: DPP,
  order_id: ORDER,
  value: { state: 'delivered' },
  reading_at: '2026-07-25T10:00:00.000Z',
  nonce: 'robot-0001-abcd',
}

// ─────────────────── una sola fuente de bytes canónicos (JCS) ─────────────────

test('el payload M2M usa EXACTAMENTE los bytes de la telemetría (no reimplementa JCS)', () => {
  const viaM2m = buildM2mAttestationPayload(BASE)
  const viaReading = buildReadingPayload({ ...BASE, kind: 'delivery_ack' })
  assert.equal(viaM2m, viaReading)
})

test('el payload es determinista y normaliza el timestamp (byte-idéntico)', () => {
  const a = buildM2mAttestationPayload(BASE)
  const b = buildM2mAttestationPayload({ ...BASE, reading_at: '2026-07-25T10:00:00Z' })
  assert.equal(a, b)
})

test('el binding de contraparte (peer_public_key) cambia el payload firmado', () => {
  const sin = buildM2mAttestationPayload(BASE)
  const con = buildM2mAttestationPayload({
    ...BASE,
    value: { state: 'delivered', peer_public_key: 'b'.repeat(64) },
  })
  assert.notEqual(sin, con)
})

// ─────────────────────────── firma round-trip (oro) ──────────────────────────

test('la firma del robot RE-VERIFICA desde el registro reconstruido', async () => {
  const kp = await generateKeyPair()
  const input: M2mAttestationInput = { ...BASE, device_public_key: kp.publicKey.toLowerCase() }
  const signature = await signM2mAttestation(input, kp.privateKey)
  assert.equal(await verifyM2mAttestation({ ...input, signature }), true)
})

test('prueba negativa: alterar estado, contraparte, nonce o instante invalida la firma', async () => {
  const kp = await generateKeyPair()
  const input: M2mAttestationInput = {
    ...BASE,
    device_public_key: kp.publicKey.toLowerCase(),
    value: { state: 'delivered', peer_public_key: 'c'.repeat(64) },
  }
  const signature = await signM2mAttestation(input, kp.privateKey)
  assert.equal(await verifyM2mAttestation({ ...input, signature, value: { state: 'received', peer_public_key: 'c'.repeat(64) } }), false)
  assert.equal(await verifyM2mAttestation({ ...input, signature, value: { state: 'delivered', peer_public_key: 'd'.repeat(64) } }), false)
  assert.equal(await verifyM2mAttestation({ ...input, signature, nonce: 'robot-9999-zzzz' }), false)
  assert.equal(await verifyM2mAttestation({ ...input, signature, reading_at: '2026-07-25T11:00:00.000Z' }), false)
})

test('verifyM2mAttestation NUNCA lanza ante basura', async () => {
  assert.equal(await verifyM2mAttestation({ ...BASE, signature: 'zz' }), false)
})

// ──────────────────────── contrato Zod del value (API/SDK) ────────────────────

test('validateM2mAttestationValue acepta un value bien formado y completo', () => {
  const r = validateM2mAttestationValue({
    state: 'received',
    peer_public_key: 'b'.repeat(64),
    po_reference: 'PO-2026-0042',
    observed_location: { lat: 39.46, lng: -0.38, accuracy_m: 8 },
  })
  assert.ok(r.ok)
})

test('validateM2mAttestationValue rechaza state inválido, extras, clave y geo mala', () => {
  assert.ok(!validateM2mAttestationValue({ state: 'roto' }).ok)
  assert.ok(!validateM2mAttestationValue({ state: 'delivered', foo: 1 }).ok)
  assert.ok(!validateM2mAttestationValue({ state: 'delivered', peer_public_key: 'corta' }).ok)
  assert.ok(!validateM2mAttestationValue({ state: 'delivered', observed_location: { lat: 91, lng: 0 } }).ok)
  assert.ok(!validateM2mAttestationValue(null).ok)
})

// ─── el contrato Zod y la validación de la ingesta (telemetry) NO divergen ────

test('telemetry.validateReading acepta delivery_ack y coincide con el contrato Zod', () => {
  const okReading = validateReading({ ...BASE, kind: 'delivery_ack' })
  assert.ok(okReading.ok)
  // Ambos validadores rechazan los mismos casos (guardan contra divergencia):
  const badExtras = { ...BASE, kind: 'delivery_ack', value: { state: 'delivered', foo: 1 } }
  assert.ok(!validateReading(badExtras).ok)
  assert.ok(!validateM2mAttestationValue(badExtras.value).ok)
  const badState = { ...BASE, kind: 'delivery_ack', value: { state: 'roto' } }
  assert.ok(!validateReading(badState).ok)
  assert.ok(!validateM2mAttestationValue(badState.value).ok)
})

test('peer_public_key en MAYÚSCULAS lo rechazan AMBOS validadores (no divergen · representación canónica única)', () => {
  const upper = { state: 'delivered', peer_public_key: 'A'.repeat(64) }
  // Contrato Zod (API/SDK):
  assert.ok(!validateM2mAttestationValue(upper).ok)
  // Autoridad de la ingesta (telemetry):
  assert.ok(!validateReading({ ...BASE, kind: 'delivery_ack', value: upper }).ok)
  // Y en minúscula ambos lo aceptan:
  const lower = { state: 'delivered', peer_public_key: 'a'.repeat(64) }
  assert.ok(validateM2mAttestationValue(lower).ok)
  assert.ok(validateReading({ ...BASE, kind: 'delivery_ack', value: lower }).ok)
})

test('splitReadingValue enruta delivery_ack a value_json (objeto, no número)', () => {
  const v = validateReading({ ...BASE, kind: 'delivery_ack' })
  assert.ok(v.ok)
  if (v.ok) {
    const split = splitReadingValue(v.reading)
    assert.equal(split.value_num, null)
    assert.deepEqual(split.value_json, { state: 'delivered' })
  }
})
