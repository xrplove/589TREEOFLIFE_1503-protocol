// Schema sectorial SALUD · Fase 6 bloque D.6.
//
// Sector con la regulación más densa del catálogo 1503: productos
// sanitarios (Reg. UE 2017/745 MDR · obligatorio 26-may-2021) · diagnóstico
// in vitro (Reg. UE 2017/746 IVDR · obligatorio 26-may-2022 con escalonado
// hasta 2027) · medicamentos (Eudralex · LGURMPS · LGS) · ensayos clínicos
// (Reg. UE 536/2014 CTR) · GDPR art. 9 datos especialmente protegidos
// (categoría especial · base legal específica más allá del consentimiento) ·
// receta electrónica eIDAS sanitaria · farmacovigilancia · trazabilidad
// FMD anti-falsificación medicamentos (Directiva 2011/62/UE).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector SALUD puede
// publicar):
//
// 1. ProductoSanitarioProduct · oferta de producto sanitario (medicamento ·
//    producto sanitario MDR clase I/IIa/IIb/III · IVD clase A/B/C/D ·
//    cosmético · complemento alimenticio · mobiliario clínico ·
//    equipamiento radiológico · software médico SaMD).
//
// 2. NecesidadSanitariaProduct · centros sanitarios buscan (clínica busca
//    monitor cabecera UCI · hospital busca contrato suministro medicamentos
//    huérfanos · residencia busca dispositivo telemonitorización · farmacia
//    busca proveedor productos OTC con cadena de frío).
//
// 3. ServicioProfesionalSanitarioProduct · servicios profesionales (médico
//    colegiado consulta privada · enfermería · fisioterapia · podología ·
//    dentista · óptico · psicología · veterinaria · análisis clínico ·
//    imagen diagnóstica · telemedicina · home care · farmacia oficina ·
//    nutricionista · audioprotesista).
//
// MULTI-PAÍS: parametrizado para UE + sistemas internacionales:
//   - ES: AEMPS · CN nacional medicamentos · OMC Consejo General Médicos ·
//     RD 1277/2003 autorización centros · RD 414/1996 productos sanitarios
//   - FR: ANSM · Codes CIP/UCD · CNOM Conseil National Ordre Médecins
//   - DE: BfArM · PZN Pharmazentralnummer · Bundesärztekammer
//   - IT: AIFA · AIC autorizzazione · FNOMCeO Federazione Ordini Medici
//   - PT: INFARMED · número AIM · OM Ordem dos Médicos
//   - UK: MHRA · GMC General Medical Council · NHS Supply Chain (post-Brexit · UK MDR transitorio)
//   - US: FDA (510(k) · PMA · De Novo) · NDC · State Medical Boards
//   - INT: WHO ICD-11 · UMC PRR farmacovigilancia
//
// schema_status: 'draft' (pendiente validación experta sectorial · AEMPS ·
// OMC Consejo General Médicos · Consejo General Enfermería · Consejo
// General Farmacéuticos · Consejo Colegios Veterinarios · FENIN tecnologías
// sanitarias · FARMAINDUSTRIA · 2 centros sanitarios PYMEs ES · 1 médico
// colegiado especialista · 1 farmacéutico hospitalario · 1 técnico
// regulatory affairs MDR/IVDR · auditoría jurídica especialista derecho
// farmacéutico + datos clínicos GDPR art. 9 + ensayos clínicos CTR).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Categoría principal de producto sanitario. */
export type CategoriaProductoSanitario =
  | 'medicamento_uso_humano'
  | 'medicamento_uso_veterinario'
  | 'producto_sanitario_clase_I'                // MDR · bajo riesgo
  | 'producto_sanitario_clase_I_esteril'        // requiere notificada
  | 'producto_sanitario_clase_I_reutilizable_quirurgico'
  | 'producto_sanitario_clase_IIa'              // riesgo medio-bajo
  | 'producto_sanitario_clase_IIb'              // riesgo medio-alto
  | 'producto_sanitario_clase_III'              // alto riesgo · implantables · vida
  | 'ivd_clase_A'                               // IVDR · bajo riesgo (Reg. UE 2017/746)
  | 'ivd_clase_B'
  | 'ivd_clase_C'
  | 'ivd_clase_D'                               // alto riesgo público (HIV · HCV · etc.)
  | 'cosmetico'                                 // Reg. CE 1223/2009
  | 'complemento_alimenticio'                   // Directiva 2002/46/CE
  | 'producto_higiene_personal'
  | 'mobiliario_clinico_no_sanitario'           // camas · taburetes
  | 'equipamiento_radiologico'                  // RX · TAC · RMN
  | 'dispositivo_electromedico'                 // EKG · monitores · ventilación
  | 'software_medico_samd'                      // Software as a Medical Device · MDR
  | 'biomaterial_implante_tisular'
  | 'producto_oftalmologia_optica'

/** Tipo de dispensación del medicamento. */
export type TipoMedicamento =
  | 'prescripcion_uso_hospitalario_h'           // dispensación EXCLUSIVA hospital
  | 'prescripcion_diagnostico_hospitalario_dh'
  | 'prescripcion_obligatoria_ambulatoria'
  | 'sin_receta_otc'
  | 'estupefaciente_lista_i'                    // Convención 1961 ONU
  | 'estupefaciente_lista_ii_iv'
  | 'psicotropo_lista_i_anexo'                  // Convención 1971 ONU
  | 'psicotropo_lista_ii_iv_anexo'
  | 'medicamento_huerfano'                      // Reg. CE 141/2000
  | 'medicamento_terapia_avanzada_atmp'         // Reg. CE 1394/2007 (terapia génica · celular · tisular ingeniería)
  | 'biosimilar'
  | 'vacuna_humana'
  | 'vacuna_veterinaria'
  | 'hemoderivado_plasma_sangre'
  | 'gas_medicinal'                             // oxígeno · óxido nítrico · etc.
  | 'formula_magistral'                         // preparado oficinal/magistral farmacia

/** Vía de administración del medicamento. */
export type ViaAdministracion =
  | 'oral'
  | 'sublingual'
  | 'parenteral_intravenosa_iv'
  | 'parenteral_intramuscular_im'
  | 'parenteral_subcutanea_sc'
  | 'parenteral_intradermica_id'
  | 'parenteral_intratecal_intra_articular'
  | 'topica_dermica'
  | 'topica_mucosa'
  | 'rectal'
  | 'vaginal'
  | 'oftalmica'
  | 'otica'
  | 'nasal'
  | 'inhalatoria'
  | 'transdermica_parche'
  | 'implante_subcutaneo'

/** Especialidad médica reconocida en España (BOE listado oficial · MIR/EIR/PIR/FIR/QIR). */
export type EspecialidadMedica =
  | 'medicina_familiar_comunitaria'
  | 'pediatria_areas_especificas'
  | 'medicina_interna'
  | 'cirugia_general_digestivo'
  | 'cirugia_ortopedica_traumatologia'
  | 'cirugia_cardiovascular'
  | 'cirugia_toracica'
  | 'cirugia_plastica_estetica_reparadora'
  | 'neurocirugia'
  | 'cirugia_oral_maxilofacial'
  | 'cirugia_pediatrica'
  | 'cardiologia'
  | 'neumologia'
  | 'gastroenterologia'
  | 'nefrologia'
  | 'endocrinologia_nutricion'
  | 'reumatologia'
  | 'hematologia_hemoterapia'
  | 'oncologia_medica'
  | 'oncologia_radioterapica'
  | 'neurologia'
  | 'psiquiatria'
  | 'dermatologia_medico_quirurgica_venereologia'
  | 'ginecologia_obstetricia'
  | 'urologia'
  | 'oftalmologia'
  | 'otorrinolaringologia'
  | 'anestesiologia_reanimacion'
  | 'medicina_intensiva'
  | 'medicina_urgencias_emergencias'
  | 'radiodiagnostico'
  | 'medicina_nuclear'
  | 'analisis_clinicos'
  | 'anatomia_patologica'
  | 'microbiologia_parasitologia'
  | 'inmunologia'
  | 'medicina_preventiva_salud_publica'
  | 'medicina_trabajo'
  | 'medicina_legal_forense'
  | 'rehabilitacion_medicina_fisica'
  | 'geriatria'
  | 'alergologia'
  | 'angiologia_cirugia_vascular'
  | 'medicina_familiar'

/** Tipo de servicio profesional sanitario. */
export type TipoServicioSanitario =
  | 'consulta_medica_presencial'
  | 'consulta_medica_telemedicina_videoconsulta'
  | 'consulta_enfermeria'
  | 'visita_domiciliaria_medica'
  | 'visita_domiciliaria_enfermeria'
  | 'fisioterapia'
  | 'osteopatia'
  | 'podologia'
  | 'odontologia_general'
  | 'odontologia_implantes'
  | 'odontologia_ortodoncia'
  | 'optometria_optica_oftalmica'
  | 'audiologia_audioprotesis'
  | 'logopedia'
  | 'psicologia_clinica'
  | 'psicologia_general_sanitaria'
  | 'psicoterapia'
  | 'nutricion_dietetica'
  | 'matrona_obstetricia'
  | 'terapia_ocupacional'
  | 'analisis_clinicos_extraccion'
  | 'imagen_diagnostica_rx'
  | 'imagen_diagnostica_ecografia'
  | 'imagen_diagnostica_tac'
  | 'imagen_diagnostica_rmn'
  | 'medicina_estetica'
  | 'medicina_deportiva'
  | 'veterinaria_pequenos_animales'
  | 'veterinaria_grandes_animales_rurales'
  | 'veterinaria_equina'
  | 'veterinaria_exoticos'
  | 'farmacia_oficina_dispensacion'
  | 'farmacia_hospitalaria'
  | 'parafarmacia'
  | 'urgencias_24h'
  | 'home_hospital_alta_complejidad'

/** Base legal GDPR art. 9 para tratamiento de datos sanitarios. */
export type BaseLegalDatosSaludGDPR =
  | 'consentimiento_explicito_art_9_2_a'
  | 'fines_medicina_preventiva_diagnostico_tratamiento_art_9_2_h'
  | 'salud_publica_art_9_2_i'
  | 'investigacion_cientifica_estadistica_art_9_2_j'
  | 'cumplimiento_obligacion_laboral_seguridad_social_art_9_2_b'
  | 'protege_intereses_vitales_art_9_2_c'
  | 'tratamiento_lic_organizacion_no_animo_lucro_art_9_2_d'

// ============================================================================
// IDENTIFICACIÓN DE MEDICAMENTO Y PRODUCTO SANITARIO
// ============================================================================

/** Identificación oficial de un medicamento. */
export type IdentificacionMedicamento = {
  /** Código Nacional del Medicamento (CN · España · 6-7 dígitos). */
  codigo_nacional_es?: string
  /** Número AIC (Italia) · AIM (Portugal) · PZN (Alemania). */
  codigo_pais_alternativo?: {
    pais: ISOCountryCode
    codigo: string
  }
  /** Código ATC (Anatomical Therapeutic Chemical · WHO 5 niveles). */
  codigo_atc: string
  /** Principio activo (DCI · Denominación Común Internacional WHO INN). */
  principio_activo_dci: string
  /** Concentración + unidad (e.g. "500 mg" · "10 mg/mL"). */
  concentracion: string
  /** Forma farmacéutica (comprimido · cápsula · inyectable · jarabe · etc.). */
  forma_farmaceutica: string
  /** Marca comercial. */
  marca_comercial?: string
  /** Genérico (EFG · Equivalente Farmacéutico Genérico). */
  es_efg_generico: boolean
  /** Número de unidades por envase (e.g. 30 comprimidos). */
  unidades_por_envase: number
  /** Vía de administración. */
  via_administracion: ViaAdministracion
  /** Excipientes de declaración obligatoria (Anexo I RD 1345/2007 ES). */
  excipientes_declaracion_obligatoria?: string[]
}

/** Identificación de producto sanitario MDR. */
export type IdentificacionProductoSanitarioMDR = {
  /** Basic UDI-DI (Unique Device Identifier · MDR art. 27 · base de UDI). */
  basic_udi_di: string
  /** UDI-DI (Device Identifier · más granular · por modelo). */
  udi_di?: string
  /** Código GMDN (Global Medical Device Nomenclature · ISO 15225). */
  codigo_gmdn?: string
  /** Código EMDN (European Medical Device Nomenclature · oficial UE post-MDR). */
  codigo_emdn?: string
  /** Marca comercial. */
  marca_comercial: string
  /** Modelo / referencia. */
  modelo: string
  /** Generación / versión. */
  generacion?: string
  /** ¿Es producto a medida (custom-made) según art. 2(3) MDR? */
  es_a_medida_custom: boolean
  /** ¿Es producto reutilizable? */
  es_reutilizable: boolean
  /** Si reutilizable: número de reusos máximos. */
  num_reusos_max?: number
}

// ============================================================================
// AUTORIZACIÓN COMERCIALIZACIÓN
// ============================================================================

/** Autorización de comercialización del medicamento (AEMPS o autoridad
 *  competente UE/nacional). */
export type AutorizacionMedicamento = {
  /** Número de autorización (AEMPS ES · AIC IT · AMM FR · etc.). */
  numero_autorizacion: string
  /** Autoridad emisora. */
  autoridad_emisora: 'AEMPS_ES' | 'EMA_centralizado' | 'AIFA_IT' | 'ANSM_FR' | 'BfArM_DE' | 'INFARMED_PT' | 'MHRA_UK' | 'FDA_US' | 'otra_nacional'
  /** Procedimiento de autorización. */
  procedimiento: 'nacional' | 'centralizado_ema' | 'reconocimiento_mutuo_mrp' | 'descentralizado_dcp'
  /** Fecha de autorización inicial. */
  fecha_autorizacion: string
  /** Fecha de última renovación. */
  fecha_ultima_renovacion?: string
  /** Titular de la autorización (MAH · Marketing Authorization Holder). */
  titular_mah: string
  /** Fabricante (puede ser distinto del MAH). */
  fabricante: string
  /** Fabricante del API (Active Pharmaceutical Ingredient). */
  fabricante_api?: string
  /** Países en los que está autorizado. */
  paises_autorizado: ISOCountryCode[]
  /** Resumen Características Producto (RCP · SmPC) URL pública. */
  rcp_smpc_url?: string
  /** Prospecto URL público. */
  prospecto_url?: string
}

/** Datos del lote concreto en venta (medicamento o producto sanitario). */
export type LoteProductoSanitario = {
  /** Número de lote. */
  numero_lote: string
  /** Fecha de fabricación. */
  fecha_fabricacion: string
  /** Fecha de caducidad (Best Before · End Date). */
  fecha_caducidad: string
  /** Cantidad disponible del lote en el envase declarado. */
  cantidad_disponible: number
  /** Condiciones de conservación específicas. */
  condiciones_conservacion?: LocalizedLabel
  /** ¿Mantenido en cadena de frío durante TODO el suministro? */
  cadena_frio_mantenida: boolean
  /** Datalogger temperatura disponible si cadena de frío. */
  datalogger_temperatura_disponible?: boolean
  /** ¿Lote serializado con Falsified Medicines Directive 2D code? */
  serializacion_fmd_2d: boolean
}

// ============================================================================
// CONFORMIDAD MDR / IVDR / CE MARKING
// ============================================================================

/** Conformidad CE del producto sanitario bajo MDR/IVDR. */
export type ConformidadCEProductoSanitario = {
  /** ¿Tiene marcado CE? */
  tiene_marcado_ce: boolean
  /** Número del organismo notificado (4 dígitos · solo si requiere notificada). */
  numero_organismo_notificado?: string
  /** Nombre del organismo notificado. */
  nombre_organismo_notificado?: string
  /** Número del certificado CE emitido. */
  numero_certificado_ce: string
  /** Fecha de emisión del certificado. */
  fecha_emision_certificado: string
  /** Fecha de expiración del certificado. */
  fecha_expiracion_certificado: string
  /** Declaración UE de Conformidad URL. */
  declaracion_conformidad_url?: string
  /** ¿Es legacy device (transición MDD→MDR · art. 120 MDR)? */
  es_legacy_device_transicion_mdr: boolean
  /** Fecha límite de transición legacy → MDR completo. */
  fecha_limite_transicion_legacy?: string
  /** Información en SRN (Single Registration Number EUDAMED). */
  srn_fabricante_eudamed?: string
}

// ============================================================================
// ACREDITACIÓN PROFESIONAL SANITARIA
// ============================================================================

/** Colegiación de profesional sanitario. */
export type ColegiacionSanitaria = {
  /** Colegio profesional. */
  colegio: string                                // e.g. 'Ilustre Colegio Oficial de Médicos de Madrid (ICOMEM)'
  /** Profesión colegiada. */
  profesion: 'medico' | 'enfermeria' | 'farmaceutico' | 'odontologo' | 'veterinario' | 'fisioterapeuta' | 'podologo' | 'optico_optometrista' | 'psicologo' | 'logopeda' | 'nutricionista_dietista' | 'biologo_sanitario' | 'quimico_sanitario'
  /** Número de colegiado. */
  numero_colegiado: string
  /** Fecha de alta. */
  fecha_alta: string
  /** ¿Ejerciente activo? */
  es_ejerciente: boolean
  /** Cuotas al día. */
  cuotas_al_dia: boolean
  /** Especialidad reconocida (vía MIR/EIR/PIR/FIR/QIR ES). */
  especialidad?: EspecialidadMedica
  /** Vía de obtención de la especialidad. */
  via_especialidad?: 'MIR' | 'EIR' | 'PIR' | 'FIR' | 'QIR' | 'BIR' | 'homologacion_extranjera' | 'no_aplica'
  /** Año de finalización formación especializada. */
  ano_finalizacion_especialidad?: number
  /** Seguro de Responsabilidad Civil Profesional (obligatorio Ley 44/2003). */
  seguro_rcp_pdf_url?: string
  /** ¿Verificado por 1503 contra registro colegial? */
  verificado_por_1503: boolean
}

/** Autorización de centro sanitario (RD 1277/2003 ES · CCAA competente). */
export type AutorizacionCentroSanitario = {
  /** Número de Registro de Centro Sanitario. */
  numero_registro_cs: string
  /** CCAA autorizante. */
  ccaa: string
  /** Tipo de centro según RD 1277/2003. */
  tipo_centro: 'C1_consultas' | 'C2_consultas_multidisciplinares' | 'C3_centros_polivalentes' | 'C25_centros_dialisis' | 'U_unidades' | 'H_hospitales'
  /** Actividades autorizadas. */
  actividades_autorizadas: string[]
  /** ¿Concertado con SNS / Sistema Sanitario Público? */
  es_concertado_sns: boolean
  /** Fecha alta autorización. */
  fecha_alta_autorizacion: string
  /** PDF de autorización. */
  pdf_autorizacion: string
}

// ============================================================================
// DATOS CLÍNICOS Y GDPR ART. 9
// ============================================================================

/** Marco de tratamiento de datos clínicos según GDPR art. 9. */
export type MarcoDatosClinicosGDPR = {
  /** Base legal aplicable según GDPR art. 9.2. */
  base_legal_gdpr_art_9: BaseLegalDatosSaludGDPR
  /** ¿Requiere consentimiento informado adicional del paciente para este
   *  servicio/producto (e.g. tratamientos experimentales)? */
  requiere_consentimiento_informado_adicional: boolean
  /** ¿Los datos clínicos generados se almacenan disociados/seudonimizados? */
  datos_seudonimizados: boolean
  /** ¿El servicio implica transferencia internacional de datos sanitarios? */
  transferencia_internacional_datos: boolean
  /** Si hay transferencia: países destino. */
  paises_transferencia_datos?: ISOCountryCode[]
  /** Si hay transferencia: base legal de transferencia internacional. */
  base_legal_transferencia?: 'decision_adecuacion_art_45' | 'garantias_adecuadas_art_46_SCC' | 'consentimiento_explicito_art_49_1_a' | 'no_aplica'
  /** Plazo de conservación de la historia clínica (años · mínimo 5 años
   *  Ley 41/2002 ES tras última asistencia · variable CCAA). */
  plazo_conservacion_historia_clinica_anos: number
  /** ¿DPO designado del centro/profesional? */
  dpo_designado: boolean
  /** Identificador del DPO (contacto público para ejercicio derechos). */
  contacto_dpo?: string
}

// ============================================================================
// SUB-CATEGORÍA 1 · OFERTA DE PRODUCTO SANITARIO
// ============================================================================

/** Ficha de oferta de producto sanitario publicada por laboratorio,
 *  distribuidor sanitario, fabricante MDR/IVDR, farmacia o parafarmacia.
 *
 *  Caso de uso: distribuidor sanitario autorizado AEMPS publica oferta de
 *  monitor de cabecera UCI clase IIb · marcado CE notificada 0123 · ISO
 *  13485 vigente · stock 12 unidades · entrega 5 días laborables · precio
 *  B2B 8.400 €/unidad · admite leasing financiero. */
// v1.1: producto físico · extiende DPPProduct (UniversalProduct + 6 capas DPP A-F).
// Cumplimiento ESPR + MDR Reg. UE 2017/745 (productos sanitarios) + IVDR
// Reg. UE 2017/746 (diagnóstico in vitro) + IMDG si transporte material
// peligroso (citotóxicos · radiofármacos · diagnóstico in vitro Class 6.2
// sustancias infecciosas) + CRA si dispositivo médico digital con software
// embebido (clase IIa+ MDR son automáticamente class_I CRA).
export type ProductoSanitarioProduct = DPPProduct & {
  sub_categoria: 'producto_sanitario'

  // -------------------- CLASIFICACIÓN --------------------
  categoria: CategoriaProductoSanitario

  // -------------------- IDENTIFICACIÓN --------------------
  /** Si medicamento · identificación. */
  identificacion_medicamento?: IdentificacionMedicamento
  /** Si producto sanitario MDR/IVDR · identificación. */
  identificacion_dispositivo?: IdentificacionProductoSanitarioMDR
  /** Tipo de medicamento (solo si categoria='medicamento_*'). */
  tipo_medicamento?: TipoMedicamento

  // -------------------- AUTORIZACIÓN / CONFORMIDAD --------------------
  /** Si medicamento · autorización comercialización. */
  autorizacion_medicamento?: AutorizacionMedicamento
  /** Si producto sanitario · conformidad CE MDR/IVDR. */
  conformidad_ce?: ConformidadCEProductoSanitario

  // -------------------- LOTE EN OFERTA --------------------
  lote: LoteProductoSanitario

  // -------------------- COMERCIAL --------------------
  /** ¿Se vende SOLO a profesionales sanitarios (requiere KYC profesional)? */
  venta_restringida_profesional_sanitario: boolean
  /** ¿Requiere receta médica para dispensación al paciente? */
  requiere_receta_medica: boolean
  /** Tipo de receta requerida. */
  tipo_receta?: 'receta_publica' | 'receta_privada' | 'receta_electronica_eidas' | 'receta_estupefacientes' | 'receta_visado_inspeccion'
  /** ¿Producto financiado por SNS (España)? */
  financiado_sns_es?: boolean
  /** Aportación del paciente si financiado SNS (%). */
  aportacion_paciente_sns_pct?: number
  /** Precio Venta Laboratorio (PVL · sin IVA · obligatorio en pricing
   *  oficial ES medicamentos financiados). */
  pvl_eur?: number
  /** Precio Venta Almacén Distribuidor (PVA). */
  pva_eur?: number
  /** Precio Venta Público (PVP) incluyendo IVA. */
  pvp_eur?: number

  // -------------------- TRAZABILIDAD ANTI-FALSIFICACIÓN --------------------
  /** Cumple Directiva 2011/62/UE FMD (Falsified Medicines Directive · 2D
   *  data matrix + dispositivo anti-manipulación para Rx). */
  cumple_fmd_anti_falsificacion: boolean
  /** ¿Registrado en SEVeM (Sistema Español de Verificación de
   *  Medicamentos)? */
  registrado_sevem_es: boolean

  // -------------------- DECLARACIONES LEGALES --------------------
  /** El publicante declara ser laboratorio · MAH · distribuidor autorizado
   *  AEMPS · farmacia · parafarmacia con título habilitante para vender el
   *  producto que oferta. */
  declaracion_actor_autorizado_aemps: boolean
  /** El publicante declara cumplir Buenas Prácticas Distribución (GDP)
   *  Directiva 2013/C 343/01. */
  declaracion_cumplimiento_gdp: boolean
  /** El publicante declara mantener cadena de frío durante TODO el
   *  almacenaje y transporte si el producto la requiere. */
  declaracion_cadena_frio_mantenida_si_aplica: boolean
  /** Estado de la oferta. */
  estado_oferta: 'disponible' | 'reservado' | 'agotado_temporal' | 'retirado_alerta_farmacovigilancia'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD SANITARIA (CENTRO/PROFESIONAL BUSCA)
// ============================================================================

/** Ficha publicada por un centro sanitario, hospital, clínica, residencia,
 *  farmacia o profesional sanitario buscando producto o servicio concreto.
 *
 *  Caso de uso: hospital universitario Valencia publica búsqueda de contrato
 *  marco 2 años suministro tiras reactivas glucemia · IVD clase B ·
 *  600.000 tiras/año · entregas mensuales · presupuesto máximo 0,18 €/tira ·
 *  certificado ISO 13485 obligatorio del proveedor. */
export type NecesidadSanitariaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_sanitaria'

  // -------------------- QUÉ BUSCA --------------------
  categorias_aceptadas: CategoriaProductoSanitario[]
  /** Si busca medicamento · tipos aceptados. */
  tipos_medicamento_aceptados?: TipoMedicamento[]
  /** Si busca servicio · tipos aceptados. */
  tipos_servicio_aceptados?: TipoServicioSanitario[]

  // -------------------- PERFIL DEL SOLICITANTE --------------------
  perfil_solicitante: 'hospital_publico' | 'hospital_privado' | 'clinica_privada' | 'centro_salud_primaria' | 'residencia_socio_sanitaria' | 'farmacia_oficina' | 'farmacia_hospitalaria' | 'parafarmacia' | 'distribuidor_sanitario' | 'laboratorio_clinico' | 'centro_imagen_diagnostica' | 'paciente_particular'

  // -------------------- CANTIDAD Y CADENCIA --------------------
  cantidad_total: number
  unidad_cantidad: 'unidad' | 'envase' | 'caja' | 'palet' | 'kg' | 'L'
  /** ¿Contrato recurrente / marco? */
  es_contrato_marco_recurrente: boolean
  duracion_contrato_meses?: number
  frecuencia_entrega?: 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'a_demanda_just_in_time'

  // -------------------- REQUISITOS REGULATORIOS --------------------
  /** Certificaciones obligatorias del oferente (IDs registry). */
  certificaciones_obligatorias: string[]
  /** ¿Exige producto autorizado AEMPS / EMA? */
  exige_autorizacion_aemps_ema: boolean
  /** Si MDR · exige marcado CE notificada. */
  exige_marcado_ce_notificada?: boolean
  /** Países de procedencia aceptados (positivo). */
  paises_origen_aceptados?: ISOCountryCode[]

  // -------------------- PRESUPUESTO --------------------
  presupuesto_max_por_unidad_eur: number
  moneda_presupuesto: string
  /** Modelo de pricing aceptable. */
  modelo_pricing_aceptable: ('precio_fijo' | 'indexado_consumo' | 'risk_sharing_outcomes_based' | 'contrato_capitativo')[]

  // -------------------- TIMING --------------------
  fecha_entrega_objetivo: string
  urgencia: 'sin_urgencia' | 'media_3_meses' | 'alta_1_mes' | 'urgente_vital_24_72h'

  // -------------------- LOGÍSTICA --------------------
  punto_entrega: {
    pais: ISOCountryCode
    municipio: string
    codigo_postal: string
    centro_sanitario_destino?: string
  }
  /** Requiere cadena de frío. */
  requiere_cadena_frio: boolean
  /** Tramo de temperatura. */
  rango_temperatura_celsius?: { min: number; max: number }

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '02_b2b_nacional' | '03_servicios' | '04_importacion'
  /** Plazo de pago (días desde factura · Ley 3/2004 ES sector salud máx 60 días). */
  plazo_pago_dias: number
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO PROFESIONAL SANITARIO
// ============================================================================

/** Ficha de servicio profesional sanitario ofertado por un profesional
 *  colegiado o centro autorizado.
 *
 *  Caso de uso: clínica oftalmología Madrid publica servicio quirúrgico
 *  lasik miopía · 2 cirujanos oftalmólogos colegiados · centro autorizado
 *  CCAA · equipamiento marcado CE · precio cerrado 2.400 €/ojo · admite
 *  financiación 12 meses sin intereses · prequirúrgico y postoperatorio
 *  incluidos. */
export type ServicioProfesionalSanitarioProduct = UniversalProduct & {
  sub_categoria: 'servicio_profesional_sanitario'

  // -------------------- TIPO DE SERVICIO --------------------
  tipo_servicio: TipoServicioSanitario
  /** Si servicio médico · especialidad principal. */
  especialidad_principal?: EspecialidadMedica
  /** Si servicio veterinario · especies atendidas. */
  especies_atendidas_veterinaria?: ('perros_gatos' | 'equinos' | 'rumiantes' | 'porcino' | 'aves' | 'conejos' | 'exoticos' | 'fauna_silvestre' | 'animales_acuaticos')[]

  // -------------------- ÁMBITO Y MODALIDAD --------------------
  paises_cobertura: ISOCountryCode[]
  provincias_es?: string[]
  modalidad_atencion: 'presencial_consulta_centro' | 'presencial_domicilio_paciente' | 'telemedicina_videoconsulta' | 'telemedicina_asincrona_mensaje' | 'mixta'
  /** Dirección del centro principal (si presencial). */
  direccion_centro_principal?: {
    pais: ISOCountryCode
    municipio: string
    codigo_postal: string
    direccion: string
  }

  // -------------------- ACREDITACIÓN PROFESIONAL --------------------
  colegiacion: ColegiacionSanitaria
  /** Acreditaciones adicionales del profesional. */
  acreditaciones_adicionales?: Array<{
    tipo: 'master_oficial' | 'doctorado' | 'fellowship' | 'curso_acreditado_comision_formacion_continuada' | 'certificacion_internacional'
    titulo: string
    organismo_emisor: string
    fecha_obtencion: string
    pdf_url?: string
  }>

  // -------------------- AUTORIZACIÓN DEL CENTRO --------------------
  autorizacion_centro?: AutorizacionCentroSanitario

  // -------------------- DATOS CLÍNICOS Y GDPR --------------------
  marco_gdpr: MarcoDatosClinicosGDPR

  // -------------------- TARIFAS --------------------
  modelo_tarifa: 'consulta_fija' | 'tratamiento_cerrado' | 'por_acto' | 'iguala_mensual' | 'capitativo_per_capita' | 'mixta'
  tarifa_consulta_eur?: number
  tarifa_tratamiento_cerrado_eur?: number
  /** Duración de la consulta (minutos). */
  duracion_consulta_min?: number
  /** Plazo medio de cita disponible (días). */
  plazo_proxima_cita_dias?: number
  /** ¿Acepta urgencias (sin cita previa · recargo)? */
  acepta_urgencias_sin_cita: boolean
  /** ¿Acepta sociedad médica privada · cuáles? */
  acepta_aseguradoras_privadas?: string[]
  /** ¿Concertado SNS? */
  es_concertado_sns: boolean

  // -------------------- DECLARACIONES --------------------
  /** El publicante declara cumplir Ley 41/2002 autonomía del paciente +
   *  Ley 44/2003 ordenación profesiones sanitarias + LOPS deontología. */
  declaracion_cumplimiento_lops_lo_paciente: boolean
  /** El publicante declara cumplir GDPR art. 9 + Ley 41/2002 documentación
   *  clínica. */
  declaracion_cumplimiento_gdpr_art_9: boolean

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector SALUD
// ============================================================================

export type SaludProduct =
  | ProductoSanitarioProduct
  | NecesidadSanitariaProduct
  | ServicioProfesionalSanitarioProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

export const SALUD_SCHEMA_VERSION = 'salud@1.0' as const

/** 'draft' hasta que sea revisado por:
 *   - AEMPS (Agencia Española Medicamentos y Productos Sanitarios)
 *   - OMC (Consejo General Colegios Médicos)
 *   - Consejo General Colegios Enfermería
 *   - Consejo General Colegios Farmacéuticos
 *   - Consejo General Colegios Veterinarios
 *   - FENIN (Federación Empresarial de la Tecnología Sanitaria)
 *   - FARMAINDUSTRIA
 *   - 2 centros sanitarios PYMEs ES (uno autorizado SNS, uno privado puro)
 *   - 1 médico colegiado especialista ejerciente
 *   - 1 farmacéutico hospitalario
 *   - 1 técnico Regulatory Affairs MDR/IVDR
 *   - Auditoría jurídica especialista derecho farmacéutico + datos clínicos
 *     GDPR art. 9 + ensayos clínicos CTR + farmacovigilancia
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación). */
export const SALUD_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isProductoSanitario(p: SaludProduct): p is ProductoSanitarioProduct {
  return p.sub_categoria === 'producto_sanitario'
}

export function isNecesidadSanitaria(p: SaludProduct): p is NecesidadSanitariaProduct {
  return p.sub_categoria === 'necesidad_sanitaria'
}

export function isServicioProfesionalSanitario(p: SaludProduct): p is ServicioProfesionalSanitarioProduct {
  return p.sub_categoria === 'servicio_profesional_sanitario'
}
