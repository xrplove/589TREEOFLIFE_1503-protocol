import Link from 'next/link'
import WorldGlobeWireframe from '../../components/WorldGlobeWireframe'

/**
 * Preview aislado del globo wireframe — antes de implantarlo en la home.
 * Fondo oscuro, sin grafo ni resto de UI. Permite iterar el globo sin
 * impactar la home actual.
 */
export default function GlobePreviewPage() {
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
      {/* Globo a pantalla completa */}
      <WorldGlobeWireframe mode="fixed" opacity={1} />

      {/* HUD overlay */}
      <div
        style={{
          position: 'fixed',
          top: '1.4rem',
          left: '1.6rem',
          zIndex: 10,
          fontSize: '0.7rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          color: '#7A8899',
        }}
      >
        Preview · Globo wireframe
      </div>

      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '1.4rem',
          right: '1.6rem',
          zIndex: 10,
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          color: '#7A8899',
          textDecoration: 'none',
          padding: '0.45rem 0.85rem',
          border: '1px solid rgba(122,136,153,0.3)',
          borderRadius: 3,
          background: 'rgba(8,9,15,0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        ← Volver a la home
      </Link>

      <div
        style={{
          position: 'fixed',
          bottom: '1.4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          color: '#4A5566',
          textAlign: 'center',
        }}
      >
        Iteración previa al lanzamiento — no implantado en /
      </div>
    </main>
  )
}
