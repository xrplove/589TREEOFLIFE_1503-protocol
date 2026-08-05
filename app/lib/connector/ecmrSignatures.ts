// ════════════════════════════════════════════════════════════════════════════
// FIRMAS DEL e-CMR · payload canónico + autorización + puente al estado (C2)
// ────────────────────────────────────────────────────────────────────────────
// Cierra el gap C2 del ADR e-CMR (2026-06-26): las 3 firmas del documento de
// transporte (`ecmr_sender` Art. 7 · `ecmr_carrier` Art. 5/8 · `ecmr_delivery`
// Art. 13) existían como enum en BD (mig 045) pero SIN puente al estado del
// documento ni al oráculo. Este módulo es la parte PURA y testeable:
//
//   1. buildEcmrSignaturePayload — payload canónico RFC 8785 (JCS) que firma el
//      actor con su ed25519. Cliente y servidor lo reconstruyen IDÉNTICO; el
//      servidor verifica la firma sobre él (mismo patrón que la Edge Function
//      sign-container-load · Art. 3 e-CMR = Art. 26 eIDAS · firma avanzada).
//   2. allowedEcmrPurposes — matriz de autorización: quién puede firmar qué
//      (remitente=vendedor · porteador=custodio freight_forwarder/carrier ·
//      entrega=comprador destinatario).
//   3. deriveTransportStatus — puente firmas→estado del documento (mig 045):
//      draft → issued (remitente+porteador · Art. 5) → in_transit (máquina de
//      estados del pedido) → delivered (firma de entrega · GATILLO del oráculo).
//
// CANON: la clave privada NUNCA vive en 1503 (solo la pública en actor_keys ·
// mig 028). El "gatillo" documental complementa a la custodia 3/3: el oráculo
// examina custodia + presentación UCP; la firma de entrega es la evidencia
// LEGAL del hecho (documento ≠ hecho · ADR §1).

import { canonicalize } from '../jcsCanonical'

/** Los 3 momentos de firma del e-CMR (mig 045 · dpp_signatures.signature_purpose). */
export const ECMR_PURPOSES = ['ecmr_sender', 'ecmr_carrier', 'ecmr_delivery'] as const
export type EcmrPurpose = (typeof ECMR_PURPOSES)[number]

export function isEcmrPurpose(v: unknown): v is EcmrPurpose {
  return typeof v === 'string' && (ECMR_PURPOSES as readonly string[]).includes(v)
}

/** Ventana de validez del timestamp del payload (anti-replay · igual que la Edge Function). */
export const ECMR_TIMESTAMP_WINDOW_MS = 5 * 60 * 1000

export type EcmrSignaturePayloadInput = {
  purpose: EcmrPurpose
  order_id: string
  /** Referencia del documento de transporte (p. ej. EBL-OP-2026-00001). */
  document_reference: string
  /** ISO 8601 · debe estar dentro de ±5 min del reloj del servidor. */
  timestamp: string
  signer_user_id: string
}

/**
 * Normaliza el timestamp al formato canónico `toISOString()` (milisegundos · Z).
 * IMPRESCINDIBLE para la RE-VERIFICACIÓN desde BD: Postgres normaliza el
 * timestamptz al guardarlo (p. ej. `+00` en vez de `Z`), así que el payload solo
 * es reconstruible por un tercero si el timestamp firmado es una forma canónica
 * que sobrevive el viaje BD → `new Date(x).toISOString()` a ambos lados.
 */
export function normalizeSignatureTimestamp(timestampIso: string): string {
  const t = Date.parse(timestampIso)
  if (Number.isNaN(t)) throw new Error(`timestamp no parseable: ${timestampIso}`)
  return new Date(t).toISOString()
}

/**
 * Payload canónico (RFC 8785 · JCS) que se firma con ed25519. El cliente lo
 * construye y firma; el servidor lo RECONSTRUYE con los mismos campos y
 * verifica la firma sobre él (nunca confía en un payload enviado). El timestamp
 * se normaliza SIEMPRE (ver normalizeSignatureTimestamp): la re-verificación
 * desde BD reconstruye el payload con `signed_at` y debe dar byte-idéntico.
 */
export function buildEcmrSignaturePayload(input: EcmrSignaturePayloadInput): string {
  return canonicalize({
    action: 'ecmr_signature',
    document_reference: input.document_reference,
    order_id: input.order_id,
    purpose: input.purpose,
    signer_user_id: input.signer_user_id,
    timestamp: normalizeSignatureTimestamp(input.timestamp),
  })
}

/** ¿El timestamp está dentro de la ventana anti-replay respecto al reloj dado? */
export function isTimestampWithinWindow(timestampIso: string, nowMs: number): boolean {
  const t = Date.parse(timestampIso)
  if (Number.isNaN(t)) return false
  return Math.abs(nowMs - t) <= ECMR_TIMESTAMP_WINDOW_MS
}

export type EcmrAuthContext = {
  callerUserId: string
  sellerUserId: string
  buyerUserId: string
  /** ¿El caller tiene eslabón de custodia como freight_forwarder/carrier sobre el DPP líder? */
  callerIsCustodianCarrier: boolean
}

/**
 * Matriz de autorización del e-CMR (quién firma qué):
 *  - ecmr_sender   → el VENDEDOR (remitente · aporta y responde de los datos · Art. 7 CMR)
 *  - ecmr_carrier  → el PORTEADOR/TRANSITARIO custodio (verifica bultos y co-firma · Art. 5/8)
 *  - ecmr_delivery → el COMPRADOR (destinatario · firma el recibo a la entrega · Art. 13)
 */
export function allowedEcmrPurposes(ctx: EcmrAuthContext): EcmrPurpose[] {
  const out: EcmrPurpose[] = []
  if (ctx.callerUserId === ctx.sellerUserId) out.push('ecmr_sender')
  if (ctx.callerIsCustodianCarrier) out.push('ecmr_carrier')
  if (ctx.callerUserId === ctx.buyerUserId) out.push('ecmr_delivery')
  return out
}

/** Estados del documento de transporte (mig 045 · order_documents.transport_status). */
export type TransportStatus = 'draft' | 'issued' | 'in_transit' | 'delivered'

/**
 * Puente firmas → estado del documento (C2):
 *  - entrega firmada (Art. 13)            → 'delivered' (gatillo documental del oráculo)
 *  - remitente + porteador firmados (Art. 5) → 'issued'; si el pedido ya va en
 *    tránsito, el documento acompaña: 'in_transit'
 *  - si el pedido está en tránsito/entregado sin las dos firmas de emisión, el
 *    documento NO avanza (honesto: el estado documental refleja firmas, no deseos)
 */
export function deriveTransportStatus(
  present: ReadonlySet<EcmrPurpose>,
  orderStatus: string | null,
): TransportStatus {
  if (present.has('ecmr_delivery')) return 'delivered'
  if (present.has('ecmr_sender') && present.has('ecmr_carrier')) {
    return orderStatus === 'in_transit' || orderStatus === 'delivered' ? 'in_transit' : 'issued'
  }
  return 'draft'
}

/** Estado de firmas de un documento, para pintar en el expediente. */
export type EcmrSignatureState = {
  document_reference: string | null
  transport_status: TransportStatus | null
  signatures: {
    purpose: EcmrPurpose
    signed: boolean
    signed_at: string | null
    signer_public_key: string | null
  }[]
  /** Qué puede firmar el CALLER (matriz de autorización) y qué le queda. */
  caller_can_sign: EcmrPurpose[]
}
