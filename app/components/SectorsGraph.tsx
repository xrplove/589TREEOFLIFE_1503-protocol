'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORS, SECTOR_FLOWS } from '../data/sectors'

const ORBIT_RADIUS = 290
const HEX_SIZE = 56
const CENTER_HEX_SIZE = 76

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

function orbitPosition(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

// Tiny stroke-only icons for each sector (24×24 viewBox, drawn at HEX center).
const ICONS: Record<string, React.ReactNode> = {
  inmobiliario: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
    </g>
  ),
  automocion: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l2-5h14l2 5M3 14h18v4H3zM6 18v2M18 18v2M6 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM18 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </g>
  ),
  salud: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16M4 12h16" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </g>
  ),
  agroalimentario: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v8a3 3 0 006 0V3M8 11v10M16 3a3 3 0 00-3 3v6h3V3zM16 12v9" />
    </g>
  ),
  transporte: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16h11V7H2zM13 10h5l3 3v3h-8M6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </g>
  ),
  metalurgico: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h18M5 18v-4l4-2 6 2 4-4v8M9 14V8M15 12V6" />
    </g>
  ),
  energia: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
    </g>
  ),
  tecnologia: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </g>
  ),
  turismo: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V8M12 8c-3 0-6-2-6-5 3 0 6 2 6 5zM12 8c3 0 6-2 6-5-3 0-6 2-6 5zM7 22h10" />
    </g>
  ),
  legal: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M8 21h8M5 8h14M7 8l-3 7h6zM17 8l-3 7h6z" />
    </g>
  ),
  textil: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="3" />
      <rect x="6" y="17" width="12" height="3" />
      <path d="M9 7v10M12 7v10M15 7v10" />
    </g>
  ),
  cultura: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4c-1 6 0 11 2 14c2 2 6 2 8 0c2-3 3-8 2-14z" />
      <path d="M9 9l1.5 1.5M13.5 10.5L15 9" />
      <path d="M10 16c1 1 3 1 4 0" />
    </g>
  ),
  institucional: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-5l9 5" />
      <path d="M4 9h16" />
      <path d="M6 9v9M10 9v9M14 9v9M18 9v9" />
      <path d="M3 20h18" />
    </g>
  ),
  educacion: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9l10-5l10 5l-10 5z" />
      <path d="M6 12v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
      <path d="M21 10v6" />
      <circle cx="21" cy="17.5" r="1" />
    </g>
  ),
  medioambiente: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-4 5-6 9-6 12a6 6 0 0012 0c0-3-2-7-6-12z" />
      <path d="M10 14c0-2 2-3 4-3M10 15c1 1 3 0 4-2" />
    </g>
  ),
  'servicios-auxiliares': (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <path d="M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </g>
  ),
  // Sector 17 añadido 23-may tarde (FINANCIERO, transversal). Icono:
  // billete con símbolo central + dos monedas — representa banca + valor.
  financiero: (
    <g stroke="currentColor" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="14" height="9" rx="1" />
      <circle cx="10" cy="11.5" r="2" />
      <path d="M6 7v2M14 14v2" />
      <circle cx="18" cy="17" r="3" />
      <path d="M18 15.5v3M16.7 17h2.6" />
    </g>
  ),
}

export default function SectorsGraph() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const positions = SECTORS.map((s, i) => ({
    ...s,
    ...orbitPosition(i, SECTORS.length, ORBIT_RADIUS),
  }))

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 820,
        margin: '3rem auto 0',
        position: 'relative',
        aspectRatio: '1 / 1',
      }}
    >
      <svg
        viewBox="-420 -420 840 840"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="sectorsGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A3FF" stopOpacity={0.32} />
            <stop offset="60%" stopColor="#00A3FF" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#00A3FF" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sectorsHubFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F1A2A" />
            <stop offset="100%" stopColor="#08090F" />
          </radialGradient>
          <filter id="sectorsGoldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft glow behind central hub */}
        <circle cx={0} cy={0} r={190} fill="url(#sectorsGlow)" />

        {/* Edges from each sector to center */}
        <g>
          {positions.map((p) => {
            const isActive = hovered === p.id
            return (
              <line
                key={`edge-${p.id}`}
                x1={0}
                y1={0}
                x2={p.x}
                y2={p.y}
                stroke={isActive ? '#F0B429' : '#1E2530'}
                strokeWidth={isActive ? 1.6 : 1}
                strokeDasharray={isActive ? '0' : '4 5'}
                style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
              />
            )
          })}
        </g>

        {/* Inter-sector trade-flow particles: source → global hub → target. */}
        <g filter="url(#sectorsGoldGlow)">
          {SECTOR_FLOWS.map(([fromId, toId], i) => {
            const from = positions.find((p) => p.id === fromId)
            const to = positions.find((p) => p.id === toId)
            if (!from || !to) return null
            const begin = ((i * 3) / SECTOR_FLOWS.length).toFixed(2)
            const path = `M ${from.x.toFixed(2)},${from.y.toFixed(2)} L 0,0 L ${to.x.toFixed(2)},${to.y.toFixed(2)}`
            return (
              <circle key={`flow-${i}`} r={4} fill="#F0B429">
                <animateMotion path={path} dur="3s" begin={`${begin}s`} repeatCount="indefinite" />
                <animate
                  attributeName="r"
                  values="3.2;3.2;6;3.2;3.2"
                  keyTimes="0;0.42;0.5;0.58;1"
                  dur="3s"
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;1;0"
                  keyTimes="0;0.08;0.5;0.92;1"
                  dur="3s"
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )
          })}
        </g>

        {/* Central hub */}
        <g>
          <polygon
            points={hexPoints(0, 0, CENTER_HEX_SIZE)}
            fill="url(#sectorsHubFill)"
            stroke="#00A3FF"
            strokeWidth={1.6}
          />
          <text
            x={0}
            y={-8}
            textAnchor="middle"
            fill="#00A3FF"
            fontSize={11}
            fontFamily="var(--font-dm-mono), monospace"
            letterSpacing="0.24em"
          >
            DGM
          </text>
          <text
            x={0}
            y={10}
            textAnchor="middle"
            fill="#7A8899"
            fontSize={7}
            fontFamily="var(--font-dm-mono), monospace"
            letterSpacing="0.18em"
          >
            CROSS-SECTOR HUB
          </text>
        </g>

        {/* Sector hexagons */}
        {positions.map((p, i) => {
          const isActive = hovered === p.id
          const iconColor = isActive ? '#F0B429' : '#9FB6CC'
          const hexRotation = (i * 360) / SECTORS.length
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/sector/${p.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={hexPoints(p.x, p.y, HEX_SIZE)}
                transform={`rotate(${hexRotation}, ${p.x}, ${p.y})`}
                fill={isActive ? '#0F1A2A' : '#0E1118'}
                stroke={isActive ? '#F0B429' : p.builtOut ? '#00A3FF' : '#1E2530'}
                strokeWidth={isActive ? 1.8 : p.builtOut ? 1.4 : 1.1}
                style={{ transition: 'fill 0.25s, stroke 0.25s' }}
              />
              {/* Icon, centered */}
              <g
                transform={`translate(${p.x - 12}, ${p.y - 26})`}
                style={{ color: iconColor, pointerEvents: 'none', transition: 'color 0.25s' }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24">
                  {ICONS[p.id]}
                </svg>
              </g>
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                fill={isActive ? '#F0B429' : '#E8EDF5'}
                fontSize={10}
                fontFamily="var(--font-chakra-petch), sans-serif"
                fontWeight={600}
                letterSpacing="0.1em"
                style={{ pointerEvents: 'none', textTransform: 'uppercase', transition: 'fill 0.25s' }}
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y + 22}
                textAnchor="middle"
                fill={isActive ? '#F0B429' : '#4A5566'}
                fontSize={7}
                fontFamily="var(--font-dm-mono), monospace"
                letterSpacing="0.2em"
                style={{ pointerEvents: 'none', transition: 'fill 0.25s' }}
              >
                {p.short}
              </text>
              {p.builtOut && (
                <circle cx={p.x + HEX_SIZE * 0.55} cy={p.y - HEX_SIZE * 0.6} r={4} fill="#00C864">
                  <title>Sector activo</title>
                </circle>
              )}
            </g>
          )
        })}
      </svg>

      {/* Hover description */}
      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          minHeight: '3em',
          padding: '0 1rem',
          color: hovered ? '#E8EDF5' : '#4A5566',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
          letterSpacing: '0.04em',
          fontWeight: 500,
          transition: 'color 0.2s',
          maxWidth: 600,
          margin: '1.5rem auto 0',
          lineHeight: 1.5,
        }}
      >
        {hovered
          ? SECTORS.find((s) => s.id === hovered)?.description
          : 'Pasa el ratón sobre un sector para verlo · click para entrar'}
      </div>
    </div>
  )
}
