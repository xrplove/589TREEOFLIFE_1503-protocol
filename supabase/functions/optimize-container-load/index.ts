// Edge Function: optimize-container-load
// Path: supabase/functions/optimize-container-load/index.ts
// Runtime: Deno (Supabase Edge Functions)
// Purpose: Cubicaje 3D contenedores · Capa 2 ADR 0007.
//
// FLUJO DE OPTIMIZACIÓN
// ---------------------
// El cliente (escritorio transitario · escritorio fabricante · checkout de
// pedido) envía:
//   - Lista de items a cargar (cada uno con DPP id + cantidad)
//   - Tipo de contenedor objetivo (20ST · 40ST · 40HC · 20RF · 40RF · LCL)
//
// La Edge Function:
//   1. Valida JWT del caller
//   2. Recupera DPPs del registro (sus dimensiones + peso de Capa B packaging)
//   3. Verifica RLS: el caller debe poder leer los DPPs (owner · manufacturer ·
//      o delegación activa)
//   4. Calcula capacidad básica: volumen total vs capacidad contenedor + peso
//      total vs carga máxima
//   5. Devuelve resultado estructurado: ¿caben? · % uso volumen · % uso peso ·
//      excedentes
//
// ALGORITMO 3D BIN PACKING REAL
// -----------------------------
// El algoritmo 3D Bin Packing con posiciones precisas (First-Fit Decreasing ·
// Genetic Algorithms) se ejecuta EN CLIENTE con binpackingjs porque:
//   - El resultado 3D se renderiza en cliente con React Three Fiber (commit 7/7)
//   - Reduce carga Edge Function (NP-hard · puede tardar segundos)
//   - El cliente puede mostrar progreso visual al usuario durante optimización
//
// Esta Edge Function devuelve VIABILIDAD (caben o no) + métricas globales.
// El cliente con binpackingjs hace el LAYOUT 3D detallado si caben.
//
// MATIZ CANÓNICO AVIACIÓN (ADR 0007 §2.7)
// ---------------------------------------
// El cubicaje 3D aplica SOLO a marítimo + terrestre + ferroviario + fluvial.
// NO se aplica a aviación (cubicaje aéreo + W&B excluidos · responsabilidad
// del transitario certificado · 1503 no firma cálculos W&B).
//
// LCL GRUPAJE CROSS-TENANT
// ------------------------
// Si container_type = 'LCL', la lógica es distinta: NO comprueba capacidad
// total porque el grupaje se llena combinando pedidos de varios actores
// (cross-tenant · ADR 0007 §2.4). Devuelve solo métricas del subset del
// caller + indica que LCL se consolida posteriormente con otros.
//
// ENV VARS REQUERIDAS
// -------------------
//   - SUPABASE_URL                 (auto-inyectada por Supabase Edge)
//   - SUPABASE_ANON_KEY            (auto-inyectada)
//   - SUPABASE_SERVICE_ROLE_KEY    (auto-inyectada)
//
// DEPLOY
// ------
//   supabase functions deploy optimize-container-load --no-verify-jwt
//
// COMO INVOCAR
// ------------
//   POST https://<project-ref>.supabase.co/functions/v1/optimize-container-load
//   Headers:
//     Authorization: Bearer <user-jwt>
//     Content-Type: application/json
//   Body:
//     {
//       "container_type": "40HC",
//       "items": [
//         { "dpp_id": "uuid-1", "quantity": 50 },
//         { "dpp_id": "uuid-2", "quantity": 20 }
//       ]
//     }
//   Response (200):
//     {
//       "fits": true,
//       "container": { "type": "40HC", "volume_m3": 76.4, "max_weight_kg": 28560 },
//       "totals": { "total_volume_m3": 64.2, "total_weight_kg": 12400, "total_items": 70 },
//       "usage": { "volume_pct": 84.03, "weight_pct": 43.42 },
//       "excess": [],
//       "warnings": ["Volumen >80% · revisar holgura para manipulación"]
//     }

// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES · contenedores canónicos ISO 6346 + LCL
// ════════════════════════════════════════════════════════════════════════════

interface ContainerSpec {
  type: ContainerType
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
  /** Sub-clase opcional refrigerado. */
  refrigerated: boolean
}

type ContainerType = '20ST' | '40ST' | '40HC' | '20RF' | '40RF' | 'LCL'

const CONTAINER_SPECS: Record<Exclude<ContainerType, 'LCL'>, ContainerSpec> = {
  '20ST': {
    type: '20ST',
    inner_length_mm: 5898,
    inner_width_mm: 2352,
    inner_height_mm: 2393,
    inner_volume_m3: 33.2,
    max_payload_kg: 28200,
    tare_kg: 2300,
    refrigerated: false,
  },
  '40ST': {
    type: '40ST',
    inner_length_mm: 12032,
    inner_width_mm: 2352,
    inner_height_mm: 2393,
    inner_volume_m3: 67.7,
    max_payload_kg: 28780,
    tare_kg: 3700,
    refrigerated: false,
  },
  '40HC': {
    type: '40HC',
    inner_length_mm: 12032,
    inner_width_mm: 2352,
    inner_height_mm: 2698,
    inner_volume_m3: 76.4,
    max_payload_kg: 28560,
    tare_kg: 3900,
    refrigerated: false,
  },
  '20RF': {
    type: '20RF',
    inner_length_mm: 5444,
    inner_width_mm: 2294,
    inner_height_mm: 2261,
    inner_volume_m3: 28.2,
    max_payload_kg: 27700,
    tare_kg: 3050,
    refrigerated: true,
  },
  '40RF': {
    type: '40RF',
    inner_length_mm: 11577,
    inner_width_mm: 2294,
    inner_height_mm: 2549,
    inner_volume_m3: 67.6,
    max_payload_kg: 27700,
    tare_kg: 4800,
    refrigerated: true,
  },
}

/** Umbrales de warning sobre uso del contenedor. */
const VOLUME_WARN_PCT = 80 // >80% volumen = revisar holgura
const WEIGHT_WARN_PCT = 90 // >90% peso = revisar reparto carga

// ════════════════════════════════════════════════════════════════════════════
// TIPOS · request/response
// ════════════════════════════════════════════════════════════════════════════

interface ItemRequest {
  dpp_id: string
  quantity: number
}

interface OptimizeRequest {
  container_type: ContainerType
  items: ItemRequest[]
}

interface DPPPackagingData {
  dpp_id: string
  package_length_mm: number | null
  package_width_mm: number | null
  package_height_mm: number | null
  package_weight_kg: number | null
  package_type: string | null
  stackable: boolean | null
  un_dangerous_class: string | null
  imdg_class: string | null
  reefer_temp_min_c: number | null
  reefer_temp_max_c: number | null
}

interface OptimizeResponse {
  fits: boolean
  container: {
    type: ContainerType
    volume_m3: number
    max_weight_kg: number
    refrigerated: boolean
  }
  totals: {
    total_volume_m3: number
    total_weight_kg: number
    total_items: number
  }
  usage: {
    volume_pct: number
    weight_pct: number
  }
  excess: {
    dpp_id: string
    reason: string
  }[]
  warnings: string[]
}

interface ErrorResponse {
  error: string
  code: string
  details?: unknown
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN · request shape
// ════════════════════════════════════════════════════════════════════════════

function validateRequestShape(body: unknown): {
  ok: boolean
  request?: OptimizeRequest
  error?: string
} {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Body debe ser objeto JSON' }
  }
  const obj = body as Record<string, unknown>

  // container_type
  const validContainerTypes: ContainerType[] = ['20ST', '40ST', '40HC', '20RF', '40RF', 'LCL']
  if (typeof obj.container_type !== 'string' || !validContainerTypes.includes(obj.container_type as ContainerType)) {
    return {
      ok: false,
      error: `container_type debe ser uno de: ${validContainerTypes.join(', ')}`,
    }
  }

  // items
  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return { ok: false, error: 'items debe ser array no vacío' }
  }
  if (obj.items.length > 1000) {
    return { ok: false, error: 'items máximo 1000 entradas por request' }
  }

  for (let i = 0; i < obj.items.length; i++) {
    const item = obj.items[i] as Record<string, unknown>
    if (typeof item.dpp_id !== 'string' || !item.dpp_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return { ok: false, error: `items[${i}].dpp_id debe ser UUID v4` }
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) {
      return { ok: false, error: `items[${i}].quantity debe ser entero entre 1 y 10000` }
    }
  }

  return {
    ok: true,
    request: obj as unknown as OptimizeRequest,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CÁLCULOS · volumen + peso + capacidad
// ════════════════════════════════════════════════════════════════════════════

function computeItemVolumeM3(item: DPPPackagingData): number {
  if (
    item.package_length_mm === null ||
    item.package_width_mm === null ||
    item.package_height_mm === null
  ) {
    return 0
  }
  // mm × mm × mm → m³ con factor 1e-9
  return (
    (item.package_length_mm * item.package_width_mm * item.package_height_mm) *
    1e-9
  )
}

function computeOptimization(
  containerType: ContainerType,
  items: { data: DPPPackagingData; quantity: number }[],
): OptimizeResponse {
  // LCL grupaje: no aplica capacidad total · solo retorna totals del caller.
  if (containerType === 'LCL') {
    let totalVolume = 0
    let totalWeight = 0
    let totalItems = 0
    for (const { data, quantity } of items) {
      totalVolume += computeItemVolumeM3(data) * quantity
      totalWeight += (data.package_weight_kg ?? 0) * quantity
      totalItems += quantity
    }
    return {
      fits: true, // siempre OK · grupaje se consolida cross-tenant después
      container: {
        type: 'LCL',
        volume_m3: 0, // no aplica · LCL no es contenedor único
        max_weight_kg: 0,
        refrigerated: false,
      },
      totals: {
        total_volume_m3: Math.round(totalVolume * 100) / 100,
        total_weight_kg: Math.round(totalWeight * 100) / 100,
        total_items: totalItems,
      },
      usage: {
        volume_pct: 0,
        weight_pct: 0,
      },
      excess: [],
      warnings: [
        'LCL grupaje: este subset será consolidado con otros pedidos cross-tenant (ADR 0007 §2.4). Validación final tras consolidación.',
      ],
    }
  }

  // Contenedores estándar.
  const spec = CONTAINER_SPECS[containerType]
  let totalVolume = 0
  let totalWeight = 0
  let totalItems = 0
  const excess: { dpp_id: string; reason: string }[] = []
  const warnings: string[] = []

  // Verificación refrigerados: si contenedor es reefer pero items requieren
  // temperatura · ambos deben ser compatibles.
  for (const { data, quantity } of items) {
    if (
      data.reefer_temp_min_c !== null &&
      data.reefer_temp_min_c < 0 &&
      !spec.refrigerated
    ) {
      excess.push({
        dpp_id: data.dpp_id,
        reason: `Requiere refrigeración (reefer_temp_min_c=${data.reefer_temp_min_c}°C) pero contenedor ${containerType} NO es reefer`,
      })
    }

    // Verificación dimensiones individuales: un bulto > dimensiones internas =
    // imposible cargar (excluye optimización).
    const volume = computeItemVolumeM3(data)
    if (volume === 0) {
      excess.push({
        dpp_id: data.dpp_id,
        reason: 'package_length/width/height/weight no definidos · cubicaje imposible',
      })
      continue
    }
    if (
      (data.package_length_mm ?? 0) > spec.inner_length_mm ||
      (data.package_width_mm ?? 0) > spec.inner_width_mm ||
      (data.package_height_mm ?? 0) > spec.inner_height_mm
    ) {
      excess.push({
        dpp_id: data.dpp_id,
        reason: `Bulto (${data.package_length_mm}×${data.package_width_mm}×${data.package_height_mm}mm) excede dimensiones internas contenedor ${containerType}`,
      })
      continue
    }

    totalVolume += volume * quantity
    totalWeight += (data.package_weight_kg ?? 0) * quantity
    totalItems += quantity
  }

  const volumePct = (totalVolume / spec.inner_volume_m3) * 100
  const weightPct = (totalWeight / spec.max_payload_kg) * 100

  // Genera warnings sin bloquear.
  if (volumePct >= VOLUME_WARN_PCT && volumePct <= 100) {
    warnings.push(`Volumen ≥${VOLUME_WARN_PCT}% (${volumePct.toFixed(2)}%) · revisar holgura para manipulación`)
  }
  if (weightPct >= WEIGHT_WARN_PCT && weightPct <= 100) {
    warnings.push(`Peso ≥${WEIGHT_WARN_PCT}% (${weightPct.toFixed(2)}%) · revisar reparto de carga`)
  }

  const fits =
    excess.length === 0 &&
    totalVolume <= spec.inner_volume_m3 &&
    totalWeight <= spec.max_payload_kg

  if (!fits && excess.length === 0) {
    // No cabe por exceso de capacidad (sin excess individual).
    if (totalVolume > spec.inner_volume_m3) {
      warnings.push(`Volumen total ${totalVolume.toFixed(2)} m³ excede capacidad contenedor ${spec.inner_volume_m3} m³. Considerar 40HC o split en 2 contenedores.`)
    }
    if (totalWeight > spec.max_payload_kg) {
      warnings.push(`Peso total ${totalWeight.toFixed(2)} kg excede payload máximo ${spec.max_payload_kg} kg. Considerar split en 2 contenedores.`)
    }
  }

  return {
    fits,
    container: {
      type: spec.type,
      volume_m3: spec.inner_volume_m3,
      max_weight_kg: spec.max_payload_kg,
      refrigerated: spec.refrigerated,
    },
    totals: {
      total_volume_m3: Math.round(totalVolume * 100) / 100,
      total_weight_kg: Math.round(totalWeight * 100) / 100,
      total_items: totalItems,
    },
    usage: {
      volume_pct: Math.round(volumePct * 100) / 100,
      weight_pct: Math.round(weightPct * 100) / 100,
    },
    excess,
    warnings,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER · serve HTTP
// ════════════════════════════════════════════════════════════════════════════

function buildErrorResponse(error: string, code: string, status: number, details?: unknown): Response {
  const body: ErrorResponse = { error, code, ...(details ? { details } : {}) }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  // CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (req.method !== 'POST') {
    return buildErrorResponse('Method not allowed · use POST', 'METHOD_NOT_ALLOWED', 405)
  }

  // 1. Authorization header.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return buildErrorResponse('Missing or invalid Authorization header', 'UNAUTHORIZED', 401)
  }
  const jwt = authHeader.substring(7)

  // 2. Parse body.
  let body: unknown
  try {
    body = await req.json()
  } catch (_e) {
    return buildErrorResponse('Body must be valid JSON', 'INVALID_JSON', 400)
  }

  // 3. Validate request shape.
  const validation = validateRequestShape(body)
  if (!validation.ok || !validation.request) {
    return buildErrorResponse(validation.error ?? 'Invalid request', 'INVALID_REQUEST', 400)
  }
  const { container_type, items } = validation.request

  // 4. Setup Supabase client con JWT del caller (RLS aplicará).
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !anonKey) {
    return buildErrorResponse('Server misconfigured · SUPABASE_URL or ANON_KEY missing', 'SERVER_CONFIG', 500)
  }
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  // 5. Recuperar DPPs (RLS aplicada: el caller debe poder leer cada DPP).
  const dppIds = items.map((it) => it.dpp_id)
  const { data: dpps, error: queryError } = await supabase
    .from('dpp_registry')
    .select(
      'id, package_length_mm, package_width_mm, package_height_mm, package_weight_kg, package_type, stackable, un_dangerous_class, imdg_class, reefer_temp_min_c, reefer_temp_max_c',
    )
    .in('id', dppIds)

  if (queryError) {
    return buildErrorResponse('Database query failed', 'DB_ERROR', 500, queryError.message)
  }
  if (!dpps || dpps.length === 0) {
    return buildErrorResponse('No DPPs found or RLS bloqueó acceso', 'DPPS_NOT_FOUND', 404)
  }

  // Verificar que TODOS los dpp_ids se recuperaron (RLS puede haber filtrado).
  const foundIds = new Set(dpps.map((d: any) => d.id))
  const missing = dppIds.filter((id) => !foundIds.has(id))
  if (missing.length > 0) {
    return buildErrorResponse(
      `DPPs no encontrados o sin permiso: ${missing.join(', ')}`,
      'DPPS_PARTIAL_NOT_FOUND',
      403,
      { missing_dpp_ids: missing },
    )
  }

  // 6. Mapear DPPs con sus quantities y ejecutar optimización.
  const dppById = new Map<string, any>(dpps.map((d: any) => [d.id, d]))
  const itemsWithData = items.map((it) => ({
    data: {
      dpp_id: it.dpp_id,
      package_length_mm: dppById.get(it.dpp_id)?.package_length_mm ?? null,
      package_width_mm: dppById.get(it.dpp_id)?.package_width_mm ?? null,
      package_height_mm: dppById.get(it.dpp_id)?.package_height_mm ?? null,
      package_weight_kg: dppById.get(it.dpp_id)?.package_weight_kg ?? null,
      package_type: dppById.get(it.dpp_id)?.package_type ?? null,
      stackable: dppById.get(it.dpp_id)?.stackable ?? null,
      un_dangerous_class: dppById.get(it.dpp_id)?.un_dangerous_class ?? null,
      imdg_class: dppById.get(it.dpp_id)?.imdg_class ?? null,
      reefer_temp_min_c: dppById.get(it.dpp_id)?.reefer_temp_min_c ?? null,
      reefer_temp_max_c: dppById.get(it.dpp_id)?.reefer_temp_max_c ?? null,
    } as DPPPackagingData,
    quantity: it.quantity,
  }))

  const result = computeOptimization(container_type, itemsWithData)

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
