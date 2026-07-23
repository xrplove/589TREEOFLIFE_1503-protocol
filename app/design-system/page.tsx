'use client'

/**
 * Página de preview del Design System v1 (1503).
 *
 * Muestra todos los tokens (paleta + tipografía + spacing + radii +
 * sombras + glows) aplicados a componentes representativos: botones,
 * cards, paneles HUD, monospace, indicadores, formularios.
 *
 * Esta página es SOLO para validación visual durante el rediseño. Se
 * borrará / ocultará tras aprobar el sistema y aplicarlo al producto.
 *
 * URL: /design-system
 */

export default function DesignSystemPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pm-bg-deep)',
        color: 'var(--pm-text-primary)',
        fontFamily: 'var(--pm-font-body)',
        padding: 'var(--pm-space-7) var(--pm-space-6)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-7)' }}>
        <Header />
        <PaletteSection />
        <TypographySection />
        <ButtonsSection />
        <CardsSection />
        <HudPanelsSection />
        <FormSection />
        <IndicatorsSection />
        <SpacingSection />
        <TilesSection />
        <SidebarPreviewSection />
      </div>
    </div>
  )
}

/* ──────────────────────────── HEADER ──────────────────────────── */
function Header() {
  return (
    <header style={{ borderBottom: '1px solid var(--pm-border-subtle)', paddingBottom: 'var(--pm-space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--pm-space-3)', marginBottom: 'var(--pm-space-2)' }}>
        <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-accent-primary)', letterSpacing: 'var(--pm-tracking-wider)', textTransform: 'uppercase' }}>
          1503 · DESIGN SYSTEM
        </span>
        <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wide)' }}>
          v1.0 · 2026-05-25
        </span>
      </div>
      <h1 style={{ fontFamily: 'var(--pm-font-display)', fontSize: 'var(--pm-text-3xl)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--pm-text-primary)' }}>
        Sistema visual <span style={{ color: 'var(--pm-accent-primary)' }}>cyan/HUD</span>
      </h1>
      <p style={{ marginTop: 'var(--pm-space-3)', color: 'var(--pm-text-secondary)', maxWidth: 720, fontSize: 'var(--pm-text-md)', lineHeight: 1.55 }}>
        Tokens centralizados en <code style={{ fontFamily: 'var(--pm-font-mono)', color: 'var(--pm-text-cyan)', fontSize: 'var(--pm-text-sm)' }}>app/styles/design-tokens.css</code>. Esta página es solo para validar visualmente. Si te encaja, aplicaremos a los componentes reales fase a fase.
      </p>
    </header>
  )
}

/* ──────────────────────────── PALETTE ──────────────────────────── */
function PaletteSection() {
  const groups = [
    {
      title: 'Fondos',
      items: [
        { name: '--pm-bg-deep', color: 'var(--pm-bg-deep)', hex: '#050810' },
        { name: '--pm-bg-base', color: 'var(--pm-bg-base)', hex: '#0A0E18' },
        { name: '--pm-bg-elev', color: 'var(--pm-bg-elev)', hex: '#11182A' },
        { name: '--pm-bg-overlay', color: 'var(--pm-bg-overlay)', hex: '#1A2238' },
      ],
    },
    {
      title: 'Bordes',
      items: [
        { name: '--pm-border-subtle', color: 'var(--pm-border-subtle)', hex: '#1E2A3E' },
        { name: '--pm-border-emphasis', color: 'var(--pm-border-emphasis)', hex: '#2A3A52' },
        { name: '--pm-border-active', color: 'var(--pm-border-active)', hex: '#00D4FF' },
      ],
    },
    {
      title: 'Acentos',
      items: [
        { name: '--pm-accent-primary', color: 'var(--pm-accent-primary)', hex: '#00D4FF' },
        { name: '--pm-accent-secondary', color: 'var(--pm-accent-secondary)', hex: '#5EEAFF' },
        { name: '--pm-accent-success', color: 'var(--pm-accent-success)', hex: '#2EFF8C' },
        { name: '--pm-accent-warning', color: 'var(--pm-accent-warning)', hex: '#F0B429' },
        { name: '--pm-accent-danger', color: 'var(--pm-accent-danger)', hex: '#FF5A6A' },
      ],
    },
    {
      title: 'Texto',
      items: [
        { name: '--pm-text-primary', color: 'var(--pm-text-primary)', hex: '#E8F0FA' },
        { name: '--pm-text-secondary', color: 'var(--pm-text-secondary)', hex: '#94A8BE' },
        { name: '--pm-text-muted', color: 'var(--pm-text-muted)', hex: '#5A6E84' },
        { name: '--pm-text-cyan', color: 'var(--pm-text-cyan)', hex: '#5EEAFF' },
      ],
    },
  ]

  return (
    <Section title="01 · Paleta">
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 'var(--pm-space-5)' }}>
          <h3 style={subTitleStyle}>{g.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--pm-space-3)' }}>
            {g.items.map((s) => (
              <div key={s.name} style={{ background: 'var(--pm-bg-elev)', border: '1px solid var(--pm-border-subtle)', borderRadius: 'var(--pm-radius-md)', overflow: 'hidden' }}>
                <div style={{ height: 64, background: s.color, borderBottom: '1px solid var(--pm-border-subtle)' }} />
                <div style={{ padding: 'var(--pm-space-3)' }}>
                  <div style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-cyan)', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)' }}>{s.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Section>
  )
}

/* ──────────────────────────── TYPOGRAPHY ──────────────────────────── */
function TypographySection() {
  const samples = [
    { token: '--pm-text-3xl · display', size: 'var(--pm-text-3xl)', family: 'var(--pm-font-display)', text: 'Mercado digital global' },
    { token: '--pm-text-2xl · display', size: 'var(--pm-text-2xl)', family: 'var(--pm-font-display)', text: 'Conecta. Verifica. Opera.' },
    { token: '--pm-text-xl · body', size: 'var(--pm-text-xl)', family: 'var(--pm-font-body)', text: '¿Qué necesitas hoy?' },
    { token: '--pm-text-lg · body', size: 'var(--pm-text-lg)', family: 'var(--pm-font-body)', text: 'Busca un producto o servicio en tu sector.' },
    { token: '--pm-text-md · body', size: 'var(--pm-text-md)', family: 'var(--pm-font-body)', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { token: '--pm-text-base · body', size: 'var(--pm-text-base)', family: 'var(--pm-font-body)', text: 'Cuerpo estándar. Usado en formularios, descripciones y la mayoría de párrafos.' },
    { token: '--pm-text-sm · mono', size: 'var(--pm-text-sm)', family: 'var(--pm-font-mono)', text: 'SECTOR · INMOBILIARIO · ES · BORRADOR' },
    { token: '--pm-text-xs · mono', size: 'var(--pm-text-xs)', family: 'var(--pm-font-mono)', text: 'SLOT · 01 · ACTOR-ID · INM-7710-IM-CR' },
  ]
  return (
    <Section title="02 · Tipografía">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-4)' }}>
        {samples.map((s) => (
          <div key={s.token} style={{ borderLeft: '2px solid var(--pm-border-subtle)', paddingLeft: 'var(--pm-space-4)' }}>
            <div style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-cyan)', marginBottom: 4, letterSpacing: 'var(--pm-tracking-wide)' }}>
              {s.token}
            </div>
            <div style={{ fontFamily: s.family, fontSize: s.size, color: 'var(--pm-text-primary)', letterSpacing: s.family.includes('mono') ? 'var(--pm-tracking-wider)' : '-0.01em', textTransform: s.family.includes('mono') ? 'uppercase' : 'none' }}>
              {s.text}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ──────────────────────────── BUTTONS ──────────────────────────── */
function ButtonsSection() {
  return (
    <Section title="03 · Botones">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm-space-4)', alignItems: 'center' }}>
        <button className="pm-btn-primary">Buscar actor</button>
        <button className="pm-btn-secondary">Cancelar</button>
        <button className="pm-btn-ghost">Volver atrás</button>
        <button className="pm-btn-danger">Borrar definitivo</button>
      </div>
      <style jsx>{`
        :global(.pm-btn-primary) {
          background: var(--pm-accent-primary);
          color: var(--pm-text-on-accent);
          padding: var(--pm-space-3) var(--pm-space-5);
          border: none;
          border-radius: var(--pm-radius-sm);
          font-family: var(--pm-font-mono);
          font-size: var(--pm-text-sm);
          letter-spacing: var(--pm-tracking-wide);
          text-transform: uppercase;
          cursor: pointer;
          font-weight: 500;
          transition: all var(--pm-duration-base) var(--pm-ease-out);
          box-shadow: var(--pm-glow-cyan-md);
        }
        :global(.pm-btn-primary:hover) {
          background: var(--pm-accent-secondary);
          box-shadow: var(--pm-glow-cyan-strong);
        }
        :global(.pm-btn-secondary) {
          background: transparent;
          color: var(--pm-text-primary);
          padding: var(--pm-space-3) var(--pm-space-5);
          border: 1px solid var(--pm-border-emphasis);
          border-radius: var(--pm-radius-sm);
          font-family: var(--pm-font-mono);
          font-size: var(--pm-text-sm);
          letter-spacing: var(--pm-tracking-wide);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--pm-duration-base) var(--pm-ease-out);
        }
        :global(.pm-btn-secondary:hover) {
          border-color: var(--pm-accent-primary);
          color: var(--pm-accent-primary);
        }
        :global(.pm-btn-ghost) {
          background: transparent;
          color: var(--pm-text-secondary);
          padding: var(--pm-space-3) var(--pm-space-5);
          border: 1px solid transparent;
          border-radius: var(--pm-radius-sm);
          font-family: var(--pm-font-mono);
          font-size: var(--pm-text-sm);
          letter-spacing: var(--pm-tracking-wide);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--pm-duration-base) var(--pm-ease-out);
        }
        :global(.pm-btn-ghost:hover) { color: var(--pm-text-primary); }
        :global(.pm-btn-danger) {
          background: transparent;
          color: var(--pm-accent-danger);
          padding: var(--pm-space-3) var(--pm-space-5);
          border: 1px solid var(--pm-accent-danger);
          border-radius: var(--pm-radius-sm);
          font-family: var(--pm-font-mono);
          font-size: var(--pm-text-sm);
          letter-spacing: var(--pm-tracking-wide);
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--pm-duration-base) var(--pm-ease-out);
        }
        :global(.pm-btn-danger:hover) { background: rgba(255, 90, 106, 0.1); }
      `}</style>
    </Section>
  )
}

/* ──────────────────────────── CARDS ──────────────────────────── */
function CardsSection() {
  return (
    <Section title="04 · Cards de sector">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--pm-space-4)' }}>
        {[
          { code: 'INM', name: 'Inmobiliario', count: 12 },
          { code: 'SAL', name: 'Salud', count: 7 },
          { code: 'FIN', name: 'Financiero', count: 22 },
        ].map((s) => (
          <div key={s.code} className="pm-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--pm-space-4)' }}>
              <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-accent-primary)', letterSpacing: 'var(--pm-tracking-wider)' }}>
                [{s.code}]
              </span>
              <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wide)' }}>
                {s.count} GRUPOS
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--pm-font-display)', fontSize: 'var(--pm-text-xl)', color: 'var(--pm-text-primary)', marginBottom: 'var(--pm-space-2)', fontWeight: 500 }}>
              {s.name}
            </h3>
            <p style={{ fontSize: 'var(--pm-text-base)', color: 'var(--pm-text-secondary)', lineHeight: 1.5 }}>
              Marketplace sectorial conectado a CNAE/NACE/ISIC. Empresas verificadas, pagos seguros y trazabilidad completa.
            </p>
            <div style={{ marginTop: 'var(--pm-space-4)', display: 'flex', alignItems: 'center', gap: 'var(--pm-space-2)', fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-cyan)', letterSpacing: 'var(--pm-tracking-wide)' }}>
              <span>EXPLORAR</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        :global(.pm-card) {
          background: var(--pm-bg-elev);
          border: 1px solid var(--pm-border-subtle);
          border-radius: var(--pm-radius-md);
          padding: var(--pm-space-5);
          cursor: pointer;
          transition: all var(--pm-duration-base) var(--pm-ease-out);
        }
        :global(.pm-card:hover) {
          border-color: var(--pm-accent-primary);
          box-shadow: var(--pm-glow-cyan-soft);
          transform: translateY(-2px);
        }
      `}</style>
    </Section>
  )
}

/* ──────────────────────────── HUD PANELS ──────────────────────────── */
function HudPanelsSection() {
  return (
    <Section title="05 · Paneles HUD">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--pm-space-4)' }}>
        <HudPanel title="SYSTEM · STATUS" status="online">
          <HudRow label="CPU" value="40%" />
          <HudRow label="MEMORY" value="2.4 GB" />
          <HudRow label="UPTIME" value="14h 23m" />
          <HudRow label="LATENCIA" value="48ms" />
        </HudPanel>
        <HudPanel title="ACTIVOS · 17 SECTORES" status="online">
          <HudRow label="INM" value="●●●●●" />
          <HudRow label="SAL" value="●●●●●" />
          <HudRow label="FIN" value="●●●●●" />
          <HudRow label="TRA" value="●●●●○" />
        </HudPanel>
        <HudPanel title="GEOFENCE" status="alert">
          <HudRow label="ALLOWED" value="46" />
          <HudRow label="BLOCKED" value="11" />
          <HudRow label="PENDING" value="0" />
          <HudRow label="LAST AUDIT" value="2026-05-24" />
        </HudPanel>
      </div>
    </Section>
  )
}

function HudPanel({ title, status, children }: { title: string; status: 'online' | 'alert'; children: React.ReactNode }) {
  const statusColor = status === 'online' ? 'var(--pm-accent-success)' : 'var(--pm-accent-warning)'
  return (
    <div style={{ background: 'var(--pm-bg-base)', border: '1px solid var(--pm-border-subtle)', borderRadius: 'var(--pm-radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--pm-space-3) var(--pm-space-4)', borderBottom: '1px solid var(--pm-border-subtle)', background: 'var(--pm-bg-elev)' }}>
        <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-secondary)', letterSpacing: 'var(--pm-tracking-wider)' }}>
          {title}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: statusColor, letterSpacing: 'var(--pm-tracking-wide)' }}>
            {status.toUpperCase()}
          </span>
        </span>
      </div>
      <div style={{ padding: 'var(--pm-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-2)' }}>
        {children}
      </div>
    </div>
  )
}

function HudRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-sm)' }}>
      <span style={{ color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wide)' }}>{label}</span>
      <span style={{ color: 'var(--pm-text-cyan)' }}>{value}</span>
    </div>
  )
}

/* ──────────────────────────── FORM ──────────────────────────── */
function FormSection() {
  return (
    <Section title="06 · Formulario">
      <div style={{ maxWidth: 480, background: 'var(--pm-bg-elev)', border: '1px solid var(--pm-border-subtle)', borderRadius: 'var(--pm-radius-md)', padding: 'var(--pm-space-5)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--pm-space-4)' }}>
          <span style={{ display: 'block', fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wider)', marginBottom: 'var(--pm-space-2)' }}>
            EMAIL DE CONTACTO
          </span>
          <input
            type="email"
            placeholder="ejemplo@empresa.com"
            style={{
              width: '100%',
              padding: 'var(--pm-space-3) var(--pm-space-4)',
              background: 'var(--pm-bg-input)',
              border: '1px solid var(--pm-border-subtle)',
              borderRadius: 'var(--pm-radius-sm)',
              color: 'var(--pm-text-primary)',
              fontFamily: 'var(--pm-font-body)',
              fontSize: 'var(--pm-text-base)',
              outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 'var(--pm-space-5)' }}>
          <span style={{ display: 'block', fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)', letterSpacing: 'var(--pm-tracking-wider)', marginBottom: 'var(--pm-space-2)' }}>
            SECTOR DE INTERÉS
          </span>
          <select
            defaultValue=""
            style={{
              width: '100%',
              padding: 'var(--pm-space-3) var(--pm-space-4)',
              background: 'var(--pm-bg-input)',
              border: '1px solid var(--pm-border-subtle)',
              borderRadius: 'var(--pm-radius-sm)',
              color: 'var(--pm-text-primary)',
              fontFamily: 'var(--pm-font-body)',
              fontSize: 'var(--pm-text-base)',
              outline: 'none',
            }}
          >
            <option value="">Elige un sector…</option>
            <option value="inm">Inmobiliario</option>
            <option value="sal">Salud</option>
            <option value="fin">Financiero</option>
          </select>
        </label>
        <button className="pm-btn-primary">Continuar</button>
      </div>
    </Section>
  )
}

/* ──────────────────────────── INDICATORS ──────────────────────────── */
function IndicatorsSection() {
  return (
    <Section title="07 · Indicadores">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm-space-5)' }}>
        <Indicator label="ONLINE" color="var(--pm-accent-success)" />
        <Indicator label="EN VIVO" color="var(--pm-accent-primary)" pulse />
        <Indicator label="PENDIENTE" color="var(--pm-accent-warning)" />
        <Indicator label="ERROR" color="var(--pm-accent-danger)" />
      </div>
      <div style={{ marginTop: 'var(--pm-space-5)' }}>
        <h3 style={subTitleStyle}>Glow showcase</h3>
        <div style={{ display: 'flex', gap: 'var(--pm-space-5)', flexWrap: 'wrap' }}>
          <div style={glowBox('var(--pm-glow-cyan-soft)')}>soft</div>
          <div style={glowBox('var(--pm-glow-cyan-md)')}>md</div>
          <div style={glowBox('var(--pm-glow-cyan-strong)')}>strong</div>
        </div>
      </div>
    </Section>
  )
}

function Indicator({ label, color, pulse }: { label: string; color: string; pulse?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm-space-2)' }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: pulse ? 'pm-pulse-cyan 2s infinite ease-in-out' : 'none',
        }}
      />
      <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color, letterSpacing: 'var(--pm-tracking-wider)' }}>
        {label}
      </span>
    </div>
  )
}

function glowBox(shadow: string): React.CSSProperties {
  return {
    width: 120,
    height: 80,
    background: 'var(--pm-bg-elev)',
    border: '1px solid var(--pm-border-active)',
    borderRadius: 'var(--pm-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--pm-accent-primary)',
    fontFamily: 'var(--pm-font-mono)',
    fontSize: 'var(--pm-text-xs)',
    letterSpacing: 'var(--pm-tracking-wider)',
    boxShadow: shadow,
  }
}

/* ──────────────────────────── SPACING ──────────────────────────── */
function SpacingSection() {
  const sizes = [
    { name: '--pm-space-1', value: 4 },
    { name: '--pm-space-2', value: 8 },
    { name: '--pm-space-3', value: 12 },
    { name: '--pm-space-4', value: 16 },
    { name: '--pm-space-5', value: 24 },
    { name: '--pm-space-6', value: 32 },
    { name: '--pm-space-7', value: 48 },
    { name: '--pm-space-8', value: 64 },
  ]
  return (
    <Section title="08 · Spacing">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-2)' }}>
        {sizes.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm-space-4)' }}>
            <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-cyan)', width: 140 }}>
              {s.name}
            </span>
            <span style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-xs)', color: 'var(--pm-text-muted)', width: 40 }}>
              {s.value}px
            </span>
            <div style={{ height: 12, width: s.value, background: 'var(--pm-accent-primary)', borderRadius: 2, boxShadow: 'var(--pm-glow-cyan-soft)' }} />
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ──────────────────────────── SHARED ──────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: 'var(--pm-font-mono)', fontSize: 'var(--pm-text-sm)', color: 'var(--pm-text-cyan)', letterSpacing: 'var(--pm-tracking-widest)', textTransform: 'uppercase', marginBottom: 'var(--pm-space-5)', paddingBottom: 'var(--pm-space-3)', borderBottom: '1px solid var(--pm-border-subtle)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

const subTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--pm-font-mono)',
  fontSize: 'var(--pm-text-xs)',
  color: 'var(--pm-text-muted)',
  letterSpacing: 'var(--pm-tracking-wider)',
  textTransform: 'uppercase',
  marginBottom: 'var(--pm-space-3)',
}

/* ──────────────────────────── TILES (ProductTile + FichasGrid) ──────────────────────────── */
import { ProductTile } from '@/app/components/workspace/tiles/ProductTile'
import { FichasGrid } from '@/app/components/workspace/tiles/FichasGrid'
import { TransporteFichaCard, type TransporteFichaCardLabels } from '@/app/components/workspace/tiles/TransporteFichaCard'
import { ProfessionalSidebar, type SidebarItem } from '@/app/components/workspace/sidebar/ProfessionalSidebar'
import { useState } from 'react'
import type {
  ServicioTransitarioProduct,
  OperacionTransporteProduct,
  ServicioNavieroProduct,
} from '@/app/data/productSchemas/transporte'

function TilesSection() {
  return (
    <Section title="Tiles · ProductTile · FichasGrid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-6)' }}>

        {/* ProductTile genérico — variantes */}
        <div>
          <p style={subTitleStyle}>ProductTile · variantes · estados</p>
          <FichasGrid>
            <ProductTile
              title="Valencia → Shanghai · FCL 20ST"
              subtitle="Servicio transitario · ruta semanal"
              badge={{ label: 'Validado', tone: 'success' }}
              meta={[
                { label: 'Tránsito', value: '28-32 días', mono: true },
                { label: 'Tipo', value: 'FCL', mono: true },
                { label: 'Take rate', value: '0,5%', mono: true },
                { label: 'eBL', value: 'Sí' },
              ]}
              onClick={() => undefined}
              ariaLabel="Ejemplo · ruta Valencia Shanghai"
            />
            <ProductTile
              title="Ficha en estado borrador"
              subtitle="Pendiente validación experta sectorial"
              badge={{ label: 'BORRADOR', tone: 'warning' }}
              meta={[
                { label: 'Schema', value: 'transporte@1.0', mono: true },
                { label: 'Status', value: 'draft', mono: true },
              ]}
            />
            <ProductTile
              title="Tile seleccionado · estado activo"
              subtitle="Borde cyan + glow medio"
              badge={{ label: 'Oro', tone: 'tier_oro' }}
              meta={[
                { label: 'Operaciones', value: '187', mono: true },
                { label: 'Take rate efectivo', value: '0,20%', mono: true },
              ]}
              selected
              onClick={() => undefined}
              ariaLabel="Ejemplo seleccionado"
            />
            <ProductTile
              title="Tile en loading · skeleton shimmer"
              subtitle="Mientras llega data del backend"
              loading
            />
            <ProductTile
              title="Tile disabled · oferta no disponible"
              subtitle="Stock agotado · ruta suspendida"
              badge={{ label: 'Suspendido', tone: 'danger' }}
              meta={[
                { label: 'Motivo', value: 'Sin stock' },
                { label: 'Vuelve', value: '15-jun' },
              ]}
              disabled
            />
            <ProductTile
              title="Tile con badge tier Bronce"
              subtitle="Fidelidad · primer tier"
              badge={{ label: 'Bronce', tone: 'tier_bronce' }}
              meta={[
                { label: 'Operaciones', value: '12', mono: true },
                { label: 'Tier', value: 'Bronce' },
              ]}
            />
          </FichasGrid>
        </div>

        {/* FichasGrid estados especiales */}
        <div>
          <p style={subTitleStyle}>FichasGrid · estado loading (4 skeletons)</p>
          <FichasGrid loading={4} />
        </div>

        <div>
          <p style={subTitleStyle}>FichasGrid · estado vacío</p>
          <FichasGrid
            emptyState={{
              title: 'No tienes fichas publicadas aún',
              description: 'Publica tu primera ficha de transporte para que los cargadores te encuentren en el catálogo.',
              cta: (
                <button
                  type="button"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--pm-accent-primary)',
                    color: 'var(--pm-text-on-accent)',
                    border: 'none',
                    borderRadius: 'var(--pm-radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--pm-font-mono)',
                    fontSize: 'var(--pm-text-sm)',
                    letterSpacing: 'var(--pm-tracking-wide)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Crear primera ficha
                </button>
              ),
            }}
          />
        </div>

        <div>
          <p style={subTitleStyle}>FichasGrid · estado error</p>
          <FichasGrid
            error={{
              message: 'Error al cargar las fichas. Comprueba tu conexión e inténtalo de nuevo.',
              onRetry: () => undefined,
              retryLabel: 'Reintentar',
            }}
          />
        </div>

        {/* TransporteFichaCard ejemplos reales con schema TRANSPORTE */}
        <div>
          <p style={subTitleStyle}>TransporteFichaCard · 3 sub-categorías reales</p>
          <FichasGrid>
            <TransporteFichaCard
              product={mockServicioTransitario}
              labels={mockTransporteLabels}
              onClick={() => undefined}
            />
            <TransporteFichaCard
              product={mockOperacionTransporte}
              labels={mockTransporteLabels}
              onClick={() => undefined}
            />
            <TransporteFichaCard
              product={mockServicioNaviero}
              labels={mockTransporteLabels}
              onClick={() => undefined}
            />
          </FichasGrid>
        </div>
      </div>
    </Section>
  )
}

/* ──────────────────────────── SIDEBAR PREVIEW ──────────────────────────── */
function SidebarPreviewSection() {
  const [activeId, setActiveId] = useState('agenda')

  const items: SidebarItem[] = [
    { id: 'buscador', label: 'Buscador', icon: <IconSearch /> },
    { id: 'catalogo', label: 'Catálogo', icon: <IconGrid /> },
    { id: 'actores', label: 'Actores', icon: <IconUsers /> },
    { id: 'pedidos', label: 'Pedidos', icon: <IconBox /> },
    { id: 'agenda', label: 'Agenda', icon: <IconCalendar />, badge: 3 },
    { id: 'archivos', label: 'Archivos', icon: <IconFolder /> },
    { id: 'mensajes', label: 'Mensajes', icon: <IconMessage />, badge: 12 },
    { id: 'wallet', label: 'Pagos', icon: <IconWallet /> },
  ]
  const footerItems: SidebarItem[] = [
    { id: 'settings', label: 'Configuración', icon: <IconSettings /> },
    { id: 'help', label: 'Ayuda IA', icon: <IconHelp /> },
  ]

  return (
    <Section title="ProfessionalSidebar · icon-only vertical">
      <p style={subTitleStyle}>72px ancho · iconos monocromos · tooltip al hover · 8 tabs + 2 footer</p>
      <div
        style={{
          display: 'flex',
          background: 'var(--pm-bg-deep)',
          border: '1px solid var(--pm-border-subtle)',
          borderRadius: 'var(--pm-radius-md)',
          overflow: 'hidden',
          minHeight: 560,
        }}
      >
        <ProfessionalSidebar items={items} activeId={activeId} onSelect={setActiveId} footerItems={footerItems} />
        <div
          style={{
            flex: 1,
            padding: 'var(--pm-space-6)',
            color: 'var(--pm-text-secondary)',
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-sm)',
            letterSpacing: 'var(--pm-tracking-wide)',
          }}
        >
          <div style={{ marginBottom: 'var(--pm-space-3)', color: 'var(--pm-text-cyan)' }}>◆ Tab activo</div>
          <div style={{ color: 'var(--pm-text-primary)', fontSize: 'var(--pm-text-md)' }}>
            {items.find((i) => i.id === activeId)?.label ?? footerItems.find((i) => i.id === activeId)?.label}
          </div>
          <div style={{ marginTop: 'var(--pm-space-5)', color: 'var(--pm-text-muted)', maxWidth: 480, lineHeight: 1.5 }}>
            Haz click en cualquier icono del sidebar para cambiar de tab. Pasa el ratón por encima para ver el tooltip. Los badges numéricos (Agenda · Mensajes) usan acento rojo coral.
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ──────────────────────────── ICONS · SVG inline (sidebar preview) ──────────────────────────── */
const iconBase = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IconSearch() { return (<svg {...iconBase} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconGrid() { return (<svg {...iconBase} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>) }
function IconUsers() { return (<svg {...iconBase} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>) }
function IconBox() { return (<svg {...iconBase} viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>) }
function IconCalendar() { return (<svg {...iconBase} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) }
function IconFolder() { return (<svg {...iconBase} viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>) }
function IconMessage() { return (<svg {...iconBase} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) }
function IconWallet() { return (<svg {...iconBase} viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>) }
function IconSettings() { return (<svg {...iconBase} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>) }
function IconHelp() { return (<svg {...iconBase} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>) }

/* ──────────────────────────── MOCK PRODUCTS · ejemplos TRANSPORTE ──────────────────────────── */

const mockAuditDate = '2026-05-26T10:00:00Z'

const mockActor = {
  actor_id: 'demo-actor-uuid',
  kyc_status: 'approved' as const,
  sector_id: 'transporte',
  role_id: 'transitario_maritimo',
  isic: '5229',
  cnae: '5229',
  legal_entity_kind: 'company' as const,
}

const mockAudit = {
  created_at: mockAuditDate,
  created_by: mockActor,
  updated_at: mockAuditDate,
  last_updated_by: mockActor,
}

const mockTransporteLabels: TransporteFichaCardLabels = {
  servicioTransitario: 'Servicio transitario',
  operacionTransporte: 'Necesidad de transporte',
  servicioNaviero: 'Servicio naviero',
  origen: 'Origen',
  destino: 'Destino',
  modo: 'Modo',
  transito: 'Tránsito',
  tipoServicio: 'Tipo',
  takeRate: 'Tarifa',
  capacidad: 'Capacidad',
  incoterm: 'Incoterm',
  regimenAduanero: 'Régimen',
  buque: 'Buque',
  voyage: 'Voyage',
  etd: 'ETD',
  eta: 'ETA',
  capacidadDisponible: 'Disponible',
  tarifa20ST: 'Tarifa 20ST',
  tarifa40ST: 'Tarifa 40ST',
  mercanciaPeso: 'Peso',
  mercanciaVolumen: 'Volumen',
  borrador: 'BORRADOR',
  validado: 'Validado',
  ariaCard: (title: string) => `Ficha de transporte: ${title}`,
}

const mockServicioTransitario: ServicioTransitarioProduct = {
  sku: 'TRA-VLC-SHA-FCL-20ST-001',
  schema_version: 'transporte@1.0',
  schema_status: 'draft',
  title: {
    es: 'Valencia → Shanghai · FCL 20ST semanal',
    en: 'Valencia → Shanghai · FCL 20ST weekly',
    fr: 'Valence → Shanghai · FCL 20ST hebdo',
    de: 'Valencia → Shanghai · FCL 20ST wöchentlich',
    it: 'Valencia → Shanghai · FCL 20ST settimanale',
    pt: 'Valência → Xangai · FCL 20ST semanal',
    zh: '瓦伦西亚 → 上海 · FCL 20ST 每周',
    ja: 'バレンシア → 上海 · FCL 20ST 毎週',
  },
  description: {
    es: 'Servicio marítimo recurrente FCL 20ST Valencia → Shanghai · tránsito 28-32 días.',
    en: 'Recurring maritime FCL 20ST Valencia → Shanghai · 28-32 days transit.',
    fr: '', de: '', it: '', pt: '', zh: '', ja: '',
  },
  available_countries: ['ES', 'CN'],
  price: { value: 2400, currency: 'EUR', unit: 'contenedor 20ST', vat_included: false, vat_rate_percent: 21 },
  stock: { available: 12, unit: 'slots', lead_time_days: 5, ships_from: 'ES' },
  payment_modality: '04_importacion',
  images: [],
  actor: mockActor,
  certificates: [],
  audit: mockAudit,
  sub_categoria: 'servicio_transitario',
  modo: 'maritimo',
  tipo_servicio: 'fcl',
  origen: {
    un_locode: 'ESVLC',
    name: { es: 'Puerto de Valencia', en: 'Port of Valencia', fr: 'Port de Valence', de: 'Hafen Valencia', it: 'Porto di Valencia', pt: 'Porto de Valência', zh: '瓦伦西亚港', ja: 'バレンシア港' },
    type: 'puerto_maritimo',
    country: 'ES',
  },
  destino: {
    un_locode: 'CNSHA',
    name: { es: 'Puerto de Shanghai', en: 'Port of Shanghai', fr: 'Port de Shanghai', de: 'Hafen Shanghai', it: 'Porto di Shanghai', pt: 'Porto de Xangai', zh: '上海港', ja: '上海港' },
    type: 'puerto_maritimo',
    country: 'CN',
  },
  tiempo_transito_dias_min: 28,
  tiempo_transito_dias_max: 32,
  es_spot: false,
  tipo_carga_aceptada: ['contenedor_seco', 'contenedor_refrigerado'],
  tipos_contenedor_aceptados: ['20ST', '40ST', '40HC', '20RF', '40RF'],
  acepta_mercancia_peligrosa: false,
  acepta_carga_refrigerada: true,
  incoterms_aceptados: ['FOB', 'CIF', 'CFR', 'EXW', 'DAP'],
  incoterm_recomendado: 'CIF',
  incluye_seguro: true,
  cobertura_seguro_pct: 110,
  realiza_despacho_aduanero: true,
  es_aeo: true,
  tipo_aeo: 'AEO-F',
  regimenes_aduaneros: ['exportacion_definitiva', 'importacion_definitiva'],
  ofrece_tracking_realtime: true,
  tecnologia_tracking: ['gps', 'on_chain_xdc'],
  emite_ebl_xdc: true,
}

const mockOperacionTransporte: OperacionTransporteProduct = {
  sku: 'OP-CONST-VTN-MAD-001',
  schema_version: 'transporte@1.0',
  schema_status: 'draft',
  title: {
    es: 'Importación 240 t acero corrugado Vietnam → Madrid',
    en: 'Import 240 t reinforced steel Vietnam → Madrid',
    fr: '', de: '', it: '', pt: '', zh: '', ja: '',
  },
  description: {
    es: 'Constructora Madrid busca transitario para importar 240 toneladas acero corrugado.',
    en: '', fr: '', de: '', it: '', pt: '', zh: '', ja: '',
  },
  available_countries: ['VN', 'ES'],
  price: { value: 142000, currency: 'USD', unit: 'operación completa', vat_included: false },
  stock: { available: 1, unit: 'operación', ships_from: 'VN' },
  payment_modality: '04_importacion',
  images: [],
  actor: { ...mockActor, role_id: 'cargador_industrial' },
  certificates: [],
  audit: mockAudit,
  // DPP v1.1 · campos obligatorios mínimos (operación transporte = mercancía física)
  materials: [
    { name: 'Acero corrugado B500S', percentage: 100, recycled_origin: false },
  ],
  package_length_mm: 12000,
  package_width_mm: 200,
  package_height_mm: 200,
  package_weight_kg: 500,
  package_type: 'other' as const,
  stackable: true,
  lifecycle_state: 'created' as const,
  state_changed_at: '2026-05-29T10:00:00Z',
  state_changed_by: { ...mockActor, role_id: 'cargador_industrial' },
  custody_chain: [],
  signatures: [],
  manufacturing_country: 'VN',
  production_date: '2026-05-15',
  sub_categoria: 'operacion_transporte',
  origen: {
    un_locode: 'VNHPH',
    name: { es: 'Puerto de Hai Phong', en: 'Port of Hai Phong', fr: '', de: '', it: '', pt: '', zh: '海防港', ja: 'ハイフォン港' },
    type: 'puerto_maritimo',
    country: 'VN',
  },
  destino: {
    un_locode: 'ESMAD',
    name: { es: 'Madrid Centro Distribución', en: 'Madrid Distribution Center', fr: '', de: '', it: '', pt: '', zh: '', ja: '' },
    type: 'cliente_directo',
    country: 'ES',
  },
  modos_aceptados: ['maritimo', 'multimodal'],
  modo_preferido: 'maritimo',
  mercancia: {
    descripcion: { es: 'Acero corrugado B500S barras 12mm', en: 'B500S 12mm reinforced steel bars', fr: '', de: '', it: '', pt: '', zh: '', ja: '' },
    codigo_hs: '7214.20',
    peso_bruto_kg: 240000,
    peso_neto_kg: 238000,
    volumen_m3: 31,
    num_bultos: 480,
    tipo_embalaje: 'haces de 500 kg',
    valor_declarado: { value: 142000, currency: 'USD' },
    es_peligrosa: false,
  },
  incoterm_propuesto: 'CIF',
  regimen_aduanero: 'importacion_definitiva',
  requiere_seguro: true,
  requiere_despacho_aduanero: true,
  acepta_consolidacion: false,
  modalidad_pago_propuesta: '04_importacion',
  certificados_disponibles: ['ucp_600_lc'],
  certificados_requeridos_transitario: ['aeo_authorized_economic_operator'],
}

const mockServicioNaviero: ServicioNavieroProduct = {
  sku: 'NAV-MSC-VLC-HKG-V128W',
  schema_version: 'transporte@1.0',
  schema_status: 'draft',
  title: {
    es: 'MSC Capacidad VLC → HKG · Voyage 128W',
    en: 'MSC Capacity VLC → HKG · Voyage 128W',
    fr: '', de: '', it: '', pt: '', zh: '', ja: '',
  },
  description: {
    es: 'Slots disponibles en buque MSC ruta Valencia → Hong Kong escala Singapur.',
    en: '', fr: '', de: '', it: '', pt: '', zh: '', ja: '',
  },
  available_countries: ['ES', 'HK', 'SG'],
  price: { value: 2200, currency: 'USD', unit: 'TEU 20ST', vat_included: false },
  stock: { available: 200, unit: 'TEU', ships_from: 'ES' },
  payment_modality: '04_importacion',
  images: [],
  actor: { ...mockActor, role_id: 'naviera_linea' },
  certificates: [],
  audit: mockAudit,
  sub_categoria: 'servicio_naviero',
  tipo_operador: 'naviera_linea',
  nombre_buque_o_vuelo: 'MSC Bellissima',
  imo_number: '9745050',
  voyage_number: '128W',
  origen: {
    un_locode: 'ESVLC',
    name: { es: 'Puerto de Valencia', en: 'Port of Valencia', fr: '', de: '', it: '', pt: '', zh: '', ja: '' },
    type: 'puerto_maritimo',
    country: 'ES',
  },
  destino: {
    un_locode: 'HKHKG',
    name: { es: 'Puerto de Hong Kong', en: 'Port of Hong Kong', fr: '', de: '', it: '', pt: '', zh: '', ja: '' },
    type: 'puerto_maritimo',
    country: 'HK',
  },
  escalas: [],
  etd: '2026-06-15T08:00:00Z',
  eta: '2026-07-12T18:00:00Z',
  capacidad_total_teu: 8000,
  capacidad_disponible_teu: 200,
  tipos_contenedor_aceptados: ['20ST', '40ST', '40HC', '20RF', '40RF'],
  acepta_reefer: true,
  acepta_mercancia_peligrosa: true,
  tarifa_base_20ST: 2200,
  tarifa_base_40ST: 3800,
  emite_bl_papel: false,
  emite_ebl_xdc: true,
  ebl_standard: 'DCSA',
}
