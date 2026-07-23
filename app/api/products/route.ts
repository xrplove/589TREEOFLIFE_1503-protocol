import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../lib/actor-public'
import {
  validateSectorCompliance,
  filtrarPorJurisdiccionOperacion,
  validateFiscalShape,
  type ComplianceViolation,
} from '@/app/data/productSchemas'
import { buildDppRecord } from '@/app/lib/dppCreate'
import { DEFAULT_DPP_RESOLVER } from '@/app/lib/dppDataCarrier'

/**
 * POST /api/products — crea una ficha (producto/servicio) con GATE de cumplimiento.
 *
 * Ruta crítica #2 de "leyes aplicadas a falta de supervisión" (Audit-Ready by
 * Design): convierte la fuente de verdad de cumplimiento (`validateSectorCompliance`
 * + `validateFiscalCompliance`) en un gate EFECTIVO server-side. Una ficha que
 * incumple una regla `blocker` (sectorial o fiscal) NO se persiste.
 *
 * Pipeline:
 *   1. Auth: caller autenticado + KYC-approved (requireApprovedCaller).
 *   2. Shape: campos mínimos (sector_id · sub_categoria · sku · title) + Zod del
 *      bloque fiscal si viene.
 *   3. GATE: validateSectorCompliance(sector_id, payload) — sector + fiscal
 *      fusionados. Blockers → 422 (no se persiste). Warnings → se devuelven.
 *   4. Persistencia (service_role): columnas universales seguras + `sector_data`
 *      (payload sectorial completo, lossless) + `fiscal`. status='draft' SIEMPRE
 *      (publicar es una acción posterior gated · nunca auto-publish).
 *
 * Nota de desajustes BD↔TS (deferidos · NO atajo · documentados): los enums de
 * `payment_modality` (DB: direct/escrow_b2b_full/split_50_50/split_30_70 vs TS:
 * 01_directo/...) y `schema_status` (DB sin 'subject_to_expert') están
 * desalineados con el canon TS (mig 028 precede a Fase 7). Se mapea lo seguro y
 * el dato íntegro vive en `sector_data` sin pérdida; la proyección comercial
 * completa se hará al alinear los enums en una migración futura.
 *
 * `currency` (DB `^[A-Z]{3}$`) NO es desajuste: la factura se denomina en fiat
 * ISO 4217; RLUSD es el rail de LIQUIDACIÓN verify-on-ledger (no-custodial), no
 */

const SECTOR_RE = /^[a-zA-Z0-9_-]{2,64}$/
const CURRENCY_3_RE = /^[A-Z]{3}$/
const ISO2_RE = /^[A-Za-z]{2}$/

/** Listas de países de la ficha (mercados/exclusiones). Deben ser arrays de códigos
 *  ISO 3166-1 alpha-2. `available_countries` alimenta el filtro de jurisdicción del
 *  gate (ADR 0020): forma incorrecta = filtrado no fiable, por eso se valida aquí. */
const COUNTRY_LIST_FIELDS = ['available_countries', 'excluded_countries'] as const

function isISO2List(v: unknown): boolean {
  return Array.isArray(v) && v.every((c) => typeof c === 'string' && ISO2_RE.test(c.trim()))
}

/** Mapea la modalidad de pago del canon TS al enum de la tabla `products`. */
function mapPaymentModality(tsValue: unknown): string | null {
  switch (tsValue) {
    case '01_directo':
      return 'direct'
    case '02_b2b_nacional':
      return 'escrow_b2b_full'
    case '03_servicios':
      return 'split_50_50'
    case '04_importacion':
      return 'split_30_70'
    default:
      return null
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * GET /api/products — catálogo REAL del caller (sus propias fichas) con el
 * dpp_registry_id enlazado (si la ficha tiene DPP). Alimenta el "Pedido Vivo"
 * para que las líneas referencien product_id/dpp_registry_id reales en vez de
 * solo snapshots.
 *
 * Gating: caller autenticado + KYC-approved (igual que el resto). Devuelve solo
 * las fichas con owner_user_id = caller (RLS-mindset · sin exponer ajenas).
 * Filtrado POSITIVO de campos (canon §1): lista explícita, nunca por exclusión.
 */
type RawProductRow = {
  id: string
  sku: string
  title: unknown
  sector_id: string
  subsector_id: string | null
  status: string
  price: number | null
  currency: string | null
  hs_code: string | null
  country_of_origin: string | null
  created_at: string
  dpp_registry: { id: string }[] | { id: string } | null
}

export async function GET(req: NextRequest) {
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

  // Embebido dpp_registry(id) vía FK dpp_registry.product_id → products.id.
  const { data, error } = await sbAdmin
    .from('products')
    .select(
      'id, sku, title, sector_id, subsector_id, status, price, currency, hs_code, country_of_origin, created_at, dpp_registry(id)',
    )
    .eq('owner_user_id', caller.userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 })
  }

  const products = ((data ?? []) as RawProductRow[]).map((p) => {
    const dpp = Array.isArray(p.dpp_registry) ? p.dpp_registry[0] : p.dpp_registry
    return {
      id: p.id,
      sku: p.sku,
      title: p.title,
      sector_id: p.sector_id,
      subsector_id: p.subsector_id,
      status: p.status,
      price: p.price,
      currency: p.currency,
      hs_code: p.hs_code,
      country_of_origin: p.country_of_origin,
      created_at: p.created_at,
      dpp_registry_id: dpp?.id ?? null,
    }
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // ── Parse body ──
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Shape mínimo ──
  const actor = isPlainObject(body.actor) ? body.actor : null
  const sectorId =
    typeof body.sector_id === 'string'
      ? body.sector_id
      : typeof actor?.sector_id === 'string'
        ? (actor.sector_id as string)
        : null
  const subCategoria = typeof body.sub_categoria === 'string' ? body.sub_categoria : null
  const sku = typeof body.sku === 'string' ? body.sku.trim() : ''
  const title = body.title

  if (!sectorId || !SECTOR_RE.test(sectorId)) {
    return NextResponse.json({ error: 'Missing or invalid sector_id' }, { status: 400 })
  }
  if (!subCategoria) {
    return NextResponse.json({ error: 'Missing sub_categoria' }, { status: 400 })
  }
  if (!sku || sku.length > 64) {
    return NextResponse.json({ error: 'Missing or invalid sku (1-64 chars)' }, { status: 400 })
  }
  if (!isPlainObject(title)) {
    return NextResponse.json({ error: 'Missing title (LocalizedLabel)' }, { status: 400 })
  }

  // ── Shape de listas de países (ISO 3166-1 alpha-2) ──
  for (const key of COUNTRY_LIST_FIELDS) {
    const val = body[key]
    if (val !== undefined && val !== null && !isISO2List(val)) {
      return NextResponse.json(
        { error: `Invalid ${key}: must be an array of ISO 3166-1 alpha-2 country codes` },
        { status: 400 },
      )
    }
  }

  // ── Shape del bloque fiscal (Zod) ──
  if (body.fiscal !== undefined && body.fiscal !== null) {
    const shape = validateFiscalShape(body.fiscal)
    if (!shape.ok) {
      return NextResponse.json(
        { error: 'Invalid fiscal block', fiscal_errors: shape.errors },
        { status: 422 },
      )
    }
  }

  // ── Supabase clients ──
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

  // ── Auth: KYC-approved obligatorio para publicar ──
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

  // ── GATE: cumplimiento sectorial + fiscal (fusionado) ──
  const rawCompliance = validateSectorCompliance(sectorId, body)

  // Filtro por jurisdicción de la OPERACIÓN (ADR 0020): una regla de un ordenamiento
  // que NO rige esta operación no debe bloquearla (p.ej. marcado CE-UE sobre una venta
  // US→US). Safe-by-default: solo suprime con país de actor (KYC · caller.countryActor,
  // autoritativo) + mercados ISO explícitos (body.available_countries); ante cualquier
  // duda conserva el resultado íntegro (evita falso negativo legal). DIPr fino =
  // subject_to_expert.
  const mercados = Array.isArray(body.available_countries)
    ? (body.available_countries as unknown[]).filter((c): c is string => typeof c === 'string')
    : undefined
  const compliance = filtrarPorJurisdiccionOperacion(rawCompliance, caller.countryActor, mercados)

  const blockers = compliance.violations.filter((v: ComplianceViolation) => v.severity === 'blocker')
  const warnings = compliance.violations.filter((v: ComplianceViolation) => v.severity === 'warning')

  if (!compliance.ok || blockers.length > 0) {
    return NextResponse.json(
      {
        error: 'Compliance check failed',
        message: 'La ficha incumple obligaciones legales bloqueantes y no puede publicarse.',
        blockers,
        warnings,
      },
      { status: 422 },
    )
  }

  // ── DPP AUTOMÁTICO (keystone · ADR 0023) ──
  // El Pasaporte Digital se acuña AL SUBIR LA FICHA, no en un paso aparte. Solo
  // para fichas de PRODUCTO FÍSICO (tienen `manufacturing_country` · type guard
  // del schema DPP). Si la ficha es de producto pero sus datos de DPP son
  // inválidos/incompletos → se RECHAZA aquí (422): "ficha incompleta no opera".
  // Servicios (sin esos campos) no generan DPP. El producto y el DPP se insertan
  // de forma consistente: si el DPP falla tras insertar el producto, se compensa
  // borrando el producto (no quedan productos físicos sin pasaporte).
  const isPhysicalDpp = typeof body.manufacturing_country === 'string'
  const productId = crypto.randomUUID()
  const numOrNull = (v: unknown) => (typeof v === 'number' ? v : null)
  const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null)
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
        serial_number: strOrNull(body.serial_number),
      },
      product: { sector_id: sectorId, gtin: strOrNull(body.gtin) },
      ownerUserId: caller.userId,
      dppUid: crypto.randomUUID(),
      resolver: DEFAULT_DPP_RESOLVER,
    })
    if (!dppBuilt.ok) {
      return NextResponse.json(
        {
          error: 'DPP incompleto',
          message:
            'El Pasaporte Digital de la ficha es inválido o le faltan datos obligatorios; corrige y reenvía.',
          detail: dppBuilt.error,
        },
        { status: 422 },
      )
    }
  }

  // ── Persistencia (service_role) ──
  // Universal seguro proyectado + payload sectorial íntegro en sector_data + fiscal.
  // status='draft' SIEMPRE (publicar es acción posterior · nunca auto-publish).
  const { fiscal, ...sectorPayload } = body as Record<string, unknown>

  const price = isPlainObject(body.price) ? body.price : null
  const currencyRaw = typeof price?.currency === 'string' ? (price.currency as string) : null
  const row: Record<string, unknown> = {
    id: productId,
    owner_user_id: caller.userId,
    created_by: caller.userId,
    updated_by: caller.userId,
    sector_id: sectorId,
    sku,
    title,
    status: 'draft',
    schema_status: 'draft',
    schema_version: typeof body.schema_version === 'string' ? body.schema_version : 'universal@1.0',
    sector_data: sectorPayload,
    fiscal: fiscal ?? null,
  }
  if (typeof actor?.role_id === 'string') row.role_id = actor.role_id
  if (typeof actor?.isic === 'string') row.isic = actor.isic
  if (typeof actor?.cnae === 'string') row.cnae = actor.cnae
  if (typeof body.subsector_id === 'string') row.subsector_id = body.subsector_id
  if (isPlainObject(body.description)) row.description = body.description
  if (Array.isArray(body.images)) row.images = body.images
  if (Array.isArray(body.certificates)) row.certificates = body.certificates
  if (Array.isArray(body.required_certs_for_buyer)) row.required_certs_for_buyer = body.required_certs_for_buyer
  if (Array.isArray(body.available_countries)) row.available_countries = body.available_countries
  if (Array.isArray(body.excluded_countries)) row.excluded_countries = body.excluded_countries
  if (typeof body.hs_code === 'string') row.hs_code = body.hs_code
  if (typeof body.country_of_origin === 'string') row.country_of_origin = body.country_of_origin
  if (typeof price?.value === 'number') row.price = price.value
  if (currencyRaw && CURRENCY_3_RE.test(currencyRaw)) row.currency = currencyRaw
  if (typeof price?.vat_rate_percent === 'number') row.iva_rate = price.vat_rate_percent
  const pm = mapPaymentModality(body.payment_modality)
  if (pm) row.payment_modality = pm

  const { data: inserted, error: insertErr } = await sbAdmin
    .from('products')
    .insert(row)
    .select('id, status, created_at')
    .single()

  if (insertErr) {
    // 23505 = unique_violation (owner_user_id, sku) duplicado.
    const status = insertErr.code === '23505' ? 409 : 502
    return NextResponse.json({ error: insertErr.message }, { status })
  }

  // ── Acuñado del DPP (tras el producto, consistente con compensación) ──
  let dpp: { id: string; data_carrier_uri: string } | null = null
  if (dppBuilt && dppBuilt.ok) {
    const { error: dppErr } = await sbAdmin.from('dpp_registry').insert({
      ...dppBuilt.record,
      data_carrier_minted_at: new Date().toISOString(),
    })
    if (dppErr) {
      // Compensación: sin DPP no dejamos el producto físico huérfano.
      await sbAdmin.from('products').delete().eq('id', productId)
      return NextResponse.json(
        { error: 'No se pudo acuñar el DPP de la ficha', detail: dppErr.message },
        { status: 502 },
      )
    }
    dpp = { id: dppBuilt.record.id, data_carrier_uri: dppBuilt.dataCarrierUri }
  }

  return NextResponse.json(
    {
      product: inserted,
      dpp,
      status: 'draft',
      warnings,
      message: warnings.length
        ? 'Ficha creada en borrador. Atiende los avisos de cumplimiento antes de publicar.'
        : dpp
          ? 'Ficha creada en borrador con su Pasaporte Digital de Producto.'
          : 'Ficha creada en borrador.',
    },
    { status: 201 },
  )
}
