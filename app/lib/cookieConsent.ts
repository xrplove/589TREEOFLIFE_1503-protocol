// Gestión consentimiento cookies · cumplimiento ePrivacy + GDPR + AEPD vigente.
//
// CUMPLIMIENTO NORMATIVO
// ----------------------
// - Directiva 2002/58/CE (ePrivacy) Art. 5(3) · consentimiento previo
//   informado para almacenamiento o acceso a información en terminal del
//   usuario, salvo estrictamente necesario para servicio expresamente
//   solicitado.
// - GDPR Art. 6.1.a · base legal consentimiento debe ser libre · específico ·
//   informado · inequívoco · documentado.
// - AEPD "Guía sobre el uso de las cookies" 2024 · botones igual prominencia
//   "Aceptar" vs "Rechazar" · prohibido "cookie wall" obligando aceptar para
//   acceder.
//
// PRINCIPIOS DE DISEÑO
// --------------------
// 1. **Por defecto NO consent**: nada se carga hasta que el usuario decida
// 2. **3 categorías canónicas**:
//    - necessary  (siempre on · estrictamente necesarias · NO requieren consent)
//    - analytics  (opt-in · estadísticas anonimizadas)
//    - marketing  (opt-in · publicidad personalizada)
// 3. **Botones igual prominencia**: "Aceptar todo" + "Rechazar todo" mismo
//    tamaño · color · posición (no Dark Pattern · obligatorio AEPD)
// 4. **Personalizar** opcional · modal con toggles por categoría
// 5. **Storage versionado**: incluye timestamp y versión del consent · si
//    cambian las cookies usadas, invalida consents antiguos
// 6. **Renovación periódica**: GDPR no exige · pero AEPD recomienda 12-24
//    meses · este código permite forzar renovación cambiando CONSENT_VERSION
//
// ARQUITECTURA
// ------------
// - localStorage como persistencia primaria (anónima · no requiere BD)
// - El consent NO viaja al servidor automáticamente (privacy by default)
// - Si user logged-in, se puede persistir en tabla `cookie_consents` futura
//   para auditoría centralizada (Fase 4 docs legales · DPIA)
//
// MATIZ 1503
// ----------------
// 1503 no usa analítica con cookies hoy (Plausible self-host es sin
// cookies · pixelless · IP-anonimizada). Por tanto el banner muestra solo:
// - Necesarias (sesión auth · CSRF) · OBLIGATORIAS
// - Analíticas (Plausible si activado · sin cookies pero declarado igual)
// - Marketing (NO ACTIVO hoy · placeholder para futuro)

/**
 * Versión del consent. Bumpear cuando cambien las cookies/scripts cargados.
 * Cualquier consent anterior con versión distinta se invalida automáticamente.
 */
export const CONSENT_VERSION = '1.0'

/** Categorías de consent canónicas (ePrivacy + AEPD). */
export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

/** Estado del consent por categoría. */
export interface ConsentState {
  necessary: true // siempre true · readonly · NO requiere consent
  analytics: boolean
  marketing: boolean
}

/** Registro de consent guardado en localStorage. */
export interface ConsentRecord {
  version: typeof CONSENT_VERSION
  state: ConsentState
  /** Timestamp ISO 8601 de cuando se dio el consent. */
  given_at: string
  /** Acción que generó el consent (para auditoría). */
  action: 'accept_all' | 'reject_all' | 'customize'
  /** UserAgent del momento (para auditoría). */
  user_agent?: string
}

/** Clave de localStorage donde se persiste el consent. */
const STORAGE_KEY = '1503_cookie_consent_v1'

/**
 * Carga el consent guardado en localStorage.
 * Devuelve null si: no hay consent · está corrupto · es de versión obsoleta.
 */
export function loadConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentRecord
    // Validación básica de estructura.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.state !== 'object' ||
      typeof parsed.given_at !== 'string'
    ) {
      // Versión obsoleta o corrupto · invalidar.
      return null
    }
    return parsed
  } catch (_e) {
    return null
  }
}

/** Guarda un consent en localStorage. */
export function saveConsent(
  state: Omit<ConsentState, 'necessary'>,
  action: ConsentRecord['action'],
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    state: {
      necessary: true,
      analytics: state.analytics,
      marketing: state.marketing,
    },
    given_at: new Date().toISOString(),
    action,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch (_e) {
      // Si localStorage no disponible (modo privado · cuota llena · etc.),
      // el consent es solo de sesión. No error fatal.
    }
  }
  return record
}

/** Borra el consent guardado (para "Cambiar preferencias" en footer · GDPR Art. 7.3). */
export function clearConsent(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (_e) {
    // Ignorar.
  }
}

/** Helper · ¿hay consent vigente para una categoría específica? */
export function hasConsent(category: ConsentCategory): boolean {
  const record = loadConsent()
  if (!record) return false
  return record.state[category] === true
}

/** Helpers · acciones canónicas de los botones del banner. */
export function acceptAll(): ConsentRecord {
  return saveConsent({ analytics: true, marketing: true }, 'accept_all')
}

export function rejectAll(): ConsentRecord {
  return saveConsent({ analytics: false, marketing: false }, 'reject_all')
}

export function customizeConsent(state: Omit<ConsentState, 'necessary'>): ConsentRecord {
  return saveConsent(state, 'customize')
}

/**
 * Descripciones legibles por categoría (multi-idioma futuro).
 *
 * IMPORTANTE · AEPD vigente exige:
 * - Identificación COOKIES concretas que se instalan
 * - Finalidad de cada una
 * - Duración (sesión · persistente con días)
 * - Tercero que las gestiona (si aplica)
 *
 * Esta lista debe actualizarse cada vez que se añade o quita una cookie/script.
 */
export const COOKIE_CATEGORIES = {
  necessary: {
    label: 'Estrictamente necesarias',
    description:
      'Sin estas cookies la plataforma no funciona (sesión autenticada · CSRF · idioma). No requieren consentimiento. No se pueden desactivar.',
    cookies: [
      {
        name: 'sb-access-token',
        purpose: 'Sesión autenticada Supabase',
        duration: '1 hora (renovable)',
        third_party: false,
      },
      {
        name: 'sb-refresh-token',
        purpose: 'Renovar sesión Supabase',
        duration: '30 días',
        third_party: false,
      },
      {
        name: 'NEXT_LOCALE',
        purpose: 'Idioma de interfaz (8 idiomas soportados)',
        duration: '1 año',
        third_party: false,
      },
    ],
  },
  analytics: {
    label: 'Analíticas',
    description:
      'Nos ayudan a entender cómo se usa 1503 para mejorarlo. Anonimizadas · sin perfilado individual. 1503 usa Plausible self-host (sin cookies · IP-anonimizada) por defecto.',
    cookies: [
      // Plausible self-host NO usa cookies. Si en el futuro se añade analytics
      // con cookies (e.g. Mixpanel · Amplitude), declararlas aquí.
    ],
  },
  marketing: {
    label: 'Marketing',
    description:
      'Cookies de marketing y publicidad personalizada. 1503 NO USA marketing tracking hoy. Esta categoría está reservada para futuro.',
    cookies: [],
  },
} as const

/**
 * URLs legales enlazadas desde el banner de cookies.
 *
 * Apuntan a páginas REALES existentes en `app/legal/` (rutas servidas).
 * El detalle de cookies vive en la sección 13 de la Política de Privacidad
 * (`/legal/privacy#s13`). Cuando se publique una página de cookies dedicada
 * (contenido borrador en `docs/legal/cookie-policy.md`, Fase 4 J6), apuntar
 * COOKIE_POLICY_URL a `/legal/cookie-policy`.
 *
 * Histórico: antes apuntaban a `/legal/cookie-policy` y `/legal/privacy-policy`,
 * rutas que no existen como páginas → devolvían 404 desde el banner.
 */
export const COOKIE_POLICY_URL = '/legal/privacy#s13'
export const PRIVACY_POLICY_URL = '/legal/privacy'
