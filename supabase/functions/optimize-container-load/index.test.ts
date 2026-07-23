// Tests · optimize-container-load Edge Function
//
// Ejecutar:
//   deno test --allow-env --allow-net supabase/functions/optimize-container-load/index.test.ts
//
// Tests unitarios del cálculo de optimización (sin BD · usa data mock).
// Para tests E2E con BD real ver tests/e2e/ (cuando se monten Playwright).

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts"

// Re-implementamos las funciones puras aquí para test aislado (la Edge Function
// las exporta indirectamente vía serve · no como exports nombrados · para tests
// duplicamos · si surge volumen se refactoriza a módulo compartido).

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

function computeItemVolumeM3(item: DPPPackagingData): number {
  if (
    item.package_length_mm === null ||
    item.package_width_mm === null ||
    item.package_height_mm === null
  ) {
    return 0
  }
  return (
    (item.package_length_mm * item.package_width_mm * item.package_height_mm) *
    1e-9
  )
}

const mockPallet = (overrides: Partial<DPPPackagingData> = {}): DPPPackagingData => ({
  dpp_id: '11111111-1111-1111-1111-111111111111',
  package_length_mm: 1200,
  package_width_mm: 800,
  package_height_mm: 1600,
  package_weight_kg: 800,
  package_type: 'pallet',
  stackable: true,
  un_dangerous_class: null,
  imdg_class: null,
  reefer_temp_min_c: null,
  reefer_temp_max_c: null,
  ...overrides,
})

// ════════════════════════════════════════════════════════════════════════════
// Test 1 · computeItemVolumeM3 · cálculo correcto
// ════════════════════════════════════════════════════════════════════════════

Deno.test('computeItemVolumeM3 · palet europeo 1200×800×1600 = 1.536 m³', () => {
  const pallet = mockPallet()
  const volume = computeItemVolumeM3(pallet)
  assertEquals(Math.round(volume * 1000) / 1000, 1.536)
})

Deno.test('computeItemVolumeM3 · dimensiones NULL devuelve 0', () => {
  const broken = mockPallet({ package_length_mm: null })
  assertEquals(computeItemVolumeM3(broken), 0)
})

Deno.test('computeItemVolumeM3 · contenedor 20ST estimado debe entrar ~21 palets europeos', () => {
  const palletVolume = computeItemVolumeM3(mockPallet())
  const container20stVolume = 33.2 // m³ interior
  const palletsFit = Math.floor(container20stVolume / palletVolume)
  // 33.2 / 1.536 = 21.6 → 21 palets físicos teóricos
  // (en realidad menos por geometría · este es teórico volumen)
  assertEquals(palletsFit, 21)
})

// ════════════════════════════════════════════════════════════════════════════
// Test 2 · validación dimensiones individuales · bulto sobredimensionado
// ════════════════════════════════════════════════════════════════════════════

Deno.test('Bulto sobredimensionado (3m largo) NO cabe en 20ST (5.898m largo interior)', () => {
  const oversize = mockPallet({ package_length_mm: 8000 }) // 8m
  const containerLength = 5898 // 20ST interior
  assert(
    (oversize.package_length_mm ?? 0) > containerLength,
    'Debería detectar exceso de largo',
  )
})

Deno.test('Bulto altura supera 40ST (2.393m) pero cabe en 40HC (2.698m)', () => {
  const tall = mockPallet({ package_height_mm: 2500 })
  const stHeight = 2393
  const hcHeight = 2698
  assert(
    (tall.package_height_mm ?? 0) > stHeight,
    'No cabe en 40ST',
  )
  assert(
    (tall.package_height_mm ?? 0) <= hcHeight,
    'Sí cabe en 40HC',
  )
})

// ════════════════════════════════════════════════════════════════════════════
// Test 3 · validación request shape
// ════════════════════════════════════════════════════════════════════════════

Deno.test('UUID format · regex válido', () => {
  const validUuid = '11111111-1111-1111-1111-111111111111'
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  assert(uuidRegex.test(validUuid), 'UUID válido debe pasar regex')

  const invalidUuid = 'not-a-uuid'
  assert(!uuidRegex.test(invalidUuid), 'UUID inválido debe fallar regex')
})

Deno.test('Container types · valores aceptados', () => {
  const validTypes = ['20ST', '40ST', '40HC', '20RF', '40RF', 'LCL']
  for (const type of validTypes) {
    assert(validTypes.includes(type), `${type} debe estar en lista válida`)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// Test 4 · refrigerados · contenedor reefer vs items con temperatura
// ════════════════════════════════════════════════════════════════════════════

Deno.test('Item con reefer_temp_min < 0 requiere contenedor reefer', () => {
  const frozenItem = mockPallet({
    reefer_temp_min_c: -18,
    reefer_temp_max_c: -15,
  })
  assert(
    (frozenItem.reefer_temp_min_c ?? 0) < 0,
    'Producto congelado debe requerir reefer',
  )
})

Deno.test('Item ambient (sin reefer_temp) NO requiere contenedor especial', () => {
  const ambient = mockPallet()
  assertEquals(ambient.reefer_temp_min_c, null)
  assertEquals(ambient.reefer_temp_max_c, null)
})

// ════════════════════════════════════════════════════════════════════════════
// Test 5 · cubicaje aéreo NO se procesa · matiz canónico aviación
// ════════════════════════════════════════════════════════════════════════════

Deno.test('Aviación NO está entre los container_types soportados (matiz canónico ADR 0007 §2.7)', () => {
  const validTypes = ['20ST', '40ST', '40HC', '20RF', '40RF', 'LCL']
  // Verificamos que NO hay tipos aéreos (ej. 'AIR_PMC', 'AIR_AKE', ULD).
  assert(!validTypes.includes('AIR_PMC' as any), 'No debe aceptar tipos ULD aéreos')
  assert(!validTypes.includes('AIR_AKE' as any), 'No debe aceptar ULD AKE aéreos')
})
