// Ed25519 cryptography helpers · G10 cadena custodia ADR 0007 §2.2
//
// Wraper canónico sobre @noble/ed25519 v3.x para uso uniforme en:
// - Browser (escritorio profesional · firma desde wallet del actor)
// - Node.js (servidor · validación · seed scripts)
// - Edge Functions Deno (via npm specifier o esm.sh)
//
// FILOSOFÍA · interfaz unificada
// -----------------------------
// El proyecto usa Ed25519 en MUCHOS lugares (custody chain · DPP signatures ·
// multifirma 3-de-3 · etc.). En vez de cada archivo importar @noble/ed25519
// directamente y manejar bytes/hex manualmente · este módulo centraliza la
// interfaz · garantiza consistencia · facilita testing.
//
// REFERENCIAS NORMATIVAS
// ----------------------
// - ADR 0007 §2.2 · G10 cadena custodia digital criptográfica (canon)
// - mig 028 · dpp_custody_chain.signer_public_key + signature
// - mig 028 · dpp_signatures.signature
// - mig 031 · multifirma 3-de-3 carga contenedor
// - MLETR UNCITRAL 2017 · control exclusivo + integridad
//
// SEGURIDAD
// ---------
// - @noble/ed25519 v3.x · audited library · pure JS · no native deps
// - Privadas NUNCA salen del cliente · firmas se hacen client-side
// - Públicas SÍ se guardan en BD (signer_public_key)
// - Hash SHA-512 internamente (Ed25519 spec)

import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2.js'

// Configurar hash function (Ed25519 requiere SHA-512 sync · @noble/ed25519 v3 lo necesita)
ed.hashes.sha512 = (...m: Uint8Array[]) =>
  sha512(m.length === 1 ? m[0] : concatBytes(...m))

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

/** Par de claves Ed25519 (privada + pública). */
export interface Ed25519KeyPair {
  /** Clave privada (32 bytes seed). Hex 64 chars. */
  privateKey: string
  /** Clave pública (32 bytes). Hex 64 chars. */
  publicKey: string
}

/** Firma Ed25519 sobre un payload. */
export interface Ed25519Signature {
  /** Firma (64 bytes). Hex 128 chars. */
  signature: string
  /** Clave pública del firmante (32 bytes). Hex 64 chars. */
  publicKey: string
  /** Timestamp ISO 8601 del momento de firmar. */
  signedAt: string
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS · hex ↔ bytes
// ════════════════════════════════════════════════════════════════════════════

const HEX_CHARS = '0123456789abcdef'

/** Convierte Uint8Array a hex lowercase. */
export function bytesToHex(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    result += HEX_CHARS[b >> 4] + HEX_CHARS[b & 0x0f]
  }
  return result
}

/** Convierte hex string a Uint8Array. Acepta upper o lowercase. */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`hex string longitud impar: ${hex.length}`)
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const c1 = hex.charCodeAt(i * 2)
    const c2 = hex.charCodeAt(i * 2 + 1)
    const n1 = parseHexDigit(c1)
    const n2 = parseHexDigit(c2)
    if (n1 < 0 || n2 < 0) {
      throw new Error(`Carácter no hex en posición ${i * 2}: ${hex.substring(i * 2, i * 2 + 2)}`)
    }
    bytes[i] = (n1 << 4) | n2
  }
  return bytes
}

function parseHexDigit(charCode: number): number {
  if (charCode >= 0x30 && charCode <= 0x39) return charCode - 0x30 // 0-9
  if (charCode >= 0x61 && charCode <= 0x66) return charCode - 0x61 + 10 // a-f
  if (charCode >= 0x41 && charCode <= 0x46) return charCode - 0x41 + 10 // A-F
  return -1
}

/** Concatena varios Uint8Array en uno. */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// ════════════════════════════════════════════════════════════════════════════
// GENERACIÓN DE CLAVES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Genera un par de claves Ed25519 fresco.
 *
 * IMPORTANTE: la privada NUNCA debe persistirse en servidor 1503.
 * Patrón canónico: cliente genera + guarda en su propio keystore (browser
 * IndexedDB encriptado · hardware wallet · etc.) y solo publica la pública.
 */
export async function generateKeyPair(): Promise<Ed25519KeyPair> {
  const privateKeyBytes = ed.utils.randomSecretKey()
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)
  return {
    privateKey: bytesToHex(privateKeyBytes),
    publicKey: bytesToHex(publicKeyBytes),
  }
}

/**
 * Deriva la clave pública desde una privada (útil para verificación
 * post-import desde keystore externo).
 */
export async function publicKeyFromPrivate(privateKeyHex: string): Promise<string> {
  const privateKeyBytes = hexToBytes(privateKeyHex)
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Privada Ed25519 debe ser 32 bytes · recibido ${privateKeyBytes.length}`)
  }
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)
  return bytesToHex(publicKeyBytes)
}

// ════════════════════════════════════════════════════════════════════════════
// FIRMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Firma un payload (bytes) con clave privada Ed25519.
 *
 * @param payload bytes a firmar (típicamente · canonicalize de JCS · encoded UTF-8)
 * @param privateKeyHex hex 64 chars (32 bytes seed)
 * @returns objeto Ed25519Signature con signature + publicKey + timestamp
 */
export async function signBytes(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Ed25519Signature> {
  const privateKeyBytes = hexToBytes(privateKeyHex)
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Privada Ed25519 debe ser 32 bytes`)
  }
  const signatureBytes = await ed.signAsync(payload, privateKeyBytes)
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes)
  return {
    signature: bytesToHex(signatureBytes),
    publicKey: bytesToHex(publicKeyBytes),
    signedAt: new Date().toISOString(),
  }
}

/** Conveniencia: firma un string UTF-8. */
export async function signString(
  payloadString: string,
  privateKeyHex: string,
): Promise<Ed25519Signature> {
  const bytes = new TextEncoder().encode(payloadString)
  return signBytes(bytes, privateKeyHex)
}

// ════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Verifica una firma Ed25519 contra un payload + clave pública.
 *
 * @param signatureHex firma hex 128 chars
 * @param payload bytes originales firmados
 * @param publicKeyHex clave pública hex 64 chars
 * @returns true si la firma es válida · false si no
 */
export async function verifyBytes(
  signatureHex: string,
  payload: Uint8Array,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    const signatureBytes = hexToBytes(signatureHex)
    const publicKeyBytes = hexToBytes(publicKeyHex)
    if (signatureBytes.length !== 64) return false
    if (publicKeyBytes.length !== 32) return false
    return await ed.verifyAsync(signatureBytes, payload, publicKeyBytes)
  } catch (_e) {
    // Cualquier error de parseo o validación · firma inválida
    return false
  }
}

/** Conveniencia: verifica firma sobre un string UTF-8. */
export async function verifyString(
  signatureHex: string,
  payloadString: string,
  publicKeyHex: string,
): Promise<boolean> {
  const bytes = new TextEncoder().encode(payloadString)
  return verifyBytes(signatureHex, bytes, publicKeyHex)
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE FORMATO
// ════════════════════════════════════════════════════════════════════════════

const HEX_64_REGEX = /^[a-f0-9]{64}$/i
const HEX_128_REGEX = /^[a-f0-9]{128}$/i

/** Valida que un string es hex 64 chars (clave pública o privada Ed25519). */
export function isValidEd25519Key(key: string): boolean {
  return typeof key === 'string' && HEX_64_REGEX.test(key)
}

/** Valida que un string es hex 128 chars (firma Ed25519). */
export function isValidEd25519Signature(signature: string): boolean {
  return typeof signature === 'string' && HEX_128_REGEX.test(signature)
}
