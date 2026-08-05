/**
 * Correo del código de acceso (OTP) del Actor.
 *
 * POR QUÉ EXISTE (2-ago-2026): `/api/auth/login/request-otp` generaba el código y,
 * en producción, devolvía 503 con un TODO — «el envío por Resend aún no está
 * cableado». Consecuencia medida en vivo contra prod: NADIE podía entrar al core.
 * El candado de la demo se pasaba y detrás había un formulario de login que pedía
 * un código que no salía de ninguna parte. Publicar los escritorios sin esto es
 * abrir la puerta de una habitación cerrada con llave.
 *
 * Va por Resend (HTTPS) y NO por SMTP a propósito: netcup corta toda salida SMTP
 * del VPS (25/465/587 dan timeout incluso contra Gmail). Un correo por SMTP desde
 * este servidor no sale — el 443 sí.
 *
 * Módulo PURO y sin dependencias: construir el mensaje se puede probar sin red,
 * sin claves y sin mandarle un correo a nadie. El envío vive en la ruta.
 */

/** Escapa HTML. El código lo genera Supabase (dígitos), pero un template de correo
 *  que interpola sin escapar es una plantilla de phishing esperando a que alguien
 *  la reutilice con un dato de usuario. Se escapa por norma, no por sospecha. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export type OtpEmail = { subject: string; html: string; text: string }

export type OtpEmailInput = {
  /** El código de un solo uso (6-8 dígitos). */
  otp: string
  /**
   * Minutos de validez. OPCIONAL A PROPÓSITO: el core habla con Supabase Cloud y
   * la caducidad la fija su configuración, que este proceso no puede leer. Si no
   * se pasa, el correo NO afirma ninguna duración — antes que escribir «caduca en
   * 10 minutos» sin saberlo (canon: no fingir dato).
   */
  expiraEnMinutos?: number
}

/**
 * El asunto NO lleva el código. Es más cómodo llevarlo (se lee en la
 * notificación sin abrir), pero el asunto viaja en la vista previa de la
 * pantalla de bloqueo y en cualquier integración que registre asuntos. Para una
 * plataforma cuyo producto es la confianza, el código se abre, no se asoma.
 */
const SUBJECT = 'Tu código de acceso a 1503'

export function buildOtpEmail({ otp, expiraEnMinutos }: OtpEmailInput): OtpEmail {
  const safeOtp = escapeHtml(otp)
  const caducidad =
    typeof expiraEnMinutos === 'number' && Number.isFinite(expiraEnMinutos) && expiraEnMinutos > 0
      ? `El código caduca en ${expiraEnMinutos} minutos y solo sirve una vez.`
      : 'El código solo sirve una vez.'

  const text = [
    '1503 — código de acceso',
    '',
    `Tu código es: ${otp}`,
    '',
    caducidad,
    '',
    'Si no has pedido tú este código, ignora este mensaje: sin él nadie entra en tu',
    'escritorio. Nunca te lo pediremos por teléfono ni por correo.',
    '',
    'contacto@1503.global',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${SUBJECT}</title>
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
                Tu código de acceso
              </h1>
              <p style="font-size:15px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;">
                Escríbelo en la pantalla donde lo has pedido para entrar en tu escritorio.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto;">
                <tr>
                  <td style="background:rgba(0,163,255,0.08);border:1px solid #1E2530;border-radius:4px;padding:20px 36px;">
                    <div style="font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#E8EDF5;text-align:center;">
                      ${safeOtp}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;line-height:1.7;color:#9FB6CC;margin:0 0 24px 0;text-align:center;">
                ${caducidad}
              </p>
              <hr style="border:none;border-top:1px solid #1E2530;margin:24px 0;">
              <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0 0 8px 0;">
                Si no has pedido tú este código, ignora este mensaje: sin él nadie entra en tu escritorio. <strong style="color:#9FB6CC;">Nunca te lo pediremos por teléfono ni por correo.</strong>
              </p>
              <p style="font-size:13px;line-height:1.65;color:#7A8899;margin:0;">
                ¿Algo raro? Escribe a <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:rgba(8,9,15,0.6);border-top:1px solid #1E2530;border-radius:0 0 4px 4px;">
              <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#4A5566;margin:0;text-align:center;font-family:'Courier New',monospace;">
                Acceso sin contraseña · Código de un solo uso
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject: SUBJECT, html, text }
}
