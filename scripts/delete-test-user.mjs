// One-shot helper: delete a test user from auth.users using the admin API.
// The cascade FK on public.actors removes the corresponding row automatically.
// Run with: node scripts/delete-test-user.mjs <email>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const targetEmail = (process.argv[2] || '').trim().toLowerCase()
if (!targetEmail) {
  console.error('Usage: node scripts/delete-test-user.mjs <email>')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listErr) {
  console.error('listUsers error:', listErr.message)
  process.exit(1)
}

const target = list.users.find(u => (u.email || '').toLowerCase() === targetEmail)
if (!target) {
  console.log(`No user found with email ${targetEmail}. Nothing to delete.`)
  process.exit(0)
}

const { error: delErr } = await admin.auth.admin.deleteUser(target.id)
if (delErr) {
  console.error('deleteUser error:', delErr.message)
  process.exit(1)
}

console.log(`Deleted user ${targetEmail} (id=${target.id}). Cascade removed actors row.`)
