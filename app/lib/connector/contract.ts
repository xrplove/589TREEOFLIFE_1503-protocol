// ════════════════════════════════════════════════════════════════════════════
// CONTRATO DEL CONECTOR · lado 1503 (RECEPTOR) · espejo de Artikalia conector@1.0
// ────────────────────────────────────────────────────────────────────────────
// La otra mitad del contrato del ADR 0003 de Artikalia (`app/lib/conector1503.ts`).
// Cada herramienta conectada (Artikalia y futuras) publica el MISMO DTO canónico;
// 1503 (el hub) lo recibe aquí, lo valida, lo pasa por el gate y acuña su DPP.
//
// CANON: la PII del cliente NUNCA entra en este DTO (solo catálogo/DPP/medidas/
// origen/cumplimiento). El dinero NO viaja por el conector (ver `globalSettlement.ts`).
// ════════════════════════════════════════════════════════════════════════════

/** Versión del contrato canónico que este receptor soporta (semver del DTO). */
export const CONTRATO_VERSION_SOPORTADA = 'conector@1.0'

/** DTO canónico de FICHA publicado por una herramienta conectada (espejo exacto
 *  de `FichaCanonica` en Artikalia). Subconjunto que mapea al DPP de 1503. */
export interface FichaCanonica {
  contrato_version: string
  sku: string
  titulo: string
  precio: { valor: number; moneda: string; iva_incluido: boolean }
  imagenes: string[]
  certificados: string[]
  bulto?: {
    largo_mm: number
    ancho_mm: number
    alto_mm: number
    peso_kg: number
    apilable: boolean
    tipo: 'box' | 'pallet' | 'crate' | 'sack' | 'drum' | 'ibc' | 'roll' | 'other'
  }
  pais_origen?: string // ISO 3166-1 alpha-2
  pais_fabricacion?: string // ISO 3166-1 alpha-2
  fecha_produccion?: string // YYYY-MM-DD · dato del DPP (acuñación)
  hs_code?: string // 6-10 dígitos
  materiales?: { nombre: string; porcentaje?: number }[]
  // Campos ESPR (DPP · ley 2028) — la ficha 2028-ready los trae; el gate los exige.
  espr?: {
    origen_madera?: string // especie + fuente sostenible
    sustancias_preocupantes?: { declarado: boolean; lista?: string[] } // SVHC / retardantes
    durabilidad?: string // clase o referencia de ensayo
    desmontaje_reparacion?: string // instrucciones (url/texto)
    recambios?: string // disponibilidad de recambios
    reciclabilidad_pct?: number
    contenido_reciclado_pct?: number
  }
  hash_canonico?: string // RFC 8785 (JCS) · se verifica al recibir
}

/** ¿La versión del contrato es compatible con este receptor? */
export function contratoSoportado(version: unknown): boolean {
  return version === CONTRATO_VERSION_SOPORTADA
}

const ISO2_RE = /^[A-Z]{2}$/

/**
 * Mapea una `FichaCanonica` (idioma del conector) al cuerpo que espera el alta de
 * producto de 1503 (`/api/products` POST · gate + buildDppRecord). NO inventa datos:
 * lo que el conector no trae, no se rellena. La presencia de `pais_fabricacion`
 * activa la acuñación del DPP físico (igual que `manufacturing_country` en el alta).
 *
 * El mueble de Artikalia se ancla al sector del escritorio (`inmobiliario`); su
 * cumplimiento de exportación lo resuelve el CORREDOR (sector-agnóstico), no un
 * schema de producto específico de mueble (que 1503 no tiene aún).
 */
export function fichaCanonicaToProductBody(
  ficha: FichaCanonica,
  opts: { sectorId: string; subCategoria: string },
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    sector_id: opts.sectorId,
    sub_categoria: opts.subCategoria,
    sku: ficha.sku,
    // 1503 usa LocalizedLabel; el conector trae un string → se envuelve sin traducir.
    title: { es: ficha.titulo, en: ficha.titulo },
    schema_version: 'universal@1.0',
    price: {
      value: ficha.precio.valor,
      currency: ficha.precio.moneda,
      vat_included: ficha.precio.iva_incluido,
    },
  }

  if (ficha.imagenes.length > 0) {
    body.images = ficha.imagenes.map((url, i) => ({ url, is_primary: i === 0 }))
  }
  if (ficha.certificados.length > 0) {
    body.certificates = ficha.certificados
  }
  if (ficha.materiales && ficha.materiales.length > 0) {
    body.materials = ficha.materiales.map((m) => ({
      name: m.nombre,
      ...(typeof m.porcentaje === 'number' ? { percentage: m.porcentaje } : {}),
    }))
  }
  if (typeof ficha.hs_code === 'string') body.hs_code = ficha.hs_code
  if (typeof ficha.pais_origen === 'string' && ISO2_RE.test(ficha.pais_origen)) {
    body.country_of_origin = ficha.pais_origen
  }
  // `manufacturing_country` activa el DPP físico (mismo disparador que el alta).
  if (typeof ficha.pais_fabricacion === 'string' && ISO2_RE.test(ficha.pais_fabricacion)) {
    body.manufacturing_country = ficha.pais_fabricacion
  }
  if (typeof ficha.fecha_produccion === 'string') body.production_date = ficha.fecha_produccion

  // Cubicaje (DPP Capa B · milímetros) — lo que el motor de carga necesita.
  if (ficha.bulto) {
    body.package_length_mm = ficha.bulto.largo_mm
    body.package_width_mm = ficha.bulto.ancho_mm
    body.package_height_mm = ficha.bulto.alto_mm
    body.package_weight_kg = ficha.bulto.peso_kg
    body.package_type = ficha.bulto.tipo
    body.stackable = ficha.bulto.apilable
  }

  // Campos ESPR (DPP · ley 2028) → cuerpo plano que valida `validateEsprFurnitureDpp`.
  const e = ficha.espr
  if (e) {
    if (typeof e.origen_madera === 'string') body.wood_source = e.origen_madera
    if (e.sustancias_preocupantes) body.substances_of_concern = e.sustancias_preocupantes
    if (typeof e.durabilidad === 'string') body.durability = e.durabilidad
    if (typeof e.desmontaje_reparacion === 'string') body.repair_disassembly = e.desmontaje_reparacion
    if (typeof e.recambios === 'string') body.spare_parts = e.recambios
    if (typeof e.reciclabilidad_pct === 'number') body.recyclability_pct = e.reciclabilidad_pct
    if (typeof e.contenido_reciclado_pct === 'number') body.recycled_content_pct = e.contenido_reciclado_pct
  }

  return body
}
