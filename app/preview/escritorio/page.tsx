'use client'

/**
 * PROTOTIPO de dirección visual — "dashboard digno" oscuro-PRO tecnológico.
 *
 * Iteración 2: piel TECH (botones con corte + barrido de luz, ventanas con
 * corner-brackets de instrumento, rejilla sutil) + módulo CARGA DE CONTENEDOR
 * (contenedor isométrico que se llena de bultos con su DPP + gauge de cubicaje
 * + mapa de carga).
 *
 * Superficie aislada y desechable: NO toca WorkspaceShell. Datos de muestra.
 * Vídeo de fondo reutilizado de /public/videos/port-cargo-ships.mp4.
 */

import Link from 'next/link'
import { useState } from 'react'

// ── Paleta oscuro-PRO ───────────────────────────────────────────────────────
const INK = '#0A0E16'
const GOLD = '#F0B429'
const TEAL = '#2FD2C9'
const TEXT = '#E8EDF5'
const MUTE = '#8A98AD'
const FAINT = '#5A6678'
const LINE = 'rgba(255,255,255,0.08)'

// ── Presets de intensidad del fondo de vídeo ────────────────────────────────
const INTENSITIES = {
  inmersivo: { label: 'Inmersivo', scrimTop: 0.35, scrimBottom: 0.62, videoBright: 0.92, blur: 0 },
  entrada: { label: 'Entrada', scrimTop: 0.55, scrimBottom: 0.8, videoBright: 0.62, blur: 1.5 },
  calma: { label: 'Calma', scrimTop: 0.86, scrimBottom: 0.95, videoBright: 0.32, blur: 4 },
} as const
type IntensityKey = keyof typeof INTENSITIES

const NAV = [
  { id: 'resumen', label: 'Resumen', icon: '◧' },
  { id: 'buscador', label: 'Buscador', icon: '⌕' },
  { id: 'actores', label: 'Actores', icon: '◍' },
  { id: 'catalogo', label: 'Catálogo', icon: '▦' },
  { id: 'mi-catalogo', label: 'Mi catálogo', icon: '↥' },
  { id: 'carga', label: 'Carga de contenedor', icon: '▤' },
  { id: 'cumplimiento', label: 'Cumplimiento DPP', icon: '◈' },
  { id: 'escrow', label: 'Escrow', icon: '⬡' },
  { id: 'archivos', label: 'Documentos', icon: '▭' },
  { id: 'mensajes', label: 'Mensajes', icon: '✉' },
  { id: 'agenda', label: 'Agenda', icon: '◷' },
  { id: 'identidad', label: 'Identidad · Actor-ID', icon: '⊙' },
] as const

const KPIS = [
  { idx: '01', num: '1.200+', label: 'Empresas conectadas', delta: '+48 este mes', up: true },
  { idx: '02', num: '8.400+', label: 'Productos con DPP', delta: '+312', up: true },
  { idx: '03', num: '0,5%', label: 'Comisión por operación', delta: 'sin tarifas ocultas', up: true },
  { idx: '04', num: '11/11', label: 'Sectores con gate legal', delta: 'enforcement activo', up: true },
]

const CATALOGO = [
  { name: 'Cocinas', count: 284 },
  { name: 'Puertas de interior', count: 198 },
  { name: 'Suelos y parquets', count: 312 },
  { name: 'Mobiliario', count: 560 },
  { name: 'Armarios', count: 176 },
  { name: 'Ventanas', count: 231 },
]

export default function PreviewEscritorioPage() {
  const [tab, setTab] = useState<string>('carga')
  const [intensity, setIntensity] = useState<IntensityKey>('inmersivo')
  const [opacity, setOpacity] = useState<number>(100)
  const [playing, setPlaying] = useState(true)
  const [comms, setComms] = useState<null | 'video' | 'audio' | 'meeting'>(null)
  const cfg = INTENSITIES[intensity]
  const k = opacity / 100

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        color: TEXT,
        background: INK,
      }}
    >
      <StyleBlock />

      {/* ── Fondo de VÍDEO HD ─────────────────────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        ref={(el) => {
          if (el) {
            if (playing) el.play().catch(() => {})
            else el.pause()
          }
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: `brightness(${cfg.videoBright}) saturate(0.9) blur(${cfg.blur}px)`,
          transition: 'filter 0.6s ease',
          transform: 'scale(1.04)',
        }}
      >
        <source src="/videos/port-cargo-ships.mp4" type="video/mp4" />
      </video>

      {/* Velo de legibilidad */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg,
            rgba(7,10,18,${cfg.scrimTop * k}) 0%,
            rgba(7,10,18,${(cfg.scrimTop + 0.05) * k}) 35%,
            rgba(7,10,18,${cfg.scrimBottom * k}) 100%)`,
          transition: 'background 0.6s ease',
        }}
      />
      {/* Rejilla técnica muy sutil */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(120% 120% at 50% 40%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(120% 120% at 50% 40%, black 40%, transparent 90%)',
          pointerEvents: 'none',
        }}
      />
      {/* Viñeta */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 120% at 50% 30%, transparent 50%, rgba(5,7,12,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layout ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', zIndex: 2 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 252,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '22px 16px',
            background: 'rgba(10,14,22,0.55)',
            backdropFilter: 'blur(18px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
            borderRight: `1px solid ${LINE}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 22px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `linear-gradient(145deg, ${GOLD}, #C98A12)`,
                boxShadow: '0 4px 14px rgba(240,180,41,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
                display: 'grid',
                placeItems: 'center',
                color: '#1A1206',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              P
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.01em' }}>1503</div>
              <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.18em' }}>
                INMOBILIARIO
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV.map((n) => {
              const active = tab === n.id
              return (
                <button key={n.id} className="pmx-nav" data-active={active} onClick={() => setTab(n.id)}>
                  <span className="pmx-nav-bar" />
                  <span style={{ fontSize: 16, color: active ? GOLD : FAINT, width: 18 }}>{n.icon}</span>
                  {n.label}
                </button>
              )
            })}
          </nav>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${LINE}`, background: 'rgba(63,185,80,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#7EE0A0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 8px #3FB950' }} />
                KYC verificado
              </div>
              <div style={{ fontSize: 11, color: FAINT, marginTop: 4 }}>Maderas del Levante S.L.</div>
            </div>
            <Link href="/demo" style={{ fontSize: 11.5, color: FAINT, textDecoration: 'none', padding: '0 4px' }}>
              ← volver a demo
            </Link>
          </div>
        </aside>

        {/* Columna principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header
            style={{
              height: 66,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '0 26px',
              borderBottom: `1px solid ${LINE}`,
              background: 'rgba(10,14,22,0.4)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em' }}>{NAV.find((n) => n.id === tab)?.label}</div>
              <div style={{ fontSize: 11.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>workspace · sector inmobiliario</div>
            </div>
            <div style={{ flex: 1 }} />
            <div className="pmx-search">
              <span style={{ color: FAINT, fontSize: 14 }}>⌕</span>
              <span style={{ color: FAINT, fontSize: 13 }}>Buscar productos, empresas…</span>
            </div>
            {/* Comunicaciones: llamada / vídeo / reunión */}
            <button className="pmx-icbtn" title="Llamada" onClick={() => setComms('audio')}>☎</button>
            <button className="pmx-icbtn" title="Videollamada" onClick={() => setComms('video')}>▶</button>
            <button className="pmx-icbtn" title="Reunión (amplio)" onClick={() => setComms('meeting')}>◰</button>
            {/* Actor-ID + presencia */}
            <div className="pmx-actorid" title="Identidad del Actor (Actor-ID)">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 8px #3FB950' }} />
              <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 11.5, color: MUTE }}>ACT·7F3A·2026</span>
            </div>
            <PrimaryButton>+ Nueva ficha</PrimaryButton>
          </header>

          <main style={{ flex: 1, overflow: 'auto', padding: '26px 26px 120px' }}>
            <DemoTag />
            {tab === 'resumen' && <ResumenTab />}
            {tab === 'buscador' && <BuscadorTab onMessage={() => setTab('mensajes')} />}
            {tab === 'identidad' && <IdentidadTab />}
            {tab === 'actores' && <ActoresTab onMessage={() => setTab('mensajes')} onCall={() => setComms('video')} />}
            {tab === 'catalogo' && <CatalogoTab />}
            {tab === 'mi-catalogo' && <MiCatalogoTab />}
            {tab === 'carga' && <CargaTab />}
            {tab === 'cumplimiento' && <CumplimientoTab />}
            {tab === 'escrow' && <EscrowTab />}
            {tab === 'archivos' && <ArchivosTab />}
            {tab === 'mensajes' && <MensajesTab onCall={() => setComms('video')} />}
            {tab === 'agenda' && <AgendaTab onCall={() => setComms('video')} />}
          </main>
        </div>
      </div>

      {comms && <CommsPanel mode={comms} onClose={() => setComms(null)} onSwitch={setComms} />}

      {/* ── Control de intensidad ────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          zIndex: 50,
          width: 268,
          padding: '15px 16px',
          borderRadius: 16,
          background: 'rgba(10,14,22,0.78)',
          backdropFilter: 'blur(22px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
          border: `1px solid ${LINE}`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '0.22em', color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>FONDO DE VÍDEO</span>
          <button className="pmx-mini" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 13 }}>
          {(Object.keys(INTENSITIES) as IntensityKey[]).map((key) => (
            <button key={key} className="pmx-seg" data-active={intensity === key} onClick={() => setIntensity(key)}>
              {INTENSITIES[key].label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', width: 30 }}>VELO</span>
          <input type="range" min={40} max={130} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="pmx-range" style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  )
}

// ── TAB · Carga de contenedor ────────────────────────────────────────────────

const LOTES = [
  { id: 'A', name: 'Cocinas roble', dpp: 'DPP-8841', bultos: 9, top: '#5FE6DD', left: '#2FD2C9', right: '#1C9A93' },
  { id: 'B', name: 'Suelos parquet', dpp: 'DPP-8842', bultos: 8, top: '#7FB8FF', left: '#4C9AFF', right: '#2E6FCC' },
  { id: 'C', name: 'Armarios', dpp: 'DPP-8843', bultos: 8, top: '#FFD166', left: '#F0B429', right: '#C2901A' },
  { id: 'D', name: 'Ventanas PVC', dpp: 'DPP-8844', bultos: 8, top: '#BCB0FF', left: '#9A8CFF', right: '#6E62C7' },
]

function CargaTab() {
  const [hl, setHl] = useState<string | null>(null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, alignItems: 'start' }}>
      <TechCard eyebrow="◢ CONTENEDOR · 40' HC" title="Pedido #PM-2207 · plan de estiba">
        <ContainerIso highlight={hl} />
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
          {LOTES.map((l) => (
            <div
              key={l.id}
              onMouseEnter={() => setHl(l.id)}
              onMouseLeave={() => setHl(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                cursor: 'default',
                opacity: hl && hl !== l.id ? 0.4 : 1,
                transition: 'opacity .2s',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.left, boxShadow: `inset 0 2px 0 ${l.top}` }} />
              <span style={{ color: MUTE }}>{l.name}</span>
              <span style={{ color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{l.dpp}</span>
            </div>
          ))}
        </div>
      </TechCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TechCard eyebrow="◢ CUBICAJE" title="Ocupación del contenedor">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Gauge pct={78} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <Metric label="Volumen" value="59,4 / 76,3 m³" />
              <Metric label="Peso" value="18.240 kg" />
              <Metric label="Bultos" value="33 de 4 lotes" />
            </div>
          </div>
        </TechCard>

        <TechCard eyebrow="◢ MULTI-VENDOR" title="Reparto por lote">
          {LOTES.map((l, i) => (
            <div
              key={l.id}
              onMouseEnter={() => setHl(l.id)}
              onMouseLeave={() => setHl(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '10px 8px',
                margin: '0 -8px',
                borderRadius: 8,
                cursor: 'default',
                background: hl === l.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderBottom: i < LOTES.length - 1 ? `1px solid ${LINE}` : 'none',
                transition: 'background .15s',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: l.left, boxShadow: hl === l.id ? `0 0 8px ${l.left}` : 'none' }} />
              <span style={{ flex: 1, fontSize: 13 }}>{l.name}</span>
              <span style={{ fontSize: 12, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{l.bultos} bultos</span>
            </div>
          ))}
          <div style={{ marginTop: 14, display: 'flex', gap: 9 }}>
            <PrimaryButton full>Generar mapa de carga (PDF)</PrimaryButton>
          </div>
        </TechCard>
      </div>
    </div>
  )
}

// Contenedor isométrico SVG con bultos que se cargan (animados) + resaltado por lote.
// Geometría: el SUELO es el plano base; los bultos se apilan HACIA ARRIBA desde él.
function ContainerIso({ highlight }: { highlight: string | null }) {
  const COLS = 6
  const ROWS = 3
  const hw = 22
  const hh = 11
  const bh = 26
  const ox = 250
  const oy = 96

  // Vértices de la retícula del suelo (lattice de esquinas de celda).
  const gp = (c: number, r: number) => ({ x: ox + (c - r) * hw, y: oy + (c + r) * hh })
  const STEEL = 'rgba(150,170,194,0.55)'
  const wallH = bh * 2 + 14

  // 4 esquinas del suelo
  const cBack = gp(0, 0)
  const cRight = gp(COLS, 0)
  const cFront = gp(COLS, ROWS)
  const cLeft = gp(0, ROWS)
  const floor = `${cBack.x},${cBack.y} ${cRight.x},${cRight.y} ${cFront.x},${cFront.y} ${cLeft.x},${cLeft.y}`

  // Bultos: capa 0 completa (18) + capa 1 parcial (15) = 33, con hueco al frente.
  type Box = { c: number; r: number; z: number }
  const boxes: Box[] = []
  for (let z = 0; z < 2; z++) {
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (z === 1 && c >= 5) continue // columna delantera sin segunda altura → hueco visible
        boxes.push({ c, r, z })
      }
    }
  }
  // Pintor: celdas de atrás (menor c+r) primero; dentro de la celda, capa baja antes.
  boxes.sort((a, b) => a.c + a.r - (b.c + b.r) || a.z - b.z)
  const loteOf = (i: number) => LOTES[Math.min(LOTES.length - 1, Math.floor(i / 9))]

  // Cuboide que se apoya en la celda (c,r) a la altura de apilado z, creciendo hacia arriba.
  const cuboid = (c: number, r: number, z: number) => {
    const base = gp(c, r) // vértice superior del rombo de la base de la celda
    const px = base.x
    const py = base.y - z * bh // subir según altura de apilado
    // base (rombo sobre el suelo, ya elevado por z)
    const A = { x: px, y: py }
    const B = { x: px + hw, y: py + hh }
    const C = { x: px, y: py + 2 * hh }
    const D = { x: px - hw, y: py + hh }
    // tapa (subida bh)
    const At = { x: px, y: py - bh }
    const Bt = { x: px + hw, y: py + hh - bh }
    const Ct = { x: px, y: py + 2 * hh - bh }
    const Dt = { x: px - hw, y: py + hh - bh }
    return {
      top: `${At.x},${At.y} ${Bt.x},${Bt.y} ${Ct.x},${Ct.y} ${Dt.x},${Dt.y}`,
      left: `${Dt.x},${Dt.y} ${Ct.x},${Ct.y} ${C.x},${C.y} ${D.x},${D.y}`,
      right: `${Ct.x},${Ct.y} ${Bt.x},${Bt.y} ${B.x},${B.y} ${C.x},${C.y}`,
    }
  }

  // Rejilla de estiba
  const grid: React.ReactElement[] = []
  for (let c = 0; c <= COLS; c++) {
    const p = gp(c, 0), q = gp(c, ROWS)
    grid.push(<line key={`gc${c}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(47,210,201,0.16)" strokeWidth="0.6" />)
  }
  for (let r = 0; r <= ROWS; r++) {
    const p = gp(0, r), q = gp(COLS, r)
    grid.push(<line key={`gr${r}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(47,210,201,0.16)" strokeWidth="0.6" />)
  }

  // Corrugado de la pared derecha (cBack→cRight)
  const corr: React.ReactElement[] = []
  const steps = 14
  for (let s = 1; s < steps; s++) {
    const t = s / steps
    const x = cBack.x + (cRight.x - cBack.x) * t
    const y = cBack.y + (cRight.y - cBack.y) * t
    corr.push(<line key={`cr${s}`} x1={x} y1={y} x2={x} y2={y - wallH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)
  }

  const post = (p: { x: number; y: number }, key: string) => (
    <line key={key} x1={p.x} y1={p.y} x2={p.x} y2={p.y - wallH} stroke={STEEL} strokeWidth="2.4" />
  )

  return (
    <svg viewBox="0 0 560 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* sombra de contacto */}
      <ellipse cx={(cBack.x + cFront.x) / 2} cy={cFront.y + 6} rx={150} ry={40} fill="rgba(0,0,0,0.4)" />

      {/* paredes traseras (detrás de la carga) */}
      <polygon points={`${cBack.x},${cBack.y} ${cLeft.x},${cLeft.y} ${cLeft.x},${cLeft.y - wallH} ${cBack.x},${cBack.y - wallH}`} fill="rgba(12,17,28,0.45)" stroke={STEEL} strokeWidth="1" />
      <polygon points={`${cBack.x},${cBack.y} ${cRight.x},${cRight.y} ${cRight.x},${cRight.y - wallH} ${cBack.x},${cBack.y - wallH}`} fill="rgba(16,22,36,0.6)" stroke={STEEL} strokeWidth="1" />
      {corr}
      {post(cBack, 'pBack')}

      {/* suelo + rejilla */}
      <polygon points={floor} fill="rgba(20,28,44,0.6)" stroke={STEEL} strokeWidth="1" />
      {grid}

      {/* bultos */}
      {boxes.map((b, i) => {
        const lote = loteOf(i)
        const dim = highlight !== null && highlight !== lote.id
        const f = cuboid(b.c, b.r, b.z)
        return (
          <g key={i} style={{ opacity: dim ? 0.14 : 1, transition: 'opacity .22s' }}>
            <g className="pmx-box" style={{ animationDelay: `${i * 26}ms` }}>
              <polygon points={f.left} fill={lote.left} />
              <polygon points={f.right} fill={lote.right} />
              <polygon points={f.top} fill={lote.top} stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
            </g>
          </g>
        )
      })}

      {/* marco delantero (delante de la carga) */}
      {post(cRight, 'pRight')}
      {post(cLeft, 'pLeft')}
      {post(cFront, 'pFront')}
      <polygon
        points={`${cBack.x},${cBack.y - wallH} ${cRight.x},${cRight.y - wallH} ${cFront.x},${cFront.y - wallH} ${cLeft.x},${cLeft.y - wallH}`}
        fill="none"
        stroke={STEEL}
        strokeWidth="1.4"
      />
    </svg>
  )
}

function Gauge({ pct }: { pct: number }) {
  const R = 34
  const C = 2 * Math.PI * R
  const off = C * (1 - pct / 100)
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
        <circle cx="44" cy="44" r={R} fill="none" stroke={TEAL} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ filter: 'drop-shadow(0 0 5px rgba(47,210,201,0.5))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', flexDirection: 'column' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{pct}<span style={{ fontSize: 12, color: MUTE }}>%</span></div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.1em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{value}</div>
    </div>
  )
}

// ── Otras tabs ───────────────────────────────────────────────────────────────

function ResumenTab() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 18 }}>
        {KPIS.map((kpi) => (
          <TechCard key={kpi.label} hover small>
            <div style={{ fontSize: 10, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.18em' }}>◢ {kpi.idx}</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>{kpi.num}</div>
            <div style={{ fontSize: 12.5, color: MUTE, marginTop: 3 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#7EE0A0', marginTop: 9, fontFamily: 'var(--font-dm-mono), monospace' }}>▲ {kpi.delta}</div>
          </TechCard>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <TechCard eyebrow="◢ ACTIVIDAD" title="Eventos recientes">
          {[
            ['DPP emitido', 'Lote cocinas roble · #DPP-8841', 'hace 4 min', GOLD],
            ['Escrow liberado', 'Pedido #PM-2207 · 14.200 €', 'hace 1 h', '#7EE0A0'],
            ['Ficha verificada', 'Ventanas PVC clase A · gate ✓', 'hace 2 h', '#5EC8FF'],
            ['Nuevo proveedor', 'Carpintería Aresga S.L.', 'hace 5 h', MUTE],
          ].map(([t, d, time, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < 3 ? `1px solid ${LINE}` : 'none' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, boxShadow: `0 0 10px ${c}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 550 }}>{t}</div>
                <div style={{ fontSize: 12, color: FAINT }}>{d}</div>
              </div>
              <div style={{ fontSize: 11, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{time}</div>
            </div>
          ))}
        </TechCard>
        <TechCard eyebrow="◢ ACCIONES" title="Atajos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PrimaryButton full>+ Crear ficha de producto</PrimaryButton>
            <GhostButton full>Conectar ERP</GhostButton>
            <GhostButton full>Emitir DPP en lote</GhostButton>
            <GhostButton full>Invitar empresa</GhostButton>
          </div>
        </TechCard>
      </div>
    </>
  )
}

function CatalogoTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {CATALOGO.map((c) => (
        <TechCard key={c.name} hover>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 14, fontWeight: 650 }}>{c.name}</div>
            <span style={{ fontSize: 11, color: GOLD, fontFamily: 'var(--font-dm-mono), monospace' }}>{c.count}</span>
          </div>
          <div style={{ fontSize: 12.5, color: FAINT, margin: '8px 0 16px' }}>productos con DPP activo</div>
          <GhostButton full>Abrir catálogo</GhostButton>
        </TechCard>
      ))}
    </div>
  )
}

function CumplimientoTab() {
  const checks = [
    ['Marcado CE / DoP', 'Reglamento (UE) 305/2011', true],
    ['Declaración ambiental (DPP)', 'ESPR 2024/1781', true],
    ['Sustancias SVHC', 'REACH · candidate list', true],
    ['Eficiencia energética', 'etiqueta clase declarada', true],
    ['Trazabilidad de origen', 'cadena de custodia G10', false],
  ] as const
  return (
    <TechCard eyebrow="◢ GATE DE CUMPLIMIENTO" title="Ficha en borrador · 4 / 5 OK">
      <p style={{ fontSize: 12.5, color: FAINT, margin: '0 0 18px' }}>
        El servidor rechaza la publicación hasta que el gate pase al 100%. Esto facilita el cumplimiento — el sello formal lo emite un experto humano.
      </p>
      {checks.map(([t, d, ok], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < checks.length - 1 ? `1px solid ${LINE}` : 'none' }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              background: ok ? 'rgba(63,185,80,0.16)' : 'rgba(224,133,126,0.14)',
              color: ok ? '#7EE0A0' : '#E0857E',
              border: `1px solid ${ok ? 'rgba(63,185,80,0.4)' : 'rgba(224,133,126,0.4)'}`,
            }}
          >
            {ok ? '✓' : '!'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 550 }}>{t}</div>
            <div style={{ fontSize: 12, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{d}</div>
          </div>
          {!ok && <GhostButton>Completar</GhostButton>}
        </div>
      ))}
    </TechCard>
  )
}

function EscrowTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <TechCard eyebrow="◢ ESCROW" title="Pedido #PM-2207">
        {[
          ['Comprador firma', true],
          ['Fondos en escrow (€)', true],
          ['Transitario confirma carga (GPS)', true],
          ['Entrega verificada', false],
        ].map(([t, ok], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#3FB950' : FAINT, boxShadow: ok ? '0 0 10px #3FB950' : 'none' }} />
            <span style={{ flex: 1, fontSize: 13.5, color: ok ? TEXT : MUTE }}>{t as string}</span>
            <span style={{ fontSize: 11, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{ok ? 'OK' : 'pend.'}</span>
          </div>
        ))}
      </TechCard>
      <TechCard eyebrow="◢ LIBERACIÓN" title="Custodia multi-firma 2-de-3">
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>14.200 <span style={{ fontSize: 16, color: GOLD }}>€</span></div>
        <div style={{ fontSize: 12.5, color: FAINT, margin: '6px 0 20px' }}>retenido en custodia</div>
        <PrimaryButton full disabled>Liberar (espera entrega)</PrimaryButton>
        <p style={{ fontSize: 11, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>El botón se activa solo cuando el oráculo confirma la entrega. Nada se libera antes.</p>
      </TechCard>
    </div>
  )
}

// ── TAB · Actores (directorio de empresas) ──────────────────────────────────

const ACTORES = [
  { name: 'Cementos Atlántico, S.A.', rol: 'Proveedor · materiales', ini: 'CA', rep: 96, color: '#4C9AFF' },
  { name: 'Carpintería Aresga, S.L.', rol: 'Profesional · carpintería', ini: 'CA', rep: 91, color: '#2FD2C9' },
  { name: 'Reformas Levante, S.L.', rol: 'Comprador · reformista', ini: 'RL', rep: 88, color: '#F0B429' },
  { name: 'MSC Iberia · Naviera', rol: 'Transitario · marítimo', ini: 'MI', rep: 94, color: '#9A8CFF' },
  { name: 'Maderas del Norte, S.A.', rol: 'Proveedor · madera', ini: 'MN', rep: 90, color: '#5EC8FF' },
  { name: 'Estudio Arq. Vela', rol: 'Comprador · arquitectura', ini: 'AV', rep: 85, color: '#7EE0A0' },
]

function ActoresTab({ onMessage, onCall }: { onMessage: () => void; onCall: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {ACTORES.map((a) => (
        <TechCard key={a.name} hover>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar ini={a.ini} color={a.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
              <div style={{ fontSize: 12, color: FAINT }}>{a.rol}</div>
            </div>
            <span title="Verificado" style={{ color: '#7EE0A0', fontSize: 14 }}>✓</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0', fontSize: 11.5, color: MUTE }}>
            <span style={{ fontFamily: 'var(--font-dm-mono), monospace', color: TEAL }}>{a.rep}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ width: `${a.rep}%`, height: '100%', borderRadius: 999, background: TEAL, boxShadow: `0 0 6px ${TEAL}` }} />
            </div>
            <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10 }}>reputación</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton full>Ver ficha</GhostButton>
            <button className="pmx-icbtn pmx-icbtn-card" title="Mensaje" onClick={onMessage}>✉</button>
            <button className="pmx-icbtn pmx-icbtn-card" title="Videollamada" onClick={onCall}>▶</button>
          </div>
        </TechCard>
      ))}
    </div>
  )
}

// ── TAB · Mi catálogo (subir producto + ERP + gate) ─────────────────────────

function MiCatalogoTab() {
  const items = [
    ['Cocina roble macizo R-200', 'publicado', '#7EE0A0'],
    ['Parquet flotante AC5', 'publicado', '#7EE0A0'],
    ['Armario corredera 3m', 'borrador · gate 4/5', GOLD],
    ['Ventana PVC oscilobatiente', 'borrador · gate 5/5', '#5EC8FF'],
  ] as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TechCard eyebrow="◢ PUBLICAR" title="Subir producto">
          <div className="pmx-drop">
            <div style={{ fontSize: 26, color: FAINT }}>↥</div>
            <div style={{ fontSize: 13, color: MUTE, marginTop: 6 }}>Arrastra una ficha o conéctala desde tu ERP</div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <PrimaryButton full>+ Nueva ficha</PrimaryButton>
            <GhostButton full>Conectar ERP</GhostButton>
          </div>
          <p style={{ fontSize: 11, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>
            Toda ficha pasa por el gate de cumplimiento (server-side) antes de publicarse · status “draft” por defecto.
          </p>
        </TechCard>
        <TechCard eyebrow="◢ ERP" title="Sincronización">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 8px #3FB950' }} />
            Conectado · Holded · última sync hace 12 min
          </div>
        </TechCard>
      </div>
      <TechCard eyebrow="◢ MIS FICHAS" title="8.400 productos">
        {items.map(([n, s, c], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < items.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c as string }} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{n}</span>
            <span style={{ fontSize: 11.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{s}</span>
            <GhostButton>Editar</GhostButton>
          </div>
        ))}
      </TechCard>
    </div>
  )
}

// ── TAB · Documentos (archivos) ─────────────────────────────────────────────

function ArchivosTab() {
  const [folder, setFolder] = useState('Contratos')
  const folders = ['Contratos', 'DPP', 'Facturas', 'KYC', 'Albaranes']
  const files = [
    ['Contrato marco PM-2207.pdf', 'PDF · 248 KB', '◫'],
    ['Anexo logística.pdf', 'PDF · 96 KB', '◫'],
    ['Plano de carga.png', 'PNG · 1,2 MB', '▣'],
    ['Certificado CE.pdf', 'PDF · 180 KB', '◫'],
    ['Factura 0042.pdf', 'PDF · 72 KB', '◫'],
    ['Foto entrega.jpg', 'JPG · 2,1 MB', '▣'],
  ] as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
      <TechCard eyebrow="◢ CARPETAS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {folders.map((f) => (
            <button key={f} className="pmx-folder" data-active={folder === f} onClick={() => setFolder(f)}>
              <span style={{ color: folder === f ? GOLD : FAINT }}>▭</span> {f}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: MUTE }}>IA en esta carpeta</span>
            <span className="pmx-switch" />
          </div>
          <div style={{ fontSize: 10.5, color: FAINT, marginTop: 6, lineHeight: 1.4 }}>opt-in · análisis solo si lo activas</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: FAINT }}>🗑 Papelera · 30 días</div>
      </TechCard>
      <TechCard eyebrow={`◢ ${folder.toUpperCase()}`} title={`${files.length} documentos`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <PrimaryButton>↥ Subir documento</PrimaryButton>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {files.map(([n, m, ic], i) => (
            <div key={i} className="pmx-file">
              <div style={{ fontSize: 30, color: TEAL, marginBottom: 8 }}>{ic}</div>
              <div style={{ fontSize: 12.5, fontWeight: 550, lineHeight: 1.3 }}>{n}</div>
              <div style={{ fontSize: 11, color: FAINT, marginTop: 4, fontFamily: 'var(--font-dm-mono), monospace' }}>{m}</div>
            </div>
          ))}
        </div>
      </TechCard>
    </div>
  )
}

// ── TAB · Mensajes (chat) ───────────────────────────────────────────────────

function MensajesTab({ onCall }: { onCall: () => void }) {
  const convos = [
    ['Cementos Atlántico', 'Confirmamos el albarán para…', true],
    ['MSC Iberia · Naviera', 'GPS activo, carga en muelle 4', false],
    ['Carpintería Aresga', '¿Medidas finales del armario?', false],
    ['Estudio Arq. Vela', 'Gracias, recibido', false],
  ] as const
  const msgs = [
    ['them', 'Hola, ¿confirmamos el pedido PM-2207?'],
    ['me', 'Sí, fondos ya en escrow (€).'],
    ['them', 'Perfecto. Emitimos albarán y DPP por lote.'],
    ['me', 'Genial. El transitario confirma carga por GPS.'],
  ] as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 230px)' }}>
      <TechCard eyebrow="◢ CONVERSACIONES">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {convos.map(([n, p, active], i) => (
            <button key={i} className="pmx-convo" data-active={active}>
              <Avatar ini={n.slice(0, 2)} color={['#4C9AFF', '#9A8CFF', '#2FD2C9', '#7EE0A0'][i]} size={34} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
                <div style={{ fontSize: 11.5, color: FAINT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</div>
              </div>
            </button>
          ))}
        </div>
      </TechCard>
      <div className="pmx-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <span className="pmx-brk pmx-brk-tl" /><span className="pmx-brk pmx-brk-tr" />
        <span className="pmx-brk pmx-brk-bl" /><span className="pmx-brk pmx-brk-br" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: `1px solid ${LINE}` }}>
          <Avatar ini="CA" color="#4C9AFF" size={34} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 650 }}>Cementos Atlántico</div>
            <div style={{ fontSize: 11, color: '#7EE0A0' }}>● en línea</div>
          </div>
          <button className="pmx-icbtn pmx-icbtn-card" title="Llamar" onClick={onCall}>☎</button>
          <button className="pmx-icbtn pmx-icbtn-card" title="Vídeo" onClick={onCall}>▶</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map(([who, txt], i) => (
            <div key={i} style={{ alignSelf: who === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div
                style={{
                  padding: '9px 13px',
                  borderRadius: 13,
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  background: who === 'me' ? `linear-gradient(180deg, ${GOLD}, #D89A18)` : 'rgba(255,255,255,0.07)',
                  color: who === 'me' ? '#1A1206' : TEXT,
                  border: who === 'me' ? 'none' : `1px solid ${LINE}`,
                }}
              >
                {txt}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 9, padding: '12px 14px', borderTop: `1px solid ${LINE}` }}>
          <div className="pmx-input">Escribe un mensaje…</div>
          <PrimaryButton>Enviar</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ── TAB · Agenda ─────────────────────────────────────────────────────────────

function AgendaTab({ onCall }: { onCall: () => void }) {
  const events = [
    ['09:00', 'Videollamada · Cementos Atlántico', 'Cierre pedido PM-2207', '#4C9AFF', true],
    ['11:30', 'Revisión KYB · MSC Iberia', 'Documentación naviera', '#9A8CFF', false],
    ['13:00', 'Firma escrow · multi-firma 2/3', 'Pendiente transitario', GOLD, false],
    ['16:00', 'Demo plataforma · Estudio Arq. Vela', 'Onboarding', '#7EE0A0', false],
  ] as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
      <TechCard eyebrow="◢ HOY · jueves 30 may" title="Agenda del día">
        {events.map(([h, t, d, c, isCall], i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < events.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 13, color: MUTE, width: 44 }}>{h}</div>
            <div style={{ width: 3, borderRadius: 2, background: c as string, boxShadow: `0 0 6px ${c}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 12, color: FAINT }}>{d}</div>
            </div>
            {isCall && <button className="pmx-icbtn pmx-icbtn-card" title="Unirse" onClick={onCall}>▶</button>}
          </div>
        ))}
      </TechCard>
      <TechCard eyebrow="◢ ACCIONES">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton full>+ Nueva reunión</PrimaryButton>
          <GhostButton full>Programar videollamada</GhostButton>
          <GhostButton full>Sincronizar calendario</GhostButton>
        </div>
      </TechCard>
    </div>
  )
}

// ── TAB · Buscador ───────────────────────────────────────────────────────────

function BuscadorTab({ onMessage }: { onMessage: () => void }) {
  const filtros = ['Todos', 'Productos', 'Empresas', 'Profesionales', 'Operan hoy']
  const [filtro, setFiltro] = useState('Todos')
  const resultados = [
    ['Cocina roble macizo R-200', 'Producto · Maderas del Norte', 'DPP · 284 en stock', '#F0B429'],
    ['Cementos Atlántico, S.A.', 'Empresa · proveedor materiales', '✓ verificada · opera hoy', '#4C9AFF'],
    ['Carpintería Aresga, S.L.', 'Profesional · carpintería', '✓ verificada · opera hoy', '#2FD2C9'],
    ['Parquet flotante AC5', 'Producto · Suelos Ibérica', 'DPP · 312 en stock', '#9A8CFF'],
    ['MSC Iberia · Naviera', 'Transitario · marítimo', '✓ verificada', '#5EC8FF'],
  ] as const
  return (
    <div style={{ maxWidth: 900 }}>
      <TechCard eyebrow="◢ BÚSQUEDA GLOBAL" title="Mercado 1503">
        <div className="pmx-searchbig">
          <span style={{ color: TEAL, fontSize: 18 }}>⌕</span>
          <span style={{ color: MUTE, fontSize: 14 }}>Buscar productos, empresas, profesionales… (cocinas, naviera, DPP)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {filtros.map((f) => (
            <button key={f} className="pmx-chip" data-active={filtro === f} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>
      </TechCard>
      <div style={{ marginTop: 16 }}>
        <TechCard eyebrow={`◢ RESULTADOS · ${filtro.toUpperCase()}`} title={`${resultados.length} coincidencias`}>
          {resultados.map(([n, t, m, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < resultados.length - 1 ? `1px solid ${LINE}` : 'none' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c as string, boxShadow: `0 0 6px ${c}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{n}</div>
                <div style={{ fontSize: 12, color: FAINT }}>{t}</div>
              </div>
              <span style={{ fontSize: 11.5, color: MUTE, fontFamily: 'var(--font-dm-mono), monospace' }}>{m}</span>
              <GhostButton>Abrir</GhostButton>
              <button className="pmx-icbtn pmx-icbtn-card" title="Mensaje" onClick={onMessage}>✉</button>
            </div>
          ))}
        </TechCard>
      </div>
    </div>
  )
}

// ── TAB · Identidad (Actor-ID, SSI) ─────────────────────────────────────────

function IdentidadTab() {
  const creds = [
    ['Actor-raíz verificado', 'KYC nivel 2 · documento + biometría', true],
    ['Empresa vinculada', 'Maderas del Levante S.L. · B-12345678', true],
    ['Rol profesional', 'Carpintería · ISIC C1623', true],
    ['Sanciones / OFAC', 'sin coincidencias · revisado hoy', true],
    ['Credencial bancaria (rampa fiat)', 'pendiente de verificación', false],
  ] as const
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Tarjeta de identidad */}
      <div className="pmx-card" style={{ padding: 0, overflow: 'hidden' }}>
        <span className="pmx-brk pmx-brk-tl" /><span className="pmx-brk pmx-brk-tr" />
        <span className="pmx-brk pmx-brk-bl" /><span className="pmx-brk pmx-brk-br" />
        <div style={{ padding: '22px 20px', background: 'linear-gradient(150deg, rgba(240,180,41,0.16), rgba(47,210,201,0.08))', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar ini="ML" color={GOLD} size={56} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Maderas del Levante</div>
              <div style={{ fontSize: 12, color: MUTE }}>Actor verificado · sector inmobiliario</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em' }}>ACTOR-ID</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.08em', marginTop: 4 }}>ACT·7F3A·2026</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12.5, color: '#7EE0A0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3FB950', boxShadow: '0 0 8px #3FB950' }} />
            Identidad soberana (SSI) · no custodial
          </div>
          <p style={{ fontSize: 10.5, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>
            La PII vive off-chain; on-chain solo el hash SHA-256. Derecho al olvido por cascade delete.
          </p>
        </div>
      </div>
      {/* Credenciales */}
      <TechCard eyebrow="◢ CREDENCIALES VERIFICABLES" title="Estado de la identidad">
        {creds.map(([t, d, ok], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: i < creds.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 12, background: ok ? 'rgba(63,185,80,0.16)' : 'rgba(224,133,126,0.14)', color: ok ? '#7EE0A0' : '#E0857E', border: `1px solid ${ok ? 'rgba(63,185,80,0.4)' : 'rgba(224,133,126,0.4)'}` }}>{ok ? '✓' : '!'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 550 }}>{t}</div>
              <div style={{ fontSize: 12, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{d}</div>
            </div>
            {!ok && <GhostButton>Verificar</GhostButton>}
          </div>
        ))}
      </TechCard>
    </div>
  )
}

// ── Panel de comunicaciones (llamada / vídeo / reunión) ─────────────────────

const MEETING_PARTICIPANTS = [
  { n: 'Cementos Atlántico', c: '#4C9AFF', ini: 'CA' },
  { n: 'MSC Iberia · Naviera', c: '#9A8CFF', ini: 'MI' },
  { n: 'Carpintería Aresga', c: '#2FD2C9', ini: 'CA' },
  { n: 'Maderas del Norte', c: '#5EC8FF', ini: 'MN' },
  { n: 'Estudio Arq. Vela', c: '#7EE0A0', ini: 'AV' },
  { n: 'Reformas Levante', c: '#F0B429', ini: 'RL' },
  { n: 'Suelos Ibérica', c: '#FF8FA3', ini: 'SI' },
  { n: 'Vidrios del Sur', c: '#6FE3D2', ini: 'VS' },
  { n: 'Notaría Central', c: '#B59CFF', ini: 'NC' },
  { n: 'Transitario Iberia', c: '#9AD16B', ini: 'TI' },
  { n: 'Aceros Galicia', c: '#7FB8FF', ini: 'AG' },
  { n: 'Pinturas Mediterráneo', c: '#FFC56F', ini: 'PM' },
  { n: 'Cerámicas Valencia', c: '#FF9F7A', ini: 'CV' },
  { n: 'Logística Atlántica', c: '#8FD9C4', ini: 'LA' },
  { n: 'Tú', c: GOLD, ini: 'YO' },
]

// Subtítulos de muestra (mock) — el motor real es ASR→MT self-host, Ola 3.
const LISTEN_LANGS = ['Original', 'Español', 'English', '中文', 'العربية', 'Português']
const SUBS: Record<string, string> = {
  Español: 'Cementos Atlántico: Confirmamos el pedido PM-2207, fondos ya en escrow.',
  English: 'Cementos Atlántico: We confirm order PM-2207, funds already in escrow.',
  '中文': 'Cementos Atlántico:我们确认订单 PM-2207,资金已进入托管。',
  'العربية': 'Cementos Atlántico: نؤكد الطلب PM-2207، الأموال في الضمان بالفعل.',
  'Português': 'Cementos Atlántico: Confirmamos o pedido PM-2207, fundos já em garantia.',
}

function CommsPanel({ mode, onClose, onSwitch }: { mode: 'video' | 'audio' | 'meeting'; onClose: () => void; onSwitch: (m: 'video' | 'audio' | 'meeting') => void }) {
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(mode === 'audio')
  const [transMode, setTransMode] = useState<'conversacion' | 'presentacion'>('conversacion')
  const [listenLang, setListenLang] = useState('Original')
  const isMeeting = mode === 'meeting'
  const title = isMeeting ? 'REUNIÓN · amplio' : mode === 'video' ? 'VIDEOLLAMADA' : 'LLAMADA'
  const participants = isMeeting
    ? MEETING_PARTICIPANTS
    : [
        { n: 'Cementos Atlántico', c: '#4C9AFF', ini: 'CA' },
        { n: 'Tú', c: GOLD, ini: 'YO' },
      ]
  // Galería: nº de columnas según participantes (1–15)
  const cols = !isMeeting ? 2 : participants.length <= 4 ? 2 : participants.length <= 9 ? 3 : participants.length <= 12 ? 4 : 5
  const tileSize = !isMeeting ? 52 : participants.length <= 6 ? 40 : participants.length <= 12 ? 32 : 26
  return (
    <div className={`pmx-comms${isMeeting ? ' pmx-comms-wide' : ''}`}>
      <span className="pmx-brk pmx-brk-tl" /><span className="pmx-brk pmx-brk-tr" />
      <span className="pmx-brk pmx-brk-bl" /><span className="pmx-brk pmx-brk-br" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5C5C', boxShadow: '0 0 8px #FF5C5C' }} className="pmx-rec" />
        <span style={{ fontSize: 11, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em' }}>
          {title} · 04:12
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: FAINT }}>{participants.length} participantes</span>
      </div>

      {/* Tiles de vídeo (galería) */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginBottom: 14, maxHeight: isMeeting ? '52vh' : 'none', overflow: 'auto' }}>
        {participants.map((p, i) => {
          const isMe = p.n === 'Tú'
          const isHost = isMeeting && i === 0
          const border = isHost ? 'rgba(63,185,80,0.8)' : isMe ? 'rgba(240,180,41,0.55)' : LINE
          const glow = isHost ? '0 0 0 1px rgba(63,185,80,0.5), 0 0 16px rgba(63,185,80,0.28)' : 'none'
          return (
            <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, rgba(40,52,76,0.9), rgba(10,14,22,0.95))', border: `1.5px solid ${border}`, boxShadow: glow, display: 'grid', placeItems: 'center' }}>
              {mode !== 'audio' && !(isMe && camOff) ? (
                <Avatar ini={p.ini} color={p.c} size={tileSize} />
              ) : (
                <div style={{ textAlign: 'center', color: FAINT }}>
                  <Avatar ini={p.ini} color={p.c} size={Math.max(24, tileSize - 6)} />
                  {!isMeeting && <div style={{ fontSize: 10, marginTop: 6 }}>cámara off</div>}
                </div>
              )}
              {/* indicador de micro */}
              <span style={{ position: 'absolute', top: 5, right: 6, fontSize: isMeeting ? 9 : 11, opacity: 0.85 }}>{isMe && muted ? '🔇' : '🎙'}</span>
              <span style={{ position: 'absolute', bottom: 4, left: 6, right: 6, fontSize: isMeeting ? 9.5 : 11, color: TEXT, textShadow: '0 1px 3px #000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isHost && <span style={{ color: '#7EE0A0' }}>● </span>}{p.n}{isHost ? ' · anfitrión' : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* Traducción de voz (mock) — conmutador de modo + idioma de escucha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>🎧</span>
        <span style={{ fontSize: 11.5, color: MUTE }}>Escuchar en</span>
        <select className="pmx-langsel" value={listenLang} onChange={(e) => setListenLang(e.target.value)}>
          {LISTEN_LANGS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="pmx-seg" data-active={transMode === 'conversacion'} onClick={() => setTransMode('conversacion')} style={{ flex: 'none', padding: '6px 11px' }}>Conversación</button>
          <button className="pmx-seg" data-active={transMode === 'presentacion'} onClick={() => setTransMode('presentacion')} style={{ flex: 'none', padding: '6px 11px' }}>Presentación</button>
        </div>
      </div>

      {/* Barra de subtítulos en vivo */}
      {listenLang !== 'Original' && (
        <div
          dir={listenLang === 'العربية' ? 'rtl' : 'ltr'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '11px 14px',
            marginBottom: 14,
            borderRadius: 12,
            background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${LINE}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontSize: 9.5,
              fontFamily: 'var(--font-dm-mono), monospace',
              color: transMode === 'presentacion' ? '#7EE0A0' : TEAL,
              border: `1px solid ${transMode === 'presentacion' ? 'rgba(126,224,160,0.4)' : 'rgba(47,210,201,0.4)'}`,
              borderRadius: 6,
              padding: '3px 7px',
              letterSpacing: '0.05em',
            }}
          >
            {transMode === 'presentacion' ? '⧗ BUFFER 4 s · SINCRONIZADO' : '⌁ SUBTÍTULOS · ÁGIL'}
          </span>
          <span style={{ fontSize: 13.5, color: TEXT, lineHeight: 1.4 }}>{SUBS[listenLang]}</span>
        </div>
      )}

      {/* Controles físicos con etiqueta (estilo videoconferencia) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        {[
          { ic: muted ? '🔇' : '🎤', lb: 'Silenciar', cls: muted ? 'pmx-cc-off' : '', on: () => setMuted((m) => !m) },
          { ic: camOff ? '📵' : '📹', lb: 'Detener vídeo', cls: camOff ? 'pmx-cc-off' : '', on: () => { setCamOff((c) => !c); if (!isMeeting) onSwitch(camOff ? 'video' : 'audio') } },
          { ic: '🖥', lb: 'Compartir', cls: 'pmx-cc-share', on: () => {} },
          { ic: '☎', lb: 'Finalizar', cls: 'pmx-cc-hang', on: onClose },
          { ic: '⚙', lb: 'Ajustes', cls: '', on: () => {} },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button className={`pmx-cc ${b.cls}`} title={b.lb} onClick={b.on}>{b.ic}</button>
            <span style={{ fontSize: 10, color: FAINT }}>{b.lb}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>
        modo: <span style={{ color: MUTE }}>Slim</span> · <span style={{ color: MUTE }}>Full</span> · <span style={{ color: MUTE }}>Auto</span>
      </div>
    </div>
  )
}

function Avatar({ ini, color, size = 40 }: { ini: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size / 3.2,
        display: 'grid',
        placeItems: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        color: '#0A0E16',
        background: `linear-gradient(145deg, ${color}, ${color}99)`,
        boxShadow: `0 4px 12px ${color}44, inset 0 1px 0 rgba(255,255,255,0.4)`,
      }}
    >
      {ini.toUpperCase()}
    </div>
  )
}

// ── Primitivos TECH ──────────────────────────────────────────────────────────

function TechCard({
  children,
  eyebrow,
  title,
  hover = false,
  small = false,
}: {
  children: React.ReactNode
  eyebrow?: string
  title?: string
  hover?: boolean
  small?: boolean
}) {
  return (
    <div className={`pmx-card${hover ? ' pmx-card-hover' : ''}`} style={{ padding: small ? 16 : 18 }}>
      <span className="pmx-brk pmx-brk-tl" />
      <span className="pmx-brk pmx-brk-tr" />
      <span className="pmx-brk pmx-brk-bl" />
      <span className="pmx-brk pmx-brk-br" />
      {eyebrow && (
        <div style={{ fontSize: 10, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em', marginBottom: title ? 2 : 12 }}>
          {eyebrow}
        </div>
      )}
      {title && <div style={{ fontSize: 14.5, fontWeight: 650, letterSpacing: '-0.01em', marginBottom: 14 }}>{title}</div>}
      {children}
    </div>
  )
}

function PrimaryButton({ children, full = false, disabled = false }: { children: React.ReactNode; full?: boolean; disabled?: boolean }) {
  return (
    <button className="pmx-btn pmx-btn-primary" disabled={disabled} style={{ width: full ? '100%' : 'auto' }}>
      <span className="pmx-shine" />
      {children}
    </button>
  )
}

function GhostButton({ children, full = false }: { children: React.ReactNode; full?: boolean }) {
  return (
    <button className="pmx-btn pmx-btn-ghost" style={{ width: full ? '100%' : 'auto' }}>
      <span className="pmx-shine" />
      {children}
    </button>
  )
}

function DemoTag() {
  return (
    <div style={{ marginBottom: 18 }}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: FAINT,
          fontFamily: 'var(--font-dm-mono), monospace',
          border: `1px solid ${LINE}`,
          padding: '4px 10px',
          borderRadius: 999,
        }}
      >
        ◆ Prototipo de dirección visual · datos de muestra
      </span>
    </div>
  )
}

// ── CSS ──────────────────────────────────────────────────────────────────────
function StyleBlock() {
  return (
    <style>{`
      /* NAV con barra de acento tech */
      .pmx-nav {
        position: relative; display: flex; align-items: center; gap: 12;
        padding: 11px 13px 11px 15px; border-radius: 11px; border: 1px solid transparent;
        background: transparent; color: ${MUTE}; font: inherit; font-size: 14px; font-weight: 500;
        cursor: pointer; text-align: left; transition: background .18s, color .18s, border-color .18s, transform .08s;
      }
      .pmx-nav .pmx-nav-bar {
        position: absolute; left: 0; top: 50%; transform: translateY(-50%);
        width: 2px; height: 0; background: ${GOLD}; border-radius: 2px; transition: height .2s;
        box-shadow: 0 0 8px ${GOLD};
      }
      .pmx-nav:hover { background: rgba(255,255,255,0.05); color: ${TEXT}; }
      .pmx-nav:active { transform: scale(0.985); }
      .pmx-nav[data-active="true"] {
        background: rgba(240,180,41,0.10); border-color: rgba(240,180,41,0.28); color: ${TEXT}; font-weight: 600;
      }
      .pmx-nav[data-active="true"] .pmx-nav-bar { height: 56%; }

      /* VENTANAS tech: glass + corner brackets de instrumento */
      .pmx-card {
        position: relative; border-radius: 14px;
        background: rgba(14,19,32,0.62);
        backdrop-filter: blur(20px) saturate(1.2); -webkit-backdrop-filter: blur(20px) saturate(1.2);
        border: 1px solid ${LINE};
        box-shadow: 0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .pmx-card-hover:hover {
        transform: translateY(-3px); border-color: rgba(255,255,255,0.16);
        box-shadow: 0 18px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
      }
      .pmx-brk { position: absolute; width: 11px; height: 11px; pointer-events: none; opacity: .55; }
      .pmx-brk-tl { top: 7px; left: 7px; border-top: 1.5px solid ${TEAL}; border-left: 1.5px solid ${TEAL}; }
      .pmx-brk-tr { top: 7px; right: 7px; border-top: 1.5px solid ${TEAL}; border-right: 1.5px solid ${TEAL}; }
      .pmx-brk-bl { bottom: 7px; left: 7px; border-bottom: 1.5px solid ${TEAL}; border-left: 1.5px solid ${TEAL}; }
      .pmx-brk-br { bottom: 7px; right: 7px; border-bottom: 1.5px solid ${TEAL}; border-right: 1.5px solid ${TEAL}; }
      .pmx-card-hover:hover .pmx-brk { opacity: .9; }

      /* BOTONES tech: corte en esquinas + barrido de luz + física al pulsar */
      .pmx-btn {
        position: relative; overflow: hidden; font: inherit; font-size: 13px; font-weight: 600;
        padding: 11px 18px; cursor: pointer; letter-spacing: 0.01em;
        clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
        transition: transform .09s ease, box-shadow .18s ease, filter .18s ease, background .18s ease;
        will-change: transform;
      }
      .pmx-btn:disabled { cursor: not-allowed; filter: grayscale(0.5) brightness(0.7); }
      .pmx-shine {
        position: absolute; top: 0; left: -120%; width: 60%; height: 100%; pointer-events: none;
        background: linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent);
        transform: skewX(-18deg); transition: left .55s ease;
      }
      .pmx-btn:hover:not(:disabled) .pmx-shine { left: 140%; }

      .pmx-btn-primary {
        color: #1A1206; border: 1px solid rgba(255,255,255,0.25);
        background: linear-gradient(180deg, #FFD166 0%, ${GOLD} 48%, #D89A18 100%);
        box-shadow: 0 6px 18px rgba(240,180,41,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(120,80,0,0.35);
      }
      .pmx-btn-primary:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 9px 26px rgba(240,180,41,0.5), inset 0 1px 0 rgba(255,255,255,0.8); }
      .pmx-btn-primary:active:not(:disabled) { transform: translateY(1px) scale(0.99); box-shadow: 0 2px 8px rgba(240,180,41,0.3), inset 0 2px 5px rgba(120,80,0,0.45); }

      .pmx-btn-ghost {
        color: ${TEXT}; border: 1px solid ${LINE};
        background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.25);
      }
      .pmx-btn-ghost:hover { background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04)); border-color: rgba(47,210,201,0.4); transform: translateY(-1px); }
      .pmx-btn-ghost:active { transform: translateY(1px) scale(0.99); box-shadow: inset 0 2px 6px rgba(0,0,0,0.4); }

      .pmx-search {
        display: flex; align-items: center; gap: 9px; padding: 9px 14px; border-radius: 11px; min-width: 280px;
        background: rgba(255,255,255,0.05); border: 1px solid ${LINE}; cursor: text; transition: border-color .18s, background .18s;
      }
      .pmx-search:hover { border-color: rgba(47,210,201,0.4); background: rgba(255,255,255,0.07); }

      .pmx-seg { flex: 1; font: inherit; font-size: 11.5px; font-weight: 600; padding: 8px 6px; border-radius: 9px; cursor: pointer;
        color: ${MUTE}; border: 1px solid transparent; background: rgba(255,255,255,0.04); transition: all .16s; }
      .pmx-seg:hover { color: ${TEXT}; background: rgba(255,255,255,0.08); }
      .pmx-seg[data-active="true"] { color: #1A1206; border-color: rgba(255,255,255,0.3); background: linear-gradient(180deg, #FFD166, ${GOLD}); box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }

      .pmx-mini { font: inherit; font-size: 11px; color: ${MUTE}; cursor: pointer; width: 26px; height: 22px; border-radius: 7px;
        background: rgba(255,255,255,0.06); border: 1px solid ${LINE}; transition: all .16s; }
      .pmx-mini:hover { color: ${TEXT}; background: rgba(255,255,255,0.12); }

      .pmx-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.18); outline: none; cursor: pointer; }
      .pmx-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${GOLD}; box-shadow: 0 2px 8px rgba(240,180,41,0.5), inset 0 1px 0 rgba(255,255,255,0.6); border: 2px solid #1A1206; }
      .pmx-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${GOLD}; border: 2px solid #1A1206; }

      /* Bultos del contenedor: aparecen cargándose */
      .pmx-box { opacity: 0; transform: translateY(-14px); animation: pmxDrop .42s cubic-bezier(.2,.7,.3,1) forwards; }
      @keyframes pmxDrop { to { opacity: 1; transform: translateY(0); } }

      /* Botones de icono (cabecera y tarjetas) */
      .pmx-icbtn {
        width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; font-size: 15px; cursor: pointer;
        color: ${MUTE}; background: rgba(255,255,255,0.05); border: 1px solid ${LINE};
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); transition: all .15s;
      }
      .pmx-icbtn:hover { color: ${TEXT}; background: rgba(47,210,201,0.14); border-color: rgba(47,210,201,0.4); transform: translateY(-1px); }
      .pmx-icbtn:active { transform: translateY(1px) scale(0.96); }
      .pmx-icbtn-card { width: 36px; height: 36px; font-size: 14px; }

      .pmx-actorid {
        display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px;
        background: rgba(255,255,255,0.04); border: 1px solid ${LINE};
      }

      /* Drop zone / inputs */
      .pmx-drop {
        text-align: center; padding: 26px 16px; border-radius: 12px;
        border: 1.5px dashed rgba(255,255,255,0.16); background: rgba(255,255,255,0.02); transition: all .18s;
      }
      .pmx-drop:hover { border-color: rgba(47,210,201,0.5); background: rgba(47,210,201,0.05); }
      .pmx-input {
        flex: 1; display: flex; align-items: center; padding: 0 14px; border-radius: 11px; font-size: 13px; color: ${FAINT};
        background: rgba(255,255,255,0.05); border: 1px solid ${LINE}; cursor: text;
      }
      .pmx-input:hover { border-color: rgba(47,210,201,0.4); }

      /* Carpetas / archivos */
      .pmx-folder {
        display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 9px; font: inherit; font-size: 13px;
        color: ${MUTE}; background: transparent; border: 1px solid transparent; cursor: pointer; text-align: left; transition: all .15s;
      }
      .pmx-folder:hover { background: rgba(255,255,255,0.05); color: ${TEXT}; }
      .pmx-folder[data-active="true"] { background: rgba(240,180,41,0.1); border-color: rgba(240,180,41,0.28); color: ${TEXT}; font-weight: 600; }
      .pmx-file {
        padding: 14px 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid ${LINE};
        cursor: pointer; transition: all .18s;
      }
      .pmx-file:hover { transform: translateY(-3px); border-color: rgba(47,210,201,0.4); background: rgba(255,255,255,0.06); box-shadow: 0 12px 28px rgba(0,0,0,0.4); }

      .pmx-switch { width: 34px; height: 18px; border-radius: 999px; background: rgba(63,185,80,0.4); position: relative; display: inline-block; }
      .pmx-switch::after { content: ''; position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: #3FB950; box-shadow: 0 0 6px #3FB950; }

      /* Chat */
      .pmx-convo {
        display: flex; align-items: center; gap: 10px; padding: 9px; border-radius: 11px; font: inherit; cursor: pointer;
        color: ${TEXT}; background: transparent; border: 1px solid transparent; transition: all .15s;
      }
      .pmx-convo:hover { background: rgba(255,255,255,0.05); }
      .pmx-convo[data-active="true"] { background: rgba(47,210,201,0.1); border-color: rgba(47,210,201,0.28); }

      /* Panel de comunicaciones */
      .pmx-comms {
        position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 60; width: 460px; max-width: 92vw;
        padding: 18px; border-radius: 18px; background: rgba(10,14,22,0.92);
        backdrop-filter: blur(26px) saturate(1.3); -webkit-backdrop-filter: blur(26px) saturate(1.3);
        border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 30px 80px rgba(0,0,0,0.65);
        animation: pmxPop .22s cubic-bezier(.2,.8,.3,1.1);
      }
      .pmx-comms-wide { width: 760px; max-width: 94vw; }
      .pmx-langsel {
        font: inherit; font-size: 12.5px; font-weight: 600; color: ${TEXT}; cursor: pointer;
        padding: 6px 10px; border-radius: 9px; background: rgba(255,255,255,0.06);
        border: 1px solid ${LINE}; outline: none;
      }
      .pmx-langsel:hover { border-color: rgba(47,210,201,0.45); }
      .pmx-langsel option { background: #0E1320; color: ${TEXT}; }
      @keyframes pmxPop { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }

      /* Buscador grande + chips de filtro */
      .pmx-searchbig {
        display: flex; align-items: center; gap: 12px; padding: 15px 18px; border-radius: 13px; cursor: text;
        background: rgba(255,255,255,0.05); border: 1px solid ${LINE}; transition: all .18s;
      }
      .pmx-searchbig:hover { border-color: rgba(47,210,201,0.45); background: rgba(47,210,201,0.05); }
      .pmx-chip {
        font: inherit; font-size: 12.5px; font-weight: 550; padding: 7px 14px; border-radius: 999px; cursor: pointer;
        color: ${MUTE}; background: rgba(255,255,255,0.04); border: 1px solid ${LINE}; transition: all .15s;
      }
      .pmx-chip:hover { color: ${TEXT}; background: rgba(255,255,255,0.08); }
      .pmx-chip[data-active="true"] { color: #1A1206; border-color: rgba(255,255,255,0.3); background: linear-gradient(180deg, #FFD166, ${GOLD}); }
      .pmx-rec { animation: pmxBlink 1.4s ease-in-out infinite; }
      @keyframes pmxBlink { 50% { opacity: 0.3; } }
      .pmx-cc {
        width: 48px; height: 48px; border-radius: 14px; font-size: 19px; cursor: pointer;
        color: ${TEXT}; background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
        border: 1px solid ${LINE}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3); transition: all .12s;
      }
      .pmx-cc:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.25); }
      .pmx-cc:active { transform: translateY(1px) scale(0.95); }
      .pmx-cc-off { background: rgba(224,133,126,0.18); border-color: rgba(224,133,126,0.5); }
      .pmx-cc-share { background: linear-gradient(180deg, #4FD17E, #2FA85E); border-color: rgba(255,255,255,0.25); color: #08130C; }
      .pmx-cc-share:hover { filter: brightness(1.08); transform: translateY(-2px); }
      .pmx-cc-hang { background: linear-gradient(180deg, #FF6B6B, #C23636); border-color: rgba(255,255,255,0.25); transform: rotate(135deg); }
      .pmx-cc-hang:hover { transform: translateY(-2px) rotate(135deg); filter: brightness(1.1); }

      main::-webkit-scrollbar { width: 9px; }
      main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
      main::-webkit-scrollbar-track { background: transparent; }
    `}</style>
  )
}
