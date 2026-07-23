/* ────────────────────────────── HEX ──────────────────────────────
   Hexágono SVG con punto central (modo "outline") o relleno (modo "filled").
   Pieza visual nuclear del design system v1 — el lenguaje geométrico de
   1503 es hexagonal (hex grids, hex nodes, hex graphs). Reemplaza
   los rectangulares tiles del primer diseño. */

export function Hex({
  size = 12,
  color = '#2FD2C9',
  filled = false,
}: {
  size?: number
  color?: string
  filled?: boolean
}) {
  const r = size / 2
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`)
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <polygon points={pts.join(' ')} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.3} />
      {!filled && <circle cx={r} cy={r} r={r * 0.32} fill={color} />}
    </svg>
  )
}
