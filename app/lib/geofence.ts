import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { clientIpFromHeaders } from './request-ip'

/**
 * Geofence — Sprint 1 (Compliance MiCA, ADR 0001).
 *
 * Capa 1 de la defensa en profundidad: bloqueo por país detectado en
 * cabeceras del request. Las capas 2-6 (browser fingerprint, KYC
 * documental, FATCA, sanctions screening, ToS atestación) se añaden en
 * sprints posteriores.
 *
 * Detección de país: en producción usa `x-vercel-ip-country` (Vercel) o
 * `cf-ipcountry` (Cloudflare). En desarrollo asume 'ES' por defecto, y
 * acepta `?debug_country=XX` en la URL para forzar uno y testear.
 *
 * Cache: Map en memoria del runtime con TTL 60s. Refresca asíncrono.
 * Sin Redis ni KV externo — simple, suficiente para volumen MVP. Cada
 * instancia de Edge tiene su propio cache; el peor caso es 60s de
 * propagación tras cambiar la lista de países desde el panel operador.
 *
 * Log: cada decisión bloqueada se persiste en `geofence_log` (append-only
 * por reglas SQL en migración 006) para auditoría regulatoria.
 *
  * Política 24-may-2026: marketplace abierto al mundo. País sin entrada
 * en la tabla → tratado como `allowed` por defecto. Solo bloquean los 18
 * países en `blocked_sanctions` (OFAC/UE/UN). KYC sigue obligatorio para
 * todos. Las funciones de pago/escrow se feature-gate por país cuando se
 * activen (Fase 7+), pero no impiden el alta. Ver migración 011.
 */

export type CountryStatus =
  | 'allowed'
  | 'blocked_sanctions'
  | 'blocked_pending_license'
  | 'waitlist'

export interface CountryRestriction {
  country_code: string
  status: CountryStatus
  reason: string | null
}

const CACHE_TTL_MS = 60 * 1000
const cache = new Map<string, { data: CountryRestriction; expires: number }>()

/**
 * Tipado mínimo del esquema Supabase para las dos tablas que toca este módulo.
 * Equivale al subconjunto que generaría `supabase gen types`; tiparlo explícitamente
 * evita que `.insert()` se infiera como `never` (cliente sin esquema). Cuando se
 * generen los tipos completos del proyecto, este bloque se sustituye por ellos.
 */
type GeofenceLogRow = {
  ip_address: string
  detected_country: string | null
  detected_via: string
  path_attempted: string
  action_taken: string
  user_agent: string | null
  vpn_detected: boolean
  tor_detected: boolean
  proxy_detected: boolean
}
type Database = {
  public: {
    Tables: {
      country_restrictions: {
        Row: { country_code: string; status: CountryStatus; reason: string | null }
        Insert: { country_code: string; status?: CountryStatus; reason?: string | null }
        Update: { country_code?: string; status?: CountryStatus; reason?: string | null }
        Relationships: []
      }
      geofence_log: {
        Row: GeofenceLogRow & { id: string; created_at: string }
        Insert: GeofenceLogRow
        Update: Partial<GeofenceLogRow>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

let _admin: SupabaseClient<Database> | null = null
function admin(): SupabaseClient<Database> | null {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // Sin backend configurado (p. ej. el landing público de marketing, que no
    // lleva claves de servidor). NO lanzamos: el llamador aplica la política
    // documentada fail-open (marketplace abierto · migración 011). Un deploy
    // REAL mal configurado revienta de forma visible en login/verify-otp; el
    // geofence es capa 1 de defensa en profundidad, no el gate final (KYC lo es).
    return null
  }
  _admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}

export async function evaluateCountry(code: string): Promise<CountryRestriction> {
  const upper = code.toUpperCase()
  const cached = cache.get(upper)
  if (cached && cached.expires > Date.now()) return cached.data

  const db = admin()
  if (!db) {
    // Sin backend disponible → MISMA política que un fallo de BD (abajo):
    // fail-open a `allowed`. Solo bloquean los sancionados CONFIRMADOS en BD,
    // así que sin BD no hay bloqueo posible (coherente con la migración 011).
    // No cacheamos: en cuanto el backend esté, se evalúa de verdad.
    return { country_code: upper, status: 'allowed', reason: 'geofence sin backend — fail-open por defecto (solo bloquean sancionados confirmados en BD)' }
  }

  const { data, error } = await db
    .from('country_restrictions')
    .select('country_code, status, reason')
    .eq('country_code', upper)
    .maybeSingle()

  if (error) {
    console.error('[geofence] DB lookup failed:', error.message)
    // Política 24-may: fail-open por defecto (marketplace global). Solo
    // bloqueamos cuando confirmamos sanción explícita. Si la BD está caída
    // dejamos pasar — los 18 sancionados no van a colarse igualmente porque
    // serán bloqueados al siguiente request cuando la BD esté de vuelta.
    return { country_code: upper, status: 'allowed', reason: 'DB lookup failed — fail-open por defecto (solo bloquean sancionados confirmados)' }
  }

  const result: CountryRestriction = (data as CountryRestriction | null) ?? {
    country_code: upper,
    status: 'allowed',
    reason: 'país sin entrada en country_restrictions — política open by default 24-may',
  }

  cache.set(upper, { data: result, expires: Date.now() + CACHE_TTL_MS })
  return result
}

export async function logGeofenceDecision(params: {
  ip: string
  country: string | null
  via: string
  pathAttempted: string
  actionTaken: string
  userAgent?: string
  vpn?: boolean
  tor?: boolean
  proxy?: boolean
}) {
  try {
    const db = admin()
    if (!db) return // sin backend: no hay dónde persistir el log (no-op, no bloquea el flujo)
    await db.from('geofence_log').insert({
      ip_address: params.ip,
      detected_country: params.country,
      detected_via: params.via,
      path_attempted: params.pathAttempted,
      action_taken: params.actionTaken,
      user_agent: params.userAgent ?? null,
      vpn_detected: params.vpn ?? false,
      tor_detected: params.tor ?? false,
      proxy_detected: params.proxy ?? false,
    })
  } catch (e) {
    console.error('[geofence] log failed (non-blocking):', e)
  }
}

/**
 * Detecta el país de origen del request a partir de las cabeceras que
 * inyectan los proveedores de hosting/CDN. En desarrollo permite forzar
 * uno con `?debug_country=XX`.
 */
export function detectCountry(req: { headers: Headers; url: string }): {
  country: string | null
  via: string
} {
  const vercel = req.headers.get('x-vercel-ip-country')
  if (vercel) return { country: vercel.toUpperCase(), via: 'vercel' }

  const cf = req.headers.get('cf-ipcountry')
  if (cf) return { country: cf.toUpperCase(), via: 'cloudflare' }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const url = new URL(req.url)
      const debug = url.searchParams.get('debug_country')
      if (debug) return { country: debug.toUpperCase(), via: 'dev_override' }
    } catch {
      // ignore parse errors
    }
    return { country: 'ES', via: 'dev_default' }
  }

  return { country: null, via: 'unknown' }
}

/**
 * IP del cliente para el log de auditoría del geofence. Delega en el
 * resolver compartido con modelo de confianza explícito (H-2): en
 * producción NO se confía en `x-forwarded-for` crudo (spoofable), solo en
 * cabeceras inyectadas por el CDN/edge. Fallback no-nulo '0.0.0.0' porque
 * geofence_log siempre persiste una fila aunque no haya cabecera fiable.
 */
export function getClientIp(req: { headers: Headers }): string {
  return clientIpFromHeaders(req.headers) ?? '0.0.0.0'
}

/** True si el path debe pasar por el geofence (alta de nuevos Actores). */
export function pathNeedsGeofence(path: string): boolean {
  // Sprint 1: solo /register/[code] (ruta real de alta de Actor desde el
  // mapa de continente). La home, /continent, /sector y otras rutas
  // públicas quedan accesibles a todo el mundo. Los Actores ya registrados
  // entran por /acceso + /escritorio (otros guards los protegen).
  return path.startsWith('/register/')
}
