'use client'

import { useState } from 'react'
import type { Lang } from '../data/i18n'

/**
 * Selector de idioma de la home pública. Escribe la cookie `1503:lang` (que
 * getServerLang() lee con máxima precedencia) y recarga para que el Server
 * Component vuelva a pintar en el idioma elegido. Los 8 idiomas acordados.
 *
 * El idioma inicial ya lo decide el servidor (cookie > país > Accept-Language),
 * así que un visitante anglófono llega en inglés sin tocar esto; el selector es
 * para cambiarlo a mano.
 */

const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

function pick(code: Lang) {
  // 1 año, todo el sitio. getServerLang() la lee con máxima precedencia.
  document.cookie = `1503:lang=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  window.location.reload()
}

export default function LangSwitcher({ current, label }: { current: Lang; label: string }) {
  const [open, setOpen] = useState(false)
  const active = LANGS.find((l) => l.code === current) ?? LANGS[1]

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
        fontFamily: 'var(--font-dm-mono), monospace',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(8,9,15,0.72)',
          border: '1px solid rgba(0,163,255,0.28)',
          borderRadius: 999,
          color: '#9FC5E8',
          fontSize: '0.68rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        <span aria-hidden style={{ color: '#00A3FF' }}>◉</span>
        {active.code.toUpperCase()}
        <span aria-hidden style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          style={{
            listStyle: 'none',
            margin: '0.4rem 0 0',
            padding: '0.35rem',
            background: 'rgba(8,9,15,0.94)',
            border: '1px solid rgba(0,163,255,0.22)',
            borderRadius: 10,
            minWidth: 148,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => pick(l.code)}
                aria-selected={l.code === current}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '7px 10px',
                  background: l.code === current ? 'rgba(0,163,255,0.10)' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  color: l.code === current ? '#E8EDF5' : '#7A8899',
                  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{l.label}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.62rem',
                    letterSpacing: '0.1em',
                    color: l.code === current ? '#00A3FF' : '#4A5566',
                  }}
                >
                  {l.code.toUpperCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
