// Schema sectorial FINANCIERO (sección ISIC K · 17º sector 1503 · transversal)
// · Fase 6 bloque sectorial 17 (cierra 17/17).
//
// Cubre banca comercial y trade finance, servicios de inversión, seguros B2B y
// servicios sobre criptoactivos (banca cripto-friendly · VASPs/CASPs). Es el
// sector más regulado y de mayor riesgo: TODAS sus fichas son subject_to_expert
// y NINGUNA capa de código sustituye el dictamen del abogado fintech (bloqueante
// pre-deploy · CLAUDE.md §1). Aquí Capa 2 SOLO levanta banderas; no habilita operar.
//
// 4 sub-categorías:
//
// 1. ServicioBancarioCreditoProduct · préstamos, líneas, crédito documentario (LC),
//    factoring/confirming, forfaiting, project finance, avales.
//
// 2. ServicioInversionProduct · fondos, VC, private equity, crowdfunding,
//    intermediación, gestión de carteras, asesoramiento (MiFID II).
//
// 3. ServicioCriptoProduct · custodia, rampa fiat, intercambio, provisión de
//    liquidez, ejecución (MiCA · CASP/VASP · Travel Rule).
//
// 4. ServicioSeguroProduct · distribución de seguros B2B (crédito, transporte,
//    caución, responsabilidad civil) (IDD).
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-06-01 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
//
//   UE — EUR-Lex:
//   - Reglamento (UE) 2023/1114 (mercados de criptoactivos · MiCA · autorización
//     de CASP) · CELEX 32023R1114 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1114
//   - Reglamento (UE) 2023/1113 (información en transferencias de fondos y
//     criptoactivos · "Travel Rule" · modifica Dir. 2015/849) · CELEX 32023R1113 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1113
//   - Dir. (UE) 2015/2366 (servicios de pago · PSD2) · CELEX 32015L2366 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32015L2366
//   - Dir. 2014/65/UE (mercados de instrumentos financieros · MiFID II) ·
//     CELEX 32014L0065 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0065
//   - Dir. (UE) 2016/97 (distribución de seguros · IDD) · CELEX 32016L0097 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016L0097
//   - Reglamento (UE) 2022/2554 (resiliencia operativa digital · DORA) ·
//     CELEX 32022R2554 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022R2554
//
//   ES — BOE:
//   - Ley 10/2010 (prevención del blanqueo de capitales y financiación del
//     terrorismo · sujetos obligados · KYC) · BOE-A-2010-6737 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-2010-6737
//   - Ley 6/2023 (Mercados de Valores y de los Servicios de Inversión · CNMV) ·
//     BOE-A-2023-7053 · https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053
//   - Ley 20/2015 (ordenación, supervisión y solvencia de entidades aseguradoras y
//     reaseguradoras · Solvencia II · DGSFP) · BOE-A-2015-7897 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-2015-7897
//
//   Práctica contractual (subject_to_expert · no es ley · ver ADR 0021): UCP 600
//   (ICC) para el crédito documentario; URDG 758 (ICC) para garantías a demanda.
//
// schema_status: 'subject_to_expert' (TODO el sector requiere validación del
// abogado fintech + supervisores: Banco de España · CNMV · DGSFP · SEPBLAC).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

export type TipoServicioBancario =
  | 'prestamo_b2b'
  | 'linea_credito'
  | 'credito_documentario'              // LC · UCP 600 (ICC)
  | 'factoring'
  | 'confirming'
  | 'forfaiting'
  | 'project_finance'
  | 'aval_garantia'                     // URDG 758 (ICC)
  | 'servicio_pago'                     // PSD2

export type TipoServicioInversion =
  | 'fondo_inversion'
  | 'venture_capital'
  | 'private_equity'
  | 'crowdfunding'
  | 'broker_intermediacion'
  | 'gestion_carteras'
  | 'asesoramiento_financiero'

export type TipoServicioCripto =
  | 'custodia'
  | 'rampa_fiat'                        // on/off-ramp fiat-cripto
  | 'intercambio'                       // exchange
  | 'liquidity_provider'
  | 'ejecucion_ordenes'
  | 'asesoramiento_cripto'

export type TipoSeguroB2B =
  | 'credito'
  | 'transporte'                        // mercancías
  | 'caucion'
  | 'responsabilidad_civil'
  | 'multirriesgo'

/** Autoridad supervisora competente. */
export type AutoridadSupervisora =
  | 'banco_espana'
  | 'cnmv'
  | 'dgsfp'                             // Dirección General de Seguros y Fondos de Pensiones
  | 'sepblac'
  | 'eba' | 'esma' | 'eiopa'           // autoridades europeas
  | 'otra'

// ============================================================================
// BLOQUES REUTILIZABLES
// ============================================================================

/** Licencia/autorización de la entidad financiera. */
export type LicenciaFinanciera = {
  /** ¿Entidad autorizada/registrada para prestar el servicio? */
  entidad_autorizada: boolean
  /** Autoridad que autoriza/supervisa. */
  autoridad_supervisora?: AutoridadSupervisora
  /** Nº de registro/autorización. */
  numero_registro?: string
}

/** Cumplimiento de prevención de blanqueo (Ley 10/2010 · FATF). */
export type CumplimientoAML = {
  /** ¿Es sujeto obligado conforme a la Ley 10/2010? */
  sujeto_obligado: boolean
  /** ¿Dispone de programa de PBC/FT y realiza KYC/diligencia debida? */
  tiene_programa_pbcft_kyc: boolean
}

/** Resiliencia operativa digital de la entidad financiera (DORA). */
export type ResilienciaDORA = {
  /** ¿Dispone de marco de gestión del riesgo TIC (DORA)? */
  tiene_marco_resiliencia_tic: boolean
}

/** Régimen específico de criptoactivos (MiCA · Travel Rule). */
export type RegimenCripto = {
  /** ¿Proveedor de servicios de criptoactivos (CASP) autorizado (MiCA)? */
  es_casp_autorizado: boolean
  autoridad_casp?: AutoridadSupervisora
  /** ¿Aplica la "Travel Rule" (información de ordenante/beneficiario · Reg. 2023/1113)? */
  cumple_travel_rule: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO BANCARIO / TRADE FINANCE
// ============================================================================

export type ServicioBancarioCreditoProduct = UniversalProduct & {
  sub_categoria: 'servicio_bancario_credito'

  tipo_servicio: TipoServicioBancario
  denominacion: LocalizedLabel
  descripcion: LocalizedLabel

  licencia: LicenciaFinanciera
  aml: CumplimientoAML
  dora?: ResilienciaDORA

  /** Importe / límite (orientativo). */
  importe?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · SERVICIO DE INVERSIÓN
// ============================================================================

export type ServicioInversionProduct = UniversalProduct & {
  sub_categoria: 'servicio_inversion'

  tipo_servicio: TipoServicioInversion
  denominacion: LocalizedLabel
  descripcion: LocalizedLabel

  licencia: LicenciaFinanciera
  aml: CumplimientoAML
  dora?: ResilienciaDORA

  importe?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO DE CRIPTOACTIVOS
// ============================================================================

export type ServicioCriptoProduct = UniversalProduct & {
  sub_categoria: 'servicio_cripto'

  tipo_servicio: TipoServicioCripto
  denominacion: LocalizedLabel
  descripcion: LocalizedLabel

  /** Régimen MiCA + Travel Rule. */
  cripto: RegimenCripto
  aml: CumplimientoAML
  dora?: ResilienciaDORA
  /** ¿El servicio implica transferencias de criptoactivos (Travel Rule)? */
  implica_transferencias: boolean

  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 4 · SERVICIO DE SEGURO B2B
// ============================================================================

export type ServicioSeguroProduct = UniversalProduct & {
  sub_categoria: 'servicio_seguro'

  tipo_seguro: TipoSeguroB2B
  denominacion: LocalizedLabel
  descripcion: LocalizedLabel

  /** Licencia de distribuidor de seguros (IDD · registro DGSFP). */
  licencia: LicenciaFinanciera
  aml: CumplimientoAML

  /** País de cobertura principal (ISO alpha-2). */
  pais_cobertura?: ISOCountryCode
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector FINANCIERO
// ============================================================================

export type FinancieroProduct =
  | ServicioBancarioCreditoProduct
  | ServicioInversionProduct
  | ServicioCriptoProduct
  | ServicioSeguroProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const FINANCIERO_SCHEMA_VERSION = 'financiero@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'subject_to_expert': TODO el sector financiero requiere validación experta
 * (abogado fintech · Banco de España · CNMV · DGSFP · SEPBLAC) antes de cualquier
 * operación real. La Capa 2 solo levanta banderas; no autoriza a operar.
 */
export const FINANCIERO_SCHEMA_STATUS = 'subject_to_expert' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioBancario(p: FinancieroProduct): p is ServicioBancarioCreditoProduct {
  return p.sub_categoria === 'servicio_bancario_credito'
}

export function isServicioInversion(p: FinancieroProduct): p is ServicioInversionProduct {
  return p.sub_categoria === 'servicio_inversion'
}

export function isServicioCripto(p: FinancieroProduct): p is ServicioCriptoProduct {
  return p.sub_categoria === 'servicio_cripto'
}

export function isServicioSeguro(p: FinancieroProduct): p is ServicioSeguroProduct {
  return p.sub_categoria === 'servicio_seguro'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿Servicio de inversión que requiere empresa de servicios de inversión
 *  autorizada (Ley 6/2023 · MiFID II)? */
export function requiereAutorizacionInversion(p: FinancieroProduct): boolean {
  return isServicioInversion(p)
}

/** ¿Distribución de seguros que requiere distribuidor registrado (IDD · Ley 20/2015)? */
export function requiereRegistroSeguros(p: FinancieroProduct): boolean {
  return isServicioSeguro(p)
}

/** ¿Servicio sobre criptoactivos que requiere autorización CASP (MiCA)? */
export function requiereAutorizacionMiCA(p: FinancieroProduct): boolean {
  return isServicioCripto(p)
}

/** ¿Transferencias de criptoactivos sujetas a la Travel Rule (Reg. 2023/1113)? */
export function requiereTravelRule(p: FinancieroProduct): boolean {
  return isServicioCripto(p) && p.implica_transferencias === true
}

/** ¿Servicio de pago (PSD2)? */
export function esServicioPago(p: FinancieroProduct): boolean {
  return isServicioBancario(p) && p.tipo_servicio === 'servicio_pago'
}

/** ¿Sujeto obligado de PBC/FT (todas las fichas financieras lo son · Ley 10/2010)? */
export function esSujetoObligadoAML(_p: FinancieroProduct): boolean {
  return true
}

/** ¿Entidad financiera en el alcance de DORA (resiliencia TIC)? */
export function enAlcanceDORA(p: FinancieroProduct): boolean {
  return isServicioBancario(p) || isServicioInversion(p) || isServicioCripto(p)
}
