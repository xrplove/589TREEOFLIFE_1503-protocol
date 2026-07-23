// Escritorio TRANSITARIO · Dossier de UN pedido · datos REALES de BD.
// Gate: sesión + KYC aprobado. Autorización: el caller debe ser PARTE del pedido
// (comprador/vendedor) o estar en su cadena de custodia; si no → 404 OPACO (canon).

import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../../lib/actor-public'
import { fetchOrderDossier } from '../../dossier'
import PedidoDossier from '../../PedidoDossier'
import { ConfigMissing, KycRequired } from '../../fallbacks'

export const dynamic = 'force-dynamic'

export default async function TransitarioPedidoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) return <ConfigMissing />

  const cookieStore = await cookies()
  const sbAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options)
        } catch {
          /* no-op en Server Component */
        }
      },
    },
  })
  const sbAdmin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const caller = await requireApprovedCaller(sbAuth, sbAdmin)
  if (!caller.ok) {
    if (caller.reason === 'unauthenticated') redirect(`/login?next=/transitario/pedido/${id}`)
    return <KycRequired />
  }

  // ── Autorización: parte del pedido o de su custodia · si no, 404 opaco ──
  const { data: order } = await sbAdmin
    .from('orders')
    .select('buyer_user_id, seller_user_id')
    .eq('id', id)
    .maybeSingle()
  if (!order) notFound()
  let authorized = order.buyer_user_id === caller.userId || order.seller_user_id === caller.userId
  if (!authorized) {
    // ¿Está el caller en la cadena de custodia de algún DPP del pedido?
    const { data: dppIds } = await sbAdmin.from('order_lines').select('dpp_registry_id').eq('order_id', id).not('dpp_registry_id', 'is', null)
    const ids = (dppIds ?? []).map((r) => r.dpp_registry_id)
    if (ids.length) {
      const { count } = await sbAdmin
        .from('dpp_custody_chain')
        .select('id', { count: 'exact', head: true })
        .in('dpp_id', ids)
        .eq('actor_user_id', caller.userId)
      authorized = (count ?? 0) > 0
    }
  }
  if (!authorized) notFound()

  const data = await fetchOrderDossier(sbAdmin, id)
  if (!data) notFound()

  return (
    <main style={{ minHeight: '100vh', background: '#FBFCFE', padding: '32px 28px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <a href="/transitario" style={{ fontSize: 12, color: '#0E8C82', textDecoration: 'none', fontFamily: 'var(--font-dm-mono), monospace' }}>← Escritorio</a>
        <div style={{ height: 16 }} />
        <PedidoDossier data={data} />
      </div>
    </main>
  )
}
