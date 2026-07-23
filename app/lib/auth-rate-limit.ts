import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Rate limit + audit del flujo OTP de acceso (Bloque C).
 *
 * Una sola tabla `public.auth_attempt_log` (append-only) es a la vez el
 * audit log forense y la fuente del rate limit: el límite se deriva de
 * contar filas recientes por email/IP en una ventana deslizante. Sin Redis,
 * sin estado en memoria — sobrevive a reinicios y a múltiples instancias.
 *
 * Umbrales "Equilibrado" (decisión 2026-05-16):
 *   request_otp : 5 / email, 10 / IP   (frena spam de buzón y quema de cuota)
 *   verify_otp  : 5 fallos / email, 20 / IP
 *                 → ~20 intentos máx en la 1 h de validez sobre 10^6 →
 *                   probabilidad de acierto ≈ 0,002 %, irrelevante.
 */

export type AuthAction = 'request_otp' | 'verify_otp'

export type AuthOutcome =
  | 'sent'
  | 'success'
  | 'rate_limited'
  | 'invalid_code'
  | 'not_found'
  | 'not_approved'
  | 'operator'
  | 'error'

const WINDOW_SEC = 15 * 60

const LIMITS: Record<AuthAction, { email: number; ip: number }> = {
  request_otp: { email: 5, ip: 10 },
  verify_otp: { email: 5, ip: 20 },
}

function admin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Inserta el intento en el audit log inmutable. Se debe await para que el
 *  conteo del rate limit del siguiente intento sea exacto. */
export async function recordAttempt(input: {
  email: string
  ip: string | null
  action: AuthAction
  outcome: AuthOutcome
  userAgent: string | null
}): Promise<void> {
  const sb = admin()
  if (!sb) return
  await sb.from('auth_attempt_log').insert({
    email: input.email.trim().toLowerCase(),
    ip_address: input.ip,
    action: input.action,
    outcome: input.outcome,
    user_agent: input.userAgent,
  })
}

export type RateLimitResult = {
  limited: boolean
  retryAfterSec: number
  scope?: 'email' | 'ip'
}

/** ¿Supera el umbral este email/IP para esta acción en la ventana?
 *  Si Supabase no está configurado (solo posible en dev), no limita —
 *  pero en ese caso el endpoint OTP tampoco funciona, así que es moot. */
export async function isRateLimited(input: {
  email: string
  ip: string | null
  action: AuthAction
}): Promise<RateLimitResult> {
  const sb = admin()
  if (!sb) return { limited: false, retryAfterSec: 0 }

  const email = input.email.trim().toLowerCase()
  const since = new Date(Date.now() - WINDOW_SEC * 1000).toISOString()
  const limits = LIMITS[input.action]

  // En verify_otp el límite por email cuenta solo FALLOS (un acceso
  // legítimo acierta rápido y no debe bloquearse). En ambos casos
  // excluimos las filas 'rate_limited' que insertamos nosotros para que
  // el limitador no se realimente.
  const excludeForEmail =
    input.action === 'verify_otp' ? '(success,rate_limited)' : '(rate_limited)'

  const { count: emailCount } = await sb
    .from('auth_attempt_log')
    .select('*', { count: 'exact', head: true })
    .eq('action', input.action)
    .eq('email', email)
    .gte('created_at', since)
    .not('outcome', 'in', excludeForEmail)

  if ((emailCount ?? 0) >= limits.email) {
    return { limited: true, retryAfterSec: WINDOW_SEC, scope: 'email' }
  }

  if (input.ip) {
    const { count: ipCount } = await sb
      .from('auth_attempt_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', input.action)
      .eq('ip_address', input.ip)
      .gte('created_at', since)
      .not('outcome', 'in', '(rate_limited)')

    if ((ipCount ?? 0) >= limits.ip) {
      return { limited: true, retryAfterSec: WINDOW_SEC, scope: 'ip' }
    }
  }

  return { limited: false, retryAfterSec: 0 }
}
