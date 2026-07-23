import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../lib/actor-public'
import { buildDppRecord, type DppCreateInput } from '@/app/lib/dppCreate'
import { DEFAULT_DPP_RESOLVER } from '@/app/lib/dppDataCarrier'

/**
 * POST /api/dpp — ALTA del Pasaporte Digital de Producto (keystone · ADR 0023).
 *
 * Es el "tren" sobre los raíles de las rodajas 1-3: crea la fila en
 * `dpp_registry` a partir de un producto del Actor, ACUÑA el portador de datos
 * (GS1 Digital Link si el producto tiene GTIN; si no, UID interino) y calcula el
 * HASH CANÓNICO SHA-256 (integridad). La firma Ed25519 / anclaje on-chain quedan
 * diferidos (decisión de claves pendiente).
 *
 * Gating (igual que /api/products):
 *   1. Caller autenticado + KYC-approved.
 *   2. El producto debe pertenecer al caller → si no, 404 OPACO (no se revela la
 *      existencia de productos ajenos · regla global).
 *   3. Validación de los datos estáticos (buildDppRecord) → 422 si incumple.
 *   4. Persistencia con service_role (la RLS de dpp_registry exige owner;
 *      escribimos owner_user_id = caller).
 */

function notFound(): NextResponse {
  return new NextResponse('Not found', { status: 404 })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
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

  let body: DppCreateInput
  try {
    body = (await req.json()) as DppCreateInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body?.product_id || typeof body.product_id !== 'string') {
    return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })
  }

  // El producto debe ser del caller (si no existe o es ajeno → 404 opaco).
  const { data: product, error: prodErr } = await sbAdmin
    .from('products')
    .select('id, sector_id, gtin')
    .eq('id', body.product_id)
    .eq('owner_user_id', caller.userId)
    .maybeSingle()
  if (prodErr) return NextResponse.json({ error: 'DB error' }, { status: 502 })
  if (!product) return notFound()

  const dppUid = crypto.randomUUID()
  const built = buildDppRecord({
    input: body,
    product: { sector_id: product.sector_id as string, gtin: (product.gtin as string | null) ?? null },
    ownerUserId: caller.userId,
    dppUid,
    resolver: DEFAULT_DPP_RESOLVER,
  })
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 422 })
  }

  const { error: insErr } = await sbAdmin.from('dpp_registry').insert({
    ...built.record,
    data_carrier_minted_at: new Date().toISOString(),
  })
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 502 })
  }

  return NextResponse.json(
    { id: built.record.id, data_carrier_uri: built.dataCarrierUri, hash_canonical_sha256: built.hash },
    { status: 201 },
  )
}
