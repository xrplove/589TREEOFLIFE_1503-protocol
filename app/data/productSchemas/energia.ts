// Schema sectorial ENERGÍA · Fase 6 bloque D.7.
//
// Sector central de la transición ecológica europea: renovables (Directiva
// 2018/2001 RED II revisada por 2023/2413 RED III · objetivo 42,5% RES en
// consumo final 2030) · eficiencia energética (Reg. UE 2023/1791 EED) ·
// edificios casi nulos (Directiva 2010/31 EPBD revisada 2024/1275) · auto-
// consumo (RD 244/2019 ES · ampliado Real Decreto-ley 5/2023 comunidades
// energéticas) · acceso a red (RD 1955/2000 + Reg. UE 2019/943 mercado
// electricidad) · garantías de origen renovable (CNMC ES · AIB europeo) ·
// infraestructura combustibles alternativos (Reg. UE 2023/1804 AFIR ·
// incluye recarga vehículo eléctrico + hidrógeno + GNL).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector ENERGÍA puede
// publicar):
//
// 1. InstalacionEnergeticaProduct · oferta de producto/instalación
//    (paneles FV · inversores · baterías · aerogeneradores · bombas de
//    calor · calderas biomasa · puntos de recarga · electrolizadores ·
//    pilas de combustible · estaciones GNL).
//
// 2. NecesidadEnergeticaProduct · cliente busca (PYME busca instalación
//    autoconsumo · industria busca PPA físico 5 MW · particular busca
//    aerotermia · empresa busca contrato suministro fijo con renovable
//    certificado · ayuntamiento busca comunidad energética).
//
// 3. ServicioEnergeticoProduct · servicios profesionales (instalador
//    autorizado REBT · ingeniería proyecto renovables · auditoría
//    energética ISO 50001 · ESCO eficiencia garantizada · trading
//    mercado MIBEL · O&M renovables · promoción comunidades energéticas ·
//    retrofit eficiencia edificios · consultoría descarbonización).
//
// MULTI-PAÍS: parametrizado para mercados energéticos UE + internacionales:
//   - ES: CNMC · RED Eléctrica · Enagás (gas) · MIBEL · OMIE · OMIP ·
//     RD 244/2019 autoconsumo · REBT RD 842/2002 · IDAE · MITECO
//   - PT: ERSE · REN · MIBEL común con ES
//   - FR: CRE · RTE (electricidad) · GRTgaz · EPEX SPOT
//   - DE: BNetzA · TenneT/50Hertz/Amprion/TransnetBW · EPEX · EEX
//   - IT: ARERA · Terna · GME · GSE (gestor servizi energetici)
//   - UK: Ofgem · National Grid ESO · BEIS · Elexon (BSC)
//   - US: FERC · RTO/ISO regionales (PJM · CAISO · ERCOT · MISO · NYISO)
//   - INT: IRENA · IEA · IEC TC 82 (FV) · TC 88 (eólica) · TC 21 (baterías)
//
// schema_status: 'draft' (pendiente validación experta sectorial · APPA
// Asociación Empresas Energías Renovables · UNEF Unión Española Fotovoltaica ·
// AEE Asociación Empresarial Eólica · AEH2 hidrógeno · Aelec Asoc. Empresas
// Eléctricas · ANESE servicios energéticos · IDAE · CNMC · 2 instaladores
// PYMEs REBT · 1 ingeniero industrial colegiado energías · 1 trader OMIE ·
// auditoría jurídica especialista derecho energético + RED III + EPBD +
// regulación mercado eléctrico UE).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Tipo de fuente / vector energético. */
export type TipoFuenteEnergia =
  | 'solar_fotovoltaica'
  | 'solar_termica'
  | 'eolica_terrestre_onshore'
  | 'eolica_marina_offshore_fija'
  | 'eolica_marina_offshore_flotante'
  | 'hidraulica_gran_escala'
  | 'hidraulica_minihidraulica'
  | 'mareomotriz_undimotriz'
  | 'geotermica_profunda'
  | 'geotermica_somera_aerotermia_bomba_calor'
  | 'biomasa_solida'
  | 'biogas'
  | 'biometano_gas_renovable'
  | 'biocombustibles_liquidos'
  | 'hidrogeno_verde_electrolisis_renovable'
  | 'hidrogeno_azul_smr_con_ccs'
  | 'hidrogeno_gris_smr_sin_ccs'
  | 'hidrogeno_rosa_nuclear'
  | 'nuclear_fision'
  | 'gas_natural_fosil'
  | 'gas_glp'
  | 'electricidad_red_mix_nacional'
  | 'carbon'
  | 'petroleo_derivados'

/** Tipo de instalación energética. */
export type TipoInstalacionEnergetica =
  | 'autoconsumo_residencial_lt_15kw'
  | 'autoconsumo_industrial_15_100kw'
  | 'autoconsumo_industrial_100kw_5mw'
  | 'planta_renovable_utility_scale_gt_5mw'
  | 'aerogenerador_pequena_potencia'
  | 'parque_eolico'
  | 'central_hidraulica_minihidraulica'
  | 'central_hidraulica_bombeo'
  | 'instalacion_bomba_calor_aerotermia'
  | 'instalacion_bomba_calor_geotermia'
  | 'planta_biomasa'
  | 'biodigestor_biogas'
  | 'planta_biometano_inyeccion_red'
  | 'electrolizador_hidrogeno_verde'
  | 'planta_hidrogeno_industrial'
  | 'pila_combustible_hidrogeno'
  | 'comunidad_energetica_local_cel'
  | 'comunidad_ciudadana_energia_cce'
  | 'microred_microgrid'
  | 'sistema_almacenamiento_bateria_bess'
  | 'sistema_almacenamiento_hidrogeno'
  | 'punto_recarga_vehiculo_electrico'
  | 'hub_recarga_ultra_rapida'

/** Categoría de producto energético tangible. */
export type CategoriaProductoEnergia =
  | 'panel_fotovoltaico'
  | 'inversor_string'
  | 'inversor_microinversor'
  | 'inversor_central'
  | 'inversor_hibrido_baterias'
  | 'estructura_soporte_fija'
  | 'estructura_soporte_seguidor_solar'
  | 'sistema_almacenamiento_litio_lifepo4'
  | 'sistema_almacenamiento_litio_nmc'
  | 'sistema_almacenamiento_redox_flow'
  | 'sistema_almacenamiento_sodio'
  | 'aerogenerador_horizontal_hawt'
  | 'aerogenerador_vertical_vawt'
  | 'turbina_hidraulica'
  | 'bomba_calor_aire_aire'
  | 'bomba_calor_aire_agua_aerotermia'
  | 'bomba_calor_geotermica'
  | 'caldera_biomasa_pellet'
  | 'caldera_biomasa_lena'
  | 'estufa_biomasa'
  | 'panel_solar_termico'
  | 'electrolizador_pem'
  | 'electrolizador_alcalino'
  | 'electrolizador_oxido_solido_soec'
  | 'pila_combustible_pemfc'
  | 'pila_combustible_sofc'
  | 'tanque_almacenamiento_hidrogeno'
  | 'wallbox_recarga_ac'
  | 'cargador_dc_ultra_rapido'
  | 'medidor_inteligente_smart_meter'
  | 'cuadro_proteccion_aislamiento'
  | 'optimizador_potencia_panel_level'

/** Tipo de garantía de origen / certificado de atributos energéticos. */
export type TipoCertificadoOrigen =
  | 'go_garantia_origen_cnmc_es'        // CNMC España
  | 'rec_renewable_energy_certificate'  // US
  | 'go_aib_european_attribute'         // AIB · Association Issuing Bodies UE
  | 'i_rec_international_renewable_certificate'  // global
  | 'green_e_certified'                 // US verificación adicional
  | 'tigr_tradable_instrument_global_renewables'
  | 'autoconsumo_sin_certificado'

/** Tipo de servicio energético profesional. */
export type TipoServicioEnergia =
  | 'instalacion_fotovoltaica_residencial'
  | 'instalacion_fotovoltaica_industrial'
  | 'instalacion_fotovoltaica_utility_scale'
  | 'instalacion_aerotermia'
  | 'instalacion_geotermia'
  | 'instalacion_biomasa'
  | 'instalacion_punto_recarga_ve'
  | 'instalacion_sistema_almacenamiento_baterias'
  | 'instalacion_electrolizador_hidrogeno'
  | 'ingenieria_proyecto_renovable'
  | 'tramitacion_administrativa_ccaa'
  | 'gestion_acceso_conexion_red'
  | 'auditoria_energetica_iso_50001'
  | 'certificacion_eficiencia_energetica_cee'
  | 'auditoria_huella_carbono_iso_14064'
  | 'esco_servicios_energeticos_eficiencia_garantizada'
  | 'gestion_demanda_flexibilidad'
  | 'agregacion_consumidores_independientes_dr'
  | 'trading_energia_mercado_omie'
  | 'gestion_ppa_corporativo_offsite'
  | 'promocion_comunidad_energetica_cel'
  | 'mantenimiento_om_renovables'
  | 'inspeccion_termografica_o_m'
  | 'inspeccion_iv_curve_paneles'
  | 'retrofit_eficiencia_edificios'
  | 'consultoria_descarbonizacion_industrial'
  | 'consultoria_emisiones_ets_ue'
  | 'consultoria_taxonomia_verde_ue'
  | 'consultoria_subvenciones_ayudas_nextgen'

/** Modelo comercial de contrato energético. */
export type ModeloContratoEnergetico =
  | 'venta_directa_producto'
  | 'instalacion_llave_en_mano'
  | 'autoconsumo_compartido_comunidad_energetica'
  | 'ppa_fisico_corporate'              // PPA físico bilateral
  | 'ppa_financiero_virtual'            // PPA financiero (CfD)
  | 'ppa_sleeved_intermediado'
  | 'leasing_solar_residencial'
  | 'leasing_industrial_baterias'
  | 'suministro_indexado_omie_pool'
  | 'suministro_precio_fijo_pyme'
  | 'suministro_indexado_renovable_certificado_go'
  | 'energy_as_a_service_eaas'
  | 'demand_response_capacity_payment'

// ============================================================================
// ESPECIFICACIONES TÉCNICAS · FOTOVOLTAICO
// ============================================================================

/** Especificaciones de un panel fotovoltaico. */
export type EspecificacionesPanelFV = {
  /** Potencia nominal pico en Wp (Standard Test Conditions STC). */
  potencia_nominal_wp: number
  /** Tecnología del módulo. */
  tecnologia: 'monocristalino_perc' | 'monocristalino_topcon' | 'monocristalino_hjt' | 'monocristalino_ibc' | 'policristalino' | 'thin_film_cdte' | 'thin_film_cigs' | 'tandem_perovskita_silicio'
  /** Eficiencia del módulo (%). */
  eficiencia_modulo_pct: number
  /** Tensión circuito abierto Voc (V). */
  voc_voltios: number
  /** Corriente cortocircuito Isc (A). */
  isc_amperios: number
  /** Tensión punto máxima potencia Vmpp (V). */
  vmpp_voltios: number
  /** Corriente punto máxima potencia Impp (A). */
  impp_amperios: number
  /** Coeficiente temperatura potencia (%/°C). */
  coef_temp_potencia_pct_c?: number
  /** Tipo de células (60 · 72 · 132 · etc.). */
  num_celulas: number
  /** ¿Bifacial? */
  es_bifacial: boolean
  /** Ganancia bifacial estimada (%). */
  ganancia_bifacial_pct?: number
  /** Dimensiones (mm). */
  largo_mm: number
  ancho_mm: number
  espesor_mm: number
  peso_kg: number
  /** Carga máxima nieve (Pa). */
  carga_max_nieve_pa: number
  /** Carga máxima viento (Pa). */
  carga_max_viento_pa: number
  /** Garantía producto (años). */
  garantia_producto_anos: number
  /** Garantía potencia lineal (años). */
  garantia_potencia_anos: number
  /** Potencia garantizada al final del plazo (%). */
  potencia_garantizada_final_pct: number
}

/** Especificaciones de un sistema de almacenamiento por baterías (BESS). */
export type EspecificacionesBateria = {
  /** Química de la batería. */
  quimica: 'lifepo4' | 'nmc' | 'nca' | 'lto' | 'sodio_io' | 'redox_flow_vanadio' | 'plomo_acido_agm' | 'plomo_acido_gel' | 'plomo_carbono'
  /** Capacidad nominal bruta (kWh). */
  capacidad_nominal_kwh: number
  /** Capacidad útil (kWh · = nominal × DoD). */
  capacidad_util_kwh: number
  /** Profundidad de descarga máxima recomendada (DoD %). */
  dod_max_pct: number
  /** Tensión nominal (V). */
  tension_nominal_v: number
  /** Potencia de carga máxima continua (kW). */
  potencia_carga_max_kw: number
  /** Potencia de descarga máxima continua (kW). */
  potencia_descarga_max_kw: number
  /** Eficiencia round-trip (%). */
  eficiencia_round_trip_pct: number
  /** Ciclos garantizados al DoD declarado. */
  ciclos_garantizados: number
  /** Vida útil garantizada (años). */
  vida_util_garantizada_anos: number
  /** SoH garantizado al final del plazo (%). */
  soh_garantizado_final_pct: number
  /** Temperatura operación (°C). */
  rango_temperatura_operacion?: { min_c: number; max_c: number }
  /** ¿Tiene BMS integrado? */
  bms_integrado: boolean
  /** ¿Permite acoplamiento AC · DC · hibrido? */
  acoplamiento: 'ac' | 'dc' | 'hibrido_ambos'
  /** Marcado CE + normas armonizadas (IEC 62619 · UL 1973 · UL 9540). */
  marcado_ce_cumplimiento: string[]
}

/** Especificaciones de un aerogenerador. */
export type EspecificacionesAerogenerador = {
  /** Clase IEC 61400 (I/II/III/IV · S especial). */
  clase_iec_61400: 'IA' | 'IB' | 'IIA' | 'IIB' | 'IIIA' | 'IIIB' | 'IV' | 'S_especial'
  /** Potencia nominal (kW). */
  potencia_nominal_kw: number
  /** Diámetro del rotor (m). */
  diametro_rotor_m: number
  /** Altura del buje (m). */
  altura_buje_m: number
  /** Velocidad arranque (m/s). */
  velocidad_arranque_ms: number
  /** Velocidad nominal (m/s). */
  velocidad_nominal_ms: number
  /** Velocidad corte por viento extremo (m/s). */
  velocidad_corte_ms: number
  /** Número de palas. */
  num_palas: number
  /** Tipo eje. */
  tipo_eje: 'horizontal_hawt' | 'vertical_vawt'
  /** ¿Direct drive (sin caja multiplicadora) o con caja? */
  direct_drive: boolean
  /** Nivel sonoro a 7 m/s y 100 m distancia (dB). */
  nivel_sonoro_db_a_100m?: number
  /** Vida útil de diseño (años). */
  vida_util_diseno_anos: number
}

// ============================================================================
// AUTORIZACIONES ADMINISTRATIVAS Y CONEXIÓN A RED
// ============================================================================

/** Trámites y autorizaciones de una instalación energética en ES. */
export type AutorizacionesInstalacionES = {
  /** ¿Necesita autorización administrativa previa (>15 kW industrial)? */
  requiere_autorizacion_administrativa_previa: boolean
  /** ¿Necesita declaración responsable (autoconsumo doméstico)? */
  requiere_declaracion_responsable: boolean
  /** Punto de conexión asignado por distribuidora (CUPS frontera). */
  cups_frontera?: string
  /** Capacidad de acceso concedida (kW). */
  capacidad_acceso_concedida_kw?: number
  /** Tipo de modalidad de autoconsumo (RD 244/2019). */
  modalidad_autoconsumo?:
    | 'sin_excedentes'
    | 'con_excedentes_acogido_compensacion'
    | 'con_excedentes_acogido_mecanismo_general'
    | 'no_aplica_no_es_autoconsumo'
  /** ¿Inscrita en Registro Administrativo de Autoconsumo (RAEEA · CCAA)? */
  inscrita_raeea: boolean
  /** Boletín eléctrico CIE (Certificado Instalación Eléctrica) emitido. */
  cie_boletin_pdf?: string
  /** Certificado fin de obra (CFO) emitido por técnico competente. */
  cfo_certificado_fin_obra_pdf?: string
  /** Número instalador REBT autorizado que firma. */
  numero_instalador_rebt?: string
  /** ¿Tiene cobertura de subvención Plan MOVES / PERTE / NextGen? */
  cobertura_subvencion?: {
    programa: 'moves_iii' | 'perte_ervija_renovables' | 'next_generation_eu' | 'idae_pree_5000' | 'otro'
    importe_concedido_eur?: number
    porcentaje_concedido_pct?: number
    expediente: string
  }
}

/** Garantía de Origen (GdO) emitida por CNMC España o equivalente. */
export type GarantiaOrigenCNMC = {
  /** Número único de GdO. */
  numero_go: string
  /** Tipo de tecnología renovable que la respalda. */
  tipo_tecnologia: 'solar_fv' | 'solar_termica' | 'eolica' | 'hidraulica' | 'biomasa' | 'biogas' | 'geotermica' | 'mareomotriz' | 'cogeneracion_alta_eficiencia'
  /** Cantidad de energía respaldada (MWh). */
  energia_respaldada_mwh: number
  /** Periodo de producción (ISO 8601). */
  periodo_produccion_inicio: string
  periodo_produccion_fin: string
  /** Organismo emisor. */
  organismo_emisor: 'CNMC_ES' | 'GME_IT' | 'AIB_european' | 'otro'
  /** Estado de la GdO. */
  estado: 'emitida' | 'transferida' | 'cancelada' | 'expirada'
  /** ¿Verificada por 1503 contra registro emisor? */
  verificada_por_1503: boolean
}

// ============================================================================
// CONTRATO PPA (Power Purchase Agreement)
// ============================================================================

/** Condiciones de un contrato PPA corporativo. */
export type CondicionesPPA = {
  /** Tipo de PPA. */
  tipo_ppa: 'fisico_directo_bilateral' | 'fisico_sleeved_intermediado' | 'financiero_cfd' | 'virtual_vppa'
  /** Capacidad contratada (MW). */
  capacidad_mw: number
  /** Volumen anual estimado (MWh/año). */
  volumen_anual_estimado_mwh?: number
  /** Tecnología del activo subyacente. */
  tecnologia_activo: TipoFuenteEnergia
  /** Duración del contrato (años). */
  duracion_anos: number
  /** Precio inicial (EUR/MWh). */
  precio_inicial_eur_mwh: number
  /** Indexación al IPC · IPP · banda fija. */
  indexacion: 'ipc_anual' | 'ipp_anual' | 'banda_fija_sin_indexacion' | 'cap_floor' | 'libre_negociacion'
  /** ¿Incluye GdO transferidas con la energía? */
  incluye_gdo: boolean
  /** Modalidad de balance (As-Produced · Baseload · Pay-as-Produced). */
  modalidad_balance: 'as_produced_perfilada' | 'baseload_24x7' | 'pay_as_produced_horaria'
}

// ============================================================================
// SUB-CATEGORÍA 1 · OFERTA DE PRODUCTO / INSTALACIÓN ENERGÉTICA
// ============================================================================

/** Ficha de oferta de producto o instalación energética publicada por
 *  fabricante, distribuidor, instalador o promotor.
 *
 *  Caso de uso: distribuidor mayorista publica oferta de 1.000 paneles FV
 *  monocristalino TOPCon 580 Wp · bifacial 70% · tier 1 BNEF · marcado CE
 *  IEC 61215 · garantía producto 25 años + lineal 30 años · entrega en 14
 *  días desde Valencia · precio 0,12 €/Wp B2B. */
// v1.1: producto físico · extiende DPPProduct (UniversalProduct + 6 capas DPP A-F).
// Cumplimiento ESPR + Reg. UE 2023/1542 Baterías (DPP baterías obligatorio
// 18-feb-2027) + EU Taxonomy 6 objetivos (eligible aligned para placas FV
// + aerogeneradores + baterías Li-ion) + CRA si inversor inteligente o
// gestor IoT (productos digitales).
export type InstalacionEnergeticaProduct = DPPProduct & {
  sub_categoria: 'instalacion_energetica'

  // -------------------- CLASIFICACIÓN --------------------
  categoria_producto: CategoriaProductoEnergia
  tipo_fuente: TipoFuenteEnergia
  /** Si la oferta es una instalación completa (no producto suelto) · tipo. */
  tipo_instalacion?: TipoInstalacionEnergetica

  // -------------------- ESPECIFICACIONES TÉCNICAS --------------------
  /** Si panel FV · especificaciones. */
  panel_fv?: EspecificacionesPanelFV
  /** Si batería BESS · especificaciones. */
  bateria?: EspecificacionesBateria
  /** Si aerogenerador · especificaciones. */
  aerogenerador?: EspecificacionesAerogenerador
  /** Potencia nominal global (kW · si instalación). */
  potencia_global_kw?: number
  /** Producción anual estimada (kWh/año · si instalación). */
  produccion_anual_estimada_kwh_ano?: number

  // -------------------- MARCAS Y CONFORMIDADES --------------------
  /** Fabricante OEM. */
  fabricante: string
  /** País del fabricante. */
  pais_fabricacion: ISOCountryCode
  /** Tier BNEF si aplica (Bloomberg New Energy Finance Tier 1/2/3). */
  tier_bnef?: 1 | 2 | 3
  /** Cumplimiento normas IEC + UL + EN aplicables. */
  conformidades: string[]                  // e.g. ['IEC 61215', 'IEC 61730', 'UL 61730']
  /** Marcado CE válido (Reg. UE 2019/1020 vigilancia mercado). */
  tiene_marcado_ce: boolean

  // -------------------- LOGÍSTICA --------------------
  unidad_logistica_min: 'unidad' | 'palet' | 'contenedor' | 'instalacion_completa'
  unidades_por_palet?: number
  peso_palet_kg?: number
  origen_envio_pais: ISOCountryCode

  // -------------------- INSTALACIÓN (SI APLICA) --------------------
  /** ¿La oferta incluye instalación llave en mano? */
  incluye_instalacion_llave_en_mano: boolean
  /** Servicios incluidos en la instalación. */
  servicios_instalacion_incluidos?: ('proyecto_ingenieria' | 'tramitacion_ccaa' | 'gestion_subvenciones' | 'cie_boletin' | 'cfo_certificado_fin_obra' | 'cups_punto_conexion' | 'pruebas_puesta_marcha' | 'formacion_usuario' | 'monitorizacion_online_3_anos' | 'monitorizacion_online_25_anos')[]
  /** Plazo total de ejecución llave en mano (días naturales). */
  plazo_total_instalacion_dias?: number
  /** Autorizaciones administrativas que asume el oferente (si llave en mano). */
  autorizaciones?: AutorizacionesInstalacionES

  // -------------------- COMERCIAL --------------------
  /** Modelo de contrato. */
  modelo_contrato: ModeloContratoEnergetico
  /** Si PPA · condiciones. */
  condiciones_ppa?: CondicionesPPA

  // -------------------- DECLARACIONES LEGALES --------------------
  /** El publicante declara cumplir Reg. UE 2019/1020 vigilancia mercado +
   *  marcado CE válido del producto. */
  declaracion_cumplimiento_vigilancia_mercado: boolean
  /** Declara cumplir Directiva 2012/19/UE RAEE (residuos aparatos eléctricos
   *  · paneles FV incluidos desde 2018). */
  declaracion_cumplimiento_raee: boolean
  /** Si batería · declara cumplir Reg. UE 2023/1542 Baterías. */
  declaracion_cumplimiento_reglamento_baterias?: boolean
  /** Estado de la oferta. */
  estado_oferta: 'disponible' | 'reservado' | 'agotado_stock' | 'pre_venta' | 'retirado'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD ENERGÉTICA (CLIENTE BUSCA)
// ============================================================================

/** Ficha publicada por consumidor (particular · PYME · industria · gestor
 *  comunidad energética · ayuntamiento) buscando producto o servicio.
 *
 *  Caso de uso: industria cárnica Toledo publica búsqueda de instalación
 *  autoconsumo FV cubierta 250 kWp + batería 200 kWh · llave en mano · con
 *  gestión de subvención MOVES · plazo 4 meses · presupuesto máximo
 *  220.000 € + IVA · admite financiación 10 años. */
export type NecesidadEnergeticaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_energetica'

  // -------------------- QUÉ NECESITA --------------------
  categorias_aceptadas: CategoriaProductoEnergia[]
  tipos_fuente_aceptados: TipoFuenteEnergia[]
  tipos_instalacion_aceptados?: TipoInstalacionEnergetica[]

  // -------------------- PERFIL --------------------
  perfil_solicitante: 'particular_residencial' | 'comunidad_propietarios' | 'pyme_industrial' | 'gran_industria' | 'sector_publico_administracion' | 'comunidad_energetica_local' | 'gestor_flotas_recarga' | 'promotor_renovable_utility' | 'comercializador_minorista_electricidad'

  // -------------------- DIMENSIONAMIENTO --------------------
  /** Potencia objetivo (kW). */
  potencia_objetivo_kw: number
  /** Consumo anual histórico (kWh/año) si aplica. */
  consumo_anual_kwh_ano?: number
  /** ¿Tiene proyecto técnico ya redactado? */
  tiene_proyecto_tecnico: boolean
  /** ¿Tiene punto de conexión ya asignado? */
  tiene_punto_conexion_asignado: boolean
  /** ¿Necesita gestión de subvenciones? */
  necesita_gestion_subvenciones: boolean

  // -------------------- LOCALIZACIÓN --------------------
  ubicacion_proyecto: {
    pais: ISOCountryCode
    region?: string
    provincia_estado?: string
    municipio: string
    codigo_postal: string
    /** Coordenadas para análisis de recurso (lat/lng WGS84). */
    coordenadas?: { lat: number; lng: number }
  }
  /** Superficie disponible para la instalación (m²). */
  superficie_disponible_m2?: number
  /** Tipo de superficie (cubierta · suelo · marquesina · etc.). */
  tipo_superficie?: 'cubierta_industrial' | 'cubierta_residencial' | 'suelo_agricola' | 'suelo_industrial' | 'marquesina_parking' | 'fachada' | 'plataforma_flotante'

  // -------------------- REQUISITOS CERTIFICACIÓN --------------------
  /** Certificaciones obligatorias del oferente (IDs del registry). */
  certificaciones_obligatorias: string[]
  /** ¿Exige proveedor REBT autorizado (España)? */
  exige_rebt_es?: boolean

  // -------------------- PRESUPUESTO --------------------
  presupuesto_max_eur: number
  moneda_presupuesto: string
  /** ¿Necesita financiación? */
  necesita_financiacion: boolean
  /** Modelo contractual preferido. */
  modelo_contrato_preferido: ModeloContratoEnergetico

  // -------------------- TIMING --------------------
  fecha_objetivo_puesta_marcha: string
  urgencia: 'sin_urgencia' | 'media_6_meses' | 'alta_3_meses' | 'inmediata'

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '02_b2b_nacional' | '03_servicios'
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO PROFESIONAL ENERGÉTICO
// ============================================================================

/** Ficha de servicio profesional energético ofertado por un Actor
 *  (instalador autorizado · ingeniería · auditor ISO 50001 · ESCO ·
 *  comercializador · gestor comunidad energética · O&M). */
export type ServicioEnergeticoProduct = UniversalProduct & {
  sub_categoria: 'servicio_energetico'

  // -------------------- TIPO DE SERVICIO --------------------
  tipo_servicio: TipoServicioEnergia
  /** Tecnologías en las que está especializado. */
  tecnologias_especializado: TipoFuenteEnergia[]

  // -------------------- ÁMBITO --------------------
  paises_cobertura: ISOCountryCode[]
  provincias_es?: string[]
  /** ¿Se desplaza a obra/instalación? */
  realiza_obra_en_localizacion_cliente: boolean
  /** ¿Ofrece servicio remoto (consultoría · ingeniería · auditoría)? */
  ofrece_servicio_remoto: boolean

  // -------------------- ACREDITACIONES --------------------
  /** Si instalador · habilitación REBT/ICT (España). */
  habilitacion_rebt_es?: {
    categoria_basica_bt: boolean
    categoria_especialista_bt: boolean
    numero_registro: string
    ccaa: string
    seguro_rcp_min_300k: boolean
    pdf_certificado: string
  }
  /** Si ingeniería · colegiación profesional. */
  colegiacion_ingenieria?: {
    colegio: string                       // e.g. 'Colegio Oficial Ingenieros Industriales Madrid'
    numero_colegiado: string
    especialidad: 'industrial' | 'industrial_energia' | 'minas_energia' | 'agronomos' | 'caminos_canales_puertos' | 'telecomunicacion'
    fecha_alta: string
    pdf_certificado: string
  }
  /** Si ESCO · acreditación oficial ESCO IDAE España o equivalente UE. */
  acreditacion_esco?: {
    organismo: string                     // IDAE ES · CRE FR · etc.
    numero_registro: string
    fecha_alta: string
    pdf_acreditacion: string
  }
  /** Si trading · habilitación mercado mayorista (OMIE ES · EEX · EPEX · etc.). */
  habilitacion_mercado_mayorista?: {
    mercado: 'omie_es_pt' | 'eex_de' | 'epex_eu_central' | 'gme_it' | 'nord_pool_nordic' | 'omip_pt_es_derivados'
    tipo_agente: 'productor' | 'comercializador' | 'representante_mercado' | 'autoconsumidor_agregado'
    numero_agente: string
    fecha_alta: string
  }
  /** Acreditaciones de auditoría/certificación. */
  acreditaciones_auditoria?: Array<{
    tipo: 'iso_50001_lead_auditor' | 'iso_14064_ghg_verifier' | 'verificador_huella_carbono_aenor' | 'cee_certificador_eficiencia_energetica'
    organismo_emisor: string
    fecha_obtencion: string
    pdf_url?: string
  }>
  /** Seguro de Responsabilidad Civil Profesional. */
  seguro_rcp: {
    aseguradora: string
    poliza_numero: string
    cobertura_max_eur: number
    fecha_vencimiento: string
    pdf_url: string
  }
  anos_experiencia: number
  idiomas: string[]

  // -------------------- TARIFAS --------------------
  modelo_tarifa: 'fija_por_proyecto' | 'por_hora' | 'por_kw_instalado' | 'porcentaje_inversion' | 'ahorro_garantizado_compartido_esco' | 'mixta'
  tarifa_base_eur?: number
  tarifa_por_kw_instalado_eur?: number
  porcentaje_inversion_pct?: number
  importe_minimo_eur?: number
  plazo_entrega_dias?: number

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
  /** Hitos de pago si servicios complejos. */
  hitos_pago?: Array<{
    nombre_hito: LocalizedLabel
    porcentaje: number
    evento_disparador:
      | 'firma_acuerdo'
      | 'aprobacion_proyecto_basico'
      | 'aprobacion_proyecto_ejecucion'
      | 'permiso_acceso_red'
      | 'inicio_obra'
      | 'pruebas_puesta_marcha'
      | 'cfo_certificado_fin_obra'
      | 'puesta_servicio_red'
      | 'recepcion_definitiva_1_ano'
      | 'aceptacion_cliente'
  }>
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector ENERGÍA
// ============================================================================

export type EnergiaProduct =
  | InstalacionEnergeticaProduct
  | NecesidadEnergeticaProduct
  | ServicioEnergeticoProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

export const ENERGIA_SCHEMA_VERSION = 'energia@1.0' as const

/** 'draft' hasta que sea revisado por:
 *   - APPA Asociación Empresas Energías Renovables
 *   - UNEF Unión Española Fotovoltaica
 *   - AEE Asociación Empresarial Eólica
 *   - AEH2 Asociación Española del Hidrógeno
 *   - Aelec Asociación de Empresas de Energía Eléctrica
 *   - ANESE Asociación Nacional Empresas Servicios Energéticos
 *   - IDAE (Instituto para la Diversificación y Ahorro de la Energía)
 *   - CNMC (Comisión Nacional Mercados y Competencia)
 *   - 2 instaladores PYMEs REBT con experiencia en autoconsumo
 *   - 1 ingeniero industrial colegiado energías renovables
 *   - 1 trader registrado OMIE ES
 *   - Auditoría jurídica especialista derecho energético + RED III + EPBD +
 *     regulación mercado eléctrico UE + RD 244/2019 autoconsumo + AFIR
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación). */
export const ENERGIA_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isInstalacionEnergetica(p: EnergiaProduct): p is InstalacionEnergeticaProduct {
  return p.sub_categoria === 'instalacion_energetica'
}

export function isNecesidadEnergetica(p: EnergiaProduct): p is NecesidadEnergeticaProduct {
  return p.sub_categoria === 'necesidad_energetica'
}

export function isServicioEnergetico(p: EnergiaProduct): p is ServicioEnergeticoProduct {
  return p.sub_categoria === 'servicio_energetico'
}
