// Test unitario del motor de cumplimiento de comercio (corredor · ADR 0022 · Capa 1).
// Runner nativo `node:test` + `node:assert` (sin dependencias). Ejecuta con:
//   npm run test:unit   (o: node --test app/data/tradeCompliance.test.ts)
//
// Cubre el resolutor composicional: que las reglas de SALIDA del lote UE apliquen a
// cualquier origen UE-27, NO a orígenes fuera de la UE, y la semántica condicional
// (reglas que solo aplican si el producto cae en su ámbito).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TRADE_RULES,
  getCorridorRequirements,
  ruleMatchesCorridor,
  groupByLayer,
  splitConditional,
  inBloc,
  type TradeRule,
} from './tradeCompliance.ts'

// ── Integridad del catálogo ──
test('todas las reglas tienen source_url oficial + legal_basis + status', () => {
  assert.ok(TRADE_RULES.length >= 7, 'el lote UE de salida debe tener ≥7 reglas')
  for (const r of TRADE_RULES) {
    assert.match(r.source_url, /^https:\/\//, `${r.id}: source_url debe ser https oficial`)
    assert.ok(r.legal_basis && r.legal_basis.length > 0, `${r.id}: falta legal_basis`)
    assert.equal(r.status, 'subject_to_expert', `${r.id}: status debe ser subject_to_expert`)
    assert.ok(r.label.es && r.label.en, `${r.id}: label debe estar en es+en`)
    assert.equal(typeof r.conditional, 'boolean', `${r.id}: conditional debe ser boolean`)
  }
})

test('los IDs de regla son únicos', () => {
  const ids = TRADE_RULES.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length, 'hay IDs duplicados')
})

// ── inBloc ──
test('inBloc · ES y DE están en EU; GB y US no', () => {
  assert.ok(inBloc('ES', 'EU'))
  assert.ok(inBloc('de', 'EU'), 'case-insensitive')
  assert.ok(!inBloc('GB', 'EU'), 'Reino Unido ya no es UE')
  assert.ok(!inBloc('US', 'EU'))
  assert.ok(inBloc('NO', 'EEE') && !inBloc('NO', 'EU'), 'Noruega es EEE pero no UE')
})

// ── Capa 1 SALIDA · origen UE ──
test('exportador ES activa las reglas de salida UE (EORI, declaración, sanciones)', () => {
  const rules = getCorridorRequirements({ origin: 'ES' })
  const ids = rules.map((r) => r.id)
  for (const id of ['eu-exit-eori', 'eu-exit-export-declaration', 'eu-exit-sanctions-screening']) {
    assert.ok(ids.includes(id), `falta ${id} para origen ES`)
  }
})

test('cualquier origen UE-27 activa el mismo marco de salida (DE)', () => {
  const es = getCorridorRequirements({ origin: 'ES' }).map((r) => r.id).sort()
  const de = getCorridorRequirements({ origin: 'DE' }).map((r) => r.id).sort()
  assert.deepEqual(de, es, 'el marco de salida UE debe ser igual para todo origen UE-27')
})

test('origen FUERA de la UE no activa el lote de salida UE (US)', () => {
  const rules = getCorridorRequirements({ origin: 'US' })
  assert.equal(rules.length, 0, 'US no es origen UE → 0 reglas del lote UE actual')
})

test('sin origen no se afirma la salida UE (no aparece ninguna regla exit)', () => {
  // Las reglas de salida exigen la dimensión origen; sin valor no casan (conservador).
  // Una consulta solo-destino sí puede traer reglas de ENTRADA del destino, pero NUNCA de salida.
  const grouped = groupByLayer(getCorridorRequirements({ destination: 'CO' }))
  assert.equal(grouped.exit.length, 0, 'sin origen no debe afirmarse ninguna regla de salida')
})

// ── Semántica condicional ──
test('EORI/declaración/sanciones son SIEMPRE aplicables; doble uso/CITES/residuos condicionales', () => {
  const rules = getCorridorRequirements({ origin: 'ES' })
  const { always, conditional } = splitConditional(rules)
  const alwaysIds = always.map((r) => r.id)
  const condIds = conditional.map((r) => r.id)
  assert.ok(alwaysIds.includes('eu-exit-eori'))
  assert.ok(alwaysIds.includes('eu-exit-export-declaration'))
  assert.ok(alwaysIds.includes('eu-exit-sanctions-screening'))
  assert.ok(condIds.includes('eu-exit-dual-use'), 'doble uso es condicional')
  assert.ok(condIds.includes('eu-exit-cites'), 'CITES es condicional')
  assert.ok(condIds.includes('eu-exit-waste-shipment'), 'residuos es condicional')
})

// ── Agrupación por capa ──
test('groupByLayer · el lote actual solo puebla la capa exit', () => {
  const grouped = groupByLayer(getCorridorRequirements({ origin: 'ES' }))
  assert.ok(grouped.exit.length >= 7)
  assert.equal(grouped.entry.length, 0)
  assert.equal(grouped.agreement.length, 0)
  assert.equal(grouped.sectoral.length, 0)
})

// ── Comodín de dimensiones no declaradas ──
test('ruleMatchesCorridor · una regla solo de origen casa con cualquier destino/sector', () => {
  const eori = TRADE_RULES.find((r) => r.id === 'eu-exit-eori') as TradeRule
  assert.ok(ruleMatchesCorridor(eori, { origin: 'ES', destination: 'CO', sector: 'textil' }))
  assert.ok(ruleMatchesCorridor(eori, { origin: 'ES' }))
  assert.ok(!ruleMatchesCorridor(eori, { origin: 'US' }))
})

// ── Capa 2 ENTRADA · destino Colombia ──
test('importar a CO activa registro/declaración DIAN (siempre) por destino', () => {
  const rules = getCorridorRequirements({ destination: 'CO' })
  const ids = rules.map((r) => r.id)
  assert.ok(ids.includes('co-entry-importer-registration'))
  assert.ok(ids.includes('co-entry-import-declaration'))
})

test('entrada CO marca el embalaje de madera NIMF-15 como condicional (relevante mueble)', () => {
  const { conditional } = splitConditional(getCorridorRequirements({ destination: 'CO' }))
  assert.ok(conditional.some((r) => r.id === 'co-entry-ica-wood-packaging'))
})

test('un destino distinto (US) no activa el lote de entrada de Colombia', () => {
  const ids = getCorridorRequirements({ destination: 'US' }).map((r) => r.id)
  assert.ok(!ids.some((id) => id.startsWith('co-entry-')))
})

// ── Corredor completo ES→CO (ejemplo canónico ADR 0022) ──
test('corredor ES→CO compone SALIDA UE (exit) + ENTRADA CO (entry)', () => {
  const grouped = groupByLayer(getCorridorRequirements({ origin: 'ES', destination: 'CO' }))
  // Salida: el marco UE completo aplica porque ES es origen UE.
  assert.ok(grouped.exit.length >= 7, 'debe traer el marco de salida UE')
  assert.ok(grouped.exit.every((r) => r.id.startsWith('eu-exit-')))
  // Entrada: el lote Colombia completo aplica porque CO es destino.
  assert.ok(grouped.entry.length >= 6, 'debe traer el marco de entrada CO')
  assert.ok(grouped.entry.every((r) => r.id.startsWith('co-entry-')))
  // Aún sin capa de acuerdos (Capa 3) ni sectorial (Capa 4).
  assert.equal(grouped.agreement.length, 0)
  assert.equal(grouped.sectoral.length, 0)
})

test('ES→CO · lo SIEMPRE exigible incluye salida UE base + alta/declaración DIAN', () => {
  const { always } = splitConditional(getCorridorRequirements({ origin: 'ES', destination: 'CO' }))
  const ids = always.map((r) => r.id)
  for (const id of [
    'eu-exit-eori',
    'eu-exit-export-declaration',
    'eu-exit-sanctions-screening',
    'co-entry-importer-registration',
    'co-entry-import-declaration',
  ]) {
    assert.ok(ids.includes(id), `falta en "siempre exigible": ${id}`)
  }
})
