import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  fetchPublicActor,
  requireApprovedCaller,
  type PublicActor,
} from '../../lib/actor-public'
import { getServerLang } from '../../lib/server-lang'
import { getWorkspaceStrings, type Lang, type WorkspaceStrings } from '../../data/i18n'
import ChatStartButton from './ChatStartButton'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ActorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const lang = await getServerLang()
  const t = getWorkspaceStrings(lang)
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return <ConfigError t={t} />
  }

  const cookieStore = await cookies()
  const sbAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const caller = await requireApprovedCaller(sbAuth, sbAdmin)
  if (!caller.ok) {
    if (caller.reason === 'unauthenticated') {
      redirect(`/login?next=/actor/${id}`)
    }
    if (caller.reason === 'not_approved') {
      return <KycRequiredScreen t={t} />
    }
    return <DbError t={t} detail={caller.detail} />
  }

  // Excepción de visibilidad: el propio Actor SIEMPRE ve su ficha aunque
  // esté oculta. Otros respetan el opt-out (mig. 015).
  const isSelf = caller.userId === id
  const actor = await fetchPublicActor(sbAdmin, id, { includeHidden: isSelf })
  if (!actor) notFound()
  const trayectoria = await loadReputationSummary(sbAdmin, actor.user_id)
  const avatarUrl = await signAvatarUrl(sbAdmin, actor.public_avatar_path)

  return <ProfileLayout actor={actor} avatarUrl={avatarUrl} isSelf={isSelf} trayectoria={trayectoria} t={t} lang={lang} />
}

/** Genera signed URL temporal del avatar público. NULL si no hay path. */
async function signAvatarUrl(
  sbAdmin: SupabaseClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null
  const { data } = await sbAdmin.storage
    .from('actor-public-avatars')
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

// ─────────────────────────────────────────────────────────────────────
// Trayectoria (Capa 1: tabla vacía → todo "—")
// ─────────────────────────────────────────────────────────────────────

type ReputationSummary = {
  totalEvents: number
  daysActive: number | null
}

async function loadReputationSummary(
  sbAdmin: SupabaseClient,
  userId: string,
): Promise<ReputationSummary> {
  const { count } = await sbAdmin
    .from('actor_reputation_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return {
    totalEvents: count ?? 0,
    daysActive: null,
  }
}

// ─────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────

function ProfileLayout({
  actor,
  avatarUrl,
  isSelf,
  trayectoria,
  t,
  lang,
}: {
  actor: PublicActor
  avatarUrl: string | null
  isSelf: boolean
  trayectoria: ReputationSummary
  t: WorkspaceStrings
  lang: Lang
}) {
  // RGPD: la sección Trayectoria solo se renderiza si el Actor consintió
  // explícitamente (trajectory_visible=true). Excepción: el propio Actor
  // siempre la ve aunque esté oculta (para poder gestionarla).
  const showTrajectory = actor.trajectory_visible || isSelf
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--pm-bg-deep)',
        color: 'var(--pm-text-primary)',
        fontFamily: 'var(--pm-font-body)',
        padding: 'var(--pm-space-7) var(--pm-space-5)',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-5)' }}>
        <BackLink t={t} />
        <HeroCard actor={actor} avatarUrl={avatarUrl} isSelf={isSelf} t={t} />
        <IdentityPanel actor={actor} t={t} />
        {showTrajectory && <TrajectoryPanel trayectoria={trayectoria} hiddenFromOthers={isSelf && !actor.trajectory_visible} t={t} />}
        {!isSelf && <ChatStartButton recipientId={actor.user_id} recipientName={actor.display_name} lang={lang} />}
        {isSelf && <SelfNotice t={t} />}
      </div>
    </main>
  )
}

function BackLink({ t }: { t: WorkspaceStrings }) {
  return (
    <Link
      href="/escritorio"
      style={{
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-xs)',
        color: 'var(--pm-text-muted)',
        letterSpacing: 'var(--pm-tracking-wider)',
        textTransform: 'uppercase',
        textDecoration: 'none',
      }}
    >
      {t.fichaBackLink}
    </Link>
  )
}

function HeroCard({
  actor,
  avatarUrl,
  isSelf,
  t,
}: {
  actor: PublicActor
  avatarUrl: string | null
  isSelf: boolean
  t: WorkspaceStrings
}) {
  const initials = computeInitials(actor.display_name)
  const kindLabel = actor.entity_kind === 'company' ? t.fichaKindCompany : t.fichaKindIndividual
  return (
    <div
      style={{
        background: 'var(--pm-bg-elev)',
        border: '1px solid var(--pm-border-subtle)',
        borderRadius: 'var(--pm-radius-md)',
        padding: 'var(--pm-space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--pm-space-5)',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--pm-radius-md)',
          background: 'var(--pm-bg-base)',
          border: '1px solid var(--pm-border-active)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--pm-font-display)',
          fontSize: 'var(--pm-text-2xl)',
          color: 'var(--pm-accent-primary)',
          boxShadow: 'var(--pm-glow-cyan-soft)',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={actor.display_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-xs)',
            color: 'var(--pm-text-muted)',
            letterSpacing: 'var(--pm-tracking-wider)',
            marginBottom: 'var(--pm-space-2)',
          }}
        >
          {kindLabel} · {isSelf ? t.fichaSelfBadge : t.fichaOtherBadge}
        </div>
        <h1
          style={{
            fontFamily: 'var(--pm-font-display)',
            fontSize: 'var(--pm-text-2xl)',
            fontWeight: 600,
            color: 'var(--pm-text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: 'var(--pm-space-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {actor.display_name}
        </h1>
        <KycBadge label={t.fichaKycBadge} />
      </div>
    </div>
  )
}

function KycBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--pm-space-2)',
        padding: '4px 10px',
        background: 'rgba(46, 255, 140, 0.08)',
        border: '1px solid var(--pm-accent-success)',
        borderRadius: 'var(--pm-radius-sm)',
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-xs)',
        color: 'var(--pm-accent-success)',
        letterSpacing: 'var(--pm-tracking-wide)',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pm-accent-success)', boxShadow: '0 0 6px var(--pm-accent-success)' }} />
      {label}
    </span>
  )
}

function IdentityPanel({ actor, t }: { actor: PublicActor; t: WorkspaceStrings }) {
  // La fila "Empresa empleadora" solo aparece si:
  //  - Actor es individual (no aplica a empresas)
  //  - El propio Actor ha declarado un valor (employer_company_name != null)
  // Lleva etiqueta clara "AUTO-DECLARADO" porque NO está verificado
  // cross-actor (eso llega en Fase 6+).
  const showEmployer =
    actor.entity_kind === 'individual' && !!actor.employer_company_name
  return (
    <HudPanel title={t.fichaIdentityTitle} badge={<PublicBadge label={t.fichaPublicBadge} />}>
      <HudRow label={t.fichaIdentitySector} value={actor.sector_id ?? '—'} />
      <HudRow label={t.fichaIdentityRole} value={actor.role_id ?? '—'} />
      <HudRow label={t.fichaIdentityCountry} value={actor.country_code ?? '—'} />
      <HudRow label={t.fichaIdentityCity} value={actor.city ?? '—'} />
      <HudRow label={t.fichaIdentityYears} value={actor.years_in_sector ?? '—'} />
      <HudRow label={t.fichaIdentityAlta} value={formatDate(actor.created_at)} />
      {showEmployer && (
        <HudRow
          label={t.fichaIdentityEmployer}
          value={actor.employer_company_name ?? ''}
          suffixBadge={t.fichaAutoDeclaredBadge}
        />
      )}
      <HudRow label={t.fichaIdentityActorId} value={legibleActorId(actor)} />
      <HudRow label={t.fichaIdentityDid} value={t.fichaIdentityDidPending} pending />
    </HudPanel>
  )
}

function TrajectoryPanel({
  trayectoria,
  hiddenFromOthers,
  t,
}: {
  trayectoria: ReputationSummary
  hiddenFromOthers: boolean
  t: WorkspaceStrings
}) {
  const subtitle = hiddenFromOthers ? t.fichaTrajectoryHidden : t.fichaTrajectorySubtitle
  // El badge "PÚBLICO POR CONSENTIMIENTO" SOLO aparece cuando la sección
  // está efectivamente pública (hiddenFromOthers=false). Si el propio Actor
  // la ve oculta, no se muestra badge — sería contradictorio.
  const badge = hiddenFromOthers ? null : <PublicBadge label={t.fichaPublicBadge} />
  return (
    <HudPanel title={t.fichaTrajectoryTitle} subtitle={subtitle} badge={badge}>
      <HudRow label={t.fichaTrajectoryOps} value={trayectoria.totalEvents > 0 ? String(trayectoria.totalEvents) : '—'} />
      <HudRow label={t.fichaTrajectoryOnTimeDeliveries} value="—" />
      <HudRow label={t.fichaTrajectoryOnTimePayments} value="—" />
      <HudRow label={t.fichaTrajectoryCredentials} value="—" />
      <HudRow label={t.fichaTrajectoryUniqueParties} value="—" />
      <HudRow label={t.fichaTrajectoryDisputes} value="—" />
    </HudPanel>
  )
}

function PublicBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--pm-space-2)',
        padding: '3px 9px',
        background: 'rgba(46, 255, 140, 0.10)',
        border: '1px solid rgba(46, 255, 140, 0.45)',
        borderRadius: 'var(--pm-radius-sm)',
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-xs)',
        color: 'var(--pm-accent-success)',
        letterSpacing: 'var(--pm-tracking-wide)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pm-accent-success)' }} />
      {label}
    </span>
  )
}

function HudPanel({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--pm-bg-base)',
        border: '1px solid var(--pm-border-subtle)',
        borderRadius: 'var(--pm-radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'var(--pm-space-3) var(--pm-space-4)',
          borderBottom: '1px solid var(--pm-border-subtle)',
          background: 'var(--pm-bg-elev)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--pm-space-3)',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--pm-font-mono)',
              fontSize: 'var(--pm-text-sm)',
              color: 'var(--pm-text-secondary)',
              letterSpacing: 'var(--pm-tracking-wider)',
            }}
          >
            {title}
          </div>
          {badge}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--pm-font-body)',
              fontSize: 'var(--pm-text-sm)',
              color: 'var(--pm-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--pm-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-3)' }}>
        {children}
      </div>
    </div>
  )
}

function HudRow({
  label,
  value,
  pending,
  suffixBadge,
}: {
  label: string
  value: string
  pending?: boolean
  suffixBadge?: string
}) {
  // `pending` marca un slot preparado pero sin datos reales todavía
  // (p.ej. DID descentralizado — llega en Fase 6+). Se renderiza en gris
  // itálica para que se distinga de un valor real.
  // `suffixBadge` añade una etiqueta sutil junto al valor (p.ej.
  // "AUTO-DECLARADO" para empleador no verificado).
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--pm-space-4)',
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-base)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wide)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--pm-space-3)', textAlign: 'right' }}>
        {suffixBadge && (
          <span
            style={{
              fontFamily: 'var(--pm-font-mono)',
              fontSize: 'var(--pm-text-xs)',
              color: 'var(--pm-accent-warning)',
              letterSpacing: 'var(--pm-tracking-wide)',
              border: '1px solid rgba(240, 180, 41, 0.5)',
              background: 'rgba(240, 180, 41, 0.08)',
              padding: '2px 6px',
              borderRadius: 'var(--pm-radius-sm)',
            }}
          >
            {suffixBadge}
          </span>
        )}
        <span
          style={{
            color: pending ? 'var(--pm-text-muted)' : 'var(--pm-text-cyan)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontStyle: pending ? 'italic' : 'normal',
            fontSize: pending ? 'var(--pm-text-sm)' : 'var(--pm-text-base)',
          }}
        >
          {value}
        </span>
      </span>
    </div>
  )
}

function SelfNotice({ t }: { t: WorkspaceStrings }) {
  return (
    <div
      style={{
        padding: 'var(--pm-space-4)',
        background: 'var(--pm-bg-elev)',
        border: '1px solid var(--pm-border-subtle)',
        borderRadius: 'var(--pm-radius-sm)',
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-xs)',
        color: 'var(--pm-text-muted)',
        letterSpacing: 'var(--pm-tracking-wide)',
        textAlign: 'center',
      }}
    >
      {t.fichaSelfNotice}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────

function ConfigError({ t }: { t: WorkspaceStrings }) {
  return <FullScreenMessage title={t.fichaConfigError} detail={t.fichaConfigErrorDetail} />
}

function KycRequiredScreen({ t }: { t: WorkspaceStrings }) {
  return (
    <FullScreenMessage
      title={t.fichaKycRequiredTitle}
      detail={t.fichaKycRequiredDetail}
      action={{ href: '/escritorio', label: t.fichaKycRequiredAction }}
    />
  )
}

function DbError({ t, detail }: { t: WorkspaceStrings; detail?: string }) {
  return <FullScreenMessage title={t.fichaDbErrorTitle} detail={detail ?? t.fichaDbErrorDetailDefault} />
}

function FullScreenMessage({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: { href: string; label: string }
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--pm-bg-deep)',
        color: 'var(--pm-text-primary)',
        fontFamily: 'var(--pm-font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--pm-space-5)',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--pm-font-display)',
            fontSize: 'var(--pm-text-2xl)',
            color: 'var(--pm-text-primary)',
            marginBottom: 'var(--pm-space-3)',
          }}
        >
          {title}
        </h1>
        <p style={{ color: 'var(--pm-text-secondary)', marginBottom: 'var(--pm-space-5)', fontSize: 'var(--pm-text-md)' }}>
          {detail}
        </p>
        {action && (
          <Link
            href={action.href}
            style={{
              display: 'inline-block',
              padding: 'var(--pm-space-3) var(--pm-space-5)',
              background: 'var(--pm-accent-primary)',
              color: 'var(--pm-text-on-accent)',
              borderRadius: 'var(--pm-radius-sm)',
              fontFamily: 'var(--pm-font-mono)',
              fontSize: 'var(--pm-text-sm)',
              letterSpacing: 'var(--pm-tracking-wide)',
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: 'var(--pm-glow-cyan-md)',
            }}
          >
            {action.label}
          </Link>
        )}
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Helpers de presentación
// ─────────────────────────────────────────────────────────────────────

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return '—'
  }
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

/**
 * Construye un ACTOR-ID legible combinando sector + rol + slug del UUID.
 * Ej. sector="inmobiliario" + role="agencia" + uuid="d24b5ba7-..." →
 *     "INM-AGE-d24b5ba7".
 *
 * Si falta sector o rol, cae a un shortId del UUID puro.
 *
 * Importante: es un IDENTIFICADOR DERIVADO, no se almacena. El UUID real
 * sigue siendo la fuente de verdad. Esto es solo presentación.
 */
function legibleActorId(actor: PublicActor): string {
  const sectorTag = (actor.sector_id ?? '').slice(0, 3).toUpperCase()
  const roleTag = (actor.role_id ?? '').slice(0, 3).toUpperCase()
  const uuidHead = actor.actor_id.slice(0, 8)
  if (!sectorTag || !roleTag) return shortId(actor.actor_id)
  return `${sectorTag}-${roleTag}-${uuidHead}`
}
