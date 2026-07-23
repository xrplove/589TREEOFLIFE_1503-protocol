'use client'

/**
 * ProductTile · card universal estilo "tile de videollamada enterprise".
 *
 * Estética cyan/HUD propia 1503 (DS v1) + estructura tipo Teams/Zoom
 * (marco fino + esquinas suaves + densidad alta + jerarquía clara).
 *
 * Uso:
 *   <ProductTile
 *     image={{ url: '...', alt: '...' }}
 *     title="Madrid → Shanghai · FCL 20ST"
 *     subtitle="Transitario · Valenciaport"
 *     badge={{ label: 'BORRADOR', tone: 'warning' }}
 *     meta={[
 *       { label: 'Tránsito', value: '28-32 días' },
 *       { label: 'Take rate', value: '0,5%' },
 *     ]}
 *     onClick={() => openFicha(p.sku)}
 *   />
 *
 * Slots:
 *   - image: imagen principal (opcional, fallback placeholder Hex)
 *   - title: 1 línea, truncada con ellipsis si > maxWidth
 *   - subtitle: 1 línea complementaria
 *   - badge: estado / tier / status (badge variants tipados)
 *   - meta: 2-4 pares label/value compactos en footer
 *   - footer: nodo libre opcional al final (e.g. CTA "Solicitar cotización")
 *   - corner: nodo libre en esquina superior derecha (e.g. icono "fav")
 *
 * Estados:
 *   - reposo: borde subtle, fondo elevado
 *   - hover: borde cyan + glow suave
 *   - focus: borde cyan + outline visible (a11y)
 *   - active (selected): borde cyan + glow medio + fondo halo
 *   - loading: skeleton placeholder con shimmer
 *   - disabled: opacidad reducida, sin interacción
 *
 * A11y:
 *   - role="button" + aria-label si onClick
 *   - role="article" si solo display
 *   - keyboard: Enter/Space activan onClick
 *   - focus-visible outline siempre presente
 *
 * NO traduce internamente · recibe strings YA localizados.
 * NO maneja navegación · solo dispara onClick para que el padre decida.
 */

import { type ReactNode, type KeyboardEvent, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type ProductTileBadgeTone =
  | 'neutral'      // gris azulado · default
  | 'cyan'         // acento 1503 · brand
  | 'success'      // verde · OK · disponible · KYC aprobado
  | 'warning'      // amarillo · BORRADOR · pendiente · revisión
  | 'danger'       // rojo coral · rechazado · suspendido
  | 'tier_bronce'  // bronce loyalty
  | 'tier_plata'   // plata loyalty
  | 'tier_oro'     // oro loyalty

export type ProductTileBadge = {
  label: string
  tone?: ProductTileBadgeTone
}

export type ProductTileMeta = {
  label: string  // Already-localized label (e.g. "Tránsito", "Take rate")
  value: string  // Already-localized value (e.g. "28-32 días", "0,5%")
  /** Si true, value se muestra en monospace HUD. */
  mono?: boolean
}

export type ProductTileImage = {
  url: string
  alt: string  // Already-localized alt text
}

export type ProductTileProps = {
  // Content slots
  image?: ProductTileImage
  title: string
  subtitle?: string
  badge?: ProductTileBadge
  meta?: ProductTileMeta[]
  corner?: ReactNode  // top-right corner node (e.g. fav icon · KYC verified badge)
  footer?: ReactNode  // bottom slot (e.g. CTA button)
  children?: ReactNode  // free content slot below subtitle

  // Behavior
  onClick?: () => void
  ariaLabel?: string  // Required if onClick · accessible label
  selected?: boolean
  disabled?: boolean
  loading?: boolean
}

// ============================================================================
// BADGE TONE → COLOR MAPPING (uses DS v1 tokens)
// ============================================================================

function badgeToneStyles(tone: ProductTileBadgeTone | undefined): {
  background: string
  color: string
  border: string
} {
  switch (tone) {
    case 'cyan':
      return {
        background: 'var(--pm-accent-primary-soft)',
        color: 'var(--pm-accent-primary)',
        border: '1px solid var(--pm-accent-primary)',
      }
    case 'success':
      return {
        background: 'rgba(46, 255, 140, 0.10)',
        color: 'var(--pm-accent-success)',
        border: '1px solid rgba(46, 255, 140, 0.35)',
      }
    case 'warning':
      return {
        background: 'rgba(240, 180, 41, 0.10)',
        color: 'var(--pm-accent-warning)',
        border: '1px solid rgba(240, 180, 41, 0.35)',
      }
    case 'danger':
      return {
        background: 'rgba(255, 90, 106, 0.10)',
        color: 'var(--pm-accent-danger)',
        border: '1px solid rgba(255, 90, 106, 0.35)',
      }
    case 'tier_bronce':
      return {
        background: 'rgba(205, 127, 50, 0.10)',
        color: '#CD7F32',
        border: '1px solid rgba(205, 127, 50, 0.40)',
      }
    case 'tier_plata':
      return {
        background: 'rgba(192, 192, 192, 0.10)',
        color: '#D0D0D0',
        border: '1px solid rgba(192, 192, 192, 0.40)',
      }
    case 'tier_oro':
      return {
        background: 'rgba(255, 215, 0, 0.10)',
        color: '#FFD700',
        border: '1px solid rgba(255, 215, 0, 0.40)',
      }
    case 'neutral':
    default:
      return {
        background: 'var(--pm-bg-overlay)',
        color: 'var(--pm-text-secondary)',
        border: '1px solid var(--pm-border-subtle)',
      }
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductTile(props: ProductTileProps) {
  const {
    image,
    title,
    subtitle,
    badge,
    meta,
    corner,
    footer,
    children,
    onClick,
    ariaLabel,
    selected = false,
    disabled = false,
    loading = false,
  } = props

  const isInteractive = Boolean(onClick) && !disabled && !loading

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

  // Compute border/glow based on state (priority: selected > hover/focus via CSS > resting)
  const borderColor = selected
    ? 'var(--pm-accent-primary)'
    : 'var(--pm-border-subtle)'
  const boxShadow = selected
    ? 'var(--pm-glow-cyan-md)'
    : 'var(--pm-shadow-sm)'
  const background = selected
    ? 'linear-gradient(180deg, var(--pm-accent-primary-soft) 0%, var(--pm-bg-elev) 60%)'
    : 'var(--pm-bg-elev)'

  return (
    <div
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={ariaLabel ?? (isInteractive ? title : undefined)}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      data-pm-tile-state={
        disabled ? 'disabled' : loading ? 'loading' : selected ? 'selected' : 'idle'
      }
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 200,
        background,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--pm-radius-md)',
        boxShadow,
        cursor: isInteractive ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        transition: `border-color var(--pm-duration-base) var(--pm-ease-out), box-shadow var(--pm-duration-base) var(--pm-ease-out), transform var(--pm-duration-base) var(--pm-ease-out)`,
        outline: 'none',
        overflow: 'hidden',
        userSelect: isInteractive ? 'none' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (!isInteractive) return
        e.currentTarget.style.borderColor = 'var(--pm-accent-primary)'
        e.currentTarget.style.boxShadow = 'var(--pm-glow-cyan-soft)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        if (!isInteractive) return
        e.currentTarget.style.borderColor = borderColor
        e.currentTarget.style.boxShadow = boxShadow
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      onFocus={(e) => {
        if (!isInteractive) return
        e.currentTarget.style.borderColor = 'var(--pm-accent-primary)'
        e.currentTarget.style.boxShadow = 'var(--pm-glow-cyan-md)'
      }}
      onBlur={(e) => {
        if (!isInteractive) return
        e.currentTarget.style.borderColor = borderColor
        e.currentTarget.style.boxShadow = boxShadow
      }}
    >
      {/* Loading skeleton overlay */}
      {loading && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent 0%, var(--pm-accent-primary-soft) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'pm-shimmer 1.6s linear infinite',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Top-right corner slot */}
      {corner && !loading && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--pm-space-3)',
            right: 'var(--pm-space-3)',
            zIndex: 1,
          }}
        >
          {corner}
        </div>
      )}

      {/* IMAGE SECTION */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          width: '100%',
          background: 'var(--pm-bg-base)',
          borderBottom: '1px solid var(--pm-border-subtle)',
          overflow: 'hidden',
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Badge (top-left of image) */}
        {badge && (
          <div
            style={{
              position: 'absolute',
              top: 'var(--pm-space-3)',
              left: 'var(--pm-space-3)',
              ...badgeToneStyles(badge.tone),
              padding: '3px 8px',
              borderRadius: 'var(--pm-radius-sm)',
              fontSize: 'var(--pm-text-xs)',
              fontFamily: 'var(--pm-font-mono)',
              letterSpacing: 'var(--pm-tracking-wider)',
              textTransform: 'uppercase',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {badge.label}
          </div>
        )}
      </div>

      {/* BODY SECTION */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--pm-space-4)',
          gap: 'var(--pm-space-2)',
        }}
      >
        {/* Title */}
        <h3
          style={{
            margin: 0,
            color: 'var(--pm-text-primary)',
            fontFamily: 'var(--pm-font-display)',
            fontSize: 'var(--pm-text-md)',
            fontWeight: 600,
            letterSpacing: '-0.005em',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              margin: 0,
              color: 'var(--pm-text-secondary)',
              fontSize: 'var(--pm-text-sm)',
              fontFamily: 'var(--pm-font-body)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Free children slot */}
        {children}

        {/* META key-value pairs */}
        {meta && meta.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 'var(--pm-space-3)',
              display: 'grid',
              gridTemplateColumns: meta.length > 2 ? '1fr 1fr' : '1fr',
              gap: 'var(--pm-space-2) var(--pm-space-4)',
              borderTop: '1px dashed var(--pm-border-subtle)',
            }}
          >
            {meta.map((m, i) => (
              <div key={`${m.label}-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    color: 'var(--pm-text-muted)',
                    fontSize: 'var(--pm-text-xs)',
                    fontFamily: 'var(--pm-font-mono)',
                    letterSpacing: 'var(--pm-tracking-wide)',
                    textTransform: 'uppercase',
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    color: 'var(--pm-text-primary)',
                    fontSize: 'var(--pm-text-sm)',
                    fontFamily: m.mono ? 'var(--pm-font-mono)' : 'var(--pm-font-body)',
                    fontWeight: 500,
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer slot (CTA, etc.) */}
        {footer && (
          <div
            style={{
              marginTop: 'var(--pm-space-3)',
              paddingTop: 'var(--pm-space-3)',
              borderTop: '1px solid var(--pm-border-subtle)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// IMAGE PLACEHOLDER · cuando no hay imagen, mostramos Hex con paleta cyan
// ============================================================================

function ImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center, var(--pm-bg-elev) 0%, var(--pm-bg-base) 80%)',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--pm-accent-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.5 }}
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  )
}
