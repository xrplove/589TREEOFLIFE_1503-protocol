/**
 * Logo1503Seal — sello de certificación de 1503.
 *
 * Concepto (José 6-jun): la "bola del mundo" con el GALEÓN dentro + anillo
 * "1503 · COMMERCE CERTIFIED". Distintivo de confianza (como CE / Fair Trade /
 * ISO): "este comercio está 1503 Commerce Certified". Resuelve el galeón como
 * SÍMBOLO institucional (no nave volando por el espacio).
 *
 * SVG vectorial monocromo (cian sobre oscuro), nítido a cualquier tamaño
 * (favicon → hero). v1 geométrico; el refinado ornamental del galeón = diseñador.
 */
type Logo1503SealProps = {
  /** Lado del SVG en px (cuadrado). */
  size?: number
  /** Color de acento (líneas del sello + globo + galeón). */
  accent?: string
  /** Color del texto del anillo. */
  ring?: string
  className?: string
}

export default function Logo1503Seal({
  size = 240,
  accent = '#00A3FF',
  ring = '#CFE6FF',
  className,
}: Logo1503SealProps) {
  // Borde de "conexiones electrónicas": anillo de nodos + patas/pads tipo circuito.
  const RING_R = 88
  const NODE_COUNT = 46
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const a = (i / NODE_COUNT) * Math.PI * 2
    const big = i % 4 === 0
    return {
      x: 120 + Math.cos(a) * RING_R,
      y: 120 + Math.sin(a) * RING_R,
      stub: big
        ? { x: 120 + Math.cos(a) * (RING_R + 7), y: 120 + Math.sin(a) * (RING_R + 7) }
        : null,
      big,
    }
  })

  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="1503 · Commerce Certified"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Arcos para el texto del anillo */}
        <path id="seal-top" d="M 49,120 A 71,71 0 0 1 191,120" />
        <path id="seal-bot" d="M 53,120 A 67,67 0 0 0 187,120" />
        {/* Clip al disco del globo */}
        <clipPath id="seal-globe">
          <circle cx="120" cy="120" r="60" />
        </clipPath>
      </defs>

      {/* ── Borde de conexiones electrónicas (circuito) ── */}
      <circle cx="120" cy="120" r="98" stroke={accent} strokeWidth="1.2" opacity="0.6" />
      <circle cx="120" cy="120" r={RING_R} stroke={accent} strokeWidth="0.7" opacity="0.4" />
      <circle cx="120" cy="120" r="79" stroke={accent} strokeWidth="0.7" opacity="0.4" />
      <g stroke={accent} fill={accent}>
        {nodes.map((n, i) => (
          <g key={i}>
            {n.stub && (
              <>
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={n.stub.x}
                  y2={n.stub.y}
                  strokeWidth="0.8"
                  opacity="0.6"
                />
                <circle cx={n.stub.x} cy={n.stub.y} r="1.6" opacity="0.85" />
              </>
            )}
            <circle cx={n.x} cy={n.y} r={n.big ? 1.8 : 1} opacity={n.big ? 0.95 : 0.5} />
          </g>
        ))}
      </g>

      {/* ── Texto del anillo ── */}
      <text
        fill={ring}
        fontFamily="var(--font-chakra-petch), system-ui, sans-serif"
        fontSize="9.5"
        fontWeight={600}
        letterSpacing="3"
      >
        <textPath href="#seal-top" startOffset="50%" textAnchor="middle">
          1503 · COMMERCE CERTIFIED
        </textPath>
      </text>
      <text
        fill={accent}
        fontFamily="var(--font-dm-mono), monospace"
        fontSize="8.5"
        fontWeight={500}
        letterSpacing="3.5"
        opacity="0.85"
      >
        <textPath href="#seal-bot" startOffset="50%" textAnchor="middle">
          CASA DE CONTRATACIÓN
        </textPath>
      </text>

      {/* ── Globo (bola del mundo) wireframe ── */}
      <circle cx="120" cy="120" r="60" stroke={accent} strokeWidth="1.4" />
      <g clipPath="url(#seal-globe)">
        {/* Meridianos (elipses) */}
        <ellipse cx="120" cy="120" rx="20" ry="60" stroke={accent} strokeWidth="0.7" opacity="0.4" />
        <ellipse cx="120" cy="120" rx="40" ry="60" stroke={accent} strokeWidth="0.7" opacity="0.3" />
        {/* Paralelos (elipses curvas, coherentes con los meridianos = globo real) */}
        <g stroke={accent} strokeWidth="0.7" opacity="0.32" fill="none">
          <ellipse cx="120" cy="100" rx="53" ry="8" />
          <ellipse cx="120" cy="140" rx="53" ry="8" />
          <ellipse cx="120" cy="82" rx="38" ry="6" />
          <ellipse cx="120" cy="158" rx="38" ry="6" />
        </g>

        {/* ── Galeón dentro del globo (escala 0.8 sobre el centro 120,120) ── */}
        <g
          transform="translate(16.8 16.8) scale(0.86)"
          stroke={accent}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Mástiles */}
          <line x1="120" y1="104" x2="120" y2="50" />
          <line x1="106" y1="104" x2="106" y2="63" />
          <line x1="134" y1="104" x2="134" y2="63" />
          {/* Banderín */}
          <path d="M 120,50 L 133,53.5 L 120,57 Z" fill={accent} fillOpacity="0.3" />
          {/* Velas centrales */}
          <path d="M 109,57 Q 120,62 131,57 L 131,72 Q 120,77 109,72 Z" fill={accent} fillOpacity="0.1" />
          <path d="M 110,77 Q 120,81 130,77 L 130,93 Q 120,98 110,93 Z" fill={accent} fillOpacity="0.1" />
          {/* Velas laterales */}
          <path d="M 96,67 Q 105,71 114,67 L 114,91 Q 105,95 96,91 Z" fill={accent} fillOpacity="0.07" />
          <path d="M 126,67 Q 135,71 144,67 L 144,91 Q 135,95 126,91 Z" fill={accent} fillOpacity="0.07" />
          {/* Casco */}
          <path d="M 95,104 L 145,104 L 138,115 Q 120,122 102,115 Z" fill={accent} fillOpacity="0.14" />
        </g>

        {/* Olas en el ecuador (la mar sobre la que navega el galeón) */}
        <g stroke={accent} fill="none">
          <path d="M 64,121 Q 78,116 92,121 T 120,121 T 148,121 T 176,121" strokeWidth="1.5" opacity="0.9" />
          <path d="M 74,127 Q 88,123 102,127 T 130,127 T 158,127" strokeWidth="1" opacity="0.5" />
        </g>
      </g>
    </svg>
  )
}
