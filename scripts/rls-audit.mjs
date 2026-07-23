// Auditoría de Row-Level Security.
//
// Crea DOS usuarios efímeros (A y B) vía admin API, los autentica con la
// anon key (RLS aplica como ese usuario) y ejecuta una matriz de intentos
// que DEBEN fallar: lectura cross-tenant, escritura en tablas service-only,
// modificación de logs append-only, lectura anónima de PII, acceso a docs
// KYC de otro usuario. Al final borra los usuarios efímeros (FK on delete
// cascade limpia actors/consent_log/kyc_review_log) y los objetos de prueba.
//
// NO es destructivo sobre datos reales: solo toca filas/usuarios que crea
// él mismo. Sale con código != 0 si alguna defensa RLS falla.
//
// Run with: node scripts/rls-audit.mjs

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

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
if (!SB_URL || !ANON || !SERVICE) {
  console.error('Faltan envs (URL / ANON / SERVICE) en .env.local')
  process.exit(1)
}

const admin = createClient(SB_URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ts = Date.now()
const PW = `Rls-Audit-${ts}!`
const emailA = `rls.audit.${ts}.a@example.com`
const emailB = `rls.audit.${ts}.b@example.com`

const results = []
function check(label, pass, detail = '') {
  results.push({ label, pass })
  console.log(`  ${pass ? '✓' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`)
}

let userA, userB
const cleanupObjects = []

async function setup() {
  const { data: a, error: ea } = await admin.auth.admin.createUser({
    email: emailA, password: PW, email_confirm: true,
    user_metadata: { first_name: 'RLS', last_name: 'AuditA', country_code: 'ES' },
  })
  if (ea) throw new Error(`createUser A: ${ea.message}`)
  userA = a.user
  const { data: b, error: eb } = await admin.auth.admin.createUser({
    email: emailB, password: PW, email_confirm: true,
    user_metadata: { first_name: 'RLS', last_name: 'AuditB', country_code: 'ES' },
  })
  if (eb) throw new Error(`createUser B: ${eb.message}`)
  userB = b.user

  // El trigger handle_new_actor crea la fila actors. Sembramos además una
  // fila de consent_log y kyc_review_log de B vía service role para que el
  // test cross-tenant sea significativo (A no debe ver NINGUNA).
  await admin.from('consent_log').insert({
    user_id: userB.id, consents: { probe: true }, ip_address: '0.0.0.0',
    user_agent: 'rls-audit',
  })
  await admin.from('kyc_review_log').insert({
    actor_user_id: userB.id, reviewer_user_id: null,
    previous_status: 'pending_email', new_status: 'pending_kyc', reason: 'rls-audit probe',
  })
  // Documento KYC de B en storage (carpeta = userB.id).
  const kycPath = `${userB.id}/probe.txt`
  await admin.storage.from('kyc-docs').upload(kycPath, new Blob(['secret']), {
    contentType: 'text/plain', upsert: true,
  })
  cleanupObjects.push(['kyc-docs', kycPath])
}

function clientFor() {
  return createClient(SB_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function run() {
  // Cliente autenticado como A
  const cA = clientFor()
  const { error: sErr } = await cA.auth.signInWithPassword({ email: emailA, password: PW })
  if (sErr) throw new Error(`signIn A: ${sErr.message}`)
  // Cliente anónimo (sin sesión)
  const cAnon = clientFor()

  // 1. A lee su propia fila actors → DEBE ver 1
  {
    const { data } = await cA.from('actors').select('user_id').eq('user_id', userA.id)
    check('actors: A lee su propia fila (permitido)', (data?.length ?? 0) === 1)
  }
  // 2. A intenta leer la fila de B → DEBE ver 0
  {
    const { data } = await cA.from('actors').select('user_id').eq('user_id', userB.id)
    check('actors: A NO puede leer la fila de B', (data?.length ?? 0) === 0,
      `filas vistas: ${data?.length ?? 0}`)
  }
  // 3. anon lee actors → DEBE ver 0
  {
    const { data } = await cAnon.from('actors').select('user_id')
    check('actors: anónimo NO puede leer ninguna fila', (data?.length ?? 0) === 0)
  }
  // 4. A lee consent_log de B → 0
  {
    const { data } = await cA.from('consent_log').select('id').eq('user_id', userB.id)
    check('consent_log: A NO ve el de B', (data?.length ?? 0) === 0)
  }
  // 5. A lee kyc_review_log de B → 0
  {
    const { data } = await cA.from('kyc_review_log').select('id').eq('actor_user_id', userB.id)
    check('kyc_review_log: A NO ve el de B', (data?.length ?? 0) === 0)
  }
  // 6. A lee geofence_log (service-only) → 0
  {
    const { data } = await cA.from('geofence_log').select('id').limit(1)
    check('geofence_log: usuario autenticado NO lee (service-only)', (data?.length ?? 0) === 0)
  }
  // 7. A lee auth_attempt_log (service-only) → 0
  {
    const { data } = await cA.from('auth_attempt_log').select('id').limit(1)
    check('auth_attempt_log: usuario autenticado NO lee (service-only)', (data?.length ?? 0) === 0)
  }
  // 8. anon lee waitlist (PII: emails) → 0
  {
    const { data } = await cAnon.from('waitlist').select('email').limit(1)
    check('waitlist: anónimo NO puede leer emails (PII)', (data?.length ?? 0) === 0)
  }
  // 9. A lee country_restrictions (service-only) → 0
  {
    const { data } = await cA.from('country_restrictions').select('country_code').limit(1)
    check('country_restrictions: usuario NO lee (service-only)', (data?.length ?? 0) === 0)
  }
  // 10. A intenta INSERT en kyc_review_log (debe fallar: sin policy insert)
  {
    const { error } = await cA.from('kyc_review_log').insert({
      actor_user_id: userA.id, new_status: 'approved', reason: 'self-approve attempt',
    })
    check('kyc_review_log: A NO puede auto-insertarse una aprobación', !!error,
      error ? 'rechazado' : 'PERMITIÓ INSERT (grave)')
  }
  // 11. A intenta UPDATE de geofence_log (append-only RULE)
  {
    const { error } = await cA.from('geofence_log').update({ action_taken: 'tampered' })
      .eq('action_taken', 'allowed')
    // RULE do-instead-nothing → no error pero 0 efecto; service-only RLS → error.
    const { count } = await admin.from('geofence_log')
      .select('*', { count: 'exact', head: true }).eq('action_taken', 'tampered')
    check('geofence_log: A NO puede alterar el log', (count ?? 0) === 0,
      error ? 'rechazado por RLS' : 'sin efecto (RULE)')
  }
  // 12. A intenta DELETE de su consent_log (sin policy delete)
  {
    await admin.from('consent_log').insert({
      user_id: userA.id, consents: { probe: 'A' }, ip_address: '0.0.0.0', user_agent: 'rls-audit',
    })
    await cA.from('consent_log').delete().eq('user_id', userA.id)
    const { count } = await admin.from('consent_log')
      .select('*', { count: 'exact', head: true }).eq('user_id', userA.id)
    check('consent_log: A NO puede borrar su propio log (append-only)', (count ?? 0) >= 1)
  }
  // 13. A intenta re-parentar su fila actors a B (smell: update sin with check)
  {
    await cA.from('actors').update({ user_id: userB.id }).eq('user_id', userA.id)
    const { data } = await admin.from('actors').select('user_id').eq('user_id', userA.id)
    const stillOwned = (data?.length ?? 0) === 1
    check('actors: A NO puede re-parentar su fila a B (update sin with check)',
      stillOwned, stillOwned ? 'fila intacta' : 'FILA RE-PARENTADA — falta WITH CHECK')
  }
  // 14. A intenta leer el doc KYC de B en storage → debe fallar
  {
    const { data, error } = await cA.storage.from('kyc-docs').download(`${userB.id}/probe.txt`)
    check('storage kyc-docs: A NO puede descargar el doc de B', !data && !!error,
      error ? 'rechazado' : 'DESCARGÓ EL DOC DE B (grave)')
  }
  // 15. A intenta subir a la carpeta KYC de B → debe fallar
  {
    const { error } = await cA.storage.from('kyc-docs')
      .upload(`${userB.id}/intruso.txt`, new Blob(['x']), { upsert: true })
    if (!error) cleanupObjects.push(['kyc-docs', `${userB.id}/intruso.txt`])
    check('storage kyc-docs: A NO puede escribir en la carpeta de B', !!error,
      error ? 'rechazado' : 'SUBIÓ A CARPETA DE B (grave)')
  }
}

async function cleanup() {
  for (const [bucket, path] of cleanupObjects) {
    await admin.storage.from(bucket).remove([path]).catch(() => {})
  }
  if (userA) await admin.auth.admin.deleteUser(userA.id).catch(() => {})
  if (userB) await admin.auth.admin.deleteUser(userB.id).catch(() => {})
}

console.log('═'.repeat(72))
console.log('AUDITORÍA RLS — intentos que DEBEN fallar')
console.log('═'.repeat(72))

let exitCode = 0
try {
  await setup()
  await run()
} catch (e) {
  console.error('\n❌ Error de ejecución:', e.message)
  exitCode = 2
} finally {
  await cleanup()
}

const failed = results.filter((r) => !r.pass)
console.log()
console.log('═'.repeat(72))
if (failed.length === 0 && exitCode === 0) {
  console.log(`🎯 RLS OK — ${results.length}/${results.length} defensas correctas`)
} else {
  console.log(`⚠️  ${failed.length} fallo(s) de ${results.length}:`)
  for (const f of failed) console.log(`   ❌ ${f.label}`)
  exitCode = exitCode || 1
}
process.exit(exitCode)
