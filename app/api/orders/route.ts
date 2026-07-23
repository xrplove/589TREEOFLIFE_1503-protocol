import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../lib/actor-public'

/**
 * POST /api/orders — crea un PEDIDO MAESTRO (orders + order_lines) de forma ATÓMICA.
 *
 * Persiste el "Pedido Vivo" (hoy maqueta React · PedidoVivo.tsx) contra la BD real
 * (mig 038). El comprador es SIEMPRE el caller autenticado y KYC-approved; el
 * vendedor (fabricante, en el test fábrica→transitario) se pasa en el body y se
 * exige también approved. La escritura se delega al RPC `create_order_with_lines`
 * (mig 039 · SECURITY INVOKER · EXECUTE solo service_role) para garantizar que
 * order + líneas entran en una sola transacción (sin pedidos huérfanos).
 *
 * 1503 es capa de cumplimiento NO custodial: aquí NO hay pagos/escrow. `total_amount`
 * es INFORMATIVO; si no viene se calcula de las líneas (Σ quantity·unit_price).
 *
 * Pipeline:
 *   1. Auth: caller autenticado + KYC-approved (requireApprovedCaller) → buyer.
 *   2. Shape: seller (uuid · ≠ buyer · approved) · corredor ISO-2 · incoterm ·
 *      currency ISO-4217 · líneas (≥1 · quantity>0 · uuids opcionales válidos).
 *   3. Integridad (mig 041): todo product_id/dpp_registry_id de una línea DEBE
 *      pertenecer al vendedor (pre-check API + re-verificación en el RPC).
 *   4. Persistencia atómica (service_role → RPC). status='draft' SIEMPRE.
 *
 * NOTA (deferido · NO atajo): el gate de cumplimiento del CORREDOR
 * (app/data/tradeCompliance.ts) NO se aplica aquí — un pedido nace 'draft' y el
 * gate por-producto ya se enforcó al crear cada ficha (/api/products). La
 * validación del corredor entra al CONFIRMAR el pedido (transición de estado),
 * que es una ruta futura aparte.
 */

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const ISO2_RE = /^[A-Za-z]{2}$/
const CURRENCY_3_RE = /^[A-Za-z]{3}$/
const INCOTERMS = new Set(['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'])

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Línea saneada lista para el RPC (claves = las que lee jsonb_array_elements). */
type CleanLine = {
  product_id?: string
  dpp_registry_id?: string
  sku_snapshot?: string
  title_snapshot?: Record<string, unknown>
  quantity: number
  unit_price?: number
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

  // ── Vendedor (uuid) ──
  const sellerUserId = typeof body.seller_user_id === 'string' ? body.seller_user_id.trim() : ''
  if (!UUID_RE.test(sellerUserId)) {
    return NextResponse.json({ error: 'Missing or invalid seller_user_id (uuid)' }, { status: 400 })
  }

  // ── Corredor (ISO 3166-1 alpha-2 · opcional) ──
  function normIso2(field: string): { ok: true; value: string | null } | { ok: false } {
    const raw = body![field]
    if (raw === undefined || raw === null || raw === '') return { ok: true, value: null }
    if (typeof raw !== 'string' || !ISO2_RE.test(raw)) return { ok: false }
    return { ok: true, value: raw.toUpperCase() }
  }
  const origin = normIso2('origin_country')
  if (!origin.ok) return NextResponse.json({ error: 'Invalid origin_country (ISO 3166-1 alpha-2)' }, { status: 400 })
  const destination = normIso2('destination_country')
  if (!destination.ok) return NextResponse.json({ error: 'Invalid destination_country (ISO 3166-1 alpha-2)' }, { status: 400 })

  // ── Incoterm (opcional) ──
  let incoterm: string | null = null
  if (body.incoterm !== undefined && body.incoterm !== null && body.incoterm !== '') {
    if (typeof body.incoterm !== 'string' || !INCOTERMS.has(body.incoterm.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid incoterm (Incoterms 2020)' }, { status: 400 })
    }
    incoterm = body.incoterm.toUpperCase()
  }

  // ── Currency (ISO 4217 · default EUR) ──
  let currency = 'EUR'
  if (body.currency !== undefined && body.currency !== null && body.currency !== '') {
    if (typeof body.currency !== 'string' || !CURRENCY_3_RE.test(body.currency)) {
      return NextResponse.json({ error: 'Invalid currency (ISO 4217)' }, { status: 400 })
    }
    currency = body.currency.toUpperCase()
  }

  // ── total_amount (informativo · opcional) ──
  let totalAmount: number | null = null
  if (body.total_amount !== undefined && body.total_amount !== null) {
    if (typeof body.total_amount !== 'number' || !Number.isFinite(body.total_amount) || body.total_amount < 0) {
      return NextResponse.json({ error: 'Invalid total_amount (number >= 0)' }, { status: 400 })
    }
    totalAmount = body.total_amount
  }

  const notes = typeof body.notes === 'string' ? body.notes : null

  // ── Líneas (≥1) ──
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: 'Missing lines (at least one)' }, { status: 400 })
  }
  const cleanLines: CleanLine[] = []
  for (let i = 0; i < body.lines.length; i++) {
    const raw = body.lines[i]
    if (!isPlainObject(raw)) {
      return NextResponse.json({ error: `Invalid line[${i}] (object expected)` }, { status: 400 })
    }
    const quantity = raw.quantity
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: `Invalid line[${i}].quantity (number > 0)` }, { status: 400 })
    }
    const line: CleanLine = { quantity }

    if (raw.product_id !== undefined && raw.product_id !== null && raw.product_id !== '') {
      if (typeof raw.product_id !== 'string' || !UUID_RE.test(raw.product_id)) {
        return NextResponse.json({ error: `Invalid line[${i}].product_id (uuid)` }, { status: 400 })
      }
      line.product_id = raw.product_id
    }
    if (raw.dpp_registry_id !== undefined && raw.dpp_registry_id !== null && raw.dpp_registry_id !== '') {
      if (typeof raw.dpp_registry_id !== 'string' || !UUID_RE.test(raw.dpp_registry_id)) {
        return NextResponse.json({ error: `Invalid line[${i}].dpp_registry_id (uuid)` }, { status: 400 })
      }
      line.dpp_registry_id = raw.dpp_registry_id
    }
    if (raw.sku_snapshot !== undefined && raw.sku_snapshot !== null && raw.sku_snapshot !== '') {
      if (typeof raw.sku_snapshot !== 'string' || raw.sku_snapshot.length > 64) {
        return NextResponse.json({ error: `Invalid line[${i}].sku_snapshot (1-64 chars)` }, { status: 400 })
      }
      line.sku_snapshot = raw.sku_snapshot
    }
    if (raw.title_snapshot !== undefined && raw.title_snapshot !== null) {
      if (!isPlainObject(raw.title_snapshot)) {
        return NextResponse.json({ error: `Invalid line[${i}].title_snapshot (object)` }, { status: 400 })
      }
      line.title_snapshot = raw.title_snapshot
    }
    if (raw.unit_price !== undefined && raw.unit_price !== null) {
      if (typeof raw.unit_price !== 'number' || !Number.isFinite(raw.unit_price) || raw.unit_price < 0) {
        return NextResponse.json({ error: `Invalid line[${i}].unit_price (number >= 0)` }, { status: 400 })
      }
      line.unit_price = raw.unit_price
    }
    cleanLines.push(line)
  }

  // Si no se pasó total_amount, lo derivamos de las líneas (Σ quantity·unit_price)
  // cuando todas tienen unit_price. Es solo informativo (1503 no mueve dinero).
  if (totalAmount === null) {
    const allPriced = cleanLines.every((l) => typeof l.unit_price === 'number')
    if (allPriced) {
      totalAmount = cleanLines.reduce((s, l) => s + l.quantity * (l.unit_price as number), 0)
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

  // ── Auth: comprador autenticado + KYC-approved ──
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
  const buyerUserId = caller.userId

  // Comprador y vendedor no pueden coincidir (también lo cubre el CHECK de la BD).
  if (sellerUserId === buyerUserId) {
    return NextResponse.json({ error: 'Buyer and seller must differ' }, { status: 400 })
  }

  // ── El vendedor también debe ser un Actor KYC-approved ──
  const { data: seller, error: sellerErr } = await sbAdmin
    .from('actors')
    .select('kyc_status')
    .eq('user_id', sellerUserId)
    .maybeSingle<{ kyc_status: string }>()
  if (sellerErr) {
    return NextResponse.json({ error: sellerErr.message }, { status: 502 })
  }
  // 404 opaco (no revelamos si el vendedor existe pero no está aprobado).
  if (!seller || seller.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'Seller not found or not approved' }, { status: 404 })
  }

  // ── INTEGRIDAD catálogo→pedido (mig 041): toda línea solo puede referenciar
  //    productos/DPP del VENDEDOR. Pre-check aquí para un 422 limpio y temprano; el
  //    RPC lo re-verifica a nivel BD (defensa en profundidad). Mensaje genérico:
  //    no revela existencia ni propietario (mentalidad 404-opaco · canon §1).
  const lineProductIds = [...new Set(cleanLines.map((l) => l.product_id).filter((v): v is string => !!v))]
  if (lineProductIds.length > 0) {
    const { data: owned, error: ownErr } = await sbAdmin
      .from('products')
      .select('id')
      .eq('owner_user_id', sellerUserId)
      .in('id', lineProductIds)
    if (ownErr) {
      return NextResponse.json({ error: ownErr.message }, { status: 502 })
    }
    const ownedSet = new Set((owned ?? []).map((r: { id: string }) => r.id))
    if (lineProductIds.some((id) => !ownedSet.has(id))) {
      return NextResponse.json(
        { error: 'One or more lines reference products not offered by this seller' },
        { status: 422 },
      )
    }
  }
  const lineDppIds = [...new Set(cleanLines.map((l) => l.dpp_registry_id).filter((v): v is string => !!v))]
  if (lineDppIds.length > 0) {
    const { data: ownedDpp, error: dppErr } = await sbAdmin
      .from('dpp_registry')
      .select('id')
      .eq('owner_user_id', sellerUserId)
      .in('id', lineDppIds)
    if (dppErr) {
      return NextResponse.json({ error: dppErr.message }, { status: 502 })
    }
    const ownedDppSet = new Set((ownedDpp ?? []).map((r: { id: string }) => r.id))
    if (lineDppIds.some((id) => !ownedDppSet.has(id))) {
      return NextResponse.json(
        { error: 'One or more lines reference DPPs not offered by this seller' },
        { status: 422 },
      )
    }
  }

  // ── Persistencia atómica (service_role → RPC mig 039 · propiedad re-verificada mig 041) ──
  const { data: orderId, error: rpcErr } = await sbAdmin.rpc('create_order_with_lines', {
    p_buyer_user_id: buyerUserId,
    p_seller_user_id: sellerUserId,
    p_origin_country: origin.value,
    p_destination_country: destination.value,
    p_incoterm: incoterm,
    p_total_amount: totalAmount,
    p_currency: currency,
    p_notes: notes,
    p_created_by: buyerUserId,
    p_lines: cleanLines,
  })

  if (rpcErr) {
    // 23503 = FK violation (product_id/dpp_registry_id inexistente) · 23514 = check.
    // P0001 = raise exception del RPC ("at least one line"). Todos = entrada inválida.
    const clientError = ['23503', '23514', 'P0001'].includes(rpcErr.code ?? '')
    return NextResponse.json(
      { error: clientError ? rpcErr.message : 'Could not create order', detail: rpcErr.message },
      { status: clientError ? 422 : 502 },
    )
  }

  return NextResponse.json(
    {
      order: { id: orderId, status: 'draft' },
      message: 'Pedido creado en borrador.',
    },
    { status: 201 },
  )
}
