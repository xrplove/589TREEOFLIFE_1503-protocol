import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, clientUserAgent } from '../../../../lib/request-ip'
import {
  isRateLimited,
  recordAttempt,
  type AuthOutcome,
} from '../../../../lib/auth-rate-limit'
import { buildOtpEmail } from '../../../../lib/email/otpEmail'

// Mismo remitente por defecto que welcome-email y kyc-decision-email: el sandbox
// de Resend. `RESEND_FROM` lo sustituye por el dominio propio cuando 1503.global
// esté verificado en Resend — hasta entonces el sandbox SOLO entrega al email
// verificado de la cuenta, así que un evaluador externo NO recibiría nada.
const FROM_DEFAULT = '1503 <onboarding@resend.dev>'

/**
 * Solicitar OTP de login del Actor.
 *
 *  - Rate limit (Bloque C): máx 5 solicitudes / email y 10 / IP en 15 min.
 *    Evita spam de buzón y quema de cuota de email. Cada intento (y su
 *    resultado) se audita en public.auth_attempt_log (append-only).
 *  - Verifica que el Actor existe en auth.users + kyc_status='approved'
 *    (si no está aprobado, redirige a /registro/en-revision al entrar).
 *  - Llama a admin.auth.admin.generateLink({type: 'magiclink', email})
 *    para obtener un OTP de 6 dígitos sin disparar el envío de email
 *    automático de Supabase.
 *  - En DESARROLLO devuelve el OTP en la respuesta para que el Actor lo
 *    pueda meter directamente (útil mientras Resend está en sandbox y solo
 *    entrega al email base verificado).
 *  - En PRODUCCIÓN lo ENVÍA por Resend (2-ago-2026) y nunca lo devuelve en la
 *    respuesta. Si el envío falla, responde 502 — el Actor tiene que saber que
 *    el código no ha salido, no quedarse esperando el buzón.
 *
 * El OTP generado se consume con supabase.auth.verifyOtp({email, token,
 * type: 'magiclink'}) en el cliente.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const ip = getClientIp(req)
  const userAgent = clientUserAgent(req)

  // Registra el intento + su resultado y devuelve la respuesta.
  async function respond(
    outcome: AuthOutcome,
    payload: Record<string, unknown>,
    status: number,
    headers?: Record<string, string>,
  ) {
    await recordAttempt({ email, ip, action: 'request_otp', outcome, userAgent })
    return NextResponse.json(payload, { status, headers })
  }

  // 0. Rate limit ANTES de cualquier trabajo (listUsers es la superficie
  //    de enumeración y la llamada cara).
  const rl = await isRateLimited({ email, ip, action: 'request_otp' })
  if (rl.limited) {
    return respond(
      'rate_limited',
      { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
      429,
      { 'Retry-After': String(rl.retryAfterSec) },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return respond(
      'error',
      { error: 'Configuración Supabase ausente en el servidor' },
      500,
    )
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Verificar que el usuario existe y está aprobado.
  const { data: list, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return respond('error', { error: listError.message }, 500)
  }
  const user = list.users.find((u) => u.email === email)
  if (!user) {
    // Mensaje genérico para no filtrar qué emails están registrados.
    return respond(
      'not_found',
      { error: 'No encontramos una cuenta con ese correo' },
      404,
    )
  }

  const { data: actor } = await admin
    .from('actors')
    .select('kyc_status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!actor) {
    // Salvaguarda: si el email está en OPERATOR_EMAILS, es un operador
    // (staff) que ha llegado a /acceso por error. No tiene perfil de
    // Actor a propósito. Lo dirigimos al panel de operador en vez de
    // mostrar el error genérico "Tu cuenta no tiene perfil de Actor".
    const operatorEmails = (process.env.OPERATOR_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (operatorEmails.includes(email)) {
      return respond(
        'operator',
        {
          error: 'Detectamos que tu cuenta es de operador. Usa el panel de operadores.',
          isOperator: true,
          operatorLoginUrl: '/operador/login',
        },
        409,
      )
    }

    return respond('error', { error: 'Tu cuenta no tiene perfil de Actor' }, 409)
  }

  if (actor.kyc_status !== 'approved') {
    // El middleware del escritorio cubre este caso al entrar, pero adelantamos
    // el bloqueo aquí para no enviar OTP a cuentas no aprobadas.
    return respond(
      'not_approved',
      {
        error: `Tu cuenta está en estado ${actor.kyc_status}. Pendiente de revisión.`,
        kyc_status: actor.kyc_status,
      },
      403,
    )
  }

  // 2. Generar OTP server-side.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !linkData) {
    return respond(
      'error',
      { error: linkError?.message ?? 'No se pudo generar OTP' },
      500,
    )
  }
  const otp = (linkData.properties as { email_otp?: string } | undefined)?.email_otp

  if (!otp) {
    return respond(
      'error',
      { error: 'OTP no disponible en la respuesta de Supabase' },
      500,
    )
  }

  // Defensa-en-profundidad: el gating es positivo (solo local dev),
  // no negativo (cualquier cosa que no sea production). Así si por error
  // un deploy en Vercel tiene NODE_ENV sin 'production', VERCEL_ENV sigue
  // definido y NO se loguea el OTP ni se devuelve dev_otp al cliente.
  const isLocalDev =
    process.env.NODE_ENV === 'development' && !process.env.VERCEL_ENV

  if (isLocalDev) {
    // En desarrollo, devolvemos el OTP al cliente para que pueda mostrarlo
    // en pantalla. Imprime también al stdout del dev server.
    console.log(`[login] OTP para ${email} → ${otp}`)
    return respond('sent', { ok: true, dev_otp: otp }, 200)
  }

  // ── Envío real del código (2-ago-2026) ────────────────────────────────────
  // Hasta hoy aquí había un `return 503` con un TODO. Era honesto (mejor un 503
  // que un 'sent' fingido), pero significaba que EN PRODUCCIÓN NADIE PODÍA
  // ENTRAR AL CORE: se pasaba el candado de la demo y detrás había un formulario
  // que pedía un código que no salía de ninguna parte.
  //
  // Va por Resend (HTTPS) y NO por SMTP: netcup corta toda salida SMTP del VPS
  // (25/465/587 dan timeout incluso contra Gmail). El 443 sí sale.
  if (!process.env.RESEND_API_KEY) {
    // Sin clave no hay envío. Se dice, no se finge: un 'sent' aquí dejaría al
    // Actor mirando el buzón para siempre.
    return respond(
      'error',
      { ok: false, error: 'Envío de código no disponible en este entorno.' },
      503,
    )
  }

  const { subject, html, text } = buildOtpEmail({ otp })
  const { Resend } = await import('resend')
  const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM || FROM_DEFAULT,
    to: [email],
    subject,
    html,
    text,
  })

  if (sendError) {
    // El fallo del proveedor NO se traga: si Resend rechaza el destinatario
    // (sandbox: solo entrega al email verificado de la cuenta) o la cuota está
    // agotada, el Actor tiene que enterarse de que el código no ha salido, no
    // quedarse esperando. El motivo va al log de auditoría, no a la respuesta:
    // el mensaje del proveedor puede revelar si la dirección existe.
    console.error('[login] fallo al enviar el OTP por Resend:', sendError.name, sendError.message)
    return respond(
      'error',
      { ok: false, error: 'No hemos podido enviarte el código. Inténtalo de nuevo en unos minutos.' },
      502,
    )
  }

  // Enviado de verdad. El OTP NO viaja en la respuesta (solo en el correo).
  return respond('sent', { ok: true }, 200)
}
