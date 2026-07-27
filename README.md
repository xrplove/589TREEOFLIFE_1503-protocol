# Protocol 1503 — Verifiable trade infrastructure on XRP Ledger

> An open, **non-custodial** B2B trade rail that ties the **product**, the **export paperwork**, and the **payment** into a single verifiable operation, anchored on XRP Ledger. The core is **live on XRPL testnet** — including an **XLS‑85 issued-token escrow** (RLUSD‑coded) and the full **XLS‑70 credential lifecycle** — passing **151/151 unit tests**.

This repository contains the source code and the reproducible verification scripts for the XRPL Grants submission of Protocol 1503.

**Live site:** https://1503.global  ·  **Verify the on-ledger proof in ~5 min:** [VERIFY.md](VERIFY.md)

### About this repository

This is a **curated public snapshot** of Protocol 1503's deliverables — MIT-licensed, kept as a **separate repository** from the private working monorepo so that no secrets, credentials or personal data ever reach a public repo. The commit history here reflects that publishing decision, **not** the depth of the work: the private codebase carries **900+ commits** of active development. Read access for technical due diligence is available on request — email **j.soler@1503.global**.

---

## What it is

1503 is the infrastructure layer for international B2B trade — not a marketplace and not a payment gateway. It turns every operation into something **verifiable end to end**, with all personal data kept **off-chain** (only SHA‑256 hashes are anchored on the ledger).

Accreditation is structured into **three seals**:

| Seal | What it guarantees | How |
|---|---|---|
| 🟢 **Product** | Integrity & authenticity of the Digital Product Passport (DPP) | Canonical hash (RFC 8785 / JCS) signed with ed25519, anchored on-ledger; 3/3 custody chain |
| 🆔 **Party** | Corporate identity (KYB) across 177 mapped jurisdictions | XLS‑70 Credentials **(live on testnet — proof below)** · XLS‑80 Permissioned Domains *(roadmap)* |
| 🧾 **Operation** | Payment tied to delivery, non-custodial | Native escrow (PREIMAGE‑SHA‑256 crypto-condition) + `CancelAfter` backstop; issued-token settlement via XLS‑85 TokenEscrow (RLUSD when the issuer enables trustline locking) |

**Non-custodial by design:** funds flow buyer → escrow → seller. 1503 acts as an oracle that verifies delivery and reveals the condition that releases the escrow — it never holds the funds. If it never releases, then once `CancelAfter` passes anyone — the buyer included — can submit an `EscrowCancel` that returns the funds to the buyer.

---

## What runs today (XRPL testnet)

The escrow + oracle + accreditation flow runs end to end on a real demo operation (Spain → Colombia). These transactions are public and verifiable on the testnet explorer:

| Event | Transaction |
|---|---|
| DPP anchoring (verify-on-ledger) | `AA9940C20B09077DA083A55CC509FC4405B9E6385121E3CBD57362B9EDD80978` |
| Escrow — funds lock (EscrowCreate) | `23850B7ACCE2D20EB8FB4C003BA1548DF34141C145D5EE897854E41EE3765489` |
| Escrow — release to seller (EscrowFinish) | `F596CED1BF8914470FFA52C0F6E422191956680AC9E846E13E4060BA387981A5` |
| Operation accreditation (anchored hash) | `13CAE71A1E0CD860C3774BCAAE43A6883FFFD18875F44636AA01A69179FF3CFA` |
| **XLS‑85 TokenEscrow — lock an issued token (EscrowCreate)** | `EB569183CB53350EFC0BDCB271F04C5A59B75ECB6FC84F4D6F5ABC22659A24D0` |
| **XLS‑85 TokenEscrow — release to seller (EscrowFinish)** | `9A44384FB992C0F1E9730282891DC8A7DF58F25DE818D2BE16AD2F8AF6812467` |
| **XLS‑70 credential — issued (`CredentialCreate`)** | `115249BFA0621740DD918EF2D9A13CAD620A4AD76A73A9C544F0BB07C6207A1D` |
| **XLS‑70 credential — accepted by the subject (`CredentialAccept`)** | `058481D297752EB0B5F373B5C63BDD8698E5738A7A23F6A38C3E8A975EE91775` |
| **Agentic payment — `InvoiceID` is the SHA‑256 of the agent's signed attestation (x402 pattern)** | `81B3E736B6B41B9B27C0595055B609923AAEEB684F10747AAF33E4A887594DE9` |

This pair proves the **XLS‑85 TokenEscrow** path: the escrowed `Amount` is an **issued token** (currency code `RLUSD`, from our own test issuer) rather than native XRP, released by the oracle re-deriving the crypto-condition (never stored at rest — see `escrowSecret.ts`). The seller's balance goes `0 → 15` on the `EscrowFinish`.

> **Why a test issuer, not Ripple's canonical RLUSD?** XLS‑85 requires the **issuer** to enable `AllowTrustLineLocking`, and Ripple's official RLUSD testnet issuer (`rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`, `Domain: ripple.com`) does **not** have that flag set — re-checked 27 Jul 2026 — so canonical RLUSD cannot be escrowed on testnet yet. One pitfall when you verify this yourself: that account **does** have `AllowTrustLineClawback` (`0x80000000`) set; the flag XLS‑85 needs is `AllowTrustLineLocking` (`0x40000000`), which is absent. The only change for real RLUSD is that issuer flag (or mainnet parity); our mechanism is identical. Independently verifiable via `account_info` on that address.

The **XLS‑70 credential lifecycle** also runs end to end on testnet: a `1503-KYB` credential is issued (`CredentialCreate`), accepted by the subject (`CredentialAccept`), and verified by a third party reading the ledger alone. **No PII goes on-chain** — the credential URI carries only a SHA‑256 of the off-chain KYB envelope.

Explorer: `https://testnet.xrpl.org/transactions/<TX_HASH>`

See **[VERIFY.md](VERIFY.md)** to reproduce this in ~5 minutes.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict)
- **Supabase** (PostgreSQL · Row-Level Security · Realtime)
- **xrpl 5** for XRP Ledger integration · **@noble/ed25519** / **@noble/hashes** for canonical hashing and signatures
- 40 SQL migrations · CI with typecheck + automated RLS audit

## Repository layout

```
app/                    Application code (Next.js)
  lib/blockchain/       XRPL integration — the grant core
    xrplAnchor.ts       DPP hash anchoring (AccountSet + Memo) + verify-on-ledger
    xrplEscrow.ts       Native escrow: EscrowCreate / EscrowFinish / EscrowCancel + crypto-condition
    xrplCredential.ts   XLS-70 credential lifecycle (issue / accept / third-party verify)
    escrowSecret.ts     HMAC-derived crypto-condition — the oracle's key is re-derived, never stored at rest
  lib/custodyVerify.ts  3/3 ed25519 custody-chain verification (the oracle gate)
  lib/jcsCanonical.ts   RFC 8785 (JCS) canonicalization
  lib/dppHash.ts        Canonical hash + ed25519 signing
  data/tradeCompliance.ts   Compositional cross-border compliance engine
supabase/migrations/    Database schema (RLS-closed, append-only audit logs)
scripts/seed/           Reproducible testnet & verification scripts
scripts/credentials/    XLS-70 credential smoke (kybSmoke.mts)
```

---

## Getting started

```bash
npm install
npm run test:unit        # expect 151/151 passing
```

The testnet smoke scripts need no credentials (they use the XRPL faucet):

```bash
node --import tsx scripts/seed/xrplEscrowSmoke.mjs     # native XRP: lock → oracle verify → release, on testnet
node --import tsx scripts/seed/escrowTokenTestnet.mjs  # RLUSD (XLS-85) TokenEscrow: lock → oracle release, on testnet
node --import tsx scripts/seed/xrplAnchorSmoke.mjs     # anchor a hash and read it back from the ledger
node --import tsx scripts/credentials/kybSmoke.mts     # XLS-70: issue → accept → third-party verify, on testnet
```

For database-backed flows, copy `.env.example` to `.env.local` and fill in your own Supabase keys.

---

## Architecture principles

- **Hybrid on/off-chain:** private data (identities, contracts, prices, documents, PII) lives off-chain with row-level security and append-only logs; **only the SHA‑256 hash travels to the ledger**. GDPR right-to-erasure cascade-deletes the data and leaves the hash orphaned — no re-identification.
- **Native XRPL primitives only:** escrow, credentials, permissioned domains and RLUSD — no custom layer‑1 smart contracts to audit from scratch.
- **One core, a configurable surface:** the indispensable core is the Product seal (DPP) + verifiable settlement; logistics, AI search and translation are configuration-driven adoption accelerators.

## Project status (transparency)

- ✅ **Built (real data in a live database):** DPP (100 products + passports), ed25519 3/3 custody, compliance engine, 3D cubing, ERP connector, role-based desktops.
- 🔵 **Live on testnet:** DPP anchoring, conditional escrow + oracle, operation accreditation, **XLS‑85 TokenEscrow** of an issued token (RLUSD‑coded, our test issuer) released by the oracle's re-derived condition, and the **XLS‑70 credential lifecycle (issue → accept → third-party verify)**.
- 🟣 **Funded roadmap:** tranche splits, **XLS‑80 Permissioned Domains** and wiring the XLS‑70 credential into every KYB decision, ISO 17712 physical seal, **canonical RLUSD settlement** once the issuer enables `AllowTrustLineLocking` / on mainnet, production settlement.

> **On-ledger proof vs. the app — stated plainly.** The transactions listed above are produced by the reproducible scripts and a demo operation (see `VERIFY.md`); that is where on-ledger anchoring and escrow are proven today. Inside the full application, per-order settlement is currently *recorded and verifiable off-chain* while the automatic per-order on-ledger anchoring/release is being wired in (funded roadmap) — so an operation created through the app is not yet auto-anchored on every order. The protocol primitives are identical; what remains is wiring them into every order automatically. We flag this so nothing reads as more finished than it is.

Mainnet deployment follows the institutional protocol of a financial rail: independent legal review, external security audit, and trademark registration.

## License

Released under the **MIT License** — see `LICENSE`. *(Grant deliverables are open-source.)*

## Contact

José Antonio Soler Madrid — Founder & developer · `j.soler@1503.global` · https://1503.global
