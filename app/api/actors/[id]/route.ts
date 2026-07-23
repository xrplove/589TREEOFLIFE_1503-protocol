import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { fetchPublicActor, requireApprovedCaller } from '../../../lib/actor-public'

/**
 * GET /api/actors/[id] — ficha pública de un Actor (Fase 3c v1).
 *
 * `id` en la URL = `actors.user_id` (= `auth.users.id`). Es el mismo
 * identificador que `useChat.startConversation(recipientId)` espera, así
 * que la ficha → botón "Iniciar chat" cuadra sin mapping.
 *
 * Gating (consistente con la puerta 5 del chat):
 *   - caller debe estar autenticado.
 *   - caller debe tener kyc_status = 'approved'.
 *   - actor solicitado debe tener kyc_status = 'approved' (si no, 404
 *     opaco — no revelamos si existe pero no aprobado).
 *
 * La RLS de `actors` solo permite SELECT del propio user_id; este endpoint
 * usa service_role para leer filas ajenas. El filtrado de campos públicos
 * vive en `app/lib/actor-public.ts` (fuente única).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
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

  // Excepción de visibilidad: el propio Actor SIEMPRE ve su ficha (aunque
  // esté oculta) para poder gestionarla. Otros respetan el opt-out.
  const isSelf = caller.userId === id
  const actor = await fetchPublicActor(sbAdmin, id, { includeHidden: isSelf })
  if (!actor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ actor })
}
