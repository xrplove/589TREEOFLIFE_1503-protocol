// ERP Mapping · estrategia universal de adapter 1503 ↔ ERPs externos.
//
// Cada campo de un schema sectorial declara CÓMO se rellena cuando llega un
// producto desde el ERP del Actor. NO se inventa nada — sale del doc
// `docs/erp-adapter-strategy.md` §4 (modelo de mapping en 4 niveles).
//
// La promesa al Actor:
//   «Guarda en tu ERP → aparece en 1503 sin trabajo extra»
// se cumple SOLO si cada campo del schema tiene un mapping declarado
// honesto y validado. Sin este mapping, la promesa es vapor.

// ============================================================================
// ESTRATEGIA DEL MAPPING POR CAMPO
// ============================================================================

/** Las 4 estrategias de rellenado de un campo del schema sectorial.
 *
 * - `universal`: campo presente como nativo en TODOS los ERPs soportados
 *   (sku · price · stock · description · ean13). Mapping directo sin
 *   intervención del Actor.
 *
 * - `extended`: campo que el Actor configura como custom field en su ERP
 *   (Holded · Odoo · Sage) una sola vez vía wizard de onboarding. Una
 *   vez configurado, se rellena automáticamente en futuras ediciones.
 *
 * - `ai_extraction`: campo que IA Claude extrae automáticamente de
 *   PDFs/imágenes subidos por el Actor (certificados IEE · notas
 *   simples · bills of lading · etc.). Confidence score por campo.
 *
 * - `manual`: campo que el Actor introduce manualmente en UI 1503.
 *   Generalmente campos declarativos (compromisos legales · políticas
 *   comerciales) o decisiones del Actor que NO son extraíbles. */
export type ErpMappingStrategy =
  | 'universal'
  | 'extended'
  | 'ai_extraction'
  | 'manual'

/** Prioridad del campo en conflict resolution (ver doc §8).
 *
 * - `bidirectional`: ERP y UI pueden editar · last-write-wins por timestamp
 * - `erp_authoritative`: si ERP lo modifica, UI se actualiza · UI puede
 *   editar pero próximo sync ERP sobrescribe (uso: stock · price)
 * - `ui_only`: solo modificable desde UI 1503 (declaraciones legales
 *   · políticas comerciales). ERP nunca sobrescribe.
 * - `ai_only`: solo rellenable por IA (campos extraídos de PDF) · UI
 *   permite override pero no edición ad-hoc. */
export type ErpMappingPriority =
  | 'bidirectional'
  | 'erp_authoritative'
  | 'ui_only'
  | 'ai_only'

// ============================================================================
// IDENTIFICADOR DEL CAMPO ORIGEN EN CADA ERP
// ============================================================================

/** Identificador del campo origen en Holded (Madrid · partner principal). */
export type HoldedFieldRef = {
  /** Si es campo nativo: dotted path (e.g. 'product.sku' · 'product.barcode'). */
  native?: string
  /** Si es custom field: slug del custom field (e.g. 'iee_letra'). El
   *  prefijo `pm_` se aplica automáticamente al crear el custom field para
   *  identificar que viene de 1503. */
  custom?: string
  /** Tipo de dato esperado en Holded (para el wizard de creación de custom
   *  fields y para validación de payloads de webhook). */
  dtype?: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'enum' | 'json' | 'binary'
  /** Si dtype='enum': valores aceptados. */
  enum_values?: string[]
}

/** Identificador del campo origen en Odoo (open source · segundo target). */
export type OdooFieldRef = {
  /** Modelo Odoo (e.g. 'product.template' · 'product.product' ·
   *  'stock.quant'). */
  model?: string
  /** Nombre del campo en el modelo (e.g. 'default_code' · 'list_price' ·
   *  'qty_available'). */
  field?: string
  /** Si es custom field creado vía Studio: prefijo 'x_' (e.g.
   *  'x_iee_consumo_kwh'). */
  custom?: string
  dtype?: 'char' | 'text' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime' | 'selection' | 'binary' | 'one2many'
}

/** Identificador del campo origen en Sage (Sage 50/200/X3 · alternativa ES). */
export type SageFieldRef = {
  /** Tabla Sage (e.g. 'ARTICULO' · 'EXISTENCIAS'). */
  table?: string
  /** Campo (e.g. 'CODIGO' · 'PRECIO' · 'CODBARRAS'). */
  field?: string
  /** Notas: Sage 50 limita custom fields · Sage X3 más flexible. */
  notes?: string
}

/** Identificador del campo origen en SAP S/4HANA (Fase 6.5 · partner
 *  integrador). */
export type SapFieldRef = {
  /** OData service path. */
  service?: string
  /** Entity name (e.g. 'A_Product' · 'A_ProductDescription'). */
  entity?: string
  /** Field name (e.g. 'ProductBaseUnit' · 'ProductGroup'). */
  field?: string
  /** Z-field si es customización. */
  z_field?: string
}

// ============================================================================
// CONFIGURACIÓN DE IA EXTRACTION PARA UN CAMPO
// ============================================================================

/** Configuración para extracción IA cuando strategy='ai_extraction'. */
export type AiExtractionConfig = {
  /** Tipo de documento del que se extrae (e.g. 'iee_cee_es' · 'nota_simple_es'
   *  · 'bill_of_lading' · 'haccp_certificate'). Vincula con un prompt
   *  versionado en `prompts/erp-extract/{type}@{version}.md`. */
  document_type: string

  /** Versión del prompt usado · bumpear si cambia la lógica de extracción. */
  prompt_version: string

  /** Confidence threshold mínimo para auto-aceptar el valor extraído (0-1).
   *  Por debajo de este umbral → notificación al Actor para revisar. */
  min_confidence: number

  /** Modelo Claude recomendado para este tipo de extracción. */
  recommended_model: 'haiku-4-5' | 'sonnet-4-6' | 'opus-4-7'

  /** Coste estimado por extracción en USD (orientativo · validar con
   *  benchmarks reales). */
  cost_per_extraction_usd_estimated?: number
}

// ============================================================================
// ENTRADA DEL MAPPING POR CAMPO
// ============================================================================

/** Mapping declarativo de UN campo de un schema sectorial 1503 a sus
 *  equivalentes en cada ERP soportado + estrategia de rellenado. */
export type ErpMappingEntry = {
  /** Path del campo en el schema TypeScript (dotted notation · e.g.
   *  'iee.consumo_kwh_m2_year' · 'caracteristicas.ano_construccion'). */
  schema_path: string

  /** Estrategia de rellenado primaria. */
  strategy: ErpMappingStrategy

  /** Prioridad en conflict resolution. Default 'bidirectional'. */
  priority?: ErpMappingPriority

  /** Mapping en Holded · obligatorio si strategy='universal' o 'extended'. */
  holded?: HoldedFieldRef

  /** Mapping en Odoo · obligatorio si strategy='universal' o 'extended' y
   *  Odoo está soportado en ese sector. */
  odoo?: OdooFieldRef

  /** Mapping en Sage · opcional. */
  sage?: SageFieldRef

  /** Mapping en SAP S/4HANA · Fase 6.5. */
  sap?: SapFieldRef

  /** Configuración IA si strategy='ai_extraction'. */
  ai?: AiExtractionConfig

  /** Justificación si strategy='manual': razón por la que NO se puede
   *  automatizar (e.g. 'declaración legal del Actor · responsabilidad
   *  civil' · 'política comercial · decisión del Actor por ficha'). */
  manual_justification?: string

  /** Fallback strategy si la primaria falla (e.g. extended falla porque el
   *  Actor no configuró el custom field → fallback a ai_extraction o manual). */
  fallback?: ErpMappingStrategy

  /** Si el campo está marcado obligatorio en el schema TS → en runtime debe
   *  estar relleno antes de publicar la ficha. Marca para UI. */
  required: boolean

  /** Notas internas para el equipo (no se exponen al Actor). */
  internal_notes?: string
}

// ============================================================================
// MAPPING DE UN SECTOR COMPLETO
// ============================================================================

/** Mapping completo de un schema sectorial. La clave del Record es el
 *  `schema_path` de cada campo (dotted notation). */
export type SectorErpMapping = {
  sector_id: string
  /** Versión del schema sectorial al que aplica este mapping. Si el schema
   *  cambia versión, el mapping también debe bumpearse y migrarse. */
  schema_version: string
  /** Versión del mapping en sí. */
  mapping_version: string
  /** Status de validación del mapping (igual disciplina que schemas). */
  status: 'draft' | 'validated'
  /** Fecha de última revisión. */
  last_reviewed_at?: string
  /** Entradas por schema_path. */
  entries: Readonly<Record<string, ErpMappingEntry>>
}

// ============================================================================
// HELPERS · introspección y reporting
// ============================================================================

/** Resumen agregado del mapping de un sector · útil para reporting y para
 *  comunicar honestamente al Actor el % auto-rellenable de su ficha. */
export type SectorMappingSummary = {
  sector_id: string
  schema_version: string
  total_fields: number
  by_strategy: {
    universal: number
    extended: number
    ai_extraction: number
    manual: number
  }
  by_priority: {
    bidirectional: number
    erp_authoritative: number
    ui_only: number
    ai_only: number
  }
  /** Porcentaje del schema que se rellena SIN trabajo manual del Actor
   *  (universal + extended + ai_extraction con auto-aceptación). */
  auto_fill_percentage: number
  /** Porcentaje que queda manual (esfuerzo único del Actor por ficha). */
  manual_percentage: number
}

/** Calcula resumen agregado del mapping de un sector. */
export function summarizeSectorMapping(mapping: SectorErpMapping): SectorMappingSummary {
  const entries = Object.values(mapping.entries)
  const total = entries.length

  const by_strategy = {
    universal: 0,
    extended: 0,
    ai_extraction: 0,
    manual: 0,
  }

  const by_priority = {
    bidirectional: 0,
    erp_authoritative: 0,
    ui_only: 0,
    ai_only: 0,
  }

  for (const e of entries) {
    by_strategy[e.strategy]++
    const p = e.priority ?? 'bidirectional'
    by_priority[p]++
  }

  const auto_count = by_strategy.universal + by_strategy.extended + by_strategy.ai_extraction
  const auto_fill_percentage = total === 0 ? 0 : Math.round((auto_count / total) * 100)
  const manual_percentage = total === 0 ? 0 : Math.round((by_strategy.manual / total) * 100)

  return {
    sector_id: mapping.sector_id,
    schema_version: mapping.schema_version,
    total_fields: total,
    by_strategy,
    by_priority,
    auto_fill_percentage,
    manual_percentage,
  }
}

/** Devuelve los campos del mapping que coincidan con una estrategia dada.
 *  Útil para construir wizards (e.g. listar todos los campos 'extended'
 *  para generar custom fields en Holded). */
export function fieldsByStrategy(
  mapping: SectorErpMapping,
  strategy: ErpMappingStrategy,
): ErpMappingEntry[] {
  return Object.values(mapping.entries).filter((e) => e.strategy === strategy)
}

/** Devuelve los campos `extended` que requieren creación de custom field en
 *  el ERP indicado. */
export function customFieldsForProvider(
  mapping: SectorErpMapping,
  provider: 'holded' | 'odoo' | 'sage' | 'sap',
): ErpMappingEntry[] {
  return Object.values(mapping.entries).filter((e) => {
    if (e.strategy !== 'extended') return false
    if (provider === 'holded' && e.holded?.custom) return true
    if (provider === 'odoo' && e.odoo?.custom) return true
    if (provider === 'sage' && e.sage?.notes) return true
    if (provider === 'sap' && e.sap?.z_field) return true
    return false
  })
}

/** Devuelve los tipos de documento usados por IA extraction en este sector.
 *  Útil para auditar qué prompts versionados son necesarios. */
export function documentTypesForAiExtraction(mapping: SectorErpMapping): string[] {
  const types = new Set<string>()
  for (const e of Object.values(mapping.entries)) {
    if (e.strategy === 'ai_extraction' && e.ai?.document_type) {
      types.add(e.ai.document_type)
    }
  }
  return Array.from(types).sort()
}

/** Estima el coste mensual de IA extraction para un volumen de
 *  documentos/Actor/mes dado. */
export function estimateMonthlyAiCostUsd(
  mapping: SectorErpMapping,
  actorsCount: number,
  docsPerActorPerMonth: number,
): number {
  let totalCost = 0
  const distinctDocTypes = new Set<string>()

  for (const e of Object.values(mapping.entries)) {
    if (e.strategy === 'ai_extraction' && e.ai) {
      // Solo contamos UNA extracción por tipo de documento por producto
      // (el mismo PDF rellena múltiples campos)
      if (!distinctDocTypes.has(e.ai.document_type)) {
        distinctDocTypes.add(e.ai.document_type)
        const costPer = e.ai.cost_per_extraction_usd_estimated ?? 0.01
        totalCost += costPer * actorsCount * docsPerActorPerMonth
      }
    }
  }

  return Math.round(totalCost * 100) / 100
}
