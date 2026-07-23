// PREVIEW (sin login) · Catálogo del tenant vendedor, leído de BD real.
// Lee con service_role los 100 productos de Artihome y los pinta con CatalogoModule.
// Sandbox de revisión para José (como /preview/dossier). El toggle público/privado
// se ve pero está deshabilitado (sin sesión); en el escritorio real publica Dirección.

import { createClient } from '@supabase/supabase-js'
import { CatalogoModule } from '../../inmobiliario/CatalogoModule'
import { fetchTenantCatalog } from '../../inmobiliario/catalogo'

export const dynamic = 'force-dynamic'

const TENANT = process.env.CONNECTOR_PILOT_USER_ID ?? ''

export default async function PreviewCatalogoPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return <main style={{ padding: 40, fontFamily: 'system-ui' }}>Servidor sin configurar (faltan claves Supabase).</main>
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const catalog = await fetchTenantCatalog(sb, TENANT)

  return (
    <main style={{ minHeight: '100vh', background: '#0A0C11', padding: '36px 28px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: '#6B7686', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
          🎭 Preview sin login · datos reales de BD · publicar deshabilitado (sin sesión)
        </div>
        <CatalogoModule catalog={catalog} canPublish={false} />
      </div>
    </main>
  )
}
