import Link from 'next/link'
import BlockchainBackground from '../components/BlockchainBackground'
import SectorsGraph from '../components/SectorsGraph'

export default function SectorsPage() {
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
          padding: '5vh 2rem 4rem',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Top bar */}
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
              ← Salir al globo
            </Link>
            <span
              style={{
                color: '#00A3FF',
                fontSize: '0.7rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontWeight: 500,
              }}
            >
              1503 · CAPA 4 · TUS SECTORES
            </span>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: '#7A8899',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#00C864',
                    boxShadow: '0 0 8px #00C864',
                  }}
                />
                Cuenta verificada
              </span>
              <Link href="/" style={{ color: '#7A8899', textDecoration: 'none' }}>
                Volver al inicio →
              </Link>
            </div>
          </div>

          {/* Hero */}
          <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span
              style={{
                color: '#F0B429',
                fontSize: '0.7rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontWeight: 500,
              }}
            >
              ELIGE TU SECTOR PARA EMPEZAR
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.4rem)',
                lineHeight: 1,
                margin: '0.7rem 0 0',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#E8EDF5',
              }}
            >
              Tu universo B2B
            </h1>
            <p
              style={{
                color: '#7A8899',
                fontSize: '1rem',
                lineHeight: 1.7,
                maxWidth: 580,
                margin: '1.25rem auto 0',
              }}
            >
              Cada sector es un mercado completo y conectado. Selecciona el tuyo para entrar al catálogo, los
              proveedores y el escritorio sectorial.
              <br />
              <span style={{ color: '#F0B429', fontSize: '0.86rem', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.06em' }}>
                1503 conecta los sectores entre sí.
              </span>
            </p>
          </header>

          {/* Sectors graph */}
          <SectorsGraph />

          {/* Legend */}
          <div
            style={{
              marginTop: '3rem',
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              fontSize: '0.74rem',
              color: '#4A5566',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#00C864',
                }}
              />
              Sector activo
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#F0B429',
                  boxShadow: '0 0 6px #F0B429',
                }}
              />
              Transacción inter-sectorial
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#1E2530',
                  border: '1px solid #00A3FF',
                }}
              />
              DGM · Hub central
            </span>
          </div>
        </div>
      </main>
    </>
  )
}
