import { LiteProvider } from './lite-provider'
import type { VpnSignalProvider } from './types'

export type { VpnSignals, VpnSignalProvider, VpnDetectInput } from './types'
export { NO_SIGNALS } from './types'

/**
 * Factory del proveedor de señales VPN.
 *
 * Hoy: LiteProvider (gratis). Cuando exista cuenta MaxMind GeoIP2
 * Anonymous IP, se crea `MaxMindProvider implements VpnSignalProvider` y
 * se cambia SOLO esta función (p. ej. según `process.env.MAXMIND_KEY`).
 * El middleware no se entera.
 */
let _provider: VpnSignalProvider | null = null

export function getVpnProvider(): VpnSignalProvider {
  if (_provider) return _provider
  _provider = new LiteProvider()
  return _provider
}
