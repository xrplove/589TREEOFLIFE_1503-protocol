/**
 * Client IP extraction from proxy headers, with an explicit trust model
 * (H-2).
 *
 * `request.ip` was removed in Next.js 15, so headers are the only source.
 * The problem with a naive reader is that `x-forwarded-for` is fully
 * client-controlled: anyone hitting the origin directly can send
 * `X-Forwarded-For: 1.2.3.4` and forge the IP we persist into the
 * append-only consent_log / geofence_log and feed into the OTP rate limiter.
 *
 * Trust model:
 *  - `cf-connecting-ip`     — Cloudflare overwrites this; client cannot forge.
 *  - `x-vercel-forwarded-for` — Vercel's own header; client cannot forge.
 *  - `x-real-ip`            — set by the Vercel/ingress proxy, not the client.
 *  These three are CDN/edge-authoritative and trusted in every environment.
 *
 *  - `x-forwarded-for`      — generic, client-spoofable. Only honoured when
 *    NOT in production (local dev / tests behind an untrusted or no proxy).
 *    In production it is ignored entirely.
 *
 * Returns null if no trusted header is present.
 *
 * Fail-closed: raw `x-forwarded-for` is NEVER trusted unless explicitly
 * opted-in via `TRUST_FORWARDED_FOR=1` (local dev / tests behind an
 * untrusted or no proxy). Previously this keyed off `NODE_ENV`, which is a
 * blind dependency: a misconfigured/forgotten env (a deploy that runs as
 * "staging" or with NODE_ENV unset) would silently re-enable spoofable
 * headers in a production-like environment. The opt-in flag removes that
 * footgun — the default everywhere is to NOT trust it.
 */
const TRUST_UNTRUSTED_XFF = process.env.TRUST_FORWARDED_FOR === '1'

function firstHop(value: string): string | null {
  const first = value.split(',')[0]?.trim()
  return first ? first : null
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()

  const vercel = headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const ip = firstHop(vercel)
    if (ip) return ip
  }

  const xreal = headers.get('x-real-ip')
  if (xreal) return xreal.trim()

  // Generic, client-controlled. Production: never trusted.
  if (TRUST_UNTRUSTED_XFF) {
    const xff = headers.get('x-forwarded-for')
    if (xff) {
      const ip = firstHop(xff)
      if (ip) return ip
    }
  }

  return null
}

/**
 * Shared by persist-consents, request-otp and verify-otp.
 */
export function getClientIp(req: Request): string | null {
  return clientIpFromHeaders(req.headers)
}

/**
 * User-Agent del request, truncado. El UA es 100 % controlado por el
 * cliente y acaba en tablas append-only (consent_log, auth_attempt_log)
 * que no se pueden limpiar después. Sin un tope, un atacante puede
 * incrustar permanentemente cadenas de varios KB (basura, payloads) en un
 * registro legal inmutable. 512 caracteres cubren cualquier UA legítimo
 * (los reales rondan los 120-250).
 */
const MAX_UA_LEN = 512
export function clientUserAgent(req: Request): string | null {
  const ua = req.headers.get('user-agent')
  if (!ua) return null
  return ua.length > MAX_UA_LEN ? ua.slice(0, MAX_UA_LEN) : ua
}
