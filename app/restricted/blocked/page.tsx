import Link from 'next/link'
import WorldGlobeWireframe from '../../components/WorldGlobeWireframe'
import { blockedTexts, localeForCountry } from '../../lib/i18n-restricted'

/**
 * /restricted/blocked — bloqueo por conexión anonimizada (Tor).
 *
 * Lo sirve vía rewrite el middleware (VPN-1 lite) cuando la IP de origen
 * es un nodo de salida de Tor. NO es un bloqueo por país: es por no poder
 * verificar la jurisdicción de forma fiable en una plataforma regulada.
 *
 * i18n: idioma por el país detectado (parámetro `c=`). 8 idiomas (ES/EN/FR/DE/IT/PT/ZH/JA).
 */

export default async function BlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const params = await searchParams
  const country = (params.c ?? '').toUpperCase()
  const locale = localeForCountry(country)
  const t = blockedTexts[locale]

  return (
    <main style={pageStyle}>
      <WorldGlobeWireframe mode="fixed" opacity={0.18} cameraDistance={6.8} />
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={eyebrowStyle}>{t.eyebrow}</div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={bodyStyle}>{t.body1}</p>
          <p style={bodyStyle}>{t.body2}</p>

          <div style={mailWrapStyle}>
            <a href={`mailto:${t.mailHint}`} style={mailLinkStyle}>
              {t.mailHint}
            </a>
          </div>

          <div style={legalStyle}>{t.legal}</div>

          <Link href="/" style={backLinkStyle}>
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#08090F',
  color: '#E8EDF5',
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  position: 'relative',
  overflow: 'hidden',
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
}

const cardStyle: React.CSSProperties = {
  maxWidth: 560,
  width: '100%',
  background: 'rgba(14,17,24,0.82)',
  border: '1px solid rgba(255,107,107,0.32)',
  borderRadius: 4,
  padding: '3rem 2.5rem',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 12px 64px rgba(255,107,107,0.08)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#FF6B6B',
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  marginBottom: '1rem',
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
  fontWeight: 700,
  lineHeight: 1.25,
  margin: '0 0 1.5rem',
  letterSpacing: '0.02em',
}

const bodyStyle: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.75,
  margin: '0 0 1.25rem',
}

const mailWrapStyle: React.CSSProperties = {
  margin: '2rem 0 1.5rem',
  padding: '1rem',
  background: 'rgba(0,163,255,0.05)',
  border: '1px solid rgba(0,163,255,0.22)',
  borderRadius: 3,
  textAlign: 'center',
}

const mailLinkStyle: React.CSSProperties = {
  color: '#00BFFF',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontSize: '0.95rem',
  letterSpacing: '0.1em',
  textDecoration: 'none',
  fontWeight: 600,
}

const legalStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#4A5566',
  lineHeight: 1.7,
  fontStyle: 'italic',
  marginTop: '1.5rem',
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '1.5rem',
  color: '#7A8899',
  fontSize: '0.8rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  fontFamily: 'var(--font-dm-mono), monospace',
}
