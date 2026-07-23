'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORS } from '../../data/sectors'
import { supabase } from '../../lib/supabase'

/**
 * /registro/sector — primera entrada del Actor tras aprobación KYC.
 *
 * Flujo:
 *   1. Actor llega aquí (manualmente desde el email de aprobación o
 *      redirigido por el middleware).
 *   2. Elige uno de los 11 sectores.
 *   3. POST /api/registro/choose-sector guarda sector_id + sector_chosen_at.
 *   4. Aparece modal con el icono del globo + botón "Descargar acceso
 *      directo" + botón "Entrar al escritorio por primera vez".
 *   5. Tras pulsar entrar → /sector/<sector_id> con el WorkspaceShell.
 *
 * Esta página solo se ve UNA VEZ por Actor (después de elegir sector, el
 * middleware ya no redirige aquí — el Actor entra directo a su sector).
 */

export default function RegistroSectorPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'loading' | 'choose' | 'modal'>('loading')
  const [actorEmail, setActorEmail] = useState<string>('')

  // Finding A (ADR 0022): el sector Y el subsector ya se eligen en el alta y
  // viven en public.actors. Esta página NO los re-elige (re-elegir el sector
  // dejaría huérfano el subsector_id, que ahora determina la documentación).
  // En su lugar: confirma el sector ya elegido, fija sector_chosen_at y entrega
  // el acceso directo. Solo si faltara el sector (alta parcial/legada) se
  // muestra el selector como fallback.
  useEffect(() => {
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      if (u.user?.email) setActorEmail(u.user.email)
      if (!u.user) {
        setStep('choose')
        return
      }
      const { data: actor } = await supabase
        .from('actors')
        .select('sector_id')
        .eq('user_id', u.user.id)
        .maybeSingle()
      const existing = actor?.sector_id
      if (existing && SECTORS.some((s) => s.id === existing)) {
        setSelected(existing)
        try {
          const res = await fetch('/api/registro/choose-sector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sector_id: existing }),
          })
          const json = await res.json()
          if (!res.ok || !json.ok) {
            throw new Error(json.error || 'No se pudo confirmar el sector')
          }
          setStep('modal')
        } catch (err) {
          // Si la confirmación falla, caemos al selector para no bloquear.
          setError(err instanceof Error ? err.message : String(err))
          setStep('choose')
        }
      } else {
        // Alta parcial sin sector: fallback al selector clásico.
        setStep('choose')
      }
    })()
  }, [])

  async function handlePick(sectorId: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    setSelected(sectorId)

    try {
      const res = await fetch('/api/registro/choose-sector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector_id: sectorId }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo guardar el sector')
      }
      setStep('modal')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSelected(null)
    } finally {
      setBusy(false)
    }
  }

  function handleDownload() {
    if (!actorEmail) return
    // Inicia la descarga del .url (Windows con icono globo). Si el navegador
    // o SO no es Windows, el .url igual es un archivo de texto plano que abre
    // con el navegador al hacer doble clic.
    window.location.href = `/api/access-shortcut?email=${encodeURIComponent(actorEmail)}&format=url`
  }

  function handleEnter() {
    if (!selected) return
    router.push(`/escritorio/init`)
  }

  if (step === 'loading') {
    return (
      <main style={pageStyle}>
        <div
          style={{
            color: '#9FB6CC',
            fontFamily: 'var(--font-dm-mono), monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}
        >
          Preparando tu acceso…
        </div>
      </main>
    )
  }

  if (step === 'modal' && selected) {
    const sector = SECTORS.find((s) => s.id === selected)
    return (
      <main style={pageStyle}>
        <div style={modalStyle}>
          <img
            src="/icons/globe.svg"
            alt="1503"
            style={{ width: 200, height: 200, margin: '0 auto 1rem', display: 'block' }}
          />

          <div style={successBadge}>● BIENVENIDO</div>
          <h1 style={titleStyle}>Tu cuenta está lista</h1>

          <div style={infoBlockStyle}>
            <Row label="KYC" value="Aprobado" accent="#00D084" />
            <Row label="Sector" value={sector?.label ?? selected} accent="#00BFFF" />
            <Row label="Correo" value={actorEmail || '—'} />
          </div>

          <p style={paraStyle}>
            Descarga tu <strong style={{ color: '#E8EDF5' }}>acceso directo</strong> y guárdalo en el
            escritorio de tu ordenador. <strong style={{ color: '#E8EDF5' }}>Es tu única puerta a partir
            de ahora.</strong> Doble clic → recibes un código por email → entras al escritorio.
          </p>

          <button onClick={handleDownload} style={primaryButtonStyle}>
            ↓ Descargar acceso directo
          </button>

          <button onClick={handleEnter} style={secondaryButtonStyle}>
            Entrar al escritorio por primera vez →
          </button>

          <p style={hintStyle}>
            ¿Pierdes el archivo? Puedes volver a descargarlo desde tu perfil dentro del escritorio.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: '100%', padding: '4vh 2rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={eyebrowStyle}>BIENVENIDO · ELIGE TU SECTOR</div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 700,
              margin: '0.8rem 0 0.8rem',
              letterSpacing: '0.02em',
            }}
          >
            ¿En qué sector operas?
          </h1>
          <p
            style={{
              color: '#9FB6CC',
              fontSize: '1rem',
              lineHeight: 1.7,
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            Tu cuenta acaba de ser aprobada. Elige el sector principal donde operas para entrar al
            escritorio correspondiente. Más adelante podrás añadir más sectores desde tu perfil.
          </p>
        </header>

        {error && (
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto 2rem',
              padding: '0.85rem 1rem',
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.4)',
              borderRadius: 3,
              color: '#FF6B6B',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {SECTORS.map((s) => {
            const isSelected = selected === s.id
            const isDisabled = busy && !isSelected
            return (
              <button
                key={s.id}
                onClick={() => handlePick(s.id)}
                disabled={busy}
                style={{
                  ...sectorCardStyle,
                  borderColor: isSelected ? '#F0B429' : '#1E2530',
                  background: isSelected ? 'rgba(240,180,41,0.06)' : 'rgba(14,17,24,0.6)',
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 180ms ease',
                }}
              >
                <div style={shortBadge}>{s.short}</div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#E8EDF5',
                    margin: '0 0 0.5rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {s.label}
                </h3>
                <p
                  style={{
                    color: '#7A8899',
                    fontSize: '0.85rem',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {s.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function Row({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr',
        gap: '0.75rem',
        padding: '0.6rem 0',
        borderBottom: '1px solid rgba(30,37,48,0.6)',
        fontSize: '0.9rem',
      }}
    >
      <span
        style={{
          color: '#4A5566',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span style={{ color: accent ?? '#E8EDF5' }}>{value}</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#08090F',
  color: '#E8EDF5',
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const modalStyle: React.CSSProperties = {
  maxWidth: 520,
  width: '100%',
  margin: '4vh 2rem',
  background: 'rgba(14,17,24,0.82)',
  border: '1px solid rgba(0,163,255,0.25)',
  borderRadius: 4,
  padding: '2.5rem 2.25rem',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 12px 64px rgba(0,163,255,0.08)',
  textAlign: 'center',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
}

const successBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.3rem 0.7rem',
  background: 'rgba(0,208,132,0.1)',
  border: '1px solid rgba(0,208,132,0.4)',
  color: '#00D084',
  fontSize: '0.68rem',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  marginBottom: '1rem',
  borderRadius: 2,
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.6rem, 3vw, 2rem)',
  fontWeight: 700,
  margin: '0 0 1.25rem',
  letterSpacing: '0.02em',
}

const paraStyle: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.92rem',
  lineHeight: 1.7,
  margin: '0 0 1.5rem',
  textAlign: 'left',
}

const infoBlockStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(0,163,255,0.04)',
  border: '1px solid rgba(0,163,255,0.18)',
  borderRadius: 2,
  marginBottom: '1.5rem',
  textAlign: 'left',
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: '#F0B429',
  color: '#08090F',
  padding: '14px 22px',
  borderRadius: 2,
  border: 'none',
  fontWeight: 700,
  fontSize: '0.92rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  cursor: 'pointer',
  marginBottom: '0.75rem',
  boxShadow: '0 8px 28px rgba(240,180,41,0.25)',
}

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  color: '#00BFFF',
  padding: '12px 22px',
  borderRadius: 2,
  border: '1px solid rgba(0,163,255,0.4)',
  fontWeight: 600,
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  cursor: 'pointer',
}

const hintStyle: React.CSSProperties = {
  marginTop: '1.25rem',
  color: '#4A5566',
  fontSize: '0.78rem',
  lineHeight: 1.5,
  textAlign: 'left',
}

const sectorCardStyle: React.CSSProperties = {
  padding: '1.5rem 1.25rem',
  border: '1px solid #1E2530',
  borderRadius: 4,
  color: '#E8EDF5',
  textAlign: 'left',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  background: 'rgba(14,17,24,0.6)',
  position: 'relative',
}

const shortBadge: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.22em',
  color: '#00A3FF',
  padding: '0.2rem 0.5rem',
  border: '1px solid rgba(0,163,255,0.4)',
  borderRadius: 2,
  marginBottom: '0.85rem',
}
