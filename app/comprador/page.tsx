// Escritorio COMPRADOR · datos REALES de BD. Gate: sesión + KYC aprobado.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../lib/actor-public'
import { type ModuleId } from '../data/sectorDashboardConfig'
import { fetchBuyerDossiers } from './orders'
import { CompradorDesk } from './desk'

export const dynamic = 'force-dynamic'

// Set de pestañas del comprador: Pedidos (real) + compartidas del DeskFrame.
const BUYER_MODULES: ModuleId[] = ['pedidos', 'agenda', 'mensajes', 'archivos']

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0A0C11', color: '#EAEFF6', fontFamily: 'system-ui', padding: 40 }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.2rem', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: '0.9rem', color: '#9AA7B8', margin: 0, lineHeight: 1.55 }}>{body}</p>
      </div>
    </main>
  )
}

export default async function CompradorPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return <Centered title="Servidor sin configurar" body="Faltan las claves de Supabase en el entorno." />
  }

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
    if (caller.reason === 'unauthenticated') redirect('/login?next=/comprador')
    return <Centered title="Acceso pendiente de verificación" body="Tu cuenta aún no está aprobada (KYC). Cuando se valide, verás aquí tus pedidos." />
  }

  const [dossiers, actorRes] = await Promise.all([
    fetchBuyerDossiers(sbAdmin, caller.userId),
    sbAdmin.from('actors').select('company_name, role_id').eq('user_id', caller.userId).maybeSingle(),
  ])

  return (
    <CompradorDesk
      dossiers={dossiers}
      modules={BUYER_MODULES}
      roleId={actorRes.data?.role_id ?? null}
      hrefBase="/comprador"
      buyerName={actorRes.data?.company_name ?? undefined}
    />
  )
}
