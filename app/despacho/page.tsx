// Escritorio LEGAL (despacho/notaría) · gate: sesión + KYC aprobado.
// Montado sobre el DeskFrame compartido. La ruta es /despacho porque /legal está
// ocupada por las páginas de políticas (terms/privacy/consent).
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../lib/actor-public'
import { fetchActorRole } from '../transitario/custody'
import { modulesFor } from '../data/sectorDashboardConfig'
import { LegalDesk } from './desk'
import { ConfigMissing, KycRequired } from '../transitario/fallbacks'

export const dynamic = 'force-dynamic'

export default async function DespachoPage() {
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
  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const caller = await requireApprovedCaller(sbAuth, sbAdmin)
  if (!caller.ok) {
    if (caller.reason === 'unauthenticated') redirect('/login?next=/despacho')
    return <KycRequired />
  }

  const role = await fetchActorRole(sbAdmin, caller.userId)
  const isLegal = role.sectorId === 'legal'

  // El escritorio es coherente con el gremio legal: si el actor no es de legal,
  // se le muestra en modo consulta (no se le inventa rol).
  const modules = modulesFor({ sectorId: 'legal', roleId: isLegal ? role.roleId : null })
  const roleNote = isLegal
    ? null
    : `Tu sector registrado no es legal${role.sectorId ? ` (es «${role.sectorId}»)` : ''} · ves esta vista en modo consulta`

  return <LegalDesk modules={modules} roleId={role.roleId} roleNote={roleNote} hrefBase="/despacho" />
}
