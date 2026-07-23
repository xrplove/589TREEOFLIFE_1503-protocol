import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getClientIp, clientUserAgent } from '../../../../lib/request-ip'
import { isRateLimited, recordAttempt } from '../../../../lib/auth-rate-limit'

/**
 * Verifica el OTP y crea la sesión server-side.
 *
 * Se invoca vía <form method="POST" action="/api/auth/login/verify-otp">
 * desde la página /acceso. Al ser un form submit, el navegador trata la
 * respuesta como navegación normal — si devolvemos 303 redirect con
 * cookies en headers, el navegador aplica las cookies sin races.
 *
 * Acepta tanto application/x-www-form-urlencoded (form submit) como
 * application/json (llamadas programáticas).
 *
 * Rate limit (Bloque C): máx 5 fallos / email y 20 intentos / IP en 15 min,
 * comprobado ANTES de canjear el código. Sobre el espacio 10^6 de la OTP y
 * su validez ~1 h, esto deja la fuerza bruta en ~0,002 % de acierto. Cada
 * intento y su resultado se audita en public.auth_attempt_log (append-only).
 */
export async function POST(req: NextRequest) {
  // Parsear body según content-type
  const contentType = req.headers.get('content-type') ?? ''
  let email = ''
  let token = ''

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    email = String(body?.email ?? '')
    token = String(body?.token ?? '')
  } else {
    const formData = await req.formData()
    email = String(formData.get('email') ?? '')
    token = String(formData.get('token') ?? '')
  }

  email = email.trim().toLowerCase()
  token = token.trim()

  const isFormSubmit = !contentType.includes('application/json')
  const ip = getClientIp(req)
  const userAgent = clientUserAgent(req)

  function fail(message: string, code = 400) {
    if (isFormSubmit) {
      const u = new URL('/acceso', req.url)
      if (email) u.searchParams.set('email', email)
      u.searchParams.set('error', message)
      return NextResponse.redirect(u, { status: 303 })
    }
    return NextResponse.json({ error: message }, { status: code })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('Email inválido')
  }
  if (!token || !/^\d{6,8}$/.test(token)) {
    return fail('Código inválido (6-8 dígitos)')
  }

  // Rate limit ANTES de canjear el código (la defensa contra fuerza bruta).
  const rl = await isRateLimited({ email, ip, action: 'verify_otp' })
  if (rl.limited) {
    await recordAttempt({
      email,
      ip,
      action: 'verify_otp',
      outcome: 'rate_limited',
      userAgent,
    })
    return fail(
      'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
      429,
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return fail('Supabase env vars missing', 500)
  }

  const res = isFormSubmit
    ? NextResponse.redirect(new URL('/escritorio/init', req.url), { status: 303 })
    : NextResponse.json({ ok: true })

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

  const { error } = await ssr.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  })

  if (error) {
    await recordAttempt({
      email,
      ip,
      action: 'verify_otp',
      outcome: 'invalid_code',
      userAgent,
    })
    return fail(error.message, 401)
  }

  await recordAttempt({
    email,
    ip,
    action: 'verify_otp',
    outcome: 'success',
    userAgent,
  })
  return res
}
