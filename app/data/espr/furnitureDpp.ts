// ════════════════════════════════════════════════════════════════════════════
// CUMPLIMIENTO ESPR · DPP DE MUEBLE (obligatorio ~2028) · 2028-READY
// ────────────────────────────────────────────────────────────────────────────
// Reg. (UE) 2024/1781 (ESPR) impone Pasaporte Digital de Producto. Para MUEBLE el
// acto delegado específico se espera adoptar en 2028 y obliga ~2028-2029. A día de
// hoy el acto delegado del mueble SIGUE EN BORRADOR → los campos exactos no están
// cerrados. Los campos UNIVERSALES del DPP sí son estables.
//
// DECISIÓN (José): el test cumple con la ley de 2028 COMPLETO → exigimos ya, en la
// ingesta del conector, los campos universales estables + los esperados del mueble.
// Una ficha sin ellos se BLOQUEA ("ficha incompleta no exporta"). Es el gate
// demostrando futuro-cumplimiento: el catálogo que entra sale listo para 2028.
//
// HONESTIDAD (canon · regla global): se construye sobre los requisitos CONOCIDOS y
// el BORRADOR del acto delegado de mueble → cada requisito lleva `status:
// 'subject_to_expert'` + `legal_basis` + `source_url`. La conformidad final la sella
// el abogado, no este módulo. La PII nunca entra en el DPP (solo hash · RGPD).
// ════════════════════════════════════════════════════════════════════════════

import type { ComplianceResult, ComplianceSeverity, ComplianceViolation } from '../productSchemas/_compliance'

const ESPR_URL = 'https://eur-lex.europa.eu/eli/reg/2024/1781/oj'

/** Un requisito ESPR del DPP de mueble (lo que la ficha debe traer para ser 2028-ready). */
export type EsprRequirement = {
  /** ID estable. */
  id: string
  /** Campo del cuerpo de producto que lo satisface. */
  field: string
  /** Qué exige (mensaje al usuario). */
  message: string
  /** Base legal. */
  legal_basis: string
  /** Universal estable (true) vs específico de mueble en borrador (false). */
  universal: boolean
}

/** Requisitos del DPP de mueble (universales estables + esperados del mueble). */
export const ESPR_FURNITURE_REQUIREMENTS: readonly EsprRequirement[] = [
  // ── Universales estables (ya exigibles sin esperar al acto delegado) ──
  {
    id: 'espr-materials',
    field: 'materials',
    message: 'Composición de materiales estructurada (ESPR · DPP).',
    legal_basis: 'Reg. (UE) 2024/1781 (ESPR) · requisitos de información del DPP',
    universal: true,
  },
  {
    id: 'espr-recyclability',
    field: 'recyclability_pct',
    message: 'Porcentaje de reciclabilidad del producto (ESPR · DPP).',
    legal_basis: 'Reg. (UE) 2024/1781 (ESPR) · circularidad',
    universal: true,
  },
  {
    id: 'espr-recycled-content',
    field: 'recycled_content_pct',
    message: 'Porcentaje de contenido reciclado (ESPR · DPP).',
    legal_basis: 'Reg. (UE) 2024/1781 (ESPR) · circularidad',
    universal: true,
  },
  {
    id: 'espr-substances-of-concern',
    field: 'substances_of_concern',
    message: 'Declaración de sustancias preocupantes (SVHC / retardantes de llama) — debe declararse aunque sea "ninguna".',
    legal_basis: 'Reg. (UE) 2024/1781 (ESPR) Art. 7 · sustancias preocupantes (SCIP/REACH)',
    universal: true,
  },
  // ── Esperados del MUEBLE (acto delegado en borrador · subject_to_expert) ──
  {
    id: 'espr-wood-source',
    field: 'wood_source',
    message: 'Origen de la madera (especie + fuente sostenible) — esperado para mueble de madera.',
    legal_basis: 'ESPR · acto delegado de mueble (borrador) + EUDR (Reg. (UE) 2023/1115) deforestación',
    universal: false,
  },
  {
    id: 'espr-durability',
    field: 'durability',
    message: 'Información de durabilidad (clase o referencia de ensayo) — esperado para mueble.',
    legal_basis: 'ESPR · acto delegado de mueble (borrador) · durabilidad',
    universal: false,
  },
  {
    id: 'espr-repair-disassembly',
    field: 'repair_disassembly',
    message: 'Instrucciones de desmontaje/reparación — esperado para mueble.',
    legal_basis: 'ESPR · acto delegado de mueble (borrador) · reparabilidad',
    universal: false,
  },
  {
    id: 'espr-spare-parts',
    field: 'spare_parts',
    message: 'Disponibilidad de recambios — esperado para mueble.',
    legal_basis: 'ESPR · acto delegado de mueble (borrador) · recambios',
    universal: false,
  },
]

/** ¿El campo está presente y con valor útil en el cuerpo del producto? */
function present(body: Record<string, unknown>, field: string): boolean {
  const v = body[field]
  if (v === undefined || v === null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'number') return Number.isFinite(v)
  if (typeof v === 'object') {
    // Para `substances_of_concern`: se admite { declared: true, list?: [] } (ninguna = declarado).
    const o = v as Record<string, unknown>
    if (typeof o.declared === 'boolean') return o.declared === true
    return Object.keys(o).length > 0
  }
  return Boolean(v)
}

/** Modo de evaluación ESPR:
 *  - 'today'  → HOY el producto es legal sin DPP ESPR; los huecos son AVISOS de
 *    preparación 2028 (no impiden operar). Es el modo del live actual.
 *  - '2028'   → la ley está en vigor; cada hueco es BLOCKER ("no exporta"). */
export type EsprMode = 'today' | '2028'

/**
 * Evalúa el DPP ESPR de una ficha de mueble. La severidad depende del modo:
 * hoy (legal sin ESPR) = `warning` de preparación; 2028 (en vigor) = `blocker`.
 * El DPP en sí se acuña igual (simulado); esto solo mide la preparación 2028.
 */
export function validateEsprFurnitureDpp(
  body: Record<string, unknown>,
  opts: { mode?: EsprMode } = {},
): ComplianceResult {
  const mode = opts.mode ?? 'today'
  const severity: ComplianceSeverity = mode === '2028' ? 'blocker' : 'warning'
  const tail =
    mode === '2028'
      ? ' [requisito ESPR EN VIGOR · sujeto a validación experta]'
      : ' [requisito ESPR · obligatorio ~2028 · hoy el producto es legal sin él · sujeto a validación experta]'
  const violations: ComplianceViolation[] = []
  for (const req of ESPR_FURNITURE_REQUIREMENTS) {
    if (!present(body, req.field)) {
      violations.push({
        rule: req.id.toUpperCase().replace(/-/g, '_'),
        law: req.legal_basis,
        message: req.message + tail,
        field: req.field,
        severity,
        fuente_url: ESPR_URL,
      })
    }
  }
  // `ok` = no hay blockers. En modo 'today' siempre ok (avisos no bloquean).
  return { ok: !violations.some((v) => v.severity === 'blocker'), violations }
}

/** Grado de preparación 2028 de una ficha (para mostrar "listo para 2028" o qué falta). */
export function esprReadiness(body: Record<string, unknown>): {
  ready: boolean
  missing: string[]
  total: number
} {
  const missing = ESPR_FURNITURE_REQUIREMENTS.filter((r) => !present(body, r.field)).map((r) => r.field)
  return { ready: missing.length === 0, missing, total: ESPR_FURNITURE_REQUIREMENTS.length }
}
