// Validadores compartidos por todos los schemas sectoriales.
//
// Cada función retorna `boolean` (true = válido) y NO lanza excepciones.
// Las funciones de "extraer/normalizar" sí pueden retornar `null` si no
// son interpretables.
//
// Todos los validadores son síncronos · puros · sin dependencias externas
// más allá de tipos. Para validación dependiente (e.g. existencia en
// registro oficial), usar los servidores Edge Functions de la Fase 3a-bis.

import type { ISOCountryCode } from './_universal'

// ============================================================================
// ISO 3166-1 alpha-2 · country codes
// ============================================================================

/** Lista válida de códigos ISO 3166-1 alpha-2 · 249 entidades activas mayo 2026.
 *  Generada desde la fuente oficial de ISO + filtrada por entidades activas.
 *  Para evitar parsear este archivo gigante, mantenemos un Set inicializado
 *  perezosamente. */
const ISO_3166_ALPHA2_CODES = new Set([
  'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
  'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ',
  'CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ',
  'DE','DJ','DK','DM','DO','DZ',
  'EC','EE','EG','EH','ER','ES','ET',
  'FI','FJ','FK','FM','FO','FR',
  'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY',
  'HK','HM','HN','HR','HT','HU',
  'ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT',
  'JE','JM','JO','JP',
  'KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ',
  'LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
  'MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
  'NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ',
  'OM',
  'PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY',
  'QA',
  'RE','RO','RS','RU','RW',
  'SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ',
  'TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ',
  'UA','UG','UM','US','UY','UZ',
  'VA','VC','VE','VG','VI','VN','VU',
  'WF','WS',
  'YE','YT',
  'ZA','ZM','ZW',
])

/** Valida que un código sea ISO 3166-1 alpha-2 (case-insensitive). */
export function isValidISOCountryCode(code: string): code is ISOCountryCode {
  if (typeof code !== 'string') return false
  return ISO_3166_ALPHA2_CODES.has(code.toUpperCase())
}

// ============================================================================
// EAN-13 / GTIN · barcodes
// ============================================================================

/** Calcula el dígito de control EAN-13 según el estándar GS1.
 *  Retorna -1 si la cadena no tiene 12 dígitos (sin contar el check digit).
 */
function ean13Checksum(digits12: string): number {
  if (digits12.length !== 12 || !/^\d{12}$/.test(digits12)) return -1
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const d = digits12.charCodeAt(i) - 48
    sum += d * (i % 2 === 0 ? 1 : 3)
  }
  return (10 - (sum % 10)) % 10
}

/** Valida un código EAN-13 (13 dígitos numéricos · check digit GS1 correcto). */
export function isValidEAN13(code: string): boolean {
  if (typeof code !== 'string') return false
  if (!/^\d{13}$/.test(code)) return false
  const expected = ean13Checksum(code.substring(0, 12))
  const actual = code.charCodeAt(12) - 48
  return expected === actual
}

/** Valida un GTIN (Global Trade Item Number) · 8 · 12 · 13 · 14 dígitos con
 *  check digit GS1 al final. EAN-13 es un sub-caso de GTIN-13. */
export function isValidGTIN(code: string): boolean {
  if (typeof code !== 'string') return false
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(code)) return false
  const digits = code.split('').map((d) => d.charCodeAt(0) - 48)
  const checkDigit = digits.pop()!
  // GTIN checksum: weights alternate 3-1-3-1 desde el dígito menos significativo
  digits.reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  const expected = (10 - (sum % 10)) % 10
  return expected === checkDigit
}

// ============================================================================
// VIN · Vehicle Identification Number (17 caracteres) · ISO 3779
// ============================================================================

/** Valida un VIN-17 según ISO 3779: 17 caracteres alfanuméricos · sin I/O/Q ·
 *  check digit en posición 9 (transliteración + módulo 11). */
export function isValidVIN17(vin: string): boolean {
  if (typeof vin !== 'string') return false
  if (vin.length !== 17) return false
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) return false  // sin I/O/Q

  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  }
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const value = transliteration[vin[i]]
    if (value === undefined) return false
    sum += value * weights[i]
  }
  const checkDigit = sum % 11
  const expected = checkDigit === 10 ? 'X' : String(checkDigit)
  return vin[8] === expected
}

// ============================================================================
// IBAN · International Bank Account Number · ISO 13616
// ============================================================================

/** Valida un IBAN según ISO 13616 (mod-97).
 *  No verifica que el IBAN exista en banco real · solo formato + checksum. */
export function isValidIBAN(iban: string): boolean {
  if (typeof iban !== 'string') return false
  const normalized = iban.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(normalized)) return false
  if (normalized.length < 15 || normalized.length > 34) return false

  // Mover 4 primeros caracteres al final
  const rearranged = normalized.substring(4) + normalized.substring(0, 4)

  // Convertir letras a números (A=10, B=11, ..., Z=35)
  let numericIBAN = ''
  for (const ch of rearranged) {
    if (ch >= '0' && ch <= '9') {
      numericIBAN += ch
    } else {
      numericIBAN += String(ch.charCodeAt(0) - 55)
    }
  }

  // Mod-97 sobre big number (procesar por chunks)
  let remainder = 0
  for (const ch of numericIBAN) {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97
  }
  return remainder === 1
}

// ============================================================================
// DATES · validez y rangos
// ============================================================================

/** Parsea una cadena ISO 8601 a Date. Retorna null si no es parseable. */
export function parseISODate(input: string): Date | null {
  if (typeof input !== 'string') return null
  const d = new Date(input)
  if (isNaN(d.getTime())) return null
  return d
}

/** Valida que un certificado esté vigente · `expires_at` (si existe) debe ser
 *  posterior a `now`. */
export function isCertificateActive(
  issued_at: string,
  expires_at?: string,
  now: Date = new Date(),
): boolean {
  const issued = parseISODate(issued_at)
  if (!issued) return false
  if (issued > now) return false  // emitido en el futuro = inválido
  if (!expires_at) return true    // sin expiración = válido si emitido en pasado
  const expires = parseISODate(expires_at)
  if (!expires) return false
  return expires > now
}

// ============================================================================
// XRPL · address validation
// ============================================================================

/** Valida que una dirección XRPL tenga formato correcto · 25-35 caracteres ·
 *  empieza por 'r' · usa base58 XRPL alphabet (sin OoIl0 para evitar
 *  ambigüedad visual). NO verifica que el address exista en el ledger. */
export function isValidXRPLAddress(address: string): boolean {
  if (typeof address !== 'string') return false
  if (address.length < 25 || address.length > 35) return false
  if (!address.startsWith('r')) return false
  // XRPL base58 alphabet: rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz
  // Excluye: 0 · O · I · l (para evitar ambigüedad visual)
  return /^r[1-9A-HJ-NP-Za-km-z]+$/.test(address.substring(1))
}

// ============================================================================
// SHA-256 hash validation
// ============================================================================

/** Valida que una cadena sea un hash SHA-256 hexadecimal (64 caracteres). */
export function isValidSHA256Hash(hash: string): boolean {
  if (typeof hash !== 'string') return false
  return /^[a-fA-F0-9]{64}$/.test(hash)
}
