// PREVIEW (sin login) · Escritorio del comprador, leído de BD real.
// Lee con service_role los pedidos del comprador demo (Importadora Andina) y los
// pinta con CompradorModule. Sandbox de revisión para José (como /preview/dossier).

import { createClient } from '@supabase/supabase-js'
import { CompradorModule } from '../../comprador/CompradorModule'
import { fetchBuyerDossiers } from '../../comprador/orders'

export const dynamic = 'force-dynamic'

const BUYER = process.env.DEMO_BUYER_USER_ID ?? '8d2dcdd1-3cb3-40d8-bcb3-da07c7aff644'

export default async function PreviewCompradorPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return <main style={{ padding: 40, fontFamily: 'system-ui' }}>Servidor sin configurar (faltan claves Supabase).</main>
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const dossiers = await fetchBuyerDossiers(sb, BUYER)

  return (
    <main style={{ minHeight: '100vh', background: '#0A0C11', padding: '36px 28px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: '#6B7686', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
          🎭 Preview sin login · datos reales de BD · pago simulado
        </div>
        <CompradorModule dossiers={dossiers} />
      </div>
    </main>
  )
}
