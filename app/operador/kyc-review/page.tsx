import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import KycReviewActions from './KycReviewActions'

/**
 * Bloque 3b.5.3.f — panel del operador para revisar altas pendientes.
 *
 * Muestra la cola de Actores con kyc_status = 'pending_kyc' como cards. Cada
 * card incluye datos básicos, logo, lista de docs KYC con signed URLs (1h),
 * snapshot de consents aceptados, y los botones de decisión inline.
 *
 * Server Component que usa el service role para ver todas las filas
 * (bypassa RLS) y para generar signed URLs del bucket privado kyc-docs.
 * El acceso a esta ruta ya está protegido por middleware.ts; aquí asumimos
 * que el caller es operador legítimo.
 */
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1h

type DocMeta = {
  idx?: number
  label?: string
  filename?: string
  path?: string
  mime?: string
  size?: number
}

export default async function KycReviewPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return <ErrorScreen message="Server misconfigured: faltan credenciales Supabase." />
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Cola de pending_kyc, más antiguos primero (FIFO de revisión).
  const { data: actors, error } = await sb
    .from('actors')
    .select(
      'user_id, email, first_name, last_name, company_name, entity_kind, sector_id, role_id, country_code, tax_id, phone, address, postal_code, city, years_in_sector, logo_path, docs_paths, consents, created_at',
    )
    .eq('kyc_status', 'pending_kyc')
    .order('created_at', { ascending: true })

  if (error) {
    return <ErrorScreen message={error.message} />
  }

  const queue = actors ?? []

  // Generar signed URLs para los docs KYC de todos los Actores en paralelo.
  // El logo está en bucket público; basta con su public URL (no requiere firma).
  const enriched = await Promise.all(
    queue.map(async (a) => {
      const docsRaw = (Array.isArray(a.docs_paths) ? a.docs_paths : []) as DocMeta[]
      const signedDocs = await Promise.all(
        docsRaw.map(async (d) => {
          if (!d.path) return null
          const { data, error: signErr } = await sb.storage
            .from('kyc-docs')
            .createSignedUrl(d.path, SIGNED_URL_TTL_SECONDS)
          if (signErr || !data) return null
          return {
            label: d.label ?? d.filename ?? d.path,
            filename: d.filename ?? d.path.split('/').pop() ?? 'archivo',
            mime: d.mime ?? 'application/octet-stream',
            size: d.size ?? null,
            url: data.signedUrl,
          }
        }),
      )

      const logoUrl = a.logo_path
        ? sb.storage.from('logos').getPublicUrl(a.logo_path).data.publicUrl
        : null

      return {
        ...a,
        signedDocs: signedDocs.filter((d): d is NonNullable<typeof d> => d !== null),
        logoUrl,
      }
    }),
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        padding: '6vh 2rem 6rem',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Link href="/" style={topLink}>
            ← 1503
          </Link>
          <span style={eyebrowStyle}>OPERADOR · KYC REVIEW</span>
          <span style={{ minWidth: 1 }} />
        </header>

        <h1 style={titleStyle}>
          Cola de revisión KYC{' '}
          <span style={{ color: '#7A8899', fontWeight: 400 }}>({queue.length})</span>
        </h1>
        <p style={{ ...paraSecondary, marginBottom: '2.5rem' }}>
          Actores con email verificado pendientes de validación documental. Decide
          aprobar, rechazar o suspender. Cada decisión queda registrada en{' '}
          <span style={{ color: '#9FB6CC' }}>kyc_review_log</span>.
        </p>

        {queue.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#7A8899',
              border: '1px dashed #1E2530',
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>◇</div>
            <div style={{ fontSize: '0.95rem' }}>Cola vacía. No hay Actores pendientes de revisión.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {enriched.map((a) => (
              <ActorCard key={a.user_id} actor={a} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function ActorCard({
  actor,
}: {
  actor: {
    user_id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    company_name: string | null
    entity_kind: string | null
    sector_id: string | null
    role_id: string | null
    country_code: string | null
    tax_id: string | null
    phone: string | null
    address: string | null
    postal_code: string | null
    city: string | null
    years_in_sector: string | null
    consents: unknown
    created_at: string
    logoUrl: string | null
    signedDocs: { label: string; filename: string; mime: string; size: number | null; url: string }[]
  }
}) {
  const a = actor
  const acceptedConsents = (() => {
    try {
      const c = a.consents as { accepted?: Record<string, boolean> } | null
      if (!c?.accepted) return []
      return Object.entries(c.accepted)
        .filter(([, v]) => v === true)
        .map(([k]) => k)
    } catch {
      return []
    }
  })()

  return (
    <div
      style={{
        background: 'rgba(14,17,24,0.7)',
        border: '1px solid #1E2530',
        borderRadius: 4,
        padding: '1.75rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 240px',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Datos del Actor */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {a.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.logoUrl}
                alt={`Logo ${a.company_name ?? a.first_name ?? 'Actor'}`}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'contain',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1E2530',
                  borderRadius: 3,
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #1E2530',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: '#4A5566',
                }}
              >
                SIN LOGO
              </div>
            )}
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#E8EDF5' }}>
                {a.company_name?.trim() ||
                  [a.first_name, a.last_name].filter(Boolean).join(' ') ||
                  'Sin nombre'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7A8899', fontFamily: 'var(--font-dm-mono), monospace' }}>
                {a.email}
              </div>
            </div>
          </div>

          <Field label="Tipología legal" value={a.entity_kind} mono />
          <Field label="País" value={a.country_code} mono />
          <Field label="Sector / Rol" value={[a.sector_id, a.role_id].filter(Boolean).join(' · ')} mono />
          <Field label="NIF / Tax ID" value={a.tax_id} />
          <Field label="Representante legal" value={[a.first_name, a.last_name].filter(Boolean).join(' ')} />
          <Field label="Teléfono" value={a.phone} />
          <Field
            label="Dirección"
            value={[a.address, a.postal_code, a.city].filter(Boolean).join(', ')}
          />
          <Field label="Años en sector" value={a.years_in_sector} />
          <Field
            label="Solicitud creada"
            value={new Date(a.created_at).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>

        {/* Acciones */}
        <div style={{ alignSelf: 'start' }}>
          <div style={{ ...labelMono, marginBottom: '0.5rem' }}>Decisión</div>
          <KycReviewActions actorUserId={a.user_id} />
        </div>
      </div>

      {/* Docs KYC */}
      <div style={{ marginTop: '1rem', borderTop: '1px solid #1E2530', paddingTop: '1.25rem' }}>
        <div style={{ ...labelMono, marginBottom: '0.6rem' }}>
          Documentos subidos ({a.signedDocs.length})
        </div>
        {a.signedDocs.length === 0 ? (
          <div style={{ ...mutedSmall, fontStyle: 'italic' }}>
            Este Actor no ha subido documentos KYC.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {a.signedDocs.map((d) => (
              <li
                key={d.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(30,37,48,0.5)',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#E8EDF5',
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      ...mutedSmall,
                      fontFamily: 'var(--font-dm-mono), monospace',
                      fontSize: '0.72rem',
                    }}
                  >
                    {d.filename} · {d.mime}
                    {d.size ? ` · ${(d.size / 1024).toFixed(0)} KB` : ''}
                  </div>
                </div>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: '#00A3FF',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    border: '1px solid rgba(0,163,255,0.4)',
                    padding: '4px 10px',
                    borderRadius: 2,
                  }}
                >
                  Abrir ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Consents */}
      <div style={{ marginTop: '1rem', borderTop: '1px solid #1E2530', paddingTop: '1.25rem' }}>
        <div style={{ ...labelMono, marginBottom: '0.5rem' }}>
          Consentimientos aceptados ({acceptedConsents.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {acceptedConsents.length === 0 ? (
            <div style={{ ...mutedSmall, fontStyle: 'italic' }}>Sin consents registrados.</div>
          ) : (
            acceptedConsents.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  color: '#7BC97B',
                  background: 'rgba(123,201,123,0.08)',
                  border: '1px solid rgba(123,201,123,0.4)',
                  borderRadius: 2,
                  padding: '3px 8px',
                  fontFamily: 'var(--font-dm-mono), monospace',
                }}
              >
                {c}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
      <span
        style={{
          color: '#4A5566',
          minWidth: 130,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-mono), monospace',
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: '#9FB6CC',
          fontFamily: mono ? 'var(--font-dm-mono), monospace' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#FF6B6B',
        padding: '8vh 2rem',
        fontFamily: 'var(--font-chakra-petch), sans-serif',
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1>Error cargando la cola KYC</h1>
        <pre
          style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.4)',
            padding: '1rem',
            borderRadius: 3,
            color: '#FF6B6B',
            fontSize: '0.85rem',
          }}
        >
          {message}
        </pre>
      </div>
    </main>
  )
}

const topLink: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.78rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  textDecoration: 'none',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
  fontWeight: 700,
  color: '#E8EDF5',
  letterSpacing: '0.02em',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  marginBottom: '0.5rem',
}

const paraSecondary: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.92rem',
  lineHeight: 1.7,
}

const labelMono: React.CSSProperties = {
  fontSize: '0.66rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#7A8899',
  fontFamily: 'var(--font-dm-mono), monospace',
}

const mutedSmall: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.85rem',
  lineHeight: 1.6,
}
