/* ────────────────────────────── SECTION LABEL ──────────────────────────────
   Pequeña etiqueta uppercase para agrupar items en la sidebar / overlays.
   Tipografía mono + tracking ancho, color gris medio. Pure visual. */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.6rem',
        color: '#4A5160',
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-geist-mono), monospace',
        padding: '10px 12px 4px',
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  )
}
