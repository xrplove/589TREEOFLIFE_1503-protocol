// PASO 5 (escalón verde) · ancla el hash canónico de UN DPP en XRPL TESTNET y
// escribe onchain_tx_hash/onchain_anchored_at en BD → el pasaporte enciende
// "anclado on-ledger" solo. Dinero de JUGUETE (grifo testnet). Reversible (null).
// USO: node --import tsx --env-file=.env.local scripts/seed/anchorDppTestnet.mjs
// Idempotente: si ya está anclado, no re-ancla salvo ANCHOR_FORCE=1.

import { createClient } from '@supabase/supabase-js'
import { anchorHashOnTestnet, verifyAnchorOnTestnet } from '../../app/lib/blockchain/xrplAnchor.ts'

const DPP_ID = process.env.ANCHOR_DPP_ID || '6985589f-5b31-4000-8b31-c178884a4727'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. Hash canónico del DPP desde BD.
const { data: dpp, error: rErr } = await sb
  .from('dpp_registry').select('id, hash_canonical_sha256, onchain_tx_hash').eq('id', DPP_ID).single()
if (rErr) throw rErr
if (!dpp?.hash_canonical_sha256) throw new Error(`el DPP ${DPP_ID} no tiene hash_canonical_sha256`)
console.log(`· DPP ${dpp.id.slice(0, 8)} · hash ${dpp.hash_canonical_sha256.slice(0, 20)}…`)

if (dpp.onchain_tx_hash && process.env.ANCHOR_FORCE !== '1') {
  console.log(`· ya anclado (${dpp.onchain_tx_hash}). ANCHOR_FORCE=1 para re-anclar. Nada que hacer.`)
  process.exit(0)
}

// 2. Anclar en testnet.
console.log('· anclando en XRPL testnet (grifo + AccountSet con Memo)…')
const r = await anchorHashOnTestnet(dpp.hash_canonical_sha256)
console.log(`  ✓ tx ${r.txHash}`)
console.log(`    ${r.explorerUrl}`)

// 3. Verificar on-ledger (leído de la cadena, no de nuestra BD).
const v = await verifyAnchorOnTestnet(r.txHash, dpp.hash_canonical_sha256)
if (!v.verified) throw new Error('verify-on-ledger FALLÓ: el memo de la cadena no coincide con el hash')
console.log('· verify-on-ledger: ✓ el hash de la cadena coincide con el del DPP')

// 4. Escribir en BD (additivo · reversible).
const { error: uErr } = await sb
  .from('dpp_registry').update({ onchain_tx_hash: r.txHash, onchain_anchored_at: r.anchoredAt }).eq('id', dpp.id)
if (uErr) throw uErr

// 5. Confirmar leyendo BD.
const { data: after } = await sb
  .from('dpp_registry').select('onchain_tx_hash, onchain_anchored_at').eq('id', dpp.id).single()
console.log(`· BD actualizada: onchain_tx_hash=${after.onchain_tx_hash?.slice(0, 16)}… · anchored_at=${after.onchain_anchored_at}`)
console.log(`\n✅ DPP anclado en testnet y verificado. El pasaporte /dpp/${dpp.id} ya enciende "anclado on-ledger".`)
console.log(`   Explorer: ${r.explorerUrl}`)
