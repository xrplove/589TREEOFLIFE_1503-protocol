// Schema sectorial AGROALIMENTARIO · Fase 6 bloque D.3.
//
// El sector agroalimentario es uno de los más regulados del catálogo ISIC en
// la UE: trazabilidad obligatoria from-farm-to-fork (Reg. CE 178/2002), info
// al consumidor armonizada (Reg. UE 1169/2011 FIC), producción ecológica
// estandarizada (Reg. UE 2018/848), denominaciones de origen y calidad
// (Reg. UE 1151/2012), higiene de alimentos (Reg. CE 852/2004 + 853/2004),
// controles oficiales unificados (Reg. UE 2017/625), residuos plaguicidas
// (Reg. CE 396/2005), declaraciones nutricionales (Reg. CE 1924/2006).
//
// 3 sub-categorías (tipo de ficha que un Actor del sector AGROALIMENTARIO
// puede publicar):
//
// 1. ProductoAgroalimentarioProduct · oferta de un lote o referencia
//    concreta (aceite oliva virgen extra · queso curado · naranjas Valencia ·
//    vino DOP Rioja · conservas pescado · pan ecológico · café tostado).
//
// 2. NecesidadAgroalimentariaProduct · "necesidad" publicada por un
//    comprador (cadena de supermercados busca 50 toneladas aceite virgen ·
//    HORECA pide vinos DOP rango precio · importador busca naranjas Valencia
//    para mercado UK · industria pide ingrediente concreto certificado).
//
// 3. ServicioAgroalimentarioProduct · servicios profesionales del sector
//    (auditoría HACCP · etiquetado FIC · consultoría DOP/IGP · ingeniería
//    alimentaria · cadena de frío · análisis laboratorio · certificación
//    ecológica · asesoría exportación · packaging técnico · diseño etiqueta).
//
// Cada sub-categoría extiende UniversalProduct + añade sus campos específicos.
//
// MULTI-PAÍS: aunque España es mercado primario y la regulación UE marca
// el listón, los campos están parametrizados para soportar otros sistemas:
//   - UE: DOP/IGP/ETG (Reg. 1151/2012) · Eco-UE Euroleaf (Reg. 2018/848)
//   - US: USDA Organic · FDA FSMA · TTB (alcoholic beverages)
//   - UK: GB Organic post-Brexit · UKAS · UK GI scheme post-2021
//   - JP: JAS Organic · Specific Health Foods (FOSHU/FFC)
//   - CN: GACC registration · CNCA · Green Food / Organic 中国有机
//   - INT: Codex Alimentarius (FAO/WHO) · GFSI (Global Food Safety Initiative)
//
// schema_status: 'draft' (pendiente validación experta sectorial · ITP/CTAEX
// para investigación · CSIC IATA · MAPA · AICA · CAE · COAG · ASAJA · UPA ·
// FIAB Federación Industrias Alimentación Bebidas + 2 productores PYMEs +
// 1 técnico HACCP titulado + auditoría jurídica especialista food law UE).

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR
// ============================================================================

/** Categoría amplia del producto agroalimentario. Alineada con Codex
 *  Alimentarius + clasificación FIAB y categorías comerciales UE. */
export type CategoriaProductoAgro =
  | 'frutas_frescas'
  | 'hortalizas_frescas'
  | 'frutos_secos'
  | 'cereales_grano'         // trigo · maíz · arroz · cebada · avena
  | 'legumbres'              // garbanzos · lentejas · alubias
  | 'semillas_oleaginosas'   // girasol · soja · colza
  | 'aceites_vegetales'      // oliva · girasol · semillas
  | 'aceitunas_mesa'
  | 'vinos_espumosos'
  | 'vinos_tranquilos'
  | 'destilados_licores'
  | 'cervezas'
  | 'sidras_perada'
  | 'bebidas_no_alcoholicas' // refrescos · zumos · aguas
  | 'cafe_te_cacao'
  | 'lacteos_leche'
  | 'lacteos_queso'
  | 'lacteos_yogur_fermentados'
  | 'lacteos_mantequilla_nata'
  | 'huevos'
  | 'carne_vacuno'
  | 'carne_porcino'
  | 'carne_ovino_caprino'
  | 'carne_ave'
  | 'carne_caza'
  | 'embutidos_curados'
  | 'pescado_fresco'
  | 'pescado_congelado'
  | 'marisco_crustaceos'
  | 'conservas_pescado'
  | 'conservas_vegetales'
  | 'conservas_carnicas'
  | 'panaderia_bolleria'
  | 'pasta_alimenticia'
  | 'reposteria_dulces'
  | 'chocolate_derivados'
  | 'miel_jalea_polen'
  | 'especias_condimentos'
  | 'salsas_aderezos'
  | 'snacks'
  | 'platos_preparados'
  | 'ingredientes_aditivos'  // B2B industria
  | 'alimentacion_animal'    // pienso · forraje
  | 'productos_funcionales'  // probióticos · superfoods
  | 'productos_sin_gluten'
  | 'productos_veganos'

/** Tipo de transformación / formato del producto. */
export type TipoTransformacionAgro =
  | 'fresco'
  | 'minimamente_procesado'   // IV gama · cortado · listo consumo
  | 'pasteurizado'
  | 'esterilizado'
  | 'uht'                      // ultra-high temperature
  | 'conserva_apertizada'      // lata · tarro hermético
  | 'congelado'
  | 'ultracongelado'           // IQF -30°C
  | 'deshidratado'
  | 'liofilizado'
  | 'fermentado'
  | 'curado_salazon'
  | 'ahumado'
  | 'fermentado_lactico'       // yogur · queso · chucrut
  | 'fermentado_alcoholico'    // vino · cerveza · sidra
  | 'destilado'
  | 'envasado_atmosfera_modificada'  // MAP
  | 'envasado_al_vacio'

/** Estado de conservación requerido durante distribución y venta. */
export type CadenaFrioRequerida =
  | 'ambiente_temperatura_controlada'   // 18-25°C
  | 'fresco_estable'                    // 8-15°C
  | 'refrigerado_estandar'              // 2-8°C
  | 'refrigerado_estricto'              // 0-4°C
  | 'congelado'                         // ≤ -18°C
  | 'ultracongelado'                    // ≤ -30°C
  | 'no_requiere_cadena_frio'

/** Origen de producción del producto. */
export type OrigenProduccionAgro =
  | 'convencional'
  | 'ecologico_ue'                      // certificado bajo Reg. UE 2018/848
  | 'ecologico_pais_tercero_equivalente'
  | 'biodinamico'                       // Demeter
  | 'produccion_integrada'              // entre convencional y ecológico
  | 'hidroponico'
  | 'acuiponico'
  | 'silvestre_recolectado'             // setas · piñones · frutos del bosque

/** Los 14 alérgenos de declaración obligatoria UE.
 *  Reg. UE 1169/2011 anexo II (FIC). */
export type AlergenoUE =
  | 'gluten_cereales'                   // trigo · centeno · cebada · avena · espelta · kamut
  | 'crustaceos'
  | 'huevos'
  | 'pescado'
  | 'cacahuetes'
  | 'soja'
  | 'leche_lactosa'
  | 'frutos_de_cascara'                 // almendra · avellana · nuez · anacardo · pistacho · macadamia
  | 'apio'
  | 'mostaza'
  | 'sesamo'
  | 'dioxido_azufre_sulfitos'           // > 10 mg/kg o 10 mg/L
  | 'altramuces'
  | 'moluscos'

/** Formato comercial del producto. */
export type FormatoComercialAgro =
  | 'granel_industrial'                 // big bag · cisterna · IBC
  | 'granel_mostrador'                  // a corte · pesado a vista cliente
  | 'envasado_consumidor_final_b2c'     // packaging retail
  | 'envasado_horeca_b2b'               // formato hostelería 5-25 kg/L
  | 'envasado_caterer_industria'        // formato industrial 25+ kg/L
  | 'palet_completo'
  | 'media_palet'
  | 'caja_master'

/** Modalidad de pesado del producto. */
export type ModalidadPeso =
  | 'peso_fijo'                          // peso neto declarado fijo
  | 'peso_variable'                      // pesado en origen y etiquetado
  | 'venta_por_pieza'                    // unidad sin peso (e.g. 1 melón)
  | 'venta_por_calibre'                  // grupo de calibre estandarizado

// ============================================================================
// PERFIL NUTRICIONAL · Reg. UE 1169/2011 anexo XIII
// ============================================================================

/** Perfil nutricional declarado por 100 g / 100 ml.
 *  Obligatorio en alimentos envasados UE (con algunas exenciones).
 *  Reg. UE 1169/2011 art. 30 + anexo XIII. */
export type PerfilNutricional100g = {
  /** Valor energético en kilojulios. */
  energia_kj: number
  /** Valor energético en kilocalorías. */
  energia_kcal: number
  /** Grasas totales en gramos. */
  grasas_g: number
  /** De las cuales saturadas (gramos). */
  grasas_saturadas_g: number
  /** Hidratos de carbono totales (gramos). */
  hidratos_carbono_g: number
  /** De los cuales azúcares (gramos). */
  azucares_g: number
  /** Proteínas (gramos). */
  proteinas_g: number
  /** Sal equivalente (gramos · = sodio × 2.5). */
  sal_g: number

  // -------------------- OPCIONALES Reg. 1169/2011 --------------------
  fibra_alimentaria_g?: number
  grasas_monoinsaturadas_g?: number
  grasas_poliinsaturadas_g?: number
  polialcoholes_g?: number
  almidon_g?: number
  /** Vitaminas y minerales (% VRN · valor de referencia nutricional). */
  vitaminas_minerales_pct_vrn?: Record<string, number>
}

// ============================================================================
// TRAZABILIDAD · Reg. CE 178/2002
// ============================================================================

/** Información mínima de trazabilidad "one step back, one step forward".
 *  Reg. CE 178/2002 art. 18. Obligatorio en TODA fase de la cadena alimentaria. */
export type TrazabilidadLote = {
  /** Identificador único del lote dado por el productor/envasador. */
  numero_lote: string
  /** Fecha de envasado / elaboración. */
  fecha_envasado: string                 // ISO 8601 date
  /** Identificador de la planta de elaboración/envasado. */
  planta_envasado_id?: string
  /** Número de Registro General Sanitario de Empresas Alimentarias y
   *  Alimentos (RGSEAA · España) o equivalente UE. */
  numero_rgseaa?: string
  /** Identificador del productor original (granja · pesquero · cooperativa). */
  productor_origen_id?: string
  /** País de origen real de la materia prima principal (ISO 3166-1 alpha-2).
   *  Obligatorio para carne fresca + leche + miel + ciertos vegetales según
   *  Reg. UE 1169/2011 + Reg. UE 2018/775. */
  pais_origen_materia_prima: ISOCountryCode
  /** Si el país de envasado es distinto al de la materia prima. */
  pais_envasado?: ISOCountryCode
  /** ¿Mantiene one-step-back hacia su proveedor inmediato? */
  one_step_back_documentado: boolean
  /** ¿Mantiene one-step-forward hacia su comprador inmediato? */
  one_step_forward_documentado: boolean
}

// ============================================================================
// CADUCIDAD / DURABILIDAD · Reg. UE 1169/2011 art. 24 + anexo X
// ============================================================================

/** Información de durabilidad del producto. */
export type DurabilidadAlimento = {
  /** Tipo de fecha (consumo preferente vs caducidad).
   *  - 'caducidad' obligatoria para microbiológicamente perecederos.
   *  - 'consumo_preferente' para resto. */
  tipo: 'caducidad' | 'consumo_preferente' | 'sin_caducidad_obligatoria'
  /** Fecha límite (ISO 8601 date). */
  fecha_limite?: string
  /** Vida útil residual mínima al cliente (en días · contrato comercial). */
  vida_util_residual_min_dias?: number
  /** Vida útil total declarada por productor (días desde envasado). */
  vida_util_total_dias?: number
}

// ============================================================================
// CALIDAD DIFERENCIADA · DOP / IGP / ETG · Reg. UE 1151/2012
// ============================================================================

/** Tipo de figura de calidad europea reconocida. */
export type FiguraCalidadUE =
  | 'DOP'   // Denominación de Origen Protegida
  | 'IGP'   // Indicación Geográfica Protegida
  | 'ETG'   // Especialidad Tradicional Garantizada
  | 'AOC'   // Appellation d'Origine Contrôlée (FR · pre-1992 DOP)
  | 'DOCG'  // Denominazione di Origine Controllata e Garantita (IT)
  | 'DOC'   // Denominazione di Origine Controllata (IT)
  | 'DO'    // Denominación de Origen (ES nivel vinos · pre-DOP)
  | 'PDO_UK_GI'  // Geographic Indication UK post-Brexit
  | 'pais_tercero_equivalente'

/** Acreditación de calidad diferenciada (DOP · IGP · ETG · DOCG · etc.). */
export type CalidadDiferenciadaUE = {
  figura: FiguraCalidadUE
  /** Nombre canónico de la denominación (e.g. "Aceite de la Rioja DOP" ·
   *  "Jamón de Teruel DOP" · "Naranja Valenciana IGP"). */
  nombre_denominacion: string
  /** Número de registro UE en la base eAmbrosia. */
  numero_registro_ue?: string
  /** Fecha de inscripción en el registro UE. */
  fecha_registro_ue?: string
  /** Consejo Regulador (entidad que gestiona y controla la denominación). */
  consejo_regulador: string
  /** URL pública del Pliego de Condiciones (Reglamento) oficial. */
  pliego_condiciones_url?: string
  /** ¿Verificado por 1503 contra el registro eAmbrosia? */
  verificado_por_1503: boolean
}

// ============================================================================
// HUELLA AMBIENTAL · transparencia ESG
// ============================================================================

/** Datos de huella ambiental del producto (opcionales · diferenciador
 *  comercial creciente). */
export type HuellaAmbientalAgro = {
  /** Huella de carbono en kg CO2-equivalente por kg de producto.
   *  Metodología recomendada PEF (Product Environmental Footprint UE). */
  huella_carbono_kg_co2eq_kg?: number
  /** Huella hídrica en litros de agua por kg de producto. */
  huella_hidrica_l_kg?: number
  /** Distancia media de transporte origen → punto de venta (km). */
  distancia_transporte_km?: number
  /** ¿Producto local (radio < 100 km desde origen al consumidor)? */
  es_producto_local: boolean
  /** ¿Producto de proximidad (radio < 500 km)? */
  es_producto_proximidad: boolean
  /** Certificación de huella ambiental (e.g. ISO 14067 · PAS 2050). */
  certificacion_huella?: string
}

// ============================================================================
// INFORMACIÓN AL CONSUMIDOR · Reg. UE 1169/2011 (FIC)
// ============================================================================

/** Información obligatoria al consumidor según Reg. UE 1169/2011.
 *  Art. 9 lista los 12 elementos obligatorios. */
export type InfoConsumidorFIC = {
  /** Denominación legal de venta del alimento (no comercial · técnica). */
  denominacion_legal_venta: LocalizedLabel
  /** Lista de ingredientes en orden decreciente de peso. */
  lista_ingredientes: string
  /** Alérgenos presentes (declaración obligatoria art. 21). */
  alergenos_presentes: AlergenoUE[]
  /** Alérgenos con posibles trazas por contaminación cruzada. */
  alergenos_trazas_posibles?: AlergenoUE[]
  /** Cantidad neta declarada. */
  cantidad_neta: {
    valor: number
    unidad: 'g' | 'kg' | 'ml' | 'L' | 'unidad'
  }
  /** Condiciones especiales de conservación. */
  condiciones_conservacion?: LocalizedLabel
  /** Modo de empleo si necesario para uso adecuado. */
  modo_empleo?: LocalizedLabel
  /** País o lugar de procedencia (cuando obligatorio o declarado). */
  pais_origen_declarado?: ISOCountryCode
  /** Graduación alcohólica si > 1.2% vol (bebidas alcohólicas). */
  graduacion_alcoholica_pct_vol?: number
  /** Operador alimentario responsable de la información (Reg. 1169/2011 art. 8). */
  operador_responsable_info: {
    razon_social: string
    direccion: string
    numero_rgseaa?: string
  }
}

// ============================================================================
// SUB-CATEGORÍA 1 · OFERTA DE PRODUCTO AGROALIMENTARIO
// ============================================================================

/** Ficha de oferta de un producto/lote concreto publicado por un productor,
 *  cooperativa, industria alimentaria, mayorista o distribuidor.
 *
 *  Caso de uso: una cooperativa olivarera de Jaén publica un lote de 5.000
 *  litros de aceite oliva virgen extra DOP Sierra Mágina campaña 2026 ·
 *  formato consumidor final 750 ml + formato granel 25 L · cadena de frío
 *  no requerida · listo para expedición. */
// v1.1: producto físico · extiende DPPProduct (UniversalProduct + 6 capas DPP A-F).
// Cumplimiento ESPR (Reg. UE 2024/1781) + EUDR (Reg. UE 2023/1115 ·
// aplicable café/cacao/aceite palma/soja/madera/ganado bovino + derivados).
export type ProductoAgroalimentarioProduct = DPPProduct & {
  sub_categoria: 'producto_agroalimentario'

  // -------------------- CLASIFICACIÓN --------------------
  categoria: CategoriaProductoAgro
  tipo_transformacion: TipoTransformacionAgro
  origen_produccion: OrigenProduccionAgro
  formato_comercial: FormatoComercialAgro
  modalidad_peso: ModalidadPeso
  cadena_frio_requerida: CadenaFrioRequerida

  // -------------------- INFO AL CONSUMIDOR (FIC) --------------------
  info_consumidor?: InfoConsumidorFIC

  // -------------------- PERFIL NUTRICIONAL --------------------
  perfil_nutricional?: PerfilNutricional100g
  /** Declaraciones nutricionales/saludables aprobadas (Reg. CE 1924/2006).
   *  Solo se permiten las del registro UE. */
  declaraciones_nutricionales_aprobadas?: string[]

  // -------------------- DURABILIDAD --------------------
  durabilidad: DurabilidadAlimento

  // -------------------- TRAZABILIDAD --------------------
  trazabilidad: TrazabilidadLote

  // -------------------- CALIDAD DIFERENCIADA --------------------
  /** Si el producto tiene DOP/IGP/ETG u otra figura de calidad. */
  calidad_diferenciada?: CalidadDiferenciadaUE

  // -------------------- HUELLA AMBIENTAL --------------------
  huella_ambiental?: HuellaAmbientalAgro

  // -------------------- LOGÍSTICA --------------------
  /** Unidad logística mínima de venta (cajas · palets · contenedores). */
  unidad_logistica_min: 'unidad' | 'caja' | 'palet' | 'contenedor' | 'cisterna'
  /** Unidades por caja master. */
  unidades_por_caja?: number
  /** Cajas por palet. */
  cajas_por_palet?: number
  /** Peso de palet completo en kg (estiba). */
  peso_palet_kg?: number
  /** ¿Requiere transporte ADR si peligroso (raro en agro · vinos > X grados)? */
  requiere_transporte_adr: boolean
  /** ¿Se exporta vía cadena frío internacional (reefer)? */
  apto_reefer_internacional: boolean

  // -------------------- DECLARACIONES LEGALES --------------------
  /** El publicante declara cumplir higiene Reg. CE 852/2004 (productores
   *  primarios) o 853/2004 (origen animal) según aplique. */
  declaracion_cumplimiento_higiene_ue: boolean
  /** El publicante declara cumplimiento límites residuos plaguicidas
   *  Reg. CE 396/2005 (productos vegetales · frutas · hortalizas). */
  declaracion_cumplimiento_mrl?: boolean
  /** Si producto animal: el publicante declara cumplimiento BIENESTAR ANIMAL
   *  según Reg. CE 1/2005 (transporte) + Reg. CE 1099/2009 (sacrificio). */
  declaracion_cumplimiento_bienestar_animal?: boolean
  /** Para exportación extra-UE: el publicante asume responsabilidad de
   *  cumplir requisitos del país de destino (FSMA US · GACC CN · etc.). */
  declaracion_responsabilidad_export_extra_ue: boolean
  /** Estado de la oferta. */
  estado_oferta: 'disponible' | 'reservado' | 'agotado_temporal' | 'retirado'
}

// ============================================================================
// SUB-CATEGORÍA 2 · NECESIDAD AGROALIMENTARIA (cliente busca)
// ============================================================================

/** Ficha publicada por un comprador (cadena de retail · HORECA · industria
 *  alimentaria · importador · catering · distribuidor) que busca un producto
 *  agroalimentario concreto.
 *
 *  Caso de uso: cadena de supermercados publica que busca 50 toneladas de
 *  aceite oliva virgen extra ecológico DOP español a entregar Q3 2026 ·
 *  formato 500 ml + 1 L · presupuesto máximo 6 €/L · certificación IFS
 *  obligatoria. */
export type NecesidadAgroalimentariaProduct = UniversalProduct & {
  sub_categoria: 'necesidad_agroalimentaria'

  // -------------------- QUÉ BUSCA --------------------
  categorias_aceptadas: CategoriaProductoAgro[]
  tipos_transformacion_aceptados?: TipoTransformacionAgro[]
  origenes_produccion_aceptados: OrigenProduccionAgro[]
  formatos_aceptados: FormatoComercialAgro[]

  // -------------------- CANTIDAD Y CADENCIA --------------------
  /** Cantidad total a contratar. */
  cantidad_total: number
  unidad_cantidad: 'kg' | 'L' | 'unidad' | 'palet' | 'tonelada' | 'hectolitro'
  /** Si es contrato recurrente · frecuencia. */
  es_contrato_recurrente: boolean
  /** Frecuencia de pedido si recurrente (días naturales). */
  frecuencia_pedido_dias?: number
  /** Duración del contrato si recurrente (meses). */
  duracion_contrato_meses?: number

  // -------------------- ORIGEN GEOGRÁFICO --------------------
  /** Países de origen aceptados (positiva). Vacío = sin restricción. */
  paises_origen_aceptados?: ISOCountryCode[]
  /** Países de origen excluidos. */
  paises_origen_excluidos?: ISOCountryCode[]
  /** ¿Prefiere producto local / proximidad? */
  prefiere_producto_local: boolean

  // -------------------- CALIDAD / CERTIFICACIONES --------------------
  /** Figuras de calidad UE aceptadas. */
  figuras_calidad_aceptadas?: FiguraCalidadUE[]
  /** Certificaciones obligatorias del oferente (IDs del registry). */
  certificaciones_obligatorias: string[]
  /** Certificaciones deseables (no obligatorias). */
  certificaciones_deseables?: string[]
  /** Alérgenos NO aceptables (exclusión total · e.g. sin gluten · sin
   *  cacahuetes). */
  alergenos_no_aceptables?: AlergenoUE[]

  // -------------------- PRESUPUESTO --------------------
  /** Presupuesto máximo por unidad. */
  presupuesto_max_por_unidad: number
  presupuesto_min_por_unidad?: number
  moneda_presupuesto: string
  /** Modelo de fijación de precio. */
  modelo_precio: 'fijo' | 'spot_mercado' | 'indexado_indice' | 'subasta_inversa'
  /** Si indexado · referencia (e.g. "MIBG aceite virgen extra Jaén"). */
  indice_referencia?: string

  // -------------------- TIMING --------------------
  fecha_entrega_objetivo: string         // ISO date
  /** Urgencia. */
  urgencia: 'baja' | 'media' | 'alta' | 'inmediata'
  /** Plazo máximo aceptable de respuesta de oferentes. */
  plazo_respuesta_max_dias: number

  // -------------------- LOGÍSTICA --------------------
  /** Punto de entrega. */
  punto_entrega: {
    pais: ISOCountryCode
    municipio: string
    codigo_postal: string
    incoterm: string                     // EXW · FCA · DAP · DDP · CIP · CIF...
  }
  /** Cadena de frío que el comprador puede mantener al recibir. */
  cadena_frio_aceptable: CadenaFrioRequerida[]

  // -------------------- HUELLA AMBIENTAL --------------------
  /** Huella de carbono máxima aceptable (filtro ESG). */
  huella_carbono_max_kg_co2eq_kg?: number

  // -------------------- ESCROW & PAGO --------------------
  modalidad_pago_propuesta: '01_directo' | '02_b2b_nacional' | '03_servicios' | '04_importacion'
  /** Plazo de pago propuesto (días desde factura). */
  plazo_pago_dias: number
}

// ============================================================================
// SUB-CATEGORÍA 3 · SERVICIO PROFESIONAL AGROALIMENTARIO
// ============================================================================

/** Tipo de servicio profesional agroalimentario. */
export type TipoServicioAgroalimentario =
  | 'auditoria_haccp'
  | 'consultoria_iso_22000'
  | 'consultoria_fssc_22000'
  | 'consultoria_ifs_brc'
  | 'consultoria_globalgap'
  | 'certificacion_eco_ue'
  | 'certificacion_dop_igp_etg'
  | 'certificacion_halal'
  | 'certificacion_kosher'
  | 'analisis_laboratorio_microbiologico'
  | 'analisis_laboratorio_fisicoquimico'
  | 'analisis_residuos_plaguicidas'
  | 'analisis_metales_pesados'
  | 'analisis_alergenos'
  | 'analisis_omg_pcr'
  | 'analisis_nutricional'
  | 'desarrollo_producto_id_i'             // R+D+i alimentario
  | 'ingenieria_alimentaria_proyectos'
  | 'consultoria_etiquetado_fic'
  | 'diseno_packaging_tecnico'
  | 'estudios_vida_util'
  | 'consultoria_export_extra_ue'
  | 'asesoria_fiscal_iva_alimentario'
  | 'asesoria_juridica_food_law_ue'
  | 'gestion_crisis_alimentaria'           // retirada producto · recall
  | 'logistica_cadena_frio'
  | 'transporte_atp_perecederos'
  | 'almacenaje_frigorifico'
  | 'sacrificio_despiece_certificado'
  | 'envasado_maquila'                     // packaging por encargo
  | 'consultoria_sostenibilidad_huella'
  | 'evaluacion_sensorial_panel_cata'
  | 'asesoria_enologia'                    // vinos
  | 'asesoria_oleotecnia'                  // aceites
  | 'tecnico_quesero'

/** Ficha de servicio profesional agroalimentario ofertado por un Actor
 *  (laboratorio · ingeniero alimentario · auditor · certificadora · enólogo ·
 *  consultor regulatorio · etc.). */
export type ServicioAgroalimentarioProduct = UniversalProduct & {
  sub_categoria: 'servicio_agroalimentario'

  // -------------------- TIPO DE SERVICIO --------------------
  tipo_servicio: TipoServicioAgroalimentario

  // -------------------- ÁMBITO --------------------
  /** Países de cobertura. */
  paises_cobertura: ISOCountryCode[]
  /** Si país=ES · provincias cubiertas (códigos INE 2 dígitos). */
  provincias_es?: string[]
  /** ¿Ofrece el servicio en remoto? */
  ofrece_servicio_remoto: boolean
  /** ¿Es laboratorio acreditado ENAC (España) o equivalente UE? */
  es_laboratorio_acreditado_enac?: boolean
  /** Norma de acreditación si laboratorio (e.g. ISO/IEC 17025). */
  norma_acreditacion?: string

  // -------------------- ACREDITACIONES PROFESIONALES --------------------
  /** Colegio profesional aplicable. */
  colegiacion?: {
    colegio: string                       // e.g. 'Colegio Oficial Veterinarios Madrid'
    numero_colegiado: string
    fecha_alta: string
    cuotas_al_dia: boolean
    pdf_certificado?: string
  }
  /** Entidad certificadora si oferta certificación oficial. */
  entidad_certificadora_acreditada?: {
    nombre: string                        // e.g. 'SOHISCERT' · 'CCPAE' · 'IFANCA'
    numero_acreditacion: string
    organismo_acreditador: string         // ENAC · UKAS · COFRAC...
    pdf_acreditacion: string
  }
  /** Seguro de responsabilidad civil profesional. */
  seguro_rcp?: {
    aseguradora: string
    poliza_numero: string
    cobertura_max_eur: number
    fecha_vencimiento: string
    pdf_url: string
  }
  /** Años de experiencia en el servicio. */
  anos_experiencia?: number
  /** Idiomas en que ofrece el servicio. */
  idiomas: string[]                       // ISO 639-1 codes

  // -------------------- ESPECIALIZACIÓN POR CATEGORÍA --------------------
  /** Categorías de producto en las que está especializado. Si vacío · genérico. */
  categorias_especializado?: CategoriaProductoAgro[]

  // -------------------- TARIFAS --------------------
  modelo_tarifa: 'fija' | 'por_hora' | 'por_muestra' | 'por_proyecto' | 'mixta'
  tarifa_base?: number
  moneda_tarifa?: string
  tarifa_por_hora?: number
  /** Si laboratorio · tarifa por muestra/análisis. */
  tarifa_por_muestra?: number
  /** Importe mínimo del servicio. */
  importe_minimo?: number
  /** Plazo habitual de entrega (días laborables). */
  plazo_entrega_dias?: number
  /** ¿Servicio urgente disponible? */
  ofrece_servicio_urgente: boolean
  /** Recargo del servicio urgente (% sobre tarifa base). */
  recargo_urgencia_pct?: number

  // -------------------- MODALIDAD DE PAGO --------------------
  modalidad_pago: '01_directo' | '03_servicios'
  /** Hitos de pago si modalidad servicios. */
  hitos_pago?: Array<{
    nombre_hito: LocalizedLabel
    porcentaje: number
    evento_disparador:
      | 'firma_acuerdo'
      | 'recepcion_muestra'
      | 'inicio_auditoria'
      | 'entrega_borrador_informe'
      | 'entrega_informe_final'
      | 'concesion_certificacion'
      | 'aceptacion_cliente'
  }>
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector AGROALIMENTARIO
// ============================================================================

export type AgroalimentarioProduct =
  | ProductoAgroalimentarioProduct
  | NecesidadAgroalimentariaProduct
  | ServicioAgroalimentarioProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial · bumpear cuando se añadan campos breaking. */
export const AGROALIMENTARIO_SCHEMA_VERSION = 'agroalimentario@1.0' as const

/** Estado de validación del schema sectorial.
 *
 * 'draft' hasta que sea revisado por:
 *   - MAPA (Ministerio Agricultura · Pesca · Alimentación)
 *   - AICA (Agencia Información y Control Alimentarios)
 *   - FIAB (Federación Industrias Alimentación y Bebidas)
 *   - Asociaciones agrarias representativas (COAG · ASAJA · UPA)
 *   - CSIC IATA (Instituto Agroquímica y Tecnología Alimentos)
 *   - 2 productores PYMEs operando ES + 1 país UE adicional
 *   - 1 técnico HACCP titulado activo
 *   - 1 laboratorio ENAC ISO/IEC 17025
 *   - Auditoría jurídica especialista food law UE (Reg. 178/2002 · 1169/2011 ·
 *     2018/848 · 1151/2012 · 852/2004 · 853/2004 · 2017/625)
 *
 * Ver `docs/plan-fase6-fichas-sectoriales.md` §9 (proceso validación).
 */
export const AGROALIMENTARIO_SCHEMA_STATUS = 'draft' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isProductoAgroalimentario(
  p: AgroalimentarioProduct,
): p is ProductoAgroalimentarioProduct {
  return p.sub_categoria === 'producto_agroalimentario'
}

export function isNecesidadAgroalimentaria(
  p: AgroalimentarioProduct,
): p is NecesidadAgroalimentariaProduct {
  return p.sub_categoria === 'necesidad_agroalimentaria'
}

export function isServicioAgroalimentario(
  p: AgroalimentarioProduct,
): p is ServicioAgroalimentarioProduct {
  return p.sub_categoria === 'servicio_agroalimentario'
}
