import { cookies, headers } from 'next/headers'
import { langForCountry, type Lang } from '../data/i18n'

/**
 * Helper para Server Components: deduce el `Lang` del Actor.
 *
 * Orden de preferencia:
 *   1. Cookie `1503:lang` (set explícito del usuario, máxima precedencia)
 *   2. Cookie `1503:homeCountry` (deducción por país de alta)
 *   3. Header `Accept-Language` del navegador (último recurso)
 *   4. Default 'es' (idioma fundacional del proyecto)
 *
 * El cliente (`WorkspaceShell`) ya escribe `homeCountry` en localStorage; si
 * espejamos ese valor en cookie cuando cambia, los Server Components también
 * lo ven. Mientras tanto, el fallback por Accept-Language cubre razonablemente.
 */

const SUPPORTED: readonly Lang[] = ['es', 'en', 'fr', 'de', 'it', 'pt', 'zh', 'ja'] as const

function isLang(value: string): value is Lang {
  return (SUPPORTED as readonly string[]).includes(value)
}

function parseAcceptLanguage(header: string | null): Lang | null {
  if (!header) return null
  // Accept-Language: "es-ES,es;q=0.9,en;q=0.8". Tomamos las primeras 2 letras
  // de cada entrada y devolvemos la primera que coincida con SUPPORTED.
  for (const entry of header.split(',')) {
    const code = entry.trim().slice(0, 2).toLowerCase()
    if (isLang(code)) return code
  }
  return null
}

export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies()

  // 1. Cookie explícita de idioma
  const explicit = cookieStore.get('1503:lang')?.value
  if (explicit && isLang(explicit)) return explicit

  // 2. Cookie de país de alta
  const homeCountry = cookieStore.get('1503:homeCountry')?.value
  if (homeCountry) {
    try {
      return langForCountry(homeCountry.toUpperCase())
    } catch {
      // Cae al siguiente fallback
    }
  }

  // 3. Accept-Language
  const headersList = await headers()
  const fromHeader = parseAcceptLanguage(headersList.get('accept-language'))
  if (fromHeader) return fromHeader

  // 4. Default
  return 'es'
}
