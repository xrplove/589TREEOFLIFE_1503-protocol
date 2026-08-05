// Tests de la telemetría IoT (parte PURA · sin red · sin BD).
// Prueba de oro (como x402/CertOp): la firma ed25519 del dispositivo sobre el
// payload canónico RE-VERIFICA reconstruyéndolo, y una alteración la rompe.
// Y el motor de cadena de frío (evaluateColdChain) es el check físico del
// oráculo: sus tramos, límites y cobertura quedan fijados aquí.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  IOT_READING_SCHEMA,
  buildReadingPayload,
  readingHash,
  validateReading,
  verifyReadingSignature,
  evaluateColdChain,
  TEMP_PLAUSIBLE_MIN_C,
  TEMP_PLAUSIBLE_MAX_C,
  type ReadingInput,
  type ColdChainSample,
} from './telemetry.ts'
import { generateKeyPair, signString } from '../ed25519Crypto.ts'

const DPP = '0b25de4e-3f10-4c8a-9d55-1c2a7e9b1a11'
const ORDER = 'f495a1d2-f084-4c20-bc8e-fae199faffb8'

const BASE: ReadingInput = {
  device_public_key: 'a'.repeat(64),
  dpp_id: DPP,
  order_id: ORDER,
  kind: 'temperature_c',
  value: 4.2,
  reading_at: '2026-07-22T10:00:00.000Z',
  nonce: 'sim-0001-abcd',
}

// ────────────────────────────── payload canónico ─────────────────────────────

test('el payload es determinista y normaliza el timestamp (byte-idéntico)', () => {
  const a = buildReadingPayload(BASE)
  const b = buildReadingPayload({ ...BASE, reading_at: '2026-07-22T10:00:00Z' }) // sin ms
  assert.equal(a, b)
  assert.ok(a.includes(IOT_READING_SCHEMA))
})

test('el nonce cambia el payload (unicidad / anti-replay)', () => {
  assert.notEqual(buildReadingPayload(BASE), buildReadingPayload({ ...BASE, nonce: 'sim-0002-abcd' }))
})

test('order_id null firma distinto de un order_id concreto (sin ambigüedad)', () => {
  assert.notEqual(buildReadingPayload(BASE), buildReadingPayload({ ...BASE, order_id: null }))
})

test('readingHash es estable y hex 64', () => {
  const h1 = readingHash(BASE)
  const h2 = readingHash({ ...BASE, reading_at: '2026-07-22T10:00:00Z' })
  assert.equal(h1, h2)
  assert.match(h1, /^[0-9a-f]{64}$/)
})

test('build es fail-closed: lecturas inválidas LANZAN con motivo', () => {
  assert.throws(() => buildReadingPayload({ ...BASE, device_public_key: 'corta' }))
  assert.throws(() => buildReadingPayload({ ...BASE, dpp_id: 'no-uuid' }))
  assert.throws(() => buildReadingPayload({ ...BASE, nonce: 'corto' }))
  assert.throws(() => buildReadingPayload({ ...BASE, value: TEMP_PLAUSIBLE_MAX_C + 1 }))
})

// ─────────────────────────────── validateReading ─────────────────────────────

test('validateReading acepta la lectura y normaliza pubkey a minúsculas', () => {
  const v = validateReading({ ...BASE, device_public_key: 'A'.repeat(64) })
  assert.ok(v.ok)
  if (v.ok) assert.equal(v.reading.device_public_key, 'a'.repeat(64))
})

test('validateReading rechaza temperatura físicamente implausible, con motivo', () => {
  const frio = validateReading({ ...BASE, value: TEMP_PLAUSIBLE_MIN_C - 1 })
  assert.ok(!frio.ok)
  if (!frio.ok) assert.match(frio.reason, /rango físico plausible/)
})

test('validateReading rechaza kinds y valores incoherentes', () => {
  assert.ok(!validateReading({ ...BASE, kind: 'inventado' }).ok)
  assert.ok(!validateReading({ ...BASE, kind: 'humidity_pct', value: 101 }).ok)
  assert.ok(!validateReading({ ...BASE, kind: 'shock_g', value: -1 }).ok)
  assert.ok(!validateReading({ ...BASE, kind: 'gps', value: { lat: 91, lng: 0 } }).ok)
  assert.ok(!validateReading({ ...BASE, kind: 'gps', value: { lat: 39.5, lng: -0.38, extra: 1 } }).ok)
  assert.ok(!validateReading({ ...BASE, kind: 'seal_state', value: { state: 'roto' } }).ok)
  assert.ok(!validateReading({ ...BASE, reading_at: 'ayer por la tarde' }).ok)
  assert.ok(!validateReading({ ...BASE, order_id: 'no-uuid' }).ok)
  assert.ok(!validateReading(null).ok)
})

test('validateReading acepta gps y seal_state bien formados', () => {
  assert.ok(validateReading({ ...BASE, kind: 'gps', value: { lat: 39.46, lng: -0.38, accuracy_m: 12 } }).ok)
  assert.ok(validateReading({ ...BASE, kind: 'seal_state', value: { state: 'tamper' } }).ok)
})

// ─────────────────────────── firma round-trip (oro) ──────────────────────────

test('la firma del dispositivo RE-VERIFICA desde el registro persistido', async () => {
  const kp = await generateKeyPair()
  const input = { ...BASE, device_public_key: kp.publicKey.toLowerCase() }
  const { signature } = await signString(buildReadingPayload(input), kp.privateKey)
  assert.equal(await verifyReadingSignature({ ...input, signature }), true)
})

test('prueba negativa: alterar valor, nonce o instante invalida la firma', async () => {
  const kp = await generateKeyPair()
  const input = { ...BASE, device_public_key: kp.publicKey.toLowerCase() }
  const { signature } = await signString(buildReadingPayload(input), kp.privateKey)
  assert.equal(await verifyReadingSignature({ ...input, signature, value: 9.9 }), false)
  assert.equal(await verifyReadingSignature({ ...input, signature, nonce: 'otro-nonce-01' }), false)
  assert.equal(await verifyReadingSignature({ ...input, signature, reading_at: '2026-07-22T11:00:00.000Z' }), false)
})

test('verifyReadingSignature NUNCA lanza ante basura', async () => {
  assert.equal(await verifyReadingSignature({ ...BASE, signature: 'zz' }), false)
  assert.equal(
    await verifyReadingSignature({ ...BASE, value: Number.NaN as unknown as number, signature: 'a'.repeat(128) }),
    false,
  )
})

// ─────────────────────────── evaluateColdChain ───────────────────────────────

const SPEC = { min_c: 2, max_c: 8 }
const t = (h: number, m = 0) =>
  `2026-07-22T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
const s = (h: number, temp: number, m = 0): ColdChainSample => ({ at: t(h, m), temp_c: temp })

test('serie conforme: sin excursiones, cobertura completa a la cadencia esperada', () => {
  const r = evaluateColdChain([s(10, 4), s(11, 5), s(12, 6)], SPEC)
  assert.equal(r.conforming, true)
  assert.deepEqual(r.excursions, [])
  assert.equal(r.samples, 3)
  assert.equal(r.sampling_density_pct, 100)
  assert.equal(r.discarded, 0)
})

test('límites EXACTOS son conformes (el rango declarado es inclusivo)', () => {
  const r = evaluateColdChain([s(10, SPEC.min_c), s(11, SPEC.max_c)], SPEC)
  assert.equal(r.conforming, true)
})

test('excursión simple: tramo contiguo con from/to/peak correctos (por arriba)', () => {
  const r = evaluateColdChain([s(10, 4), s(11, 9), s(12, 12), s(13, 10), s(14, 5)], SPEC)
  assert.equal(r.conforming, false)
  assert.equal(r.excursions.length, 1)
  assert.deepEqual(r.excursions[0], { from: t(11), to: t(13), peak: 12 })
})

test('excursión por FRÍO: peak es el mínimo (la peor desviación bajo min)', () => {
  const r = evaluateColdChain([s(10, 4), s(11, 0), s(12, -3), s(13, 4)], SPEC)
  assert.equal(r.excursions.length, 1)
  assert.equal(r.excursions[0]!.peak, -3)
})

test('excursiones MÚLTIPLES: una lectura conforme cierra el tramo', () => {
  const r = evaluateColdChain([s(10, 9), s(11, 4), s(12, 10), s(13, 4)], SPEC)
  assert.equal(r.excursions.length, 2)
})

test('serie DESORDENADA se ordena por instante antes de evaluar', () => {
  const r = evaluateColdChain([s(13, 4), s(11, 9), s(10, 4), s(12, 10)], SPEC)
  assert.equal(r.excursions.length, 1)
  assert.deepEqual(r.excursions[0], { from: t(11), to: t(12), peak: 10 })
})

test('sin datos: conforming trivial · samples 0 · cobertura 0 (el fail-open lo decide el caller)', () => {
  const r = evaluateColdChain([], SPEC)
  assert.equal(r.conforming, true)
  assert.equal(r.samples, 0)
  assert.equal(r.sampling_density_pct, 0)
})

test('UNA sola muestra no acredita cadena: cobertura 0', () => {
  const r = evaluateColdChain([s(10, 4)], SPEC)
  assert.equal(r.samples, 1)
  assert.equal(r.sampling_density_pct, 0)
})

test('huecos de muestreo bajan la densidad (esperada 1/h · hay 3 de 7)', () => {
  const r = evaluateColdChain([s(10, 4), s(12, 5), s(16, 6)], SPEC)
  assert.equal(r.samples, 3)
  assert.equal(r.sampling_density_pct, Math.round((3 / 7) * 100))
})

test('densidad alta con span trivial NO miente como cobertura: span_minutes lo delata', () => {
  // Dos lecturas separadas 5 s (mismo minuto): densidad ~100% pero span ~0 min.
  const a = '2026-07-22T10:00:00.000Z'
  const b = '2026-07-22T10:00:05.000Z'
  const r = evaluateColdChain([{ at: a, temp_c: 4 }, { at: b, temp_c: 5 }], SPEC)
  assert.equal(r.samples, 2)
  assert.equal(r.sampling_density_pct, 100) // densa PARA ese span…
  assert.equal(r.span_minutes, 0) // …pero el span observado es ~0 min (no acredita un viaje)
})

test('muestras corruptas se DESCARTAN visibles en discarded, no en silencio', () => {
  const r = evaluateColdChain(
    [s(10, 4), { at: 'no-fecha', temp_c: 5 }, { at: t(11), temp_c: Number.NaN }, s(12, 5)],
    SPEC,
  )
  assert.equal(r.samples, 2)
  assert.equal(r.discarded, 2)
})

test('rango reefer inválido LANZA (min > max · no finito)', () => {
  assert.throws(() => evaluateColdChain([s(10, 4)], { min_c: 8, max_c: 2 }))
  assert.throws(() => evaluateColdChain([s(10, 4)], { min_c: Number.NaN, max_c: 8 }))
})
