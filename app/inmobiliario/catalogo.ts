// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO DEL TENANT · capa de datos (BD real) para el escritorio del vendedor
// ────────────────────────────────────────────────────────────────────────────
// Lee el catálogo de un dueño (tenant) desde la BD y lo deja listo para pintar:
// productos + estado PÚBLICO/PRIVADO (status published/draft) + DPP + preparación
// 2028 (ESPR) DERIVADA en lectura desde `sector_data`.
//
// La preparación 2028 NO se persiste como columna: el `sector_data` ya guarda los
// campos fuente (materials, wood_source, durability, …) → la derivamos con
// `esprReadiness` en lectura. Fuente única de verdad, sin riesgo de desincronización.
// Verificado contra BD viva: 100 productos · 39 listos para 2028 (cuadra con la ingesta).
//
// CANON:
//   · PÚBLICO  = status 'published' → visible en el hub Global (cruza, exportable, 0,5%).
//   · PRIVADO  = status 'draft'     → solo el dueño lo ve (su negocio interno · Redsys).
//   El toggle público/privado lo ejecuta el endpoint PATCH (RLS `products_update_own`).
//   PII fuera. Lectura con service_role (el caller ya pasó el gate en la page).
// ════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js'
import { esprReadiness } from '../data/espr/furnitureDpp'

export type CatalogStatus = 'draft' | 'pending_audit' | 'published' | 'archived' | 'suspended'

export type Espr2028 = {
  ready: boolean
  missing: string[]
  total: number
}

export type CatalogItem = {
  id: string
  sku: string
  title: Record<string, string> | null
  status: CatalogStatus
  isPublic: boolean // status === 'published'
  price: number | null
  currency: string | null
  hs_code: string | null
  country_of_origin: string | null
  hasDpp: boolean
  espr2028: Espr2028
}

export type CatalogSummary = {
  total: number
  public: number
  private: number
  ready2028: number
  withDpp: number
}

export type TenantCatalog = {
  items: CatalogItem[]
  summary: CatalogSummary
}

type RawRow = {
  id: string
  sku: string
  title: Record<string, string> | null
  status: string
  price: number | null
  currency: string | null
  hs_code: string | null
  country_of_origin: string | null
  sector_data: Record<string, unknown> | null
  dpp_registry: { id: string }[] | { id: string } | null
}

/**
 * Lee el catálogo completo de un tenant desde BD, con público/privado y la
 * preparación 2028 derivada por ficha. `sb` debe ser service_role (el gate de
 * acceso ya se resolvió en la page que llama).
 */
export async function fetchTenantCatalog(
  sb: SupabaseClient,
  ownerUserId: string,
): Promise<TenantCatalog> {
  const { data, error } = await sb
    .from('products')
    .select(
      'id, sku, title, status, price, currency, hs_code, country_of_origin, sector_data, dpp_registry(id)',
    )
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) throw new Error(`fetchTenantCatalog: ${error.message}`)

  const items: CatalogItem[] = ((data ?? []) as RawRow[]).map((p) => {
    const dpp = Array.isArray(p.dpp_registry) ? p.dpp_registry[0] : p.dpp_registry
    const espr2028 = esprReadiness((p.sector_data ?? {}) as Record<string, unknown>)
    return {
      id: p.id,
      sku: p.sku,
      title: p.title,
      status: p.status as CatalogStatus,
      isPublic: p.status === 'published',
      price: p.price,
      currency: p.currency,
      hs_code: p.hs_code,
      country_of_origin: p.country_of_origin,
      hasDpp: Boolean(dpp?.id),
      espr2028,
    }
  })

  const summary: CatalogSummary = {
    total: items.length,
    public: items.filter((i) => i.isPublic).length,
    private: items.filter((i) => !i.isPublic).length,
    ready2028: items.filter((i) => i.espr2028.ready).length,
    withDpp: items.filter((i) => i.hasDpp).length,
  }

  return { items, summary }
}
