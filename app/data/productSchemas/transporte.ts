// Schema sectorial TRANSPORTE · Fase 6 piloto cluster Valencia.
//
// CRÍTICO para el cluster Valencia: 60 transitarios ATEIA + Puerto Valencia
// 5,66M TEUs 2025 + 90% comercio internacional ES vía transitarios.
//
// 3 sub-categorías (tipo de ficha que un Actor del sector TRANSPORTE puede
// publicar):
//
// 1. ServicioTransitarioProduct · servicio de forwarding ofrecido por un
//    transitario (FCL · LCL · multimodal · ruta concreta · tarifas spot).
//
// 2. OperacionTransporteProduct · operación de transporte que un cargador
//    necesita ejecutar (necesidad de mover X toneladas desde A a B · pide
//    cotización a transitarios).
//
// 3. ServicioNavieroProduct · servicio naviero de buque/operador portuario
//    (capacidad por trayecto · puertos · escalas · slots disponibles).
//
// Cada sub-categoría extiende UniversalProduct + añade sus campos específicos.
//
// schema_status: 'draft' (pendiente validación experta sectorial · ATEIA
// Valencia · FETEIA · operadores Valenciaport).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Modo de transporte. */
export type TransporteModo =
  | 'maritimo'
  | 'terrestre_carretera'
  | 'terrestre_ferroviario'
  | 'aereo'
  | 'multimodal'
  | 'fluvial'
  | 'tuberia'  // pipeline · gas · líquidos

/** Tipo de carga (contenedor · bulk · frigorífica · etc.). */
export type TipoCarga =
  | 'contenedor_seco'        // FCL · LCL standard
  | 'contenedor_refrigerado' // reefer
  | 'contenedor_open_top'
  | 'contenedor_flat_rack'
  | 'contenedor_tank'        // ISO tank
  | 'ro_ro'                  // roll-on/roll-off
  | 'granel_solido'          // bulk · cereales · minerales
  | 'granel_liquido'         // crude · químicos
  | 'carga_general_no_containerizada'
  | 'mercancia_peligrosa'    // requiere ADR/IMDG/DGR
  | 'carga_aerea_express'
  | 'paqueteria'

/** Tipo de contenedor estándar (cuando aplique). */
export type TipoContenedor =
  | '20ST'   // 20ft Standard
  | '40ST'   // 40ft Standard
  | '40HC'   // 40ft High Cube
  | '45HC'   // 45ft High Cube
  | '20RF'   // 20ft Reefer
  | '40RF'   // 40ft Reefer
  | '20OT'   // 20ft Open Top
  | '40OT'   // 40ft Open Top
  | '20FR'   // 20ft Flat Rack
  | '40FR'   // 40ft Flat Rack
  | '20TK'   // 20ft Tank
  | 'NA'     // no containerizada

/** Tipo de servicio de transitario (forwarding). */
export type TipoServicioTransitario =
  | 'fcl'    // Full Container Load
  | 'lcl'    // Less than Container Load
  | 'fcl_consolidacion'
  | 'lcl_consolidacion'
  | 'roro'
  | 'breakbulk'
  | 'air_cargo'
  | 'air_express'
  | 'rail_freight'
  | 'road_freight_ltl'  // Less than Truck Load
  | 'road_freight_ftl'  // Full Truck Load
  | 'multimodal'
  | 'aduanas_despacho'
  | 'almacenaje'
  | 'last_mile'

/** Régimen aduanero del envío. */
export type RegimenAduanero =
  | 'exportacion_definitiva'
  | 'importacion_definitiva'
  | 'transito_t1'
  | 'transito_t2'
  | 'deposito_aduanero'
  | 'zona_franca'
  | 'temporal_perfeccionamiento_activo'
  | 'temporal_perfeccionamiento_pasivo'
  | 'reexportacion'
  | 'no_aplica'  // tráfico intra-UE sin formalidades aduaneras

/** INCOTERMS 2020 (11 reglas). */
export type Incoterm2020 =
  | 'EXW'   // Ex Works
  | 'FCA'   // Free Carrier
  | 'FAS'   // Free Alongside Ship
  | 'FOB'   // Free On Board
  | 'CFR'   // Cost and Freight
  | 'CIF'   // Cost Insurance and Freight
  | 'CPT'   // Carriage Paid To
  | 'CIP'   // Carriage and Insurance Paid To
  | 'DAP'   // Delivered At Place
  | 'DPU'   // Delivered at Place Unloaded
  | 'DDP'   // Delivered Duty Paid

/** Clase de mercancía peligrosa según UN (cuando aplique). */
export type ClaseMercanciaPeligrosaUN =
  | '1'   // explosivos
  | '2.1' // gases inflamables
  | '2.2' // gases no inflamables
  | '2.3' // gases tóxicos
  | '3'   // líquidos inflamables
  | '4.1' // sólidos inflamables
  | '4.2' // sustancias combustión espontánea
  | '4.3' // sustancias que emiten gases inflamables con agua
  | '5.1' // sustancias comburentes
  | '5.2' // peróxidos orgánicos
  | '6.1' // sustancias tóxicas
  | '6.2' // sustancias infecciosas
  | '7'   // materiales radiactivos
  | '8'   // sustancias corrosivas
  | '9'   // mercancías peligrosas diversas

// ============================================================================
// LOCALIZACIONES · puertos · aeropuertos · terminales
// ============================================================================

/** Punto geográfico de origen/destino del transporte. */
export type PuntoLogistico = {
  /** Código UN/LOCODE (e.g. 'ESVLC' Valencia · 'NLRTM' Rotterdam · 'CNSHA' Shanghai). */
  un_locode: string
  /** Nombre legible del punto. */
  name: LocalizedLabel
  /** Tipo de instalación. */
  type: 'puerto_maritimo' | 'aeropuerto' | 'terminal_ferroviaria' | 'terminal_carretera' | 'almacen_aduanero' | 'cliente_directo'
  /** País ISO 3166-1 alpha-2. */
  country: ISOCountryCode
  /** Coordenadas opcionales (lat · lon). */
  coordinates?: {
    lat: number
    lon: number
  }
}

// ============================================================================
// MERCANCÍA · descripción y dimensiones
// ============================================================================

/** Descripción técnica de la mercancía a transportar. */
export type MercanciaDescripcion = {
  /** Descripción libre × 8 idiomas. */
  descripcion: LocalizedLabel
  /** Código HS arancelario (Sistema Armonizado · 6 dígitos mínimo · hasta 10
   *  dígitos según país). Obligatorio para operaciones cross-border. */
  codigo_hs?: string
  /** Peso bruto total en kilogramos. */
  peso_bruto_kg: number
  /** Peso neto total en kilogramos (opcional · obligatorio aduanas). */
  peso_neto_kg?: number
  /** Volumen total en metros cúbicos. */
  volumen_m3: number
  /** Número de bultos / unidades. */
  num_bultos?: number
  /** Tipo de embalaje (palets · cajas · sacos · bidones · bobinas · etc.). */
  tipo_embalaje?: string
  /** Valor declarado de la mercancía (para seguro). */
  valor_declarado?: {
    value: number
    currency: 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CNY' | 'BRL' | 'MXN'
  }
  /** ¿Mercancía peligrosa? Si true, debe rellenarse `mercancia_peligrosa`. */
  es_peligrosa: boolean
  /** Detalles si es mercancía peligrosa. */
  mercancia_peligrosa?: {
    clase_un: ClaseMercanciaPeligrosaUN
    /** Código UN del producto (e.g. 'UN1203' gasolina · 'UN1219' isopropanol). */
    codigo_un: string
    /** Grupo de embalaje (I = alto riesgo · II = medio · III = bajo). */
    grupo_embalaje?: 'I' | 'II' | 'III'
    /** Punto de inflamación si aplica (°C). */
    punto_inflamacion_c?: number
  }
  /** Requisitos de control de temperatura (mercancía perecedera o sensible). */
  control_temperatura?: {
    requerido: boolean
    temp_min_c?: number
    temp_max_c?: number
    humedad_max_pct?: number
  }
}

// ============================================================================
// HABILITACIÓN DE OPERADOR · LOTT + Reg. (CE) 1071/2009 / 1072/2009
// ============================================================================

/** Habilitación para ejercer como operador de transporte / transitario.
 *
 *  España: autorización de operador de transporte (LOTT Ley 16/1987 + ROTT
 *  RD 1211/1990 · competencia autonómica de otorgamiento). UE: acceso a la
 *  profesión de transportista por carretera (Reg. (CE) 1071/2009 · honorabilidad
 *  + capacidad financiera + competencia profesional del gestor de transporte +
 *  establecimiento). subject_to_expert (régimen autonómico + reforma LOTT). */
export type HabilitacionOperadorTransporte = {
  /** Nº de autorización de operador / actividad de intermediación. */
  numero_autorizacion: string
  /** ¿Acredita competencia profesional (gestor de transporte · Reg. 1071/2009)? */
  tiene_competencia_profesional: boolean
  /** País emisor (ISO 3166-1 alpha-2). */
  pais_emisor: ISOCountryCode
  /** PDF de la autorización. */
  pdf_autorizacion?: string
}

/** Seguro de responsabilidad del operador de transporte / transitario.
 *
 *  La responsabilidad del porteador en transporte internacional por carretera
 *  se rige por el Convenio CMR (1956). El transitario responde según su régimen
 *  de actuación (en nombre propio vs comisionista). */
export type SeguroResponsabilidadTransporte = {
  /** ¿Dispone de seguro de responsabilidad civil profesional? */
  tiene_rc_profesional: boolean
  /** Cobertura RC profesional (EUR). */
  cobertura_rc_eur?: number
  /** ¿Cubre la responsabilidad del porteador (CMR terrestre internacional)? */
  cubre_responsabilidad_cmr?: boolean
  /** Entidad aseguradora + nº de póliza. */
  poliza_ref?: string
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO TRANSITARIO (FORWARDING)
// ============================================================================

/** Ficha de servicio de forwarding ofrecido por un transitario.
 *  Caso de uso: transitario Valencia publica una ruta marítima recurrente
 *  Valencia → Shanghai con tarifa FCL 20ST + tiempo de tránsito 28 días + LCL
 *  consolidación semanal.
 */
export type ServicioTransitarioProduct = UniversalProduct & {
  sub_categoria: 'servicio_transitario'

  // -------------------- ROUTE & SCHEDULE --------------------
  modo: TransporteModo
  tipo_servicio: TipoServicioTransitario
  origen: PuntoLogistico
  destino: PuntoLogistico
  /** Puntos intermedios si es multimodal o con trasbordo. */
  trasbordos?: PuntoLogistico[]
  /** Tiempo medio de tránsito puerta a puerta en días. */
  tiempo_transito_dias_min: number
  tiempo_transito_dias_max: number
  /** Frecuencia del servicio si es recurrente. */
  frecuencia?: {
    dias_semana?: Array<'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'>
    salidas_por_mes?: number
  }
  /** Servicio spot vs recurrente. */
  es_spot: boolean

  // -------------------- CAPACIDADES --------------------
  tipo_carga_aceptada: TipoCarga[]
  tipos_contenedor_aceptados?: TipoContenedor[]
  capacidad_max_peso_kg?: number
  capacidad_max_volumen_m3?: number
  acepta_mercancia_peligrosa: boolean
  clases_un_aceptadas?: ClaseMercanciaPeligrosaUN[]
  acepta_carga_refrigerada: boolean

  // -------------------- COMERCIAL ESPECÍFICO --------------------
  incoterm_recomendado?: Incoterm2020
  incoterms_aceptados: Incoterm2020[]
  /** ¿Incluye seguro de mercancía? */
  incluye_seguro: boolean
  /** Cobertura del seguro si lo incluye (porcentaje del valor declarado). */
  cobertura_seguro_pct?: number

  // -------------------- HABILITACIÓN Y SEGUROS (Reg. 1071/2009 + LOTT + CMR) --------------------
  /** Habilitación de operador de transporte / transitario (LOTT + Reg. 1071/2009). */
  habilitacion_operador?: HabilitacionOperadorTransporte
  /** Licencia comunitaria de transporte por carretera (Art. 4 Reg. (CE)
   *  1072/2009 · obligatoria en transporte internacional con vehículos >2,5t
   *  desde 21-may-2022 · Reg. (UE) 2020/1055 Paquete de Movilidad). Solo aplica
   *  si el servicio implica transporte por carretera con medios propios. */
  licencia_comunitaria_1072_2009?: string
  /** Seguro de responsabilidad del transitario / porteador (CMR si carretera). */
  seguro_responsabilidad?: SeguroResponsabilidadTransporte

  // -------------------- ADUANAS Y COMPLIANCE --------------------
  realiza_despacho_aduanero: boolean
  /** Si el transitario está autorizado como AEO (Operador Económico Autorizado). */
  es_aeo: boolean
  /** Tipo de AEO si aplica. */
  tipo_aeo?: 'AEO-C' | 'AEO-S' | 'AEO-F'
  /** Regímenes aduaneros gestionados. */
  regimenes_aduaneros: RegimenAduanero[]

  // -------------------- TRACKING & TECNOLOGÍA --------------------
  /** ¿Ofrece tracking en tiempo real al cliente? */
  ofrece_tracking_realtime: boolean
  /** Tecnología de tracking usada. */
  tecnologia_tracking?: ('gps' | 'iot_sensores' | 'rfid' | 'barcode' | 'on_chain_xdc')[]
  /** ¿Emite e-Bill of Lading (eBL) on-chain XDC vía 1503? */
  emite_ebl_xdc: boolean

  // -------------------- PROVEEDORES UPSTREAM --------------------
  /** Navieras con las que el transitario tiene acuerdos preferentes. */
  navieras_partner?: string[]
  /** Compañías aéreas con las que tiene acuerdos preferentes. */
  aerolineas_partner?: string[]
}

// ============================================================================
// SUB-CATEGORÍA 2 · OPERACIÓN DE TRANSPORTE (CARGADOR)
// ============================================================================

/** Ficha de "necesidad de transporte" publicada por un cargador.
 *  Caso de uso: una constructora de Madrid necesita importar 240 toneladas de
 *  acero corrugado desde Vietnam · publica la operación y los transitarios
 *  cotizan. */
// v1.1: producto físico · extiende DPPProduct (UniversalProduct + 6 capas DPP A-F).
// La OPERACIÓN de transporte refleja la mercancía que viaja (NO el servicio
// del transitario). DPP completo materializa cadena de custodia G10 + Incoterms
// 2020 + convenios marítimos (Hague-Visby/Hamburgo) + UN/LOCODE + AWB documental
// si modo aéreo (NO opera W&B · ADR 0007 §2.7 matiz aviación canonizado).
// IMDG si mercancía peligrosa · EUDR si commodities Anexo I.
export type OperacionTransporteProduct = DPPProduct & {
  sub_categoria: 'operacion_transporte'

  // -------------------- ROUTE & SCHEDULE --------------------
  origen: PuntoLogistico
  destino: PuntoLogistico
  /** Fecha objetivo de salida (preferencia · negociable). */
  fecha_salida_objetivo?: string  // ISO date
  /** Fecha objetivo de llegada (preferencia · negociable). */
  fecha_llegada_objetivo?: string
  /** Modos de transporte aceptables (cargador puede aceptar varios). */
  modos_aceptados: TransporteModo[]
  /** Cargador prefiere un modo específico. */
  modo_preferido?: TransporteModo

  // -------------------- MERCANCÍA --------------------
  mercancia: MercanciaDescripcion

  // -------------------- TÉRMINOS COMERCIALES --------------------
  incoterm_propuesto: Incoterm2020
  /** Régimen aduanero esperado. */
  regimen_aduanero: RegimenAduanero
  /** Necesita seguro de mercancía. */
  requiere_seguro: boolean
  /** Necesita despacho aduanero (sí si cross-border non-UE). */
  requiere_despacho_aduanero: boolean
  /** Acepta consolidación con otra carga (LCL). */
  acepta_consolidacion: boolean

  // -------------------- ESCROW & PAGO --------------------
  /** Cargador propone modalidad de pago. */
  modalidad_pago_propuesta: '02_b2b_nacional' | '03_servicios' | '04_importacion'
  /** Cargador propone porcentajes de hitos para escrow 04_importacion. */
  hitos_pago_propuestos?: Array<{
    nombre_hito: LocalizedLabel
    porcentaje: number
    evento_disparador: 'firma_acuerdo' | 'embarque' | 'bl_emitido' | 'llegada_destino' | 'precinto_verificado' | 'aceptacion_cliente'
  }>

  // -------------------- COMPLIANCE --------------------
  /** Certificados que el cargador puede entregar (origen · sanitario · etc.). */
  certificados_disponibles: string[]  // IDs del registry _certifications
  /** Certificados que el cargador requiere del transitario contratado. */
  certificados_requeridos_transitario: string[]
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO NAVIERO / OPERADOR PORTUARIO
// ============================================================================

/** Ficha de capacidad publicada por una naviera o operador portuario.
 *  Caso de uso: naviera publica un slot disponible en su buque ruta
 *  Valencia → Hong Kong · escala Singapur · 200 TEU disponibles · ETD/ETA
 *  específicos. */
export type ServicioNavieroProduct = UniversalProduct & {
  sub_categoria: 'servicio_naviero'

  // -------------------- BUQUE / VUELO --------------------
  /** Tipo de operador (naviera de línea · charter · operador feeder). */
  tipo_operador: 'naviera_linea' | 'naviera_charter' | 'operador_feeder' | 'aerolinea_cargo' | 'operador_ferroviario'
  /** Nombre del buque · vuelo · convoy. */
  nombre_buque_o_vuelo?: string
  /** IMO number del buque (si naviera marítima · 7 dígitos). */
  imo_number?: string
  /** Voyage number. */
  voyage_number?: string

  // -------------------- ROUTE & SCHEDULE --------------------
  origen: PuntoLogistico
  destino: PuntoLogistico
  /** Escalas intermedias. */
  escalas?: PuntoLogistico[]
  /** ETD · Estimated Time of Departure. */
  etd: string  // ISO datetime
  /** ETA · Estimated Time of Arrival. */
  eta: string

  // -------------------- CAPACIDAD --------------------
  /** Capacidad total del buque/vuelo en TEU (maritime) o toneladas (air/rail). */
  capacidad_total_teu?: number
  capacidad_total_toneladas?: number
  /** Capacidad disponible en este momento (post-bookings). */
  capacidad_disponible_teu?: number
  capacidad_disponible_toneladas?: number
  /** Tipos de contenedor aceptados. */
  tipos_contenedor_aceptados?: TipoContenedor[]
  /** Acepta reefer (refrigerado)? */
  acepta_reefer: boolean
  /** Acepta mercancía peligrosa IMDG/IATA/ADR? */
  acepta_mercancia_peligrosa: boolean

  // -------------------- TARIFAS --------------------
  /** Tarifa base por TEU 20ST (si maritime). */
  tarifa_base_20ST?: number
  /** Tarifa base por TEU 40ST. */
  tarifa_base_40ST?: number
  /** Tarifa base por kg (si air cargo). */
  tarifa_base_kg?: number
  /** Recargos aplicables (BAF · CAF · SECA · etc.). */
  recargos?: Array<{
    codigo: string  // 'BAF' · 'CAF' · 'SECA' · 'PSS' · 'CIC'
    descripcion: LocalizedLabel
    valor: number
    es_porcentaje: boolean
  }>

  // -------------------- HABILITACIÓN Y SEGUROS --------------------
  /** ¿Dispone de seguro de Protección e Indemnización (P&I Club)? */
  tiene_seguro_pi?: boolean
  /** Nº de registro como naviera / consignatario de buques / operador (si aplica). */
  registro_operador_id?: string

  // -------------------- DOCUMENTACIÓN --------------------
  emite_bl_papel: boolean
  emite_ebl_xdc: boolean
  /** Estándar e-B/L soportado si aplica. */
  ebl_standard?: 'DCSA' | 'IMO_FAL' | 'BIMCO' | '1503_XDC'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector TRANSPORTE
// ============================================================================

export type TransporteProduct =
  | ServicioTransitarioProduct
  | OperacionTransporteProduct
  | ServicioNavieroProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking.
 *  v1.0 → v1.1: añadidos campos de habilitación de operador (LOTT + Reg. 1071/2009),
 *  licencia comunitaria (Reg. 1072/2009 + 2020/1055) y seguros de responsabilidad
 *  (todos opcionales · backwards-compatible) para enforcement de cumplimiento. */
export const TRANSPORTE_SCHEMA_VERSION = 'transporte@1.1' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta que sea revisado por:
 *   - Junta ATEIA Valencia (Asociación de Transitarios)
 *   - FETEIA (federación nacional)
 *   - Al menos 2 transitarios PYMEs ATEIA Valencia
 *   - 1 naviera operadora Valenciaport
 *   - Auditoría jurídica especialista comercio internacional (UCP 600 · CMR · ADR · IMDG)
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación).
 */
export const TRANSPORTE_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioTransitario(p: TransporteProduct): p is ServicioTransitarioProduct {
  return p.sub_categoria === 'servicio_transitario'
}

export function isOperacionTransporte(p: TransporteProduct): p is OperacionTransporteProduct {
  return p.sub_categoria === 'operacion_transporte'
}

export function isServicioNaviero(p: TransporteProduct): p is ServicioNavieroProduct {
  return p.sub_categoria === 'servicio_naviero'
}

// ============================================================================
// HELPERS DE CUMPLIMIENTO
// ============================================================================

/** ¿El servicio de transitario requiere habilitación de operador de transporte
 *  (LOTT + Reg. (CE) 1071/2009 · acceso a la profesión)? Todo transitario que
 *  presta el servicio profesionalmente. */
export function requiereHabilitacionOperador(p: TransporteProduct): boolean {
  return isServicioTransitario(p)
}

/** ¿El servicio de transitario requiere licencia comunitaria de transporte por
 *  carretera (Art. 4 Reg. (CE) 1072/2009 · transporte internacional con medios
 *  propios >2,5t · Reg. (UE) 2020/1055)? Aplica a servicios de carretera. */
export function requiereLicenciaComunitaria1072(p: TransporteProduct): boolean {
  if (!isServicioTransitario(p)) return false
  const esCarretera = p.modo === 'terrestre_carretera' || p.modo === 'multimodal'
  return esCarretera && (
    p.tipo_servicio === 'road_freight_ftl' ||
    p.tipo_servicio === 'road_freight_ltl' ||
    p.tipo_servicio === 'multimodal'
  )
}
