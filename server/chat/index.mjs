// server/chat/index.mjs
//
// Fase 4 — servidor de chat self-host (Node + ws). Proceso aparte del
// Next.js. Plan: docs/plan-fase4-chat.md (§0 self-host, §2.1 escalabilidad,
// §2.2/§2.3 seguridad). v1: 1-a-1 texto plano + read receipts + presencia.
//
// Estado de este fichero: ESQUELETO. Implementa el endurecimiento de
// entradas (§2.3 A/B) + protocolo tipado (puerta 3) + abstracciones de
// escala (§2.1). La PERSISTENCIA real y el GATING puerta 5 contra Supabase
// se cablean en el siguiente paso (marcados con TODO[fase4-next]); NO se
// finge que están hechos.
//
// Arranque: `npm run chat`. Env:
//   CHAT_PORT (def 8787) · CHAT_ALLOWED_ORIGIN (def http://localhost:3000)
//   NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY (para escrituras — paso siguiente)

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { WebSocketServer } from 'ws'
import { createClient } from '@supabase/supabase-js'

// Un proceso Node plano NO carga .env.local (eso lo hace Next). Cargador
// mínimo sin dependencias: NO sobreescribe variables ya presentes en el
// entorno real (prod usa env del sistema, no este fichero).
function loadDotEnvLocal() {
  try {
    const txt = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const eq = s.indexOf('=')
      if (eq === -1) continue
      const key = s.slice(0, eq).trim()
      let val = s.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (key && process.env[key] === undefined) process.env[key] = val
    }
  } catch {
    // En prod no hay .env.local: las env vienen del sistema. No es error.
  }
}
loadDotEnvLocal()

const PORT = Number(process.env.CHAT_PORT ?? 8787)
const ALLOWED_ORIGIN = process.env.CHAT_ALLOWED_ORIGIN ?? 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// Límites (§2.3). Conservadores; ajustables por env sin tocar código.
const MAX_CONN_PER_IP = Number(process.env.CHAT_MAX_CONN_PER_IP ?? 20)
const MAX_MSG_BYTES = Number(process.env.CHAT_MAX_MSG_BYTES ?? 8 * 1024)
const RL_WINDOW_MS = 10_000
const RL_MAX_MSGS = 20 // por usuario y ventana

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error(
    '[chat] FALTAN env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /\n' +
    '       SUPABASE_SERVICE_ROLE_KEY. Sin ellas no se arranca (fail-closed).\n' +
    '       Define las env (o .env.local en dev) y reintenta.',
  )
  process.exit(1)
}

// Cliente anon solo para VALIDAR el JWT del cliente (patrón H-1: la
// identidad sale del token validado, nunca del payload).
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Cliente service_role: ÚNICA vía de escritura (la RLS bloquea al cliente;
// el gating vive aquí, en el server — patrón consent_log).
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Store + gating (puerta 5) ──
async function isApprovedActor(userId) {
  const { data, error } = await db
    .from('actors').select('kyc_status').eq('user_id', userId).maybeSingle()
  return !error && data?.kyc_status === 'approved'
}
async function isParticipant(conversationId, userId) {
  const { data, error } = await db
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId).eq('user_id', userId).maybeSingle()
  return !error && !!data
}
async function participantsOf(conversationId) {
  const { data } = await db
    .from('conversation_participants')
    .select('user_id').eq('conversation_id', conversationId)
  return (data ?? []).map((r) => r.user_id)
}
// Conversación 1-a-1 existente entre A y B (intersección de pertenencias).
async function findDirectConversation(a, b) {
  const { data } = await db
    .from('conversation_participants').select('conversation_id').eq('user_id', a)
  for (const row of data ?? []) {
    const ps = await participantsOf(row.conversation_id)
    if (ps.length === 2 && ps.includes(a) && ps.includes(b)) return row.conversation_id
  }
  return null
}

// ── §2.1 Abstracciones de escala (puerta abierta, coste ~0) ──
// v1 = in-process. Pasar a N instancias = cambiar el backing (Redis
// pub/sub) sin tocar protocolo ni lógica.
class MessageBus {
  #subs = new Map() // userId -> Set<send>
  subscribe(userId, send) {
    if (!this.#subs.has(userId)) this.#subs.set(userId, new Set())
    this.#subs.get(userId).add(send)
  }
  unsubscribe(userId, send) {
    this.#subs.get(userId)?.delete(send)
    if (this.#subs.get(userId)?.size === 0) this.#subs.delete(userId)
  }
  deliver(userId, payload) {
    for (const send of this.#subs.get(userId) ?? []) send(payload)
  }
}
class PresenceStore {
  #online = new Map() // userId -> conn count
  // add/remove devuelven true SOLO en la transición real (0→1 / 1→0) para
  // no emitir presencia por cada pestaña extra del mismo usuario.
  add(userId) {
    const n = (this.#online.get(userId) ?? 0) + 1
    this.#online.set(userId, n)
    return n === 1
  }
  remove(userId) {
    const n = (this.#online.get(userId) ?? 1) - 1
    if (n <= 0) { this.#online.delete(userId); return true }
    this.#online.set(userId, n)
    return false
  }
  isOnline(userId) { return this.#online.has(userId) }
  onlineUserIds() { return [...this.#online.keys()] }
}
const bus = new MessageBus()
const presence = new PresenceStore()

// Presencia GLOBAL (decisión de producto 2026-05-17): cualquier actor
// AUTENTICADO ve el online/offline de cualquier otro. NO rompe el gating:
// ver presencia ≠ poder escribir (puerta 5 sigue independiente). Solo
// id opaco + booleano, sin contenido ni token (§2.3 D).
const liveConns = new Set() // closures sendRaw(str) activas, para broadcast
function broadcastPresence(userId, online) {
  const payload = JSON.stringify({ type: 'presence.update', userId, online })
  for (const sendRaw of liveConns) sendRaw(payload)
}

// ── Rate limit por usuario, ventana en memoria (v1 single-instance) ──
function makeWindowLimiter(windowMs, max) {
  const m = new Map()
  return (key) => {
    const now = Date.now()
    const arr = (m.get(key) ?? []).filter((t) => now - t < windowMs)
    arr.push(now)
    m.set(key, arr)
    return arr.length > max
  }
}
const rateLimited = makeWindowLimiter(RL_WINDOW_MS, RL_MAX_MSGS)
// Puerta 5: anti-contacto-en-frío — pocas conversaciones nuevas por emisor.
const convCreateLimited = makeWindowLimiter(60_000, 5)

const connPerIp = new Map()

// ── Validación estricta del envelope tipado (§2.3 B, puerta 3) ──
// Tipos v1: chat.send · chat.read · presence.ping. Reservado (no
// implementado, se rechaza explícito): rtc.signal → Fase 5 (vídeo).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v)
const HISTORY_MAX = 50 // §2.3 C: lectura paginada y acotada

function parseEnvelope(raw) {
  if (typeof raw !== 'string') return { error: 'binario no permitido' }
  if (Buffer.byteLength(raw, 'utf8') > MAX_MSG_BYTES) return { error: 'mensaje demasiado grande' }
  let msg
  try { msg = JSON.parse(raw) } catch { return { error: 'json inválido' } }
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return { error: 'envelope inválido' }
  }
  switch (msg.type) {
    case 'chat.start': // crea/recupera conversación 1-a-1 (gated)
      if (!isUuid(msg.recipientId)) return { error: 'chat.start mal formado' }
      return { msg }
    case 'chat.send':
      if (!isUuid(msg.conversationId) ||
          !isUuid(msg.clientMsgId) ||
          typeof msg.body !== 'string' ||
          msg.body.length < 1 || msg.body.length > 4000) {
        return { error: 'chat.send mal formado' }
      }
      return { msg }
    case 'chat.read':
      if (!isUuid(msg.conversationId) || !isUuid(msg.messageId)) {
        return { error: 'chat.read mal formado' }
      }
      return { msg }
    case 'chat.history':
      if (!isUuid(msg.conversationId)) return { error: 'chat.history mal formado' }
      return { msg }
    case 'presence.ping':
      return { msg }
    case 'presence.list': // snapshot inicial de quién está online
      return { msg }
    case 'conversations.list': // listado de mis conversaciones (v1: 1-a-1)
      return { msg }
    case 'rtc.signal':
      return { error: 'rtc.signal reservado para Fase 5, no implementado' }
    default:
      return { error: `tipo desconocido: ${msg.type}` }
  }
}

const httpServer = createServer((_req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' })
  res.end('Upgrade Required (WebSocket only)')
})

// noServer: hacemos el handshake/auth ANTES de aceptar el upgrade (§2.3 A).
const wss = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', async (req, socket, head) => {
  const ip = (req.socket.remoteAddress ?? '0.0.0.0')

  const reject = (code, reason) => {
    socket.write(`HTTP/1.1 ${code} ${reason}\r\n\r\n`)
    socket.destroy()
  }

  // Origin check (anti-CSWSH §2.3 A).
  if (req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return reject(403, 'Forbidden origin')
  }
  // Cap conexiones por IP.
  if ((connPerIp.get(ip) ?? 0) >= MAX_CONN_PER_IP) {
    return reject(429, 'Too many connections')
  }
  // Token vía subprotocolo `bearer, <token>` (no en la URL → no se loguea).
  const proto = req.headers['sec-websocket-protocol'] ?? ''
  const parts = proto.split(',').map((s) => s.trim())
  const token = parts[0] === 'bearer' ? parts[1] : null
  if (!token) return reject(401, 'Missing bearer subprotocol')

  // Identidad = JWT validado contra Supabase (patrón H-1), nunca del payload.
  let userId = null
  try {
    const { data, error } = await anon.auth.getUser(token)
    if (error || !data?.user) return reject(401, 'Invalid token')
    userId = data.user.id
  } catch {
    return reject(401, 'Auth error')
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    connPerIp.set(ip, (connPerIp.get(ip) ?? 0) + 1)
    onConnection(ws, { userId, ip })
  })
})

function onConnection(ws, ctx) {
  const send = (payload) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload))
  }
  const sendRaw = (str) => {
    if (ws.readyState === ws.OPEN) ws.send(str)
  }
  bus.subscribe(ctx.userId, send)
  liveConns.add(sendRaw)
  // Solo difundimos online si es la transición real (1ª conexión del user).
  if (presence.add(ctx.userId)) broadcastPresence(ctx.userId, true)
  send({ type: 'ready', userId: ctx.userId })

  ws.on('message', async (data, isBinary) => {
    if (isBinary) return ws.close(1003, 'binario no permitido')
    const { msg, error } = parseEnvelope(data.toString())
    if (error) return send({ type: 'error', error })
    if (rateLimited(ctx.userId)) return send({ type: 'error', error: 'rate limit' })

    try {
      if (msg.type === 'presence.ping') {
        return send({ type: 'presence.pong', t: Date.now() })
      }

      if (msg.type === 'presence.list') {
        return send({ type: 'presence.snapshot', online: presence.onlineUserIds() })
      }

      // conversations.list — mis conversaciones + interlocutor (v1: 1-a-1).
      // El servidor es la fuente de verdad de "con quién hablo"; el cliente
      // ya no depende de un recuerdo frágil en localStorage.
      if (msg.type === 'conversations.list') {
        const { data: mine } = await db
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', ctx.userId)
        const convIds = (mine ?? []).map((r) => r.conversation_id)
        if (convIds.length === 0) {
          return send({ type: 'conversations.snapshot', conversations: [] })
        }
        const { data: rows } = await db
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', convIds)
        // v1 1-a-1: el interlocutor es el participante que no soy yo.
        const peerByConv = new Map()
        for (const r of rows ?? []) {
          if (r.user_id !== ctx.userId) peerByConv.set(r.conversation_id, r.user_id)
        }
        const conversations = convIds.map((id) => ({
          id,
          peerId: peerByConv.get(id) ?? id,
        }))
        return send({ type: 'conversations.snapshot', conversations })
      }

      // chat.start — crea/recupera conversación 1-a-1 (PUERTA 5 aquí).
      if (msg.type === 'chat.start') {
        if (msg.recipientId === ctx.userId) {
          return send({ type: 'error', error: 'no puedes abrir contigo mismo' })
        }
        // Gating: ambos KYC-approved + rate-limit anti-contacto-en-frío.
        if (!(await isApprovedActor(ctx.userId)) ||
            !(await isApprovedActor(msg.recipientId))) {
          return send({ type: 'error', error: 'ambos actores deben estar aprobados (KYC)' })
        }
        if (convCreateLimited(ctx.userId)) {
          return send({ type: 'error', error: 'demasiadas conversaciones nuevas, espera' })
        }
        let convId = await findDirectConversation(ctx.userId, msg.recipientId)
        if (!convId) {
          const { data: conv, error: cErr } = await db
            .from('conversations').insert({ created_by: ctx.userId }).select('id').single()
          if (cErr) return send({ type: 'error', error: 'no se pudo crear la conversación' })
          convId = conv.id
          const { error: pErr } = await db.from('conversation_participants')
            .insert([
              { conversation_id: convId, user_id: ctx.userId },
              { conversation_id: convId, user_id: msg.recipientId },
            ])
          if (pErr) return send({ type: 'error', error: 'no se pudieron añadir participantes' })
        }
        return send({ type: 'chat.started', conversationId: convId })
      }

      // chat.send — solo si el emisor es participante (puerta 5 por mensaje).
      if (msg.type === 'chat.send') {
        if (!(await isParticipant(msg.conversationId, ctx.userId))) {
          return send({ type: 'error', error: 'no eres participante de esa conversación' })
        }
        let row
        const { data, error: iErr } = await db.from('messages').insert({
          conversation_id: msg.conversationId,
          sender_id: ctx.userId,
          client_msg_id: msg.clientMsgId,
          body: msg.body,
        }).select('id, conversation_id, sender_id, body, created_at, read_at').single()
        if (iErr) {
          if (iErr.code === '23505') {
            // Idempotencia: reintento del mismo clientMsgId → recuperar el ya guardado.
            const { data: dup } = await db.from('messages')
              .select('id, conversation_id, sender_id, body, created_at, read_at')
              .eq('conversation_id', msg.conversationId)
              .eq('sender_id', ctx.userId)
              .eq('client_msg_id', msg.clientMsgId).maybeSingle()
            row = dup
          } else {
            return send({ type: 'error', error: 'no se pudo guardar el mensaje' })
          }
        } else {
          row = data
        }
        if (!row) return send({ type: 'error', error: 'mensaje no disponible' })
        const evt = { type: 'chat.message', message: row }
        const others = (await participantsOf(msg.conversationId)).filter((u) => u !== ctx.userId)
        for (const u of others) bus.deliver(u, evt)
        return send({ ...evt, ack: msg.clientMsgId })
      }

      // chat.read — marca leído (solo el receptor, no el emisor).
      if (msg.type === 'chat.read') {
        if (!(await isParticipant(msg.conversationId, ctx.userId))) {
          return send({ type: 'error', error: 'no eres participante' })
        }
        const { data: m } = await db.from('messages')
          .select('id, sender_id, conversation_id')
          .eq('id', msg.messageId).eq('conversation_id', msg.conversationId).maybeSingle()
        if (!m || m.sender_id === ctx.userId) return // nada que marcar
        await db.from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', msg.messageId).is('read_at', null)
        bus.deliver(m.sender_id, {
          type: 'chat.read', conversationId: msg.conversationId, messageId: msg.messageId,
        })
        return
      }

      // chat.history — últimos N (paginado/acotado §2.3 C).
      if (msg.type === 'chat.history') {
        if (!(await isParticipant(msg.conversationId, ctx.userId))) {
          return send({ type: 'error', error: 'no eres participante' })
        }
        const { data } = await db.from('messages')
          .select('id, conversation_id, sender_id, body, created_at, read_at')
          .eq('conversation_id', msg.conversationId)
          .order('created_at', { ascending: false })
          .limit(HISTORY_MAX)
        return send({
          type: 'chat.history',
          conversationId: msg.conversationId,
          messages: (data ?? []).reverse(),
        })
      }
    } catch (e) {
      console.error('[chat] handler error:', e?.message ?? e)
      return send({ type: 'error', error: 'error interno' })
    }
  })

  ws.on('close', () => {
    bus.unsubscribe(ctx.userId, send)
    liveConns.delete(sendRaw)
    // Solo difundimos offline si era su última conexión (transición 1→0).
    if (presence.remove(ctx.userId)) broadcastPresence(ctx.userId, false)
    connPerIp.set(ctx.ip, Math.max(0, (connPerIp.get(ctx.ip) ?? 1) - 1))
  })
  ws.on('error', () => { /* swallow; close handler limpia */ })
}

httpServer.listen(PORT, () => {
  console.log(`[chat] WS server escuchando en :${PORT} (origin ${ALLOWED_ORIGIN})`)
})
