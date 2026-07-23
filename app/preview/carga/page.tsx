'use client'

// Sandbox de REVISIÓN del cubicaje + asignación automática de contenedor.
// Detrás del candado de la demo pero SIN sesión (como /preview/escritorio):
// José (o un inversor) toca cantidades y ve al motor decidir en vivo:
//   · carga < 40% del contenedor más pequeño → GRUPAJE (LCL)  [regla José 12-jun]
//   · si cabe → el contenedor MÁS PEQUEÑO posible (20ST → 40ST → 40HC)
//   · más grande que un 40HC → MULTI contenedor
//   · bulto imposible → carga especial (break-bulk)
// El 3D de abajo dibuja el empaquetado real (binpackingjs) del resultado.

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  assignContainer,
  LCL_THRESHOLD_FRACTION,
  type CargoItem,
} from '@/app/lib/containerAssign'
import { CONTAINER_SPECS } from '@/app/data/containerSpecs'
import type { ContainerLoadViewItem } from '@/app/components/ContainerLoadView'

const ContainerLoadView = dynamic(() => import('@/app/components/ContainerLoadView'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#9FB6CC' }}>Cargando visor 3D…</div>
  ),
})

// ─── Catálogo de bultos de demostración (medidas y pesos realistas) ─────────
interface DemoLine {
  id: string
  name: string
  length_mm: number
  width_mm: number
  height_mm: number
  weight_kg: number
  color_hex: string
  this_way_up?: boolean
}
const DEMO_LINES: DemoLine[] = [
  { id: 'caja', name: 'Caja mediana (60×40×40 · 12 kg)', length_mm: 600, width_mm: 400, height_mm: 400, weight_kg: 12, color_hex: '#3b82f6' },
  { id: 'palet', name: 'Palet europeo (120×80×144 · 350 kg)', length_mm: 1200, width_mm: 800, height_mm: 1440, weight_kg: 350, color_hex: '#22c55e' },
  { id: 'armario', name: 'Armario embalado (220 alto · de pie · 95 kg)', length_mm: 1200, width_mm: 650, height_mm: 2200, weight_kg: 95, color_hex: '#a855f7', this_way_up: true },
  { id: 'sofa', name: 'Sofá 3 plazas embalado (230×95×90 · 80 kg)', length_mm: 2300, width_mm: 950, height_mm: 900, weight_kg: 80, color_hex: '#f97316' },
  { id: 'denso', name: 'Caja herrajes DENSA (50×50×50 · 240 kg)', length_mm: 500, width_mm: 500, height_mm: 500, weight_kg: 240, color_hex: '#ef4444' },
]

// Presets que cuentan la historia completa en un clic.
const PRESETS: { label: string; qty: Record<string, number> }[] = [
  { label: 'Pedido pequeño → grupaje', qty: { caja: 8, sofa: 1 } },
  { label: 'Pedido mediano → 20ST', qty: { palet: 12, caja: 10 } },
  { label: 'Pedido grande → 40HC', qty: { palet: 30, armario: 8, sofa: 4 } },
  { label: 'Pedido gigante → multi', qty: { palet: 80, armario: 20, sofa: 12, caja: 60 } },
  { label: 'Denso (poco volumen, mucho kilo)', qty: { denso: 48 } },
]

const MODE_META: Record<string, { label: string; color: string }> = {
  LCL: { label: 'GRUPAJE (LCL)', color: '#f59e0b' },
  FCL: { label: 'CONTENEDOR COMPLETO (FCL)', color: '#22c55e' },
  MULTI: { label: 'MULTI-CONTENEDOR', color: '#a855f7' },
  UNFIT: { label: 'CARGA ESPECIAL', color: '#ef4444' },
}

export default function PreviewCargaPage() {
  const [qty, setQty] = useState<Record<string, number>>(PRESETS[1].qty)

  const cargo: CargoItem[] = useMemo(
    () =>
      DEMO_LINES.filter((l) => (qty[l.id] ?? 0) > 0).map((l) => ({
        id: l.id,
        length_mm: l.length_mm,
        width_mm: l.width_mm,
        height_mm: l.height_mm,
        weight_kg: l.weight_kg,
        quantity: qty[l.id] ?? 0,
        required_orientation: l.this_way_up ? ('this_way_up' as const) : undefined,
      })),
    [qty],
  )

  const result = useMemo(() => assignContainer(cargo), [cargo])
  const meta = MODE_META[result.mode]
  const umbral = CONTAINER_SPECS['20ST'].inner_volume_m3 * LCL_THRESHOLD_FRACTION

  const viewItems: ContainerLoadViewItem[] = useMemo(
    () =>
      DEMO_LINES.filter((l) => (qty[l.id] ?? 0) > 0).map((l) => ({
        id: l.id,
        name: l.name,
        length_mm: l.length_mm,
        width_mm: l.width_mm,
        height_mm: l.height_mm,
        weight_kg: l.weight_kg,
        quantity: qty[l.id] ?? 0,
        color_hex: l.color_hex,
      })),
    [qty],
  )

  const card: React.CSSProperties = {
    background: '#0c1420',
    border: '1px solid #1d2a3a',
    borderRadius: 12,
    padding: '1.2rem 1.4rem',
  }
  const btn: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #2a3a4f',
    borderRadius: 8,
    color: '#c7d5e3',
    padding: '7px 12px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070c13', color: '#e7eef5', padding: '2rem 1.2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: '#7e93a8', textTransform: 'uppercase' }}>1503 · sandbox de revisión</div>
          <h1 style={{ fontSize: '1.5rem', margin: '4px 0 6px' }}>Carga de contenedor · asignación automática</h1>
          <p style={{ fontSize: '0.86rem', color: '#9FB6CC', margin: 0, lineHeight: 1.55 }}>
            Regla: si la mercancía no cubre el <strong>{LCL_THRESHOLD_FRACTION * 100}% del contenedor más pequeño</strong>{' '}
            (20ST · umbral {umbral.toFixed(1)} m³) → <strong>grupaje</strong>. Si cabe, se asigna el contenedor más
            pequeño posible; si desborda un 40&apos;HC → multi-contenedor. Toca cantidades y mira la decisión.
          </p>
        </header>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button key={p.label} style={btn} onClick={() => setQty(p.qty)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Líneas del pedido */}
        <section style={card}>
          <h2 style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#7e93a8', margin: '0 0 0.9rem' }}>Bultos del pedido</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_LINES.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.color_hex, flexShrink: 0 }} />
                <span style={{ flex: '1 1 320px', fontSize: '0.86rem' }}>
                  {l.name}
                  {l.this_way_up && <em style={{ color: '#f59e0b', fontStyle: 'normal', fontSize: '0.72rem' }}> · ⬆ no volcar</em>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button style={btn} onClick={() => setQty({ ...qty, [l.id]: Math.max(0, (qty[l.id] ?? 0) - 1) })}>−</button>
                  <input
                    type="number"
                    min={0}
                    value={qty[l.id] ?? 0}
                    onChange={(e) => setQty({ ...qty, [l.id]: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ width: 64, background: '#070c13', border: '1px solid #2a3a4f', borderRadius: 8, color: '#e7eef5', padding: '7px 8px', textAlign: 'center', fontFamily: 'inherit' }}
                  />
                  <button style={btn} onClick={() => setQty({ ...qty, [l.id]: (qty[l.id] ?? 0) + 1 })}>+</button>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Decisión del motor */}
        <section style={{ ...card, borderColor: meta.color }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#070c13', background: meta.color, borderRadius: 6, padding: '4px 10px' }}>
              {meta.label}
            </span>
            {result.container && (
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {CONTAINER_SPECS[result.container as Exclude<typeof result.container, 'LCL'>]?.display_name ?? result.container}
                {result.count > 1 ? ` × ${result.count}` : ''}
              </span>
            )}
            <span className="mono" style={{ fontSize: '0.78rem', color: '#9FB6CC' }}>
              {result.total_volume_m3} m³ · {result.total_weight_kg} kg
              {result.mode !== 'UNFIT' && ` · ocupación ${result.utilization_pct}%`}
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#c7d5e3', lineHeight: 1.55, margin: '10px 0 0' }}>{result.reason}</p>
        </section>

        {/* Visor 3D del empaquetado */}
        {(result.mode === 'FCL' || result.mode === 'MULTI') && result.container && (
          <section style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 540 }}>
              <ContainerLoadView containerType={result.container} items={viewItems} />
            </div>
            {result.mode === 'MULTI' && (
              <p style={{ fontSize: '0.74rem', color: '#9FB6CC', padding: '0.8rem 1.2rem', margin: 0 }}>
                Vista del primer contenedor de {result.count}; el reparto fino entre contenedores lo hace el
                transitario al consolidar.
              </p>
            )}
          </section>
        )}
        {result.mode === 'LCL' && (
          <section style={{ ...card, borderStyle: 'dashed' }}>
            <p style={{ fontSize: '0.86rem', color: '#c7d5e3', margin: 0, lineHeight: 1.6 }}>
              📦 Este pedido viaja en <strong>grupaje</strong>: comparte contenedor con otros pedidos del mismo
              corredor. El coste se reparte por volumen/peso (W/M) y la consolidación final la hace el transitario.
            </p>
          </section>
        )}

        <footer style={{ fontSize: '0.68rem', color: '#5d7186' }}>
          Motor: app/lib/containerAssign.ts (regla José 12-jun · specs ISO 6346) · empaquetado 3D: binpackingjs ·
          peso y medidas del bulto son OBLIGATORIOS en el DPP para mercancía física (gate de publicación).
        </footer>
      </div>
    </main>
  )
}
