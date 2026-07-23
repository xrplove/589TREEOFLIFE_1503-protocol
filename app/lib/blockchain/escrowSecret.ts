// ════════════════════════════════════════════════════════════════════════════
// SECRETO DEL ESCROW · derivación determinista (sin secreto en reposo)
// ────────────────────────────────────────────────────────────────────────────
// El escrow XRPL se cierra con una cripto-condición PREIMAGE-SHA-256: el comprador
// bloquea contra la CONDICIÓN (pública) y solo el ORÁCULO conoce el FULFILLMENT
// (la llave) que la abre en el EscrowFinish (= "documentos conformes", crédito
// documentario UCP 600).
//
// PROBLEMA: en el flujo por UI el escrow se CREA ahora y se LIBERA después (al
// entregar). ¿Dónde vive el fulfillment mientras tanto?
//   · En `escrow_contracts` NO: su RLS deja leer al comprador (participante) → podría
//     sacar la llave y auto-liberarse el escrow saltándose al oráculo.
//   · En una tabla-secreto tampoco hace falta: es un secreto EN REPOSO (superficie).
//
// SOLUCIÓN (esta): el fulfillment NO se guarda — se DERIVA de forma determinista de un
// secreto del servidor (`SERVER_ESCROW_KEY`, solo en .env.local / KMS) + el `escrow_id`:
//     preimage    = HMAC-SHA256(SERVER_ESCROW_KEY, "escrow:<escrow_id>")   (32 bytes)
//     condition   = A0258020 + SHA256(preimage) + 810120                    (pública)
//     fulfillment = A0228020 + preimage                                     (re-derivable solo por el oráculo)
// El oráculo re-calcula el fulfillment al liberar. El comprador NO puede (no tiene la clave).
// Nada secreto en reposo · sin tabla/migración nueva · por `escrow_id` (no colisiona entre operaciones).
//
// Alcance: `SERVER_ESCROW_KEY` va en KMS/HSM en producción (bloqueante de go-live). En testnet,
// .env.local. Rotar la clave invalida la liberación de escrows previos → versionar la clave si se rota.
// Formato de condición/cumplimiento idéntico a xrplEscrow.ts (verificado por escrow_primitive_test.py).
// ════════════════════════════════════════════════════════════════════════════
import { createHmac, createHash } from 'node:crypto'

const COND_PREFIX = 'A0258020'
const COND_SUFFIX = '810120'
const FULF_PREFIX = 'A0228020'

export interface EscrowCondition {
  /** Condición pública — va en el EscrowCreate del comprador. */
  condition: string
  /** Cumplimiento SECRETO — lo re-deriva SOLO el oráculo al liberar (nunca se persiste ni se envía al cliente). */
  fulfillment: string
}

/**
 * Deriva el par condición/cumplimiento de un escrow de forma DETERMINISTA a partir del
 * secreto del servidor y el `escrowId`. Misma entrada → misma salida (el oráculo re-deriva
 * al liberar). Sin `serverKey` lanza (fail-closed: no se crea un escrow que nadie podría abrir).
 */
export function deriveEscrowCondition(escrowId: string, serverKey: string): EscrowCondition {
  if (!serverKey) throw new Error('SERVER_ESCROW_KEY no configurada (fail-closed)')
  if (!escrowId) throw new Error('escrowId requerido')
  const preimage = createHmac('sha256', serverKey).update(`escrow:${escrowId}`).digest() // 32 bytes secretos
  const hash = createHash('sha256').update(preimage).digest('hex').toUpperCase()
  return {
    condition: `${COND_PREFIX}${hash}${COND_SUFFIX}`,
    fulfillment: `${FULF_PREFIX}${preimage.toString('hex').toUpperCase()}`,
  }
}
