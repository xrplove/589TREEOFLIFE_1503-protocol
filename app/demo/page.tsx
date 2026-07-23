import Link from 'next/link'
import type { Metadata } from 'next'
import BlockchainBackground from '../components/BlockchainBackground'
import { DEMO_ACTORS } from '../data/demoActors'
import DemoActorCard from './DemoActorCard'

export const metadata: Metadata = {
  title: 'Modo demo · 1503',
  robots: { index: false, follow: false },
}

const eyebrowStyle: React.CSSProperties = {
  color: '#F0B429',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

export default function DemoPage() {
  return (
    <>
      <BlockchainBackground />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          background: '#08090F',
          color: '#E8EDF5',
          padding: '5vh 2rem 6rem',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Top nav */}
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
            <span style={eyebrowStyle}>🎭 MODO DEMO</span>
            <span style={{ minWidth: 1 }} />
          </div>

          {/* Hero */}
          <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={eyebrowStyle}>NAVEGACIÓN GUIADA</span>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 700,
                color: '#E8EDF5',
                marginTop: '0.6rem',
                marginBottom: '0.6rem',
                letterSpacing: '0.02em',
              }}
            >
              Entra como cualquiera de estos actores
            </h1>
            <p
              style={{
                color: '#7A8899',
                fontSize: '1rem',
                lineHeight: 1.7,
                maxWidth: 680,
                margin: '0 auto',
              }}
            >
              Cada perfil te lleva al workspace correspondiente con datos
              ficticios precargados —idioma, sector, rol, logo, documentos y
              ficha de empresa— como si te hubieras registrado tú. Para salir
              del modo demo, usa el botón en el banner amarillo del workspace.
            </p>
          </header>

          {/* Important notice */}
          <div
            style={{
              border: '1px solid rgba(240,180,41,0.35)',
              background: 'rgba(240,180,41,0.06)',
              borderRadius: 4,
              padding: '1.1rem 1.4rem',
              marginBottom: '3rem',
              maxWidth: 880,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '0.66rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#F0B429',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              ◆ Aviso
            </div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#9FB6CC',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Todos los datos (emails <code>@example-demo.com</code>, NIFs, direcciones, documentos)
              son <strong>ficticios</strong>. Los archivos de KYC aparecen como
              «subidos» pero no contienen blob real, por lo que el botón
              «cambiar» no abre nada — es navegación visual. Al elegir un
              actor distinto, el localStorage se limpia y se reinstala con el
              perfil nuevo.
            </p>
          </div>

          {/* Grid of actors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.4rem',
            }}
          >
            {DEMO_ACTORS.map((actor) => (
              <DemoActorCard key={actor.id} actor={actor} />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '4rem',
              paddingTop: '2rem',
              borderTop: '1px solid #1E2530',
              color: '#4A5566',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.06em',
              textAlign: 'center',
            }}
          >
            7 ACTORES · 4 IDIOMAS · 5 SECTORES · 4 PAÍSES
          </div>
        </div>
      </main>
    </>
  )
}
