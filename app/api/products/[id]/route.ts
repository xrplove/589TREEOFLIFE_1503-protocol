import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { requireApprovedCaller } from '../../../lib/actor-public'

/**
 * PATCH /api/products/[id] — publicar / despublicar una ficha (toggle público/privado).
 *
 * Es la "acción posterior gated" que el alta de producto (POST /api/products) ya
 * anticipaba ("publicar es una acción posterior gated · nunca auto-publish"):
 *   · PÚBLICO  = status 'published' → la ficha cruza al hub Global (exportable, 0,5%).
 *   · PRIVADO  = status 'draft'     → solo el dueño la ve (negocio interno).
 *
 * Defensa en profundidad:
 *   1. Auth: caller autenticado + KYC-approved (requireApprovedCaller).
 *   2. Propiedad: la ficha debe ser del caller. Si no existe O no es suya → 404
 *      OPACO (no se revela la existencia de recursos ajenos).
 *   3. Transición acotada: solo se permite draft↔published. Estados de operador
 *      (archived/suspended/pending_audit) NO se tocan desde aquí → 409.
 *   4. Escritura con la sesión del usuario (sbAuth) → la RLS `products_update_own`
 *      es el backstop final aunque el chequeo de propiedad fallara.
 *
 * Body: { "public": true | false }
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

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

  // ── Body ──
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const wantsPublic = (body as { public?: unknown })?.public
  if (typeof wantsPublic !== 'boolean') {
    return NextResponse.json({ error: 'Falta el campo booleano "public"' }, { status: 400 })
  }

  // ── Propiedad + estado actual (service_role para leer aunque sea draft ajeno) ──
  const { data: current, error: readErr } = await sbAdmin
    .from('products')
    .select('id, owner_user_id, status')
    .eq('id', id)
    .maybeSingle()
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 502 })
  }
  // 404 OPACO: no existe O no es del caller → misma respuesta (no se revela existencia).
  if (!current || current.owner_user_id !== caller.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Transición acotada: este toggle solo gobierna público(published)/privado(draft).
  if (current.status !== 'draft' && current.status !== 'published') {
    return NextResponse.json(
      { error: `No se puede publicar/despublicar una ficha en estado '${current.status}'` },
      { status: 409 },
    )
  }

  const target = wantsPublic ? 'published' : 'draft'
  if (current.status === target) {
    // Idempotente: ya está en el estado pedido.
    return NextResponse.json({ id, status: target, public: wantsPublic, changed: false })
  }

  // ── Escritura con la sesión del usuario → RLS `products_update_own` de backstop ──
  const { data: updated, error: updErr } = await sbAuth
    .from('products')
    .update({ status: target, updated_by: caller.userId })
    .eq('id', id)
    .select('id, status')
    .single()
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 502 })
  }

  return NextResponse.json({ id: updated.id, status: updated.status, public: updated.status === 'published', changed: true })
}
