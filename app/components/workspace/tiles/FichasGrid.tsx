'use client'

/**
 * FichasGrid · layout responsive de tiles (ProductTile / TransporteFichaCard /
 * cualquier tile que componga ProductTile).
 *
 * Breakpoints CSS-only (sin JS · sin window resize listener):
 *   - < 640px (mobile): 1 columna
 *   - 640-1024px (tablet): 2 columnas
 *   - 1024-1440px (laptop): 3 columnas
 *   - > 1440px (desktop wide): 4 columnas
 *
 * Recibe children directamente · NO conoce el shape de los productos.
 * El padre genera los <TransporteFichaCard /> (o cualquier otro tile) y los
 * mete dentro del Grid.
 *
 * Estados:
 *   - normal: renderiza children
 *   - empty: si no hay children, muestra estado vacío con CTA opcional
 *   - loading: muestra N skeleton tiles
 *   - error: muestra mensaje de error con retry handler
 */

import { type ReactNode, type CSSProperties } from 'react'
import { ProductTile } from './ProductTile'

// ============================================================================
// TYPES
// ============================================================================

export type FichasGridProps = {
  children?: ReactNode
  /** Override densidad: 'comfortable' (default · gap 16px) o 'compact' (gap 8px). */
  density?: 'comfortable' | 'compact'
  /** Estado vacío · se muestra si children es null/undefined o array vacío. */
  emptyState?: {
    title: string
    description?: string
    cta?: ReactNode
  }
  /** Estado loading · muestra N skeleton tiles. Si > 0, ignora children. */
  loading?: number
  /** Estado error · muestra mensaje + opcional retry. */
  error?: {
    message: string
    onRetry?: () => void
    retryLabel?: string
  }
}

// ============================================================================
// HELPERS · grid styles
// ============================================================================

function gridStyle(density: 'comfortable' | 'compact' = 'comfortable'): CSSProperties {
  const gap = density === 'comfortable' ? 'var(--pm-space-4)' : 'var(--pm-space-2)'
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap,
    width: '100%',
  }
}

function isEmpty(children: ReactNode): boolean {
  if (children === null || children === undefined) return true
  if (Array.isArray(children) && children.length === 0) return true
  return false
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FichasGrid(props: FichasGridProps) {
  const { children, density = 'comfortable', emptyState, loading, error } = props

  // Error state takes priority
  if (error) {
    return <ErrorState {...error} />
  }

  // Loading state · render skeleton tiles
  if (loading && loading > 0) {
    return (
      <div style={gridStyle(density)} aria-busy="true" aria-label="Cargando fichas">
        {Array.from({ length: loading }).map((_, i) => (
          <ProductTile key={`skeleton-${i}`} title="" loading />
        ))}
      </div>
    )
  }

  // Empty state
  if (isEmpty(children) && emptyState) {
    return <EmptyState {...emptyState} />
  }

  // Normal grid
  return <div style={gridStyle(density)}>{children}</div>
}

// ============================================================================
// EMPTY STATE · "no hay fichas todavía"
// ============================================================================

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string
  description?: string
  cta?: ReactNode
}) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--pm-space-7) var(--pm-space-5)',
        textAlign: 'center',
        gap: 'var(--pm-space-3)',
        background: 'var(--pm-bg-elev)',
        border: '1px dashed var(--pm-border-subtle)',
        borderRadius: 'var(--pm-radius-md)',
        minHeight: 280,
      }}
    >
      {/* Empty icon · hexagonal placeholder */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--pm-accent-primary)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: 0.4, marginBottom: 'var(--pm-space-2)' }}
      >
        <polygon points="12 2 22 8 22 16 12 22 2 16 2 8" />
      </svg>
      <h3
        style={{
          margin: 0,
          color: 'var(--pm-text-primary)',
          fontFamily: 'var(--pm-font-display)',
          fontSize: 'var(--pm-text-lg)',
          fontWeight: 600,
          letterSpacing: '-0.005em',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            color: 'var(--pm-text-secondary)',
            fontSize: 'var(--pm-text-base)',
            maxWidth: 420,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {cta && <div style={{ marginTop: 'var(--pm-space-3)' }}>{cta}</div>}
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({
  message,
  onRetry,
  retryLabel = 'Reintentar',
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--pm-space-7) var(--pm-space-5)',
        textAlign: 'center',
        gap: 'var(--pm-space-3)',
        background: 'rgba(255, 90, 106, 0.04)',
        border: '1px solid rgba(255, 90, 106, 0.30)',
        borderRadius: 'var(--pm-radius-md)',
        minHeight: 280,
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--pm-accent-danger)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p
        style={{
          margin: 0,
          color: 'var(--pm-accent-danger)',
          fontSize: 'var(--pm-text-base)',
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 'var(--pm-space-2)',
            padding: '8px 16px',
            background: 'var(--pm-accent-primary-soft)',
            color: 'var(--pm-accent-primary)',
            border: '1px solid var(--pm-accent-primary)',
            borderRadius: 'var(--pm-radius-sm)',
            cursor: 'pointer',
            fontSize: 'var(--pm-text-sm)',
            fontFamily: 'var(--pm-font-mono)',
            letterSpacing: 'var(--pm-tracking-wide)',
            textTransform: 'uppercase',
            transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
