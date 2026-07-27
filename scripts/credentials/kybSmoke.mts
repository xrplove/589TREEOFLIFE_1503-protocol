// ════════════════════════════════════════════════════════════════════════════
// CREDENCIAL 1503-KYB (XLS-70) · SMOKE en XRPL TESTNET — ciclo completo
// ────────────────────────────────────────────────────────────────────────────
// Con wallets EFÍMERAS del grifo (no toca .env.local ni las llaves reales):
//   1. Emisor y actor nacen del grifo.
//   2. EMISIÓN: CredentialCreate firmado por el emisor (sobre de evidencia SIN
//      PII → URI URN · caducidad 1 año) — las MISMAS piezas que la API.
//   3. VERIFICACIÓN on-ledger: existe, NO aceptada aún.
//   4. ACEPTACIÓN: CredentialAccept firmado por el ACTOR (validado fail-closed
//      con validateSignedCredentialAccept, como hace /credentials/accept).
//   5. VERIFICACIÓN on-ledger: aceptada ✓ (lo que un banco tercero haría).
// USO: node --import tsx scripts/credentials/kybSmoke.mts
// ════════════════════════════════════════════════════════════════════════════

import { Client, decode } from 'xrpl'
import {
  CREDENTIAL_TYPE_KYB,
  buildCredentialCreateTx,
  buildCredentialAcceptTx,
  buildCredentialUri,
  buildKybEvidenceEnvelope,
  buildCredentialRef,
  credentialTypeHex,
  validateSignedCredentialAccept,
  verifyCredentialOnLedger,
} from '../../app/lib/blockchain/xrplCredential.ts'
import { XRPL_TESTNET_WSS, XRPL_TESTNET_EXPLORER } from '../../app/lib/blockchain/xrplEscrow.ts'

const client = new Client(XRPL_TESTNET_WSS)
await client.connect()
try {
  console.log('1/5 · creando emisor y actor efímeros (grifo)…')
  const [{ wallet: issuer }, { wallet: subject }] = await Promise.all([client.fundWallet(), client.fundWallet()])
  console.log(`     emisor ${issuer.address} · actor ${subject.address}`)

  // 2 · EMISIÓN (lo que hace POST /api/actors/credentials)
  const envelope = buildKybEvidenceEnvelope({
    company_digital_id: '1503-ES-00042',
    lei: null,
    kyc_approved_at: new Date().toISOString(),
  })
  const uri = buildCredentialUri('1503-ES-00042', envelope.hash)
  const createTx = buildCredentialCreateTx({
    issuerAddr: issuer.address,
    subjectAddr: subject.address,
    typeAscii: CREDENTIAL_TYPE_KYB,
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    uri,
  })
  const preparedCreate = await client.autofill(createTx)
  const signedCreate = issuer.sign(preparedCreate)
  const resCreate = await client.submitAndWait(signedCreate.tx_blob)
  const codeCreate = (resCreate.result.meta as { TransactionResult?: string })?.TransactionResult
  if (codeCreate !== 'tesSUCCESS') throw new Error(`CredentialCreate: ${codeCreate}`)
  console.log(`2/5 · EMITIDA · ${XRPL_TESTNET_EXPLORER}/${resCreate.result.hash}`)
  console.log(`     URI on-ledger (sin PII): ${uri}`)

  // 3 · verificación: existe pero SIN aceptar
  const pre = await verifyCredentialOnLedger({
    subjectAddr: subject.address,
    issuerAddr: issuer.address,
    typeAscii: CREDENTIAL_TYPE_KYB,
  })
  if (!pre.exists || pre.accepted) throw new Error(`estado inesperado pre-accept: ${JSON.stringify(pre)}`)
  console.log('3/5 · verificada on-ledger: existe · pendiente de aceptación (correcto)')

  // 4 · ACEPTACIÓN del actor (lo que hace el navegador + /credentials/accept)
  const acceptTx = buildCredentialAcceptTx({ subjectAddr: subject.address, issuerAddr: issuer.address })
  const preparedAccept = await client.autofill(acceptTx)
  const signedAccept = subject.sign(preparedAccept)
  const v = validateSignedCredentialAccept(decode(signedAccept.tx_blob) as Record<string, unknown>, {
    subject_address: subject.address,
    issuer_address: issuer.address,
    credential_type: CREDENTIAL_TYPE_KYB,
  })
  if (!v.ok) throw new Error(`validación rechazó el accept: ${v.error}`)
  const resAccept = await client.submitAndWait(signedAccept.tx_blob)
  const codeAccept = (resAccept.result.meta as { TransactionResult?: string })?.TransactionResult
  if (codeAccept !== 'tesSUCCESS') throw new Error(`CredentialAccept: ${codeAccept}`)
  console.log(`4/5 · ACEPTADA por el actor · ${XRPL_TESTNET_EXPLORER}/${resAccept.result.hash}`)

  // 5 · verificación final (la que haría un banco tercero sin fiarse de 1503)
  const post = await verifyCredentialOnLedger({
    subjectAddr: subject.address,
    issuerAddr: issuer.address,
    typeAscii: CREDENTIAL_TYPE_KYB,
  })
  if (!post.exists || !post.accepted || post.expired) throw new Error(`estado final inesperado: ${JSON.stringify(post)}`)
  console.log('5/5 · verificación de tercero: existe · ACEPTADA · vigente ✓')
  console.log(`     credential_ref: ${buildCredentialRef(issuer.address, credentialTypeHex(), subject.address)}`)
  console.log('\n✅ SMOKE OK — ciclo XLS-70 completo (emitir → aceptar → verificar) en testnet.')
} finally {
  await client.disconnect()
}
