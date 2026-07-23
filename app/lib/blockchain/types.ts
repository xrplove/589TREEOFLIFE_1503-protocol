/**
 * Tipos e interfaces de dominio para la integración blockchain.
 *
 * Sigue el patrón ports-and-adapters: el código de negocio consume las
 * interfaces de este archivo y nunca importa directamente librerías
 * propietarias (`xrpl`, `ethers`). Esto permite cambiar de chain o de
 * librería en el futuro tocando solo el adapter, sin reescribir el
 * negocio.
 *
 * Arquitectura híbrida (ver `docs/architecture/0001-hybrid-xrpl-xdc.md`):
 * - XRPL = capa de liquidación (escrow + stablecoins · RLUSD rail no-custodial).
 * - XDC  = capa documental (Smart LC + Bills of Lading + ISO 20022).
 * - Oracle = puente cross-chain.
 *
 * SPRINT BLOCKCHAIN-PREP (2026-05-15): este archivo solo define los
 * contratos. La implementación real llega en Fase 6-8 del roadmap.
 */

// ─────────────────────────────────────────────────────────────────────
// Identificadores y unidades
// ─────────────────────────────────────────────────────────────────────

export type Chain = 'xrpl' | 'xdc'

/** Dirección de wallet — formato distinto según chain. */
export type WalletAddress = string

/** Hash de una transacción on-chain (id único en la chain). */
export type TxHash = string

/** Token soportado como medio de pago/colateral en escrow. */
export type Token =
  | { symbol: 'XRP'; chain: 'xrpl' }
  | { symbol: 'RLUSD'; chain: 'xrpl' }
  | { symbol: 'USDC'; chain: 'xrpl' }
  | { symbol: 'EURC'; chain: 'xrpl' }
  | { symbol: 'USDP'; chain: 'xrpl' }
  | { symbol: 'XDC'; chain: 'xdc' }

/** Importe en la unidad más pequeña de la chain (drops en XRPL, wei en XDC). */
export type Amount = bigint

/** Importe expresado en unidad humana (ej. "100.50"). */
export type DecimalAmount = string

// ─────────────────────────────────────────────────────────────────────
// Wallets
// ─────────────────────────────────────────────────────────────────────

export interface Wallet {
  chain: Chain
  address: WalletAddress
  publicKey?: string
}

/**
 * Proveedor de operaciones de wallet. Implementaciones:
 * - XrplWalletAdapter (Fase 7) → usa `xrpl.Wallet`
 * - XdcWalletAdapter (Fase 8) → usa `ethers.Wallet`
 *
 * Modelo no-custodial: la plataforma NO almacena claves privadas. El
 * cliente firma localmente (browser wallet, hardware wallet, o seed
 * cifrada con Owner Key).
 */
export interface WalletProvider {
  generate(): Promise<Wallet>
  fromPublicKey(publicKey: string): Promise<Wallet>
  getBalance(address: WalletAddress, token: Token): Promise<DecimalAmount>
  // Las operaciones de firma quedan en el cliente. Server solo verifica.
  verifySignature(message: string, signature: string, address: WalletAddress): Promise<boolean>
}

// ─────────────────────────────────────────────────────────────────────
// Escrow on-chain (XRPL)
// ─────────────────────────────────────────────────────────────────────

export type EscrowStatus = 'pending' | 'funded' | 'released' | 'returned' | 'expired'

export interface EscrowOperation {
  id: string                    // UUID propio (no del chain)
  chain: 'xrpl'
  buyerAddress: WalletAddress
  sellerAddress: WalletAddress
  token: Token
  amount: DecimalAmount
  status: EscrowStatus
  conditionType: 'time' | 'crypto-condition' | 'oracle'
  conditionPayload?: string     // ej. preimagen del SHA-256 o address del oráculo
  releaseTxHash?: TxHash
  fundingTxHash?: TxHash
  createdAt: Date
  expiresAt?: Date
}

export interface EscrowProvider {
  create(params: Omit<EscrowOperation, 'id' | 'status' | 'createdAt' | 'fundingTxHash' | 'releaseTxHash'>): Promise<EscrowOperation>
  fund(escrowId: string, signedTx: string): Promise<TxHash>
  release(escrowId: string, signedTx: string): Promise<TxHash>
  cancel(escrowId: string, signedTx: string): Promise<TxHash>
  getStatus(escrowId: string): Promise<EscrowOperation>
}

// ─────────────────────────────────────────────────────────────────────
// Smart Letters of Credit (XDC)
// ─────────────────────────────────────────────────────────────────────

export type SmartLcStatus = 'draft' | 'issued' | 'documents_pending' | 'validated' | 'rejected' | 'cancelled'

export interface SmartLcParams {
  buyerAddress: WalletAddress      // XDC address
  sellerAddress: WalletAddress     // XDC address
  validatorAddresses: WalletAddress[]  // transitarios autorizados
  goodsDescription: string
  amount: DecimalAmount
  currency: 'EUR' | 'USD'
  expiresAt: Date
  requiredDocuments: Array<'bill_of_lading' | 'commercial_invoice' | 'packing_list' | 'certificate_of_origin' | 'insurance'>
}

export interface SmartLc {
  contractAddress: WalletAddress
  status: SmartLcStatus
  params: SmartLcParams
  documents: BillOfLading[]
  createdAt: Date
}

export interface BillOfLading {
  documentHash: string             // SHA-256 del PDF original
  ipfsCid?: string                 // si subimos el doc cifrado a IPFS
  uploadedBy: WalletAddress
  validatedBy?: WalletAddress
  uploadedAt: Date
  validatedAt?: Date
}

export interface SmartLcProvider {
  deploy(params: SmartLcParams): Promise<SmartLc>
  uploadDocument(contractAddress: WalletAddress, doc: BillOfLading, signedTx: string): Promise<TxHash>
  validateDocument(contractAddress: WalletAddress, docHash: string, signedTx: string): Promise<TxHash>
  getStatus(contractAddress: WalletAddress): Promise<SmartLc>
}

// ─────────────────────────────────────────────────────────────────────
// Cross-chain oracle (XDC → XRPL)
// ─────────────────────────────────────────────────────────────────────

/**
 * El Smart LC en XDC emite un evento cuando todos los documentos están
 * validados. El oráculo cross-chain captura el evento y dispara la
 * liberación del Escrow en XRPL.
 *
 * Tres implementaciones posibles (a evaluar en Fase 6-7):
 * - Chainlink CCIP (servicio externo)
 * - Multi-firma 2-de-3 (operacional, no automatizado)
 * - Oráculo propio (riesgo de seguridad alto, no recomendado)
 */

export interface CrossChainEvent {
  id: string
  sourceChain: 'xdc'
  targetChain: 'xrpl'
  sourceContract: WalletAddress
  sourceTxHash: TxHash
  eventType: 'lc_validated' | 'lc_rejected' | 'lc_cancelled'
  payload: Record<string, unknown>
  targetEscrowId?: string
  status: 'pending' | 'delivered' | 'failed' | 'manual_review'
  attempts: number
  createdAt: Date
  deliveredAt?: Date
}

export interface CrossChainOracleProvider {
  watch(contractAddress: WalletAddress): Promise<void>
  unwatch(contractAddress: WalletAddress): Promise<void>
  retry(eventId: string): Promise<void>
  getEvents(filter?: { status?: CrossChainEvent['status'] }): Promise<CrossChainEvent[]>
}
