/* ────────────────────────────── SECTION HEADER ──────────────────────────────
   Cabecera estándar de sección dentro del workspace: eyebrow (mono uppercase
   + diamante ◆), título display (Chakra Petch grande) y body de descripción.
   Pure visual, sin deps externas. */

export function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <span
        style={{
          color: '#B9A4FF',
          fontSize: '0.68rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontWeight: 500,
        }}
      >
        ◆ {eyebrow}
      </span>
      <h1
        style={{
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
          fontWeight: 700,
          color: '#E8EDF5',
          margin: '0.5rem 0 0.6rem',
          letterSpacing: '0.02em',
          lineHeight: 1.15,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color: '#7A8899',
          fontSize: '0.92rem',
          lineHeight: 1.65,
          maxWidth: 720,
          fontFamily: 'var(--font-chakra-petch), sans-serif',
        }}
      >
        {body}
      </p>
    </div>
  )
}
