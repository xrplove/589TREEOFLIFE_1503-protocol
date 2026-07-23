// E2E: resetea sector_chosen_at del demo user para forzar el paso por /registro/sector.
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
if (!u) { console.error('demo user no existe'); process.exit(1) }

const { data, error } = await sb
  .from('actors')
  .update({ sector_chosen_at: null })
  .eq('user_id', u.id)
  .select('id, sector_id, sector_chosen_at')
  .single()

if (error) { console.error('error update:', error.message); process.exit(1) }

console.log('reset OK:')
console.log(`  id              : ${data.id}`)
console.log(`  sector_id       : ${data.sector_id}`)
console.log(`  sector_chosen_at: ${data.sector_chosen_at ?? '(NULL)'}`)
