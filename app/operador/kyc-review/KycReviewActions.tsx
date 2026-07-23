'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Bloque 3b.5.3.f — botones de decisión KYC inline en la card del Actor.
 * Cliente porque maneja state y llama al endpoint /api/operator/kyc-decision.
 *
 * Aprobar es un click directo (decisión positiva, sin motivo necesario).
 * Rechazar y suspender abren un prompt que pide motivo obligatorio.
 *
 * Tras una decisión exitosa, refresh del Server Component padre para que la
 * card desaparezca de la cola pending_kyc.
 */
export default function KycReviewActions({ actorUserId }: { actorUserId: string }) {
  const [busy, setBusy] = useState<null | 'approved' | 'rejected' | 'suspended'>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function decide(decision: 'approved' | 'rejected' | 'suspended') {
    let reason: string | null = null
    if (decision === 'rejected' || decision === 'suspended') {
      const promptMsg =
        decision === 'rejected'
          ? 'Motivo del rechazo (visible al Actor):'
          : 'Motivo de la suspensión (visible al Actor):'
      const input = window.prompt(promptMsg)
      if (input === null) return // cancelado
      const trimmed = input.trim()
      if (!trimmed) {
        setError('El motivo es obligatorio para rechazar o suspender.')
        return
      }
      reason = trimmed
    }

    setBusy(decision)
    setError(null)
    try {
      const res = await fetch('/api/operator/kyc-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor_user_id: actorUserId, decision, reason }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? `Error ${res.status}`)
        setBusy(null)
        return
      }
      // Éxito: refresh del Server Component padre para actualizar la cola.
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red')
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => decide('approved')}
          disabled={busy !== null}
          style={{
            ...buttonBase,
            background: '#7BC97B',
            color: '#08090F',
            opacity: busy === 'approved' ? 0.6 : 1,
          }}
        >
          {busy === 'approved' ? 'Aprobando…' : 'Aprobar'}
        </button>
        <button
          onClick={() => decide('rejected')}
          disabled={busy !== null}
          style={{
            ...buttonBase,
            background: 'transparent',
            color: '#FF6B6B',
            border: '1px solid rgba(255,107,107,0.5)',
            opacity: busy === 'rejected' ? 0.6 : 1,
          }}
        >
          {busy === 'rejected' ? 'Rechazando…' : 'Rechazar'}
        </button>
        <button
          onClick={() => decide('suspended')}
          disabled={busy !== null}
          style={{
            ...buttonBase,
            background: 'transparent',
            color: '#F0B429',
            border: '1px solid rgba(240,180,41,0.5)',
            opacity: busy === 'suspended' ? 0.6 : 1,
          }}
        >
          {busy === 'suspended' ? 'Suspendiendo…' : 'Suspender'}
        </button>
      </div>
      {error ? (
        <div style={errorStyle}>
          <span style={{ color: '#FF6B6B', fontWeight: 600 }}>◆</span> {error}
        </div>
      ) : null}
    </div>
  )
}

const buttonBase: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 2,
  fontSize: '0.78rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  fontWeight: 600,
  cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#FF6B6B',
  fontFamily: 'var(--font-dm-mono), monospace',
}
