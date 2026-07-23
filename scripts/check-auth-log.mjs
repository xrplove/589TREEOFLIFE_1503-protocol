// Inspecciona public.auth_attempt_log: resumen por acción/resultado en las
// últimas 24 h + los últimos 30 intentos. Utilidad de auditoría/forense
// para ver intentos de fuerza bruta o spam de OTP en curso.
//
// Run with: node scripts/check-auth-log.mjs

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
  .from('auth_attempt_log')
  .select('id, email, ip_address, action, outcome, user_agent, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Query error:', error.message)
  process.exit(1)
}

console.log('═'.repeat(72))
console.log(`Resumen auth_attempt_log — últimas 24 h (${data.length} intentos)`)
console.log('═'.repeat(72))

const byKey = {}
for (const r of data) {
  const k = `${r.action} / ${r.outcome}`
  byKey[k] = (byKey[k] ?? 0) + 1
}
for (const [k, n] of Object.entries(byKey).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`)
}

// Señal de alarma: emails o IPs con muchos verify_otp fallidos.
const fails = data.filter(
  (r) => r.action === 'verify_otp' && r.outcome !== 'success',
)
const byEmail = {}
for (const r of fails) byEmail[r.email] = (byEmail[r.email] ?? 0) + 1
const hot = Object.entries(byEmail)
  .filter(([, n]) => n >= 3)
  .sort((a, b) => b[1] - a[1])

if (hot.length) {
  console.log()
  console.log('⚠️  Emails con ≥3 verify_otp fallidos (posible fuerza bruta):')
  for (const [email, n] of hot) console.log(`  ${String(n).padStart(4)}  ${email}`)
}

console.log()
console.log('═'.repeat(72))
console.log('Últimos 30 intentos')
console.log('═'.repeat(72))
for (const r of data.slice(0, 30)) {
  console.log(
    `  ${r.created_at}  ${r.action.padEnd(11)} ${r.outcome.padEnd(13)} ` +
      `${(r.ip_address ?? '∅').padEnd(16)} ${r.email}`,
  )
}
