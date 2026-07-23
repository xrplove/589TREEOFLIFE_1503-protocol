'use client'

import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = '1503:companyLogo'

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,17,24,0.7)',
  border: '1px solid #1E2530',
  borderRadius: 4,
  padding: '2rem 1.75rem',
  backdropFilter: 'blur(4px)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

export default function LogoUpload({
  eyebrow = 'Identidad visual',
  title = 'Logo de tu empresa',
  body = 'Sube el logo (PNG o JPG) que verán otros actores en tu escritorio y en cada operación. Opcional, lo puedes cambiar luego.',
  ctaUpload = 'Subir logo',
  ctaReplace = 'Cambiar logo',
  ctaRemove = 'Quitar',
}: {
  eyebrow?: string
  title?: string
  body?: string
  ctaUpload?: string
  ctaReplace?: string
  ctaRemove?: string
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
      if (saved) setLogoUrl(saved)
    } catch {}
  }, [])

  function handlePick(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      alert('El logo debe pesar menos de 4 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      setLogoUrl(url)
      try { window.localStorage.setItem(STORAGE_KEY, url) } catch {}
    }
    reader.readAsDataURL(file)
  }

  function handleRemove() {
    setLogoUrl(null)
    try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return (
    <div style={{ ...cardStyle, marginBottom: '3rem' }}>
      <span style={{ ...eyebrowStyle, fontSize: '0.68rem' }}>{eyebrow}</span>
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 600,
          color: '#E8EDF5',
          marginTop: '0.6rem',
          marginBottom: '1rem',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: '0.85rem',
          color: '#7A8899',
          lineHeight: 1.65,
          marginBottom: '1.5rem',
          maxWidth: 620,
        }}
      >
        {body}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={logoUrl ? ctaReplace : ctaUpload}
          style={{
            width: 96,
            height: 96,
            borderRadius: 4,
            background: logoUrl ? '#0E1118' : 'rgba(0,163,255,0.06)',
            border: logoUrl ? '1px solid #1E2530' : '1px dashed rgba(0,163,255,0.45)',
            cursor: 'pointer',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00A3FF',
            flexShrink: 0,
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
              <circle cx={12} cy={13} r={3.5} />
            </svg>
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              background: '#F0B429',
              color: '#08090F',
              padding: '10px 22px',
              borderRadius: 2,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 6px 22px rgba(240,180,41,0.32)',
            }}
          >
            {logoUrl ? ctaReplace : ctaUpload}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: 'transparent',
                color: '#7A8899',
                padding: '6px 12px',
                border: '1px solid #1E2530',
                borderRadius: 2,
                fontWeight: 500,
                fontSize: '0.74rem',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-dm-mono), monospace',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {ctaRemove}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handlePick(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
