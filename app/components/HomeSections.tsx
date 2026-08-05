'use client'

import { getHomeStrings, type HomeStrings, type PaymentModel } from '../data/home-i18n'
import { explorerTxUrl } from '../lib/blockchain/explorerUrls'

const SECTION_PADDING = '6rem 8vw'

// ─── PRUEBA VERIFICABLE POR UN TERCERO, SIN CREDENCIALES (5-ago-2026) ───────
// La home decía «transacciones verificables en el explorador» y NO daba dónde
// clicar. Un evaluador de un programa que aterriza en 1503.global se quedaba
// sin puerta a la evidencia: o tenía el correo con los hashes, o no había forma.
// Estos son los enlaces del escrow de TOKEN (XLS-85) que liquida en una divisa
// emitida, que es la pieza que un revisor de XRPL quiere ver.
//
// Los enlaces salen de `explorerTxUrl` (fuente única, con guardián que prohíbe
// escribir la URL del explorador a mano) y esa función devuelve `null` si el
// hash no tiene forma de hash: así es IMPOSIBLE pintar un enlace roto debajo de
// un texto que promete prueba. Si algún hash se corrompe, desaparece el enlace
// en vez de aparecer uno que lleva a ninguna parte.
const PUBLIC_REPO = 'https://github.com/instalacionesdelamadera-cmd/1503-protocol'
const XLS85_ESCROW_CREATE = 'EB569183CB53350EFC0BDCB271F04C5A59B75ECB6FC84F4D6F5ABC22659A24D0'
const XLS85_ESCROW_FINISH = '9A44384FB992C0F1E9730282891DC8A7DF58F25DE818D2BE16AD2F8AF6812467'

// Etiquetas deliberadamente SIN traducir: son nombres propios del protocolo y
// del repositorio (`EscrowCreate`, `VERIFY.md`). Traducirlos los haría menos
// reconocibles para quien viene a verificar, y evita 8 traducciones que
// envejecerían por separado.
const PROTO_LINKS: { label: string; href: string }[] = [
  { label: 'EscrowCreate', href: explorerTxUrl(XLS85_ESCROW_CREATE) },
  { label: 'EscrowFinish', href: explorerTxUrl(XLS85_ESCROW_FINISH) },
  { label: 'VERIFY.md', href: `${PUBLIC_REPO}/blob/main/VERIFY.md` },
  { label: 'GitHub', href: PUBLIC_REPO },
].filter((l): l is { label: string; href: string } => typeof l.href === 'string' && l.href.length > 0)

const PROTO_LINKS_CSS = `
.proto-link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid rgba(122,136,153,0.35);
  color: #9FB0C4; text-decoration: none;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.66rem; letter-spacing: 0.14em; text-transform: uppercase;
  transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
}
.proto-link:hover, .proto-link:focus-visible {
  color: #E8EDF5; border-color: rgba(0,163,255,0.6); background: rgba(0,163,255,0.07);
}
`

// Default para consumidores que aún no pasan idioma (p. ej. las páginas de
// sector, que hoy renderizan estas secciones en español). La home SÍ pasa su
// `t` localizado. Así no hay regresión y el home queda internacionalizado.
const DEFAULT_T = getHomeStrings('es')

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  fontSize: 'clamp(2rem, 4.2vw, 3.2rem)',
  fontWeight: 700,
  color: '#E8EDF5',
  marginTop: '0.9rem',
  letterSpacing: '0.01em',
  lineHeight: 1.15,
}

const subtitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  fontSize: '1rem',
  color: '#7A8899',
  lineHeight: 1.75,
  margin: '1.25rem auto 0',
  maxWidth: 580,
}

function HexBullet({ color = '#00A3FF', size = 14 }: { color?: string; size?: number }) {
  const r = size / 2
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`)
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <polygon points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.4} />
      <circle cx={r} cy={r} r={r * 0.35} fill={color} />
    </svg>
  )
}

/* ───────────────────────── MANIFESTO ───────────────────────── */
const KPI_ACCENTS = ['#F0B429', '#00A3FF', '#00A3FF', '#F0B429']

export function Manifesto({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'linear-gradient(180deg, transparent 0%, rgba(14,17,24,0.65) 100%)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
        <span style={eyebrowStyle}>{t.manifestoEyebrow}</span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            margin: '0.9rem auto 0',
            padding: '4px 12px',
            border: '1px solid rgba(240,180,41,0.35)',
            borderRadius: 999,
            background: 'rgba(240,180,41,0.05)',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.66rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#F0B429',
          }}
        >
          <HexBullet size={9} color="#F0B429" />
          {t.statusBadge}
        </div>
        <h2 style={h2Style}>
          {t.manifestoTitleA}
          <br />
          <span style={{ color: '#00A3FF' }}>{t.manifestoTitleB}</span>
        </h2>
        <div
          style={{
            marginTop: '1.25rem',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.74rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#00A3FF',
            opacity: 0.85,
          }}
        >
          {t.manifestoTagline}
        </div>
        <p style={subtitleStyle}>{t.manifestoBody}</p>

        {/* KPIs ─ promesas verificables del producto */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            marginTop: '4rem',
            paddingTop: '3rem',
            paddingBottom: '1rem',
            borderTop: '1px solid rgba(30,37,48,0.8)',
            borderBottom: '1px solid rgba(30,37,48,0.8)',
          }}
        >
          {t.kpis.map((k, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '0.75rem 0.5rem',
                position: 'relative',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(30,37,48,0.6)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 700,
                  color: KPI_ACCENTS[i] ?? '#00A3FF',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'baseline',
                }}
              >
                <span>{k.value}</span>
                {k.unit ? (
                  <span
                    style={{
                      fontSize: '0.42em',
                      marginLeft: '0.18em',
                      opacity: 0.85,
                      fontWeight: 500,
                    }}
                  >
                    {k.unit}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  marginTop: '0.85rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#7A8899',
                }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.6rem',
            justifyContent: 'center',
            marginTop: '2.5rem',
          }}
        >
          {t.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-dm-mono), monospace',
                color: '#9FC5E8',
                background: 'rgba(0,163,255,0.06)',
                border: '1px solid rgba(0,163,255,0.22)',
                padding: '5px 14px',
                borderRadius: 999,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HexBullet size={10} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── ERP CONNECT ───────────────────────── */
const ERP_BRANDS = ['SAP', 'Odoo', 'Holded', 'Sage', 'Microsoft Dynamics', 'NetSuite', 'Zoho', 'Custom API']

export function ERPConnect({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: '#0B0D14',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
        }}
      >
        {/* Columna izquierda: copy */}
        <div>
          <span style={eyebrowStyle}>{t.erpEyebrow}</span>
          <h2 style={{ ...h2Style, textAlign: 'left', marginTop: '0.9rem' }}>
            {t.erpTitleA}
            <br />
            <span style={{ color: '#00A3FF' }}>{t.erpTitleB}</span>
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
              fontSize: '1rem',
              color: '#7A8899',
              lineHeight: 1.75,
              margin: '1.5rem 0 0',
              maxWidth: 560,
            }}
          >
            {t.erpBody}
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '2rem 0 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {t.erpBullets.map((b, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  fontSize: '0.95rem',
                  color: '#9FB6CC',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
                }}
              >
                <span style={{ marginTop: '0.35rem' }}>
                  <HexBullet color="#00A3FF" size={12} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Tags ERPs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '2rem',
            }}
          >
            {ERP_BRANDS.map((e) => (
              <span
                key={e}
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  color: '#7A8899',
                  background: 'rgba(0,163,255,0.04)',
                  border: '1px solid rgba(122,136,153,0.25)',
                  padding: '4px 12px',
                  borderRadius: 3,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <p
            style={{
              marginTop: '1rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '0.66rem',
              letterSpacing: '0.14em',
              color: '#4A5566',
              textTransform: 'uppercase',
              lineHeight: 1.7,
            }}
          >
            {t.erpCaption}
          </p>
        </div>

        {/* Columna derecha: ilustración wireframe */}
        <ERPLaptopIllustration header={t.erpIllusHeader} />
      </div>
    </section>
  )
}

function ERPLaptopIllustration({ header }: { header: string }) {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 600 460"
        style={{ width: '100%', maxWidth: 560, height: 'auto', overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <linearGradient id="erpScreenGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0E1118" />
            <stop offset="100%" stopColor="#080A12" />
          </linearGradient>
          <radialGradient id="erpHubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A3FF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00A3FF" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Portátil — base */}
        <path
          d="M 50 360 L 550 360 L 580 380 L 20 380 Z"
          fill="rgba(14,17,24,0.7)"
          stroke="#00A3FF"
          strokeWidth="1.3"
        />
        <line x1="260" y1="368" x2="340" y2="368" stroke="#00A3FF" strokeWidth="1" opacity="0.5" />

        {/* Portátil — pantalla */}
        <rect
          x="65"
          y="65"
          width="470"
          height="295"
          rx="4"
          fill="url(#erpScreenGrad)"
          stroke="#00A3FF"
          strokeWidth="1.5"
        />
        {/* marco interior */}
        <rect
          x="80"
          y="80"
          width="440"
          height="265"
          rx="2"
          fill="none"
          stroke="rgba(0,163,255,0.18)"
          strokeWidth="1"
        />

        {/* Header del dashboard ERP */}
        <text
          x="92"
          y="100"
          fill="#00A3FF"
          fontSize="9"
          fontFamily="var(--font-dm-mono), monospace"
          letterSpacing="2.5"
        >
          {header}
        </text>
        <line x1="92" y1="108" x2="508" y2="108" stroke="rgba(0,163,255,0.22)" strokeWidth="1" />

        {/* Grid de productos (3x2) — cada uno con hex (producto) + líneas (datos) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const x = 100 + col * 137
          const y = 132 + row * 90
          return (
            <g key={i}>
              {/* card */}
              <rect
                x={x}
                y={y}
                width="120"
                height="72"
                rx="2"
                fill="rgba(0,163,255,0.04)"
                stroke="rgba(0,163,255,0.3)"
                strokeWidth="1"
              />
              {/* miniatura (hex como icono de producto) */}
              <polygon
                points={(() => {
                  const cx = x + 22
                  const cy = y + 28
                  const r = 14
                  const pts: string[] = []
                  for (let k = 0; k < 6; k++) {
                    const a = (k * 60 - 30) * (Math.PI / 180)
                    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
                  }
                  return pts.join(' ')
                })()}
                fill="rgba(0,163,255,0.08)"
                stroke="#00A3FF"
                strokeWidth="1.1"
              />
              {/* SKU + label */}
              <text
                x={x + 44}
                y={y + 22}
                fill="#9FB6CC"
                fontSize="7"
                fontFamily="var(--font-dm-mono), monospace"
                letterSpacing="1.5"
              >
                SKU·{String(1042 + i).padStart(4, '0')}
              </text>
              <line
                x1={x + 44}
                y1={y + 28}
                x2={x + 110}
                y2={y + 28}
                stroke="rgba(0,163,255,0.35)"
                strokeWidth="0.8"
              />
              <line
                x1={x + 44}
                y1={y + 36}
                x2={x + 102}
                y2={y + 36}
                stroke="rgba(122,136,153,0.4)"
                strokeWidth="0.8"
              />
              <line
                x1={x + 44}
                y1={y + 44}
                x2={x + 90}
                y2={y + 44}
                stroke="rgba(122,136,153,0.4)"
                strokeWidth="0.8"
              />
              {/* status pill */}
              <rect
                x={x + 6}
                y={y + 56}
                width="40"
                height="10"
                rx="2"
                fill="rgba(240,180,41,0.12)"
                stroke="rgba(240,180,41,0.5)"
                strokeWidth="0.7"
              />
              <text
                x={x + 26}
                y={y + 63}
                fill="#F0B429"
                fontSize="5.5"
                fontFamily="var(--font-dm-mono), monospace"
                textAnchor="middle"
                letterSpacing="1.2"
              >
                SYNC
              </text>
            </g>
          )
        })}

        {/* Línea de conexión saliente del portátil hacia hub 1503 */}
        <path
          d="M 540 224 Q 590 224 590 280 Q 590 380 600 420"
          fill="none"
          stroke="rgba(0,163,255,0.4)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {/* Hub 1503 (decorativo, semi-fuera del laptop) */}
        <g transform="translate(540, 50)">
          <circle cx="0" cy="0" r="34" fill="url(#erpHubGrad)" />
          <polygon
            points={(() => {
              const r = 22
              const pts: string[] = []
              for (let k = 0; k < 6; k++) {
                const a = (k * 60 - 30) * (Math.PI / 180)
                pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`)
              }
              return pts.join(' ')
            })()}
            fill="#08090F"
            stroke="#00A3FF"
            strokeWidth="1.4"
          />
          <text
            x="0"
            y="-2"
            fill="#00A3FF"
            fontSize="7"
            fontFamily="var(--font-dm-mono), monospace"
            textAnchor="middle"
            letterSpacing="1.5"
          >
            DGM
          </text>
          <text
            x="0"
            y="8"
            fill="#7A8899"
            fontSize="5"
            fontFamily="var(--font-dm-mono), monospace"
            textAnchor="middle"
            letterSpacing="1"
          >
            HUB
          </text>
        </g>
        {/* línea de subida desde portátil hasta el hub (con flujo dorado animado) */}
        <line
          x1="500"
          y1="80"
          x2="514"
          y2="64"
          stroke="rgba(0,163,255,0.5)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Partículas doradas viajando del laptop al hub (flujo de datos) */}
        <g>
          {[0, 1, 2].map((i) => (
            <circle key={i} r="3" fill="#F0B429">
              <animateMotion
                path="M 300 220 Q 540 220 540 50"
                dur="3s"
                begin={`${(i * 3) / 3}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;1;0"
                keyTimes="0;0.1;0.5;0.9;1"
                dur="3s"
                begin={`${(i * 3) / 3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>
    </div>
  )
}

/* ───────────────────────── 3 PASOS ───────────────────────── */
export function HowItWorks({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: SECTION_PADDING, background: '#0B0D14' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span style={eyebrowStyle}>{t.howEyebrow}</span>
        <h2 style={h2Style}>{t.howTitle}</h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.25rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {t.howSteps.map((s) => (
          <div
            key={s.num}
            style={{
              background: 'rgba(14,17,24,0.6)',
              border: '1px solid #1E2530',
              borderRadius: 4,
              padding: '2rem 1.75rem',
              position: 'relative',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.78rem',
                letterSpacing: '0.32em',
                color: '#F0B429',
                marginBottom: '1.25rem',
              }}
            >
              {s.num}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.75rem',
                letterSpacing: '0.02em',
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#7A8899',
                lineHeight: 1.75,
                fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
              }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── MODELOS DE PAGO ───────────────────────── */
type PaymentSplitView = { pct: number; color: string; label: string; sub: string }
type PaymentRowData = {
  num: string
  eyebrow: string
  title: string
  desc: string
  libera: string
  split: PaymentSplitView[]
}

// Colores de las barras (diseño, no traducible) — se cruzan por índice con t.payModels.
const SPLIT_COLORS: string[][] = [['#F0B429'], ['#F0B429'], ['#00A3FF', '#F0B429'], ['#00A3FF', '#F0B429']]

function toRowData(m: PaymentModel, i: number): PaymentRowData {
  return {
    num: m.num,
    eyebrow: m.eyebrow,
    title: m.title,
    desc: m.desc,
    libera: m.libera,
    split: m.split.map((s, j) => ({ ...s, color: SPLIT_COLORS[i]?.[j] ?? '#F0B429' })),
  }
}

function PaymentRow({ data, reverse, liberaPrefix }: { data: PaymentRowData; reverse: boolean; liberaPrefix: string }) {
  const totalPct = data.split.reduce((a, s) => a + s.pct, 0)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3rem',
        alignItems: 'center',
        direction: reverse ? 'rtl' : 'ltr',
      }}
    >
      {/* Copy */}
      <div style={{ direction: 'ltr' }}>
        <div
          style={{
            fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
            fontSize: 'clamp(4rem, 9vw, 7rem)',
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '1px #F0B429',
            lineHeight: 0.9,
            marginBottom: '0.5rem',
            letterSpacing: '-0.03em',
          }}
        >
          {data.num}
        </div>
        <div style={{ ...eyebrowStyle, marginBottom: '0.75rem' }}>{data.eyebrow}</div>
        <h3
          style={{
            fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
            fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)',
            fontWeight: 600,
            color: '#E8EDF5',
            marginBottom: '1rem',
            lineHeight: 1.25,
            letterSpacing: '0.01em',
          }}
        >
          {data.title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
            fontSize: '0.98rem',
            color: '#7A8899',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}
        >
          {data.desc}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            border: '1px solid rgba(0,163,255,0.35)',
            borderRadius: 2,
            background: 'rgba(0,163,255,0.05)',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.16em',
            color: '#00A3FF',
            textTransform: 'uppercase',
          }}
        >
          <HexBullet size={10} />
          {liberaPrefix} {data.libera}
        </div>
      </div>

      {/* Visual: barras split */}
      <div style={{ direction: 'ltr' }}>
        <div
          style={{
            position: 'relative',
            background: 'rgba(14,17,24,0.55)',
            border: '1px solid #1E2530',
            borderRadius: 4,
            padding: '1.75rem',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              borderRadius: 2,
              overflow: 'hidden',
              height: 84,
              border: '1px solid rgba(30,37,48,0.8)',
            }}
          >
            {data.split.map((s, i) => (
              <div
                key={i}
                style={{
                  width: `${(s.pct / totalPct) * 100}%`,
                  background:
                    s.color === '#F0B429'
                      ? 'linear-gradient(180deg, rgba(240,180,41,0.18) 0%, rgba(240,180,41,0.32) 100%)'
                      : 'linear-gradient(180deg, rgba(0,163,255,0.14) 0%, rgba(0,163,255,0.26) 100%)',
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(11,13,20,0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Partícula viajera */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <circle r={2.2} fill={s.color}>
                    <animate
                      attributeName="cx"
                      values="0;100"
                      dur="3s"
                      begin={`${i * 0.6}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="50;50"
                      dur="3s"
                      begin={`${i * 0.6}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0"
                      keyTimes="0;0.1;0.5;0.9;1"
                      dur="3s"
                      begin={`${i * 0.6}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
                <div
                  style={{
                    fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: s.color,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    zIndex: 1,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.62rem',
                    letterSpacing: '0.22em',
                    color: '#7A8899',
                    textTransform: 'uppercase',
                    marginTop: '0.35rem',
                    zIndex: 1,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Pies de barra */}
          <div
            style={{
              display: 'flex',
              marginTop: '0.75rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: '0.7rem',
              color: '#4A5566',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {data.split.map((s, i) => (
              <div
                key={i}
                style={{
                  width: `${(s.pct / totalPct) * 100}%`,
                  textAlign: 'center',
                  color: s.color,
                  fontWeight: 600,
                }}
              >
                {s.pct === 100 ? '100%' : `${s.pct}%`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PaymentModels({ t = DEFAULT_T }: { t?: HomeStrings }) {
  const models = t.payModels.map(toRowData)

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.55)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <span style={eyebrowStyle}>{t.payEyebrow}</span>
        <h2 style={h2Style}>{t.payTitle}</h2>
        <p style={subtitleStyle}>{t.paySubtitle}</p>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '5rem',
        }}
      >
        {models.map((m, i) => (
          <PaymentRow key={m.num} data={m} reverse={i % 2 === 1} liberaPrefix={t.payLiberaPrefix} />
        ))}
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '5rem auto 0',
          paddingTop: '3rem',
          borderTop: '1px solid #1E2530',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
            fontSize: '1rem',
            color: '#B0BAC8',
            lineHeight: 1.6,
            marginBottom: '1.25rem',
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t.payFeeLine.split('{pct}')[0]}
          <strong style={{ color: '#F0B429', fontWeight: 700, fontSize: '1.1rem' }}>{t.payFeePct}</strong>
          {t.payFeeLine.split('{pct}')[1]}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.78rem',
            letterSpacing: '0.28em',
            color: '#7A8899',
            textTransform: 'uppercase',
          }}
        >
          {t.payFeeMono}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
            color: '#4A5566',
            textTransform: 'uppercase',
            marginTop: '1rem',
            lineHeight: 1.8,
          }}
        >
          {t.payStatusMono}
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────── TRAZABILIDAD ───────────────────────── */
export function Trazabilidad({ t = DEFAULT_T }: { t?: HomeStrings }) {
  const states = t.traceStates

  // Hexagon nodes for trazabilidad
  const hexPoints = (cx: number, cy: number, r: number) => {
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 30) * (Math.PI / 180)
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    }
    return pts.join(' ')
  }

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.7)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={eyebrowStyle}>{t.traceEyebrow}</span>
        <h2 style={h2Style}>{t.traceTitle}</h2>
        <p style={subtitleStyle}>{t.traceSubtitle}</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <svg viewBox="0 0 1000 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Connector line */}
          <line
            x1={120}
            y1={70}
            x2={880}
            y2={70}
            stroke="url(#trazabilidadGradient)"
            strokeWidth={1.2}
            strokeDasharray="4 5"
          />
          <defs>
            <linearGradient id="trazabilidadGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="#00A3FF" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#F0B429" stopOpacity={0.55} />
            </linearGradient>
          </defs>

          {/* Animated gold particle traveling left → right (3s) */}
          <circle r={4} fill="#F0B429">
            <animateMotion path="M 120,70 L 880,70" dur="3s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.9;1"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          {states.map((s, i) => {
            const cx = 120 + (760 / (states.length - 1)) * i
            const cy = 70
            return (
              <g key={s.num}>
                <polygon
                  points={hexPoints(cx, cy, 30)}
                  fill="#0E1118"
                  stroke="#00A3FF"
                  strokeWidth={1.4}
                />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill="#00A3FF"
                  fontSize={11}
                  fontFamily="var(--font-dm-mono), monospace"
                  letterSpacing="0.18em"
                  fontWeight={500}
                >
                  {s.num}
                </text>
                <text
                  x={cx}
                  y={cy + 60}
                  textAnchor="middle"
                  fill="#E8EDF5"
                  fontSize={13}
                  fontFamily="var(--font-chakra-petch), sans-serif"
                  fontWeight={600}
                  letterSpacing="0.06em"
                  style={{ textTransform: 'uppercase' }}
                >
                  {s.label}
                </text>
                <text
                  x={cx}
                  y={cy + 78}
                  textAnchor="middle"
                  fill="#4A5566"
                  fontSize={10}
                  fontFamily="var(--font-dm-mono), monospace"
                  letterSpacing="0.12em"
                >
                  {s.sub}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

/* ───────────────────────── COMPARATIVA ───────────────────────── */
export function Comparativa({ t = DEFAULT_T }: { t?: HomeStrings }) {
  const rows = t.compRows
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: SECTION_PADDING, background: '#0B0D14' }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={eyebrowStyle}>{t.compEyebrow}</span>
        <h2 style={h2Style}>{t.compTitle}</h2>
        <p style={subtitleStyle}>{t.compSubtitle}</p>
      </div>

      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          border: '1px solid #1E2530',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
            background: '#080B10',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #1E2530',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: '#3A4050' }}>{t.compColConcept}</span>
          <span style={{ color: '#00A3FF', textAlign: 'center', fontWeight: 600 }}>1503</span>
          <span style={{ color: '#3A4050', textAlign: 'center' }}>{t.compColBank}</span>
          <span style={{ color: '#3A4050', textAlign: 'center' }}>{t.compColMarket}</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
              padding: '1rem 1.5rem',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            <span style={{ color: '#7A8899' }}>{r.label}</span>
            <span
              style={{
                textAlign: 'center',
                color: '#00A3FF',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <HexBullet size={9} color="#00A3FF" />
              {r.ours}
            </span>
            <span style={{ textAlign: 'center', color: '#3A4050' }}>{r.bank}</span>
            <span style={{ textAlign: 'center', color: '#3A4050' }}>{r.other}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── WEB3 FEATURES ───────────────────────── */
export function Web3Features({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.7)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span style={eyebrowStyle}>{t.techEyebrow}</span>
        <h2 style={h2Style}>{t.techTitle}</h2>
        <p style={subtitleStyle}>{t.techSubtitle}</p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {t.techFeatures.map((f) => (
          <div
            key={f.title}
            style={{
              background: 'rgba(0,163,255,0.04)',
              border: '1px solid rgba(0,163,255,0.18)',
              borderRadius: 4,
              padding: '1.6rem 1.5rem',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <HexBullet color="#00A3FF" size={18} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.5rem',
                letterSpacing: '0.02em',
              }}
            >
              {f.title}
            </h3>
            <p
              style={{
                fontSize: '0.86rem',
                color: '#7A8899',
                lineHeight: 1.7,
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── CTA ───────────────────────── */
export function CallToAction({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '7rem 8vw 5rem',
        background: '#0B0D14',
        textAlign: 'center',
        borderTop: '1px solid #1E2530',
      }}
    >
      <span style={eyebrowStyle}>{t.ctaEyebrow}</span>
      <h2
        style={{
          ...h2Style,
          fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
          marginTop: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {t.ctaTitleA}
        <br />
        <span style={{ color: '#F0B429' }}>{t.ctaTitleB}</span>.
      </h2>
      <p style={{ ...subtitleStyle, fontSize: '1rem' }}>
        {t.ctaBody}
        <br />
        <strong style={{ color: '#E8EDF5', fontWeight: 600 }}>{t.ctaBold}</strong>
      </p>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '2.5rem',
        }}
      >
        <a
          href="#hero"
          style={{
            background: '#00A3FF',
            color: '#08090F',
            padding: '14px 32px',
            borderRadius: 2,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.92rem',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            textTransform: 'uppercase',
            boxShadow: '0 6px 24px rgba(0,163,255,0.32)',
          }}
        >
          {t.ctaButton}
        </a>
      </div>
    </section>
  )
}

/* ───────────────────────── FOOTER ───────────────────────── */
const FOOTER_HREFS: string[][] = [
  ['/inversores#flujo', '/sectors', '/inversores', '/demo'],
  ['/sector/inmobiliario', '/sector/automocion', '/sector/salud', '/sector/agroalimentario', '/sector/transporte'],
  ['/sectors', '/sectors', '/sectors'],
  ['/legal/privacy', '/legal/terms', '/legal/privacy#s13', '/inversores'],
]

export function HomeFooter({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        background: '#06080C',
        padding: '3.5rem 8vw 2rem',
        borderTop: '1px solid #1E2530',
        fontFamily: 'var(--font-chakra-petch), sans-serif',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2.5rem',
          maxWidth: 1100,
          margin: '0 auto 2.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#E8EDF5',
              letterSpacing: '0.06em',
            }}
          >
            15<span style={{ color: '#00A3FF' }}>03</span>
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: '#7A8899',
              lineHeight: 1.7,
              marginTop: '0.85rem',
            }}
          >
            {t.footerTagline}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: '1rem' }}>
            <HexBullet size={10} />
            <span
              style={{
                fontSize: '0.7rem',
                color: '#00A3FF',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
              }}
            >
              {t.footerSeal}
            </span>
          </div>
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.66rem',
              color: '#4A5566',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {t.footerStandards}
          </div>
        </div>

        {t.footerCols.map((col, ci) => (
          <div key={col.titulo}>
            <div
              style={{
                fontSize: '0.7rem',
                color: '#00A3FF',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                fontFamily: 'var(--font-dm-mono), monospace',
              }}
            >
              {col.titulo}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {col.links.map((label, li) => (
                <li key={label}>
                  <a
                    href={FOOTER_HREFS[ci]?.[li] ?? '#'}
                    style={{
                      fontSize: '0.85rem',
                      color: '#7A8899',
                      textDecoration: 'none',
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid #1E2530',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.74rem',
          color: '#4A5566',
          fontFamily: 'var(--font-dm-mono), monospace',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <span>{t.footerCopyright}</span>
        <span>{t.footerVersion}</span>
      </div>
    </footer>
  )
}

/* ───────────────────────── CAPA A · PROTOCOLO XRPL ───────────────────────── */
const SEAL_ACCENTS = ['#00A3FF', '#F0B429', '#00A3FF']

export function ProtocolLayer({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.72)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', maxWidth: 820, margin: '0 auto 3.5rem' }}>
        <span style={eyebrowStyle}>{t.protoEyebrow}</span>
        <h2 style={h2Style}>{t.protoTitle}</h2>
        <p style={subtitleStyle}>{t.protoSubtitle}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {t.protoSeals.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(14,17,24,0.6)',
              border: '1px solid #1E2530',
              borderRadius: 6,
              padding: '2rem 1.75rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
              <HexBullet size={16} color={SEAL_ACCENTS[i] ?? '#00A3FF'} />
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.68rem',
                  letterSpacing: '0.24em',
                  color: SEAL_ACCENTS[i] ?? '#00A3FF',
                  textTransform: 'uppercase',
                }}
              >
                {s.seal}
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.6rem',
                letterSpacing: '0.02em',
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#7A8899',
                lineHeight: 1.7,
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '3rem auto 0', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.16em',
            color: '#7A8899',
            textTransform: 'uppercase',
            lineHeight: 1.9,
          }}
        >
          {t.protoProof}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: '1.25rem',
            padding: '6px 14px',
            border: '1px solid rgba(240,180,41,0.35)',
            borderRadius: 999,
            background: 'rgba(240,180,41,0.05)',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#F0B429',
          }}
        >
          <HexBullet size={9} color="#F0B429" />
          {t.protoBadge}
        </div>

        {/* Los enlaces que convierten «verificable» en verificable de verdad. */}
        {PROTO_LINKS.length > 0 && (
          <div
            style={{
              marginTop: '1.4rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            {PROTO_LINKS.map((l) => (
              <a
                key={l.label}
                className="proto-link"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label} ↗
              </a>
            ))}
            <style>{PROTO_LINKS_CSS}</style>
          </div>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── MOTOR DE CUMPLIMIENTO ───────────────────────── */
const ENG_ACCENTS = ['#00A3FF', '#F0B429', '#00A3FF', '#F0B429']

export function ComplianceEngine({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: '#0B0D14',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: 780, margin: '0 auto 3rem' }}>
        <span style={eyebrowStyle}>{t.engEyebrow}</span>
        <h2 style={h2Style}>{t.engTitle}</h2>
        <p style={subtitleStyle}>{t.engSubtitle}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.5rem',
          maxWidth: 1000,
          margin: '0 auto 3.5rem',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
          borderTop: '1px solid rgba(30,37,48,0.8)',
          borderBottom: '1px solid rgba(30,37,48,0.8)',
        }}
      >
        {t.engStats.map((k, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: 'clamp(1.7rem, 3.4vw, 2.6rem)',
                fontWeight: 700,
                color: ENG_ACCENTS[i] ?? '#00A3FF',
                lineHeight: 1,
                letterSpacing: '0.01em',
              }}
            >
              {k.value}
            </div>
            <div
              style={{
                marginTop: '0.75rem',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.66rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#7A8899',
              }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 auto',
          maxWidth: 820,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {t.engBullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              fontSize: '0.95rem',
              color: '#9FB6CC',
              lineHeight: 1.65,
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            <span style={{ marginTop: '0.35rem' }}>
              <HexBullet color="#00A3FF" size={12} />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────────── EL PROBLEMA · DE DÍAS A HORAS ───────────────────────── */
export function ProblemSection({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: '#0B0D14',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', maxWidth: 860, margin: '0 auto 3.5rem' }}>
        <span style={eyebrowStyle}>{t.probEyebrow}</span>
        <h2 style={h2Style}>{t.probTitle}</h2>
        <p style={subtitleStyle}>{t.probSubtitle}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {t.probItems.map((it, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(14,17,24,0.5)',
              border: '1px solid #1E2530',
              borderRadius: 6,
              padding: '1.6rem 1.5rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.78rem',
                letterSpacing: '0.28em',
                color: '#4A5566',
                marginBottom: '0.9rem',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.55rem',
                letterSpacing: '0.02em',
              }}
            >
              {it.title}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#7A8899', lineHeight: 1.65, fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
              {it.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Compresión del tiempo — el antes/después */}
      <div style={{ maxWidth: 900, margin: '4rem auto 0', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
              color: '#4A5566',
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(240,180,41,0.5)',
            }}
          >
            {t.probStatFrom}
          </span>
          <span style={{ color: '#00A3FF', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>→</span>
          <span style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', color: '#00A3FF' }}>{t.probStatTo}</span>
        </div>
        <div
          style={{
            marginTop: '0.9rem',
            fontFamily: 'var(--font-dm-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#7A8899',
          }}
        >
          {t.probStatLabel}
        </div>
        <p style={{ ...subtitleStyle, maxWidth: 720, marginTop: '1.75rem' }}>{t.probOutcome}</p>
      </div>
    </section>
  )
}

/* ───────────────────────── POR QUÉ AHORA · EL RELOJ ESPR ───────────────────────── */
export function WhyNow({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.7)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: 820, margin: '0 auto 3rem' }}>
        <span style={eyebrowStyle}>{t.whyEyebrow}</span>
        <h2 style={h2Style}>{t.whyTitle}</h2>
        <p style={subtitleStyle}>{t.whySubtitle}</p>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {t.whyDeadlines.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '1.75rem',
              alignItems: 'baseline',
              padding: '1.5rem 0',
              borderTop: '1px solid #1E2530',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-chakra-petch), sans-serif',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  fontWeight: 700,
                  color: '#F0B429',
                  lineHeight: 1,
                }}
              >
                {d.year}
              </div>
              <div
                style={{
                  marginTop: '0.4rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.7rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#00A3FF',
                }}
              >
                {d.sector}
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#9FB6CC', lineHeight: 1.65, fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
              {d.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── RADAR + VERO · TRABAJO AUTOMÁTICO ───────────────────────── */
export function Automation({ t = DEFAULT_T }: { t?: HomeStrings }) {
  const pillars = [
    { accent: '#00A3FF', title: t.autoRadarTitle, desc: t.autoRadarDesc },
    { accent: '#F0B429', title: t.autoVeroTitle, desc: t.autoVeroDesc },
    { accent: '#00A3FF', title: t.autoLawTitle, desc: t.autoLawDesc },
  ]
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: SECTION_PADDING,
        background: 'rgba(8,9,15,0.55)',
        borderTop: '1px solid #1E2530',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', maxWidth: 820, margin: '0 auto 3.5rem' }}>
        <span style={eyebrowStyle}>{t.autoEyebrow}</span>
        <h2 style={h2Style}>{t.autoTitle}</h2>
        <p style={subtitleStyle}>{t.autoSubtitle}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: 980,
          margin: '0 auto',
        }}
      >
        {pillars.map((p, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(14,17,24,0.6)',
              border: '1px solid #1E2530',
              borderRadius: 6,
              padding: '2rem 1.75rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ marginBottom: '1.1rem' }}>
              <HexBullet color={p.accent} size={20} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#E8EDF5',
                marginBottom: '0.7rem',
                letterSpacing: '0.02em',
              }}
            >
              {p.title}
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#7A8899', lineHeight: 1.7, fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── EXPORT BUNDLE ───────────────────────── */
export default function HomeSections({ t = DEFAULT_T }: { t?: HomeStrings }) {
  return (
    <>
      <Manifesto t={t} />
      <ProblemSection t={t} />
      <ProtocolLayer t={t} />
      <ERPConnect t={t} />
      <Automation t={t} />
      <HowItWorks t={t} />
      <PaymentModels t={t} />
      <Trazabilidad t={t} />
      <ComplianceEngine t={t} />
      <WhyNow t={t} />
      <Comparativa t={t} />
      <Web3Features t={t} />
      <CallToAction t={t} />
      <HomeFooter t={t} />
    </>
  )
}
