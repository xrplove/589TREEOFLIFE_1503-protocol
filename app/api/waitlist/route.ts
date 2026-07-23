import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clientIpFromHeaders, clientUserAgent } from '../../lib/request-ip'

/**
 * POST /api/waitlist
 *
 * Recibe email + country_code de la lista de espera. Solo lo escribe en
 * public.waitlist (RLS permite insert anónimo). Devuelve ok = true incluso
 * si el email ya estaba registrado para ese país (idempotencia + privacidad
 * — no filtramos si alguien ya está apuntado).
 *
 * Body JSON: { email: string, country_code: string, consent_marketing: boolean }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()
  const countryCode = String(body?.country_code ?? '').trim().toUpperCase()
  const consentMarketing = Boolean(body?.consent_marketing)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: 'País inválido' }, { status: 400 })
  }
  if (!consentMarketing) {
    return NextResponse.json(
      { error: 'Necesitamos tu consentimiento para avisarte' },
      { status: 400 },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Capturar metadatos del request (privacidad: no se devuelven al cliente).
  // IP con modelo de confianza explícito (x-forwarded-for crudo NO se fía en
  // prod · evita spoofing del audit trail). UA truncado.
  const ip = clientIpFromHeaders(req.headers)
  const userAgent = clientUserAgent(req)

  const { error } = await admin.from('waitlist').insert({
    email,
    country_code: countryCode,
    consent_marketing: consentMarketing,
    ip_address: ip,
    user_agent: userAgent,
  })

  // Si ya estaba (unique constraint violation), tratamos como éxito —
  // privacidad: no filtramos si el email existía.
  if (error && error.code !== '23505') {
    console.error('[waitlist] insert failed:', error.message)
    return NextResponse.json({ error: 'No se pudo registrar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
