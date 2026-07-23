// Tests del motor de asignación automática de contenedor + gate de packaging.
// Regla José (12-jun-2026): < 40% del contenedor más pequeño → grupaje LCL.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assignContainer,
  itemCabeEnSpec,
  LCL_THRESHOLD_FRACTION,
  type CargoItem,
} from './containerAssign'
import { CONTAINER_SPECS } from '../data/containerSpecs'
import { validatePackagingCompliance } from '../data/productSchemas/_compliance'

// caja de 1 m³ y 100 kg (1000×1000×1000mm) — bulto neutro para componer cargas
const caja = (id: string, quantity: number): CargoItem => ({
  id, length_mm: 1000, width_mm: 1000, height_mm: 1000, weight_kg: 100, quantity,
})

// ─── Regla José: el umbral es el 40% del 20ST ───────────────────────────────

test('pedido pequeño (no cubre el 40% del 20ST) → grupaje LCL', () => {
  // 20ST = 33.2 m³ → umbral 13.28 m³. 10 m³ y 1 t → LCL.
  const r = assignContainer([caja('A', 10)])
  assert.equal(r.mode, 'LCL')
  assert.match(r.reason, /Grupaje/)
})

test('el umbral LCL es EXACTAMENTE el 40% del contenedor más pequeño', () => {
  const v20 = CONTAINER_SPECS['20ST'].inner_volume_m3
  // justo POR DEBAJO del 40%: 13 cajas de 1m³ = 13 m³ < 13.28 → LCL
  const debajo = assignContainer([caja('A', Math.floor(v20 * LCL_THRESHOLD_FRACTION))])
  assert.equal(debajo.mode, 'LCL')
  // justo POR ENCIMA: 14 m³ ≥ 13.28 → ya NO es grupaje
  const encima = assignContainer([caja('A', Math.ceil(v20 * LCL_THRESHOLD_FRACTION) + 1)])
  assert.notEqual(encima.mode, 'LCL')
})

test('carga densa pequeña en volumen pero pesada NO va a grupaje (guard W/M)', () => {
  // 5 m³ pero 12 t (> 40% del payload del 20ST = 11.28 t) → FCL, no LCL
  const denso: CargoItem = { id: 'D', length_mm: 1000, width_mm: 1000, height_mm: 1000, weight_kg: 2400, quantity: 5 }
  const r = assignContainer([denso])
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '20ST')
})

// ─── Asignación automática por tamaño ───────────────────────────────────────

test('pedido mediano → 20ST (el más pequeño donde cabe)', () => {
  // 20 m³ ≤ 33.2 × 0.85 = 28.2 → 20ST
  const r = assignContainer([caja('A', 20)])
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '20ST')
  assert.equal(r.count, 1)
})

test('pedido que no cabe en 20ST pero sí en 40ST → salta al siguiente', () => {
  // 40 m³ > 28.2 (20ST estibado) · ≤ 67.7 × 0.85 = 57.5 → 40ST
  const r = assignContainer([caja('A', 40)])
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '40ST')
})

test('carga alta que solo cabe en High Cube → 40HC por dimensiones', () => {
  // bulto de 2500mm de alto: no entra en 20ST/40ST (2393) ni tumbado (this_way_up);
  // sí en 40HC (2698). Volumen pequeño pero la dimensión manda.
  const alto: CargoItem = {
    id: 'ALTO', length_mm: 2000, width_mm: 2000, height_mm: 2500,
    weight_kg: 500, quantity: 2, required_orientation: 'this_way_up',
  }
  // forzamos a salir de LCL con cajas acompañantes (15 m³)
  const r = assignContainer([alto, caja('B', 15)])
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '40HC')
})

test('pedido gigante → MULTI contenedor con N correcto', () => {
  // 150 m³ → 40HC estibado = 64.94 m³ → 3 contenedores por volumen
  const r = assignContainer([caja('A', 150)])
  assert.equal(r.mode, 'MULTI')
  assert.equal(r.container, '40HC')
  assert.equal(r.count, 3)
})

test('bulto imposible (no pasa por ningún contenedor) → UNFIT con id reportado', () => {
  const monstruo: CargoItem = { id: 'M', length_mm: 13000, width_mm: 2500, height_mm: 2500, weight_kg: 1000, quantity: 1 }
  const r = assignContainer([monstruo])
  assert.equal(r.mode, 'UNFIT')
  assert.deepEqual(r.unfit_items, ['M'])
})

test('carga refrigerada → solo flota reefer (20RF/40RF)', () => {
  const frio: CargoItem = { ...caja('F', 20), refrigerated: true }
  const r = assignContainer([frio])
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '20RF')
})

test('this_way_up: el bulto NO se tumba para encajar', () => {
  // 3000mm de alto: tumbado cabría en cualquier contenedor, de pie en ninguno.
  const item: CargoItem = {
    id: 'V', length_mm: 1000, width_mm: 1000, height_mm: 3000,
    weight_kg: 100, quantity: 1, required_orientation: 'this_way_up',
  }
  assert.equal(itemCabeEnSpec(item, CONTAINER_SPECS['40HC']), false)
  const sinRestriccion: CargoItem = { ...item, required_orientation: 'any' }
  assert.equal(itemCabeEnSpec(sinRestriccion, CONTAINER_SPECS['40HC']), true)
})

test('verifyPack inyectado manda: si el 3D real dice que no cabe, se escala', () => {
  // 20 m³ cabrían en 20ST por heurística, pero el packer real lo niega → 40ST
  const r = assignContainer([caja('A', 20)], {
    verifyPack: (_items, spec) => spec.type !== '20ST',
  })
  assert.equal(r.mode, 'FCL')
  assert.equal(r.container, '40ST')
})

// ─── Gate transversal: peso y medidas obligatorios (decisión José) ─────────

test('gate packaging: mercancía física (hs_code) sin medidas/peso → 4 blockers', () => {
  const r = validatePackagingCompliance({ hs_code: '940360' }) // muebles de madera
  assert.equal(r.ok, false)
  const blockers = r.violations.filter((v) => v.severity === 'blocker')
  assert.equal(blockers.length, 4)
  assert.ok(blockers.some((v) => v.rule === 'PACKAGING_WEIGHT_REQUIRED'))
  assert.ok(blockers.some((v) => v.rule === 'PACKAGING_DIMS_REQUIRED'))
})

test('gate packaging: bulto parcial (solo largo) → bloquea lo que falta', () => {
  const r = validatePackagingCompliance({ package_length_mm: 1200 })
  assert.equal(r.ok, false)
  assert.equal(r.violations.length, 3) // faltan ancho, alto y peso
})

test('gate packaging: ficha física completa → ok', () => {
  const r = validatePackagingCompliance({
    hs_code: '940360',
    package_length_mm: 1200, package_width_mm: 800, package_height_mm: 1000,
    package_weight_kg: 35.5,
  })
  assert.equal(r.ok, true)
  assert.equal(r.violations.length, 0)
})

test('gate packaging: servicio puro (sin HS ni bulto) → no aplica, ok', () => {
  const r = validatePackagingCompliance({ titulo: 'Asesoría jurídica mercantil' })
  assert.equal(r.ok, true)
})

test('gate packaging: valores no positivos (0 · negativo · NaN) → blocker', () => {
  const r = validatePackagingCompliance({
    hs_code: '940360',
    package_length_mm: 0, package_width_mm: -5, package_height_mm: NaN,
    package_weight_kg: 35,
  })
  assert.equal(r.ok, false)
  assert.equal(r.violations.length, 3)
})
