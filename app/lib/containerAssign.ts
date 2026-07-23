// Asignación AUTOMÁTICA de contenedor por volumen/peso del pedido + grupaje.
// ---------------------------------------------------------------------------
// Decisión José (12-jun-2026): "la medida del contenedor se asigna auto
// dependiendo del volumen del pedido; si la mercancía no cubre el 40% del
// contenedor más pequeño → grupaje (LCL)".
//
// Módulo PURO (sin Supabase · sin Next · sin three/binpackingjs) → testeable
// con node:test. La verificación geométrica fina (bin packing 3D real) se
// inyecta opcionalmente vía `verifyPack` (la UI pasa pack3D de binpackingjs);
// sin hook, la decisión usa la heurística volumétrica + encaje dimensional
// por bulto, con factor de estiba conservador.
//
// Fuente de specs: app/data/containerSpecs.ts (ISO 6346 · fuente única).

import {
  CONTAINER_SPECS,
  type ContainerSpec,
  type ContainerType,
} from '../data/containerSpecs'

// ─── Parámetros del negocio ─────────────────────────────────────────────────

/** Regla José: por debajo de esta fracción del contenedor MÁS PEQUEÑO → LCL. */
export const LCL_THRESHOLD_FRACTION = 0.4

/** Factor de estiba: fracción del volumen interior realmente aprovechable
 *  (huecos entre bultos · trincaje). Conservador; el bin packing real afina. */
export const STOWAGE_FACTOR = 0.85

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface CargoItem {
  /** Identificador del bulto/línea (para reportar no-encajes). */
  id: string
  length_mm: number
  width_mm: number
  height_mm: number
  weight_kg: number
  quantity: number
  /** 'this_way_up' impide tumbar el bulto (solo rota en planta). */
  required_orientation?: 'this_way_up' | 'any' | 'horizontal_only'
  /** ¿Necesita frío? Restringe a contenedores reefer. */
  refrigerated?: boolean
}

export type AssignMode = 'LCL' | 'FCL' | 'MULTI' | 'UNFIT'

export interface ContainerAssignment {
  mode: AssignMode
  /** Contenedor asignado (FCL) o tipo base de la flota (MULTI). */
  container?: ContainerType
  /** Nº de contenedores (1 en FCL · N en MULTI · 0 en LCL/UNFIT). */
  count: number
  /** % del volumen interior del contenedor asignado que ocupa la carga. */
  utilization_pct: number
  /** Volumen total de la carga (m³) y peso bruto total (kg). */
  total_volume_m3: number
  total_weight_kg: number
  /** Bultos que no caben en NINGÚN contenedor soportado (puerta/dimensiones). */
  unfit_items: string[]
  /** Explicación accionable en castellano (para UI y auditoría). */
  reason: string
}

/** Hook opcional: empaquetado 3D real (la UI inyecta binpackingjs/pack3D).
 *  Devuelve true si TODOS los bultos caben en el contenedor dado. */
export type VerifyPackFn = (items: CargoItem[], spec: ContainerSpec) => boolean

// ─── Helpers ────────────────────────────────────────────────────────────────

const mm3_A_m3 = (l: number, w: number, h: number) => (l * w * h) / 1e9

/** ¿El bulto entra en el contenedor en ALGUNA orientación permitida?
 *  'this_way_up': la altura del bulto es fija; solo rota en planta (2 giros).
 *  'any'/'horizontal_only'/undefined: se permiten las 6 orientaciones (para
 *  encaje dimensional; el apilado fino lo decide el bin packing real). */
export function itemCabeEnSpec(item: CargoItem, spec: ContainerSpec): boolean {
  const L = spec.inner_length_mm
  const W = spec.inner_width_mm
  const H = spec.inner_height_mm
  const { length_mm: a, width_mm: b, height_mm: c } = item
  if (item.required_orientation === 'this_way_up') {
    if (c > H) return false
    return (a <= L && b <= W) || (b <= L && a <= W)
  }
  // 6 permutaciones (a,b,c) sobre (L,W,H)
  const dims: [number, number, number][] = [
    [a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a],
  ]
  return dims.some(([x, y, z]) => x <= L && y <= W && z <= H)
}

function totalesDe(items: CargoItem[]): { vol: number; peso: number } {
  let vol = 0
  let peso = 0
  for (const it of items) {
    vol += mm3_A_m3(it.length_mm, it.width_mm, it.height_mm) * it.quantity
    peso += it.weight_kg * it.quantity
  }
  return { vol, peso }
}

/** Candidatos ordenados de menor a mayor volumen, filtrados por reefer. */
function candidatos(necesitaFrio: boolean): ContainerSpec[] {
  return Object.values(CONTAINER_SPECS)
    .filter((s) => s.refrigerated === necesitaFrio)
    .sort((x, y) => x.inner_volume_m3 - y.inner_volume_m3)
}

// ─── Motor ──────────────────────────────────────────────────────────────────

/** Asigna contenedor automáticamente. Reglas, en orden:
 *  1. Bulto que no cabe en ningún contenedor → UNFIT (se reporta cuál).
 *  2. Volumen < 40% del contenedor MÁS PEQUEÑO compatible **y** peso < 40% de
 *     su payload → LCL grupaje (regla José; el guard de peso evita mandar a
 *     grupaje carga densa pequeña que en la práctica W/M va a FCL).
 *  3. FCL: el contenedor más pequeño donde caben volumen (con factor de
 *     estiba), peso (payload) y TODOS los bultos dimensionalmente; si se
 *     inyecta `verifyPack`, su veredicto manda (bin packing real).
 *  4. No cabe ni en el mayor → MULTI sobre el contenedor más grande
 *     compatible (N por volumen y peso, el mayor de los dos).
 */
export function assignContainer(
  items: CargoItem[],
  opts?: { verifyPack?: VerifyPackFn },
): ContainerAssignment {
  const necesitaFrio = items.some((i) => i.refrigerated)
  const flota = candidatos(necesitaFrio)
  const { vol, peso } = totalesDe(items)
  const base = {
    total_volume_m3: round2(vol),
    total_weight_kg: round2(peso),
    unfit_items: [] as string[],
  }

  if (items.length === 0 || vol <= 0) {
    return { ...base, mode: 'UNFIT', count: 0, utilization_pct: 0, reason: 'Pedido sin bultos con volumen.' }
  }

  // 1 · encaje dimensional por bulto contra el MAYOR contenedor compatible
  const mayor = flota[flota.length - 1]
  const unfit = items.filter((i) => !itemCabeEnSpec(i, mayor)).map((i) => i.id)
  if (unfit.length > 0) {
    return {
      ...base,
      mode: 'UNFIT',
      count: 0,
      utilization_pct: 0,
      unfit_items: unfit,
      reason: `Bulto(s) que no caben en ningún contenedor soportado (${unfit.join(', ')}): revisar medidas o tratar como carga especial (break-bulk / flat rack, fuera del cubicaje 3D).`,
    }
  }

  // 2 · regla José: < 40% del más pequeño → grupaje
  const pequeno = flota[0]
  const umbralVol = pequeno.inner_volume_m3 * LCL_THRESHOLD_FRACTION
  const umbralPeso = pequeno.max_payload_kg * LCL_THRESHOLD_FRACTION
  if (vol < umbralVol && peso < umbralPeso) {
    return {
      ...base,
      mode: 'LCL',
      count: 0,
      utilization_pct: round2((vol / pequeno.inner_volume_m3) * 100),
      reason: `Grupaje (LCL): la carga (${round2(vol)} m³) no cubre el ${LCL_THRESHOLD_FRACTION * 100}% del ${pequeno.display_name} (${round2(umbralVol)} m³). Se consolida con otros pedidos.`,
    }
  }

  // 3 · FCL: el más pequeño donde cabe todo
  for (const spec of flota) {
    const cabeVol = vol <= spec.inner_volume_m3 * STOWAGE_FACTOR
    const cabePeso = peso <= spec.max_payload_kg
    const cabenDims = items.every((i) => itemCabeEnSpec(i, spec))
    if (!cabeVol || !cabePeso || !cabenDims) continue
    if (opts?.verifyPack && !opts.verifyPack(items, spec)) continue // el 3D real manda
    return {
      ...base,
      mode: 'FCL',
      container: spec.type,
      count: 1,
      utilization_pct: round2((vol / spec.inner_volume_m3) * 100),
      reason: `${spec.display_name}: ${round2(vol)} m³ (${round2((vol / spec.inner_volume_m3) * 100)}% del volumen) · ${round2(peso)} kg de ${spec.max_payload_kg} kg de payload.`,
    }
  }

  // 4 · multi-contenedor sobre el mayor compatible
  const porVolumen = Math.ceil(vol / (mayor.inner_volume_m3 * STOWAGE_FACTOR))
  const porPeso = Math.ceil(peso / mayor.max_payload_kg)
  const n = Math.max(porVolumen, porPeso)
  return {
    ...base,
    mode: 'MULTI',
    container: mayor.type,
    count: n,
    utilization_pct: round2((vol / (mayor.inner_volume_m3 * n)) * 100),
    reason: `La carga supera un ${mayor.display_name}: se reparte en ${n} contenedores (${porVolumen} por volumen · ${porPeso} por peso).`,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
