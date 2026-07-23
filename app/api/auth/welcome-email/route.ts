import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyInternalSecret } from '../../../lib/internal-api-auth'

// Server-only Resend client. RESEND_API_KEY must be defined in .env.local.
// The key is NEVER exposed to the browser — this endpoint runs in Node.
const apiKey = process.env.RESEND_API_KEY

const FROM_DEFAULT = '1503 <onboarding@resend.dev>'
const SUBJECT = 'Bienvenido a 1503'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildHtml({ firstName, displayName }: { firstName?: string; displayName: string }) {
  // Hardening 23-may: escapar inputs en el cuerpo del email. Sin escape,
  // un attacker podía inyectar HTML en displayName/firstName para phishing
  // visual (cambiar el botón "acceder" por uno suyo, etc.).
  const safeFirstName = firstName?.trim() ? escapeHtml(firstName.trim()) : ''
  const safeDisplayName = escapeHtml(displayName)
  const greeting = safeFirstName ? `Hola ${safeFirstName},` : 'Hola,'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bienvenido a 1503</title>
</head>
<body style="margin:0;padding:0;background:#08090F;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E8EDF5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#08090F;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:rgba(14,17,24,0.95);border:1px solid #1E2530;border-radius:4px;">
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#00A3FF;font-weight:600;margin-bottom:12px;">
                ◆ 1503
              </div>
              <h1 style="font-size:24px;font-weight:700;color:#E8EDF5;margin:0 0 16px 0;line-height:1.3;letter-spacing:0.5px;">
                Tu cuenta está activa
              </h1>
              <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">
                ${greeting}
              </p>
              <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 16px 0;">
                Te damos la bienvenida a <strong style="color:#E8EDF5;">1503</strong>, la plataforma de interconexión profesional cross-border. Tu cuenta como <strong style="color:#E8EDF5;">${safeDisplayName}</strong> está activa y lista para empezar.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;">
                Desde tu escritorio puedes operar en tu sector como oferente y, sin segundo registro ni segundo KYC, contratar a otros Actores verificados de cualquier parte del mundo.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto;">
                <tr>
                  <td style="background:#F0B429;border-radius:2px;">
                    <a href="http://localhost:3000/" style="display:inline-block;padding:14px 32px;color:#08090F;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
                      Acceder a tu escritorio
                    </a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #1E2530;margin:24px 0;">
              <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0 0 8px 0;">
                Si no has sido tú quien ha creado esta cuenta, escribe a <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a> y la cancelamos sin coste.
              </p>
              <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0;">
                Tus datos se tratan según nuestra <a href="http://localhost:3000/legal/privacy" style="color:#00A3FF;text-decoration:none;">Política de Privacidad</a> y <a href="http://localhost:3000/legal/terms" style="color:#00A3FF;text-decoration:none;">Términos de Servicio</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:rgba(8,9,15,0.6);border-top:1px solid #1E2530;border-radius:0 0 4px 4px;">
              <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#4A5566;margin:0;text-align:center;font-family:'Courier New',monospace;">
                Tus documentos viajan cifrados · KYC verificado · Cumplimiento de exportación
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: Request) {
  // Hardening 23-may: este endpoint hoy NO está activo (el flujo de bienvenida
  // se hace por Supabase email confirmation). Pero queda preservado para
  // reactivación futura — exige auth interna para que cuando se reactive no
  // sea vector de phishing (mismo riesgo que kyc-decision-email).
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

  let body: { email?: string; firstName?: string; companyName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const displayName = body.companyName?.trim() || body.firstName?.trim() || 'Actor'

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || FROM_DEFAULT,
    to: [email],
    subject: SUBJECT,
    html: buildHtml({ firstName: body.firstName, displayName }),
  })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Resend send failed', name: error.name },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null })
}
