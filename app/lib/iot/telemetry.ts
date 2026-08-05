// ════════════════════════════════════════════════════════════════════════════
// TELEMETRÍA IoT · la lectura de sensor como EVIDENCIA firmada (Web 4.0)
// ────────────────────────────────────────────────────────────────────────────
// Web 4.0 (definición UE · COM(2023) 442): integración de objetos reales y
// digitales + interacción humano-máquina. En 1503 eso se concreta así: el
// DISPOSITIVO (datalogger/GPS/e-seal — o el simulador SEÑALIZADO mientras no
// hay hardware) percibe el mundo físico y FIRMA cada lectura con su clave
// ed25519 DE TELEMETRÍA; el motor de reglas VERIFICA (este módulo + la ingesta);
// el oráculo decide con esa evidencia; XRPL liquida. IoT/IA = percepción,
// JAMÁS ejecución financiera: un dispositivo nunca tiene claves XRPL.
//
// Reutiliza EXACTAMENTE el patrón canónico probado (DPP/e-CMR/CertOp/x402):
// RFC 8785 (JCS) + timestamp normalizado + nonce anti-replay. Una lectura
// persistida en `device_readings` (mig 079) es re-verificable por un tercero
// reconstruyendo este payload byte-idéntico y comprobando la firma — la misma
// prueba de oro que el resto de la evidencia de la casa.
//
// PURO: sin red, sin BD. La ingesta (app/api/iot/telemetry) y el oráculo
// (oracleSettle) consumen este módulo; los tests lo cubren sin infraestructura.
// ════════════════════════════════════════════════════════════════════════════

import { canonicalize } from '../jcsCanonical'
import { canonicalHash } from '../dppHash'
import { normalizeSignatureTimestamp } from '../connector/ecmrSignatures'
import { verifyString, isValidEd25519Key, isValidEd25519Signature } from '../ed25519Crypto'

/** Versión del contrato de lectura firmada (entra en el payload canónico). */
export const IOT_READING_SCHEMA = '1503_iot_reading@1.0' as const

export const READING_KINDS = [
  'temperature_c', // value: number · °C
  'humidity_pct',  // value: number · % humedad relativa
  'gps',           // value: {lat,lng,accuracy_m?} · SOLO mercancía (jamás personas)
  'shock_g',       // value: number · pico de aceleración en g
  'seal_state',    // value: {state:'sealed'|'open'|'tamper'} · precinto electrónico
  'delivery_ack',  // value: {state,peer_public_key?,po_reference?,observed_location?} · atestación M2M de robot (LDevID)
] as const
export type ReadingKind = (typeof READING_KINDS)[number]

export type GpsValue = { lat: number; lng: number; accuracy_m?: number }
export type SealStateValue = { state: 'sealed' | 'open' | 'tamper' }
/** delivery_ack · atestación de entrega/handoff M2M firmada por un robot (LDevID).
 *  `peer_public_key` ata la contraparte DENTRO del payload firmado (patrón x402);
 *  `observed_location` = geo del handoff, SOLO mercancía (jamás personas). El
 *  contrato Zod público (API/SDK) vive en app/lib/robotics/m2mAttestation.ts. */
export type DeliveryAckValue = {
  state: 'delivered' | 'received'
  peer_public_key?: string
  po_reference?: string
  observed_location?: { lat: number; lng: number; accuracy_m?: number }
}
export type ReadingValue = number | GpsValue | SealStateValue | DeliveryAckValue

// Rangos físicos PLAUSIBLES (fail-closed: fuera de esto la lectura se RECHAZA
// con motivo — un sensor que reporta -200 °C está roto o miente; no entra al
// expediente). Visibles y testeados, nunca silenciosos.
export const TEMP_PLAUSIBLE_MIN_C = -90
export const TEMP_PLAUSIBLE_MAX_C = 100
export const SHOCK_PLAUSIBLE_MAX_G = 500
export const GPS_ACCURACY_MAX_M = 10_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NONCE_MIN = 8
const NONCE_MAX = 128

export type ReadingInput = {
  /** Clave ed25519 PÚBLICA de telemetría del device (hex 64 · identifica al firmante). */
  device_public_key: string
  /** Expediente (DPP) al que sirve la lectura. */
  dpp_id: string
  /** Pedido asociado o null (igual que x402: el campo SIEMPRE está, sin ambigüedad). */
  order_id: string | null
  kind: ReadingKind
  value: ReadingValue
  /** Instante de la MEDICIÓN · ISO 8601 · se normaliza SIEMPRE (byte-idéntico desde BD). */
  reading_at: string
  /** Nonce único por dispositivo (anti-replay fino · UNIQUE(device_public_key,nonce) en BD). */
  nonce: string
}

/** Registro persistido (device_readings) que permite re-verificar la firma. */
export type ReadingRecord = ReadingInput & { signature: string }

export type ReadingValidation =
  | { ok: true; reading: ReadingInput }
  | { ok: false; reason: string }

// ────────────────────────────────────────────────────────────────────────────
// Validación del VALOR según el kind (fail-closed, con motivo).
// ────────────────────────────────────────────────────────────────────────────

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function validateValueForKind(kind: ReadingKind, value: unknown): string | null {
  switch (kind) {
    case 'temperature_c': {
      if (!isFiniteNumber(value)) return 'temperature_c requiere un número finito'
      if (value < TEMP_PLAUSIBLE_MIN_C || value > TEMP_PLAUSIBLE_MAX_C) {
        return `temperatura fuera del rango físico plausible [${TEMP_PLAUSIBLE_MIN_C}, ${TEMP_PLAUSIBLE_MAX_C}] °C`
      }
      return null
    }
    case 'humidity_pct': {
      if (!isFiniteNumber(value)) return 'humidity_pct requiere un número finito'
      if (value < 0 || value > 100) return 'humedad relativa fuera de [0, 100] %'
      return null
    }
    case 'shock_g': {
      if (!isFiniteNumber(value)) return 'shock_g requiere un número finito'
      if (value < 0 || value > SHOCK_PLAUSIBLE_MAX_G) {
        return `impacto fuera del rango plausible [0, ${SHOCK_PLAUSIBLE_MAX_G}] g`
      }
      return null
    }
    case 'gps': {
      const v = value as GpsValue
      if (typeof v !== 'object' || v === null) return 'gps requiere {lat,lng}'
      if (!isFiniteNumber(v.lat) || v.lat < -90 || v.lat > 90) return 'gps.lat fuera de [-90, 90]'
      if (!isFiniteNumber(v.lng) || v.lng < -180 || v.lng > 180) return 'gps.lng fuera de [-180, 180]'
      if (v.accuracy_m !== undefined) {
        if (!isFiniteNumber(v.accuracy_m) || v.accuracy_m < 0 || v.accuracy_m > GPS_ACCURACY_MAX_M) {
          return `gps.accuracy_m fuera de [0, ${GPS_ACCURACY_MAX_M}] m`
        }
      }
      const extras = Object.keys(v).filter((k) => !['lat', 'lng', 'accuracy_m'].includes(k))
      if (extras.length > 0) return `gps con campos no soportados: ${extras.join(', ')}`
      return null
    }
    case 'seal_state': {
      const v = value as SealStateValue
      if (typeof v !== 'object' || v === null) return 'seal_state requiere {state}'
      if (!['sealed', 'open', 'tamper'].includes(v.state)) {
        return "seal_state.state debe ser 'sealed' | 'open' | 'tamper'"
      }
      const extras = Object.keys(v).filter((k) => k !== 'state')
      if (extras.length > 0) return `seal_state con campos no soportados: ${extras.join(', ')}`
      return null
    }
    case 'delivery_ack': {
      const v = value as DeliveryAckValue
      if (typeof v !== 'object' || v === null) return 'delivery_ack requiere {state}'
      if (v.state !== 'delivered' && v.state !== 'received') {
        return "delivery_ack.state debe ser 'delivered' | 'received'"
      }
      if (v.peer_public_key !== undefined) {
        // Minúscula OBLIGATORIA (no case-insensitive): peer_public_key va DENTRO
        // del value firmado y NO se normaliza (a diferencia de device_public_key),
        // así que una única representación canónica exige lowercase en origen —
        // idéntico al contrato Zod Ed25519PublicKeySchema (sin flag /i).
        if (typeof v.peer_public_key !== 'string' || !/^[a-f0-9]{64}$/.test(v.peer_public_key)) {
          return 'delivery_ack.peer_public_key inválida (ed25519 hex 64 minúscula)'
        }
      }
      if (v.po_reference !== undefined) {
        if (typeof v.po_reference !== 'string' || v.po_reference.length < 1 || v.po_reference.length > 120) {
          return 'delivery_ack.po_reference fuera de [1, 120] chars'
        }
      }
      if (v.observed_location !== undefined) {
        const loc = v.observed_location
        if (typeof loc !== 'object' || loc === null) return 'delivery_ack.observed_location requiere {lat,lng}'
        if (!isFiniteNumber(loc.lat) || loc.lat < -90 || loc.lat > 90) return 'delivery_ack.observed_location.lat fuera de [-90, 90]'
        if (!isFiniteNumber(loc.lng) || loc.lng < -180 || loc.lng > 180) return 'delivery_ack.observed_location.lng fuera de [-180, 180]'
        if (loc.accuracy_m !== undefined) {
          if (!isFiniteNumber(loc.accuracy_m) || loc.accuracy_m < 0 || loc.accuracy_m > GPS_ACCURACY_MAX_M) {
            return `delivery_ack.observed_location.accuracy_m fuera de [0, ${GPS_ACCURACY_MAX_M}] m`
          }
        }
        const locExtras = Object.keys(loc).filter((k) => !['lat', 'lng', 'accuracy_m'].includes(k))
        if (locExtras.length > 0) return `delivery_ack.observed_location con campos no soportados: ${locExtras.join(', ')}`
      }
      const extras = Object.keys(v).filter(
        (k) => !['state', 'peer_public_key', 'po_reference', 'observed_location'].includes(k),
      )
      if (extras.length > 0) return `delivery_ack con campos no soportados: ${extras.join(', ')}`
      return null
    }
  }
}

/**
 * Valida una lectura CRUDA (body de la ingesta) fail-closed. Devuelve la
 * lectura tipada con pubkey normalizada (lowercase) y timestamp canónico, o el
 * MOTIVO exacto del rechazo (visible en la respuesta de la ingesta — un sensor
 * rechazado nunca es silencioso).
 */
export function validateReading(raw: unknown): ReadingValidation {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'lectura no es un objeto' }
  const r = raw as Record<string, unknown>

  const pubkey = typeof r.device_public_key === 'string' ? r.device_public_key.trim().toLowerCase() : ''
  if (!isValidEd25519Key(pubkey)) return { ok: false, reason: 'device_public_key inválida (ed25519 hex 64)' }

  const dppId = typeof r.dpp_id === 'string' ? r.dpp_id.trim() : ''
  if (!UUID_RE.test(dppId)) return { ok: false, reason: 'dpp_id no es un UUID' }

  let orderId: string | null = null
  if (r.order_id !== null && r.order_id !== undefined) {
    if (typeof r.order_id !== 'string' || !UUID_RE.test(r.order_id.trim())) {
      return { ok: false, reason: 'order_id no es un UUID (o null)' }
    }
    orderId = r.order_id.trim()
  }

  const kind = r.kind as ReadingKind
  if (!READING_KINDS.includes(kind)) {
    return { ok: false, reason: `kind no soportado (${READING_KINDS.join(' | ')})` }
  }

  const valueError = validateValueForKind(kind, r.value)
  if (valueError) return { ok: false, reason: valueError }

  const readingAtRaw = typeof r.reading_at === 'string' ? r.reading_at : ''
  if (Number.isNaN(Date.parse(readingAtRaw))) return { ok: false, reason: 'reading_at no es ISO 8601 parseable' }

  const nonce = typeof r.nonce === 'string' ? r.nonce : ''
  if (nonce.length < NONCE_MIN || nonce.length > NONCE_MAX) {
    return { ok: false, reason: `nonce fuera de [${NONCE_MIN}, ${NONCE_MAX}] chars` }
  }

  return {
    ok: true,
    reading: {
      device_public_key: pubkey,
      dpp_id: dppId,
      order_id: orderId,
      kind,
      value: r.value as ReadingValue,
      reading_at: normalizeSignatureTimestamp(readingAtRaw),
      nonce,
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Payload canónico + hash + re-verificación (patrón x402Attestation).
// ────────────────────────────────────────────────────────────────────────────

/** Objeto canónico compartido por buildReadingPayload y readingHash (byte-idénticos). */
function readingPayloadObject(input: ReadingInput) {
  const validation = validateReading(input)
  if (!validation.ok) throw new Error(`lectura inválida: ${validation.reason}`)
  const r = validation.reading
  return {
    schema: IOT_READING_SCHEMA,
    device_public_key: r.device_public_key,
    dpp_id: r.dpp_id,
    kind: r.kind,
    nonce: r.nonce,
    order_id: r.order_id,
    reading_at: r.reading_at,
    value: r.value,
  }
}

/**
 * Payload canónico (RFC 8785 · JCS) que el DISPOSITIVO firma con su clave de
 * telemetría. La ingesta lo RECONSTRUYE con los mismos campos y verifica la
 * firma sobre él (nunca confía en un payload enviado). Fail-closed: valida
 * la lectura entera antes de canonicalizar.
 */
export function buildReadingPayload(input: ReadingInput): string {
  return canonicalize(readingPayloadObject(input))
}

/** Hash SHA-256 del payload canónico (columna reading_hash · hex 64). */
export function readingHash(input: ReadingInput): string {
  return canonicalHash(readingPayloadObject(input)).hash
}

/**
 * Re-verifica una lectura desde su registro persistido (device_readings):
 * reconstruye el payload canónico y comprueba la firma ed25519 estricta
 * (zip215:false). Devuelve false ante CUALQUIER inconsistencia — nunca lanza.
 */
export async function verifyReadingSignature(record: ReadingRecord): Promise<boolean> {
  try {
    if (!isValidEd25519Key(record.device_public_key)) return false
    if (!isValidEd25519Signature(record.signature)) return false
    const payload = buildReadingPayload(record)
    return await verifyString(record.signature, payload, record.device_public_key.toLowerCase())
  } catch {
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// CADENA DE FRÍO · el motor del check físico del oráculo (PURO).
// ────────────────────────────────────────────────────────────────────────────

export type ColdChainSample = {
  /** Instante de la medición (ISO 8601). */
  at: string
  /** Temperatura medida en °C. */
  temp_c: number
}

export type ColdChainExcursion = {
  /** Primera lectura del tramo fuera de rango (ISO). */
  from: string
  /** Última lectura del tramo fuera de rango (ISO). */
  to: string
  /** El PEOR valor del tramo (máximo si excede por arriba, mínimo si por abajo). */
  peak: number
}

export type ColdChainAssessment = {
  /** true si NINGUNA lectura sale del rango declarado (con 0 muestras es
   *  trivialmente true — el fail-open lo decide el CALLER mirando samples). */
  conforming: boolean
  excursions: ColdChainExcursion[]
  /** DENSIDAD DE MUESTREO intra-ventana (%): cuántas muestras hay respecto a las
   *  esperadas EN EL SPAN OBSERVADO [primera, última], a la cadencia dada. NO es
   *  cobertura del viaje: 2 muestras separadas 5 s dan ~100% de densidad aunque el
   *  envío durase 10 días. El CALLER decide la confianza mirando `samples` y el
   *  span; un % alto sobre pocas muestras/span trivial no acredita la cadena. */
  sampling_density_pct: number
  /** Muestras VÁLIDAS evaluadas. */
  samples: number
  /** Duración del span observado [primera, última] en minutos (0 si <2 muestras).
   *  Permite al caller distinguir "denso en 5 s" de "denso en 10 días". */
  span_minutes: number
  /** Muestras descartadas (timestamp no parseable / temp no finita) — visible,
   *  nunca silencioso (regla de la casa: los filtros se ven en metadatos). */
  discarded: number
}

export type ColdChainSpec = {
  min_c: number
  max_c: number
  /** Cadencia esperada de muestreo para la cobertura (default 60 min). */
  expected_sample_minutes?: number
}

/**
 * Evalúa la serie de temperatura contra el rango reefer declarado en el DPP
 * (`dpp_registry.reefer_temp_min_c/max_c`). Límites INCLUSIVOS: una lectura
 * exactamente en min/max es conforme (el rango declarado es el contrato).
 * Ordena la serie por instante (acepta series desordenadas) y agrupa las
 * lecturas fuera de rango en TRAMOS CONTIGUOS (una lectura conforme cierra el
 * tramo). PURO y determinista: el oráculo y el desk deciden con esto.
 */
export function evaluateColdChain(samplesIn: ColdChainSample[], spec: ColdChainSpec): ColdChainAssessment {
  if (!Number.isFinite(spec.min_c) || !Number.isFinite(spec.max_c) || spec.min_c > spec.max_c) {
    throw new Error(`rango reefer inválido: [${spec.min_c}, ${spec.max_c}]`)
  }
  const expectedMinutes = spec.expected_sample_minutes ?? 60
  if (!Number.isFinite(expectedMinutes) || expectedMinutes <= 0) {
    throw new Error(`expected_sample_minutes inválido: ${expectedMinutes}`)
  }

  const parsed: { t: number; at: string; temp: number }[] = []
  let discarded = 0
  for (const s of samplesIn) {
    const t = Date.parse(s?.at ?? '')
    if (Number.isNaN(t) || !isFiniteNumber(s?.temp_c)) {
      discarded += 1
      continue
    }
    parsed.push({ t, at: s.at, temp: s.temp_c })
  }
  parsed.sort((a, b) => a.t - b.t)

  const excursions: ColdChainExcursion[] = []
  let open: { from: string; to: string; peak: number; peakDev: number } | null = null
  for (const p of parsed) {
    const outside = p.temp < spec.min_c || p.temp > spec.max_c
    if (!outside) {
      if (open) {
        excursions.push({ from: open.from, to: open.to, peak: open.peak })
        open = null
      }
      continue
    }
    // Desviación respecto al límite violado (para elegir el PEOR valor del tramo).
    const dev = p.temp > spec.max_c ? p.temp - spec.max_c : spec.min_c - p.temp
    if (!open) {
      open = { from: p.at, to: p.at, peak: p.temp, peakDev: dev }
    } else {
      open.to = p.at
      if (dev > open.peakDev) {
        open.peak = p.temp
        open.peakDev = dev
      }
    }
  }
  if (open) excursions.push({ from: open.from, to: open.to, peak: open.peak })

  // Densidad de muestreo intra-ventana: muestras observadas vs esperadas en el
  // span [primera, última] a la cadencia dada. NO es cobertura del viaje (ver el
  // doc del tipo): el caller decide la confianza mirando samples + span_minutes.
  let spanMinutes = 0
  let density = 0
  if (parsed.length >= 2) {
    spanMinutes = (parsed[parsed.length - 1]!.t - parsed[0]!.t) / 60_000
    const expected = Math.floor(spanMinutes / expectedMinutes) + 1
    density = Math.min(100, Math.round((parsed.length / expected) * 100))
  }

  return {
    conforming: excursions.length === 0,
    excursions,
    sampling_density_pct: density,
    samples: parsed.length,
    span_minutes: Math.round(spanMinutes),
    discarded,
  }
}
