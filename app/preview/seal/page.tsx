import Link from 'next/link'
import Logo1503Seal from '../../components/Logo1503Seal'

/**
 * Sandbox del sello de certificación "1503 · Commerce Certified".
 * NO implantado: se itera aquí.
 */
export default function SealPreviewPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#05070d',
        color: '#E8EDF5',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3rem',
        padding: '3rem 1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Logo1503Seal size={340} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.2rem', alignItems: 'center' }}>
          <Logo1503Seal size={120} />
          <Logo1503Seal size={56} />
          <Logo1503Seal size={28} />
        </div>
      </div>

      <p
        style={{
          color: '#4A5566',
          fontSize: '0.7rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
        }}
      >
        Sello 1503 · Commerce Certified — sandbox (no implantado)
      </p>

      <Link
        href="/"
        style={{
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          color: '#7A8899',
          textDecoration: 'none',
          padding: '0.45rem 0.85rem',
          border: '1px solid rgba(122,136,153,0.3)',
          borderRadius: 3,
        }}
      >
        ← Volver a la home
      </Link>
    </main>
  )
}
