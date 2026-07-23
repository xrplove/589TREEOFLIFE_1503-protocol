// Test del enrutado de escritorio + módulos por sector/rol.
// Runner nativo node:test. Ejecuta con: npm run test:unit
//
// Protege la regla de la tarea 2: el VENDEDOR de inmobiliario aterriza en su
// escritorio REAL (/inmobiliario), mientras que el COMPRADOR (mismo sector, otro
// rol) NO cae ahí — sigue en el WorkspaceShell hasta tener su vista (tarea 3).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { landingPathFor, modulesFor } from './sectorDashboardConfig.ts'

test('el vendedor (inmobiliario_fabricante) aterriza en el escritorio real', () => {
  assert.equal(
    landingPathFor({ sectorId: 'inmobiliario', roleId: 'inmobiliario_fabricante' }),
    '/inmobiliario',
  )
})

test('el comprador (inmobiliario_comprador) aterriza en SU escritorio, no el del vendedor', () => {
  const path = landingPathFor({ sectorId: 'inmobiliario', roleId: 'inmobiliario_comprador' })
  assert.notEqual(path, '/inmobiliario')
  assert.equal(path, '/comprador')
})

test('el transitario sigue aterrizando en su escritorio real', () => {
  assert.equal(landingPathFor({ sectorId: 'transporte', roleId: 'transitarios-mar' }), '/transitario')
})

test('sin sector/rol → onboarding (nunca vacío)', () => {
  assert.equal(landingPathFor({}), '/registro/sector')
})

test('el vendedor ve el set de módulos de inmobiliario (incluye catalogo)', () => {
  const mods = modulesFor({ sectorId: 'inmobiliario', roleId: 'inmobiliario_fabricante' })
  assert.ok(mods.includes('catalogo'), 'el catálogo debe estar entre sus módulos')
  assert.ok(mods.length > 1, 'el set no debe ser trivial')
})
