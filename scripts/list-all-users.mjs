// Lista todos los usuarios actuales para diagnosticar qué se creó.
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

const { data } = await supabase.auth.admin.listUsers()
console.log(`Total usuarios en auth.users: ${data.users.length}`)
console.log()
for (const u of data.users) {
  console.log(`  ${u.id}`)
  console.log(`    email             : ${u.email}`)
  console.log(`    created_at        : ${u.created_at}`)
  console.log(`    email_confirmed_at: ${u.email_confirmed_at ?? '(NULL)'}`)
  console.log()
}
