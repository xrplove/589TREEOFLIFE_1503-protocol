'use client'

// Landing / dossier para inversores · 1503.
// Dirección estética: TRUST-FORWARD institucional editorial ("el libro mayor del
// comercio global"). Base papel cálido · tinta navy · oro sobrio · cero glow.
// NO toca app/page.tsx (globo) ni el workspace. Ruta independiente /inversores.
//
// Honestidad (valor canónico): cero métricas falsas · cero usuarios inventados.
// Solo se afirma lo verificable (arquitectura, normas modeladas, estado real).

import { useEffect, useState } from 'react'
import { Fraunces } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

// ============================================================================
// Hook · reveal on scroll (IntersectionObserver · CSS-driven)
// ============================================================================
function useReveal(): [(node: HTMLElement | null) => void, boolean] {
  const [shown, setShown] = useState(false)
  const [node, setNode] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.18 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node])
  return [setNode, shown]
}

// ============================================================================
// Datos · el flujo (corazón de la página)
// ============================================================================
type FlowStep = {
  key: string
  n: string
  label: string
  title: string
  body: string
  tag: string
}

const FLOW: FlowStep[] = [
  {
    key: 'producto',
    n: '01',
    label: 'Producto',
    title: 'Una ficha que nace verificable',
    body: 'El fabricante publica un producto o servicio. 1503 le exige los datos que la ley pedirá: origen, materiales, lote, certificados. No es opcional: es la puerta de entrada.',
    tag: 'sku · gtin · origen · lote',
  },
  {
    key: 'dpp',
    n: '02',
    label: 'Pasaporte Digital',
    title: 'Digital Product Passport · 6 capas',
    body: 'Cada ficha se convierte en un Pasaporte Digital de Producto: sostenibilidad (ESPR), embalaje, vínculo con el ERP, ciclo de vida, custodia y origen. El activo deja de ser un PDF y pasa a ser un dato vivo y auditable.',
    tag: 'ESPR · EUDR · CBAM · trazabilidad',
  },
  {
    key: 'gate',
    n: '03',
    label: 'Gate de cumplimiento',
    title: 'La ley, forzada por el sistema',
    body: 'Antes de publicarse, la ficha pasa un gate que aplica la normativa real del sector: si incumple una obligación bloqueante (RoHS, MDR, IVA intracomunitario, homologación…) no se publica. El cumplimiento deja de ser confianza y pasa a ser código.',
    tag: '11/11 sectores · 44 normas modeladas',
  },
  {
    key: 'custodia',
    n: '04',
    label: 'Custodia firmada',
    title: 'Cadena de custodia criptográfica',
    body: 'Cada actor que toca la mercancía —fabricante, transitario, transportista, aduana, destinatario— deja una huella firmada con Ed25519, encadenada por hash con la anterior. Una trazabilidad que nadie puede falsificar después.',
    tag: 'Ed25519 · hash encadenado · GPS',
  },
  {
    key: 'escrow',
    n: '05',
    label: 'Pago contra entrega',
    title: 'Escrow que se libera solo',
    body: 'El pago queda en escrow y se libera automáticamente cuando la entrega se firma en la cadena de custodia. Reemplaza el crédito documentario bancario por una garantía programable, sin custodiar el dinero de nadie.',
    tag: 'Liberación contra entrega · non-custodial',
  },
]

// ============================================================================
// Datos · sectores con cumplimiento integrado (prueba de profundidad, real)
// ============================================================================
const SECTORS: { name: string; laws: string }[] = [
  { name: 'Tecnología', laws: 'RoHS · WEEE · RED · CRA · AI Act' },
  { name: 'Salud', laws: 'MDR 2017/745 · UDI · AEMPS' },
  { name: 'Automoción', laws: 'Homologación UE 2018/858 · COC' },
  { name: 'Textil', laws: 'ESPR · REACH · Reg. 1007/2011' },
  { name: 'Agroalimentario', laws: 'FIC 1169/2011 · RGSEAA · DOP/IGP' },
  { name: 'Metalúrgico', laws: 'PED · EN 1090 · REACH · CBAM' },
  { name: 'Energía', laws: 'LVD · EMC · REBT · etiqueta energética' },
  { name: 'Inmobiliario', laws: 'CEE RD 390/2021 · EPBD' },
  { name: 'Legal', laws: 'Colegiación · Ley 10/2010 AML' },
  { name: 'Turismo', laws: 'STR 2024/1028 · viajes combinados' },
  { name: 'Transporte', laws: 'Op. transporte 1071/2009 · CMR' },
]

// ============================================================================
// Datos · por qué ahora (timeline regulatorio real)
// ============================================================================
const TIMELINE: { year: string; event: string }[] = [
  { year: '2025', event: 'ViDA · factura electrónica y reporte digital del IVA' },
  { year: '2026', event: 'Cargador común USB-C · alquiler corta duración 2024/1028' },
  { year: '2027', event: 'DPP de baterías · Reglamento de Máquinas · derecho a reparar' },
  { year: '2028–30', event: 'DPP obligatorio: electrónica · textil · ICT (ESPR)' },
]

// ============================================================================
// Página
// ============================================================================
export default function InversoresPage() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Gate de animación: sin JS el contenido es visible por defecto (nunca
  // invisible si el observer falla). Con JS, las secciones animan al entrar.
  // rAF difiere el setState fuera del cuerpo síncrono del effect.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Auto-avance del flujo (pausable al interactuar).
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActive((a) => (a + 1) % FLOW.length), 3800)
    return () => clearInterval(id)
  }, [paused])

  const [problemRef, problemIn] = useReveal()
  const [flowRef, flowIn] = useReveal()
  const [whyRef, whyIn] = useReveal()
  const [coverRef, coverIn] = useReveal()
  const [honestRef, honestIn] = useReveal()

  const step = FLOW[active]

  return (
    <div className={`${fraunces.variable} pm-root ${mounted ? 'pm-js' : ''}`}>
      <style>{CSS}</style>

      {/* ─────────── Header ─────────── */}
      <header className="pm-header">
        <div className="pm-wrap pm-header-inner">
          <a href="#top" className="pm-wordmark">
            1503
            <span className="pm-wordmark-sub">infraestructura del comercio global</span>
          </a>
          <a href="#contacto" className="pm-cta pm-cta-sm">
            Solicitar acceso inversor
          </a>
        </div>
      </header>

      {/* ─────────── Hero ─────────── */}
      <section id="top" className="pm-hero">
        <div className="pm-wrap pm-hero-grid">
          <div className="pm-hero-copy">
            <p className="pm-eyebrow pm-reveal" style={{ animationDelay: '40ms' }}>
              Dossier para inversores · 2026
            </p>
            <h1 className="pm-h1 ff-display pm-reveal" style={{ animationDelay: '120ms' }}>
              La capa de confianza del&nbsp;comercio&nbsp;global.
            </h1>
            <p className="pm-lead pm-reveal" style={{ animationDelay: '220ms' }}>
              1503 convierte cada operación internacional en un activo
              verificable: Pasaporte Digital de Producto, cumplimiento normativo
              forzado por el sistema, custodia criptográfica y liberación de
              pagos contra entrega firmada.
            </p>
            <div className="pm-hero-ctas pm-reveal" style={{ animationDelay: '320ms' }}>
              <a href="#contacto" className="pm-cta">Solicitar acceso inversor</a>
              <a href="#flujo" className="pm-cta-ghost">Ver cómo funciona ↓</a>
            </div>
          </div>

          {/* Tarjeta "registro DPP" — visual editorial, sin glow */}
          <aside className="pm-hero-card pm-reveal" style={{ animationDelay: '420ms' }} aria-hidden="true">
            <div className="pm-card-top">
              <span className="ff-mono pm-card-id">DPP · 0xA3F…9C2</span>
              <span className="pm-stamp">✓ CONFORME</span>
            </div>
            <div className="pm-card-rows">
              <Row k="Sector" v="Tecnología" />
              <Row k="Origen" v="Shenzhen → Valencia" />
              <Row k="RoHS" v="Conforme · Dir. 2011/65" />
              <Row k="CRA · SBOM" v="Verificado" />
              <Row k="IVA intracom." v="Reverse charge · 349:E" />
              <Row k="Custodia" v="4 firmas Ed25519" />
            </div>
            <div className="pm-card-foot">
              <span className="ff-mono">escrow</span>
              <span className="pm-bar"><span className="pm-bar-fill" /></span>
              <span className="ff-mono pm-card-foot-r">liberado al entregar</span>
            </div>
          </aside>
        </div>
        <div className="pm-marquee">
          <div className="pm-wrap ff-mono pm-marquee-inner">
            <span>ESPR 2024/1781</span><i>·</i>
            <span>MDR 2017/745</span><i>·</i>
            <span>CRA 2024/2847</span><i>·</i>
            <span>ViDA 2025/516</span><i>·</i>
            <span>EUDR 2023/1115</span><i>·</i>
            <span>CBAM 2023/956</span><i>·</i>
            <span>AI Act 2024/1689</span><i>·</i>
            <span>STR 2024/1028</span>
          </div>
        </div>
      </section>

      {/* ─────────── 01 · Problema ─────────── */}
      <section className="pm-section">
        <div ref={problemRef} className={`pm-wrap pm-block ${problemIn ? 'is-in' : ''}`}>
          <SectionHead n="01" label="El problema" />
          <h2 className="pm-h2 ff-display">
            El comercio internacional aún funciona con papel, confianza ciega y semanas de fricción.
          </h2>
          <div className="pm-problem-grid">
            <Problem t="Origen opaco" d="Nadie puede probar de dónde viene de verdad un producto ni qué lleva dentro." />
            <Problem t="Fraude documental" d="Certificados, facturas y conocimientos de embarque se falsifican y se duplican." />
            <Problem t="Cumplimiento manual" d="El cumplimiento normativo se revisa a mano, tarde, caro y con errores." />
            <Problem t="Pago lento y bancarizado" d="El crédito documentario tarda semanas y depende de un banco intermediario." />
          </div>
        </div>
      </section>

      {/* ─────────── 02 · Cómo funciona (corazón interactivo) ─────────── */}
      <section id="flujo" className="pm-section pm-section-flow">
        <div ref={flowRef} className={`pm-wrap pm-block ${flowIn ? 'is-in' : ''}`}>
          <SectionHead n="02" label="Cómo funciona" dark />
          <h2 className="pm-h2 ff-display pm-h2-dark">
            Del producto al pago, en una sola cadena verificable.
          </h2>

          <div
            className="pm-flow"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="pm-flow-steps" role="tablist" aria-label="Flujo 1503">
              {FLOW.map((s, i) => (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={i === active}
                  className={`pm-flow-step ${i === active ? 'is-active' : ''} ${i < active ? 'is-done' : ''}`}
                  onClick={() => {
                    setActive(i)
                    setPaused(true)
                  }}
                >
                  <span className="ff-mono pm-flow-n">{s.n}</span>
                  <span className="pm-flow-label">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="pm-flow-panel" key={step.key}>
              <div className="pm-flow-panel-in">
                <span className="ff-mono pm-flow-tag">{step.tag}</span>
                <h3 className="pm-h3 ff-display">{step.title}</h3>
                <p className="pm-flow-body">{step.body}</p>
              </div>
              <div className="pm-flow-progress" aria-hidden="true">
                {FLOW.map((s, i) => (
                  <span key={s.key} className={`pm-dot ${i === active ? 'is-active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 03 · Por qué ahora ─────────── */}
      <section className="pm-section">
        <div ref={whyRef} className={`pm-wrap pm-block ${whyIn ? 'is-in' : ''}`}>
          <SectionHead n="03" label="Por qué ahora" />
          <h2 className="pm-h2 ff-display">
            La regulación europea está haciendo obligatorio lo que 1503 ya hace nativo.
          </h2>
          <div className="pm-timeline">
            {TIMELINE.map((t) => (
              <div className="pm-tl-item" key={t.year}>
                <span className="ff-mono pm-tl-year">{t.year}</span>
                <span className="pm-tl-line" aria-hidden="true" />
                <span className="pm-tl-event">{t.event}</span>
              </div>
            ))}
          </div>
          <p className="pm-why-note">
            El Pasaporte Digital de Producto deja de ser una ventaja y pasa a ser
            un requisito legal escalonado entre 2027 y 2030. 1503 llega con
            la infraestructura ya construida.
          </p>
        </div>
      </section>

      {/* ─────────── 04 · Cobertura ─────────── */}
      <section className="pm-section pm-section-alt">
        <div ref={coverRef} className={`pm-wrap pm-block ${coverIn ? 'is-in' : ''}`}>
          <SectionHead n="04" label="Cobertura" />
          <h2 className="pm-h2 ff-display">
            Once sectores con cumplimiento integrado, no decorativo.
          </h2>
          <div className="pm-sectors">
            {SECTORS.map((s) => (
              <div className="pm-sector" key={s.name}>
                <span className="pm-sector-name">{s.name}</span>
                <span className="ff-mono pm-sector-laws">{s.laws}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── 05 · Estado real (honestidad) ─────────── */}
      <section className="pm-section">
        <div ref={honestRef} className={`pm-wrap pm-block ${honestIn ? 'is-in' : ''}`}>
          <SectionHead n="05" label="Estado real" />
          <h2 className="pm-h2 ff-display">Construido para auditar. Honesto sobre dónde estamos.</h2>
          <div className="pm-honest-grid">
            <div className="pm-honest-col">
              <p className="pm-honest-h">Lo que ya es real</p>
              <ul className="pm-honest-list">
                <li>Arquitectura <em>audit-ready by design</em>: cada decisión marcada para validación experta.</li>
                <li>Marco normativo de 44 normas UE + ES verificado contra fuentes oficiales (EUR-Lex, BOE, AEAT).</li>
                <li>Gate de cumplimiento que rechaza, en código, lo que la ley prohíbe.</li>
                <li>Modelo non-custodial: nunca custodiamos el dinero del usuario.</li>
              </ul>
            </div>
            <div className="pm-honest-col">
              <p className="pm-honest-h">Lo que aún no</p>
              <ul className="pm-honest-list pm-honest-list-muted">
                <li>No hay usuarios en producción todavía — y no inflamos métricas que no existen.</li>
                <li>Pendiente de auditoría legal externa (abogado fintech) y de seguridad (pentest + WAF).</li>
                <li>El sello formal de cumplimiento lo emite un humano experto, no el código.</li>
                <li>Esos pasos pre-deploy son, precisamente, para lo que se levanta esta ronda.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── CTA final ─────────── */}
      <section id="contacto" className="pm-section pm-contacto">
        <div className="pm-wrap pm-contacto-in">
          <h2 className="pm-h2 ff-display pm-h2-dark">Hablemos.</h2>
          <p className="pm-contacto-lead">
            Si inviertes en infraestructura de comercio, fintech B2B o cumplimiento,
            te enseñamos el motor por dentro.
          </p>
          <a href="mailto:inversores@1503.global?subject=Acceso%20inversor%201503" className="pm-cta pm-cta-lg">
            inversores@1503.global
          </a>
        </div>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="pm-footer">
        <div className="pm-wrap pm-footer-in">
          <span className="pm-wordmark pm-wordmark-foot">1503</span>
          <p className="pm-footer-note ff-mono">
            Documento informativo · no constituye oferta de valores ni asesoramiento financiero.
            Las afirmaciones de cumplimiento están sujetas a validación experta externa antes de go-live.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// Subcomponentes
// ============================================================================
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="pm-row">
      <span className="pm-row-k ff-mono">{k}</span>
      <span className="pm-row-v">{v}</span>
    </div>
  )
}

function SectionHead({ n, label, dark }: { n: string; label: string; dark?: boolean }) {
  return (
    <div className={`pm-shead ${dark ? 'pm-shead-dark' : ''}`}>
      <span className="ff-mono pm-shead-n">{n}</span>
      <span className="pm-shead-rule" aria-hidden="true" />
      <span className="ff-mono pm-shead-label">{label}</span>
    </div>
  )
}

function Problem({ t, d }: { t: string; d: string }) {
  return (
    <div className="pm-problem">
      <h3 className="pm-problem-t ff-display">{t}</h3>
      <p className="pm-problem-d">{d}</p>
    </div>
  )
}

// ============================================================================
// Estilos (scoped por prefijo pm- · base clara que sobrescribe el body oscuro)
// ============================================================================
const CSS = `
.pm-root {
  --ink: #0a1628;
  --ink-soft: #41506a;
  --ink-faint: #8a96ab;
  --paper: #faf8f3;
  --paper-2: #f1ede4;
  --line: rgba(10,22,40,0.12);
  --gold: #9a7b3f;
  --gold-2: #b8893a;
  --teal: #0e6e78;
  --navy-deep: #0a1628;
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  color: var(--ink);
  background: var(--paper);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.pm-root .ff-display { font-family: var(--font-fraunces), Georgia, serif; }
.pm-root .ff-mono { font-family: var(--font-dm-mono), ui-monospace, monospace; }
.pm-wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 32px; }

/* Header */
.pm-header { position: sticky; top: 0; z-index: 50; background: rgba(250,248,243,0.82); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.pm-header-inner { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.pm-wordmark { display: flex; flex-direction: column; line-height: 1; text-decoration: none; color: var(--ink); font-weight: 700; letter-spacing: 0.14em; font-size: 0.95rem; }
.pm-wordmark-sub { font-weight: 400; letter-spacing: 0.18em; font-size: 0.56rem; text-transform: uppercase; color: var(--ink-faint); margin-top: 5px; }

/* CTA */
.pm-cta { display: inline-block; background: var(--navy-deep); color: #faf8f3; text-decoration: none; font-size: 0.86rem; font-weight: 500; letter-spacing: 0.01em; padding: 13px 22px; border-radius: 2px; border: 1px solid var(--navy-deep); transition: transform .18s ease, background .18s ease; }
.pm-cta:hover { background: #16223a; transform: translateY(-1px); }
.pm-cta-sm { padding: 9px 16px; font-size: 0.78rem; }
.pm-cta-lg { padding: 17px 30px; font-size: 1.02rem; letter-spacing: 0.02em; }
.pm-cta-ghost { display: inline-block; color: var(--ink); text-decoration: none; font-size: 0.86rem; font-weight: 500; padding: 13px 8px; border-bottom: 1px solid var(--gold); transition: color .18s; }
.pm-cta-ghost:hover { color: var(--gold-2); }

/* Hero */
.pm-hero { padding-top: 78px; border-bottom: 1px solid var(--line); }
.pm-hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 64px; align-items: center; padding-bottom: 70px; }
.pm-eyebrow { font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold-2); font-weight: 500; margin-bottom: 22px; }
.pm-h1 { font-size: clamp(2.6rem, 5.4vw, 4.5rem); line-height: 1.02; font-weight: 500; letter-spacing: -0.018em; color: var(--ink); }
.pm-lead { margin-top: 26px; font-size: 1.12rem; line-height: 1.62; color: var(--ink-soft); max-width: 33em; }
.pm-hero-ctas { margin-top: 36px; display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }

/* Hero card */
.pm-hero-card { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: 22px; box-shadow: 0 24px 60px -28px rgba(10,22,40,0.35), 0 2px 8px rgba(10,22,40,0.05); }
.pm-card-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.pm-card-id { font-size: 0.74rem; color: var(--ink-faint); letter-spacing: 0.04em; }
.pm-stamp { font-size: 0.66rem; font-weight: 600; letter-spacing: 0.08em; color: #1f7a4d; background: rgba(31,122,77,0.1); border: 1px solid rgba(31,122,77,0.3); padding: 4px 9px; border-radius: 3px; }
.pm-card-rows { padding: 6px 0; }
.pm-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px dashed var(--line); }
.pm-row:last-child { border-bottom: none; }
.pm-row-k { font-size: 0.72rem; color: var(--ink-faint); letter-spacing: 0.03em; }
.pm-row-v { font-size: 0.86rem; color: var(--ink); font-weight: 500; }
.pm-card-foot { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--line); }
.pm-card-foot .ff-mono { font-size: 0.66rem; color: var(--ink-faint); letter-spacing: 0.05em; white-space: nowrap; }
.pm-card-foot-r { color: var(--gold-2) !important; }
.pm-bar { flex: 1; height: 4px; background: var(--paper-2); border-radius: 4px; overflow: hidden; }
.pm-bar-fill { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-2)); transform-origin: left; animation: pm-fill 3.6s ease-in-out infinite; }
@keyframes pm-fill { 0% { transform: scaleX(0.05);} 60% { transform: scaleX(1);} 100% { transform: scaleX(1);} }

/* Marquee */
.pm-marquee { background: var(--paper-2); border-top: 1px solid var(--line); }
.pm-marquee-inner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 14px 32px; font-size: 0.7rem; letter-spacing: 0.06em; color: var(--ink-faint); }
.pm-marquee-inner i { color: var(--gold); font-style: normal; }

/* Sections */
.pm-section { padding: 96px 0; border-bottom: 1px solid var(--line); }
.pm-section-alt { background: var(--paper-2); }
.pm-section-flow { background: var(--navy-deep); border-bottom: none; }
.pm-block { transition: opacity .7s ease, transform .7s ease; }
.pm-js .pm-block { opacity: 0; transform: translateY(22px); }
.pm-js .pm-block.is-in { opacity: 1; transform: none; }

/* Section head */
.pm-shead { display: flex; align-items: center; gap: 16px; margin-bottom: 26px; }
.pm-shead-n { font-size: 0.78rem; color: var(--gold-2); letter-spacing: 0.05em; }
.pm-shead-rule { width: 40px; height: 1px; background: var(--line); }
.pm-shead-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--ink-faint); }
.pm-shead-dark .pm-shead-rule { background: rgba(255,255,255,0.18); }
.pm-shead-dark .pm-shead-label { color: rgba(255,255,255,0.55); }

/* Headings */
.pm-h2 { font-size: clamp(1.7rem, 3.4vw, 2.6rem); line-height: 1.12; font-weight: 500; letter-spacing: -0.012em; max-width: 17em; color: var(--ink); }
.pm-h2-dark { color: #faf8f3; }
.pm-h3 { font-size: 1.5rem; font-weight: 500; line-height: 1.18; letter-spacing: -0.01em; }

/* Problema */
.pm-problem-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; margin-top: 46px; background: var(--line); border: 1px solid var(--line); }
.pm-problem { background: var(--paper); padding: 30px 28px; }
.pm-problem-t { font-size: 1.2rem; font-weight: 600; color: var(--ink); }
.pm-problem-d { margin-top: 10px; font-size: 0.96rem; line-height: 1.55; color: var(--ink-soft); }

/* Flow (dark) */
.pm-flow { margin-top: 46px; }
.pm-flow-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.pm-flow-step { display: flex; flex-direction: column; gap: 9px; align-items: flex-start; text-align: left; background: transparent; border: none; border-top: 2px solid rgba(255,255,255,0.14); padding: 16px 4px 0; cursor: pointer; transition: border-color .3s ease; }
.pm-flow-step.is-active { border-top-color: var(--gold-2); }
.pm-flow-step.is-done { border-top-color: rgba(184,137,58,0.45); }
.pm-flow-n { font-size: 0.72rem; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; }
.pm-flow-step.is-active .pm-flow-n { color: var(--gold-2); }
.pm-flow-label { font-size: 0.92rem; font-weight: 500; color: rgba(255,255,255,0.55); transition: color .3s; }
.pm-flow-step.is-active .pm-flow-label { color: #faf8f3; }
.pm-flow-panel { margin-top: 40px; min-height: 196px; display: flex; flex-direction: column; justify-content: space-between; animation: pm-panel .5s ease both; }
@keyframes pm-panel { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: none;} }
.pm-flow-tag { display: inline-block; font-size: 0.7rem; letter-spacing: 0.05em; color: var(--gold-2); border: 1px solid rgba(184,137,58,0.35); border-radius: 3px; padding: 5px 10px; margin-bottom: 20px; }
.pm-flow-panel .pm-h3 { color: #faf8f3; max-width: 16em; }
.pm-flow-body { margin-top: 16px; font-size: 1.08rem; line-height: 1.62; color: rgba(255,255,255,0.7); max-width: 40em; }
.pm-flow-progress { display: flex; gap: 8px; margin-top: 30px; }
.pm-dot { width: 28px; height: 3px; border-radius: 3px; background: rgba(255,255,255,0.16); transition: background .3s; }
.pm-dot.is-active { background: var(--gold-2); }

/* Timeline */
.pm-timeline { margin-top: 46px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
.pm-tl-item { background: var(--paper); padding: 26px 22px; display: flex; flex-direction: column; gap: 14px; }
.pm-tl-year { font-size: 1.05rem; color: var(--gold-2); letter-spacing: 0.02em; }
.pm-tl-line { width: 100%; height: 1px; background: var(--line); }
.pm-tl-event { font-size: 0.92rem; line-height: 1.5; color: var(--ink-soft); }
.pm-why-note { margin-top: 36px; font-size: 1.08rem; line-height: 1.6; color: var(--ink); max-width: 38em; border-left: 2px solid var(--gold); padding-left: 22px; }

/* Sectores */
.pm-sectors { margin-top: 46px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
.pm-sector { background: var(--paper-2); display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 24px; }
.pm-section-alt .pm-sector { background: var(--paper); }
.pm-sector-name { font-size: 1rem; font-weight: 600; color: var(--ink); white-space: nowrap; }
.pm-sector-laws { font-size: 0.72rem; color: var(--ink-faint); letter-spacing: 0.02em; text-align: right; }

/* Honestidad */
.pm-honest-grid { margin-top: 46px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.pm-honest-h { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--gold-2); font-weight: 600; margin-bottom: 18px; }
.pm-honest-list { list-style: none; }
.pm-honest-list li { position: relative; padding-left: 26px; margin-bottom: 16px; font-size: 1rem; line-height: 1.55; color: var(--ink); }
.pm-honest-list li::before { content: ''; position: absolute; left: 0; top: 9px; width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }
.pm-honest-list li em { font-style: italic; color: var(--ink-soft); }
.pm-honest-list-muted li { color: var(--ink-soft); }
.pm-honest-list-muted li::before { background: var(--ink-faint); }

/* Contacto */
.pm-contacto { background: var(--navy-deep); border-bottom: none; text-align: center; }
.pm-contacto-in { display: flex; flex-direction: column; align-items: center; }
.pm-contacto-lead { margin-top: 18px; font-size: 1.12rem; line-height: 1.6; color: rgba(255,255,255,0.7); max-width: 30em; }
.pm-contacto .pm-cta { margin-top: 32px; background: var(--gold-2); border-color: var(--gold-2); color: var(--navy-deep); font-weight: 600; }
.pm-contacto .pm-cta:hover { background: #c99a4b; }

/* Footer */
.pm-footer { background: var(--navy-deep); padding: 40px 0; }
.pm-footer-in { display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
.pm-wordmark-foot { color: rgba(255,255,255,0.85); }
.pm-footer-note { font-size: 0.66rem; line-height: 1.6; color: rgba(255,255,255,0.4); max-width: 44em; letter-spacing: 0.02em; }

/* Reveal (hero load) */
.pm-reveal { opacity: 0; transform: translateY(16px); animation: pm-in .8s cubic-bezier(0.2,0.7,0.2,1) forwards; }
@keyframes pm-in { to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .pm-reveal, .pm-block, .pm-flow-panel, .pm-bar-fill { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
}

/* Responsive */
@media (max-width: 900px) {
  .pm-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .pm-hero-card { order: 2; }
  .pm-flow-steps { grid-template-columns: repeat(2, 1fr); }
  .pm-timeline { grid-template-columns: 1fr 1fr; }
  .pm-honest-grid { grid-template-columns: 1fr; gap: 36px; }
  .pm-problem-grid { grid-template-columns: 1fr; }
  .pm-sectors { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .pm-wrap { padding: 0 20px; }
  .pm-section { padding: 64px 0; }
  .pm-flow-steps { grid-template-columns: 1fr; }
}
`
