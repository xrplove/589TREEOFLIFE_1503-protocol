// ════════════════════════════════════════════════════════════════════════════
// LOS ENLACES AL EXPLORADOR — fuente ÚNICA
// ────────────────────────────────────────────────────────────────────────────
// Un enlace al explorador es lo que convierte «confía en 1503» en «compruébalo
// tú». Por eso no puede construirse a mano en cada pantalla, que es como estaba:
// `https://testnet.xrpl.org/transactions/${x}` aparecía escrito a pelo en más de
// diez sitios, con dos problemas de fondo:
//
//   1. LA RED. El día que el ledger pase a mainnet, cada uno de esos literales
//      seguiría apuntando a testnet y la pantalla enseñaría «la prueba» de una
//      operación mirando a otra red. Aquí la red se decide UNA vez.
//   2. LA VALIDACIÓN. Se enlazaba cualquier cosa que hubiera en la columna. Un
//      hash vacío o mal formado produce un enlace que da 404 **debajo de un
//      texto que dice «anclado on-ledger»**. Un enlace de prueba roto es peor
//      que no tener enlace: delante de un evaluador destruye lo que acredita.
//      Aquí, lo que no se puede probar devuelve `null` y la UI no pinta nada.
//
// 🚨 CUANDO LLEGUE MAINNET, ESTO NO SE CAMBIA SOLO. Una transacción anclada hoy
// en testnet **sigue estando en testnet para siempre**: su enlace debe seguir
// apuntando ahí. Cambiar `XRPL_ACTIVE_NETWORK` sin guardar la red de cada
// anclaje reescribiría el pasado y enlazaría a mainnet pruebas que nunca se
// escribieron ahí. La migración correcta es una columna `network` por anclaje
// (o una fecha de corte); estas funciones ya aceptan la red por parámetro para
// que ese día sea un cambio de datos y no una cacería de literales.
// ════════════════════════════════════════════════════════════════════════════

export type XrplNetwork = 'testnet' | 'mainnet'

/**
 * La red en la que 1503 ancla HOY. Canon del proyecto: **testnet hasta el
 * go-live** (mainnet = Fase 7-8, tras auditoría). No se toca a la ligera.
 */
export const XRPL_ACTIVE_NETWORK: XrplNetwork = 'testnet'

const EXPLORER_BASE: Record<XrplNetwork, string> = {
  testnet: 'https://testnet.xrpl.org',
  mainnet: 'https://livenet.xrpl.org',
}

/**
 * Raíz del explorador de una red. Existe para que los adaptadores que exportan
 * constantes históricas (`XRPL_TESTNET_EXPLORER`) las DERIVEN de aquí en vez de
 * repetir el literal: si no, la «fuente única» tendría dos copias más.
 * Preferir siempre `explorerTxUrl()`, que además valida.
 */
export function explorerBase(network: XrplNetwork = XRPL_ACTIVE_NETWORK): string {
  return EXPLORER_BASE[network]
}

/** Etiqueta legible de la red — para que la pantalla diga SIEMPRE cuál es. */
export const NETWORK_LABEL: Record<XrplNetwork, string> = {
  testnet: 'XRPL testnet',
  mainnet: 'XRPL mainnet',
}

/** Hash de transacción XRPL: 64 hex. */
const TX_HASH_RE = /^[0-9a-fA-F]{64}$/
/** Dirección clásica XRPL (r + base58). No valida el checksum: solo la forma. */
const ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/

/**
 * URL de una transacción. `null` si el hash no tiene forma de hash — así la UI
 * no puede pintar un enlace roto bajo un texto que promete prueba.
 */
export function explorerTxUrl(
  hash: string | null | undefined,
  network: XrplNetwork = XRPL_ACTIVE_NETWORK,
): string | null {
  const h = hash?.trim() ?? ''
  if (!TX_HASH_RE.test(h)) return null
  return `${EXPLORER_BASE[network]}/transactions/${h.toUpperCase()}`
}

/** URL de una cuenta. `null` si no tiene forma de dirección XRPL. */
export function explorerAccountUrl(
  address: string | null | undefined,
  network: XrplNetwork = XRPL_ACTIVE_NETWORK,
): string | null {
  const a = address?.trim() ?? ''
  if (!ADDRESS_RE.test(a)) return null
  return `${EXPLORER_BASE[network]}/accounts/${a}`
}

/** URL de un ledger por índice. `null` si no es un entero positivo. */
export function explorerLedgerUrl(
  index: number | string | null | undefined,
  network: XrplNetwork = XRPL_ACTIVE_NETWORK,
): string | null {
  const n = typeof index === 'number' ? index : Number.parseInt((index ?? '').toString().trim(), 10)
  if (!Number.isInteger(n) || n <= 0) return null
  return `${EXPLORER_BASE[network]}/ledgers/${n}`
}

/**
 * Varias tablas guardan la referencia como `"<algo>:<hash>"` (p. ej. el
 * `ledger_ref` de una liquidación). Se toma el ÚLTIMO segmento y se valida como
 * hash — antes se hacía `.split(':').pop()` a pelo y se enlazaba el resultado
 * fuera lo que fuera.
 */
export function explorerUrlFromLedgerRef(
  ref: string | null | undefined,
  network: XrplNetwork = XRPL_ACTIVE_NETWORK,
): string | null {
  const r = ref?.trim() ?? ''
  if (!r) return null
  return explorerTxUrl(r.split(':').pop(), network)
}
