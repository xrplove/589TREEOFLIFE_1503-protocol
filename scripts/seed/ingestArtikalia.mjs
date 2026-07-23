// ════════════════════════════════════════════════════════════════════════════
// PASO 1 · INGESTAR el catálogo de Artikalia por el conector (endpoint en vivo)
// ────────────────────────────────────────────────────────────────────────────
// POSTea las 100 fichas (artikalia-100.json) a /api/connector/ingest. El endpoint
// pasa cada una por el gate + acuña DPP + la persiste en `products` bajo el tenant
// piloto. Reporta cuántas entran, cuántas se rebotan y el grado de preparación 2028.
//
// ⚠️ ESTO SÍ TOCA LA BD VIVA (el endpoint escribe en products + dpp_registry).
// Se corre CON José delante. Requiere el servidor levantado con estas env vars:
//   CONNECTOR_INGEST_TOKEN     (el mismo que se manda en el Bearer de aquí)
//   CONNECTOR_PILOT_USER_ID    (el user_id que imprimió seedArtikaliaPilot.mjs)
//   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// USO (cuando José dé el go · servidor arriba):
//   CONNECTOR_INGEST_TOKEN=xxxxx node scripts/seed/ingestArtikalia.mjs
// Opcional: BASE_URL (por defecto http://localhost:3000)
// ════════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const TOKEN = process.env.CONNECTOR_INGEST_TOKEN ?? ''

const catalogo = JSON.parse(readFileSync(join(__dirname, 'artikalia-100.json'), 'utf8'))

const stats = { ok: 0, ready2028: 0, blocked: 0, error: 0 }
const fallos = []

for (const ficha of catalogo) {
  // El campo _demo es interno del generador · no forma parte del DTO canónico.
  const { _demo, ...payload } = ficha
  try {
    const res = await fetch(`${BASE_URL}/api/connector/ingest`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (res.status === 201 && body.ok) {
      stats.ok++
      if (body.espr_2028_readiness?.ready) stats.ready2028++
    } else if (res.status === 422) {
      stats.blocked++
      fallos.push({ sku: ficha.sku, status: 422, motivo: body.error, faltan: (body.blockers ?? []).map((b) => b.field) })
    } else {
      stats.error++
      fallos.push({ sku: ficha.sku, status: res.status, motivo: body.error ?? 'desconocido' })
    }
  } catch (e) {
    stats.error++
    fallos.push({ sku: ficha.sku, status: 'fetch', motivo: e.message })
  }
}

console.log('\n── INGESTA por el conector (endpoint en vivo) ──')
console.log(`  · ingestadas OK: ${stats.ok}/100`)
console.log(`  · de ellas 2028-ready: ${stats.ready2028}`)
console.log(`  · rebotadas por gate (422): ${stats.blocked}`)
console.log(`  · errores: ${stats.error}`)
if (fallos.length) {
  console.log('\n  primeros fallos:')
  for (const f of fallos.slice(0, 5)) console.log('   ·', f.sku, f.status, f.motivo, f.faltan ? `→ faltan: ${f.faltan.join(', ')}` : '')
}
if (stats.error > 0) process.exitCode = 1
