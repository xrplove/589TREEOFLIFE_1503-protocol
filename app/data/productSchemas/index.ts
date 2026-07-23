// Registry global de schemas sectoriales.
//
// Cada sector ISIC tiene su propio archivo de schema con tipos extendiendo
// `UniversalProduct`. Este index expone el catálogo + helpers.
//
// Estado actual (mayo 2026):
// - TRANSPORTE ✅ schema implementado (status: 'draft' · piloto cluster Valencia)
// - INMOBILIARIO ✅ schema implementado (status: 'draft' · plantilla canónica)
// - AGROALIMENTARIO ✅ schema implementado (status: 'draft' · bloque D.3)
// - LEGAL ✅ schema implementado (status: 'draft' · bloque D.4 · transversal)
// - AUTOMOCIÓN ✅ schema implementado (status: 'draft' · bloque D.5)
// - SALUD ✅ schema implementado (status: 'draft' · bloque D.6 · MDR/IVDR + GDPR art. 9)
// - ENERGÍA ✅ schema implementado (status: 'draft' · bloque D.7 · RED III + EED + AFIR)
// - METALÚRGICO ✅ schema implementado (status: 'subject_to_expert' · Fase 7 bloque 8 ·
//                                       PED + EN 1090 + ISO 3834 + CBAM + REACH + RoHS + IATF + AS 9100)
// - Resto sectores: pendientes implementar
//
// Ver `docs/plan-fase6-fichas-sectoriales.md` para roadmap de implementación.

import type { UniversalProduct, ProductSchemaStatus } from './_universal'
import {
  TRANSPORTE_SCHEMA_VERSION,
  TRANSPORTE_SCHEMA_STATUS,
} from './transporte'
import {
  INMOBILIARIO_SCHEMA_VERSION,
  INMOBILIARIO_SCHEMA_STATUS,
} from './inmobiliario'
import {
  AGROALIMENTARIO_SCHEMA_VERSION,
  AGROALIMENTARIO_SCHEMA_STATUS,
} from './agroalimentario'
import {
  LEGAL_SCHEMA_VERSION,
  LEGAL_SCHEMA_STATUS,
} from './legal'
import {
  AUTOMOCION_SCHEMA_VERSION,
  AUTOMOCION_SCHEMA_STATUS,
} from './automocion'
import {
  SALUD_SCHEMA_VERSION,
  SALUD_SCHEMA_STATUS,
} from './salud'
import {
  ENERGIA_SCHEMA_VERSION,
  ENERGIA_SCHEMA_STATUS,
} from './energia'
import {
  METALURGICO_SCHEMA_VERSION,
  METALURGICO_SCHEMA_STATUS,
} from './metalurgico'
import {
  TEXTIL_SCHEMA_VERSION,
  TEXTIL_SCHEMA_STATUS,
} from './textil'
import {
  TECNOLOGIA_SCHEMA_VERSION,
  TECNOLOGIA_SCHEMA_STATUS,
} from './tecnologia'
import {
  TURISMO_SCHEMA_VERSION,
  TURISMO_SCHEMA_STATUS,
} from './turismo'
import {
  EDUCACION_SCHEMA_VERSION,
  EDUCACION_SCHEMA_STATUS,
} from './educacion'
import {
  MEDIOAMBIENTE_SCHEMA_VERSION,
  MEDIOAMBIENTE_SCHEMA_STATUS,
} from './medioambiente'
import {
  CULTURA_SCHEMA_VERSION,
  CULTURA_SCHEMA_STATUS,
} from './cultura'
import {
  INSTITUCIONAL_SCHEMA_VERSION,
  INSTITUCIONAL_SCHEMA_STATUS,
} from './institucional'
import {
  SERVICIOS_AUXILIARES_SCHEMA_VERSION,
  SERVICIOS_AUXILIARES_SCHEMA_STATUS,
} from './serviciosAuxiliares'
import {
  FINANCIERO_SCHEMA_VERSION,
  FINANCIERO_SCHEMA_STATUS,
} from './financiero'

// ============================================================================
// CATÁLOGO DE SECTORES CON SCHEMA IMPLEMENTADO
// ============================================================================

/** Metadata de un schema sectorial implementado. */
export type SectorSchemaMetadata = {
  sector_id: string
  schema_version: string
  schema_status: ProductSchemaStatus
  /** Sub-categorías que el schema soporta. */
  sub_categorias: readonly string[]
  /** Bloque del roadmap Fase 6 (orden de implementación recomendado). */
  bloque_implementacion?: number
}

/** Sectores con schema implementado · todos los demás (de los 17 ISIC) están
 *  pendientes. */
export const SECTOR_SCHEMAS: Record<string, SectorSchemaMetadata> = {
  transporte: {
    sector_id: 'transporte',
    schema_version: TRANSPORTE_SCHEMA_VERSION,
    schema_status: TRANSPORTE_SCHEMA_STATUS,
    sub_categorias: ['servicio_transitario', 'operacion_transporte', 'servicio_naviero'],
    bloque_implementacion: 1,
  },
  inmobiliario: {
    sector_id: 'inmobiliario',
    schema_version: INMOBILIARIO_SCHEMA_VERSION,
    schema_status: INMOBILIARIO_SCHEMA_STATUS,
    sub_categorias: ['inmueble', 'necesidad_inmobiliaria', 'servicio_profesional_inmobiliario'],
    bloque_implementacion: 2,
  },
  agroalimentario: {
    sector_id: 'agroalimentario',
    schema_version: AGROALIMENTARIO_SCHEMA_VERSION,
    schema_status: AGROALIMENTARIO_SCHEMA_STATUS,
    sub_categorias: ['producto_agroalimentario', 'necesidad_agroalimentaria', 'servicio_agroalimentario'],
    bloque_implementacion: 3,
  },
  legal: {
    sector_id: 'legal',
    schema_version: LEGAL_SCHEMA_VERSION,
    schema_status: LEGAL_SCHEMA_STATUS,
    sub_categorias: ['servicio_juridico', 'necesidad_juridica', 'servicio_notarial'],
    bloque_implementacion: 4,
  },
  automocion: {
    sector_id: 'automocion',
    schema_version: AUTOMOCION_SCHEMA_VERSION,
    schema_status: AUTOMOCION_SCHEMA_STATUS,
    sub_categorias: ['vehiculo', 'necesidad_automocion', 'servicio_automocion'],
    bloque_implementacion: 5,
  },
  salud: {
    sector_id: 'salud',
    schema_version: SALUD_SCHEMA_VERSION,
    schema_status: SALUD_SCHEMA_STATUS,
    sub_categorias: ['producto_sanitario', 'necesidad_sanitaria', 'servicio_profesional_sanitario'],
    bloque_implementacion: 6,
  },
  energia: {
    sector_id: 'energia',
    schema_version: ENERGIA_SCHEMA_VERSION,
    schema_status: ENERGIA_SCHEMA_STATUS,
    sub_categorias: ['instalacion_energetica', 'necesidad_energetica', 'servicio_energetico'],
    bloque_implementacion: 7,
  },
  metalurgico: {
    sector_id: 'metalurgico',
    schema_version: METALURGICO_SCHEMA_VERSION,
    schema_status: METALURGICO_SCHEMA_STATUS,
    sub_categorias: ['material_metalurgico', 'equipo_presion', 'necesidad_metalurgica', 'servicio_metalurgico'],
    bloque_implementacion: 8,
  },
  textil: {
    sector_id: 'textil',
    schema_version: TEXTIL_SCHEMA_VERSION,
    schema_status: TEXTIL_SCHEMA_STATUS,
    sub_categorias: ['textil_material', 'textil_confeccionado', 'necesidad_textil', 'servicio_textil'],
    bloque_implementacion: 9,
  },
  tecnologia: {
    sector_id: 'tecnologia',
    schema_version: TECNOLOGIA_SCHEMA_VERSION,
    schema_status: TECNOLOGIA_SCHEMA_STATUS,
    sub_categorias: ['componente_electronico', 'equipo_electronico', 'necesidad_tecnologica', 'servicio_tecnologico'],
    bloque_implementacion: 10,
  },
  turismo: {
    sector_id: 'turismo',
    schema_version: TURISMO_SCHEMA_VERSION,
    schema_status: TURISMO_SCHEMA_STATUS,
    sub_categorias: ['alojamiento_turistico', 'experiencia_turistica', 'servicio_intermediacion_viaje', 'necesidad_turistica'],
    bloque_implementacion: 11,
  },
  educacion: {
    sector_id: 'educacion',
    schema_version: EDUCACION_SCHEMA_VERSION,
    schema_status: EDUCACION_SCHEMA_STATUS,
    sub_categorias: ['servicio_formativo', 'necesidad_formativa', 'acreditacion_titulo'],
    bloque_implementacion: 12,
  },
  medioambiente: {
    sector_id: 'medioambiente',
    schema_version: MEDIOAMBIENTE_SCHEMA_VERSION,
    schema_status: MEDIOAMBIENTE_SCHEMA_STATUS,
    sub_categorias: ['servicio_ambiental', 'gestion_residuo', 'material_recuperado', 'necesidad_ambiental'],
    bloque_implementacion: 13,
  },
  cultura: {
    sector_id: 'cultura',
    schema_version: CULTURA_SCHEMA_VERSION,
    schema_status: CULTURA_SCHEMA_STATUS,
    sub_categorias: ['produccion_cultural', 'bien_cultural', 'servicio_deportivo', 'necesidad_cultura_deporte'],
    bloque_implementacion: 14,
  },
  institucional: {
    sector_id: 'institucional',
    schema_version: INSTITUCIONAL_SCHEMA_VERSION,
    schema_status: INSTITUCIONAL_SCHEMA_STATUS,
    sub_categorias: ['licitacion_publica', 'oferta_proveedor_publico', 'servicio_asistencia_tecnica', 'necesidad_institucional'],
    bloque_implementacion: 15,
  },
  'servicios-auxiliares': {
    sector_id: 'servicios-auxiliares',
    schema_version: SERVICIOS_AUXILIARES_SCHEMA_VERSION,
    schema_status: SERVICIOS_AUXILIARES_SCHEMA_STATUS,
    sub_categorias: ['servicio_auxiliar', 'servicio_seguridad_privada', 'servicio_trabajo_temporal', 'necesidad_servicio_auxiliar'],
    bloque_implementacion: 16,
  },
  financiero: {
    sector_id: 'financiero',
    schema_version: FINANCIERO_SCHEMA_VERSION,
    schema_status: FINANCIERO_SCHEMA_STATUS,
    sub_categorias: ['servicio_bancario_credito', 'servicio_inversion', 'servicio_cripto', 'servicio_seguro'],
    bloque_implementacion: 17,
  },
}

/** Sectores ISIC del proyecto (los 17 + FINANCIERO transversal) que aún NO
 *  tienen schema implementado · referencia visual del trabajo pendiente
 *  Fase 6. */
/** Todos los 17 sectores tienen ya schema implementado (12/17 → 17/17 · 2026-06-01).
 *  Se mantiene la constante (vacía) por compatibilidad de API. */
export const SECTORS_PENDING_SCHEMA: readonly string[] = [] as const

// ============================================================================
// HELPERS · public API del registry
// ============================================================================

/** Indica si un sector tiene schema implementado (vs solo placeholder). */
export function hasSectorSchema(sectorId: string): boolean {
  return sectorId in SECTOR_SCHEMAS
}

/** Retorna metadata del schema sectorial · null si no implementado. */
export function getSectorSchemaMetadata(sectorId: string): SectorSchemaMetadata | null {
  return SECTOR_SCHEMAS[sectorId] ?? null
}

/** Verifica si una ficha es un producto del sector indicado.
 *  NO valida el contenido completo · solo el `sector_id` declarado en `actor`. */
export function productBelongsToSector(
  product: UniversalProduct,
  sectorId: string,
): boolean {
  return product.actor.sector_id === sectorId
}

// ============================================================================
// RE-EXPORTS · public API consolidada
// ============================================================================

// Universal
export type {
  ISOCountryCode,
  ISOCurrency,
  ProductSchemaStatus,
  PaymentModality,
  ActorKYCRef,
  BulkDiscountTier,
  ProductPrice,
  ProductStock,
  ProductImage,
  CertificateRef,
  AuditTrail,
  UniversalProduct,
} from './_universal'
export { UNIVERSAL_SCHEMA_VERSION, isLocalizedLabel } from './_universal'

// Validators
export {
  isValidISOCountryCode,
  isValidEAN13,
  isValidGTIN,
  isValidVIN17,
  isValidIBAN,
  parseISODate,
  isCertificateActive,
  isValidXRPLAddress,
  isValidSHA256Hash,
} from './_validators'

// Certifications
export type {
  CertificationStatus,
  CertificationScope,
  CertificationCategory,
  CertificationDefinition,
} from './_certifications'
export {
  CERTIFICATIONS,
  getCertification,
  certificationsByCategory,
  CORE_CERTIFICATIONS_TRANSPORTE,
  CORE_CERTIFICATIONS_INMOBILIARIO,
  CORE_CERTIFICATIONS_AGROALIMENTARIO,
  CORE_CERTIFICATIONS_LEGAL,
  CORE_CERTIFICATIONS_AUTOMOCION,
  CORE_CERTIFICATIONS_SALUD,
  CORE_CERTIFICATIONS_ENERGIA,
  CORE_CERTIFICATIONS_METALURGICO,
} from './_certifications'

// Transporte
export type {
  TransporteModo,
  TipoCarga,
  TipoContenedor,
  TipoServicioTransitario,
  RegimenAduanero,
  Incoterm2020,
  ClaseMercanciaPeligrosaUN,
  PuntoLogistico,
  MercanciaDescripcion,
  ServicioTransitarioProduct,
  OperacionTransporteProduct,
  ServicioNavieroProduct,
  TransporteProduct,
} from './transporte'
export {
  TRANSPORTE_SCHEMA_VERSION,
  TRANSPORTE_SCHEMA_STATUS,
  isServicioTransitario,
  isOperacionTransporte,
  isServicioNaviero,
} from './transporte'

// Inmobiliario
export type {
  InmobiliarioOperacion,
  InmobiliarioTipo,
  ViviendaSubtipo,
  CertificadoEnergetico,
  EstadoConservacion,
  CalificacionUrbanistica,
  RegimenProteccion,
  Orientacion,
  SistemaCalefaccion,
  SistemaRefrigeracion,
  SistemaACS,
  UbicacionInmueble,
  SuperficieInmueble,
  DocumentoIEE,
  DocumentoCedulaHabitabilidad,
  TipoCargaRegistral,
  CargaRegistral,
  DocumentoNotaSimple,
  DocumentoLicencia,
  CaracteristicasInmueble,
  InmuebleProduct,
  NecesidadInmobiliariaProduct,
  TipoServicioInmobiliario,
  ServicioProfesionalInmobiliarioProduct,
  InmobiliarioProduct,
} from './inmobiliario'
export {
  INMOBILIARIO_SCHEMA_VERSION,
  INMOBILIARIO_SCHEMA_STATUS,
  isInmueble,
  isNecesidadInmobiliaria,
  isServicioProfesionalInmobiliario,
} from './inmobiliario'

// Agroalimentario
export type {
  CategoriaProductoAgro,
  TipoTransformacionAgro,
  CadenaFrioRequerida,
  OrigenProduccionAgro,
  AlergenoUE,
  FormatoComercialAgro,
  ModalidadPeso,
  PerfilNutricional100g,
  TrazabilidadLote,
  DurabilidadAlimento,
  FiguraCalidadUE,
  CalidadDiferenciadaUE,
  HuellaAmbientalAgro,
  InfoConsumidorFIC,
  ProductoAgroalimentarioProduct,
  NecesidadAgroalimentariaProduct,
  TipoServicioAgroalimentario,
  ServicioAgroalimentarioProduct,
  AgroalimentarioProduct,
} from './agroalimentario'
export {
  AGROALIMENTARIO_SCHEMA_VERSION,
  AGROALIMENTARIO_SCHEMA_STATUS,
  isProductoAgroalimentario,
  isNecesidadAgroalimentaria,
  isServicioAgroalimentario,
} from './agroalimentario'

// Legal
export type {
  AreaPracticaJuridica,
  FormaJuridicaCliente,
  ModeloTarifaJuridica,
  TipoActoNotarial,
  TipoFirmaElectronica,
  TipoApostilla,
  UrgenciaJuridica,
  ColegiacionJuridica,
  AcreditacionNotario,
  SeguroRCPJuridico,
  CompromisoConfidencialidad,
  ServicioJuridicoProduct,
  NecesidadJuridicaProduct,
  ServicioNotarialProduct,
  LegalProduct,
} from './legal'
export {
  LEGAL_SCHEMA_VERSION,
  LEGAL_SCHEMA_STATUS,
  isServicioJuridico,
  isNecesidadJuridica,
  isServicioNotarial,
} from './legal'

// Automoción
export type {
  CategoriaVehiculo,
  TipoCarroceria,
  TipoMotorizacion,
  TipoTransmision,
  TipoTraccion,
  DistintivoAmbientalDGTES,
  NormaEmisionesEuropea,
  EstadoVehiculoOferta,
  TipoOperacionAutomocion,
  TipoServicioAutomocion,
  IdentificacionVehiculo,
  DimensionesVehiculo,
  MotorVehiculo,
  EmisionesVehiculo,
  HistorialVehiculo,
  DocumentacionVehiculo,
  EquipamientoVehiculo,
  VehiculoProduct,
  NecesidadAutomocionProduct,
  ServicioAutomocionProduct,
  AutomocionProduct,
} from './automocion'
export {
  AUTOMOCION_SCHEMA_VERSION,
  AUTOMOCION_SCHEMA_STATUS,
  isVehiculo,
  isNecesidadAutomocion,
  isServicioAutomocion,
} from './automocion'

// Salud
export type {
  CategoriaProductoSanitario,
  TipoMedicamento,
  ViaAdministracion,
  EspecialidadMedica,
  TipoServicioSanitario,
  BaseLegalDatosSaludGDPR,
  IdentificacionMedicamento,
  IdentificacionProductoSanitarioMDR,
  AutorizacionMedicamento,
  LoteProductoSanitario,
  ConformidadCEProductoSanitario,
  ColegiacionSanitaria,
  AutorizacionCentroSanitario,
  MarcoDatosClinicosGDPR,
  ProductoSanitarioProduct,
  NecesidadSanitariaProduct,
  ServicioProfesionalSanitarioProduct,
  SaludProduct,
} from './salud'
export {
  SALUD_SCHEMA_VERSION,
  SALUD_SCHEMA_STATUS,
  isProductoSanitario,
  isNecesidadSanitaria,
  isServicioProfesionalSanitario,
} from './salud'

// Energía
export type {
  TipoFuenteEnergia,
  TipoInstalacionEnergetica,
  CategoriaProductoEnergia,
  TipoCertificadoOrigen,
  TipoServicioEnergia,
  ModeloContratoEnergetico,
  EspecificacionesPanelFV,
  EspecificacionesBateria,
  EspecificacionesAerogenerador,
  AutorizacionesInstalacionES,
  GarantiaOrigenCNMC,
  CondicionesPPA,
  InstalacionEnergeticaProduct,
  NecesidadEnergeticaProduct,
  ServicioEnergeticoProduct,
  EnergiaProduct,
} from './energia'
export {
  ENERGIA_SCHEMA_VERSION,
  ENERGIA_SCHEMA_STATUS,
  isInstalacionEnergetica,
  isNecesidadEnergetica,
  isServicioEnergetico,
} from './energia'

// Metalúrgico
export type {
  FamiliaMetalica,
  SistemaDesignacionMetal,
  FormatoProductoMetalico,
  ProcesoTransformacionMetalica,
  AcabadoSuperficial,
  TratamientoTermicoMetal,
  CertificadoInspeccionEN10204,
  AlcanceCBAMMaterial,
  ClaseEjecucionEN1090,
  EstadoFPCEN1090,
  CategoriaPED,
  ModuloEvaluacionPED,
  GrupoFluidoPED,
  EstadoFluidoPED,
  TipoEquipoPresion,
  CategoriaATEX,
  ProcesoSoldadura,
  NivelISO3834,
  NormaCualificacionSoldador,
  MetodoEND,
  NivelInspectorEND,
  DocumentoTecnicoRef,
  MaterialMetalurgicoProduct,
  EquipoPresionProduct,
  NecesidadMetalurgicaProduct,
  TipoServicioMetalurgico,
  ModeloCobroServicioMetalurgico,
  ServicioMetalurgicoProduct,
  MetalurgicoProduct,
} from './metalurgico'
export {
  METALURGICO_SCHEMA_VERSION,
  METALURGICO_SCHEMA_STATUS,
  isMaterialMetalurgico,
  isEquipoPresion,
  isNecesidadMetalurgica,
  isServicioMetalurgico,
  requiereNotifiedBodyPED,
  requiereMarcadoCEEN1090,
  enAlcanceCBAM,
} from './metalurgico'

// Sector TEXTIL · Fase 7 bloque sectorial 9 (ISIC C13/C14/C15)
export type {
  FamiliaFibraTextil,
  FormatoTextil,
  LigamentoCalada,
  LigamentoPunto,
  ProcesoHilatura,
  EtapaTintura,
  ClaseColorante,
  TecnicaEstampacion,
  AcabadoFuncionalTextil,
  ComposicionFibra,
  RestriccionReachTextil,
  ConjuntoSimbolosCuidado,
  NormaSolidez,
  CategoriaCPR_Textil,
  CategoriaPPE,
  LoteTinturaTextil,
  TextilMaterialProduct,
  CategoriaProductoConfeccionado,
  SistemaTallaProducto,
  TextilProductoConfeccionadoProduct,
  NecesidadTextilProduct,
  TipoServicioTextil,
  ModeloCobroServicioTextil,
  ServicioTextilProduct,
  TextilProduct,
} from './textil'
export {
  TEXTIL_SCHEMA_VERSION,
  TEXTIL_SCHEMA_STATUS,
  isTextilMaterial,
  isTextilConfeccionado,
  isNecesidadTextil,
  isServicioTextil,
  requiereEtiquetado1007_2011,
  contieneCueroBovinoEUDR,
  requiereNotifiedBodyPPE,
  requiereAdhesionSCRAP_RD_1055_2022,
} from './textil'

// Sector TECNOLOGÍA · Fase 7 bloque sectorial 10 (ISIC C26/C27/J62/J63)
export type {
  CategoriaWEEE,
  SustanciaRestringidaRoHS,
  FamiliaComponenteElectronico,
  TipoEquipoElectronico,
  ClaseEficienciaEnergetica,
  ClaseReparabilidad,
  InterfazCarga,
  ProtocoloRadio,
  ClasificacionRiesgoIA,
  ProcedimientoEvaluacionConformidad,
  EnsayoRoHS,
  SustanciaSCIP,
  MineralConflicto3TG,
  ComponenteElectronicoProduct,
  EquipoElectronicoProduct,
  NecesidadTecnologicaProduct,
  TipoServicioTecnologico,
  ModeloCobroServicioTecnologico,
  ServicioTecnologicoProduct,
  TecnologiaProduct,
} from './tecnologia'
export {
  TECNOLOGIA_SCHEMA_VERSION,
  TECNOLOGIA_SCHEMA_STATUS,
  isComponenteElectronico,
  isEquipoElectronico,
  isNecesidadTecnologica,
  isServicioTecnologico,
  requiereConformidadRoHS,
  requiereRegistroWEEE,
  requiereCargadorComunUSBC,
  requiereEtiquetaEnergeticaMoviles,
  esAltoRiesgoOProhibidoIA,
  servicioEnAlcanceCRA,
  contieneMineralesConflicto3TG,
} from './tecnologia'

// Sector TURISMO · Fase 7 bloque sectorial 11 (ISIC I55/I56/N79/N82.30 · servicios)
export type {
  TipoAlojamiento,
  CategoriaAlojamiento,
  RegimenAlojamiento,
  TipoExperienciaTuristica,
  TipoIntermediacionViaje,
  ModeloTarifaTurismo,
  SegmentoViajero,
  NivelAccesibilidad,
  SelloTurismo,
  CumplimientoAlimentarioFyB,
  AlojamientoTuristicoProduct,
  ExperienciaTuristicaProduct,
  ServicioIntermediacionViajeProduct,
  NecesidadTuristicaProduct,
  TurismoProduct,
} from './turismo'
export {
  TURISMO_SCHEMA_VERSION,
  TURISMO_SCHEMA_STATUS,
  isAlojamientoTuristico,
  isExperienciaTuristica,
  isServicioIntermediacionViaje,
  isNecesidadTuristica,
  enAlcanceSTRReg2024_1028,
  requiereRegistroTuristicoAutonomico,
  requiereProteccionInsolvenciaPackageTravel,
  requiereInfoAlergenos,
  requiereGuiaOficialHabilitado,
  esPlataformaDAC7,
} from './turismo'

// Sector EDUCACIÓN · Fase 6 bloque sectorial 12 (ISIC P85 · servicios)
export type {
  NivelEQF,
  TipoEnsenanza,
  ModalidadFormativa,
  ModeloTarifaFormativa,
  PublicoObjetivo,
  NivelMCER,
  AutorizacionCentroDocente,
  AcreditacionTituloUniversitario,
  ReconocimientoCualificacion,
  ServicioFormativoProduct,
  NecesidadFormativaProduct,
  AcreditacionTituloProduct,
  EducacionProduct,
} from './educacion'
export {
  EDUCACION_SCHEMA_VERSION,
  EDUCACION_SCHEMA_STATUS,
  isServicioFormativo,
  isNecesidadFormativa,
  isAcreditacionTitulo,
  emiteTituloOficial,
  requiereAcreditacionANECA,
  habilitaProfesionRegulada,
  dirigidoAMenores,
  enAlcanceEAA,
  esFormacionDistanciaB2C,
} from './educacion'

// ERP Mapping · estrategia universal de adapter 1503 ↔ ERPs
export type {
  ErpMappingStrategy,
  ErpMappingPriority,
  HoldedFieldRef,
  OdooFieldRef,
  SageFieldRef,
  SapFieldRef,
  AiExtractionConfig,
  ErpMappingEntry,
  SectorErpMapping,
  SectorMappingSummary,
} from './_erpMapping'
export {
  summarizeSectorMapping,
  fieldsByStrategy,
  customFieldsForProvider,
  documentTypesForAiExtraction,
  estimateMonthlyAiCostUsd,
} from './_erpMapping'

// ERP Mapping · sector INMOBILIARIO (piloto)
export { INMOBILIARIO_ERP_MAPPING } from './inmobiliarioErpMapping'

// Jurisdicción · modelo multi-jurisdicción de cumplimiento (ADR 0020)
export type { JurisdiccionScope } from './_jurisdiccion'
export {
  UE_27,
  EEE,
  jurisdiccionesAplicables,
  jurisdiccionesAplicablesOperacion,
  reglaAplica,
} from './_jurisdiccion'

// Capa 2 · ENFORCEMENT de cumplimiento sectorial (Audit-Ready by Design)
export type {
  ComplianceSeverity,
  ComplianceViolation,
  ComplianceResult,
} from './_compliance'
export {
  SECTORS_WITH_COMPLIANCE,
  validateSectorCompliance,
  validateTecnologiaCompliance,
  validateTurismoCompliance,
  validateTextilCompliance,
  validateMetalurgicoCompliance,
  validateSaludCompliance,
  validateAutomocionCompliance,
  validateAgroalimentarioCompliance,
  validateInmobiliarioCompliance,
  validateEnergiaCompliance,
  validateLegalCompliance,
  validateTransporteCompliance,
  validateEducacionCompliance,
  filtrarPorJurisdiccion,
  filtrarPorJurisdiccionOperacion,
} from './_compliance'

// Infraestructura fiscal transversal (IVA · facturación · comercio global)
export type {
  OperacionFiscalTipo,
  RegimenIVA,
  Modelo349Clave,
  EInvoiceEstandar,
  VIESValidationResult,
  OssIossData,
  EInvoiceData,
  FiscalInvoicingData,
} from './_fiscal'
export type { FiscalShapeResult } from './_fiscal'
export {
  VIES_REST_BASE,
  VIDA_EINVOICE_ESTRUCTURADA_DESDE,
  validateVatNumberVIES,
  esOperacionIntracomunitaria,
  requiereModelo349,
  claveModelo349Esperada,
  requiereEInvoiceEstructuradaViDA,
  validateFiscalCompliance,
  FiscalInvoicingDataSchema,
  validateFiscalShape,
} from './_fiscal'
