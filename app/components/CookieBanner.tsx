'use client'

// Cookie Banner ePrivacy + GDPR + AEPD
//
// Banner inicial sticky en bottom que se muestra solo si NO hay consent
// guardado (o si es de versión obsoleta).
//
// 3 acciones canónicas con MISMA prominencia visual (no Dark Pattern · AEPD
// vigente):
//   1. "Rechazar todo" · solo necesarias · sin analytics ni marketing
//   2. "Personalizar" · abre modal con toggles por categoría
//   3. "Aceptar todo" · necesarias + analytics + marketing
//
// PATRÓN CANÓNICO Next.js modificado
// ----------------------------------
// 'use client' obligatorio porque usa useState · useEffect · localStorage.

import { useEffect, useState } from 'react'

import {
  COOKIE_CATEGORIES,
  COOKIE_POLICY_URL,
  PRIVACY_POLICY_URL,
  acceptAll,
  customizeConsent,
  loadConsent,
  rejectAll,
  type ConsentState,
} from '@/app/lib/cookieConsent'

// i18n de la superficie SIEMPRE VISIBLE del banner (párrafo + 3 botones + enlaces).
// El modal "Personalizar" y las descripciones legales de categoría (COOKIE_CATEGORIES)
// siguen en español: son texto legal que se traducirá con revisión humana (los 8
// idiomas). Fallback internacional = inglés; solo un visitante ES ve español.
type BannerCopy = {
  intro: string
  policyCookies: string
  policyPrivacy: string
  reject: string
  customize: string
  accept: string
}
const BANNER_I18N: Record<'es' | 'en', BannerCopy> = {
  es: {
    intro:
      '1503 usa cookies estrictamente necesarias para que la plataforma funcione (sesión autenticada · idioma). Opcionalmente, puedes consentir cookies de analíticas (anonimizadas · sin perfilado individual). No usamos cookies de marketing hoy.',
    policyCookies: 'Política de cookies',
    policyPrivacy: 'Política de privacidad',
    reject: 'Rechazar todo',
    customize: 'Personalizar',
    accept: 'Aceptar todo',
  },
  en: {
    intro:
      '1503 uses strictly necessary cookies for the platform to work (authenticated session · language). Optionally, you can consent to analytics cookies (anonymized · no individual profiling). We do not use marketing cookies today.',
    policyCookies: 'Cookie policy',
    policyPrivacy: 'Privacy policy',
    reject: 'Reject all',
    customize: 'Customize',
    accept: 'Accept all',
  },
}
function detectBannerLang(): 'es' | 'en' {
  if (typeof document === 'undefined') return 'es'
  const fromCookie = document.cookie.match(/1503:lang=([a-z]{2})/)?.[1]
  const code = fromCookie ?? (navigator.language || 'es').slice(0, 2).toLowerCase()
  return code === 'es' ? 'es' : 'en'
}

export default function CookieBanner(): React.ReactElement | null {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [customState, setCustomState] = useState<Omit<ConsentState, 'necessary'>>({
    analytics: false,
    marketing: false,
  })

  // Detectar consent existente al montar (client-only).
  useEffect(() => {
    const existing = loadConsent()
    if (!existing) {
      // No hay consent o es de versión obsoleta · mostrar banner.
      // Intencional: el consent vive en localStorage (ilegible en SSR); leerlo en
      // el efecto de montaje y setear aquí evita un hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const L = BANNER_I18N[detectBannerLang()]

  const handleAcceptAll = () => {
    acceptAll()
    setVisible(false)
  }

  const handleRejectAll = () => {
    rejectAll()
    setVisible(false)
  }

  const handleCustomizeOpen = () => {
    setShowCustomize(true)
  }

  const handleCustomizeSave = () => {
    customizeConsent(customState)
    setShowCustomize(false)
    setVisible(false)
  }

  return (
    <>
      {/* Banner principal · fixed bottom. */}
      {!showCustomize && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Banner de configuración de cookies"
          className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-gray-200 bg-white p-4 shadow-2xl"
        >
          <div className="mx-auto max-w-6xl space-y-3">
            <p className="text-sm text-gray-800">
              {L.intro}{' '}
              <a
                href={COOKIE_POLICY_URL}
                className="underline hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                {L.policyCookies}
              </a>
              {' · '}
              <a
                href={PRIVACY_POLICY_URL}
                className="underline hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                {L.policyPrivacy}
              </a>
              .
            </p>
            {/* 3 botones igual prominencia (canon AEPD). */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleRejectAll}
                className="rounded border border-gray-400 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {L.reject}
              </button>
              <button
                type="button"
                onClick={handleCustomizeOpen}
                className="rounded border border-gray-400 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {L.customize}
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded border border-gray-400 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {L.accept}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Personalizar · backdrop + dialog. */}
      {showCustomize && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-customize-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <h2
              id="cookie-customize-title"
              className="mb-4 text-xl font-semibold text-gray-900"
            >
              Personalizar cookies
            </h2>

            <div className="space-y-4">
              {/* Categoría: Necesarias (siempre on · readonly). */}
              <div className="rounded border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {COOKIE_CATEGORIES.necessary.label}
                  </h3>
                  <span className="text-xs font-medium uppercase text-green-700">
                    Siempre activas
                  </span>
                </div>
                <p className="mb-2 text-sm text-gray-700">
                  {COOKIE_CATEGORIES.necessary.description}
                </p>
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer underline">
                    Ver cookies ({COOKIE_CATEGORIES.necessary.cookies.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {COOKIE_CATEGORIES.necessary.cookies.map((c) => (
                      <li key={c.name}>
                        <span className="font-mono">{c.name}</span> · {c.purpose} · {c.duration}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              {/* Categoría: Analíticas (toggle). */}
              <div className="rounded border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {COOKIE_CATEGORIES.analytics.label}
                  </h3>
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={customState.analytics}
                      onChange={(e) =>
                        setCustomState((prev) => ({
                          ...prev,
                          analytics: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Permitir</span>
                  </label>
                </div>
                <p className="text-sm text-gray-700">
                  {COOKIE_CATEGORIES.analytics.description}
                </p>
              </div>

              {/* Categoría: Marketing (toggle). */}
              <div className="rounded border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {COOKIE_CATEGORIES.marketing.label}
                  </h3>
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={customState.marketing}
                      onChange={(e) =>
                        setCustomState((prev) => ({
                          ...prev,
                          marketing: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Permitir</span>
                  </label>
                </div>
                <p className="text-sm text-gray-700">
                  {COOKIE_CATEGORIES.marketing.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="rounded border border-gray-400 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCustomizeSave}
                className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Guardar preferencias
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-600">
              Puedes cambiar tus preferencias en cualquier momento desde el footer.
              Más información en{' '}
              <a
                href={COOKIE_POLICY_URL}
                className="underline hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                la política de cookies
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </>
  )
}
