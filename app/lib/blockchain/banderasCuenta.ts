// ════════════════════════════════════════════════════════════════════════════
// BANDERAS DE CUENTA XRPL · LEÍDAS DE LA FUENTE, NUNCA ESCRITAS A MANO
// ────────────────────────────────────────────────────────────────────────────
// 🔴 POR QUÉ EXISTE ESTE FICHERO (6-ago-2026, y es la lección más cara del día).
//
// Un guion de verificación llevaba estas tres constantes escritas a mano:
//
//     const LSF_ALLOW_TRUSTLINE_LOCKING  = 0x80000000   // ← es CLAWBACK
//     const LSF_ALLOW_TRUSTLINE_CLAWBACK = 0x02000000   // ← no es nada
//
// Los valores REALES son `lsfAllowTrustLineClawback = 0x80000000` y
// `lsfAllowTrustLineLocking = 0x40000000`. Estaban INTERCAMBIADOS, así que el guion
// leía el bit de Clawback y lo anunciaba como Locking: dijo que el emisor oficial de
// RLUSD «admite TokenEscrow y no tiene Clawback» cuando el ledger dice exactamente lo
// contrario, en testnet Y en mainnet (Flags `0x819a0000`).
//
// El daño no fue el guion: fue que su salida se creyó. Con ella se «corrigió» una
// afirmación de `explainer.ts` —el system prompt de Vero— que era CIERTA, y se la
// convirtió en falsa de cara a los usuarios. Una medición mal decodificada es peor
// que no medir: no medir deja la duda, y esto produjo confianza.
//
// De ahí la regla que este módulo hace cumplir: **una constante de protocolo que
// decide dinero no se teclea, se lee de la definición del protocolo**. `xrpl` trae
// `ripple-binary-codec` con `definitions.json`, que es la MISMA tabla con la que se
// serializan las transacciones. Si algún día cambia, cambia aquí sola.
// ════════════════════════════════════════════════════════════════════════════
import definiciones from 'ripple-binary-codec/dist/enums/definitions.json' with { type: 'json' }

const BANDERAS_ACCOUNT_ROOT = (definiciones as { LEDGER_ENTRY_FLAGS: { AccountRoot: Record<string, number> } })
  .LEDGER_ENTRY_FLAGS.AccountRoot

/** Lee una bandera `lsf*` de la tabla del protocolo. Lanza si no existe: fail-closed. */
function bandera(nombre: string): number {
  const v = BANDERAS_ACCOUNT_ROOT[nombre]
  if (typeof v !== 'number') {
    throw new Error(`bandera de cuenta desconocida: ${nombre} (¿cambió definitions.json?)`)
  }
  return v >>> 0
}

/** XLS-85 la EXIGE para poder meter el token de este emisor en un escrow. */
export const LSF_ALLOW_TRUSTLINE_LOCKING = bandera('lsfAllowTrustLineLocking')
/** Incompatible con el escrow de token: si el emisor puede recuperar el token, no se puede bloquear. */
export const LSF_ALLOW_TRUSTLINE_CLAWBACK = bandera('lsfAllowTrustLineClawback')
export const LSF_DEFAULT_RIPPLE = bandera('lsfDefaultRipple')

export type AptitudEscrowToken = {
  /** Valor crudo de `account_data.Flags`. */
  flags: number
  permiteLocking: boolean
  tieneClawback: boolean
  defaultRipple: boolean
  /** ¿Se puede meter el token de este emisor en un escrow XLS-85? */
  admiteTokenEscrow: boolean
  /** Por qué no, en una frase, cuando `admiteTokenEscrow` es false. */
  motivo: string | null
}

/**
 * Traduce las banderas de un emisor a «¿puede su token ir a escrow?».
 *
 * Vive aquí y no en cada guion **precisamente porque la copia a mano fue el fallo**:
 * quien quiera saberlo pregunta, no vuelve a decodificar bits.
 */
export function aptitudEscrowToken(flags: number): AptitudEscrowToken {
  const f = flags >>> 0
  const permiteLocking = Boolean(f & LSF_ALLOW_TRUSTLINE_LOCKING)
  const tieneClawback = Boolean(f & LSF_ALLOW_TRUSTLINE_CLAWBACK)
  const admiteTokenEscrow = permiteLocking && !tieneClawback
  return {
    flags: f,
    permiteLocking,
    tieneClawback,
    defaultRipple: Boolean(f & LSF_DEFAULT_RIPPLE),
    admiteTokenEscrow,
    motivo: admiteTokenEscrow
      ? null
      : !permiteLocking && tieneClawback
        ? 'el emisor no tiene AllowTrustLineLocking (que XLS-85 exige) y sí tiene Clawback (incompatible)'
        : !permiteLocking
          ? 'el emisor no tiene AllowTrustLineLocking, que XLS-85 exige'
          : 'el emisor tiene Clawback, incompatible con el escrow de token',
  }
}
