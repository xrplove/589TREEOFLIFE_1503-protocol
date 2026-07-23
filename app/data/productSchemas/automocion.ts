// Schema sectorial AUTOMOCIÓN · Fase 6 bloque D.5.
//
// Sector con regulación técnica muy densa: homologación europea de tipo
// (Reg. UE 2018/858) · seguridad general (Reg. UE 2019/2144 GSR2) ·
// emisiones (Reg. CE 715/2007 Euro 5/6 + Reg. UE 2017/1151 WLTP) ·
// identificación VIN ISO 3779 · ITV nacional (RD 920/2017 ES) ·
// transición electromovilidad (Reg. UE 2023/851 fin venta ICE turismos
// 2035 · Reg. UE 2023/1804 AFIR infraestructura recarga) · distintivos
// ambientales DGT (ES desde 2016).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector AUTOMOCIÓN
// puede publicar):
//
// 1. VehiculoProduct · oferta de vehículo concreto (turismo · comercial ·
//    industrial · moto · agrícola · náutico · aeronáutico ligero ·
//    nuevo · seminuevo · ocasión · vintage · clásico). Cubre venta ·
//    alquiler · renting · leasing · suscripción · subasta · permuta.
//
// 2. NecesidadAutomocionProduct · cliente busca vehículo o flota
//    (particular busca SUV híbrido enchufable Madrid · empresa busca
//    flota 20 furgones eléctricos para 2027 · gestor de flotas busca
//    renting 3 años 50 turismos · agricultor busca tractor 120 cv).
//
// 3. ServicioAutomocionProduct · servicios profesionales del sector
//    (estación ITV homologada · taller autorizado fabricante · taller
//    chapa y pintura · concesionario · tasación pericial · gestoría
//    matriculación · asistencia grúa · peritaje siniestros · alquiler
//    corto · renting · leasing financiero · instalación punto recarga ·
//    car sharing · suscripción · auto-escuela · formación carnet).
//
// MULTI-PAÍS: campos parametrizados:
//   - ES: matrícula sistema 1971/2000 · DGT · MOT/ITV · distintivo C/Eco/0
//   - PT: matrícula portuguesa · IMT · IPO inspecção
//   - FR: numéro d'immatriculation SIV · Crit'Air vignette
//   - DE: Kennzeichen · TÜV/Dekra Hauptuntersuchung · Umweltplakette
//   - IT: targa · Revisione · classe ambientale
//   - UK: registration plate · MOT · ULEZ Compliance
//   - US: VIN-based registration + state-specific plates · CARB · DMV
//   - JP: 番号標 · Shaken (car inspection)
//
// schema_status: 'draft' (pendiente validación experta · ANFAC Asociación
// Nacional Fabricantes Automoción · SERNAUTO componentes · GANVAM gestión
// vehículos · FACONAUTO concesionarios · CETM transporte mercancías ·
// AECA-ITV · 2 talleres autorizados PYMEs · 1 perito tasador colegiado ·
// auditoría jurídica especialista derecho automoción + datos vehículo +
// homologación CE + electromovilidad).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Categoría de vehículo. Alineada con Reg. UE 2018/858 categorías M/N/O/L/T
 *  + extensiones náutica y aeronáutica ligera. */
export type CategoriaVehiculo =
  | 'turismo_m1'                        // < 9 plazas + conductor
  | 'autocar_m2_m3'                     // > 9 plazas
  | 'comercial_ligero_n1'               // < 3.500 kg MMA
  | 'industrial_medio_n2'               // 3.500-12.000 kg MMA
  | 'industrial_pesado_n3'              // > 12.000 kg MMA
  | 'remolque_o1_o2_o3_o4'              // remolques
  | 'motocicleta_l3e_l4e'               // motos
  | 'ciclomotor_l1e_l2e'                // ciclomotores
  | 'cuatriciclo_l6e_l7e'               // cuadriciclos
  | 'tractor_agricola_t'                // tractores agrícolas
  | 'maquinaria_obra_publica'           // excavadoras · grúas obra
  | 'maquinaria_industrial'             // carretillas elevadoras
  | 'embarcacion_recreativa'            // < 24m eslora
  | 'embarcacion_pesca_comercial'
  | 'aeronave_ligera_ultraligera'       // ULM · LSA
  | 'vehiculo_especial_ambulancia_bombero_policia'

/** Tipo de carrocería (turismos y comerciales). */
export type TipoCarroceria =
  | 'berlina_sedan'
  | 'hatchback'
  | 'familiar_station_wagon'
  | 'suv'
  | 'todoterreno_4x4'
  | 'crossover'
  | 'monovolumen'
  | 'coupe'
  | 'cabriolet'
  | 'pickup'
  | 'furgon_panel'
  | 'furgoneta_pasajeros'
  | 'camion_rigido'
  | 'camion_articulado'
  | 'volquete_dumper'
  | 'plataforma'
  | 'cisterna'
  | 'frigorifico_isotermo'

/** Tipo de motorización · cubre ICE clásico, híbridos y cero emisiones. */
export type TipoMotorizacion =
  | 'gasolina'
  | 'diesel'
  | 'hibrido_micro_mhev'                // mild hybrid 48V
  | 'hibrido_completo_hev'              // self-charging hybrid
  | 'hibrido_enchufable_phev'           // plug-in hybrid
  | 'electrico_bev'                     // 100% batería
  | 'electrico_rev_extendido'           // range-extender
  | 'pila_combustible_fcev'             // hidrógeno
  | 'gas_glp'                           // licuado petróleo
  | 'gas_gnc_gnl'                       // natural comprimido/licuado
  | 'biocombustible_b100_e85'
  | 'mecanico_no_motor'                 // remolques · maquinaria sin propulsión propia

/** Tipo de transmisión. */
export type TipoTransmision =
  | 'manual'
  | 'automatica_convertidor_par'
  | 'automatica_doble_embrague_dct'
  | 'automatica_cvt'
  | 'automatica_amt'
  | 'sin_caja_directo_electrico'

/** Tipo de tracción. */
export type TipoTraccion =
  | 'delantera_fwd'
  | 'trasera_rwd'
  | 'integral_permanente_awd'
  | 'integral_conectable_4wd'
  | 'reductora_off_road'

/** Distintivo ambiental DGT España (2016). Aplicable solo ES. */
export type DistintivoAmbientalDGTES =
  | 'cero_azul'                         // BEV · FCEV · PHEV >40 km autonomía
  | 'eco_verde_azul'                    // HEV · GNC · GLP · PHEV <40 km
  | 'c_verde'                           // gasolina post-2006 · diésel post-2014 (Euro 6)
  | 'b_amarilla'                        // gasolina post-2000 · diésel post-2006 (Euro 4/5)
  | 'sin_distintivo'                    // pre-2000 (gasolina) · pre-2006 (diésel)

/** Norma de emisiones europea aplicable. */
export type NormaEmisionesEuropea =
  | 'euro_1'
  | 'euro_2'
  | 'euro_3'
  | 'euro_4'
  | 'euro_5'
  | 'euro_6'
  | 'euro_6b'
  | 'euro_6c'
  | 'euro_6d_temp'
  | 'euro_6d'
  | 'euro_6e'
  | 'euro_7'                            // efectivo 2026 turismos · 2027 camiones (Reg. UE)
  | 'no_aplica'                         // BEV · FCEV (cero emisiones tubo escape)

/** Estado del vehículo. */
export type EstadoVehiculoOferta =
  | 'nuevo_0_km'
  | 'km_0_demo'                         // matriculado pero sin uso · demo concesionario
  | 'seminuevo'                         // < 1 año + < 15.000 km
  | 'ocasion_garantizado'               // > 1 año con garantía profesional 12 meses
  | 'ocasion_estandar'
  | 'vintage_30_anos_mas'
  | 'clasico_historico_certificado'     // certificado vehículo histórico FEVA
  | 'reparable_siniestrado'             // total · estructural · funcional
  | 'para_despiece_baja_oficial'

/** Tipo de operación comercial sobre el vehículo. */
export type TipoOperacionAutomocion =
  | 'venta_a_particular'
  | 'venta_a_profesional'
  | 'alquiler_corto_dia_semana'
  | 'alquiler_largo_meses'
  | 'renting_24_60_meses'
  | 'leasing_financiero'
  | 'suscripcion_mensual'
  | 'carsharing_minutos_horas'
  | 'subasta_publica_judicial'
  | 'subasta_privada_almoneda'
  | 'permuta_intercambio'

/** Tipo de servicio profesional automoción. */
export type TipoServicioAutomocion =
  | 'itv_inspeccion_periodica'          // estación ITV homologada CCAA
  | 'taller_mecanica_general'
  | 'taller_chapa_pintura'
  | 'taller_neumaticos_alineacion'
  | 'taller_electronica_diagnostico'
  | 'taller_motor_caja_cambios'
  | 'taller_oficial_marca'              // autorizado fabricante OEM
  | 'concesionario_oficial_marca'
  | 'compraventa_multimarca'
  | 'tasacion_pericial'                 // perito tasador colegiado
  | 'peritaje_siniestros_seguros'
  | 'gestoria_matriculacion_transferencia'
  | 'gestoria_baja_definitiva'
  | 'asistencia_grua_24h'
  | 'asistencia_averia_carretera'
  | 'rotulacion_vehiculos_publicidad'
  | 'tuning_personalizacion'
  | 'lavado_detailing'
  | 'parking_alquiler_plaza'
  | 'instalacion_punto_recarga_iec'     // IEC 61851
  | 'mantenimiento_punto_recarga'
  | 'gestion_subvenciones_moves'        // Plan MOVES ES
  | 'auto_escuela_carnet_a_b_c'
  | 'formacion_cap_capacitacion_profesional'
  | 'transporte_vehiculos_porta_coches'
  | 'depositos_vehiculos_judiciales'

// ============================================================================
// IDENTIFICACIÓN DEL VEHÍCULO
// ============================================================================

/** Datos de identificación legal del vehículo. */
export type IdentificacionVehiculo = {
  /** VIN · Vehicle Identification Number (ISO 3779 · 17 caracteres
   *  alfanuméricos sin I/O/Q). Único mundial. Estandarizado desde 1981. */
  vin: string
  /** Matrícula actual (formato nacional · ES: 4 dígitos + 3 letras desde 2000). */
  matricula?: string
  /** País de matriculación (ISO 3166-1 alpha-2). */
  pais_matriculacion: ISOCountryCode
  /** Fecha de primera matriculación. */
  fecha_primera_matriculacion: string   // ISO 8601 date
  /** Marca/fabricante. */
  marca: string
  /** Modelo y variante. */
  modelo: string
  /** Versión/acabado comercial. */
  version_acabado?: string
  /** Año de fabricación (model year). */
  ano_fabricacion: number
  /** Número de bastidor legacy (cuando no aplica VIN ISO 3779 · embarcaciones · maquinaria). */
  numero_bastidor_legacy?: string
  /** Tipo de homologación (UE Type Approval · UN-ECE · nacional). */
  tipo_homologacion: 'eu_whole_vehicle_type_approval' | 'eu_individual_approval' | 'national_approval' | 'historico_pre_homologacion'
  /** Número de homologación. */
  numero_homologacion?: string
  /** ¿Tiene Certificate of Conformity (COC) europeo emitido por fabricante? */
  tiene_coc_europeo: boolean
}

// ============================================================================
// DIMENSIONES Y CAPACIDADES
// ============================================================================

/** Dimensiones físicas y capacidades del vehículo. */
export type DimensionesVehiculo = {
  /** Largo total (mm). */
  largo_mm: number
  /** Ancho total sin retrovisores (mm). */
  ancho_mm: number
  /** Alto total (mm). */
  alto_mm: number
  /** Distancia entre ejes (mm). */
  batalla_mm?: number
  /** Tara (peso en vacío · kg). */
  tara_kg: number
  /** MMA · Masa Máxima Autorizada (kg). */
  mma_kg: number
  /** Carga útil (kg). */
  carga_util_kg?: number
  /** Número de plazas (incluido conductor). */
  num_plazas: number
  /** Capacidad maletero (litros · mínima sin abatir asientos). */
  capacidad_maletero_l?: number
  /** Capacidad de remolque con freno (kg). */
  capacidad_remolque_con_freno_kg?: number
  /** Capacidad de remolque sin freno (kg). */
  capacidad_remolque_sin_freno_kg?: number
  /** Diámetro de giro (metros · para industriales/turismos largos). */
  diametro_giro_m?: number
}

// ============================================================================
// MOTORIZACIÓN
// ============================================================================

/** Datos técnicos de motorización. */
export type MotorVehiculo = {
  tipo_motorizacion: TipoMotorizacion
  /** Cilindrada en cm³ (cc) · solo ICE. */
  cilindrada_cc?: number
  /** Número de cilindros. */
  num_cilindros?: number
  /** Potencia máxima en kW (oficial ficha técnica). */
  potencia_kw: number
  /** Potencia máxima en CV (cálculo derivado · kW × 1.36). */
  potencia_cv: number
  /** Par máximo en Nm. */
  par_maximo_nm?: number
  /** Régimen al que entrega par máximo (rpm). */
  par_a_rpm?: number
  /** Aceleración 0-100 km/h (segundos). */
  aceleracion_0_100_s?: number
  /** Velocidad máxima (km/h). */
  velocidad_max_kmh?: number
  /** Transmisión. */
  transmision: TipoTransmision
  /** Número de marchas (si caja con marchas). */
  num_marchas?: number
  /** Tracción. */
  traccion: TipoTraccion

  // -------------------- ICE COMBUSTIBLES --------------------
  /** Capacidad del depósito de combustible (litros). */
  capacidad_deposito_l?: number
  /** Consumo combinado WLTP en L/100km. */
  consumo_wltp_l100km?: number
  /** Consumo urbano WLTP. */
  consumo_wltp_urbano_l100km?: number
  /** Consumo extraurbano WLTP. */
  consumo_wltp_extraurbano_l100km?: number

  // -------------------- ELECTRIFICADOS --------------------
  /** Capacidad útil de batería (kWh) · solo BEV/PHEV/HEV/FCEV. */
  capacidad_bateria_util_kwh?: number
  /** Capacidad bruta de batería (kWh). */
  capacidad_bateria_bruta_kwh?: number
  /** Autonomía eléctrica WLTP (km). */
  autonomia_electrica_wltp_km?: number
  /** Consumo eléctrico WLTP (kWh/100km). */
  consumo_electrico_wltp_kwh100km?: number
  /** Potencia máxima carga AC (kW). */
  potencia_carga_ac_max_kw?: number
  /** Potencia máxima carga DC (kW). */
  potencia_carga_dc_max_kw?: number
  /** Tipo de conector AC (Type 2 · Schuko · CEE · etc.). */
  conector_ac?: 'type_2' | 'type_1' | 'schuko' | 'cee_industrial'
  /** Tipo de conector DC (CCS · CHAdeMO · Tesla NACS · GB/T). */
  conector_dc?: 'ccs2' | 'ccs1' | 'chademo' | 'nacs_tesla' | 'gb_t'
  /** Tiempo carga 10-80% DC fast (minutos). */
  tiempo_carga_dc_10_80_min?: number
  /** Estado de salud batería · SoH (% de capacidad original). */
  bateria_soh_pct?: number
  /** Garantía remanente de batería (meses + km). */
  garantia_bateria_remanente?: {
    meses: number
    km: number
  }
}

// ============================================================================
// EMISIONES Y ETIQUETADO AMBIENTAL
// ============================================================================

/** Datos de emisiones y etiquetado ambiental. */
export type EmisionesVehiculo = {
  norma_emisiones: NormaEmisionesEuropea
  /** Emisiones CO2 WLTP combinado (g/km). */
  co2_wltp_combinado_gkm?: number
  /** Emisiones CO2 NEDC (legacy · solo si homologación pre-WLTP). */
  co2_nedc_gkm?: number
  /** Emisiones NOx (mg/km · diésel principalmente). */
  nox_mg_km?: number
  /** Emisiones partículas PM (mg/km). */
  particulas_pm_mg_km?: number
  /** Ruido estático (dB · homologación CE). */
  ruido_estatico_db?: number
  /** Distintivo ambiental DGT (solo ES). */
  distintivo_dgt_es?: DistintivoAmbientalDGTES
  /** ¿Cumple ULEZ London / ZBE Madrid / Crit'Air FR? */
  cumple_zonas_bajas_emisiones_eu: boolean
}

// ============================================================================
// HISTORIAL Y DOCUMENTACIÓN
// ============================================================================

/** Historial documentado del vehículo. */
export type HistorialVehiculo = {
  /** Kilometraje actual. */
  km_actuales: number
  /** Número de propietarios anteriores. */
  num_propietarios_anteriores: number
  /** Fecha último servicio oficial. */
  fecha_ultimo_servicio_oficial?: string
  /** Tipo último servicio. */
  tipo_ultimo_servicio?: string
  /** Libro de mantenimiento sellado. */
  libro_mantenimiento_completo: boolean
  /** Servicio siempre en red oficial fabricante. */
  servicio_siempre_red_oficial: boolean
  /** Certificado kilometraje AENOR o equivalente. */
  certificado_km_aenor: boolean
  /** Siniestros declarados · cuantía total daños (EUR). */
  siniestros_declarados?: Array<{
    fecha: string
    daños_eur: number
    tipo: 'leve_chapa' | 'estructural' | 'total_declarado_perdida'
  }>
  /** ¿Vehículo libre de cargas financieras (sin reserva de dominio · sin
   *  embargo registrado)? */
  libre_de_cargas: boolean
  /** Embargos o reservas pendientes (si libre_de_cargas=false). */
  cargas_pendientes?: Array<{
    tipo: 'reserva_dominio_financiera' | 'embargo_judicial' | 'embargo_administrativo' | 'precinto_judicial'
    importe_eur?: number
    acreedor?: string
  }>
}

/** Documentación oficial del vehículo. */
export type DocumentacionVehiculo = {
  /** PDF del permiso de circulación. */
  permiso_circulacion_pdf?: string
  /** PDF de la ficha técnica / tarjeta ITV. */
  ficha_tecnica_pdf?: string
  /** Última ITV/MOT/TÜV. */
  ultima_inspeccion?: {
    fecha: string
    resultado: 'favorable' | 'desfavorable_leve' | 'desfavorable_grave' | 'negativa'
    fecha_caducidad: string
    estacion_itv: string
    numero_acta: string
    pdf_url?: string
  }
  /** Seguro obligatorio de responsabilidad civil. */
  seguro_obligatorio?: {
    aseguradora: string
    poliza_numero: string
    fecha_vencimiento: string
    tipo: 'terceros' | 'terceros_ampliado' | 'todo_riesgo_franquicia' | 'todo_riesgo_sin_franquicia'
    pdf_url?: string
  }
  /** Impuesto circulación al día. */
  impuesto_circulacion_al_dia: boolean
  /** Certificate of Conformity europeo (COC) si aplica · PDF. */
  coc_europeo_pdf?: string
}

// ============================================================================
// EQUIPAMIENTO Y ADAS
// ============================================================================

/** Equipamiento del vehículo. */
export type EquipamientoVehiculo = {
  // -------------------- SEGURIDAD ACTIVA --------------------
  abs: boolean
  esp_control_estabilidad: boolean
  control_traccion: boolean
  num_airbags: number
  isofix: boolean
  alerta_cinturon_traseros: boolean
  /** Sistema llamada emergencia eCall (obligatorio UE post-04/2018). */
  ecall_e112: boolean

  // -------------------- ADAS · Reg. UE 2019/2144 GSR2 --------------------
  /** Nivel de automatización SAE (J3016). */
  nivel_adas_sae?: 'L0' | 'L1' | 'L2' | 'L2_plus' | 'L3' | 'L4' | 'L5'
  control_crucero_adaptativo: boolean
  frenada_emergencia_autonoma_aeb: boolean
  asistente_carril_lka_lda: boolean
  reconocimiento_senales_tsr: boolean
  detector_angulo_muerto: boolean
  alerta_trafico_cruzado_trasero: boolean
  camara_360: boolean
  asistente_aparcamiento: boolean

  // -------------------- CONFORT --------------------
  climatizador_bizona_o_superior: boolean
  navegador_integrado: boolean
  apple_carplay_android_auto: boolean
  asientos_calefactables: boolean
  asientos_ventilados: boolean
  techo_panoramico: boolean
  llantas_aleacion: boolean
  faros_led_matrix_pixel: boolean

  // -------------------- CONECTIVIDAD --------------------
  /** ¿Acceso OTA (Over-The-Air) updates fabricante? */
  ota_updates: boolean
  /** App oficial fabricante para control remoto. */
  app_fabricante_remoto: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · OFERTA DE VEHÍCULO
// ============================================================================

/** Ficha de oferta de un vehículo concreto publicada por particular,
 *  concesionario, gestor de flotas, importador o compraventa multimarca.
 *
 *  Caso de uso: concesionario oficial Valencia publica oferta de SUV
 *  PHEV km0 demo · etiqueta ECO · 50 km autonomía eléctrica · garantía
 *  oficial 5 años · financiación al 5,9% APR · admite permuta. */
// v1.1: producto físico · extiende DPPProduct (UniversalProduct + 6 capas DPP A-F).
// Cumplimiento ESPR automoción + Reg. UE 2023/851 fin venta ICE 2035 +
// directiva EU 95% reciclabilidad 2027 + CBAM si componentes acero/aluminio
// importados + EUDR si caucho importado (neumáticos).
export type VehiculoProduct = DPPProduct & {
  sub_categoria: 'vehiculo'

  // -------------------- CLASIFICACIÓN --------------------
  categoria: CategoriaVehiculo
  /** Solo si turismo/comercial · tipo de carrocería. */
  carroceria?: TipoCarroceria
  estado_oferta_vehiculo: EstadoVehiculoOferta
  tipo_operacion: TipoOperacionAutomocion

  // -------------------- IDENTIFICACIÓN --------------------
  identificacion: IdentificacionVehiculo

  // -------------------- TÉCNICA --------------------
  dimensiones: DimensionesVehiculo
  motor: MotorVehiculo
  emisiones: EmisionesVehiculo

  // -------------------- HISTORIAL Y DOCUMENTACIÓN --------------------
  historial: HistorialVehiculo
  documentacion: DocumentacionVehiculo

  // -------------------- EQUIPAMIENTO --------------------
  equipamiento: EquipamientoVehiculo
  /** Color exterior (descripción libre o código RAL/fabricante). */
  color_exterior?: string
  /** Color interior / tapicería. */
  color_interior?: string
  /** Material tapicería. */
  material_tapiceria?: 'tela' | 'cuero' | 'cuero_sintetico_alcantara' | 'tela_cuero_combinacion'

  // -------------------- CONDICIONES COMERCIALES --------------------
  /** Si operación es renting/leasing/alquiler: cuota mensual. */
  cuota_mensual_eur?: number
  /** Duración mínima del contrato (meses). */
  duracion_min_meses?: number
  /** Kilometraje incluido anual. */
  km_anuales_incluidos?: number
  /** Coste por km adicional sobrepasado. */
  coste_km_adicional_eur?: number
  /** Cuota mantenimiento incluida en cuota (renting). */
  mantenimiento_incluido: boolean
  /** Seguro a todo riesgo incluido en cuota (renting). */
  seguro_todo_riesgo_incluido: boolean
  /** Asistencia 24h incluida. */
  asistencia_24h_incluida: boolean
  /** Entrada inicial requerida (EUR). */
  entrada_inicial_eur?: number
  /** Opción de compra final (valor residual EUR). */
  valor_residual_compra_eur?: number
  /** Financiación disponible TIN/TAE. */
  financiacion_disponible?: {
    tin_pct: number
    tae_pct: number
    plazo_max_meses: number
    importe_max_financiable_eur: number
    entidad_financiera: string
  }
  /** ¿Admite permuta (vehículo del cliente como parte del pago)? */
  admite_permuta: boolean
  /** Garantía profesional ofrecida (meses). */
  garantia_profesional_meses?: number

  // -------------------- DECLARACIONES LEGALES --------------------
  /** El publicante declara ser titular legítimo o agente con mandato escrito. */
  declaracion_titular_legitimo: boolean
  /** El publicante declara que el vehículo está libre de cargas (o las ha
   *  declarado en historial.cargas_pendientes). */
  declaracion_libre_cargas_o_cargas_declaradas: boolean
  /** El publicante declara que el kilometraje es real (manipulación cuentakm
   *  es delito · CP art. 248 estafa). */
  declaracion_km_real: boolean
  /** El publicante declara que ningún componente principal proviene de
   *  desguace ilegal (chapa, motor, bastidor). */
  declaracion_componentes_legales: boolean
  /** Estado de la oferta. */
  estado_operacion: 'disponible' | 'reservado' | 'opcion_firmada' | 'cerrado' | 'retirado'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD DE AUTOMOCIÓN (CLIENTE BUSCA)
// ============================================================================

/** Ficha publicada por un cliente (particular · empresa · gestor flotas)
 *  que busca un vehículo o flota.
 *
 *  Caso de uso: empresa logística Madrid publica búsqueda de 20 furgones
 *  comerciales eléctricos BEV · MMA 3500 kg · autonomía mínima 250 km
 *  WLTP · entrega Q2 2027 · modalidad renting 60 meses · presupuesto
 *  máximo 700 €/mes por furgón. */
export type NecesidadAutomocionProduct = UniversalProduct & {
  sub_categoria: 'necesidad_automocion'

  // -------------------- QUÉ BUSCA --------------------
  categorias_aceptadas: CategoriaVehiculo[]
  carrocerias_aceptadas?: TipoCarroceria[]
  motorizaciones_aceptadas: TipoMotorizacion[]
  estados_aceptados: EstadoVehiculoOferta[]
  tipo_operacion_buscada: TipoOperacionAutomocion

  // -------------------- CANTIDAD (PARTICULAR VS FLOTA) --------------------
  /** Número de unidades buscadas (1 = particular · >1 = flota). */
  num_unidades: number
  /** ¿Compra como particular o como empresa/profesional? */
  perfil_comprador: 'particular' | 'empresa_pyme' | 'empresa_gran_cuenta' | 'gestor_flotas' | 'administracion_publica'

  // -------------------- REQUISITOS TÉCNICOS --------------------
  ano_fabricacion_min?: number
  km_max_aceptados?: number
  potencia_min_cv?: number
  /** Norma emisiones mínima aceptable. */
  norma_emisiones_min?: NormaEmisionesEuropea
  /** Distintivo DGT mínimo aceptable (si ES). */
  distintivo_dgt_min?: DistintivoAmbientalDGTES
  /** Autonomía mínima si eléctrico. */
  autonomia_min_km?: number
  /** Capacidad mínima de carga (kg) si comercial/industrial. */
  carga_util_min_kg?: number

  // -------------------- ÁMBITO GEOGRÁFICO --------------------
  /** Zonas de búsqueda geográficas. */
  zonas_busqueda: Array<{
    pais: ISOCountryCode
    region?: string
    municipio?: string
    radio_km?: number
  }>
  /** ¿Acepta entrega cross-border intra-UE? */
  acepta_entrega_intra_ue: boolean

  // -------------------- PRESUPUESTO --------------------
  /** Presupuesto máximo TOTAL (si venta) o por mes/unidad (si renting). */
  presupuesto_max_eur: number
  /** Granularidad del presupuesto. */
  granularidad_presupuesto: 'total_operacion' | 'por_unidad' | 'mensual_por_unidad'
  moneda_presupuesto: string
  /** Necesita financiación. */
  necesita_financiacion: boolean
  /** Capacidad de entrada inicial (EUR). */
  entrada_inicial_disponible_eur?: number

  // -------------------- TIMING --------------------
  fecha_entrega_objetivo: string
  urgencia: 'sin_urgencia' | 'media_3_meses' | 'alta_1_mes' | 'inmediata'

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '02_b2b_nacional' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO PROFESIONAL AUTOMOCIÓN
// ============================================================================

/** Ficha de servicio profesional automoción ofertado por un Actor
 *  (estación ITV · taller · concesionario · gestoría · perito · etc.). */
export type ServicioAutomocionProduct = UniversalProduct & {
  sub_categoria: 'servicio_automocion'

  // -------------------- TIPO DE SERVICIO --------------------
  tipo_servicio: TipoServicioAutomocion

  // -------------------- ÁMBITO --------------------
  paises_cobertura: ISOCountryCode[]
  provincias_es?: string[]
  /** ¿Atiende a domicilio (móvil) o solo en taller fijo? */
  modalidad_atencion: 'taller_fijo' | 'movil_domicilio' | 'hibrida'
  /** Dirección del taller principal (si fijo). */
  direccion_taller_principal?: {
    pais: ISOCountryCode
    municipio: string
    codigo_postal: string
    direccion: string
  }
  /** ¿Categorías de vehículo que atiende? */
  categorias_atendidas: CategoriaVehiculo[]
  /** Marcas en las que está especializado (vacío = multimarca). */
  marcas_especializado?: string[]

  // -------------------- ACREDITACIONES --------------------
  /** Si ITV: nº autorización CCAA + identificador estación. */
  itv_autorizacion?: {
    numero_autorizacion: string
    ccaa: string
    organismo_emisor: string
    pdf_autorizacion: string
  }
  /** Si taller: registro industrial CCAA + concedente fabricante. */
  taller_acreditacion?: {
    registro_industrial: string         // Registro Industrial CCAA
    es_taller_oficial_marca?: boolean
    marca_concedente?: string
    numero_concesion_oficial?: string
    pdf_acreditacion?: string
  }
  /** Si concesionario: contrato concesión + marca. */
  concesionario_acreditacion?: {
    marca_concedente: string
    numero_concesion: string
    fecha_alta: string
    tipo: 'oficial' | 'agente_autorizado'
    pdf_contrato_concesion?: string
  }
  /** Si perito: colegiación. */
  perito_colegiacion?: {
    colegio: string                     // e.g. 'Colegio Ingenieros Técnicos Industriales Madrid'
    numero_colegiado: string
    especialidad: 'mecanica' | 'electricidad' | 'industrial' | 'naval' | 'aeronautica'
    fecha_alta: string
    pdf_certificado: string
  }
  /** Si instalador punto recarga: certificación IEC + REBT. */
  instalador_recarga_acreditacion?: {
    norma_iec: 'IEC_61851_1' | 'IEC_61851_22' | 'IEC_61851_23'
    autorizacion_rebt_es: boolean
    numero_instalador_rebt?: string
    pdf_autorizacion?: string
  }
  /** Seguro de responsabilidad civil profesional. */
  seguro_rcp: {
    aseguradora: string
    poliza_numero: string
    cobertura_max_eur: number
    fecha_vencimiento: string
    pdf_url: string
  }
  /** Años de experiencia. */
  anos_experiencia: number
  /** Idiomas. */
  idiomas: string[]

  // -------------------- TARIFAS --------------------
  modelo_tarifa: 'fija_por_servicio' | 'por_hora' | 'por_kilometro' | 'mixta'
  tarifa_hora_taller_eur?: number
  tarifa_servicio_fijo_eur?: number
  importe_minimo_eur?: number
  plazo_servicio_dias?: number
  /** ¿Ofrece presupuesto previo sin compromiso? */
  presupuesto_previo_gratuito: boolean

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector AUTOMOCIÓN
// ============================================================================

export type AutomocionProduct =
  | VehiculoProduct
  | NecesidadAutomocionProduct
  | ServicioAutomocionProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

export const AUTOMOCION_SCHEMA_VERSION = 'automocion@1.0' as const

/** 'draft' hasta que sea revisado por:
 *   - ANFAC (Asoc. Nacional Fabricantes Automoción)
 *   - SERNAUTO (componentes automoción)
 *   - GANVAM (gestión vehículos)
 *   - FACONAUTO (concesionarios)
 *   - CETM (transporte mercancías por carretera)
 *   - AECA-ITV (Asociación Española Centros Inspección)
 *   - 2 talleres autorizados PYMEs operando ES
 *   - 1 perito tasador colegiado activo
 *   - Auditoría jurídica especialista derecho automoción + datos vehículo
 *     + homologación CE (Reg. UE 2018/858) + electromovilidad
 *     (Reg. UE 2023/851 + 2023/1804 AFIR)
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación). */
export const AUTOMOCION_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isVehiculo(p: AutomocionProduct): p is VehiculoProduct {
  return p.sub_categoria === 'vehiculo'
}

export function isNecesidadAutomocion(p: AutomocionProduct): p is NecesidadAutomocionProduct {
  return p.sub_categoria === 'necesidad_automocion'
}

export function isServicioAutomocion(p: AutomocionProduct): p is ServicioAutomocionProduct {
  return p.sub_categoria === 'servicio_automocion'
}
