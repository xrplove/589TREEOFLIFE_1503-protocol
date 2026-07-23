'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Bloque 3b.5.3.c — login del operador con OTP de 6 dígitos.
 *
 * Flujo en dos pasos para evitar el bug de PKCE cross-window que rompía el
 * magic link tradicional:
 *
 *   1. Email → signInWithOtp({email, shouldCreateUser:false}) — Supabase manda
 *      al operador un email con un código de 6 dígitos (variable {{ .Token }}
 *      del template "Magic Link" del Dashboard).
 *   2. Código → verifyOtp({email, token, type:'email'}) — sin PKCE, escribe
 *      sesión en cookies y deja al operador logueado.
 *
 * No se pasa `emailRedirectTo`: si por costumbre alguien clicara el link del
 * email (que sigue ahí en el template default), aterrizará en SITE_URL sin
 * procesar el code, lo que es un fail silencioso pero seguro. El camino
 * canónico es el código tecleado.
 *
 * `shouldCreateUser: false` impide que un email no-operador cree usuario.
 * El email debe estar provisto previamente con scripts/create-operator.mjs y
 * declarado en OPERATOR_EMAILS.
 */
export default function OperadorLoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setErrorMsg('Introduce un correo electrónico válido.')
      return
    }
    setStatus('busy')
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    setEmail(trimmed)
    setStep('verify')
    setStatus('idle')
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmedCode = code.trim()
    if (!/^\d{6,8}$/.test(trimmedCode)) {
      setStatus('error')
      setErrorMsg('El código son 6-8 dígitos numéricos.')
      return
    }
    setStatus('busy')
    setErrorMsg(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: trimmedCode,
      type: 'email',
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    // Full reload para que el middleware vea las cookies recién escritas.
    window.location.href = '/operador/kyc-review'
  }

  function handleChangeEmail() {
    setStep('request')
    setCode('')
    setStatus('idle')
    setErrorMsg(null)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        padding: '8vh 2rem 6rem',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '3rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Link href="/" style={topLink}>
            ← 1503
          </Link>
          <span style={eyebrowStyle}>Operador · acceso</span>
          <span style={{ minWidth: 1 }} />
        </div>

        <div style={cardStyle}>
          <div style={iconStyle} aria-hidden>
            ◇
          </div>
          <span style={eyebrowStyle}>Acceso restringido</span>
          <h1 style={titleStyle}>Panel del operador</h1>

          {step === 'request' ? (
            <>
              <p style={paraPrimary}>
                Introduce tu correo de operador. Te enviaremos un código de un
                solo uso. No se necesita contraseña.
              </p>

              <form onSubmit={handleRequestCode} style={{ marginTop: '1rem' }}>
                <label htmlFor="op-email" style={labelStyle}>
                  Correo del operador
                </label>
                <input
                  id="op-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'busy'}
                  style={inputStyle}
                  placeholder="operator@1503.global"
                />

                {errorMsg ? (
                  <div style={errorBox}>
                    <span style={{ color: '#FF6B6B', fontWeight: 600 }}>◆</span>{' '}
                    {errorMsg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === 'busy'}
                  style={{
                    ...primaryButton,
                    opacity: status === 'busy' ? 0.6 : 1,
                    cursor: status === 'busy' ? 'wait' : 'pointer',
                  }}
                >
                  {status === 'busy' ? 'Enviando…' : 'Enviarme código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p style={paraPrimary}>
                Hemos enviado un código a{' '}
                <strong style={{ color: '#E8EDF5' }}>{email}</strong>. Revisa tu
                bandeja (1-2 minutos) y escríbelo abajo (6-8 dígitos).
              </p>

              <form onSubmit={handleVerifyCode} style={{ marginTop: '1rem' }}>
                <label htmlFor="op-code" style={labelStyle}>
                  Código de acceso
                </label>
                <input
                  id="op-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6,8}"
                  maxLength={8}
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={status === 'busy'}
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    letterSpacing: '0.45em',
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-dm-mono), monospace',
                  }}
                  placeholder="00000000"
                />

                {errorMsg ? (
                  <div style={errorBox}>
                    <span style={{ color: '#FF6B6B', fontWeight: 600 }}>◆</span>{' '}
                    {errorMsg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === 'busy' || code.length < 6 || code.length > 8}
                  style={{
                    ...primaryButton,
                    opacity:
                      status === 'busy' || code.length < 6 || code.length > 8 ? 0.6 : 1,
                    cursor:
                      status === 'busy' || code.length < 6 || code.length > 8
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {status === 'busy' ? 'Verificando…' : 'Entrar'}
                </button>

                <button
                  type="button"
                  onClick={handleChangeEmail}
                  style={tertiaryButton}
                >
                  ← Usar otro correo
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" style={secondaryLink}>
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Estilos coherentes con /registro/confirmar y /registro/en-revision
// ─────────────────────────────────────────────────────────────────────

const topLink: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.78rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  textDecoration: 'none',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,17,24,0.7)',
  border: '1px solid #1E2530',
  borderRadius: 4,
  padding: '2.5rem 2.25rem',
  backdropFilter: 'blur(4px)',
}

const iconStyle: React.CSSProperties = {
  fontSize: '3rem',
  lineHeight: 1,
  marginBottom: '1.5rem',
  color: '#00A3FF',
  filter: 'drop-shadow(0 4px 24px rgba(0,163,255,0.18))',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)',
  fontWeight: 700,
  color: '#E8EDF5',
  marginTop: '0.6rem',
  marginBottom: '1.25rem',
  letterSpacing: '0.02em',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  lineHeight: 1.25,
}

const paraPrimary: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  marginBottom: '1.5rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#7A8899',
  fontSize: '0.72rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  marginBottom: '0.5rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid #1E2530',
  borderRadius: 3,
  color: '#E8EDF5',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  outline: 'none',
  marginBottom: '1.25rem',
}

const primaryButton: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  background: '#00A3FF',
  color: '#08090F',
  border: 'none',
  borderRadius: 2,
  fontWeight: 700,
  fontSize: '0.85rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  cursor: 'pointer',
}

const tertiaryButton: React.CSSProperties = {
  width: '100%',
  marginTop: '0.75rem',
  padding: '10px 16px',
  background: 'transparent',
  color: '#7A8899',
  border: 'none',
  fontSize: '0.78rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  cursor: 'pointer',
}

const errorBox: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: 'rgba(255,107,107,0.08)',
  border: '1px solid rgba(255,107,107,0.4)',
  borderRadius: 3,
  color: '#FF6B6B',
  fontSize: '0.85rem',
  marginBottom: '1.25rem',
}

const secondaryLink: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.78rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  textDecoration: 'none',
}
