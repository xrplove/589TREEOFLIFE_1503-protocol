/**
 * Descarga un fondo-firma por sector desde Wikimedia Commons (método fiable:
 * API generator=search, sin clave). Guarda en public/bg/sector-<id>.jpg y
 * registra licencia + autor para CREDITS.md (cumplimiento). Imágenes muy
 * veladas en el workspace → prima claridad/relevancia sobre arte.
 *
 * Uso: node scripts/fetch-sector-bg.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const UA = '1503-dev/1.0 (workspace background sourcing; contact j.soler@1503.global)'
const OUT = resolve(process.cwd(), 'public/bg')

// término de búsqueda por sector · sesgo a tomas anchas, profesionales, limpias
const SECTORS = {
  automocion: 'automobile assembly line robot factory',
  salud: 'modern hospital building architecture',
  agroalimentario: 'agriculture farmland field harvest',
  transporte: 'container terminal port cargo cranes',
  metalurgico: 'steel mill foundry industry',
  energia: 'solar power plant photovoltaic panels',
  tecnologia: 'data center server room',
  turismo: 'tropical beach resort travel',
  legal: 'courthouse classical columns architecture',
  textil: 'textile factory fabric rolls',
  cultura: 'museum gallery interior architecture',
  institucional: 'parliament government building architecture',
  educacion: 'university campus library architecture',
  medioambiente: 'forest green landscape nature',
  financiero: 'financial district skyscrapers business',
}

const api = (term) =>
  'https://commons.wikimedia.org/w/api.php?format=json&action=query' +
  '&generator=search&gsrnamespace=6&gsrlimit=8' +
  '&gsrsearch=' + encodeURIComponent(term + ' filetype:bitmap') +
  '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1920'

function pick(pages) {
  const arr = Object.values(pages || {})
  // candidatos jpeg, apaisados, anchura útil
  const cands = arr
    .map((p) => ({ p, ii: p.imageinfo?.[0] }))
    .filter((x) => x.ii && /jpeg/.test(x.ii.mime) && x.ii.width >= 1200 && x.ii.width >= x.ii.height)
  return (cands[0] || arr.map((p) => ({ p, ii: p.imageinfo?.[0] })).find((x) => x.ii)) || null
}

const meta = (ii, key) => ii.extmetadata?.[key]?.value?.replace(/<[^>]+>/g, '').trim() || ''

async function run() {
  await mkdir(OUT, { recursive: true })
  const manifest = []
  for (const [id, term] of Object.entries(SECTORS)) {
    try {
      const r = await fetch(api(term), { headers: { 'User-Agent': UA } })
      const j = await r.json()
      const hit = pick(j.query?.pages)
      if (!hit) { console.log(`✗ ${id}: sin candidatos`); continue }
      const ii = hit.ii
      const url = ii.thumburl || ii.url
      const img = await fetch(url, { headers: { 'User-Agent': UA } })
      const buf = Buffer.from(await img.arrayBuffer())
      const file = `sector-${id}.jpg`
      await writeFile(resolve(OUT, file), buf)
      const lic = meta(ii, 'LicenseShortName')
      const artist = meta(ii, 'Artist')
      manifest.push({ id, file, kb: Math.round(buf.length / 1024), title: hit.p.title, license: lic, artist, descurl: ii.descriptionshorturl || ii.descriptionurl || '' })
      console.log(`✓ ${id}: ${file} (${Math.round(buf.length / 1024)} KB) · ${lic || '¿?'}`)
    } catch (e) {
      console.log(`✗ ${id}: ${e.message}`)
    }
  }
  await writeFile(resolve(process.cwd(), 'scripts/bg-manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\nManifest: ${manifest.length}/${Object.keys(SECTORS).length} → scripts/bg-manifest.json`)
}
run()
