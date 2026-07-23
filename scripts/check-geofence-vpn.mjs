// Inspecciona public.geofence_log centrado en señales de anonimización
// (VPN-1 lite): Tor, proxy, vpn. Resumen últimas 24 h + últimas 30
// decisiones con flags. Utilidad forense/auditoría.
//
// Run with: node scripts/check-geofence-vpn.mjs

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim()]
    }),
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

const { data, error } = await supabase
  .from('geofence_log')
  .select('id, ip_address, detected_country, action_taken, vpn_detected, tor_detected, proxy_detected, user_agent, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Query error:', error.message)
  process.exit(1)
}

console.log('═'.repeat(72))
console.log(`geofence_log — últimas 24 h (${data.length} decisiones)`)
console.log('═'.repeat(72))

const byAction = {}
for (const r of data) byAction[r.action_taken] = (byAction[r.action_taken] ?? 0) + 1
for (const [k, n] of Object.entries(byAction).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`)
}

const tor = data.filter((r) => r.tor_detected)
const vpn = data.filter((r) => r.vpn_detected)
const proxy = data.filter((r) => r.proxy_detected)
console.log()
console.log(`  Tor detectado   : ${tor.length}`)
console.log(`  VPN detectado   : ${vpn.length}`)
console.log(`  Proxy detectado : ${proxy.length}`)

const flagged = data.filter(
  (r) => r.tor_detected || r.vpn_detected || r.proxy_detected,
)
console.log()
console.log('═'.repeat(72))
console.log(`Últimas decisiones con señal de anonimización (${flagged.length})`)
console.log('═'.repeat(72))
for (const r of flagged.slice(0, 30)) {
  const flags = [
    r.tor_detected ? 'TOR' : null,
    r.vpn_detected ? 'VPN' : null,
    r.proxy_detected ? 'PROXY' : null,
  ]
    .filter(Boolean)
    .join('+')
  console.log(
    `  ${r.created_at}  ${String(r.action_taken).padEnd(22)} ` +
      `${String(r.detected_country ?? '∅').padEnd(4)} ${flags.padEnd(13)} ${r.ip_address}`,
  )
}
if (flagged.length === 0) {
  console.log('  (sin señales de anonimización en 24 h — esperado en local sin tráfico real)')
}
