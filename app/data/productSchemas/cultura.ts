// Schema sectorial CULTURA ("Cultura, ocio y deporte") · Fase 6 bloque sectorial 14.
//
// Cubre producción cultural y audiovisual, música y espectáculos, eventos y
// festivales, museos y patrimonio, artes escénicas, equipamiento técnico e
// instalaciones y servicios deportivos.
//
// 4 sub-categorías (tipo de ficha que un Actor del sector CULTURA publica):
//
// 1. ProduccionCulturalProduct · servicio de producción cultural/audiovisual,
//    música, espectáculo, evento, artes escénicas o exposición (con derechos de
//    propiedad intelectual asociados).
//
// 2. BienCulturalProduct · un bien cultural / pieza de patrimonio que se
//    comercializa (obra de arte, antigüedad, bien arqueológico) · activa los
//    regímenes de exportación/importación de bienes culturales y de patrimonio.
//
// 3. ServicioDeportivoProduct · gestión de instalaciones, club, tecnificación,
//    evento o servicio deportivo.
//
// 4. NecesidadCulturaDeporteProduct · una administración/marca/club busca
//    producción cultural o servicio deportivo.
//
// FUENTES OFICIALES VERIFICADAS (EUR-Lex / BOE · cotejadas 2026-06-01 · regla
// canónica José: "son leyes, no podemos fallar, siempre fuentes oficiales").
// Cada norma citada lleva su identificador oficial + URL trazable. NO sustituye
// dictamen experto (CLAUDE.md §1).
//
//   UE — EUR-Lex:
//   - Reglamento (CE) 116/2009 (exportación de bienes culturales · licencia de
//     exportación fuera del territorio aduanero UE · versión codificada) ·
//     CELEX 32009R0116 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R0116
//   - Reglamento (UE) 2019/880 (introducción e importación de bienes culturales ·
//     lucha contra el tráfico ilícito · licencia/declaración de importación) ·
//     CELEX 32019R0880 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019R0880
//   - Dir. (UE) 2019/790 (derechos de autor en el Mercado Único Digital · DSM) ·
//     CELEX 32019L0790 · https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L0790
//   - Dir. 2014/26/UE (gestión colectiva de derechos de autor y licencias
//     multiterritoriales de obras musicales en línea) · CELEX 32014L0026 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0026
//   - Dir. 2011/83/UE (derechos de los consumidores · Art. 16.l · NO hay
//     desistimiento en servicios de ocio en fecha determinada) · CELEX 32011L0083 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083
//   - Dir. (UE) 2019/882 (European Accessibility Act · plataformas/venta digital ·
//     desde 28-jun-2025) · CELEX 32019L0882 ·
//     https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L0882
//
//   ES — BOE:
//   - Ley 16/1985 (Patrimonio Histórico Español · BIC · inexportabilidad de bienes
//     de dominio público · licencia de exportación) · BOE-A-1985-12534 ·
//     https://www.boe.es/buscar/act.php?id=BOE-A-1985-12534
//   - RDL 1/1996 (Texto Refundido de la Ley de Propiedad Intelectual · TRLPI) ·
//     BOE-A-1996-8930 · https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
//   - Ley 39/2022 (del Deporte · entidades, instalaciones, integridad) ·
//     BOE-A-2022-24430 · https://www.boe.es/buscar/act.php?id=BOE-A-2022-24430
//   - LO 11/2021 (lucha contra el dopaje en el deporte · Código Mundial
//     Antidopaje) · BOE-A-2021-21650 · https://www.boe.es/buscar/act.php?id=BOE-A-2021-21650
//
// schema_status: 'draft' (pendiente validación experta: abogado de propiedad
// intelectual · entidad de gestión colectiva · administración de cultura/patrimonio ·
// Consejo Superior de Deportes / federación · auditoría de accesibilidad EN 301 549).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de producción cultural / servicio cultural. */
export type TipoProduccionCultural =
  | 'audiovisual_cine'
  | 'audiovisual_tv'
  | 'audiovisual_publicidad'
  | 'musica_concierto'
  | 'musica_gira'
  | 'espectaculo_sala'
  | 'evento_festival'
  | 'artes_escenicas_teatro'
  | 'artes_escenicas_danza'
  | 'artes_escenicas_circo'
  | 'exposicion_museo'
  | 'equipamiento_tecnico'              // sonido · iluminación · escenario

/** Tipo de bien cultural comercializado. */
export type TipoBienCultural =
  | 'obra_arte'
  | 'antiguedad'
  | 'arqueologico'
  | 'documental_bibliografico'
  | 'etnografico'
  | 'instrumento_musical_historico'
  | 'otro'

/** Tipo de servicio deportivo. */
export type TipoServicioDeportivo =
  | 'gestion_instalacion'
  | 'mantenimiento_instalacion'
  | 'club_deportivo'
  | 'tecnificacion_entrenamiento'
  | 'evento_deportivo'
  | 'servicios_deportista'

/** Canal de explotación de la obra (filtra gestión colectiva / DSM). */
export type CanalExplotacion =
  | 'presencial'
  | 'online'                            // streaming · VOD · plataforma
  | 'broadcast'                         // emisión TV/radio
  | 'multiterritorial'                  // licencia multi-país (Dir. 2014/26/UE)

// ============================================================================
// BLOQUES REUTILIZABLES
// ============================================================================

/** Derechos de propiedad intelectual de la producción (TRLPI · DSM 2019/790). */
export type DerechosPropiedadIntelectual = {
  /** Titular de los derechos de explotación. */
  titular_derechos?: string
  /** ¿La cesión/licencia de derechos está documentada (contrato)? */
  cesion_derechos_documentada: boolean
  /** Canales de explotación previstos. */
  canales: CanalExplotacion[]
  /** Si explotación online/broadcast de música: entidad de gestión colectiva
   *  (SGAE, AIE, AGEDI…) que licencia los derechos (Dir. 2014/26/UE). */
  entidad_gestion_colectiva?: string
}

/** Régimen de bien cultural / patrimonio (exportación · importación · BIC). */
export type RegimenBienCultural = {
  /** ¿Es Bien de Interés Cultural (BIC) o está inventariado en el Patrimonio
   *  Histórico Español (Ley 16/1985)? */
  es_bic_o_inventariado: boolean
  /** ¿Es de titularidad pública (dominio público · inalienable e inexportable)? */
  es_dominio_publico: boolean
  /** ¿El bien SALE del territorio aduanero de la UE (exportación · Reg. 116/2009)? */
  exporta_fuera_ue: boolean
  /** ¿Dispone de licencia de exportación de bien cultural? */
  tiene_licencia_exportacion: boolean
  numero_licencia_exportacion?: string
  /** ¿El bien se INTRODUCE/importa en la UE desde un tercer país (Reg. 2019/880)? */
  importa_desde_tercer_pais: boolean
  /** ¿Dispone de licencia/declaración de importación (Reg. 2019/880 · Parte B Anexo)? */
  tiene_licencia_importacion: boolean
  /** País de origen declarado del bien (ISO alpha-2). */
  pais_origen?: ISOCountryCode
}

/** Conformidad deportiva (Ley 39/2022 · antidopaje LO 11/2021). */
export type ConformidadDeportiva = {
  /** ¿Implica competición oficial (sujeta a normativa antidopaje)? */
  es_competicion_oficial: boolean
  /** ¿Declara cumplimiento de la normativa antidopaje (LO 11/2021 · CMA)? */
  cumple_normativa_antidopaje: boolean
  /** Si instalación: ¿tiene licencia de actividad / autorización? */
  instalacion_tiene_licencia?: boolean
  /** ¿Entidad deportiva inscrita en el registro correspondiente? */
  entidad_inscrita_registro?: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · PRODUCCIÓN CULTURAL
// ============================================================================

/** Ficha de un servicio de producción cultural/audiovisual, música, espectáculo,
 *  evento o artes escénicas.
 *
 *  Caso de uso: una productora audiovisual oferta la producción de una campaña
 *  para una marca · con derechos y entregables trazados · o una sala publica la
 *  reserva de aforo y caché de un concierto con venta de entradas online. */
export type ProduccionCulturalProduct = UniversalProduct & {
  sub_categoria: 'produccion_cultural'

  tipo_produccion: TipoProduccionCultural
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- PROPIEDAD INTELECTUAL --------------------
  /** ¿La producción incorpora obra protegida por derechos de autor/conexos? */
  incorpora_obra_protegida: boolean
  /** Derechos de propiedad intelectual (si incorpora_obra_protegida). */
  propiedad_intelectual?: DerechosPropiedadIntelectual

  // -------------------- VENTA DE ENTRADAS (B2C) --------------------
  /** ¿Hay venta de entradas/acceso a un evento en fecha determinada? */
  vende_entradas_evento_fecha?: boolean
  /** ¿Venta a distancia a consumidores (online)? */
  venta_distancia_consumidores?: boolean
  /** ¿Informa de que NO aplica el desistimiento (Art. 16.l Dir. 2011/83/UE)? */
  informa_no_desistimiento_ocio?: boolean

  // -------------------- DIGITAL / ACCESIBILIDAD --------------------
  /** ¿Usa plataforma/venta digital (en alcance EAA)? */
  usa_plataforma_digital?: boolean
  /** ¿Aporta declaración de accesibilidad (EAA · EN 301 549)? */
  declaracion_accesibilidad_eaa?: boolean

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 2 · BIEN CULTURAL (patrimonio)
// ============================================================================

/** Ficha de un bien cultural / pieza de patrimonio que se comercializa.
 *
 *  Caso de uso: una galería pone a la venta una obra de arte que se exportará a
 *  un comprador fuera de la UE · requiere licencia de exportación (Reg. 116/2009)
 *  y, si es BIC, está sujeta a las restricciones de la Ley 16/1985. */
export type BienCulturalProduct = UniversalProduct & {
  sub_categoria: 'bien_cultural'

  tipo_bien: TipoBienCultural
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción / ficha técnica × idiomas. */
  descripcion: LocalizedLabel
  /** Autor / época / procedencia (si se conoce). */
  autor_epoca?: string

  // -------------------- RÉGIMEN DE PATRIMONIO / ADUANERO --------------------
  regimen: RegimenBienCultural

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '02_intermediado' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO DEPORTIVO
// ============================================================================

/** Ficha de un servicio deportivo (instalación, club, tecnificación, evento).
 *
 *  Caso de uso: un club publica el servicio de organización de un evento
 *  deportivo de competición · sujeto a la normativa antidopaje · o un gestor
 *  oferta el mantenimiento y explotación de una instalación con SLA. */
export type ServicioDeportivoProduct = UniversalProduct & {
  sub_categoria: 'servicio_deportivo'

  tipo_servicio: TipoServicioDeportivo
  /** Denominación × idiomas. */
  denominacion: LocalizedLabel
  /** Descripción × idiomas. */
  descripcion: LocalizedLabel

  // -------------------- CONFORMIDAD DEPORTIVA --------------------
  conformidad: ConformidadDeportiva

  // -------------------- TARIFAS / PAGO --------------------
  precio?: number
  moneda: string
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 4 · NECESIDAD CULTURA / DEPORTE (cliente busca)
// ============================================================================

/** Ficha publicada por una administración/marca/club/fundación que busca
 *  producción cultural o un servicio deportivo. */
export type NecesidadCulturaDeporteProduct = UniversalProduct & {
  sub_categoria: 'necesidad_cultura_deporte'

  /** Descripción de la necesidad × idiomas. */
  descripcion_necesidad: LocalizedLabel
  /** ¿Busca producción cultural? */
  busca_produccion_cultural: boolean
  /** Tipos de producción aceptables (si busca cultural). */
  tipos_produccion_aceptables?: TipoProduccionCultural[]
  /** ¿Busca servicio deportivo? */
  busca_servicio_deportivo: boolean
  /** Tipos de servicio deportivo aceptables (si busca deportivo). */
  tipos_servicio_deportivo_aceptables?: TipoServicioDeportivo[]
  /** ¿Exige cesión de derechos de PI documentada en el entregable? */
  exige_cesion_derechos: boolean

  // -------------------- PRESUPUESTO Y TIMING --------------------
  presupuesto_max?: number
  moneda_presupuesto: string
  fecha_objetivo?: string               // ISO date
  plazo_respuesta_max_dias: number

  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector CULTURA
// ============================================================================

export type CulturaProduct =
  | ProduccionCulturalProduct
  | BienCulturalProduct
  | ServicioDeportivoProduct
  | NecesidadCulturaDeporteProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const CULTURA_SCHEMA_VERSION = 'cultura@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta revisión por:
 *   - Abogado de propiedad intelectual (TRLPI · DSM)
 *   - Entidad de gestión colectiva de derechos (SGAE · AIE · AGEDI · VEGAP)
 *   - Administración de cultura / patrimonio (exportación de bienes culturales)
 *   - Consejo Superior de Deportes / federación deportiva (Ley 39/2022 · antidopaje)
 *   - Auditoría de accesibilidad digital (EAA Dir. 2019/882 + EN 301 549)
 */
export const CULTURA_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isProduccionCultural(p: CulturaProduct): p is ProduccionCulturalProduct {
  return p.sub_categoria === 'produccion_cultural'
}

export function isBienCultural(p: CulturaProduct): p is BienCulturalProduct {
  return p.sub_categoria === 'bien_cultural'
}

export function isServicioDeportivo(p: CulturaProduct): p is ServicioDeportivoProduct {
  return p.sub_categoria === 'servicio_deportivo'
}

export function isNecesidadCulturaDeporte(p: CulturaProduct): p is NecesidadCulturaDeporteProduct {
  return p.sub_categoria === 'necesidad_cultura_deporte'
}

// ============================================================================
// PREDICADOS "¿cuándo aplica esta ley?" · fuente única para Capa 2
// ============================================================================

/** ¿La producción incorpora obra protegida y por tanto requiere derechos
 *  documentados (TRLPI · DSM Dir. 2019/790)? */
export function requiereDerechosDocumentados(p: CulturaProduct): boolean {
  return isProduccionCultural(p) && p.incorpora_obra_protegida === true
}

/** ¿Explotación online/broadcast/multiterritorial de música que requiere licencia
 *  de una entidad de gestión colectiva (Dir. 2014/26/UE)? */
export function requiereGestionColectiva(p: CulturaProduct): boolean {
  if (!isProduccionCultural(p)) return false
  const esMusica = p.tipo_produccion === 'musica_concierto'
    || p.tipo_produccion === 'musica_gira'
    || p.tipo_produccion === 'espectaculo_sala'
    || p.tipo_produccion === 'evento_festival'
  const canales = p.propiedad_intelectual?.canales ?? []
  const online = canales.includes('online') || canales.includes('broadcast') || canales.includes('multiterritorial')
  return esMusica && online
}

/** ¿Venta de entradas a distancia a consumidores para un evento en fecha
 *  determinada (Art. 16.l Dir. 2011/83/UE · NO hay desistimiento, pero hay que
 *  informarlo)? */
export function esVentaEntradasDistancia(p: CulturaProduct): boolean {
  return isProduccionCultural(p)
    && p.vende_entradas_evento_fecha === true
    && p.venta_distancia_consumidores === true
}

/** ¿Usa plataforma/venta digital sujeta al European Accessibility Act? */
export function enAlcanceEAA(p: CulturaProduct): boolean {
  return isProduccionCultural(p) && p.usa_plataforma_digital === true
}

/** ¿Bien cultural que SALE del territorio aduanero UE (licencia de exportación ·
 *  Reg. 116/2009)? */
export function requiereLicenciaExportacionBienCultural(p: CulturaProduct): boolean {
  return isBienCultural(p) && p.regimen.exporta_fuera_ue === true
}

/** ¿Bien cultural INTRODUCIDO/importado desde un tercer país (Reg. 2019/880)? */
export function requiereLicenciaImportacionBienCultural(p: CulturaProduct): boolean {
  return isBienCultural(p) && p.regimen.importa_desde_tercer_pais === true
}

/** ¿Bien de dominio público / BIC sujeto a inalienabilidad o inexportabilidad
 *  (Ley 16/1985)? */
export function esBienPatrimonioRestringido(p: CulturaProduct): boolean {
  return isBienCultural(p)
    && (p.regimen.es_dominio_publico === true || p.regimen.es_bic_o_inventariado === true)
}

/** ¿Servicio/evento deportivo de competición oficial (normativa antidopaje ·
 *  LO 11/2021)? */
export function requiereCumplimientoAntidopaje(p: CulturaProduct): boolean {
  return isServicioDeportivo(p) && p.conformidad.es_competicion_oficial === true
}

/** ¿Instalación deportiva que requiere licencia de actividad (Ley 39/2022)? */
export function esInstalacionDeportiva(p: CulturaProduct): boolean {
  if (!isServicioDeportivo(p)) return false
  return p.tipo_servicio === 'gestion_instalacion' || p.tipo_servicio === 'mantenimiento_instalacion'
}
