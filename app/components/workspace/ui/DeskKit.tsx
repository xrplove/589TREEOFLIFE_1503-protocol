'use client'

/**
 * Desk Kit v2 — "calma premium fintech" (referencia Hynex / Orbix Studio).
 *
 * Giro de ejecución 2026-05-31: oscuro pero CALMADO. Cards casi planas con
 * borde hairline, brillo solo en gráficas/activos, números grandes y seguros,
 * tipografía neutra (Geist) para el dato. Gráficas REALES (área, donut, barra
 * segmentada, pills) — lo que las referencias 2026 tienen y nosotros no.
 *
 * Es SOLO piel: las funciones del WorkspaceShell se re-visten con estos
 * primitivos, sin tocar su lógica. <DeskStyle/> se monta una vez.
 */

import { useId, type CSSProperties, type ReactNode } from 'react'
import {
  AMBER, BLUE, CARD, FAINT, FONT_MONO, GOLD, GREEN, HAIR, LILAC, MUTE, NUM,
  RED, TEAL, TEXT, TEXT_DIM, VIOLET,
} from './tokens'

/* ════════════════════════════ ESTILOS (montar 1×) ═══════════════════════════ */
export function DeskStyle() {
  return (
    <style>{`
      /* NAV lateral — pill calmada (sin barra de neón) */
      .dk-nav {
        position: relative; display: flex; align-items: center; gap: 11px;
        padding: 9px 12px; border-radius: 10px; border: 1px solid transparent;
        background: transparent; color: ${TEXT_DIM}; font: inherit; font-size: 0.86rem; font-weight: 450;
        cursor: pointer; text-align: left; width: 100%; letter-spacing: 0.01em;
        transition: background .16s, color .16s, border-color .16s;
      }
      .dk-nav:hover { background: rgba(255,255,255,0.04); color: ${TEXT}; }
      .dk-nav[data-active="true"] {
        background: rgba(185,164,255,0.11); border-color: rgba(185,164,255,0.24); color: #F3EFFF; font-weight: 550;
      }
      .dk-nav[data-active="true"]::before {
        content: ''; position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
        width: 2px; height: 18px; border-radius: 2px; background: ${LILAC};
      }
      .dk-navgroup {
        font-size: 0.6rem; letter-spacing: 0.26em; text-transform: uppercase;
        color: ${FAINT}; font-family: ${FONT_MONO}; padding: 0 12px; margin: 14px 0 6px;
      }
      /* Pastilla de icono — convierte el glifo desnudo en algo "app pro" */
      .dk-nav-ico {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px;
        color: ${MUTE}; background: rgba(255,255,255,0.035); border: 1px solid ${HAIR};
        transition: color .16s, background .16s, border-color .16s, box-shadow .16s;
      }
      .dk-nav:hover .dk-nav-ico { color: ${TEXT}; background: rgba(255,255,255,0.07); }
      .dk-nav[data-active="true"] .dk-nav-ico {
        color: #1A1140; background: ${LILAC}; border-color: transparent;
        box-shadow: 0 2px 10px rgba(185,164,255,0.45);
      }

      /* CARD — cristal esmerilado: fondo oscuro translúcido + blur. Sobre la
         imagen de ciudad difumina el fondo y dispara el contraste del contenido;
         sobre el fondo casi-negro queda como panel sólido sobrio. */
      .dk-card {
        position: relative; border-radius: 14px;
        background: rgba(13,16,22,0.66);
        backdrop-filter: blur(16px) saturate(1.15);
        -webkit-backdrop-filter: blur(16px) saturate(1.15);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 34px rgba(0,0,0,0.45);
        transition: border-color .18s ease, background .18s ease, transform .18s ease;
      }
      .dk-card-hover:hover {
        border-color: rgba(255,255,255,0.18); background: rgba(18,22,30,0.72); transform: translateY(-2px);
      }

      /* BOTONES — sólidos y calmados (sin corte de esquina ni barrido) */
      .dk-btn {
        font: inherit; font-size: 0.82rem; font-weight: 550; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        padding: 9px 16px; border-radius: 10px; border: 1px solid transparent; letter-spacing: 0.01em;
        transition: filter .15s ease, transform .1s ease, background .15s ease, border-color .15s ease;
      }
      .dk-btn:disabled { cursor: not-allowed; opacity: 0.5; }
      .dk-btn-primary {
        color: #14110A; background: linear-gradient(180deg, #F4C04A, ${GOLD});
        border-color: rgba(255,255,255,0.16); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset;
      }
      .dk-btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
      .dk-btn-primary:active:not(:disabled) { transform: translateY(1px); filter: brightness(0.97); }
      .dk-btn-teal {
        color: #042b29; background: linear-gradient(180deg, #4FE3DA, ${TEAL});
        border-color: rgba(255,255,255,0.14); box-shadow: 0 1px 0 rgba(255,255,255,0.35) inset;
      }
      .dk-btn-teal:hover:not(:disabled) { filter: brightness(1.05); }
      .dk-btn-ghost {
        color: ${TEXT}; background: rgba(255,255,255,0.035); border-color: ${HAIR};
      }
      .dk-btn-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); }
      .dk-btn-ghost:active { transform: translateY(1px); }

      /* Botón de icono */
      .dk-icbtn {
        width: 36px; height: 36px; flex-shrink: 0; border-radius: 9px; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        color: ${TEXT_DIM}; background: rgba(255,255,255,0.035); border: 1px solid ${HAIR};
        transition: all .14s;
      }
      .dk-icbtn:hover { color: ${TEXT}; background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); }
      .dk-icbtn:active { transform: translateY(1px); }

      /* Chips */
      .dk-chip {
        font: inherit; font-size: 0.78rem; font-weight: 450; padding: 6px 13px; border-radius: 999px; cursor: pointer;
        color: ${TEXT_DIM}; background: rgba(255,255,255,0.035); border: 1px solid ${HAIR}; transition: all .14s;
      }
      .dk-chip:hover { color: ${TEXT}; background: rgba(255,255,255,0.07); }
      .dk-chip[data-active="true"] { color: #1A1140; border-color: transparent; background: ${LILAC}; font-weight: 550; }

      /* Campo de cristal */
      .dk-field {
        width: 100%; background: rgba(255,255,255,0.04); border: 1px solid ${HAIR}; border-radius: 10px;
        color: ${TEXT}; padding: 9px 13px; font: inherit; font-size: 0.86rem; outline: none;
        transition: border-color .16s, background .16s;
      }
      .dk-field::placeholder { color: ${FAINT}; }
      .dk-field:focus, .dk-field:hover { border-color: rgba(185,164,255,0.45); background: rgba(255,255,255,0.06); }
    `}</style>
  )
}

/* ════════════════════════════════ CARD ══════════════════════════════════════ */
export function Card({
  children, eyebrow, title, right, hover = false, pad = 20, style,
}: {
  children: ReactNode
  eyebrow?: string
  title?: string
  right?: ReactNode
  hover?: boolean
  pad?: number
  style?: CSSProperties
}) {
  return (
    <div className={`dk-card${hover ? ' dk-card-hover' : ''}`} style={{ padding: pad, ...style }}>
      {(eyebrow || title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <div style={{ fontSize: '0.98rem', fontWeight: 600, color: TEXT, marginTop: eyebrow ? 3 : 0, letterSpacing: '-0.01em' }}>{title}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function Eyebrow({ children, color = MUTE }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: '0.62rem', color, fontFamily: FONT_MONO, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════ BOTONES ════════════════════════════════════ */
type BtnProps = { children: ReactNode; full?: boolean; disabled?: boolean; onClick?: () => void; style?: CSSProperties }

export function PrimaryButton({ children, full, disabled, onClick, style }: BtnProps) {
  return <button className="dk-btn dk-btn-primary" disabled={disabled} onClick={onClick} style={{ width: full ? '100%' : 'auto', ...style }}>{children}</button>
}
export function TealButton({ children, full, disabled, onClick, style }: BtnProps) {
  return <button className="dk-btn dk-btn-teal" disabled={disabled} onClick={onClick} style={{ width: full ? '100%' : 'auto', ...style }}>{children}</button>
}
export function GhostButton({ children, full, disabled, onClick, style }: BtnProps) {
  return <button className="dk-btn dk-btn-ghost" disabled={disabled} onClick={onClick} style={{ width: full ? '100%' : 'auto', ...style }}>{children}</button>
}
export function IconButton({ children, title, onClick, style }: { children: ReactNode; title?: string; onClick?: () => void; style?: CSSProperties }) {
  return <button className="dk-icbtn" title={title} onClick={onClick} style={style}>{children}</button>
}

/* ════════════════════════════════ STAT ══════════════════════════════════════ */
/** Número grande y seguro + contexto apagado (jerarquía Hynex). */
export function Stat({
  value, label, delta, up, unit, accent = TEXT,
}: {
  value: string
  label: string
  delta?: string
  up?: boolean
  unit?: string
  accent?: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...NUM, fontSize: '1.85rem', fontWeight: 600, color: accent, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.8rem', color: MUTE, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
        <span style={{ fontSize: '0.78rem', color: TEXT_DIM }}>{label}</span>
        {delta && (
          <span style={{ ...NUM, fontSize: '0.72rem', fontWeight: 600, color: up ? GREEN : RED, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {up ? '▲' : '▼'} {delta}
          </span>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════ STATUS PILL ══════════════════════════════════ */
const PILL_TONE: Record<string, { fg: string; bg: string; bd: string }> = {
  ok: { fg: '#8BE6AC', bg: 'rgba(70,209,127,0.13)', bd: 'rgba(70,209,127,0.32)' },
  warn: { fg: '#F0C879', bg: 'rgba(232,177,76,0.13)', bd: 'rgba(232,177,76,0.32)' },
  pending: { fg: '#F0C879', bg: 'rgba(232,177,76,0.10)', bd: 'rgba(232,177,76,0.26)' },
  info: { fg: '#8FC0FF', bg: 'rgba(94,157,255,0.13)', bd: 'rgba(94,157,255,0.30)' },
  bad: { fg: '#EDA39C', bg: 'rgba(224,133,126,0.13)', bd: 'rgba(224,133,126,0.32)' },
  neutral: { fg: TEXT_DIM, bg: 'rgba(255,255,255,0.05)', bd: HAIR },
}
export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof PILL_TONE }) {
  const c = PILL_TONE[tone] ?? PILL_TONE.neutral!
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 550, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, padding: '3px 9px', borderRadius: 999, letterSpacing: '0.01em' }}>
      {children}
    </span>
  )
}

/* ═══════════════════════════ ÁREA / SPARKLINE ═══════════════════════════════ */
/** Gráfica de área suave con degradado + línea (firma visual Hynex). */
export function AreaSparkline({
  data, color = TEAL, height = 56, strokeW = 1.8, glow = true, fill = true,
}: {
  data: number[]
  color?: string
  height?: number
  strokeW?: number
  glow?: boolean
  fill?: boolean
}) {
  const gid = useId().replace(/:/g, '')
  const W = 240
  const H = height
  const pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const n = data.length
  const xs = (i: number) => pad + (i * (W - pad * 2)) / (n - 1)
  const ys = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2)
  // Path suave (Catmull-Rom → Bézier). smoothPath redondea → SSR-safe.
  const pts = data.map((v, i) => [xs(i), ys(v)] as const)
  const d = smoothPath(pts)
  const area = `${d} L ${rr(xs(n - 1))} ${H} L ${rr(xs(0))} ${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#g${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" style={glow ? { filter: `drop-shadow(0 0 4px ${color}66)` } : undefined} />
    </svg>
  )
}

/* ═══════════════════════════════ DONUT ══════════════════════════════════════ */
export function Donut({
  value, size = 92, stroke = 9, color = TEAL, color2, label, sub,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  color2?: string //  si se pasa, anillo con degradado color→color2
  label?: string
  sub?: string
}) {
  const gid = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100)
  const ringStroke = color2 ? `url(#dn${gid})` : color
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`dn${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color2 ?? color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringStroke} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ filter: `drop-shadow(0 0 5px ${(color2 ?? color)}66)`, transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ ...NUM, fontSize: size * 0.26, fontWeight: 600, color: TEXT, lineHeight: 1 }}>{label ?? `${value}%`}</div>
          {sub && <div style={{ fontSize: '0.6rem', color: MUTE, marginTop: 2, letterSpacing: '0.04em' }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════ BARRA SEGMENTADA ══════════════════════════════ */
export function SegmentBar({
  segments, height = 9, legend = true,
}: {
  segments: { label: string; value: number; color: string }[]
  height?: number
  legend?: boolean
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div>
      <div style={{ display: 'flex', width: '100%', height, borderRadius: 999, overflow: 'hidden', gap: 2, background: 'rgba(255,255,255,0.05)' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color, borderRadius: 999 }} />
        ))}
      </div>
      {legend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 11 }}>
          {segments.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.74rem', color: TEXT_DIM }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              {s.label}
              <span style={{ ...NUM, color: MUTE }}>{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═════════════════════ GRÁFICA GRANDE MULTI-SERIE (impacto) ═════════════════ */
// Redondeo a 2 decimales — evita divergencias de último-ULP de Math.sin entre
// SSR (Node) y cliente (navegador) que provocan hydration mismatch en el `d`.
const rr = (x: number) => Math.round(x * 100) / 100

function smoothPath(pts: (readonly [number, number])[]): string {
  let d = `M ${rr(pts[0]![0])} ${rr(pts[0]![1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${rr(c1x)} ${rr(c1y)} ${rr(c2x)} ${rr(c2y)} ${rr(p2[0])} ${rr(p2[1])}`
  }
  return d
}

/** Varias series de color sobre un mismo eje — la gráfica "hero" del overview. */
export function MultiArea({
  series, height = 150, grid = true,
}: {
  series: { data: number[]; color: string; label?: string }[]
  height?: number
  grid?: boolean
}) {
  const gid = useId().replace(/:/g, '')
  const W = 520
  const H = height
  const pad = 8
  const all = series.flatMap((s) => s.data)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const n = Math.max(...series.map((s) => s.data.length))
  const xs = (i: number) => pad + (i * (W - pad * 2)) / (n - 1)
  const ys = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`ma${gid}-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {grid && [0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => [xs(i), ys(v)] as const)
        const line = smoothPath(pts)
        const area = `${line} L ${xs(s.data.length - 1)} ${H} L ${xs(0)} ${H} Z`
        return (
          <g key={si}>
            <path d={area} fill={`url(#ma${gid}-${si})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${s.color}66)` }} />
          </g>
        )
      })}
    </svg>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.76rem', color: TEXT_DIM }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: it.color, boxShadow: `0 0 6px ${it.color}88`, flexShrink: 0 }} />
          {it.label}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════ TEXTURAS PREMIUM (aurora + grano) ═══════════════════ */
/** Manchas de degradado difuminadas (violeta/teal/oro) — profundidad de color
    a través del cristal, sin ruido HUD. Va detrás del contenido de un panel. */
export function Aurora({ opacity = 1 }: { opacity?: number }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit', opacity }}>
      <div style={{ position: 'absolute', width: '42%', height: '170%', left: '-4%', top: '-35%', background: `radial-gradient(circle, ${LILAC}33, transparent 64%)`, filter: 'blur(44px)' }} />
      <div style={{ position: 'absolute', width: '40%', height: '170%', left: '34%', top: '-20%', background: `radial-gradient(circle, ${GREEN}2a, transparent 64%)`, filter: 'blur(46px)' }} />
      <div style={{ position: 'absolute', width: '38%', height: '160%', right: '-6%', top: '-10%', background: `radial-gradient(circle, ${GOLD}24, transparent 66%)`, filter: 'blur(48px)' }} />
    </div>
  )
}

/** Grano de película procedural (feTurbulence) — textura fina premium. */
const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"
export function Grain({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', opacity, mixBlendMode: 'overlay', backgroundImage: `url("${GRAIN_URI}")`, backgroundSize: '160px 160px' }} />
  )
}

// Paleta de series para gráficas (orden estable)
export const SERIES = [TEAL, GOLD, VIOLET, BLUE, GREEN, AMBER] as const
export const WHITE = '#EAF2FF'
