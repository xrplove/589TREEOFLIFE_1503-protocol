// Schema sectorial TURISMO · Fase 7 bloque sectorial 11 · Audit-Ready by Design.
//
// Sector ISIC I55 (Accommodation) + I56 (Food and beverage service) + N79
// (Travel agency, tour operator, reservation services) + N82.30 (Organisation
// of conventions and trade shows · MICE). En CNAE-2025 español cubre 55.10-55.90
// alojamiento + 56.10-56.30 restauración + 79.11-79.90 agencias/operadores +
// 82.30 organización eventos.
//
// A DIFERENCIA de textil/tecnología/metalúrgico, TURISMO es un sector de
// SERVICIOS: sus fichas extienden SOLO `UniversalProduct` (no `DPPProduct`)
// porque no hay producto físico al que asociar un Digital Product Passport
// (canon _dpp.ts · igual que legal · inmobiliario servicios · transporte
// servicios). El cumplimiento se modela vía campos de servicio + declaraciones.
//
// Decisión José 2026-05-29: cumplir TODA la legislación aplicable, incluida la
// escalonada a 2026-2027+ y la que está pendiente de aprobación (Audit-Ready by
// Design · campos extensibles marcados subject_to_expert).
//
// MARCO REGULATORIO (citas verificadas contra EUR-Lex / Comisión / BOE · ver
// §fuentes al pie):
//
//   1. Alquileres de corta duración · Reg. (UE) 2024/1028 — recogida e
//      intercambio de datos. En vigor 19-may-2024 · APLICA 20-may-2026 · obliga
//      a número de registro único + verificación/exhibición por plataformas +
//      reporte mensual vía puntos únicos de entrada digital nacionales.
//   2. España · RD 1312/2024 (de 23-dic · BOE-A-2024-26931) — Registro Único de
//      Arrendamientos + Ventanilla Única Digital de Arrendamientos. Efectos
//      1-jul-2025 · NRA (Número de Registro de Arrendamiento) asignado por el
//      Colegio de Registradores · identificador único de la unidad. Implementa
//      en España el Reg. (UE) 2024/1028.
//   3. Registros turísticos AUTONÓMICOS — el turismo es competencia exclusiva de
//      las CCAA (Art. 148.1.18ª CE): 17 leyes de turismo + 17 registros de
//      empresas/establecimientos turísticos + habilitación de guías. Número de
//      registro autonómico obligatorio para publicitar alojamiento/actividad.
//      subject_to_expert (varía por CCAA · validar con cada administración).
//   4. Viajes combinados · Dir. (UE) 2015/2302 — paquetes turísticos + servicios
//      de viaje vinculados · información precontractual + protección frente a
//      insolvencia obligatoria del organizador/minorista + responsabilidad
//      solidaria. REVISIÓN PENDIENTE: propuesta Comisión 29-nov-2023 · acuerdo
//      político provisional PE-Consejo 2-dic-2025 · 28 meses para transponer
//      tras entrada en vigor (refuerza protección insolvencia + anticipos).
//      → cubrir como subject_to_expert (texto final no publicado a 2026-05).
//   5. Accesibilidad · Dir. (UE) 2019/882 EAA (European Accessibility Act) —
//      aplica 28-jun-2025 · webs y servicios de reserva (vuelos · alojamiento ·
//      actividades) + e-commerce deben cumplir requisitos de accesibilidad.
//   6. DAC7 · Dir. (UE) 2021/514 — operadores de plataformas digitales reportan
//      a la AEAT/autoridades los ingresos de anfitriones/prestadores (alquiler
//      alojamiento + servicios personales). En vigor desde 1-ene-2023.
//   7. Servicios · Dir. 2006/123/CE (Bolkestein) — libertad establecimiento +
//      prestación de servicios · base de la liberalización (p.ej. guías).
//   8. Derechos de los pasajeros (según modo de transporte vinculado al viaje):
//      aéreo Reg. (CE) 261/2004 · ferroviario Reg. (UE) 2021/782 · autobús
//      Reg. (UE) 181/2011 · marítimo Reg. (UE) 1177/2010.
//   9. Geo-bloqueo · Reg. (UE) 2018/302 — prohíbe discriminación por
//      nacionalidad/residencia en acceso a servicios (incl. reservas online).
//  10. DSA · Reg. (UE) 2022/2065 — plataformas digitales intermediarias (OTA):
//      moderación + transparencia + trazabilidad del operador (KYC vendedor).
//  11. Información alimentaria · Reg. (UE) 1169/2011 — declaración obligatoria de
//      14 alérgenos en restauración/F&B. Higiene · Reg. (CE) 852/2004 (APPCC).
//      Aplica a alojamientos con restauración + experiencias gastronómicas.
//  12. RGPD · Reg. (UE) 2016/679 — datos de huéspedes/viajeros · PII off-chain
//      (canon hard rule) · derecho al olvido Art. 17. España: registro de
//      viajeros / parte de entrada a fuerzas de seguridad (RD 933/2021 ·
//      subject_to_expert · obligación de hospedaje).
//
// NOTA DE HONESTIDAD (canon valores honestos): la habilitación de guía turístico
// y los requisitos de registro varían por CCAA y están en evolución tras la
// Dir. Servicios; se modelan como flags subject_to_expert, NO como certezas.
// La revisión de la Dir. Viajes Combinados aún no tiene texto final publicado.
//
// Marcos voluntarios / sellos de mercado destacados:
//   - "Q" Calidad Turística Española (ICTE) — sistema de calidad sectorial.
//   - Biosphere / GSTC (Global Sustainable Tourism Council) — sostenibilidad.
//   - Travelife · EU Ecolabel alojamiento (Decisión UE 2017/175).
//   - SICTED (Sistema Integral de Calidad Turística en Destinos).
//   - Banderas Azules (playas/puertos) · Carta Europea Turismo Sostenible.
//
// 4 sub-categorías canonizadas (alineadas con la opción cuádruple del proyecto):
//
//   1. AlojamientoTuristicoProduct (UniversalProduct) — oferta de alojamiento
//      (hotel · apartamento turístico · VUT · rural · camping · hostel).
//      Caso: anfitrión publica VUT en Valencia con NRA + número registro
//      autonómico + accesibilidad EAA + sello Biosphere + régimen alojamiento.
//
//   2. ExperienciaTuristicaProduct (UniversalProduct) — actividad/experiencia
//      (visita guiada · excursión · actividad de aventura · ruta gastronómica).
//      Caso: guía oficial habilitado publica visita cultural en 4 idiomas con
//      seguro RC + grupo máx 25 + accesibilidad parcial + duración 2,5 h.
//
//   3. ServicioIntermediacionViajeProduct (UniversalProduct) — agencia de
//      viajes · tour operador · OTA · DMC · organizador MICE. Caso: agencia
//      minorista publica paquete combinado con protección frente a insolvencia
//      (Dir. 2015/2302) + garantía + reporte DAC7 como plataforma.
//
//   4. NecesidadTuristicaProduct (UniversalProduct) — necesidad publicada por
//      un comprador (viaje corporativo · evento MICE · grupo). Caso: empresa
//      publica necesidad de evento corporativo 120 pax · 2 noches · sede
//      accesible + catering con alérgenos controlados + presupuesto máx.
//
// schema_status: 'subject_to_expert' (canon ADR 0011) hasta validación por:
//   - CEHAT (Confederación Española de Hoteles y Alojamientos Turísticos) +
//     CEAV (Confederación Española de Agencias de Viajes): denominaciones +
//     procesos + roles + categorías reales del sector.
//   - Administraciones turísticas autonómicas (17 CCAA): valida números de
//     registro + categorías + habilitación de guías por territorio.
//   - Colegio de Registradores: valida flujo NRA RD 1312/2024.
//   - ICTE (Instituto para la Calidad Turística Española): valida sellos "Q".
//   - Auditoría jurídica especialista turismo (Dir. 2015/2302 + Reg. 2024/1028 +
//     RD 1312/2024 + EAA + DAC7 + RGPD + RD 933/2021 registro viajeros): valida
//     cobertura legal completa, incluida la revisión pendiente de Viajes
//     Combinados y la normativa autonómica.
//
// Cobertura ADR 0008 matriz cumplimiento:
//   - S2 protección consumidor (Dir. 2015/2302 viajes combinados)
//   - S9 fiscalidad plataformas (DAC7 Dir. 2021/514)
//   - S13 accesibilidad (EAA Dir. 2019/882)
//   - S15 registro/datos alquiler corta duración (Reg. 2024/1028 + RD 1312/2024)
//
// Ver `docs/adr/0011-taxonomy-status-extension.md` para estado subject_to_expert.
//
// §fuentes (verificadas 2026-05-29):
//   - eur-lex.europa.eu/eli/reg/2024/1028/oj (alquileres corta duración)
//   - boe.es/diario_boe/txt.php?id=BOE-A-2024-26931 (RD 1312/2024)
//   - mivau.gob.es/vivienda/ventanilla-unica (Ventanilla Única Digital)
//   - commission.europa.eu/.../package-travel-directive_en (Dir. 2015/2302 + revisión)
//   - eur-lex.europa.eu/eli/dir/2019/882/oj (EAA accesibilidad)

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR · tipos alojamiento · experiencias · tarifas
// ============================================================================

/** Tipo de establecimiento de alojamiento. */
export type TipoAlojamiento =
  | 'hotel'
  | 'hotel_apartamento'                // aparthotel
  | 'hostal_pension'
  | 'apartamento_turistico'            // bloque de apartamentos turísticos
  | 'vivienda_uso_turistico_vut'       // VUT/VFT · vivienda completa (Reg. 2024/1028)
  | 'casa_rural'
  | 'camping_glamping'
  | 'albergue_hostel'
  | 'balneario_spa_termal'
  | 'resort_complejo'
  | 'turismo_singular'                 // faros · castillos · cuevas · cabañas
  | 'otro'

/** Categoría del establecimiento. Las estrellas/llaves son competencia
 *  autonómica; este enum agrupa la escala común. subject_to_expert. */
export type CategoriaAlojamiento =
  | 'una_estrella'
  | 'dos_estrellas'
  | 'tres_estrellas'
  | 'cuatro_estrellas'
  | 'cinco_estrellas'
  | 'cinco_estrellas_gran_lujo'
  | 'categoria_llaves'                 // apartamentos (escala llaves)
  | 'categoria_autonomica_especifica'  // escala propia de la CCAA
  | 'sin_categoria'

/** Régimen de comida ofrecido con el alojamiento. */
export type RegimenAlojamiento =
  | 'solo_alojamiento'
  | 'alojamiento_desayuno'
  | 'media_pension'
  | 'pension_completa'
  | 'todo_incluido'

/** Tipo de experiencia/actividad turística. */
export type TipoExperienciaTuristica =
  | 'visita_guiada_cultural'           // monumentos · museos · cascos históricos
  | 'free_tour'
  | 'excursion_naturaleza'             // senderismo · observación · geoturismo
  | 'actividad_aventura'               // barranquismo · escalada · rafting
  | 'actividad_acuatica_nautica'       // buceo · vela · kayak · surf
  | 'turismo_activo_deportivo'         // golf · ciclismo · esquí
  | 'experiencia_gastronomica'         // ruta tapas · show cooking · F&B
  | 'cata_enoturismo_oleoturismo'      // bodegas · almazaras
  | 'taller_artesania_cultural'        // talleres · clases
  | 'turismo_industrial'               // visitas fábrica/proceso
  | 'evento_espectaculo_entrada'       // entradas a eventos/espectáculos
  | 'wellness_retiro'                  // yoga · retiros · spa
  | 'transfer_traslado'                // traslados aeropuerto/destino
  | 'otro'

/** Tipo de servicio de intermediación de viaje. */
export type TipoIntermediacionViaje =
  | 'agencia_viajes_minorista'         // retail · vende al consumidor final
  | 'agencia_viajes_mayorista_touroperador' // wholesale · touroperador
  | 'agencia_mayorista_minorista'      // mixta
  | 'ota_plataforma_online'            // OTA / marketplace (DSA + DAC7)
  | 'dmc_destination_management'       // gestión de destino / receptivo
  | 'central_reservas_alojamiento'
  | 'organizador_eventos_mice'         // MICE · congresos · convenciones
  | 'otro'

/** Modelo de tarificación del servicio turístico. */
export type ModeloTarifaTurismo =
  | 'por_noche'
  | 'por_persona'
  | 'por_estancia'
  | 'por_unidad_alojamiento'
  | 'por_grupo'
  | 'por_paquete_combinado'
  | 'por_actividad'
  | 'por_hora'
  | 'comision_intermediacion'
  | 'a_negociar'

/** Segmento de viajero objetivo del servicio. */
export type SegmentoViajero =
  | 'ocio_individual'
  | 'ocio_familiar'
  | 'parejas'
  | 'grupos'
  | 'corporativo_business'
  | 'mice_eventos'
  | 'lujo_premium'
  | 'economico_mochilero'
  | 'accesible_movilidad_reducida'
  | 'admite_mascotas'

/** Nivel de accesibilidad declarado (alineado EAA Dir. 2019/882 + normativa
 *  accesibilidad universal). */
export type NivelAccesibilidad =
  | 'accesible_certificado'            // certificación accesibilidad (UNE 170001 · etc.)
  | 'accesible_parcial'                // accesible con limitaciones declaradas
  | 'no_accesible'
  | 'no_evaluado'

/** Sellos de calidad/sostenibilidad turística (voluntarios). */
export type SelloTurismo =
  | 'q_calidad_icte'
  | 'biosphere'
  | 'gstc'
  | 'travelife'
  | 'eu_ecolabel'
  | 'sicted'
  | 'bandera_azul'
  | 'carta_europea_turismo_sostenible'
  | 'otro'

/** Bloque de cumplimiento de información alimentaria (Reg. (UE) 1169/2011 +
 *  higiene Reg. (CE) 852/2004) cuando el servicio incluye F&B. */
export type CumplimientoAlimentarioFyB = {
  /** ¿Se ofrece servicio de comidas/bebidas (restauración)? */
  ofrece_restauracion: boolean
  /** ¿Declara información de los 14 alérgenos (Reg. 1169/2011 Anexo II)? */
  declara_alergenos_1169_2011?: boolean
  /** ¿Dispone de plan APPCC (higiene Reg. 852/2004)? */
  plan_appcc_852_2004?: boolean
  /** ¿Registro Sanitario / autorización del establecimiento? */
  registro_sanitario_id?: string
}

// ============================================================================
// SUB-CATEGORÍA 1 · ALOJAMIENTO TURÍSTICO (UniversalProduct)
// ============================================================================

export type AlojamientoTuristicoProduct = UniversalProduct & {
  sub_categoria: 'alojamiento_turistico'

  // -------------------- TIPO Y CATEGORÍA --------------------
  /** Tipo de alojamiento. */
  tipo_alojamiento: TipoAlojamiento
  /** Categoría (estrellas/llaves/autonómica). */
  categoria: CategoriaAlojamiento

  // -------------------- REGISTRO Y LICENCIAS --------------------
  /** Número de registro de empresa/establecimiento turístico AUTONÓMICO
   *  (obligatorio para publicitar · varía por CCAA · subject_to_expert). */
  numero_registro_turistico_autonomico?: string
  /** Comunidad Autónoma donde está registrado (código). */
  comunidad_autonoma?: string
  /** NRA · Número de Registro de Arrendamiento (RD 1312/2024 · Registro Único ·
   *  obligatorio alquiler corta duración desde 1-jul-2025 · Colegio
   *  Registradores). Implementa Reg. (UE) 2024/1028. */
  numero_registro_arrendamiento_nra?: string
  /** ¿En alcance del Reg. (UE) 2024/1028 (alquiler de corta duración online ·
   *  aplica 20-may-2026 · plataformas verifican/exhiben NRA)? */
  en_alcance_str_reg_2024_1028?: boolean

  // -------------------- UBICACIÓN --------------------
  /** País (ISO 3166-1 alpha-2). */
  pais: ISOCountryCode
  /** Provincia (código INE 2 dígitos si ES). */
  provincia_es?: string
  /** Municipio / localidad. */
  municipio?: string
  /** Coordenadas aproximadas (privacidad: NO dirección exacta en vista pública
   *  hasta confirmación de reserva). */
  lat_aprox?: number
  lng_aprox?: number

  // -------------------- CAPACIDAD --------------------
  /** Plazas totales (camas). */
  plazas_total: number
  /** Número de unidades alojativas (habitaciones / apartamentos). */
  unidades_alojativas?: number
  /** ¿Vivienda completa o por habitaciones? */
  modalidad_ocupacion?: 'vivienda_completa' | 'por_habitaciones'

  // -------------------- RÉGIMEN Y SERVICIOS --------------------
  /** Regímenes ofrecidos. */
  regimenes_ofrecidos: RegimenAlojamiento[]
  /** Servicios/equipamiento (tags libres · wifi · piscina · parking · etc.). */
  servicios_equipamiento?: string[]
  /** Segmentos de viajero objetivo. */
  segmentos_objetivo?: SegmentoViajero[]
  /** Idiomas atendidos (ISO 639-1). */
  idiomas_atencion?: string[]

  // -------------------- RESTAURACIÓN (si aplica) --------------------
  /** Cumplimiento F&B si el alojamiento ofrece restauración. */
  cumplimiento_fyb?: CumplimientoAlimentarioFyB

  // -------------------- ACCESIBILIDAD (EAA) --------------------
  /** Nivel de accesibilidad física del establecimiento. */
  nivel_accesibilidad?: NivelAccesibilidad
  /** ¿La web/canal de reserva cumple requisitos de accesibilidad EAA
   *  (Dir. 2019/882 · obligatorio desde 28-jun-2025)? */
  web_reserva_accesible_eaa?: boolean

  // -------------------- SOSTENIBILIDAD / CALIDAD --------------------
  /** Sellos de calidad/sostenibilidad obtenidos. */
  sellos?: SelloTurismo[]

  // -------------------- TARIFA --------------------
  /** Modelo de tarificación. */
  modelo_tarifa: ModeloTarifaTurismo
  /** Precio base (sin impuestos) por unidad de `modelo_tarifa`. */
  precio_base?: number
  /** Moneda (ISO 4217). */
  moneda?: string
  /** ¿Aplica impuesto/tasa turística local? */
  aplica_tasa_turistica?: boolean
  /** Estancia mínima (noches). */
  estancia_minima_noches?: number

  // -------------------- POLÍTICAS --------------------
  /** Política de cancelación (texto multilingüe). */
  politica_cancelacion?: LocalizedLabel
  /** Hora de check-in / check-out. */
  check_in?: string
  check_out?: string

  // -------------------- DECLARACIONES --------------------
  /** Declara cumplir RGPD en el tratamiento de datos de huéspedes + registro
   *  de viajeros (RD 933/2021 · parte a fuerzas de seguridad). */
  declaracion_cumplimiento_rgpd_registro_viajeros?: boolean
}

// ============================================================================
// SUB-CATEGORÍA 2 · EXPERIENCIA TURÍSTICA (UniversalProduct)
// ============================================================================

export type ExperienciaTuristicaProduct = UniversalProduct & {
  sub_categoria: 'experiencia_turistica'

  // -------------------- TIPO Y DESCRIPCIÓN --------------------
  /** Tipo de experiencia. */
  tipo_experiencia: TipoExperienciaTuristica
  /** Descripción de la experiencia (multilingüe). */
  descripcion_experiencia?: LocalizedLabel

  // -------------------- UBICACIÓN Y LOGÍSTICA --------------------
  /** País (ISO 3166-1 alpha-2). */
  pais: ISOCountryCode
  /** Provincia (código INE 2 dígitos si ES). */
  provincia_es?: string
  /** Punto de encuentro (descripción · NO PII). */
  punto_encuentro?: LocalizedLabel
  /** Duración estimada (minutos). */
  duracion_minutos: number
  /** Idiomas en los que se ofrece (ISO 639-1). */
  idiomas: string[]

  // -------------------- CAPACIDAD --------------------
  /** Tamaño mínimo de grupo. */
  grupo_minimo?: number
  /** Tamaño máximo de grupo. */
  grupo_maximo?: number
  /** ¿Es privada/exclusiva o compartida? */
  modalidad_grupo?: 'privada_exclusiva' | 'compartida_publica'

  // -------------------- HABILITACIÓN Y SEGUROS --------------------
  /** ¿La actividad requiere guía oficial de turismo habilitado? (varía por
   *  CCAA · subject_to_expert). */
  requiere_guia_oficial_habilitado?: boolean
  /** Número de habilitación de guía oficial (autonómico) si aplica. */
  habilitacion_guia_id?: string
  /** ¿Dispone de seguro de responsabilidad civil? */
  tiene_seguro_rc: boolean
  /** Cobertura del seguro RC (importe). */
  cobertura_seguro_rc_eur?: number
  /** ¿Dispone de seguro de accidentes de los participantes? */
  tiene_seguro_accidentes?: boolean

  // -------------------- F&B / ACCESIBILIDAD --------------------
  /** Cumplimiento F&B si la experiencia incluye comida/bebida. */
  cumplimiento_fyb?: CumplimientoAlimentarioFyB
  /** Nivel de accesibilidad de la actividad. */
  nivel_accesibilidad?: NivelAccesibilidad

  // -------------------- REQUISITOS PARTICIPANTE --------------------
  /** Edad mínima. */
  edad_minima?: number
  /** Condición física requerida (texto multilingüe). */
  condicion_fisica_requerida?: LocalizedLabel
  /** Material/equipo incluido (tags). */
  material_incluido?: string[]

  // -------------------- TARIFA --------------------
  /** Modelo de tarificación. */
  modelo_tarifa: ModeloTarifaTurismo
  /** Precio base por unidad de `modelo_tarifa`. */
  precio_base?: number
  /** Moneda (ISO 4217). */
  moneda?: string

  // -------------------- POLÍTICAS / DECLARACIONES --------------------
  /** Política de cancelación (multilingüe). */
  politica_cancelacion?: LocalizedLabel
  /** ¿Web/canal de reserva accesible (EAA Dir. 2019/882)? */
  web_reserva_accesible_eaa?: boolean
  /** Sellos de calidad/sostenibilidad. */
  sellos?: SelloTurismo[]
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO DE INTERMEDIACIÓN DE VIAJE (UniversalProduct)
// ============================================================================

export type ServicioIntermediacionViajeProduct = UniversalProduct & {
  sub_categoria: 'servicio_intermediacion_viaje'

  // -------------------- TIPO --------------------
  /** Tipo de intermediación. */
  tipo_intermediacion: TipoIntermediacionViaje

  // -------------------- LICENCIA / IDENTIFICACIÓN --------------------
  /** Código de identificación / licencia de agencia de viajes (autonómico ·
   *  p.ej. CICMA Madrid · varía por CCAA · subject_to_expert). */
  codigo_agencia_viajes?: string
  /** Comunidad Autónoma de la licencia (si ES). */
  comunidad_autonoma?: string
  /** Países en los que opera. */
  paises_operacion: ISOCountryCode[]

  // -------------------- VIAJES COMBINADOS (Dir. 2015/2302) --------------------
  /** ¿Comercializa viajes combinados o servicios de viaje vinculados (en
   *  alcance Dir. (UE) 2015/2302)? */
  comercializa_viajes_combinados: boolean
  /** ¿Dispone de garantía/protección frente a insolvencia obligatoria
   *  (Dir. 2015/2302 · aval · seguro · fondo)? */
  tiene_proteccion_insolvencia?: boolean
  /** Tipo de garantía de insolvencia. */
  tipo_garantia_insolvencia?: 'aval_bancario' | 'seguro_caucion' | 'fondo_garantia_sectorial' | 'deposito'
  /** Entidad garante + referencia de la póliza/aval. */
  garantia_insolvencia_ref?: string

  // -------------------- PLATAFORMA (DAC7 + DSA) --------------------
  /** ¿Es operador de plataforma digital sujeto a reporte DAC7 (Dir. 2021/514 ·
   *  reporta ingresos de anfitriones/prestadores)? */
  es_plataforma_dac7?: boolean
  /** ¿Sujeto a obligaciones DSA (Reg. 2022/2065 · trazabilidad operador +
   *  moderación) por ser plataforma intermediaria? */
  sujeto_obligaciones_dsa?: boolean

  // -------------------- OFERTA --------------------
  /** Destinos principales ofertados (texto/tags). */
  destinos?: string[]
  /** Segmentos de viajero objetivo. */
  segmentos_objetivo?: SegmentoViajero[]
  /** Idiomas de atención (ISO 639-1). */
  idiomas_atencion?: string[]
  /** ¿Ofrece organización de eventos MICE (congresos · convenciones)? */
  ofrece_mice?: boolean

  // -------------------- TARIFA --------------------
  /** Modelo de tarificación. */
  modelo_tarifa: ModeloTarifaTurismo
  /** % de comisión de intermediación si `modelo_tarifa='comision_intermediacion'`. */
  comision_pct?: number
  /** Moneda (ISO 4217). */
  moneda?: string

  // -------------------- DECLARACIONES --------------------
  /** ¿Web/canal de reserva accesible (EAA Dir. 2019/882)? */
  web_reserva_accesible_eaa?: boolean
  /** Declara cumplir Dir. (UE) 2018/302 anti-geobloqueo (no discrimina por
   *  nacionalidad/residencia del cliente). */
  declaracion_no_geobloqueo?: boolean
  /** Declara cumplir RGPD en el tratamiento de datos de viajeros. */
  declaracion_cumplimiento_rgpd?: boolean
}

// ============================================================================
// SUB-CATEGORÍA 4 · NECESIDAD TURÍSTICA (UniversalProduct)
// ============================================================================

export type NecesidadTuristicaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_turistica'

  // -------------------- QUÉ NECESITA --------------------
  /** Naturaleza de la necesidad. */
  naturaleza_solicitud:
    | 'alojamiento'
    | 'experiencia_actividad'
    | 'paquete_combinado'
    | 'evento_mice'
    | 'transporte_traslado'
  /** Descripción detallada de la necesidad (multilingüe). */
  descripcion_necesidad: LocalizedLabel

  // -------------------- DESTINO Y FECHAS --------------------
  /** País destino (ISO 3166-1 alpha-2). */
  pais_destino?: ISOCountryCode
  /** Destino/zona (texto). */
  destino?: string
  /** Fecha de inicio objetivo (ISO date). */
  fecha_inicio?: string
  /** Fecha de fin objetivo (ISO date). */
  fecha_fin?: string
  /** ¿Fechas flexibles? */
  fechas_flexibles?: boolean

  // -------------------- VIAJEROS --------------------
  /** Número de viajeros/participantes. */
  numero_viajeros: number
  /** Segmento del solicitante. */
  segmento: SegmentoViajero
  /** Idiomas requeridos (ISO 639-1). */
  idiomas_requeridos?: string[]

  // -------------------- REQUISITOS --------------------
  /** Categoría/nivel mínimo de alojamiento (si aplica). */
  categoria_minima_alojamiento?: CategoriaAlojamiento
  /** Régimen requerido (si alojamiento). */
  regimen_requerido?: RegimenAlojamiento
  /** ¿Exige accesibilidad (movilidad reducida)? */
  exige_accesibilidad?: boolean
  /** ¿Exige control de alérgenos en catering (Reg. 1169/2011)? */
  exige_control_alergenos?: boolean
  /** Si evento MICE: requisitos de sala/equipamiento (texto). */
  requisitos_mice?: LocalizedLabel
  /** ¿Exige que el proveedor tenga protección frente a insolvencia
   *  (Dir. 2015/2302) si paquete combinado? */
  exige_proteccion_insolvencia?: boolean

  // -------------------- PRESUPUESTO Y TIMING --------------------
  /** Presupuesto máximo. */
  presupuesto_max?: number
  /** Presupuesto mínimo. */
  presupuesto_min?: number
  /** Moneda (ISO 4217). */
  moneda?: string
  /** Plazo máximo de respuesta de oferentes (días). */
  plazo_respuesta_max_dias?: number

  // -------------------- PAGO --------------------
  /** Modalidad de pago propuesta. */
  modalidad_pago_propuesta: '01_directo' | '03_servicios'
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector TURISMO
// ============================================================================

export type TurismoProduct =
  | AlojamientoTuristicoProduct
  | ExperienciaTuristicaProduct
  | ServicioIntermediacionViajeProduct
  | NecesidadTuristicaProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial turismo. Sin sufijo `+dpp` por ser sector de
 *  servicios (las fichas extienden UniversalProduct · no hay DPP físico). */
export const TURISMO_SCHEMA_VERSION = 'turismo@1.0' as const

/** Estado de validación del schema sectorial.
 *
 *  Estado 'subject_to_expert' canonizado en ADR 0011 (Audit-Ready by Design).
 *  Antes de pasar a 'validated' se requiere:
 *
 *  - CEHAT (hoteles/alojamientos) + CEAV (agencias de viajes): denominaciones +
 *    procesos + roles + categorías reales del sector.
 *  - Administraciones turísticas autonómicas (17 CCAA): valida números de
 *    registro + categorías + habilitación de guías por territorio.
 *  - Colegio de Registradores: valida flujo NRA RD 1312/2024.
 *  - ICTE: valida sellos de calidad "Q".
 *  - Auditoría jurídica especialista turismo (Dir. 2015/2302 + Reg. 2024/1028 +
 *    RD 1312/2024 + EAA 2019/882 + DAC7 + RGPD + RD 933/2021): valida cobertura
 *    legal completa, incluida la REVISIÓN PENDIENTE de Viajes Combinados (sin
 *    texto final a 2026-05) y la normativa turística autonómica.
 *
 *  Ver `docs/adr/0011-taxonomy-status-extension.md`.
 */
export const TURISMO_SCHEMA_STATUS = 'subject_to_expert' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isAlojamientoTuristico(p: TurismoProduct): p is AlojamientoTuristicoProduct {
  return p.sub_categoria === 'alojamiento_turistico'
}

export function isExperienciaTuristica(p: TurismoProduct): p is ExperienciaTuristicaProduct {
  return p.sub_categoria === 'experiencia_turistica'
}

export function isServicioIntermediacionViaje(p: TurismoProduct): p is ServicioIntermediacionViajeProduct {
  return p.sub_categoria === 'servicio_intermediacion_viaje'
}

export function isNecesidadTuristica(p: TurismoProduct): p is NecesidadTuristicaProduct {
  return p.sub_categoria === 'necesidad_turistica'
}

// ============================================================================
// HELPERS DE CUMPLIMIENTO
// ============================================================================

/** ¿El alojamiento está en alcance del Reg. (UE) 2024/1028 (alquiler de corta
 *  duración online) y por tanto necesita NRA verificable por plataformas
 *  (aplica 20-may-2026)? */
export function enAlcanceSTRReg2024_1028(p: TurismoProduct): boolean {
  if (!isAlojamientoTuristico(p)) return false
  if (p.en_alcance_str_reg_2024_1028 === true) return true
  return (
    p.tipo_alojamiento === 'vivienda_uso_turistico_vut' ||
    p.tipo_alojamiento === 'apartamento_turistico'
  )
}

/** ¿El alojamiento requiere número de registro turístico autonómico para ser
 *  publicitado (competencia autonómica · subject_to_expert)? */
export function requiereRegistroTuristicoAutonomico(p: TurismoProduct): boolean {
  return isAlojamientoTuristico(p)
}

/** ¿El servicio comercializa viajes combinados y por tanto requiere protección
 *  frente a insolvencia obligatoria (Dir. (UE) 2015/2302)? */
export function requiereProteccionInsolvenciaPackageTravel(p: TurismoProduct): boolean {
  return isServicioIntermediacionViaje(p) && p.comercializa_viajes_combinados === true
}

/** ¿El servicio/establecimiento incluye F&B y por tanto debe declarar alérgenos
 *  (Reg. (UE) 1169/2011)? */
export function requiereInfoAlergenos(p: TurismoProduct): boolean {
  if (isAlojamientoTuristico(p) || isExperienciaTuristica(p)) {
    return p.cumplimiento_fyb?.ofrece_restauracion === true
  }
  return false
}

/** ¿La actividad requiere guía oficial de turismo habilitado (varía por CCAA ·
 *  subject_to_expert)? */
export function requiereGuiaOficialHabilitado(p: TurismoProduct): boolean {
  return isExperienciaTuristica(p) && p.requiere_guia_oficial_habilitado === true
}

/** ¿El servicio es operador de plataforma digital sujeto a reporte DAC7
 *  (Dir. (UE) 2021/514)? */
export function esPlataformaDAC7(p: TurismoProduct): boolean {
  return isServicioIntermediacionViaje(p) && p.es_plataforma_dac7 === true
}
