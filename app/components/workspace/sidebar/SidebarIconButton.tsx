'use client'

/**
 * SidebarIconButton · botón icon-only del ProfessionalSidebar.
 *
 * Estados (manejados internamente vía CSS-in-JS + onMouseEnter/Leave):
 *   - reposo: icono en --pm-text-secondary (gris cyan)
 *   - hover: icono en --pm-text-primary + fondo halo cyan suave + tooltip
 *   - focus: igual que hover + outline cyan visible
 *   - active (current tab): icono en --pm-accent-primary + barra lateral
 *     izquierda cyan + glow suave
 *
 * A11y:
 *   - aria-label obligatorio (el label visible es solo tooltip)
 *   - aria-current="page" cuando active
 *   - tooltip via title attr (accesible para screen readers)
 *   - Enter / Space activan onClick
 */

import { type ReactNode, type KeyboardEvent, useCallback, useState } from 'react'

export type SidebarIconButtonProps = {
  /** Icono ReactNode · típicamente SVG 20-22px desde icons.tsx. */
  icon: ReactNode
  /** Label visible en tooltip + accesible para lectores de pantalla. */
  label: string
  /** ¿Es el tab activo? Marca con barra lateral + glow. */
  active?: boolean
  /** Handler de click. */
  onClick: () => void
  /** Badge numérico opcional (e.g. mensajes sin leer). */
  badge?: number
  /** Disabled state. */
  disabled?: boolean
}

export function SidebarIconButton(props: SidebarIconButtonProps) {
  const { icon, label, active = false, onClick, badge, disabled = false } = props
  const [hovered, setHovered] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    [disabled, onClick],
  )

  // Color logic
  const iconColor = disabled
    ? 'var(--pm-text-muted)'
    : active
      ? 'var(--pm-accent-primary)'
      : hovered
        ? 'var(--pm-text-primary)'
        : 'var(--pm-text-secondary)'

  const background = active
    ? 'var(--pm-accent-primary-soft)'
    : hovered
      ? 'rgba(255, 255, 255, 0.03)'
      : 'transparent'

  const leftBarBackground = active ? 'var(--pm-accent-primary)' : 'transparent'

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => !disabled && setHovered(true)}
      onBlur={() => setHovered(false)}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      title={label}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 52,
        background,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: `background-color var(--pm-duration-base) var(--pm-ease-out), color var(--pm-duration-base) var(--pm-ease-out), box-shadow var(--pm-duration-base) var(--pm-ease-out)`,
        boxShadow: active ? 'var(--pm-glow-cyan-soft)' : 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        borderRadius: 'var(--pm-radius-sm)',
        color: iconColor,
      }}
    >
      {/* Left active bar */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 8,
          bottom: 8,
          width: 2,
          background: leftBarBackground,
          borderRadius: '0 2px 2px 0',
          transition: 'background-color var(--pm-duration-base) var(--pm-ease-out)',
        }}
      />

      {/* Icon (color is inherited via currentColor) */}
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          transition: 'color var(--pm-duration-base) var(--pm-ease-out)',
        }}
      >
        {icon}
      </span>

      {/* Badge (numeric, e.g. unread messages) */}
      {badge !== undefined && badge > 0 && !disabled && (
        <span
          aria-label={`${badge} sin leer`}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            background: 'var(--pm-accent-danger)',
            color: '#FFFFFF',
            borderRadius: 'var(--pm-radius-full)',
            fontSize: '0.6rem',
            fontFamily: 'var(--pm-font-mono)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border: '1px solid var(--pm-bg-deep)',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Tooltip (visible on hover) */}
      {hovered && !disabled && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 12,
            padding: '6px 10px',
            background: 'var(--pm-bg-overlay)',
            color: 'var(--pm-text-primary)',
            border: '1px solid var(--pm-border-emphasis)',
            borderRadius: 'var(--pm-radius-sm)',
            fontSize: 'var(--pm-text-sm)',
            fontFamily: 'var(--pm-font-body)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: 'var(--pm-shadow-md)',
            letterSpacing: 'var(--pm-tracking-tight)',
          }}
        >
          {label}
        </span>
      )}
    </button>
  )
}
