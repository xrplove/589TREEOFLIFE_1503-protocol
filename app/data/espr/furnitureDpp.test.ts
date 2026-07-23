// Test del gate ESPR · DPP de mueble (ley 2028 · 2028-ready).
// Runner nativo node:test. Ejecuta con: npm run test:unit
//
// Verifica: una ficha de mueble COMPLETA pasa; a la que le falte cualquier campo
// ESPR (universal o de mueble) se le devuelve un blocker con base legal trazable.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ESPR_FURNITURE_REQUIREMENTS,
  validateEsprFurnitureDpp,
  esprReadiness,
} from './furnitureDpp.ts'

/** Ficha 2028-ready completa (todos los campos ESPR presentes). */
function fichaCompleta(): Record<string, unknown> {
  return {
    materials: [{ name: 'roble', percentage: 90 }],
    recyclability_pct: 80,
    recycled_content_pct: 15,
    substances_of_concern: { declared: true, list: [] }, // "ninguna" pero DECLARADO
    wood_source: 'Quercus robur · FSC 100%',
    durability: 'EN 12520 · uso doméstico severo',
    repair_disassembly: 'https://artikalia.example/repair/silla-001',
    spare_parts: 'Patas y tornillería · 10 años',
  }
}

test('el catálogo de requisitos cubre universales + esperados de mueble', () => {
  const ids = ESPR_FURNITURE_REQUIREMENTS.map((r) => r.id)
  assert.ok(ids.includes('espr-substances-of-concern'))
  assert.ok(ids.includes('espr-wood-source'))
  assert.ok(ids.includes('espr-durability'))
  assert.ok(ids.includes('espr-repair-disassembly'))
  assert.ok(ids.includes('espr-spare-parts'))
})

test('ficha 2028-ready completa pasa el gate ESPR (cualquier modo)', () => {
  assert.equal(validateEsprFurnitureDpp(fichaCompleta(), { mode: 'today' }).ok, true)
  assert.equal(validateEsprFurnitureDpp(fichaCompleta(), { mode: '2028' }).ok, true)
  assert.equal(validateEsprFurnitureDpp(fichaCompleta()).violations.length, 0)
})

test('HOY: ficha vacía NO bloquea (legal sin ESPR) · solo avisos de preparación 2028', () => {
  const r = validateEsprFurnitureDpp({}) // mode por defecto = 'today'
  assert.equal(r.ok, true, 'hoy el producto es legal sin ESPR → no bloquea')
  assert.equal(r.violations.length, ESPR_FURNITURE_REQUIREMENTS.length)
  for (const v of r.violations) {
    assert.equal(v.severity, 'warning')
    assert.match(v.message, /hoy el producto es legal sin él/i)
    assert.match(v.fuente_url ?? '', /eur-lex\.europa\.eu/)
  }
})

test('2028: ficha vacía SÍ bloquea por todos los requisitos (ley en vigor)', () => {
  const r = validateEsprFurnitureDpp({}, { mode: '2028' })
  assert.equal(r.ok, false)
  assert.equal(r.violations.length, ESPR_FURNITURE_REQUIREMENTS.length)
  assert.ok(r.violations.every((v) => v.severity === 'blocker'))
})

test('esprReadiness reporta qué falta para 2028 sin bloquear', () => {
  const completa = esprReadiness(fichaCompleta())
  assert.equal(completa.ready, true)
  assert.equal(completa.missing.length, 0)

  const f = fichaCompleta()
  delete f.wood_source
  const parcial = esprReadiness(f)
  assert.equal(parcial.ready, false)
  assert.deepEqual(parcial.missing, ['wood_source'])
  assert.equal(parcial.total, ESPR_FURNITURE_REQUIREMENTS.length)
})

test('sustancias preocupantes NO declaradas (declared:false) cuentan como ausentes', () => {
  const f = fichaCompleta()
  f.substances_of_concern = { declared: false }
  assert.ok(esprReadiness(f).missing.includes('substances_of_concern'))
})

test('reciclabilidad presente como 0 es válida (número finito, no "ausente")', () => {
  const f = fichaCompleta()
  f.recyclability_pct = 0
  assert.ok(!esprReadiness(f).missing.includes('recyclability_pct'))
})
