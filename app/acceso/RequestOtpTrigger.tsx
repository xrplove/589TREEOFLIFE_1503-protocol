'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Componente cliente embebido en /acceso que dispara la petición de OTP
 * al cargar la página, y muestra el código en pantalla en modo desarrollo
 * (mientras Resend sandbox no entrega a todos los emails).
 *
 * No hace login ni gestiona cookies — solo dispara el envío. La
 * verificación del código y la creación de sesión se hacen vía form submit
 * server-side (más robusto frente a races del navegador).
 */
export default function RequestOtpTrigger({ email }: { email: string }) {
  const triggered = useRef(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'operator'>('idle')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [operatorUrl, setOperatorUrl] = useState<string>('/operador/login')

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true
    ;(async () => {
      setStatus('sending')
      try {
        const res = await fetch('/api/auth/login/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        // Caso especial: el email es de un operador (staff), no de Actor.
        // Lo dirigimos al panel de operador en vez de mostrar error.
        if (res.status === 409 && json.isOperator) {
          setOperatorUrl(json.operatorLoginUrl || '/operador/login')
          setStatus('operator')
          return
        }
        if (!res.ok || !json.ok) {
          throw new Error(json.error || 'No se pudo enviar el código')
        }
        setStatus('sent')
        if (json.dev_otp) setDevOtp(json.dev_otp)
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [email])

  if (status === 'operator') {
    return (
      <div
        style={{
          marginBottom: '1.25rem',
          padding: '1.25rem 1.25rem',
          background: 'rgba(0,163,255,0.06)',
          border: '1px solid rgba(0,163,255,0.32)',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#00A3FF',
            fontFamily: 'var(--font-dm-mono), monospace',
            marginBottom: '0.6rem',
          }}
        >
          Cuenta de operador
        </div>
        <p
          style={{
            color: '#9FB6CC',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            margin: '0 0 1rem',
          }}
        >
          Tu cuenta es de operador (staff). El acceso de operadores es por el panel
          dedicado, no por esta puerta de Actores.
        </p>
        <a
          href={operatorUrl}
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            background: '#00A3FF',
            color: '#08090F',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: 2,
            fontFamily: 'var(--font-chakra-petch), sans-serif',
          }}
        >
          Ir al panel de operador →
        </a>
      </div>
    )
  }

  if (status === 'idle' || status === 'sending') {
    return (
      <div
        style={{
          marginBottom: '1.25rem',
          fontSize: '0.78rem',
          color: '#7A8899',
          fontFamily: 'var(--font-dm-mono), monospace',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Enviando código…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255,107,107,0.08)',
          border: '1px solid rgba(255,107,107,0.4)',
          borderRadius: 3,
          color: '#FF6B6B',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        {errorMsg}
      </div>
    )
  }

  if (devOtp) {
    return (
      <div
        style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1rem',
          background: 'rgba(240,180,41,0.08)',
          border: '1px solid rgba(240,180,41,0.4)',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#7A8899',
            fontFamily: 'var(--font-dm-mono), monospace',
            marginBottom: '0.35rem',
          }}
        >
          Modo desarrollo · OTP visible
        </div>
        <div
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            color: '#F0B429',
            fontSize: '1.2rem',
            letterSpacing: '0.4em',
            fontWeight: 700,
          }}
        >
          {devOtp}
        </div>
      </div>
    )
  }

  return null
}
