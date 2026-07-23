import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, clientUserAgent } from '../../../lib/request-ip'

// Two Supabase clients with different trust levels:
//
//  - anon client + the caller's access token → used ONLY to validate the
//    JWT against Supabase auth and learn *who* the caller really is. The
//    user_id is derived from this validated token, NEVER from the request
//    body (H-1: previously the body's user_id was trusted, so anyone could
//    forge an immutable consent_log row for any existing user).
//
//  - service role client → required for the INSERT: consent_log has no
//    INSERT RLS policy by design (migration 003), so only service_role can
//    write. This keeps the log tamper-evident: clients can never write
//    their own audit rows directly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: Request) {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase not fully configured on server' },
      { status: 500 },
    )
  }

  // ── Authenticate the caller ──
  // The browser sends its post-signUp session access token. We validate it
  // server-side against Supabase auth; the user_id comes from the token, so
  // a caller can only ever write a consent row for *their own* account.
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
  }

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: authErr } = await anon.auth.getUser(token)
  if (authErr || !userData.user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
  const userId = userData.user.id

  let body: { consents?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.consents || typeof body.consents !== 'object') {
    return NextResponse.json({ error: 'Missing consents snapshot' }, { status: 400 })
  }

  const ipAddress = getClientIp(req)
  const userAgent = clientUserAgent(req)

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Rate limit por usuario sobre la tabla append-only. Un alta legítima
  // escribe 1 fila; una re-aceptación puntual, alguna más. Sin tope, un
  // autenticado puede iterar y llenar permanentemente consent_log (no se
  // puede purgar: DoS de almacenamiento/coste sobre un log inmutable).
  // Ventana 15 min, máx 10 — generoso para uso real, letal para un bucle.
  const RL_WINDOW_MS = 15 * 60 * 1000
  const RL_MAX = 10
  const since = new Date(Date.now() - RL_WINDOW_MS).toISOString()
  const { count: recent } = await service
    .from('consent_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)

  if ((recent ?? 0) >= RL_MAX) {
    return NextResponse.json(
      { error: 'Demasiadas escrituras de consentimiento. Espera unos minutos.' },
      { status: 429 },
    )
  }

  const { error: insErr } = await service.from('consent_log').insert({
    user_id: userId,
    consents: body.consents,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 502 })
  }

  // Reflejar los consentimientos de visibilidad (mig. 015/016) en las
  // columnas operativas de `actors`. Solo si el cliente envió los flags
  // explícitamente — si no, no tocamos para no romper retrocompatibilidad
  // con clientes antiguos (que mantienen el default `true` de las cols).
  //
  // Esta es la lógica de "opt-in pragmático": un Actor nuevo que NO marcó
  // el check verde queda con la columna a false → no aparece en directorio
  // ni se muestra su trayectoria. El que SÍ marcó queda visible.
  const acceptedRaw = (body.consents as { accepted?: Record<string, unknown> })?.accepted
  if (acceptedRaw && typeof acceptedRaw === 'object') {
    const update: { visible_in_directory?: boolean; trajectory_visible?: boolean } = {}
    if (typeof acceptedRaw.directoryVisibility === 'boolean') {
      update.visible_in_directory = acceptedRaw.directoryVisibility
    }
    if (typeof acceptedRaw.trajectoryVisibility === 'boolean') {
      update.trajectory_visible = acceptedRaw.trajectoryVisibility
    }
    if (Object.keys(update).length > 0) {
      // Errores no son fatales: el consent_log ya quedó (auditoría). Si
      // este UPDATE falla, el Actor mantendrá los defaults (visible) y
      // podrá ajustar después desde /escritorio/perfil.
      await service.from('actors').update(update).eq('user_id', userId)
    }
  }

  return NextResponse.json({ ok: true })
}
