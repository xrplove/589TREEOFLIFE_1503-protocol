// Bloque 3b.5.3.b — provisiona un usuario operador en auth.users SIN dejar
// fila en public.actors (el operador es staff, no Actor del marketplace).
//
// El trigger handle_new_actor de la migración 001 SÍ inserta una fila en
// public.actors cada vez que se crea un user. Para mantener la cola del
// panel limpia y la naturaleza staff-only del operador, borramos esa fila
// inmediatamente después de crear el usuario.
//
// Uso:
//   node scripts/create-operator.mjs <email>
//
// Si el email ya existe, se reporta y no se crea nada nuevo.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim()]
    }),
)

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: node scripts/create-operator.mjs <email>')
  process.exit(1)
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. ¿Ya existe?
const { data: existingList } = await supabase.auth.admin.listUsers()
const existing = existingList.users.find((u) => (u.email ?? '').toLowerCase() === email)
if (existing) {
  console.log(`El usuario ${email} ya existe (id ${existing.id}). No se hace nada.`)
  // Aún así, comprobamos si tiene fila en actors y la limpiamos por idempotencia.
  const { error: delErr } = await supabase
    .from('actors')
    .delete()
    .eq('user_id', existing.id)
  if (!delErr) console.log('Fila en public.actors limpiada (idempotencia).')
  process.exit(0)
}

// 2. Crear el usuario operador. email_confirm: true → no necesita verificar.
//    user_metadata.role = 'operator' para distinguirlo en el futuro.
console.log(`Creando operador ${email}...`)
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: {
    role: 'operator',
    first_name: 'Operador',
  },
})

if (createErr) {
  console.error('Error creando operador:', createErr.message)
  process.exit(1)
}

const userId = created.user?.id
console.log(`✓ Usuario operador creado: ${userId}`)

// 3. Limpiar la fila de public.actors creada automáticamente por el trigger.
const { error: delErr } = await supabase.from('actors').delete().eq('user_id', userId)
if (delErr) {
  console.error('⚠️ No se pudo borrar la fila de actors:', delErr.message)
  console.error('   El operador queda en auth.users pero con fila parásita en actors.')
  process.exit(1)
}
console.log('✓ Fila parásita en public.actors eliminada.')

// 4. También limpiar consent_log y kyc_review_log si el trigger creó algo.
//    (kyc_review_log SÍ recibe una fila por el trigger handle_email_confirmed
//     porque email_confirm:true poblará email_confirmed_at, que dispara el
//     trigger.)
const { error: logDelErr } = await supabase
  .from('kyc_review_log')
  .delete()
  .eq('actor_user_id', userId)
if (!logDelErr) console.log('✓ Filas en kyc_review_log del operador eliminadas.')

console.log()
console.log('═'.repeat(56))
console.log('Operador provisionado. Próximo paso:')
console.log(`  1. Ir a /operador/login (cuando exista la página)`)
console.log(`  2. Introducir el email: ${email}`)
console.log(`  3. Recibir el magic link en la bandeja y pulsar`)
console.log('═'.repeat(56))
