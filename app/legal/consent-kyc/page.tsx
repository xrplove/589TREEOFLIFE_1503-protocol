import Link from 'next/link'
import type { Metadata } from 'next'

// Hard "noindex" while the document is in BORRADOR. Search engines must not
// index legal text that has not been validated by counsel.
export const metadata: Metadata = {
  title: 'Consentimiento KYC (BORRADOR) · 1503',
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

const requiredTagStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.65rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#FF6B6B',
  border: '1px solid rgba(255,107,107,0.55)',
  background: 'rgba(255,107,107,0.08)',
  padding: '1px 6px',
  borderRadius: 2,
  fontFamily: 'var(--font-dm-mono), monospace',
  marginRight: '0.5rem',
  verticalAlign: 'middle',
}

const optionalTagStyle: React.CSSProperties = {
  ...requiredTagStyle,
  color: '#7BC97B',
  border: '1px solid rgba(123,201,123,0.55)',
  background: 'rgba(123,201,123,0.08)',
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

function ConsentRow({
  required,
  label,
  description,
}: {
  required: boolean
  label: string
  description: React.ReactNode
}) {
  return (
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
          <span style={required ? requiredTagStyle : optionalTagStyle}>
            {required ? 'OBLIGATORIO' : 'OPCIONAL'}
          </span>
          <strong style={{ color: '#E8EDF5', fontSize: '0.95rem' }}>{label}</strong>
        </div>
        <div style={{ color: '#9FB6CC', fontSize: '0.88rem', lineHeight: 1.6 }}>{description}</div>
      </div>
    </div>
  )
}

export default function ConsentKycPage() {
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
            LEGAL · CONSENTIMIENTO KYC
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
            que el Usuario debe leer y aceptar durante el alta para autorizar el tratamiento
            de su documentación KYC y AML conforme a la Ley 10/2010, al artículo 6.1.c y, en
            su caso, al artículo 9.2.a del RGPD.{' '}
            <strong>No tiene validez legal hasta que un asesor jurídico colegiado lo valide
            y se publique una versión final.</strong>
          </p>
        </div>

        {/* Title */}
        <header style={{ marginBottom: '2.5rem' }}>
          <span style={eyebrowStyle}>DOCUMENTO 3 DE 4 · CONSENT KYC</span>
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
            Consentimiento informado de verificación KYC
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
          Antes de marcar las casillas de la sección 11 de este documento, lee atentamente la
          siguiente información. Tu decisión informada es lo que permite a 1503
          incorporarte como Actor verificado, cumplir con sus obligaciones legales en materia
          de prevención del blanqueo de capitales y darte una identidad reconocible al resto
          de profesionales de la red.
        </p>
        <p style={paragraphStyle}>
          Este consentimiento es complementario a los{' '}
          <Link href="/legal/terms" style={{ color: '#00A3FF' }}>Términos de Servicio</Link>{' '}
          y a la{' '}
          <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>{' '}
          y debe interpretarse junto con ellos.
        </p>

        {/* ────────── 1. Por qué te pedimos KYC ────────── */}
        <H id="s1" n="01">Por qué te pedimos verificarte</H>
        <p style={paragraphStyle}>
          1503 conecta profesionales de cualquier sector y país. Para que esa
          interconexión sea fiable y segura, todo Actor pasa un proceso de verificación
          previo a la alta. La verificación cumple tres finalidades distintas pero
          complementarias:
        </p>
        <ul style={listStyle}>
          <li><strong>Obligación legal del Operador</strong> en materia de prevención del blanqueo de capitales y de la financiación del terrorismo: Ley 10/2010 de 28 de abril, Reglamento (UE) 2024/1624 cuando entre en vigor, normas equivalentes en otras jurisdicciones.</li>
          <li><strong>Confianza entre Actores</strong>: cada Actor sabe que cualquier contraparte de la red ha sido verificada con el mismo estándar.</li>
          <li><strong>Cumplimiento sectorial</strong>: en sectores regulados (legal, salud, arquitectura, ingeniería, auditoría) se verifica adicionalmente la titulación y colegiación contra el registro público oficial del país de ejercicio.</li>
        </ul>

        {/* ────────── 2. Datos que tratamos en KYC ────────── */}
        <H id="s2" n="02">Qué datos tratamos en este proceso</H>
        <ul style={listStyle}>
          <li><strong>Datos identificativos del Actor</strong>: nombre, apellidos, fecha de nacimiento, nacionalidad, documento de identidad (DNI, NIE, pasaporte u homólogo).</li>
          <li><strong>Datos societarios</strong> (cuando el Actor es persona jurídica): razón social, forma jurídica, identificación fiscal, escritura de constitución, certificado de titularidad real, poderes del representante.</li>
          <li><strong>Datos profesionales</strong> (sectores regulados): título universitario, certificado de colegiación, número de colegiado, especialidad.</li>
          <li><strong>Imagen del documento de identidad</strong> en alta resolución, anverso y reverso.</li>
          <li><strong>Selfie con prueba de vida</strong> (<em>liveness check</em>) para confirmar que la persona detrás de la pantalla es la titular del documento. Genera una <strong>plantilla biométrica facial</strong> de uso único.</li>
        </ul>
        <p style={paragraphStyle}>
          La plantilla biométrica se utiliza exclusivamente para comparar la cara con el
          documento de identidad y se elimina al finalizar el proceso. <strong>No se construye
          una base de datos biométrica de usuarios</strong>: solo se conserva la prueba de
          que la verificación se realizó correctamente, no la plantilla en sí.
        </p>

        {/* ────────── 3. Verificación cruzada con registros oficiales ────────── */}
        <H id="s3" n="03">Verificación cruzada con registros oficiales</H>
        <p style={paragraphStyle}>
          Para los <strong>Actores societarios</strong>, 1503 coteja la información
          declarada con registros mercantiles públicos (BORME en España y equivalentes
          extranjeros).
        </p>
        <p style={paragraphStyle}>
          Para los <strong>Actores con rol profesional en sector regulado</strong>,
          1503 consulta el registro público oficial de la profesión en el país de
          ejercicio (entre otros: Consejo General de la Abogacía, Consejo General del
          Notariado, Organización Médica Colegial y Consejo Superior de los Colegios de
          Arquitectos en España; Solicitors Regulation Authority y Bar Standards Board en
          Reino Unido; <em>state bars</em> en Estados Unidos). El cotejo deja constancia de
          la fuente consultada, la fecha y un hash de la respuesta del registro.
        </p>
        <p style={paragraphStyle}>
          La inteligencia artificial puede asistir el proceso (preparar la consulta, parsear
          la respuesta, comparar con el documento subido), pero <strong>la fe del dato la
          otorga el registro oficial, no el modelo</strong>. Cualquier caso no concluyente
          se eleva a revisión humana del Operador antes de marcar al Actor como verificado.
        </p>

        {/* ────────── 4. Destinatarios ────────── */}
        <H id="s4" n="04">A quién se ceden tus datos KYC</H>
        <ul style={listStyle}>
          <li><strong>Sub-encargados del Operador</strong> con contrato de encargo conforme al art. 28 RGPD: hosting (Vercel), base de datos (Supabase) y, cuando se contrate, proveedor especializado de verificación de identidad. La lista actualizada está en la sección 8 de la <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>.</li>
          <li><strong>Autoridades públicas competentes</strong> cuando exista obligación legal o requerimiento (SEPBLAC, AEAT, autoridad judicial, supervisor financiero).</li>
          <li><strong>Otros Actores de la Plataforma</strong>: solo los datos públicos de tu ficha (razón social, sector, rol, país, KYC verificado). <strong>Nunca</strong> tu documento de identidad ni tu plantilla biométrica.</li>
        </ul>

        {/* ────────── 5. Plazos ────────── */}
        <H id="s5" n="05">Cuánto tiempo se conservan</H>
        <ul style={listStyle}>
          <li><strong>Documentación KYC y AML</strong>: 10 años desde el cese de la relación, conforme al art. 25 de la Ley 10/2010.</li>
          <li><strong>Plantilla biométrica del <em>liveness check</em></strong>: eliminada al finalizar la verificación. Solo se conserva el resultado (verificado / no verificado / fecha).</li>
          <li><strong>Resultado del cotejo con registro oficial</strong>: durante toda la vida útil de la cuenta + 10 años, como prueba de la diligencia AML.</li>
          <li><strong>Datos de la cuenta del Usuario</strong>: conforme a la sección 10 de la <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>.</li>
        </ul>

        {/* ────────── 6. Bases jurídicas ────────── */}
        <H id="s6" n="06">Bases jurídicas del tratamiento</H>
        <ul style={listStyle}>
          <li><strong>Obligación legal</strong> (art. 6.1.c RGPD; Ley 10/2010): identificación general del Actor y conservación AML.</li>
          <li><strong>Ejecución del contrato</strong> (art. 6.1.b RGPD): alta del Actor en la Plataforma y prestación del Servicio.</li>
          <li><strong>Consentimiento explícito</strong> (art. 9.2.a RGPD): tratamiento biométrico (<em>liveness check</em>).</li>
          <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): cotejo cruzado con registros oficiales para la integridad de la red profesional.</li>
        </ul>

        {/* ────────── 7. Tus derechos ────────── */}
        <H id="s7" n="07">Tus derechos</H>
        <p style={paragraphStyle}>
          Tienes los derechos detallados en la sección 11 de la{' '}
          <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>:
          acceso, rectificación, supresión, oposición, limitación, portabilidad, retirada del
          consentimiento, no ser objeto de decisiones automatizadas con efectos jurídicos y
          reclamación ante la autoridad de control de tu jurisdicción.
        </p>
        <p style={paragraphStyle}>
          La <strong>retirada del consentimiento biométrico</strong> es siempre posible y no
          afecta a la licitud del tratamiento previo. Una vez retirado, no podrá completarse
          una verificación que requiera <em>liveness check</em>; en ese caso, podrá
          ofrecerse una vía alternativa con verificación humana asistida (puede implicar
          tiempos de respuesta mayores). <Todo>vía alternativa — diseñar flujo</Todo>
        </p>
        <p style={paragraphStyle}>
          La <strong>retirada del consentimiento sobre datos KYC y AML obligatorios por ley
          no es posible sin causar la baja de la cuenta</strong>, ya que el Operador no puede
          mantenerte como Actor sin cumplir su obligación legal. En ese supuesto se procederá
          a la baja respetando el plazo de conservación AML.
        </p>

        {/* ────────── 8. Consecuencias de no consentir ────────── */}
        <H id="s8" n="08">Qué pasa si no consientes</H>
        <ul style={listStyle}>
          <li>Si <strong>no consientes el tratamiento de tu documento de identidad</strong>: no podemos darte de alta como Actor. La verificación KYC es condición legal del Servicio.</li>
          <li>Si <strong>no consientes el cotejo con registros oficiales</strong> (sectores regulados): podrás darte de alta como Actor general pero no acceder al rol profesional regulado.</li>
          <li>Si <strong>no consientes el tratamiento biométrico</strong>: podrás solicitar la verificación alternativa con revisión humana asistida, con los plazos y condiciones que se indiquen.</li>
        </ul>

        {/* ────────── 9. Acreditación y revocación ────────── */}
        <H id="s9" n="09">Cómo se acredita y cómo se revoca</H>
        <p style={paragraphStyle}>
          La aceptación se registra con marca temporal exacta, dirección IP, identificador
          de sesión y versión del documento aceptada. El registro queda almacenado como
          prueba del consentimiento informado conforme al art. 7.1 RGPD.
        </p>
        <p style={paragraphStyle}>
          La revocación de cualquier consentimiento opcional se realiza desde el panel del
          Usuario o escribiendo a <Todo>privacy@1503.global</Todo>. La Plataforma
          confirmará la revocación y dejará constancia con marca temporal.
        </p>

        {/* ────────── 10. Documentos relacionados ────────── */}
        <H id="s10" n="10">Documentos relacionados</H>
        <ul style={listStyle}>
          <li><Link href="/legal/terms" style={{ color: '#00A3FF' }}>Términos de Servicio</Link> — relación contractual entre Operador y Usuario.</li>
          <li><Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link> — tratamiento general de datos personales.</li>
          <li><Link href="/legal/consent-marketing" style={{ color: '#00A3FF' }}>Consentimiento de comunicaciones comerciales</Link> — opcional, completamente independiente.</li>
        </ul>

        {/* ────────── 11. Casillas de aceptación ────────── */}
        <H id="s11" n="11">Casillas de aceptación</H>
        <p style={paragraphStyle}>
          Las siguientes casillas se mostrarán en el formulario de alta. Las marcadas como
          <span style={requiredTagStyle}>OBLIGATORIO</span> deben aceptarse para completar
          el registro; las marcadas como <span style={optionalTagStyle}>OPCIONAL</span> se
          pueden aceptar o rechazar libremente sin que ello impida el alta general.
        </p>

        <ConsentRow
          required
          label="Identificación legal y AML"
          description={
            <>
              Acepto que 1503 trate mi documento de identidad y los datos asociados
              para cumplir con sus obligaciones legales bajo la Ley 10/2010 y normativa
              equivalente, incluyendo su conservación durante 10 años desde el cese de la
              relación.
            </>
          }
        />

        <ConsentRow
          required
          label="Datos societarios y profesionales"
          description={
            <>
              Acepto el cotejo de los datos societarios o profesionales aportados con
              registros mercantiles, registros profesionales y demás fuentes oficiales
              públicas correspondientes a mi país de ejercicio.
            </>
          }
        />

        <ConsentRow
          required={false}
          label="Verificación biométrica (liveness check)"
          description={
            <>
              Doy mi consentimiento explícito (art. 9.2.a RGPD) al tratamiento de datos
              biométricos faciales con el único fin de verificar mi identidad en el alta.
              La plantilla biométrica se elimina al finalizar el proceso. Si no acepto,
              puedo solicitar la vía de verificación humana asistida.
            </>
          }
        />

        <ConsentRow
          required
          label="Cesiones a autoridades por requerimiento legal"
          description={
            <>
              Acepto que 1503 pueda comunicar mis datos KYC a SEPBLAC, AEAT,
              autoridad judicial o supervisor financiero cuando exista requerimiento legal,
              sin necesidad de notificación previa al Usuario cuando la ley lo prohíba.
            </>
          }
        />

        <ConsentRow
          required
          label="Política de Privacidad y Términos"
          description={
            <>
              Declaro haber leído y aceptado los{' '}
              <Link href="/legal/terms" style={{ color: '#00A3FF' }}>Términos de Servicio</Link>{' '}
              y la{' '}
              <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>.
            </>
          }
        />

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
