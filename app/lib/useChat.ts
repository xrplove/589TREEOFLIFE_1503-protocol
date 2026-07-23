'use client'

// Fase 4 — cliente de chat self-host. Hook que habla el protocolo tipado
// del WS server (server/chat/index.mjs). NO inventa envelopes: solo usa los
// que el server implementa (chat.start/send/read/history + presence.ping).
//
// Disciplina honesta (plan docs/plan-fase4-chat.md):
//  - Lazy connect: el socket se abre cuando el panel lo pide (§2.1), no un
//    socket siempre-vivo por cada escritorio cargado.
//  - Identidad = sesión Supabase real (cookie). Sin sesión → 'unauthenticated'
//    y NO se abre socket (degradación elegante: el workspace sigue vivo).
//  - El server es la fuente de verdad del listado: al conectar pedimos
//    conversations.list y el snapshot repuebla la lista. localStorage queda
//    solo como caché para pintado instantáneo antes de que llegue el socket.
//  - Idempotencia: clientMsgId UUID por mensaje → reintentos no duplican.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const WS_URL =
  process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:8787'

const CONV_STORE_KEY = '1503:chat:conversations'

export type ChatStatus =
  | 'idle'
  | 'unauthenticated'
  | 'connecting'
  | 'online'
  | 'offline'
  | 'error'

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
  // Solo presente en mensajes optimistas aún sin confirmar por el server.
  pending?: boolean
  // clientMsgId del mensaje optimista, para reconciliar con el ack.
  clientMsgId?: string
}

export interface KnownConversation {
  id: string
  // Etiqueta local (id del interlocutor con quien se abrió). Honest: no
  // tenemos directorio de actores cableado todavía (Fase 6 / §7.1).
  peerId: string
}

interface UseChat {
  status: ChatStatus
  userId: string | null
  lastError: string | null
  conversations: KnownConversation[]
  messages: Record<string, ChatMessage[]>
  // Presencia GLOBAL: userId → online. Cualquier actor autenticado ve
  // el online/offline de cualquier otro (decisión de producto 17-may).
  presence: Record<string, boolean>
  connect: () => void
  disconnect: () => void
  startConversation: (recipientId: string) => void
  sendMessage: (conversationId: string, body: string) => void
  markRead: (conversationId: string, messageId: string) => void
  loadHistory: (conversationId: string) => void
}

function loadKnownConversations(): KnownConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CONV_STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c) => c && typeof c.id === 'string' && typeof c.peerId === 'string',
    )
  } catch {
    return []
  }
}

function persistKnownConversations(list: KnownConversation[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONV_STORE_KEY, JSON.stringify(list))
  } catch {
    // localStorage lleno/bloqueado: no es fatal, el chat sigue en memoria.
  }
}

function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback improbable (navegadores sin crypto.randomUUID).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const MAX_RECONNECT_ATTEMPTS = 5

export function useChat(): UseChat {
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [userId, setUserId] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<KnownConversation[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [presence, setPresence] = useState<Record<string, boolean>>({})

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number>(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wantConnectedRef = useRef(false)
  // peerId pendiente de asociar a la conversationId que devuelva chat.started.
  const pendingStartPeer = useRef<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe desde localStorage
    setConversations(loadKnownConversations())
  }, [])

  const rememberConversation = useCallback((id: string, peerId: string) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === id)) return prev
      const next = [...prev, { id, peerId }]
      persistKnownConversations(next)
      return next
    })
  }, [])

  const upsertMessage = useCallback(
    (conversationId: string, msg: ChatMessage, ackClientId?: string) => {
      setMessages((prev) => {
        const list = prev[conversationId] ?? []
        // Reconciliar optimista: si llega ack de un mensaje que pusimos
        // pending, lo reemplazamos por la fila confirmada del server.
        if (ackClientId) {
          const idx = list.findIndex((m) => m.clientMsgId === ackClientId)
          if (idx !== -1) {
            const copy = list.slice()
            copy[idx] = { ...msg, pending: false }
            return { ...prev, [conversationId]: copy }
          }
        }
        // Dedupe por id real del server (reentregas / idempotencia).
        if (list.some((m) => m.id === msg.id)) return prev
        return {
          ...prev,
          [conversationId]: [...list, { ...msg, pending: false }],
        }
      })
    },
    [],
  )

  const markMessageRead = useCallback(
    (conversationId: string, messageId: string, readAt: string) => {
      setMessages((prev) => {
        const list = prev[conversationId]
        if (!list) return prev
        let changed = false
        const next = list.map((m) => {
          if (m.id === messageId && m.read_at == null) {
            changed = true
            return { ...m, read_at: readAt }
          }
          return m
        })
        return changed ? { ...prev, [conversationId]: next } : prev
      })
    },
    [],
  )

  // Ref a `openSocket` para el reconnect-with-backoff. openSocket es
  // self-referencial (su propio body llama a `openSocket()` dentro de un
  // setTimeout). Antes lo accedía directamente, lo que produce warnings de
  // ESLint (`Cannot access variable before it is declared`). La ref se
  // actualiza con cada nueva versión de openSocket via useEffect debajo.
  const openSocketRef = useRef<() => Promise<void> | undefined>(() => undefined)

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      return true
    }
    return false
  }, [])

  const loadHistory = useCallback(
    (conversationId: string) => {
      send({ type: 'chat.history', conversationId })
    },
    [send],
  )

  const openSocket = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    let token: string | null = null
    try {
      const { data } = await supabase.auth.getSession()
      token = data.session?.access_token ?? null
    } catch {
      token = null
    }
    if (!token) {
      setStatus('unauthenticated')
      return
    }

    setStatus('connecting')
    let ws: WebSocket
    try {
      // El token viaja en el subprotocolo (no en la URL → no se loguea),
      // exactamente como espera el handshake del server.
      ws = new WebSocket(WS_URL, ['bearer', token])
    } catch {
      setStatus('error')
      setLastError('no se pudo abrir el socket')
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      reconnectRef.current = 0
      setStatus('online')
      setLastError(null)
      // El server es la fuente de verdad: pedimos el listado y el handler
      // de conversations.snapshot repuebla la lista + carga cada historial.
      ws.send(JSON.stringify({ type: 'conversations.list' }))
      // Snapshot inicial de presencia (quién está online ahora mismo).
      ws.send(JSON.stringify({ type: 'presence.list' }))
    }

    ws.onmessage = (ev) => {
      let data: Record<string, unknown>
      try {
        data = JSON.parse(typeof ev.data === 'string' ? ev.data : '')
      } catch {
        return
      }
      switch (data.type) {
        case 'ready':
          setUserId(typeof data.userId === 'string' ? data.userId : null)
          break
        case 'chat.started': {
          const id = data.conversationId
          if (typeof id === 'string') {
            const peer = pendingStartPeer.current ?? id
            pendingStartPeer.current = null
            rememberConversation(id, peer)
            send({ type: 'chat.history', conversationId: id })
          }
          break
        }
        case 'chat.message': {
          const m = data.message as ChatMessage | undefined
          if (m && typeof m.conversation_id === 'string') {
            const ack =
              typeof data.ack === 'string' ? (data.ack as string) : undefined
            upsertMessage(m.conversation_id, m, ack)
            // Mensaje entrante de una conversación que aún no conocíamos
            // (alguien la abrió con nosotros): registrarla en el acto. Sin
            // ack ⇒ el mensaje no es nuestro ⇒ sender_id es el interlocutor.
            if (!ack && typeof m.sender_id === 'string') {
              rememberConversation(m.conversation_id, m.sender_id)
            }
          }
          break
        }
        case 'chat.read': {
          const cid = data.conversationId
          const mid = data.messageId
          if (typeof cid === 'string' && typeof mid === 'string') {
            markMessageRead(cid, mid, new Date().toISOString())
          }
          break
        }
        case 'chat.history': {
          const cid = data.conversationId
          const list = data.messages
          if (typeof cid === 'string' && Array.isArray(list)) {
            setMessages((prev) => ({
              ...prev,
              [cid]: (list as ChatMessage[]).map((m) => ({
                ...m,
                pending: false,
              })),
            }))
          }
          break
        }
        case 'conversations.snapshot': {
          const list = data.conversations
          if (Array.isArray(list)) {
            const clean: KnownConversation[] = list.filter(
              (c) =>
                c &&
                typeof c.id === 'string' &&
                typeof c.peerId === 'string',
            )
            setConversations(clean)
            persistKnownConversations(clean)
            // El server es la fuente de verdad: cargamos cada historial.
            for (const c of clean) {
              send({ type: 'chat.history', conversationId: c.id })
            }
          }
          break
        }
        case 'presence.update': {
          const uid = data.userId
          if (typeof uid === 'string') {
            setPresence((prev) => ({ ...prev, [uid]: data.online === true }))
          }
          break
        }
        case 'presence.snapshot': {
          const list = data.online
          if (Array.isArray(list)) {
            const next: Record<string, boolean> = {}
            for (const uid of list) {
              if (typeof uid === 'string') next[uid] = true
            }
            setPresence(next)
          }
          break
        }
        case 'error':
          setLastError(
            typeof data.error === 'string' ? data.error : 'error de chat',
          )
          break
        default:
          break
      }
    }

    ws.onerror = () => {
      setLastError('error de conexión')
    }

    ws.onclose = () => {
      wsRef.current = null
      if (!wantConnectedRef.current) {
        setStatus('idle')
        return
      }
      // Reintento con backoff. Token pudo expirar → openSocket re-lee la
      // sesión y reconecta con token fresco. Sin sesión → unauthenticated.
      if (reconnectRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setStatus('offline')
        return
      }
      const attempt = reconnectRef.current + 1
      reconnectRef.current = attempt
      setStatus('connecting')
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000)
      reconnectTimer.current = setTimeout(() => {
        // Reconectar usando la ref (no la propia variable openSocket) para
        // evitar self-reference durante el cierre de useCallback.
        if (wantConnectedRef.current) void openSocketRef.current?.()
      }, delay)
    }
  }, [send, rememberConversation, upsertMessage, markMessageRead])

  // Mantener la ref sincronizada con la última versión de openSocket.
  useEffect(() => {
    openSocketRef.current = openSocket
  }, [openSocket])

  const connect = useCallback(() => {
    wantConnectedRef.current = true
    void openSocket()
  }, [openSocket])

  const disconnect = useCallback(() => {
    wantConnectedRef.current = false
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    const ws = wsRef.current
    wsRef.current = null
    if (ws) {
      ws.onclose = null
      ws.close()
    }
    setStatus('idle')
  }, [])

  const startConversation = useCallback(
    (recipientId: string) => {
      pendingStartPeer.current = recipientId
      send({ type: 'chat.start', recipientId })
    },
    [send],
  )

  const sendMessage = useCallback(
    (conversationId: string, body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return
      const clientMsgId = newUuid()
      // Mensaje optimista: se pinta ya como 'pending'; el ack del server lo
      // reconcilia (upsertMessage por clientMsgId).
      const optimistic: ChatMessage = {
        id: `tmp-${clientMsgId}`,
        conversation_id: conversationId,
        sender_id: userId ?? 'me',
        body: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
        pending: true,
        clientMsgId,
      }
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimistic],
      }))
      send({
        type: 'chat.send',
        conversationId,
        clientMsgId,
        body: trimmed,
      })
    },
    [send, userId],
  )

  const markRead = useCallback(
    (conversationId: string, messageId: string) => {
      send({ type: 'chat.read', conversationId, messageId })
    },
    [send],
  )

  useEffect(() => {
    return () => {
      wantConnectedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      const ws = wsRef.current
      if (ws) {
        // Hardening 23-may auditoría: anular TODOS los handlers, no solo
        // onclose. Antes onerror/onmessage podían dispararse después del
        // unmount → setState post-unmount (warning + memory leak).
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        ws.onopen = null
        ws.close()
      }
    }
  }, [])

  return {
    status,
    userId,
    lastError,
    conversations,
    messages,
    presence,
    connect,
    disconnect,
    startConversation,
    sendMessage,
    markRead,
    loadHistory,
  }
}
