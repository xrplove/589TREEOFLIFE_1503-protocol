import { Suspense } from 'react'
import WorldGlobeWireframe from '../components/WorldGlobeWireframe'
import RequestOtpTrigger from './RequestOtpTrigger'

/**
 * /acceso — única puerta de entrada al escritorio del Actor.
 *
 * Esta página NO es linkeable desde la web. Solo se llega vía el ACCESO
 * DIRECTO descargable que el Actor guarda en su escritorio. El acceso
 * directo lleva el email del Actor en la URL (?email=...).
 *
 * Flujo único, sin atajos:
 *   1. Página se abre con email pre-rellenado en query string.
 *   2. RequestOtpTrigger dispara el envío del OTP al cargar.
 *   3. Página muestra <form> HTML estándar para el código.
 *   4. Submit del form → /api/auth/login/verify-otp → verifyOtp +
 *      redirect 303 a /escritorio con cookies en headers.
 *
 * En desarrollo, el código se muestra en pantalla (badge dorado) porque
 * Resend sandbox no entrega a emails arbitrarios. En producción, el
 * código solo llega por email.
 */

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>
}) {
  const params = await searchParams
  const email = (params.email ?? '').trim().toLowerCase()
  const errorMsg = params.error ?? null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return (
      <Shell>
        <Card>
          <Eyebrow>1503 · Acceso seguro</Eyebrow>
          <h1 style={titleStyle}>Falta tu correo</h1>
          <p style={paraStyle}>
            Esta página solo se abre desde tu <strong>acceso directo de escritorio</strong>. Si no lo
            tienes, descárgalo desde el email de aprobación o desde tu escritorio actual.
          </p>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <Card>
        <Eyebrow>1503 · Acceso seguro</Eyebrow>
        <h1 style={titleStyle}>Introduce tu código</h1>
        <p style={paraStyle}>
          Hemos enviado un código de un solo uso a{' '}
          <strong style={{ color: '#E8EDF5' }}>{email}</strong>. Revísalo y escríbelo abajo.
        </p>

        <Suspense fallback={null}>
          <RequestOtpTrigger email={email} />
        </Suspense>

        <form action="/api/auth/login/verify-otp" method="POST">
          <input type="hidden" name="email" value={email} />
          <input
            id="otp-code"
            name="token"
            type="text"
            inputMode="numeric"
            pattern="\d{6,8}"
            maxLength={8}
            autoComplete="one-time-code"
            autoFocus
            placeholder="00000000"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid #1E2530',
              borderRadius: 3,
              color: '#E8EDF5',
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5em',
              fontFamily: 'var(--font-dm-mono), monospace',
              outline: 'none',
              marginBottom: '1.25rem',
            }}
          />

          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.4)',
                borderRadius: 3,
                color: '#FF6B6B',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 22px',
              background: '#00A3FF',
              color: '#08090F',
              border: 'none',
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <WorldGlobeWireframe mode="fixed" opacity={0.32} cameraDistance={6.8} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {children}
      </div>
    </main>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 460,
        width: '100%',
        background: 'rgba(14,17,24,0.82)',
        border: '1px solid rgba(0,163,255,0.25)',
        borderRadius: 4,
        padding: '2.5rem 2.25rem',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 64px rgba(0,163,255,0.08)',
      }}
    >
      {children}
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.66rem',
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-dm-mono), monospace',
        color: '#00A3FF',
        marginBottom: '0.6rem',
      }}
    >
      {children}
    </div>
  )
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.6rem, 3vw, 2rem)',
  fontWeight: 700,
  margin: '0 0 1.25rem',
  letterSpacing: '0.02em',
  lineHeight: 1.2,
}

const paraStyle: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  marginBottom: '1.5rem',
}
