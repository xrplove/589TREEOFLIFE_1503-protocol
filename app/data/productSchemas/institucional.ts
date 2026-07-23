// Schema sectorial INSTITUCIONAL ("Administración pública") · Fase 6 bloque 15.
//
// Cubre la contratación pública (suministros, servicios, obras, tecnología,
// seguridad, servicios sociales, movilidad) entre las administraciones (central,
// autonómica, local, organismos) y sus proveedores adjudicatarios.
//
// 4 sub-categorías (tipo de ficha que un Actor del sector INSTITUCIONAL publica):
//
// 1. LicitacionPublicaProduct · una licitación/contrato publicado por una
//    administración (procedimiento, CPV, valor estimado, criterios).
//
// 2. OfertaProveedorPublicoProduct · catálogo/oferta de un proveedor candidato a
//    contratación pública (solvencia, declaración de no prohibición, factura-e).
//
// 3. ServicioAsistenciaTecnicaProduct · asistencia técnica/consultoría al sector
//    público (consultores, peritos, asesores) con facturación por hito.
//
// 4. NecesidadInstitucionalProduct · una administración publica una necesidad.
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-06-01 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
// Cada norma citada lleva su identificador oficial + URL trazable. NO sustituye
// dictamen experto (CLAUDE.md §1).
//
//   UE — EUR-Lex:
//   - Dir. 2014/24/UE (contratación pública · sector clásico) · CELEX 32014L0024 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0024
//   - Dir. 2014/55/UE (factura electrónica en la contratación pública) ·
//     CELEX 32014L0055 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0055
//   - Dir. (UE) 2016/2102 (accesibilidad de sitios web y apps del sector público) ·
//     CELEX 32016L2102 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016L2102
//   - Reglamento (UE) 910/2014 (eIDAS · identificación electrónica y servicios de
//     confianza) · CELEX 32014R0910 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014R0910
//   (subject_to_expert · no cableadas: Dir. 2014/23/UE concesiones · Dir. 2014/25/UE
//    sectores especiales · según el tipo de contrato.)
//
//   ES — BOE:
//   - Ley 9/2017 (Contratos del Sector Público · LCSP · transpone 2014/23 y
//     2014/24 · Art. 71 prohibiciones de contratar · Art. 74+ solvencia) ·
//     BOE-A-2017-12902 · https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902
//   - Ley 25/2013 (impulso de la factura electrónica · registro contable · FACe) ·
//     BOE-A-2013-13722 · https://www.boe.es/buscar/act.php?id=BOE-A-2013-13722
//
// schema_status: 'draft' (pendiente validación experta: técnico de contratación
// pública · abogado administrativista · órgano de contratación · interventor).

import type {
  UniversalProduct,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de procedimiento de contratación (LCSP · Dir. 2014/24/UE). */
export type TipoProcedimientoContratacion =
  | 'abierto'
  | 'abierto_simplificado'
  | 'restringido'
  | 'licitacion_con_negociacion'
  | 'dialogo_competitivo'
  | 'contrato_menor'
  | 'acuerdo_marco'

/** Tipo de objeto del contrato público. */
export type TipoObjetoContrato =
  | 'suministro'
  | 'servicio'
  | 'obra'
  | 'tecnologia_software'
  | 'tecnologia_hardware'
  | 'concesion_servicio'                // subject_to_expert (Dir. 2014/23/UE)
  | 'servicio_social'

/** Tipo de asistencia técnica al sector público. */
export type TipoAsistenciaTecnica =
  | 'consultoria'
  | 'asistencia_juridica'
  | 'peritaje'
  | 'direccion_obra'
  | 'redaccion_proyecto'

// ============================================================================
// BLOQUES REUTILIZABLES
// ============================================================================

/** Solvencia del licitador (LCSP Art. 74 y ss.). */
export type SolvenciaLicitador = {
  /** ¿Acredita solvencia económica y financiera? */
  solvencia_economica: boolean
  /** ¿Acredita solvencia técnica o profesional? */
  solvencia_tecnica: boolean
  /** Clasificación empresarial (si exigida · grupo/subgrupo/categoría). */
  clasificacion_empresarial?: string
}

/** Aptitud para contratar con el sector público (LCSP Art. 71 prohibiciones). */
export type AptitudContratar = {
  /** ¿Declara NO estar incurso en prohibición de contratar (Art. 71 LCSP)? */
  declara_no_prohibicion_contratar: boolean
  /** ¿Al corriente de obligaciones tributarias y con la Seguridad Social? */
  al_corriente_obligaciones?: boolean
  /** ¿Inscrito en el ROLECE (Registro Oficial de Licitadores)? */
  inscrito_rolece?: boolean
}

/** Capacidades de administración electrónica del proveedor. */
export type CapacidadesEAdmin = {
  /** ¿Soporta factura electrónica (FACe · formato Facturae/EN 16931)? */
  soporta_factura_electronica: boolean
  /** ¿Usa firma/identificación electrónica cualificada (eIDAS)? */
  usa_firma_electronica_eidas?: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · LICITACIÓN PÚBLICA
// ============================================================================

/** Ficha de una licitación/contrato publicado por una administración.
 *
 *  Caso de uso: un ayuntamiento publica un contrato de servicios de limpieza ·
 *  procedimiento abierto · CPV 90910000 · valor estimado 120.000 € · criterio
 *  mejor relación calidad-precio · con expediente trazable. */
export type LicitacionPublicaProduct = UniversalProduct & {
  sub_categoria: 'licitacion_publica'

  /** Objeto del contrato. */
  tipo_objeto: TipoObjetoContrato
  /** Denominación del contrato × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción del objeto × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- DATOS DEL PROCEDIMIENTO (LCSP) --------------------
  tipo_procedimiento: TipoProcedimientoContratacion
  /** Código CPV (Vocabulario Común de Contratos Públicos). */
  codigo_cpv?: string
  /** Valor estimado del contrato (sin IVA). */
  valor_estimado?: number
  moneda: string
  /** Criterios de adjudicación (texto/resumen) × idiomas. */
  criterios_adjudicacion?: LocalizedLabel
  /** ¿Publicado en la Plataforma de Contratación del Sector Público / DOUE? */
  publicado_plataforma_oficial?: boolean

  // -------------------- TECNOLOGÍA (si aplica) --------------------
  /** Si el objeto es tecnología/web pública: ¿exige conformidad de accesibilidad
   *  (Dir. 2016/2102 · EN 301 549)? */
  exige_accesibilidad_web?: boolean

  // -------------------- E-ADMIN --------------------
  /** ¿Exige factura electrónica al adjudicatario (Ley 25/2013)? */
  exige_factura_electronica?: boolean

  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · OFERTA DE PROVEEDOR PÚBLICO
// ============================================================================

/** Ficha de un proveedor candidato/adjudicatario a contratación pública.
 *
 *  Caso de uso: una pyme publica su catálogo y solvencia para concursos y
 *  contratos menores · declara no estar incursa en prohibición de contratar ·
 *  soporta factura electrónica (FACe). */
export type OfertaProveedorPublicoProduct = UniversalProduct & {
  sub_categoria: 'oferta_proveedor_publico'

  /** Objeto que oferta. */
  tipo_objeto: TipoObjetoContrato
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- APTITUD Y SOLVENCIA (LCSP) --------------------
  aptitud: AptitudContratar
  solvencia: SolvenciaLicitador

  // -------------------- E-ADMIN --------------------
  capacidades_eadmin: CapacidadesEAdmin

  // -------------------- TECNOLOGÍA (si aplica) --------------------
  /** Si oferta tecnología/web para el sector público: ¿declara conformidad de
   *  accesibilidad (Dir. 2016/2102 · EN 301 549)? */
  declara_accesibilidad_web?: boolean

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO DE ASISTENCIA TÉCNICA
// ============================================================================

/** Ficha de asistencia técnica/consultoría al sector público.
 *
 *  Caso de uso: una consultora oferta asistencia técnica para la redacción de un
 *  pliego · entregables y facturación por hito · soporta factura electrónica. */
export type ServicioAsistenciaTecnicaProduct = UniversalProduct & {
  sub_categoria: 'servicio_asistencia_tecnica'

  tipo_asistencia: TipoAsistenciaTecnica
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel
  /** Aptitud para contratar (LCSP Art. 71). */
  aptitud: AptitudContratar
  /** Capacidades de administración electrónica. */
  capacidades_eadmin: CapacidadesEAdmin
  /** ¿Facturación por hito? */
  facturacion_por_hito?: boolean

  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 4 · NECESIDAD INSTITUCIONAL
// ============================================================================

/** Ficha publicada por una administración con una necesidad (previa a licitación
 *  formal · consulta preliminar de mercado, etc.). */
export type NecesidadInstitucionalProduct = UniversalProduct & {
  sub_categoria: 'necesidad_institucional'

  /** Descripción de la necesidad × idiomas. */
  descripcion_necesidad: LocalizedLabel
  /** Tipo de objeto buscado. */
  tipo_objeto: TipoObjetoContrato
  /** Código CPV orientativo. */
  codigo_cpv?: string
  /** Presupuesto orientativo. */
  presupuesto_orientativo?: number
  moneda_presupuesto: string
  fecha_objetivo?: string               // ISO date
  plazo_respuesta_max_dias: number

  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector INSTITUCIONAL
// ============================================================================

export type InstitucionalProduct =
  | LicitacionPublicaProduct
  | OfertaProveedorPublicoProduct
  | ServicioAsistenciaTecnicaProduct
  | NecesidadInstitucionalProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const INSTITUCIONAL_SCHEMA_VERSION = 'institucional@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta revisión por:
 *   - Técnico de contratación pública / órgano de contratación
 *   - Abogado administrativista (LCSP)
 *   - Interventor (factura electrónica · registro contable)
 *   - Auditoría de accesibilidad digital (Dir. 2016/2102 + EN 301 549)
 */
export const INSTITUCIONAL_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isLicitacionPublica(p: InstitucionalProduct): p is LicitacionPublicaProduct {
  return p.sub_categoria === 'licitacion_publica'
}

export function isOfertaProveedorPublico(p: InstitucionalProduct): p is OfertaProveedorPublicoProduct {
  return p.sub_categoria === 'oferta_proveedor_publico'
}

export function isServicioAsistenciaTecnica(p: InstitucionalProduct): p is ServicioAsistenciaTecnicaProduct {
  return p.sub_categoria === 'servicio_asistencia_tecnica'
}

export function isNecesidadInstitucional(p: InstitucionalProduct): p is NecesidadInstitucionalProduct {
  return p.sub_categoria === 'necesidad_institucional'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿Es una licitación pública que requiere datos mínimos del procedimiento
 *  (LCSP · Dir. 2014/24/UE)? */
export function requiereDatosLicitacion(p: InstitucionalProduct): boolean {
  return isLicitacionPublica(p)
}

/** ¿Es una oferta de proveedor que concurre a contratación pública (debe declarar
 *  aptitud y solvencia · LCSP Art. 71 y 74)? */
export function concurreContratacionPublica(p: InstitucionalProduct): boolean {
  return isOfertaProveedorPublico(p) || isServicioAsistenciaTecnica(p)
}

/** ¿Factura a la Administración (obligación de factura electrónica · Ley 25/2013 ·
 *  Dir. 2014/55/UE)? */
export function facturaAdministracion(p: InstitucionalProduct): boolean {
  return isOfertaProveedorPublico(p) || isServicioAsistenciaTecnica(p)
}

/** ¿Oferta/contrato de tecnología o web para el sector público (accesibilidad ·
 *  Dir. 2016/2102)? */
export function esTecnologiaPublicaWeb(p: InstitucionalProduct): boolean {
  if (isLicitacionPublica(p) || isOfertaProveedorPublico(p)) {
    return p.tipo_objeto === 'tecnologia_software' || p.tipo_objeto === 'tecnologia_hardware'
  }
  return false
}
