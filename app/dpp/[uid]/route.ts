import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isUuid, type DppResolverRow } from '@/app/lib/dppResolver'
import { DPP_RESOLVER_SELECT, passportResponse } from '@/app/lib/dppServe'
import { verifyDppCustody } from '@/app/lib/custodyVerify'

/**
 * GET /dpp/[uid] — RESOLVER público del Pasaporte Digital de Producto (rodaja 3 · ADR 0023).
 *
 * Destino del portador interino (`{resolver}/dpp/{dpp_registry.id}`). Sirve el
 * pasaporte con negociación de contenido (HTML / JSON-LD · ver `dppServe`).
 *
 * Seguridad: lee con `service_role` (la RLS de `dpp_registry` no deja al público)
 * y devuelve solo el proyectado de consumidor (filtrado positivo). **404 opaco**:
 * uid inválido o inexistente → 404 (no se revela existencia · regla global).
 */

function notFound(): NextResponse {
  return new NextResponse('Not found', { status: 404 })
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
  const { uid } = await ctx.params
  if (!isUuid(uid)) return notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await sb.from('dpp_registry').select(DPP_RESOLVER_SELECT).eq('id', uid).maybeSingle()
  if (error) return NextResponse.json({ error: 'DB error' }, { status: 502 })
  if (!data) return notFound()

  // Precinto: verifica la cadena de custodia firmada del DPP (si la tiene).
  const seal = await verifyDppCustody(sb, uid)
  return passportResponse(req, data as unknown as DppResolverRow, seal)
}
