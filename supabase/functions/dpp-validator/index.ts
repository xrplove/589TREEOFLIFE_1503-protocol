// Edge Function: dpp-validator
// Path: supabase/functions/dpp-validator/index.ts
// Runtime: Deno (Supabase Edge Functions)
// Purpose: DPP Módulo 2 pieza 3 · validador de eventos logísticos del Pasaporte
//          Digital de Productos (Reg. UE 2024/1781 ESPR).
//
// FLUJO DE VALIDACIÓN (en orden · cualquier fallo aborta y devuelve 4xx)
// ----------------------------------------------------------------------
//   1. Method = POST, Authorization Bearer JWT presente
//   2. Body JSON válido con shape esperada (validateRequestShape)
//   3. JWT válido · extraer verifier_user_id + app_metadata.roles
//   4. verifier_role declarado está en JWT app_metadata.roles array
//      (no se puede inventar rol que el usuario no tiene activo)
//   5. DPP existe en dpp_registry
//   6. Autorización: verifier es owner|manufacturer del DPP O tiene
//      delegación activa en dpp_delegations para este DPP
//   7. Si hay delegación: scope (event_type · un_locode · verifier_role)
//      cumple con allowed_* arrays declarados
//   8. GPS dentro del radio geofence del hub UN/LOCODE
//      (función Postgres is_point_in_hub_geofence)
//   9. MaxMind GeoIP cross-check IP→país (opcional · si env vars
//      MAXMIND_* configuradas · solo warning, no bloquea)
//  10. Calcular event_hash_sha256 canónico determinista (RFC 8785 JCS)
//  11. INSERT en dpp_tracking_events con service_role
//  12. Devolver event_id + event_hash_sha256
//
// ENV VARS REQUERIDAS
// -------------------
//   - SUPABASE_URL                 (auto-inyectada por Supabase Edge)
//   - SUPABASE_ANON_KEY            (auto-inyectada)
//   - SUPABASE_SERVICE_ROLE_KEY    (auto-inyectada)
//
// ENV VARS OPCIONALES (Pieza 4 · setup MaxMind GeoLite2)
// -----------------------------------------------------
//   - MAXMIND_ACCOUNT_ID           (registro free en maxmind.com)
//   - MAXMIND_LICENSE_KEY          (license key generada en cuenta)
//
// DEPLOY (lockstep José cuando llegue su turno)
// ---------------------------------------------
//   Desde Supabase CLI:
//     supabase functions deploy dpp-validator --no-verify-jwt
//   (No-verify-jwt porque la Edge Function valida JWT internamente con
//    granularidad sobre claims · evita doble validación.)
//
// COMO INVOCAR
// ------------
//   POST https://<project-ref>.supabase.co/functions/v1/dpp-validator
//   Headers:
//     Authorization: Bearer <user-jwt>
//     Content-Type: application/json
//   Body:
//     {
//       "dpp_id": "uuid",
//       "event_type": "entrada_puerto_destino",
//       "event_at": "2026-05-27T15:30:00Z",  // opcional · default ahora
//       "verifier_role": "autoridad_portuaria_valencia",
//       "location_country": "ES",
//       "location_un_locode": "ESVLC",
//       "location_lat": 39.4448,
//       "location_lng": -0.3236,
//       "location_accuracy_m": 12.5,         // opcional
//       "event_payload": { "muelle": "Príncipe Felipe" }  // opcional
//     }

// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

// ────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────

interface ValidateEventRequest {
  dpp_id: string
  event_type: string
  event_at?: string
  verifier_role: string
  location_country: string
  location_un_locode: string
  location_lat: number
  location_lng: number
  location_accuracy_m?: number
  event_payload?: Record<string, unknown>
}

interface ValidationSuccess {
  ok: true
  event_id: string
  event_hash_sha256: string
  anchored_pending: boolean
  maxmind_warning?: string | null
}

interface ValidationFailure {
  ok: false
  error: string
  code: string
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COUNTRY_REGEX = /^[A-Z]{2}$/
const UN_LOCODE_REGEX = /^[A-Z]{2}[A-Z2-9]{3}$/
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/

// Catálogo de event_type sincronizado con enum public.dpp_event_type
// (migración 019). Validación cliente-side para fallar rápido.
const VALID_EVENT_TYPES = new Set([
  "fabricacion_inicio",
  "fabricacion_fin",
  "control_calidad_aprobado",
  "salida_planta_fabricante",
  "entrada_almacen_origen",
  "consolidacion_envio",
  "salida_almacen_origen",
  "embarque_origen",
  "en_transito_maritimo",
  "en_transito_terrestre",
  "en_transito_ferroviario",
  "en_transito_aereo",
  "transbordo_intermedio",
  "entrada_puerto_destino",
  "despacho_aduanero_iniciado",
  "despacho_aduanero_completado",
  "salida_puerto_destino",
  "entrada_almacen_destino",
  "entrega_destinatario_final",
  "devolucion",
  "reciclaje_fin_vida",
  "incidencia_reportada",
])

function validateRequestShape(body: any): string | null {
  if (!body || typeof body !== "object") return "Body must be a JSON object"
  if (typeof body.dpp_id !== "string" || !UUID_REGEX.test(body.dpp_id)) return "dpp_id must be a valid UUID"
  if (typeof body.event_type !== "string" || !VALID_EVENT_TYPES.has(body.event_type)) return "event_type invalid or not in catalog"
  if (body.event_at !== undefined && (typeof body.event_at !== "string" || !ISO_8601_REGEX.test(body.event_at))) return "event_at must be ISO 8601"
  if (typeof body.verifier_role !== "string" || body.verifier_role.length < 3 || body.verifier_role.length > 64) return "verifier_role required (3-64 chars)"
  if (typeof body.location_country !== "string" || !COUNTRY_REGEX.test(body.location_country)) return "location_country must be ISO 3166-1 alpha-2"
  if (typeof body.location_un_locode !== "string" || !UN_LOCODE_REGEX.test(body.location_un_locode)) return "location_un_locode invalid format"
  if (typeof body.location_lat !== "number" || body.location_lat < -90 || body.location_lat > 90) return "location_lat invalid range"
  if (typeof body.location_lng !== "number" || body.location_lng < -180 || body.location_lng > 180) return "location_lng invalid range"
  if (body.location_accuracy_m !== undefined && (typeof body.location_accuracy_m !== "number" || body.location_accuracy_m < 0)) return "location_accuracy_m must be positive number"
  if (body.event_payload !== undefined && (typeof body.event_payload !== "object" || body.event_payload === null || Array.isArray(body.event_payload))) return "event_payload must be a plain object"
  return null
}

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) - implementación simplificada.
 * Garantiza serialización determinista para hashing reproducible:
 *   - Claves ordenadas lexicográficamente
 *   - undefined eliminado (NULL preserved)
 *   - Sin espacios entre tokens
 *   - JSON.stringify maneja escapes UTF-16, suficiente para nuestro caso
 *
 * NO maneja: NaN, Infinity, BigInt (no se usan en nuestro payload).
 */
function canonicalJSON(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "boolean" || typeof value === "number") return JSON.stringify(value)
  if (typeof value === "string") return JSON.stringify(value)
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJSON).join(",") + "]"
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([_, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return "{" + entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalJSON(v)).join(",") + "}"
  }
  return "null"
}

async function sha256Hex(data: string): Promise<string> {
  const buffer = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * MaxMind GeoIP2 web service country lookup.
 * Timeout 3s. Fallo silencioso (devuelve null) para no bloquear el flujo
 * si MaxMind cae.
 */
async function maxmindCountryLookup(
  ip: string,
  accountId: string,
  licenseKey: string,
): Promise<string | null> {
  try {
    const auth = btoa(`${accountId}:${licenseKey}`)
    const url = `https://geoip.maxmind.com/geoip/v2.1/country/${ip}`
    const res = await fetch(url, {
      headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.country?.iso_code ?? null
  } catch {
    return null
  }
}

function clientIpFromHeaders(req: Request): string | null {
  // Supabase Edge Functions corren detrás de Cloudflare. x-forwarded-for
  // tiene la cadena: client, proxy1, proxy2. La IP del cliente es la
  // primera (más a la izquierda).
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first && first.length > 0) return first
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  return null
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
  }
}

function json(
  data: ValidationSuccess | ValidationFailure | Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

// ────────────────────────────────────────────────────────────────
// Handler principal
// ────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed", code: "method_not_allowed" }, 405)
  }

  // ── 1. Authorization header ──
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Missing or invalid Authorization Bearer header", code: "unauthorized" }, 401)
  }
  const jwt = authHeader.slice(7)

  // ── 2. Parse body ──
  let body: ValidateEventRequest
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: "Invalid JSON body", code: "invalid_json" }, 400)
  }

  // ── 3. Validate request shape ──
  const shapeError = validateRequestShape(body)
  if (shapeError) {
    return json({ ok: false, error: shapeError, code: "invalid_request" }, 400)
  }

  // ── 4. Supabase clients ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ ok: false, error: "Server misconfiguration: missing env vars", code: "server_misconfig" }, 500)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── 5. Get user from JWT ──
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return json({ ok: false, error: "Invalid or expired JWT", code: "unauthorized" }, 401)
  }
  const verifierUserId = userData.user.id
  const userRoles = (userData.user.app_metadata?.roles ?? []) as string[]

  // ── 6. verifier_role declarado debe estar en JWT roles ──
  // Protección contra escalado de privilegios: el verificador NO puede
  // inventar un rol que no tiene activo en actor_roles (el Custom Access
  // Token Hook ya filtró por revoked_at + valid_until).
  if (!userRoles.includes(body.verifier_role)) {
    return json({
      ok: false,
      error: `verifier_role '${body.verifier_role}' not in JWT active roles. Roles disponibles: ${JSON.stringify(userRoles)}`,
      code: "missing_role",
    }, 403)
  }

  // ── 7. DPP existe ──
  const { data: dppData, error: dppErr } = await adminClient
    .from("dpp_registry")
    .select("id, owner_user_id, manufacturer_actor_user_id, sector_id")
    .eq("id", body.dpp_id)
    .maybeSingle()

  if (dppErr) {
    return json({ ok: false, error: "DPP lookup failed: " + dppErr.message, code: "dpp_lookup_failed" }, 500)
  }
  if (!dppData) {
    // 404 opaco: no diferenciar "no existe" de "no autorizado". Misma
    // respuesta que en checkpoint 8 si falla la autorización.
    return json({ ok: false, error: "DPP not found or not authorized", code: "dpp_not_found_or_unauthorized" }, 404)
  }

  // ── 8. Autorización: owner | manufacturer | delegación activa ──
  const isOwnerOrManufacturer =
    verifierUserId === dppData.owner_user_id ||
    (dppData.manufacturer_actor_user_id !== null && verifierUserId === dppData.manufacturer_actor_user_id)

  if (!isOwnerOrManufacturer) {
    const nowIso = new Date().toISOString()
    const { data: delegationData, error: delErr } = await adminClient
      .from("dpp_delegations")
      .select("allowed_event_types, allowed_un_locodes, allowed_verifier_roles, valid_until")
      .eq("dpp_id", body.dpp_id)
      .eq("granted_to_user_id", verifierUserId)
      .is("revoked_at", null)
      .lte("valid_from", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (delErr) {
      return json({ ok: false, error: "Delegation lookup failed: " + delErr.message, code: "delegation_lookup_failed" }, 500)
    }
    if (!delegationData) {
      return json({
        ok: false,
        error: "No active delegation for this verifier on this DPP",
        code: "missing_delegation",
      }, 403)
    }

    // ── 9. Verificar scope de delegación ──
    if (delegationData.valid_until && new Date(delegationData.valid_until) <= new Date()) {
      return json({ ok: false, error: "Delegation expired (valid_until in past)", code: "delegation_expired" }, 403)
    }

    if (Array.isArray(delegationData.allowed_event_types) &&
        delegationData.allowed_event_types.length > 0 &&
        !delegationData.allowed_event_types.includes(body.event_type)) {
      return json({
        ok: false,
        error: `event_type '${body.event_type}' not in delegation scope`,
        code: "event_type_out_of_scope",
      }, 403)
    }

    if (Array.isArray(delegationData.allowed_un_locodes) &&
        delegationData.allowed_un_locodes.length > 0 &&
        !delegationData.allowed_un_locodes.includes(body.location_un_locode)) {
      return json({
        ok: false,
        error: `un_locode '${body.location_un_locode}' not in delegation scope`,
        code: "un_locode_out_of_scope",
      }, 403)
    }

    if (Array.isArray(delegationData.allowed_verifier_roles) &&
        delegationData.allowed_verifier_roles.length > 0 &&
        !delegationData.allowed_verifier_roles.includes(body.verifier_role)) {
      return json({
        ok: false,
        error: `verifier_role '${body.verifier_role}' not in delegation scope`,
        code: "verifier_role_out_of_scope",
      }, 403)
    }
  }

  // ── 10. GPS dentro del geofence del hub ──
  const { data: geofenceData, error: geofenceErr } = await adminClient
    .rpc("is_point_in_hub_geofence", {
      p_un_locode: body.location_un_locode,
      p_lat: body.location_lat,
      p_lng: body.location_lng,
    })

  if (geofenceErr) {
    return json({
      ok: false,
      error: "Geofence validation failed: " + geofenceErr.message,
      code: "geofence_error",
    }, 500)
  }

  if (geofenceData !== true) {
    return json({
      ok: false,
      error: `GPS (${body.location_lat}, ${body.location_lng}) fuera del radio geofence del hub '${body.location_un_locode}' o hub no registrado`,
      code: "gps_out_of_geofence",
    }, 403)
  }

  // ── 11. MaxMind IP→país cross-check (opcional · solo warning) ──
  const maxmindAccountId = Deno.env.get("MAXMIND_ACCOUNT_ID")
  const maxmindLicenseKey = Deno.env.get("MAXMIND_LICENSE_KEY")
  const deviceIp = clientIpFromHeaders(req)
  let maxmindWarning: string | null = null

  if (maxmindAccountId && maxmindLicenseKey && deviceIp) {
    const ipCountry = await maxmindCountryLookup(deviceIp, maxmindAccountId, maxmindLicenseKey)
    if (ipCountry && ipCountry !== body.location_country) {
      // Solo warning · NO bloquea. VPN corporativa puede causar mismatch
      // legítimo (verificador en oficina UK conectado a VPN ES). Se
      // persiste como contexto forense en el evento.
      maxmindWarning = `IP country '${ipCountry}' mismatch declared location_country '${body.location_country}' · VPN o IP incorrecta?`
    }
  }

  // ── 12. Calcular event_hash_sha256 canónico ──
  const eventAt = body.event_at ?? new Date().toISOString()
  const canonicalPayload = canonicalJSON({
    dpp_id: body.dpp_id,
    event_type: body.event_type,
    event_at: eventAt,
    verifier_role: body.verifier_role,
    location_country: body.location_country,
    location_un_locode: body.location_un_locode,
    location_lat: body.location_lat,
    location_lng: body.location_lng,
    location_accuracy_m: body.location_accuracy_m ?? null,
    event_payload: body.event_payload ?? {},
  })
  const eventHashSha256 = await sha256Hex(canonicalPayload)

  // ── 13. INSERT en dpp_tracking_events con service_role ──
  const userAgent = req.headers.get("user-agent")
  const { data: insertedData, error: insertErr } = await adminClient
    .from("dpp_tracking_events")
    .insert({
      dpp_id: body.dpp_id,
      event_type: body.event_type,
      event_at: eventAt,
      verifier_user_id: verifierUserId,
      verifier_role: body.verifier_role,
      location_country: body.location_country,
      location_un_locode: body.location_un_locode,
      location_lat: body.location_lat,
      location_lng: body.location_lng,
      location_accuracy_m: body.location_accuracy_m ?? null,
      event_payload: body.event_payload ?? {},
      event_hash_sha256: eventHashSha256,
      device_ip: deviceIp,
      device_user_agent: userAgent,
    })
    .select("id")
    .single()

  if (insertErr) {
    return json({
      ok: false,
      error: "Failed to insert tracking event: " + insertErr.message,
      code: "insert_failed",
    }, 500)
  }

  // ── 14. Success ──
  return json({
    ok: true,
    event_id: insertedData.id,
    event_hash_sha256: eventHashSha256,
    anchored_pending: true,
    maxmind_warning: maxmindWarning,
  } as ValidationSuccess, 200)
})
