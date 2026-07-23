'use client'

/**
 * ProfessionalSidebar · sidebar icon-only vertical estilo enterprise
 * (Teams · Discord · Slack collapsed) con identidad cyan/HUD 1503.
 *
 * Ancho fijo 72px · iconos verticales monocromos en reposo · acento cyan
 * al activo/hover · tooltip al hover. Sticky a la izquierda del workspace.
 *
 * Separación visual en 3 zonas:
 *   - HEADER: brand mark cyan (símbolo 1503, no texto)
 *   - NAV: tabs principales (8 tabs del WorkspaceShell)
 *   - FOOTER: shortcuts inferiores (configuración · ayuda IA · sign-out)
 *
 * Recibe items por props · no conoce los Tab IDs del WorkspaceShell
 * directamente (desacoplado · reutilizable).
 *
 * Uso:
 *   <ProfessionalSidebar
 *     items={[
 *       { id: 'buscador', label: t.tabBuscador, icon: <SearchIcon/> },
 *       { id: 'agenda', label: t.tabAgenda, icon: <CalendarIcon/>, badge: 3 },
 *       ...
 *     ]}
 *     activeId={tab}
 *     onSelect={setTab}
 *     footerItems={[
 *       { id: 'settings', label: t.settings, icon: <SettingsIcon/> },
 *       { id: 'help', label: t.help, icon: <HelpIcon/> },
 *     ]}
 *   />
 */

import { type ReactNode } from 'react'
import { SidebarIconButton } from './SidebarIconButton'

// ============================================================================
// TYPES
// ============================================================================

export type SidebarItem = {
  id: string
  label: string
  icon: ReactNode
  badge?: number
  disabled?: boolean
}

export type ProfessionalSidebarProps = {
  /** Items principales del nav (tabs del workspace). */
  items: SidebarItem[]
  /** ID del item activo (tab seleccionado). */
  activeId: string
  /** Handler de selección de item. */
  onSelect: (id: string) => void
  /** Items inferiores (settings · help · IA · sign-out). Opcional. */
  footerItems?: SidebarItem[]
  /** Brand mark (logo símbolo) en el header. Opcional · default cyan diamond. */
  brandMark?: ReactNode
  /** Sticky offset desde top (cuando hay header del workspace · default 0). */
  topOffset?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProfessionalSidebar(props: ProfessionalSidebarProps) {
  const { items, activeId, onSelect, footerItems, brandMark, topOffset = 0 } = props

  return (
    <aside
      role="navigation"
      aria-label="Workspace sidebar"
      style={{
        position: 'sticky',
        top: topOffset,
        height: `calc(100vh - ${topOffset}px)`,
        width: 72,
        flex: '0 0 72px',
        background: 'var(--pm-bg-base)',
        borderRight: '1px solid var(--pm-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* ───── HEADER · brand mark ───── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 64,
          borderBottom: '1px solid var(--pm-border-subtle)',
          padding: 'var(--pm-space-3)',
        }}
      >
        {brandMark ?? <DefaultBrandMark />}
      </div>

      {/* ───── NAV principal · scrollable ───── */}
      <nav
        aria-label="Workspace tabs"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: 'var(--pm-space-3) 8px',
          overflowY: 'auto',
          overflowX: 'visible',
        }}
      >
        {items.map((item) => (
          <SidebarIconButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={item.id === activeId}
            onClick={() => onSelect(item.id)}
            badge={item.badge}
            disabled={item.disabled}
          />
        ))}
      </nav>

      {/* ───── FOOTER · shortcuts inferiores ───── */}
      {footerItems && footerItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 'var(--pm-space-3) 8px',
            borderTop: '1px solid var(--pm-border-subtle)',
          }}
        >
          {footerItems.map((item) => (
            <SidebarIconButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={item.id === activeId}
              onClick={() => onSelect(item.id)}
              badge={item.badge}
              disabled={item.disabled}
            />
          ))}
        </div>
      )}
    </aside>
  )
}

// ============================================================================
// DEFAULT BRAND MARK · diamante cyan (símbolo 1503)
// ============================================================================

function DefaultBrandMark() {
  return (
    <div
      aria-label="1503"
      title="1503"
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Diamante exterior cyan */}
        <path
          d="M16 2 L30 16 L16 30 L2 16 Z"
          stroke="var(--pm-accent-primary)"
          strokeWidth="1.5"
          fill="var(--pm-accent-primary-soft)"
        />
        {/* Diamante interior · más pequeño · sólido */}
        <path
          d="M16 8 L24 16 L16 24 L8 16 Z"
          stroke="var(--pm-accent-primary)"
          strokeWidth="1"
          fill="var(--pm-accent-primary)"
          fillOpacity="0.3"
        />
        {/* Punto central */}
        <circle cx="16" cy="16" r="2" fill="var(--pm-accent-primary)" />
      </svg>
    </div>
  )
}
