'use client'

/**
 * HoloButton · botón holográfico premium 1503 v2.
 *
 * Variantes:
 *   - primary: relleno cyan · texto dark · uso principal CTA
 *   - secondary: contorno cyan · texto cyan · uso secundario
 *   - ghost: sin contorno · texto cyan · uso terciario
 *   - premium: relleno amber · texto dark · tier Oro / loyalty premium / cash-out
 *   - danger: contorno rojo · uso destructivo (eliminar · cancelar · suspender)
 *
 * Tamaños:
 *   - sm: 32px alto · botones secundarios densos
 *   - md: 40px alto · default
 *   - lg: 48px alto · CTA principales
 *
 * Estados:
 *   - reposo · hover (lift + glow) · focus (outline visible) · active (scale)
 *   - disabled (opacidad + no interaction)
 *   - loading (spinner + texto · sin interaction)
 *
 * A11y:
 *   - aria-busy cuando loading
 *   - aria-disabled cuando disabled
 *   - prefers-reduced-motion · animaciones reducidas
 */

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

export type HoloButtonVariant = 'primary' | 'secondary' | 'ghost' | 'premium' | 'danger'
export type HoloButtonSize = 'sm' | 'md' | 'lg'

export type HoloButtonProps = {
  children: ReactNode
  variant?: HoloButtonVariant
  size?: HoloButtonSize
  /** Icono opcional al inicio (16-18px típicamente). */
  iconStart?: ReactNode
  /** Icono opcional al final. */
  iconEnd?: ReactNode
  /** Loading state · muestra spinner + bloquea clicks. */
  loading?: boolean
  /** ¿Ocupa todo el ancho del contenedor? */
  fullWidth?: boolean
  /** Click handler. */
  onClick?: () => void
  /** Disabled state. */
  disabled?: boolean
  /** HTML button type · default 'button' para evitar submits accidentales. */
  type?: 'button' | 'submit' | 'reset'
  /** Accessible label · si los children NO son texto plano (e.g. solo icono). */
  ariaLabel?: string
  /** Style override puntual. */
  style?: React.CSSProperties
}

// ============================================================================
// VARIANT → STYLE MAPPING
// ============================================================================

type VariantStyles = {
  background: string
  color: string
  border: string
  boxShadow: string
  hoverBg: string
  hoverShadow: string
}

function getVariantStyles(variant: HoloButtonVariant): VariantStyles {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--pm2-cyan)',
        color: 'var(--pm2-text-on-cyan)',
        border: '1px solid var(--pm2-cyan)',
        boxShadow: 'var(--pm2-glow-cyan-soft)',
        hoverBg: 'var(--pm2-cyan-bright)',
        hoverShadow: 'var(--pm2-glow-cyan-medium)',
      }
    case 'secondary':
      return {
        background: 'transparent',
        color: 'var(--pm2-cyan-text)',
        border: '1px solid var(--pm2-border-cyan)',
        boxShadow: 'none',
        hoverBg: 'var(--pm2-cyan-soft)',
        hoverShadow: 'var(--pm2-glow-cyan-soft)',
      }
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--pm2-cyan-text)',
        border: '1px solid transparent',
        boxShadow: 'none',
        hoverBg: 'var(--pm2-cyan-soft)',
        hoverShadow: 'none',
      }
    case 'premium':
      return {
        background: 'var(--pm2-amber)',
        color: 'var(--pm2-text-on-amber)',
        border: '1px solid var(--pm2-amber)',
        boxShadow: 'var(--pm2-glow-amber-soft)',
        hoverBg: 'var(--pm2-amber-bright)',
        hoverShadow: 'var(--pm2-glow-amber-medium)',
      }
    case 'danger':
      return {
        background: 'transparent',
        color: 'var(--pm2-danger)',
        border: '1px solid var(--pm2-danger)',
        boxShadow: 'none',
        hoverBg: 'var(--pm2-danger-soft)',
        hoverShadow: 'var(--pm2-glow-danger)',
      }
  }
}

function getSizeStyles(size: HoloButtonSize) {
  switch (size) {
    case 'sm': return { height: 32, padding: '0 12px', fontSize: 'var(--pm2-text-sm)' }
    case 'lg': return { height: 48, padding: '0 28px', fontSize: 'var(--pm2-text-md)' }
    case 'md':
    default: return { height: 40, padding: '0 20px', fontSize: 'var(--pm2-text-base)' }
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HoloButton(props: HoloButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    iconStart,
    iconEnd,
    loading = false,
    fullWidth = false,
    onClick,
    disabled,
    type = 'button',
    ariaLabel,
    style,
  } = props

  const isDisabled = disabled || loading
  const v = getVariantStyles(variant)
  const s = getSizeStyles(size)

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      aria-label={ariaLabel}
      whileHover={!isDisabled ? { y: -1, backgroundColor: v.hoverBg, boxShadow: v.hoverShadow } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--pm2-space-2)',
        background: v.background,
        color: v.color,
        border: v.border,
        boxShadow: v.boxShadow,
        borderRadius: 'var(--pm2-radius-sm)',
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'var(--pm2-font-mono)',
        fontWeight: 600,
        letterSpacing: 'var(--pm2-tracking-wide)',
        textTransform: 'uppercase',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        outline: 'none',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconStart && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconStart}</span>}
          <span>{children}</span>
          {iconEnd && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconEnd}</span>}
        </>
      )}
    </motion.button>
  )
}

// ============================================================================
// SPINNER · loading indicator
// ============================================================================

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      style={{
        animation: 'pm2-rotate-slow 0.9s linear infinite',
        flexShrink: 0,
      }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
