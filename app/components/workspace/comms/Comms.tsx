'use client'

/**
 * COMMS COMPARTIDO · cluster (chat · llamada · videollamada · reunión) + chat
 * drawer + Stage con AUDIO/VÍDEO REAL (WebRTC P2P portado de Artikalia). Lo monta
 * el DeskFrame, así que TODOS los escritorios config-driven comparten el mismo
 * correo de voz/vídeo/chat sin duplicarlo (decisión de José 16-jun, opción A).
 *
 * Real: tu cámara/micro funcionan de verdad (getUserMedia), controles de silenciar
 * /cámara/colgar, y conexión P2P entre dos participantes de la misma SALA vía
 * señalización Supabase Realtime (modo desplegado, sin servidor propio · STUN
 * gratis + TURN opcional). Honesto: salas grandes (3+) necesitan un SFU (LiveKit)
 * pendiente; aquí el P2P es 1-a-1 + grupos pequeños (ver localCall.ts).
 */

import { useEffect, useRef, useState } from 'react'
import { BG_RAISE, FONT, FONT_MONO, GREEN, HAIR, HAIR_STRONG, LILAC, MUTE, RED, TEXT, TEXT_DIM } from '../ui/tokens'
import { LocalCall, RealtimeSignaling, type CallKind, type CallPhase, type IncomingCall, type SignalState } from './localCall'

export type CommsChannel = 'chat' | 'call' | 'video' | 'meet'
export type StageKind = 'call' | 'video' | 'meet'

export interface CommsState {
  chatUnread: number
  chatFlash: boolean
  callRinging: boolean
  videoRinging: boolean
  meetRinging: boolean
  meetParticipants: number
}

const INITIAL: CommsState = { chatUnread: 0, chatFlash: false, callRinging: false, videoRinging: false, meetRinging: false, meetParticipants: 4 }

const KIND_MAP: Record<StageKind, CallKind> = { call: 'llamada', video: 'video', meet: 'reunion' }

function newId(): string {
  try { return crypto.randomUUID().slice(0, 8) } catch { return 'u' + String(Date.now() % 1e6) }
}

/** Estado + handlers del subsistema de comunicaciones, con WebRTC real. */
export function useComms(room = '1503:lobby') {
  const [state, setState] = useState<CommsState>(INITIAL)
  const [stage, setStage] = useState<StageKind | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<string[]>([])
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [phase, setPhase] = useState<CallPhase>('none')
  const [signal, setSignal] = useState<SignalState>('idle')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const callRef = useRef<LocalCall | null>(null)
  const myIdRef = useRef<string>('')

  function ensureCall(): LocalCall {
    if (callRef.current) return callRef.current
    myIdRef.current = newId()
    const call = new LocalCall(
      {
        onSignal: setSignal,
        onPeers: setPeers,
        onIncoming: setIncoming,
        onPhase: setPhase,
        onLocalStream: setLocalStream,
        onRemoteStream: setRemoteStream,
      },
      new RealtimeSignaling(room),
    )
    call.connect(myIdRef.current)
    callRef.current = call
    return call
  }

  function teardown() {
    callRef.current?.close()
    callRef.current = null
    setLocalStream(null); setRemoteStream(null); setPeers([]); setIncoming(null)
    setPhase('none'); setSignal('idle'); setMicOn(true); setCamOn(true)
  }

  useEffect(() => () => teardown(), []) // limpia al desmontar

  async function onCluster(ch: CommsChannel) {
    if (ch === 'chat') {
      setState((s) => ({ ...s, chatUnread: 0, chatFlash: false }))
      setChatOpen((v) => !v)
      return
    }
    setState((s) => ({ ...s, callRinging: false, videoRinging: false, meetRinging: false }))
    setStage(ch)
    const call = ensureCall()
    try { await call.startLocalMedia(KIND_MAP[ch]); setCamOn(ch !== 'call') } catch { /* sin permiso de cámara/micro */ }
  }

  function hangup() {
    callRef.current?.hangup()
    teardown()
    setStage(null)
  }
  function closeChat() { setChatOpen(false) }

  async function callPeer(id: string) {
    if (!stage) return
    try { await ensureCall().call(id, KIND_MAP[stage]) } catch { /* noop */ }
  }
  async function accept() { try { await callRef.current?.accept() } catch { /* noop */ } }
  function reject() { callRef.current?.reject() }
  function toggleMic() { const next = !micOn; setMicOn(next); callRef.current?.toggleMic(next) }
  function toggleCam() { const next = !camOn; setCamOn(next); callRef.current?.toggleCam(next) }

  return {
    state, stage, chatOpen, onCluster, hangup, closeChat,
    localStream, remoteStream, peers, incoming, phase, signal, micOn, camOn,
    callPeer, accept, reject, toggleMic, toggleCam,
  }
}
export type CommsApi = ReturnType<typeof useComms>

// ── Iconos ───────────────────────────────────────────────────────────────────
function svg(children: React.ReactNode) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}
const IconChat = () => svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />)
const IconPhone = () => svg(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />)
const IconVideo = () => svg(<><path d="m23 7-7 5 7 5z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>)
const IconUsers = () => svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>)
const IconMicOff = () => svg(<><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /></>)
const IconMic = () => svg(<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>)
const IconCamOff = () => svg(<><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></>)
const IconCam = () => svg(<><path d="m23 7-7 5 7 5z" /><rect x="1" y="5" width="15" height="14" rx="2" /></>)

// ── Cluster ──────────────────────────────────────────────────────────────────
function ClusterBtn({ title, icon, active, ringing, badge, onClick }: { title: string; icon: React.ReactNode; active?: boolean; ringing?: boolean; badge?: number; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className={ringing ? 'comms-ring' : undefined} style={{ position: 'relative', width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 9, cursor: 'pointer', border: `1px solid ${active ? GREEN : HAIR}`, background: active ? 'rgba(84,224,140,0.14)' : 'rgba(255,255,255,0.03)', color: active ? GREEN : TEXT_DIM }}>
      {icon}
      {badge ? <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 99, background: LILAC, color: '#1A1140', fontSize: '0.6rem', fontWeight: 700, display: 'grid', placeItems: 'center', fontFamily: FONT_MONO }}>{badge}</span> : null}
    </button>
  )
}

export function CommsCluster({ state, stage, chatOpen, onCluster }: { state: CommsState; stage: StageKind | null; chatOpen: boolean; onCluster: (ch: CommsChannel) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 4, border: `1px solid ${HAIR}`, borderRadius: 11, background: 'rgba(255,255,255,0.03)' }}>
      <ClusterBtn title="Mensajes" icon={<IconChat />} active={chatOpen} badge={state.chatUnread} onClick={() => onCluster('chat')} />
      <ClusterBtn title="Llamada" icon={<IconPhone />} active={stage === 'call'} ringing={state.callRinging} onClick={() => onCluster('call')} />
      <ClusterBtn title="Videollamada" icon={<IconVideo />} active={stage === 'video'} ringing={state.videoRinging} onClick={() => onCluster('video')} />
      <ClusterBtn title="Reunión" icon={<IconUsers />} active={stage === 'meet'} ringing={state.meetRinging} onClick={() => onCluster('meet')} />
    </div>
  )
}

// ── Chat drawer ──────────────────────────────────────────────────────────────
export function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <aside style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(360px, 90vw)', zIndex: 60, background: BG_RAISE, borderLeft: `1px solid ${HAIR_STRONG}`, fontFamily: FONT, color: TEXT, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${HAIR}` }}>
        <span style={{ fontWeight: 600 }}>Mensajes</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
      </header>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>💬</div>
          <div style={{ fontSize: '0.9rem', color: TEXT, marginBottom: 6 }}>Chat interno del escritorio</div>
          <div style={{ fontSize: '0.8rem', color: MUTE, lineHeight: 1.6, maxWidth: 260 }}>La mensajería de texto en tiempo real se conecta con la infraestructura de comunicaciones. El correo interno (bandeja) vive en el módulo «Mensajes».</div>
        </div>
      </div>
    </aside>
  )
}

// ── Tile de vídeo (adjunta MediaStream al <video>) ───────────────────────────
function VideoTile({ stream, muted, label, mirror }: { stream: MediaStream | null; muted?: boolean; label: string; mirror?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream
  }, [stream])
  const hasVideo = Boolean(stream && stream.getVideoTracks().some((t) => t.enabled))
  return (
    <div style={{ position: 'relative', borderRadius: 14, border: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.02)', overflow: 'hidden', minHeight: 160, display: 'grid', placeItems: 'center' }}>
      <video ref={ref} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: mirror ? 'scaleX(-1)' : undefined, display: hasVideo ? 'block' : 'none' }} />
      {!hasVideo ? (
        <div style={{ textAlign: 'center', color: MUTE }}>
          <div style={{ width: 46, height: 46, borderRadius: 99, background: 'rgba(185,164,255,0.12)', color: LILAC, display: 'grid', placeItems: 'center', margin: '0 auto 8px', fontFamily: FONT_MONO }}>{label.slice(0, 2).toUpperCase()}</div>
          <div style={{ fontSize: '0.72rem' }}>{label}</div>
        </div>
      ) : null}
      <span style={{ position: 'absolute', left: 10, bottom: 10, fontSize: '0.66rem', color: TEXT, background: 'rgba(0,0,0,0.45)', padding: '2px 8px', borderRadius: 6, fontFamily: FONT_MONO }}>{label}</span>
    </div>
  )
}

function CtrlBtn({ on, title, onIcon, offIcon, onClick, danger }: { on?: boolean; title: string; onIcon: React.ReactNode; offIcon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 48, height: 48, borderRadius: 99, border: `1px solid ${on === false ? RED : HAIR}`, background: danger ? RED : on === false ? 'rgba(224,133,126,0.16)' : 'rgba(255,255,255,0.05)', color: danger ? '#1a0a08' : on === false ? RED : TEXT, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
      {on === false ? offIcon : onIcon}
    </button>
  )
}

// ── Stage (overlay de llamada/vídeo/reunión, con media real) ─────────────────
export function CallStage({ api }: { api: CommsApi }) {
  const { stage, localStream, remoteStream, peers, incoming, phase, signal, micOn, camOn } = api
  if (!stage) return null
  const label = stage === 'call' ? 'Llamada' : stage === 'video' ? 'Videollamada' : 'Reunión'
  const connected = phase === 'in-call'
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(6,8,12,0.94)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', fontFamily: FONT, color: TEXT }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: signal === 'online' ? GREEN : MUTE, boxShadow: signal === 'online' ? `0 0 8px ${GREEN}` : undefined }} />
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '0.7rem', color: MUTE, fontFamily: FONT_MONO }}>· {connected ? 'conectado' : phase === 'calling' || phase === 'connecting' ? 'conectando…' : 'sala'}</span>
        </div>
        <span style={{ fontSize: '0.64rem', color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.08em', textTransform: 'uppercase' }}>P2P · {signal === 'online' ? 'señalización activa' : 'sin señalización'}</span>
      </header>

      {incoming ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${HAIR}` }}>
          <span style={{ fontSize: '0.84rem' }}>Llamada entrante de <strong>{incoming.from}</strong></span>
          <button onClick={api.accept} className="dk-chip" style={{ borderColor: GREEN, color: GREEN }}>Aceptar</button>
          <button onClick={api.reject} className="dk-chip" style={{ borderColor: RED, color: RED }}>Rechazar</button>
        </div>
      ) : null}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: connected ? 'repeat(2, 1fr)' : '1fr', gap: 12, padding: 22 }}>
        <VideoTile stream={localStream} muted label="Tú" mirror />
        {connected ? <VideoTile stream={remoteStream} label="Participante" /> : null}
      </div>

      {!connected && peers.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: TEXT_DIM }}>En la sala:</span>
          {peers.map((p) => (
            <button key={p} onClick={() => api.callPeer(p)} className="dk-chip" style={{ borderColor: LILAC, color: LILAC }}>Llamar a {p}</button>
          ))}
        </div>
      ) : null}
      {!connected && peers.length === 0 ? (
        <div style={{ textAlign: 'center', paddingBottom: 8, fontSize: '0.74rem', color: MUTE }}>Tu cámara/micro están activos. Esperando a que otro participante entre en esta sala…</div>
      ) : null}

      <footer style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '14px 0 26px' }}>
        <CtrlBtn on={micOn} title={micOn ? 'Silenciar micro' : 'Activar micro'} onIcon={<IconMic />} offIcon={<IconMicOff />} onClick={api.toggleMic} />
        {stage !== 'call' ? <CtrlBtn on={camOn} title={camOn ? 'Apagar cámara' : 'Encender cámara'} onIcon={<IconCam />} offIcon={<IconCamOff />} onClick={api.toggleCam} /> : null}
        <CtrlBtn danger title="Colgar" onIcon={<IconPhone />} offIcon={<IconPhone />} onClick={api.hangup} />
      </footer>
    </div>
  )
}
