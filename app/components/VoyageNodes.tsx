'use client'

import { useRouter } from 'next/navigation'
import { CONTINENTS } from '../data/continents'

/**
 * Red de selección: el hub **1503** (centro, sobre el globo) ↔ los continentes
 * como **nodos en columna a la derecha**. Conexiones visuales 1503↔continente y
 * continente↔continente, con un **destello de luz** que viaja por ellas
 * (continente → 1503 → otro continente). Cada nodo → /continent/[id].
 */

const HUB = { x: -30, y: 0 } // 1503 — centro (ligeramente a la izq. de la columna)
const COL_X = 250 // columna de continentes, a la derecha
const Y_SPAN = 560 // alto del abanico de continentes
const HEX = 26

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** Curva hub → continente (Bézier cuadrática, comba suave). */
function edgePath(x: number, y: number): string {
  const mx = (HUB.x + x) / 2
  const my = (HUB.y + y) / 2 - Math.sign(y || 1) * 28
  return `M ${HUB.x} ${HUB.y} Q ${mx} ${my} ${x} ${y}`
}

export default function VoyageNodes({
  labels,
  ariaLabel = 'Selector de continente',
}: {
  /** Nombres de continente por código `short` (NA/SA/EU/…). Si falta, usa el label español de continents.ts. */
  labels?: Record<string, string>
  ariaLabel?: string
} = {}) {
  const router = useRouter()
  const total = CONTINENTS.length
  const pos = CONTINENTS.map((c, i) => {
    const y = -Y_SPAN / 2 + (i / (total - 1)) * Y_SPAN
    return { ...c, x: COL_X, y }
  })

  return (
    <svg
      className="voyage-nodes"
      viewBox="-400 -400 800 800"
      preserveAspectRatio="xMidYMid meet"
      aria-label={ariaLabel}
    >
      <style>{NODE_CSS}</style>

      {/* Conexiones: 1503 → cada continente + continente ↔ continente (cadena) */}
      <g>
        {pos.map((p) => (
          <path key={`e-${p.id}`} d={edgePath(p.x, p.y)} className="vn-edge" />
        ))}
        {pos.slice(0, -1).map((p, i) => (
          <line
            key={`c-${p.id}`}
            x1={p.x}
            y1={p.y}
            x2={pos[i + 1].x}
            y2={pos[i + 1].y}
            className="vn-edge vn-chain"
          />
        ))}
      </g>

      {/* Destellos de luz recorriendo las conexiones (continente ↔ 1503) */}
      <g>
        {pos.map((p, i) => (
          <rect key={`f-${p.id}`} className="vn-flash" width={9} height={2.2} rx={1.1} x={-4.5} y={-1.1}>
            <animateMotion
              dur={`${1.15 + (i % 3) * 0.25}s`}
              begin={`${i * 0.32}s`}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints={i % 2 === 0 ? '0;1' : '1;0'}
              keyTimes="0;1"
              calcMode="linear"
              path={edgePath(p.x, p.y)}
            />
          </rect>
        ))}
      </g>

      {/* Hub 1503 */}
      <g>
        <circle cx={HUB.x} cy={HUB.y} r={7} className="vn-hub-core" />
        <circle cx={HUB.x} cy={HUB.y} r={13} className="vn-hub-ring" />
        <text x={HUB.x} y={HUB.y - 20} textAnchor="middle" className="vn-hub-label">
          1503
        </text>
      </g>

      {/* Continentes — columna derecha, clicables.
          DENTRO del hexágono: el código corto (NA, EU…). FUERA, a la derecha: el nombre completo. */}
      {pos.map((p) => (
        <g key={p.id} className="voyage-node vn-node" onClick={() => router.push(`/continent/${p.id}`)}>
          <polygon points={hexPoints(p.x, p.y, HEX)} className="vn-node-hex" />
          <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="vn-node-code">
            {p.short}
          </text>
          <text x={p.x + HEX + 12} y={p.y} dominantBaseline="central" className="vn-node-label">
            {labels?.[p.short] ?? p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

const NODE_CSS = `
.vn-edge { fill: none; stroke: #2C5A82; stroke-width: 1.1; opacity: 0.5; }
.vn-chain { stroke: #244A6E; stroke-dasharray: 2 6; opacity: 0.4; }
.vn-flash { fill: #EAF7FF; filter: drop-shadow(0 0 4px #8FD4FF); }
.vn-hub-core { fill: #DCEFFF; filter: drop-shadow(0 0 8px #6FC0FF); }
.vn-hub-ring { fill: none; stroke: #5AA8E6; stroke-width: 1.2; opacity: 0.7; }
.vn-hub-label {
  fill: #EAF6FF; font-family: var(--font-chakra-petch), sans-serif; font-weight: 700;
  font-size: 13px; letter-spacing: 0.16em; text-anchor: middle;
}
.vn-node-hex { fill: #0A1424; fill-opacity: 0.85; stroke: #2F9FE0; stroke-width: 1.3; }
.vn-node:hover .vn-node-hex { stroke: #8FD4FF; fill-opacity: 0.95; }
/* Código corto DENTRO del hexágono (NA, EU, OM…) */
.vn-node-code {
  fill: #EAF6FF; font-family: var(--font-chakra-petch), sans-serif; font-weight: 700;
  font-size: 12px; letter-spacing: 0.06em; pointer-events: none;
}
/* Nombre completo FUERA, a la derecha del hexágono */
.vn-node-label {
  fill: #CFE6FF; font-family: var(--font-chakra-petch), sans-serif; font-weight: 600;
  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; pointer-events: none;
}
`
