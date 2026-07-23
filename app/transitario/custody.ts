// Capa de datos del escritorio TRANSITARIO (freight forwarder).
//
// Lee de BD REAL (no maqueta). El transitario es un actor que figura en la
// cadena de custodia (dpp_custody_chain) con custody_role='freight_forwarder'.
//
// SEGURIDAD · scoping por el propio transitario
// ---------------------------------------------
// La RLS de dpp_registry solo deja ver al owner/fabricante, así que NO podemos
// leer los envíos del transitario con el cliente de sesión. Usamos el cliente
// service_role (sbAdmin) y acotamos NOSOTROS la consulta a los DPP donde el
// caller tiene un eslabón de custodia propio. Nunca se devuelve un envío en el
// que el caller no sea custodio. (Mismo patrón que /actor/[id] con sbAdmin.)

import type { SupabaseClient } from '@supabase/supabase-js'

export const TRANSITARIO_ROLE_IDS = [
  'transitarios-mar',
  'transitarios-aire',
  'logistica-terrestre',
] as const

export const CUSTODY_ROLE_LABEL: Record<string, string> = {
  manufacturer: 'Fabricante',
  owner: 'Propietario',
  freight_forwarder: 'Transitario',
  carrier: 'Transportista',
  customs: 'Aduana',
  consignee: 'Consignatario',
}

export const LIFECYCLE_LABEL: Record<string, string> = {
  created_pending_completion: 'Pendiente de completar',
  created: 'Creado',
  loaded: 'Cargado',
  in_transit: 'En tránsito',
  arrived: 'Llegado a destino',
  delivered: 'Entregado',
  in_use: 'En uso',
  decommissioned: 'Retirado',
  recycled: 'Reciclado',
  repaired: 'Reparado',
  resold: 'Revendido',
}

// Orden lógico del ciclo de vida logístico (para pintar el progreso).
export const LIFECYCLE_ORDER = [
  'created_pending_completion',
  'created',
  'loaded',
  'in_transit',
  'arrived',
  'delivered',
] as const

export type LocalizedLabel = Record<string, string>

export interface TransferEvidence {
  photo_url?: string
  document_type?: string
  document_url?: string
  document_hash_sha256?: string
}

export interface CustodyLink {
  id: string
  dppId: string
  actorUserId: string
  custodyRole: string
  custodyStartedAt: string
  custodyEndedAt: string | null
  gpsLat: number | null
  gpsLng: number | null
  evidence: TransferEvidence | null
}

export interface CustodyShipment {
  /** id del eslabón de custodia del transitario sobre este envío. */
  linkId: string
  dppId: string
  custodyStartedAt: string
  custodyEndedAt: string | null
  gpsLat: number | null
  gpsLng: number | null
  evidence: TransferEvidence | null
  // Datos del envío (dpp_registry + products).
  productName: string
  sku: string | null
  hsCode: string | null
  originCountry: string | null // país de origen aduanero (2 letras)
  lifecycleState: string | null
  incoterm: string | null
  deliveryLocation: string | null // UN/LOCODE destino
  blReference: string | null
  carrierId: string | null
  // Carga (bulto) — viene de dpp_registry, ya en la misma consulta (REGISTRY_COLUMNS).
  // Aflorado aquí para el módulo de cubicaje sin lanzar consulta extra. Puede ir
  // null (envío sin medir aún): el motor de cubicaje lo trata honestamente.
  packageType: string | null
  packageLengthMm: number | null
  packageWidthMm: number | null
  packageHeightMm: number | null
  packageWeightKg: number | null
  stackable: boolean | null
  reeferTempMinC: number | null
  reeferTempMaxC: number | null
  imdgClass: string | null
}

export interface ShipmentDetail extends CustodyShipment {
  maritimeConvention: string | null
  photoUrl: string | null
  /** Cadena de custodia completa del envío (todos los eslabones, en orden). */
  chain: CustodyLink[]
  transitions: StateTransition[]
}

export interface StateTransition {
  dppId: string
  fromState: string | null
  toState: string
  transitionedAt: string
  reason: string | null
}

// ── Tipos crudos de fila (lo que devuelve Supabase) ──
type CustodyRow = {
  id: string
  dpp_id: string
  actor_user_id: string
  custody_role: string
  custody_started_at: string
  custody_ended_at: string | null
  gps_lat: number | null
  gps_lng: number | null
  transfer_evidence: TransferEvidence | null
}

type RegistryRow = {
  id: string
  product_id: string | null
  lifecycle_state: string | null
  incoterm: string | null
  delivery_location: string | null
  bl_reference: string | null
  carrier_id: string | null
  maritime_convention: string | null
  package_type: string | null
  package_length_mm: number | null
  package_width_mm: number | null
  package_height_mm: number | null
  package_weight_kg: number | null
  stackable: boolean | null
  reefer_temp_min_c: number | null
  reefer_temp_max_c: number | null
  imdg_class: string | null
  photo_url: string | null
}

type ProductRow = {
  id: string
  title: LocalizedLabel | null
  sku: string | null
  hs_code: string | null
  country_of_origin: string | null
}

type TransitionRow = {
  dpp_id: string
  from_state: string | null
  to_state: string
  transitioned_at: string
  reason: string | null
}

const REGISTRY_COLUMNS =
  'id, product_id, lifecycle_state, incoterm, delivery_location, bl_reference, carrier_id, maritime_convention, package_type, package_length_mm, package_width_mm, package_height_mm, package_weight_kg, stackable, reefer_temp_min_c, reefer_temp_max_c, imdg_class, photo_url'

/** Saca el texto localizado de un title jsonb multilingüe (es → en → cualquiera). */
export function localized(label: LocalizedLabel | null, lang = 'es'): string {
  if (!label || typeof label !== 'object') return '—'
  return label[lang] ?? label.es ?? label.en ?? Object.values(label)[0] ?? '—'
}

function toLink(r: CustodyRow): CustodyLink {
  return {
    id: r.id,
    dppId: r.dpp_id,
    actorUserId: r.actor_user_id,
    custodyRole: r.custody_role,
    custodyStartedAt: r.custody_started_at,
    custodyEndedAt: r.custody_ended_at,
    gpsLat: r.gps_lat,
    gpsLng: r.gps_lng,
    evidence: r.transfer_evidence,
  }
}

/**
 * Lista los envíos en custodia del transitario (eslabones propios con
 * custody_role='freight_forwarder'), enriquecidos con el envío y el producto.
 * Devuelve [] si no tiene ninguno (estado honesto, no inventa datos).
 */
export async function fetchCustodyShipments(
  sbAdmin: SupabaseClient,
  userId: string,
): Promise<CustodyShipment[]> {
  const { data: linkRows } = await sbAdmin
    .from('dpp_custody_chain')
    .select(
      'id, dpp_id, actor_user_id, custody_role, custody_started_at, custody_ended_at, gps_lat, gps_lng, transfer_evidence',
    )
    .eq('actor_user_id', userId)
    .eq('custody_role', 'freight_forwarder')
    .order('custody_started_at', { ascending: false })
    .returns<CustodyRow[]>()

  const links = linkRows ?? []
  if (links.length === 0) return []

  const dppIds = [...new Set(links.map((l) => l.dpp_id))]
  const { data: regRows } = await sbAdmin
    .from('dpp_registry')
    .select(REGISTRY_COLUMNS)
    .in('id', dppIds)
    .returns<RegistryRow[]>()
  const registries = new Map((regRows ?? []).map((r) => [r.id, r]))

  const productIds = [...new Set((regRows ?? []).map((r) => r.product_id).filter(Boolean))] as string[]
  const products = new Map<string, ProductRow>()
  if (productIds.length > 0) {
    const { data: prodRows } = await sbAdmin
      .from('products')
      .select('id, title, sku, hs_code, country_of_origin')
      .in('id', productIds)
      .returns<ProductRow[]>()
    for (const p of prodRows ?? []) products.set(p.id, p)
  }

  return links.map((l) => {
    const reg = registries.get(l.dpp_id)
    const prod = reg?.product_id ? products.get(reg.product_id) : undefined
    return {
      linkId: l.id,
      dppId: l.dpp_id,
      custodyStartedAt: l.custody_started_at,
      custodyEndedAt: l.custody_ended_at,
      gpsLat: l.gps_lat,
      gpsLng: l.gps_lng,
      evidence: l.transfer_evidence,
      productName: localized(prod?.title ?? null),
      sku: prod?.sku ?? null,
      hsCode: prod?.hs_code ?? null,
      originCountry: prod?.country_of_origin ?? null,
      lifecycleState: reg?.lifecycle_state ?? null,
      incoterm: reg?.incoterm ?? null,
      deliveryLocation: reg?.delivery_location ?? null,
      blReference: reg?.bl_reference ?? null,
      carrierId: reg?.carrier_id ?? null,
      packageType: reg?.package_type ?? null,
      packageLengthMm: reg?.package_length_mm ?? null,
      packageWidthMm: reg?.package_width_mm ?? null,
      packageHeightMm: reg?.package_height_mm ?? null,
      packageWeightKg: reg?.package_weight_kg ?? null,
      stackable: reg?.stackable ?? null,
      reeferTempMinC: reg?.reefer_temp_min_c ?? null,
      reeferTempMaxC: reg?.reefer_temp_max_c ?? null,
      imdgClass: reg?.imdg_class ?? null,
    }
  })
}

/**
 * Detalle de un envío concreto. Solo lo devuelve si el caller tiene un eslabón
 * de custodia propio como transitario sobre ese DPP (si no, null → 404 opaco).
 */
export async function fetchShipmentDetail(
  sbAdmin: SupabaseClient,
  userId: string,
  dppId: string,
): Promise<ShipmentDetail | null> {
  // 1. ¿El caller es custodio (transitario) de este envío? Si no, no existe para él.
  const { data: ownLink } = await sbAdmin
    .from('dpp_custody_chain')
    .select(
      'id, dpp_id, actor_user_id, custody_role, custody_started_at, custody_ended_at, gps_lat, gps_lng, transfer_evidence',
    )
    .eq('actor_user_id', userId)
    .eq('custody_role', 'freight_forwarder')
    .eq('dpp_id', dppId)
    .order('custody_started_at', { ascending: false })
    .limit(1)
    .maybeSingle<CustodyRow>()
  if (!ownLink) return null

  // 2. Envío + producto.
  const { data: reg } = await sbAdmin
    .from('dpp_registry')
    .select(REGISTRY_COLUMNS)
    .eq('id', dppId)
    .maybeSingle<RegistryRow>()
  if (!reg) return null

  let product: ProductRow | null = null
  if (reg.product_id) {
    const { data: p } = await sbAdmin
      .from('products')
      .select('id, title, sku, hs_code, country_of_origin')
      .eq('id', reg.product_id)
      .maybeSingle<ProductRow>()
    product = p ?? null
  }

  // 3. Cadena de custodia completa del envío (todos los eslabones, en orden).
  const { data: chainRows } = await sbAdmin
    .from('dpp_custody_chain')
    .select(
      'id, dpp_id, actor_user_id, custody_role, custody_started_at, custody_ended_at, gps_lat, gps_lng, transfer_evidence',
    )
    .eq('dpp_id', dppId)
    .order('custody_started_at', { ascending: true })
    .returns<CustodyRow[]>()

  // 4. Transiciones de estado (auditoría del ciclo de vida).
  const { data: transRows } = await sbAdmin
    .from('dpp_state_transitions')
    .select('dpp_id, from_state, to_state, transitioned_at, reason')
    .eq('dpp_id', dppId)
    .order('transitioned_at', { ascending: true })
    .returns<TransitionRow[]>()

  return {
    linkId: ownLink.id,
    dppId,
    custodyStartedAt: ownLink.custody_started_at,
    custodyEndedAt: ownLink.custody_ended_at,
    gpsLat: ownLink.gps_lat,
    gpsLng: ownLink.gps_lng,
    evidence: ownLink.transfer_evidence,
    productName: localized(product?.title ?? null),
    sku: product?.sku ?? null,
    hsCode: product?.hs_code ?? null,
    originCountry: product?.country_of_origin ?? null,
    lifecycleState: reg.lifecycle_state,
    incoterm: reg.incoterm,
    deliveryLocation: reg.delivery_location,
    blReference: reg.bl_reference,
    carrierId: reg.carrier_id,
    maritimeConvention: reg.maritime_convention,
    packageType: reg.package_type,
    packageLengthMm: reg.package_length_mm,
    packageWidthMm: reg.package_width_mm,
    packageHeightMm: reg.package_height_mm,
    packageWeightKg: reg.package_weight_kg,
    stackable: reg.stackable,
    reeferTempMinC: reg.reefer_temp_min_c,
    reeferTempMaxC: reg.reefer_temp_max_c,
    imdgClass: reg.imdg_class,
    photoUrl: reg.photo_url,
    chain: (chainRows ?? []).map(toLink),
    transitions: (transRows ?? []).map((t) => ({
      dppId: t.dpp_id,
      fromState: t.from_state,
      toState: t.to_state,
      transitionedAt: t.transitioned_at,
      reason: t.reason,
    })),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO ACTORES · contrapartes de las cadenas de custodia del transitario
// ════════════════════════════════════════════════════════════════════════════
//
// Privacidad (regla del usuario): NO se expone PII. Se devuelven las CONTRAPARTES
// por su ROL en la cadena (fabricante, transportista, consignatario, aduana…) y
// los envíos que compartís — nunca nombres/emails/tax_id. El directorio con datos
// de contacto y "llamar a persona" es una pieza aparte (pendiente, con su decisión
// de privacidad). Mismo scoping: solo cadenas donde el caller es custodio.

export interface CustodyActorShipment {
  dppId: string
  productName: string
  role: string
}
export interface CustodyActor {
  /** id opaco del actor (no es PII presentable; sirve de clave estable). */
  actorUserId: string
  /** roles que ha tenido en cadenas compartidas con el transitario. */
  roles: string[]
  /** nº de envíos en los que coincidís. */
  shipmentCount: number
  /** muestra de envíos compartidos (para contexto + enlace al detalle). */
  shipments: CustodyActorShipment[]
}

/**
 * Contrapartes de las cadenas de custodia del transitario, agrupadas por actor.
 * Solo de los envíos donde el caller es freight_forwarder (mismo scoping que el
 * resto). Devuelve [] si no hay (estado honesto). Sin PII (rol + envíos).
 */
export async function fetchCustodyActors(
  sbAdmin: SupabaseClient,
  userId: string,
): Promise<CustodyActor[]> {
  // 1. dpp_ids donde el caller es transitario.
  const { data: ownLinks } = await sbAdmin
    .from('dpp_custody_chain')
    .select('dpp_id')
    .eq('actor_user_id', userId)
    .eq('custody_role', 'freight_forwarder')
    .returns<{ dpp_id: string }[]>()
  const dppIds = [...new Set((ownLinks ?? []).map((l) => l.dpp_id))]
  if (dppIds.length === 0) return []

  // 2. Toda la cadena de esos envíos (las contrapartes son los otros eslabones).
  const { data: chainRows } = await sbAdmin
    .from('dpp_custody_chain')
    .select('dpp_id, actor_user_id, custody_role, custody_started_at')
    .in('dpp_id', dppIds)
    .order('custody_started_at', { ascending: true })
    .returns<{ dpp_id: string; actor_user_id: string; custody_role: string; custody_started_at: string }[]>()

  // 3. Nombre de producto por dpp (reusa el patrón registry → products).
  const { data: regRows } = await sbAdmin
    .from('dpp_registry')
    .select('id, product_id')
    .in('id', dppIds)
    .returns<{ id: string; product_id: string | null }[]>()
  const prodIdByDpp = new Map((regRows ?? []).map((r) => [r.id, r.product_id]))
  const productIds = [...new Set((regRows ?? []).map((r) => r.product_id).filter(Boolean))] as string[]
  const titleById = new Map<string, LocalizedLabel | null>()
  if (productIds.length > 0) {
    const { data: prodRows } = await sbAdmin
      .from('products')
      .select('id, title')
      .in('id', productIds)
      .returns<{ id: string; title: LocalizedLabel | null }[]>()
    for (const p of prodRows ?? []) titleById.set(p.id, p.title)
  }
  const productName = (dppId: string): string => {
    const pid = prodIdByDpp.get(dppId)
    return localized(pid ? titleById.get(pid) ?? null : null)
  }

  // 4. Agrupa por contraparte (excluye al propio transitario).
  const byActor = new Map<string, CustodyActor>()
  for (const c of chainRows ?? []) {
    if (c.actor_user_id === userId) continue
    const a = byActor.get(c.actor_user_id) ?? { actorUserId: c.actor_user_id, roles: [], shipmentCount: 0, shipments: [] }
    if (!a.roles.includes(c.custody_role)) a.roles.push(c.custody_role)
    if (!a.shipments.some((s) => s.dppId === c.dpp_id)) {
      a.shipments.push({ dppId: c.dpp_id, productName: productName(c.dpp_id), role: c.custody_role })
    }
    byActor.set(c.actor_user_id, a)
  }
  const actors = [...byActor.values()]
  for (const a of actors) a.shipmentCount = a.shipments.length
  return actors.sort((x, y) => y.shipmentCount - x.shipmentCount)
}

/** Resuelve rol/sector del actor (para etiquetar la vista y el gating suave). */
export async function fetchActorRole(
  sbAdmin: SupabaseClient,
  userId: string,
): Promise<{ roleId: string | null; sectorId: string | null; isTransitario: boolean }> {
  const { data } = await sbAdmin
    .from('actors')
    .select('role_id, sector_id')
    .eq('user_id', userId)
    .maybeSingle<{ role_id: string | null; sector_id: string | null }>()
  const roleId = data?.role_id ?? null
  const sectorId = data?.sector_id ?? null
  const isTransitario =
    (roleId !== null && (TRANSITARIO_ROLE_IDS as readonly string[]).includes(roleId)) ||
    sectorId === 'transporte'
  return { roleId, sectorId, isTransitario }
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO DOCUMENTACIÓN · papeles de transporte/aduana POR ENVÍO (datos reales)
// ════════════════════════════════════════════════════════════════════════════
//
// IMPORTANTE (no inventar): el modelo de BD NO tiene columnas dedicadas
// CMR/AWB/DUA. Lo que existe de verdad es:
//   · dpp_registry.bl_reference + maritime_convention  → referencia del documento
//     de transporte del envío.
//   · dpp_custody_chain.transfer_evidence {document_type, document_url,
//     document_hash_sha256} → documentos adjuntados al transferir la custodia,
//     a lo largo de toda la cadena (PII off-chain: el original vive en Storage,
//     aquí solo referencia + hash SHA-256).
// El "tipo esperado" (B/L marítimo · AWB aéreo · CMR terrestre) se DERIVA del rol
// del transitario; nunca se fabrica un dato que no esté.

/** Documento esperado del transporte según el modo del transitario (derivado, no inventado). */
export function transportDocKind(roleId: string | null): { code: string; label: string } {
  switch (roleId) {
    case 'transitarios-mar': return { code: 'B/L', label: 'Conocimiento de embarque (Bill of Lading)' }
    case 'transitarios-aire': return { code: 'AWB', label: 'Carta de porte aéreo (Air Waybill)' }
    case 'logistica-terrestre': return { code: 'CMR', label: 'Carta de porte por carretera (CMR)' }
    default: return { code: 'DOC', label: 'Documento de transporte' }
  }
}

/** Un documento real adjuntado a un eslabón de la cadena de custodia. */
export interface AttachedDoc {
  documentType: string | null
  documentUrl: string | null
  documentHash: string | null
  /** Rol del actor que lo adjuntó (fabricante, transitario, aduana…). */
  byRole: string
  at: string
}

/** Carpeta documental de un envío en custodia del transitario. */
export interface ShipmentDocs {
  dppId: string
  productName: string
  originCountry: string | null
  deliveryLocation: string | null
  incoterm: string | null
  lifecycleState: string | null
  blReference: string | null
  maritimeConvention: string | null
  /** Evidencias documentales reales a lo largo de la cadena (puede ir vacío → estado honesto). */
  docs: AttachedDoc[]
}

function hasDoc(e: TransferEvidence | null): boolean {
  return Boolean(e && (e.document_type || e.document_url))
}

/**
 * Carpeta documental por envío del transitario (módulo Documentación).
 * Mismo scoping que fetchCustodyShipments: solo envíos donde el caller es
 * custodio (freight_forwarder). Incluye TODOS sus envíos, aunque aún no tengan
 * documentos (para mostrar el estado honesto "sin documentos aún").
 */
export async function fetchCustodyDocuments(
  sbAdmin: SupabaseClient,
  userId: string,
): Promise<ShipmentDocs[]> {
  const { data: ownLinks } = await sbAdmin
    .from('dpp_custody_chain')
    .select('dpp_id, custody_started_at')
    .eq('actor_user_id', userId)
    .eq('custody_role', 'freight_forwarder')
    .order('custody_started_at', { ascending: false })
    .returns<{ dpp_id: string; custody_started_at: string }[]>()

  const links = ownLinks ?? []
  if (links.length === 0) return []

  // Orden de envíos = orden del eslabón propio más reciente.
  const dppIds = [...new Set(links.map((l) => l.dpp_id))]

  const { data: regRows } = await sbAdmin
    .from('dpp_registry')
    .select('id, product_id, lifecycle_state, incoterm, delivery_location, bl_reference, maritime_convention')
    .in('id', dppIds)
    .returns<Pick<RegistryRow, 'id' | 'product_id' | 'lifecycle_state' | 'incoterm' | 'delivery_location' | 'bl_reference' | 'maritime_convention'>[]>()
  const registries = new Map((regRows ?? []).map((r) => [r.id, r]))

  const productIds = [...new Set((regRows ?? []).map((r) => r.product_id).filter(Boolean))] as string[]
  const products = new Map<string, ProductRow>()
  if (productIds.length > 0) {
    const { data: prodRows } = await sbAdmin
      .from('products')
      .select('id, title, sku, hs_code, country_of_origin')
      .in('id', productIds)
      .returns<ProductRow[]>()
    for (const p of prodRows ?? []) products.set(p.id, p)
  }

  // Evidencias documentales de TODA la cadena de cada envío (no solo el eslabón propio).
  const { data: chainRows } = await sbAdmin
    .from('dpp_custody_chain')
    .select('dpp_id, custody_role, custody_started_at, transfer_evidence')
    .in('dpp_id', dppIds)
    .order('custody_started_at', { ascending: true })
    .returns<{ dpp_id: string; custody_role: string; custody_started_at: string; transfer_evidence: TransferEvidence | null }[]>()
  const docsByDpp = new Map<string, AttachedDoc[]>()
  for (const c of chainRows ?? []) {
    if (!hasDoc(c.transfer_evidence)) continue
    const arr = docsByDpp.get(c.dpp_id) ?? []
    arr.push({
      documentType: c.transfer_evidence!.document_type ?? null,
      documentUrl: c.transfer_evidence!.document_url ?? null,
      documentHash: c.transfer_evidence!.document_hash_sha256 ?? null,
      byRole: c.custody_role,
      at: c.custody_started_at,
    })
    docsByDpp.set(c.dpp_id, arr)
  }

  return dppIds.map((dppId) => {
    const reg = registries.get(dppId)
    const prod = reg?.product_id ? products.get(reg.product_id) : undefined
    return {
      dppId,
      productName: localized(prod?.title ?? null),
      originCountry: prod?.country_of_origin ?? null,
      deliveryLocation: reg?.delivery_location ?? null,
      incoterm: reg?.incoterm ?? null,
      lifecycleState: reg?.lifecycle_state ?? null,
      blReference: reg?.bl_reference ?? null,
      maritimeConvention: reg?.maritime_convention ?? null,
      docs: docsByDpp.get(dppId) ?? [],
    }
  })
}
