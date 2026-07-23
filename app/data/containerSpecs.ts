// Especificaciones canónicas de contenedores ISO 6346 + LCL grupaje.
//
// FUENTE DE VERDAD COMPARTIDA: este archivo es el ÚNICO source of truth para
// dimensiones internas + capacidades de los contenedores soportados por
// 1503. Se importa desde:
//
//   - app/components/ContainerLoadView.tsx (R3F + binpackingjs cliente)
//   - supabase/functions/optimize-container-load/index.ts (Edge Function)
//     · NOTA: Edge Function replica las constantes en su archivo porque vive
//       en runtime Deno aislado. Cuando cambien specs, actualizar AMBOS.
//
// MATIZ CANÓNICO AVIACIÓN (ADR 0007 §2.7)
// ---------------------------------------
// NO se soportan tipos ULD aéreos (AIR_PMC · AIR_AKE · etc.). El cubicaje 3D
// aplica SOLO a marítimo + terrestre + ferroviario + fluvial. Comercio aéreo
// documental sigue válido (AWB en custody chain) pero W&B + cubicaje aéreo
// son responsabilidad del transitario certificado.
//
// FUENTES OFICIALES
// -----------------
// - ISO 6346:1995 · codificación contenedores intermodales
// - Recomendación UN/CEFACT 21 · sufijos tipo contenedor
// - Manuales fabricantes Maersk + MSC + CMA CGM (dimensiones interiores típicas)

export type ContainerType = '20ST' | '40ST' | '40HC' | '20RF' | '40RF' | 'LCL'

export interface ContainerSpec {
  type: ContainerType
  /** Nombre comercial legible. */
  display_name: string
  /** Largo interior (mm). */
  inner_length_mm: number
  /** Anchura interior (mm). */
  inner_width_mm: number
  /** Altura interior (mm). */
  inner_height_mm: number
  /** Volumen interior (m³). */
  inner_volume_m3: number
  /** Carga máxima útil (kg) · payload sin tara. */
  max_payload_kg: number
  /** Tara contenedor (kg). */
  tare_kg: number
  /** ¿Es contenedor refrigerado (reefer)? */
  refrigerated: boolean
  /** Color sugerido para visualización 3D (wireframe). */
  color_hex: string
}

/**
 * Specs canónicas. Las dimensiones interiores son típicas de fabricantes
 * principales (Maersk · MSC · CMA CGM) · pueden variar ±50mm según fabricante.
 * Para uso operativo en producción, verificar con el carrier real antes de
 * comprometer carga.
 */
export const CONTAINER_SPECS: Record<Exclude<ContainerType, 'LCL'>, ContainerSpec> = {
  '20ST': {
    type: '20ST',
    display_name: "20' Standard",
    inner_length_mm: 5898,
    inner_width_mm: 2352,
    inner_height_mm: 2393,
    inner_volume_m3: 33.2,
    max_payload_kg: 28200,
    tare_kg: 2300,
    refrigerated: false,
    color_hex: '#3b82f6', // azul
  },
  '40ST': {
    type: '40ST',
    display_name: "40' Standard",
    inner_length_mm: 12032,
    inner_width_mm: 2352,
    inner_height_mm: 2393,
    inner_volume_m3: 67.7,
    max_payload_kg: 28780,
    tare_kg: 3700,
    refrigerated: false,
    color_hex: '#10b981', // verde
  },
  '40HC': {
    type: '40HC',
    display_name: "40' High Cube",
    inner_length_mm: 12032,
    inner_width_mm: 2352,
    inner_height_mm: 2698,
    inner_volume_m3: 76.4,
    max_payload_kg: 28560,
    tare_kg: 3900,
    refrigerated: false,
    color_hex: '#a855f7', // morado
  },
  '20RF': {
    type: '20RF',
    display_name: "20' Reefer",
    inner_length_mm: 5444,
    inner_width_mm: 2294,
    inner_height_mm: 2261,
    inner_volume_m3: 28.2,
    max_payload_kg: 27700,
    tare_kg: 3050,
    refrigerated: true,
    color_hex: '#0ea5e9', // cyan
  },
  '40RF': {
    type: '40RF',
    display_name: "40' Reefer",
    inner_length_mm: 11577,
    inner_width_mm: 2294,
    inner_height_mm: 2549,
    inner_volume_m3: 67.6,
    max_payload_kg: 27700,
    tare_kg: 4800,
    refrigerated: true,
    color_hex: '#06b6d4', // teal
  },
}

/**
 * Sub-type 'LCL' representa grupaje cross-tenant. No es un contenedor único
 * sino una modalidad donde se comparte espacio con otros pedidos (ADR 0007 §2.4).
 * No tiene specs propias · la consolidación final usa el contenedor que el
 * transitario asigne al grupaje (típicamente 40ST o 40HC).
 */
export const LCL_NOTE =
  'LCL grupaje cross-tenant · consolidación posterior con otros pedidos · sin contenedor único'

/** Helper · ¿este tipo de contenedor está soportado por el cubicaje 3D? */
export function isCubicajeContainer(type: ContainerType): type is Exclude<ContainerType, 'LCL'> {
  return type !== 'LCL'
}

/** Helper · obtener spec o undefined si LCL. */
export function getContainerSpec(type: ContainerType): ContainerSpec | undefined {
  if (type === 'LCL') return undefined
  return CONTAINER_SPECS[type]
}

/** Helper · lista de display name para dropdown UI. */
export function getContainerDisplayList(): {
  type: ContainerType
  display_name: string
  refrigerated: boolean
}[] {
  const specs = Object.values(CONTAINER_SPECS).map((spec) => ({
    type: spec.type,
    display_name: spec.display_name,
    refrigerated: spec.refrigerated,
  }))
  return [
    ...specs,
    { type: 'LCL', display_name: 'LCL · grupaje cross-tenant', refrigerated: false },
  ]
}
