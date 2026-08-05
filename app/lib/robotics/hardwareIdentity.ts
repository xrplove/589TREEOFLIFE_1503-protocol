// ════════════════════════════════════════════════════════════════════════════
// IDENTIDAD DE HARDWARE · el IDevID deja de ser un enum que rellena el fabricante
// ────────────────────────────────────────────────────────────────────────────
// LO QUE ESTABA MAL (4-ago-2026): la mig 083 creó las columnas de identidad de
// hardware —`idevid_fingerprint`, `idevid_issuer`, `attestation_standard`— y la
// tabla `device_attestations` con un `verified` que decía literalmente en su
// comentario «se rellena cuando haya verificación real contra el TPM». Nunca la
// hubo: **el fabricante escribía esos campos y 1503 se los creía**. Una identidad
// de hardware auto-declarada no vale más que un post-it, y ES el diferenciador
// que un OEM compra.
//
// LO QUE HACE ESTE MÓDULO. Modelo IEEE 802.1AR, tal cual:
//   · **IDevID** = certificado X.509 que el FABRICANTE grabó en el dispositivo, con
//     su clave privada dentro del elemento seguro/TPM. No sale de ahí. Es la
//     identidad de nacimiento del hardware.
//   · **LDevID** = la clave ed25519 de telemetría con la que el device firma
//     evidencia en 1503 (mig 079). Es la identidad OPERATIVA, local a nosotros.
//   · Atestar = probar que **este LDevID pertenece a ESE hardware**: el device
//     firma, con la clave del IDevID, un payload canónico que CONTIENE su clave de
//     telemetría. Sin eso, cualquiera enrola una clave y dice ser un cobot.
//
// LAS TRES COSAS QUE SE COMPRUEBAN, y ninguna sobra:
//   1. **CADENA** hasta una CA de fabricante en la que 1503 confía de forma
//      EXPLÍCITA. 🚨 Fiarse del `subject` sería inútil: un falsificador pone en su
//      certificado el nombre del fabricante que quiera. Lo que no puede falsificar
//      es la FIRMA de la CA. Hay un test con exactamente ese ataque.
//   2. **VIGENCIA** del certificado (y de cada eslabón) en el instante dado.
//   3. **POSESIÓN**: la firma sobre el payload verifica con la clave pública del
//      certificado. Un certificado es público — presentarlo no prueba nada; lo que
//      prueba es firmar con la privada que vive en el TPM.
//
// ANTI-REPLAY sin estado nuevo: el payload lleva `nonce` + `timestamp`, la
// frescura se comprueba aquí y la unicidad la remata la BD con
// UNIQUE(device_public_key, nonce) de `device_attestations` (mig 083). Mismo
// patrón, ya probado, que la ingesta de telemetría.
//
// FAIL-CLOSED: sin CAs de confianza configuradas NO se atesta nada — jamás se cae
// a «pues me lo creo». Y lo que no verifica no se marca `verified`.
//
// FRONTERA DEL DINERO: vive en `app/lib/robotics/`, zona vigilada. Esto acredita
// IDENTIDAD, no autoriza pagos: el robot sigue sin tener claves financieras.
// ════════════════════════════════════════════════════════════════════════════

import { X509Certificate, verify as cryptoVerify, createHash } from 'node:crypto'
import { canonicalize } from '../jcsCanonical'
import { normalizeSignatureTimestamp } from '../connector/ecmrSignatures'
import { isValidEd25519Key } from '../ed25519Crypto'

/** Versión del contrato de vinculación IDevID→LDevID (entra en el payload firmado). */
export const IDEVID_BINDING_ACTION = '1503_ldevid_binding@1.0' as const

/** Ventana de frescura de la atestación (misma que la ingesta de telemetría). */
export const IDEVID_FRESHNESS_MS = 10 * 60_000
/** Skew tolerado hacia el futuro (relojes desalineados), nada más. */
export const IDEVID_FUTURE_SKEW_MS = 60_000
/** Profundidad máxima de cadena admitida (hoja + intermedios). */
export const IDEVID_MAX_CHAIN = 5

const NONCE_MIN = 8
const NONCE_MAX = 128

// ────────────────────────────────────────────────────────────────────────────
// EL PAYLOAD QUE ATA EL LDevID AL HARDWARE
// ────────────────────────────────────────────────────────────────────────────

export type IdevidBindingInput = {
  /** LDevID: la clave ed25519 PÚBLICA de telemetría que se quiere atestar. */
  device_public_key: string
  /** Huella SHA-256 del DER del certificado IDevID (identifica al hardware). */
  idevid_fingerprint: string
  /** Actor que enrola el dispositivo (ata la atestación a un titular). */
  owner_user_id: string
  /** Nonce único por dispositivo (anti-replay · UNIQUE en device_attestations). */
  nonce: string
  /** ISO 8601 · normalizado siempre (re-verificable byte-idéntico desde BD). */
  timestamp: string
}

/**
 * Payload canónico (RFC 8785 · JCS) que el dispositivo firma **con la clave del
 * IDevID**. Contiene la clave de telemetría: por eso la firma prueba la
 * VINCULACIÓN y no puede reutilizarse para atar otra clave distinta.
 * Fail-closed: valida la forma antes de canonicalizar.
 */
export function buildIdevidBindingPayload(input: IdevidBindingInput): string {
  const pub = input.device_public_key?.trim().toLowerCase() ?? ''
  if (!isValidEd25519Key(pub)) throw new Error('device_public_key inválida (LDevID ed25519 hex 64)')
  const fp = input.idevid_fingerprint?.trim().toLowerCase() ?? ''
  if (!/^[0-9a-f]{64}$/.test(fp)) throw new Error('idevid_fingerprint inválida (sha256 hex 64)')
  if (!input.owner_user_id) throw new Error('owner_user_id requerido')
  const nonce = input.nonce ?? ''
  if (nonce.length < NONCE_MIN || nonce.length > NONCE_MAX) {
    throw new Error(`nonce fuera de [${NONCE_MIN}, ${NONCE_MAX}] chars`)
  }
  return canonicalize({
    action: IDEVID_BINDING_ACTION,
    device_public_key: pub,
    idevid_fingerprint: fp,
    nonce,
    owner_user_id: input.owner_user_id,
    timestamp: normalizeSignatureTimestamp(input.timestamp),
  })
}

// ────────────────────────────────────────────────────────────────────────────
// LAS CAs DE FABRICANTE EN LAS QUE 1503 CONFÍA
// ────────────────────────────────────────────────────────────────────────────

const PEM_BLOCK_RE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g

/** Parte un bundle PEM en certificados sueltos (tolera separadores y comentarios). */
export function splitPemBundle(bundle: string): string[] {
  return bundle.match(PEM_BLOCK_RE) ?? []
}

/**
 * CAs de fabricante de confianza, del entorno (`DEVICE_TRUSTED_CA_PEM`, uno o
 * varios PEM concatenados).
 *
 * **Vive en el entorno y NO en una tabla a propósito:** confiar en una CA de
 * fabricante es una decisión de despliegue, no un dato que deba poder escribir
 * una sesión con rol de operador. Si estuviera en BD, comprometer una cuenta de
 * operador bastaría para añadir una CA propia y fabricarse robots «verificados».
 *
 * Devuelve `null` si no hay ninguna: **fail-closed**, no se atesta nada.
 */
export function readTrustedDeviceCAs(env: NodeJS.ProcessEnv = process.env): string[] | null {
  const raw = env.DEVICE_TRUSTED_CA_PEM?.trim()
  if (!raw) return null
  // Se admite el PEM con `\n` escapados (como suele quedar en un .env de una línea).
  const pems = splitPemBundle(raw.includes('-----BEGIN') ? raw.replace(/\\n/g, '\n') : '')
  return pems.length > 0 ? pems : null
}

// ────────────────────────────────────────────────────────────────────────────
// VERIFICACIÓN DEL CERTIFICADO (cadena + vigencia)
// ────────────────────────────────────────────────────────────────────────────

/** Huella SHA-256 del DER — es lo que identifica al hardware de forma estable. */
export function certFingerprint(cert: X509Certificate): string {
  return createHash('sha256').update(cert.raw).digest('hex')
}

export type IdevidCertVerdict =
  | {
      ok: true
      fingerprint: string
      subject: string
      issuer: string
      serial_number: string
      valid_to: string
      /** Cuántos eslabones se recorrieron hasta la CA de confianza. */
      chain_length: number
    }
  | { ok: false; reason: string }

function parse(pem: string): X509Certificate | null {
  try {
    return new X509Certificate(pem)
  } catch {
    return null
  }
}

function vigente(cert: X509Certificate, nowMs: number): boolean {
  const from = Date.parse(cert.validFrom)
  const to = Date.parse(cert.validTo)
  if (Number.isNaN(from) || Number.isNaN(to)) return false
  return nowMs >= from && nowMs <= to
}

/**
 * Verifica la cadena del IDevID hasta una CA de fabricante de confianza.
 *
 * `chainPem` = hoja primero, luego los intermedios que haga falta. Cada eslabón
 * debe estar VIGENTE y estar firmado por el siguiente; el último debe estar
 * firmado por (o ser) una de las CAs de confianza.
 *
 * 🚨 No se mira el `subject` para decidir nada: un falsificador escribe en su
 * certificado el nombre de fabricante que quiera. Solo cuenta la firma.
 */
export function verifyIdevidCertificate(
  chainPem: string,
  trustedCaPems: readonly string[],
  nowMs: number,
): IdevidCertVerdict {
  const chain = splitPemBundle(chainPem).map(parse)
  if (chain.length === 0 || chain.some((c) => c === null)) {
    return { ok: false, reason: 'no se pudo leer el certificado IDevID (¿PEM válido?)' }
  }
  if (chain.length > IDEVID_MAX_CHAIN) {
    return { ok: false, reason: `cadena demasiado larga (máx ${IDEVID_MAX_CHAIN})` }
  }
  const certs = chain as X509Certificate[]

  const trusted = trustedCaPems.map(parse).filter((c): c is X509Certificate => c !== null)
  if (trusted.length === 0) {
    return { ok: false, reason: 'no hay ninguna CA de fabricante de confianza configurada (fail-closed)' }
  }

  const leaf = certs[0]!
  for (const [i, c] of certs.entries()) {
    if (!vigente(c, nowMs)) {
      return { ok: false, reason: `el eslabón ${i} del certificado no está vigente (validez ${c.validFrom} → ${c.validTo})` }
    }
  }

  // Enlaces internos de la cadena presentada.
  for (let i = 0; i < certs.length - 1; i++) {
    const hijo = certs[i]!
    const padre = certs[i + 1]!
    if (!padre.ca) return { ok: false, reason: `el eslabón intermedio ${i + 1} no es una CA` }
    if (!hijo.checkIssued(padre) || !hijo.verify(padre.publicKey)) {
      return { ok: false, reason: `la cadena se rompe entre los eslabones ${i} y ${i + 1}` }
    }
  }

  // El último eslabón tiene que colgar de una CA de confianza (o serlo él mismo).
  const top = certs[certs.length - 1]!
  const topFp = certFingerprint(top)
  const ancla = trusted.find((ca) => {
    if (certFingerprint(ca) === topFp) return true // la propia CA vino en la cadena
    try {
      return ca.ca && vigente(ca, nowMs) && top.checkIssued(ca) && top.verify(ca.publicKey)
    } catch {
      return false
    }
  })
  if (!ancla) {
    return {
      ok: false,
      reason: `el certificado NO lo emitió ninguna CA de fabricante de confianza (emisor declarado: «${top.issuer.replace(/\n/g, ' · ')}»)`,
    }
  }

  return {
    ok: true,
    fingerprint: certFingerprint(leaf),
    subject: leaf.subject.replace(/\n/g, ' · '),
    issuer: leaf.issuer.replace(/\n/g, ' · '),
    serial_number: leaf.serialNumber,
    valid_to: leaf.validTo,
    chain_length: certs.length,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PRUEBA DE POSESIÓN (la clave privada vive en el TPM y no sale de ahí)
// ────────────────────────────────────────────────────────────────────────────

/**
 * ¿La firma sobre `payload` la produjo la clave privada del certificado?
 * Soporta ECDSA (P-256/384, firma DER · lo habitual en un IDevID), Ed25519 y RSA.
 * Nunca lanza: cualquier inconsistencia es `false`.
 *
 * Presentar un certificado NO prueba nada —es público—; lo que prueba es esto.
 */
export function verifyIdevidPossession(chainPem: string, signatureBase64: string, payload: string): boolean {
  try {
    const pems = splitPemBundle(chainPem)
    if (pems.length === 0) return false
    const cert = new X509Certificate(pems[0]!)
    // `cert.publicKey` YA es un KeyObject público: pasarlo por createPublicKey()
    // lanza «Invalid key object type public, expected private» y, con el catch de
    // abajo, eso se convertía en un `false` silencioso — una atestación legítima
    // rechazada sin motivo. Cazado por el test del camino bueno.
    const pub = cert.publicKey
    const sig = Buffer.from(signatureBase64, 'base64')
    if (sig.length === 0) return false
    const data = Buffer.from(payload, 'utf8')
    const tipo = pub.asymmetricKeyType
    if (tipo === 'ed25519' || tipo === 'ed448') {
      return cryptoVerify(null, data, pub, sig)
    }
    if (tipo === 'ec') {
      return cryptoVerify('sha256', data, { key: pub, dsaEncoding: 'der' }, sig)
    }
    if (tipo === 'rsa' || tipo === 'rsa-pss') {
      return cryptoVerify('sha256', data, pub, sig)
    }
    return false
  } catch {
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// EL VEREDICTO COMPLETO
// ────────────────────────────────────────────────────────────────────────────

export type HardwareAttestation = {
  /** true SOLO si cadena + vigencia + frescura + posesión cuadran. */
  verified: boolean
  idevid_fingerprint: string | null
  idevid_issuer: string | null
  idevid_subject: string | null
  /** Norma acreditada. Null si no se verificó: no se rellena por cortesía. */
  attestation_standard: 'IEEE-802.1AR' | null
  /** Motivo legible — visible en la respuesta, nunca silencioso. */
  detail: string
}

export type AssessHardwareArgs = {
  binding: IdevidBindingInput
  /** Cadena PEM del IDevID (hoja primero). */
  chainPem: string
  /** Firma base64 del payload canónico, hecha con la clave del IDevID. */
  signatureBase64: string
  trustedCaPems: readonly string[] | null
  nowMs: number
}

/**
 * Atesta el hardware de un dispositivo. FAIL-CLOSED en cada paso; el `detail`
 * dice siempre qué falló. Un `verified:false` NO es un error del sistema: es un
 * dispositivo que no ha probado ser lo que dice.
 */
export function assessHardwareAttestation(args: AssessHardwareArgs): HardwareAttestation {
  const no = (detail: string): HardwareAttestation => ({
    verified: false,
    idevid_fingerprint: null,
    idevid_issuer: null,
    idevid_subject: null,
    attestation_standard: null,
    detail,
  })

  if (!args.trustedCaPems || args.trustedCaPems.length === 0) {
    return no('no hay CAs de fabricante de confianza configuradas (DEVICE_TRUSTED_CA_PEM) — no se atesta nada')
  }

  // 1 · Frescura (el nonce único lo remata la BD).
  const t = Date.parse(args.binding.timestamp)
  if (Number.isNaN(t)) return no('timestamp de la atestación no parseable')
  if (t - args.nowMs > IDEVID_FUTURE_SKEW_MS) return no('la atestación viene del futuro')
  if (args.nowMs - t > IDEVID_FRESHNESS_MS) return no('atestación fuera de la ventana de frescura')

  // 2 · Cadena + vigencia.
  const cert = verifyIdevidCertificate(args.chainPem, args.trustedCaPems, args.nowMs)
  if (!cert.ok) return no(cert.reason)

  // 3 · La huella firmada tiene que ser la del certificado presentado. Si no, el
  //     dispositivo estaría atando su clave a un hardware que no es el suyo.
  if (args.binding.idevid_fingerprint.trim().toLowerCase() !== cert.fingerprint) {
    return no('la huella firmada no es la del certificado presentado')
  }

  // 4 · Posesión de la clave privada del IDevID.
  let payload: string
  try {
    payload = buildIdevidBindingPayload(args.binding)
  } catch (e) {
    return no(`vinculación mal formada: ${(e as Error).message}`)
  }
  if (!verifyIdevidPossession(args.chainPem, args.signatureBase64, payload)) {
    return no('la firma no verifica con la clave del IDevID: presentar un certificado no prueba poseerlo')
  }

  return {
    verified: true,
    idevid_fingerprint: cert.fingerprint,
    idevid_issuer: cert.issuer,
    idevid_subject: cert.subject,
    attestation_standard: 'IEEE-802.1AR',
    detail:
      `IDevID verificado · emisor «${cert.issuer}» (CA de fabricante de confianza) · sujeto «${cert.subject}» · ` +
      `serie ${cert.serial_number} · cadena de ${cert.chain_length} · válido hasta ${cert.valid_to} · ` +
      'clave de telemetría (LDevID) atada a este hardware por firma del IDevID',
  }
}
