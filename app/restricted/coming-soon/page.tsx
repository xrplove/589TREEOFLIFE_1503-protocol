import { Suspense } from 'react'
import Link from 'next/link'
import WorldGlobeWireframe from '../../components/WorldGlobeWireframe'
import WaitlistForm from './WaitlistForm'
import { comingSoonTexts, countryName, localeForCountry } from '../../lib/i18n-restricted'

/**
 * /restricted/coming-soon — página para países en estado
 * `blocked_pending_license` o `waitlist`. Captamos lead vía formulario
 * y avisamos cuando el mercado se abra (licencia obtenida).
 *
 * Se sirve vía rewrite del middleware cuando el país detectado no está
 * permitido pero tampoco está sancionado. La URL original (/register/...)
 * se conserva en la barra del navegador.
 *
 * i18n: el idioma se decide por el país clicado (parámetro `c=`).
 * Mapping en app/lib/i18n-restricted.ts. Soporta los 8 idiomas (ES/EN/FR/DE/IT/PT/ZH/JA); países no mapeados caen a EN.
 */

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const params = await searchParams
  const country = (params.c ?? '').toUpperCase()
  const locale = localeForCountry(country)
  const t = comingSoonTexts[locale]

  return (
    <main style={pageStyle}>
      <WorldGlobeWireframe mode="fixed" opacity={0.22} cameraDistance={6.8} />
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={eyebrowStyle}>{t.eyebrow}</div>
          <h1 style={titleStyle}>
            {t.titlePrefix}
            <span style={{ color: '#00BFFF' }}>{countryName(country, locale)}</span>
            {t.titleSuffix}
          </h1>
          <p style={bodyStyle}>{t.body1}</p>
          <p style={bodyStyle}>{t.body2}</p>

          <Suspense fallback={null}>
            <WaitlistForm country={country || 'XX'} locale={locale} />
          </Suspense>

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
  border: '1px solid rgba(0,163,255,0.32)',
  borderRadius: 4,
  padding: '3rem 2.5rem',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 12px 64px rgba(0,163,255,0.08)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
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
