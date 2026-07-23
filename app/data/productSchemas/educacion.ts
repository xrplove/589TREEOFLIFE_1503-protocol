// Schema sectorial EDUCACIÓN · Fase 6 bloque sectorial 12 (ISIC P85).
//
// El sector educación cubre formación reglada y no reglada: universidades,
// formación profesional (FP), academias, escuelas de negocio, bootcamps,
// e-learning, formación corporativa, certificaciones profesionales y
// educación continua. Transversal: cualquier sector 1503 puede demandar
// formación (upskilling de la plantilla, certificación de instaladores, etc.).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector EDUCACIÓN publica):
//
// 1. ServicioFormativoProduct · curso / programa formativo ofertado (máster,
//    grado, FP, microcredencial, bootcamp, curso e-learning, formación in
//    company, certificación profesional).
//
// 2. NecesidadFormativaProduct · una empresa o particular busca formación
//    (plan de upskilling, certificación obligatoria de plantilla, formación
//    bonificada FUNDAE, reciclaje profesional).
//
// 3. AcreditacionTituloProduct · emisión / reconocimiento de una titulación
//    o credencial (centro acreditado que expide título oficial, homologación
//    de título extranjero, reconocimiento de cualificación profesional).
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-05-31 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
// Cada norma citada en este schema y en su validador de Capa 2 lleva su
// identificador oficial + URL trazable. NO sustituye dictamen experto (CLAUDE.md §1).
//
//   UE — EUR-Lex:
//   - Dir. 2005/36/CE (reconocimiento de cualificaciones profesionales) ·
//     CELEX 32005L0036 · https://eur-lex.europa.eu/eli/dir/2005/36/oj
//   - Dir. 2013/55/UE (de 20-nov-2013 · modifica 2005/36 · crea la Tarjeta
//     Profesional Europea EPC vía IMI) · CELEX 32013L0055 ·
//     https://eur-lex.europa.eu/eli/dir/2013/55/oj
//   - Dir. 2011/83/UE (derechos de los consumidores · contratos a distancia) ·
//     CELEX 32011L0083 · https://eur-lex.europa.eu/eli/dir/2011/83/oj
//   - Dir. (UE) 2019/882 (European Accessibility Act) · aplicable desde
//     28-jun-2025 · CELEX 32019L0882 · https://eur-lex.europa.eu/eli/dir/2019/882/oj
//   - Reglamento (UE) 2016/679 (RGPD) Art. 8 (consentimiento del menor) ·
//     CELEX 32016R0679 · https://eur-lex.europa.eu/eli/reg/2016/679/oj
//   - Recomendación del Consejo de 16-jun-2022 sobre microcredenciales ·
//     2022/C 243/02 (DOUE C 243, 27.6.2022) · CELEX 32022H0627(02) ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022H0627(02)
//
//   ES — BOE:
//   - LO 8/1985 (LODE) Art. 23 (autorización administrativa de centros docentes
//     privados) · BOE-A-1985-12978 · https://www.boe.es/buscar/act.php?id=BOE-A-1985-12978
//   - LO 3/2020 (LOMLOE · modifica la LOE LO 2/2006) · BOE-A-2020-17264 ·
//     https://www.boe.es/eli/es/lo/2020/12/29/3
//   - LO 3/2022 (ordenación e integración de la FP) · BOE-A-2022-5139 +
//     RD 659/2023 (desarrolla la ordenación del Sistema de FP) · BOE-A-2023-16889
//   - RD 822/2021 (organización de las enseñanzas universitarias y procedimiento
//     de aseguramiento de su calidad · ANECA + RUCT) · BOE-A-2021-15781 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-2021-15781
//   - Ley 30/2015 (Sistema de FP para el empleo · FUNDAE) · BOE-A-2015-9734
//   - RDL 1/2007 (TRLGDCU) Art. 102 (derecho de desistimiento · 14 días
//     naturales en contratos a distancia) · BOE-A-2007-20555
//   - LO 3/2018 (LOPDGDD) Art. 7 (consentimiento de menores · ≥14 años) ·
//     BOE-A-2018-16673 · https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
//   - Ley 37/1992 (IVA) Art. 20.Uno.9º (exención de la enseñanza) · BOE-A-1992-28740
//
//   Marcos de referencia (no normas vinculantes per se): EQF/MECU (EQF) ·
//   EEES/Bolonia + sistema ECTS · MCER (idiomas) · EN 301 549 (norma técnica
//   de accesibilidad referida por la EAA) · CNCP/INCUAL.
//
// schema_status: 'draft' (pendiente validación experta: ANECA · INCUAL/SEPE ·
// consejería de educación CCAA · DPO especializado en datos de menores ·
// auditoría de accesibilidad EN 301 549).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Nivel del Marco Europeo de Cualificaciones (EQF / MECU 1-8). */
export type NivelEQF = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** Tipo de enseñanza / programa formativo. */
export type TipoEnsenanza =
  | 'universitaria_grado'               // EQF 6 · 180-240 ECTS
  | 'universitaria_master'              // EQF 7 · 60-120 ECTS
  | 'universitaria_doctorado'           // EQF 8
  | 'titulo_propio_universitario'       // NO oficial · expedido por la universidad
  | 'fp_grado_basico'                   // EQF 3
  | 'fp_grado_medio'                    // EQF 4
  | 'fp_grado_superior'                 // EQF 5
  | 'fp_curso_especializacion'          // "máster FP"
  | 'certificado_profesionalidad'       // SEPE · acredita cualificación CNCP
  | 'microcredencial'                   // Rec. UE 2022/C 243/02
  | 'bootcamp_intensivo'
  | 'curso_no_reglado'                  // academia · formación continua
  | 'formacion_in_company'              // formación corporativa a medida
  | 'certificacion_profesional_privada' // vendor cert (e.g. PMP · AWS · Cisco)
  | 'idiomas'                           // MCER A1-C2
  | 'educacion_infantil_primaria'
  | 'educacion_secundaria_bachillerato'

/** Modalidad de impartición. */
export type ModalidadFormativa =
  | 'presencial'
  | 'online_sincrono'                   // aula virtual en directo
  | 'online_asincrono'                  // e-learning autoritmo
  | 'semipresencial_blended'
  | 'a_distancia_tutorizada'

/** Modelo de tarifa del servicio formativo. */
export type ModeloTarifaFormativa =
  | 'matricula_unica'
  | 'precio_por_credito_ects'
  | 'cuota_mensual'
  | 'pago_por_modulo'
  | 'bonificable_fundae'                // formación programada para el empleo
  | 'gratuito_subvencionado'            // financiado por fondos públicos/UE
  | 'isa_acuerdo_ingresos'              // Income Share Agreement (subject_to_expert)

/** Público objetivo del programa (filtra protección de datos de menores). */
export type PublicoObjetivo =
  | 'menores'                           // < 18 · protección reforzada RGPD Art. 8
  | 'adultos_particulares'
  | 'profesionales_b2b'
  | 'desempleados'
  | 'empresas'

/** Nivel del Marco Común Europeo de Referencia para idiomas. */
export type NivelMCER = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

// ============================================================================
// ACREDITACIONES DEL CENTRO / DOCENTE
// ============================================================================

/** Autorización administrativa del centro docente (enseñanza reglada). */
export type AutorizacionCentroDocente = {
  /** Código oficial de centro (asignado por la CCAA / Ministerio). */
  codigo_centro?: string
  /** Administración que autoriza (consejería de educación CCAA · Ministerio). */
  administracion_competente: string
  /** ¿Es centro de enseñanza reglada autorizado? */
  centro_reglado_autorizado: boolean
  /** Para universidad: inscripción en RUCT. */
  codigo_ruct?: string
  /** Para FP: ¿acreditado para impartir certificados de profesionalidad? */
  acreditado_certificados_profesionalidad?: boolean
  /** URL al PDF de la resolución de autorización. */
  pdf_autorizacion?: string
  /** ¿Verificado por 1503 contra el registro oficial? */
  verificado_por_1503: boolean
}

/** Verificación/acreditación de un título universitario oficial. */
export type AcreditacionTituloUniversitario = {
  /** ¿Título oficial (vs título propio)? */
  es_titulo_oficial: boolean
  /** Código RUCT del título. */
  codigo_ruct_titulo?: string
  /** Estado de la acreditación ANECA (o agencia autonómica). */
  estado_aneca?: 'verificado' | 'acreditado' | 'en_renovacion' | 'no_acreditado'
  /** Agencia evaluadora (ANECA · AQU · ACSUG · etc.). */
  agencia_evaluadora?: string
  /** Créditos ECTS del programa. */
  creditos_ects?: number
  /** Rama de conocimiento (EEES). */
  rama_conocimiento?: 'artes_humanidades' | 'ciencias' | 'ciencias_salud'
      | 'ciencias_sociales_juridicas' | 'ingenieria_arquitectura'
}

/** Reconocimiento de cualificación profesional (Dir. 2005/36/CE). */
export type ReconocimientoCualificacion = {
  /** ¿El programa habilita para una profesión regulada? */
  habilita_profesion_regulada: boolean
  /** Nombre de la profesión regulada (si aplica). */
  profesion_regulada?: string
  /** ¿Cubierto por el régimen de reconocimiento automático (Anexo V Dir.)? */
  reconocimiento_automatico_anexo_v?: boolean
  /** ¿Dispone de Tarjeta Profesional Europea (EPC) cuando aplica? */
  tiene_epc?: boolean
  /** Autoridad competente del reconocimiento en el país de destino. */
  autoridad_competente?: string
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO FORMATIVO
// ============================================================================

/** Ficha de un programa formativo ofertado por un centro, universidad,
 *  academia o formador.
 *
 *  Caso de uso: una escuela de negocio de Madrid publica un máster oficial en
 *  Dirección Financiera · EQF 7 · 60 ECTS · modalidad blended · 9.800 € ·
 *  acreditado ANECA · plazas 30 · idioma ES/EN. */
export type ServicioFormativoProduct = UniversalProduct & {
  sub_categoria: 'servicio_formativo'

  // -------------------- PROGRAMA --------------------
  /** Tipo de enseñanza. */
  tipo_ensenanza: TipoEnsenanza
  /** Nivel EQF/MECU (1-8) si aplica. */
  nivel_eqf?: NivelEQF
  /** Denominación oficial del programa × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción / temario resumido × idiomas. */
  descripcion: LocalizedLabel
  /** Área de conocimiento / familia profesional. */
  area_conocimiento: string
  /** ¿Conduce a un TÍTULO OFICIAL (vs título propio / certificado privado)? */
  titulo_oficial: boolean

  // -------------------- IMPARTICIÓN --------------------
  modalidad: ModalidadFormativa
  /** Duración en horas lectivas. */
  duracion_horas: number
  /** Créditos ECTS (si enseñanza universitaria). */
  creditos_ects?: number
  /** Idiomas de impartición. */
  idiomas: string[]                     // ISO 639-1
  /** Si idiomas: nivel MCER objetivo alcanzado al finalizar. */
  nivel_mcer_resultado?: NivelMCER
  /** Plazas ofertadas. */
  plazas?: number
  /** Fechas de inicio previstas (ISO date). */
  fechas_inicio?: string[]
  /** Público objetivo. */
  publico_objetivo: PublicoObjetivo[]
  /** Requisitos de acceso × idiomas. */
  requisitos_acceso?: LocalizedLabel

  // -------------------- ACREDITACIÓN --------------------
  /** Autorización del centro (obligatoria para enseñanza reglada). */
  centro?: AutorizacionCentroDocente
  /** Acreditación del título universitario (si oficial universitario). */
  acreditacion_universitaria?: AcreditacionTituloUniversitario
  /** Reconocimiento de cualificación profesional (si habilita profesión regulada). */
  reconocimiento_cualificacion?: ReconocimientoCualificacion
  /** ¿Microcredencial conforme a la Recomendación UE 2022/C 243/02? */
  es_microcredencial_ue?: boolean

  // -------------------- DIGITAL / ACCESIBILIDAD --------------------
  /** ¿Se imparte vía plataforma digital propia (LMS · campus virtual)? */
  usa_plataforma_digital: boolean
  /** URL de la plataforma/campus. */
  plataforma_url?: string
  /** ¿Aporta declaración de accesibilidad de la plataforma (EAA · EN 301 549)? */
  declaracion_accesibilidad_eaa?: boolean

  // -------------------- PROTECCIÓN DE DATOS (MENORES) --------------------
  /** Si publico_objetivo incluye menores: medidas RGPD Art. 8 + LOPDGDD Art. 7. */
  proteccion_datos_menores?: {
    /** ¿Recaba consentimiento parental para < edad legal? */
    consentimiento_parental: boolean
    /** Edad mínima de consentimiento propio aplicada (ES = 14). */
    edad_consentimiento_aplicada: number
    /** ¿Tiene DPO designado? */
    tiene_dpo: boolean
  }

  // -------------------- TARIFAS --------------------
  modelo_tarifa: ModeloTarifaFormativa
  /** Precio total del programa (sin IVA · educación reglada suele ir exenta). */
  precio_total?: number
  /** Precio por crédito ECTS (si aplica). */
  precio_por_ects?: number
  moneda: string
  /** ¿Exento de IVA? (enseñanza reglada · Art. 20.Uno.9º Ley 37/1992). */
  iva_exento: boolean
  /** ¿Bonificable por FUNDAE (formación programada para el empleo)? */
  bonificable_fundae: boolean

  // -------------------- CONTRATACIÓN A DISTANCIA (B2C) --------------------
  /** Si se vende a consumidores a distancia: derecho de desistimiento 14 días
   *  (Dir. 2011/83/UE · salvo inicio de servicio con consentimiento expreso). */
  informa_derecho_desistimiento?: boolean

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD FORMATIVA (CLIENTE BUSCA)
// ============================================================================

/** Ficha publicada por una empresa o particular que busca formación.
 *
 *  Caso de uso: una metalúrgica publica que necesita certificar a 12 soldadores
 *  en EN ISO 9606-1 · presencial in company · presupuesto 9.000 € · bonificable
 *  FUNDAE · cierre antes de fin de trimestre. */
export type NecesidadFormativaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_formativa'

  // -------------------- QUÉ NECESITA --------------------
  /** Descripción de la necesidad formativa × idiomas. */
  descripcion_necesidad: LocalizedLabel
  /** Tipos de enseñanza aceptables. */
  tipos_ensenanza_aceptables: TipoEnsenanza[]
  /** Área de conocimiento / competencia objetivo. */
  area_objetivo: string
  /** Nivel EQF objetivo (si aplica). */
  nivel_eqf_objetivo?: NivelEQF
  /** Nº de personas a formar. */
  num_personas?: number
  /** Público (empleados · desempleados · particulares). */
  publico: PublicoObjetivo[]

  // -------------------- REQUISITOS --------------------
  /** Modalidades aceptadas. */
  modalidades_aceptadas: ModalidadFormativa[]
  /** ¿Exige título/certificación oficial al finalizar? */
  exige_titulo_oficial: boolean
  /** ¿Exige centro acreditado / formador habilitado? */
  exige_centro_acreditado: boolean
  /** Idiomas requeridos. */
  idiomas_requeridos: string[]

  // -------------------- PRESUPUESTO Y TIMING --------------------
  presupuesto_max?: number
  moneda_presupuesto: string
  /** ¿Se pretende bonificar vía FUNDAE? */
  bonificacion_fundae: boolean
  fecha_objetivo?: string               // ISO date
  plazo_respuesta_max_dias: number

  // -------------------- PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · ACREDITACIÓN / TÍTULO
// ============================================================================

/** Ficha de servicio de emisión o reconocimiento de una titulación / credencial.
 *
 *  Caso de uso: una universidad publica el servicio de homologación de título
 *  extranjero + expedición de credencial verificable · o un centro acreditado
 *  expide un certificado de profesionalidad tras la formación. */
export type AcreditacionTituloProduct = UniversalProduct & {
  sub_categoria: 'acreditacion_titulo'

  // -------------------- TIPO DE ACREDITACIÓN --------------------
  tipo_acreditacion:
    | 'expedicion_titulo_oficial'
    | 'expedicion_titulo_propio'
    | 'certificado_profesionalidad'
    | 'homologacion_titulo_extranjero'
    | 'reconocimiento_cualificacion_ue'   // Dir. 2005/36/CE
    | 'credencial_digital_verificable'    // EBSI / microcredencial firmada
  /** Denominación de la titulación × idiomas. */
  denominacion_titulo: LocalizedLabel
  /** Nivel EQF de la credencial. */
  nivel_eqf?: NivelEQF

  // -------------------- EMISOR --------------------
  /** Centro/entidad emisora acreditada. */
  centro: AutorizacionCentroDocente
  /** Acreditación universitaria (si título oficial universitario). */
  acreditacion_universitaria?: AcreditacionTituloUniversitario
  /** Reconocimiento profesional (si habilita profesión regulada). */
  reconocimiento_cualificacion?: ReconocimientoCualificacion

  // -------------------- CREDENCIAL VERIFICABLE --------------------
  /** ¿La credencial se emite como verifiable credential (firmada · EBSI)? */
  es_credencial_verificable: boolean
  /** Hash/identificador de la credencial on-chain (PII off-chain · solo hash). */
  credencial_hash?: string

  // -------------------- TARIFAS --------------------
  precio?: number
  moneda: string
  iva_exento: boolean
  plazo_dias?: number

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector EDUCACIÓN
// ============================================================================

export type EducacionProduct =
  | ServicioFormativoProduct
  | NecesidadFormativaProduct
  | AcreditacionTituloProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const EDUCACION_SCHEMA_VERSION = 'educacion@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta revisión por:
 *   - ANECA (Agencia Nacional de Evaluación de la Calidad y Acreditación)
 *   - INCUAL / SEPE (Catálogo Nacional de Cualificaciones · cert. profesionalidad)
 *   - Consejería de Educación de la CCAA (autorización de centros)
 *   - 1 universidad + 1 centro de FP + 1 academia privada ejercientes
 *   - DPO especializado en datos de menores (RGPD Art. 8 + LOPDGDD Art. 7)
 *   - Auditoría de accesibilidad digital (EAA Dir. 2019/882 + EN 301 549)
 */
export const EDUCACION_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioFormativo(p: EducacionProduct): p is ServicioFormativoProduct {
  return p.sub_categoria === 'servicio_formativo'
}

export function isNecesidadFormativa(p: EducacionProduct): p is NecesidadFormativaProduct {
  return p.sub_categoria === 'necesidad_formativa'
}

export function isAcreditacionTitulo(p: EducacionProduct): p is AcreditacionTituloProduct {
  return p.sub_categoria === 'acreditacion_titulo'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿La ficha conduce a / expide un TÍTULO OFICIAL? (enseñanza reglada). */
export function emiteTituloOficial(p: EducacionProduct): boolean {
  if (isServicioFormativo(p)) return p.titulo_oficial === true
  if (isAcreditacionTitulo(p)) {
    return p.tipo_acreditacion === 'expedicion_titulo_oficial'
      || p.tipo_acreditacion === 'certificado_profesionalidad'
  }
  return false
}

/** ¿Es un título universitario oficial (requiere verificación ANECA/RUCT)? */
export function requiereAcreditacionANECA(p: EducacionProduct): boolean {
  const univ =
    isServicioFormativo(p)
      ? (p.tipo_ensenanza === 'universitaria_grado'
        || p.tipo_ensenanza === 'universitaria_master'
        || p.tipo_ensenanza === 'universitaria_doctorado')
      : false
  return univ && emiteTituloOficial(p)
}

/** ¿Habilita para una profesión regulada (Dir. 2005/36/CE)? */
export function habilitaProfesionRegulada(p: EducacionProduct): boolean {
  if (isServicioFormativo(p)) return p.reconocimiento_cualificacion?.habilita_profesion_regulada === true
  if (isAcreditacionTitulo(p)) return p.reconocimiento_cualificacion?.habilita_profesion_regulada === true
  return false
}

/** ¿Va dirigida a menores (protección de datos reforzada RGPD Art. 8)? */
export function dirigidoAMenores(p: EducacionProduct): boolean {
  if (isServicioFormativo(p)) return p.publico_objetivo.includes('menores')
  if (isNecesidadFormativa(p)) return p.publico.includes('menores')
  return false
}

/** ¿Usa plataforma digital sujeta al European Accessibility Act (desde 28-jun-2025)? */
export function enAlcanceEAA(p: EducacionProduct): boolean {
  return isServicioFormativo(p) && p.usa_plataforma_digital === true
}

/** ¿Es venta a distancia a consumidores (derecho de desistimiento 14 días)? */
export function esFormacionDistanciaB2C(p: EducacionProduct): boolean {
  if (!isServicioFormativo(p)) return false
  const distancia = p.modalidad !== 'presencial'
  const b2c = p.publico_objetivo.includes('adultos_particulares') || p.publico_objetivo.includes('menores')
  return distancia && b2c
}
