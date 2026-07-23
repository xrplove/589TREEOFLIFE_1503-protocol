// Test unitario del GATE de cumplimiento sectorial (Capa 2 · ADR 0011/0020).
// Sin dependencias: runner nativo `node:test` + `node:assert` y stripping de
// tipos de Node ≥23.6. Ejecuta con: npm run test:unit
//
// Este gate es el que bloquea server-side en /api/products: una ficha con un
// `blocker` sin resolver NO se publica ("ficha incompleta no opera"). Hasta
// ahora tenía 0 tests pese a ser ruta crítica. Cubrimos:
//  - El contrato del dispatcher (no lanza, resultado bien formado, ok-invariante).
//  - Que todos los sectores declarados con enforcement están realmente cableados.
//  - Que un sector desconocido avisa (no falla en silencio).
//  - Que un blocker determinista (RoHS) efectivamente bloquea, y que su ausencia
//    deja `ok:true`.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateSectorCompliance,
  SECTORS_WITH_COMPLIANCE,
  type ComplianceResult,
} from './_compliance.ts'

function assertWellFormed(result: ComplianceResult, ctx: string) {
  assert.ok(result && typeof result === 'object', `${ctx}: resultado no es objeto`)
  assert.equal(typeof result.ok, 'boolean', `${ctx}: ok no es boolean`)
  assert.ok(Array.isArray(result.violations), `${ctx}: violations no es array`)
  for (const v of result.violations) {
    assert.ok(v.rule && v.rule.length > 0, `${ctx}: violation sin rule`)
    assert.ok(v.law && v.law.length > 0, `${ctx}: violation ${v.rule} sin law`)
    assert.ok(v.message && v.message.length > 0, `${ctx}: violation ${v.rule} sin message`)
    assert.ok(
      v.severity === 'blocker' || v.severity === 'warning',
      `${ctx}: violation ${v.rule} con severity inválida (${v.severity})`,
    )
  }
}

// ── Sector desconocido: avisa, no falla en silencio (canon "no atajos") ──
test('sector desconocido devuelve ok:true con warning NOT_IMPLEMENTED (no silencioso)', () => {
  const r = validateSectorCompliance('sector-inexistente', {})
  assert.equal(r.ok, true)
  assert.equal(r.violations.length, 1)
  assert.equal(r.violations[0].rule, 'SECTOR_COMPLIANCE_NOT_IMPLEMENTED')
  assert.equal(r.violations[0].severity, 'warning')
})

// ── Robustez: ningún validador sectorial revienta ante una ficha vacía ──
test('cada sector con enforcement tolera ficha {} sin lanzar y devuelve resultado bien formado', () => {
  assert.ok(SECTORS_WITH_COMPLIANCE.length >= 15, 'esperados 15+ sectores con enforcement')
  for (const sector of SECTORS_WITH_COMPLIANCE) {
    let r: ComplianceResult
    assert.doesNotThrow(() => {
      r = validateSectorCompliance(sector, {})
    }, `${sector}: el validador lanzó con {}`)
    assertWellFormed(r!, sector)
  }
})

// ── Cableado: todo sector declarado en la lista está realmente enrutado ──
test('todo sector de SECTORS_WITH_COMPLIANCE está cableado en el dispatcher (no cae en NOT_IMPLEMENTED)', () => {
  for (const sector of SECTORS_WITH_COMPLIANCE) {
    const r = validateSectorCompliance(sector, {})
    const cae = r.violations.some((v) => v.rule === 'SECTOR_COMPLIANCE_NOT_IMPLEMENTED')
    assert.equal(cae, false, `${sector} está en la lista pero el dispatcher no lo enruta`)
  }
})

// ── Invariante núcleo del gate: ok ⟺ no hay ningún blocker ──
test('ok-invariante: ok===true sii no hay violación blocker (todos los sectores)', () => {
  for (const sector of SECTORS_WITH_COMPLIANCE) {
    const r = validateSectorCompliance(sector, {})
    const hayBlocker = r.violations.some((v) => v.severity === 'blocker')
    assert.equal(r.ok, !hayBlocker, `${sector}: ok no es coherente con sus blockers`)
  }
})

// ── Un blocker determinista bloquea de verdad (RoHS · Dir. 2011/65/UE) ──
test('tecnología · componente EEE con rohs_compliant=false → ok:false + blocker ROHS_NON_COMPLIANT', () => {
  const r = validateSectorCompliance('tecnologia', {
    sub_categoria: 'componente_electronico',
    rohs_compliant: false,
  })
  assert.equal(r.ok, false)
  const rohs = r.violations.find((v) => v.rule === 'ROHS_NON_COMPLIANT')
  assert.ok(rohs, 'no se disparó la regla ROHS_NON_COMPLIANT')
  assert.equal(rohs!.severity, 'blocker')
})

test('tecnología · componente EEE con rohs_compliant=true → sin blocker (ok:true)', () => {
  const r = validateSectorCompliance('tecnologia', {
    sub_categoria: 'componente_electronico',
    rohs_compliant: true,
  })
  assert.equal(r.ok, true)
  assert.equal(r.violations.some((v) => v.rule === 'ROHS_NON_COMPLIANT'), false)
})

// ── D1 · null-safety: financiero con ficha vacía da el blocker CONCRETO, no el
//    genérico fail-closed (antes lanzaba TypeError sobre p.aml) ──
test('financiero · ficha {} → blocker concreto FIN_AML_KYC_PROGRAM_MISSING (no VALIDATOR_ERROR)', () => {
  const r = validateSectorCompliance('financiero', {})
  assert.equal(r.ok, false)
  assert.ok(
    r.violations.some((v) => v.rule === 'FIN_AML_KYC_PROGRAM_MISSING' && v.severity === 'blocker'),
    'esperado blocker FIN_AML_KYC_PROGRAM_MISSING',
  )
  assert.equal(
    r.violations.some((v) => v.rule === 'COMPLIANCE_VALIDATOR_ERROR'),
    false,
    'no debe caer en el fail-closed genérico: el validador ya es null-safe',
  )
})

// ── Pasada fiscal transversal: el dispatcher la fusiona sin romper el contrato ──
test('un bloque fiscal se procesa y fusiona sin romper el resultado (ok-invariante se mantiene)', () => {
  const r = validateSectorCompliance('sector-inexistente', { fiscal: {} })
  assertWellFormed(r, 'fiscal-merge')
  const hayBlocker = r.violations.some((v) => v.severity === 'blocker')
  assert.equal(r.ok, !hayBlocker)
})
