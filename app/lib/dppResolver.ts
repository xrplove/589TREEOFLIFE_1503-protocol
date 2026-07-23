// Resolver del Pasaporte Digital de Producto · lógica pura (rodaja 3 · ADR 0023)
// ---------------------------------------------------------------------------
// El "resolver" es el endpoint al que apunta el portador de datos (QR / GS1
// Digital Link): recibe una petición y devuelve la representación adecuada del
// pasaforte — HTML para personas, JSON-LD para máquinas/autoridades (prEN 18222
// API de ciclo de vida · CEN/CENELEC JTC 24).
//
// Este módulo es PURO (sin Supabase, sin Next) → testeable con node:test:
//   - `isUuid`                  · valida el identificador del pasaporte.
//   - `toConsumerPassport`      · FILTRADO POSITIVO: de la fila completa de
//     `dpp_registry` (+ producto enlazado) se queda SOLO con los campos públicos
//     de consumidor. Nunca expone owner, planta, EORI/IVA, costes, ERP, etc.
//     (RGPD + confidencialidad comercial · regla global del proyecto).
//   - `toJsonLd`                · representación JSON-LD (interina; la
//     alineación fina con la EU DPP Core Ontology de CIRPASS-2 es la rodaja 4).
//   - `renderPassportHtml`      · página HTML legible, con escapado anti-XSS de
//     todo dato proveniente de la BD.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

/** Etiqueta multi-idioma tal como se guarda en `products.title` (jsonb). */
type LocalizedLabel = Record<string, string> | null | undefined

/**
 * Fila tal como la devuelve la query del resolver: campos de `dpp_registry` +
 * el producto enlazado (`products(title, gtin)`). Solo se tipan los campos que
 * el resolver consume; cualquier otro de la tabla se ignora por diseño.
 */
import type { CustodySeal } from './custodyVerify'

export type DppResolverRow = {
  id: string
  hs_code: string | null
  materials: unknown
  carbon_footprint_kg_co2eq: number | null
  water_footprint_l: number | null
  recycled_content_pct: number | null
  recyclability_pct: number | null
  manufacturing_country: string | null
  production_date: string | null
  serial_number: string | null
  data_carrier_uri: string | null
  hash_canonical_sha256: string | null
  onchain_tx_hash: string | null
  onchain_anchored_at: string | null
  created_at: string | null
  // Producto enlazado (puede venir como objeto o array según el join de Supabase).
  products: { title: LocalizedLabel; gtin: string | null } | { title: LocalizedLabel; gtin: string | null }[] | null
}

export type ConsumerPassport = {
  id: string
  name: string | null
  gtin: string | null
  serial: string | null
  hsCode: string | null
  materials: unknown
  carbonFootprintKgCo2eq: number | null
  waterFootprintL: number | null
  recycledContentPct: number | null
  recyclabilityPct: number | null
  manufacturingCountry: string | null
  productionDate: string | null
  dataCarrierUri: string | null
  integrity: {
    hashSha256: string | null
    onchainTxHash: string | null
    onchainAnchoredAt: string | null
    // Precinto de custodia (ed25519). null si el pasaporte no tiene cadena de custodia.
    custody: { verified: boolean; signatures: number; links: number } | null
  }
  createdAt: string | null
}

/** Elige un nombre legible de la etiqueta multi-idioma (prioriza es → en → primero). */
function pickName(title: LocalizedLabel): string | null {
  if (!title || typeof title !== 'object') return null
  return title.es ?? title.en ?? Object.values(title)[0] ?? null
}

/**
 * FILTRADO POSITIVO. Construye el pasaporte público de consumidor a partir de la
 * fila. Lista de campos EXPLÍCITA: añadir una columna PII nueva a `dpp_registry`
 * NO la filtra aquí por accidente.
 */
export function toConsumerPassport(
  row: DppResolverRow,
  seal?: CustodySeal | null,
): ConsumerPassport {
  const product = Array.isArray(row.products) ? row.products[0] : row.products
  return {
    id: row.id,
    name: pickName(product?.title),
    gtin: product?.gtin ?? null,
    serial: row.serial_number,
    hsCode: row.hs_code,
    materials: row.materials ?? null,
    carbonFootprintKgCo2eq: row.carbon_footprint_kg_co2eq,
    waterFootprintL: row.water_footprint_l,
    recycledContentPct: row.recycled_content_pct,
    recyclabilityPct: row.recyclability_pct,
    manufacturingCountry: row.manufacturing_country,
    productionDate: row.production_date,
    dataCarrierUri: row.data_carrier_uri,
    integrity: {
      hashSha256: row.hash_canonical_sha256,
      onchainTxHash: row.onchain_tx_hash,
      onchainAnchoredAt: row.onchain_anchored_at,
      custody: seal && seal.links > 0
        ? { verified: seal.verified, signatures: seal.signaturesOk, links: seal.links }
        : null,
    },
    createdAt: row.created_at,
  }
}

/**
 * Representación JSON-LD (interina). El `@context` mapea a schema.org donde hay
 * equivalente directo; la alineación fina con la EU DPP Core Ontology (CIRPASS-2)
 * es la rodaja 4. `id` (@id) es la URL canónica del propio pasaporte (el resolver).
 */
export function toJsonLd(p: ConsumerPassport, selfUrl: string): Record<string, unknown> {
  return {
    '@context': [
      'https://schema.org',
      {
        dpp: 'https://1503.com/ns/dpp#',
        gtin: 'https://schema.org/gtin',
        carbonFootprintKgCo2eq: 'dpp:carbonFootprintKgCo2eq',
        recycledContentPct: 'dpp:recycledContentPct',
        recyclabilityPct: 'dpp:recyclabilityPct',
        dataCarrier: 'dpp:dataCarrier',
        integrity: 'dpp:integrity',
      },
    ],
    '@type': 'Product',
    '@id': selfUrl,
    identifier: p.id,
    name: p.name ?? undefined,
    gtin: p.gtin ?? undefined,
    serialNumber: p.serial ?? undefined,
    additionalProperty: [
      ['hsCode', p.hsCode],
      ['manufacturingCountry', p.manufacturingCountry],
      ['productionDate', p.productionDate],
      ['carbonFootprintKgCo2eq', p.carbonFootprintKgCo2eq],
      ['waterFootprintL', p.waterFootprintL],
      ['recycledContentPct', p.recycledContentPct],
      ['recyclabilityPct', p.recyclabilityPct],
    ]
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    material: p.materials ?? undefined,
    dataCarrier: p.dataCarrierUri ?? undefined,
    integrity: {
      hashSha256: p.integrity.hashSha256 ?? undefined,
      onchainTxHash: p.integrity.onchainTxHash ?? undefined,
      onchainAnchoredAt: p.integrity.onchainAnchoredAt ?? undefined,
      custodySeal: p.integrity.custody
        ? { verified: p.integrity.custody.verified, signatures: p.integrity.custody.signatures, links: p.integrity.custody.links }
        : undefined,
    },
  }
}

/** Escapa texto para insertarlo seguro en HTML (anti-XSS · dato de BD). */
export function escapeHtml(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Página HTML legible del pasaporte. Todo dato de BD pasa por `escapeHtml`. */
export function renderPassportHtml(p: ConsumerPassport): string {
  const rows: [string, unknown][] = [
    ['GTIN', p.gtin],
    ['Nº de serie', p.serial],
    ['Código HS', p.hsCode],
    ['País de fabricación', p.manufacturingCountry],
    ['Fecha de producción', p.productionDate],
    ['Huella de carbono (kg CO₂eq)', p.carbonFootprintKgCo2eq],
    ['Huella hídrica (L)', p.waterFootprintL],
    ['Contenido reciclado (%)', p.recycledContentPct],
    ['Reciclabilidad (%)', p.recyclabilityPct],
  ]
  const dataRows = rows
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('')

  const integrity = p.integrity.hashSha256
    ? `<p class="hash">Integridad SHA-256: <code>${escapeHtml(p.integrity.hashSha256)}</code>${
        p.integrity.onchainTxHash ? ` · anclado on-chain` : ''
      }</p>`
    : ''

  // Precinto digital: autenticidad por cadena de custodia firmada (ed25519).
  const c = p.integrity.custody
  const seal = c
    ? `<div class="seal ${c.verified ? 'ok' : 'warn'}">
    <span class="seal-mark">${c.verified ? '✓' : '!'}</span>
    <div class="seal-body">
      <strong>${c.verified ? 'Autenticidad verificada' : 'Precinto sin verificar'}</strong>
      <span class="seal-sub">Cadena de custodia firmada · ${escapeHtml(c.signatures)}/${escapeHtml(c.links)} firmas ed25519${
        p.integrity.onchainTxHash
          ? ` · <a href="https://testnet.xrpl.org/transactions/${escapeHtml(p.integrity.onchainTxHash)}" target="_blank" rel="noopener">anclado on-ledger (XRPL testnet) ↗</a>`
          : ''
      }</span>
    </div>
  </div>`
    : ''

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pasaporte Digital de Producto · 1503</title>
<style>
  body{margin:0;background:#05070d;color:#E8EDF5;font-family:system-ui,sans-serif;line-height:1.5}
  .wrap{max-width:680px;margin:0 auto;padding:2.5rem 1.5rem}
  .kicker{color:#59B6F0;font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;margin:0 0 .4rem}
  h1{margin:0 0 1.5rem;font-size:clamp(1.6rem,4vw,2.4rem)}
  table{width:100%;border-collapse:collapse}
  th,td{text-align:left;padding:.6rem 0;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top}
  th{color:#9FB6CC;font-weight:500;width:45%}
  .hash{margin-top:1.5rem;color:#7A8899;font-size:.8rem;word-break:break-all}
  code{color:#7FD4FF}
  .seal{display:flex;align-items:center;gap:.9rem;margin:0 0 1.6rem;padding:.9rem 1.1rem;border-radius:12px;border:1px solid}
  .seal.ok{background:rgba(70,209,127,.10);border-color:rgba(70,209,127,.34)}
  .seal.warn{background:rgba(232,177,76,.10);border-color:rgba(232,177,76,.34)}
  .seal-mark{font-size:1.5rem;line-height:1}
  .seal.ok .seal-mark{color:#54E08C}
  .seal.warn .seal-mark{color:#F0B429}
  .seal-body{display:flex;flex-direction:column}
  .seal-body strong{font-size:.95rem}
  .seal-sub{color:#9FB6CC;font-size:.76rem;margin-top:.15rem}
  .seal-sub a{color:#7FD4FF;text-decoration:none}
  .seal-sub a:hover{text-decoration:underline}
  footer{margin-top:2rem;color:#4A5566;font-size:.72rem}
</style></head>
<body><div class="wrap">
  <p class="kicker">Pasaporte Digital de Producto · ESPR</p>
  <h1>${escapeHtml(p.name ?? 'Producto')}</h1>
  ${seal}
  <table><tbody>${dataRows || '<tr><td>Sin datos públicos disponibles.</td></tr>'}</tbody></table>
  ${integrity}
  <footer>1503 · infraestructura de cumplimiento del comercio global</footer>
</div></body></html>`
}
