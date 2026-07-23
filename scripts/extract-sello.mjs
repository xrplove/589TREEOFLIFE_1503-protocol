// Regenera el SELLO 1503 transparente desde el galeón original de José.
// Corrige el bug del pico: la versión anterior enmascaraba una franja inferior
// demasiado ancha (r 150-236) y se comía el arco inferior del aro exterior.
// Aquí solo se borra el texto "PRO PARK MARKET" (banda radial estrecha) y se
// conserva el marco circular completo (el "pico de abajo").
//
// Uso: node scripts/extract-sello.mjs
import sharp from 'sharp'

const SRC = 'C:/Users/JOSE SOLER/OneDrive/Escritorio/web/galeon.jpeg'
const PUB = 'C:/Users/JOSE SOLER/marketplace-inmobiliario/public'
const OUT = `${PUB}/sello-1503.png`
const PREVIEW = `${PUB}/_sello-preview-dark.png`

const meta = await sharp(SRC).metadata()
const W = meta.width
const H = meta.height
console.log('source:', W, 'x', H)

const rgb = await sharp(SRC).removeAlpha().raw().toBuffer()
const out = Buffer.alloc(W * H * 4)
for (let i = 0; i < W * H; i++) {
  const r = rgb[i * 3]
  const g = rgb[i * 3 + 1]
  const b = rgb[i * 3 + 2]
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  let a = lum * 1.7 // realza líneas tenues
  if (a > 255) a = 255
  if (lum < 16) a = 0 // mata el fondo (textura/estrellas)
  out[i * 4] = r
  out[i * 4 + 1] = g
  out[i * 4 + 2] = b
  out[i * 4 + 3] = Math.round(a)
}

// Centro del sello (ajustable). El aro exterior llega a ~r=248.
const CX = 256
const CY = 255

// Radios (afinables tras revisar el preview):
const RING_OUT = 250 // borde exterior del sello: conservar hasta aquí
const RING_FEATHER = 8 // degradado suave fuera del aro
// Banda del texto "PRO PARK MARKET". Anillo QUIRÚRGICO medido sobre el original
// (luminancia eje vertical): el texto brillante vive en r 183-187, metido entre
// el lazo del banner del 1503 (r 167-175, conservar) y las líneas de abajo del
// aro (r 203-223, conservar). Anillo r 178-198 dentro de los huecos oscuros.
// Solo mitad inferior (y > 388) → no toca el texto superior ni el galeón.
const PPM_RIN = 165
const PPM_ROUT = 200
const PPM_YMIN = 382

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4
    const r = Math.hypot(x - CX, y - CY)
    let m = 1
    // Fuera del sello → transparente (quita la estrellita decorativa y el fondo).
    if (r > RING_OUT) m = 0
    else if (r > RING_OUT - RING_FEATHER) m *= 1 - (r - (RING_OUT - RING_FEATHER)) / RING_FEATHER
    // "PRO PARK MARKET": solo la banda estrecha del texto, en la mitad inferior.
    if (y > PPM_YMIN && r > PPM_RIN && r < PPM_ROUT) m = 0
    out[idx + 3] = Math.round(out[idx + 3] * m)
  }
}

// Sello a tamaño completo, recortado al contenido (trim quita el transparente sobrante).
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toFile(OUT)
const trimmed = await sharp(OUT).trim({ threshold: 10 }).png().toBuffer()
await sharp(trimmed).toFile(OUT)
const m2 = await sharp(OUT).metadata()
console.log('sello-1503.png:', m2.width, 'x', m2.height)

// Preview sobre el fondo oscuro real del hero, para revisar el pico.
await sharp({
  create: { width: m2.width, height: m2.height, channels: 4, background: '#05070d' },
})
  .composite([{ input: OUT }])
  .png()
  .toFile(PREVIEW)
console.log('preview:', PREVIEW)
