'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '../../lib/useChat'
import { getWorkspaceStrings, type Lang } from '../../data/i18n'

/**
 * Botón "Iniciar chat" de la ficha pública (Fase 3c v1).
 *
 * Recibe `lang` de la página Server (que lo leyó vía `getServerLang()`).
 * Carga las strings del idioma una sola vez con useMemo.
 *
 * Flujo:
 *  1. Click → connect() + startConversation(recipientId)
 *  2. El server responde `chat.started` con conversationId
 *  3. Detectamos la nueva conversación en `conversations` y redirigimos
 *     al escritorio
 */
export default function ChatStartButton({
  recipientId,
  recipientName,
  lang,
}: {
  recipientId: string
  recipientName: string
  lang: Lang
}) {
  const router = useRouter()
  const t = useMemo(() => getWorkspaceStrings(lang), [lang])
  const {
    status,
    lastError,
    startConversation,
    connect,
    conversations,
  } = useChat()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!pending) return
    const match = conversations.find((c) => c.peerId === recipientId)
    if (match) {
      // Intencional: el efecto reacciona a la llegada de la conversación; al
      // encontrarla limpiamos el flag y navegamos. Un solo render extra.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPending(false)
      router.push('/escritorio')
    }
  }, [pending, conversations, recipientId, router])

  const onClick = useCallback(() => {
    if (pending) return
    if (status === 'unauthenticated') {
      router.push(`/login?next=/actor/${recipientId}`)
      return
    }
    setPending(true)
    connect()
    startConversation(recipientId)
    setTimeout(() => setPending(false), 5000)
  }, [pending, status, connect, startConversation, recipientId, router])

  const disabled = pending || status === 'connecting'

  const buttonLabel = pending
    ? t.chatBtnStarting
    : status === 'connecting'
    ? t.chatBtnConnecting
    : t.chatBtnStartWith.replace('{name}', recipientName.toUpperCase())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-3)' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          background: disabled ? 'var(--pm-bg-elev)' : 'var(--pm-accent-primary)',
          color: disabled ? 'var(--pm-text-muted)' : 'var(--pm-text-on-accent)',
          padding: 'var(--pm-space-4) var(--pm-space-6)',
          border: 'none',
          borderRadius: 'var(--pm-radius-sm)',
          fontFamily: 'var(--pm-font-mono)',
          fontSize: 'var(--pm-text-sm)',
          letterSpacing: 'var(--pm-tracking-wide)',
          textTransform: 'uppercase',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
          boxShadow: disabled ? 'none' : 'var(--pm-glow-cyan-md)',
          width: '100%',
        }}
      >
        {buttonLabel}
      </button>
      {lastError && (
        <div
          style={{
            padding: 'var(--pm-space-3) var(--pm-space-4)',
            background: 'rgba(255, 90, 106, 0.08)',
            border: '1px solid var(--pm-accent-danger)',
            borderRadius: 'var(--pm-radius-sm)',
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-xs)',
            color: 'var(--pm-accent-danger)',
            letterSpacing: 'var(--pm-tracking-wide)',
          }}
        >
          {t.chatBtnErrorPrefix} · {lastError.toUpperCase()}
        </div>
      )}
    </div>
  )
}
