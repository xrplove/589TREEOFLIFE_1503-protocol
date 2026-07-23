'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONTINENTS } from '../data/continents'

// Pre-defined trade routes (origin -> global hub -> destination).
// 14 routes give two flows per continent on average. Each particle
// represents goods + verified documentation moving between markets.
const ROUTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['europa', 'asia'],
  ['norteamerica', 'europa'],
  ['sudamerica', 'norteamerica'],
  ['asia', 'europa'],
  ['oceania', 'asia'],
  ['africa', 'europa'],
  ['oriente-medio', 'europa'],
  ['asia', 'norteamerica'],
  ['europa', 'africa'],
  ['norteamerica', 'sudamerica'],
  ['africa', 'asia'],
  ['europa', 'oriente-medio'],
  ['asia', 'oceania'],
  ['oriente-medio', 'africa'],
]

const ORBIT_RADIUS = 240
const HEX_SIZE = 56
const CENTER_HEX_SIZE = 70

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * (Math.PI / 180) // pointy-top
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

function orbitPosition(index: number, total: number, radius: number) {
  // Start at top (-90deg) and go clockwise
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

export default function ContinentsGraph() {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const positions = CONTINENTS.map((c, i) => ({
    ...c,
    ...orbitPosition(i, CONTINENTS.length, ORBIT_RADIUS),
  }))

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 760,
        margin: '3.5rem auto 0',
        position: 'relative',
        aspectRatio: '1 / 1',
      }}
    >
      <svg
        viewBox="-360 -360 720 720"
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A3FF" stopOpacity={0.32} />
            <stop offset="60%" stopColor="#00A3FF" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#00A3FF" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="hubFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F1A2A" />
            <stop offset="100%" stopColor="#08090F" />
          </radialGradient>
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft glow behind central hub */}
        <circle cx={0} cy={0} r={180} fill="url(#centerGlow)" />

        {/* Edges from each continent to center */}
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

        {/* Trade-flow particles: continent → global hub → continent. */}
        <g filter="url(#goldGlow)">
          {ROUTE_PAIRS.map(([fromId, toId], i) => {
            const from = positions.find((p) => p.id === fromId)
            const to = positions.find((p) => p.id === toId)
            if (!from || !to) return null
            const begin = ((i * 3) / ROUTE_PAIRS.length).toFixed(2)
            const path = `M ${from.x.toFixed(2)},${from.y.toFixed(2)} L 0,0 L ${to.x.toFixed(2)},${to.y.toFixed(2)}`
            return (
              <circle key={`route-${i}`} r={4} fill="#F0B429">
                <animateMotion
                  path={path}
                  dur="3s"
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                />
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

        {/* Central hub (DGM / Digital Global Marketplace) */}
        <g>
          <polygon
            points={hexPoints(0, 0, CENTER_HEX_SIZE)}
            fill="url(#hubFill)"
            stroke="#00A3FF"
            strokeWidth={1.6}
          />
          <text
            x={0}
            y={-6}
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
            y={12}
            textAnchor="middle"
            fill="#7A8899"
            fontSize={7}
            fontFamily="var(--font-dm-mono), monospace"
            letterSpacing="0.18em"
          >
            HUB
          </text>
        </g>

        {/* Continent hexagons */}
        {positions.map((p) => {
          const isActive = hovered === p.id
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => router.push(`/continent/${p.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={hexPoints(p.x, p.y, HEX_SIZE)}
                fill={isActive ? '#0F1A2A' : '#0E1118'}
                stroke={isActive ? '#F0B429' : '#1E2530'}
                strokeWidth={isActive ? 1.8 : 1.2}
                style={{ transition: 'fill 0.25s, stroke 0.25s' }}
              />
              <text
                x={p.x}
                y={p.y - 2}
                textAnchor="middle"
                fill={isActive ? '#F0B429' : '#E8EDF5'}
                fontSize={9}
                fontFamily="var(--font-chakra-petch), sans-serif"
                fontWeight={600}
                letterSpacing="0.12em"
                style={{ pointerEvents: 'none', textTransform: 'uppercase', transition: 'fill 0.25s' }}
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y + 12}
                textAnchor="middle"
                fill={isActive ? '#F0B429' : '#4A5566'}
                fontSize={7}
                fontFamily="var(--font-dm-mono), monospace"
                letterSpacing="0.2em"
                style={{ pointerEvents: 'none', transition: 'fill 0.25s' }}
              >
                {p.short}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
