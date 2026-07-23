// Schema sectorial SERVICIOS AUXILIARES · Fase 6 bloque sectorial 16.
//
// Cubre los servicios de soporte que externaliza cualquier empresa: limpieza,
// seguridad privada, mantenimiento integral (facility management), jardinería,
// control de plagas, trabajo temporal (ETT), alquiler de equipos y soporte
// administrativo (BPO / call center).
//
// 4 sub-categorías (tipo de ficha que un Actor del sector publica):
//
// 1. ServicioAuxiliarProduct · servicio recurrente (limpieza, mantenimiento/FM,
//    jardinería, control de plagas, soporte administrativo, alquiler de equipos).
//
// 2. ServicioSeguridadPrivadaProduct · vigilancia, sistemas, CRA, protección.
//
// 3. ServicioTrabajoTemporalProduct · puesta a disposición de personal (ETT).
//
// 4. NecesidadServicioAuxiliarProduct · una empresa busca externalizar un servicio.
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-06-01 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
// Cada norma citada lleva su identificador oficial + URL trazable. NO sustituye
// dictamen experto (CLAUDE.md §1).
//
//   UE — EUR-Lex:
//   - Dir. 2008/104/CE (trabajo a través de empresas de trabajo temporal ·
//     igualdad de trato) · CELEX 32008L0104 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008L0104
//   - Reglamento (UE) 528/2012 (comercialización y uso de biocidas · todo biocida
//     requiere autorización) · CELEX 32012R0528 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32012R0528
//   - Dir. (UE) 2018/957 (modifica la Dir. 96/71/CE · desplazamiento de
//     trabajadores en el marco de una prestación de servicios) · CELEX 32018L0957 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32018L0957
//
//   ES — BOE:
//   - Ley 5/2014 (Seguridad Privada · empresas autorizadas · personal habilitado) ·
//     BOE-A-2014-3649 · https://www.boe.es/buscar/act.php?id=BOE-A-2014-3649
//   - Ley 14/1994 (empresas de trabajo temporal · autorización administrativa ·
//     registro de ETT) · BOE-A-1994-12554 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-1994-12554
//   - Ley 31/1995 (Prevención de Riesgos Laborales) · BOE-A-1995-24292 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292
//
//   ES (registro · subject_to_expert): ROESB (Registro Oficial de Establecimientos
//   y Servicios Biocidas) para empresas de control de plagas / sanidad ambiental.
//
// schema_status: 'draft' (pendiente validación experta: graduado social/abogado
// laboralista · dirección de seguridad habilitada · servicio de prevención · técnico
// de sanidad ambiental).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de servicio auxiliar (no seguridad ni ETT). */
export type TipoServicioAuxiliar =
  | 'limpieza'
  | 'mantenimiento_fm'                  // facility management / mantenimiento integral
  | 'jardineria'
  | 'control_plagas'                    // DDD · sanidad ambiental (biocidas · ROESB)
  | 'soporte_administrativo'            // call center · backoffice · BPO
  | 'alquiler_equipos'                  // maquinaria · vehículos · eventos

/** Tipo de servicio de seguridad privada (Ley 5/2014). */
export type TipoSeguridadPrivada =
  | 'vigilancia'
  | 'sistemas_seguridad'
  | 'central_receptora_alarmas'         // CRA
  | 'proteccion_personal'               // escolta
  | 'deposito_transporte_fondos'

// ============================================================================
// BLOQUES REUTILIZABLES
// ============================================================================

/** Prevención de riesgos laborales del proveedor (Ley 31/1995). */
export type PrevencionRiesgosLaborales = {
  /** ¿Dispone de plan de prevención de riesgos laborales? */
  tiene_plan_prl: boolean
  /** Modalidad de organización preventiva. */
  modalidad?: 'asuncion_propia' | 'trabajador_designado' | 'servicio_propio' | 'servicio_ajeno' | 'mancomunado'
}

/** Desplazamiento transnacional de trabajadores (Dir. 96/71 + 2018/957). */
export type DesplazamientoTrabajadores = {
  /** ¿La prestación implica desplazar trabajadores a otro país? */
  implica_desplazamiento_transfronterizo: boolean
  pais_origen?: ISOCountryCode
  pais_destino?: ISOCountryCode
  /** ¿Realiza la declaración de desplazamiento ante la autoridad del país de destino? */
  declaracion_desplazamiento?: boolean
}

/** Autorización de empresa de seguridad privada (Ley 5/2014). */
export type AutorizacionSeguridadPrivada = {
  /** ¿Es empresa de seguridad autorizada e inscrita en el registro? */
  empresa_autorizada: boolean
  numero_registro_empresa_seguridad?: string
  /** ¿El personal de seguridad está habilitado (TIP)? */
  personal_habilitado: boolean
}

/** Autorización de empresa de trabajo temporal (Ley 14/1994). */
export type AutorizacionETT = {
  /** ¿Tiene autorización administrativa de ETT? */
  tiene_autorizacion_administrativa: boolean
  numero_autorizacion?: string
  /** ¿Inscrita en el Registro de Empresas de Trabajo Temporal? */
  inscrita_registro_ett: boolean
  /** ¿Garantía financiera constituida? */
  garantia_financiera?: boolean
}

/** Inscripción para control de plagas / uso de biocidas (Reg. 528/2012 · ROESB). */
export type RegimenBiocidas = {
  /** ¿Inscrita en el ROESB (Registro Oficial de Establecimientos y Servicios Biocidas)? */
  inscrito_roesb: boolean
  numero_roesb?: string
  /** ¿Emplea exclusivamente biocidas autorizados (Reg. (UE) 528/2012)? */
  usa_biocidas_autorizados: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO AUXILIAR
// ============================================================================

/** Ficha de un servicio auxiliar recurrente.
 *
 *  Caso de uso: una empresa de facility services oferta limpieza de oficinas con
 *  SLA medido y partes de trabajo · o una empresa de control de plagas oferta DDD
 *  con inscripción ROESB y biocidas autorizados. */
export type ServicioAuxiliarProduct = UniversalProduct & {
  sub_categoria: 'servicio_auxiliar'

  tipo_servicio: TipoServicioAuxiliar
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel
  /** ¿El servicio despliega personal propio en las instalaciones del cliente? */
  despliega_personal: boolean

  // -------------------- LABORAL --------------------
  /** Prevención de riesgos laborales (si despliega_personal). */
  prl?: PrevencionRiesgosLaborales
  /** Desplazamiento transnacional de trabajadores (si aplica). */
  desplazamiento?: DesplazamientoTrabajadores

  // -------------------- CONTROL DE PLAGAS (si aplica) --------------------
  /** Régimen de biocidas/ROESB (obligatorio si tipo_servicio = control_plagas). */
  biocidas?: RegimenBiocidas

  // -------------------- SLA / TARIFAS / PAGO --------------------
  /** ¿Incluye SLA verificable? */
  tiene_sla?: boolean
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · SEGURIDAD PRIVADA
// ============================================================================

/** Ficha de un servicio de seguridad privada (Ley 5/2014).
 *
 *  Caso de uso: una empresa de seguridad oferta vigilancia 24/7 con CRA ·
 *  empresa autorizada e inscrita en el registro · personal habilitado (TIP). */
export type ServicioSeguridadPrivadaProduct = UniversalProduct & {
  sub_categoria: 'servicio_seguridad_privada'

  tipo_seguridad: TipoSeguridadPrivada
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- AUTORIZACIÓN (Ley 5/2014) --------------------
  autorizacion: AutorizacionSeguridadPrivada

  // -------------------- LABORAL --------------------
  prl?: PrevencionRiesgosLaborales

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · TRABAJO TEMPORAL (ETT)
// ============================================================================

/** Ficha de un servicio de puesta a disposición de personal (ETT · Ley 14/1994).
 *
 *  Caso de uso: una ETT oferta personal temporal con contratación y nómina
 *  integradas · autorización administrativa + inscripción en el registro de ETT. */
export type ServicioTrabajoTemporalProduct = UniversalProduct & {
  sub_categoria: 'servicio_trabajo_temporal'

  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas (perfiles, sectores cubiertos). */
  descripcion: LocalizedLabel

  // -------------------- AUTORIZACIÓN (Ley 14/1994) --------------------
  autorizacion: AutorizacionETT

  // -------------------- DESPLAZAMIENTO --------------------
  desplazamiento?: DesplazamientoTrabajadores

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 4 · NECESIDAD DE SERVICIO AUXILIAR
// ============================================================================

/** Ficha publicada por una empresa/comunidad/administración que busca externalizar
 *  un servicio auxiliar, de seguridad o de personal. */
export type NecesidadServicioAuxiliarProduct = UniversalProduct & {
  sub_categoria: 'necesidad_servicio_auxiliar'

  /** Descripción de la necesidad × idiomas. */
  descripcion_necesidad: LocalizedLabel
  /** ¿Qué tipo de servicio busca? */
  busca_servicio_auxiliar?: TipoServicioAuxiliar[]
  busca_seguridad_privada?: boolean
  busca_trabajo_temporal?: boolean
  /** ¿Exige proveedor autorizado/habilitado según el servicio? */
  exige_proveedor_autorizado: boolean

  // -------------------- PRESUPUESTO Y TIMING --------------------
  presupuesto_max?: number
  moneda_presupuesto: string
  fecha_objetivo?: string               // ISO date
  plazo_respuesta_max_dias: number

  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector SERVICIOS AUXILIARES
// ============================================================================

export type ServiciosAuxiliaresProduct =
  | ServicioAuxiliarProduct
  | ServicioSeguridadPrivadaProduct
  | ServicioTrabajoTemporalProduct
  | NecesidadServicioAuxiliarProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const SERVICIOS_AUXILIARES_SCHEMA_VERSION = 'servicios-auxiliares@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta revisión por:
 *   - Graduado social / abogado laboralista (ETT · desplazamiento · PRL)
 *   - Director de seguridad habilitado (Ley 5/2014)
 *   - Servicio de prevención de riesgos laborales (Ley 31/1995)
 *   - Técnico de sanidad ambiental (biocidas · ROESB)
 */
export const SERVICIOS_AUXILIARES_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioAuxiliar(p: ServiciosAuxiliaresProduct): p is ServicioAuxiliarProduct {
  return p.sub_categoria === 'servicio_auxiliar'
}

export function isServicioSeguridadPrivada(p: ServiciosAuxiliaresProduct): p is ServicioSeguridadPrivadaProduct {
  return p.sub_categoria === 'servicio_seguridad_privada'
}

export function isServicioTrabajoTemporal(p: ServiciosAuxiliaresProduct): p is ServicioTrabajoTemporalProduct {
  return p.sub_categoria === 'servicio_trabajo_temporal'
}

export function isNecesidadServicioAuxiliar(p: ServiciosAuxiliaresProduct): p is NecesidadServicioAuxiliarProduct {
  return p.sub_categoria === 'necesidad_servicio_auxiliar'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿Es un servicio de seguridad privada (requiere autorización · Ley 5/2014)? */
export function requiereAutorizacionSeguridadPrivada(p: ServiciosAuxiliaresProduct): boolean {
  return isServicioSeguridadPrivada(p)
}

/** ¿Es una ETT (requiere autorización administrativa · Ley 14/1994)? */
export function requiereAutorizacionETT(p: ServiciosAuxiliaresProduct): boolean {
  return isServicioTrabajoTemporal(p)
}

/** ¿Es control de plagas (requiere ROESB + biocidas autorizados · Reg. 528/2012)? */
export function esControlPlagas(p: ServiciosAuxiliaresProduct): boolean {
  return isServicioAuxiliar(p) && p.tipo_servicio === 'control_plagas'
}

/** ¿El servicio despliega personal propio (obligaciones de PRL · Ley 31/1995)? */
export function requierePRL(p: ServiciosAuxiliaresProduct): boolean {
  if (isServicioAuxiliar(p)) return p.despliega_personal === true
  if (isServicioSeguridadPrivada(p)) return true
  return false
}

/** ¿La prestación implica desplazamiento transnacional de trabajadores
 *  (Dir. 96/71/CE + 2018/957)? */
export function implicaDesplazamientoTrabajadores(p: ServiciosAuxiliaresProduct): boolean {
  const d = (isServicioAuxiliar(p) || isServicioTrabajoTemporal(p)) ? p.desplazamiento : undefined
  return d?.implica_desplazamiento_transfronterizo === true
}
