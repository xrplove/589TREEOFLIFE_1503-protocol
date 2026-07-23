// ════════════════════════════════════════════════════════════════════════════
// GENERADOR DE CATÁLOGO PILOTO · 100 artículos de mueble (Artikalia) · DPP simulado
// ────────────────────────────────────────────────────────────────────────────
// Produce 100 fichas en el DTO canónico del conector (`FichaCanonica`, conector@1.0)
// para la PRUEBA SERIA del flujo Artikalia→1503 (ingesta → pedido → docs → pago).
//
// CANON: datos de DEMO claramente etiquetados (no clientes reales · sin PII). Mezcla
// realista de preparación 2028: ~40% fichas 2028-ready (con todos los campos ESPR),
// el resto legales-hoy pero incompletas para 2028 (el gate las dejará pasar con aviso).
// Determinista (PRNG sembrado) → el catálogo es reproducible entre ejecuciones.
//
// USO (NO aplica nada a BD · solo escribe un JSON para revisar):
//   node scripts/seed/generateArtikalia100.mjs
// Salida: scripts/seed/artikalia-100.json
// ════════════════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── PRNG determinista (mulberry32) · sin Math.random para reproducibilidad ──
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(1503)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const between = (min, max) => Math.round(min + rnd() * (max - min))
const round2 = (n) => Math.round(n * 100) / 100

// ── Datos base de mueble (realistas · HS 9401 asientos / 9403 otros muebles) ──
const TIPOS = [
  { nombre: 'Silla', hs: '940161', baseDim: [480, 520, 880], baseKg: 6, cat: 'asiento' },
  { nombre: 'Sillón', hs: '940161', baseDim: [780, 820, 950], baseKg: 18, cat: 'asiento' },
  { nombre: 'Sofá 2 plazas', hs: '940161', baseDim: [1600, 900, 850], baseKg: 42, cat: 'asiento' },
  { nombre: 'Mesa de comedor', hs: '940360', baseDim: [1800, 950, 760], baseKg: 38, cat: 'mesa' },
  { nombre: 'Mesa de centro', hs: '940360', baseDim: [1100, 600, 420], baseKg: 16, cat: 'mesa' },
  { nombre: 'Armario 2 puertas', hs: '940350', baseDim: [1000, 580, 2000], baseKg: 75, cat: 'almacenaje' },
  { nombre: 'Cómoda', hs: '940350', baseDim: [900, 480, 850], baseKg: 34, cat: 'almacenaje' },
  { nombre: 'Estantería', hs: '940360', baseDim: [800, 320, 1800], baseKg: 28, cat: 'almacenaje' },
  { nombre: 'Cabecero', hs: '940360', baseDim: [1600, 80, 1100], baseKg: 22, cat: 'dormitorio' },
  { nombre: 'Aparador', hs: '940360', baseDim: [1600, 450, 800], baseKg: 46, cat: 'almacenaje' },
]
const MADERAS = [
  { nombre: 'roble macizo', especie: 'Quercus robur', fsc: 'FSC 100%' },
  { nombre: 'pino', especie: 'Pinus sylvestris', fsc: 'FSC Mixto' },
  { nombre: 'haya', especie: 'Fagus sylvatica', fsc: 'PEFC' },
  { nombre: 'nogal', especie: 'Juglans regia', fsc: 'FSC 100%' },
  { nombre: 'MDF chapado', especie: 'tablero MDF E1', fsc: 'PEFC' },
]
const TAPIZADOS = ['tela', 'lino', 'cuero', 'pana', null]
const ACABADOS = ['natural aceitado', 'lacado blanco', 'nogal oscuro', 'barniz mate']
const ORIGENES = ['Valencia (ES)', 'Yecla (ES)', 'Lucena (ES)', 'A Estrada (ES)']
const DURABILIDAD = ['EN 12520 · uso doméstico severo', 'EN 16139 nivel L2 (contract)', 'EN 12521 · doméstico']

function ficha(i) {
  const tipo = pick(TIPOS)
  const madera = pick(TIPOS) && pick(MADERAS)
  const tapizado = tipo.cat === 'asiento' ? pick(TAPIZADOS) : null
  const [L, W, H] = tipo.baseDim.map((d) => Math.max(40, d + between(-60, 80)))
  const pesoKg = round2(tipo.baseKg * (0.85 + rnd() * 0.4))
  const coste = between(40, 480)
  const pvp = round2(coste * 2.9)
  const sku = `ART-${tipo.cat.slice(0, 3).toUpperCase()}-${String(1000 + i)}`

  const materiales = [{ nombre: madera.nombre, porcentaje: tapizado ? 70 : 95 }]
  if (tapizado) materiales.push({ nombre: tapizado, porcentaje: 25 })
  materiales.push({ nombre: 'herrajes acero', porcentaje: 5 })

  const f = {
    contrato_version: 'conector@1.0',
    sku,
    titulo: `${tipo.nombre} ${madera.nombre} ${pick(ACABADOS)}`,
    precio: { valor: pvp, moneda: 'EUR', iva_incluido: true },
    imagenes: [`https://demo.artikalia.example/catalogo/${sku.toLowerCase()}.jpg`],
    certificados: madera.fsc.startsWith('FSC') ? ['FSC', 'CE'] : ['PEFC', 'CE'],
    bulto: {
      largo_mm: L,
      ancho_mm: W,
      alto_mm: H,
      peso_kg: pesoKg,
      apilable: tipo.cat !== 'asiento',
      tipo: pesoKg > 50 ? 'crate' : 'box',
    },
    pais_origen: 'ES',
    pais_fabricacion: 'ES',
    fecha_produccion: `2026-${String(between(1, 6)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
    hs_code: tipo.hs,
    materiales,
  }

  // ~40% 2028-ready (todos los campos ESPR) · el resto legal-hoy pero incompleto 2028.
  const ready2028 = rnd() < 0.4
  if (ready2028) {
    f.espr = {
      origen_madera: `${madera.especie} · ${madera.fsc}`,
      sustancias_preocupantes: { declarado: true, lista: [] },
      durabilidad: pick(DURABILIDAD),
      desmontaje_reparacion: `https://demo.artikalia.example/repair/${sku.toLowerCase()}`,
      recambios: 'Herrajes y tornillería · 10 años',
      reciclabilidad_pct: between(70, 92),
      contenido_reciclado_pct: between(5, 35),
    }
  } else {
    // Parcial: algunos traen ciertos campos pero no todos (realista).
    f.espr = {
      sustancias_preocupantes: { declarado: true, lista: [] },
      reciclabilidad_pct: between(60, 85),
    }
  }
  // Marca DEMO de DPP simulado (el DPP real lo acuña la ingesta del conector).
  f._demo = { tenant: 'artikalia-pilot', dpp_simulado: true, ready2028 }
  return f
}

const catalogo = Array.from({ length: 100 }, (_, i) => ficha(i))
const ready = catalogo.filter((f) => f._demo.ready2028).length

const outDir = join(__dirname)
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, 'artikalia-100.json')
writeFileSync(outFile, JSON.stringify(catalogo, null, 2), 'utf8')

console.log(`✔ Generadas ${catalogo.length} fichas de mueble (demo · Artikalia piloto)`)
console.log(`  · 2028-ready (DPP ESPR completo): ${ready}`)
console.log(`  · legales hoy, incompletas para 2028: ${catalogo.length - ready}`)
console.log(`  · escrito en: ${outFile}`)
console.log(`  · NADA aplicado a BD · es un JSON para revisar y, luego, ingestar por el conector.`)
