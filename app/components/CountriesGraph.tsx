'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Country } from '../data/continents'

const HEX_RADIUS = 46
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS // ≈ 79.7
const ROW_STEP = 1.5 * HEX_RADIUS // 69

function pointyHexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

function computeGridCols(count: number): number {
  return Math.max(3, Math.ceil(Math.sqrt(count * 1.5)))
}

/** flagcdn provides public flag PNGs by ISO Alpha-2 (lowercase). */
function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`
}

export default function CountriesGraph({
  continentLabel,
  countries,
}: {
  continentLabel: string
  countries: Country[]
}) {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const cols = computeGridCols(countries.length)
  const rows = Math.ceil(countries.length / cols)

  const positioned = countries.map((c, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const isOddRow = row % 2 === 1
    const x = col * HEX_WIDTH + (isOddRow ? HEX_WIDTH / 2 : 0)
    const y = row * ROW_STEP
    return { ...c, x, y }
  })

  const gridWidth = cols * HEX_WIDTH + HEX_WIDTH / 2
  const gridHeight = (rows - 1) * ROW_STEP + 2 * HEX_RADIUS
  const padding = HEX_RADIUS * 0.6
  const vb = {
    x: -padding,
    y: -HEX_RADIUS - padding,
    w: gridWidth + padding * 2,
    h: gridHeight + padding * 2,
  }

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      <p
        style={{
          color: '#7A8899',
          fontSize: '0.78rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          textAlign: 'center',
          marginBottom: '1.25rem',
        }}
      >
        {countries.length} países · selecciona el tuyo para registrarte
      </p>

      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          maxHeight: '78vh',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* One clipPath per country, hex-shaped, positioned at the country's coords. */}
          {positioned.map((p) => (
            <clipPath key={`clip-${p.code}`} id={`hex-${p.code}`} clipPathUnits="userSpaceOnUse">
              <polygon points={pointyHexPoints(p.x, p.y, HEX_RADIUS)} />
            </clipPath>
          ))}
          {/* Subtle dark overlay gradient for legibility of the ISO code chip */}
          <linearGradient id="hexFlagOverlay" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="65%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>
        </defs>

        {positioned.map((p) => {
          const isActive = hovered === p.code
          // Bounding box of the hex (pointy-top): width = √3·r, height = 2·r
          const bx = p.x - HEX_WIDTH / 2
          const by = p.y - HEX_RADIUS
          return (
            <g
              key={p.code}
              onMouseEnter={() => setHovered(p.code)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/register/${p.code.toLowerCase()}`)}
              style={{ cursor: 'pointer' }}
            >
              {/* Flag image clipped to hex */}
              <image
                href={flagUrl(p.code)}
                x={bx}
                y={by}
                width={HEX_WIDTH}
                height={2 * HEX_RADIUS}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#hex-${p.code})`}
                style={{
                  filter: isActive ? 'saturate(1.15) brightness(1.06)' : 'saturate(0.85) brightness(0.78)',
                  transition: 'filter 0.2s',
                }}
              />
              {/* Dark gradient overlay for the ISO code legibility */}
              <rect
                x={bx}
                y={by}
                width={HEX_WIDTH}
                height={2 * HEX_RADIUS}
                fill="url(#hexFlagOverlay)"
                clipPath={`url(#hex-${p.code})`}
                style={{ pointerEvents: 'none' }}
              />
              {/* Outer hex stroke (frame) */}
              <polygon
                points={pointyHexPoints(p.x, p.y, HEX_RADIUS)}
                fill="none"
                stroke={isActive ? '#F0B429' : '#1E2530'}
                strokeWidth={isActive ? 2.2 : 1.2}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s', pointerEvents: 'none' }}
              />
              {/* ISO code at the bottom */}
              <text
                x={p.x}
                y={p.y + HEX_RADIUS - 7}
                textAnchor="middle"
                fill={isActive ? '#F0B429' : '#FFFFFF'}
                fontSize={9}
                fontFamily="var(--font-dm-mono), monospace"
                letterSpacing="0.22em"
                fontWeight={700}
                style={{
                  pointerEvents: 'none',
                  transition: 'fill 0.2s',
                  paintOrder: 'stroke',
                  stroke: 'rgba(0,0,0,0.6)',
                  strokeWidth: 2,
                  strokeLinejoin: 'round',
                }}
              >
                {p.code}
              </text>
            </g>
          )
        })}
      </svg>

      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          minHeight: '2em',
          color: hovered ? '#F0B429' : '#4A5566',
          fontSize: '1.15rem',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
          letterSpacing: '0.06em',
          fontWeight: 600,
          transition: 'color 0.2s',
        }}
      >
        {hovered
          ? countries.find((c) => c.code === hovered)?.name
          : `Pasa el ratón sobre un país de ${continentLabel}`}
      </div>
    </div>
  )
}
