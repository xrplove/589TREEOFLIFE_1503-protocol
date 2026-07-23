import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/country-restrictions
 *
 * Devuelve el estado de las restricciones de país. Sin parámetros devuelve
 * todas las entradas. Con `?codes=US,GB,DE,...` filtra por una lista
 * concreta (eficiente cuando el cliente solo necesita los países de un
 * continente).
 *
 * Caché HTTP: 60 segundos (mismo TTL que el cache del middleware). Esto
 * evita martillear Supabase desde cada visitante del mapa.
 *
 * Lectura pública: la lista de países permitidos/bloqueados es información
 * comercial que va en la web (Sección "where we operate" del footer es
 * legítima). No filtra nada sensible.
 */

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const codesParam = url.searchParams.get('codes')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let query = admin
    .from('country_restrictions')
    .select('country_code, status, reason, estimated_until')

  if (codesParam) {
    const codes = codesParam
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c))
    if (codes.length > 0) {
      query = query.in('country_code', codes)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('[country-restrictions] DB error:', error.message)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  const response = NextResponse.json({
    countries: data ?? [],
    fetched_at: new Date().toISOString(),
  })

  // Cache 60s para alineación con el TTL del middleware. Después del cambio
  // de status en el panel operador, los visitantes ven la actualización en
  // <60s sin necesidad de purgar caches manualmente.
  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')

  return response
}
