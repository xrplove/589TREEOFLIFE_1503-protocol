// ════════════════════════════════════════════════════════════════════════════
// VERIFICACIÓN DEL PRECINTO · cadena de custodia firmada (ed25519) de un DPP
// ────────────────────────────────────────────────────────────────────────────
// Lee la cadena `dpp_custody_chain` de un DPP y comprueba:
//   · encadenado íntegro (cada eslabón apunta al hash del anterior; el 1º sin previo),
//   · firma ed25519 válida en cada eslabón (sobre su link_hash).
// Fuente única de esta verificación, compartida por el dossier del pedido y el
// resolutor público del pasaporte. Lectura con service_role (el caller ya pasó el gate).
// ════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'
import { verifyString } from './ed25519Crypto'

export type CustodyLinkInfo = {
  custody_role: string
  started_at: string
  ended_at: string | null
  signer_public_key: string
  link_hash: string | null
}

export type CustodySeal = {
  links: number
  chainOk: boolean
  signaturesOk: number
  /** True solo si la cadena es íntegra Y todas las firmas verifican Y hay ≥1 eslabón. */
  verified: boolean
  chain: CustodyLinkInfo[]
}

export async function verifyDppCustody(sb: SupabaseClient, dppId: string): Promise<CustodySeal> {
  const { data: rows } = await sb
    .from('dpp_custody_chain')
    .select('custody_role, custody_started_at, custody_ended_at, signer_public_key, signature, previous_link_hash, transfer_evidence')
    .eq('dpp_id', dppId)
    .order('custody_started_at', { ascending: true })

  const chain = rows ?? []
  let chainOk = chain.length > 0 && chain[0].previous_link_hash === null
  let signaturesOk = 0
  for (let i = 0; i < chain.length; i++) {
    const lh = (chain[i].transfer_evidence as { link_hash?: string })?.link_hash
    // La firma se hizo sobre el link_hash exacto guardado en transfer_evidence.
    if (lh && (await verifyString(chain[i].signature, lh, chain[i].signer_public_key))) signaturesOk++
    if (i > 0 && chain[i].previous_link_hash !== (chain[i - 1].transfer_evidence as { link_hash?: string })?.link_hash) chainOk = false
  }

  const links = chain.length
  const info: CustodyLinkInfo[] = chain.map((r) => ({
    custody_role: r.custody_role,
    started_at: r.custody_started_at,
    ended_at: r.custody_ended_at,
    signer_public_key: r.signer_public_key,
    link_hash: (r.transfer_evidence as { link_hash?: string })?.link_hash ?? null,
  }))

  return { links, chainOk, signaturesOk, verified: chainOk && links > 0 && signaturesOk === links, chain: info }
}
