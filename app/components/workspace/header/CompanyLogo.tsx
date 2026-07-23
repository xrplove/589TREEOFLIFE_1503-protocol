'use client'

import { useEffect, useState } from 'react'
import { useT } from '../i18n-context'

/* ────────────────────────────── COMPANY LOGO ──────────────────────────────
   Logo de la empresa del Actor en el header del workspace. Read-only — el
   logo se subió originalmente en /register/[code] y queda en localStorage
   bajo COMPANY_LOGO_STORAGE_KEY. Si no hay logo subido, no renderiza nada.
   Escucha 'storage' para sincronizar entre pestañas si se cambia. */

export const COMPANY_LOGO_STORAGE_KEY = '1503:companyLogo'

export function CompanyLogo() {
  const t = useT()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    function load() {
      try {
        const v = window.localStorage.getItem(COMPANY_LOGO_STORAGE_KEY)
        setLogoUrl(v || null)
      } catch {}
    }
    load()
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  if (!logoUrl) return null

  return (
    <div
      title={t.companyLogoTitle}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={t.companyLogoTitle}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}
