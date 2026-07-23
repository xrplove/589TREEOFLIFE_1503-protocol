// GS1 Digital Link · portador de datos del Pasaporte Digital de Producto (DPP)
// ---------------------------------------------------------------------------
// El Reg. UE 2024/1781 (ESPR) y la norma CEN/CENELEC prEN 18220 (data carriers,
// Mandato M/604 · JTC 24) reconocen GS1 Digital Link como el patrón de URI
// RECOMENDADO para el portador de datos del DPP: el identificador del producto
// (GTIN + nº de serie / lote) se codifica en una URL HTTPS, esa URL se imprime
// como QR sobre el producto, y un "resolver" la traduce al destino correcto
// (página de consumidor, registro DPP para autoridad, registro de garantía…).
//
// Esta librería es PURA y sin dependencias (testeable con node:test). Cubre:
//   - validación del dígito de control GTIN (mod-10),
//   - normalización a GTIN-14 (relleno por la izquierda),
//   - construcción del URI GS1 Digital Link en su ORDEN CANÓNICO de cualificadores,
//   - parseo inverso de un URI a sus Application Identifiers (AI).
//
// NO ancla nada on-chain ni habla con el Registro UE (eso es el siguiente
// ladrillo, ver docs/architecture/0023-*). Solo "acuña" el portador de datos.
//
// Referencia de orden canónico (GS1 Digital Link Standard): para la clave
// primaria 01 (GTIN) los cualificadores van en el orden 22 (CPV) → 10 (lote)
// → 21 (serie). Las fechas van como query (17 caducidad · 11 producción ·
// 15 consumo preferente) en formato YYMMDD.

/** Application Identifiers (AI) GS1 usados en el portador de datos del DPP. */
export const GS1_AI = {
  GTIN: '01',
  CPV: '22', // Consumer Product Variant
  LOT: '10', // Batch / Lot
  SERIAL: '21', // Serial number
  PROD_DATE: '11', // Production date (YYMMDD)
  BEST_BEFORE: '15', // Best-before date (YYMMDD)
  EXPIRY: '17', // Expiry date (YYMMDD)
} as const

/** Resolver GS1 canónico por defecto (devuelve el linkset de enlaces registrados). */
export const GS1_CANONICAL_RESOLVER = 'https://id.gs1.org'

/** Longitudes de GTIN admitidas (todas llevan su propio dígito de control final). */
const VALID_GTIN_LENGTHS = new Set([8, 12, 13, 14])

/**
 * Dígito de control GTIN (mod-10). Se calcula sobre TODOS los dígitos menos el
 * último (que es el propio dígito de control). Los pesos alternan 3,1,3,1…
 * empezando por 3 en el dígito de datos más a la derecha.
 */
export function computeGtinCheckDigit(digitsWithoutCheck: string): number {
  if (!/^\d+$/.test(digitsWithoutCheck)) {
    throw new Error('computeGtinCheckDigit: la entrada debe ser solo dígitos')
  }
  let sum = 0
  // Recorremos de derecha a izquierda: el más a la derecha pesa 3, el siguiente 1…
  for (let i = digitsWithoutCheck.length - 1, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
    sum += Number(digitsWithoutCheck[i]) * weight
  }
  return (10 - (sum % 10)) % 10
}

/**
 * ¿Es un GTIN válido? Longitud 8/12/13/14, solo dígitos y dígito de control OK.
 * Acepta espacios/guiones de cortesía (se limpian antes de validar).
 */
export function isValidGtin(gtin: string): boolean {
  const clean = gtin.replace(/[\s-]/g, '')
  if (!/^\d+$/.test(clean) || !VALID_GTIN_LENGTHS.has(clean.length)) return false
  const body = clean.slice(0, -1)
  const check = Number(clean.slice(-1))
  return computeGtinCheckDigit(body) === check
}

/**
 * Normaliza cualquier GTIN válido (8/12/13/14) a GTIN-14 rellenando por la
 * izquierda con ceros. El relleno por la izquierda NO cambia el dígito de
 * control (los ceros de mayor posición aportan 0 a la suma ponderada), por eso
 * un EAN-13/UPC-A se convierte directamente en GTIN-14 sin recalcular nada.
 * Lanza si el GTIN no es válido (evita acuñar portadores con identificadores rotos).
 */
export function toGtin14(gtin: string): string {
  const clean = gtin.replace(/[\s-]/g, '')
  if (!isValidGtin(clean)) {
    throw new Error(`toGtin14: GTIN inválido (longitud o dígito de control): "${gtin}"`)
  }
  return clean.padStart(14, '0')
}

export type Gs1DigitalLinkInput = {
  /** GTIN del producto (modelo). Obligatorio: es la clave primaria del portador. */
  gtin: string
  /** Variante de producto de consumo (AI 22), opcional. */
  cpv?: string
  /** Lote / batch (AI 10), opcional. */
  lot?: string
  /** Nº de serie (AI 21) — identidad a NIVEL DE ÍTEM (obligatorio p.ej. en baterías). */
  serial?: string
  /** Fecha de caducidad (AI 17) en formato YYMMDD. */
  expiry?: string
  /** Fecha de producción (AI 11) en formato YYMMDD. */
  productionDate?: string
  /** Consumo preferente (AI 15) en formato YYMMDD. */
  bestBefore?: string
  /**
   * Resolver (dominio que sirve el enlace). Por defecto el canónico GS1. Para un
   * resolver auto-hospedado de 1503, pasar p.ej. `https://1503.eu` (patrón
   * self-hosted del GS1 Digital Link Standard).
   */
  resolver?: string
}

const YYMMDD = /^\d{6}$/

/**
 * Construye el URI GS1 Digital Link canónico del portador de datos del DPP.
 *
 * Ejemplos:
 *   buildGs1DigitalLink({ gtin: '05901234123457' })
 *     → 'https://id.gs1.org/01/05901234123457'
 *   buildGs1DigitalLink({ gtin: '5901234123457', lot: 'L-A', serial: 'SN123', expiry: '271231' })
 *     → 'https://id.gs1.org/01/05901234123457/10/L-A/21/SN123?17=271231'
 */
export function buildGs1DigitalLink(input: Gs1DigitalLinkInput): string {
  const resolver = (input.resolver ?? GS1_CANONICAL_RESOLVER).replace(/\/+$/, '')
  const gtin14 = toGtin14(input.gtin)

  // Ruta: clave primaria + cualificadores EN ORDEN CANÓNICO (22 → 10 → 21).
  let path = `/${GS1_AI.GTIN}/${gtin14}`
  if (input.cpv) path += `/${GS1_AI.CPV}/${encodeURIComponent(input.cpv)}`
  if (input.lot) path += `/${GS1_AI.LOT}/${encodeURIComponent(input.lot)}`
  if (input.serial) path += `/${GS1_AI.SERIAL}/${encodeURIComponent(input.serial)}`

  // Query: atributos de datos (fechas). Validamos el formato YYMMDD.
  const query: string[] = []
  for (const [ai, value] of [
    [GS1_AI.EXPIRY, input.expiry],
    [GS1_AI.PROD_DATE, input.productionDate],
    [GS1_AI.BEST_BEFORE, input.bestBefore],
  ] as const) {
    if (value === undefined) continue
    if (!YYMMDD.test(value)) {
      throw new Error(`buildGs1DigitalLink: el AI ${ai} debe ser YYMMDD (6 dígitos), recibido "${value}"`)
    }
    query.push(`${ai}=${value}`)
  }

  return `${resolver}${path}${query.length ? `?${query.join('&')}` : ''}`
}

export type ParsedGs1DigitalLink = {
  resolver: string
  gtin14: string
  cpv?: string
  lot?: string
  serial?: string
  expiry?: string
  productionDate?: string
  bestBefore?: string
}

/**
 * Formas de GTIN almacenadas que NORMALIZAN al `gtin14` dado. Útil para casar el
 * GTIN-14 que viaja en el Digital Link con el GTIN que el Actor guardó (que pudo
 * teclear como EAN-13/UPC-A). Devuelve el propio gtin14 + sus variantes 13/12/8
 * cuyo relleno por la izquierda con ceros reproduce el gtin14.
 */
export function gtinCandidates(gtin14: string): string[] {
  const set = new Set<string>([gtin14])
  for (const len of [13, 12, 8]) {
    if (len < gtin14.length) {
      const cand = gtin14.slice(gtin14.length - len)
      if (cand.padStart(14, '0') === gtin14) set.add(cand)
    }
  }
  return [...set]
}

/**
 * Parseo inverso: de un URI GS1 Digital Link a sus AIs. Tolera barra final y
 * cualificadores en cualquier orden de ruta. Lanza si no hay clave primaria 01
 * o el GTIN es inválido.
 */
export function parseGs1DigitalLink(uri: string): ParsedGs1DigitalLink {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    throw new Error(`parseGs1DigitalLink: URI no válido: "${uri}"`)
  }

  const segments = url.pathname.split('/').filter(Boolean)
  // Recorremos pares (AI, valor) de la ruta.
  const pathAis: Record<string, string> = {}
  for (let i = 0; i + 1 < segments.length; i += 2) {
    pathAis[segments[i]] = decodeURIComponent(segments[i + 1])
  }

  const rawGtin = pathAis[GS1_AI.GTIN]
  if (!rawGtin) {
    throw new Error('parseGs1DigitalLink: falta la clave primaria GTIN (AI 01)')
  }
  const gtin14 = toGtin14(rawGtin)

  const result: ParsedGs1DigitalLink = {
    resolver: url.origin,
    gtin14,
  }
  if (pathAis[GS1_AI.CPV]) result.cpv = pathAis[GS1_AI.CPV]
  if (pathAis[GS1_AI.LOT]) result.lot = pathAis[GS1_AI.LOT]
  if (pathAis[GS1_AI.SERIAL]) result.serial = pathAis[GS1_AI.SERIAL]

  const expiry = url.searchParams.get(GS1_AI.EXPIRY)
  const prod = url.searchParams.get(GS1_AI.PROD_DATE)
  const best = url.searchParams.get(GS1_AI.BEST_BEFORE)
  if (expiry) result.expiry = expiry
  if (prod) result.productionDate = prod
  if (best) result.bestBefore = best

  return result
}
