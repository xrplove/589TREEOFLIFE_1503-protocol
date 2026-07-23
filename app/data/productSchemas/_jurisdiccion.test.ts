// Test unitario del modelo de jurisdicción (ADR 0020). Sin dependencias: usa el
// runner nativo `node:test` + `node:assert` y el stripping de tipos de Node ≥23.6.
// Ejecuta con: npm run test:unit   (o: node --test app/data/productSchemas/_jurisdiccion.test.ts)
//
// Cubre la lógica que gobierna el gate /api/products: qué ordenamientos aplican a una
// operación y, sobre todo, la semántica SAFE-BY-DEFAULT (no suprimir un blocker que sí
// aplicaba = evitar falso negativo legal).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  UE_27,
  EEE,
  jurisdiccionesAplicables,
  reglaAplica,
  jurisdiccionesAplicablesOperacion,
} from './_jurisdiccion.ts'

// ── Conjuntos verificados (fuente oficial · ADR 0020 §2.4) ──
test('UE_27 tiene 27 estados y EEE añade IS/LI/NO (no CH)', () => {
  assert.equal(UE_27.length, 27)
  assert.equal(EEE.length, 30)
  for (const c of ['IS', 'LI', 'NO']) assert.ok(EEE.includes(c), `EEE debe incluir ${c}`)
  assert.ok(!EEE.includes('CH'), 'Suiza NO es EEE')
  assert.ok(UE_27.includes('ES') && UE_27.includes('DE'), 'ES y DE en la UE')
  assert.ok(!UE_27.includes('GB'), 'Reino Unido ya no es UE')
})

// ── jurisdiccionesAplicables(actor, mercado) ──
test('actor ES (sin mercado) activa global+ES+UE+EEE', () => {
  const s = jurisdiccionesAplicables('ES', undefined)
  for (const scope of ['global', 'ES', 'UE', 'EEE']) assert.ok(s.has(scope), `falta ${scope}`)
})

test('operación US→US NO activa reglas UE/EEE', () => {
  const s = jurisdiccionesAplicables('US', 'US')
  assert.ok(s.has('global') && s.has('US'))
  assert.ok(!s.has('UE'), 'US→US no debe arrastrar UE')
  assert.ok(!s.has('EEE'))
})

test('vender HACIA la UE (US→DE) activa UE aunque el actor sea US', () => {
  const s = jurisdiccionesAplicables('US', 'DE')
  assert.ok(s.has('UE'), 'mercado DE activa Derecho UE')
})

test('actor en EEE no-UE (IS) activa EEE pero no UE', () => {
  const s = jurisdiccionesAplicables('IS', undefined)
  assert.ok(s.has('EEE') && s.has('IS'))
  assert.ok(!s.has('UE'), 'Islandia es EEE, no UE')
})

test('jurisdiccionesAplicables normaliza mayúsculas/espacios', () => {
  const s = jurisdiccionesAplicables(' es ', 'fr')
  assert.ok(s.has('UE') && s.has('ES'))
})

// ── reglaAplica(scope, set) ──
test('reglaAplica: global y undefined aplican siempre; nacionales según set', () => {
  const setUE = jurisdiccionesAplicables('ES', undefined)
  assert.equal(reglaAplica(undefined, setUE), true)
  assert.equal(reglaAplica('global', setUE), true)
  assert.equal(reglaAplica('UE', setUE), true)
  const setUS = jurisdiccionesAplicables('US', 'US')
  assert.equal(reglaAplica('UE', setUS), false, 'regla UE no aplica a operación US→US')
  assert.equal(reglaAplica('global', setUS), true)
})

// ── jurisdiccionesAplicablesOperacion: SAFE-BY-DEFAULT (lo crítico del gate) ──
test('null (= no filtrar) si falta país del actor', () => {
  assert.equal(jurisdiccionesAplicablesOperacion(undefined, ['US']), null)
  assert.equal(jurisdiccionesAplicablesOperacion('', ['US']), null)
  assert.equal(jurisdiccionesAplicablesOperacion(null, ['US']), null)
})

test('null (= no filtrar) si no hay mercados declarados (indeterminado = global)', () => {
  assert.equal(jurisdiccionesAplicablesOperacion('US', undefined), null)
  assert.equal(jurisdiccionesAplicablesOperacion('US', []), null)
})

test('null (= no filtrar) si algún mercado no es ISO alpha-2 (dato sucio/sentinela)', () => {
  assert.equal(jurisdiccionesAplicablesOperacion('US', ['US', 'USA']), null)
  assert.equal(jurisdiccionesAplicablesOperacion('US', ['WORLD']), null)
})

test('US→[US,CA]: Set sin UE → una regla UE se SUPRIME (correcto)', () => {
  const s = jurisdiccionesAplicablesOperacion('US', ['US', 'CA'])
  assert.ok(s)
  assert.ok(!s.has('UE'), 'operación US confinada fuera de la UE')
  assert.equal(reglaAplica('UE', s), false, 'RoHS-UE no debe bloquear venta US→US/CA')
})

test('ES→[US]: actor en UE → regla UE se MANTIENE (no falso negativo)', () => {
  const s = jurisdiccionesAplicablesOperacion('ES', ['US'])
  assert.ok(s)
  assert.ok(s.has('UE'), 'un actor español cumple UE aunque venda a US')
  assert.equal(reglaAplica('UE', s), true)
})

test('US→[US,DE]: vende a Alemania → regla UE se MANTIENE', () => {
  const s = jurisdiccionesAplicablesOperacion('US', ['US', 'DE'])
  assert.ok(s)
  assert.equal(reglaAplica('UE', s), true, 'vender a DE activa Derecho UE')
})
