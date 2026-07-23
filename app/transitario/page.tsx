// Escritorio TRANSITARIO · datos REALES de BD. Gate: sesión + KYC aprobado.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../lib/actor-public'
import { fetchActorRole, fetchCustodyShipments, fetchCustodyDocuments, fetchCustodyActors } from './custody'
import { modulesFor } from '../data/sectorDashboardConfig'
import { TransitarioDesk } from './desk'
import { ConfigMissing, KycRequired } from './fallbacks'

export const dynamic = 'force-dynamic'

export default async function TransitarioPage() {
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
        // En un Server Component las cookies son de solo lectura: escribirlas
        // lanza. El refresco real de sesión lo hace el middleware (patrón
        // canónico Supabase SSR).
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
    if (caller.reason === 'unauthenticated') redirect('/login?next=/transitario')
    return <KycRequired />
  }

  const [role, shipments, documents, actors] = await Promise.all([
    fetchActorRole(sbAdmin, caller.userId),
    fetchCustodyShipments(sbAdmin, caller.userId),
    fetchCustodyDocuments(sbAdmin, caller.userId),
    fetchCustodyActors(sbAdmin, caller.userId),
  ])

  // Módulos del escritorio dirigidos por config (rol > sector > default). Para
  // un transitario sin sector/rol explícito, ancla al set de transporte.
  const modules = modulesFor({
    sectorId: role.sectorId ?? (role.isTransitario ? 'transporte' : null),
    roleId: role.roleId,
  })

  const roleNote = role.isTransitario
    ? null
    : `Tu rol registrado no es de transitario${role.roleId ? ` (es «${role.roleId}»)` : ''} · ves esta vista en modo consulta`

  return (
    <TransitarioDesk
      shipments={shipments}
      documents={documents}
      actors={actors}
      modules={modules}
      roleId={role.roleId}
      roleNote={roleNote}
      hrefBase="/transitario"
    />
  )
}
