// Schema sectorial MEDIOAMBIENTE ("Agua y medioambiente") · Fase 6 bloque sectorial 13.
//
// Cubre el ciclo del agua, la gestión de residuos y reciclaje, la descontaminación
// y los servicios ambientales (consultoría, auditoría, EIA, licencias). Sector con
// fuerte componente de servicio + un componente de "producto" (la materia prima
// secundaria recuperada / fin de condición de residuo).
//
// 4 sub-categorías (tipo de ficha que un Actor del sector MEDIOAMBIENTE publica):
//
// 1. ServicioAmbientalProduct · servicio ambiental ofertado (tratamiento de agua,
//    depuración, descontaminación/remediación, consultoría, auditoría, EIA,
//    gestión de licencias ambientales).
//
// 2. GestionResiduoProduct · operación de gestión de un residuo (recogida,
//    transporte, almacenamiento, tratamiento, valorización, reciclaje,
//    eliminación) con su código LER, clase y trazabilidad.
//
// 3. MaterialRecuperadoProduct · materia prima secundaria recuperada ofertada como
//    PRODUCTO (fin de condición de residuo · Art. 6 Dir. 2008/98/CE).
//
// 4. NecesidadAmbientalProduct · una empresa/administración busca un servicio
//    ambiental o de gestión de residuos.
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-06-01 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
// Cada norma citada lleva su identificador oficial + URL trazable. NO sustituye
// dictamen experto (CLAUDE.md §1).
//
//   UE — EUR-Lex:
//   - Dir. 2008/98/CE (marco de residuos · jerarquía, autorización Art. 23,
//     fin de condición de residuo Art. 6, residuos peligrosos Art. 17-20) ·
//     CELEX 32008L0098 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008L0098
//   - Decisión 2014/955/UE (Lista Europea de Residuos · códigos LER) ·
//     CELEX 32014D0955 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014D0955
//   - Reglamento (CE) 1013/2006 (traslados de residuos · notificación y
//     consentimiento previos) · CELEX 32006R1013 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006R1013
//   - Dir. 2000/60/CE (marco del agua) · CELEX 32000L0060 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32000L0060
//   - Dir. 2010/75/UE (emisiones industriales · IED · autorización ambiental
//     integrada) · CELEX 32010L0075 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32010L0075
//   - Dir. 2011/92/UE (evaluación de impacto ambiental · EIA · codificada) ·
//     CELEX 32011L0092 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0092
//   - Dir. 2004/35/CE (responsabilidad medioambiental) · CELEX 32004L0035 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32004L0035
//
//   ES — BOE:
//   - Ley 7/2022 (residuos y suelos contaminados para una economía circular ·
//     autorización de gestores Art. 33, archivo cronológico, traslados) ·
//     BOE-A-2022-5809 · https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809
//   - RDL 1/2001 (Texto Refundido de la Ley de Aguas · concesiones y autorización
//     de vertido) · BOE-A-2001-14276 · https://www.boe.es/buscar/act.php?id=BOE-A-2001-14276
//   - Ley 26/2007 (responsabilidad medioambiental · garantía financiera) ·
//     BOE-A-2007-18475 · https://www.boe.es/buscar/act.php?id=BOE-A-2007-18475
//   - RD 97/2014 (operaciones de transporte de mercancías peligrosas por carretera
//     en territorio español · aplica el ADR) · BOE-A-2014-2110 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-2014-2110
//
//   Internacional (no EUR-Lex · subject_to_expert): ADR (acuerdo europeo sobre
//   transporte internacional de mercancías peligrosas por carretera · UNECE) para
//   el transporte de residuos peligrosos · responde el transitario certificado.
//
// schema_status: 'draft' (pendiente validación experta: ingeniero ambiental
// colegiado · gestor de residuos autorizado · confederación hidrográfica /
// administración del agua · auditor ambiental · abogado ambiental).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de servicio ambiental (no residuos). */
export type TipoServicioAmbiental =
  | 'potabilizacion_agua'               // tratamiento de agua para consumo
  | 'depuracion_aguas_residuales'       // EDAR
  | 'operacion_redes_saneamiento'       // distribución / alcantarillado
  | 'descontaminacion_suelos'           // remediación de suelos
  | 'remediacion_aguas'                 // remediación de aguas subterráneas/superficiales
  | 'consultoria_ambiental'             // asesoría general
  | 'auditoria_ambiental'               // auditoría / EMAS
  | 'evaluacion_impacto_ambiental'      // EIA (Dir. 2011/92/UE)
  | 'gestion_licencias_ambientales'     // tramitación de autorizaciones

/** Operación de gestión de residuos. */
export type TipoGestionResiduo =
  | 'recogida'
  | 'transporte'
  | 'almacenamiento'
  | 'tratamiento'
  | 'valorizacion'                      // recuperación material/energética
  | 'reciclaje'
  | 'eliminacion_vertedero'
  | 'incineracion'

/** Clase de residuo (determina obligaciones reforzadas). */
export type ClaseResiduo = 'no_peligroso' | 'peligroso' | 'inerte'

/** Tipo de materia prima secundaria recuperada. */
export type TipoMaterialRecuperado =
  | 'papel_carton'
  | 'plastico'
  | 'vidrio'
  | 'metal_ferrico'
  | 'metal_no_ferrico'
  | 'raee'                              // residuos de aparatos eléctricos y electrónicos
  | 'organico_compost'
  | 'arido_reciclado'                   // RCD
  | 'textil'
  | 'aceite_recuperado'
  | 'otro'

/** Tipo de autorización ambiental (instalación / actividad). */
export type TipoAutorizacionAmbiental =
  | 'autorizacion_ambiental_integrada'  // IED · Dir. 2010/75/UE
  | 'autorizacion_vertido'              // RDL 1/2001
  | 'concesion_aguas'                   // RDL 1/2001
  | 'licencia_actividad_clasificada'

// ============================================================================
// AUTORIZACIONES / ACREDITACIONES DEL ACTOR
// ============================================================================

/** Autorización de gestor/transportista de residuos (Ley 7/2022 Art. 33 ·
 *  Dir. 2008/98/CE Art. 23). Obligatoria para operar con residuos. */
export type AutorizacionGestorResiduos = {
  /** Nº de autorización / inscripción otorgado por la CCAA. */
  numero_autorizacion?: string
  /** Rol autorizado. */
  tipo: 'gestor_tratamiento' | 'transportista' | 'negociante' | 'agente' | 'productor'
  /** Administración competente (CCAA · órgano ambiental). */
  administracion_competente: string
  /** Clases de residuo que la autorización cubre. */
  clases_residuo_autorizadas: ClaseResiduo[]
  /** Códigos LER autorizados (opcional · listado oficial). */
  codigos_ler_autorizados?: string[]
  /** ¿Inscrito en el Registro de Producción y Gestión de Residuos? */
  inscrito_registro_produccion_gestion: boolean
  /** ¿Autorizado para residuos peligrosos? */
  autorizado_peligrosos: boolean
  /** URL al PDF de la resolución de autorización. */
  pdf_autorizacion?: string
  /** ¿Verificado por 1503 contra el registro oficial? */
  verificado_por_1503: boolean
}

/** Autorización ambiental de la instalación/actividad (IED · vertido · aguas). */
export type AutorizacionInstalacionAmbiental = {
  tipo: TipoAutorizacionAmbiental
  numero?: string
  administracion_competente: string
  /** ¿Vigente? */
  vigente: boolean
  pdf_autorizacion?: string
}

/** Propiedades de peligrosidad de un residuo peligroso (HP1-HP15 · Anexo III
 *  Dir. 2008/98/CE). */
export type PropiedadesPeligrosidadResiduo = {
  /** Códigos HP aplicables (p.ej. 'HP4' irritante · 'HP7' carcinógeno). */
  codigos_hp: string[]
  /** ¿Dispone de documento de identificación del residuo peligroso? */
  tiene_documento_identificacion: boolean
  /** ¿Transporte conforme a ADR (mercancías peligrosas por carretera)? */
  transporte_adr_conforme?: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO AMBIENTAL
// ============================================================================

/** Ficha de un servicio ambiental ofertado (agua, descontaminación, consultoría).
 *
 *  Caso de uso: una EDAR oferta el servicio de operación y mantenimiento de la
 *  depuradora de un municipio · o una consultora oferta la tramitación de una
 *  autorización ambiental integrada. */
export type ServicioAmbientalProduct = UniversalProduct & {
  sub_categoria: 'servicio_ambiental'

  tipo_servicio: TipoServicioAmbiental
  /** Denominación del servicio × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- AGUA (si aplica) --------------------
  /** Si es servicio de agua/vertido: autorización/concesión correspondiente. */
  autorizacion_agua?: AutorizacionInstalacionAmbiental

  // -------------------- INSTALACIÓN INDUSTRIAL (si aplica) --------------------
  /** ¿La actividad/instalación está en el alcance de la Directiva de Emisiones
   *  Industriales (IED · Anexo I Dir. 2010/75/UE)? */
  en_alcance_ied?: boolean
  /** Autorización ambiental integrada (si en_alcance_ied). */
  autorizacion_ambiental_integrada?: AutorizacionInstalacionAmbiental

  // -------------------- EIA / PROYECTO (si aplica) --------------------
  /** ¿El servicio se asocia a un proyecto sujeto a evaluación de impacto
   *  ambiental (Anexo I/II Dir. 2011/92/UE)? */
  proyecto_en_alcance_eia?: boolean
  /** ¿Aporta declaración/estudio de impacto ambiental? */
  tiene_estudio_impacto_ambiental?: boolean

  // -------------------- RESPONSABILIDAD AMBIENTAL --------------------
  /** ¿La actividad está en el Anexo III de la Dir. 2004/35/CE (responsabilidad
   *  medioambiental · garantía financiera obligatoria)? */
  en_alcance_responsabilidad_ambiental?: boolean
  /** ¿Acredita garantía financiera de responsabilidad medioambiental? */
  tiene_garantia_financiera_ambiental?: boolean

  // -------------------- ACREDITACIÓN PROFESIONAL --------------------
  /** Colegiación / habilitación del técnico responsable (ingeniero ambiental). */
  tecnico_responsable_colegiado?: boolean

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · GESTIÓN DE RESIDUO
// ============================================================================

/** Ficha de una operación de gestión de un residuo.
 *
 *  Caso de uso: una gestora autorizada oferta la recogida y tratamiento de
 *  residuos peligrosos industriales (LER 13 02 05* aceites minerales) · con
 *  manifiesto digital y trazabilidad on-chain del residuo. */
export type GestionResiduoProduct = UniversalProduct & {
  sub_categoria: 'gestion_residuo'

  /** Operaciones de gestión que se ofertan. */
  operaciones: TipoGestionResiduo[]
  /** Descripción del residuo y del servicio × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- IDENTIFICACIÓN DEL RESIDUO --------------------
  /** Código LER (Lista Europea de Residuos · Decisión 2014/955/UE · 6 dígitos ·
   *  el asterisco final marca residuo peligroso, p.ej. "13 02 05*"). */
  codigo_ler: string
  /** Clase de residuo. */
  clase_residuo: ClaseResiduo
  /** Si peligroso: propiedades de peligrosidad (HP) + documento de identificación. */
  peligrosidad?: PropiedadesPeligrosidadResiduo

  // -------------------- AUTORIZACIÓN DEL OPERADOR --------------------
  /** Autorización de gestor/transportista de residuos. */
  autorizacion_gestor: AutorizacionGestorResiduos

  // -------------------- TRASLADO --------------------
  /** País de origen del residuo (ISO alpha-2). */
  pais_origen?: ISOCountryCode
  /** País de destino del tratamiento (ISO alpha-2). */
  pais_destino?: ISOCountryCode
  /** Si traslado transfronterizo: nº de notificación (Reg. 1013/2006). */
  numero_notificacion_traslado?: string

  // -------------------- TRAZABILIDAD --------------------
  /** ¿Emite documento de identificación / manifiesto del residuo? */
  emite_documento_identificacion: boolean
  /** ¿Trazabilidad on-chain del residuo (hash del manifiesto · PII off-chain)? */
  trazabilidad_onchain?: boolean

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · MATERIAL RECUPERADO (materia prima secundaria)
// ============================================================================

/** Ficha de materia prima secundaria recuperada, ofertada como PRODUCTO.
 *
 *  Caso de uso: una recicladora oferta granza de PET reciclado con certificado
 *  de origen y declaración de fin de condición de residuo (Art. 6 Dir. 2008/98/CE),
 *  para que una industria la compre como materia prima, no como residuo. */
export type MaterialRecuperadoProduct = UniversalProduct & {
  sub_categoria: 'material_recuperado'

  tipo_material: TipoMaterialRecuperado
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Cantidad disponible. */
  cantidad?: number
  /** Unidad (kg · t · m³). */
  unidad?: string

  // -------------------- FIN DE CONDICIÓN DE RESIDUO --------------------
  /** ¿Se comercializa como PRODUCTO (fin de condición de residuo) vs como residuo? */
  declara_fin_condicion_residuo: boolean
  /** ¿Cumple los criterios de fin de condición de residuo aplicables (Art. 6
   *  Dir. 2008/98/CE · reglamentos UE por flujo · o resolución caso a caso)? */
  cumple_criterios_fin_residuo?: boolean
  /** Código LER del residuo de origen (si procede de gestión). */
  codigo_ler_origen?: string
  /** ¿Aporta certificado de origen / declaración de conformidad? */
  tiene_certificado_origen: boolean

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '02_intermediado' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 4 · NECESIDAD AMBIENTAL (cliente busca)
// ============================================================================

/** Ficha publicada por una empresa/administración que busca un servicio ambiental
 *  o de gestión de residuos. */
export type NecesidadAmbientalProduct = UniversalProduct & {
  sub_categoria: 'necesidad_ambiental'

  /** Descripción de la necesidad × idiomas. */
  descripcion_necesidad: LocalizedLabel
  /** ¿Necesita gestión de residuos? */
  busca_gestion_residuo: boolean
  /** Si busca gestión de residuo: código LER y clase (si se conocen). */
  codigo_ler?: string
  clase_residuo?: ClaseResiduo
  /** Tipos de servicio ambiental aceptables (si busca servicio). */
  tipos_servicio_aceptables?: TipoServicioAmbiental[]
  /** ¿Exige operador autorizado / técnico colegiado? */
  exige_operador_autorizado: boolean

  // -------------------- PRESUPUESTO Y TIMING --------------------
  presupuesto_max?: number
  moneda_presupuesto: string
  fecha_objetivo?: string               // ISO date
  plazo_respuesta_max_dias: number

  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector MEDIOAMBIENTE
// ============================================================================

export type MedioambienteProduct =
  | ServicioAmbientalProduct
  | GestionResiduoProduct
  | MaterialRecuperadoProduct
  | NecesidadAmbientalProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const MEDIOAMBIENTE_SCHEMA_VERSION = 'medioambiente@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta revisión por:
 *   - Ingeniero ambiental colegiado
 *   - Gestor de residuos autorizado (operador real)
 *   - Confederación hidrográfica / administración del agua (concesiones y vertidos)
 *   - Auditor ambiental (EMAS / ISO 14001)
 *   - Abogado ambiental (Ley 7/2022 · responsabilidad medioambiental Ley 26/2007)
 */
export const MEDIOAMBIENTE_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioAmbiental(p: MedioambienteProduct): p is ServicioAmbientalProduct {
  return p.sub_categoria === 'servicio_ambiental'
}

export function isGestionResiduo(p: MedioambienteProduct): p is GestionResiduoProduct {
  return p.sub_categoria === 'gestion_residuo'
}

export function isMaterialRecuperado(p: MedioambienteProduct): p is MaterialRecuperadoProduct {
  return p.sub_categoria === 'material_recuperado'
}

export function isNecesidadAmbiental(p: MedioambienteProduct): p is NecesidadAmbientalProduct {
  return p.sub_categoria === 'necesidad_ambiental'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿La ficha implica operar con residuos requiriendo autorización de gestor?
 *  (recogida, transporte, almacenamiento, tratamiento, valorización, reciclaje,
 *  eliminación · Ley 7/2022 Art. 33 · Dir. 2008/98/CE Art. 23). */
export function requiereAutorizacionGestorResiduos(p: MedioambienteProduct): boolean {
  if (!isGestionResiduo(p)) return false
  const REQUIEREN: TipoGestionResiduo[] = [
    'recogida', 'transporte', 'almacenamiento', 'tratamiento',
    'valorizacion', 'reciclaje', 'eliminacion_vertedero', 'incineracion',
  ]
  return p.operaciones.some((op) => REQUIEREN.includes(op))
}

/** ¿Es gestión de un residuo PELIGROSO (obligaciones reforzadas · HP + ADR)? */
export function esResiduoPeligroso(p: MedioambienteProduct): boolean {
  return isGestionResiduo(p) && p.clase_residuo === 'peligroso'
}

/** ¿El residuo peligroso se transporta (ADR · documento de identificación)? */
export function transportaResiduoPeligroso(p: MedioambienteProduct): boolean {
  return esResiduoPeligroso(p) && isGestionResiduo(p) && p.operaciones.includes('transporte')
}

/** ¿Es un traslado transfronterizo de residuos (Reg. 1013/2006)? */
export function esTrasladoTransfronterizoResiduo(p: MedioambienteProduct): boolean {
  if (!isGestionResiduo(p)) return false
  return !!p.pais_origen && !!p.pais_destino && p.pais_origen !== p.pais_destino
}

/** ¿Material recuperado que se comercializa como PRODUCTO (fin de condición de
 *  residuo · Art. 6 Dir. 2008/98/CE)? */
export function declaraFinDeResiduo(p: MedioambienteProduct): boolean {
  return isMaterialRecuperado(p) && p.declara_fin_condicion_residuo === true
}

/** ¿Servicio de agua/vertido que requiere concesión o autorización (RDL 1/2001 ·
 *  Dir. 2000/60/CE)? */
export function requiereAutorizacionAgua(p: MedioambienteProduct): boolean {
  if (!isServicioAmbiental(p)) return false
  return p.tipo_servicio === 'depuracion_aguas_residuales'
    || p.tipo_servicio === 'operacion_redes_saneamiento'
    || p.tipo_servicio === 'remediacion_aguas'
    || p.tipo_servicio === 'potabilizacion_agua'
}

/** ¿Instalación en alcance de la Directiva de Emisiones Industriales (IED ·
 *  Dir. 2010/75/UE · autorización ambiental integrada)? */
export function requiereAutorizacionAmbientalIntegrada(p: MedioambienteProduct): boolean {
  return isServicioAmbiental(p) && p.en_alcance_ied === true
}

/** ¿Proyecto sujeto a evaluación de impacto ambiental (Dir. 2011/92/UE)? */
export function enAlcanceEIA(p: MedioambienteProduct): boolean {
  if (!isServicioAmbiental(p)) return false
  return p.proyecto_en_alcance_eia === true
    || p.tipo_servicio === 'evaluacion_impacto_ambiental'
}

/** ¿Actividad en el Anexo III de la Dir. 2004/35/CE (responsabilidad
 *  medioambiental · garantía financiera · Ley 26/2007)? */
export function requiereGarantiaResponsabilidadAmbiental(p: MedioambienteProduct): boolean {
  return isServicioAmbiental(p) && p.en_alcance_responsabilidad_ambiental === true
}
