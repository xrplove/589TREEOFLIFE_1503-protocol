import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../../../lib/actor-public'
import {
  getCorridorRequirements,
  splitConditional,
  type TradeRule,
} from '@/app/data/tradeCompliance'

/**
 * POST /api/orders/[id]/transition — avanza el ESTADO del pedido maestro.
 *
 * Máquina de estados server-side del Pedido Vivo (mig 038). La transición a
 * `confirmed` es el punto donde entra el GATE de cumplimiento del CORREDOR
 * (app/data/tradeCompliance.ts · Capa 1 EXIT UE), el pendiente que dejamos
 * nombrado al cablear /api/orders.
 *
 * Gate de confirmación (draft → confirmed), todo verificable server-side:
 *   1. Corredor DEFINIDO (origin + destination) — no se confirma un pedido de
 *      exportación sin corredor.
 *   2. Destino NO sancionado (country_restrictions.status='blocked_sanctions').
 *   3. Se ADJUNTAN las obligaciones del corredor (getCorridorRequirements):
 *      las `conditional=false` son disclosures siempre exigibles (EORI, AES,
 *      cribado de sanciones); las `conditional=true` dependen del producto
 *      (doble uso, CITES, residuos…) → subject_to_expert. Son OBLIGACIONES a
 *      cumplir, no bloqueos binarios (el motor no tiene severidad blocker), por
 *      eso se devuelven informativas y NO impiden la confirmación.
 *
 * RLS: `orders` no tiene policy de UPDATE de cliente → el cambio de estado solo
 * ocurre por este canal server-side (service_role), validando que el caller es
 * participante (comprador o vendedor) y que la transición es legal.
 *
 * SIMPLIFICACIÓN (documentada · NO atajo): cualquier participante puede ejecutar
 * cualquier transición legal. El reparto fino por rol (comprador confirma ·
 * transitario marca tránsito · consignatario firma entrega) se modelará con la
 * cadena de custodia firmada (dpp_custody_chain · mig 028), no aquí.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type OrderStatus = 'draft' | 'confirmed' | 'in_transit' | 'delivered' | 'closed' | 'cancelled'

/** Transiciones legales del pedido maestro. Estados terminales: closed · cancelled. */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
}

/** Destinos de transición válidos (nunca se transiciona A 'draft'). */
const VALID_TARGETS = new Set<OrderStatus>([
  'confirmed',
  'in_transit',
  'delivered',
  'closed',
  'cancelled',
])

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Proyección compacta de una regla del motor para la respuesta (obligación). */
function toObligation(r: TradeRule) {
  return {
    id: r.id,
    layer: r.layer,
    label: r.label.es,
    authority: r.authority.es,
    legal_basis: r.legal_basis,
    source_url: r.source_url,
    status: r.status,
    conditional: r.conditional,
    condition_note: r.condition_note?.es ?? null,
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // ── Body: { to } ──
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const to = typeof body.to === 'string' ? (body.to as OrderStatus) : null
  if (!to || !VALID_TARGETS.has(to)) {
    return NextResponse.json(
      { error: 'Invalid target status (confirmed|in_transit|delivered|closed|cancelled)' },
      { status: 400 },
    )
  }

  // ── Clients ──
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

  // ── Auth: caller autenticado + KYC-approved ──
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

  // ── Cargar el pedido (service_role) ──
  const { data: order, error: orderErr } = await sbAdmin
    .from('orders')
    .select('id, status, buyer_user_id, seller_user_id, origin_country, destination_country')
    .eq('id', id)
    .maybeSingle<{
      id: string
      status: OrderStatus
      buyer_user_id: string
      seller_user_id: string
      origin_country: string | null
      destination_country: string | null
    }>()
  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 502 })
  }
  // 404 opaco: no existe, o el caller no es participante (no revelamos cuál).
  const isParticipant =
    !!order && (order.buyer_user_id === caller.userId || order.seller_user_id === caller.userId)
  if (!order || !isParticipant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ── Transición legal desde el estado actual ──
  if (!ALLOWED[order.status].includes(to)) {
    return NextResponse.json(
      { error: `Illegal transition ${order.status} → ${to}`, from: order.status },
      { status: 409 },
    )
  }

  // ── GATE de confirmación (draft → confirmed) ──
  let complianceSnapshot: {
    total: number
    mandatory: number
    conditional: number
    obligations: ReturnType<typeof toObligation>[]
  } | null = null
  if (to === 'confirmed') {
    const origin = order.origin_country
    const destination = order.destination_country
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Corridor required to confirm (origin_country + destination_country)' },
        { status: 422 },
      )
    }

    // Destino bajo sanciones → no se confirma la exportación.
    const { data: restr, error: restrErr } = await sbAdmin
      .from('country_restrictions')
      .select('status, reason')
      .eq('country_code', destination)
      .maybeSingle<{ status: string; reason: string | null }>()
    if (restrErr) {
      return NextResponse.json({ error: restrErr.message }, { status: 502 })
    }
    if (restr?.status === 'blocked_sanctions') {
      return NextResponse.json(
        {
          error: 'Destination under sanctions',
          destination,
          reason: restr.reason ?? null,
        },
        { status: 422 },
      )
    }

    // Obligaciones del corredor (informativas · siempre-aplicables + condicionales).
    const reqs = getCorridorRequirements({ origin, destination })
    const { always, conditional } = splitConditional(reqs)
    const obligations = [...always, ...conditional].map(toObligation)
    complianceSnapshot = {
      total: obligations.length,
      mandatory: obligations.filter((o) => !o.conditional).length,
      conditional: obligations.filter((o) => o.conditional).length,
      obligations,
    }
  }

  // ── Aplicar la transición + log de auditoría en una sola transacción ──
  // RPC transition_order_write (mig 040): UPDATE optimista (where status=from ·
  // guarda contra carrera) + INSERT append-only en order_status_log. Atómico:
  // si el log falla, el cambio de estado revierte también.
  const { data: writeData, error: writeErr } = await sbAdmin.rpc('transition_order_write', {
    p_order_id: id,
    p_from: order.status,
    p_to: to,
    p_actor: caller.userId,
    p_compliance: complianceSnapshot,
    p_note: null,
  })
  if (writeErr) {
    return NextResponse.json({ error: writeErr.message }, { status: 502 })
  }
  // 0 filas: el estado cambió entre la lectura y el RPC (carrera) → 409.
  const rows = (writeData ?? []) as { id: string; status: OrderStatus; updated_at: string }[]
  const updated = rows[0]
  if (!updated) {
    return NextResponse.json(
      { error: 'Order state changed concurrently, retry', from: order.status },
      { status: 409 },
    )
  }

  return NextResponse.json(
    {
      order: { id: updated.id, status: updated.status, updated_at: updated.updated_at },
      from: order.status,
      ...(complianceSnapshot
        ? {
            corridor_compliance: {
              ...complianceSnapshot,
              note: 'Obligaciones del corredor (subject_to_expert). Informativas: no bloquean la confirmación.',
            },
          }
        : {}),
    },
    { status: 200 },
  )
}
