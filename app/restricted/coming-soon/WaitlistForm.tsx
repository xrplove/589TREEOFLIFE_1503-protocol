'use client'

import { useState } from 'react'
import { comingSoonTexts, type Locale } from '../../lib/i18n-restricted'

/**
 * Formulario de lista de espera. Envía POST a /api/waitlist con email +
 * country_code. La validación final + persistencia se hace server-side
 * (RLS permite insert anónimo en public.waitlist).
 *
 * i18n: recibe el locale del server component padre (decidido por país).
 */
export default function WaitlistForm({
  country,
  locale = 'es',
}: {
  country: string
  locale?: Locale
}) {
  const t = comingSoonTexts[locale]
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, country_code: country, consent_marketing: consent }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || t.errorGeneric)
      }
      setStatus('ok')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  if (status === 'ok') {
    return (
      <div style={successStyle}>
        <div style={successBadgeStyle}>{t.successBadge}</div>
        <p style={{ margin: 0, color: '#9FB6CC', fontSize: '0.92rem', lineHeight: 1.7 }}>
          {t.successBody}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={formStyle}>
      <label style={labelStyle} htmlFor="waitlist-email">
        {t.formLabel}
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        autoComplete="email"
        placeholder={t.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <label style={consentRowStyle}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={checkboxStyle}
        />
        <span style={consentTextStyle}>{t.consentLabel}</span>
      </label>

      {errorMsg && (
        <div style={errorStyle}>{errorMsg}</div>
      )}

      <button
        type="submit"
        disabled={status === 'sending' || !email || !consent}
        style={{
          ...buttonStyle,
          opacity: status === 'sending' || !email || !consent ? 0.4 : 1,
          cursor: status === 'sending' || !email || !consent ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'sending' ? t.submitSending : t.submitIdle}
      </button>
    </form>
  )
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  marginTop: '1rem',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#7A8899',
  fontFamily: 'var(--font-dm-mono), monospace',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid #1E2530',
  borderRadius: 3,
  color: '#E8EDF5',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const consentRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.6rem',
  alignItems: 'flex-start',
  cursor: 'pointer',
  marginTop: '0.25rem',
}

const checkboxStyle: React.CSSProperties = {
  marginTop: '0.25rem',
  width: 16,
  height: 16,
  flexShrink: 0,
  accentColor: '#00A3FF',
}

const consentTextStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: '#7A8899',
  lineHeight: 1.55,
}

const buttonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '14px 22px',
  background: '#00A3FF',
  color: '#08090F',
  border: 'none',
  borderRadius: 2,
  fontWeight: 700,
  fontSize: '0.88rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
}

const errorStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: 'rgba(255,107,107,0.08)',
  border: '1px solid rgba(255,107,107,0.4)',
  borderRadius: 3,
  color: '#FF6B6B',
  fontSize: '0.85rem',
}

const successStyle: React.CSSProperties = {
  padding: '1.5rem',
  background: 'rgba(0,208,132,0.06)',
  border: '1px solid rgba(0,208,132,0.32)',
  borderRadius: 3,
  marginTop: '1rem',
}

const successBadgeStyle: React.CSSProperties = {
  color: '#00D084',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
}
