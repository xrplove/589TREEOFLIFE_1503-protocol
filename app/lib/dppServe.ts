// DPP · servidor de respuesta del resolver (compartido por /dpp/[uid] y /01/...).
// No es pura (usa NextResponse), pero centraliza la negociación de contenido y la
// proyección pública para que ambos resolvers se comporten idénticamente.

import { NextRequest, NextResponse } from 'next/server'
import { toConsumerPassport, toJsonLd, renderPassportHtml, type DppResolverRow } from './dppResolver'
import type { CustodySeal } from './custodyVerify'

/** Columnas del pasaporte que leen los resolvers (dpp_registry + producto enlazado). */
export const DPP_RESOLVER_SELECT =
  'id, hs_code, materials, carbon_footprint_kg_co2eq, water_footprint_l, recycled_content_pct, recyclability_pct, manufacturing_country, production_date, serial_number, data_carrier_uri, hash_canonical_sha256, onchain_tx_hash, onchain_anchored_at, created_at, products(title, gtin)'

/**
 * Construye la respuesta del pasaporte con NEGOCIACIÓN DE CONTENIDO:
 * JSON-LD si el cliente lo pide (`Accept: application/ld+json` o `?format=jsonld`),
 * HTML legible en caso contrario. `@id` siempre es la URL canónica `/dpp/{id}`.
 */
export function passportResponse(
  req: NextRequest,
  row: DppResolverRow,
  seal?: CustodySeal | null,
): NextResponse {
  const passport = toConsumerPassport(row, seal)
  const wantsJson =
    req.nextUrl.searchParams.get('format') === 'jsonld' ||
    (req.headers.get('accept') ?? '').includes('application/ld+json')

  if (wantsJson) {
    const selfUrl = `${req.nextUrl.origin}/dpp/${passport.id}`
    return NextResponse.json(toJsonLd(passport, selfUrl), {
      headers: { 'content-type': 'application/ld+json; charset=utf-8' },
    })
  }
  return new NextResponse(renderPassportHtml(passport), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
