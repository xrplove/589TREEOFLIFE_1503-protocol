'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'

/**
 * Fase 3b.4 simplificada — login del Actor regular con OTP.
 *
 * Mismo flujo que /operador/login (validado para evitar el bug PKCE
 * cross-window): pide email → Supabase manda código de 6-8 dígitos →
 * verifyOtp → cookies + redirect a /escritorio.
 *
 * El middleware de /escritorio verifica además que kyc_status='approved'
 * antes de dejar pasar. Si el Actor está pending_kyc, rejected o
 * suspended, redirige automáticamente a /registro/en-revision.
 *
 * Atajo de desarrollo: si el email es 'demo@1503.global' y NODE_ENV
 * no es producción, se salta el OTP y se loguea con password (vía el
 * endpoint /api/dev/demo-login). Esto desbloquea probar todo el flujo
 * en local sin depender del envío real de OTP por Resend (que en sandbox
 * solo entrega al email base verificado).
 *
 * Lo que NO incluye esta versión simplificada de 3b.4:
 *  - Tabla auth_otp_codes propia (usa el OTP de Supabase).
 *  - Tabla trusted_devices ni panel "Mis dispositivos".
 *  - Límite de intentos / rate limiting custom.
 * Se añaden en la versión completa de 3b.4 más adelante.
 */

const DEMO_EMAIL = 'demo@1503.global'

function LoginInner() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [autoTriggered, setAutoTriggered] = useState(false)

  // Soporte de acceso directo: ?email=tu@empresa.com&auto=1 prellena el
  // campo y dispara automáticamente el envío del OTP al cargar.
  useEffect(() => {
    const urlEmail = searchParams.get('email')
    const auto = searchParams.get('auto') === '1'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde URL params
    if (urlEmail && !email) setEmail(urlEmail)
    if (urlEmail && auto && !autoTriggered) {
      setAutoTriggered(true)
      // Pequeño delay para que el input visible se rellene antes del fetch.
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        const prevEmail = urlEmail.trim().toLowerCase()
        setEmail(prevEmail)
        handleRequestCode(fakeEvent, prevEmail)
      }, 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function handleRequestCode(e: React.FormEvent, overrideEmail?: string) {
    e.preventDefault()
    const trimmed = (overrideEmail ?? email).trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setErrorMsg('Introduce un correo electrónico válido.')
      return
    }
    setStatus('busy')
    setErrorMsg(null)
    setDevOtp(null)

    // Atajo de desarrollo para el usuario demo: el endpoint hace signIn
    // server-side y devuelve las cookies en la respuesta. Sin race.
    if (trimmed === DEMO_EMAIL) {
      try {
        const res = await fetch('/api/dev/demo-login', { method: 'POST' })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'demo login no disponible (¿producción?)')
        }
        window.location.href = '/escritorio'
        return
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : String(err))
        return
      }
    }

    // Flujo OTP del Actor: el endpoint propio genera el código y, en dev,
    // lo devuelve para mostrarlo en pantalla. En producción solo lo envía
    // por email (cuando esté Resend con dominio).
    try {
      const res = await fetch('/api/auth/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo enviar el código')
      }
      setEmail(trimmed)
      setStep('verify')
      setStatus('idle')
      if (json.dev_otp) setDevOtp(json.dev_otp)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
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
      type: 'magiclink',
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    // Sanity check + pequeño delay para garantizar que las cookies han
    // sido persistidas por el navegador antes del full reload. Sin esto
    // el middleware puede ver user=null y redirigir lejos del escritorio.
    const { data: userCheck } = await supabase.auth.getUser()
    if (!userCheck.user) {
      setStatus('error')
      setErrorMsg('Sesión no confirmada tras verificar el código.')
      return
    }
    await new Promise((r) => setTimeout(r, 250))
    window.location.href = '/escritorio'
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
          <span style={eyebrowStyle}>Acceso · Actor</span>
          <span style={{ minWidth: 1 }} />
        </div>

        <div style={cardStyle}>
          <div style={iconStyle} aria-hidden>
            ◇
          </div>
          <span style={eyebrowStyle}>Sesión segura</span>
          <h1 style={titleStyle}>Accede a tu escritorio</h1>

          {step === 'request' ? (
            <>
              <p style={paraPrimary}>
                Introduce tu correo. Te enviaremos un código de un solo uso. No usamos contraseña — sin
                phishing ni reseteos.
              </p>

              <form onSubmit={handleRequestCode} style={{ marginTop: '1rem' }}>
                <label htmlFor="actor-email" style={labelStyle}>
                  Correo del Actor
                </label>
                <input
                  id="actor-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'busy'}
                  style={inputStyle}
                  placeholder="tu@empresa.com"
                />

                {errorMsg ? (
                  <div style={errorBox}>
                    <span style={{ color: '#FF6B6B', fontWeight: 600 }}>◆</span> {errorMsg}
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

              <p style={hintStyle}>
                ¿Todavía no tienes cuenta?{' '}
                <Link href="/" style={inlineLink}>
                  Selecciona tu país en el globo
                </Link>{' '}
                para registrarte.
              </p>
            </>
          ) : (
            <>
              <p style={paraPrimary}>
                Hemos enviado un código a{' '}
                <strong style={{ color: '#E8EDF5' }}>{email}</strong>. Revisa tu bandeja (1-2 minutos)
                y escríbelo abajo (6-8 dígitos).
              </p>

              {devOtp && (
                <div
                  style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1rem',
                    background: 'rgba(240,180,41,0.08)',
                    border: '1px solid rgba(240,180,41,0.4)',
                    borderRadius: 3,
                    color: '#F0B429',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    letterSpacing: '0.08em',
                  }}
                >
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7A8899', marginBottom: '0.35rem' }}>
                    MODO DESARROLLO · OTP visible en pantalla
                  </div>
                  Tu código: <strong style={{ color: '#F0B429', fontSize: '1.1rem', letterSpacing: '0.3em' }}>{devOtp}</strong>
                </div>
              )}

              <form onSubmit={handleVerifyCode} style={{ marginTop: '1rem' }}>
                <label htmlFor="actor-code" style={labelStyle}>
                  Código de acceso
                </label>
                <input
                  id="actor-code"
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
                    <span style={{ color: '#FF6B6B', fontWeight: 600 }}>◆</span> {errorMsg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === 'busy' || code.length < 6 || code.length > 8}
                  style={{
                    ...primaryButton,
                    opacity: status === 'busy' || code.length < 6 || code.length > 8 ? 0.6 : 1,
                    cursor:
                      status === 'busy' || code.length < 6 || code.length > 8
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {status === 'busy' ? 'Verificando…' : 'Entrar'}
                </button>

                <button type="button" onClick={handleChangeEmail} style={tertiaryButton}>
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

function LoginFallback() {
  // Placeholder mínimo con el mismo fondo mientras se resuelve el boundary.
  return <main style={{ minHeight: '100vh', background: '#08090F' }} aria-hidden />
}

/**
 * Next exige envolver el uso de `useSearchParams()` en un límite de Suspense
 * para el prerender estático (CSR bailout). El contenido vive en LoginInner;
 * este wrapper aporta el boundary sin cambiar el comportamiento.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Estilos (mismos que /operador/login para mantener consistencia visual)
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

const inlineLink: React.CSSProperties = {
  color: '#00BFFF',
  textDecoration: 'none',
}

const hintStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  color: '#7A8899',
  fontSize: '0.84rem',
  lineHeight: 1.6,
}
