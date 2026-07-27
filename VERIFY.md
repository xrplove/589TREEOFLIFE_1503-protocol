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

**On the issuer (full transparency):** the token carries the `RLUSD` currency code but is issued by *our own test account*, not Ripple's canonical RLUSD issuer. XLS‑85 requires the **issuer** to enable `AllowTrustLineLocking`, and Ripple's official RLUSD testnet issuer (`rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`, `Domain: ripple.com`) does **not** set that flag — re-checked 2026‑07‑27 — so canonical RLUSD cannot be escrowed on testnet yet. Verify it yourself:

```bash
curl -s -X POST https://s.altnet.rippletest.net:51234/ -H 'Content-Type: application/json' \
  -d '{"method":"account_info","params":[{"account":"rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV","ledger_index":"validated"}]}'
# Look for lsfAllowTrustLineLocking = 0x40000000 in Flags. As of 2026-07-27, Flags = 0x819A0000:
# AllowTrustLineClawback (0x80000000) IS set — do not mistake it for Locking — while
# AllowTrustLineLocking (0x40000000) is NOT → real RLUSD is not escrowable on testnet today.
```

The mechanism above is identical for canonical RLUSD; the only change is that issuer flag (or mainnet parity).

### XLS‑70 Credentials — the Party seal on-ledger

| Event | Transaction hash |
|---|---|
| Credential issued (`CredentialCreate`) | `115249BFA0621740DD918EF2D9A13CAD620A4AD76A73A9C544F0BB07C6207A1D` |
| Credential accepted by the subject (`CredentialAccept`) | `058481D297752EB0B5F373B5C63BDD8698E5738A7A23F6A38C3E8A975EE91775` |

What to look for: both transactions carry `CredentialType = 313530332D4B5942` — hex for **`1503-KYB`**. The credential's URI embeds only a SHA‑256 of the off-chain KYB envelope: **no PII on-chain**. A third party can confirm the credential exists and was accepted by reading the ledger alone.

### Agentic payment binding (x402 pattern)

| Event | Transaction hash |
|---|---|
| `Payment` (0.02 XRP) with bound `InvoiceID` | `81B3E736B6B41B9B27C0595055B609923AAEEB684F10747AAF33E4A887594DE9` |

What to look for: the payment's `InvoiceID` (`EA10EA56F42E37E5AF7B411347616F0827542B12088B781EF153E50EA7741FA9`) **is** the SHA‑256 of the agent's ed25519-signed attestation, so the authorization is bound on-chain at payment time — it cannot be re-attributed after the fact. (We share the attestation payload on request so you can recompute the hash yourself.)

---

## B. Reproduce locally

**Prerequisites:** Node.js 22+ and npm. (Node 22 is what CI runs; the `node --test` glob needs it.)

```bash
# 1. Install
npm install

# 2. Run the unit test suite
npm run test:unit
#    Expected: 151/151 passing (compliance engine, DPP, cubing, payment terms, escrow key derivation, connector…)

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

# 6. Run the XLS-70 credential smoke on XRPL testnet (faucet — no credentials)
node --import tsx scripts/credentials/kybSmoke.mts
#    Creates an ephemeral issuer + subject, issues a `1503-KYB` credential, has the
#    subject accept it, and verifies it as a third party reading the ledger.
#    Prints the explorer URLs of the transactions it created.
```

Every transaction these scripts create is, again, publicly inspectable on `https://testnet.xrpl.org`.

---

## Where to read the core code

| Concern | File |
|---|---|
| DPP hash anchoring + verify-on-ledger | `app/lib/blockchain/xrplAnchor.ts` |
| Native escrow + crypto-condition + backstop | `app/lib/blockchain/xrplEscrow.ts` |
| XLS‑70 credential lifecycle | `app/lib/blockchain/xrplCredential.ts` |
| HMAC-derived escrow condition (no secret at rest) | `app/lib/blockchain/escrowSecret.ts` |
| RLUSD (XLS-85) TokenEscrow — testnet proof | `scripts/seed/escrowTokenTestnet.mjs` |
| Oracle: 3/3 ed25519 custody verification | `app/lib/custodyVerify.ts` |
| Canonical hashing (RFC 8785) | `app/lib/jcsCanonical.ts`, `app/lib/dppHash.ts` |
| Cross-border compliance engine | `app/data/tradeCompliance.ts` |
| Database schema (RLS, append-only) | `supabase/migrations/` |

> Everything here runs on **XRPL testnet** only. Mainnet deployment is gated by the institutional protocol (independent legal review + external security audit).
