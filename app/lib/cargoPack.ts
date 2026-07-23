// Empaquetado de carga · FUENTE ÚNICA del layout de bultos en el contenedor.
// ---------------------------------------------------------------------------
// Extraído para que NO se duplique el cálculo entre las dos vistas que lo usan:
//   · ContainerLoadView (visor 3D React Three Fiber)
//   · LoadMap           (mapa de carga 2D · planta + perfil, imprimible)
// Ambas parten del MISMO layout → coherencia garantizada.
//
// LAYOUT determinista de "estiba por filas" (no binpackingjs): coloca los bultos
// repartidos por el SUELO en filas que cruzan el ancho y avanzan a lo largo del
// contenedor, ordenados por longitud para minimizar huecos; si el suelo se llena,
// apila sobre un bulto compatible. Da una carga creíble (como un contenedor real),
// no la "escalera" amontonada del bin-packing genérico. La consolidación fina la
// confirma el transitario; aquí se visualiza una estiba razonable.
//
// Convención de ejes (mundo 1503, coherente con el visor 3D):
//   x = a lo largo del contenedor (largo)   · y = alto   · z = ancho
// Posiciones = esquina mínima del bulto (mm); (l,h,w) = dimensiones ya colocadas.

import {
  CONTAINER_SPECS,
  isCubicajeContainer,
  type ContainerSpec,
  type ContainerType,
} from '../data/containerSpecs'

// Paleta compartida (color estable por bulto si el origen no aporta uno).
export const CARGO_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#a855f7',
]
export function cargoColor(index: number, override?: string): string {
  if (override) return override
  return CARGO_PALETTE[index % CARGO_PALETTE.length]!
}

export interface CargoInput {
  id: string
  name: string
  length_mm: number
  width_mm: number
  height_mm: number
  weight_kg: number
  quantity: number
  color_hex?: string
}

/** Un bulto colocado en el contenedor (mm · esquina mínima + dims colocadas). */
export interface PlacedBox {
  id: string
  name: string
  color: string
  x: number; y: number; z: number // esquina mínima · x=largo, y=alto, z=ancho
  l: number; h: number; w: number // dimensiones colocadas · largo, alto, ancho
}

export interface CargoLayout {
  spec: ContainerSpec | null
  placed: PlacedBox[]
  unfitCount: number
  packedCount: number
}

interface Unit {
  id: string
  name: string
  color: string
  l: number // largo (x)
  w: number // ancho (z)
  h: number // alto (y)
}

/** Expande cantidades a bultos individuales con color estable por bulto. */
function expandUnits(items: CargoInput[]): Unit[] {
  const out: Unit[] = []
  items.forEach((it, idx) => {
    const color = cargoColor(idx, it.color_hex)
    for (let n = 0; n < it.quantity; n++) {
      out.push({ id: it.id, name: it.name, color, l: it.length_mm, w: it.width_mm, h: it.height_mm })
    }
  })
  return out
}

const EPS = 1

// Skyline del suelo: frontera en x (cuánto se ha avanzado a lo largo) por cada
// tramo del ancho z. Empieza plana en x=0 sobre todo el ancho.
interface Seg { z0: number; z1: number; x: number }

/** x máxima de la frontera sobre la ventana [za,zb) (dónde se posaría un bulto). */
function frontierMax(sky: Seg[], za: number, zb: number): number {
  let m = 0
  for (const s of sky) {
    if (s.z1 <= za + EPS || s.z0 >= zb - EPS) continue
    if (s.x > m) m = s.x
  }
  return m
}

/** Sube la frontera sobre [za,zb) a newX (tras posar un bulto), y fusiona tramos. */
function raise(sky: Seg[], za: number, zb: number, newX: number): Seg[] {
  const out: Seg[] = []
  for (const s of sky) {
    if (s.z1 <= za + EPS || s.z0 >= zb - EPS) { out.push(s); continue }
    if (s.z0 < za) out.push({ z0: s.z0, z1: za, x: s.x })
    out.push({ z0: Math.max(s.z0, za), z1: Math.min(s.z1, zb), x: newX })
    if (s.z1 > zb) out.push({ z0: zb, z1: s.z1, x: s.x })
  }
  out.sort((a, b) => a.z0 - b.z0)
  const merged: Seg[] = []
  for (const s of out) {
    const last = merged[merged.length - 1]
    if (last && Math.abs(last.x - s.x) < EPS && Math.abs(last.z1 - s.z0) < EPS) last.z1 = s.z1
    else merged.push({ ...s })
  }
  return merged
}

/**
 * Layout "bottom-left" con skyline. Determinista: mismo input → mismo resultado.
 * Cada bulto se posa en el hueco más adelantado/izquierdo disponible, PEGADO
 * contra los anteriores → quedan unidos, sin huecos ni cajas sueltas. Si el suelo
 * se llena, apila sobre un bulto compatible; si no, queda fuera (→ grupaje).
 */
export function packCargoLayout(containerType: ContainerType, items: CargoInput[]): CargoLayout {
  if (!isCubicajeContainer(containerType)) {
    return { spec: null, placed: [], unfitCount: 0, packedCount: 0 }
  }
  const spec = CONTAINER_SPECS[containerType]
  const L = spec.inner_length_mm
  const W = spec.inner_width_mm
  const H = spec.inner_height_mm

  // Grandes primero (mejor asiento del skyline).
  const units = expandUnits(items).sort((a, b) => b.l * b.w - a.l * a.w || b.l - a.l)

  let sky: Seg[] = [{ z0: 0, z1: W, x: 0 }]
  const placed: PlacedBox[] = []
  const stacked = new Set<number>()
  let unfit = 0

  for (const u of units) {
    // Orientación en planta: el ancho (z) debe caber en W; gira 90° si hace falta.
    let l = u.l
    let w = u.w
    if (w > W + EPS && l <= W + EPS) { const t = l; l = w; w = t }
    if (u.h > H + EPS || Math.min(l, w) > W + EPS || l > L + EPS) { unfit++; continue }

    // Bottom-left: prueba posar en cada borde de tramo; elige x mínima (luego z mínima).
    let best: { x: number; z: number } | null = null
    for (const s of sky) {
      const z = s.z0
      if (z + w > W + EPS) continue
      const x = frontierMax(sky, z, z + w)
      if (x + l > L + EPS) continue
      if (!best || x < best.x - EPS || (Math.abs(x - best.x) < EPS && z < best.z)) best = { x, z }
    }

    if (best) {
      placed.push({ id: u.id, name: u.name, color: u.color, x: best.x, y: 0, z: best.z, l, h: u.h, w })
      sky = raise(sky, best.z, best.z + w, best.x + l)
      continue
    }

    // Suelo lleno → apilar sobre un bulto del suelo con huella compatible y altura libre.
    let hostIdx = -1
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i]!
      if (stacked.has(i) || p.y !== 0) continue
      if (l <= p.l + EPS && w <= p.w + EPS && p.h + u.h <= H + EPS) { hostIdx = i; break }
    }
    if (hostIdx >= 0) {
      const host = placed[hostIdx]!
      stacked.add(hostIdx)
      placed.push({ id: u.id, name: u.name, color: u.color, x: host.x, y: host.h, z: host.z, l, h: u.h, w })
    } else {
      unfit++ // no cabe ni apilado → a grupaje / contenedor adicional
    }
  }

  return { spec, placed, unfitCount: unfit, packedCount: placed.length }
}
