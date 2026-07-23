// ════════════════════════════════════════════════════════════════════════════
// ANCLAJE DE HASH EN XRPL TESTNET · "verify-on-ledger" del DPP (paso 5 · escalón verde)
// ────────────────────────────────────────────────────────────────────────────
// Ancla el hash canónico (SHA-256) de un DPP en la red de PRUEBAS de XRPL y lo lee
// de vuelta para verificarlo. Es ANCLAJE DE IDENTIDAD (no financiero · 🟢): escribe
// el hash en un Memo de una transacción; no mueve dinero a nadie (solo la comisión
// de red, en XRP de JUGUETE del grifo de testnet).
//
// SEGURIDAD / ALCANCE:
//   · TESTNET only (`wss://s.altnet.rippletest.net:51233`). Cero valor real, cero
//     regulación. Mainnet = Fase 7-8, tras los 3 bloqueantes + auditoría smart-contract.
//   · Único módulo que importa `xrpl` directamente (ports-and-adapters).
// ════════════════════════════════════════════════════════════════════════════

import { Client, type AccountSet, type Wallet } from 'xrpl'

export const XRPL_TESTNET_WSS = 'wss://s.altnet.rippletest.net:51233'
export const XRPL_TESTNET_EXPLORER = 'https://testnet.xrpl.org/transactions'

const toHex = (s: string): string => Buffer.from(s, 'utf8').toString('hex').toUpperCase()

export type AnchorResult = {
  txHash: string
  ledgerIndex: number | undefined
  account: string
  anchoredAt: string // ISO 8601
  explorerUrl: string
}

/**
 * Ancla `hashHex` (64 hex · SHA-256) en testnet vía un AccountSet con Memo.
 * Pide una wallet al grifo (faucet) cada vez — es demo/testnet, sin custodia.
 */
export async function anchorHashOnTestnet(
  hashHex: string,
  opts?: { memoType?: string; client?: Client; wallet?: Wallet },
): Promise<AnchorResult> {
  if (!/^[0-9a-f]{64}$/i.test(hashHex)) throw new Error('hash inválido (se espera 64 hex SHA-256)')

  const client = opts?.client ?? new Client(XRPL_TESTNET_WSS)
  const owns = !opts?.client
  if (!client.isConnected()) await client.connect()
  try {
    const wallet = opts?.wallet ?? (await client.fundWallet()).wallet

    const tx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: wallet.address,
      Memos: [
        {
          Memo: {
            MemoType: toHex(opts?.memoType ?? 'dpp-sha256'),
            MemoData: hashHex.toUpperCase(),
          },
        },
      ],
    }

    const prepared = await client.autofill(tx)
    const signed = wallet.sign(prepared)
    const res = await client.submitAndWait(signed.tx_blob)

    const meta = res.result.meta
    const code = meta && typeof meta === 'object' ? meta.TransactionResult : undefined
    if (code !== 'tesSUCCESS') throw new Error(`transacción no validada en el ledger: ${code ?? 'desconocido'}`)

    const txHash = res.result.hash
    return {
      txHash,
      ledgerIndex: res.result.ledger_index,
      account: wallet.address,
      anchoredAt: new Date().toISOString(),
      explorerUrl: `${XRPL_TESTNET_EXPLORER}/${txHash}`,
    }
  } finally {
    if (owns) await client.disconnect()
  }
}

/**
 * Lee la transacción del ledger de testnet y comprueba que su Memo contiene
 * exactamente `expectedHashHex`. Esto es el "verify-on-ledger": la prueba de que
 * el hash está anclado de verdad, leída desde la cadena (no de nuestra BD).
 */
export async function verifyAnchorOnTestnet(
  txHash: string,
  expectedHashHex: string,
  opts?: { client?: Client },
): Promise<{ verified: boolean; memoHash: string | null; ledgerIndex: number | undefined }> {
  const client = opts?.client ?? new Client(XRPL_TESTNET_WSS)
  const owns = !opts?.client
  if (!client.isConnected()) await client.connect()
  try {
    const res = await client.request({ command: 'tx', transaction: txHash })
    const r = res.result as unknown as {
      Memos?: { Memo?: { MemoData?: string } }[]
      tx_json?: { Memos?: { Memo?: { MemoData?: string } }[] }
      ledger_index?: number
    }
    const memos = r.Memos ?? r.tx_json?.Memos ?? []
    let memoHash: string | null = null
    for (const m of memos) {
      const data = m?.Memo?.MemoData
      if (data) {
        memoHash = String(data).toLowerCase()
        break
      }
    }
    return {
      verified: memoHash !== null && memoHash === expectedHashHex.toLowerCase(),
      memoHash,
      ledgerIndex: r.ledger_index,
    }
  } finally {
    if (owns) await client.disconnect()
  }
}
