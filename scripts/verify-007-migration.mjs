// Verifica que la migración 007_auth_attempt_log se aplicó correctamente.
// Comprueba: tabla accesible vía service role + garantía append-only
// (UPDATE y DELETE deben ser no-op por las reglas SQL).
//
// Inserta UNA fila sonda marcada (__probe_007__@migration.local). Esa fila
// es inerte: el email nunca será un Actor real, así que su presencia en el
// log no afecta a ningún rate limit real. Por diseño append-only NO se
// puede borrar — queda como prueba viva de la inmutabilidad.
//
// Run with: node scripts/verify-007-migration.mjs

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

const PROBE_EMAIL = '__probe_007__@migration.local'

console.log('═'.repeat(72))
console.log('1. public.auth_attempt_log — accesible vía service role')
console.log('═'.repeat(72))

const { count, error: cErr } = await supabase
  .from('auth_attempt_log')
  .select('*', { count: 'exact', head: true })

if (cErr) {
  console.log('  ❌ Error — ¿migración 007 sin aplicar?:', cErr.message)
  process.exit(1)
}
console.log(`  ✓ Tabla existe y es legible (${count} fila(s) en total)`)

console.log()
console.log('═'.repeat(72))
console.log('2. Garantía append-only (UPDATE / DELETE deben ser no-op)')
console.log('═'.repeat(72))

const { data: inserted, error: iErr } = await supabase
  .from('auth_attempt_log')
  .insert({
    email: PROBE_EMAIL,
    ip_address: null,
    action: 'request_otp',
    outcome: 'error',
    user_agent: 'verify-007-migration probe',
  })
  .select('id, outcome')
  .single()

if (iErr) {
  console.log('  ❌ No se pudo insertar la fila sonda:', iErr.message)
  process.exit(1)
}
console.log(`  ✓ INSERT ok (id ${inserted.id}, outcome=${inserted.outcome})`)

// Intento de UPDATE — la regla auth_attempt_log_no_update debe anularlo.
await supabase
  .from('auth_attempt_log')
  .update({ outcome: 'success' })
  .eq('id', inserted.id)

const { data: afterUpdate } = await supabase
  .from('auth_attempt_log')
  .select('outcome')
  .eq('id', inserted.id)
  .single()

const updateBlocked = afterUpdate?.outcome === 'error'
console.log(
  `  ${updateBlocked ? '✓' : '❌'} UPDATE anulado (outcome sigue '${afterUpdate?.outcome}')`,
)

// Intento de DELETE — la regla auth_attempt_log_no_delete debe anularlo.
await supabase.from('auth_attempt_log').delete().eq('id', inserted.id)

const { data: afterDelete } = await supabase
  .from('auth_attempt_log')
  .select('id')
  .eq('id', inserted.id)
  .maybeSingle()

const deleteBlocked = !!afterDelete
console.log(`  ${deleteBlocked ? '✓' : '❌'} DELETE anulado (la fila sigue presente)`)

console.log()
console.log('═'.repeat(72))
console.log('3. Resumen')
console.log('═'.repeat(72))

const checks = [
  { label: 'Tabla auth_attempt_log accesible', pass: !cErr },
  { label: 'INSERT funciona (service role)', pass: !iErr },
  { label: 'UPDATE bloqueado (regla no_update)', pass: updateBlocked },
  { label: 'DELETE bloqueado (regla no_delete)', pass: deleteBlocked },
]
for (const c of checks) console.log(`  ${c.pass ? '✓' : '❌'} ${c.label}`)

const allPass = checks.every((c) => c.pass)
console.log()
console.log(
  allPass
    ? '🎯 Migración 007 VALIDADA — append-only garantizado'
    : '⚠️ Migración 007 con problemas — revisar arriba',
)
process.exit(allPass ? 0 : 1)
