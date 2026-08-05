// ════════════════════════════════════════════════════════════════════════════
// INGESTA IoT · el veredicto PURO por lectura de un batch (sin red, sin BD)
// ────────────────────────────────────────────────────────────────────────────
// La ruta machine-facing POST /api/iot/telemetry no tiene sesión: la
// AUTENTICACIÓN de cada lectura es su propia firma ed25519 verificada sobre el
// payload RECONSTRUIDO (nunca se confía en lo enviado) + el enrolamiento del
// device (eso sí lo mira la ruta en BD). Aquí vive todo lo decidible sin BD:
// forma, rangos, frescura, firma y replay intra-batch — testeable al 100%.
// El replay inter-batch lo remata la BD (UNIQUE(device_public_key, nonce)).
// ════════════════════════════════════════════════════════════════════════════

import {
  validateReading,
  verifyReadingSignature,
  type ReadingInput,
} from './telemetry'
import { isValidEd25519Signature } from '../ed25519Crypto'

/** Ventana de frescura de la ingesta (plan v1): |ahora − reading_at| ≤ 10 min.
 *  El backlog store-and-forward de hardware real (subir horas tras recuperar
 *  cobertura) queda fuera de v1 — ampliar hacia atrás es un interruptor aquí. */
export const TELEMETRY_FRESHNESS_MS = 10 * 60_000

/** Skew máximo hacia el FUTURO. La ventana es amplia hacia el pasado (backlog)
 *  pero el `reading_at` lo firma el device y se persiste como instante de la
 *  evidencia (event_at de la incidencia, orden de la serie): una lectura "del
 *  futuro" distorsiona el orden temporal, así que solo se tolera un skew de reloj. */
export const TELEMETRY_FUTURE_SKEW_MS = 30_000

/** Tope de lecturas por request (anti-abuso · visible en la respuesta 400). */
export const TELEMETRY_BATCH_MAX = 500

export type BatchItemVerdict =
  | { ok: true; reading: ReadingInput; signature: string }
  | { ok: false; reason: string }

/**
 * Evalúa UNA lectura cruda del batch. `devicePublicKey` viene del top-level del
 * body (el device del request) y se INYECTA — una lectura no puede suplantar a
 * otro firmante. `seenNonces` detecta replay dentro del mismo batch; el replay
 * entre batches lo rechaza la BD (23505 → skip idempotente en la ruta).
 */
export async function evaluateBatchReading(
  raw: unknown,
  devicePublicKey: string,
  nowMs: number,
  seenNonces: Set<string>,
): Promise<BatchItemVerdict> {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'lectura no es un objeto' }
  const r = raw as Record<string, unknown>

  const validation = validateReading({ ...r, device_public_key: devicePublicKey })
  if (!validation.ok) return { ok: false, reason: validation.reason }
  const reading = validation.reading

  const t = Date.parse(reading.reading_at)
  if (t - nowMs > TELEMETRY_FUTURE_SKEW_MS) {
    return { ok: false, reason: 'reading_at en el futuro (más allá del skew de reloj permitido)' }
  }
  if (nowMs - t > TELEMETRY_FRESHNESS_MS) {
    return { ok: false, reason: 'reading_at demasiado antigua (fuera de la ventana de frescura)' }
  }

  if (seenNonces.has(reading.nonce)) return { ok: false, reason: 'nonce repetido en el batch (replay)' }

  const signature = typeof r.signature === 'string' ? r.signature.trim().toLowerCase() : ''
  if (!isValidEd25519Signature(signature)) return { ok: false, reason: 'signature inválida (ed25519 hex 128)' }
  const verified = await verifyReadingSignature({ ...reading, signature })
  if (!verified) return { ok: false, reason: 'la firma no verifica sobre el payload reconstruido' }

  seenNonces.add(reading.nonce)
  return { ok: true, reading, signature }
}

/** ¿La lectura de temperatura viola el rango reefer declarado en el DPP?
 *  (el gate del evento `incidencia_reportada` · límites INCLUSIVOS, como
 *  evaluateColdChain). Sin rango declarado no hay excursión posible. */
export function isReeferExcursion(
  reading: ReadingInput,
  spec: { reefer_temp_min_c: number | null; reefer_temp_max_c: number | null },
): boolean {
  if (reading.kind !== 'temperature_c') return false
  if (spec.reefer_temp_min_c === null || spec.reefer_temp_max_c === null) return false
  const v = reading.value as number
  return v < spec.reefer_temp_min_c || v > spec.reefer_temp_max_c
}

/** Particiona el valor según el kind hacia las columnas de device_readings
 *  (value_num para magnitudes, value_json para gps/seal_state). */
export function splitReadingValue(reading: ReadingInput): { value_num: number | null; value_json: unknown | null } {
  switch (reading.kind) {
    case 'temperature_c':
    case 'humidity_pct':
    case 'shock_g':
      return { value_num: reading.value as number, value_json: null }
    case 'gps':
    case 'seal_state':
    case 'delivery_ack':
      return { value_num: null, value_json: reading.value }
  }
}
