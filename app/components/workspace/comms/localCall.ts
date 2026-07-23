// Cliente de llamada WebRTC P2P (1-a-1) · PORTADO DE ARTIKALIA (verificado "acabado").
//
// El audio/vídeo va SIEMPRE directo entre los dos navegadores (P2P). Lo único
// que cambia es la SEÑALIZACIÓN (el handshake para encontrarse):
//
//   · WebSocketSignaling → servidor local (wss:3001). Modo LAN soberano: en la
//     misma WiFi basta con candidatos ICE "host" (sin internet, sin nube).
//   · RealtimeSignaling  → Supabase Realtime (broadcast + presence). Modo
//     DESPLEGADO: dos dispositivos en redes distintas se encuentran por una
//     "sala" compartida, sin montar ni pagar un servidor propio. Para cruzar
//     NAT se usan STUN (gratis) y, si se configura, TURN (ver defaultRtcConfig).
//
// Cuando 1503 levante su LiveKit SFU, las salas grandes migran allí; este P2P
// se queda para 1-a-1 y grupos pequeños.
//
// Única adaptación respecto a Artikalia: usa el cliente Supabase singleton de
// 1503 (app/lib/supabase) en vez de un createClient() propio.
//
// Solo navegador (usa WebSocket / RTCPeerConnection / getUserMedia).
'use client'

import { supabase } from '../../../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type CallKind = 'llamada' | 'video' | 'reunion'

export type SignalState = 'idle' | 'connecting' | 'online' | 'offline'
export type CallPhase = 'none' | 'calling' | 'ringing' | 'connecting' | 'in-call' | 'ended'

export interface IncomingCall {
  from: string
  kind: CallKind
}

export interface LocalCallHandlers {
  onSignal?: (s: SignalState) => void
  onPeers?: (ids: string[]) => void
  onIncoming?: (c: IncomingCall | null) => void
  onPhase?: (p: CallPhase) => void
  onLocalStream?: (s: MediaStream | null) => void
  onRemoteStream?: (s: MediaStream | null) => void
}

export interface SignalMsg {
  t: string
  to?: string
  from?: string
  id?: string
  kind?: CallKind
  ids?: string[]
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

// ── Transporte de señalización (enchufable) ───────────────────────────────
export interface Signaling {
  connect(
    myId: string,
    onMsg: (m: SignalMsg) => void,
    onSignal: (s: SignalState) => void,
    onPeers: (ids: string[]) => void,
  ): void
  send(m: SignalMsg): void
  close(): void
}

// Servidor de señalización por WebSocket (modo LAN soberano).
export class WebSocketSignaling implements Signaling {
  private ws: WebSocket | null = null
  constructor(private url: string) {}

  connect(myId: string, onMsg: (m: SignalMsg) => void, onSignal: (s: SignalState) => void, onPeers: (ids: string[]) => void) {
    onSignal('connecting')
    let ws: WebSocket
    try { ws = new WebSocket(this.url) } catch { onSignal('offline'); return }
    this.ws = ws
    ws.onopen = () => { this.send({ t: 'hello', id: myId }); onSignal('online') }
    ws.onclose = () => onSignal('offline')
    ws.onerror = () => onSignal('offline')
    ws.onmessage = (e) => {
      const m = JSON.parse(typeof e.data === 'string' ? e.data : '') as SignalMsg
      if (m.t === 'peers') onPeers((m.ids ?? []).filter((i) => i !== myId))
      else onMsg(m)
    }
  }

  send(m: SignalMsg) { try { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)) } catch { /* noop */ } }
  close() { try { this.ws?.close() } catch { /* noop */ } this.ws = null }
}

// Señalización por Supabase Realtime (modo desplegado, sin servidor propio).
// presence → lista de participantes en la sala · broadcast → handshake SDP/ICE.
export class RealtimeSignaling implements Signaling {
  private channel: RealtimeChannel | null = null
  private myId = ''
  constructor(private room: string) {}

  connect(myId: string, onMsg: (m: SignalMsg) => void, onSignal: (s: SignalState) => void, onPeers: (ids: string[]) => void) {
    this.myId = myId
    onSignal('connecting')
    const channel = supabase.channel(`call:${this.room}`, {
      config: { presence: { key: myId }, broadcast: { self: false } },
    })
    this.channel = channel

    channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const m = payload as SignalMsg
      if (m.from === myId) return // eco de uno mismo
      if (m.to && m.to !== myId) return // no va dirigido a mí
      onMsg(m)
    })

    const emitPeers = () => {
      const state = channel.presenceState()
      onPeers(Object.keys(state).filter((id) => id !== myId))
    }
    channel.on('presence', { event: 'sync' }, emitPeers)
    channel.on('presence', { event: 'join' }, emitPeers)
    channel.on('presence', { event: 'leave' }, emitPeers)

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSignal('online')
        void channel.track({ id: myId })
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onSignal('offline')
      }
    })
  }

  send(m: SignalMsg) {
    if (!this.channel) return
    // En broadcast el receptor no sabe quién envía: inyectamos `from`.
    void this.channel.send({ type: 'broadcast', event: 'signal', payload: { ...m, from: m.from ?? this.myId } })
  }

  close() {
    if (this.channel) { void this.channel.unsubscribe(); this.channel = null }
  }
}

// ── Configuración ICE ──────────────────────────────────────────────────────
// Desplegado: STUN público (gratis) para descubrir la IP pública + TURN si se
// configura por entorno (necesario para redes con NAT simétrico/CGNAT).
export function defaultRtcConfig(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ]
  const turn = process.env.NEXT_PUBLIC_TURN_URL
  if (turn) {
    iceServers.push({
      urls: turn.split(',').map((s) => s.trim()).filter(Boolean),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    })
  }
  return { iceServers }
}

// LAN soberana: sin servidores ICE (solo candidatos host, 0 internet).
export const LAN_ONLY_CONFIG: RTCConfiguration = { iceServers: [] }

export class LocalCall {
  private pc: RTCPeerConnection | null = null
  private local: MediaStream | null = null
  private remote: MediaStream | null = null
  private peer: string | null = null
  private kind: CallKind = 'video'

  myId = ''
  signal: SignalState = 'idle'
  phase: CallPhase = 'none'

  constructor(
    private h: LocalCallHandlers,
    private signaling: Signaling,
    private rtcConfig: RTCConfiguration = defaultRtcConfig(),
  ) {}

  private setSignal(s: SignalState) { this.signal = s; this.h.onSignal?.(s) }
  private setPhase(p: CallPhase) { this.phase = p; this.h.onPhase?.(p) }
  private send(o: SignalMsg) { this.signaling.send(o) }

  // ── Conexión a la señalización ─────────────────────────────────────────
  connect(myId: string) {
    this.myId = myId
    this.signaling.connect(
      myId,
      (m) => { void this.onMsg(m) },
      (s) => this.setSignal(s),
      (ids) => this.h.onPeers?.(ids),
    )
  }

  private async onMsg(m: SignalMsg) {
    switch (m.t) {
      case 'invite':
        if (this.phase !== 'none' && this.phase !== 'ended') { if (m.from) this.send({ t: 'reject', to: m.from }); break }
        this.peer = m.from ?? null
        this.kind = m.kind ?? 'video'
        this.h.onIncoming?.({ from: this.peer ?? '', kind: this.kind })
        this.setPhase('ringing')
        break
      case 'accept':
        // El destinatario aceptó → el que llama crea la oferta.
        await this.makeOffer()
        break
      case 'unavailable':
      case 'reject':
      case 'bye':
        this.endLocal()
        this.setPhase('ended')
        break
      case 'sdp':
        if (!m.sdp) break
        await this.ensurePc()
        await this.pc!.setRemoteDescription(m.sdp)
        if (m.sdp.type === 'offer') {
          const ans = await this.pc!.createAnswer()
          await this.pc!.setLocalDescription(ans)
          this.send({ t: 'sdp', to: this.peer ?? undefined, sdp: ans })
        }
        break
      case 'ice':
        if (m.candidate) { try { await this.pc?.addIceCandidate(m.candidate) } catch { /* candidato tardío */ } }
        break
    }
  }

  // ── Llamar / aceptar / rechazar / colgar ──────────────────────────────
  async call(targetId: string, kind: CallKind) {
    this.peer = targetId
    this.kind = kind
    await this.getMedia(kind)
    this.setPhase('calling')
    this.send({ t: 'invite', to: targetId, kind })
  }

  async accept() {
    if (!this.peer) return
    await this.getMedia(this.kind)
    await this.ensurePc() // listo para recibir la oferta del que llama
    this.h.onIncoming?.(null)
    this.setPhase('connecting')
    this.send({ t: 'accept', to: this.peer })
  }

  reject() {
    if (this.peer) this.send({ t: 'reject', to: this.peer })
    this.h.onIncoming?.(null)
    this.endLocal()
    this.setPhase('none')
  }

  hangup() {
    if (this.peer) this.send({ t: 'bye', to: this.peer })
    this.endLocal()
    this.setPhase('none')
  }

  toggleMic(on: boolean) { this.local?.getAudioTracks().forEach((t) => (t.enabled = on)) }
  toggleCam(on: boolean) { this.local?.getVideoTracks().forEach((t) => (t.enabled = on)) }

  // ── Internos ──────────────────────────────────────────────────────────
  private async getMedia(kind: CallKind) {
    if (this.local) return this.local
    this.local = await navigator.mediaDevices.getUserMedia({ video: kind !== 'llamada', audio: true })
    this.h.onLocalStream?.(this.local)
    return this.local
  }

  private async ensurePc() {
    if (this.pc) return this.pc
    const pc = new RTCPeerConnection(this.rtcConfig)
    this.pc = pc
    this.remote = new MediaStream()
    this.h.onRemoteStream?.(this.remote)
    this.local?.getTracks().forEach((t) => pc.addTrack(t, this.local as MediaStream))
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => this.remote?.addTrack(t))
      this.h.onRemoteStream?.(this.remote)
      this.setPhase('in-call')
    }
    pc.onicecandidate = (e) => { if (e.candidate) this.send({ t: 'ice', to: this.peer ?? undefined, candidate: e.candidate.toJSON() }) }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') this.setPhase('in-call')
      else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') { this.endLocal(); this.setPhase('ended') }
    }
    return pc
  }

  private async makeOffer() {
    await this.ensurePc()
    const offer = await this.pc!.createOffer()
    await this.pc!.setLocalDescription(offer)
    this.send({ t: 'sdp', to: this.peer ?? undefined, sdp: offer })
    this.setPhase('connecting')
  }

  private endLocal() {
    try { this.pc?.close() } catch { /* noop */ }
    this.pc = null
    this.local?.getTracks().forEach((t) => t.stop())
    this.local = null
    this.h.onLocalStream?.(null)
    this.remote = null
    this.h.onRemoteStream?.(null)
    this.peer = null
  }

  close() {
    this.endLocal()
    this.signaling.close()
  }

  /** Inicia (o reusa) tu media local sin llamar a nadie aún — para previsualizar
      tu cámara/micro en cuanto se abre el Stage. */
  async startLocalMedia(kind: CallKind) {
    return this.getMedia(kind)
  }
}

// URL del servidor de señalización WebSocket a partir de la ubicación actual.
// https → wss (obligatorio para no romper "contexto seguro"); http → ws.
export function signalUrlFromLocation(port = 3001): string {
  if (typeof window === 'undefined') return ''
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.hostname}:${port}`
}
