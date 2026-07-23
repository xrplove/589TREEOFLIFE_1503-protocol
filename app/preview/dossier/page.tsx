// PREVIEW (sin login) · Dossier del pedido de la PRUEBA SERIA, leído de BD real.
// Lee con service_role un pedido demo concreto y lo pinta con PedidoDossier.
// Sandbox de revisión para José (como /preview/transitario). No expone PII.

import { createClient } from '@supabase/supabase-js'
import PedidoDossier from '../../transitario/PedidoDossier'
import { fetchOrderDossier } from '../../transitario/dossier'

export const dynamic = 'force-dynamic'

// Pedido demo de la prueba seria (paso 2). Configurable por env si se quiere otro.
const DEMO_ORDER_ID = process.env.DOSSIER_DEMO_ORDER_ID ?? '918bf57d-501b-4426-9528-9ec22e4d538c'

export default async function PreviewDossierPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return <main style={{ padding: 40, fontFamily: 'system-ui' }}>Servidor sin configurar (faltan claves Supabase).</main>
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const data = await fetchOrderDossier(sb, DEMO_ORDER_ID)

  return (
    <main style={{ minHeight: '100vh', background: '#FBFCFE', padding: '40px 28px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: '#8A98AD', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
          🎭 Preview sin login · datos reales de BD · pago simulado
        </div>
        {data ? <PedidoDossier data={data} /> : <p style={{ color: '#B7791F' }}>No se encontró el pedido demo {DEMO_ORDER_ID.slice(0, 8)}.</p>}
      </div>
    </main>
  )
}
