// ════════════════════════════════════════════════════════════════════════════
// PASO 1 · SEMBRAR TENANT PILOTO "Artihome SL" en la BD de 1503 (sector inmobiliario)
// ────────────────────────────────────────────────────────────────────────────
// Crea (idempotente) el usuario Auth + actor APROBADO que será el DUEÑO del catálogo
// de Artikalia ingestado por el conector. Imprime su user_id → es el valor de
// CONNECTOR_PILOT_USER_ID que necesita el endpoint /api/connector/ingest.
//
// ⚠️ ESTO SÍ TOCA LA BD VIVA (escribe en auth.users + public.actors). NO lo ejecuta
// Claude solo: se corre CON José delante (su regla). Datos de DEMO etiquetados, sin PII real.
//
// REQUIERE (env · NO hardcodear secretos):
//   NEXT_PUBLIC_SUPABASE_URL      (la URL del proyecto Supabase de 1503)
//   SUPABASE_SERVICE_ROLE_KEY     (service_role · solo servidor)
//
// USO (cuando José dé el go):
//   node scripts/seed/seedArtikaliaPilot.mjs
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const PILOT_EMAIL = 'artihome-pilot@example-demo.com' // DEMO · sin PII real
const PILOT = {
  company_name: 'Artihome SL (Artikalia · piloto demo)',
  entity_kind: 'company',
  country_code: 'ES',
  sector_id: 'inmobiliario',
  role_id: 'inmobiliario_fabricante', // vendedor/fabricante de mueble (ajustable)
  tax_id: 'ESB-DEMO-1503',
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('✗ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function findUserByEmail(email) {
  // Pagina la lista de usuarios buscando el email (la admin API no filtra por email).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < 200) break
  }
  return null
}

async function main() {
  console.log(`· Sembrando tenant piloto: ${PILOT.company_name}`)

  // 1. Usuario Auth (idempotente). El trigger de la mig 004 crea su fila en public.actors.
  let user = await findUserByEmail(PILOT_EMAIL)
  if (user) {
    console.log(`  · usuario ya existe (${user.id}) · no se recrea`)
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: PILOT_EMAIL,
      email_confirm: true,
      user_metadata: {
        entity_kind: PILOT.entity_kind,
        country_code: PILOT.country_code,
        sector_id: PILOT.sector_id,
        role_id: PILOT.role_id,
        company_name: PILOT.company_name,
      },
    })
    if (error) throw error
    user = data.user
    console.log(`  · usuario Auth creado (${user.id})`)
  }

  // 2. Actor APROBADO + datos de empresa (upsert sobre la fila creada por el trigger).
  //    Si el trigger no la creó (entorno sin trigger), se inserta.
  const actorRow = {
    user_id: user.id,
    entity_kind: PILOT.entity_kind,
    country_code: PILOT.country_code,
    sector_id: PILOT.sector_id,
    role_id: PILOT.role_id,
    company_name: PILOT.company_name,
    tax_id: PILOT.tax_id,
    email: PILOT_EMAIL,
    kyc_status: 'approved',
  }
  const { error: upErr } = await sb.from('actors').upsert(actorRow, { onConflict: 'user_id' })
  if (upErr) throw upErr
  console.log(`  · actor aprobado (kyc_status=approved · sector=${PILOT.sector_id})`)

  console.log('\n✔ Tenant piloto listo.')
  console.log('  CONNECTOR_PILOT_USER_ID =', user.id)
  console.log('  → exporta ese valor antes de arrancar el servidor para la ingesta.')
}

main().catch((e) => {
  console.error('✗ Error sembrando el tenant:', e.message ?? e)
  process.exit(1)
})
