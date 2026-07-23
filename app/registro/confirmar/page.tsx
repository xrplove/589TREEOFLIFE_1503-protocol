import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirma tu correo · 1503',
  robots: { index: false, follow: false },
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

export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  const safeEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null

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
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
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
          <Link
            href="/"
            style={{
              color: '#7A8899',
              fontSize: '0.78rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              textDecoration: 'none',
            }}
          >
            ← 1503
          </Link>
          <span style={{ ...eyebrowStyle, fontSize: '0.7rem' }}>REGISTRO · CONFIRMA TU CORREO</span>
          <span style={{ minWidth: 1 }} />
        </div>

        <div style={cardStyle}>
          <div
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 24px rgba(0,163,255,0.18))',
            }}
            aria-hidden
          >
            ✉
          </div>
          <span style={eyebrowStyle}>Cuenta creada</span>
          <h1
            style={{
              fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)',
              fontWeight: 700,
              color: '#E8EDF5',
              marginTop: '0.6rem',
              marginBottom: '1.25rem',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              lineHeight: 1.25,
            }}
          >
            Te hemos enviado un correo de verificación
          </h1>

          {safeEmail ? (
            <p
              style={{
                color: '#9FB6CC',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              Revisa la bandeja de entrada de{' '}
              <strong style={{ color: '#E8EDF5' }}>{safeEmail}</strong> y haz clic en el enlace
              de confirmación para activar tu cuenta. Si no lo encuentras, comprueba la
              carpeta de spam o promociones.
            </p>
          ) : (
            <p
              style={{
                color: '#9FB6CC',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              Revisa tu bandeja de entrada y haz clic en el enlace de confirmación para
              activar tu cuenta. Si no lo encuentras, comprueba la carpeta de spam o
              promociones.
            </p>
          )}

          <p
            style={{
              color: '#7A8899',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            Hasta entonces tu cuenta está creada pero pendiente de verificación. La
            verificación es necesaria para garantizar que el correo es realmente tuyo y
            poder enviarte avisos legales y de seguridad.
          </p>

          <div
            style={{
              padding: '1rem 1.1rem',
              background: 'rgba(0,163,255,0.04)',
              border: '1px solid rgba(0,163,255,0.2)',
              borderRadius: 3,
              marginBottom: '1.75rem',
            }}
          >
            <div
              style={{
                fontSize: '0.66rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#00A3FF',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              ¿No te llega el correo?
            </div>
            <div
              style={{
                color: '#9FB6CC',
                fontSize: '0.85rem',
                lineHeight: 1.65,
              }}
            >
              Puede tardar 1-2 minutos. Si transcurridos 10 minutos sigue sin llegar, escribe
              a <span style={{ color: '#E8EDF5' }}>contacto@1503.global</span> indicando el
              correo con el que te has registrado.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                background: 'transparent',
                color: '#9FB6CC',
                border: '1px solid #1E2530',
                padding: '12px 24px',
                borderRadius: 2,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                textTransform: 'uppercase',
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
