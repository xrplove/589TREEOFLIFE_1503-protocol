'use client'

/**
 * ContainerLoad · cubicaje REAL. Usa las dimensiones físicas (L×An×Al en cm) y
 * el peso (kg) de cada artículo del pedido, contra las medidas internas reales
 * de un contenedor 40' HC. Calcula volumen y peso OCUPADOS de verdad y dibuja
 * cada bulto con su PROPORCIÓN real (una ventana = losa plana, no un cubo).
 *
 * Empaquetado: heurística de estiba por filas/capas (first-fit). NO es óptimo
 * (el bin-packing 3D es NP-difícil) — pero el volumen y el peso son EXACTOS y
 * las formas reales, así que sirve como base honesta de plano de carga.
 *
 * Unidad canónica interna: CENTÍMETROS (ver nota mm/cm en el ADR de cubicaje).
 */

import type { OrderLine } from './PedidoVivo'

const TEAL = '#2FD2C9'
const TEXT = '#E8EDF5'
const MUTE = '#8A98AD'
const FAINT = '#5A6678'
const GOLD = '#F0B429'
const STEEL = 'rgba(150,170,194,0.55)'

// Contenedor 40' High Cube · medidas INTERNAS reales (cm) · payload máx (kg).
const CONT = { L: 1203, W: 235, H: 269, maxKg: 28200 }
const CONT_VOL = CONT.L * CONT.W * CONT.H // cm³
const MAX_BOXES = 260 // tope de render por rendimiento

function shade(hex: string, p: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(p > 0 ? c + (255 - c) * p : c * (1 + p))))
  return '#' + [f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export default function ContainerLoad({ lines, mode }: { lines: OrderLine[]; mode: 'manual' | 'auto' }) {
  // Proyección isométrica (cm → px)
  const kx = 0.3, ky = 0.15, kz = 0.3, ox = 92, oy = 104
  const iso = (x: number, y: number, z: number) => ({ sx: ox + (x - y) * kx, sy: oy + (x + y) * ky - z * kz })

  // Métricas reales
  let usedVol = 0, usedKg = 0, totalUnits = 0
  for (const l of lines) { usedVol += l.qty * l.box.L * l.box.W * l.box.H; usedKg += l.qty * l.box.kg; totalUnits += l.qty }
  const volPct = (usedVol / CONT_VOL) * 100
  const wPct = (usedKg / CONT.maxKg) * 100
  const gauge = Math.max(volPct, wPct)
  const binding = wPct >= volPct ? 'peso' : 'volumen'
  // Flete LCL/grupaje · regla W/M: facturable = máx(m³, toneladas). Conversión a m³.
  const m3Used = usedVol / 1_000_000
  const chargeableM3 = Math.max(m3Used, usedKg / 1000)
  const FREIGHT_RATE = 85 // €/m³ (o tonelada) · tarifa LCL de ejemplo
  const freightEst = Math.max(35, Math.round(chargeableM3 * FREIGHT_RATE))
  const needsGrupaje = gauge < 50 // no llena un FCL → LCL más eficiente

  // Estiba heurística (first-fit por filas → capas). Footprint L×An, altura Al.
  type P = { x: number; y: number; z: number; dx: number; dy: number; dz: number; hue: string }
  const placed: P[] = []
  let x = 0, y = 0, z = 0, rowW = 0, layerH = 0, overflow = 0
  outer: for (const l of lines) {
    for (let i = 0; i < l.qty; i++) {
      const dx = l.box.L, dy = l.box.W, dz = l.box.H
      if (placed.length >= MAX_BOXES) { overflow += (l.qty - i); break }
      if (x + dx > CONT.L) { x = 0; y += rowW; rowW = 0 }
      if (y + dy > CONT.W) { y = 0; z += layerH; layerH = 0 }
      if (z + dz > CONT.H) { overflow += 1; continue }
      placed.push({ x, y, z, dx, dy, dz, hue: l.hue })
      x += dx; rowW = Math.max(rowW, dy); layerH = Math.max(layerH, dz)
    }
    if (placed.length >= MAX_BOXES) break outer
  }
  placed.sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z))

  // Esquinas del contenedor
  const k = {
    c000: iso(0, 0, 0), cL00: iso(CONT.L, 0, 0), cLW0: iso(CONT.L, CONT.W, 0), c0W0: iso(0, CONT.W, 0),
    c00H: iso(0, 0, CONT.H), cL0H: iso(CONT.L, 0, CONT.H), cLWH: iso(CONT.L, CONT.W, CONT.H), c0WH: iso(0, CONT.W, CONT.H),
  }
  const poly = (...pts: { sx: number; sy: number }[]) => pts.map((p) => `${p.sx},${p.sy}`).join(' ')
  const line2 = (a: { sx: number; sy: number }, b: { sx: number; sy: number }, key: string) => <line key={key} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={STEEL} strokeWidth="1.3" />

  const m3 = (cm3: number) => (cm3 / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 2 })

  return (
    <div className="cl-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <Gauge pct={gauge} binding={binding} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: TEXT }}>Contenedor 40&apos; HC · {totalUnits - overflow} de {totalUnits} bultos</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 5, flexWrap: 'wrap' }}>
            <Metric label="Volumen" value={`${m3(usedVol)} / 76,0 m³`} sub={`${volPct.toFixed(1)}%`} hot={binding === 'volumen'} />
            <Metric label="Peso" value={`${usedKg.toLocaleString('es-ES')} / 28.200 kg`} sub={`${wPct.toFixed(1)}%`} hot={binding === 'peso'} />
          </div>
          <div style={{ fontSize: 11, color: MUTE, marginTop: 5 }}>
            {mode === 'auto' ? `Auto-estiba heurística · limita el ${binding}.` : 'Modo manual · arrastrar para recolocar (próximamente).'}
          </div>
          {overflow > 0 && <div style={{ fontSize: 11, color: GOLD, marginTop: 4 }}>+{overflow} bultos no caben en este contenedor → requiere 2º contenedor</div>}
        </div>
      </div>

      {/* Modo de envío · grupaje (LCL) vs contenedor completo (FCL) */}
      <div className="cl-ship" style={{ borderColor: needsGrupaje ? 'rgba(240,180,41,0.3)' : 'rgba(126,224,160,0.3)', background: needsGrupaje ? 'rgba(240,180,41,0.06)' : 'rgba(126,224,160,0.06)' }}>
        <div style={{ flex: 1 }}>
          {needsGrupaje ? (
            <>
              <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 600 }}>Recomendado: GRUPAJE (LCL) — no llenas un contenedor completo</div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3 }}>
                Ruta: <strong style={{ color: TEXT }}>Valencia (ESVLC) → Rotterdam (NLRTM)</strong> · solo consolida misma ruta
              </div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3 }}>
                En esta ruta ya hay <strong style={{ color: TEAL }}>18,4 m³</strong> consolidados de otros vendedores · te unes y compartís contenedor + coste
              </div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3 }}>
                Facturable (regla W/M = máx volumen/peso): <strong style={{ color: GOLD }}>{chargeableM3.toFixed(2)} m³</strong> · flete estimado <strong style={{ color: GOLD }}>~{freightEst} €</strong>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 600 }}>✓ Contenedor completo (FCL) eficiente · ocupación {Math.round(gauge)}%</div>
          )}
          {overflow > 0 && <div style={{ fontSize: 11, color: GOLD, marginTop: 4 }}>+{overflow} bultos sobran → grupaje del excedente o 2º contenedor</div>}
        </div>
        {needsGrupaje && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <button className="cl-grupaje">Unirse a grupaje</button>
            <button className="cl-grupaje cl-grupaje-alt">+ Crear contenedor compartido</button>
          </div>
        )}
      </div>

      <svg viewBox="-14 -6 512 384" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* sombra bajo el contenedor */}
        <ellipse cx={(k.c000.sx + k.cLW0.sx) / 2} cy={k.cLW0.sy + 12} rx={220} ry={26} fill="rgba(0,0,0,0.42)" />

        {/* suelo + paredes traseras (semitransparentes para ver la carga) */}
        <polygon points={poly(k.c000, k.cL00, k.cLW0, k.c0W0)} fill="rgba(18,26,42,0.6)" stroke={STEEL} strokeWidth="1" />
        <polygon points={poly(k.c000, k.cL00, k.cL0H, k.c00H)} fill="rgba(14,20,34,0.55)" stroke={STEEL} strokeWidth="0.8" />
        <polygon points={poly(k.c000, k.c0W0, k.c0WH, k.c00H)} fill="rgba(10,15,26,0.5)" stroke={STEEL} strokeWidth="0.8" />

        {/* rejilla del suelo · cada 200 cm a lo largo (da escala y profundidad) */}
        {Array.from({ length: Math.max(0, Math.floor((CONT.L - 1) / 200)) }, (_, i) => {
          const xx = (i + 1) * 200
          const a = iso(xx, 0, 0), b = iso(xx, CONT.W, 0)
          return <line key={`grid-${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="rgba(150,170,194,0.13)" strokeWidth="0.6" />
        })}

        {/* bultos con proporciones reales · pequeño huelgo entre cajas */}
        {placed.map((p, i) => {
          const g = 1.5
          const x0 = p.x + g, x1 = p.x + p.dx - g, y0 = p.y + g, y1 = p.y + p.dy - g, zt = p.z + p.dz
          const A = iso(x0, y0, zt), B = iso(x1, y0, zt), Cc = iso(x1, y1, zt), D = iso(x0, y1, zt)
          const xb = iso(x1, y0, p.z), xc = iso(x1, y1, p.z)
          const yb = iso(x0, y1, p.z), yc = iso(x1, y1, p.z)
          return (
            <g key={i} className="cl-box" style={{ animationDelay: `${Math.min(i * 12, 600)}ms` }}>
              <polygon points={poly(D, Cc, yc, yb)} fill={shade(p.hue, -0.34)} />
              <polygon points={poly(B, Cc, xc, xb)} fill={shade(p.hue, -0.14)} />
              <polygon points={poly(A, B, Cc, D)} fill={shade(p.hue, 0.27)} stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            </g>
          )
        })}

        {/* marco superior + bordes delanteros (cage) */}
        {line2(k.c00H, k.cL0H, 't0')}{line2(k.cL0H, k.cLWH, 't1')}{line2(k.cLWH, k.c0WH, 't2')}{line2(k.c0WH, k.c00H, 't3')}
        {line2(k.cL00, k.cLW0, 'f0')}{line2(k.c0W0, k.cLW0, 'f1')}

        {/* montantes de esquina · acero (más gruesos = contenedor robusto) */}
        {[[k.c000, k.c00H], [k.cL00, k.cL0H], [k.cLW0, k.cLWH], [k.c0W0, k.c0WH]].map(([a, b], i) => (
          <line key={`post-${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="rgba(176,196,220,0.82)" strokeWidth="2.4" strokeLinecap="round" />
        ))}

        {/* cotas reales · convierte la escena en plano de carga */}
        <g fontFamily="var(--font-dm-mono), monospace" fontSize="9" fill={MUTE} letterSpacing="0.04em">
          <text x={(k.c0W0.sx + k.cLW0.sx) / 2} y={(k.c0W0.sy + k.cLW0.sy) / 2} transform={`rotate(26.57 ${(k.c0W0.sx + k.cLW0.sx) / 2} ${(k.c0W0.sy + k.cLW0.sy) / 2})`} dy="15" textAnchor="middle">12,03 m</text>
          <text x={(k.cLW0.sx + k.cL00.sx) / 2} y={(k.cLW0.sy + k.cL00.sy) / 2} transform={`rotate(-26.57 ${(k.cLW0.sx + k.cL00.sx) / 2} ${(k.cLW0.sy + k.cL00.sy) / 2})`} dy="14" textAnchor="middle">2,35 m</text>
          <text x={k.c0W0.sx - 5} y={(k.c0W0.sy + k.c0WH.sy) / 2} transform={`rotate(-90 ${k.c0W0.sx - 5} ${(k.c0W0.sy + k.c0WH.sy) / 2})`} dy="-3" textAnchor="middle">2,69 m</text>
        </g>
      </svg>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
        {lines.map((l) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: l.hue }} />
            <span style={{ color: MUTE }}>{l.name}</span>
            <span style={{ color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{l.box.L}×{l.box.W}×{l.box.H} cm · {l.qty} {l.unidad}</span>
          </div>
        ))}
      </div>
      <style>{`
        .cl-box{opacity:0;animation:clFade .35s ease forwards;}@keyframes clFade{to{opacity:1;}}
        .cl-ship{display:flex;align-items:center;gap:12px;padding:11px 14px;margin-bottom:12px;border-radius:11px;border:1px solid;}
        .cl-grupaje{font:inherit;font-size:12px;font-weight:600;color:#1A1206;cursor:pointer;padding:9px 15px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);
          background:linear-gradient(180deg,#FFD166,#F0B429 48%,#D89A18);box-shadow:0 4px 12px rgba(240,180,41,0.35),inset 0 1px 0 rgba(255,255,255,0.7);white-space:nowrap;}
        .cl-grupaje:hover{filter:brightness(1.06);}
        .cl-grupaje-alt{background:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03));color:${TEXT};border:1px solid rgba(47,210,201,0.4);box-shadow:none;}
        .cl-grupaje-alt:hover{border-color:rgba(47,210,201,0.7);filter:none;background:rgba(47,210,201,0.1);}
      `}</style>
    </div>
  )
}

function Metric({ label, value, sub, hot }: { label: string; value: string; sub: string; hot: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.1em' }}>{label.toUpperCase()} {hot && <span style={{ color: GOLD }}>· limita</span>}</div>
      <div style={{ fontSize: 12.5, color: TEXT, fontFamily: 'var(--font-dm-mono), monospace', marginTop: 1 }}>{value} <span style={{ color: hot ? GOLD : TEAL }}>({sub})</span></div>
    </div>
  )
}

function Gauge({ pct, binding }: { pct: number; binding: string }) {
  const R = 30, C = 2 * Math.PI * R, off = C * (1 - Math.min(100, pct) / 100)
  const show = pct < 1 ? '<1' : Math.round(pct).toString()
  return (
    <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
      <svg viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle cx="38" cy="38" r={R} fill="none" stroke={TEAL} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ filter: 'drop-shadow(0 0 5px rgba(47,210,201,0.5))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: TEXT }}>{show}<span style={{ fontSize: 10, color: MUTE }}>%</span></div>
    </div>
  )
}
