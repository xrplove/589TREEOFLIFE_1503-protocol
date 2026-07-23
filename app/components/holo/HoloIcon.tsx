'use client'

/**
 * HoloIcon · wrapper holográfico para cualquier SVG (Lucide · Heroicons · custom).
 *
 * Aplica tratamiento holográfico:
 *   - Color cyan o amber (según variante)
 *   - Filter glow sutil (drop-shadow + blur · efecto holograma)
 *   - Animaciones opcionales: pulse · float · rotate
 *   - Hover state · intensifica glow
 *
 * Uso:
 *   <HoloIcon variant="cyan" size={24}>
 *     <YourSvgIcon />
 *   </HoloIcon>
 *
 * Variantes:
 *   - cyan: glow cyan default
 *   - amber: glow amber premium / tier Oro
 *   - success: glow verde
 *   - danger: glow rojo
 *   - muted: sin glow · color secundario · uso ambient
 *
 * Animaciones (props):
 *   - pulse: pulso cyan continuo · status activo
 *   - float: flotar suavemente arriba-abajo · ambient
 *   - rotate: girar lento · loading o decoración
 */

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

export type HoloIconVariant = 'cyan' | 'amber' | 'success' | 'danger' | 'muted'
export type HoloIconAnim = 'none' | 'pulse' | 'float' | 'rotate'

export type HoloIconProps = {
  children: ReactNode
  variant?: HoloIconVariant
  /** Tamaño del wrapper en px · default 24. */
  size?: number
  /** Animación continua del icono. */
  anim?: HoloIconAnim
  /** Click handler · convierte el icon en interactivo. */
  onClick?: () => void
  /** Aria-label si onClick · si solo display, role decorative. */
  ariaLabel?: string
  /** Override de glow intensity (0-3). Default 1. */
  glowIntensity?: 0 | 1 | 2 | 3
  /** Bgcolor opcional para variants con halo. */
  withHalo?: boolean
}

function getColor(variant: HoloIconVariant): string {
  switch (variant) {
    case 'cyan': return 'var(--pm2-cyan)'
    case 'amber': return 'var(--pm2-amber)'
    case 'success': return 'var(--pm2-success)'
    case 'danger': return 'var(--pm2-danger)'
    case 'muted': return 'var(--pm2-text-muted)'
  }
}

function getDropShadow(variant: HoloIconVariant, intensity: 0 | 1 | 2 | 3): string {
  if (intensity === 0 || variant === 'muted') return 'none'
  const color = (() => {
    switch (variant) {
      case 'cyan': return 'rgba(0, 212, 255'
      case 'amber': return 'rgba(255, 213, 128'
      case 'success': return 'rgba(46, 255, 140'
      case 'danger': return 'rgba(255, 90, 106'
      default: return 'rgba(0, 212, 255'
    }
  })()
  const alpha = intensity === 1 ? 0.5 : intensity === 2 ? 0.7 : 0.9
  const blur = intensity === 1 ? 4 : intensity === 2 ? 8 : 12
  return `drop-shadow(0 0 ${blur}px ${color}, ${alpha}))`
}

export function HoloIcon(props: HoloIconProps) {
  const {
    children,
    variant = 'cyan',
    size = 24,
    anim = 'none',
    onClick,
    ariaLabel,
    glowIntensity = 1,
    withHalo = false,
  } = props

  const color = getColor(variant)
  const filter = getDropShadow(variant, glowIntensity)
  const isInteractive = Boolean(onClick)

  // Animation properties per anim type
  const animProps = (() => {
    switch (anim) {
      case 'pulse':
        return {
          animate: { opacity: [1, 0.7, 1] as number[] },
          transition: { duration: 1.8, ease: 'easeInOut' as const, repeat: Infinity },
        }
      case 'float':
        return {
          animate: { y: [0, -4, 0] as number[] },
          transition: { duration: 2.4, ease: 'easeInOut' as const, repeat: Infinity },
        }
      case 'rotate':
        return {
          animate: { rotate: 360 },
          transition: { duration: 8, ease: 'linear' as const, repeat: Infinity },
        }
      case 'none':
      default:
        return {}
    }
  })()

  return (
    <motion.span
      role={isInteractive ? 'button' : 'img'}
      aria-label={ariaLabel}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      whileHover={isInteractive ? { scale: 1.08, filter: getDropShadow(variant, Math.min(3, glowIntensity + 1) as 0 | 1 | 2 | 3) } : undefined}
      whileTap={isInteractive ? { scale: 0.94 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      {...animProps}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        filter,
        cursor: isInteractive ? 'pointer' : 'default',
        outline: 'none',
        background: withHalo
          ? (variant === 'cyan'
            ? 'radial-gradient(circle, var(--pm2-cyan-soft) 0%, transparent 65%)'
            : variant === 'amber'
              ? 'radial-gradient(circle, var(--pm2-amber-soft) 0%, transparent 65%)'
              : 'transparent')
          : 'transparent',
        borderRadius: '50%',
      }}
    >
      {children}
    </motion.span>
  )
}
