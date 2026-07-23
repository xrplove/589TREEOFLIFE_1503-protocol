// Validadores Zod runtime para DPPProduct v1.1
//
// Materializa los CHECK constraints SQL como validaciones runtime previas a
// tocar BD. Primera línea de defensa contra datos malformados que vienen de:
// - Formularios alta KYC/KYB
// - Webhooks ERP fabricante (Holded · Odoo · Sage)
// - API de creación/edición DPP en escritorio 1503
// - Endpoint Notice & Action (DSA Art. 16)
// - Custody handover firmado por transitario
// - Sync ERP bidireccional
// - Llamadas REST públicas (QR/NFC consumidor ESPR)
//
// CONVENCIÓN DE NOMBRES
// ---------------------
// Este archivo (`_dppValidators.ts`) contiene SCHEMAS Zod para validación
// estructural runtime. El archivo `_validators.ts` (hermano) contiene
// HELPERS TypeScript puros (isValidEAN13, isValidGTIN, isValidVIN17,
// isValidIBAN, isValidXRPLAddress, etc.). Ambos coexisten · cada uno con
// su responsabilidad:
//   - `_validators.ts`     · funciones síncronas puras retornan boolean
//   - `_dppValidators.ts`  · schemas Zod con `.safeParse()` + errores tipados
//
// COMPROMISO INGENIERO
// --------------------
// - 0 atajos: cada validación replica EXACTAMENTE el tipo TS correspondiente
//   en `_dpp.ts` + añade comprobaciones cross-field que el sistema de tipos
//   no puede expresar (refines).
// - Defensa en profundidad: estos schemas Zod actúan en API (server-side).
//   Los CHECK constraints SQL en mig 028 son la segunda barrera.
//   La UI cliente puede usar los mismos schemas para feedback inmediato pero
//   NUNCA es la única validación.
// - Errores tipados: cada refine tiene mensaje claro indicando qué falta y
//   qué norma exige la obligatoriedad. Auditable.
//
// CROSS-FIELD VALIDATIONS (refines) IMPLEMENTADAS
// -----------------------------------------------
// - EUDR completeness · DPPOrigin · si in_eudr_scope=true → dds_reference +
//   origin_geolocation obligatorios (Reg. UE 2023/1115 Art. 9.1.d)
// - CRA completeness · DPPERPLink · si has_digital_elements=true → 4 campos
//   CRA obligatorios (Reg. UE 2024/2847 Art. 13)
// - IMDG completeness · DPPSustainability · si imdg_class set → un_number +
//   pg_packing_group obligatorios (Código IMDG SOLAS)
// - PPWR reusability coherence · DPPPackaging · si reusable=true →
//   reusability_cycles ≥ 1 (Reg. UE 2025/40 Art. 26)
// - Reefer temp coherence · DPPPackaging · si ambas reefer_temp definidas →
//   min ≤ max
// - Stack load coherence · DPPPackaging · si stackable=false NO max_stack_load_kg
// - Custody chain ordering · DPPCustody · timestamps cronológicos
// - First custody link role · DPPCustody · primer eslabón = manufacturer
//   (G10 ADR 0007 §2.2)
// - EUDR date cutoff · origin_geolocation.production_date_on_plot >
//   2020-12-31 (Reg. UE 2023/1115 Art. 8.2.c)
// - ERP sync coherence · si erp_provider → erp_external_id obligatorio
// - GPS coords pair · gps_lat y gps_lng se definen juntos o ninguno
// - eudr_compliance_attested coherence · solo si in_eudr_scope=true
// - Material/packaging percentages · suma ≤ 100%
//
// VALIDACIONES NO IMPLEMENTADAS AQUÍ (deferidas a Edge Function)
// --------------------------------------------------------------
// - CBAM emissions coherence vs HS code (requiere cross-layer A↔C · Edge Function)
// - HS code validation contra TARIC API (requiere llamada externa)
// - GeoJSON Polygon estructura completa (anillo cerrado · winding order ·
//   validación simplificada aquí · estricta en Edge Function si surge volumen)
// - VAT number contra VIES (requiere llamada externa a EU VIES service)
// - EORI contra autoridad aduanera (requiere llamada externa)
//
// VERSIÓN
// -------
// DPPProductSchema v1.1 · alineado con DPP_SCHEMA_VERSION='1.1' (_dpp.ts).
// Cualquier bump de schema en _dpp.ts requiere bump aquí también.

import { z } from 'zod'

// ============================================================================
// PRIMITIVOS COMUNES (regex + ranges)
// ============================================================================

/** ISO 8601 date (YYYY-MM-DD). */
const Iso8601DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe ser fecha ISO 8601 formato YYYY-MM-DD')

/** ISO 8601 datetime (timestamp completo · acepta zona horaria). */
const Iso8601DateTimeSchema = z
  .string()
  .datetime({ message: 'Debe ser timestamp ISO 8601 (con zona horaria)' })

/** Hash SHA-256 en hexadecimal (64 caracteres minúscula). */
const Sha256HexSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, 'Hash SHA-256 debe ser 64 caracteres hex minúscula')

/** Clave pública Ed25519 hex (64 caracteres). */
const Ed25519PublicKeySchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, 'Clave pública Ed25519 debe ser 64 caracteres hex')

/** Firma Ed25519 hex (128 caracteres). */
const Ed25519SignatureSchema = z
  .string()
  .regex(/^[a-f0-9]{128}$/, 'Firma Ed25519 debe ser 128 caracteres hex')

/** UN/LOCODE (5 caracteres · ISO 3166 país + 3 chars sin 0/1). */
const UnLocodeSchema = z
  .string()
  .regex(
    /^[A-Z]{2}[A-Z2-9]{3}$/,
    'UN/LOCODE debe ser 5 caracteres: 2 letras país ISO 3166 + 3 chars [A-Z,2-9]',
  )

/** Código HS arancelario (6-10 dígitos). */
const HsCodeSchema = z
  .string()
  .regex(/^[0-9]{6,10}$/, 'HS code debe ser 6-10 dígitos (Sistema Armonizado)')

/** Número UN de mercancía peligrosa (formato UN0000-UN3999). */
const UnNumberSchema = z
  .string()
  .regex(/^UN[0-9]{4}$/, 'UN number debe ser formato UN0000 (4 dígitos)')

/** ISO 3166-1 alpha-2 (2 letras mayúscula). */
const Iso3166Alpha2Schema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'País debe ser código ISO 3166-1 alpha-2 (2 letras)')

/** Latitud WGS84 (-90 a 90). */
const LatSchema = z
  .number()
  .min(-90, 'Latitud debe ser ≥ -90')
  .max(90, 'Latitud debe ser ≤ 90')

/** Longitud WGS84 (-180 a 180). */
const LngSchema = z
  .number()
  .min(-180, 'Longitud debe ser ≥ -180')
  .max(180, 'Longitud debe ser ≤ 180')

/** Porcentaje (0-100). */
const PercentageSchema = z
  .number()
  .min(0, 'Porcentaje debe ser ≥ 0')
  .max(100, 'Porcentaje debe ser ≤ 100')

/** EORI · formato genérico ISO 3166 alpha-2 + identificador nacional. */
const EoriSchema = z
  .string()
  .regex(
    /^[A-Z]{2}[A-Z0-9]{1,15}$/,
    'EORI debe empezar por ISO 3166-1 alpha-2 + identificador nacional',
  )

/** VAT number UE (formato VIES estándar). */
const VatNumberSchema = z
  .string()
  .regex(
    /^[A-Z]{2}[A-Z0-9]{2,14}$/,
    'VAT number debe ser formato VIES (ISO 3166-1 alpha-2 + 2-14 chars)',
  )

/** URL HTTPS (rechaza HTTP por seguridad · canon defensa en profundidad). */
const HttpsUrlSchema = z
  .string()
  .url('Debe ser URL válida')
  .startsWith('https://', 'URL debe ser HTTPS (no HTTP) por seguridad')

// ============================================================================
// ENUMS · replicar EXACTAMENTE los de _dpp.ts
// ============================================================================

const HazardousClassSchema = z.enum(['A', 'B', 'C']).nullable()

const IMDGClassSchema = z.enum([
  '1', // explosivos
  '2.1', // gas inflamable
  '2.2', // gas no inflamable no tóxico
  '2.3', // gas tóxico
  '3', // líquidos inflamables
  '4.1', // sólidos inflamables
  '4.2', // combustión espontánea
  '4.3', // emiten gases inflamables en contacto agua
  '5.1', // comburentes
  '5.2', // peróxidos orgánicos
  '6.1', // tóxicas
  '6.2', // infecciosas
  '7', // radiactivo
  '8', // corrosivas
  '9', // otros peligros diversos
])

const UNPackingGroupSchema = z.enum(['I', 'II', 'III'])

const PackageTypeSchema = z.enum([
  'box',
  'pallet',
  'ibc',
  'sack',
  'drum',
  'crate',
  'roll',
  'other',
])

const RequiredOrientationSchema = z.enum(['this_way_up', 'any', 'horizontal_only'])

const PackagingLayerSchema = z.enum(['primary', 'secondary', 'tertiary'])

const PackagingMaterialCodeSchema = z.enum([
  'PET',
  'HDPE',
  'PVC',
  'LDPE',
  'PP',
  'PS',
  'glass',
  'aluminum',
  'steel',
  'paper_cardboard',
  'wood',
  'composite',
  'other',
])

const UNDangerousClassSchema = z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9'])

const DangerousTransportCodeSchema = z.enum(['ADR', 'IMDG'])

const ERPProviderSchema = z.enum([
  'holded',
  'odoo',
  'sage_business_cloud',
  'sage_50',
  'sap_s4hana',
  'custom',
])

const ERPSyncStatusSchema = z.enum(['success', 'partial', 'failed', 'pending'])

const ConflictResolutionSchema = z.enum([
  'last_write_wins',
  'manual_override',
  'erp_wins',
])

const CRAClassSchema = z.enum(['default', 'class_I', 'class_II'])

const DPPLifecycleStateSchema = z.enum([
  'created_pending_completion',
  'created',
  'loaded',
  'in_transit',
  'arrived',
  'delivered',
  'in_use',
  'decommissioned',
  'recycled',
  'repaired',
  'resold',
])

const CustodyRoleSchema = z.enum([
  'manufacturer',
  'owner',
  'freight_forwarder',
  'carrier',
  'customs',
  'consignee',
])

/** v1.1: incluye 'AWB' (matiz canónico aviación · ADR 0007 §2.7).
 *  1503 registra AWB como documento legal en custody chain pero NO
 *  calcula W&B ni cubicaje aéreo (responsabilidad del transitario certificado).
 *  Incluye 'inland_waterway_bl' restaurado tras error spec v1.1.
 */
const CustodyDocumentTypeSchema = z.enum([
  'BL',
  'CMR',
  'AWB',
  'rail_consignment',
  'delivery_note',
  'inland_waterway_bl',
])

const SignaturePurposeSchema = z.enum([
  'creation',
  'transfer',
  'event',
  'custody_handover',
  'multi_sig_quorum',
])

const IncotermSchema = z.enum([
  'EXW',
  'FCA',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
  'DDP',
  'FAS',
  'FOB',
  'CFR',
  'CIF',
])

const MaritimeConventionSchema = z.enum([
  'hague_visby',
  'hamburg',
  'rotterdam',
  'not_applicable',
])

// ============================================================================
// ActorKYCRef · referencia ligera al Actor con KYC
// ============================================================================

/** ActorKYCRef · referencia mínima a un Actor (definido en _universal.ts).
 *
 *  Aquí definimos el schema Zod en este archivo. Cuando se centralice un
 *  futuro `_universalZod.ts`, este schema se migrará allí.
 */
const ActorKYCRefSchema = z.object({
  actor_id: z.string().uuid('actor_id debe ser UUID v4'),
  kyc_status: z.enum([
    'pending_email',
    'pending_kyc',
    'approved',
    'rejected',
    'suspended',
  ]),
  sector_id: z.string(),
  role_id: z.string(),
  isic: z.string().optional(),
  cnae: z.string().optional(),
  legal_entity_kind: z.string().optional(),
})

// ============================================================================
// SUB-OBJETOS · componentes complejos
// ============================================================================

const MaterialComponentSchema = z.object({
  name: z.string().min(1, 'Nombre del material no puede estar vacío'),
  percentage: PercentageSchema,
  supplier_hash: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/, 'supplier_hash debe ser formato "sha256:<hex64>"')
    .optional(),
  recycled_origin: z.boolean().optional(),
  hazardous_class: HazardousClassSchema.optional(),
})

const TaxonomyObjectiveSchema = z.object({
  eligible: z.boolean(),
  aligned: z.boolean(),
  dnsh_passed: z.boolean(),
  mss_passed: z.boolean(),
  technical_criteria_ref: z.string().optional(),
})

const TaxonomyAlignmentSchema = z.object({
  climate_change_mitigation: TaxonomyObjectiveSchema.optional(),
  climate_change_adaptation: TaxonomyObjectiveSchema.optional(),
  water_marine_resources: TaxonomyObjectiveSchema.optional(),
  circular_economy: TaxonomyObjectiveSchema.optional(),
  pollution_prevention: TaxonomyObjectiveSchema.optional(),
  biodiversity_ecosystems: TaxonomyObjectiveSchema.optional(),
})

const CBAMFootprintSchema = z.object({
  direct_emissions_t_co2eq: z.number().nonnegative('Emisiones directas deben ser ≥ 0'),
  indirect_emissions_t_co2eq: z
    .number()
    .nonnegative('Emisiones indirectas deben ser ≥ 0')
    .nullable()
    .optional(),
  methodology: z.literal('cbam_annex_iv'),
  verifier_name: z.string().min(1).optional(),
  verifier_accreditation_id: z.string().min(1).optional(),
  calculation_year: z
    .number()
    .int('Año debe ser entero')
    .min(2023, 'Año cálculo CBAM debe ser ≥ 2023 (inicio fase transitoria)')
    .max(2100, 'Año cálculo CBAM debe ser ≤ 2100'),
  certificates_purchased: z.number().int().nonnegative().optional(),
  avg_certificate_price_eur_t: z.number().nonnegative().optional(),
})

const PackagingMaterialSchema = z.object({
  code: PackagingMaterialCodeSchema,
  percentage: PercentageSchema,
  recyclable: z.boolean(),
})

const ERPSyncDetailsSchema = z.object({
  fields_synced: z.array(z.string()).optional(),
  fields_failed: z.array(z.string()).optional(),
  error_message: z.string().optional(),
  conflict_resolution: ConflictResolutionSchema.optional(),
})

const DangerousGoodsCodesSchema = z.object({
  un_number: UnNumberSchema.optional(),
  packing_group: UNPackingGroupSchema.optional(),
  proper_shipping_name: z.string().min(1).optional(),
  transport_codes: z.array(DangerousTransportCodeSchema).optional(),
})

/** GeoJSON Point/Polygon validator.
 *
 *  Validación simplificada:
 *  - Point: coordinates = [lng, lat] (2 números válidos)
 *  - Polygon: coordinates = [[[lng, lat], ...]] (array de anillos · cada
 *    anillo array de pares · primer y último vértice deben coincidir)
 *
 *  Validaciones estrictas (anillo cerrado, winding order CCW exterior,
 *  no self-intersection) se delegan a Edge Function dpp-validator si surge
 *  volumen. Para v1.1 esta validación básica es suficiente.
 */
const PointCoordinatesSchema = z
  .tuple([LngSchema, LatSchema])
  .describe('Point coordinates [lng, lat]')

const PolygonRingSchema = z
  .array(PointCoordinatesSchema)
  .min(4, 'Anillo poligonal debe tener ≥ 4 vértices (primero = último)')

const PolygonCoordinatesSchema = z
  .array(PolygonRingSchema)
  .min(1, 'Polygon debe tener al menos un anillo exterior')

const EUDROriginGeolocationSchema = z
  .object({
    type: z.enum(['Point', 'Polygon']),
    // coordinates es Point.coordinates | Polygon.coordinates
    coordinates: z.union([PointCoordinatesSchema, PolygonCoordinatesSchema]),
    production_date_on_plot: Iso8601DateSchema.optional(),
    plot_size_ha: z.number().positive('Hectáreas debe ser > 0').optional(),
  })
  .refine(
    (data) => {
      // Coherencia type ↔ coordinates structure
      if (data.type === 'Point') {
        return (
          Array.isArray(data.coordinates) &&
          data.coordinates.length === 2 &&
          typeof data.coordinates[0] === 'number'
        )
      }
      if (data.type === 'Polygon') {
        return (
          Array.isArray(data.coordinates) &&
          data.coordinates.length > 0 &&
          Array.isArray(data.coordinates[0])
        )
      }
      return false
    },
    {
      message:
        'coordinates incoherente con type: Point requiere [lng,lat], Polygon requiere [[[lng,lat],...]]',
      path: ['coordinates'],
    },
  )
  .refine(
    (data) => {
      // EUDR Art. 8.2(c): fecha producción en parcela debe ser > 31-dic-2020
      if (data.production_date_on_plot) {
        return data.production_date_on_plot > '2020-12-31'
      }
      return true
    },
    {
      message:
        'EUDR Art. 8.2(c): fecha producción en parcela debe ser posterior a 2020-12-31',
      path: ['production_date_on_plot'],
    },
  )

const CustodyTransferEvidenceSchema = z.object({
  photo_url: HttpsUrlSchema.optional(),
  document_type: CustodyDocumentTypeSchema.optional(),
  document_url: HttpsUrlSchema.optional(),
  document_hash_sha256: Sha256HexSchema.optional(),
})

const CustodyLinkSchema = z
  .object({
    actor: ActorKYCRefSchema,
    custody_role: CustodyRoleSchema,
    custody_started_at: Iso8601DateTimeSchema,
    custody_ended_at: Iso8601DateTimeSchema.optional(),
    signer_public_key: Ed25519PublicKeySchema,
    signature: Ed25519SignatureSchema,
    gps_lat: LatSchema.optional(),
    gps_lng: LngSchema.optional(),
    transfer_evidence: CustodyTransferEvidenceSchema.optional(),
    previous_link_hash: Sha256HexSchema.optional(),
  })
  .refine(
    (data) => {
      // Coherencia: si custody_ended_at definido, debe ser > custody_started_at
      if (data.custody_ended_at) {
        return data.custody_ended_at > data.custody_started_at
      }
      return true
    },
    {
      message: 'custody_ended_at debe ser posterior a custody_started_at',
      path: ['custody_ended_at'],
    },
  )
  .refine(
    (data) => {
      // Coherencia GPS: si una coord está definida, la otra también
      const hasLat = data.gps_lat !== undefined
      const hasLng = data.gps_lng !== undefined
      return hasLat === hasLng
    },
    {
      message: 'gps_lat y gps_lng deben definirse juntos o ambos NULL',
      path: ['gps_lat'],
    },
  )

const DPPSignatureSchema = z.object({
  signer: ActorKYCRefSchema,
  signer_public_key: Ed25519PublicKeySchema,
  signature: Ed25519SignatureSchema,
  signed_at: Iso8601DateTimeSchema,
  signature_purpose: SignaturePurposeSchema,
})

// ============================================================================
// CAPA A · DPPSustainability v1.1 (ESPR + EU Taxonomy + IMDG + CBAM)
// ============================================================================

export const DPPSustainabilitySchema = z
  .object({
    materials: z
      .array(MaterialComponentSchema)
      .min(1, 'materials debe tener al menos 1 componente'),
    carbon_footprint_kg_co2eq: z.number().nonnegative().optional(),
    carbon_footprint_cbam: CBAMFootprintSchema.optional(),
    water_footprint_l: z.number().nonnegative().optional(),
    recycled_content_pct: PercentageSchema.optional(),
    recyclability_pct: PercentageSchema.optional(),
    sustainability_data: z.record(z.string(), z.unknown()).optional(),
    taxonomy_alignment: TaxonomyAlignmentSchema.optional(),
    un_number: UnNumberSchema.optional(),
    imdg_class: IMDGClassSchema.optional(),
    pg_packing_group: UNPackingGroupSchema.optional(),
    // @deprecated en v1.1 (canonizado en Capa C) · se mantiene para backwards compat
    hs_code: HsCodeSchema.optional(),
  })
  .refine(
    (data) => {
      // IMDG completeness · si imdg_class está definido, un_number + pg_packing_group obligatorios
      if (data.imdg_class !== undefined && data.imdg_class !== null) {
        return data.un_number !== undefined && data.pg_packing_group !== undefined
      }
      return true
    },
    {
      message:
        'IMDG completeness: si imdg_class está definido, un_number y pg_packing_group son obligatorios (Código IMDG SOLAS)',
      path: ['un_number'],
    },
  )
  .refine(
    (data) => {
      // Material percentages: suma debe ser ≤ 100 (puede haber margen no declarado en sustainability_data)
      const totalPct = data.materials.reduce((sum, m) => sum + m.percentage, 0)
      return totalPct <= 100.01 // tolerancia decimal
    },
    {
      message:
        'Suma de percentages de materials no puede exceder 100% (suma actual excede límite)',
      path: ['materials'],
    },
  )

// ============================================================================
// CAPA B · DPPPackaging v1.1 (cubicaje 3D + PPWR)
// ============================================================================

export const DPPPackagingSchema = z
  .object({
    package_length_mm: z.number().positive('package_length_mm debe ser > 0'),
    package_width_mm: z.number().positive('package_width_mm debe ser > 0'),
    package_height_mm: z.number().positive('package_height_mm debe ser > 0'),
    package_weight_kg: z.number().positive('package_weight_kg debe ser > 0'),
    package_type: PackageTypeSchema,
    packaging_layer: PackagingLayerSchema.optional(),
    stackable: z.boolean(),
    max_stack_load_kg: z.number().positive().optional(),
    required_orientation: RequiredOrientationSchema.optional(),
    reefer_temp_min_c: z.number().optional(),
    reefer_temp_max_c: z.number().optional(),
    // @deprecated v1.1 (canonizado en Capa A)
    un_dangerous_class: UNDangerousClassSchema.nullable().optional(),
    // @deprecated v1.1 (canonizado en Capa A)
    dangerous_goods_codes: DangerousGoodsCodesSchema.optional(),
    photo_url: HttpsUrlSchema.optional(),
    // v1.1 · PPWR
    package_recycled_content_pct: PercentageSchema.optional(),
    reusable: z.boolean().optional(),
    reusability_cycles: z.number().int().min(1).optional(),
    epr_registration_by_country: z.record(Iso3166Alpha2Schema, z.string()).optional(),
    packaging_materials: z.array(PackagingMaterialSchema).optional(),
  })
  .refine(
    (data) => {
      // Reefer temp coherence · si ambas definidas, min ≤ max
      if (data.reefer_temp_min_c !== undefined && data.reefer_temp_max_c !== undefined) {
        return data.reefer_temp_min_c <= data.reefer_temp_max_c
      }
      return true
    },
    {
      message: 'reefer_temp_min_c debe ser ≤ reefer_temp_max_c',
      path: ['reefer_temp_min_c'],
    },
  )
  .refine(
    (data) => {
      // PPWR reusability coherence · si reusable=true, reusability_cycles ≥ 1
      if (data.reusable === true) {
        return data.reusability_cycles !== undefined && data.reusability_cycles >= 1
      }
      return true
    },
    {
      message:
        'PPWR Art. 26: si reusable=true, reusability_cycles debe ser ≥ 1 (envases reutilizables HORECA + transporte)',
      path: ['reusability_cycles'],
    },
  )
  .refine(
    (data) => {
      // PPWR packaging_materials: suma percentages ≤ 100
      if (data.packaging_materials && data.packaging_materials.length > 0) {
        const totalPct = data.packaging_materials.reduce(
          (sum, m) => sum + m.percentage,
          0,
        )
        return totalPct <= 100.01
      }
      return true
    },
    {
      message:
        'Suma de percentages de packaging_materials no puede exceder 100% (suma actual excede límite)',
      path: ['packaging_materials'],
    },
  )
  .refine(
    (data) => {
      // Stack load coherence · si NO stackable y max_stack_load_kg definido = incoherente
      if (data.stackable === false && data.max_stack_load_kg !== undefined) {
        return false
      }
      return true
    },
    {
      message:
        'Incoherencia: max_stack_load_kg definido pero stackable=false (no se puede apilar carga sobre algo no apilable)',
      path: ['max_stack_load_kg'],
    },
  )

// ============================================================================
// CAPA C · DPPERPLink v1.1 (sync ERP + UCC + CRA + ViDA)
// ============================================================================

export const DPPERPLinkSchema = z
  .object({
    erp_provider: ERPProviderSchema.optional(),
    erp_external_id: z.string().min(1).optional(),
    erp_last_synced_at: Iso8601DateTimeSchema.optional(),
    erp_last_sync_status: ERPSyncStatusSchema.optional(),
    erp_sync_details: ERPSyncDetailsSchema.optional(),
    // v1.1 · UCC
    hs_code: HsCodeSchema.optional(),
    country_of_origin: Iso3166Alpha2Schema.optional(),
    eori_seller: EoriSchema.optional(),
    eori_importer: EoriSchema.optional(),
    // v1.1 · CRA
    has_digital_elements: z.boolean().optional(),
    ce_marking_cra: z.boolean().optional(),
    sbom_url: HttpsUrlSchema.optional(),
    vulnerability_disclosure_url: HttpsUrlSchema.optional(),
    security_support_until: Iso8601DateSchema.optional(),
    cra_class: CRAClassSchema.optional(),
    // v1.1 · ViDA
    vat_number_seller: VatNumberSchema.optional(),
    vat_number_buyer: VatNumberSchema.optional(),
    intracommunity_supply: z.boolean().optional(),
    reverse_charge_applies: z.boolean().optional(),
    einvoice_reference: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      // CRA completeness · si has_digital_elements=true, 4 campos CRA obligatorios
      if (data.has_digital_elements === true) {
        return (
          data.ce_marking_cra !== undefined &&
          data.sbom_url !== undefined &&
          data.vulnerability_disclosure_url !== undefined &&
          data.security_support_until !== undefined
        )
      }
      return true
    },
    {
      message:
        'CRA Art. 13: si has_digital_elements=true, los 4 campos CRA son obligatorios (ce_marking_cra + sbom_url + vulnerability_disclosure_url + security_support_until)',
      path: ['sbom_url'],
    },
  )
  .refine(
    (data) => {
      // ERP sync coherence · si erp_provider, erp_external_id obligatorio
      if (data.erp_provider !== undefined) {
        return data.erp_external_id !== undefined
      }
      return true
    },
    {
      message:
        'Si erp_provider está definido, erp_external_id es obligatorio (key sync bidireccional)',
      path: ['erp_external_id'],
    },
  )

// ============================================================================
// CAPA D · DPPLifecycle
// ============================================================================

export const DPPLifecycleSchema = z.object({
  lifecycle_state: DPPLifecycleStateSchema,
  state_changed_at: Iso8601DateTimeSchema,
  state_changed_by: ActorKYCRefSchema,
})

// ============================================================================
// CAPA E · DPPCustody v1.1 (custody chain + Incoterms + convenios marítimos)
// ============================================================================

export const DPPCustodySchema = z
  .object({
    dpp_public_key: Ed25519PublicKeySchema.optional(),
    custody_chain: z.array(CustodyLinkSchema),
    signatures: z.array(DPPSignatureSchema),
    // v1.1 · Incoterms
    incoterm: IncotermSchema.optional(),
    delivery_location: UnLocodeSchema.optional(),
    // v1.1 · convenios marítimos
    bl_reference: z.string().min(1).optional(),
    carrier_id: z.string().min(1).optional(),
    maritime_convention: MaritimeConventionSchema.optional(),
  })
  .refine(
    (data) => {
      // Custody chain ordering · timestamps ordenados cronológicamente
      for (let i = 1; i < data.custody_chain.length; i++) {
        const prev = data.custody_chain[i - 1]
        const curr = data.custody_chain[i]
        if (curr.custody_started_at < prev.custody_started_at) {
          return false
        }
      }
      return true
    },
    {
      message:
        'custody_chain debe estar ordenado cronológicamente por custody_started_at',
      path: ['custody_chain'],
    },
  )
  .refine(
    (data) => {
      // Primer eslabón debe ser manufacturer (G10 ADR 0007 §2.2)
      if (data.custody_chain.length > 0) {
        return data.custody_chain[0].custody_role === 'manufacturer'
      }
      return true
    },
    {
      message:
        'G10 ADR 0007 §2.2: primer eslabón de custody_chain debe tener custody_role=manufacturer',
      path: ['custody_chain', 0, 'custody_role'],
    },
  )

// ============================================================================
// CAPA F · DPPOrigin v1.1 (origen + trazabilidad + EUDR)
// ============================================================================

export const DPPOriginSchema = z
  .object({
    manufacturing_country: Iso3166Alpha2Schema,
    manufacturing_facility_id: z.string().min(1).optional(),
    production_date: Iso8601DateSchema,
    manufacturer_batch_number: z.string().min(1).optional(),
    manufacturer_actor: ActorKYCRefSchema.optional(),
    // v1.1 · EUDR
    in_eudr_scope: z.boolean().optional(),
    dds_reference: z.string().min(1).optional(),
    origin_geolocation: EUDROriginGeolocationSchema.optional(),
    eudr_compliance_attested: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // EUDR completeness · si in_eudr_scope=true, dds_reference + origin_geolocation obligatorios
      if (data.in_eudr_scope === true) {
        return (
          data.dds_reference !== undefined && data.origin_geolocation !== undefined
        )
      }
      return true
    },
    {
      message:
        'EUDR Art. 9.1.d: si in_eudr_scope=true, dds_reference y origin_geolocation son obligatorios',
      path: ['dds_reference'],
    },
  )
  .refine(
    (data) => {
      // EUDR compliance attested coherence · solo se puede atestar si está en scope
      if (data.eudr_compliance_attested === true) {
        return data.in_eudr_scope === true
      }
      return true
    },
    {
      message:
        'Incoherencia: eudr_compliance_attested=true requiere in_eudr_scope=true',
      path: ['eudr_compliance_attested'],
    },
  )

// ============================================================================
// SCHEMA COMPUESTO · DPPLayersSchema (intersección de las 6 capas)
// ============================================================================

/** Schema Zod de las 6 capas DPP v1.1 (composición).
 *
 *  Nota técnica: usamos `intersection` de Zod para componer. Esto preserva
 *  cada refine cross-field de cada capa. Las validaciones cross-LAYER (e.g.
 *  CBAM coherence vs HS code) se delegan a Edge Function `dpp-validator`
 *  porque requieren lookup externo (TARIC API · etc.).
 *
 *  Para validar SOLO los campos DPP (sin UniversalProduct), usar este schema.
 *  Para validar el documento completo (UniversalProduct + DPP), componer
 *  con UniversalProductSchema cuando se cree.
 */
export const DPPLayersSchema = z.intersection(
  z.intersection(
    z.intersection(
      z.intersection(
        z.intersection(DPPSustainabilitySchema, DPPPackagingSchema),
        DPPERPLinkSchema,
      ),
      DPPLifecycleSchema,
    ),
    DPPCustodySchema,
  ),
  DPPOriginSchema,
)

// ============================================================================
// HELPERS · parsing seguro + errores tipados
// ============================================================================

/** Resultado tipado de validación. */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] }

/** Error de validación normalizado. */
export type ValidationError = {
  /** Path al campo que falló (ej. `["origin_geolocation", "coordinates"]`). */
  path: (string | number)[]
  /** Mensaje legible (en español). */
  message: string
  /** Código Zod interno (ej. `invalid_type`, `too_small`, `custom`). */
  code: string
}

/** Convertir ZodError a array de ValidationError normalizado. */
function normalizeZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.map((p) => (typeof p === 'symbol' ? String(p) : p)) as (
      | string
      | number
    )[],
    message: issue.message,
    code: issue.code,
  }))
}

/** Validar DPPSustainability (Capa A) · errores tipados. */
export function validateDPPSustainability(
  data: unknown,
): ValidationResult<z.infer<typeof DPPSustainabilitySchema>> {
  const result = DPPSustainabilitySchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar DPPPackaging (Capa B) · errores tipados. */
export function validateDPPPackaging(
  data: unknown,
): ValidationResult<z.infer<typeof DPPPackagingSchema>> {
  const result = DPPPackagingSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar DPPERPLink (Capa C) · errores tipados. */
export function validateDPPERPLink(
  data: unknown,
): ValidationResult<z.infer<typeof DPPERPLinkSchema>> {
  const result = DPPERPLinkSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar DPPLifecycle (Capa D) · errores tipados. */
export function validateDPPLifecycle(
  data: unknown,
): ValidationResult<z.infer<typeof DPPLifecycleSchema>> {
  const result = DPPLifecycleSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar DPPCustody (Capa E) · errores tipados. */
export function validateDPPCustody(
  data: unknown,
): ValidationResult<z.infer<typeof DPPCustodySchema>> {
  const result = DPPCustodySchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar DPPOrigin (Capa F) · errores tipados. */
export function validateDPPOrigin(
  data: unknown,
): ValidationResult<z.infer<typeof DPPOriginSchema>> {
  const result = DPPOriginSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

/** Validar 6 capas DPP completas (A-F) · errores tipados.
 *
 *  Validación API · server-side · obligatoria antes de tocar BD.
 *  Para validar documento incluyendo UniversalProduct, componer cuando exista
 *  UniversalProductSchema.
 */
export function validateDPPLayers(
  data: unknown,
): ValidationResult<z.infer<typeof DPPLayersSchema>> {
  const result = DPPLayersSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: normalizeZodError(result.error) }
}

// ============================================================================
// EXPORTS · uso externo
// ============================================================================

export {
  // Primitivos (re-export para tests + composición)
  Iso8601DateSchema,
  Iso8601DateTimeSchema,
  Sha256HexSchema,
  Ed25519PublicKeySchema,
  Ed25519SignatureSchema,
  UnLocodeSchema,
  HsCodeSchema,
  UnNumberSchema,
  Iso3166Alpha2Schema,
  LatSchema,
  LngSchema,
  PercentageSchema,
  EoriSchema,
  VatNumberSchema,
  HttpsUrlSchema,
  // Enums (re-export para tests + UI dropdowns)
  IMDGClassSchema,
  UNPackingGroupSchema,
  PackageTypeSchema,
  PackagingLayerSchema,
  CRAClassSchema,
  DPPLifecycleStateSchema,
  CustodyRoleSchema,
  CustodyDocumentTypeSchema,
  SignaturePurposeSchema,
  IncotermSchema,
  MaritimeConventionSchema,
  // Sub-objetos
  MaterialComponentSchema,
  TaxonomyObjectiveSchema,
  TaxonomyAlignmentSchema,
  CBAMFootprintSchema,
  PackagingMaterialSchema,
  EUDROriginGeolocationSchema,
  CustodyLinkSchema,
  DPPSignatureSchema,
  ActorKYCRefSchema,
}
