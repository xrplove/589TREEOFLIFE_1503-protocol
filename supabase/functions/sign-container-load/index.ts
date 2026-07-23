// Edge Function: sign-container-load
// Path: supabase/functions/sign-container-load/index.ts
// Runtime: Deno (Supabase Edge Functions)
// Purpose: Fase 1.7 · Multi-firma 3-de-3 carga contenedor
//
// FLUJO
// -----
// 1. Verifica JWT del caller
// 2. Valida body (Zod): dpp_id + signature_purpose (buyer|seller|oracle) +
//    signature Ed25519 + signer_public_key
// 3. Verifica que el caller está autorizado para firmar como ese purpose:
//    - buyer: caller es owner_user_id del pedido (futuro: tabla orders)
//      · Por ahora valida que caller = dpp_registry.owner_user_id
//    - seller: caller es manufacturer_actor_user_id del DPP
//    - oracle: caller tiene rol transitario activo (futuro: validación role)
//      · Por ahora valida que caller está en custody_chain como
//        freight_forwarder o carrier
// 4. Verifica firma Ed25519 sobre payload canónico (RFC 8785 JCS)
// 5. Inserta en dpp_signatures (trigger auto-avanza lifecycle si 3-de-3)
// 6. Devuelve verify_container_load_signatures(dpp_id) actualizado
//
// VERIFICACIÓN FIRMA Ed25519
// --------------------------
// Payload canónico = JSON.stringify(JCS) de:
//   {
//     "action": "container_load_confirmation",
//     "role": "buyer" | "seller" | "oracle",
//     "dpp_id": "uuid",
//     "timestamp": "ISO8601",
//     "signer_user_id": "uuid"
//   }
//
// Ed25519 verify usando @noble/ed25519 (npm specifier):
//   await ed.verify(signature, payloadBytes, publicKeyBytes)
//
// SMART CONTRACT XDC TRIGGER
// --------------------------
// Cuando trigger SQL (mig 031 §3) detecta 3-de-3 firmas:
//   - dpp_registry.lifecycle_state pasa a 'loaded'
//   - dpp_state_transitions registra el cambio
//   - Smart contract XDC (Capa 5 ADR 0007) suscribe al evento
//     "lifecycle_state changed" y libera fondos según Incoterm

// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import * as ed from "https://esm.sh/@noble/ed25519@2.1.0"

interface SignRequest {
  dpp_id: string
  signature_purpose: 'buyer' | 'seller' | 'oracle'
  signature: string         // hex 128 chars
  signer_public_key: string // hex 64 chars
  timestamp: string         // ISO 8601 · debe estar dentro de ±5 min de server time
}

interface VerificationResult {
  dpp_id: string
  buyer_signed: boolean
  seller_signed: boolean
  oracle_signed: boolean
  all_three_signed: boolean
  buyer_signed_at: string | null
  seller_signed_at: string | null
  oracle_signed_at: string | null
  buyer_signer_user_id: string | null
  seller_signer_user_id: string | null
  oracle_signer_user_id: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

function validateRequest(body: unknown): { ok: boolean; data?: SignRequest; error?: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Body debe ser objeto JSON' }
  }
  const obj = body as Record<string, unknown>

  // dpp_id
  if (typeof obj.dpp_id !== 'string' || !obj.dpp_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return { ok: false, error: 'dpp_id debe ser UUID v4' }
  }

  // signature_purpose
  if (obj.signature_purpose !== 'buyer' && obj.signature_purpose !== 'seller' && obj.signature_purpose !== 'oracle') {
    return { ok: false, error: 'signature_purpose debe ser buyer | seller | oracle' }
  }

  // signature (hex 128)
  if (typeof obj.signature !== 'string' || !obj.signature.match(/^[a-f0-9]{128}$/)) {
    return { ok: false, error: 'signature debe ser hex 128 chars Ed25519' }
  }

  // signer_public_key (hex 64)
  if (typeof obj.signer_public_key !== 'string' || !obj.signer_public_key.match(/^[a-f0-9]{64}$/)) {
    return { ok: false, error: 'signer_public_key debe ser hex 64 chars Ed25519' }
  }

  // timestamp
  if (typeof obj.timestamp !== 'string') {
    return { ok: false, error: 'timestamp obligatorio (ISO 8601)' }
  }
  const ts = new Date(obj.timestamp)
  if (isNaN(ts.getTime())) {
    return { ok: false, error: 'timestamp inválido' }
  }
  const skewMs = Math.abs(ts.getTime() - Date.now())
  if (skewMs > 5 * 60 * 1000) {
    return { ok: false, error: 'timestamp fuera de ventana ±5 min' }
  }

  return { ok: true, data: obj as unknown as SignRequest }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS · RFC 8785 JCS canonical hash
// ════════════════════════════════════════════════════════════════════════════

/**
 * Serialización canónica simplificada (JSON canonical).
 * Para producción: usar lib RFC 8785 JCS estricta (sort keys + escape).
 * Por ahora · JSON.stringify con sort manual de keys.
 */
function canonicalize(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort()
  const sortedObj: Record<string, any> = {}
  for (const k of sortedKeys) {
    sortedObj[k] = obj[k]
  }
  return JSON.stringify(sortedObj)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed · use POST', 405)
  }

  // 1. Authorization
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Missing Authorization Bearer JWT', 401)
  }
  const jwt = authHeader.substring(7)

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch (_e) {
    return jsonError('Body must be valid JSON', 400)
  }

  // 3. Validate
  const validation = validateRequest(body)
  if (!validation.ok || !validation.data) {
    return jsonError(validation.error ?? 'Invalid request', 400)
  }
  const { dpp_id, signature_purpose, signature, signer_public_key, timestamp } = validation.data

  // 4. Setup Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonError('Server misconfigured · SUPABASE env vars missing', 500)
  }

  // Cliente con JWT del caller (para autenticación)
  const sbAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: userData, error: authError } = await sbAuth.auth.getUser(jwt)
  if (authError || !userData?.user) {
    return jsonError('Invalid JWT', 401)
  }
  const callerUserId = userData.user.id

  // Cliente service_role para INSERT en dpp_signatures (bypass RLS)
  const sbService = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 5. Verificar autorización (caller puede firmar como ese purpose)
  // Por ahora · validación básica:
  // - buyer: caller = dpp_registry.owner_user_id
  // - seller: caller = dpp_registry.manufacturer_actor_user_id
  // - oracle: caller está en dpp_custody_chain como freight_forwarder o carrier
  const { data: dppData, error: dppError } = await sbService
    .from('dpp_registry')
    .select('owner_user_id, manufacturer_actor_user_id, lifecycle_state')
    .eq('id', dpp_id)
    .single()

  if (dppError || !dppData) {
    return jsonError('DPP no encontrado', 404)
  }

  let authorized = false
  if (signature_purpose === 'buyer' && dppData.owner_user_id === callerUserId) {
    authorized = true
  } else if (signature_purpose === 'seller' && dppData.manufacturer_actor_user_id === callerUserId) {
    authorized = true
  } else if (signature_purpose === 'oracle') {
    // Verificar que caller está en custody_chain como freight_forwarder o carrier
    const { data: custodyData } = await sbService
      .from('dpp_custody_chain')
      .select('id')
      .eq('dpp_id', dpp_id)
      .eq('actor_user_id', callerUserId)
      .in('custody_role', ['freight_forwarder', 'carrier'])
      .limit(1)
      .maybeSingle()
    authorized = !!custodyData
  }

  if (!authorized) {
    return jsonError(
      `Caller ${callerUserId} no autorizado para firmar como ${signature_purpose}`,
      403,
    )
  }

  // 6. Verificar firma Ed25519
  const payload = {
    action: 'container_load_confirmation',
    role: signature_purpose,
    dpp_id,
    timestamp,
    signer_user_id: callerUserId,
  }
  const canonical = canonicalize(payload)
  const payloadBytes = new TextEncoder().encode(canonical)
  const signatureBytes = hexToBytes(signature)
  const publicKeyBytes = hexToBytes(signer_public_key)

  let signatureValid = false
  try {
    signatureValid = await ed.verifyAsync(signatureBytes, payloadBytes, publicKeyBytes)
  } catch (e) {
    return jsonError(`Firma Ed25519 inválida: ${e instanceof Error ? e.message : 'unknown'}`, 400)
  }

  if (!signatureValid) {
    return jsonError('Firma Ed25519 no verifica contra payload canónico', 400)
  }

  // 7. Insertar en dpp_signatures (mapeando purpose corto a canónico)
  const fullPurpose = `container_load_confirmation_${signature_purpose}`
  const { error: insertError } = await sbService.from('dpp_signatures').insert({
    dpp_id,
    signer_user_id: callerUserId,
    signer_public_key,
    signature,
    signed_at: timestamp,
    signature_purpose: fullPurpose,
  })

  if (insertError) {
    return jsonError(`Insert firma falló: ${insertError.message}`, 500)
  }

  // 8. Obtener verificación actualizada (trigger ya avanzó lifecycle si 3-de-3)
  const { data: verifyData, error: verifyError } = await sbService.rpc(
    'verify_container_load_signatures',
    { p_dpp_id: dpp_id },
  )

  if (verifyError || !verifyData || verifyData.length === 0) {
    return jsonError(`Error obteniendo verificación: ${verifyError?.message ?? 'unknown'}`, 500)
  }

  const result: VerificationResult = verifyData[0] as VerificationResult

  return new Response(
    JSON.stringify({
      ok: true,
      signature_inserted: {
        signer_user_id: callerUserId,
        signature_purpose: fullPurpose,
        signed_at: timestamp,
      },
      verification: result,
      lifecycle_advanced: result.all_three_signed && dppData.lifecycle_state === 'created',
    }),
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
})

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
