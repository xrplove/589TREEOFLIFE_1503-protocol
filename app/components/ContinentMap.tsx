'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { geoAzimuthalEqualArea, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { Continent } from '../data/continents'
import { ISO_ALPHA2_TO_NUMERIC, NUMERIC_TO_ALPHA2 } from '../data/isoNumericMap'
import { CAPITALS } from '../data/capitals'

/**
 * Mapa plano del continente — look wireframe digital, coherente con el
 * globo de la home (WorldGlobeWireframe). Sin banderas: solo contornos
 * vectoriales sobre fondo casi negro.
 *
 * Datos: Natural Earth 50m (world-atlas v2). Incluye micropaíses
 * (Andorra, Mónaco, Liechtenstein, San Marino, Malta, Vaticano) +
 * territorios autónomos (Canarias, Baleares, Sicilia, Córcega...).
 * Kosovo no está en este dataset → se renderiza como hexágono en
 * Pristina.
 *
 * Look "wireframe digital tech":
 *  - Polígonos cyan brillante (#38BDF8) con fill muy tenue. Sin texturas,
 *    sin saturación de banderas. Mismo lenguaje visual que el globo home.
 *  - Hover: borde dorado #F0B429 con glow + atenuación del resto. El
 *    nombre del país aparece grande en el HUD superior central.
 *  - Punto cyan sobre cada capital: target de clic para países pequeños
 *    cuyo polígono sería casi invisible al stroke fino.
 *  - Fade-in escalonado por país (efecto radar).
 *  - Rejilla wireframe sutil de fondo.
 */

const WIDTH = 1100
const HEIGHT = 720
const KOSOVO_HEX_RADIUS = 11

const COLOR_LINE = '#38BDF8' // cyan wireframe subido de tono (más brillante, look holograma)
const COLOR_FILL = 'rgba(56,189,248,0.06)'
const COLOR_FILL_HOVER = 'rgba(240,180,41,0.10)'

// Países bloqueados: atenuados con tinte gris-azul
const COLOR_LINE_BLOCKED = '#3A4050'
const COLOR_FILL_BLOCKED = 'rgba(58,64,80,0.10)'
const COLOR_LINE_BLOCKED_HOVER = '#7A8899'
const COLOR_FILL_BLOCKED_HOVER = 'rgba(122,136,153,0.15)'

export type CountryRestriction = {
  country_code: string
  status: 'allowed' | 'blocked_sanctions' | 'blocked_pending_license' | 'waitlist'
  reason: string | null
}

type Feat = Feature<Polygon | MultiPolygon>

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

export default function ContinentMap({
  continent,
  restrictions = {},
}: {
  continent: Continent
  restrictions?: Record<string, CountryRestriction>
}) {
  const router = useRouter()
  const [features, setFeatures] = useState<Feat[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Helper: ¿está bloqueado este país?
  const isBlocked = (code: string) => {
    const r = restrictions[code]
    return r && r.status !== 'allowed'
  }
  const getStatus = (code: string) => restrictions[code]?.status ?? null

  const allowedNumericIds = useMemo(() => {
    // TopoJSON guarda los IDs con padding ("036") pero algunos datasets los
    // tienen sin padding ("36"). Aceptamos ambos formatos para que países
    // como Australia (036), Argentina (032), Brasil (076), Albania (008)...
    // matcheen correctamente.
    const set = new Set<string>()
    for (const c of continent.countries) {
      const numeric = ISO_ALPHA2_TO_NUMERIC[c.code]
      if (numeric) {
        set.add(numeric)
        set.add(String(parseInt(numeric, 10)))
      }
    }
    return set
  }, [continent])

  useEffect(() => {
    let cancelled = false
    fetch('/data/countries-50m.json')
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return
        const fc = feature(
          topo,
          topo.objects.countries as GeometryCollection,
        ) as unknown as { features: Feat[] }
        const filtered = fc.features.filter((f) => allowedNumericIds.has(String(f.id)))

        // Eliminar polígonos de territorios de ultramar lejanos al continente
        // (p.ej. Guayana Francesa, Groenlandia, Reunión, Aruba...) para que
        // el bounding box de cada país sea su masa principal y la bandera
        // se aplique correctamente. Umbral: 40° angulares desde el centro
        // del continente — conserva Canarias/Baleares/Madeira/Azores.
        const center: [number, number] = [continent.center.lon, continent.center.lat]
        const MAX_DEG_FROM_CENTER = 40

        const cleaned: Feat[] = filtered.map((f) => {
          if (f.geometry.type !== 'MultiPolygon') return f
          const polys = f.geometry.coordinates
          const kept = polys.filter((poly) => {
            const ring = poly[0]
            if (!ring || ring.length === 0) return false
            let sumLon = 0
            let sumLat = 0
            for (const [lon, lat] of ring) {
              sumLon += lon
              sumLat += lat
            }
            const cLon = sumLon / ring.length
            const cLat = sumLat / ring.length
            const dLat = cLat - center[1]
            const dLon = cLon - center[0]
            return Math.sqrt(dLat * dLat + dLon * dLon) < MAX_DEG_FROM_CENTER
          })
          if (kept.length === 0 || kept.length === polys.length) return f
          return {
            ...f,
            geometry: { type: 'MultiPolygon', coordinates: kept },
          }
        })

        setFeatures(cleaned)
        requestAnimationFrame(() => setLoaded(true))
      })
      .catch((e) => console.error('Failed to load TopoJSON', e))
    return () => {
      cancelled = true
    }
  }, [allowedNumericIds, continent.center])

  const projection = useMemo(() => {
    return geoAzimuthalEqualArea()
      .rotate([-continent.center.lon, -continent.center.lat])
      .scale(continent.mapScale)
      .translate([WIDTH / 2, HEIGHT / 2])
      .precision(0.1)
  }, [continent])

  const pathGenerator = useMemo(() => geoPath(projection), [projection])

  // Países sin polígono → punto (solo Kosovo en Europa con NE50m).
  // Solo calculamos orphans CUANDO features ya está cargada, para evitar
  // que durante el primer render todos los países parezcan orphans.
  const orphans = useMemo(() => {
    if (features.length === 0) return []
    const featureIds = new Set(features.map((f) => String(f.id)))
    return continent.countries.filter((c) => {
      const numeric = ISO_ALPHA2_TO_NUMERIC[c.code]
      if (!numeric) return false
      const noPad = String(parseInt(numeric, 10))
      const padded = numeric.padStart(3, '0')
      // Si el feature existe en cualquiera de los dos formatos, NO es orphan.
      return !featureIds.has(noPad) && !featureIds.has(padded) && CAPITALS[c.code]
    })
  }, [continent, features])

  const goRegister = (code: string) => {
    const status = getStatus(code)
    if (status === 'blocked_sanctions') {
      router.push('/restricted/sanctioned')
      return
    }
    if (status === 'blocked_pending_license' || status === 'waitlist') {
      router.push(`/restricted/coming-soon?c=${code}`)
      return
    }
    // allowed (o sin entrada en restrictions): flow normal
    router.push(`/register/${code.toLowerCase()}`)
  }

  const featureToAlpha2 = (f: Feat): string | null => {
    const id = String(f.id)
    const padded = id.padStart(3, '0')
    return NUMERIC_TO_ALPHA2[padded] ?? NUMERIC_TO_ALPHA2[id] ?? null
  }

  const countryName = (code: string): string =>
    continent.countries.find((c) => c.code === code)?.name ?? code

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        background: '#0B0D14',
        borderTop: '1px solid #1E2530',
        borderBottom: '1px solid #1E2530',
        padding: '0.5rem 0',
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          maxHeight: '78vh',
        }}
      >
        <defs>
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="cyanBlur" />
            <feMerge>
              <feMergeNode in="cyanBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity={0.08} stroke="#00A3FF" strokeWidth={0.4}>
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * WIDTH) / 10} y1={0} x2={(i * WIDTH) / 10} y2={HEIGHT} />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * HEIGHT) / 8} x2={WIDTH} y2={(i * HEIGHT) / 8} />
          ))}
        </g>

        {/* Capa de resplandor: los mismos contornos, difuminados detrás → el cian BRILLA */}
        <g
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 800ms ease-out' }}
          filter="url(#cyanGlow)"
          pointerEvents="none"
          aria-hidden
        >
          {features.map((f) => {
            const alpha2 = featureToAlpha2(f)
            if (!alpha2 || isBlocked(alpha2)) return null
            const d = pathGenerator(f)
            if (!d) return null
            return (
              <path
                key={`glow-${alpha2}`}
                d={d}
                fill="none"
                stroke={COLOR_LINE}
                strokeWidth={1.2}
                strokeOpacity={0.85}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </g>

        {/* Países con polígono — wireframe puro, sin banderas */}
        <g style={{ opacity: loaded ? 1 : 0, transition: 'opacity 800ms ease-out' }}>
          {features.map((f, idx) => {
            const alpha2 = featureToAlpha2(f)
            if (!alpha2) return null
            const d = pathGenerator(f)
            if (!d) return null
            const isHovered = hovered === alpha2
            const dim = hovered != null && !isHovered
            const blocked = isBlocked(alpha2)

            // Colores según estado: bloqueado vs allowed
            const baseLine = blocked ? COLOR_LINE_BLOCKED : COLOR_LINE
            const baseFill = blocked ? COLOR_FILL_BLOCKED : COLOR_FILL
            const hoverLine = blocked ? COLOR_LINE_BLOCKED_HOVER : '#F0B429'
            const hoverFill = blocked ? COLOR_FILL_BLOCKED_HOVER : COLOR_FILL_HOVER

            return (
              <path
                key={alpha2}
                d={d}
                fill={isHovered ? hoverFill : baseFill}
                stroke={isHovered ? hoverLine : baseLine}
                strokeWidth={isHovered ? 1.6 : 0.6}
                strokeOpacity={dim ? 0.22 : isHovered ? 1 : blocked ? 0.5 : 0.95}
                fillOpacity={dim ? 0.35 : 1}
                vectorEffect="non-scaling-stroke"
                filter={isHovered && !blocked ? 'url(#goldGlow)' : undefined}
                onMouseEnter={() => setHovered(alpha2)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => goRegister(alpha2)}
                style={{
                  opacity: loaded ? 1 : 0,
                  transition: `opacity 600ms ease-out ${idx * 22}ms, stroke 180ms ease, stroke-width 180ms ease, fill 180ms ease`,
                  cursor: 'pointer',
                }}
              />
            )
          })}
        </g>

        {/* Kosovo (único orphan en NE50m) */}
        <g style={{ opacity: loaded ? 1 : 0, transition: 'opacity 600ms ease-out 700ms' }}>
          {orphans.map((c) => {
            const cap = CAPITALS[c.code]!
            const projected = projection([cap.lon, cap.lat])
            if (!projected) return null
            const [cx, cy] = projected
            const isHovered = hovered === c.code
            const r = isHovered ? KOSOVO_HEX_RADIUS * 1.4 : KOSOVO_HEX_RADIUS
            const dim = hovered != null && !isHovered
            return (
              <polygon
                key={c.code}
                points={hexPoints(cx, cy, r)}
                fill={isHovered ? COLOR_FILL_HOVER : COLOR_FILL}
                stroke={isHovered ? '#F0B429' : COLOR_LINE}
                strokeWidth={isHovered ? 1.4 : 0.7}
                strokeOpacity={dim ? 0.22 : isHovered ? 1 : 0.8}
                fillOpacity={dim ? 0.35 : 1}
                vectorEffect="non-scaling-stroke"
                filter={isHovered ? 'url(#goldGlow)' : undefined}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => goRegister(c.code)}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke 180ms ease, stroke-width 180ms ease, fill 180ms ease',
                }}
              />
            )
          })}
        </g>

        {/* Capital dots — punto cyan clickable sobre cada capital. Garantiza
            target visible para países pequeños cuyo polígono sería casi
            invisible al stroke fino actual (Israel, Líbano, Catar, Baréin,
            Singapur, Hong Kong, Cabo Verde, micropaíses de Oceanía...). */}
        <g style={{ opacity: loaded ? 1 : 0, transition: 'opacity 800ms ease-out 200ms' }}>
          {continent.countries.map((c) => {
            if (!CAPITALS[c.code]) return null
            // Países sin polígono (orphans) ya tienen su hexágono — saltamos.
            const isOrphan = orphans.some((o) => o.code === c.code)
            if (isOrphan) return null
            const cap = CAPITALS[c.code]
            const projected = projection([cap.lon, cap.lat])
            if (!projected) return null
            const [cx, cy] = projected
            const isHovered = hovered === c.code
            const dim = hovered != null && !isHovered
            const blocked = isBlocked(c.code)

            const dotColor = blocked
              ? isHovered ? COLOR_LINE_BLOCKED_HOVER : COLOR_LINE_BLOCKED
              : isHovered ? '#F0B429' : COLOR_LINE

            return (
              <circle
                key={`dot-${c.code}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                fill={dotColor}
                fillOpacity={dim ? 0.25 : blocked ? 0.65 : 0.9}
                stroke={isHovered && !blocked ? '#F0B429' : 'transparent'}
                strokeWidth={1.5}
                filter={isHovered && !blocked ? 'url(#goldGlow)' : undefined}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => goRegister(c.code)}
                style={{
                  cursor: 'pointer',
                  transition: 'r 180ms ease, fill 180ms ease, fill-opacity 180ms ease',
                }}
              />
            )
          })}
        </g>

        {/* HUD nombre del país hovereado — centrado arriba, grande, estilo tech.
            Si el país está bloqueado, el HUD cambia a "PRÓXIMAMENTE" y se
            muestra en gris atenuado en vez de dorado glow. */}
        {(() => {
          const hoveredBlocked = hovered ? isBlocked(hovered) : false
          const hoveredStatus = hovered ? getStatus(hovered) : null
          const eyebrowText = !hovered
            ? 'PASA EL RATÓN POR UN PAÍS'
            : hoveredStatus === 'blocked_sanctions'
              ? `${hovered} · ACCESO RESTRINGIDO`
              : hoveredBlocked
                ? `${hovered} · PRÓXIMAMENTE`
                : `PAÍS · ${hovered}`
          const titleColor = hoveredBlocked ? '#7A8899' : '#F0B429'
          return (
            <g pointerEvents="none" transform={`translate(${WIDTH / 2}, 56)`}>
              <text
                textAnchor="middle"
                fill={hoveredBlocked ? '#7A8899' : '#7A8899'}
                fontSize={12}
                fontFamily="var(--font-dm-mono), monospace"
                letterSpacing="0.32em"
                opacity={hovered ? 0.9 : 0.45}
                style={{ transition: 'opacity 220ms ease' }}
              >
                {eyebrowText}
              </text>
              <text
                textAnchor="middle"
                y={48}
                fill={titleColor}
                fontSize={44}
                fontWeight={700}
                fontFamily="var(--font-chakra-petch), system-ui, sans-serif"
                letterSpacing="0.06em"
                filter={hoveredBlocked ? undefined : 'url(#goldGlow)'}
                opacity={hovered ? 1 : 0}
                style={{ transition: 'opacity 220ms ease' }}
              >
                {hovered ? countryName(hovered).toUpperCase() : ''}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
