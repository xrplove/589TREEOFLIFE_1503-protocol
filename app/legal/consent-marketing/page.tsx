import Link from 'next/link'
import type { Metadata } from 'next'

// Hard "noindex" while the document is in BORRADOR. Search engines must not
// index legal text that has not been validated by counsel.
export const metadata: Metadata = {
  title: 'Consentimiento de comunicaciones (BORRADOR) · 1503',
  robots: { index: false, follow: false },
}

const VERSION = 'v0.1-draft'
const UPDATED = '2026-05-10'

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#E8EDF5',
  marginTop: '2.5rem',
  marginBottom: '0.9rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  letterSpacing: '0.02em',
}

const paragraphStyle: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.75,
  marginBottom: '0.9rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
}

const listStyle: React.CSSProperties = {
  color: '#9FB6CC',
  fontSize: '0.95rem',
  lineHeight: 1.75,
  marginBottom: '0.9rem',
  paddingLeft: '1.4rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
}

const consentBoxStyle: React.CSSProperties = {
  border: '1px solid #2A3340',
  background: 'rgba(14,17,24,0.7)',
  borderRadius: 4,
  padding: '1rem 1.25rem',
  marginBottom: '0.85rem',
  display: 'flex',
  gap: '0.85rem',
  alignItems: 'flex-start',
}

const optionalTagStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.65rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#7BC97B',
  border: '1px solid rgba(123,201,123,0.55)',
  background: 'rgba(123,201,123,0.08)',
  padding: '1px 6px',
  borderRadius: 2,
  fontFamily: 'var(--font-dm-mono), monospace',
  marginRight: '0.5rem',
  verticalAlign: 'middle',
}

function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: 'rgba(240,180,41,0.12)',
        border: '1px dashed rgba(240,180,41,0.55)',
        borderRadius: 3,
        padding: '1px 7px',
        color: '#F0B429',
        fontFamily: 'var(--font-dm-mono), monospace',
        fontSize: '0.82em',
        letterSpacing: '0.02em',
      }}
    >
      [TODO: {children}]
    </span>
  )
}

function H({ id, n, children }: { id: string; n: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={sectionTitleStyle}>
      <span
        style={{
          color: '#4A5566',
          fontFamily: 'var(--font-dm-mono), monospace',
          fontSize: '0.85rem',
          marginRight: '0.6rem',
          letterSpacing: '0.08em',
        }}
      >
        {n}
      </span>
      {children}
    </h2>
  )
}

export default function ConsentMarketingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#E8EDF5',
        padding: '5vh 2rem 6rem',
        fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Top nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#7A8899',
              fontSize: '0.78rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
              textDecoration: 'none',
            }}
          >
            ← 1503
          </Link>
          <span style={{ ...eyebrowStyle, fontSize: '0.7rem' }}>
            LEGAL · CONSENTIMIENTO COMUNICACIONES
          </span>
          <span style={{ minWidth: 1 }} />
        </div>

        {/* DRAFT BANNER */}
        <div
          style={{
            border: '2px solid #F0B429',
            background: 'rgba(240,180,41,0.08)',
            borderRadius: 4,
            padding: '1.5rem 1.75rem',
            marginBottom: '3rem',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#F0B429',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontWeight: 700,
              marginBottom: '0.6rem',
            }}
          >
            ◆ BORRADOR · sin valor legal
          </div>
          <p style={{ color: '#E8EDF5', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
            Este documento es el <strong>texto informativo previo al consentimiento</strong>{' '}
            que el Usuario debe leer antes de aceptar recibir comunicaciones comerciales del
            Operador conforme al artículo 21 de la LSSI (Ley 34/2002), al artículo 6.1.a
            del RGPD y a las normas equivalentes en otras jurisdicciones (CAN-SPAM, CASL,
            ePrivacy, PDPA, LGPD).{' '}
            <strong>No tiene validez legal hasta que un asesor jurídico colegiado lo valide
            y se publique una versión final.</strong>
          </p>
        </div>

        {/* Title */}
        <header style={{ marginBottom: '2.5rem' }}>
          <span style={eyebrowStyle}>DOCUMENTO 4 DE 4 · CONSENT MARKETING</span>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.6rem)',
              fontWeight: 700,
              color: '#E8EDF5',
              marginTop: '0.6rem',
              marginBottom: '0.4rem',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              lineHeight: 1.2,
            }}
          >
            Consentimiento de comunicaciones comerciales
          </h1>
          <p
            style={{
              color: '#7A8899',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.06em',
            }}
          >
            Versión {VERSION} · Última actualización {UPDATED}
          </p>
        </header>

        {/* Intro */}
        <p style={paragraphStyle}>
          Este consentimiento es <strong>completamente opcional</strong>. Aceptarlo o
          rechazarlo no afecta a tu alta como Actor ni a ninguna de las funcionalidades
          contractuales de 1503. Puedes retirar el consentimiento en cualquier
          momento con un solo clic.
        </p>
        <p style={paragraphStyle}>
          Lee la información siguiente antes de marcar la casilla del final del documento.
        </p>

        {/* ────────── 1. Quién te enviará comunicaciones ────────── */}
        <H id="s1" n="01">Quién te enviará las comunicaciones</H>
        <p style={paragraphStyle}>
          El responsable de las comunicaciones comerciales es el Operador de 1503,{' '}
          <Todo>razón social</Todo>, con domicilio en <Todo>domicilio fiscal</Todo>. Las
          comunicaciones se envían en su nombre y nunca por cuenta de terceros.
        </p>

        {/* ────────── 2. Qué comunicaciones ────────── */}
        <H id="s2" n="02">Qué tipo de comunicaciones recibirás</H>
        <ul style={listStyle}>
          <li><strong>Novedades de la Plataforma</strong>: lanzamientos de nuevas funcionalidades, sectores, países, herramientas para Actores.</li>
          <li><strong>Recursos para profesionales</strong>: guías, casos de uso y artículos relacionados con tu sector y rol.</li>
          <li><strong>Anuncios institucionales</strong>: hitos del proyecto, rondas, alianzas relevantes para los Actores.</li>
          <li><strong>Encuestas y solicitudes de feedback</strong> sobre el producto, voluntarias y agregadas.</li>
        </ul>
        <p style={paragraphStyle}>
          <strong>Lo que NO recibirás bajo este consentimiento</strong>: comunicaciones
          transaccionales (notificaciones de Operaciones, mensajes recibidos, recordatorios
          de pago, alertas de seguridad), que se envían en cumplimiento del contrato y se
          rigen por la <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de
          Privacidad</Link>, no por este consentimiento. Tampoco recibirás publicidad de
          terceros.
        </p>

        {/* ────────── 3. Canales y frecuencia ────────── */}
        <H id="s3" n="03">Canales y frecuencia</H>
        <ul style={listStyle}>
          <li><strong>Correo electrónico</strong> (canal principal).</li>
          <li><strong>Notificaciones en la Plataforma</strong> (centro de avisos del Actor).</li>
          <li><strong>SMS o notificación push</strong>: solo si el Usuario las activa expresamente desde su panel. No están incluidas en este consentimiento por defecto.</li>
        </ul>
        <p style={paragraphStyle}>
          Frecuencia objetivo: <strong>máximo <Todo>frecuencia — sugerido 4 mensajes/mes</Todo></strong>,
          salvo eventos extraordinarios (cambios regulatorios, lanzamientos mayores) que se
          comunicarán siempre que sean de interés directo para los Actores.
        </p>

        {/* ────────── 4. Datos tratados ────────── */}
        <H id="s4" n="04">Qué datos tuyos tratamos</H>
        <ul style={listStyle}>
          <li>Tu correo electrónico.</li>
          <li>Tu nombre o razón social, sector y país (para personalizar el contenido).</li>
          <li>Métricas agregadas de apertura y clic, exclusivamente para medir la calidad de las comunicaciones y mejorar la cadencia. <Todo>verificar herramienta — sugerido proveedor con datos en UE y sin cookies de terceros</Todo></li>
        </ul>
        <p style={paragraphStyle}>
          No realizamos <strong>perfilado individual con efectos jurídicos</strong> a partir
          de tu comportamiento de apertura/clic.
        </p>

        {/* ────────── 5. No cesión a terceros ────────── */}
        <H id="s5" n="05">Compromiso de no cesión a terceros</H>
        <p style={paragraphStyle}>
          1503 <strong>no cede</strong> tus datos de contacto ni tu consentimiento de
          marketing a terceros con fines comerciales. La única comunicación a terceros se
          produce con el sub-encargado del envío de correo electrónico, que actúa por
          cuenta y bajo instrucciones del Operador conforme al art. 28 RGPD.
        </p>

        {/* ────────── 6. Bases jurídicas ────────── */}
        <H id="s6" n="06">Base jurídica</H>
        <ul style={listStyle}>
          <li><strong>Consentimiento</strong> (art. 6.1.a RGPD; art. 21 LSSI; ePrivacy).</li>
          <li>Si en el futuro existiera relación contractual previa con un mismo producto o servicio, el Operador podrá emplear el régimen del art. 21.2 LSSI (envío sobre productos similares con derecho de oposición), pero solo si te informamos previamente y te ofrecemos darte de baja en cada comunicación. <Todo>confirmar si se aplica este régimen — depende del modelo final</Todo></li>
        </ul>

        {/* ────────── 7. Plazo y revocación ────────── */}
        <H id="s7" n="07">Plazo y revocación</H>
        <p style={paragraphStyle}>
          El consentimiento se mantiene vigente mientras el Usuario no lo revoque o se dé
          de baja de la cuenta. Puedes revocarlo de cualquiera de las siguientes formas:
        </p>
        <ul style={listStyle}>
          <li>Pulsando el enlace <em>«Darme de baja»</em> presente al pie de cada correo.</li>
          <li>Desactivando la opción correspondiente en el panel del Usuario.</li>
          <li>Escribiendo a <Todo>privacy@1503.global</Todo>.</li>
        </ul>
        <p style={paragraphStyle}>
          La revocación es efectiva en un plazo máximo de <Todo>plazo — sugerido 72
          horas</Todo>, sin afectar a la licitud del tratamiento previo. La Plataforma
          conservará el registro de la revocación con marca temporal como prueba del
          cumplimiento.
        </p>

        {/* ────────── 8. Tus derechos ────────── */}
        <H id="s8" n="08">Tus derechos</H>
        <p style={paragraphStyle}>
          Además de retirar el consentimiento, tienes los derechos detallados en la
          sección 11 de la{' '}
          <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>:
          acceso, rectificación, supresión, oposición, limitación, portabilidad y reclamación
          ante la autoridad de control de tu jurisdicción.
        </p>

        {/* ────────── 9. Si no consientes ────────── */}
        <H id="s9" n="09">Qué pasa si no consientes</H>
        <p style={paragraphStyle}>
          <strong>Nada.</strong> Tu cuenta se da de alta con normalidad y todas las
          funcionalidades contractuales están disponibles. El Operador solo te enviará
          comunicaciones imprescindibles (transaccionales, legales o de seguridad) que no
          requieren consentimiento por estar amparadas en la ejecución del contrato o en
          obligaciones legales.
        </p>

        {/* ────────── 10. Casilla ────────── */}
        <H id="s10" n="10">Casilla de aceptación</H>
        <div style={consentBoxStyle}>
          <div
            style={{
              width: 18,
              height: 18,
              minWidth: 18,
              marginTop: '3px',
              border: '1.5px solid #4A5566',
              borderRadius: 3,
              background: 'transparent',
            }}
            aria-hidden
          />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '0.35rem' }}>
              <span style={optionalTagStyle}>OPCIONAL</span>
              <strong style={{ color: '#E8EDF5', fontSize: '0.95rem' }}>
                Comunicaciones comerciales del Operador
              </strong>
            </div>
            <div style={{ color: '#9FB6CC', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Acepto recibir comunicaciones comerciales del Operador conforme a las
              condiciones descritas en este documento. Sé que puedo retirar este
              consentimiento en cualquier momento con un solo clic, sin que ello afecte a mi
              alta como Actor ni a las funcionalidades contractuales de la Plataforma.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '4rem',
            paddingTop: '2rem',
            borderTop: '1px solid #1E2530',
            color: '#4A5566',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-dm-mono), monospace',
            letterSpacing: '0.06em',
          }}
        >
          <div style={{ marginBottom: '0.4rem' }}>
            VERSIÓN {VERSION} · ACTUALIZADO {UPDATED}
          </div>
          <div style={{ marginBottom: '0.4rem' }}>
            BORRADOR · pendiente revisión por asesor jurídico colegiado
          </div>
          <div>
            Documento disponible solo en español. Versión inglesa próximamente. Para otros
            idiomas escribe a <Todo>privacy@1503.global</Todo>.
          </div>
        </div>
      </div>
    </main>
  )
}
