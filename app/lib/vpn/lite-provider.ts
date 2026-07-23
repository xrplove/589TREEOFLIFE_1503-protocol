import type {
  VpnDetectInput,
  VpnSignalProvider,
  VpnSignals,
} from './types'

/**
 * LiteProvider — detección gratuita, sin cuenta externa ni base ASN.
 *
 *  - Tor: lista pública de exit-nodes de Tor Project, cacheada en memoria
 *    con TTL (mismo patrón que el cache de países en geofence.ts). Fetch
 *    guardado con promesa única (sin estampida) y FAIL-OPEN: si la lista
 *    no se puede descargar, NO marcamos Tor (mejor no bloquear a un
 *    legítimo que bloquear por un fallo de red nuestro).
 *  - Proxy: heurística de cabeceras (Via / Forwarded / XFF multi-hop).
 *  - VPN: heurística débil (proxy + user-agent automatizado). Señal de
 *    apoyo, no de bloqueo.
 *  - Datacenter: NO se resuelve aquí (requiere base ASN). Queda en false;
 *    lo cubre el futuro MaxMindProvider. Es justo el límite que separa
 *    "lite" de "full" — declarado, no oculto.
 *
 * Edge-compatible: solo usa fetch + Headers, sin APIs de Node.
 */

const TOR_LIST_URL = 'https://check.torproject.org/torbulkexitlist'
const TOR_TTL_MS = 60 * 60 * 1000 // 1 h: la lista cambia despacio

let torSet: Set<string> | null = null
let torExpires = 0
let torInflight: Promise<Set<string>> | null = null

async function fetchTorSet(): Promise<Set<string>> {
  const res = await fetch(TOR_LIST_URL, {
    // Cache del runtime; revalidación la controlamos nosotros por TTL.
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`tor list HTTP ${res.status}`)
  const text = await res.text()
  const set = new Set<string>()
  for (const line of text.split('\n')) {
    const ip = line.trim()
    if (ip && !ip.startsWith('#')) set.add(ip)
  }
  if (set.size === 0) throw new Error('tor list empty')
  return set
}

/** Devuelve el set de IPs Tor. Fail-open: ante error devuelve set vacío
 *  (no marca Tor) y mantiene el cache viejo si lo había. */
async function getTorSet(): Promise<Set<string>> {
  const now = Date.now()
  if (torSet && torExpires > now) return torSet
  if (torInflight) return torInflight

  torInflight = (async () => {
    try {
      const fresh = await fetchTorSet()
      torSet = fresh
      torExpires = Date.now() + TOR_TTL_MS
      return fresh
    } catch (e) {
      console.error('[vpn-lite] tor list fetch failed (fail-open):', e)
      // Si teníamos uno viejo, lo seguimos usando un rato más; si no,
      // set vacío → no se marca Tor (no bloqueamos por fallo nuestro).
      if (torSet) {
        torExpires = Date.now() + 5 * 60 * 1000 // reintenta en 5 min
        return torSet
      }
      return new Set<string>()
    } finally {
      torInflight = null
    }
  })()

  return torInflight
}

const AUTOMATION_UA =
  /\b(curl|wget|python-requests|httpx|aiohttp|go-http-client|scrapy|headlesschrome|phantomjs|puppeteer|playwright|bot|spider|crawler)\b/i

function proxyHeuristics(headers: Headers): { proxy: boolean; reasons: string[] } {
  const reasons: string[] = []

  if (headers.get('via')) reasons.push('header:Via')
  if (headers.get('forwarded')) reasons.push('header:Forwarded')

  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const hops = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (hops.length > 1) reasons.push(`xff-multihop:${hops.length}`)
  }

  // Cabeceras típicas de proxies anonimizadores.
  for (const h of ['proxy-connection', 'x-anonymous', 'x-proxy-id']) {
    if (headers.get(h)) reasons.push(`header:${h}`)
  }

  return { proxy: reasons.length > 0, reasons }
}

export class LiteProvider implements VpnSignalProvider {
  readonly name = 'lite'

  async detect({ ip, headers }: VpnDetectInput): Promise<VpnSignals> {
    const reasons: string[] = []

    // 1. Tor (detección real)
    let tor = false
    if (ip && ip !== '0.0.0.0') {
      const set = await getTorSet()
      if (set.has(ip)) {
        tor = true
        reasons.push('tor:exit-node')
      }
    }

    // 2. Proxy (heurística de cabeceras)
    const { proxy, reasons: proxyReasons } = proxyHeuristics(headers)
    reasons.push(...proxyReasons)

    // 3. VPN (heurística débil de apoyo: proxy + UA automatizado)
    const ua = headers.get('user-agent') ?? ''
    const automated = AUTOMATION_UA.test(ua)
    if (automated) reasons.push('ua:automated')
    const vpn = proxy && automated

    // 4. Datacenter: no resuelto en lite (requiere base ASN → MaxMind).
    const datacenter = false

    return { tor, proxy, vpn, datacenter, reasons }
  }
}
