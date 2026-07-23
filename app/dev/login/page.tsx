'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

/**
 * Página de acceso demo (solo desarrollo).
 *
 * Un click → asegura que el usuario demo@1503.global existe en Supabase
 * con KYC aprobado, luego hace signInWithPassword en el cliente para
 * establecer la cookie de sesión, y redirige a la home.
 *
 * Después de entrar puedes navegar toda la web sin re-registrarte. La
 * sesión persiste en cookies hasta que cierres sesión manualmente.
 */

export default function DevLoginPage() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnter() {
    setBusy(true)
    setError(null)
    try {
      // El endpoint hace el signIn server-side y escribe las cookies de
      // sesión directamente en la respuesta HTTP. Cuando esta función
      // termina, el navegador ya tiene las cookies guardadas y el siguiente
      // request al middleware las verá sin race conditions.
      const res = await fetch('/api/dev/demo-login', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo preparar el usuario demo')
      }
      window.location.href = '/escritorio'
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  async function handleSignOut() {
    setBusy(true)
    setError(null)
    try {
      await supabase.auth.signOut()
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: 540,
          width: '100%',
          background: 'rgba(14,17,24,0.7)',
          border: '1px solid #1E2530',
          borderRadius: 4,
          padding: '2.5rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '0.3rem 0.7rem',
            background: 'rgba(240,180,41,0.12)',
            border: '1px solid rgba(240,180,41,0.4)',
            color: '#F0B429',
            fontSize: '0.68rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-dm-mono), monospace',
            marginBottom: '1.5rem',
            borderRadius: 2,
          }}
        >
          Solo desarrollo
        </span>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 700,
            letterSpacing: '0.02em',
            margin: '0 0 1rem',
          }}
        >
          Acceso demo
        </h1>
        <p
          style={{
            color: '#7A8899',
            lineHeight: 1.7,
            fontSize: '0.95rem',
            marginBottom: '2rem',
          }}
        >
          Entra como el usuario <strong style={{ color: '#00BFFF' }}>demo@1503.global</strong> con
          KYC ya aprobado. La sesión queda guardada en cookies y puedes navegar toda la web sin
          re-registrarte. Útil para probar el flujo, hacer demos o enseñar la plataforma a terceros.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            padding: '1.25rem 1.4rem',
            background: 'rgba(0,163,255,0.04)',
            border: '1px solid rgba(0,163,255,0.18)',
            borderRadius: 2,
            marginBottom: '2rem',
            fontSize: '0.82rem',
            color: '#7A8899',
          }}
        >
          <div>
            <span style={{ color: '#4A5566', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>
              ENTIDAD
            </span>
            <br />
            <span style={{ color: '#E8EDF5' }}>1503 Demo · SL · España</span>
          </div>
          <div>
            <span style={{ color: '#4A5566', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>
              SECTOR · ROL
            </span>
            <br />
            <span style={{ color: '#E8EDF5' }}>Inmobiliario · Agencia</span>
          </div>
          <div>
            <span style={{ color: '#4A5566', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>
              KYC
            </span>
            <br />
            <span style={{ color: '#00D084' }}>Aprobado</span>
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={busy}
          style={{
            width: '100%',
            background: busy ? 'rgba(0,163,255,0.4)' : '#00A3FF',
            color: '#08090F',
            padding: '14px 24px',
            borderRadius: 2,
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: '0.92rem',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            textTransform: 'uppercase',
            boxShadow: '0 6px 24px rgba(0,163,255,0.32)',
            transition: 'background 200ms ease',
          }}
        >
          {busy ? 'Entrando…' : 'Entrar como demo'}
        </button>

        <button
          onClick={handleSignOut}
          disabled={busy}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            background: 'transparent',
            color: '#7A8899',
            padding: '10px 24px',
            borderRadius: 2,
            border: '1px solid #1E2530',
            cursor: busy ? 'wait' : 'pointer',
            fontSize: '0.78rem',
            letterSpacing: '0.16em',
            fontFamily: 'var(--font-dm-mono), monospace',
            textTransform: 'uppercase',
          }}
        >
          Cerrar sesión actual
        </button>

        {error && (
          <p
            style={{
              marginTop: '1.5rem',
              padding: '0.8rem 1rem',
              background: 'rgba(220,60,60,0.08)',
              border: '1px solid rgba(220,60,60,0.4)',
              borderRadius: 2,
              color: '#FF8A8A',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-dm-mono), monospace',
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #1E2530',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.72rem',
            color: '#4A5566',
            fontFamily: 'var(--font-dm-mono), monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <Link href="/" style={{ color: '#4A5566', textDecoration: 'none' }}>
            ← Volver al globo
          </Link>
          <span>NODE_ENV · DEV</span>
        </div>
      </div>
    </main>
  )
}
