// ════════════════════════════════════════════════════════════════════════════
// CREDENCIAL XLS-70 · '1503-KYB' on-ledger (XRPL testnet) — "verificado por 1503"
// ────────────────────────────────────────────────────────────────────────────
// La 4ª pieza de los sellos (mig 044 dejó `credential_ref` esperándola): el KYB
// aprobado por el operador se materializa como objeto Credential en el ledger:
//   · EMISOR = wallet dedicada 1503 (ISSUER_XRPL_SEED · separada del oráculo).
//   · SUBJECT = la dirección XRPL del actor (mig 077, con prueba de posesión).
//   · El actor ACEPTA con CredentialAccept firmado en SU navegador → credencial
//     plena, verificable por CUALQUIER tercero contra el ledger (ledger_entry)
//     sin fiarse de la BD de 1503.
// CERO PII ON-CHAIN: la URI es una URN autocontenida
//   1503:kyb:<company_digital_id>#sha256=<hash del sobre de evidencia SIN PII>
// (patrón evidence envelope de iso20022: el verificador pide el sobre y
// recomputa el hash). XLS-40 DID: DIFERIDO honesto — un DIDSet sin documento
// resoluble ni consumidor sería fingir una capa de identidad (contra el canon);
// se re-evalúa cuando un verificador externo lo pida.
//
// Builders PUROS (sin red) + verificación con import perezoso de xrpl.
// ════════════════════════════════════════════════════════════════════════════

import type { CredentialCreate, CredentialAccept } from 'xrpl'
import { canonicalHash } from '../dppHash'
import { toRippleTime } from './xrplEscrow'

export const CREDENTIAL_TYPE_KYB = '1503-KYB'

/** Flag lsfAccepted del objeto Credential (XLS-70): el subject aceptó. */
export const LSF_ACCEPTED = 0x0001_0000

const MAX_CREDENTIAL_TYPE_BYTES = 64
const MAX_URI_BYTES = 256
const SHA256_LOWER_RE = /^[0-9a-f]{64}$/

/** ASCII → hex MAYÚSCULA (forma canónica de los campos hex de XRPL). */
export function asciiToHex(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code > 0x7f) throw new Error(`asciiToHex: carácter no-ASCII en '${s}'`)
    out += code.toString(16).padStart(2, '0')
  }
  return out.toUpperCase()
}

/** CredentialType en hex (1–64 bytes según XLS-70). */
export function credentialTypeHex(typeAscii: string = CREDENTIAL_TYPE_KYB): string {
  if (!typeAscii || typeAscii.length > MAX_CREDENTIAL_TYPE_BYTES) {
    throw new Error(`CredentialType debe tener 1–${MAX_CREDENTIAL_TYPE_BYTES} bytes`)
  }
  return asciiToHex(typeAscii)
}

// ── Sobre de evidencia SIN PII (lo que sella la URI) ─────────────────────────

export type KybEvidenceInput = {
  company_digital_id: string
  /** LEI ISO 17442 si la empresa lo tiene (mig 074) · null si no. Jamás inventado. */
  lei: string | null
  /** Fecha de la decisión KYC del operador (ISO). */
  kyc_approved_at: string
}

export type KybEvidenceEnvelope = {
  envelope: { schema: '1503-kyb-evidence@1.0'; company_digital_id: string; lei: string | null; kyc_approved_at: string }
  /** JSON canónico (RFC 8785) del sobre. */
  canonical: string
  /** SHA-256 (hex minúscula) del canónico — lo que viaja en la URI on-ledger. */
  hash: string
}

/** Construye el sobre de evidencia KYB (PURO · determinista · sin PII). */
export function buildKybEvidenceEnvelope(input: KybEvidenceInput): KybEvidenceEnvelope {
  if (!input.company_digital_id?.trim()) throw new Error('company_digital_id requerido (se acuña al aprobar KYC)')
  const envelope = {
    schema: '1503-kyb-evidence@1.0' as const,
    company_digital_id: input.company_digital_id,
    lei: input.lei?.trim() || null,
    kyc_approved_at: input.kyc_approved_at,
  }
  const { canonicalPayload, hash } = canonicalHash(envelope)
  return { envelope, canonical: canonicalPayload, hash }
}

/** URN de la credencial (va on-ledger · SIN PII · ≤256 bytes). */
export function buildCredentialUri(companyDigitalId: string, evidenceHashHex: string): string {
  if (!SHA256_LOWER_RE.test(evidenceHashHex)) throw new Error('evidence hash debe ser sha256 hex minúscula')
  const uri = `1503:kyb:${companyDigitalId}#sha256=${evidenceHashHex}`
  if (uri.length > MAX_URI_BYTES) throw new Error(`URI supera ${MAX_URI_BYTES} bytes`)
  return uri
}

// ── Builders de transacción (SIN firmar · el caller firma con su llave) ──────

export function buildCredentialCreateTx(input: {
  issuerAddr: string
  subjectAddr: string
  typeAscii?: string
  expiresAt?: Date
  uri?: string
}): CredentialCreate {
  const tx: CredentialCreate = {
    TransactionType: 'CredentialCreate',
    Account: input.issuerAddr,
    Subject: input.subjectAddr,
    CredentialType: credentialTypeHex(input.typeAscii),
  }
  if (input.expiresAt) tx.Expiration = toRippleTime(input.expiresAt.getTime())
  if (input.uri) {
    const uriHex = asciiToHex(input.uri)
    if (uriHex.length > MAX_URI_BYTES * 2) throw new Error(`URI supera ${MAX_URI_BYTES} bytes`)
    tx.URI = uriHex
  }
  return tx
}

export function buildCredentialAcceptTx(input: {
  subjectAddr: string
  issuerAddr: string
  typeAscii?: string
}): CredentialAccept {
  return {
    TransactionType: 'CredentialAccept',
    Account: input.subjectAddr,
    Issuer: input.issuerAddr,
    CredentialType: credentialTypeHex(input.typeAscii),
  }
}

// ── credential_ref (escrow_contracts · mig 044) ──────────────────────────────

/** Referencia estable de la credencial para `escrow_contracts.credential_ref`. */
export function buildCredentialRef(issuerAddr: string, typeHex: string, subjectAddr: string): string {
  return `xrpl:cred:${issuerAddr}:${typeHex}:${subjectAddr}`
}

export function parseCredentialRef(ref: string): { issuer: string; typeHex: string; subject: string } | null {
  const m = /^xrpl:cred:(r[1-9A-HJ-NP-Za-km-z]{24,34}):([0-9A-Fa-f]{2,128}):(r[1-9A-HJ-NP-Za-km-z]{24,34})$/.exec(ref)
  return m ? { issuer: m[1], typeHex: m[2], subject: m[3] } : null
}

// ── Validación FAIL-CLOSED del CredentialAccept firmado (patrón escrowBrowserFlow) ──

export type CredentialRowForValidation = {
  subject_address: string
  issuer_address: string
  credential_type: string
}

/**
 * El CredentialAccept que firmó el actor en su navegador debe ser EXACTAMENTE
 * la aceptación de SU credencial: su cuenta, el emisor 1503 y el tipo. PURO.
 */
export function validateSignedCredentialAccept(
  decoded: Record<string, unknown>,
  row: CredentialRowForValidation,
): { ok: true } | { ok: false; error: string } {
  if (decoded?.TransactionType !== 'CredentialAccept') {
    return { ok: false, error: `TransactionType inesperado: ${String(decoded?.TransactionType)}` }
  }
  if (decoded.Account !== row.subject_address) {
    return { ok: false, error: 'Account no es la dirección del actor (subject)' }
  }
  if (decoded.Issuer !== row.issuer_address) {
    return { ok: false, error: 'Issuer no es el emisor 1503' }
  }
  if (
    typeof decoded.CredentialType !== 'string' ||
    decoded.CredentialType.toUpperCase() !== credentialTypeHex(row.credential_type).toUpperCase()
  ) {
    return { ok: false, error: 'CredentialType no coincide' }
  }
  if (typeof decoded.SigningPubKey !== 'string' || decoded.SigningPubKey.length === 0 || decoded.TxnSignature == null) {
    return { ok: false, error: 'La transacción no viene firmada' }
  }
  return { ok: true }
}

// ── Verificación on-ledger (cualquier tercero puede hacer esto mismo) ────────

export type CredentialLedgerStatus = {
  exists: boolean
  accepted: boolean
  expired: boolean
  uriHex?: string
}

/**
 * `ledger_entry { credential }` en testnet: ¿existe la credencial, la aceptó el
 * subject (lsfAccepted) y sigue vigente (Expiration vs reloj ripple)? Import
 * perezoso de xrpl (patrón dppAnchor).
 */
export async function verifyCredentialOnLedger(input: {
  subjectAddr: string
  issuerAddr: string
  typeAscii?: string
}): Promise<CredentialLedgerStatus> {
  const { connectTestnet } = await import('./xrplEscrow')
  const client = await connectTestnet()
  try {
    // OJO: el tipo TS de xrpl.js 5.0 declara `credentialType` (camelCase) pero NO
    // lo mapea — rippled/xrpld exige `credential_type` (verificado contra testnet
    // 21-jul: con camelCase responde "Missing field 'credential_type'"). Cast.
    const res = await client.request({
      command: 'ledger_entry',
      credential: {
        subject: input.subjectAddr,
        issuer: input.issuerAddr,
        credential_type: credentialTypeHex(input.typeAscii),
      },
      ledger_index: 'validated',
    } as unknown as Parameters<typeof client.request>[0])
    const node = (res.result as unknown as { node?: Record<string, unknown> }).node
    if (!node) return { exists: false, accepted: false, expired: false }
    const flags = typeof node.Flags === 'number' ? node.Flags : 0
    const expiration = typeof node.Expiration === 'number' ? node.Expiration : null
    const nowRipple = toRippleTime(Date.now())
    return {
      exists: true,
      accepted: (flags & LSF_ACCEPTED) !== 0,
      expired: expiration !== null && expiration <= nowRipple,
      uriHex: typeof node.URI === 'string' ? node.URI : undefined,
    }
  } catch (e) {
    // entryNotFound = no existe (respuesta legítima del ledger, no un fallo).
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('entryNotFound')) return { exists: false, accepted: false, expired: false }
    throw e
  } finally {
    await client.disconnect()
  }
}
