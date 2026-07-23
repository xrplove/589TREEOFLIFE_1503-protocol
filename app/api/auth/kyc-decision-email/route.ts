import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { localeForCountry, type Locale } from '../../../lib/i18n-restricted'
import {
  emailTexts,
  emailLocale,
  rejectedSubject,
  suspendedSubject,
  rejectedTitle,
  suspendedTitle,
} from '../../../lib/i18n-emails'
import { verifyInternalSecret } from '../../../lib/internal-api-auth'

/**
 * Bloque 3b.5.4 — email post-decisión KYC.
 *
 * POST /api/auth/kyc-decision-email
 *   body: {
 *     email: string,                          actor email
 *     firstName?: string,
 *     companyName?: string,
 *     decision: 'approved' | 'rejected' | 'suspended',
 *     reason?: string,                        obligatorio en rejected/suspended
 *   }
 *
 * Construye el HTML según la decisión y lo manda vía Resend. Sin auth: el
 * llamante esperado es /api/operator/kyc-decision, que lo invoca server-side
 * tras escribir la transición en BD. La invocación es fire-and-forget desde
 * ahí: si Resend falla (sandbox rechaza alias, key caducada, etc.) la
 * decisión KYC ya está aplicada y se reintentará el email cuando se
 * registre dominio propio (ver memoria, tarea diferida).
 *
 * En modo sandbox de Resend, los aliases +xxx@gmail.com son rechazados con
 * 403. Solo el email base verificado en la cuenta Resend recibe el email.
 * El endpoint devuelve el error de Resend tal cual sin reintentar, dejando
 * que el caller decida.
 */

const apiKey = process.env.RESEND_API_KEY

const FROM_DEFAULT = '1503 <onboarding@resend.dev>'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ALLOWED_DECISIONS = ['approved', 'rejected', 'suspended'] as const
type Decision = (typeof ALLOWED_DECISIONS)[number]

function isDecision(value: unknown): value is Decision {
  return typeof value === 'string' && (ALLOWED_DECISIONS as readonly string[]).includes(value)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildEmail({
  decision,
  email,
  firstName,
  displayName,
  reason,
  locale,
}: {
  decision: Decision
  email: string
  firstName?: string
  displayName: string
  reason: string | null
  locale: Locale
}): { subject: string; html: string } {
  const t = emailTexts(locale)
  const el = emailLocale(locale) // idioma de email real (es | en) para los textos bilingües
  const greeting = escapeHtml(t.greeting(firstName))
  const safeDisplay = escapeHtml(displayName)
  const safeReason = reason ? escapeHtml(reason) : ''

  if (decision === 'approved') {
    const accessUrl = `${SITE_URL}/acceso?email=${encodeURIComponent(email)}`
    return {
      subject: t.subject,
      html: shell(
        `
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#00A3FF;font-weight:600;margin-bottom:12px;">${t.eyebrow}</div>
        <h1 style="font-size:24px;font-weight:700;color:#E8EDF5;margin:0 0 16px 0;line-height:1.3;letter-spacing:0.5px;">${t.title}</h1>
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${greeting}</p>
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${t.bodyApprovedIntro(safeDisplay)}</p>
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;">${t.bodyApprovedSteps}</p>
        ${ctaButton(t.ctaApproved, accessUrl)}
        <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0 0 24px 0;">${t.bodyApprovedSecondary}</p>
      `,
        locale,
      ),
    }
  }

  if (decision === 'rejected') {
    return {
      subject: rejectedSubject[el],
      html: shell(
        `
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#FF6B6B;font-weight:600;margin-bottom:12px;">${t.eyebrow}</div>
        <h1 style="font-size:24px;font-weight:700;color:#E8EDF5;margin:0 0 16px 0;line-height:1.3;letter-spacing:0.5px;">${rejectedTitle[el]}</h1>
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${greeting}</p>
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${t.bodyRejectedIntro(safeDisplay)}</p>
        ${reasonBlock(t.reasonLabel, safeReason)}
        <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;">${t.bodyRejectedOutro}</p>
      `,
        locale,
      ),
    }
  }

  // suspended
  return {
    subject: suspendedSubject[el],
    html: shell(
      `
      <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#F0B429;font-weight:600;margin-bottom:12px;">${t.eyebrow}</div>
      <h1 style="font-size:24px;font-weight:700;color:#E8EDF5;margin:0 0 16px 0;line-height:1.3;letter-spacing:0.5px;">${suspendedTitle[el]}</h1>
      <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${greeting}</p>
      <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">${t.bodySuspendedIntro(safeDisplay)}</p>
      ${reasonBlock(t.reasonLabel, safeReason)}
      <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;">${t.bodySuspendedOutro}</p>
    `,
      locale,
    ),
  }
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto;">
    <tr><td style="background:#F0B429;border-radius:2px;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;color:#08090F;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;">${label}</a>
    </td></tr>
  </table>`
}

function reasonBlock(label: string, reason: string): string {
  if (!reason) return ''
  return `<div style="margin:0 0 24px 0;padding:14px 16px;background:rgba(255,107,107,0.06);border-left:3px solid #FF6B6B;border-radius:2px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF6B6B;font-weight:600;margin-bottom:6px;">${label}</div>
    <div style="font-size:14px;line-height:1.6;color:#E8EDF5;">${reason}</div>
  </div>`
}

function shell(inner: string, locale: Locale): string {
  const t = emailTexts(locale)
  const privacyHtml = t.privacyLine
    .replace('{privacy}', `${SITE_URL}/legal/privacy`)
    .replace('{terms}', `${SITE_URL}/legal/terms`)
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#08090F;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E8EDF5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#08090F;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:rgba(14,17,24,0.95);border:1px solid #1E2530;border-radius:4px;">
        <tr><td style="padding:32px 32px 24px 32px;">
          ${inner}
          <hr style="border:none;border-top:1px solid #1E2530;margin:24px 0;">
          <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0;">
            ${privacyHtml}
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:rgba(8,9,15,0.6);border-top:1px solid #1E2530;border-radius:0 0 4px 4px;">
          <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#4A5566;margin:0;text-align:center;font-family:'Courier New',monospace;">
            ${t.footerTagline}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  // Auditoría 23-may: este endpoint era llamable sin auth, permitiendo a
  // cualquiera disparar emails arbitrarios desde el dominio 1503 vía
  // Resend (phishing-as-a-service + quema de cuota). Ahora exige header
  // `X-Internal-Token` con `INTERNAL_API_SECRET`. El caller esperado es
  // /api/operator/kyc-decision (route handler server-side de la propia app).
  const authCheck = verifyInternalSecret(req)
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: 'Unauthorized: ' + authCheck.reason },
      { status: 401 },
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured on server' },
      { status: 500 },
    )
  }

  let body: {
    email?: string
    firstName?: string
    companyName?: string
    decision?: unknown
    reason?: unknown
    country_code?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (!isDecision(body.decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }
  const decision = body.decision

  let reason: string | null = null
  if (typeof body.reason === 'string') {
    reason = body.reason.trim() || null
  }
  if ((decision === 'rejected' || decision === 'suspended') && !reason) {
    return NextResponse.json(
      { error: 'reason is required for rejected/suspended decisions' },
      { status: 400 },
    )
  }
  // Hardening 23-may: limitar longitud de `reason` para evitar abuso de
  // almacenamiento (la razón se persiste en kyc_review_log append-only).
  if (reason && reason.length > 2000) {
    return NextResponse.json(
      { error: 'reason exceeds maximum length (2000 chars)' },
      { status: 400 },
    )
  }

  // Determinar idioma del email: ES para hispanohablantes (España + LATAM),
  // EN para el resto del mundo. El country_code viene en el body (lo pasa el
  // panel operador tras revisar el KYC) o se busca en BD por email como
  // fallback. Si no se encuentra, localeForCountry(null) → 'en' (universal).
  let countryCode: string | null =
    typeof body.country_code === 'string' ? body.country_code.trim().toUpperCase() : null

  if (!countryCode) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      try {
        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        const { data: list } = await admin.auth.admin.listUsers()
        const u = list?.users.find((x) => x.email === email)
        if (u) {
          const { data: actor } = await admin
            .from('actors')
            .select('country_code')
            .eq('user_id', u.id)
            .maybeSingle()
          const ac = (actor as { country_code?: string } | null)?.country_code
          if (ac) countryCode = ac.toUpperCase()
        }
      } catch (e) {
        console.error('[kyc-decision-email] country lookup failed (fallback en):', e)
      }
    }
  }

  const locale: Locale = localeForCountry(countryCode)

  const displayName = body.companyName?.trim() || body.firstName?.trim() || 'Actor'
  const { subject, html } = buildEmail({
    decision,
    email,
    firstName: body.firstName,
    displayName,
    reason,
    locale,
  })

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || FROM_DEFAULT,
    to: [email],
    subject,
    html,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Resend send failed', name: error.name },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null, decision, to: email, locale })
}
