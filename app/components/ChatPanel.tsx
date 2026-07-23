'use client'

// Fase 4 — columna de comunicación persistente (plan §7). Vive en el hueco
// muerto entre el nav lateral y el main del WorkspaceShell. Barra de
// acciones (💬 Chat · 📞 Llamada · 🎥 Videocall · 👥 Reunión · 📅 Agendar):
// en Fase 4 SOLO Chat funciona; el resto queda maquetado/reservado con su
// sitio fijo para que Fase 5 no rompa la disposición (project_1503_call_model).
//
// Lazy connect (§2.1): la columna siempre está montada, pero el socket NO
// se abre hasta que el usuario abre el chat. Degradación elegante: si el WS
// no está disponible, el workspace sigue funcionando — el chat es aditivo.
//
// v1 acotado (§1): 1-a-1, texto plano, read receipts. Texto plano renderizado
// por React (escapa por defecto). NUNCA dangerouslySetInnerHTML.
//
// Microcopy i18n×8: las cadenas vienen de WorkspaceStrings (app/data/i18n);
// el escritorio inyecta `t` según el idioma del actor.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat, type ChatStatus } from '../lib/useChat'
import type { WorkspaceStrings } from '../data/i18n'

const C = {
  bg: 'transparent',
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.06)',
  accent: '#B9A4FF',
  text: '#EAEFF6',
  dim: '#9AA7B8',
  faint: '#6B7686',
  mono: 'var(--font-geist-mono), monospace',
  sans: 'var(--font-geist-sans), system-ui, sans-serif',
}

// Solo estructura (id/glyph/enabled). Las etiquetas se resuelven con `t`
// dentro del componente — un módulo no tiene acceso al idioma.
const ACTIONS = [
  { id: 'chat', glyph: '💬', enabled: true },
  { id: 'call', glyph: '📞', enabled: false },
  { id: 'video', glyph: '🎥', enabled: false, vision: true },
  { id: 'meet', glyph: '👥', enabled: false },
  { id: 'cal', glyph: '📅', enabled: false },
] as const

function statusLabel(
  s: ChatStatus,
  t: WorkspaceStrings,
): { text: string; color: string } {
  switch (s) {
    case 'online':
      return { text: t.chatStatusOnline, color: '#54E08C' }
    case 'connecting':
      return { text: t.chatStatusConnecting, color: '#F0B429' }
    case 'offline':
      return { text: t.chatStatusOffline, color: '#E0857E' }
    case 'unauthenticated':
      return { text: t.chatStatusUnauth, color: '#F0B429' }
    case 'error':
      return { text: t.chatStatusError, color: '#E0857E' }
    default:
      return { text: t.chatStatusIdle, color: C.faint }
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function ChatPanel({
  t,
  hideActionBar = false,
  borderSide = 'right',
}: {
  t: WorkspaceStrings
  /** Cuando vive dentro del ChatDrawer, la barra de 5 iconos esta
      duplicada con el CommsCluster del header — la ocultamos. */
  hideActionBar?: boolean
  /** En grid columna intermedia: borde derecho. En drawer derecho
      flotante: borde izquierdo. */
  borderSide?: 'right' | 'left'
}) {
  const chat = useChat()
  // Dentro del ChatDrawer la barra de acciones esta oculta y el wrapper
  // controla el abrir/cerrar — el chat arranca abierto. En el modo
  // legacy (grid columna) sigue con el intro + boton "Abrir chat".
  const [open, setOpen] = useState(hideActionBar)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState('')
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  // Lazy connect: abrir socket al abrir el chat; cerrarlo al cerrarlo.
  useEffect(() => {
    if (open) chat.connect()
    else chat.disconnect()
    // chat.connect/disconnect son estables (useCallback en el hook).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const thread = useMemo(
    () => (activeConv ? chat.messages[activeConv] ?? [] : []),
    [activeConv, chat.messages],
  )
  const activePeerId = activeConv
    ? chat.conversations.find((c) => c.id === activeConv)?.peerId ?? null
    : null
  const activePeerOnline = activePeerId
    ? chat.presence[activePeerId] === true
    : false

  // Auto-scroll al último mensaje.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.length, activeConv])

  // Read receipts: marcar leídos los mensajes entrantes del hilo activo.
  useEffect(() => {
    if (!activeConv || !chat.userId) return
    for (const m of thread) {
      if (m.sender_id !== chat.userId && m.read_at == null && !m.pending) {
        chat.markRead(activeConv, m.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, activeConv, chat.userId])

  const st = statusLabel(chat.status, t)
  const actionLabel: Record<string, string> = {
    chat: t.chatActionChat,
    call: t.chatActionCall,
    video: t.chatActionVideo,
    meet: t.chatActionMeet,
    cal: t.chatActionSchedule,
  }

  function handleStart() {
    const id = recipientInput.trim()
    if (!UUID_RE.test(id)) return
    chat.startConversation(id)
    setRecipientInput('')
  }

  function handleSend() {
    if (!activeConv) return
    const body = draft.trim()
    if (!body) return
    chat.sendMessage(activeConv, body)
    setDraft('')
  }

  return (
    <aside
      style={{
        background: C.bg,
        ...(borderSide === 'right'
          ? { borderRight: `1px solid ${C.border}` }
          : { borderLeft: `1px solid ${C.border}` }),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: C.sans,
        overflow: 'hidden',
      }}
    >
      {/* Barra de acciones — solo Chat activo en Fase 4.
          Se oculta cuando vive dentro del ChatDrawer (la barra ya esta
          en el cluster del header). */}
      {!hideActionBar && (
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 12px 10px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {ACTIONS.map((a) => {
          const isChat = a.id === 'chat'
          const activeChat = isChat && open
          return (
            <button
              key={a.id}
              onClick={() => {
                if (isChat) setOpen((v) => !v)
              }}
              disabled={!a.enabled}
              title={
                a.enabled
                  ? actionLabel[a.id]
                  : 'vision' in a && a.vision
                  ? `${t.chatVideoVision} — ${t.chatPhaseHint}`
                  : `${actionLabel[a.id]} — ${t.chatPhaseHint}`
              }
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 4px',
                background: activeChat
                  ? 'rgba(185,164,255,0.12)'
                  : 'transparent',
                border: activeChat
                  ? `1px solid rgba(185,164,255,0.32)`
                  : `1px solid ${C.borderSoft}`,
                borderRadius: 3,
                color: a.enabled ? C.text : C.faint,
                cursor: a.enabled ? 'pointer' : 'not-allowed',
                opacity: a.enabled ? 1 : 0.45,
                fontFamily: C.sans,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{a.glyph}</span>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.04em' }}>
                {actionLabel[a.id]}
              </span>
            </button>
          )
        })}
      </div>
      )}

      {!open && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.5 }}>💬</div>
          <div style={{ color: C.dim, fontSize: '0.82rem', lineHeight: 1.6 }}>
            {t.chatIntro}
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{
              marginTop: 4,
              background: 'rgba(185,164,255,0.12)',
              border: `1px solid rgba(185,164,255,0.32)`,
              color: C.accent,
              padding: '7px 16px',
              borderRadius: 3,
              fontSize: '0.78rem',
              fontFamily: C.sans,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {t.chatOpenButton}
          </button>
        </div>
      )}

      {open && (
        <>
          {/* Estado de conexión (honesto: TU socket, no presencia del otro) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              borderBottom: `1px solid ${C.borderSoft}`,
              fontFamily: C.mono,
              fontSize: '0.64rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.dim,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: st.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: st.color }}>{st.text}</span>
            {chat.lastError && (
              <span
                title={chat.lastError}
                style={{
                  marginLeft: 'auto',
                  color: '#E0857E',
                  textTransform: 'none',
                  letterSpacing: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 140,
                }}
              >
                {chat.lastError}
              </span>
            )}
          </div>

          {chat.status === 'unauthenticated' ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
                color: C.dim,
                fontSize: '0.82rem',
                lineHeight: 1.6,
              }}
            >
              {t.chatSignInPrompt}
            </div>
          ) : (
            <>
              {/* Nueva conversación por id de actor. Honest: el directorio
                  de actores → recipientId aún no está cableado (Fase 6 /
                  §7.1); v1 acepta el id directo. */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '10px 12px',
                  borderBottom: `1px solid ${C.borderSoft}`,
                }}
              >
                <input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStart()
                  }}
                  placeholder={t.chatRecipientPlaceholder}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    color: C.text,
                    padding: '6px 9px',
                    fontSize: '0.74rem',
                    fontFamily: C.mono,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleStart}
                  disabled={!UUID_RE.test(recipientInput.trim())}
                  style={{
                    background: 'rgba(185,164,255,0.12)',
                    border: `1px solid rgba(185,164,255,0.32)`,
                    color: C.accent,
                    padding: '0 12px',
                    borderRadius: 3,
                    fontSize: '0.74rem',
                    fontFamily: C.sans,
                    cursor: UUID_RE.test(recipientInput.trim())
                      ? 'pointer'
                      : 'not-allowed',
                    opacity: UUID_RE.test(recipientInput.trim()) ? 1 : 0.4,
                  }}
                >
                  {t.chatOpenConversation}
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Lista de conversaciones conocidas */}
                <div
                  style={{
                    width: 116,
                    borderRight: `1px solid ${C.borderSoft}`,
                    overflowY: 'auto',
                    flexShrink: 0,
                  }}
                >
                  {chat.conversations.length === 0 && (
                    <div
                      style={{
                        padding: '12px 10px',
                        color: C.faint,
                        fontSize: '0.68rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {t.chatNoConversations}
                    </div>
                  )}
                  {chat.conversations.map((c) => {
                    const active = c.id === activeConv
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveConv(c.id)}
                        title={c.peerId}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: active
                            ? 'rgba(185,164,255,0.10)'
                            : 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${C.borderSoft}`,
                          borderLeft: active
                            ? `2px solid ${C.accent}`
                            : '2px solid transparent',
                          color: active ? C.text : C.dim,
                          padding: '9px 8px',
                          cursor: 'pointer',
                          fontFamily: C.mono,
                          fontSize: '0.62rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            title={
                              chat.presence[c.peerId]
                                ? t.chatPresenceLive
                                : t.chatPresenceOffline
                            }
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: chat.presence[c.peerId]
                                ? '#54E08C'
                                : '#E0857E',
                              flexShrink: 0,
                            }}
                          />
                          {c.peerId.slice(0, 8)}…
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Hilo + compositor */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  {!activeConv ? (
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16,
                        textAlign: 'center',
                        color: C.faint,
                        fontSize: '0.74rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {t.chatPickConversation}
                    </div>
                  ) : (
                    <>
                      {/* Cabecera del hilo: interlocutor + pilotito de
                          presencia (verde = en vivo, rojo = desconectado) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '8px 12px',
                          borderBottom: `1px solid ${C.borderSoft}`,
                          fontFamily: C.mono,
                          fontSize: '0.66rem',
                          color: C.dim,
                        }}
                      >
                        <span
                          title={
                            activePeerOnline
                              ? t.chatPresenceLive
                              : t.chatPresenceOffline
                          }
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: activePeerOnline
                              ? '#54E08C'
                              : '#E0857E',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {activePeerId
                            ? `${activePeerId.slice(0, 8)}…`
                            : t.chatConversationFallback}
                        </span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            color: activePeerOnline ? '#54E08C' : C.faint,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '0.58rem',
                          }}
                        >
                          {activePeerOnline
                            ? t.chatPresenceLive
                            : t.chatPresenceOffline}
                        </span>
                      </div>
                      <div
                        ref={threadRef}
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          padding: '12px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        {thread.length === 0 && (
                          <div
                            style={{
                              color: C.faint,
                              fontSize: '0.74rem',
                              textAlign: 'center',
                              marginTop: 12,
                            }}
                          >
                            {t.chatNoMessages}
                          </div>
                        )}
                        {thread.map((m) => {
                          const mine = m.sender_id === chat.userId
                          return (
                            <div
                              key={m.id}
                              style={{
                                alignSelf: mine
                                  ? 'flex-end'
                                  : 'flex-start',
                                maxWidth: '82%',
                                background: mine
                                  ? 'rgba(185,164,255,0.14)'
                                  : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${
                                  mine
                                    ? 'rgba(185,164,255,0.28)'
                                    : C.border
                                }`,
                                borderRadius: 6,
                                padding: '7px 10px',
                              }}
                            >
                              {/* Texto plano: React escapa. Sin HTML/markdown. */}
                              <div
                                style={{
                                  color: C.text,
                                  fontSize: '0.82rem',
                                  lineHeight: 1.45,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {m.body}
                              </div>
                              <div
                                style={{
                                  marginTop: 3,
                                  fontSize: '0.58rem',
                                  fontFamily: C.mono,
                                  color: C.faint,
                                  textAlign: 'right',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {m.pending
                                  ? t.chatMsgSending
                                  : mine
                                  ? m.read_at
                                    ? t.chatMsgRead
                                    : t.chatMsgSent
                                  : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          padding: '10px 12px',
                          borderTop: `1px solid ${C.borderSoft}`,
                        }}
                      >
                        <textarea
                          value={draft}
                          onChange={(e) =>
                            setDraft(e.target.value.slice(0, 4000))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                          rows={2}
                          placeholder={t.chatComposerPlaceholder}
                          style={{
                            flex: 1,
                            resize: 'none',
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${C.border}`,
                            borderRadius: 3,
                            color: C.text,
                            padding: '7px 9px',
                            fontSize: '0.8rem',
                            fontFamily: C.sans,
                            outline: 'none',
                            lineHeight: 1.4,
                          }}
                        />
                        <button
                          onClick={handleSend}
                          disabled={
                            !draft.trim() || chat.status !== 'online'
                          }
                          style={{
                            background: 'rgba(185,164,255,0.12)',
                            border: `1px solid rgba(185,164,255,0.32)`,
                            color: C.accent,
                            padding: '0 14px',
                            borderRadius: 3,
                            fontSize: '0.78rem',
                            fontFamily: C.sans,
                            cursor:
                              draft.trim() && chat.status === 'online'
                                ? 'pointer'
                                : 'not-allowed',
                            opacity:
                              draft.trim() && chat.status === 'online'
                                ? 1
                                : 0.4,
                          }}
                        >
                          {t.chatSendButton}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}
