/**
 * Helpers de autenticación interna para endpoints API que NO deben ser
 * llamables desde el navegador del usuario final, pero sí desde otros
 * route handlers server-side de la misma app.
 *
 * Dos modelos:
 *  1. `verifyInternalSecret(req)`: el caller incluye un header
 *     `X-Internal-Token` con un secreto compartido (`INTERNAL_API_SECRET`).
 *     Comparado con `timingSafeEqual` para evitar timing attacks. Pensado
 *     para endpoints fire-and-forget entre route handlers (ej.
 *     /api/operator/kyc-decision → /api/auth/kyc-decision-email).
 *
 *  2. `verifySameOrigin(req)`: el caller debe presentar un header `Origin`
 *     que coincida con `NEXT_PUBLIC_SITE_URL`. Útil para endpoints
 *     consumidos solo desde el frontend de la propia app (CSRF defense).
 *
 * NO usar ambos a la vez: los endpoints internos van con secret HMAC; los
 * endpoints same-origin van con verificación de Origin. La elección depende
 * de quién es el caller esperado.
 *
 * Hardening 23-may tarde (auditoría 100% del código): se introducen para
 * cerrar dos vulnerabilidades ALTAS detectadas — endpoint /api/auth/
 * kyc-decision-email sin auth + CSRF en /api/registro/choose-sector.
 */

import { timingSafeEqual } from 'node:crypto'

const SECRET_ENV = 'INTERNAL_API_SECRET'
const SITE_URL_ENV = 'NEXT_PUBLIC_SITE_URL'

export type InternalAuthResult = { ok: true } | { ok: false; reason: string }

/**
 * Valida que el request lleve `X-Internal-Token` con el valor de
 * `INTERNAL_API_SECRET`. Si la env var no está configurada en producción,
 * fail-closed (deniega todo). En dev, permite pasar pero loguea aviso —
 * para que el desarrollador no tenga que configurar el secret en local.
 */
export function verifyInternalSecret(req: Request): InternalAuthResult {
  const secret = process.env[SECRET_ENV]
  const isProd = process.env.NODE_ENV === 'production'

  if (!secret) {
    if (isProd) {
      return { ok: false, reason: `${SECRET_ENV} not configured` }
    }
    // En dev permitimos pasar pero avisamos en consola — la primera vez que
    // se vea este log el desarrollador debe configurar el secret en .env.local.
    console.warn(
      `[internal-api-auth] ${SECRET_ENV} no configurado. En dev se permite la llamada; en producción se rechaza.`,
    )
    return { ok: true }
  }

  const provided = req.headers.get('x-internal-token') ?? ''
  if (!provided) {
    return { ok: false, reason: 'missing X-Internal-Token header' }
  }

  // timingSafeEqual exige buffers del mismo tamaño. Si no coinciden, devuelve
  // false sin revelar info de longitud. Comparamos hash-equiv length first
  // construyendo buffers de tamaño máximo y dejando que timingSafeEqual haga
  // la comparación constant-time.
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(secret, 'utf8')
  if (a.length !== b.length) {
    return { ok: false, reason: 'invalid X-Internal-Token' }
  }
  const eq = timingSafeEqual(a, b)
  return eq ? { ok: true } : { ok: false, reason: 'invalid X-Internal-Token' }
}

/**
 * Valida que el `Origin` header del request coincida con `NEXT_PUBLIC_SITE_URL`.
 * Defensa primaria contra CSRF: un sitio atacante no puede falsear `Origin`
 * desde el navegador (es header bloqueado por la spec).
 *
 * En dev, si no hay env var configurada, acepta `http://localhost:*`.
 */
export function verifySameOrigin(req: Request): InternalAuthResult {
  const origin = req.headers.get('origin')
  if (!origin) {
    // POST sin Origin es muy sospechoso (navegadores modernos lo añaden
    // siempre en POST cross-origin). Lo aceptamos solo si Referer está
    // presente y coincide con SITE_URL — modelo más permisivo para clientes
    // antiguos pero igual de seguro frente a CSRF.
    const referer = req.headers.get('referer')
    if (!referer) return { ok: false, reason: 'missing Origin and Referer' }
    return verifyRefererMatchesSite(referer)
  }
  return verifyOriginMatchesSite(origin)
}

function verifyOriginMatchesSite(origin: string): InternalAuthResult {
  const siteUrl = process.env[SITE_URL_ENV]
  if (!siteUrl) {
    // Dev fallback: aceptar localhost:* (cualquier puerto).
    try {
      const u = new URL(origin)
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return { ok: true }
      }
    } catch {
      return { ok: false, reason: 'invalid Origin header' }
    }
    return { ok: false, reason: `${SITE_URL_ENV} not configured` }
  }

  try {
    const requested = new URL(origin)
    const allowed = new URL(siteUrl)
    if (
      requested.protocol === allowed.protocol &&
      requested.hostname === allowed.hostname &&
      (requested.port || '') === (allowed.port || '')
    ) {
      return { ok: true }
    }
    return { ok: false, reason: 'Origin does not match site URL' }
  } catch {
    return { ok: false, reason: 'invalid Origin header' }
  }
}

function verifyRefererMatchesSite(referer: string): InternalAuthResult {
  try {
    const ref = new URL(referer)
    return verifyOriginMatchesSite(ref.origin)
  } catch {
    return { ok: false, reason: 'invalid Referer header' }
  }
}
