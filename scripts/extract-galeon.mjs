// Extrae el galeón (line-art cian sobre fondo oscuro) a PNG transparente.
// Técnica: luminancia → canal alfa (oscuro = transparente, líneas = opacas).
// Uso: node scripts/extract-galeon.mjs
import sharp from 'sharp'

const SRC = 'C:/Users/JOSE SOLER/OneDrive/Escritorio/web/galeon.jpeg'
const OUT_FULL = 'C:/Users/JOSE SOLER/marketplace-inmobiliario/public/_galeon-full-transp.png'

const meta = await sharp(SRC).metadata()
const W = meta.width
const H = meta.height
console.log('source size:', W, 'x', H)

const rgb = await sharp(SRC).removeAlpha().raw().toBuffer()
const out = Buffer.alloc(W * H * 4)
for (let i = 0; i < W * H; i++) {
  const r = rgb[i * 3]
  const g = rgb[i * 3 + 1]
  const b = rgb[i * 3 + 2]
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  let a = lum * 1.7 // realza las líneas tenues
  if (a > 255) a = 255
  if (lum < 16) a = 0 // mata el fondo (textura/estrellas)
  out[i * 4] = r
  out[i * 4 + 1] = g
  out[i * 4 + 2] = b
  out[i * 4 + 3] = Math.round(a)
}

// ── Sello COMPLETO transparente, quitando solo "PRO PARK MARKET" (nombre viejo)
//    + todo lo de fuera del círculo (estrellita decorativa, restos de fondo) ──
const CX = 256
const CY = 256
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4
    const r = Math.hypot(x - CX, y - CY)
    let m = 1
    // Fuera del círculo del sello → transparente (quita la estrellita y el fondo).
    if (r > 250) m = 0
    else if (r > 242) m *= 1 - (r - 242) / 8
    // "PRO PARK MARKET": franja curva inferior del banner.
    if (y > 402 && r > 150 && r < 236) m = 0
    out[idx + 3] = Math.round(out[idx + 3] * m)
  }
}

await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile(OUT_FULL)
console.log('wrote', OUT_FULL)

// Auto-recorte al círculo del sello (lo de fuera ya es transparente).
const PUB = 'C:/Users/JOSE SOLER/marketplace-inmobiliario/public'
const SHIP = `${PUB}/galeon-1503.png`
await sharp(OUT_FULL).trim({ threshold: 10 }).png().toFile(SHIP)
const shipMeta = await sharp(SHIP).metadata()
console.log('seal trimmed:', shipMeta.width, 'x', shipMeta.height)

// Previa sobre fondo oscuro (como irá en el sello)
await sharp({
  create: { width: shipMeta.width, height: shipMeta.height, channels: 4, background: '#05070d' },
})
  .composite([{ input: SHIP }])
  .png()
  .toFile(`${PUB}/_galeon-preview-dark.png`)
console.log('wrote dark preview')
