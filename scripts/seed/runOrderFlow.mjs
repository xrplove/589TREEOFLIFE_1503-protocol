// ════════════════════════════════════════════════════════════════════════════
// PASO 2 · PEDIDO ES→CO en BD + liquidación del 0,5% + documentos adjuntos
// ────────────────────────────────────────────────────────────────────────────
// Sobre los productos ya ingestados (paso 1), crea un pedido REAL en la BD via el
// RPC create_order_with_lines, anota la liquidación (0,5% · SIMULADA) en
// order_settlements y adjunta los 4 documentos (factura/packing/seguro/DUA) en
// order_documents. Deja el "pago" anotado en la BD, no en memoria.
//
// ⚠️ ESCRIBE EN LA BD VIVA (orders, order_lines, order_settlements, order_documents).
// Se corre CON José delante. Requiere las tablas de la mig 043 aplicadas.
//
// USO:  node --import tsx --env-file=.env.local scripts/seed/runOrderFlow.mjs
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { computeGlobalSettlement } from '../../app/lib/connector/globalSettlement.ts'
import { buildTradeDocs } from '../../app/lib/connector/tradeDocs.ts'

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const SELLER_EMAIL = 'artihome-pilot@example-demo.com'
const BUYER_EMAIL = 'importadora-andina@example-demo.com'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const f = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (f) return f
    if (data.users.length < 200) break
  }
  return null
}

async function ensureBuyer() {
  let user = await findUserByEmail(BUYER_EMAIL)
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({
      email: BUYER_EMAIL,
      email_confirm: true,
      user_metadata: { entity_kind: 'company', country_code: 'CO', sector_id: 'inmobiliario', role_id: 'inmobiliario_comprador', company_name: 'Importadora Andina SAS (demo)' },
    })
    if (error) throw error
    user = data.user
  }
  await sb.from('actors').upsert(
    { user_id: user.id, entity_kind: 'company', country_code: 'CO', sector_id: 'inmobiliario', role_id: 'inmobiliario_comprador', company_name: 'Importadora Andina SAS (demo)', email: BUYER_EMAIL, kyc_status: 'approved' },
    { onConflict: 'user_id' },
  )
  return user.id
}

async function main() {
  const seller = await findUserByEmail(SELLER_EMAIL)
  if (!seller) throw new Error('Falta el tenant vendedor (corre seedArtikaliaPilot.mjs)')
  const buyerId = await ensureBuyer()
  console.log(`· vendedor ${seller.id.slice(0, 8)} · comprador ${buyerId.slice(0, 8)}`)

  // 6 productos del vendedor CON medidas de bulto (para cubicaje + docs).
  const { data: prods, error } = await sb
    .from('products')
    .select('id, sku, title, price, currency, hs_code, sector_data')
    .eq('owner_user_id', seller.id)
    .limit(40)
  if (error) throw error
  const conBulto = prods.filter((p) => p.sector_data?.package_length_mm).slice(0, 6)
  if (conBulto.length < 1) throw new Error('No hay productos con medidas de bulto')

  // DPP de cada producto (order_lines.dpp_registry_id).
  const ids = conBulto.map((p) => p.id)
  const { data: dpps } = await sb.from('dpp_registry').select('id, product_id').in('product_id', ids)
  const dppByProduct = Object.fromEntries((dpps ?? []).map((d) => [d.product_id, d.id]))

  const QTYS = [10, 4, 6, 2, 8, 3]
  const lines = conBulto.map((p, i) => ({
    product_id: p.id,
    dpp_registry_id: dppByProduct[p.id] ?? null,
    sku_snapshot: p.sku,
    title_snapshot: p.title,
    quantity: QTYS[i] ?? 2,
    unit_price: p.price,
  }))
  const total = round2(lines.reduce((s, l) => s + l.quantity * l.unit_price, 0))

  // ── Pedido REAL via RPC ──
  const { data: orderId, error: rpcErr } = await sb.rpc('create_order_with_lines', {
    p_buyer_user_id: buyerId,
    p_seller_user_id: seller.id,
    p_origin_country: 'ES',
    p_destination_country: 'CO',
    p_incoterm: 'CIF',
    p_total_amount: total,
    p_currency: 'EUR',
    p_notes: 'Pedido demo · prueba seria conector Artikalia→1503',
    p_created_by: buyerId,
    p_lines: lines,
  })
  if (rpcErr) throw new Error('RPC create_order_with_lines: ' + rpcErr.message)
  console.log(`· pedido creado ${orderId} · ${lines.length} líneas · ${total} EUR`)

  // ── Liquidación 0,5% (simulada) → order_settlements ──
  const s = computeGlobalSettlement({ gross: total, currency: 'EUR', modality: '04_importacion', orderRef: orderId })
  const { error: setErr } = await sb.from('order_settlements').insert({
    order_id: orderId, gross: s.gross, currency: s.currency, modality: s.modality,
    fee_1503: s.fee_1503, net_to_seller: s.net_to_seller, rail: s.rail, status: s.status,
    ledger_ref: s.ledger_ref, verified_on_ledger: s.verified_on_ledger, simulated: true,
  })
  if (setErr) throw new Error('order_settlements: ' + setErr.message)
  console.log(`· liquidación anotada: 0,5% = ${s.fee_1503} EUR · neto ${s.net_to_seller} EUR (${s.status})`)

  // ── Documentos → order_documents ──
  const shipment = {
    reference: orderId.slice(0, 8),
    exporter: { name: 'Artihome SL (Artikalia · demo)', country: 'ES', role: 'exporter', tax_ref: 'ESB-DEMO-1503' },
    importer: { name: 'Importadora Andina SAS (demo)', country: 'CO', role: 'importer' },
    origin_country: 'ES', destination_country: 'CO', incoterm: 'CIF', currency: 'EUR',
  }
  const shipLines = conBulto.map((p, i) => {
    const sd = p.sector_data
    const gross = sd.package_weight_kg ?? 10
    return {
      sku: p.sku, description: p.title?.es ?? p.sku, quantity: QTYS[i] ?? 2, unit_price: p.price, currency: 'EUR',
      hs_code: p.hs_code, origin_country: 'ES', net_weight_kg: round2(gross * 0.9), gross_weight_kg: gross,
      package: { length_mm: sd.package_length_mm, width_mm: sd.package_width_mm, height_mm: sd.package_height_mm, type: sd.package_type ?? 'box' },
    }
  })
  const docs = buildTradeDocs(shipment, shipLines)
  const rows = Object.values(docs).map((d) => ({ order_id: orderId, doc_type: d.doc_type, reference: d.reference, payload: d, demo: true }))
  const { error: docErr } = await sb.from('order_documents').insert(rows)
  if (docErr) throw new Error('order_documents: ' + docErr.message)
  console.log(`· documentos adjuntos: ${rows.map((r) => r.doc_type).join(', ')}`)

  console.log(`\n✔ PASO 2 OK · pedido ${orderId} con pago anotado + 4 documentos en BD.`)
  console.log(`  ORDER_ID=${orderId}`)
}

main().catch((e) => { console.error('✗', e.message ?? e); process.exit(1) })
