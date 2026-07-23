// Schema sectorial INMOBILIARIO · Fase 6 piloto plantilla canónica.
//
// El sector inmobiliario es la plantilla canónica de 1503 (origen del
// nombre del proyecto · sector más maduro en términos de regulación · más
// volumen documental por operación · típicamente >50 certificados/permisos
// distintos en una compra-venta internacional).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector INMOBILIARIO puede
// publicar):
//
// 1. InmuebleProduct · oferta de un inmueble concreto (venta · alquiler ·
//    traspaso · opción de compra). Cubre los 8 tipos: vivienda · local
//    comercial · oficina · industrial · parcela · edificio · garaje · trastero.
//
// 2. NecesidadInmobiliariaProduct · "necesidad" publicada por un cliente
//    (busco oficina 200m² Madrid centro · busco nave industrial Valencia
//    para 2026Q3 · etc.). Los oferentes responden con propuestas.
//
// 3. ServicioProfesionalInmobiliarioProduct · servicios profesionales del
//    sector (tasación oficial · arquitectura · ITE/IEE · gestoría · home
//    staging · property management · etc.).
//
// Cada sub-categoría extiende UniversalProduct + añade sus campos específicos.
//
// MULTI-PAÍS: aunque España es el mercado primario, los campos legales
// están parametrizados para soportar otros sistemas registrales:
//   - ES: referencia_catastral · nota simple Registro Propiedad · IEE
//   - PT: matriz predial · ficha técnica habitação · CE
//   - FR: numéro cadastral · titre de propriété · DPE
//   - DE: Grundbuch + Flurstücksnummer · Energieausweis
//   - UK: Title number HM Land Registry · EPC
//   - US: APN (Assessor's Parcel Number) · Deed · Energy Star
//   - JP: 不動産登記簿 + 地番 · BELS
//
// schema_status: 'draft' (pendiente validación experta sectorial · AEGI ·
// Colegio Oficial Registradores · Colegio Notarios · Colegio Arquitectos +
// 2 inmobiliarias PYMEs + 1 tasador homologado + asesoría jurídica
// especialista LSSI-CE + RGPD).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de operación sobre un inmueble. */
export type InmobiliarioOperacion =
  | 'venta'
  | 'alquiler'
  | 'alquiler_con_opcion_compra'
  | 'traspaso'              // típicamente local comercial · negocio
  | 'opcion_compra'         // derecho de adquisición futura
  | 'subasta'               // bien subastado (Notaría · BOE · judicial)
  | 'permuta'               // intercambio sin metálico
  | 'venta_con_alquiler'    // sale-and-leaseback (institucional)

/** Tipo de inmueble. */
export type InmobiliarioTipo =
  | 'vivienda'
  | 'local_comercial'
  | 'oficina'
  | 'industrial'            // nave · polígono · logística
  | 'hostelero'             // hotel · restaurante · bar
  | 'parcela'               // urbano · rústico
  | 'edificio'              // edificio completo
  | 'garaje'
  | 'trastero'
  | 'agricola'              // explotación agrícola
  | 'forestal'
  | 'singular'              // castillo · monasterio · finca histórica

/** Subtipo de vivienda (si tipo='vivienda'). */
export type ViviendaSubtipo =
  | 'piso'
  | 'atico'
  | 'duplex'
  | 'estudio'
  | 'loft'
  | 'chalet_independiente'
  | 'chalet_adosado'
  | 'chalet_pareado'
  | 'casa_rural'
  | 'finca_rustica'
  | 'masia'
  | 'palacete'

/** Calificación energética A-G (UE · Directiva 2010/31/EU recast 2018). */
export type CertificadoEnergetico = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/** Estado de conservación general. */
export type EstadoConservacion =
  | 'obra_nueva'
  | 'reformado_completo'   // reforma integral <5 años
  | 'reformado_parcial'    // cocina/baños reformados
  | 'buen_estado'
  | 'a_reformar'
  | 'para_derribar'
  | 'rehabilitacion_pendiente'

/** Calificación urbanística (España · CTE + LOE). Adaptable a otros países. */
export type CalificacionUrbanistica =
  | 'urbano_consolidado'
  | 'urbano_no_consolidado'
  | 'urbanizable_sectorizado'
  | 'urbanizable_no_sectorizado'
  | 'no_urbanizable_proteccion'
  | 'no_urbanizable_comun'
  | 'sistema_general'
  | 'desconocido'

/** Régimen de protección oficial (España · VPO · VPP · etc.). */
export type RegimenProteccion =
  | 'libre'
  | 'vpo_general'           // Vivienda Protección Oficial régimen general
  | 'vpo_especial'          // régimen especial precios reducidos
  | 'vpp_basica'            // Vivienda Protección Pública básica
  | 'vpp_concertada'
  | 'vivienda_tasada'
  | 'vivienda_social'       // alquiler asequible público
  | 'cooperativa'

/** Orientación cardinal. */
export type Orientacion =
  | 'N' | 'S' | 'E' | 'O'
  | 'NE' | 'NO' | 'SE' | 'SO'
  | 'multiple'  // pasante o esquina con varias orientaciones

/** Sistema de calefacción. */
export type SistemaCalefaccion =
  | 'gas_natural'
  | 'gas_propano'
  | 'gasoil'
  | 'electrica'
  | 'biomasa_pellet'
  | 'biomasa_lena'
  | 'aerotermia'
  | 'geotermia'
  | 'placas_solares_termicas'
  | 'central_edificio'
  | 'radiadores_individuales_no_centralizados'
  | 'no_dispone'

/** Sistema de refrigeración. */
export type SistemaRefrigeracion =
  | 'aire_acondicionado_split'
  | 'aire_acondicionado_central'
  | 'aerotermia'
  | 'ventilacion_natural'
  | 'no_dispone'

/** Sistema de agua caliente sanitaria. */
export type SistemaACS =
  | 'gas'
  | 'electrico_termo'
  | 'placas_solares_termicas'
  | 'aerotermia'
  | 'central_edificio'

// ============================================================================
// PUNTO GEOGRÁFICO · ubicación del inmueble
// ============================================================================

/** Ubicación geográfica + administrativa de un inmueble. */
export type UbicacionInmueble = {
  pais: ISOCountryCode

  /** División administrativa nivel 1 · CCAA (ES) · Land (DE) · State (US) ·
   *  Région (FR) · etc. */
  region?: string

  /** División administrativa nivel 2 · provincia · departamento · county. */
  provincia_estado?: string

  /** Municipio · ciudad. */
  municipio: string

  /** Distrito · barrio · arrondissement · district. */
  distrito?: string

  /** Dirección postal · calle + número (NO se publica para venta · sí para
   *  alquiler). */
  direccion?: string

  /** Código postal. */
  codigo_postal: string

  /** Coordenadas geográficas (lat/lng WGS84). */
  coordenadas?: { lat: number; lng: number }

  /** Identificador registral catastral específico por país.
   *
   *  ES: referencia catastral 20 caracteres (formato AAAA BBBBB CCCC DDDD EE)
   *  PT: artigo matricial (predial urbano/rústico)
   *  FR: numéro cadastral (commune + section + numéro)
   *  DE: Flurstücksnummer (Gemarkung + Flur + Flurstück)
   *  UK: Title number HM Land Registry (e.g. SY12345)
   *  US: APN (Assessor's Parcel Number) por condado
   *  JP: 地番 (chiban)
   */
  identificador_catastral?: string

  /** Para ES: referencia catastral oficial (20 caracteres). Se valida con
   *  helper isValidReferenciaCatastralES en _validators.ts. */
  referencia_catastral_es?: string

  /** Para UK: Title Number HM Land Registry. */
  title_number_uk?: string

  /** Para DE: Grundbuch (Amtsgericht + número + folio). */
  grundbuch_de?: {
    amtsgericht: string
    blattnummer: string
  }
}

// ============================================================================
// SUPERFICIE
// ============================================================================

/** Superficies del inmueble. Todas en metros cuadrados. */
export type SuperficieInmueble = {
  /** Superficie útil (descontando muros · patios interiores no vivibles). */
  util_m2?: number
  /** Superficie construida (incluyendo muros propios + 50% comunes). */
  construida_m2?: number
  /** Superficie de parcela (terreno) si es edificio · chalet · industrial. */
  parcela_m2?: number
  /** Superficie de terraza descubierta. */
  terraza_m2?: number
  /** Superficie de jardín privado. */
  jardin_m2?: number
  /** Superficie de garaje incluido si forma parte del inmueble. */
  garaje_m2?: number
  /** Superficie de trastero/bodega. */
  trastero_m2?: number
  /** Para inmuebles industriales · altura libre interior (metros). */
  altura_libre_m?: number
}

// ============================================================================
// DOCUMENTACIÓN LEGAL · IEE + CÉDULA + NOTA SIMPLE + LICENCIAS
// ============================================================================

/** Certificado de Eficiencia Energética (IEE/CEE).
 *  Obligatorio en ES desde RD 235/2013 y en mayoría de la UE (Directiva
 *  2010/31/EU). */
export type DocumentoIEE = {
  certificado_energetico: CertificadoEnergetico
  /** Consumo energía primaria no renovable kWh/m²·año. */
  consumo_kwh_m2_year: number
  /** Emisiones de CO2 kg/m²·año. */
  emisiones_kg_co2_m2_year: number
  /** Fecha de emisión (ISO 8601). */
  fecha_emision: string
  /** Fecha de caducidad (ES: 10 años desde emisión). */
  fecha_caducidad: string
  /** Técnico certificador (nombre + colegio profesional). */
  tecnico_certificador: string
  /** Número de colegiado / registro oficial. */
  colegiado_numero?: string
  /** URL al PDF del certificado oficial. */
  pdf_url: string
  /** Número de registro en organismo autonómico (CCAA ES). */
  numero_registro_ccaa?: string
}

/** Cédula de Habitabilidad (ES · CCAA Cataluña/Valencia/etc.).
 *  Obligatoria para vivienda en algunas CCAA · permite contratos de
 *  suministros (agua · luz · gas). */
export type DocumentoCedulaHabitabilidad = {
  numero: string
  fecha_emision: string
  fecha_caducidad: string
  organismo_emisor: string  // e.g. 'Generalitat de Catalunya'
  pdf_url: string
}

/** Tipo de carga registral sobre un inmueble. */
export type TipoCargaRegistral =
  | 'hipoteca'
  | 'embargo_judicial'
  | 'embargo_administrativo'  // Hacienda · Seg. Social
  | 'servidumbre_paso'
  | 'servidumbre_luces'
  | 'servidumbre_otra'
  | 'usufructo'
  | 'derecho_uso_habitacion'
  | 'derecho_tanteo_retracto'
  | 'condicion_resolutoria'
  | 'opcion_compra_inscrita'
  | 'arrendamiento_inscrito'
  | 'censo'                    // figura registral histórica
  | 'limitacion_disposicion'
  | 'otra'

/** Carga registral concreta. */
export type CargaRegistral = {
  tipo: TipoCargaRegistral
  /** Descripción libre. */
  descripcion: string
  /** Importe pendiente si carga económica (hipoteca · embargo). */
  importe_pendiente?: number
  /** Acreedor / beneficiario. */
  acreedor?: string
  /** Fecha de inscripción. */
  fecha_inscripcion?: string
}

/** Nota Simple Registral (ES · Registro Propiedad).
 *  Obligatoria para validar titularidad + cargas antes de venta. */
export type DocumentoNotaSimple = {
  fecha_emision: string
  registro_propiedad: string  // e.g. 'Registro Propiedad nº 7 Madrid'
  finca_numero: string
  titular_actual: string
  cargas: CargaRegistral[]
  pdf_url: string
}

/** Licencia administrativa (obra · primera ocupación · actividad). */
export type DocumentoLicencia = {
  tipo: 'obra_mayor' | 'obra_menor' | 'primera_ocupacion' | 'actividad' | 'apertura' | 'rehabilitacion'
  numero_expediente: string
  fecha_concesion: string
  organismo: string  // Ayuntamiento · Comunidad Autónoma
  pdf_url: string
}

// ============================================================================
// CARACTERÍSTICAS / EQUIPAMIENTO DEL INMUEBLE
// ============================================================================

export type CaracteristicasInmueble = {
  /** Número de habitaciones (dormitorios). */
  habitaciones?: number
  /** Número de baños completos. */
  banos?: number
  /** Número de aseos (baños sin ducha/bañera). */
  aseos?: number
  /** Planta del inmueble (si vivienda en edificio). 0 = bajo · -1 = sótano. */
  planta?: number
  /** Plantas totales del edificio. */
  plantas_edificio?: number
  /** Año de construcción del edificio/inmueble. */
  ano_construccion?: number
  /** Año de la última reforma integral. */
  ano_ultima_reforma?: number
  /** Estado de conservación. */
  estado_conservacion: EstadoConservacion
  /** Calificación urbanística (parcelas · industriales). */
  calificacion_urbanistica?: CalificacionUrbanistica
  /** Régimen de protección. */
  regimen_proteccion?: RegimenProteccion
  /** Orientación cardinal. */
  orientacion?: Orientacion

  // -------------------- EQUIPAMIENTO BÁSICO --------------------
  ascensor: boolean
  garaje_incluido: boolean
  plazas_garaje?: number
  trastero_incluido: boolean
  piscina_comunitaria: boolean
  piscina_privada: boolean
  jardin_privado: boolean
  terraza: boolean
  balcon: boolean
  parking_visitas: boolean
  zonas_comunes_deportivas: boolean  // gimnasio · padel · etc.
  conserje_24h: boolean
  videoportero: boolean
  alarma_seguridad: boolean

  // -------------------- INSTALACIONES --------------------
  sistema_calefaccion?: SistemaCalefaccion
  sistema_refrigeracion?: SistemaRefrigeracion
  sistema_acs?: SistemaACS
  /** Dispone de fibra óptica instalada. */
  fibra_optica: boolean
  /** Dispone de placas solares fotovoltaicas. */
  placas_solares_fv: boolean
  /** Potencia eléctrica contratada (kW). */
  potencia_kw?: number

  // -------------------- ACCESIBILIDAD --------------------
  accesibilidad_silla_ruedas: boolean
  /** Adaptado normativa accesibilidad universal (DALCO en ES). */
  cumple_accesibilidad_universal: boolean

  // -------------------- ADICIONAL --------------------
  amueblado: boolean
  electrodomesticos_incluidos: boolean
  /** Admite mascotas (relevante para alquiler). */
  admite_mascotas: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · OFERTA DE INMUEBLE (venta · alquiler · traspaso · etc.)
// ============================================================================

/** Ficha de oferta de un inmueble concreto publicada por un propietario,
 *  promotor o agencia inmobiliaria. */
export type InmuebleProduct = UniversalProduct & {
  sub_categoria: 'inmueble'

  // -------------------- TIPO + OPERACIÓN --------------------
  tipo: InmobiliarioTipo
  /** Subtipo si tipo='vivienda'. */
  subtipo_vivienda?: ViviendaSubtipo
  operacion: InmobiliarioOperacion

  // -------------------- SUPERFICIE + UBICACIÓN --------------------
  superficie: SuperficieInmueble
  ubicacion: UbicacionInmueble

  // -------------------- CARACTERÍSTICAS --------------------
  caracteristicas: CaracteristicasInmueble

  // -------------------- DOCUMENTACIÓN LEGAL --------------------
  /** IEE/CEE · obligatorio venta/alquiler en mayoría de UE. */
  iee?: DocumentoIEE
  /** Cédula habitabilidad · obligatoria en algunas CCAA ES para vivienda. */
  cedula_habitabilidad?: DocumentoCedulaHabitabilidad
  /** Nota simple registral · obligatoria para venta ES. */
  nota_simple_registral?: DocumentoNotaSimple
  /** Licencias asociadas (obra · primera ocupación · actividad). */
  licencias?: DocumentoLicencia[]
  /** Tasación oficial homologada (Banco España · TINSA · ST · etc.). */
  tasacion_oficial?: {
    valor_tasacion: number
    moneda: string
    fecha_tasacion: string
    sociedad_tasadora: string
    numero_homologacion?: string
    pdf_url: string
  }

  // -------------------- INFORMACIÓN ECONÓMICA EXTENDIDA --------------------
  /** Importes adicionales del inmueble (IBI · comunidad · derrama). */
  gastos_anuales?: {
    ibi_eur?: number
    comunidad_eur_mes?: number
    derrama_pendiente_eur?: number
    seguro_obligatorio_eur?: number
  }
  /** Para alquiler: depósito + duración mínima. */
  alquiler_condiciones?: {
    deposito_meses: number          // típicamente 1-2 meses
    duracion_minima_meses: number   // típicamente 12 ES (LAU 5 años opcional inquilino)
    incluye_suministros: boolean
    importe_renta_eur_mes: number
    actualizacion_renta?: 'ipc' | 'igc' | 'fija' | 'ninguna'
  }

  // -------------------- MARKETING / VISITAS --------------------
  fotos_360_urls?: string[]
  video_tour_url?: string
  plano_planta_urls?: string[]
  /** Acepta visitas virtuales (Three.js · Matterport · etc.). */
  acepta_visitas_virtuales: boolean
  /** Disponibilidad de visita presencial. */
  disponibilidad_visita?: {
    dias_semana: Array<'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'>
    horario?: string  // e.g. '10:00-14:00 y 17:00-20:00'
  }

  // -------------------- DECLARACIONES LEGALES (LSSI-CE + RGPD) --------------------
  /** El publicante declara ser propietario legítimo · agente con mandato
   *  escrito · promotor titular · o representante con poder notarial. */
  declaracion_propietario_legitimo: boolean
  /** El publicante autoriza apostilla electrónica para cierre cross-border
   *  Fase 8 (notariado integrado). */
  acepta_apostilla_electronica_cross_border?: boolean
  /** Estado de la operación (libre · reservado · vendido). */
  estado_operacion: 'disponible' | 'reservado' | 'opcion_firmada' | 'cerrado' | 'retirado'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD INMOBILIARIA (cliente busca)
// ============================================================================

/** Ficha publicada por un comprador/inquilino que busca un inmueble concreto.
 *  Caso de uso: family office busca oficina 500m² Madrid centro precio
 *  máximo 5M€ · publica la necesidad y propietarios/agencias responden. */
export type NecesidadInmobiliariaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_inmobiliaria'

  // -------------------- QUÉ BUSCA --------------------
  tipos_aceptados: InmobiliarioTipo[]
  subtipos_vivienda_aceptados?: ViviendaSubtipo[]
  operaciones_aceptadas: InmobiliarioOperacion[]

  // -------------------- DÓNDE --------------------
  /** Zonas geográficas de interés (admite varias ciudades/distritos). */
  zonas_interes: Array<{
    pais: ISOCountryCode
    region?: string
    municipio: string
    distrito?: string
    /** Radio en km desde el centro del distrito/municipio si flexible. */
    radio_km?: number
  }>

  // -------------------- PRESUPUESTO --------------------
  /** Importe máximo dispuesto a pagar (venta) o renta máxima mensual (alquiler). */
  presupuesto_max: number
  presupuesto_min?: number
  /** Moneda del presupuesto. */
  moneda_presupuesto: string
  /** Para alquiler: la cifra de presupuesto es renta mensual. */
  es_renta_mensual: boolean

  // -------------------- REQUISITOS --------------------
  superficie_min_m2?: number
  superficie_max_m2?: number
  habitaciones_min?: number
  banos_min?: number
  ano_construccion_min?: number
  /** Calificación energética mínima aceptable. */
  cee_min?: CertificadoEnergetico
  /** Requisitos imprescindibles ("must-have"). */
  requisitos_imprescindibles?: LocalizedLabel[]
  /** Requisitos deseables ("nice-to-have"). */
  requisitos_deseables?: LocalizedLabel[]

  // -------------------- TIMING --------------------
  /** Fecha objetivo de entrada/cierre. */
  fecha_objetivo?: string  // ISO date
  /** Urgencia · si el comprador necesita decisión rápida. */
  urgencia: 'baja' | 'media' | 'alta' | 'inmediata'

  // -------------------- FINANCIACIÓN --------------------
  /** Acredita pre-aprobación bancaria. */
  preaprobacion_bancaria?: {
    entidad: string
    importe_aprobado: number
    fecha_aprobacion: string
    pdf_url: string
  }
  /** Comprador es contado (sin financiación). */
  es_compra_contado: boolean

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '02_b2b_nacional' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO PROFESIONAL INMOBILIARIO
// ============================================================================

/** Tipo de servicio profesional inmobiliario. */
export type TipoServicioInmobiliario =
  | 'tasacion_oficial'        // sociedad tasadora homologada Banco España
  | 'tasacion_pericial'       // perito tasador
  | 'arquitectura_proyecto'
  | 'arquitectura_direccion_obra'
  | 'aparejador_arquitecto_tecnico'
  | 'ingenieria_estructuras'
  | 'gestoria_inmobiliaria'   // tramitación + paperwork
  | 'notaria_especializada'   // notarial para inmobiliario
  | 'registro_propiedad'      // gestión inscripción registral
  | 'asesoria_juridica'       // abogado inmobiliario
  | 'asesoria_fiscal'         // fiscal inmobiliario (plusvalía · ITP · etc.)
  | 'iee_certificacion'       // técnico certificador IEE
  | 'cedula_habitabilidad'    // técnico para cédula
  | 'ite_iee_edificios'       // Inspección Técnica de Edificios
  | 'home_staging'            // preparación marketing inmueble
  | 'fotografia_inmobiliaria'
  | 'tour_virtual_3d'
  | 'gestion_alquiler'        // property management ongoing
  | 'reformas_integrales'
  | 'mudanzas_certificadas'
  | 'limpieza_postobra'
  | 'desinfeccion_certificada'
  | 'topografia_levantamiento'
  | 'estudio_geotecnico'
  | 'consultoria_urbanistica'
  | 'mediacion_compraventa'   // mediación inmobiliaria
  | 'gestion_subasta'

/** Ficha de servicio profesional inmobiliario ofertado por un Actor (perito ·
 *  arquitecto · gestor · etc.). */
export type ServicioProfesionalInmobiliarioProduct = UniversalProduct & {
  sub_categoria: 'servicio_profesional_inmobiliario'

  // -------------------- TIPO DE SERVICIO --------------------
  tipo_servicio: TipoServicioInmobiliario

  // -------------------- ÁMBITO GEOGRÁFICO --------------------
  /** Países donde presta servicio. */
  paises_cobertura: ISOCountryCode[]
  /** Si país=ES: provincias cubiertas (códigos INE 2 dígitos). */
  provincias_es?: string[]
  /** Si trabaja remoto (asesoría jurídica · fiscal). */
  ofrece_servicio_remoto: boolean

  // -------------------- ACREDITACIONES PROFESIONALES --------------------
  /** Colegio profesional aplicable (registro). */
  colegiacion?: {
    colegio: string             // e.g. 'Colegio Oficial Arquitectos Madrid'
    numero_colegiado: string
    fecha_alta: string
    cuotas_al_dia: boolean
    pdf_certificado?: string
  }
  /** Para tasadoras: homologación Banco España. */
  homologacion_banco_espana?: {
    numero_registro: string
    fecha_homologacion: string
    sociedad_tasadora: string
    pdf_url: string
  }
  /** Seguro de responsabilidad civil profesional (obligatorio mucha
   *  profesión inmobiliaria). */
  seguro_rcp?: {
    aseguradora: string
    poliza_numero: string
    cobertura_max_eur: number
    fecha_vencimiento: string
    pdf_url: string
  }
  /** Años de experiencia en el servicio concreto. */
  anos_experiencia?: number
  /** Idiomas en que ofrece el servicio. */
  idiomas: string[]  // ISO 639-1 codes

  // -------------------- TARIFAS --------------------
  /** Modelo de tarifa. */
  modelo_tarifa: 'fija' | 'por_hora' | 'porcentaje_valor' | 'por_proyecto' | 'mixta'
  /** Tarifa base sin IVA. */
  tarifa_base?: number
  /** Moneda. */
  moneda_tarifa?: string
  /** Si porcentaje: % aplicable. */
  tarifa_porcentaje?: number
  /** Importe mínimo del servicio. */
  importe_minimo?: number
  /** Plazo de entrega habitual (días laborables). */
  plazo_entrega_dias?: number

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
  /** Hitos de pago si modalidad 03_servicios. */
  hitos_pago?: Array<{
    nombre_hito: LocalizedLabel
    porcentaje: number
    evento_disparador:
      | 'firma_acuerdo'
      | 'entrega_borrador'
      | 'entrega_final'
      | 'visado_colegio'
      | 'inscripcion_registral'
      | 'aceptacion_cliente'
  }>
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector INMOBILIARIO
// ============================================================================

export type InmobiliarioProduct =
  | InmuebleProduct
  | NecesidadInmobiliariaProduct
  | ServicioProfesionalInmobiliarioProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const INMOBILIARIO_SCHEMA_VERSION = 'inmobiliario@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta que sea revisado por:
 *   - AEGI (Asociación Empresarial de Gestión Inmobiliaria)
 *   - Consejo General del Notariado (CGN)
 *   - Colegio Oficial de Registradores de la Propiedad
 *   - Colegio Oficial de Arquitectos (COAM o equivalente provincial)
 *   - 2 inmobiliarias PYMEs operando España + Portugal
 *   - 1 tasador homologado Banco España
 *   - Auditoría jurídica especialista LSSI-CE + RGPD
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación).
 */
export const INMOBILIARIO_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isInmueble(p: InmobiliarioProduct): p is InmuebleProduct {
  return p.sub_categoria === 'inmueble'
}

export function isNecesidadInmobiliaria(p: InmobiliarioProduct): p is NecesidadInmobiliariaProduct {
  return p.sub_categoria === 'necesidad_inmobiliaria'
}

export function isServicioProfesionalInmobiliario(
  p: InmobiliarioProduct,
): p is ServicioProfesionalInmobiliarioProduct {
  return p.sub_categoria === 'servicio_profesional_inmobiliario'
}
