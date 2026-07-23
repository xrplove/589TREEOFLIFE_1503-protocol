# How to verify Protocol 1503 in ~5 minutes

This guide lets a reviewer independently confirm the claims in the grant proposal. Two paths: **(A)** verify the public transactions with zero setup, and **(B)** reproduce the flow locally.

---

## A. Zero-setup: verify the on-ledger transactions

Open each transaction on the XRPL testnet explorer (`https://testnet.xrpl.org/transactions/<TX_HASH>`):

| Event | Transaction hash |
|---|---|
| DPP anchoring (verify-on-ledger) | `AA9940C20B09077DA083A55CC509FC4405B9E6385121E3CBD57362B9EDD80978` |
| Escrow — funds lock (`EscrowCreate`) | `23850B7ACCE2D20EB8FB4C003BA1548DF34141C145D5EE897854E41EE3765489` |
| Escrow — release to seller (`EscrowFinish`) | `F596CED1BF8914470FFA52C0F6E422191956680AC9E846E13E4060BA387981A5` |
| Operation accreditation (anchored hash) | `13CAE71A1E0CD860C3774BCAAE43A6883FFFD18875F44636AA01A69179FF3CFA` |

What to look for: the `EscrowCreate`/`EscrowFinish` pair shows funds moving **buyer → escrow → seller**, while the oracle account only pays the network fee — the proof of non-custody.

### XLS‑85 TokenEscrow — settlement in an issued token, not native XRP

| Event | Transaction hash |
|---|---|
| TokenEscrow — lock an issued token (`EscrowCreate`) | `EB569183CB53350EFC0BDCB271F04C5A59B75ECB6FC84F4D6F5ABC22659A24D0` |
| TokenEscrow — release to seller (`EscrowFinish`) | `9A44384FB992C0F1E9730282891DC8A7DF58F25DE818D2BE16AD2F8AF6812467` |

What to look for: the escrowed `Amount` is an **IOU** `{currency: RLUSD, issuer, value: "15"}`, not XRP. Our issuer sets `AllowTrustLineLocking` (XLS‑85, `asf 17`); the seller's balance moves **`0 → 15`** on the `EscrowFinish`. The oracle **re-derives** the fulfillment (`escrowSecret.ts`, HMAC — never stored) to release it — the buyer holds the funds but cannot self-release.

**On the issuer (full transparency):** the token carries the `RLUSD` currency code but is issued by *our own test account*, not Ripple's canonical RLUSD issuer. XLS‑85 requires the **issuer** to enable `AllowTrustLineLocking`, and Ripple's official RLUSD testnet issuer (`rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`, `Domain: ripple.com`) does **not** set that flag today — so canonical RLUSD cannot be escrowed on testnet yet. Verify it yourself:

```bash
curl -s -X POST https://s.altnet.rippletest.net:51234/ -H 'Content-Type: application/json' \
  -d '{"method":"account_info","params":[{"account":"rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV","ledger_index":"validated"}]}'
# Flags lack lsfAllowTrustLineLocking (0x10000000) → real RLUSD is not escrowable on testnet today.
```

The mechanism above is identical for canonical RLUSD; the only change is that issuer flag (or mainnet parity).

---

## B. Reproduce locally

**Prerequisites:** Node.js 22+ and npm. (Node 22 is what CI runs; the `node --test` glob needs it.)

```bash
# 1. Install
npm install

# 2. Run the unit test suite
npm run test:unit
#    Expected: 141/141 passing (compliance engine, DPP, cubing, payment terms, escrow key derivation, connector…)

# 3. Run the escrow smoke test on XRPL testnet (uses the faucet — no credentials, no real funds)
node --import tsx scripts/seed/xrplEscrowSmoke.mjs
#    It funds test wallets, locks 10 XRP in a native escrow with a PREIMAGE-SHA-256
#    crypto-condition, has the oracle reveal the fulfillment, and confirms the seller
#    received the funds. It prints the explorer URLs of the transactions it created.

# 4. Run the RLUSD (XLS-85) TokenEscrow test on XRPL testnet (faucet — no credentials)
node --import tsx scripts/seed/escrowTokenTestnet.mjs
#    Funds an issuer + buyer + seller + oracle, sets AllowTrustLineLocking (XLS-85),
#    locks 15 RLUSD (issued token) in an escrow with the HMAC-derived condition, and
#    has the oracle re-derive the fulfillment to release it. Seller RLUSD: 0 -> 15.
#    Prints the explorer URLs of the transactions it created.

# 5. Run the anchoring smoke test
node --import tsx scripts/seed/xrplAnchorSmoke.mjs
#    Anchors a canonical hash on testnet (AccountSet + Memo) and reads it back from the
#    ledger to prove verify-on-ledger.
```

Every transaction these scripts create is, again, publicly inspectable on `https://testnet.xrpl.org`.

---

## Where to read the core code

| Concern | File |
|---|---|
| DPP hash anchoring + verify-on-ledger | `app/lib/blockchain/xrplAnchor.ts` |
| Native escrow + crypto-condition + backstop | `app/lib/blockchain/xrplEscrow.ts` |
| HMAC-derived escrow condition (no secret at rest) | `app/lib/blockchain/escrowSecret.ts` |
| RLUSD (XLS-85) TokenEscrow — testnet proof | `scripts/seed/escrowTokenTestnet.mjs` |
| Oracle: 3/3 ed25519 custody verification | `app/lib/custodyVerify.ts` |
| Canonical hashing (RFC 8785) | `app/lib/jcsCanonical.ts`, `app/lib/dppHash.ts` |
| Cross-border compliance engine | `app/data/tradeCompliance.ts` |
| Database schema (RLS, append-only) | `supabase/migrations/` |

> Everything here runs on **XRPL testnet** only. Mainnet deployment is gated by the institutional protocol (independent legal review + external security audit).
