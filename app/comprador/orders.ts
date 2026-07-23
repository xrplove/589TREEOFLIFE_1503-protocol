// ════════════════════════════════════════════════════════════════════════════
// PEDIDOS DEL COMPRADOR · capa de datos (BD real) para el escritorio del comprador
// ────────────────────────────────────────────────────────────────────────────
// Reúne los pedidos donde el actor es el COMPRADOR y, para cada uno, el dossier
// completo (reusa `fetchOrderDossier` del transitario: pedido + líneas + corredor
// [motor real] + carga 3D + documentos + liquidación 0,5% + custodia firmada con
// verificación del precinto). Lectura con service_role (el caller pasó el gate).
//
// CANON: el pago es SIMULADO (verify-on-ledger pendiente · paso 5). PII fuera.
// ════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchOrderDossier, type DossierData } from '../transitario/dossier'

/** Dossiers completos de los pedidos donde `buyerUserId` es el comprador. */
export async function fetchBuyerDossiers(
  sb: SupabaseClient,
  buyerUserId: string,
): Promise<DossierData[]> {
  const { data, error } = await sb
    .from('orders')
    .select('id, created_at')
    .eq('buyer_user_id', buyerUserId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(`fetchBuyerDossiers: ${error.message}`)

  const ids = ((data ?? []) as { id: string }[]).map((o) => o.id)
  const dossiers = await Promise.all(ids.map((id) => fetchOrderDossier(sb, id)))
  return dossiers.filter((d): d is DossierData => d !== null)
}
