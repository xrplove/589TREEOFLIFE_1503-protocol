'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDemoActor } from '../data/demoActors'
import { clearDemoStorage, readDemoState } from '../demo/loadActor'

/** Yellow banner shown at the top of the workspace when demo mode is active.
    Displays the current actor name and offers two actions:
      · "Salir del modo demo"  → wipes localStorage and goes to the globe.
      · "Cambiar de actor"     → goes to /demo to pick another perfil. */
export default function DemoBanner() {
  const router = useRouter()
  const [active, setActive] = useState(false)
  const [actorName, setActorName] = useState<string>('')

  useEffect(() => {
    const state = readDemoState()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
    setActive(state.active)
    if (state.actorId) {
      const actor = getDemoActor(state.actorId)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
      if (actor) setActorName(actor.shortName)
    }
  }, [])

  if (!active) return null

  function handleExit() {
    clearDemoStorage()
    router.push('/')
  }

  return (
    <div
      role="status"
      style={{
        background: 'linear-gradient(90deg, rgba(240,180,41,0.18), rgba(240,180,41,0.08))',
        borderBottom: '1px solid rgba(240,180,41,0.45)',
        padding: '0.6rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '0.66rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#F0B429',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontWeight: 700,
        }}
      >
        🎭 MODO DEMO
      </div>
      <div style={{ width: 1, height: 18, background: 'rgba(240,180,41,0.35)' }} />
      <div style={{ flex: 1, fontSize: '0.85rem', color: '#E8EDF5', minWidth: 200 }}>
        Estás navegando como <strong>{actorName || 'actor demo'}</strong>. Datos ficticios; ningún
        registro real.
      </div>
      <Link
        href="/demo"
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#F0B429',
          textDecoration: 'none',
          padding: '0.45rem 0.85rem',
          border: '1px solid rgba(240,180,41,0.45)',
          borderRadius: 3,
          fontFamily: 'var(--font-dm-mono), monospace',
          fontWeight: 600,
        }}
      >
        Cambiar de actor
      </Link>
      <button
        type="button"
        onClick={handleExit}
        style={{
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#0E1118',
          background: '#F0B429',
          border: 'none',
          borderRadius: 3,
          padding: '0.5rem 0.9rem',
          cursor: 'pointer',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontWeight: 700,
        }}
      >
        Salir del modo demo →
      </button>
    </div>
  )
}
