// Genera public/icons/globe.svg a partir de los contornos reales de
// public/data/countries-110m.json (Natural Earth simplificado), aplicando
// proyección ortográfica para que parezca un globo 3D plano.
//
// Estilo coherente con WorldGlobeWireframe.tsx de la home:
//   - Líneas: #00A3FF
//   - Rejilla: #1F4F80
//   - Fondo:   #020409
//   - Pulsos:  #F0B429
//
// Ejecutar con:  node scripts/build-globe-icon.mjs

import fs from 'node:fs'
import { feature } from 'topojson-client'

const topo = JSON.parse(
  fs.readFileSync('public/data/countries-110m.json', 'utf-8'),
)
const fc = feature(topo, topo.objects.countries)

// Centro de proyección: lat 25° / lon 15° → muestra Europa, África, Norte de
// Asia y bordes de América. Vista equivalente al globo de la home cuando
// está orientado hacia el "norte global".
const CENTER_LAT = 25
const CENTER_LON = 15
const RADIUS = 112
const CX = 128
const CY = 128

const cLatR = (CENTER_LAT * Math.PI) / 180
const cLonR = (CENTER_LON * Math.PI) / 180
const sinCLat = Math.sin(cLatR)
const cosCLat = Math.cos(cLatR)

/** Proyección ortográfica. Devuelve [x, y] en coordenadas SVG o null si el
 *  punto está en el lado oculto del globo. */
function project(lon, lat) {
  const latR = (lat * Math.PI) / 180
  const lonR = (lon * Math.PI) / 180
  const dLon = lonR - cLonR
  const cosc = sinCLat * Math.sin(latR) + cosCLat * Math.cos(latR) * Math.cos(dLon)
  if (cosc < 0) return null // punto en hemisferio oculto
  const x = Math.cos(latR) * Math.sin(dLon)
  const y = cosCLat * Math.sin(latR) - sinCLat * Math.cos(latR) * Math.cos(dLon)
  return [CX + x * RADIUS, CY - y * RADIUS]
}

const pathStrings = []

for (const f of fc.features) {
  const geom = f.geometry
  if (!geom) continue
  const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates

  for (const polygon of polygons) {
    for (const ring of polygon) {
      let segments = ''
      let lastVisible = false
      for (let i = 0; i < ring.length; i++) {
        const [lon, lat] = ring[i]
        const p = project(lon, lat)
        if (!p) {
          lastVisible = false
          continue
        }
        if (!lastVisible) {
          segments += `M${p[0].toFixed(1)},${p[1].toFixed(1)}`
          lastVisible = true
        } else {
          segments += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
        }
      }
      if (segments) pathStrings.push(segments)
    }
  }
}

const continentPaths = pathStrings
  .map((d) => `    <path d="${d}"/>`)
  .join('\n')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Generado por scripts/build-globe-icon.mjs a partir de
       public/data/countries-110m.json (Natural Earth 110m).
       NO editar a mano — re-ejecutar el script.
       Estilo coherente con WorldGlobeWireframe.tsx de la home. -->
  <defs>
    <clipPath id="globeClip">
      <circle cx="${CX}" cy="${CY}" r="${RADIUS}"/>
    </clipPath>
  </defs>

  <!-- Fondo plano del globo -->
  <circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="#020409"/>

  <!-- Rejilla wireframe (meridianos + paralelos) muy tenue -->
  <g stroke="#1F4F80" stroke-width="0.7" fill="none" opacity="0.55" clip-path="url(#globeClip)">
    <ellipse cx="${CX}" cy="${CY}" rx="22" ry="${RADIUS}"/>
    <ellipse cx="${CX}" cy="${CY}" rx="55" ry="${RADIUS}"/>
    <ellipse cx="${CX}" cy="${CY}" rx="88" ry="${RADIUS}"/>
    <line x1="${CX}" y1="${CY - RADIUS}" x2="${CX}" y2="${CY + RADIUS}"/>
    <line x1="${CX - RADIUS}" y1="${CY}" x2="${CX + RADIUS}" y2="${CY}"/>
    <ellipse cx="${CX}" cy="${CY}" rx="${RADIUS}" ry="25"/>
    <ellipse cx="${CX}" cy="${CY}" rx="${RADIUS}" ry="58"/>
    <ellipse cx="${CX}" cy="${CY}" rx="${RADIUS}" ry="88"/>
  </g>

  <!-- Contornos REALES de países desde TopoJSON Natural Earth 110m -->
  <g stroke="#00A3FF" stroke-width="0.9" fill="none" opacity="0.95" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#globeClip)">
${continentPaths}
  </g>

  <!-- Borde principal del globo, cyan -->
  <circle cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none" stroke="#00A3FF" stroke-width="1.6" opacity="0.7"/>

  <!-- Arcos great-circle dorados (trayectos de comercio 1503) -->
  <g fill="none" stroke="#F0B429" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.5" clip-path="url(#globeClip)">
    <path d="M 50 100 Q 128 30 206 100"/>
    <path d="M 70 170 Q 128 220 196 170"/>
  </g>

  <!-- Pulsos dorados 1503 -->
  <g fill="#F0B429">
    <circle cx="62" cy="100" r="3"/>
    <circle cx="200" cy="92" r="3"/>
    <circle cx="78" cy="170" r="3"/>
    <circle cx="194" cy="170" r="3"/>
    <circle cx="128" cy="55" r="2.5"/>
  </g>

  <!-- Marca 1503 centrada -->
  <g>
    <rect x="60" y="120" width="136" height="22" fill="#020409" fill-opacity="0.82" rx="2"/>
    <text x="128" y="136" text-anchor="middle" fill="#00BFFF" font-family="ui-monospace, monospace" font-size="13" font-weight="700" letter-spacing="3.5">1503</text>
  </g>
</svg>
`

fs.writeFileSync('public/icons/globe.svg', svg)
console.log(
  `Generated public/icons/globe.svg with ${pathStrings.length} country paths from NE110m`,
)

// ── PNG + ICO para Windows .url IconFile ──────────────────────────────
// Windows no acepta SVG en IconFile (de un .url) — necesita .ico real.
// Renderizamos el SVG a PNG con @resvg/resvg-js y empaquetamos como .ico
// (con tamaños 16, 32, 48, 64, 128, 256) usando png-to-ico.
const { Resvg } = await import('@resvg/resvg-js')
const toIco = (await import('png-to-ico')).default

const ICON_SIZES = [16, 32, 48, 64, 128, 256]
const pngBuffers = []

for (const size of ICON_SIZES) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  })
  const png = resvg.render().asPng()
  pngBuffers.push(png)
  if (size === 256) {
    fs.writeFileSync('public/icons/globe.png', png)
  }
}

const icoBuffer = await toIco(pngBuffers)
fs.writeFileSync('public/icons/globe.ico', icoBuffer)
console.log(
  `Generated public/icons/globe.png (256×256) and globe.ico (${ICON_SIZES.join('/')})`,
)
