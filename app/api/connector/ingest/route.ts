import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import {
  validateSectorCompliance,
  type ComplianceViolation,
} from '@/app/data/productSchemas/_compliance'
import { buildDppRecord } from '@/app/lib/dppCreate'
import { DEFAULT_DPP_RESOLVER } from '@/app/lib/dppDataCarrier'
import { verifyCanonicalHash } from '@/app/lib/dppHash'
import { validateEsprFurnitureDpp, esprReadiness } from '@/app/data/espr/furnitureDpp'
import {
  contratoSoportado,
  fichaCanonicaToProductBody,
  type FichaCanonica,
} from '@/app/lib/connector/contract'

/**
 * POST /api/connector/ingest — RECEPTOR del conector del hub 1503 (ADR 0003 §8).
 *
 * Una herramienta conectada (Artikalia y futuras) PUBLICA aquí una ficha de su
 * catálogo (DTO canónico `FichaCanonica`, `conector@1.0`). 1503 (el hub):
 *   1. AUTENTICA al conector con un token de servicio (Bearer).
 *   2. VALIDA versión de contrato + (si viene) el hash canónico RFC 8785.
 *   3. GATE de cumplimiento (`validateSectorCompliance`): "ficha incompleta no
 *      exporta" → si hay blocker, NO se persiste y se devuelve qué falta.
 *   4. Acuña el DPP y persiste la ficha (service_role) bajo el TENANT piloto.
 *
 * CANON: la PII del cliente nunca llega aquí. El dinero NO viaja por el conector
 * (la liquidación del 0,5% vive en `globalSettlement.ts`, simulada). El tenant
 * dueño del catálogo conectado se siembra aparte (scripts/seed-artikalia-pilot.mjs).
 *
 * HOOK DE TOKENIZACIÓN (🟢 gemelo digital / pasaporte · NO financiero): el DPP
 * acuñado aquí es el punto de extensión para tokenizar la IDENTIDAD del producto
 * en el ledger (XLS-20/MPT, solo hash · nunca PII · nunca derecho financiero).
 * Pendiente de Fase 7-8 + sello del abogado; se deja marcado, no activado.
 */

const SECTOR_ID = 'inmobiliario'
const SUB_CATEGORIA = 'producto_interiorismo'

type AuthResult = { ok: true } | { ok: false; status: number; reason: string }

/** Token de servicio del conector (Bearer). En prod es OBLIGATORIO. */
function authConnector(req: Request): AuthResult {
  const expected = process.env.CONNECTOR_INGEST_TOKEN
  const isProd = process.env.NODE_ENV === 'production'
  if (!expected) {
    // Sin secreto configurado: en prod se cierra (fail-closed); en dev se permite avisando.
    return isProd
      ? { ok: false, status: 503, reason: 'CONNECTOR_INGEST_TOKEN no configurado' }
      : { ok: true }
  }
  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 401, reason: 'token de servicio inválido' }
  }
  return { ok: true }
}

export async function POST(req: Request) {
  // ── 1. Auth del conector ──
  const auth = authConnector(req)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.reason }, { status: auth.status })
  }

  // ── 2. Cuerpo + versión de contrato ──
  let ficha: FichaCanonica
  try {
    ficha = (await req.json()) as FichaCanonica
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
  }
  if (!contratoSoportado(ficha?.contrato_version)) {
    return NextResponse.json(
      { ok: false, error: 'versión de contrato no soportada', soportada: 'conector@1.0' },
      { status: 400 },
    )
  }
  if (typeof ficha.sku !== 'string' || typeof ficha.titulo !== 'string' || !ficha.precio) {
    return NextResponse.json({ ok: false, error: 'ficha mal formada (sku/titulo/precio)' }, { status: 400 })
  }

  // ── 3. Integridad: hash canónico RFC 8785 (si lo trae) ──
  let integrityVerified = false
  if (typeof ficha.hash_canonico === 'string' && ficha.hash_canonico.length > 0) {
    const { hash_canonico, ...payload } = ficha
    if (!verifyCanonicalHash(payload as unknown as Parameters<typeof verifyCanonicalHash>[0], hash_canonico)) {
      return NextResponse.json(
        { ok: false, error: 'hash canónico no coincide (integridad)' },
        { status: 422 },
      )
    }
    integrityVerified = true
  }

  // ── 4. Tenant piloto dueño del catálogo conectado ──
  const pilotUserId = process.env.CONNECTOR_PILOT_USER_ID
  if (!pilotUserId) {
    return NextResponse.json(
      { ok: false, error: 'tenant piloto no sembrado (CONNECTOR_PILOT_USER_ID)' },
      { status: 503 },
    )
  }

  // ── 5. Mapeo al cuerpo de 1503 + GATE de cumplimiento ──
  // Bloqueante HOY: sectorial + fiscal + embalaje (lo que ya es ley). ESPR se evalúa
  // en modo 'today' → AVISO de preparación 2028 (hoy el mueble es legal sin DPP ESPR),
  // no impide operar. El grado de preparación 2028 viaja en la respuesta.
  const body = fichaCanonicaToProductBody(ficha, { sectorId: SECTOR_ID, subCategoria: SUB_CATEGORIA })
  const compliance = validateSectorCompliance(SECTOR_ID, body)
  const espr = validateEsprFurnitureDpp(body, { mode: 'today' })
  const blockers = [...compliance.violations, ...espr.violations].filter(
    (v: ComplianceViolation) => v.severity === 'blocker',
  )
  if (blockers.length > 0) {
    // "Ficha incompleta no exporta": no se persiste; se devuelve qué falta.
    return NextResponse.json(
      { ok: false, error: 'ficha incompleta no exporta', sku: ficha.sku, blockers },
      { status: 422 },
    )
  }
  const readiness2028 = esprReadiness(body)

  // ── 6. Clientes service_role + DPP ──
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Supabase no configurado' }, { status: 503 })
  }
  const sbAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const productId = crypto.randomUUID()
  const numOrNull = (v: unknown) => (typeof v === 'number' ? v : null)
  const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null)
  const isPhysicalDpp = typeof body.manufacturing_country === 'string'
  let dppBuilt: ReturnType<typeof buildDppRecord> | null = null
  if (isPhysicalDpp) {
    dppBuilt = buildDppRecord({
      input: {
        product_id: productId,
        manufacturing_country: body.manufacturing_country as string,
        production_date: strOrNull(body.production_date) ?? '',
        materials: body.materials,
        carbon_footprint_kg_co2eq: numOrNull(body.carbon_footprint_kg_co2eq),
        water_footprint_l: numOrNull(body.water_footprint_l),
        recycled_content_pct: numOrNull(body.recycled_content_pct),
        recyclability_pct: numOrNull(body.recyclability_pct),
        hs_code: strOrNull(body.hs_code),
        serial_number: null,
      },
      product: { sector_id: SECTOR_ID, gtin: null },
      ownerUserId: pilotUserId,
      dppUid: crypto.randomUUID(),
      resolver: DEFAULT_DPP_RESOLVER,
    })
    if (!dppBuilt.ok) {
      return NextResponse.json(
        { ok: false, error: 'DPP incompleto', detail: dppBuilt.error },
        { status: 422 },
      )
    }
  }

  // ── 7. Persistencia (service_role) bajo el tenant piloto ──
  const price = body.price as { value?: number; currency?: string } | undefined
  const row: Record<string, unknown> = {
    id: productId,
    owner_user_id: pilotUserId,
    created_by: pilotUserId,
    updated_by: pilotUserId,
    sector_id: SECTOR_ID,
    sku: ficha.sku,
    title: body.title,
    status: 'draft',
    schema_status: 'draft',
    schema_version: 'universal@1.0',
    sector_data: body,
    fiscal: null,
    subsector_id: SUB_CATEGORIA,
  }
  if (Array.isArray(body.images)) row.images = body.images
  if (Array.isArray(body.certificates)) row.certificates = body.certificates
  if (typeof body.hs_code === 'string') row.hs_code = body.hs_code
  if (typeof body.country_of_origin === 'string') row.country_of_origin = body.country_of_origin
  if (typeof price?.value === 'number') row.price = price.value
  if (typeof price?.currency === 'string' && /^[A-Z]{3}$/.test(price.currency)) row.currency = price.currency

  const { data: inserted, error: insertErr } = await sbAdmin
    .from('products')
    .insert(row)
    .select('id, status, created_at')
    .single()

  if (insertErr) {
    const status = insertErr.code === '23505' ? 409 : 502
    return NextResponse.json({ ok: false, error: insertErr.message, sku: ficha.sku }, { status })
  }

  // ── 8. Acuñado del DPP (con compensación: sin DPP no dejamos producto huérfano) ──
  let dpp: { id: string; data_carrier_uri: string } | null = null
  if (dppBuilt && dppBuilt.ok) {
    const { error: dppErr } = await sbAdmin.from('dpp_registry').insert({
      ...dppBuilt.record,
      data_carrier_minted_at: new Date().toISOString(),
    })
    if (dppErr) {
      await sbAdmin.from('products').delete().eq('id', productId)
      return NextResponse.json(
        { ok: false, error: 'No se pudo acuñar el DPP', detail: dppErr.message },
        { status: 502 },
      )
    }
    dpp = { id: dppBuilt.record.id, data_carrier_uri: dppBuilt.dataCarrierUri }
  }

  return NextResponse.json(
    {
      ok: true,
      product: inserted,
      dpp,
      tenant: 'artikalia-pilot',
      integrity_verified: integrityVerified,
      // Preparación para la ley de 2028 (hoy es informativo · el producto ya es legal).
      espr_2028_readiness: readiness2028,
      // Hook de tokenización (🟢 identidad/pasaporte · no financiero) — no activado.
      tokenize_hook: dpp ? { available: true, mode: 'digital_twin_identity', activated: false } : null,
    },
    { status: 201 },
  )
}
