// E2E: consulta el estado del demo user para el flujo del 13-may.
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

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const DEMO_EMAIL = 'demo@1503.global'

const { data: list } = await sb.auth.admin.listUsers()
const u = list.users.find((x) => x.email === DEMO_EMAIL)

if (!u) {
  console.log(`[!] auth.users NO contiene ${DEMO_EMAIL}`)
  process.exit(0)
}

console.log('auth.users:')
console.log(`  id                : ${u.id}`)
console.log(`  email             : ${u.email}`)
console.log(`  email_confirmed_at: ${u.email_confirmed_at ?? '(NULL)'}`)
console.log(`  last_sign_in_at   : ${u.last_sign_in_at ?? '(NULL)'}`)
console.log()

const { data: actor, error } = await sb
  .from('actors')
  .select('id, user_id, first_name, last_name, company_name, sector_id, sector_chosen_at, kyc_status, created_at')
  .eq('user_id', u.id)
  .maybeSingle()

if (error) {
  console.log(`[!] error consultando actors: ${error.message}`)
  process.exit(1)
}

if (!actor) {
  console.log('public.actors: NO existe fila para este user_id')
} else {
  console.log('public.actors:')
  for (const [k, v] of Object.entries(actor)) console.log(`  ${k.padEnd(18)}: ${v ?? '(NULL)'}`)
}
