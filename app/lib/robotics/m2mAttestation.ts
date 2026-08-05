// Atestación de entrega M2M (Machine-to-Machine) · Fase robótica/M2M (EJ-1).
//
// El CONTRATO PÚBLICO (API/SDK) de la atestación que un robot firma con su
// LDevID para acreditar una entrega/recepción. Es el JSON estándar, agnóstico de
// plataforma, que un fabricante (cobot · AMR · flota) construye, firma con su
// TPM/HSM y postea a `POST /api/iot/telemetry` — sin adaptar su firmware ni ROS2.
//
// UNA SOLA FUENTE DE BYTES CANÓNICOS: el payload se construye con
// `buildReadingPayload` de la telemetría (RFC 8785 · JCS + nonce anti-replay +
// timestamp normalizado). NO se reimplementa JCS aquí (evita el bug de
// divergencia de firmas). La atestación ES una lectura de `device_readings` con
// `kind='delivery_ack'`; su `value` (DeliveryAckValue) vive en telemetry.ts junto
// a los demás valores de lectura. Este módulo aporta:
//   · el contrato Zod del value (validación estructural para la API/SDK), y
//   · los helpers para construir/firmar/verificar la atestación.
//
// BINDING (patrón x402): `peer_public_key` (la contraparte del handoff) va DENTRO
// del value → dentro del payload canónico firmado → un facilitador comprometido no
// puede reescribir la contraparte sin invalidar la firma.
//
// FRONTERA (canon): el robot NUNCA tiene claves XRPL. Firma EVIDENCIA con su
// clave de telemetría (LDevID); la liberación del escrow la decide el oráculo.

import { z } from 'zod'
import {
  buildReadingPayload,
  verifyReadingSignature,
  type ReadingInput,
  type DeliveryAckValue,
} from '../iot/telemetry'
import { signString } from '../ed25519Crypto'
import { Ed25519PublicKeySchema, LatSchema, LngSchema } from '../../data/productSchemas/_dppValidators'

// ============================================================================
// CONTRATO ZOD DEL VALUE (API/SDK) · rechaza extras (fail-closed)
// ============================================================================

/** Geo del handoff (SOLO mercancía · jamás personas). Corrobora co-ubicación con
 *  el oráculo fijo de destino en el doble-control (Fase 2). */
const ObservedLocationSchema = z.strictObject({
  lat: LatSchema,
  lng: LngSchema,
  accuracy_m: z.number().min(0).max(10_000).optional(),
})

/** El `value` de una lectura `delivery_ack` — el contrato público de la
 *  atestación M2M. `strictObject` rechaza campos no soportados (igual que la
 *  validación de la ingesta en telemetry.ts). */
export const M2mAttestationValueSchema = z.strictObject({
  state: z.enum(['delivered', 'received']),
  /** Clave pública de la contraparte del handoff (binding · patrón x402). */
  peer_public_key: Ed25519PublicKeySchema.optional(),
  /** Referencia de pedido/PO legible. */
  po_reference: z.string().min(1).max(120).optional(),
  observed_location: ObservedLocationSchema.optional(),
})

// Comprobación de tipos BIDIRECCIONAL: el contrato Zod (API/SDK) y el value del
// reading (telemetry.ts) no pueden divergir en silencio — si uno cambia, tsc rompe.
const _fwd = (v: z.infer<typeof M2mAttestationValueSchema>): DeliveryAckValue => v
const _bwd = (v: DeliveryAckValue): z.infer<typeof M2mAttestationValueSchema> => v
void _fwd
void _bwd

// ============================================================================
// TIPOS · la lectura de atestación M2M
// ============================================================================

/** Entrada de una atestación M2M = una lectura con kind fijo `delivery_ack`. */
export type M2mAttestationInput = Omit<ReadingInput, 'kind' | 'value'> & {
  value: DeliveryAckValue
}

/** Registro persistido/transmitido (la lectura + su firma ed25519). */
export type M2mAttestationRecord = M2mAttestationInput & { signature: string }

// ============================================================================
// VALIDACIÓN · construcción · firma · verificación
// ============================================================================

export type M2mValueValidation =
  | { ok: true; value: DeliveryAckValue }
  | { ok: false; reason: string }

/** Valida el value de la atestación contra el contrato público (Zod). */
export function validateM2mAttestationValue(value: unknown): M2mValueValidation {
  const r = M2mAttestationValueSchema.safeParse(value)
  if (r.success) return { ok: true, value: r.data }
  return { ok: false, reason: r.error.issues[0]?.message ?? 'delivery_ack inválido' }
}

/**
 * Payload canónico (RFC 8785 · JCS) que el robot firma con su LDevID. Reutiliza
 * `buildReadingPayload` — la MISMA función que la telemetría — para garantizar
 * bytes idénticos entre firmante (SDK) y verificador (oráculo/ingesta). Fail-closed:
 * valida la lectura entera (incluido el value delivery_ack) antes de canonicalizar.
 */
export function buildM2mAttestationPayload(input: M2mAttestationInput): string {
  return buildReadingPayload({ ...input, kind: 'delivery_ack' })
}

/** Firma la atestación con la clave privada de la LDevID (hex 64). Devuelve la
 *  firma ed25519 (hex 128). La privada nunca se persiste server-side. */
export async function signM2mAttestation(
  input: M2mAttestationInput,
  privateKeyHex: string,
): Promise<string> {
  const { signature } = await signString(buildM2mAttestationPayload(input), privateKeyHex)
  return signature
}

/**
 * Re-verifica la firma de la atestación reconstruyendo el payload canónico
 * (nunca confía en el payload enviado) con la verificación ed25519 estricta
 * (zip215:false, vía `verifyReadingSignature`). Devuelve false ante cualquier
 * inconsistencia — nunca lanza.
 */
export async function verifyM2mAttestation(record: M2mAttestationRecord): Promise<boolean> {
  return verifyReadingSignature({ ...record, kind: 'delivery_ack' })
}
