// Escritorio TRANSITARIO · detalle de un envío (datos REALES). 404 opaco si el
// caller no es custodio del envío.
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../lib/actor-public'
import { fetchShipmentDetail } from '../custody'
import { ShipmentDetailDesk } from '../desk'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function TransitarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) notFound()

  const cookieStore = await cookies()
  const sbAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          /* no-op en Server Component */
        }
      },
    },
  })
  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const caller = await requireApprovedCaller(sbAuth, sbAdmin)
  if (!caller.ok) {
    if (caller.reason === 'unauthenticated') redirect(`/login?next=/transitario/${id}`)
    notFound()
  }

  const s = await fetchShipmentDetail(sbAdmin, caller.userId, id)
  if (!s) notFound() // no es custodio de este envío → no existe para él

  return <ShipmentDetailDesk s={s} backHref="/transitario" />
}
