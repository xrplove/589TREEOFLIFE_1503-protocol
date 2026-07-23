'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { DemoActor } from '../data/demoActors'
import { installDemoActor } from './loadActor'

const flagEmoji: Record<string, string> = {
  ES: '🇪🇸',
  JP: '🇯🇵',
  FR: '🇫🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  IT: '🇮🇹',
  PT: '🇵🇹',
}

const sectorLabel: Record<string, string> = {
  inmobiliario: 'Inmobiliario',
  legal: 'Legal',
  agroalimentario: 'Agroalimentario',
  metalurgico: 'Metalúrgico',
  textil: 'Textil',
  automocion: 'Automoción',
  salud: 'Salud',
  transporte: 'Transporte',
  energia: 'Energía',
  tecnologia: 'Tecnología',
  turismo: 'Turismo',
}

export default function DemoActorCard({ actor }: { actor: DemoActor }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleClick() {
    if (loading) return
    setLoading(true)
    const target = installDemoActor(actor)
    router.push(target)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(14,17,24,0.7)',
        border: '1px solid #1E2530',
        borderRadius: 6,
        padding: '1.5rem 1.4rem',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
        opacity: loading ? 0.6 : 1,
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = '#00A3FF'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1E2530'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row: logo + flag + sector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 6,
            background: '#0E1118',
            border: '1px solid #1E2530',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          dangerouslySetInnerHTML={{ __html: actor.logoSvg }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.62rem',
              color: '#4A5566',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: '1rem' }}>{flagEmoji[actor.homeCountry] || '🌐'}</span>
            <span>{sectorLabel[actor.sectorId] || actor.sectorId}</span>
            <span style={{ color: '#2A3340' }}>·</span>
            <span>{actor.entityCode}</span>
          </div>
          <div
            style={{
              fontSize: '1rem',
              color: '#E8EDF5',
              fontWeight: 600,
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {actor.shortName}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.86rem',
          color: '#9FB6CC',
          lineHeight: 1.55,
          marginBottom: '0.85rem',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          minHeight: '2.7em',
        }}
      >
        {actor.description}
      </p>

      {/* Highlight (why this actor) */}
      <p
        style={{
          fontSize: '0.74rem',
          color: '#7A8899',
          lineHeight: 1.5,
          fontStyle: 'italic',
          marginBottom: '1rem',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          flex: 1,
        }}
      >
        ◆ {actor.highlight}
      </p>

      {/* CTA */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0.6rem 0.85rem',
          background: loading ? 'rgba(0,163,255,0.08)' : 'rgba(0,163,255,0.12)',
          border: '1px solid rgba(0,163,255,0.4)',
          borderRadius: 3,
          color: '#00A3FF',
          fontSize: '0.78rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {loading ? 'Cargando…' : `Entrar como ${actor.shortName.split(' ')[0]} →`}
      </div>
    </button>
  )
}
