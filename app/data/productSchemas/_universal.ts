// Universal product schema · base compartida por todas las fichas sectoriales.
//
// CADA schema sectorial (transporte.ts · inmobiliario.ts · agroalimentario.ts ·
// legal.ts · ...) compone su tipo extendiendo `UniversalProduct` con sus
// campos específicos del sector.
//
// Este archivo NO conoce ningún sector concreto. Define únicamente las
// primitivas protocol-level que aparecen en todas las fichas:
//   · identidad (sku · ean13 · gtin · schema_version + status)
//   · localización (title · description × 8 idiomas · countries)
//   · comercial (price · stock · payment_modality)
//   · visual (images)
//   · oferente (ActorKYCRef)
//   · cumplimiento (certificates · required_certs_for_buyer)
//   · audit (created/updated_at + on_chain_hash)
//
// Estado de validación: schema_status: 'draft' | 'validated'.
// Mientras esté en draft, la UI muestra badge "BORRADOR · pendiente
// validación experta" — mismo patrón que docsStatus de legalEntities.ts.

import type { LocalizedLabel } from '@/app/data/actorGroups'
import type { FiscalInvoicingData } from './_fiscal'

// ============================================================================
// PRIMITIVAS UNIVERSALES
// ============================================================================

/** ISO 3166-1 alpha-2 country code (e.g. 'ES', 'FR', 'DE', 'JP', 'CN'). */
export type ISOCountryCode = string

/** Currencies supported in 1503 fichas.
 *
 * - Fiat ISO 4217: EUR · USD · GBP · CHF · JPY · BRL · MXN · ARS · CNY.
 * - Stablecoins de transporte (paridad 1:1 fiat): RLUSD · EURC · USDC.
 *   RLUSD es el activo de LIQUIDACIÓN (rail verify-on-ledger XRPL · no-custodial),
 *   no se custodia: la factura se denomina en fiat y la liquidación se verifica.
 *
 * No es una moneda seleccionable. Si algún día se integra sería post-deploy.
 */
export type ISOCurrency =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'JPY'
  | 'BRL'
  | 'MXN'
  | 'ARS'
  | 'CNY'
  | 'RLUSD'
  | 'EURC'
  | 'USDC'

/** Estado de validación del schema sectorial.
 *
 *  4 estados alineados con `TaxonomyStatus` (ADR 0011 Audit-Ready by Design):
 *
 *  - 'draft': borrador inicial · no apto producción.
 *  - 'subject_to_expert': construido siguiendo mejores prácticas conocidas ·
 *    pendiente validación por experto sectorial / colegio profesional /
 *    organismo notificado. Apto pre-deploy R0 con badge visible "subject to
 *    expert review" + lista de validadores objetivo.
 *  - 'validated': revisado por experto autorizado · apto producción.
 *  - 'deprecated': sustituido por otra versión · solo lectura.
 *
 *  Los 7 sectores anteriores (transporte · inmobiliario · agroalimentario ·
 *  legal · automoción · salud · energía) usan 'draft' por inercia v1.0;
 *  desde Fase 7 (metalúrgico en adelante) el default es 'subject_to_expert'
 *  para evitar el limbo de "draft eterno". */
export type ProductSchemaStatus = 'draft' | 'subject_to_expert' | 'validated' | 'deprecated'

/** Modalidades de pago de las 4 ratificadas 12-may.
 *
 * - 01_directo: producto B2B/B2C estándar directo (sin escrow programable
 *   complejo · liberación instantánea contra entrega básica).
 * - 02_b2b_nacional: operación nacional con escrow + liberación condicionada
 *   a evento (factura aceptada · albarán firmado).
 * - 03_servicios: servicios profesionales con hitos de pago (50% anticipo +
 *   50% entrega · o esquemas de 3-4 hitos).
 * - 04_importacion: comercio internacional con escrow multifirma 2-de-3 +
 *   precinto digital XDC + e-B/L + UCP 600 codificado.
 */
export type PaymentModality =
  | '01_directo'
  | '02_b2b_nacional'
  | '03_servicios'
  | '04_importacion'

// ============================================================================
// REFERENCIA AL OFERENTE (Actor) · KYC-anchored
// ============================================================================

/** Referencia ligera al Actor que publica la ficha · usa el KYC ya verificado
 *  por 1503. NO duplica datos personales (PII off-chain) · solo
 *  identifica y aporta sector/rol ISIC para taxonomía cross-border. */
export type ActorKYCRef = {
  /** UUID opaco de la fila en `public.actors`. */
  actor_id: string
  /** Estado KYC en el momento de publicación de la ficha. */
  kyc_status: 'approved' | 'pending_kyc' | 'rejected'
  /** ID del sector ISIC del Actor (e.g. 'transporte', 'inmobiliario'). */
  sector_id: string
  /** ID del rol/oficio dentro del sector (e.g. 'transitario_maritimo'). */
  role_id: string
  /** Código ISIC de la actividad (4 dígitos · ancla cross-border). */
  isic?: string
  /** Código CNAE-2025 si el Actor es español (vista nacional). */
  cnae?: string
  /** Tipo de entidad legal: individual o company. */
  legal_entity_kind: 'individual' | 'company'
}

// ============================================================================
// COMERCIAL · price · stock · images
// ============================================================================

/** Tier de descuento por volumen (bulk pricing). */
export type BulkDiscountTier = {
  /** Cantidad mínima (en unidad de `ProductPrice.unit`) para activar el tier. */
  min_quantity: number
  /** Descuento aplicado en porcentaje (0-100). */
  discount_percent: number
}

/** Precio de la ficha · soporta IVA + tiers de volumen + multi-currency. */
export type ProductPrice = {
  /** Valor numérico en la divisa indicada. */
  value: number
  /** Divisa ISO 4217 o stablecoin/token aceptado por 1503. */
  currency: ISOCurrency
  /** Unidad de cuenta del precio (e.g. 'kg' · 'L' · 'unidad' · 'caja' · 'm²' ·
   *  'hora' · 'TEU' · 'contenedor' · 'envío' · 'ruta'). Cada sector documenta
   *  sus unidades canónicas. */
  unit?: string
  /** ¿IVA incluido en `value`? */
  vat_included: boolean
  /** Tipo de IVA aplicado en porcentaje (e.g. 21 para España general · 10
   *  reducido · 4 superreducido). */
  vat_rate_percent?: number
  /** Tiers de descuento por volumen (opcionales). */
  bulk_discount_tiers?: BulkDiscountTier[]
}

/** Stock o disponibilidad declarada de la ficha. */
export type ProductStock = {
  /** Cantidad disponible (en `unit`). */
  available: number
  /** Unidad de cuenta del stock (debe coincidir con `ProductPrice.unit` cuando
   *  no aplique conversión). */
  unit: string
  /** Cantidad ya reservada por otros compradores (no disponible). */
  reserved?: number
  /** Plazo entre el pedido y la disponibilidad efectiva (días naturales). */
  lead_time_days?: number
  /** País de origen del envío (ISO 3166-1 alpha-2). */
  ships_from?: ISOCountryCode
}

/** Imagen de la ficha · URL firmada Supabase Storage + alt × 8 idiomas. */
export type ProductImage = {
  /** Supabase Storage signed URL · TTL controlado por el endpoint que la
   *  genera (no se persiste con TTL). */
  url: string
  /** Texto alternativo accesible × 8 idiomas. */
  alt: LocalizedLabel
  /** Orden de visualización (0 = primero). */
  order: number
  /** ¿Es la imagen principal? Solo una imagen por ficha debería tener
   *  `is_primary: true` (no se valida estructuralmente · validación a nivel
   *  de UI/API). */
  is_primary?: boolean
}

// ============================================================================
// CUMPLIMIENTO · certificados · sanitario · trade requirements
// ============================================================================

/** Referencia a un certificado emitido por una entidad oficial sobre la
 *  ficha (e.g. certificado energético · certificado de origen · ISO 9001 ·
 *  AEO Operador Económico Autorizado · etc.).
 *
 *  El `certification_id` apunta al registry en `_certifications.ts`. */
export type CertificateRef = {
  /** ID del certificado en el registry global. */
  certification_id: string
  /** Número de serie del certificado emitido por la entidad. */
  number?: string
  /** Fecha de emisión. */
  issued_at: string  // ISO 8601 date string · usar string en serialización JSON
  /** Fecha de expiración (si aplica). */
  expires_at?: string
  /** Entidad emisora (organismo · colegio · auditor). */
  issuer: string
  /** Supabase Storage signed URL del PDF del certificado. */
  pdf_url?: string
  /** ¿1503 ha verificado contra el registro oficial? */
  verified_by_1503: boolean
  /** Fecha de verificación interna 1503. */
  verification_date?: string
}

// ============================================================================
// AUDIT TRAIL · who created/updated · on-chain anchor
// ============================================================================

export type AuditTrail = {
  /** Fecha de creación de la ficha. */
  created_at: string
  /** Actor que creó la ficha. */
  created_by: ActorKYCRef
  /** Fecha de última modificación. */
  updated_at: string
  /** Actor que hizo la última modificación. */
  last_updated_by: ActorKYCRef
  /** Hash SHA-256 anclado en XDC Network si la ficha tiene anchoring on-chain
   *  (Fase 8+ · acta inmutable · precinto digital). */
  on_chain_hash?: string
  /** TX hash de XDC donde se ancló el hash. */
  on_chain_tx_hash?: string
}

// ============================================================================
// SCHEMA UNIVERSAL · base que TODOS los schemas sectoriales extienden
// ============================================================================

/**
 * Schema universal protocol-level. Cada schema sectorial extiende este tipo
 * añadiendo sus campos específicos.
 *
 * Ejemplo: `TransporteProduct = UniversalProduct & TransporteSpecificFields`.
 */
export type UniversalProduct = {
  // -------------------------- IDENTIDAD --------------------------
  /** SKU interno del Actor (libre · debe ser único dentro de su catálogo). */
  sku: string
  /** EAN-13 si aplica (productos físicos con código de barras estándar). */
  ean13?: string
  /** Global Trade Item Number (más amplio que EAN-13). */
  gtin?: string
  /** Versión del schema sectorial usado (e.g. 'transporte@1.0' ·
   *  'inmobiliario@1.2'). Permite migrar fichas cuando el schema evoluciona. */
  schema_version: string
  /** Estado de validación del schema sectorial · si es 'draft', la UI muestra
   *  badge "BORRADOR · pendiente validación experta sectorial". */
  schema_status: ProductSchemaStatus

  // -------------------------- LOCALIZACIÓN -----------------------
  /** Título visible × 8 idiomas. */
  title: LocalizedLabel
  /** Descripción larga × 8 idiomas. */
  description: LocalizedLabel
  /** Lista positiva de países donde la ficha es ofrecible. Si vacía, asumir
   *  "todos los países OFAC-friendly según geofence vigente". */
  available_countries: ISOCountryCode[]
  /** Lista negativa de países excluidos (e.g. por restricciones contractuales
   *  del Actor · no por sanciones, las sanciones se gestionan en geofence
   *  global). */
  excluded_countries?: ISOCountryCode[]

  // -------------------------- COMERCIAL --------------------------
  /** Precio principal de la ficha. */
  price: ProductPrice
  /** Stock o disponibilidad. */
  stock: ProductStock
  /** Modalidad de pago aplicable (de las 4 ratificadas). */
  payment_modality: PaymentModality

  // -------------------------- VISUAL -----------------------------
  /** Galería de imágenes (al menos 1 obligatoria para publicación). */
  images: ProductImage[]

  // -------------------------- OFERENTE ---------------------------
  /** Actor que publica la ficha · su KYC ya verificado. */
  actor: ActorKYCRef

  // -------------------------- CUMPLIMIENTO -----------------------
  /** Certificados aplicables a la ficha (energético · origen · ISO · AEO). */
  certificates: CertificateRef[]
  /** Certificados que el comprador debe presentar para que se acepte la
   *  operación (e.g. licencia AEMPS para productos sanitarios · licencia
   *  importador para algunos productos químicos). Lista de
   *  `certification_id` del registry. */
  required_certs_for_buyer?: string[]

  // -------------------------- FISCAL -----------------------------
  /** Bloque fiscal transversal opcional (IVA · facturación · comercio
   *  intracom/global). Modelado en `_fiscal.ts`. Aplica a producto físico Y
   *  a servicios (ambos pueden ser operaciones intracom B2B con inversión del
   *  sujeto pasivo, facturación electrónica ViDA, etc.). El enforcement vive en
   *  `validateFiscalCompliance` y se invoca desde el dispatcher de cumplimiento. */
  fiscal?: FiscalInvoicingData

  // -------------------------- AUDIT ------------------------------
  /** Audit trail completa. */
  audit: AuditTrail
}

// ============================================================================
// HELPERS · utilidades comunes para todos los schemas
// ============================================================================

/** Hace un type-guard sobre `LocalizedLabel`. Útil para validación en runtime
 *  (e.g. al parsear ficha recibida desde la API). */
export function isLocalizedLabel(value: unknown): value is LocalizedLabel {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.es === 'string' &&
    typeof obj.en === 'string' &&
    typeof obj.fr === 'string' &&
    typeof obj.de === 'string' &&
    typeof obj.it === 'string' &&
    typeof obj.pt === 'string' &&
    typeof obj.zh === 'string' &&
    typeof obj.ja === 'string'
  )
}

/** Versión del schema universal. Bumpear cuando se añadan campos breaking. */
export const UNIVERSAL_SCHEMA_VERSION = '1.0' as const
