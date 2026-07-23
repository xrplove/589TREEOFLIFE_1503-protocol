// ════════════════════════════════════════════════════════════════════════════
// PASO 3 · TRAZABILIDAD + PRECINTO DIGITAL verificables (cadena de custodia firmada)
// ────────────────────────────────────────────────────────────────────────────
// Crea la cadena de custodia FIRMADA (ed25519) del producto líder del pedido:
//   manufacturer (Artihome) → freight_forwarder (transitario) → consignee (Andina)
// Cada eslabón se firma y se ENCADENA (previous_link_hash = hash del anterior).
// Luego VERIFICA: integridad de la cadena (verifyChainIntegrity) + cada firma
// ed25519. El "precinto digital" = el DPP (huella SHA-256) sellado por esta
// cadena tamper-evident. (El anclaje del hash en el ledger es el paso 5.)
//
// ⚠️ ESCRIBE EN LA BD VIVA (dpp_custody_chain). Se corre CON José delante.
// USO: node --import tsx --env-file=.env.local scripts/seed/runTraceability.mjs
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { generateKeyPair, signString, verifyString } from '../../app/lib/ed25519Crypto.ts'
import { chainLinkHash } from '../../app/lib/dppHash.ts'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const ORDER_ID = '918bf57d-501b-4426-9528-9ec22e4d538c'

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const f = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (f) return f
    if (data.users.length < 200) break
  }
  return null
}

async function ensureForwarder() {
  const EMAIL = 'transitario-demo@example-demo.com'
  let u = await findUserByEmail(EMAIL)
  if (!u) {
    const { data, error } = await sb.auth.admin.createUser({
      email: EMAIL, email_confirm: true,
      user_metadata: { entity_kind: 'company', country_code: 'ES', sector_id: 'transporte', role_id: 'transitarios-mar', company_name: 'Transitaria Levante (demo)' },
    })
    if (error) throw error
    u = data.user
  }
  await sb.from('actors').upsert({ user_id: u.id, entity_kind: 'company', country_code: 'ES', sector_id: 'transporte', role_id: 'transitarios-mar', company_name: 'Transitaria Levante (demo)', email: EMAIL, kyc_status: 'approved' }, { onConflict: 'user_id' })
  return u.id
}

// Construye el objeto del eslabón que se HASHEA (subconjunto estable · sin la firma).
function linkPayload({ actorId, role, startedAt, pubkey, prevHash }) {
  return { actor_user_id: actorId, custody_role: role, custody_started_at: startedAt, signer_public_key: pubkey, previous_link_hash: prevHash }
}

async function main() {
  // Partes
  const seller = await findUserByEmail('artihome-pilot@example-demo.com')
  const buyer = await findUserByEmail('importadora-andina@example-demo.com')
  if (!seller || !buyer) throw new Error('Faltan vendedor/comprador (corre pasos 1-2)')
  const fwd = await ensureForwarder()

  // DPP líder = el de la primera línea del pedido
  const { data: ol, error: olErr } = await sb.from('order_lines').select('dpp_registry_id, sku_snapshot').eq('order_id', ORDER_ID).not('dpp_registry_id', 'is', null).limit(1)
  if (olErr) throw olErr
  if (!ol?.length) throw new Error('La primera línea no tiene DPP')
  const dppId = ol[0].dpp_registry_id
  console.log(`· DPP líder ${dppId.slice(0, 8)} (${ol[0].sku_snapshot}) · construyendo cadena firmada…`)

  // Idempotente: solo construye+inserta si NO hay cadena ya (append-only · no se reescribe).
  const { data: existing } = await sb.from('dpp_custody_chain').select('id').eq('dpp_id', dppId)
  if (!existing || existing.length === 0) {
    const plan = [
      { actorId: seller.id, role: 'manufacturer', startedAt: '2026-06-01T08:00:00Z', endedAt: '2026-06-04T18:00:00Z', gps: [39.4699, -0.3763] },
      { actorId: fwd, role: 'freight_forwarder', startedAt: '2026-06-05T09:00:00Z', endedAt: '2026-06-12T20:00:00Z', gps: [39.4561, -0.3275] },
      { actorId: buyer.id, role: 'consignee', startedAt: '2026-06-20T10:00:00Z', endedAt: null, gps: [4.711, -74.0721] },
    ]
    let prevHash = null
    for (const p of plan) {
      const kp = await generateKeyPair()
      const payload = linkPayload({ actorId: p.actorId, role: p.role, startedAt: p.startedAt, pubkey: kp.publicKey, prevHash })
      const linkHash = chainLinkHash(payload)
      const sig = await signString(linkHash, kp.privateKey)
      const row = {
        dpp_id: dppId, actor_user_id: p.actorId, custody_role: p.role,
        custody_started_at: p.startedAt, custody_ended_at: p.endedAt,
        signer_public_key: kp.publicKey, signature: sig.signature,
        gps_lat: p.gps[0], gps_lng: p.gps[1],
        transfer_evidence: { note: `eslabón ${p.role} · demo`, link_hash: linkHash },
        previous_link_hash: prevHash,
      }
      const { error } = await sb.from('dpp_custody_chain').insert(row)
      if (error) throw new Error(`insert ${p.role}: ${error.message}`)
      prevHash = linkHash
      console.log(`  · ${p.role} firmado e insertado (hash ${linkHash.slice(0, 12)}…)`)
    }
  } else {
    console.log(`  · cadena ya existe (${existing.length} eslabones) · no se reinserta · se verifica`)
  }

  // ── VERIFICACIÓN del precinto DESDE LA BD (datos persistidos) ──
  // La firma se hizo sobre el link_hash (guardado en transfer_evidence); se verifica
  // contra ESE hash y se comprueba el encadenado (previous_link_hash = hash anterior).
  const { data: rows, error: rErr } = await sb
    .from('dpp_custody_chain')
    .select('custody_role, signer_public_key, signature, previous_link_hash, transfer_evidence')
    .eq('dpp_id', dppId)
    .order('custody_started_at', { ascending: true })
  if (rErr) throw rErr

  let sigsOk = 0
  let chainOk = rows[0]?.previous_link_hash === null
  for (let i = 0; i < rows.length; i++) {
    const linkHash = rows[i].transfer_evidence?.link_hash
    if (linkHash && (await verifyString(rows[i].signature, linkHash, rows[i].signer_public_key))) sigsOk++
    if (i > 0 && rows[i].previous_link_hash !== rows[i - 1].transfer_evidence?.link_hash) chainOk = false
  }

  console.log('\n── PRECINTO / TRAZABILIDAD · verificación (desde BD) ──')
  console.log(`  · integridad de la cadena (encadenado por hash): ${chainOk ? 'OK' : 'ROTA'}`)
  console.log(`  · firmas ed25519 válidas: ${sigsOk}/${rows.length}`)
  console.log(`  · eslabones: ${rows.map((r) => r.custody_role).join(' → ')}`)
  if (!chainOk || sigsOk !== rows.length) { console.error('✗ verificación FALLÓ'); process.exit(1) }
  console.log(`\n✔ PASO 3 OK · cadena de custodia firmada y VERIFICADA (desde BD) para el DPP ${dppId.slice(0, 8)}.`)
}

main().catch((e) => { console.error('✗', e.message ?? e); process.exit(1) })
