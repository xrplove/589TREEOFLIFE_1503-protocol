import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

/**
 * Endpoint de acceso demo (solo desarrollo).
 *
 * Acepta GET (navegación directa con redirect 303 → /escritorio con
 * cookies en headers) y POST (devuelve JSON para flujos programáticos
 * antiguos).
 *
 * El patrón GET + redirect es lo que garantiza que las cookies de sesión
 * se aplican siempre en el navegador, porque el browser las trata como
 * una navegación normal de página (mismo flujo que un login tradicional
 * de form submit), no como un fetch que tiene races.
 */

const DEMO_EMAIL = 'demo@1503.global'
const DEMO_PASSWORD = 'demo-1503-2026!'

const DEMO_METADATA = {
  entity_kind: 'company',
  entity_code: 'SL',
  country_code: 'ES',
  sector_id: 'inmobiliario',
  role_id: 'agencia',
  company_name: '1503 Demo',
  first_name: 'Demo',
  last_name: 'User',
  email: DEMO_EMAIL,
  phone: '+34 600 000 000',
  tax_id: 'B00000000',
  city: 'Madrid',
}

async function performDemoLogin(req: NextRequest, mode: 'redirect' | 'json') {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'demo login disabled in production' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase env vars missing (URL / ANON / SERVICE_ROLE)' },
      { status: 500 },
    )
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: list, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: `listUsers: ${listError.message}` }, { status: 500 })
  }
  let user = list.users.find((u) => u.email === DEMO_EMAIL)

  if (!user) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: DEMO_METADATA,
    })
    if (createError || !created.user) {
      return NextResponse.json(
        { error: `createUser: ${createError?.message ?? 'unknown'}` },
        { status: 500 },
      )
    }
    user = created.user
  } else {
    // Reset password en cada llamada para garantizar idempotencia (por si
    // algún recovery o cambio externo dejó la password en otro valor).
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (updateError) {
      console.warn('[demo-login] updateUserById failed:', updateError.message)
    }
  }

  const { error: kycError } = await admin
    .from('actors')
    .update({ kyc_status: 'approved' })
    .eq('user_id', user.id)

  if (kycError) {
    console.warn('[demo-login] could not set kyc_status=approved:', kycError.message)
  }

  // Construir la respuesta (redirect o JSON). createServerClient escribirá
  // las cookies de sesión en res.cookies durante signInWithPassword.
  const res =
    mode === 'redirect'
      ? NextResponse.redirect(new URL('/escritorio/init', req.url), { status: 303 })
      : NextResponse.json({ ok: true, email: DEMO_EMAIL, user_id: user.id })

  const ssr = createServerClient(url, anonKey, {
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

  const { error: signInError } = await ssr.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (signInError) {
    return NextResponse.json(
      { error: `signInWithPassword: ${signInError.message}` },
      { status: 500 },
    )
  }

  return res
}

/**
 * GET → navegación directa del navegador. El browser sigue el redirect
 * 303 a /escritorio aplicando las cookies de la respuesta. Es el camino
 * canónico para el flujo Actor.
 */
export async function GET(req: NextRequest) {
  return performDemoLogin(req, 'redirect')
}

/**
 * POST → devuelve JSON (compatibilidad con código antiguo). Solo recomendado
 * para llamadas programáticas tipo CI o tests.
 */
export async function POST(req: NextRequest) {
  return performDemoLogin(req, 'json')
}
