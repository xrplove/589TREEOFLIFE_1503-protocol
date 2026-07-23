/**
 * Logo1503 — sello de marca de 1503 ("la Casa de Contratación digital").
 *
 * SVG vectorial, escalable y nítido a cualquier tamaño (favicon → hero).
 * Piel del home: cian #00A3FF sobre fondo oscuro, tipografía Chakra Petch / DM Mono.
 *
 * Decisiones de marca (sesión 4-jun):
 *  - HÉROE = "1503" (no el nombre largo de la institución).
 *  - Aro = "CASA DE CONTRATACIÓN"  → SIN "de Indias" (matiz colonial, mercado LatAm).
 *  - Fuera "PRO PARK MARKET" (nombre viejo).
 *  - Galeón estilizado en line-art (alma marítima) + olas + sello con nodos de circuito.
 *
 * v1 geométrico/minimalista. La ilustración ornamentada del galeón = diseñador.
 */
type Logo1503Props = {
  /** Lado del SVG en px (cuadrado). */
  size?: number
  /** Color de acento (líneas del sello). */
  accent?: string
  /** Color del wordmark "1503". */
  wordmark?: string
  /** Mostrar el texto del aro + tagline (off → solo el sello/galeón, útil en tamaños mini). */
  withText?: boolean
  className?: string
}

export default function Logo1503({
  size = 220,
  accent = '#00A3FF',
  wordmark = '#E8EDF5',
  withText = true,
  className,
}: Logo1503Props) {
  // Nodos de circuito repartidos por el aro interior.
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2
    return { x: 120 + Math.cos(a) * 110, y: 120 + Math.sin(a) * 110, big: i % 3 === 0 }
  })

  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="1503"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path id="logo1503-top-arc" d="M 46,120 A 74,74 0 0 1 194,120" />
      </defs>

      {/* Aros del sello */}
      <circle cx="120" cy="120" r="116" stroke={accent} strokeWidth="2" />
      <circle cx="120" cy="120" r="106" stroke={accent} strokeWidth="1" opacity="0.5" />

      {/* Nodos de circuito */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.big ? 1.8 : 1} fill={accent} opacity="0.5" />
      ))}

      {/* Texto del aro (superior) */}
      {withText && (
        <text
          fill={accent}
          fontFamily="var(--font-chakra-petch), system-ui, sans-serif"
          fontSize="12.5"
          fontWeight={600}
          letterSpacing="4"
        >
          <textPath href="#logo1503-top-arc" startOffset="50%" textAnchor="middle">
            CASA DE CONTRATACIÓN
          </textPath>
        </text>
      )}

      {/* Galeón estilizado (line-art) */}
      <g stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {/* Mástiles */}
        <line x1="120" y1="104" x2="120" y2="50" />
        <line x1="106" y1="104" x2="106" y2="63" />
        <line x1="134" y1="104" x2="134" y2="63" />
        {/* Banderín */}
        <path d="M 120,50 L 133,53.5 L 120,57 Z" fill={accent} fillOpacity="0.25" />
        {/* Velas centrales (cuadras, ligeramente abombadas) */}
        <path d="M 109,57 Q 120,62 131,57 L 131,72 Q 120,77 109,72 Z" fill={accent} fillOpacity="0.07" />
        <path d="M 110,77 Q 120,81 130,77 L 130,93 Q 120,98 110,93 Z" fill={accent} fillOpacity="0.07" />
        {/* Velas laterales */}
        <path d="M 96,67 Q 105,71 114,67 L 114,91 Q 105,95 96,91 Z" fill={accent} fillOpacity="0.05" />
        <path d="M 126,67 Q 135,71 144,67 L 144,91 Q 135,95 126,91 Z" fill={accent} fillOpacity="0.05" />
        {/* Casco */}
        <path d="M 95,104 L 145,104 L 138,115 Q 120,122 102,115 Z" fill={accent} fillOpacity="0.1" />
        {/* Olas */}
        <path d="M 84,121 Q 93,115 102,121 T 120,121 T 138,121 T 156,121" strokeWidth="1.6" opacity="0.85" />
        <path d="M 90,128 Q 99,123 108,128 T 126,128 T 144,128" strokeWidth="1.2" opacity="0.5" />
      </g>

      {/* HÉROE: 1503 */}
      <text
        x="120"
        y="171"
        textAnchor="middle"
        fill={wordmark}
        fontFamily="var(--font-chakra-petch), system-ui, sans-serif"
        fontSize="46"
        fontWeight={700}
        letterSpacing="3"
      >
        1503
      </text>

      {/* Tagline */}
      {withText && (
        <text
          x="120"
          y="191"
          textAnchor="middle"
          fill={accent}
          opacity="0.8"
          fontFamily="var(--font-dm-mono), monospace"
          fontSize="7.5"
          letterSpacing="3"
        >
          EL COMERCIO SE VOLVIÓ ORDEN
        </text>
      )}
    </svg>
  )
}
