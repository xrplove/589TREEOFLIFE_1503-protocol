/**
 * Entry point del módulo blockchain. Re-exporta tipos y proporciona la
 * factory `getBlockchainProvider(chain)` para obtener el adapter correcto.
 *
 * Uso desde el código de negocio:
 *
 *   import { getBlockchainProvider } from '@/lib/blockchain'
 *
 *   const xrpl = getBlockchainProvider('xrpl')
 *   const balance = await xrpl.wallet.getBalance(address, { symbol: 'RLUSD', chain: 'xrpl' })
 *
 * Hasta que se complete la integración real (Fase 7-8), los adapters
 * lanzan NotImplementedYet con un mensaje explicando qué fase activa esa
 * funcionalidad.
 */

export * from './types'
export { xrplAdapter, type XrplAdapter } from './xrpl-adapter'
export { crossChainOracle } from './oracle'

import { xrplAdapter, type XrplAdapter } from './xrpl-adapter'
import type { Chain } from './types'

export function getBlockchainProvider(chain: Chain): XrplAdapter {
  if (chain !== 'xrpl') throw new Error(`Unsupported chain: ${chain as string}`)
  return xrplAdapter
}
