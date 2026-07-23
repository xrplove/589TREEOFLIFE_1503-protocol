'use client'

/**
 * /design-system-v2 · preview del DS v2 HOLO PREMIUM.
 *
 * Página de validación visual ANTES de propagar al workspace real. José
 * confirma la paleta + primitivos en esta página antes de avanzar a
 * constelación Three.js (semana 2) y hexágono 3D (semana 2).
 *
 * URL: /design-system-v2
 */

import { HoloCard, HoloButton, HoloInput, HoloIcon } from '@/app/components/holo'
import { useState } from 'react'

export default function DesignSystemV2Page() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--pm2-bg-deepest)',
        color: 'var(--pm2-text-primary)',
        fontFamily: 'var(--pm2-font-body)',
        padding: 'var(--pm2-space-9) var(--pm2-space-6)',
        overflowX: 'hidden',
      }}
    >
      {/* Ambient glow background · efecto luminoso radial cyan + amber */}
      <AmbientGlow />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--pm2-space-9)',
        }}
      >
        <Header />
        <PaletteSection />
        <HoloCardSection />
        <HoloButtonSection />
        <HoloInputSection />
        <HoloIconSection />
        <CompositionSection />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   AMBIENT GLOW · efecto luminoso de fondo
   ════════════════════════════════════════════════════════════════════ */

function AmbientGlow() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--pm2-cyan-medium) 0%, transparent 65%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '15%',
          right: '8%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--pm2-amber-medium) 0%, transparent 65%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════════════ */

function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--pm2-border-subtle)',
        paddingBottom: 'var(--pm2-space-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--pm2-space-3)',
          marginBottom: 'var(--pm2-space-3)',
        }}
      >
        <span
          className="pm2-text-holo-cyan"
          style={{
            fontFamily: 'var(--pm2-font-mono)',
            fontSize: 'var(--pm2-text-xs)',
            letterSpacing: 'var(--pm2-tracking-widest)',
            textTransform: 'uppercase',
          }}
        >
          1503 · DESIGN SYSTEM
        </span>
        <span
          style={{
            fontFamily: 'var(--pm2-font-mono)',
            fontSize: 'var(--pm2-text-xs)',
            color: 'var(--pm2-text-muted)',
            letterSpacing: 'var(--pm2-tracking-wide)',
          }}
        >
          v2.0 · 2026-05-26 · HOLO PREMIUM
        </span>
      </div>
      <h1
        style={{
          fontFamily: 'var(--pm2-font-display)',
          fontSize: 'var(--pm2-text-3xl)',
          fontWeight: 600,
          letterSpacing: 'var(--pm2-tracking-tight)',
          color: 'var(--pm2-text-primary)',
          marginBottom: 'var(--pm2-space-3)',
          lineHeight: 1.15,
        }}
      >
        Sistema visual <span className="pm2-text-holo-cyan">holográfico</span>{' '}
        <span className="pm2-text-holo-amber">premium</span>
      </h1>
      <p
        style={{
          color: 'var(--pm2-text-secondary)',
          maxWidth: 760,
          fontSize: 'var(--pm2-text-md)',
          lineHeight: 'var(--pm2-leading-relaxed)',
        }}
      >
        Día 1 · paleta navy mate + cyan + amber + 4 primitivos (HoloCard ·
        HoloButton · HoloInput · HoloIcon). Glassmorphism real · animaciones
        framer-motion · respeto a prefers-reduced-motion. Constelación Three.js
        y hexágono 3D rotando con texto orbital vienen semana 2.
      </p>
    </header>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PALETTE
   ════════════════════════════════════════════════════════════════════ */

function PaletteSection() {
  const groups = [
    {
      title: 'Fondos navy',
      items: [
        { name: '--pm2-bg-deepest', color: 'var(--pm2-bg-deepest)', hex: '#050B18' },
        { name: '--pm2-bg-deep', color: 'var(--pm2-bg-deep)', hex: '#0A1428' },
        { name: '--pm2-bg-base', color: 'var(--pm2-bg-base)', hex: '#0F1B33' },
        { name: '--pm2-bg-elev', color: 'var(--pm2-bg-elev)', hex: '#142340' },
        { name: '--pm2-bg-overlay', color: 'var(--pm2-bg-overlay)', hex: '#1A2D4F' },
      ],
    },
    {
      title: 'Acento cyan · identidad',
      items: [
        { name: '--pm2-cyan', color: 'var(--pm2-cyan)', hex: '#00D4FF' },
        { name: '--pm2-cyan-bright', color: 'var(--pm2-cyan-bright)', hex: '#5EEAFF' },
        { name: '--pm2-cyan-soft', color: 'var(--pm2-cyan-soft)', hex: 'rgba 8%' },
      ],
    },
    {
      title: 'Acento amber · premium',
      items: [
        { name: '--pm2-amber', color: 'var(--pm2-amber)', hex: '#FFD580' },
        { name: '--pm2-amber-bright', color: 'var(--pm2-amber-bright)', hex: '#FFE5A8' },
        { name: '--pm2-amber-soft', color: 'var(--pm2-amber-soft)', hex: 'rgba 8%' },
      ],
    },
    {
      title: 'Funcionales',
      items: [
        { name: '--pm2-success', color: 'var(--pm2-success)', hex: '#2EFF8C' },
        { name: '--pm2-warning', color: 'var(--pm2-warning)', hex: '#F0B429' },
        { name: '--pm2-danger', color: 'var(--pm2-danger)', hex: '#FF5A6A' },
      ],
    },
  ]

  return (
    <Section title="01 · Paleta">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--pm2-space-5)' }}>
        {groups.map((g) => (
          <div key={g.title}>
            <p style={subTitleStyle}>{g.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-2)' }}>
              {g.items.map((it) => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm2-space-3)' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: it.color,
                      borderRadius: 'var(--pm2-radius-sm)',
                      border: '1px solid var(--pm2-border-subtle)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                    <div style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)' }}>{it.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HOLOCARD
   ════════════════════════════════════════════════════════════════════ */

function HoloCardSection() {
  return (
    <Section title="02 · HoloCard · panel holográfico con glassmorphism">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--pm2-space-5)',
        }}
      >
        <HoloCard variant="default" ariaLabel="Card default">
          <CardSample title="Default" desc="Marco subtle · glow cyan al hover · entrada animada" />
        </HoloCard>
        <HoloCard variant="active" ariaLabel="Card active">
          <CardSample title="Active" desc="Marco cyan + glow medium siempre · estado seleccionado" />
        </HoloCard>
        <HoloCard variant="premium" ariaLabel="Card premium">
          <CardSample title="Premium" desc="Marco amber · uso tier Oro · fidelidad · destacados" />
        </HoloCard>
        <HoloCard variant="ghost" ariaLabel="Card ghost">
          <CardSample title="Ghost" desc="Borde casi invisible · contexto bg · uso ambient" />
        </HoloCard>
        <HoloCard variant="default" onClick={() => undefined} ariaLabel="Card interactivo">
          <CardSample title="Interactivo" desc="Click handler activo · cursor pointer · hover lift" />
        </HoloCard>
        <HoloCard variant="default" disabled ariaLabel="Card disabled">
          <CardSample title="Disabled" desc="Opacidad reducida · sin interacción" />
        </HoloCard>
      </div>
    </Section>
  )
}

function CardSample({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--pm2-font-display)',
          fontSize: 'var(--pm2-text-lg)',
          color: 'var(--pm2-text-primary)',
          marginBottom: 'var(--pm2-space-2)',
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--pm2-text-secondary)', fontSize: 'var(--pm2-text-sm)', lineHeight: 'var(--pm2-leading-normal)' }}>
        {desc}
      </p>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HOLOBUTTON
   ════════════════════════════════════════════════════════════════════ */

function HoloButtonSection() {
  return (
    <Section title="03 · HoloButton · variantes + tamaños + estados">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-6)' }}>
        <div>
          <p style={subTitleStyle}>Variantes (size md)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm2-space-3)' }}>
            <HoloButton variant="primary">Primary</HoloButton>
            <HoloButton variant="secondary">Secondary</HoloButton>
            <HoloButton variant="ghost">Ghost</HoloButton>
            <HoloButton variant="premium">Premium · Oro</HoloButton>
            <HoloButton variant="danger">Danger</HoloButton>
          </div>
        </div>

        <div>
          <p style={subTitleStyle}>Tamaños</p>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--pm2-space-3)' }}>
            <HoloButton size="sm">Small</HoloButton>
            <HoloButton size="md">Medium</HoloButton>
            <HoloButton size="lg">Large CTA</HoloButton>
          </div>
        </div>

        <div>
          <p style={subTitleStyle}>Estados</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm2-space-3)' }}>
            <HoloButton variant="primary">Reposo</HoloButton>
            <HoloButton variant="primary" loading>Loading</HoloButton>
            <HoloButton variant="primary" disabled>Disabled</HoloButton>
          </div>
        </div>

        <div>
          <p style={subTitleStyle}>Con iconos</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm2-space-3)' }}>
            <HoloButton variant="primary" iconStart={<IconArrowRight />}>Buscar</HoloButton>
            <HoloButton variant="secondary" iconEnd={<IconArrowRight />}>Ver más</HoloButton>
            <HoloButton variant="premium" iconStart={<IconStar />}>Activar tier Oro</HoloButton>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HOLOINPUT
   ════════════════════════════════════════════════════════════════════ */

function HoloInputSection() {
  const [searchValue, setSearchValue] = useState('')

  return (
    <Section title="04 · HoloInput · campo de formulario holográfico">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--pm2-space-6)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-4)' }}>
          <p style={subTitleStyle}>Variant default</p>
          <HoloInput
            label="Email"
            placeholder="tu@empresa.com"
            type="email"
            fullWidth
            hint="Recibirás un código OTP de 6 dígitos"
          />
          <HoloInput
            label="Email con error"
            placeholder="tu@empresa.com"
            type="email"
            fullWidth
            error="Formato de email inválido"
            defaultValue="invalid-email"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-4)' }}>
          <p style={subTitleStyle}>Variant search (estilo header workspace)</p>
          <HoloInput
            variant="search"
            size="lg"
            placeholder="¿Qué necesitas hoy? · cemento · arquitecto Madrid · ISO 9001..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            fullWidth
          />
          <HoloInput
            variant="search"
            placeholder="Buscar en transitarios cluster Valencia..."
            fullWidth
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-4)' }}>
          <p style={subTitleStyle}>Variant command (estilo HUD terminal)</p>
          <HoloInput
            variant="command"
            label="Referencia de pago"
            placeholder="REF-XXXXXX..."
            fullWidth
          />
        </div>
      </div>
    </Section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HOLOICON
   ════════════════════════════════════════════════════════════════════ */

function HoloIconSection() {
  return (
    <Section title="05 · HoloIcon · iconos holográficos con glow + animaciones">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-6)' }}>
        <div>
          <p style={subTitleStyle}>Variantes (tamaño 32 · glow intensity 2)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm2-space-6)' }}>
            {(['cyan', 'amber', 'success', 'danger', 'muted'] as const).map((v) => (
              <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
                <HoloIcon variant={v} size={36} glowIntensity={2}>
                  <IconStar />
                </HoloIcon>
                <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)', letterSpacing: 'var(--pm2-tracking-wide)', textTransform: 'uppercase' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={subTitleStyle}>Animaciones (cyan · 48px · halo)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--pm2-space-7)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
              <HoloIcon variant="cyan" size={48} anim="pulse" withHalo glowIntensity={2}>
                <IconCircle />
              </HoloIcon>
              <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)' }}>PULSE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
              <HoloIcon variant="cyan" size={48} anim="float" withHalo glowIntensity={2}>
                <IconHex />
              </HoloIcon>
              <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)' }}>FLOAT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
              <HoloIcon variant="cyan" size={48} anim="rotate" withHalo glowIntensity={2}>
                <IconGear />
              </HoloIcon>
              <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)' }}>ROTATE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
              <HoloIcon variant="amber" size={48} anim="pulse" withHalo glowIntensity={3}>
                <IconStar />
              </HoloIcon>
              <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)' }}>AMBER PULSE</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COMPOSICIÓN · ejemplo real "header workspace" anticipa semana 2
   ════════════════════════════════════════════════════════════════════ */

function CompositionSection() {
  return (
    <Section title="06 · Composición · anticipo header workspace (semana 2)">
      <p style={{ ...subTitleStyle, marginBottom: 'var(--pm2-space-5)' }}>
        Ejemplo &ldquo;¿Qué necesitas hoy?&rdquo; del mockup IA · primitivos HoloKit combinados ·
        sin Three.js todavía (constelación + hexágono 3D viene semana 2)
      </p>

      <HoloCard variant="default" size="lg" style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm2-space-5)' }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm2-space-2)' }}>
            <HoloIcon variant="cyan" size={14} glowIntensity={1}>
              <IconCircle />
            </HoloIcon>
            <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-cyan-text)', letterSpacing: 'var(--pm2-tracking-widest)', textTransform: 'uppercase' }}>
              Buscador · Transporte
            </span>
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--pm2-font-display)',
              fontSize: 'var(--pm2-text-2xl)',
              fontWeight: 600,
              color: 'var(--pm2-text-primary)',
              letterSpacing: 'var(--pm2-tracking-tight)',
              lineHeight: 1.2,
            }}
          >
            ¿Qué necesitas hoy?
          </h2>

          <p style={{ margin: 0, color: 'var(--pm2-text-secondary)', maxWidth: 640, fontSize: 'var(--pm2-text-base)', lineHeight: 'var(--pm2-leading-relaxed)' }}>
            Busca un producto concreto, un fabricante, un profesional, o navega los grupos de actores del sector. Haz click en uno para ver la lista.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: 'var(--pm2-space-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px' }}>
              <HoloInput
                variant="search"
                size="lg"
                placeholder="Por ejemplo · contenedor 40HC · transitario Valencia → Shanghai · UCP 600 · ADR..."
                fullWidth
              />
            </div>
            <HoloButton variant="primary" size="lg">Buscar</HoloButton>
          </div>

          {/* Categorías cards */}
          <div style={{ marginTop: 'var(--pm2-space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm2-space-2)', marginBottom: 'var(--pm2-space-4)' }}>
              <HoloIcon variant="cyan" size={14} glowIntensity={1}>
                <IconCircle />
              </HoloIcon>
              <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-cyan-text)', letterSpacing: 'var(--pm2-tracking-widest)', textTransform: 'uppercase' }}>
                Actores del sector · click para ver la lista
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--pm2-space-3)' }}>
              {[
                { name: 'Transitarios', count: 60, tone: 'cyan' as const },
                { name: 'Cargadores', count: 184, tone: 'cyan' as const },
                { name: 'Navieras', count: 12, tone: 'cyan' as const },
                { name: 'Agentes aduana', count: 24, tone: 'cyan' as const },
                { name: 'Almacenistas', count: 36, tone: 'cyan' as const },
                { name: 'Tier Oro · premium', count: 8, tone: 'amber' as const },
              ].map((c, i) => (
                <HoloCard
                  key={c.name}
                  variant={c.tone === 'amber' ? 'premium' : 'default'}
                  size="sm"
                  onClick={() => undefined}
                  ariaLabel={`${c.name} · ${c.count} actores`}
                  enterDelay={i * 0.05}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--pm2-font-display)', fontSize: 'var(--pm2-text-md)', color: 'var(--pm2-text-primary)', fontWeight: 500 }}>
                        {c.name}
                      </span>
                      <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: c.tone === 'amber' ? 'var(--pm2-amber)' : 'var(--pm2-cyan-text)', letterSpacing: 'var(--pm2-tracking-wider)' }}>
                        ({c.count})
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--pm2-font-mono)', fontSize: 'var(--pm2-text-xs)', color: 'var(--pm2-text-muted)', letterSpacing: 'var(--pm2-tracking-wide)', textTransform: 'uppercase' }}>
                      Click para abrir
                    </span>
                  </div>
                </HoloCard>
              ))}
            </div>
          </div>
        </div>
      </HoloCard>
    </Section>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SHARED · Section · subTitle · Icons
   ════════════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          fontFamily: 'var(--pm2-font-mono)',
          fontSize: 'var(--pm2-text-sm)',
          color: 'var(--pm2-cyan-text)',
          letterSpacing: 'var(--pm2-tracking-widest)',
          textTransform: 'uppercase',
          marginBottom: 'var(--pm2-space-5)',
          paddingBottom: 'var(--pm2-space-3)',
          borderBottom: '1px solid var(--pm2-border-subtle)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

const subTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--pm2-font-mono)',
  fontSize: 'var(--pm2-text-xs)',
  color: 'var(--pm2-text-muted)',
  letterSpacing: 'var(--pm2-tracking-wider)',
  textTransform: 'uppercase',
  marginBottom: 'var(--pm2-space-3)',
}

/* ──── Inline SVG icons usados en la preview ──── */
const baseIcon = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IconStar() { return (<svg {...baseIcon} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>) }
function IconArrowRight() { return (<svg {...baseIcon} viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>) }
function IconCircle() { return (<svg {...baseIcon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>) }
function IconHex() { return (<svg {...baseIcon} viewBox="0 0 24 24"><polygon points="12 2 22 8 22 16 12 22 2 16 2 8"/></svg>) }
function IconGear() { return (<svg {...baseIcon} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>) }
