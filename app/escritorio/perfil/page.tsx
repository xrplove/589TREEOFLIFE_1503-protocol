import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getServerLang } from '../../lib/server-lang'
import { getWorkspaceStrings, type Lang, type WorkspaceStrings } from '../../data/i18n'
import VisibilityToggle from './VisibilityToggle'
import AvatarUpload from './AvatarUpload'
import EmployerField from './EmployerField'

/**
 * Panel de preferencias del Actor (v1 mínimo).
 * Hoy solo expone el bloque de visibilidad (opt-out RGPD, mig. 015/016).
 */
export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const lang = await getServerLang()
  const t = getWorkspaceStrings(lang)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return <ErrorScreen t={t} detail="Server misconfigured" />
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

  const {
    data: { user },
    error: authErr,
  } = await sbAuth.auth.getUser()
  if (authErr || !user) {
    redirect('/login?next=/escritorio/perfil')
  }

  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: actor, error: lookupErr } = await sbAdmin
    .from('actors')
    .select('user_id, kyc_status, visible_in_directory, trajectory_visible, first_name, last_name, company_name, entity_kind, public_avatar_path, employer_company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupErr || !actor) {
    return <ErrorScreen t={t} detail={lookupErr?.message ?? 'Actor not found'} />
  }

  // Signed URL del avatar actual (si existe) para previsualizar en el panel.
  let avatarUrl: string | null = null
  if (actor.public_avatar_path) {
    const { data: signed } = await sbAdmin.storage
      .from('actor-public-avatars')
      .createSignedUrl(actor.public_avatar_path, 3600)
    avatarUrl = signed?.signedUrl ?? null
  }

  const displayName =
    actor.entity_kind === 'company' && actor.company_name
      ? actor.company_name
      : [actor.first_name, actor.last_name].filter(Boolean).join(' ') || actor.company_name || 'Actor'

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
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-5)' }}>
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
          {t.perfilBackLink}
        </Link>

        <header>
          <span
            style={{
              fontFamily: 'var(--pm-font-mono)',
              fontSize: 'var(--pm-text-xs)',
              color: 'var(--pm-accent-primary)',
              letterSpacing: 'var(--pm-tracking-wider)',
              textTransform: 'uppercase',
            }}
          >
            {t.perfilEyebrow}
          </span>
          <h1
            style={{
              fontFamily: 'var(--pm-font-display)',
              fontSize: 'var(--pm-text-2xl)',
              fontWeight: 600,
              color: 'var(--pm-text-primary)',
              marginTop: 'var(--pm-space-2)',
              letterSpacing: '-0.01em',
            }}
          >
            {t.perfilTitle}
          </h1>
        </header>

        <section
          style={{
            background: 'var(--pm-bg-elev)',
            border: '1px solid var(--pm-border-subtle)',
            borderRadius: 'var(--pm-radius-md)',
            padding: 'var(--pm-space-5)',
          }}
        >
          <AvatarUpload lang={lang} initialAvatarUrl={avatarUrl} initialName={displayName} />
        </section>

        {actor.entity_kind === 'individual' && (
          <section
            style={{
              background: 'var(--pm-bg-elev)',
              border: '1px solid var(--pm-border-subtle)',
              borderRadius: 'var(--pm-radius-md)',
              padding: 'var(--pm-space-5)',
            }}
          >
            <EmployerField lang={lang} initialValue={actor.employer_company_name ?? null} />
          </section>
        )}

        <section
          style={{
            background: 'var(--pm-bg-elev)',
            border: '1px solid var(--pm-border-subtle)',
            borderRadius: 'var(--pm-radius-md)',
            padding: 'var(--pm-space-5)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--pm-font-mono)',
              fontSize: 'var(--pm-text-sm)',
              color: 'var(--pm-text-cyan)',
              letterSpacing: 'var(--pm-tracking-widest)',
              textTransform: 'uppercase',
              marginBottom: 'var(--pm-space-3)',
            }}
          >
            {t.perfilVisibilitySectionTitle}
          </h2>
          <p
            style={{
              color: 'var(--pm-text-secondary)',
              fontSize: 'var(--pm-text-base)',
              lineHeight: 1.55,
              marginBottom: 'var(--pm-space-5)',
            }}
          >
            {t.perfilVisibilityIntro}
          </p>

          <VisibilityToggle
            lang={lang}
            initialDirectoryVisible={actor.visible_in_directory ?? true}
            initialTrajectoryVisible={actor.trajectory_visible ?? true}
          />

          {actor.kyc_status === 'approved' && (
            <div
              style={{
                marginTop: 'var(--pm-space-5)',
                paddingTop: 'var(--pm-space-4)',
                borderTop: '1px solid var(--pm-border-subtle)',
              }}
            >
              <Link
                href={`/actor/${user.id}`}
                style={{
                  fontFamily: 'var(--pm-font-mono)',
                  fontSize: 'var(--pm-text-xs)',
                  color: 'var(--pm-accent-primary)',
                  letterSpacing: 'var(--pm-tracking-wide)',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                {t.perfilSeeMyFiche}
              </Link>
            </div>
          )}
        </section>

        <section
          style={{
            padding: 'var(--pm-space-4)',
            background: 'var(--pm-bg-base)',
            border: '1px solid var(--pm-border-subtle)',
            borderRadius: 'var(--pm-radius-sm)',
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-xs)',
            color: 'var(--pm-text-muted)',
            letterSpacing: 'var(--pm-tracking-wide)',
            lineHeight: 1.6,
          }}
        >
          {t.perfilLegalNote}
        </section>
      </div>
    </main>
  )
}

function ErrorScreen({ t, detail }: { t: WorkspaceStrings; detail: string }) {
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
        <h1 style={{ fontFamily: 'var(--pm-font-display)', fontSize: 'var(--pm-text-2xl)', marginBottom: 'var(--pm-space-3)' }}>
          {t.perfilErrorTitle}
        </h1>
        <p style={{ color: 'var(--pm-text-secondary)', fontSize: 'var(--pm-text-md)' }}>{detail}</p>
      </div>
    </main>
  )
}
