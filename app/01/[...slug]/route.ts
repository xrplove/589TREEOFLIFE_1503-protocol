import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseGs1DigitalLink, gtinCandidates } from '@/app/lib/gs1DigitalLink'
import { type DppResolverRow } from '@/app/lib/dppResolver'
import { DPP_RESOLVER_SELECT, passportResponse } from '@/app/lib/dppServe'
import { verifyDppCustody } from '@/app/lib/custodyVerify'

/**
 * GET /01/{gtin}[/21/{serial}] — RESOLVER del GS1 Digital Link (rodaja 3b · ADR 0023).
 *
 * Destino del portador de datos de productos CON GTIN (patrón recomendado por
 * ESPR · prEN 18220): el QR codifica `https://1503.com/01/{gtin}/21/{serial}` y
 * esta ruta lo resuelve al pasaporte. Misma negociación de contenido y filtrado
 * positivo que `/dpp/[uid]`.
 *
 *   1. Parsea el Digital Link de la URL → GTIN-14 (+ serie/lote).
 *   2. Busca el producto por GTIN (cualquier forma que normalice al GTIN-14).
 *   3. Busca su DPP (por serie si la trae el enlace = nivel ítem; si no, modelo).
 *
 * **404 opaco** en cualquier fallo (enlace inválido, GTIN/serie inexistentes):
 * no se revela la existencia de recursos (regla global).
 */

function notFound(): NextResponse {
  return new NextResponse('Not found', { status: 404 })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  let parsed
  try {
    parsed = parseGs1DigitalLink(req.url)
  } catch {
    return notFound() // enlace o GTIN inválido
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) producto por GTIN (admite EAN-13/UPC-A que normalicen al GTIN-14 del enlace)
  const { data: product, error: pErr } = await sb
    .from('products')
    .select('id')
    .in('gtin', gtinCandidates(parsed.gtin14))
    .limit(1)
    .maybeSingle()
  if (pErr) return NextResponse.json({ error: 'DB error' }, { status: 502 })
  if (!product) return notFound()

  // 2) DPP del producto: con serie → nivel ítem; sin serie → nivel modelo (serial NULL)
  let q = sb.from('dpp_registry').select(DPP_RESOLVER_SELECT).eq('product_id', product.id as string)
  q = parsed.serial ? q.eq('serial_number', parsed.serial) : q.is('serial_number', null)
  const { data, error } = await q.limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: 'DB error' }, { status: 502 })
  if (!data) return notFound()

  // Precinto: verifica la cadena de custodia firmada del DPP (si la tiene).
  const seal = await verifyDppCustody(sb, (data as { id: string }).id)
  return passportResponse(req, data as unknown as DppResolverRow, seal)
}
