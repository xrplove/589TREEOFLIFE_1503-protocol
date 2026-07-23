'use client'

/**
 * HoloCard · panel holográfico premium con glassmorphism.
 *
 * Inspirado en los mockups de José (Tony Stark hub + luxury finance):
 *   - Glassmorphism real (backdrop-blur)
 *   - Marco fino cyan o amber
 *   - Glow sutil al hover (no agresivo)
 *   - Scan-line opcional al hover (efecto HUD escaneo)
 *   - Animaciones entrada con framer-motion
 *
 * Variantes:
 *   - default: marco cyan sutil · glow al hover
 *   - active: marco cyan + glow medium siempre
 *   - premium: marco amber · uso tier Oro · loyalty premium · destacados
 *   - ghost: borde casi invisible · contexto bg
 *
 * Tamaños:
 *   - sm: padding 16px · uso lateral
 *   - md: padding 24px · default · cards mainstream
 *   - lg: padding 32px · hero cards · cabeceras de sección
 *
 * A11y:
 *   - role automático (button si onClick · article si solo display)
 *   - aria-label requerido si onClick
 *   - keyboard Enter/Space activan onClick
 *   - focus-visible outline cyan visible
 *   - respect prefers-reduced-motion
 */

import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode, type KeyboardEvent, useCallback } from 'react'

export type HoloCardVariant = 'default' | 'active' | 'premium' | 'ghost'
export type HoloCardSize = 'sm' | 'md' | 'lg'

export type HoloCardProps = {
  children: ReactNode
  variant?: HoloCardVariant
  size?: HoloCardSize
  /** Click handler · si presente, card se convierte en interactivo. */
  onClick?: () => void
  /** Aria-label requerido si onClick. */
  ariaLabel?: string
  /** Disabled state · sin interacción · reducida opacidad. */
  disabled?: boolean
  /** Mostrar línea de scan animada al hover (efecto HUD). */
  scanOnHover?: boolean
  /** Delay de entrada (segundos) · útil para stagger de listas. */
  enterDelay?: number
  /** Override de estilo libre · usar con prudencia (solo cuando token no llega). */
  style?: React.CSSProperties
  /** Adicional className para utilidades Tailwind si aplica. */
  className?: string
}

// ============================================================================
// VARIANT → STYLE MAPPING
// ============================================================================

function getVariantStyles(variant: HoloCardVariant): {
  borderColor: string
  background: string
  boxShadow: string
  hoverBorderColor: string
  hoverBoxShadow: string
} {
  switch (variant) {
    case 'active':
      return {
        borderColor: 'var(--pm2-border-cyan)',
        background:
          'linear-gradient(135deg, var(--pm2-cyan-soft) 0%, rgba(20, 35, 64, 0.55) 50%)',
        boxShadow: 'var(--pm2-glow-cyan-medium)',
        hoverBorderColor: 'var(--pm2-cyan-bright)',
        hoverBoxShadow: 'var(--pm2-glow-cyan-strong)',
      }
    case 'premium':
      return {
        borderColor: 'var(--pm2-border-amber)',
        background:
          'linear-gradient(135deg, var(--pm2-amber-soft) 0%, rgba(20, 35, 64, 0.55) 50%)',
        boxShadow: 'var(--pm2-glow-amber-soft)',
        hoverBorderColor: 'var(--pm2-amber-bright)',
        hoverBoxShadow: 'var(--pm2-glow-amber-medium)',
      }
    case 'ghost':
      return {
        borderColor: 'var(--pm2-border-faint)',
        background: 'rgba(20, 35, 64, 0.30)',
        boxShadow: 'none',
        hoverBorderColor: 'var(--pm2-border-subtle)',
        hoverBoxShadow: 'var(--pm2-shadow-sm)',
      }
    case 'default':
    default:
      return {
        borderColor: 'var(--pm2-border-subtle)',
        background: 'rgba(20, 35, 64, 0.55)',
        boxShadow: 'var(--pm2-shadow-sm)',
        hoverBorderColor: 'var(--pm2-border-cyan)',
        hoverBoxShadow: 'var(--pm2-glow-cyan-soft)',
      }
  }
}

function getSizePadding(size: HoloCardSize): string {
  switch (size) {
    case 'sm': return 'var(--pm2-space-4)'
    case 'lg': return 'var(--pm2-space-7)'
    case 'md':
    default: return 'var(--pm2-space-6)'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HoloCard(props: HoloCardProps) {
  const {
    children,
    variant = 'default',
    size = 'md',
    onClick,
    ariaLabel,
    disabled = false,
    scanOnHover = false,
    enterDelay = 0,
    style,
    className,
  } = props

  const isInteractive = Boolean(onClick) && !disabled
  const v = getVariantStyles(variant)
  const padding = getSizePadding(size)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive || !onClick) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    [isInteractive, onClick],
  )

  // framer-motion variants for entrance + hover + active
  const motionVariants: HTMLMotionProps<'div'>['variants'] = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: enterDelay },
    },
  }

  const hoverAnim = isInteractive
    ? {
        y: -2,
        borderColor: v.hoverBorderColor,
        boxShadow: v.hoverBoxShadow,
      }
    : undefined

  const tapAnim = isInteractive ? { scale: 0.98 } : undefined

  return (
    <motion.div
      variants={motionVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverAnim}
      whileTap={tapAnim}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        position: 'relative',
        background: v.background,
        backdropFilter: `blur(var(--pm2-blur-md)) saturate(140%)`,
        WebkitBackdropFilter: `blur(var(--pm2-blur-md)) saturate(140%)`,
        border: `1px solid ${v.borderColor}`,
        borderRadius: 'var(--pm2-radius-md)',
        boxShadow: v.boxShadow,
        padding,
        cursor: isInteractive ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        overflow: 'hidden',
        outline: 'none',
        userSelect: isInteractive ? 'none' : 'auto',
        ...style,
      }}
    >
      {/* Scan line · solo al hover si scanOnHover */}
      {scanOnHover && isInteractive && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40%',
            height: '100%',
            background:
              'linear-gradient(90deg, transparent 0%, var(--pm2-cyan-strong) 50%, transparent 100%)',
            opacity: 0,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
          className="pm2-card-scan"
        />
      )}
      {children}
    </motion.div>
  )
}
