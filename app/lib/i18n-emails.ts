/**
 * i18n de los emails transaccionales de decisión KYC.
 *
 * Regla de idioma (fijada por José 2026-05-15): español para España +
 * países hispanohablantes (LATAM), inglés para el resto del mundo.
 *
 * Reutiliza `localeForCountry` de i18n-restricted.ts — mismo mapping,
 * misma lógica, coherencia total. Países no mapeados → inglés (universal).
 *
 * Solo cubre los 3 emails de decisión KYC (approved/rejected/suspended).
 * El email del OTP NO se traduce aquí: lo genera Supabase con su template
 * configurado en el dashboard (otra pieza, Fase i18n-3).
 */

import type { Locale } from './i18n-restricted'

type Decision = 'approved' | 'rejected' | 'suspended'

/**
 * Idiomas con copy de email propio. Por decisión de producto (José 2026-05-15) los
 * emails transaccionales KYC son BILINGÜES: español para España + LATAM hispanohablante,
 * inglés para el resto del mundo. No se traducen a los 8 idiomas para no emitir copy
 * legal-transaccional sin revisión; cualquier otro `Locale` cae a inglés (universal).
 */
export type EmailLocale = 'es' | 'en'

/** Colapsa cualquiera de los 8 `Locale` al idioma de email real (es | en). */
export function emailLocale(locale: Locale): EmailLocale {
  return locale === 'es' ? 'es' : 'en'
}

interface EmailContent {
  subject: string
  eyebrow: string
  title: string
  greeting: (name?: string) => string
  bodyApprovedIntro: (displayName: string) => string
  bodyApprovedSteps: string
  bodyApprovedSecondary: string
  ctaApproved: string
  bodyRejectedIntro: (displayName: string) => string
  reasonLabel: string
  bodyRejectedOutro: string
  bodySuspendedIntro: (displayName: string) => string
  bodySuspendedOutro: string
  privacyLine: string // con placeholders {privacy} {terms}
  footerTagline: string
}

const TEXTS: Record<EmailLocale, EmailContent> = {
  es: {
    subject: 'Tu cuenta 1503 está activa',
    eyebrow: '◆ 1503',
    title: 'Tu cuenta está activa',
    greeting: (name) => (name?.trim() ? `Hola ${name.trim()},` : 'Hola,'),
    bodyApprovedIntro: (d) =>
      `Hemos verificado la documentación de <strong style="color:#E8EDF5;">${d}</strong>. Tu cuenta como Actor está activa y lista para operar.`,
    bodyApprovedSteps:
      'Pulsa el botón para activar tu acceso. Te enviaremos un código por email, elegirás tu sector y descargarás un <strong style="color:#E8EDF5;">acceso directo a tu escritorio</strong> que podrás guardar en tu ordenador. A partir de ahí, doble clic sobre el icono cada vez que quieras entrar — sin contraseñas que recordar.',
    bodyApprovedSecondary:
      'También puedes operar en tu sector como oferente y, sin segundo registro ni segundo KYC, contratar a otros Actores verificados de cualquier parte del mundo.',
    ctaApproved: 'Activar tu acceso →',
    bodyRejectedIntro: (d) =>
      `Hemos revisado tu solicitud de alta como <strong style="color:#E8EDF5;">${d}</strong> y, por el momento, no podemos verificar la documentación tal y como ha sido aportada.`,
    reasonLabel: 'Motivo',
    bodyRejectedOutro:
      'Puedes responder a este correo o escribirnos a <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a> aportando lo que falta. Volveremos a revisarlo lo antes posible.',
    bodySuspendedIntro: (d) =>
      `Hemos suspendido temporalmente la cuenta de <strong style="color:#E8EDF5;">${d}</strong> mientras revisamos una incidencia. El acceso al escritorio queda bloqueado durante este periodo.`,
    bodySuspendedOutro:
      'Si crees que esto es un error o quieres aportar información adicional, escríbenos a <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a> y revisaremos el caso.',
    privacyLine:
      'Tus datos se tratan según nuestra <a href="{privacy}" style="color:#00A3FF;text-decoration:none;">Política de Privacidad</a> y <a href="{terms}" style="color:#00A3FF;text-decoration:none;">Términos de Servicio</a>.',
    footerTagline: 'Documentos cifrados · KYC verificado · Cumplimiento de exportación',
  },
  en: {
    subject: 'Your 1503 account is active',
    eyebrow: '◆ 1503',
    title: 'Your account is active',
    greeting: (name) => (name?.trim() ? `Hello ${name.trim()},` : 'Hello,'),
    bodyApprovedIntro: (d) =>
      `We have verified the documentation for <strong style="color:#E8EDF5;">${d}</strong>. Your Actor account is active and ready to operate.`,
    bodyApprovedSteps:
      'Click the button to activate your access. We’ll send you a code by email, you’ll choose your sector and download a <strong style="color:#E8EDF5;">desktop shortcut to your workspace</strong> that you can save on your computer. From then on, double-click the icon whenever you want to enter — no passwords to remember.',
    bodyApprovedSecondary:
      'You can also operate in your sector as a provider and, with no second registration or second KYC, contract other verified Actors anywhere in the world.',
    ctaApproved: 'Activate your access →',
    bodyRejectedIntro: (d) =>
      `We have reviewed your registration request as <strong style="color:#E8EDF5;">${d}</strong> and, for now, we cannot verify the documentation as submitted.`,
    reasonLabel: 'Reason',
    bodyRejectedOutro:
      'You can reply to this email or write to us at <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a> providing what is missing. We will review it again as soon as possible.',
    bodySuspendedIntro: (d) =>
      `We have temporarily suspended the account for <strong style="color:#E8EDF5;">${d}</strong> while we review an issue. Workspace access is blocked during this period.`,
    bodySuspendedOutro:
      'If you believe this is an error or want to provide additional information, write to us at <a href="mailto:contacto@1503.global" style="color:#00A3FF;text-decoration:none;">contacto@1503.global</a> and we will review the case.',
    privacyLine:
      'Your data is processed according to our <a href="{privacy}" style="color:#00A3FF;text-decoration:none;">Privacy Policy</a> and <a href="{terms}" style="color:#00A3FF;text-decoration:none;">Terms of Service</a>.',
    footerTagline: 'Encrypted documents · Verified KYC · Export compliance',
  },
}

export function emailTexts(locale: Locale): EmailContent {
  return TEXTS[emailLocale(locale)]
}

export const rejectedSubject: Record<EmailLocale, string> = {
  es: 'Necesitamos revisar tu alta — 1503',
  en: 'We need to review your registration — 1503',
}

export const suspendedSubject: Record<EmailLocale, string> = {
  es: 'Tu cuenta ha sido suspendida — 1503',
  en: 'Your account has been suspended — 1503',
}

export const rejectedTitle: Record<EmailLocale, string> = {
  es: 'Necesitamos revisar tu alta',
  en: 'We need to review your registration',
}

export const suspendedTitle: Record<EmailLocale, string> = {
  es: 'Tu cuenta ha sido suspendida',
  en: 'Your account has been suspended',
}
