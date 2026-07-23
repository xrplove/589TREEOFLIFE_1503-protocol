/**
 * Oráculo cross-chain XDC → XRPL — stub para Sprint blockchain-prep.
 *
 * Cuando el Smart LC en XDC valida todos los documentos requeridos, emite
 * un evento on-chain. El oráculo captura el evento y dispara la liberación
 * del Escrow correspondiente en XRPL.
 *
 * Decisión de implementación pendiente (Fase 6-7):
 *
 * Opción A — Chainlink CCIP
 *   ✓ Servicio externo robusto, redundante, auditado
 *   ✗ Coste operacional por mensaje
 *   ✗ Latencia variable (1-15 min)
 *
 * Opción B — Multi-firma 2-de-3 (transitario + comprador + plataforma)
 *   ✓ Sin dependencia externa
 *   ✓ Defensa en profundidad legal
 *   ✗ No automatizado (necesita acción humana)
 *   ✗ Latencia mayor
 *
 * Opción C — Oráculo propio
 *   ✓ Control total
 *   ✗ Concentra clave operativa = punto único de fallo de seguridad
 *   ✗ Si la clave se compromete, todos los escrows pueden ser liberados
 *
 * Recomendación inicial: Opción B + Opción A en cascada (B por defecto,
 * A como fallback automático tras 24h sin acción humana).
 */

import type {
  CrossChainEvent,
  CrossChainOracleProvider,
  WalletAddress,
} from './types'

class NotImplementedYet extends Error {
  constructor(method: string) {
    super(
      `[oracle] ${method} no está implementado todavía. Llega en Fase 6-7 del roadmap. ` +
        `Decisión técnica pendiente entre Chainlink CCIP / multi-firma / oráculo propio.`,
    )
    this.name = 'NotImplementedYet'
  }
}

class CrossChainOracleStub implements CrossChainOracleProvider {
  async watch(_contractAddress: WalletAddress): Promise<void> { throw new NotImplementedYet('watch') }
  async unwatch(_contractAddress: WalletAddress): Promise<void> { throw new NotImplementedYet('unwatch') }
  async retry(_eventId: string): Promise<void> { throw new NotImplementedYet('retry') }
  async getEvents(_filter?: { status?: CrossChainEvent['status'] }): Promise<CrossChainEvent[]> { throw new NotImplementedYet('getEvents') }
}

export const crossChainOracle: CrossChainOracleProvider = new CrossChainOracleStub()
