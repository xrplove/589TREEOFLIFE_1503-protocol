'use client'

/**
 * MAPA DE CARGA 2D · plano de estiba imprimible (planta + perfil).
 * ---------------------------------------------------------------------------
 * El artefacto que usa el operario en el muelle: dónde va cada bulto.
 * NO duplica el cubicaje: consume el MISMO layout que el visor 3D
 * (app/lib/cargoPack.ts → packCargoLayout). SVG puro (sin WebGL), imprimible.
 *
 *   · Planta  (vista superior): largo × ancho · huella de cada bulto en el suelo.
 *   · Perfil  (vista lateral):  largo × alto  · apilado y aprovechamiento en altura.
 */

import { useMemo } from 'react'
import { packCargoLayout, type CargoInput } from '../lib/cargoPack'
import type { ContainerType } from '../data/containerSpecs'
import { FONT_MONO, GREEN, HAIR, HAIR_STRONG, MUTE, TEXT, TEXT_DIM } from './workspace/ui/tokens'

const PX = 680 // ancho de dibujo del lado largo

function Plano({
  title, axis, boxes, planW, planH, scale, flipY,
}: {
  title: string
  axis: string
  boxes: { key: string; x: number; y: number; w: number; h: number; color: string; n: number }[]
  planW: number
  planH: number
  scale: number
  flipY?: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', color: TEXT_DIM, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: '0.62rem', color: MUTE, fontFamily: FONT_MONO }}>{axis}</span>
      </div>
      <svg width="100%" viewBox={`-2 -2 ${planW + 4} ${planH + 4}`} style={{ display: 'block', borderRadius: 8, background: 'rgba(255,255,255,0.015)' }}>
        {/* Contorno del contenedor */}
        <rect x={0} y={0} width={planW} height={planH} fill="none" stroke={HAIR_STRONG} strokeWidth={1.4} rx={3} />
        {boxes.map((b) => {
          const yy = flipY ? planH - b.y - b.h : b.y
          return (
            <g key={b.key}>
              <rect x={b.x} y={yy} width={b.w} height={b.h} fill={b.color} fillOpacity={0.42} stroke={b.color} strokeWidth={1} rx={1.5} />
              {b.w > 16 && b.h > 12 ? (
                <text x={b.x + b.w / 2} y={yy + b.h / 2} fill={TEXT} fontSize={Math.min(11, b.h * 0.6)} fontFamily="monospace" textAnchor="middle" dominantBaseline="central">{b.n}</text>
              ) : null}
            </g>
          )
        })}
        {/* escala de referencia 1 m */}
        <line x1={0} y1={planH + 1.5} x2={scale * 1000} y2={planH + 1.5} stroke={MUTE} strokeWidth={0.8} />
      </svg>
    </div>
  )
}

export default function LoadMap({
  containerType, items,
}: {
  containerType: ContainerType
  items: CargoInput[]
}) {
  const { layout, indexById, legend } = useMemo(() => {
    const layout = packCargoLayout(containerType, items)
    const indexById = new Map<string, number>()
    const legend: { id: string; n: number; name: string; color: string; dims: string; m3: number; count: number }[] = []
    items.forEach((it) => {
      if (!indexById.has(it.id)) {
        const n = indexById.size + 1
        indexById.set(it.id, n)
        const m3 = Math.round((it.length_mm * it.width_mm * it.height_mm) / 1e9 * 1000) / 1000
        legend.push({
          id: it.id, n, name: it.name, color: it.color_hex ?? '#c89860',
          dims: `${it.length_mm}×${it.width_mm}×${it.height_mm} mm`, m3, count: it.quantity,
        })
      }
    })
    return { layout, indexById, legend }
  }, [containerType, items])

  if (!layout.spec) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: MUTE, fontSize: '0.84rem' }}>Sin contenedor que mapear.</div>
  }
  const spec = layout.spec
  const scale = PX / spec.inner_length_mm

  const plantaW = spec.inner_length_mm * scale
  const plantaH = spec.inner_width_mm * scale
  const perfilH = spec.inner_height_mm * scale

  // Orden por altura asc → los de arriba se dibujan encima (apilados visibles).
  const sorted = [...layout.placed].sort((a, b) => a.y - b.y)
  const plantaBoxes = sorted.map((b, i) => ({
    key: `${b.id}_${i}`, x: b.x * scale, y: b.z * scale, w: b.l * scale, h: b.w * scale,
    color: b.color, n: indexById.get(b.id) ?? 0,
  }))
  const perfilBoxes = sorted.map((b, i) => ({
    key: `${b.id}_${i}`, x: b.x * scale, y: b.y * scale, w: b.l * scale, h: b.h * scale,
    color: b.color, n: indexById.get(b.id) ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 2px 2px' }}>
      <Plano
        title="Planta · vista superior"
        axis={`largo ${(spec.inner_length_mm / 1000).toFixed(2)} m × ancho ${(spec.inner_width_mm / 1000).toFixed(2)} m · puerta a la derecha →`}
        boxes={plantaBoxes} planW={plantaW} planH={plantaH} scale={scale}
      />
      <Plano
        title="Perfil · vista lateral"
        axis={`largo ${(spec.inner_length_mm / 1000).toFixed(2)} m × alto ${(spec.inner_height_mm / 1000).toFixed(2)} m`}
        boxes={perfilBoxes} planW={plantaW} planH={perfilH} scale={scale} flipY
      />

      {/* Leyenda · color → producto */}
      <div>
        <div style={{ fontSize: '0.62rem', color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>Leyenda</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {legend.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: `1px solid ${HAIR}` }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: l.color, opacity: 0.6, border: `1px solid ${l.color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.66rem', color: TEXT, fontFamily: 'monospace' }}>{l.n}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
              <span style={{ fontSize: '0.7rem', color: TEXT_DIM, fontFamily: FONT_MONO }}>{l.dims} · {l.m3} m³</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.72rem', color: layout.unfitCount > 0 ? '#E0857E' : GREEN, fontFamily: FONT_MONO }}>
          {layout.packedCount} bultos colocados{layout.unfitCount > 0 ? ` · ${layout.unfitCount} sin cabida (a grupaje / contenedor adicional)` : ' · 100% cabe'}
        </div>
      </div>
    </div>
  )
}
