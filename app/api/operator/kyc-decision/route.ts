import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Bloque 3b.5.3.e — endpoint del operador para decidir KYC.
 *
 * POST /api/operator/kyc-decision
 *   body: { actor_user_id: uuid, decision: 'approved'|'rejected'|'suspended', reason?: string }
 *
 * Doble validación:
 *   1. Caller autenticado vía cookies SSR.
 *   2. Email del caller presente en OPERATOR_EMAILS (env).
 *
 * Si la decisión es rejected o suspended, `reason` es obligatorio (auditoría).
 * approved no requiere motivo.
 *
 * Escritura con service role: bypasea RLS para tocar la fila del Actor (que no
 * pertenece al operador) y para insertar en kyc_review_log (RLS no permite
 * INSERT desde cliente).
 */

const ALLOWED_DECISIONS = ['approved', 'rejected', 'suspended'] as const
type Decision = (typeof ALLOWED_DECISIONS)[number]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isDecision(value: unknown): value is Decision {
  return typeof value === 'string' && (ALLOWED_DECISIONS as readonly string[]).includes(value)
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // 1. Autenticar al caller vía cookies SSR
  const cookieStore = await cookies()
  const sbAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user: caller },
    error: authErr,
  } = await sbAuth.auth.getUser()
  if (authErr || !caller) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. ¿Es operador?
  const operatorEmails = (process.env.OPERATOR_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const callerEmail = (caller.email ?? '').toLowerCase()
  if (!operatorEmails.includes(callerEmail)) {
    return NextResponse.json({ error: 'Forbidden — not an operator' }, { status: 403 })
  }

  // 3. Body
  let body: { actor_user_id?: string; decision?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const actorUserId = body.actor_user_id?.trim()
  if (!actorUserId || !UUID_RE.test(actorUserId)) {
    return NextResponse.json({ error: 'Invalid actor_user_id' }, { status: 400 })
  }
  if (!isDecision(body.decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }
  const decision = body.decision

  let reason: string | null = null
  if (typeof body.reason === 'string') {
    reason = body.reason.trim() || null
  }
  if ((decision === 'rejected' || decision === 'suspended') && !reason) {
    return NextResponse.json(
      { error: 'reason is required for rejected/suspended decisions' },
      { status: 400 },
    )
  }
  // Hardening 23-may: limitar longitud de `reason` (se persiste en
  // kyc_review_log append-only; sin tope, riesgo de DoS de almacenamiento).
  if (reason && reason.length > 2000) {
    return NextResponse.json(
      { error: 'reason exceeds maximum length (2000 chars)' },
      { status: 400 },
    )
  }

  // 4. Service role para leer estado actual + escribir
  const sbAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: actor, error: lookupErr } = await sbAdmin
    .from('actors')
    .select('user_id, kyc_status, email, first_name, company_name')
    .eq('user_id', actorUserId)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 502 })
  }
  if (!actor) {
    return NextResponse.json({ error: 'Actor not found' }, { status: 404 })
  }

  const previousStatus = actor.kyc_status as string

  // El operador no debería poder "aprobar" un Actor que ya está aprobado, ni
  // rechazar uno que ya esté rechazado, etc. Idempotencia simple: si el estado
  // actual ya es el destino, devolvemos OK sin re-escribir.
  if (previousStatus === decision) {
    return NextResponse.json({
      ok: true,
      noop: true,
      previous_status: previousStatus,
      new_status: decision,
    })
  }

  // 5. Update + audit log en una "transacción lógica" (aceptamos el riesgo
  //    pequeño de que el primer write tenga éxito y el segundo no — en ese
  //    caso, el estado avanza pero queda sin log. Para eliminar ese riesgo
  //    tendríamos que envolver ambos en una RPC SQL custom, mejora futura).
  const { error: updateErr } = await sbAdmin
    .from('actors')
    .update({ kyc_status: decision })
    .eq('user_id', actorUserId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 502 })
  }

  const { error: logErr } = await sbAdmin.from('kyc_review_log').insert({
    actor_user_id: actorUserId,
    reviewer_user_id: caller.id,
    previous_status: previousStatus,
    new_status: decision,
    reason,
  })

  if (logErr) {
    return NextResponse.json(
      { error: 'state updated but audit log failed: ' + logErr.message },
      { status: 502 },
    )
  }

  // 6. Bloque 3b.5.4 — email post-decisión al actor (fire-and-forget).
  //    Si Resend falla (sandbox rechaza alias hoy, o key caducada mañana),
  //    la transición KYC ya está aplicada y no se reintenta automáticamente.
  //    El operador puede reenviar el email manualmente cuando se registre
  //    dominio propio.
  const emailUrl = new URL('/api/auth/kyc-decision-email', req.url).toString()
  // Hardening 23-may: el endpoint email ahora exige header HMAC para
  // evitar que sea llamable desde fuera (phishing-as-a-service). En dev,
  // INTERNAL_API_SECRET puede no estar configurada — el helper del email
  // permite pasar y avisa por consola.
  const internalToken = process.env.INTERNAL_API_SECRET ?? ''
  fetch(emailUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(internalToken ? { 'X-Internal-Token': internalToken } : {}),
    },
    body: JSON.stringify({
      email: actor.email,
      firstName: actor.first_name,
      companyName: actor.company_name,
      decision,
      reason,
    }),
  })
    .then(async (r) => {
      if (!r.ok) {
        const txt = await r.text().catch(() => '<unreadable>')
        console.error(
          `[kyc-decision] email post-decisión rechazado (${r.status}) para ${actor.email}: ${txt}`,
        )
      }
    })
    .catch((e) => {
      console.error(`[kyc-decision] email post-decisión fallo de red para ${actor.email}:`, e)
    })

  return NextResponse.json({
    ok: true,
    actor_user_id: actorUserId,
    previous_status: previousStatus,
    new_status: decision,
    reviewer_user_id: caller.id,
    reason,
  })
}
