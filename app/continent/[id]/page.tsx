import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import CountriesGraph from '../../components/CountriesGraph'
import ContinentMap from '../../components/ContinentMap'
import MiniGlobe from '../../components/MiniGlobe'
import { CONTINENTS, getContinent } from '../../data/continents'
import { ISO_ALPHA2_TO_NUMERIC } from '../../data/isoNumericMap'

export function generateStaticParams() {
  return CONTINENTS.map((c) => ({ id: c.id }))
}

type CountryRestriction = {
  country_code: string
  status: 'allowed' | 'blocked_sanctions' | 'blocked_pending_license' | 'waitlist'
  reason: string | null
}

/**
 * Lee las restricciones de país para los países del continente. Tolerante
 * a fallos: si Supabase está caído o la migración no está aplicada,
 * devuelve {} y el ContinentMap renderiza con el comportamiento previo
 * (todos los países como allowed).
 */
async function fetchRestrictions(codes: string[]): Promise<Record<string, CountryRestriction>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || codes.length === 0) return {}

  try {
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await admin
      .from('country_restrictions')
      .select('country_code, status, reason')
      .in('country_code', codes)
    if (error) {
      console.error('[continent] restrictions fetch failed:', error.message)
      return {}
    }
    const map: Record<string, CountryRestriction> = {}
    for (const row of (data ?? []) as CountryRestriction[]) {
      map[row.country_code] = row
    }
    return map
  } catch (e) {
    console.error('[continent] restrictions fetch crashed:', e)
    return {}
  }
}

export default async function ContinentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const continent = getContinent(id)
  if (!continent) notFound()

  // Si al menos un país del continente tiene mapping a ISO numeric,
  // podemos intentar renderizar el mapa plano. Si no, solo grid.
  const hasMapData = continent.countries.some((c) => ISO_ALPHA2_TO_NUMERIC[c.code])

  // Fetch del estado de restricciones para cada país. SSR — no expone
  // la lógica al cliente.
  const restrictions = await fetchRestrictions(
    continent.countries.map((c) => c.code),
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Mini globo en esquina (solo si hay mapa) */}
      {hasMapData && <MiniGlobe />}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '6vh 2rem 0' }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#7A8899',
              fontSize: '0.78rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              textDecoration: 'none',
            }}
          >
            ← Volver al globo
          </Link>
          <p
            style={{
              color: '#00A3FF',
              fontSize: '0.72rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              margin: 0,
              marginRight: hasMapData ? 150 : 0,
            }}
          >
            1503 · CAPA 2 · CONTINENTE
          </p>
        </div>

        {/* Continent title */}
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 7vw, 5rem)',
              lineHeight: 1,
              margin: 0,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {continent.label}
          </h1>
          <p
            style={{
              marginTop: '0.8em',
              color: '#7A8899',
              fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
            }}
          >
            Mercado regional · {continent.short}
          </p>
        </header>

        {hasMapData && (
          <p
            style={{
              textAlign: 'center',
              color: '#7A8899',
              fontSize: '0.78rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              marginBottom: '1.25rem',
            }}
          >
            Pulsa tu país para registrarte
          </p>
        )}
      </div>

      {/* Mapa plano del continente con polígonos wireframe */}
      {hasMapData && <ContinentMap continent={continent} restrictions={restrictions} />}

      {/* Vista accesible: grid hexagonal (siempre visible, también es fallback) */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem 4rem' }}>
        {hasMapData && (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #1E2530',
            }}
          >
            <p
              style={{
                color: '#4A5566',
                fontSize: '0.72rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                margin: 0,
              }}
            >
              · vista alternativa ·
            </p>
          </div>
        )}
        <CountriesGraph continentLabel={continent.label} countries={continent.countries} />
      </div>
    </main>
  )
}
