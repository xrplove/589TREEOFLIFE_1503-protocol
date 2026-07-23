'use client'

import { useT } from '../i18n-context'
import { Hex } from './Hex'

/* ────────────────────────────── PLACEHOLDER GRID ──────────────────────────────
   Cuadro vacío con Hex central + título configurable + hint i18n. Se usa en
   pestañas placeholder (CatalogoView hoy, futuro CatalogoView real). El
   template de texto sale del i18n (`t.placeholderText` con `{title}` interno
   + `t.placeholderHint`). */

export function PlaceholderGrid({ title }: { title: string }) {
  const t = useT()
  // Split the translated template around {title} so we can keep the <strong> wrap.
  const [before, after] = t.placeholderText.split('{title}')
  return (
    <div
      className="dk-card"
      style={{
        border: '1px dashed rgba(255,255,255,0.12)',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <Hex size={32} color="#B9A4FF" />
      <p
        style={{
          color: '#9AA7B8',
          fontSize: '0.95rem',
          marginTop: '1.25rem',
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        }}
      >
        {before}<strong style={{ color: '#EAEFF6' }}>{title}</strong>{after}
      </p>
      <p
        style={{
          color: '#6B7686',
          fontSize: '0.7rem',
          marginTop: '0.5rem',
          fontFamily: 'var(--font-geist-mono), monospace',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {t.placeholderHint}
      </p>
    </div>
  )
}
