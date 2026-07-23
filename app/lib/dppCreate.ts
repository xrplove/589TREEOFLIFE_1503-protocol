// Alta de Pasaporte Digital de Producto · lógica pura (keystone · ADR 0023)
// ---------------------------------------------------------------------------
// Construye el registro de `dpp_registry` a partir de un producto del Actor y
// de los datos estáticos del DPP. Es el "tren" que faltaba sobre los raíles de
// las rodajas 1-3: acuña el portador de datos (GS1 Digital Link / UID interino)
// y calcula el HASH CANÓNICO SHA-256 (JCS RFC 8785) para integridad.
//
// La FIRMA Ed25519 y el anclaje on-chain quedan DIFERIDOS (necesitan decisión
// de gestión de claves); el hash ya da integridad verificable ex-post.
//
// PII OFF-CHAIN: el payload que se hashea NO incluye owner ni planta ni datos
// personales — solo la huella estática del producto (composición, huella
// ambiental, origen país, identificadores). Coherente con la regla del proyecto.
//
// Módulo PURO (sin Supabase, sin Next, sin reloj) → testeable con node:test.

import { mintDppDataCarrier } from './dppDataCarrier'
import { canonicalHash } from './dppHash'
import type { JsonValue } from './jcsCanonical'

const ISO2_RE = /^[A-Z]{2}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const HS_RE = /^[0-9]{6,10}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DppCreateInput = {
  product_id: string
  manufacturing_country: string // ISO 3166-1 alpha-2
  production_date: string // YYYY-MM-DD
  materials?: unknown
  carbon_footprint_kg_co2eq?: number | null
  water_footprint_l?: number | null
  recycled_content_pct?: number | null
  recyclability_pct?: number | null
  hs_code?: string | null
  serial_number?: string | null
  manufacturer_batch_number?: string | null
}

/** Datos del producto enlazado (los aporta la query del route). */
export type DppProductRef = { sector_id: string; gtin: string | null }

export type DppRecord = {
  id: string
  owner_user_id: string
  product_id: string
  sector_id: string
  manufacturing_country: string
  production_date: string
  materials: unknown
  carbon_footprint_kg_co2eq: number | null
  water_footprint_l: number | null
  recycled_content_pct: number | null
  recyclability_pct: number | null
  hs_code: string | null
  serial_number: string | null
  manufacturer_batch_number: string | null
  data_carrier_uri: string
  hash_canonical_sha256: string
  schema_version: string
}

export type BuildDppResult =
  | { ok: true; record: DppRecord; dataCarrierUri: string; hash: string; canonicalPayload: string }
  | { ok: false; error: string }

function isFinitePctOrNull(v: unknown): boolean {
  if (v === undefined || v === null) return true
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100
}
function isFiniteNumOrNull(v: unknown): boolean {
  if (v === undefined || v === null) return true
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}
function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export const DPP_SCHEMA_VERSION = 'dpp@1.0'

/**
 * Valida y construye el registro DPP + portador + hash. No persiste (eso lo hace
 * el route con service_role). `ownerUserId` y `dppUid` los aporta el route
 * (auth + uuid generado). `resolver` por defecto el de la plataforma.
 */
export function buildDppRecord(args: {
  input: DppCreateInput
  product: DppProductRef
  ownerUserId: string
  dppUid: string
  resolver?: string
}): BuildDppResult {
  const { input, product, ownerUserId, dppUid, resolver } = args

  if (!UUID_RE.test(dppUid)) return { ok: false, error: 'dppUid inválido (uuid)' }
  if (!input.product_id || typeof input.product_id !== 'string') return { ok: false, error: 'product_id requerido' }
  if (!ISO2_RE.test(input.manufacturing_country)) return { ok: false, error: 'manufacturing_country debe ser ISO 3166-1 alpha-2' }
  if (!isValidDate(input.production_date)) return { ok: false, error: 'production_date debe ser YYYY-MM-DD válida' }
  if (input.hs_code != null && !HS_RE.test(input.hs_code)) return { ok: false, error: 'hs_code debe tener 6-10 dígitos' }
  if (!isFinitePctOrNull(input.recycled_content_pct)) return { ok: false, error: 'recycled_content_pct fuera de rango (0-100)' }
  if (!isFinitePctOrNull(input.recyclability_pct)) return { ok: false, error: 'recyclability_pct fuera de rango (0-100)' }
  if (!isFiniteNumOrNull(input.carbon_footprint_kg_co2eq)) return { ok: false, error: 'carbon_footprint_kg_co2eq inválido' }
  if (!isFiniteNumOrNull(input.water_footprint_l)) return { ok: false, error: 'water_footprint_l inválido' }
  if (input.materials !== undefined && input.materials !== null && !Array.isArray(input.materials)) {
    return { ok: false, error: 'materials debe ser un array' }
  }

  const materials = (input.materials as unknown) ?? []
  const serial = input.serial_number ?? null

  let dataCarrierUri: string
  try {
    dataCarrierUri = mintDppDataCarrier({ dppUid, gtin: product.gtin, serial, resolver })
  } catch (e) {
    return { ok: false, error: `no se pudo acuñar el portador: ${(e as Error).message}` }
  }

  // Payload canónico estático (SIN PII). Es la huella que da integridad y que
  // —en su día— se ancla on-chain. Orden de claves irrelevante (JCS lo ordena).
  const staticPayload: JsonValue = {
    schema_version: DPP_SCHEMA_VERSION,
    sector_id: product.sector_id,
    gtin: product.gtin ?? null,
    serial_number: serial,
    hs_code: input.hs_code ?? null,
    materials: materials as JsonValue,
    carbon_footprint_kg_co2eq: input.carbon_footprint_kg_co2eq ?? null,
    water_footprint_l: input.water_footprint_l ?? null,
    recycled_content_pct: input.recycled_content_pct ?? null,
    recyclability_pct: input.recyclability_pct ?? null,
    manufacturing_country: input.manufacturing_country,
    production_date: input.production_date,
    manufacturer_batch_number: input.manufacturer_batch_number ?? null,
    data_carrier_uri: dataCarrierUri,
  }
  const { hash, canonicalPayload } = canonicalHash(staticPayload)

  const record: DppRecord = {
    id: dppUid,
    owner_user_id: ownerUserId,
    product_id: input.product_id,
    sector_id: product.sector_id,
    manufacturing_country: input.manufacturing_country,
    production_date: input.production_date,
    materials,
    carbon_footprint_kg_co2eq: input.carbon_footprint_kg_co2eq ?? null,
    water_footprint_l: input.water_footprint_l ?? null,
    recycled_content_pct: input.recycled_content_pct ?? null,
    recyclability_pct: input.recyclability_pct ?? null,
    hs_code: input.hs_code ?? null,
    serial_number: serial,
    manufacturer_batch_number: input.manufacturer_batch_number ?? null,
    data_carrier_uri: dataCarrierUri,
    hash_canonical_sha256: hash,
    schema_version: DPP_SCHEMA_VERSION,
  }

  return { ok: true, record, dataCarrierUri, hash, canonicalPayload }
}
