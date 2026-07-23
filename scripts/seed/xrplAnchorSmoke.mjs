// Prueba de humo del anclaje en XRPL TESTNET. NO toca BD. Dinero de JUGUETE (grifo).
// Ancla un hash de prueba, lo lee de vuelta del ledger y verifica que coincide.
// USO: node --import tsx scripts/seed/xrplAnchorSmoke.mjs

import { anchorHashOnTestnet, verifyAnchorOnTestnet } from '../../app/lib/blockchain/xrplAnchor.ts'

const dummy = 'a1b2c3d4'.repeat(8) // 64 hex de prueba

console.log('· pidiendo wallet al grifo de testnet y anclando el hash de prueba…')
const r = await anchorHashOnTestnet(dummy, { memoType: 'smoke-test' })
console.log('  ✓ anclado · tx:', r.txHash)
console.log('    cuenta testnet:', r.account)
console.log('    explorer:', r.explorerUrl)

console.log('· leyendo la transacción del ledger para verificar…')
const v = await verifyAnchorOnTestnet(r.txHash, dummy)
console.log('  verificado on-ledger:', v.verified, '· memo en cadena:', (v.memoHash ?? '∅').slice(0, 24) + '…')

console.log(v.verified ? '\n✅ testnet OK · el anclaje funciona de punta a punta' : '\n❌ no coincide')
process.exit(v.verified ? 0 : 1)
