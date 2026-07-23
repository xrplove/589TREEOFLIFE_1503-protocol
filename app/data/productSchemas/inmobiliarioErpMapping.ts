// Mapping ERP del schema sectorial INMOBILIARIO.
//
// Declarativo de CÓMO se rellena cada campo del schema cuando llega un
// producto desde el ERP del Actor. Aplica los 4 niveles del modelo (ver
// `docs/erp-adapter-strategy.md` §4 + `_erpMapping.ts`).
//
// Cobertura prevista (piloto Holded):
//   - 'universal'      → 8 campos · 11% (price · stock · sku · ean13 · ...)
//   - 'extended'       → 32 campos · 45% (custom fields wizard onboarding)
//   - 'ai_extraction'  → 19 campos · 27% (IEE PDF + Nota Simple + Licencias)
//   - 'manual'         → 12 campos · 17% (declaraciones legales · políticas)
//
// Total auto-rellenable: ~83% · resto manual UI (~17%) una sola vez por ficha.
//
// schema_status: 'draft' · pendiente validación experta sectorial (AEGI ·
// Notarios · Registradores · COAM) + benchmark plataformas (Idealista API ·
// Fotocasa API · Rightmove · ImmoScout24 · MLS US).

import type { SectorErpMapping, ErpMappingEntry } from './_erpMapping'
import { INMOBILIARIO_SCHEMA_VERSION } from './inmobiliario'

// ============================================================================
// CAMPOS UNIVERSALES (heredados de UniversalProduct)
// ============================================================================

const UNIVERSAL_ENTRIES: Record<string, ErpMappingEntry> = {
  sku: {
    schema_path: 'sku',
    strategy: 'universal',
    priority: 'erp_authoritative',
    holded: { native: 'product.sku', dtype: 'string' },
    odoo: { model: 'product.product', field: 'default_code', dtype: 'char' },
    sage: { table: 'ARTICULO', field: 'CODIGO' },
    sap: { service: 'API_PRODUCT_SRV', entity: 'A_Product', field: 'Product' },
    required: true,
  },
  ean13: {
    schema_path: 'ean13',
    strategy: 'universal',
    priority: 'erp_authoritative',
    holded: { native: 'product.barcode', dtype: 'string' },
    odoo: { model: 'product.product', field: 'barcode', dtype: 'char' },
    sage: { table: 'ARTICULO', field: 'CODBARRAS' },
    required: false,
  },
  title: {
    schema_path: 'title',
    strategy: 'universal',
    priority: 'bidirectional',
    holded: { native: 'product.name', dtype: 'string' },
    odoo: { model: 'product.template', field: 'name', dtype: 'char' },
    sage: { table: 'ARTICULO', field: 'DESCRIPCION' },
    required: true,
  },
  description: {
    schema_path: 'description',
    strategy: 'universal',
    priority: 'bidirectional',
    holded: { native: 'product.description', dtype: 'string' },
    odoo: { model: 'product.template', field: 'description_sale', dtype: 'text' },
    sage: { table: 'ARTICULO', field: 'OBSERVACIONES' },
    required: false,
  },
  price: {
    schema_path: 'price.amount',
    strategy: 'universal',
    priority: 'erp_authoritative',
    holded: { native: 'product.price', dtype: 'number' },
    odoo: { model: 'product.template', field: 'list_price', dtype: 'float' },
    sage: { table: 'ARTICULO', field: 'PRECIO' },
    required: true,
  },
  currency: {
    schema_path: 'price.currency',
    strategy: 'universal',
    priority: 'erp_authoritative',
    holded: { native: 'product.currency', dtype: 'string' },
    odoo: { model: 'product.template', field: 'currency_id', dtype: 'char' },
    required: true,
  },
  stock: {
    schema_path: 'stock.available',
    strategy: 'universal',
    priority: 'erp_authoritative',
    holded: { native: 'product.stock', dtype: 'integer' },
    odoo: { model: 'stock.quant', field: 'quantity', dtype: 'float' },
    sage: { table: 'EXISTENCIAS', field: 'CANTIDAD' },
    required: false,
    internal_notes: 'Para inmuebles típicamente 1 (cada inmueble es único). Excepción: edificios con varias unidades.',
  },
  images: {
    schema_path: 'images',
    strategy: 'universal',
    priority: 'bidirectional',
    holded: { native: 'product.images', dtype: 'binary' },
    odoo: { model: 'product.template', field: 'image_1920', dtype: 'binary' },
    required: false,
  },
}

// ============================================================================
// CAMPOS EXTENDED · custom fields en ERP (wizard onboarding crea estos)
// ============================================================================

const EXTENDED_ENTRIES: Record<string, ErpMappingEntry> = {
  // -------------------- TIPO + OPERACIÓN --------------------
  tipo: {
    schema_path: 'tipo',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'tipo_inmueble', dtype: 'enum', enum_values: ['vivienda', 'local_comercial', 'oficina', 'industrial', 'hostelero', 'parcela', 'edificio', 'garaje', 'trastero', 'agricola', 'forestal', 'singular'] },
    odoo: { model: 'product.template', custom: 'x_tipo_inmueble', dtype: 'selection' },
    required: true,
  },
  subtipo_vivienda: {
    schema_path: 'subtipo_vivienda',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'subtipo_vivienda', dtype: 'enum', enum_values: ['piso', 'atico', 'duplex', 'estudio', 'loft', 'chalet_independiente', 'chalet_adosado', 'chalet_pareado', 'casa_rural', 'finca_rustica', 'masia', 'palacete'] },
    odoo: { model: 'product.template', custom: 'x_subtipo_vivienda', dtype: 'selection' },
    required: false,
  },
  operacion: {
    schema_path: 'operacion',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'operacion', dtype: 'enum', enum_values: ['venta', 'alquiler', 'alquiler_con_opcion_compra', 'traspaso', 'opcion_compra', 'subasta', 'permuta', 'venta_con_alquiler'] },
    odoo: { model: 'product.template', custom: 'x_operacion', dtype: 'selection' },
    required: true,
  },

  // -------------------- SUPERFICIE --------------------
  superficie_util_m2: {
    schema_path: 'superficie.util_m2',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'm2_util', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_m2_util', dtype: 'float' },
    required: false,
  },
  superficie_construida_m2: {
    schema_path: 'superficie.construida_m2',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'm2_construida', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_m2_construida', dtype: 'float' },
    required: false,
  },
  superficie_parcela_m2: {
    schema_path: 'superficie.parcela_m2',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'm2_parcela', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_m2_parcela', dtype: 'float' },
    required: false,
  },
  superficie_terraza_m2: {
    schema_path: 'superficie.terraza_m2',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'm2_terraza', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_m2_terraza', dtype: 'float' },
    required: false,
  },
  superficie_jardin_m2: {
    schema_path: 'superficie.jardin_m2',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'm2_jardin', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_m2_jardin', dtype: 'float' },
    required: false,
  },

  // -------------------- UBICACIÓN --------------------
  pais: {
    schema_path: 'ubicacion.pais',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'pais_iso', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_pais_iso', dtype: 'char' },
    required: true,
  },
  region: {
    schema_path: 'ubicacion.region',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'region', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_region', dtype: 'char' },
    required: false,
  },
  provincia: {
    schema_path: 'ubicacion.provincia_estado',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'provincia', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_provincia', dtype: 'char' },
    required: false,
  },
  municipio: {
    schema_path: 'ubicacion.municipio',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'municipio', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_municipio', dtype: 'char' },
    required: true,
  },
  codigo_postal: {
    schema_path: 'ubicacion.codigo_postal',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'codigo_postal', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_codigo_postal', dtype: 'char' },
    required: true,
  },
  referencia_catastral_es: {
    schema_path: 'ubicacion.referencia_catastral_es',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'ref_catastral_es', dtype: 'string' },
    odoo: { model: 'product.template', custom: 'x_ref_catastral_es', dtype: 'char' },
    required: false,
    internal_notes: 'Validar con isValidReferenciaCatastralES · 20 caracteres formato AAAA BBBBB CCCC DDDD EE.',
  },

  // -------------------- CARACTERÍSTICAS BÁSICAS --------------------
  habitaciones: {
    schema_path: 'caracteristicas.habitaciones',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'habitaciones', dtype: 'integer' },
    odoo: { model: 'product.template', custom: 'x_habitaciones', dtype: 'integer' },
    required: false,
  },
  banos: {
    schema_path: 'caracteristicas.banos',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'banos', dtype: 'integer' },
    odoo: { model: 'product.template', custom: 'x_banos', dtype: 'integer' },
    required: false,
  },
  ano_construccion: {
    schema_path: 'caracteristicas.ano_construccion',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'ano_construccion', dtype: 'integer' },
    odoo: { model: 'product.template', custom: 'x_ano_construccion', dtype: 'integer' },
    required: false,
  },
  ano_ultima_reforma: {
    schema_path: 'caracteristicas.ano_ultima_reforma',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'ano_ultima_reforma', dtype: 'integer' },
    odoo: { model: 'product.template', custom: 'x_ano_ultima_reforma', dtype: 'integer' },
    required: false,
  },
  estado_conservacion: {
    schema_path: 'caracteristicas.estado_conservacion',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'estado_conservacion', dtype: 'enum', enum_values: ['obra_nueva', 'reformado_completo', 'reformado_parcial', 'buen_estado', 'a_reformar', 'para_derribar', 'rehabilitacion_pendiente'] },
    odoo: { model: 'product.template', custom: 'x_estado_conservacion', dtype: 'selection' },
    required: true,
  },
  orientacion: {
    schema_path: 'caracteristicas.orientacion',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'orientacion', dtype: 'enum', enum_values: ['N', 'S', 'E', 'O', 'NE', 'NO', 'SE', 'SO', 'multiple'] },
    odoo: { model: 'product.template', custom: 'x_orientacion', dtype: 'selection' },
    required: false,
  },

  // -------------------- EQUIPAMIENTO --------------------
  ascensor: {
    schema_path: 'caracteristicas.ascensor',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'ascensor', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_ascensor', dtype: 'boolean' },
    required: false,
  },
  garaje_incluido: {
    schema_path: 'caracteristicas.garaje_incluido',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'garaje_incluido', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_garaje_incluido', dtype: 'boolean' },
    required: false,
  },
  plazas_garaje: {
    schema_path: 'caracteristicas.plazas_garaje',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'plazas_garaje', dtype: 'integer' },
    odoo: { model: 'product.template', custom: 'x_plazas_garaje', dtype: 'integer' },
    required: false,
  },
  trastero_incluido: {
    schema_path: 'caracteristicas.trastero_incluido',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'trastero_incluido', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_trastero_incluido', dtype: 'boolean' },
    required: false,
  },
  piscina_privada: {
    schema_path: 'caracteristicas.piscina_privada',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'piscina_privada', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_piscina_privada', dtype: 'boolean' },
    required: false,
  },
  jardin_privado: {
    schema_path: 'caracteristicas.jardin_privado',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'jardin_privado', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_jardin_privado', dtype: 'boolean' },
    required: false,
  },
  amueblado: {
    schema_path: 'caracteristicas.amueblado',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'amueblado', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_amueblado', dtype: 'boolean' },
    required: false,
  },
  admite_mascotas: {
    schema_path: 'caracteristicas.admite_mascotas',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'admite_mascotas', dtype: 'boolean' },
    odoo: { model: 'product.template', custom: 'x_admite_mascotas', dtype: 'boolean' },
    required: false,
  },

  // -------------------- GASTOS / IMPUESTOS --------------------
  ibi_anual: {
    schema_path: 'gastos_anuales.ibi_eur',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'ibi_eur_anual', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_ibi_eur_anual', dtype: 'float' },
    required: false,
  },
  comunidad_mensual: {
    schema_path: 'gastos_anuales.comunidad_eur_mes',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'comunidad_eur_mes', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_comunidad_eur_mes', dtype: 'float' },
    required: false,
  },

  // -------------------- ALQUILER --------------------
  deposito_meses: {
    schema_path: 'alquiler_condiciones.deposito_meses',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'deposito_meses', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_deposito_meses', dtype: 'float' },
    required: false,
    internal_notes: 'Solo aplica si operacion=alquiler. Típicamente 1-2 meses en ES (LAU).',
  },
  renta_eur_mes: {
    schema_path: 'alquiler_condiciones.importe_renta_eur_mes',
    strategy: 'extended',
    priority: 'bidirectional',
    holded: { custom: 'renta_eur_mes', dtype: 'number' },
    odoo: { model: 'product.template', custom: 'x_renta_eur_mes', dtype: 'float' },
    required: false,
    fallback: 'manual',
  },
}

// ============================================================================
// CAMPOS AI EXTRACTION · IA Claude lee PDFs y rellena
// ============================================================================

const AI_EXTRACTION_ENTRIES: Record<string, ErpMappingEntry> = {
  // -------------------- IEE / CEE --------------------
  iee_letra: {
    schema_path: 'iee.certificado_energetico',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.92,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
    internal_notes: 'IEE/CEE letra A-G aparece destacada en página 1 del PDF · alta confianza esperada.',
  },
  iee_consumo: {
    schema_path: 'iee.consumo_kwh_m2_year',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  iee_emisiones: {
    schema_path: 'iee.emisiones_kg_co2_m2_year',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  iee_fecha_emision: {
    schema_path: 'iee.fecha_emision',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  iee_fecha_caducidad: {
    schema_path: 'iee.fecha_caducidad',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
    internal_notes: 'Caducidad = emisión + 10 años en España (RD 235/2013). Validación cruzada.',
  },
  iee_tecnico: {
    schema_path: 'iee.tecnico_certificador',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'iee_cee_es',
      prompt_version: '1.0',
      min_confidence: 0.80,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },

  // -------------------- CÉDULA HABITABILIDAD --------------------
  cedula_numero: {
    schema_path: 'cedula_habitabilidad.numero',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'cedula_habitabilidad_es',
      prompt_version: '1.0',
      min_confidence: 0.88,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  cedula_caducidad: {
    schema_path: 'cedula_habitabilidad.fecha_caducidad',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'cedula_habitabilidad_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  cedula_organismo: {
    schema_path: 'cedula_habitabilidad.organismo_emisor',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'cedula_habitabilidad_es',
      prompt_version: '1.0',
      min_confidence: 0.80,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },

  // -------------------- NOTA SIMPLE REGISTRAL --------------------
  nota_titular: {
    schema_path: 'nota_simple_registral.titular_actual',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'nota_simple_registral_es',
      prompt_version: '1.0',
      min_confidence: 0.90,
      recommended_model: 'sonnet-4-6',
      cost_per_extraction_usd_estimated: 0.03,
    },
    required: false,
    fallback: 'manual',
    internal_notes: 'Sonnet por mayor complejidad de la nota simple · titularidad puede ser pro-indiviso con %.',
  },
  nota_cargas: {
    schema_path: 'nota_simple_registral.cargas',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'nota_simple_registral_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'sonnet-4-6',
      cost_per_extraction_usd_estimated: 0.03,
    },
    required: false,
    fallback: 'manual',
    internal_notes: 'Lista compleja · típicamente hipotecas + embargos + servidumbres. Sonnet necesario para estructurar.',
  },
  nota_registro: {
    schema_path: 'nota_simple_registral.registro_propiedad',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'nota_simple_registral_es',
      prompt_version: '1.0',
      min_confidence: 0.90,
      recommended_model: 'sonnet-4-6',
      cost_per_extraction_usd_estimated: 0.03,
    },
    required: false,
    fallback: 'manual',
  },
  nota_finca: {
    schema_path: 'nota_simple_registral.finca_numero',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'nota_simple_registral_es',
      prompt_version: '1.0',
      min_confidence: 0.90,
      recommended_model: 'sonnet-4-6',
      cost_per_extraction_usd_estimated: 0.03,
    },
    required: false,
    fallback: 'manual',
  },

  // -------------------- LICENCIAS --------------------
  licencias_lista: {
    schema_path: 'licencias',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'licencia_obra_es',
      prompt_version: '1.0',
      min_confidence: 0.82,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
    internal_notes: 'Variabilidad por ayuntamiento · puede requerir prompt regional.',
  },

  // -------------------- TASACIÓN OFICIAL --------------------
  tasacion_valor: {
    schema_path: 'tasacion_oficial.valor_tasacion',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'tasacion_oficial_es',
      prompt_version: '1.0',
      min_confidence: 0.90,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  tasacion_fecha: {
    schema_path: 'tasacion_oficial.fecha_tasacion',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'tasacion_oficial_es',
      prompt_version: '1.0',
      min_confidence: 0.90,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  tasacion_sociedad: {
    schema_path: 'tasacion_oficial.sociedad_tasadora',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'tasacion_oficial_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
  tasacion_homologacion: {
    schema_path: 'tasacion_oficial.numero_homologacion',
    strategy: 'ai_extraction',
    priority: 'ai_only',
    ai: {
      document_type: 'tasacion_oficial_es',
      prompt_version: '1.0',
      min_confidence: 0.85,
      recommended_model: 'haiku-4-5',
      cost_per_extraction_usd_estimated: 0.008,
    },
    required: false,
    fallback: 'manual',
  },
}

// ============================================================================
// CAMPOS MANUALES · solo desde UI 1503
// ============================================================================

const MANUAL_ENTRIES: Record<string, ErpMappingEntry> = {
  declaracion_propietario: {
    schema_path: 'declaracion_propietario_legitimo',
    strategy: 'manual',
    priority: 'ui_only',
    required: true,
    manual_justification: 'Declaración legal del Actor · responsabilidad civil. Acto declarativo expreso obligatorio según LSSI-CE + Código Civil ES. NO se puede automatizar.',
  },
  acepta_visitas_virtuales: {
    schema_path: 'acepta_visitas_virtuales',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Preferencia comercial del Actor por ficha · no es dato del producto ni del ERP.',
  },
  acepta_apostilla_cross_border: {
    schema_path: 'acepta_apostilla_electronica_cross_border',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Política comercial del Actor sobre cierre notarial cross-border Fase 8. Decisión estratégica · no operativa de ERP.',
  },
  estado_operacion: {
    schema_path: 'estado_operacion',
    strategy: 'manual',
    priority: 'ui_only',
    required: true,
    manual_justification: 'Estado de la operación comercial en 1503 (disponible/reservado/cerrado). El Actor lo gestiona en 1503 · ERP es informativo opcional.',
  },
  disponibilidad_visita_dias: {
    schema_path: 'disponibilidad_visita.dias_semana',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Agenda de visitas configurada por el Actor en 1503 · cruza con módulo Agenda (Fase 5.2). No replicable a ERP.',
  },
  disponibilidad_visita_horario: {
    schema_path: 'disponibilidad_visita.horario',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Horario libre · texto del Actor.',
  },
  fotos_360: {
    schema_path: 'fotos_360_urls',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Subida directa por el Actor en 1503 (Storage). Pueden venir del ERP como links externos pero la UX recomendada es subir a 1503 para CDN propio.',
  },
  video_tour: {
    schema_path: 'video_tour_url',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'URL externa típicamente YouTube/Vimeo · el Actor pega manualmente.',
  },
  plano_planta: {
    schema_path: 'plano_planta_urls',
    strategy: 'manual',
    priority: 'ui_only',
    required: false,
    manual_justification: 'Planos suelen subirse aparte por el Actor en formato PDF/imagen.',
  },
  modalidad_pago: {
    schema_path: 'payment_modality',
    strategy: 'manual',
    priority: 'ui_only',
    required: true,
    manual_justification: 'Decisión comercial 1503 (01/02/03/04 modalidades ratificadas 12-may). NO existe en ERPs · es política del Actor sobre la ficha.',
  },
  certificados_aplicables: {
    schema_path: 'certificates',
    strategy: 'manual',
    priority: 'bidirectional',
    required: false,
    manual_justification: 'Lista de IDs del registry de certificaciones. Actor selecciona en UI tras subir PDFs (que IA extraerá). Híbrido: declaración inicial manual + extracción IA del contenido.',
  },
}

// ============================================================================
// MAPPING COMPLETO INMOBILIARIO
// ============================================================================

/** Mapping ERP del schema sectorial INMOBILIARIO · versión piloto.
 *
 * Cobertura final:
 *   - universal:     8 campos
 *   - extended:     32 campos
 *   - ai_extraction: 19 campos
 *   - manual:       12 campos
 *   - TOTAL:        71 campos mapeados (subset funcional del schema completo)
 *
 * Próximos pasos:
 *   1. Validación experta sectorial (AEGI · Notarios · Registradores · COAM)
 *   2. Benchmark con Idealista API + Fotocasa API + Rightmove
 *   3. Piloto técnico con Holded sandbox · partner program
 *   4. Promoción a status: 'validated' tras los 3 anteriores.
 */
export const INMOBILIARIO_ERP_MAPPING: SectorErpMapping = {
  sector_id: 'inmobiliario',
  schema_version: INMOBILIARIO_SCHEMA_VERSION,
  mapping_version: 'inmobiliario-erp@1.0',
  status: 'draft',
  last_reviewed_at: '2026-05-26',
  entries: {
    ...UNIVERSAL_ENTRIES,
    ...EXTENDED_ENTRIES,
    ...AI_EXTRACTION_ENTRIES,
    ...MANUAL_ENTRIES,
  },
}
