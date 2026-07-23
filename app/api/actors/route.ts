import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import {
  PUBLIC_ACTOR_COLUMNS,
  type PublicActor,
  requireApprovedCaller,
  toPublicActor,
} from '../../lib/actor-public'

/**
 * GET /api/actors — listado paginado de Actors KYC-approved (Fase 3c v1).
 *
 * Query params (todos opcionales):
 *   sector  — filtra por sector_id (ej. "INMOBILIARIO")
 *   role    — filtra por role_id (subordinado a sector si ambos están)
 *   country — filtra por country_code (ISO-3166-2, ej. "ES")
 *   cursor  — created_at del último item de la página anterior (ISO string)
 *   limit   — número de items por página (1-50, default 20)
 *
 * Gating idéntico a /api/actors/[id]: caller autenticado + kyc_status='approved'.
 *
 * Paginación por cursor descendente sobre `created_at`: estable bajo inserts
 * (a diferencia de offset, que se descuadra). v1 sin búsqueda full-text — eso
 * va en v1.1 cuando haya índice GIN sobre los campos públicos.
 */

// Sectors e ids de rol del proyecto son lowercase con guiones (ver
// `app/data/sectors.ts` — p.ej. 'inmobiliario', 'servicios-auxiliares').
// Aceptamos también A-Z por si entran en mayúscula desde otro sitio.
const SECTOR_RE = /^[a-zA-Z0-9_-]{1,40}$/
const ROLE_RE = /^[a-zA-Z0-9_-]{1,80}$/
const COUNTRY_RE = /^[A-Z]{2}$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const params = req.nextUrl.searchParams
  const sector = params.get('sector')?.trim() ?? null
  const role = params.get('role')?.trim() ?? null
  const country = params.get('country')?.trim() ?? null
  const cursor = params.get('cursor')?.trim() ?? null
  const limitParam = params.get('limit')?.trim() ?? null

  if (sector !== null && !SECTOR_RE.test(sector)) {
    return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
  }
  if (role !== null && !ROLE_RE.test(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (country !== null && !COUNTRY_RE.test(country)) {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 })
  }
  if (cursor !== null && !ISO_DATE_RE.test(cursor)) {
    return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
  }

  let limit = DEFAULT_LIMIT
  if (limitParam !== null) {
    const parsed = Number.parseInt(limitParam, 10)
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return NextResponse.json(
        { error: `Invalid limit (1-${MAX_LIMIT})` },
        { status: 400 },
      )
    }
    limit = parsed
  }

  const res = NextResponse.json({ ok: true })
  const sbAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options)
        }
      },
    },
  })
  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const caller = await requireApprovedCaller(sbAuth, sbAdmin)
  if (!caller.ok) {
    if (caller.reason === 'unauthenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (caller.reason === 'not_approved') {
      return NextResponse.json({ error: 'KYC approval required' }, { status: 403 })
    }
    return NextResponse.json({ error: caller.detail ?? 'DB error' }, { status: 502 })
  }

  // Pedimos limit+1 para detectar si hay siguiente página sin un count() extra.
  // `visible_in_directory=true` aplica opt-out RGPD (mig. 015): Actores
  // que se ocultaron no aparecen en el listado.
  let query = sbAdmin
    .from('actors')
    .select(PUBLIC_ACTOR_COLUMNS)
    .eq('kyc_status', 'approved')
    .eq('visible_in_directory', true)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (sector) query = query.eq('sector_id', sector)
  if (role) query = query.eq('role_id', role)
  if (country) query = query.eq('country_code', country)
  if (cursor) query = query.lt('created_at', cursor)

  const { data: rows, error: listErr } = await query
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 502 })
  }

  const slice = (rows ?? []).slice(0, limit)
  const hasMore = (rows ?? []).length > limit
  const nextCursor = hasMore ? slice[slice.length - 1]?.created_at ?? null : null

  const actors: PublicActor[] = slice.map(toPublicActor)

  return NextResponse.json({ actors, nextCursor })
}
