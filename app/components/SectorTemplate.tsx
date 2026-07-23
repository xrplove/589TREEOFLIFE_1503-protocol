'use client'

import Link from 'next/link'
import {
  HowItWorks,
  Trazabilidad,
  Comparativa,
  Web3Features,
  HomeFooter,
} from './HomeSections'
import type { Sector } from '../data/sectors'

const SECTION_PADDING = '5rem 8vw'

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  fontSize: 'clamp(2rem, 4.2vw, 3.2rem)',
  fontWeight: 700,
  color: '#E8EDF5',
  marginTop: '0.9rem',
  letterSpacing: '0.01em',
  lineHeight: 1.15,
}

function HexBullet({ color = '#00A3FF', size = 12 }: { color?: string; size?: number }) {
  const r = size / 2
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`)
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <polygon points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.3} />
      <circle cx={r} cy={r} r={r * 0.32} fill={color} />
    </svg>
  )
}

/* ───────────────────────── HERO ───────────────────────── */
function SectorHero({ sector }: { sector: Sector }) {
  const titleParts = (sector.heroTitle || sector.label).split('\n')
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '7vh 8vw 4rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <span style={eyebrowStyle}>
          1503 · {sector.short} · {sector.label.toUpperCase()}
        </span>
        <h1
          style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: '#E8EDF5',
            margin: '1.2rem 0 0',
            fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
          }}
        >
          {titleParts.map((line, i) => (
            <span key={i}>
              {i === titleParts.length - 1 && titleParts.length > 1 ? (
                <span style={{ color: '#00A3FF' }}>{line}</span>
              ) : (
                line
              )}
              {i < titleParts.length - 1 && <br />}
            </span>
          ))}
        </h1>
        {sector.heroBody && (
          <p
            style={{
              color: '#7A8899',
              fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)',
              lineHeight: 1.7,
              maxWidth: 640,
              margin: '1.5rem auto 0',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            {sector.heroBody}
          </p>
        )}

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginTop: '2.5rem',
          }}
        >
          <Link
            href="/"
            style={{
              background: '#F0B429',
              color: '#08090F',
              padding: '14px 32px',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
              boxShadow: '0 6px 22px rgba(240,180,41,0.32)',
            }}
          >
            Registrarse en {sector.label} →
          </Link>
          <Link
            href="/"
            style={{
              background: 'transparent',
              color: '#E8EDF5',
              padding: '14px 32px',
              border: '1px solid #1E2530',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
            }}
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Stats row */}
        {sector.stats && sector.stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(1.5rem, 5vw, 4rem)',
              flexWrap: 'wrap',
              paddingTop: '3rem',
              marginTop: '3rem',
              borderTop: '1px solid #1E2530',
            }}
          >
            {sector.stats.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-chakra-petch), sans-serif',
                    fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
                    fontWeight: 700,
                    color: '#E8EDF5',
                    letterSpacing: '0.02em',
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#4A5566',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    marginTop: 4,
                    fontFamily: 'var(--font-dm-mono), monospace',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── 3 ZONAS ───────────────────────── */
function SectorZonas({ sector }: { sector: Sector }) {
  if (!sector.zonas || sector.zonas.length === 0) return null
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: SECTION_PADDING, background: '#0B0D14' }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={eyebrowStyle}>LA PLATAFORMA · {sector.short}</span>
        <h2 style={h2Style}>Tres zonas, un ecosistema</h2>
        <p
          style={{
            color: '#7A8899',
            fontSize: '0.95rem',
            lineHeight: 1.65,
            maxWidth: 580,
            margin: '1.25rem auto 0',
          }}
        >
          Todos los actores del sector se necesitan entre sí. Cada perfil puede comprar, vender y colaborar
          dentro del mismo ecosistema {sector.label.toLowerCase()}.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {sector.zonas.map((z) => (
          <div
            key={z.titulo}
            style={{
              background: 'rgba(14,17,24,0.6)',
              border: '1px solid #1E2530',
              borderRadius: 4,
              padding: '2rem 1.75rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <HexBullet color="#00A3FF" size={18} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#E8EDF5',
                marginBottom: '0.75rem',
                letterSpacing: '0.02em',
              }}
            >
              {z.titulo}
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#7A8899',
                lineHeight: 1.7,
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {z.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {z.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    color: '#9FB6CC',
                    background: 'rgba(0,163,255,0.06)',
                    border: '1px solid rgba(0,163,255,0.2)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── ECONOMÍA CIRCULAR ───────────────────────── */
function SectorCirculo({ sector }: { sector: Sector }) {
  if (!sector.circularFlows || sector.circularFlows.length === 0) return null
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.7)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={eyebrowStyle}>EL ECOSISTEMA</span>
        <h2 style={h2Style}>Economía circular en {sector.label.toLowerCase()}</h2>
        <p
          style={{
            color: '#7A8899',
            fontSize: '0.95rem',
            lineHeight: 1.65,
            maxWidth: 580,
            margin: '1.25rem auto 0',
          }}
        >
          Cada actor encuentra a quien necesita y a quien lo necesita, dentro y fuera de su país.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {sector.circularFlows.map((flow) => (
          <div
            key={flow.de + flow.a}
            style={{
              background: 'rgba(14,17,24,0.6)',
              border: '1px solid #1E2530',
              borderRadius: 4,
              padding: '1.5rem 1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.7rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-chakra-petch), sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {flow.de}
              </span>
              <span style={{ color: '#F0B429', fontSize: '1rem', fontWeight: 700 }}>→</span>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#00A3FF',
                  fontFamily: 'var(--font-chakra-petch), sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {flow.a}
              </span>
            </div>
            <p
              style={{
                fontSize: '0.84rem',
                color: '#7A8899',
                lineHeight: 1.65,
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {flow.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── CATÁLOGO ───────────────────────── */
function SectorCatalogo({ sector }: { sector: Sector }) {
  if (!sector.catalogCategories || sector.catalogCategories.length === 0) return null
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: SECTION_PADDING, background: '#0B0D14' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span style={eyebrowStyle}>CATÁLOGO</span>
        <h2 style={h2Style}>Todo lo que necesita tu negocio</h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1px',
          background: '#1E2530',
          border: '1px solid #1E2530',
          maxWidth: 1100,
          margin: '0 auto',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {sector.catalogCategories.map((c) => (
          <div
            key={c.name}
            style={{
              background: '#0E1118',
              padding: '1.6rem 1.4rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.3rem',
                letterSpacing: '0.02em',
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#4A5566',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.08em',
              }}
            >
              {c.count}
            </div>
            <div style={{ marginTop: '0.7rem', fontSize: '0.95rem', color: '#00A3FF' }}>↗</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── TOP NAV ───────────────────────── */
function SectorTopNav({ sector }: { sector: Sector }) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 8vw 1rem',
        flexWrap: 'wrap',
        gap: '1rem',
        maxWidth: 1300,
        margin: '0 auto',
      }}
    >
      <Link
        href="/sectors"
        style={{
          color: '#7A8899',
          fontSize: '0.78rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          textDecoration: 'none',
        }}
      >
        ← Tus sectores
      </Link>
      <span style={{ ...eyebrowStyle, fontSize: '0.7rem' }}>
        1503 · CAPA 5 · VERTICAL DE SECTOR
      </span>
      <Link
        href="/"
        style={{
          color: '#E8EDF5',
          fontSize: '0.78rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          textDecoration: 'none',
          border: '1px solid #1E2530',
          padding: '7px 16px',
          borderRadius: 2,
          fontWeight: 500,
        }}
      >
        Volver al inicio →
      </Link>
    </div>
  )
}

/* ───────────────────────── EXPORT ───────────────────────── */
export default function SectorTemplate({ sector }: { sector: Sector }) {
  return (
    <>
      <SectorTopNav sector={sector} />
      <SectorHero sector={sector} />
      <SectorZonas sector={sector} />
      <SectorCatalogo sector={sector} />
      <SectorCirculo sector={sector} />

      {/* Platform-level sections (same for every sector) */}
      <HowItWorks />
      <Trazabilidad />
      <Comparativa />
      <Web3Features />

      {/* Sector-specific CTA */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '7rem 8vw 5rem',
          background: '#0B0D14',
          textAlign: 'center',
          borderTop: '1px solid #1E2530',
        }}
      >
        <span style={eyebrowStyle}>ÚNETE AL SECTOR</span>
        <h2
          style={{
            ...h2Style,
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            marginTop: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          Bienvenido al sector {sector.label.toLowerCase()}
          <br />
          <span style={{ color: '#F0B429' }}>en vivo</span>.
        </h2>
        <p
          style={{
            color: '#7A8899',
            fontSize: '1rem',
            lineHeight: 1.7,
            maxWidth: 580,
            margin: '0 auto 2.5rem',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
          }}
        >
          Registro gratuito · Sin permanencia · 0,5 % por transacción.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              background: '#00A3FF',
              color: '#08090F',
              padding: '14px 32px',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.92rem',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
              boxShadow: '0 6px 24px rgba(0,163,255,0.32)',
            }}
          >
            Registrarse gratis →
          </Link>
          <Link
            href="/sectors"
            style={{
              background: 'transparent',
              color: '#E8EDF5',
              padding: '14px 32px',
              border: '1px solid #1E2530',
              borderRadius: 2,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.92rem',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
            }}
          >
            Ver otros sectores
          </Link>
        </div>
      </section>

      <HomeFooter />
    </>
  )
}
