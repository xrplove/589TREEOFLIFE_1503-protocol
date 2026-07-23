// Hash canónico de DPP · combina JCS (RFC 8785) + SHA-256 + Ed25519
//
// Capa 1 G10 ADR 0007 §2.2 · pieza CENTRAL del proyecto.
//
// PROPÓSITO
// ---------
// Calcular el hash canónico determinista de un DPP (o cualquier objeto JSON
// del custody chain) para:
//
// 1. Anclar en blockchain XDC (mig 028 dpp_registry.hash_canonical_sha256 +
//    onchain_tx_hash · Capa 5 ADR 0007)
// 2. Generar payload de firma Ed25519 (G10 cadena custodia)
// 3. Verificar integridad ex-post (cualquiera con el DPP completo puede
//    recalcular hash y verificar contra blockchain)
// 4. Encadenar eslabones (previous_link_hash · mig 028 dpp_custody_chain)
//
// FILOSOFÍA
// ---------
// - Determinista: mismo input → mismo output · bit-perfect
// - Canónico: keys ordenadas · números normalizados (RFC 8785)
// - Off-chain: el hash NO contiene PII · solo huella
// - Auditable: cualquiera con la lib puede recalcular y verificar

import { sha256 } from '@noble/hashes/sha2.js'

import {
  bytesToHex,
  hexToBytes,
  signBytes,
  verifyBytes,
  type Ed25519Signature,
} from './ed25519Crypto'
import { canonicalize, canonicalToBytes, type JsonValue } from './jcsCanonical'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface CanonicalHash {
  /** Hash SHA-256 hex 64 chars del payload canónico. */
  hash: string
  /** Payload canónico exacto que fue hasheado (para auditoría). */
  canonicalPayload: string
  /** Algoritmo · siempre 'sha256' v1 · extensible. */
  algorithm: 'sha256'
  /** Versión schema de hashing · v1 = RFC 8785 + SHA-256. */
  version: 'dpp-hash@1'
}

export interface SignedPayload {
  /** Hash canónico del payload original. */
  canonical_hash: string
  /** Firma Ed25519 sobre los bytes del payload canónico (NO sobre el hash). */
  signature: Ed25519Signature
}

// ════════════════════════════════════════════════════════════════════════════
// HASHING CANÓNICO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el hash SHA-256 canónico de un valor JSON.
 *
 * Pasos:
 * 1. Canonicalize JCS (RFC 8785) · keys sorted · numbers normalized
 * 2. UTF-8 encode
 * 3. SHA-256
 * 4. Hex encode
 *
 * @param value JSON serializable
 * @returns objeto CanonicalHash con hash + payload + algorithm + version
 */
export function canonicalHash(value: JsonValue): CanonicalHash {
  const canonicalPayload = canonicalize(value)
  const payloadBytes = new TextEncoder().encode(canonicalPayload)
  const hashBytes = sha256(payloadBytes)
  return {
    hash: bytesToHex(hashBytes),
    canonicalPayload,
    algorithm: 'sha256',
    version: 'dpp-hash@1',
  }
}

/**
 * Verifica que un hash canónico corresponde a un valor JSON dado.
 * Útil para validaciones server-side o auditoría externa.
 */
export function verifyCanonicalHash(value: JsonValue, expectedHash: string): boolean {
  const { hash } = canonicalHash(value)
  return hash === expectedHash.toLowerCase()
}

// ════════════════════════════════════════════════════════════════════════════
// FIRMA + HASH COMBINADO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Firma un objeto JSON con Ed25519 + devuelve también su hash canónico.
 *
 * Patrón canónico G10 cadena custodia · cada eslabón:
 *   1. Canonicalize del eslabón (RFC 8785)
 *   2. Hash SHA-256 del canonical payload
 *   3. Firma Ed25519 sobre el canonical payload (NO sobre el hash)
 *   4. Resultado: { hash, signature, publicKey } se guarda en
 *      dpp_custody_chain (mig 028 §9)
 *
 * Importante: firmamos el PAYLOAD BYTES · no el hash. Esto permite verificar
 * la firma SIN re-calcular el hash · y permite que el verificador detecte
 * tampering tanto en payload como en hash.
 */
export async function signCanonical(
  value: JsonValue,
  privateKeyHex: string,
): Promise<SignedPayload> {
  const { hash, canonicalPayload } = canonicalHash(value)
  const payloadBytes = new TextEncoder().encode(canonicalPayload)
  const signature = await signBytes(payloadBytes, privateKeyHex)
  return {
    canonical_hash: hash,
    signature,
  }
}

/**
 * Verifica una firma sobre un valor JSON canonicalizado.
 *
 * @param value el objeto JSON original
 * @param signatureHex firma hex 128 chars
 * @param publicKeyHex clave pública hex 64 chars
 * @returns true si la firma verifica contra el canonical payload del value
 */
export async function verifyCanonicalSignature(
  value: JsonValue,
  signatureHex: string,
  publicKeyHex: string,
): Promise<boolean> {
  const payloadBytes = canonicalToBytes(value)
  return verifyBytes(signatureHex, payloadBytes, publicKeyHex)
}

// ════════════════════════════════════════════════════════════════════════════
// ENCADENAMIENTO · custody chain hash linking
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el hash canónico de un eslabón incluyendo el previous_link_hash.
 *
 * Patrón canónico G10:
 *   - Eslabón 1 (manufacturer): previous_link_hash = null
 *   - Eslabón 2: previous_link_hash = canonicalHash(eslabón 1)
 *   - Eslabón 3: previous_link_hash = canonicalHash(eslabón 2 con su prev)
 *   - ...
 *
 * Esto crea un Merkle-like chain donde cualquier modificación en un eslabón
 * anterior rompe TODA la cadena hacia adelante · trazable y auditable.
 */
export interface CustodyChainLink {
  actor_user_id: string
  custody_role: string
  custody_started_at: string
  signer_public_key: string
  gps_lat?: number
  gps_lng?: number
  // ... otros campos del link
  previous_link_hash: string | null
}

/**
 * Calcula hash del eslabón actual (con previous_link_hash incluido).
 * El resultado es lo que se guarda en la BD y se usa como
 * previous_link_hash del siguiente eslabón.
 */
export function chainLinkHash(link: CustodyChainLink): string {
  return canonicalHash(link as unknown as JsonValue).hash
}

/**
 * Verifica que una cadena de custodia es íntegra:
 * - Cada eslabón hashea correctamente
 * - previous_link_hash de cada eslabón coincide con hash del anterior
 * - Primer eslabón tiene previous_link_hash = null
 *
 * @param chain array ordenado cronológicamente de eslabones
 * @returns { valid, brokenAt } · brokenAt = index del primer eslabón roto · -1 si OK
 */
export function verifyChainIntegrity(
  chain: CustodyChainLink[],
): { valid: boolean; brokenAt: number } {
  if (chain.length === 0) return { valid: true, brokenAt: -1 }

  // Eslabón 1 debe tener previous_link_hash = null
  if (chain[0].previous_link_hash !== null) {
    return { valid: false, brokenAt: 0 }
  }

  for (let i = 1; i < chain.length; i++) {
    const expectedPrevHash = chainLinkHash(chain[i - 1])
    if (chain[i].previous_link_hash !== expectedPrevHash) {
      return { valid: false, brokenAt: i }
    }
  }

  return { valid: true, brokenAt: -1 }
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

/** Versión actual del schema de hashing canónico. */
export const DPP_HASH_VERSION = 'dpp-hash@1' as const

/** Algoritmo SHA-256 (hex output length 64). */
export const DPP_HASH_LENGTH = 64
