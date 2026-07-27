import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CREDENTIAL_TYPE_KYB,
  asciiToHex,
  credentialTypeHex,
  buildKybEvidenceEnvelope,
  buildCredentialUri,
  buildCredentialCreateTx,
  buildCredentialAcceptTx,
  buildCredentialRef,
  parseCredentialRef,
} from './xrplCredential'
import { toRippleTime } from './xrplEscrow'

const ISSUER = 'rDYgfFAfme3MXD5jwXYXn2dWBLcRPMQP9d'
const SUBJECT = 'rfpD7ycyqJBCVLfYwWeRPmqfRz7E8EBGkp'

// ════════════════════════════════════════════════════════════════════════════
// Hex y límites XLS-70
// ════════════════════════════════════════════════════════════════════════════

test('asciiToHex: canónico mayúscula y rechaza no-ASCII', () => {
  assert.equal(asciiToHex('1503-KYB'), '313530332D4B5942')
  assert.throws(() => asciiToHex('año'))
})

test('credentialTypeHex: 1–64 bytes (fail-closed en los bordes)', () => {
  assert.equal(credentialTypeHex(), '313530332D4B5942') // default 1503-KYB
  assert.throws(() => credentialTypeHex(''))
  assert.throws(() => credentialTypeHex('x'.repeat(65)))
  assert.equal(credentialTypeHex('x'.repeat(64)).length, 128)
})

// ════════════════════════════════════════════════════════════════════════════
// Sobre de evidencia SIN PII + URI
// ════════════════════════════════════════════════════════════════════════════

test('sobre KYB: determinista, y cambia si cambia CUALQUIER pieza (lei incluida)', () => {
  const base = { company_digital_id: '1503-ES-00042', lei: null, kyc_approved_at: '2026-07-21T10:00:00.000Z' }
  const a = buildKybEvidenceEnvelope(base)
  const b = buildKybEvidenceEnvelope({ ...base })
  assert.equal(a.hash, b.hash)
  assert.match(a.hash, /^[0-9a-f]{64}$/)
  const conLei = buildKybEvidenceEnvelope({ ...base, lei: '529900T8BM49AURSDO55' })
  assert.notEqual(conLei.hash, a.hash)
  // El sobre NO contiene PII: solo id de plataforma + lei + fecha + schema.
  assert.deepEqual(Object.keys(a.envelope).sort(), ['company_digital_id', 'kyc_approved_at', 'lei', 'schema'])
})

test('sobre KYB: sin company_digital_id no hay sobre (se acuña al aprobar KYC)', () => {
  assert.throws(() => buildKybEvidenceEnvelope({ company_digital_id: '', lei: null, kyc_approved_at: 'x' }))
})

test('URI: URN autocontenida y con límites (hash minúscula · ≤256 bytes)', () => {
  const hash = 'a'.repeat(64)
  assert.equal(buildCredentialUri('1503-ES-00042', hash), `1503:kyb:1503-ES-00042#sha256=${hash}`)
  assert.throws(() => buildCredentialUri('1503-ES-00042', 'A'.repeat(64))) // mayúscula no canónica
  assert.throws(() => buildCredentialUri('x'.repeat(300), hash)) // >256 bytes
})

// ════════════════════════════════════════════════════════════════════════════
// Builders de tx: el propio validador de xrpl los da por buenos (offline)
// ════════════════════════════════════════════════════════════════════════════

test('CredentialCreate: pasa el validate() de xrpl, con Expiration y URI hex', async () => {
  const { validate } = await import('xrpl')
  const expiresAt = new Date('2027-07-21T10:00:00Z')
  const uri = buildCredentialUri('1503-ES-00042', 'b'.repeat(64))
  const tx = buildCredentialCreateTx({ issuerAddr: ISSUER, subjectAddr: SUBJECT, expiresAt, uri })
  assert.doesNotThrow(() => validate(tx as unknown as Record<string, unknown>))
  assert.equal(tx.Expiration, toRippleTime(expiresAt.getTime()))
  assert.equal(tx.CredentialType, '313530332D4B5942')
  assert.match(tx.URI as string, /^[0-9A-F]+$/)
})

test('CredentialAccept: pasa el validate() de xrpl (lo firma el SUBJECT)', async () => {
  const { validate } = await import('xrpl')
  const tx = buildCredentialAcceptTx({ subjectAddr: SUBJECT, issuerAddr: ISSUER })
  assert.doesNotThrow(() => validate(tx as unknown as Record<string, unknown>))
  assert.equal(tx.Account, SUBJECT)
  assert.equal(tx.Issuer, ISSUER)
})

// ════════════════════════════════════════════════════════════════════════════
// credential_ref (mig 044) round-trip
// ════════════════════════════════════════════════════════════════════════════

test('credential_ref: build → parse round-trip; basura → null', () => {
  const ref = buildCredentialRef(ISSUER, credentialTypeHex(), SUBJECT)
  assert.deepEqual(parseCredentialRef(ref), { issuer: ISSUER, typeHex: '313530332D4B5942', subject: SUBJECT })
  assert.equal(parseCredentialRef('xrpl:cred:no:va:nada'), null)
  assert.equal(parseCredentialRef(''), null)
})

test('constante del tipo: 1503-KYB (contrato con la mig 078)', () => {
  assert.equal(CREDENTIAL_TYPE_KYB, '1503-KYB')
})

// ════════════════════════════════════════════════════════════════════════════
// validateSignedCredentialAccept · round-trip firmado real + ramas de rechazo
// ════════════════════════════════════════════════════════════════════════════

test('accept: blob firmado por el subject → decode → valida; impostor/campos cambiados → rechaza', async () => {
  const { Wallet, decode, validate } = await import('xrpl')
  const { validateSignedCredentialAccept, buildCredentialAcceptTx } = await import('./xrplCredential')
  const subject = Wallet.generate()
  const row = { subject_address: subject.address, issuer_address: ISSUER, credential_type: '1503-KYB' }
  const tx = { ...buildCredentialAcceptTx({ subjectAddr: subject.address, issuerAddr: ISSUER }), Sequence: 5, Fee: '12' }
  validate(tx as unknown as Record<string, unknown>)
  const signed = subject.sign(tx)
  const decoded = decode(signed.tx_blob) as Record<string, unknown>

  assert.deepEqual(validateSignedCredentialAccept(decoded, row), { ok: true })
  assert.equal(validateSignedCredentialAccept(decoded, { ...row, issuer_address: SUBJECT }).ok, false)
  assert.equal(validateSignedCredentialAccept(decoded, { ...row, subject_address: ISSUER }).ok, false)
  assert.equal(validateSignedCredentialAccept(decoded, { ...row, credential_type: 'OTRO' }).ok, false)
  assert.equal(validateSignedCredentialAccept({ ...decoded, TransactionType: 'Payment' }, row).ok, false)
  const sinFirma = { ...decoded }
  delete sinFirma.TxnSignature
  assert.equal(validateSignedCredentialAccept(sinFirma, row).ok, false)
})
