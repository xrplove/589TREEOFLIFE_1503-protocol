/**
 * Adapter XRPL — stub para Sprint blockchain-prep (2026-05-15).
 *
 * Implementación real: Fase 7 del roadmap (verificación de liquidación
 * RLUSD en el ledger · escrow nativo · no-custodial).
 *
 * Cuando se implemente usará la librería oficial `xrpl` (XRPL Labs).
 * El adapter convierte llamadas genéricas (WalletProvider, EscrowProvider)
 * a llamadas concretas de la API XRPL.
 *
 * Patrón de uso:
 *   import { getXrplProvider } from '@/lib/blockchain'
 *   const provider = getXrplProvider()
 *   const wallet = await provider.wallet.generate()
 *
 * Endpoints XRPL recomendados:
 * - Testnet: wss://s.altnet.rippletest.net:51233
 * - Mainnet (futuro): wss://xrplcluster.com
 */

import type {
  Wallet,
  WalletProvider,
  WalletAddress,
  Token,
  DecimalAmount,
  EscrowProvider,
  EscrowOperation,
  TxHash,
} from './types'

class NotImplementedYet extends Error {
  constructor(method: string) {
    super(
      `[xrpl-adapter] ${method} no está implementado todavía. Llega en Fase 7 del roadmap (Q4 2026 / Q1 2027). ` +
        `Ver docs/architecture/0002-blockchain-integration.md.`,
    )
    this.name = 'NotImplementedYet'
  }
}

class XrplWalletStub implements WalletProvider {
  async generate(): Promise<Wallet> { throw new NotImplementedYet('wallet.generate') }
  async fromPublicKey(_publicKey: string): Promise<Wallet> { throw new NotImplementedYet('wallet.fromPublicKey') }
  async getBalance(_address: WalletAddress, _token: Token): Promise<DecimalAmount> { throw new NotImplementedYet('wallet.getBalance') }
  async verifySignature(_message: string, _signature: string, _address: WalletAddress): Promise<boolean> { throw new NotImplementedYet('wallet.verifySignature') }
}

class XrplEscrowStub implements EscrowProvider {
  async create(_params: Omit<EscrowOperation, 'id' | 'status' | 'createdAt' | 'fundingTxHash' | 'releaseTxHash'>): Promise<EscrowOperation> { throw new NotImplementedYet('escrow.create') }
  async fund(_escrowId: string, _signedTx: string): Promise<TxHash> { throw new NotImplementedYet('escrow.fund') }
  async release(_escrowId: string, _signedTx: string): Promise<TxHash> { throw new NotImplementedYet('escrow.release') }
  async cancel(_escrowId: string, _signedTx: string): Promise<TxHash> { throw new NotImplementedYet('escrow.cancel') }
  async getStatus(_escrowId: string): Promise<EscrowOperation> { throw new NotImplementedYet('escrow.getStatus') }
}

export const xrplAdapter = {
  chain: 'xrpl' as const,
  wallet: new XrplWalletStub(),
  escrow: new XrplEscrowStub(),
}

export type XrplAdapter = typeof xrplAdapter
