// ════════════════════════════════════════════════════════════════════════════
// Tests de la ATESTACIÓN DE HARDWARE (IDevID · IEEE 802.1AR).
// ────────────────────────────────────────────────────────────────────────────
// EL FALLO QUE CIERRAN (4-ago-2026): la mig 083 creó `idevid_fingerprint`,
// `attestation_standard` y la tabla `device_attestations` con un `verified` que
// prometía «verificación real contra el TPM». Nunca la hubo: **el fabricante
// rellenaba esos campos y 1503 se los creía**.
//
// El test que más protege es el del FALSIFICADOR: un certificado cuyo `subject`
// dice «Fabricante Robots SA · cobot-SN-0001» —idéntico al bueno— pero emitido
// por otra CA. Si la verificación mirase el nombre en vez de la firma, pasaría.
//
// CERTIFICADOS REALES generados una vez con OpenSSL 3.5 (ECDSA P-256), no mocks:
//   openssl ecparam -name prime256v1 -genkey -noout -out ca.key
//   openssl req -x509 -new -key ca.key -sha256 -days 3650 \
//     -subj "/O=Fabricante Robots SA/CN=Fabricante Robots IDevID CA" -out ca.crt
//   openssl ecparam -name prime256v1 -genkey -noout -out dev.key
//   openssl req -new -key dev.key \
//     -subj "/O=Fabricante Robots SA/CN=cobot-SN-0001/serialNumber=SN-0001" -out dev.csr
//   openssl x509 -req -in dev.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -sha256 -out dev.crt
//   (y lo mismo con una CA «Falsificador SL» que emite el MISMO subject)
// ════════════════════════════════════════════════════════════════════════════
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSign, createPrivateKey } from 'node:crypto'
import {
  assessHardwareAttestation,
  buildIdevidBindingPayload,
  certFingerprint,
  IDEVID_FRESHNESS_MS,
  readTrustedDeviceCAs,
  splitPemBundle,
  verifyIdevidCertificate,
  verifyIdevidPossession,
  type IdevidBindingInput,
} from './hardwareIdentity.ts'
import { X509Certificate } from 'node:crypto'

// ── Fixtures (ver cabecera) ─────────────────────────────────────────────────

const CA_FABRICANTE = `-----BEGIN CERTIFICATE-----
MIIB3zCCAYWgAwIBAgIUQepw/EfcOha9ltEniNKAGv/XGuUwCgYIKoZIzj0EAwIw
RTEdMBsGA1UECgwURmFicmljYW50ZSBSb2JvdHMgU0ExJDAiBgNVBAMMG0ZhYnJp
Y2FudGUgUm9ib3RzIElEZXZJRCBDQTAeFw0yNjA4MDUwNTU1NDJaFw0zNjA4MDIw
NTU1NDJaMEUxHTAbBgNVBAoMFEZhYnJpY2FudGUgUm9ib3RzIFNBMSQwIgYDVQQD
DBtGYWJyaWNhbnRlIFJvYm90cyBJRGV2SUQgQ0EwWTATBgcqhkjOPQIBBggqhkjO
PQMBBwNCAASya8p/WAIIxHvy/7IEiFi2XFxnwr/Vrt9wIYO3LJ3D/vCGg3ODpO6B
JaUbPETM4UFy7UPfK1Ks8CfN+SgjVM5No1MwUTAdBgNVHQ4EFgQUANQlIT4He+n1
6VshsyoQjyiT/gwwHwYDVR0jBBgwFoAUANQlIT4He+n16VshsyoQjyiT/gwwDwYD
VR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNIADBFAiEAk2cC0nrROrI1CIcqtluH
ojJ8lL6xs8JRCTgsTzY3+RcCIEBcCJkqKAj0nRrBx0uRTQUrPoPKqvIMmNWYYbsj
Mc1v
-----END CERTIFICATE-----`

const IDEVID_COBOT = `-----BEGIN CERTIFICATE-----
MIIB0TCCAXigAwIBAgIUY7ds/6ILbhQZ/RRaL6Z11yoxt90wCgYIKoZIzj0EAwIw
RTEdMBsGA1UECgwURmFicmljYW50ZSBSb2JvdHMgU0ExJDAiBgNVBAMMG0ZhYnJp
Y2FudGUgUm9ib3RzIElEZXZJRCBDQTAeFw0yNjA4MDUwNTU1NDJaFw0zNjA4MDIw
NTU1NDJaMEkxHTAbBgNVBAoMFEZhYnJpY2FudGUgUm9ib3RzIFNBMRYwFAYDVQQD
DA1jb2JvdC1TTi0wMDAxMRAwDgYDVQQFEwdTTi0wMDAxMFkwEwYHKoZIzj0CAQYI
KoZIzj0DAQcDQgAEjnjO9iw6w5Vq0PeUr0aTPR8WVaYEvPM7At6pga6MwfnH7Q8a
3UtJq/j5dHKUmdeg74LAGaNweEC/UwIMum/qVqNCMEAwHQYDVR0OBBYEFCFR8dEo
QRgaQ+LvdG/dCYWgQ2paMB8GA1UdIwQYMBaAFADUJSE+B3vp9elbIbMqEI8ok/4M
MAoGCCqGSM49BAMCA0cAMEQCIGadx7xbN34iabztYmhczXeTQy8dwrTvG+AyHksO
OWEDAiA8i1LkRBb37Y4BaBmSXGW8RVebzanpu7R/4FxpBAnejA==
-----END CERTIFICATE-----`

/** La privada que en un robot real NO saldría del TPM. Aquí, para poder firmar. */
const IDEVID_COBOT_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIB1simTuqaOx2O4vE6ARf72KL4ELAwVAzYzxNxwMI9wDoAoGCCqGSM49
AwEHoUQDQgAEjnjO9iw6w5Vq0PeUr0aTPR8WVaYEvPM7At6pga6MwfnH7Q8a3UtJ
q/j5dHKUmdeg74LAGaNweEC/UwIMum/qVg==
-----END EC PRIVATE KEY-----`

/** 🚨 Mismo `subject` que el bueno, emitido por «Falsificador SL». */
const IDEVID_FALSIFICADO = `-----BEGIN CERTIFICATE-----
MIIBwTCCAWegAwIBAgIURfpzR/ZQ0MPs21xCswr2CFCUKawwCgYIKoZIzj0EAwIw
NDEYMBYGA1UECgwPRmFsc2lmaWNhZG9yIFNMMRgwFgYDVQQDDA9GYWxzaWZpY2Fk
b3IgQ0EwHhcNMjYwODA1MDU1NTQyWhcNMzYwODAyMDU1NTQyWjBJMR0wGwYDVQQK
DBRGYWJyaWNhbnRlIFJvYm90cyBTQTEWMBQGA1UEAwwNY29ib3QtU04tMDAwMTEQ
MA4GA1UEBRMHU04tMDAwMTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABCO1nOk/
UQX62DcgcfFqG7uOvDCvJhaAKzesiB5mdu0aGL6vydtcpUYohy+9ba4gqAe7zy8u
tB69EqH9nYO5V3mjQjBAMB0GA1UdDgQWBBQtdlyH22hK5NeYNRLeNc65goaAdzAf
BgNVHSMEGDAWgBR+qMnNvDNVUiBtp4RguDZmr3I2OzAKBggqhkjOPQQDAgNIADBF
AiBi7aUuhb6fWA79Q2QYeSLREzIYnY5o2ruPWuk7K3RbDQIhAO8UlSz1rL8hvlRf
rRTghQLa7QmE5ldUDnai+pbgC3QO
-----END CERTIFICATE-----`

const IDEVID_FALSIFICADO_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIDoS+8IPXdlmbAHPGyAoWEBl7zHNEX3gllh+xPc7IRl5oAoGCCqGSM49
AwEHoUQDQgAEI7Wc6T9RBfrYNyBx8Wobu468MK8mFoArN6yIHmZ27RoYvq/J21yl
RiiHL71triCoB7vPLy60Hr0Sof2dg7lXeQ==
-----END EC PRIVATE KEY-----`

const CA_FALSIFICADOR = `-----BEGIN CERTIFICATE-----
MIIBvTCCAWOgAwIBAgIUS90zTs3s/aKvne9OBSVY2kK2NY4wCgYIKoZIzj0EAwIw
NDEYMBYGA1UECgwPRmFsc2lmaWNhZG9yIFNMMRgwFgYDVQQDDA9GYWxzaWZpY2Fk
b3IgQ0EwHhcNMjYwODA1MDU1NTQyWhcNMzYwODAyMDU1NTQyWjA0MRgwFgYDVQQK
DA9GYWxzaWZpY2Fkb3IgU0wxGDAWBgNVBAMMD0ZhbHNpZmljYWRvciBDQTBZMBMG
ByqGSM49AgEGCCqGSM49AwEHA0IABCTK7qzFkHPGjcqWbKF72V7ZBHlJlm8iWyRY
zgB8FWadEvtCD6zsuQM3Yd3xT9xuok2+657bAKwRNOOdBUfYDt+jUzBRMB0GA1Ud
DgQWBBR+qMnNvDNVUiBtp4RguDZmr3I2OzAfBgNVHSMEGDAWgBR+qMnNvDNVUiBt
p4RguDZmr3I2OzAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIQDc
jvrueS8upFdTESJ70/qxh+aUnLmHCnoV4HMFuT7grwIgCM1k83OYUwOJqe7dYkOS
lh1+hRDIhA/LkeSFA083Kpc=
-----END CERTIFICATE-----`

const CONFIANZA = [CA_FABRICANTE]
const LDEVID = 'a'.repeat(64) // clave ed25519 de telemetría (hex 64)
const OWNER = 'owner-actor-0001'
const NOW = Date.parse('2026-08-05T10:00:00.000Z')
const HUELLA_BUENA = certFingerprint(new X509Certificate(IDEVID_COBOT))

function binding(over: Partial<IdevidBindingInput> = {}): IdevidBindingInput {
  return {
    device_public_key: LDEVID,
    idevid_fingerprint: HUELLA_BUENA,
    owner_user_id: OWNER,
    nonce: 'nonce-idevid-0001',
    timestamp: new Date(NOW).toISOString(),
    ...over,
  }
}

/** Firma el payload con la clave del IDevID (ECDSA P-256 · DER), como el TPM. */
function firmar(payload: string, keyPem: string): string {
  const s = createSign('sha256')
  s.update(payload)
  s.end()
  return s.sign(createPrivateKey(keyPem)).toString('base64')
}

// ═══════════════════════════════════════════════════════════════════════════
// 🚨 EL TEST QUE MÁS PROTEGE
// ═══════════════════════════════════════════════════════════════════════════

test('🚨 EL FALSIFICADOR: mismo `subject` que el fabricante, otra CA → NO se atesta', () => {
  // El certificado dice «O=Fabricante Robots SA, CN=cobot-SN-0001», idéntico al
  // legítimo, y el falsificador POSEE su clave privada (firma de verdad). Lo
  // único que no puede falsificar es la firma de la CA del fabricante. Si esto
  // pasara, la atestación de hardware no valdría nada.
  const b = binding({ idevid_fingerprint: certFingerprint(new X509Certificate(IDEVID_FALSIFICADO)) })
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_FALSIFICADO,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_FALSIFICADO_KEY),
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, false)
  assert.equal(r.attestation_standard, null, 'no se rellena la norma por cortesía')
  assert.match(r.detail, /NO lo emitió ninguna CA de fabricante de confianza/)
  assert.match(r.detail, /Falsificador/, 'el detalle dice quién lo emitió DE VERDAD')
})

test('el mismo certificado falsificado SÍ pasa si se confía en su CA (la firma es lo único que decide)', () => {
  const b = binding({ idevid_fingerprint: certFingerprint(new X509Certificate(IDEVID_FALSIFICADO)) })
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_FALSIFICADO,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_FALSIFICADO_KEY),
    trustedCaPems: [CA_FALSIFICADOR],
    nowMs: NOW,
  })
  assert.equal(r.verified, true, 'confiar en una CA es la decisión; el código solo comprueba la firma')
})

// ═══════════════════════════════════════════════════════════════════════════
// EL CAMINO BUENO
// ═══════════════════════════════════════════════════════════════════════════

test('IDevID legítimo + posesión probada → verificado, con emisor y serie', () => {
  const b = binding()
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_COBOT,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_COBOT_KEY),
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, true, r.detail)
  assert.equal(r.idevid_fingerprint, HUELLA_BUENA)
  assert.equal(r.attestation_standard, 'IEEE-802.1AR')
  assert.match(r.idevid_issuer ?? '', /Fabricante Robots IDevID CA/)
  assert.match(r.idevid_subject ?? '', /cobot-SN-0001/)
  assert.match(r.detail, /SN-0001/)
})

// ═══════════════════════════════════════════════════════════════════════════
// 🚨 LO QUE **NO** ATESTA
// ═══════════════════════════════════════════════════════════════════════════

test('🚨 presentar el certificado SIN firmar no prueba nada (un certificado es público)', () => {
  const b = binding()
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_COBOT,
    signatureBase64: Buffer.from('firma inventada').toString('base64'),
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, false)
  assert.match(r.detail, /no prueba poseerlo/)
})

test('🚨 firmar con OTRA clave privada no vale, aunque el certificado sea el bueno', () => {
  const b = binding()
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_COBOT,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_FALSIFICADO_KEY),
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, false)
  assert.match(r.detail, /no verifica/)
})

test('🚨 NO se puede reusar una firma para atar OTRA clave de telemetría', () => {
  // El LDevID va DENTRO del payload firmado: ese es el punto de todo el diseño.
  // Sin esto, un atacante capturaría una atestación legítima y le colgaría su
  // propia clave, heredando el hardware de otro.
  const original = binding()
  const firma = firmar(buildIdevidBindingPayload(original), IDEVID_COBOT_KEY)
  const secuestro = binding({ device_public_key: 'b'.repeat(64) })
  const r = assessHardwareAttestation({
    binding: secuestro,
    chainPem: IDEVID_COBOT,
    signatureBase64: firma,
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, false)
})

test('🚨 la huella firmada tiene que ser la DEL certificado presentado', () => {
  const b = binding({ idevid_fingerprint: 'f'.repeat(64) })
  const r = assessHardwareAttestation({
    binding: b,
    chainPem: IDEVID_COBOT,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_COBOT_KEY),
    trustedCaPems: CONFIANZA,
    nowMs: NOW,
  })
  assert.equal(r.verified, false)
  assert.match(r.detail, /huella firmada no es la del certificado/)
})

test('🚨 un certificado CADUCADO no atesta (se juzga en el instante dado)', () => {
  const b = binding()
  const dentroDeVeinteAnos = Date.parse('2046-08-05T10:00:00.000Z')
  const r = assessHardwareAttestation({
    binding: { ...b, timestamp: new Date(dentroDeVeinteAnos).toISOString() },
    chainPem: IDEVID_COBOT,
    signatureBase64: firmar(buildIdevidBindingPayload(b), IDEVID_COBOT_KEY),
    trustedCaPems: CONFIANZA,
    nowMs: dentroDeVeinteAnos,
  })
  assert.equal(r.verified, false)
  assert.match(r.detail, /no está vigente/)
})

test('🚨 una atestación rancia no vale (frescura) y una del futuro tampoco', () => {
  const b = binding()
  const firma = firmar(buildIdevidBindingPayload(b), IDEVID_COBOT_KEY)
  const base = { binding: b, chainPem: IDEVID_COBOT, signatureBase64: firma, trustedCaPems: CONFIANZA }
  const vieja = assessHardwareAttestation({ ...base, nowMs: NOW + IDEVID_FRESHNESS_MS + 1000 })
  assert.equal(vieja.verified, false)
  assert.match(vieja.detail, /frescura/)
  const futura = assessHardwareAttestation({ ...base, nowMs: NOW - 5 * 60_000 })
  assert.equal(futura.verified, false)
  assert.match(futura.detail, /futuro/)
})

test('🚨 SIN CAs de confianza configuradas no se atesta NADA (fail-closed, no «me lo creo»)', () => {
  const b = binding()
  const firma = firmar(buildIdevidBindingPayload(b), IDEVID_COBOT_KEY)
  for (const cas of [null, [] as string[]]) {
    const r = assessHardwareAttestation({ binding: b, chainPem: IDEVID_COBOT, signatureBase64: firma, trustedCaPems: cas, nowMs: NOW })
    assert.equal(r.verified, false)
    assert.match(r.detail, /CAs de fabricante de confianza/)
  }
})

test('un PEM ilegible se rechaza con motivo, no revienta', () => {
  const r = verifyIdevidCertificate('esto no es un certificado', CONFIANZA, NOW)
  assert.equal(r.ok, false)
  assert.match((r as { reason: string }).reason, /no se pudo leer/)
})

// ═══════════════════════════════════════════════════════════════════════════
// PIEZAS SUELTAS
// ═══════════════════════════════════════════════════════════════════════════

test('la cadena puede traer su propia CA y sigue anclando en la de confianza', () => {
  const r = verifyIdevidCertificate(`${IDEVID_COBOT}\n${CA_FABRICANTE}`, CONFIANZA, NOW)
  assert.equal(r.ok, true)
  assert.equal((r as { chain_length: number }).chain_length, 2)
})

test('🚨 …pero adjuntar la CA del falsificador NO la convierte en de confianza', () => {
  const r = verifyIdevidCertificate(`${IDEVID_FALSIFICADO}\n${CA_FALSIFICADOR}`, CONFIANZA, NOW)
  assert.equal(r.ok, false, 'la confianza la pone 1503, no quien presenta la cadena')
})

test('la huella es del DER y es estable', () => {
  assert.match(HUELLA_BUENA, /^[0-9a-f]{64}$/)
  assert.equal(certFingerprint(new X509Certificate(IDEVID_COBOT)), HUELLA_BUENA)
  assert.notEqual(certFingerprint(new X509Certificate(IDEVID_FALSIFICADO)), HUELLA_BUENA)
})

test('splitPemBundle separa varios certificados y descarta el ruido', () => {
  assert.equal(splitPemBundle(`ruido\n${CA_FABRICANTE}\nmás ruido\n${IDEVID_COBOT}`).length, 2)
  assert.equal(splitPemBundle('sin certificados').length, 0)
})

test('las CAs de confianza salen del ENTORNO y sin ellas es null (fail-closed)', () => {
  assert.equal(readTrustedDeviceCAs({} as NodeJS.ProcessEnv), null)
  assert.equal(readTrustedDeviceCAs({ DEVICE_TRUSTED_CA_PEM: '   ' } as NodeJS.ProcessEnv), null)
  assert.equal(readTrustedDeviceCAs({ DEVICE_TRUSTED_CA_PEM: 'basura' } as NodeJS.ProcessEnv), null)
  const ok = readTrustedDeviceCAs({ DEVICE_TRUSTED_CA_PEM: CA_FABRICANTE } as NodeJS.ProcessEnv)
  assert.equal(ok?.length, 1)
  // Y tolera el PEM con \n escapados, que es como acaba en un .env de una línea.
  const escapado = readTrustedDeviceCAs({ DEVICE_TRUSTED_CA_PEM: CA_FABRICANTE.replace(/\n/g, '\\n') } as NodeJS.ProcessEnv)
  assert.equal(escapado?.length, 1)
})

test('el payload de vinculación es fail-closed en la forma', () => {
  assert.throws(() => buildIdevidBindingPayload(binding({ device_public_key: 'corta' })), /LDevID/)
  assert.throws(() => buildIdevidBindingPayload(binding({ idevid_fingerprint: 'x' })), /idevid_fingerprint/)
  assert.throws(() => buildIdevidBindingPayload(binding({ nonce: 'corto' })), /nonce/)
  assert.throws(() => buildIdevidBindingPayload(binding({ owner_user_id: '' })), /owner_user_id/)
})

test('el payload es canónico: mismos datos → mismos bytes, y el orden de claves no importa', () => {
  const a = buildIdevidBindingPayload(binding())
  const b = buildIdevidBindingPayload({
    timestamp: new Date(NOW).toISOString(),
    nonce: 'nonce-idevid-0001',
    owner_user_id: OWNER,
    idevid_fingerprint: HUELLA_BUENA.toUpperCase(),
    device_public_key: LDEVID.toUpperCase(),
  })
  assert.equal(a, b, 'la normalización (minúsculas, timestamp) es lo que hace re-verificable la evidencia')
})

test('verifyIdevidPossession nunca lanza ante entradas basura', () => {
  assert.equal(verifyIdevidPossession('', 'x', 'p'), false)
  assert.equal(verifyIdevidPossession(IDEVID_COBOT, '', 'p'), false)
  assert.equal(verifyIdevidPossession(IDEVID_COBOT, 'no-base64-!!', 'p'), false)
})
