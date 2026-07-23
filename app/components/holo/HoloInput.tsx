'use client'

/**
 * HoloInput · input holográfico premium 1503 v2.
 *
 * Inspirado en buscador de los mockups ("¿Qué necesitas hoy?" + placeholder
 * "cemento · arquitecto Madrid · puerta blindada · ISO 9001..."). Marco fino
 * cyan al focus + glow sutil + label flotante opcional.
 *
 * Variantes:
 *   - default: input estándar de formulario
 *   - search: con icono lupa al inicio · más prominente · estilo header search
 *   - command: monospace · uppercase · estilo HUD terminal · uso power-user
 *
 * Estados:
 *   - reposo · hover (border emphasis) · focus (cyan + glow) · disabled
 *   - error (borde danger + mensaje)
 *
 * A11y:
 *   - label vinculado vía htmlFor cuando se pasa
 *   - aria-invalid cuando hay error
 *   - aria-describedby para mensajes de error / hint
 *   - focus visible siempre presente
 */

import { motion } from 'framer-motion'
import {
  type ReactNode,
  type InputHTMLAttributes,
  forwardRef,
  useState,
  useId,
} from 'react'

export type HoloInputVariant = 'default' | 'search' | 'command'
export type HoloInputSize = 'sm' | 'md' | 'lg'

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'>

export type HoloInputProps = NativeInputProps & {
  /** Label visible · si se omite, se usa aria-label de la prop nativa. */
  label?: string
  /** Mensaje de hint (debajo del input) · no estado error. */
  hint?: string
  /** Mensaje de error · activa estado visual error. */
  error?: string
  /** Icono al inicio (override de search icon en variant=search). */
  iconStart?: ReactNode
  /** Icono al final. */
  iconEnd?: ReactNode
  variant?: HoloInputVariant
  size?: HoloInputSize
  /** ¿Ocupa todo el ancho del contenedor? */
  fullWidth?: boolean
  /** Style override puntual. */
  style?: React.CSSProperties
}

function getSizeStyles(size: HoloInputSize) {
  switch (size) {
    case 'sm': return { height: 32, paddingX: 10, fontSize: 'var(--pm2-text-sm)' }
    case 'lg': return { height: 52, paddingX: 16, fontSize: 'var(--pm2-text-md)' }
    case 'md':
    default: return { height: 42, paddingX: 14, fontSize: 'var(--pm2-text-base)' }
  }
}

export const HoloInput = forwardRef<HTMLInputElement, HoloInputProps>(function HoloInput(
  props,
  ref,
) {
  const {
    label,
    hint,
    error,
    iconStart,
    iconEnd,
    variant = 'default',
    size = 'md',
    fullWidth = false,
    id,
    disabled,
    style,
    ...rest
  } = props

  const reactId = useId()
  const inputId = id ?? reactId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  const s = getSizeStyles(size)
  const showSearchIcon = variant === 'search' && !iconStart

  // Compute border + glow
  let borderColor = 'var(--pm2-border-subtle)'
  let boxShadow = 'none'
  if (error) {
    borderColor = 'var(--pm2-danger)'
    boxShadow = focused ? 'var(--pm2-glow-danger)' : 'none'
  } else if (focused) {
    borderColor = 'var(--pm2-cyan)'
    boxShadow = 'var(--pm2-glow-cyan-soft)'
  } else if (hovered && !disabled) {
    borderColor = 'var(--pm2-border-emphasis)'
  }

  const isCommand = variant === 'command'

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', display: 'inline-flex', flexDirection: 'column', gap: 'var(--pm2-space-2)' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--pm2-font-mono)',
            fontSize: 'var(--pm2-text-xs)',
            color: 'var(--pm2-text-muted)',
            letterSpacing: 'var(--pm2-tracking-wider)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}

      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          borderColor,
          boxShadow,
        }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--pm2-space-2)',
          background: 'var(--pm2-bg-input)',
          border: `1px solid ${borderColor}`,
          boxShadow,
          borderRadius: 'var(--pm2-radius-sm)',
          height: s.height,
          padding: `0 ${s.paddingX}px`,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          ...style,
        }}
      >
        {showSearchIcon && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--pm2-text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}

        {iconStart && (
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--pm2-text-muted)', flexShrink: 0 }}>
            {iconStart}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          onFocus={(e) => {
            setFocused(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            rest.onBlur?.(e)
          }}
          {...rest}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--pm2-text-primary)',
            fontFamily: isCommand ? 'var(--pm2-font-mono)' : 'var(--pm2-font-body)',
            fontSize: s.fontSize,
            letterSpacing: isCommand ? 'var(--pm2-tracking-wide)' : 'var(--pm2-tracking-normal)',
            textTransform: isCommand ? 'uppercase' : 'none',
            padding: 0,
            minWidth: 0,
          }}
        />

        {iconEnd && (
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--pm2-text-muted)', flexShrink: 0 }}>
            {iconEnd}
          </span>
        )}
      </motion.div>

      {hint && !error && (
        <span
          id={hintId}
          style={{
            fontSize: 'var(--pm2-text-xs)',
            color: 'var(--pm2-text-muted)',
            fontFamily: 'var(--pm2-font-body)',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: 'var(--pm2-text-xs)',
            color: 'var(--pm2-danger)',
            fontFamily: 'var(--pm2-font-body)',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  )
})
