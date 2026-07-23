// Schema sectorial LEGAL · Fase 6 bloque D.4.
//
// El sector legal es transversal a todos los demás sectores 1503:
// cualquier operación (compraventa inmobiliaria · escrow internacional ·
// constitución de SL · oferta de marca · acuerdo de inversión · contrato de
// prestación de servicios · escritura notarial) puede requerir intervención
// de abogado · notario · gestor administrativo · procurador.
//
// Vínculo crítico con Fase 8 NOTARIADO INTEGRADO del PRD: este schema sienta
// las primitivas que la Fase 8 reutilizará para firmar actos jurídicos
// electrónicamente con valor de fe pública (Ley 11/2023 · eIDAS qualified).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector LEGAL puede
// publicar):
//
// 1. ServicioJuridicoProduct · servicio legal ofertado por abogado o
//    despacho (asesoría mercantil · contratos · litigación · administrativo ·
//    fiscal · laboral · IP · GDPR · concursal · arbitraje · M&A · familia ·
//    sucesiones · internacional · etc.).
//
// 2. NecesidadJuridicaProduct · cliente busca asesoría (PYME necesita
//    revisión contractual · particular necesita gestión herencia · start-up
//    necesita stack legal completo · inversor necesita due diligence).
//
// 3. ServicioNotarialProduct · servicios notariales específicos (poder
//    general · poder especial · escritura compraventa · constitución SL ·
//    actas notariales · apostillas · firmas electrónicas eIDAS qualified ·
//    protocolización · capitulaciones matrimoniales).
//
// Cada sub-categoría extiende UniversalProduct + añade sus campos específicos.
//
// MULTI-PAÍS: campos parametrizados para soportar sistemas jurídicos UE +
// internacionales:
//   - ES: Colegios provinciales (ICAM · ICAB · ICAV · etc.) · CGN notarial ·
//     Ley 34/2006 acceso abogacía · Master MUA obligatorio
//   - FR: Barreau (París · Lyon · Marseille) · Notaires de France
//   - DE: Rechtsanwaltskammer · Bundesnotarkammer
//   - UK: Solicitors Regulation Authority (SRA) · Bar Standards Board ·
//     Notaries Society (post-Brexit · sistema separado civil/common law)
//   - IT: Consiglio Nazionale Forense · Consiglio Nazionale Notariato
//   - PT: Ordem dos Advogados · Ordem dos Notários
//   - INT: IBA · UIA · UINL (Notariado Latino)
//
// schema_status: 'draft' (pendiente validación experta sectorial · CGAE
// Consejo General Abogacía Española · CGN Consejo General Notariado ·
// Consejo General Procuradores · Consejo General Gestores Administrativos ·
// 2 despachos PYMEs ejercientes ES · 1 notaría ejerciente ES · auditoría
// jurídica especialista en deontología profesional + LSSI-CE + RGPD +
// eIDAS qualified signatures).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Áreas de práctica jurídica reconocidas. Alineadas con clasificación CGAE
 *  + áreas IBA/UIA internacionales. */
export type AreaPracticaJuridica =
  | 'mercantil_societario'              // sociedades · juntas · gobierno corporativo
  | 'mercantil_contratos'               // contratos mercantiles B2B
  | 'mercantil_concursal'               // pre-concurso · concurso de acreedores
  | 'mercantil_M_A'                     // fusiones y adquisiciones · due diligence
  | 'mercantil_competencia'             // antitrust · competencia desleal
  | 'civil_general'                     // obligaciones · contratos civiles
  | 'civil_inmobiliario'                // compraventa · arrendamiento · PH
  | 'civil_familia_sucesiones'          // matrimonio · separación · herencias
  | 'civil_responsabilidad'             // daños · seguros
  | 'penal_general'
  | 'penal_economico'                   // delitos económicos · blanqueo · corrupción
  | 'penal_compliance'                  // responsabilidad penal personas jurídicas
  | 'fiscal_tributario'                 // IRPF · IS · IVA · ITP · sucesiones
  | 'fiscal_internacional'              // doble imposición · paraísos · BEPS
  | 'laboral_individual'                // contratos · despidos · prevención
  | 'laboral_colectivo'                 // convenios · huelgas · representación
  | 'laboral_seguridad_social'
  | 'administrativo_general'            // contencioso-administrativo · responsabilidad patrimonial
  | 'administrativo_urbanistico'        // licencias · planeamiento · expropiaciones
  | 'administrativo_contratacion_publica' // LCSP · concursos públicos
  | 'administrativo_extranjeria'        // visados · arraigo · nacionalidad
  | 'ip_marcas_patentes'                // propiedad industrial · marcas · patentes · diseños
  | 'ip_propiedad_intelectual'          // derechos autor · LPI
  | 'ip_software_tech'                  // licencias software · SaaS · open source
  | 'datos_gdpr'                        // RGPD · LSSI-CE · LOPDGDD · DPO
  | 'fintech_blockchain'                // MiCA · tokenización · cripto
  | 'fintech_banking'                   // banca · pagos · PSD2
  | 'aml_kyc_compliance'                // Ley 10/2010 · SEPBLAC · KYC empresas
  | 'energia_renovables'
  | 'medioambiental'                    // EIA · ley costas · residuos · cambio climático
  | 'transporte_logistica'              // CMR · contratos transporte · seguros marítimos
  | 'maritimo'                          // Derecho marítimo · UNCLOS
  | 'aviacion'                          // Derecho aéreo · IATA · OACI
  | 'farmaceutico_sanitario'            // AEMPS · ensayos clínicos · responsabilidad
  | 'alimentario'                       // food law UE · etiquetado · seguridad alimentaria
  | 'consumidor_ecommerce'              // LSSI-CE · LDCU · ARCO · comercio electrónico
  | 'arbitraje_mediacion'               // arbitraje nacional · CCI · mediación
  | 'deportivo'                         // TAS · derecho deportivo
  | 'eclesiastico_religioso'            // derecho canónico · matrimonio religioso
  | 'derechos_humanos'
  | 'internacional_publico'
  | 'internacional_privado'

/** Forma jurídica del cliente típico del servicio. */
export type FormaJuridicaCliente =
  | 'persona_fisica'
  | 'autonomo_persona_fisica'
  | 'sociedad_limitada_sl'
  | 'sociedad_anonima_sa'
  | 'sociedad_limitada_unipersonal_slu'
  | 'sociedad_comanditaria'
  | 'sociedad_civil'
  | 'sociedad_laboral_sll_sal'
  | 'sociedad_profesional_slp'
  | 'cooperativa'
  | 'fundacion'
  | 'asociacion'
  | 'agrupacion_interes_economico_aie'
  | 'union_temporal_empresas_ute'
  | 'comunidad_bienes'
  | 'comunidad_propietarios'
  | 'administracion_publica'
  | 'organizacion_no_gubernamental'
  | 'organizacion_religiosa'

/** Modelo de tarifa aplicable al servicio. */
export type ModeloTarifaJuridica =
  | 'por_hora'                          // billable hour clásico
  | 'fija_proyecto'                     // tarifa cerrada por proyecto
  | 'fija_por_acto'                     // e.g. por contrato redactado · escritura
  | 'iguala_mensual'                    // retainer mensual · servicios recurrentes
  | 'contingencia_exito'                // % sobre resultado obtenido (NO permitido en todos los casos · CGAE arts. 16-17)
  | 'mixta_hora_exito'                  // base hora + bonus exito
  | 'mixta_fija_exito'                  // base fija + bonus exito
  | 'pro_bono'                          // gratuito

/** Tipo de acto notarial. */
export type TipoActoNotarial =
  | 'poder_general'
  | 'poder_especial'
  | 'poder_preventivo_incapacidad'      // art. 1732 CC
  | 'escritura_compraventa_inmueble'
  | 'escritura_constitucion_sociedad'
  | 'escritura_modificacion_estatutos'
  | 'escritura_ampliacion_capital'
  | 'escritura_reduccion_capital'
  | 'escritura_disolucion_liquidacion'
  | 'escritura_donacion'
  | 'escritura_hipoteca'
  | 'testamento_abierto'
  | 'testamento_cerrado'
  | 'testamento_ologrofo_protocolizacion'
  | 'declaracion_herederos_abintestato'
  | 'aceptacion_renuncia_herencia'
  | 'particion_herencia'
  | 'capitulaciones_matrimoniales'
  | 'separacion_bienes_matrimonial'
  | 'acta_notarial_presencia'           // constatación hechos
  | 'acta_notarial_remision_documentos'
  | 'acta_notorierdad'
  | 'acta_subsanacion'
  | 'apostilla_la_haya'
  | 'legitimacion_firmas'
  | 'compulsa_documento'
  | 'protocolizacion_documento'
  | 'pacto_socios_protocolizado'
  | 'fe_publica_electronica_videoconferencia' // Ley 11/2023

/** Tipo de firma electrónica según eIDAS. */
export type TipoFirmaElectronica =
  | 'firma_electronica_simple'          // SES · cualquier dato electrónico
  | 'firma_electronica_avanzada'        // AES · identificación + control único firmante
  | 'firma_electronica_cualificada'     // QES · AES + dispositivo cualificado · equivalente firma manuscrita
  | 'sello_electronico_cualificado'     // QESeal · personas jurídicas
  | 'firma_notarial_videoconferencia'   // Ley 11/2023 · fe pública remota

/** Tipo de apostilla / legalización internacional. */
export type TipoApostilla =
  | 'apostilla_la_haya_1961'            // 124 países adheridos
  | 'dispensa_apostilla_ue_2016_1191'   // intra-UE para ciertos docs públicos
  | 'legalizacion_consular'             // países NO adheridos La Haya
  | 'apostilla_electronica_e_apostille' // formato XML firmado QES

/** Nivel de urgencia / plazo del servicio jurídico. */
export type UrgenciaJuridica =
  | 'sin_urgencia'                      // plazos ordinarios
  | 'urgencia_estandar'                 // < 1 semana
  | 'urgencia_alta'                     // < 48h
  | 'urgencia_critica'                  // < 24h · medidas cautelares · diligencias

// ============================================================================
// ACREDITACIONES PROFESIONALES
// ============================================================================

/** Colegiación de abogado o profesional jurídico. */
export type ColegiacionJuridica = {
  /** Nombre del colegio profesional. */
  colegio: string                        // e.g. 'Ilustre Colegio de Abogados de Madrid'
  /** Código abreviado oficial del colegio. */
  codigo_colegio?: string                // ICAM · ICAB · ICAV · etc.
  /** Número de colegiado. */
  numero_colegiado: string
  /** Fecha de alta como colegiado. */
  fecha_alta: string                     // ISO 8601 date
  /** ¿Ejerciente o no ejerciente? Crítico para representación procesal. */
  es_ejerciente: boolean
  /** Cuotas colegiales al día (verificación periódica). */
  cuotas_al_dia: boolean
  /** Master Universitario en Acceso a la Abogacía (obligatorio ES desde
   *  Ley 34/2006 · curso 2013-2014 en adelante). */
  master_acceso_abogacia?: {
    universidad: string
    fecha_obtencion: string
    examen_estado_aprobado: boolean
    fecha_examen_estado?: string
  }
  /** URL al PDF del certificado colegial actualizado. */
  pdf_certificado?: string
  /** ¿Verificado por 1503 contra el registro colegial? */
  verificado_por_1503: boolean
}

/** Acreditación de notario (España · plaza notarial fija). */
export type AcreditacionNotario = {
  /** Notario titular (nombre completo). */
  nombre_titular: string
  /** Plaza notarial adjudicada (cada notario tiene plaza única). */
  plaza_notarial: string                 // e.g. 'Notaría Madrid 47'
  /** Distrito notarial. */
  distrito_notarial: string
  /** Demarcación notarial (provincia · CCAA). */
  demarcacion: string
  /** Colegio Notarial al que pertenece. */
  colegio_notarial: string               // e.g. 'Colegio Notarial de Madrid'
  /** Número de protocolo notarial (registro propio del notario). */
  numero_protocolo?: string
  /** ¿Tiene firma electrónica cualificada eIDAS configurada (Ley 11/2023)? */
  tiene_qes_eidas: boolean
  /** Certificado QES emitido por (Autoridad de Certificación). */
  qes_autoridad_certificadora?: string   // e.g. 'ANCERT' (Agencia Notarial de Certificación)
  /** ¿Habilitado para fe pública remota por videoconferencia (Ley 11/2023)? */
  habilitado_videoconferencia: boolean
  /** Sello notarial digital (hash referenciable). */
  sello_digital_hash?: string
  /** URL al PDF de la credencial. */
  pdf_credencial?: string
}

/** Seguro de Responsabilidad Civil Profesional (obligatorio abogados ES ·
 *  Estatuto General Abogacía RD 135/2021 art. 25). */
export type SeguroRCPJuridico = {
  aseguradora: string
  poliza_numero: string
  cobertura_max_eur: number              // mínimo legal CGAE 250.000 € por siniestro
  prima_anual_eur?: number
  fecha_vencimiento: string
  /** ¿Cubre actividad transnacional? */
  cubre_transfronterizo: boolean
  pdf_url: string
}

/** Compromiso de confidencialidad pre-revisión / NDA. */
export type CompromisoConfidencialidad = {
  /** ¿Se firma NDA antes de compartir información del caso? */
  requiere_nda_previo: boolean
  /** Alcance de confidencialidad (general · profesional · estricto). */
  alcance: 'general' | 'profesional_estandar' | 'estricto_top_secret'
  /** Duración del compromiso post-encargo (años · 0 = indefinido). */
  duracion_post_encargo_anos: number
  /** Recoge expresamente el secreto profesional del abogado
   *  (art. 542.3 LOPJ + art. 32 EGA). */
  invoca_secreto_profesional_abogado: boolean
}

// ============================================================================
// SUB-CATEGORÍA 1 · SERVICIO JURÍDICO
// ============================================================================

/** Ficha de servicio jurídico ofertado por un abogado, despacho de abogados
 *  o profesional jurídico (procurador · gestor administrativo · graduado
 *  social · economista jurídico · compliance officer · DPO).
 *
 *  Caso de uso: un despacho boutique de Madrid publica un servicio de
 *  due diligence legal para operaciones M&A · tarifa fija 8.000 € por
 *  proyecto · plazo 21 días · idiomas ES/EN/PT · cobertura UE + LATAM. */
export type ServicioJuridicoProduct = UniversalProduct & {
  sub_categoria: 'servicio_juridico'

  // -------------------- ÁREA Y ALCANCE --------------------
  /** Área(s) de práctica del servicio. */
  areas_practica: AreaPracticaJuridica[]
  /** Área principal (la dominante si hay varias). */
  area_practica_principal: AreaPracticaJuridica
  /** Formas jurídicas de cliente atendidas. */
  formas_juridicas_cliente: FormaJuridicaCliente[]

  // -------------------- ÁMBITO GEOGRÁFICO --------------------
  /** Países cubiertos. */
  paises_cobertura: ISOCountryCode[]
  /** Si país=ES · provincias cubiertas (códigos INE 2 dígitos). */
  provincias_es?: string[]
  /** ¿Realiza actuación procesal (representación ante tribunales)? Solo
   *  abogado ejerciente colegiado del foro de competencia. */
  ofrece_actuacion_procesal: boolean
  /** Foros (tribunales) en los que actúa habitualmente. */
  foros_actuacion?: string[]             // e.g. 'TS · AN · TSJ Madrid · JPI Madrid 1-100'
  /** ¿Ofrece servicio en remoto (videocall · plataforma · email)? */
  ofrece_servicio_remoto: boolean

  // -------------------- ACREDITACIONES --------------------
  colegiacion: ColegiacionJuridica
  /** Acreditaciones adicionales relevantes (DPO · Compliance Officer ·
   *  Mediador · Administrador Concursal · Árbitro). */
  acreditaciones_adicionales?: Array<{
    tipo: 'dpo_gdpr' | 'compliance_officer' | 'mediador_civil_mercantil'
        | 'mediador_concursal' | 'administrador_concursal' | 'arbitro'
        | 'experto_independiente' | 'auditor_aml_sepblac'
    organismo_emisor: string
    numero_acreditacion: string
    fecha_obtencion: string
    pdf_url?: string
  }>
  /** Seguro RCP profesional. */
  seguro_rcp: SeguroRCPJuridico
  /** Años de experiencia en el área principal. */
  anos_experiencia: number
  /** Idiomas en que ofrece el servicio. */
  idiomas: string[]                     // ISO 639-1

  // -------------------- ESPECIALIZACIÓN ADICIONAL --------------------
  /** Sectores 1503 en los que está especializado (referencia cruzada
   *  con sector_id del actor). */
  sectores_1503_especializado?: string[]
  /** Despacho / firma de afiliación si aplica. */
  despacho_afiliacion?: {
    nombre: string
    cif: string
    tipo: 'individual' | 'colectivo' | 'multidisciplinar' | 'magic_circle'
    pais_sede: ISOCountryCode
  }

  // -------------------- TARIFAS --------------------
  modelo_tarifa: ModeloTarifaJuridica
  /** Tarifa base sin IVA en moneda indicada. */
  tarifa_base?: number
  moneda_tarifa?: string
  /** Si modelo='por_hora': tarifa por hora. */
  tarifa_por_hora?: number
  /** Si modelo='contingencia_exito': porcentaje sobre resultado. */
  porcentaje_exito?: number
  /** Importe mínimo del servicio (provisión de fondos). */
  importe_minimo_provision?: number
  /** Plazo de entrega habitual (días laborables). */
  plazo_entrega_dias?: number
  /** ¿Acepta urgencia con recargo? */
  acepta_urgencia: boolean
  /** Recargo por urgencia (% sobre tarifa base). */
  recargo_urgencia_pct?: number

  // -------------------- CONFIDENCIALIDAD --------------------
  confidencialidad: CompromisoConfidencialidad

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
  /** Hitos de pago si modalidad servicios. */
  hitos_pago?: Array<{
    nombre_hito: LocalizedLabel
    porcentaje: number
    evento_disparador:
      | 'firma_acuerdo_provision_fondos'
      | 'entrega_borrador_dictamen'
      | 'entrega_dictamen_final'
      | 'presentacion_demanda_recurso'
      | 'sentencia_primera_instancia'
      | 'sentencia_firme_resolucion'
      | 'escritura_firmada'
      | 'inscripcion_registral'
      | 'archivo_caso'
      | 'aceptacion_cliente'
  }>

  // -------------------- DECLARACIONES DEONTOLÓGICAS --------------------
  /** El publicante declara cumplir Código Deontológico CGAE (o equivalente
   *  internacional · CCBE Code para abogados europeos transfronterizos). */
  declaracion_cumplimiento_deontologico: boolean
  /** El publicante declara NO tener conflicto de interés conocido a fecha
   *  publicación (verificación caso a caso al aceptar encargo concreto). */
  declaracion_sin_conflicto_interes_conocido: boolean
  /** ¿Acepta encargos pro bono según disponibilidad? */
  acepta_casos_pro_bono: boolean
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD JURÍDICA (CLIENTE BUSCA)
// ============================================================================

/** Ficha publicada por un cliente (persona física · PYME · institución) que
 *  necesita asesoría jurídica concreta.
 *
 *  Caso de uso: una start-up de Valencia publica que busca un despacho
 *  boutique con experiencia en fintech + MiCA + tokenización · 25 h
 *  estimadas · presupuesto máximo 4.500 € · idiomas ES/EN · cierre Q3. */
export type NecesidadJuridicaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_juridica'

  // -------------------- QUÉ NECESITA --------------------
  /** Áreas de práctica aceptadas. */
  areas_practica_requeridas: AreaPracticaJuridica[]
  /** Descripción detallada del encargo × 8 idiomas. */
  descripcion_encargo: LocalizedLabel
  /** Forma jurídica del cliente solicitante. */
  forma_juridica_solicitante: FormaJuridicaCliente

  // -------------------- ALCANCE --------------------
  /** ¿Requiere actuación procesal (tribunales)? */
  requiere_actuacion_procesal: boolean
  /** Foro de competencia esperado (si actuación procesal). */
  foro_competencia?: string
  /** ¿Acepta servicio remoto? */
  acepta_servicio_remoto: boolean
  /** Países en los que se desarrolla el caso. */
  paises_alcance: ISOCountryCode[]

  // -------------------- REQUISITOS PROFESIONAL --------------------
  /** Colegiación obligatoria del prestador. */
  exige_colegiacion: boolean
  /** Años de experiencia mínimos requeridos. */
  anos_experiencia_min?: number
  /** Acreditaciones específicas requeridas (DPO · Compliance · etc.). */
  acreditaciones_requeridas?: string[]
  /** Idiomas en los que se necesita el servicio. */
  idiomas_requeridos: string[]
  /** ¿Prefiere despacho grande · boutique · individual? */
  perfil_despacho_preferido?: 'individual' | 'boutique_especializado' | 'multidisciplinar' | 'magic_circle' | 'cualquiera'

  // -------------------- PRESUPUESTO --------------------
  presupuesto_max_eur: number
  presupuesto_min_eur?: number
  moneda_presupuesto: string
  modelo_tarifa_aceptable: ModeloTarifaJuridica[]
  /** Horas estimadas de trabajo (si modelo por hora). */
  horas_estimadas?: number

  // -------------------- TIMING --------------------
  urgencia: UrgenciaJuridica
  fecha_objetivo_entrega?: string       // ISO date
  plazo_respuesta_max_dias: number

  // -------------------- CONFIDENCIALIDAD --------------------
  /** Cliente exige NDA antes de compartir detalles. */
  exige_nda_previo: boolean
  /** Sensibilidad del caso (filtrado adicional de oferentes). */
  nivel_sensibilidad: 'general' | 'profesional' | 'estricto_top_secret'

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '03_servicios'
  plazo_pago_dias: number
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO NOTARIAL
// ============================================================================

/** Ficha de servicio notarial concreto ofertado por una notaría española
 *  (titular adjudicado a plaza notarial fija).
 *
 *  Caso de uso: notaría Madrid publica servicio de constitución de SL +
 *  protocolización pacto socios + firma electrónica eIDAS QES · tarifa
 *  base 350 € + aranceles + IVA · plazo 7 días · admite videoconferencia
 *  Ley 11/2023 si todos los otorgantes están de acuerdo. */
export type ServicioNotarialProduct = UniversalProduct & {
  sub_categoria: 'servicio_notarial'

  // -------------------- ACTO Y ALCANCE --------------------
  /** Tipo principal de acto notarial ofrecido. */
  tipo_acto: TipoActoNotarial
  /** Tipos adicionales que la notaría puede ejecutar en la misma operación. */
  tipos_adicionales?: TipoActoNotarial[]

  // -------------------- ACREDITACIÓN NOTARIAL --------------------
  notario: AcreditacionNotario

  // -------------------- MODALIDAD --------------------
  /** Modalidad de comparecencia. */
  modalidad_comparecencia:
    | 'presencial_solo'
    | 'videoconferencia_solo'             // Ley 11/2023 · ciertos actos
    | 'hibrida_a_eleccion_otorgantes'
    | 'firma_electronica_qes_remota'      // sin notario en algunos actos no inscribibles
  /** Idiomas del notario. */
  idiomas_notario: string[]               // ISO 639-1
  /** ¿Requiere intérprete jurado si otorgante no domina idioma? */
  exige_interprete_jurado_si_aplica: boolean

  // -------------------- FIRMA ELECTRÓNICA --------------------
  /** Tipos de firma electrónica que la notaría acepta/genera. */
  firmas_aceptadas: TipoFirmaElectronica[]
  /** ¿Genera apostilla electrónica e-Apostille XML firmada QES? */
  genera_e_apostille: boolean
  /** Tipos de apostilla/legalización ofrecidos. */
  apostillas_ofrecidas?: TipoApostilla[]

  // -------------------- INSCRIPCIÓN REGISTRAL --------------------
  /** ¿Gestiona la inscripción posterior en registro competente (Mercantil ·
   *  Propiedad · Civil · etc.)? */
  gestiona_inscripcion_registral: boolean
  /** Registros con los que opera habitualmente. */
  registros_destino?: Array<'mercantil' | 'propiedad' | 'civil' | 'cooperativas' | 'fundaciones' | 'asociaciones' | 'bienes_muebles'>

  // -------------------- TARIFAS NOTARIALES --------------------
  /** Arancel notarial base estimado (RD 1426/1989 · escalonado por cuantía). */
  arancel_base_estimado: number
  /** Honorarios libres adicionales (asesoramiento · redacción · etc.). */
  honorarios_libres_adicionales?: number
  /** Moneda. */
  moneda_tarifa: string
  /** IVA aplicable (21% ES · 0% para actos exentos). */
  iva_porcentaje: number
  /** Estimación gastos de gestión registral si se contrata (registro +
   *  notario + impuestos). */
  gastos_gestion_registral_estimados?: number
  /** Plazo habitual de cierre del acto (días laborables). */
  plazo_dias_cierre: number

  // -------------------- DECLARACIONES --------------------
  /** El notario declara cumplir Reglamento Notarial + Ley del Notariado +
   *  Ley 11/2023 digitalización (si modalidad videoconferencia). */
  declaracion_cumplimiento_normativa_notarial: boolean
  /** El notario declara haber realizado control AML/KYC del otorgante
   *  conforme Ley 10/2010 (obligación reforzada para notarios). */
  declaracion_control_aml_kyc: boolean

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector LEGAL
// ============================================================================

export type LegalProduct =
  | ServicioJuridicoProduct
  | NecesidadJuridicaProduct
  | ServicioNotarialProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const LEGAL_SCHEMA_VERSION = 'legal@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta que sea revisado por:
 *   - CGAE (Consejo General de la Abogacía Española)
 *   - CGN (Consejo General del Notariado)
 *   - CGPE (Consejo General de Procuradores)
 *   - Consejo General Colegios Gestores Administrativos
 *   - 2 despachos PYMEs ejercientes ES
 *   - 1 notaría ejerciente ES
 *   - 1 DPO certificado activo
 *   - 1 Compliance Officer certificado activo
 *   - Auditoría jurídica especialista deontología profesional + LSSI-CE +
 *     RGPD + Reg. UE 910/2014 eIDAS + Ley 11/2023 digitalización notarial
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación).
 */
export const LEGAL_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isServicioJuridico(p: LegalProduct): p is ServicioJuridicoProduct {
  return p.sub_categoria === 'servicio_juridico'
}

export function isNecesidadJuridica(p: LegalProduct): p is NecesidadJuridicaProduct {
  return p.sub_categoria === 'necesidad_juridica'
}

export function isServicioNotarial(p: LegalProduct): p is ServicioNotarialProduct {
  return p.sub_categoria === 'servicio_notarial'
}
