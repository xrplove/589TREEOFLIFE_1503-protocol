'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// Estados que la pantalla puede mostrar. Se mapean 1:1 con kyc_status excepto
// 'loading', 'no-session' y 'error', que son meta-estados del lado cliente.
type Screen =
  | { kind: 'loading' }
  | { kind: 'no-session' }
  | { kind: 'pending_email'; email: string }
  | { kind: 'pending_kyc'; firstName: string; createdAt: string }
  | { kind: 'rejected'; reason: string | null }
  | { kind: 'suspended'; reason: string | null }
  | { kind: 'approved' }
  | { kind: 'error'; message: string }

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,17,24,0.7)',
  border: '1px solid #1E2530',
  borderRadius: 4,
  padding: '2.5rem 2.25rem',
  backdropFilter: 'blur(4px)',
}

const ctaSecondary: React.CSSProperties = {
  background: 'transparent',
  color: '#9FB6CC',
  border: '1px solid #1E2530',
  padding: '12px 24px',
  borderRadius: 2,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  textTransform: 'uppercase',
}

export default function EnRevisionPage() {
  const [screen, setScreen] = useState<Screen>({ kind: 'loading' })
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (sessionErr) {
        setScreen({ kind: 'error', message: sessionErr.message })
        return
      }
      if (!session) {
        setScreen({ kind: 'no-session' })
        return
      }

      const user = session.user

      if (!user.email_confirmed_at) {
        setScreen({ kind: 'pending_email', email: user.email ?? '' })
        return
      }

      const { data: actor, error: actorErr } = await supabase
        .from('actors')
        .select('kyc_status, first_name, created_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (actorErr) {
        setScreen({ kind: 'error', message: actorErr.message })
        return
      }
      if (!actor) {
        setScreen({ kind: 'error', message: 'No encontramos tu ficha de Actor.' })
        return
      }

      const status = actor.kyc_status as
        | 'pending_email'
        | 'pending_kyc'
        | 'approved'
        | 'rejected'
        | 'suspended'

      if (status === 'approved') {
        // El workspace aún no existe; cuando se construya /escritorio, redirigir allí.
        // Mientras tanto mostramos el estado approved con CTA placeholder.
        setScreen({ kind: 'approved' })
        return
      }

      if (status === 'pending_email') {
        setScreen({ kind: 'pending_email', email: user.email ?? '' })
        return
      }

      if (status === 'pending_kyc') {
        setScreen({
          kind: 'pending_kyc',
          firstName: actor.first_name ?? 'Actor',
          createdAt: actor.created_at,
        })
        return
      }

      // rejected o suspended → busca el motivo más reciente en kyc_review_log
      const { data: log } = await supabase
        .from('kyc_review_log')
        .select('reason')
        .eq('actor_user_id', user.id)
        .eq('new_status', status)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      setScreen({
        kind: status,
        reason: log?.reason ?? null,
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        padding: '8vh 2rem 6rem',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '3rem',
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
            ← 1503
          </Link>
          <span style={eyebrowStyle}>{eyebrowFor(screen.kind)}</span>
          <span style={{ minWidth: 1 }} />
        </div>

        <div style={cardStyle}>{renderBody(screen)}</div>
      </div>
    </main>
  )
}

function eyebrowFor(kind: Screen['kind']): string {
  switch (kind) {
    case 'loading':
      return 'Cargando estado'
    case 'no-session':
      return 'Sesión no encontrada'
    case 'pending_email':
      return 'Registro · verifica tu correo'
    case 'pending_kyc':
      return 'Registro · documentación en revisión'
    case 'approved':
      return 'Registro · cuenta aprobada'
    case 'rejected':
      return 'Registro · solicitud rechazada'
    case 'suspended':
      return 'Registro · cuenta suspendida'
    case 'error':
      return 'Registro · error'
  }
}

function renderBody(screen: Screen): React.ReactNode {
  switch (screen.kind) {
    case 'loading':
      return (
        <p style={{ color: '#7A8899', fontSize: '0.95rem' }}>
          Cargando tu estado…
        </p>
      )

    case 'no-session':
      return (
        <>
          <Hero icon="◆" eyebrow="No has iniciado sesión" title="Aún no estás dentro" />
          <p style={paraPrimary}>
            Para ver el estado de tu solicitud necesitamos saber quién eres. Puedes
            registrarte si todavía no lo has hecho, o iniciar sesión cuando esté
            disponible esa pantalla.
          </p>
          <CTAs>
            <Link href="/sectors" style={ctaSecondary}>
              Volver a sectores
            </Link>
          </CTAs>
        </>
      )

    case 'pending_email':
      return (
        <>
          <Hero icon="✉" eyebrow="Falta un paso" title="Verifica tu correo para continuar" />
          <p style={paraPrimary}>
            Te enviamos un correo de verificación
            {screen.email ? (
              <>
                {' '}a <strong style={{ color: '#E8EDF5' }}>{screen.email}</strong>
              </>
            ) : null}
            . Haz clic en el enlace de ese correo para activar tu identidad. Después
            podemos empezar a revisar tus documentos.
          </p>
          <p style={paraSecondary}>
            ¿No te llega? Puede tardar 1-2 minutos. Mira la carpeta de spam o
            promociones. Si tras 10 minutos sigue sin aparecer, escribe a{' '}
            <span style={{ color: '#E8EDF5' }}>contacto@1503.global</span>.
          </p>
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )

    case 'pending_kyc': {
      const created = new Date(screen.createdAt)
      return (
        <>
          <Hero
            icon="◷"
            eyebrow="Documentación recibida"
            title={`Hola ${screen.firstName}, estamos revisando tus documentos`}
          />
          <p style={paraPrimary}>
            Tu correo está verificado y hemos recibido los documentos KYC que has
            subido. El equipo de 1503 los revisa para confirmar que cumplen los
            requisitos legales del país de ejercicio antes de habilitarte el acceso al
            workspace.
          </p>
          <InfoBox
            title="Plazo estimado"
            body="24 a 72 horas hábiles. Te avisaremos por correo en cuanto la revisión esté completa, tanto si todo está en orden como si necesitamos algún documento adicional."
          />
          <p style={paraSecondaryTight}>
            Solicitud creada el{' '}
            <span style={{ color: '#9FB6CC' }}>
              {created.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            .
          </p>
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )
    }

    case 'approved':
      return (
        <>
          <Hero
            icon="◆"
            eyebrow="Cuenta aprobada"
            title="Tu documentación ha sido validada"
          />
          <p style={paraPrimary}>
            Bienvenido a 1503. Tu KYC está verificado y tienes acceso operativo
            completo. Cuando el escritorio esté disponible, te llevaremos directamente
            ahí.
          </p>
          <InfoBox
            title="Próximos pasos"
            body="El workspace para operar como Actor (publicar fichas, recibir contactos, gestionar contratos) se está construyendo. Recibirás aviso por correo cuando esté listo."
          />
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )

    case 'rejected':
      return (
        <>
          <Hero icon="◇" eyebrow="Solicitud rechazada" title="No hemos podido aprobar tu alta" />
          <p style={paraPrimary}>
            Tras revisar tu documentación, no hemos podido confirmar los requisitos
            necesarios. Esto suele deberse a documentos incompletos, ilegibles o que
            no coinciden con la información declarada.
          </p>
          {screen.reason ? (
            <InfoBox title="Motivo indicado por el equipo" body={screen.reason} />
          ) : null}
          <p style={paraSecondary}>
            Puedes aportar información adicional o documentos actualizados escribiendo
            a <span style={{ color: '#E8EDF5' }}>contacto@1503.global</span> con el
            asunto <em>“Aporto KYC”</em> y referencia al correo de la cuenta. El equipo
            reabrirá la revisión.
          </p>
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )

    case 'suspended':
      return (
        <>
          <Hero
            icon="⏸"
            eyebrow="Cuenta suspendida"
            title="Tu acceso está temporalmente bloqueado"
          />
          <p style={paraPrimary}>
            La cuenta está pausada por una incidencia o un requerimiento puntual. La
            suspensión es reversible: en cuanto se resuelva, recuperarás el acceso sin
            tener que repetir el alta.
          </p>
          {screen.reason ? (
            <InfoBox title="Motivo" body={screen.reason} />
          ) : null}
          <p style={paraSecondary}>
            Para más información o para resolverlo cuanto antes, escribe a{' '}
            <span style={{ color: '#E8EDF5' }}>contacto@1503.global</span> indicando
            el correo de la cuenta.
          </p>
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )

    case 'error':
      return (
        <>
          <Hero icon="!" eyebrow="No se pudo cargar tu estado" title="Algo no ha ido bien" />
          <p style={paraPrimary}>
            No hemos podido recuperar el estado de tu solicitud ahora mismo:{' '}
            <span style={{ color: '#E8EDF5' }}>{screen.message}</span>. Intenta
            recargar esta página en unos segundos. Si sigue fallando, escribe a{' '}
            <span style={{ color: '#E8EDF5' }}>contacto@1503.global</span>.
          </p>
          <CTAs>
            <Link href="/" style={ctaSecondary}>
              Volver al inicio
            </Link>
          </CTAs>
        </>
      )
  }
}

const paraPrimary: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.7,
  marginBottom: '1rem',
}

const paraSecondary: React.CSSProperties = {
  color: '#7A8899',
  fontSize: '0.88rem',
  lineHeight: 1.7,
  marginBottom: '2rem',
}

const paraSecondaryTight: React.CSSProperties = {
  ...paraSecondary,
  marginBottom: '1.25rem',
}

function Hero({ icon, eyebrow, title }: { icon: string; eyebrow: string; title: string }) {
  return (
    <>
      <div
        style={{
          fontSize: '3rem',
          lineHeight: 1,
          marginBottom: '1.5rem',
          filter: 'drop-shadow(0 4px 24px rgba(0,163,255,0.18))',
        }}
        aria-hidden
      >
        {icon}
      </div>
      <span style={eyebrowStyle}>{eyebrow}</span>
      <h1
        style={{
          fontSize: 'clamp(1.6rem, 3.6vw, 2.2rem)',
          fontWeight: 700,
          color: '#E8EDF5',
          marginTop: '0.6rem',
          marginBottom: '1.25rem',
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          lineHeight: 1.25,
        }}
      >
        {title}
      </h1>
    </>
  )
}

function InfoBox({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: '1rem 1.1rem',
        background: 'rgba(0,163,255,0.04)',
        border: '1px solid rgba(0,163,255,0.2)',
        borderRadius: 3,
        marginBottom: '1.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.66rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#00A3FF',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: '#9FB6CC',
          fontSize: '0.85rem',
          lineHeight: 1.65,
        }}
      >
        {body}
      </div>
    </div>
  )
}

function CTAs({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>{children}</div>
}
