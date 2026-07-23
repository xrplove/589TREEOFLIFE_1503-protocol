import Link from 'next/link'
import type { Metadata } from 'next'

// Hard "noindex" while the document is in BORRADOR. Search engines must not
// index legal text that has not been validated by counsel.
export const metadata: Metadata = {
  title: 'Política de Privacidad (BORRADOR) · 1503',
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

const subSectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#C7D4E4',
  marginTop: '1.6rem',
  marginBottom: '0.6rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: '1.2rem',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-chakra-petch), sans-serif',
  color: '#9FB6CC',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.8rem',
  borderBottom: '1px solid #2A3340',
  color: '#C7D4E4',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontSize: '0.78rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  borderBottom: '1px solid #1E2530',
  verticalAlign: 'top',
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

function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} style={subSectionTitleStyle}>
      {children}
    </h3>
  )
}

export default function PrivacyPage() {
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
            LEGAL · POLÍTICA DE PRIVACIDAD
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
            Este documento es un <strong>borrador estructural</strong> redactado para reflejar
            las secciones obligatorias bajo el Reglamento (UE) 2016/679 (RGPD), el UK GDPR, la
            ley federal suiza revLPD, la CCPA/CPRA de California, la PIPEDA canadiense, la LGPD
            brasileña, la APPI japonesa, la PIPL china y la DPDP 2023 india, además de la
            normativa española de prevención de blanqueo (Ley 10/2010) y de servicios de la
            sociedad de la información (Ley 34/2002, LSSI).{' '}
            <strong>No tiene validez legal hasta que un asesor jurídico colegiado lo valide y
            se publique una versión final.</strong>{' '}
            Los campos marcados como{' '}
            <span style={{ color: '#F0B429', fontFamily: 'var(--font-dm-mono), monospace' }}>
              [TODO: …]
            </span>{' '}
            requieren decisión del Operador o validación profesional antes de la publicación.
          </p>
        </div>

        {/* Title */}
        <header style={{ marginBottom: '2.5rem' }}>
          <span style={eyebrowStyle}>DOCUMENTO 2 DE 4 · PRIVACY</span>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
              fontWeight: 700,
              color: '#E8EDF5',
              marginTop: '0.6rem',
              marginBottom: '0.4rem',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            Política de Privacidad
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

        {/* TOC */}
        <nav
          style={{
            border: '1px solid #1E2530',
            background: 'rgba(14,17,24,0.7)',
            borderRadius: 4,
            padding: '1.25rem 1.5rem',
            marginBottom: '3rem',
          }}
        >
          <div style={{ ...eyebrowStyle, fontSize: '0.66rem', marginBottom: '0.85rem' }}>
            ÍNDICE
          </div>
          <ol
            style={{
              ...listStyle,
              listStyle: 'decimal',
              paddingLeft: '1.5rem',
              fontSize: '0.9rem',
              marginBottom: 0,
              columnCount: 2,
              columnGap: '2rem',
            }}
          >
            <li><a href="#s1" style={{ color: '#9FB6CC' }}>Responsable del tratamiento</a></li>
            <li><a href="#s2" style={{ color: '#9FB6CC' }}>Definiciones</a></li>
            <li><a href="#s3" style={{ color: '#9FB6CC' }}>Principios del tratamiento</a></li>
            <li><a href="#s4" style={{ color: '#9FB6CC' }}>Categorías de datos tratados</a></li>
            <li><a href="#s5" style={{ color: '#9FB6CC' }}>Finalidades y bases jurídicas</a></li>
            <li><a href="#s6" style={{ color: '#9FB6CC' }}>Categorías especiales</a></li>
            <li><a href="#s7" style={{ color: '#9FB6CC' }}>Origen de los datos</a></li>
            <li><a href="#s8" style={{ color: '#9FB6CC' }}>Destinatarios y sub-encargados</a></li>
            <li><a href="#s9" style={{ color: '#9FB6CC' }}>Transferencias internacionales</a></li>
            <li><a href="#s10" style={{ color: '#9FB6CC' }}>Plazos de conservación</a></li>
            <li><a href="#s11" style={{ color: '#9FB6CC' }}>Tus derechos por jurisdicción</a></li>
            <li><a href="#s12" style={{ color: '#9FB6CC' }}>Decisiones automatizadas</a></li>
            <li><a href="#s13" style={{ color: '#9FB6CC' }}>Cookies y tecnologías similares</a></li>
            <li><a href="#s14" style={{ color: '#9FB6CC' }}>Seguridad de los datos</a></li>
            <li><a href="#s15" style={{ color: '#9FB6CC' }}>Notificación de violaciones</a></li>
            <li><a href="#s16" style={{ color: '#9FB6CC' }}>Menores de edad</a></li>
            <li><a href="#s17" style={{ color: '#9FB6CC' }}>Datos KYC y obligaciones AML</a></li>
            <li><a href="#s18" style={{ color: '#9FB6CC' }}>Trazabilidad on-ledger (XRPL)</a></li>
            <li><a href="#s19" style={{ color: '#9FB6CC' }}>Asistente con IA (cuando se active)</a></li>
            <li><a href="#s20" style={{ color: '#9FB6CC' }}>Modificaciones de esta política</a></li>
            <li><a href="#s21" style={{ color: '#9FB6CC' }}>Reclamaciones</a></li>
            <li><a href="#s22" style={{ color: '#9FB6CC' }}>Contacto del Responsable y DPO</a></li>
            <li><a href="#s23" style={{ color: '#9FB6CC' }}>Aceptación</a></li>
          </ol>
        </nav>

        {/* ────────── 1. Responsable del tratamiento ────────── */}
        <H id="s1" n="01">Responsable del tratamiento</H>
        <p style={paragraphStyle}>
          El responsable del tratamiento de los datos personales recogidos a través de la
          plataforma 1503 (en adelante, la <strong>«Plataforma»</strong>) es:
        </p>
        <ul style={listStyle}>
          <li><strong>Razón social:</strong> <Todo>razón social</Todo></li>
          <li><strong>Domicilio social:</strong> <Todo>domicilio fiscal completo</Todo></li>
          <li><strong>Identificación fiscal:</strong> <Todo>CIF/NIF</Todo></li>
          <li><strong>Inscripción registral:</strong> <Todo>registro mercantil y datos registrales</Todo></li>
          <li><strong>Correo de contacto general:</strong> <Todo>contacto@1503.global</Todo></li>
          <li><strong>Correo del Delegado de Protección de Datos (DPO):</strong> <Todo>privacy@1503.global</Todo></li>
        </ul>
        <p style={paragraphStyle}>
          Esta política se aplica a todos los datos personales tratados por el Operador en su
          condición de <strong>Responsable</strong> según el RGPD y figuras equivalentes en
          otras jurisdicciones (<em>controller</em> bajo UK GDPR, <em>business</em> bajo
          CCPA/CPRA, <em>controlador</em> bajo LGPD, <em>personal information handler</em> bajo
          PIPL, <em>Data Fiduciary</em> bajo DPDP 2023, etc.).
        </p>
        <p style={paragraphStyle}>
          La designación formal de un Delegado de Protección de Datos (DPO) será obligatoria si
          se cumplen los supuestos del artículo 37 RGPD (tratamiento a gran escala de datos
          sensibles o monitorización sistemática). El Operador evaluará periódicamente esta
          obligación. <Todo>confirmar designación o exención</Todo>
        </p>

        {/* ────────── 2. Definiciones ────────── */}
        <H id="s2" n="02">Definiciones</H>
        <p style={paragraphStyle}>
          A efectos de esta política, los términos en mayúscula tienen el significado descrito
          en los <Link href="/legal/terms" style={{ color: '#00A3FF' }}>Términos de Servicio</Link>{' '}
          (sección 2). Adicionalmente:
        </p>
        <ul style={listStyle}>
          <li>
            <strong>Datos personales</strong>: toda información sobre una persona física
            identificada o identificable, conforme al art. 4.1 RGPD y figuras equivalentes en
            otras jurisdicciones.
          </li>
          <li>
            <strong>Tratamiento</strong>: cualquier operación realizada sobre datos personales,
            automatizada o no, conforme al art. 4.2 RGPD.
          </li>
          <li>
            <strong>Encargado del tratamiento</strong>: tercero que trata datos personales por
            cuenta del Operador (p. ej. Vercel, Supabase). Equivale a <em>processor</em>,
            <em> service provider</em> (CCPA/CPRA), <em>operador</em> (LGPD), <em>entrusted
            party</em> (PIPL), <em>Data Processor</em> (DPDP).
          </li>
          <li>
            <strong>Categorías especiales</strong>: datos del art. 9 RGPD (origen racial,
            opiniones políticas, convicciones, salud, biometría única, etc.) y figuras
            análogas (<em>sensitive PI</em> CCPA, <em>dados sensíveis</em> LGPD,{' '}
            <em>sensitive personal information</em> PIPL).
          </li>
          <li>
            <strong>Transferencia internacional</strong>: traslado de datos personales fuera
            del Espacio Económico Europeo, del Reino Unido o de la jurisdicción nacional del
            interesado, a un país u organización internacional sujeta a otra normativa.
          </li>
        </ul>

        {/* ────────── 3. Principios del tratamiento ────────── */}
        <H id="s3" n="03">Principios del tratamiento</H>
        <p style={paragraphStyle}>
          El Operador trata los datos personales de los Usuarios conforme a los principios
          establecidos en el artículo 5 RGPD, y aplica los mismos estándares con independencia
          de la jurisdicción del Usuario:
        </p>
        <ul style={listStyle}>
          <li><strong>Licitud, lealtad y transparencia</strong>: solo tratamos lo necesario, con base jurídica clara y de forma comprensible para el Usuario.</li>
          <li><strong>Limitación de finalidad</strong>: los datos recogidos para una finalidad no se reutilizan para fines incompatibles sin nueva base jurídica.</li>
          <li><strong>Minimización</strong>: solo se piden los datos necesarios para la finalidad concreta.</li>
          <li><strong>Exactitud</strong>: el Operador adopta medidas razonables para mantener los datos exactos y actualizados.</li>
          <li><strong>Limitación del plazo de conservación</strong>: los datos se conservan únicamente durante el tiempo necesario y conforme a la sección 10 de esta política.</li>
          <li><strong>Integridad y confidencialidad</strong>: medidas técnicas y organizativas razonables para proteger los datos frente a accesos no autorizados, pérdida o alteración.</li>
          <li><strong>Responsabilidad proactiva (accountability)</strong>: el Operador documenta sus tratamientos y puede demostrar su cumplimiento.</li>
        </ul>

        {/* ────────── 4. Categorías de datos tratados ────────── */}
        <H id="s4" n="04">Categorías de datos tratados</H>
        <p style={paragraphStyle}>
          En función de la fase de relación con la Plataforma, el Operador trata las siguientes
          categorías de datos personales:
        </p>
        <ul style={listStyle}>
          <li>
            <strong>Datos identificativos</strong>: nombre, apellidos, fecha de nacimiento,
            documento de identidad (DNI, NIE, pasaporte u homólogo), nacionalidad, país de
            residencia, firma manuscrita o electrónica.
          </li>
          <li>
            <strong>Datos de contacto</strong>: dirección de correo electrónico, número de
            teléfono, dirección postal.
          </li>
          <li>
            <strong>Datos profesionales y societarios</strong> (cuando aplica): razón social,
            forma jurídica, identificación fiscal, escrituras, certificados de titularidad
            real, poderes de representación, sector y rol declarados, certificaciones,
            titulaciones y números de colegiado.
          </li>
          <li>
            <strong>Datos de cuenta y credenciales</strong>: nombre de usuario, contraseña
            cifrada, factor adicional de autenticación cuando se habilite, registro de inicios
            de sesión.
          </li>
          <li>
            <strong>Datos KYC y AML</strong>: documentación e información requerida por la Ley
            10/2010 y normativa equivalente, incluida la verificación cruzada contra registros
            públicos oficiales para sectores regulados.
          </li>
          <li>
            <strong>Datos biométricos</strong> (solo si se activa <em>liveness check</em> en el
            KYC): plantilla facial generada exclusivamente para la verificación de identidad,
            con consentimiento explícito y conservación mínima.
          </li>
          <li>
            <strong>Datos financieros</strong>: cuenta bancaria para liquidación fiat,
            historial de Operaciones, importes y comisiones.
          </li>
          <li>
            <strong>Contenido generado por el Usuario</strong>: fichas de producto, servicio o
            inmueble; mensajes intercambiados con otros Actores; archivos subidos a la carpeta
            digital cifrada de cada Operación; logos y fotografías.
          </li>
          <li>
            <strong>Datos técnicos y de uso</strong>: dirección IP, identificadores de
            dispositivo, navegador, sistema operativo, registros de acceso, fecha y hora de
            cada acción relevante en la Plataforma.
          </li>
          <li>
            <strong>Datos de comunicaciones</strong>: contenido y metadatos de las llamadas de
            voz/video Jitsi cuando las partes consientan grabación o transcripción; en los
            demás casos, solo metadatos mínimos.
          </li>
          <li>
            <strong>Datos derivados de blockchain</strong>: hashes de Operaciones, direcciones
            públicas de wallets y transacciones registradas en XRP Ledger. Estos datos son
            <strong> inmutables y públicos por diseño</strong> (véase sección 18).
          </li>
        </ul>

        {/* ────────── 5. Finalidades y bases jurídicas ────────── */}
        <H id="s5" n="05">Finalidades y bases jurídicas</H>
        <p style={paragraphStyle}>
          Cada finalidad de tratamiento se ampara en una base jurídica del artículo 6 RGPD (y
          art. 9 cuando se trate de categorías especiales). Las bases equivalentes en otras
          jurisdicciones aplican analógicamente.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Finalidad</th>
              <th style={thStyle}>Base jurídica RGPD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Registro y gestión de la cuenta del Actor</td>
              <td style={tdStyle}>Art. 6.1.b — ejecución del contrato (los Términos de Servicio)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Verificación de identidad (KYC societario y profesional)</td>
              <td style={tdStyle}>Art. 6.1.c — obligación legal (Ley 10/2010, Reglamento (UE) 2024/1624 cuando aplique)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Prestación del Servicio (catálogo, mensajería, escrow, llamadas, carpeta digital)</td>
              <td style={tdStyle}>Art. 6.1.b — ejecución del contrato</td>
            </tr>
            <tr>
              <td style={tdStyle}>Liquidación de pagos y facturación</td>
              <td style={tdStyle}>Art. 6.1.b y 6.1.c — contrato y obligaciones contables/fiscales</td>
            </tr>
            <tr>
              <td style={tdStyle}>Prevención del fraude y seguridad de la Plataforma</td>
              <td style={tdStyle}>Art. 6.1.f — interés legítimo del Operador y de los Actores</td>
            </tr>
            <tr>
              <td style={tdStyle}>Atención de derechos de los interesados y comunicaciones legales</td>
              <td style={tdStyle}>Art. 6.1.c — obligación legal</td>
            </tr>
            <tr>
              <td style={tdStyle}>Comunicaciones comerciales sobre nuevos servicios del Operador</td>
              <td style={tdStyle}>Art. 6.1.a — consentimiento (revocable en cualquier momento)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Verificación biométrica (liveness check) en el KYC</td>
              <td style={tdStyle}>Art. 9.2.a — consentimiento explícito (categoría especial)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Grabación o transcripción de llamadas de voz/video</td>
              <td style={tdStyle}>Art. 6.1.a — consentimiento explícito de todas las partes</td>
            </tr>
            <tr>
              <td style={tdStyle}>Asistente conversacional con IA (cuando se active)</td>
              <td style={tdStyle}>Art. 6.1.a — consentimiento (uso opcional y desactivable)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Mejora del producto y analítica agregada</td>
              <td style={tdStyle}>Art. 6.1.f — interés legítimo, sobre datos seudonimizados o agregados</td>
            </tr>
          </tbody>
        </table>
        <p style={paragraphStyle}>
          Cuando la base jurídica sea el consentimiento, el Usuario puede retirarlo en cualquier
          momento sin que ello afecte a la licitud del tratamiento previo. Cuando sea el
          interés legítimo, el Usuario puede oponerse al tratamiento conforme a la sección 11.
        </p>

        {/* ────────── 6. Categorías especiales ────────── */}
        <H id="s6" n="06">Categorías especiales y datos sensibles</H>
        <p style={paragraphStyle}>
          Por defecto, la Plataforma <strong>no trata categorías especiales de datos</strong>{' '}
          (origen racial o étnico, opiniones políticas, convicciones religiosas o filosóficas,
          afiliación sindical, datos genéticos, biométricos identificativos, salud, vida o
          orientación sexual).
        </p>
        <p style={paragraphStyle}>
          De forma excepcional, podrán tratarse las siguientes categorías:
        </p>
        <ul style={listStyle}>
          <li>
            <strong>Datos biométricos</strong> generados por <em>liveness check</em> facial
            durante el KYC, únicamente si el Usuario otorga consentimiento explícito (art.
            9.2.a RGPD). La plantilla biométrica se conserva el tiempo estrictamente necesario
            para la verificación y se elimina o anonimiza al finalizar el proceso, sin perjuicio
            de la conservación del registro de verificación (no la plantilla).
          </li>
          <li>
            <strong>Datos de salud, sectoriales</strong>, en los Actores cuyo sector implique
            tratamiento de pacientes o clientes con datos sensibles (sector salud). En tales
            casos, los datos del paciente final son tratados por el Actor en su condición de
            Responsable; el Operador es Encargado y firma el correspondiente contrato de
            encargo conforme al art. 28 RGPD.
          </li>
        </ul>
        <p style={paragraphStyle}>
          La sensitive personal information bajo CPRA (estado de California), los <em>dados
          sensíveis</em> de la LGPD y la <em>sensitive personal information</em> de la PIPL
          tienen tratamiento equivalente y derechos reforzados (sección 11).
        </p>

        {/* ────────── 7. Origen de los datos ────────── */}
        <H id="s7" n="07">Origen de los datos</H>
        <p style={paragraphStyle}>
          La mayoría de los datos personales proceden directamente del Usuario en el momento
          del registro o durante el uso de la Plataforma. Adicionalmente, el Operador puede
          obtener datos de las siguientes fuentes:
        </p>
        <ul style={listStyle}>
          <li><strong>Registros públicos oficiales</strong> consultados durante la verificación KYC societaria (registros mercantiles, BORME) y profesional (CGAE, notariado, OMC, CSCAE en España; SRA, Bar en UK; state bars en EE.UU.; etc.).</li>
          <li><strong>Proveedores de verificación de identidad</strong> contratados por el Operador como Encargados, cuando se externalice parcialmente el KYC. <Todo>indicar proveedor concreto cuando se contrate</Todo></li>
          <li><strong>Otros Actores de la Plataforma</strong> en el marco de Operaciones en las que el Usuario participe (mensajes, valoraciones, reclamaciones).</li>
          <li><strong>XRP Ledger</strong>, infraestructura pública y descentralizada cuya información es accesible a cualquier observador.</li>
        </ul>

        {/* ────────── 8. Destinatarios y sub-encargados ────────── */}
        <H id="s8" n="08">Destinatarios y sub-encargados</H>
        <p style={paragraphStyle}>
          El Operador no vende datos personales. Los datos se comparten con los siguientes
          tipos de destinatarios y únicamente en la medida necesaria:
        </p>
        <ul style={listStyle}>
          <li><strong>Otros Actores de la Plataforma</strong>, dentro de las Operaciones que el Usuario decide entablar. En estos intercambios, el otro Actor pasa a ser Responsable de los datos que reciba.</li>
          <li><strong>Encargados del tratamiento</strong> (<em>processors</em>), descritos en la tabla siguiente, vinculados por contrato conforme al art. 28 RGPD.</li>
          <li><strong>Autoridades públicas</strong> cuando exista requerimiento judicial, administrativo o supervisor competente, o por imperativo legal (AML, fiscal, judicial).</li>
          <li><strong>Asesores profesionales del Operador</strong> (legales, fiscales, auditores) bajo deber de confidencialidad.</li>
        </ul>
        <p style={paragraphStyle}>
          Los <strong>sub-encargados</strong> activos a la fecha de este documento son los
          siguientes:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Encargado</th>
              <th style={thStyle}>Servicio prestado</th>
              <th style={thStyle}>Localización principal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Vercel Inc.</td>
              <td style={tdStyle}>Hosting, despliegue y red de distribución de la aplicación web</td>
              <td style={tdStyle}>EE.UU. con regiones globales (Frankfurt cuando aplica)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Supabase Inc.</td>
              <td style={tdStyle}>Base de datos PostgreSQL, autenticación y almacenamiento de archivos</td>
              <td style={tdStyle}>Configurable; el Operador selecciona región Unión Europea (Frankfurt)</td>
            </tr>
          </tbody>
        </table>
        <p style={paragraphStyle}>
          A medida que se activen las Fases 4 (mensajería self-hosted), 5 (llamadas
          self-hosted), 5.5 (asistente IA) y 9 (tokenización SPV), se incorporarán nuevos
          sub-encargados que serán anunciados en esta política con antelación razonable:
        </p>
        <ul style={listStyle}>
          <li><Todo>Hetzner u OVH — VPS para chat self-hosted (Fase 4) y Jitsi (Fase 5), región UE</Todo></li>
          <li><Todo>Anthropic PBC — proveedor del modelo de lenguaje del asistente IA (Fase 5.5+); evaluar Anthropic en UE / Bedrock UE para reducir transferencia internacional</Todo></li>
          <li><Todo>Proveedor de verificación KYC con liveness — pendiente selección</Todo></li>
          <li><Todo>Proveedor de pasarela fiat ↔ XRPL para liquidación (Fase 7)</Todo></li>
        </ul>
        <p style={paragraphStyle}>
          La lista completa y actualizada de sub-encargados estará disponible en el panel del
          Usuario y se notificarán los cambios sustanciales con antelación razonable, dando
          oportunidad al Usuario de oponerse según lo previsto en el contrato.
        </p>

        {/* ────────── 9. Transferencias internacionales ────────── */}
        <H id="s9" n="09">Transferencias internacionales</H>
        <p style={paragraphStyle}>
          Algunas operaciones de tratamiento implican transferir datos personales fuera del
          Espacio Económico Europeo, del Reino Unido o de la jurisdicción de residencia del
          Usuario. El Operador adopta las garantías adecuadas previstas en cada normativa:
        </p>
        <ul style={listStyle}>
          <li>
            <strong>Hacia EE.UU.</strong> (p. ej. Vercel sede principal): mediante adhesión
            del proveedor al <strong>EU-US Data Privacy Framework</strong> (DPF) cuando esté
            certificado, o mediante <strong>cláusulas contractuales tipo</strong> aprobadas
            por la Comisión Europea (Decisión 2021/914) y, en su caso, medidas suplementarias
            de cifrado y minimización conforme a la sentencia <em>Schrems II</em>.
          </li>
          <li>
            <strong>Desde Reino Unido</strong>: <em>UK International Data Transfer
            Agreement</em> (IDTA) o cláusulas tipo de la UE con el <em>UK Addendum</em>.
          </li>
          <li>
            <strong>Desde Suiza</strong>: cláusulas contractuales tipo aprobadas por el FDPIC
            o decisión de adecuación del país receptor.
          </li>
          <li>
            <strong>Desde Brasil</strong>: cláusulas contractuales tipo aprobadas por la ANPD,
            decisión de adecuación o consentimiento específico del titular conforme a la LGPD.
          </li>
          <li>
            <strong>Desde China</strong> (PIPL art. 38-39): si en el futuro se trataran datos
            de residentes en China, se aplicará certificación, cláusulas tipo de la CAC o
            evaluación de seguridad obligatoria; transferencia precedida de consentimiento
            separado.
          </li>
          <li>
            <strong>Desde Japón</strong>: notificación al titular y, cuando proceda, al PPC,
            con identificación del país de destino y de las medidas equivalentes.
          </li>
          <li>
            <strong>Desde India</strong> (DPDP 2023): el Gobierno de la India puede restringir
            transferencias a determinados países; el Operador respetará la lista negativa que
            se publique cuando entre en vigor el reglamento de desarrollo.
          </li>
        </ul>
        <p style={paragraphStyle}>
          El Usuario puede solicitar copia de las garantías aplicables a una transferencia
          concreta escribiendo a <Todo>privacy@1503.global</Todo>. El Operador responderá
          identificando el sub-encargado, el país de destino y el instrumento jurídico
          aplicado.
        </p>

        {/* ────────── 10. Plazos de conservación ────────── */}
        <H id="s10" n="10">Plazos de conservación</H>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Plazo</th>
              <th style={thStyle}>Fundamento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Datos contables y fiscales</td>
              <td style={tdStyle}>6 años desde el cierre del ejercicio</td>
              <td style={tdStyle}>Art. 30 Código de Comercio; art. 66 LGT</td>
            </tr>
            <tr>
              <td style={tdStyle}>Datos KYC y AML</td>
              <td style={tdStyle}>10 años desde el cese de la relación</td>
              <td style={tdStyle}>Art. 25 Ley 10/2010</td>
            </tr>
            <tr>
              <td style={tdStyle}>Registros de aceptación de Términos y consentimientos</td>
              <td style={tdStyle}>Mientras dure la cuenta + <Todo>plazo — sugerido 5 años</Todo></td>
              <td style={tdStyle}>Acreditación del consentimiento (art. 7 RGPD)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Datos de cuenta y credenciales</td>
              <td style={tdStyle}>Mientras dure la cuenta; supresión a los <Todo>plazo — sugerido 30 días</Todo> tras la baja</td>
              <td style={tdStyle}>Ejecución del contrato</td>
            </tr>
            <tr>
              <td style={tdStyle}>Mensajes y archivos en carpeta digital de Operaciones cerradas</td>
              <td style={tdStyle}>Hasta el cierre + <Todo>plazo — sugerido 1 año</Todo>; después archivado cifrado por <Todo>plazo — sugerido 5 años</Todo></td>
              <td style={tdStyle}>Resolución de eventuales reclamaciones civiles</td>
            </tr>
            <tr>
              <td style={tdStyle}>Datos biométricos del KYC (liveness)</td>
              <td style={tdStyle}>Plantilla eliminada al finalizar la verificación; solo se conserva el resultado (verificado/no)</td>
              <td style={tdStyle}>Minimización (art. 5.1.c RGPD)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Logs técnicos y de seguridad</td>
              <td style={tdStyle}><Todo>plazo — sugerido 12 meses</Todo></td>
              <td style={tdStyle}>Interés legítimo en seguridad</td>
            </tr>
            <tr>
              <td style={tdStyle}>Datos en blockchain (XRPL)</td>
              <td style={tdStyle}>Inmutables por diseño; no son suprimibles unilateralmente (véase sección 18)</td>
              <td style={tdStyle}>Naturaleza descentralizada de la red</td>
            </tr>
          </tbody>
        </table>

        {/* ────────── 11. Tus derechos por jurisdicción ────────── */}
        <H id="s11" n="11">Tus derechos por jurisdicción</H>
        <p style={paragraphStyle}>
          Los derechos reconocidos al Usuario varían según la legislación aplicable a su
          residencia o al lugar de tratamiento. El Operador atiende todas las solicitudes
          dirigidas a <Todo>privacy@1503.global</Todo>, identificando suficientemente al
          solicitante (sin requerir documentos excesivos) y respondiendo en el plazo aplicable
          a cada normativa.
        </p>

        <H3 id="s11-eu">11.1 Unión Europea / Espacio Económico Europeo (RGPD)</H3>
        <ul style={listStyle}>
          <li><strong>Acceso</strong> (art. 15): obtener copia de los datos tratados y de la información del tratamiento.</li>
          <li><strong>Rectificación</strong> (art. 16).</li>
          <li><strong>Supresión</strong> o «derecho al olvido» (art. 17), con las limitaciones legales aplicables.</li>
          <li><strong>Limitación del tratamiento</strong> (art. 18).</li>
          <li><strong>Portabilidad</strong> (art. 20): recibir los datos en formato estructurado y de uso común.</li>
          <li><strong>Oposición</strong> (art. 21), incluida la oposición al tratamiento basado en interés legítimo y al marketing directo.</li>
          <li><strong>Retirada del consentimiento</strong> en cualquier momento, sin afectar a la licitud previa.</li>
          <li><strong>No ser objeto de decisiones individuales automatizadas</strong> con efectos jurídicos significativos (art. 22), salvo excepciones legales.</li>
          <li><strong>Reclamación</strong> ante la Agencia Española de Protección de Datos (AEPD, www.aepd.es) o la autoridad de control competente del Estado miembro.</li>
        </ul>
        <p style={paragraphStyle}>
          Plazo de respuesta: un mes desde la solicitud, prorrogable dos meses adicionales en
          casos complejos con notificación al solicitante.
        </p>

        <H3 id="s11-uk">11.2 Reino Unido (UK GDPR + Data Protection Act 2018)</H3>
        <p style={paragraphStyle}>
          Los derechos son sustancialmente equivalentes a los del RGPD. La autoridad
          competente es el <strong>Information Commissioner&rsquo;s Office</strong> (ICO,
          ico.org.uk).
        </p>

        <H3 id="s11-ch">11.3 Suiza (revLPD, en vigor desde el 1 de septiembre de 2023)</H3>
        <ul style={listStyle}>
          <li>Acceso, rectificación, supresión y oposición.</li>
          <li>Información sobre el procesamiento, incluida la lógica de decisiones automatizadas significativas.</li>
          <li>Reclamación ante el Préposé fédéral à la protection des données et à la transparence (FDPIC, edoeb.admin.ch).</li>
        </ul>

        <H3 id="s11-us">11.4 Estados Unidos — California (CCPA/CPRA) y otros estados</H3>
        <p style={paragraphStyle}>
          Los residentes en California disponen de los siguientes derechos frente al Operador
          en su condición de <em>business</em>:
        </p>
        <ul style={listStyle}>
          <li><strong>Right to know</strong>: categorías y finalidades concretas de la información personal recogida.</li>
          <li><strong>Right to delete</strong>, con las excepciones del § 1798.105.</li>
          <li><strong>Right to correct</strong> información inexacta (CPRA § 1798.106).</li>
          <li><strong>Right to opt-out of sale or sharing</strong>: el Operador <strong>no vende ni comparte</strong> información personal en el sentido de la CCPA/CPRA. Aun así, se habilitará el enlace «Do Not Sell or Share My Personal Information» y la señal <em>Global Privacy Control</em> (GPC).</li>
          <li><strong>Right to limit use of sensitive personal information</strong> (CPRA § 1798.121).</li>
          <li><strong>Right to non-discrimination</strong> por ejercer los derechos.</li>
          <li><strong>Authorized agent</strong>: el Usuario puede actuar mediante representante autorizado conforme al § 1798.135.</li>
          <li>Reclamación ante la <strong>California Privacy Protection Agency</strong> (CPPA, cppa.ca.gov).</li>
        </ul>
        <p style={paragraphStyle}>
          Residentes en Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA),
          Texas (TDPSA) y otros estados con normativa propia disponen de derechos análogos.
          El Operador atenderá esas solicitudes con los plazos previstos en cada ley.{' '}
          <Todo>revisión por counsel US — confirmar lista vigente al momento del lanzamiento</Todo>
        </p>

        <H3 id="s11-ca">11.5 Canadá (PIPEDA federal y leyes provinciales)</H3>
        <ul style={listStyle}>
          <li>Acceso, rectificación e impugnación de la exactitud.</li>
          <li>Retirada del consentimiento, con las consecuencias contractuales que correspondan.</li>
          <li>Para residentes en Quebec, derechos adicionales bajo la <strong>Law 25</strong> (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels), incluida la portabilidad y la información sobre decisiones automatizadas.</li>
          <li>Reclamación ante el <strong>Office of the Privacy Commissioner of Canada</strong> (OPC, priv.gc.ca) o el comisionado provincial competente (Quebec, Alberta, BC).</li>
        </ul>

        <H3 id="s11-br">11.6 Brasil (LGPD — Ley 13.709/2018)</H3>
        <ul style={listStyle}>
          <li>Confirmación del tratamiento.</li>
          <li>Acceso, corrección, anonimización, bloqueo o eliminación.</li>
          <li>Portabilidad a otro proveedor.</li>
          <li>Eliminación de datos tratados con base en consentimiento.</li>
          <li>Información sobre uso compartido y posibilidad de no consentir, con consecuencias.</li>
          <li>Revisión de decisiones automatizadas que afecten intereses del titular.</li>
          <li>Reclamación ante la <strong>Autoridade Nacional de Proteção de Dados</strong> (ANPD, gov.br/anpd).</li>
        </ul>

        <H3 id="s11-jp">11.7 Japón (APPI — Act on the Protection of Personal Information)</H3>
        <ul style={listStyle}>
          <li>Divulgación, corrección, suspensión del uso, suspensión del suministro a terceros y eliminación.</li>
          <li>Notificación previa a transferencias internacionales con identificación del país de destino y de las medidas equivalentes.</li>
          <li>Reclamación ante la <strong>Personal Information Protection Commission</strong> (PPC, ppc.go.jp).</li>
        </ul>

        <H3 id="s11-cn">11.8 China (PIPL — Personal Information Protection Law)</H3>
        <ul style={listStyle}>
          <li>Acceso, copia, corrección y eliminación.</li>
          <li>Portabilidad a otros tratantes designados que cumplan los requisitos de la CAC.</li>
          <li>Retirada del consentimiento, incluido el consentimiento separado para transferencias internacionales y para tratamiento de información personal sensible.</li>
          <li>Explicación del tratamiento y oposición a decisiones automatizadas con impacto significativo.</li>
          <li>Reclamación ante la <strong>Cyberspace Administration of China</strong> (CAC) y autoridades provinciales.</li>
        </ul>

        <H3 id="s11-in">11.9 India (DPDP 2023 — Digital Personal Data Protection Act)</H3>
        <ul style={listStyle}>
          <li>Acceso a la información tratada y al resumen de tratamientos.</li>
          <li>Corrección, complemento, actualización y borrado.</li>
          <li>Designación de un representante en caso de incapacidad o fallecimiento.</li>
          <li>Mecanismo de presentación de quejas ante el <em>Data Fiduciary</em> y, en segunda instancia, ante el <strong>Data Protection Board of India</strong>.</li>
          <li>El Operador respetará la lista negativa de países restringidos cuando se publique conforme al art. 16 de la DPDP. <Todo>monitorizar publicación del reglamento de desarrollo</Todo></li>
        </ul>

        {/* ────────── 12. Decisiones automatizadas ────────── */}
        <H id="s12" n="12">Decisiones automatizadas y perfilado</H>
        <p style={paragraphStyle}>
          La Plataforma puede emplear procesos automatizados en los siguientes contextos:
        </p>
        <ul style={listStyle}>
          <li><strong>Verificación KYC</strong>: comparación automática del documento subido con registros públicos oficiales. <strong>Decisión final supervisada por persona humana</strong> en caso de no-match o ambigüedad.</li>
          <li><strong>Detección de fraude</strong>: reglas y modelos antiabuso que pueden marcar una cuenta para revisión. La suspensión de la cuenta requiere intervención humana motivada (véase ToS sección 11).</li>
          <li><strong>Asistente conversacional con IA</strong> (cuando se active): no toma decisiones con efectos jurídicos sobre el Usuario sin su confirmación humana explícita.</li>
        </ul>
        <p style={paragraphStyle}>
          El Usuario tiene derecho a no quedar sometido a una decisión basada únicamente en
          tratamiento automatizado que produzca efectos jurídicos o le afecte
          significativamente, salvo las excepciones legales (art. 22 RGPD y equivalentes).
          Puede solicitar intervención humana, expresar su punto de vista e impugnar la
          decisión escribiendo a <Todo>privacy@1503.global</Todo>.
        </p>

        {/* ────────── 13. Cookies ────────── */}
        <H id="s13" n="13">Cookies y tecnologías similares</H>
        <p style={paragraphStyle}>
          La Plataforma utiliza cookies y tecnologías de almacenamiento local en el navegador
          (<em>localStorage</em>, <em>sessionStorage</em>) para finalidades técnicas, de
          autenticación y de preferencia del Usuario.
        </p>
        <ul style={listStyle}>
          <li><strong>Cookies estrictamente necesarias</strong>: autenticación, seguridad, balanceo de carga. No requieren consentimiento.</li>
          <li><strong>Cookies de preferencia</strong>: idioma, tema, sector visitado. Almacenadas localmente.</li>
          <li><strong>Cookies de analítica</strong>: <Todo>indicar herramienta — sugerido analítica de primer parte autohospedada (Plausible, Umami) para minimizar transferencias y consentimiento</Todo></li>
          <li><strong>Cookies de marketing</strong>: el Operador <strong>no utiliza</strong> cookies de marketing de terceros a la fecha de este documento.</li>
        </ul>
        <p style={paragraphStyle}>
          Cuando se activen cookies no estrictamente necesarias, se solicitará consentimiento
          mediante banner conforme a la Directiva ePrivacy y a la guía AEPD vigente. El Usuario
          podrá revocarlo en cualquier momento desde el panel de la Plataforma.{' '}
          <Todo>banner de cookies — pendiente de implementar antes del lanzamiento público</Todo>
        </p>

        {/* ────────── 14. Seguridad ────────── */}
        <H id="s14" n="14">Seguridad de los datos</H>
        <p style={paragraphStyle}>
          El Operador adopta medidas técnicas y organizativas razonables, proporcionadas al
          riesgo, conforme al art. 32 RGPD y normativa equivalente:
        </p>
        <ul style={listStyle}>
          <li>Cifrado en tránsito (TLS 1.2+) y en reposo de los datos almacenados en Supabase.</li>
          <li>Cifrado adicional <strong>de extremo a extremo</strong> en la carpeta digital de Operaciones que contienen entregables profesionales sensibles.</li>
          <li>Control de acceso basado en roles, autenticación con factor adicional cuando se habilite, auditoría de accesos privilegiados.</li>
          <li>Segregación de entornos (producción / preproducción / desarrollo).</li>
          <li>Copias de seguridad cifradas y prueba periódica de restauración.</li>
          <li>Plan de continuidad y respuesta a incidentes.</li>
          <li>Evaluación de impacto (DPIA) previa al despliegue de tratamientos de alto riesgo, en particular el <em>liveness check</em> biométrico y el asistente IA.</li>
        </ul>

        {/* ────────── 15. Notificación de violaciones ────────── */}
        <H id="s15" n="15">Notificación de violaciones de seguridad</H>
        <p style={paragraphStyle}>
          En caso de violación de la seguridad de los datos personales, el Operador notificará:
        </p>
        <ul style={listStyle}>
          <li>A la <strong>autoridad de control competente</strong> dentro del plazo aplicable: 72 horas bajo RGPD/UK GDPR; en el plazo previsto por cada ley nacional para el resto.</li>
          <li>Al <strong>Usuario</strong> sin dilación indebida cuando la violación entrañe un alto riesgo para sus derechos y libertades, incluyendo la naturaleza de la violación, datos afectados, medidas adoptadas y recomendaciones para mitigar el impacto.</li>
        </ul>
        <p style={paragraphStyle}>
          El Operador mantiene un registro interno de todas las violaciones, conforme al art.
          33.5 RGPD, con descripción, efectos y medidas correctoras.
        </p>

        {/* ────────── 16. Menores ────────── */}
        <H id="s16" n="16">Menores de edad</H>
        <p style={paragraphStyle}>
          La Plataforma <strong>no se dirige a menores de edad</strong> y no admite el registro
          como Actor a personas físicas que no tengan capacidad legal para contratar bajo su
          legislación nacional. La edad mínima general es de:
        </p>
        <ul style={listStyle}>
          <li>18 años en España, UE/EEE, UK, Suiza, Brasil, Canadá, Japón.</li>
          <li>16 años para finalidades específicas en algunos Estados miembros de la UE conforme al art. 8 RGPD, no aplicable al alta como Actor económico.</li>
          <li>14 años bajo PIPL (China) requiere consentimiento del tutor legal; el Operador no admite este supuesto.</li>
          <li>13 años bajo COPPA (EE.UU.); el Operador no se dirige a este colectivo.</li>
        </ul>
        <p style={paragraphStyle}>
          Si el Operador detecta que un Actor declaró falsamente su edad, suspenderá la cuenta
          conforme a la cláusula 11 del ToS y procederá a la supresión de los datos personales,
          salvo conservación legalmente exigida.
        </p>

        {/* ────────── 17. KYC y AML ────────── */}
        <H id="s17" n="17">Datos KYC y obligaciones AML</H>
        <p style={paragraphStyle}>
          El tratamiento de los datos KYC y AML responde a una <strong>obligación legal</strong>{' '}
          (art. 6.1.c RGPD; Ley 10/2010 de 28 de abril; Reglamento (UE) 2024/1624 cuando entre
          en vigor; figuras equivalentes en otras jurisdicciones).
        </p>
        <p style={paragraphStyle}>
          El Operador podrá conservar los datos KYC durante el plazo legal de <strong>10
          años</strong> desde el cese de la relación con el Usuario, aun cuando éste haya
          solicitado la supresión de su cuenta. Esta conservación no es renunciable.
        </p>
        <p style={paragraphStyle}>
          Para sectores regulados (legal, salud, arquitectura, ingeniería, auditoría), la
          verificación KYC profesional incluye consulta cruzada con el <strong>registro
          público oficial</strong> del país de ejercicio profesional. El resultado se almacena
          con la URL de la fuente, la fecha de consulta y un hash de la respuesta del
          registro, como prueba documental. La inteligencia artificial puede asistir en la
          consulta y el cotejo, pero <strong>la fe del dato la otorga el registro oficial, no
          el modelo</strong>; los casos no concluyentes se elevan a revisión humana.
        </p>

        {/* ────────── 18. Trazabilidad on-ledger (XRPL) ────────── */}
        <H id="s18" n="18">Trazabilidad on-ledger (XRPL)</H>
        <p style={paragraphStyle}>
          Cuando se active la funcionalidad de verificación de liquidación sobre registro
          público (verify-on-ledger, de carácter no custodial: el Operador no custodia fondos
          ni criptoactivos del Usuario), determinada información se registrará en la red
          pública XRP Ledger (XRPL):
        </p>
        <ul style={listStyle}>
          <li>Hash de cada Operación y de los hitos de su liquidación.</li>
          <li>Fecha de cada verificación.</li>
        </ul>
        <p style={paragraphStyle}>
          XRPL es una infraestructura <strong>pública, descentralizada e inmutable</strong>.
          Esto significa que la información registrada en ella <strong>no puede ser
          suprimida</strong> por el Operador a petición del Usuario, ya que excede su esfera
          de control. El Operador adopta las siguientes medidas para reducir el impacto sobre
          la privacidad:
        </p>
        <ul style={listStyle}>
          <li>Solo se registra la información estrictamente necesaria para la trazabilidad de la Operación; los datos identificativos de las partes no se publican on-chain.</li>
          <li>La asociación entre las referencias registradas on-ledger y la identidad real del Actor se mantiene off-chain, en el sistema del Operador, y solo se revela conforme a la presente política y a requerimiento legal competente.</li>
          <li>El Usuario es informado expresamente de la inmutabilidad antes de activar la verificación on-ledger y debe consentir su uso (sección 5).</li>
        </ul>
        <p style={paragraphStyle}>
          La presente sección describe una limitación técnica inherente a la tecnología
          blockchain reconocida por el Comité Europeo de Protección de Datos (Directrices
          02/2024). El derecho de supresión bajo el RGPD se ejerce sobre los datos
          off-chain del Operador.
        </p>

        {/* ────────── 19. Asistente IA ────────── */}
        <H id="s19" n="19">Asistente con IA (cuando se active)</H>
        <p style={paragraphStyle}>
          La Plataforma podrá ofrecer en el futuro un asistente conversacional opcional (Fases
          5.5, 7.5 y 9.5 del roadmap del Operador). Su uso implicará el siguiente tratamiento
          adicional:
        </p>
        <ul style={listStyle}>
          <li>Las consultas del Usuario al asistente se transmitirán al proveedor del modelo (<Todo>indicar proveedor — previsto Anthropic UE/Bedrock UE</Todo>) bajo contrato de encargo conforme al art. 28 RGPD.</li>
          <li>El proveedor del modelo se compromete por contrato a <strong>no entrenar sus modelos</strong> con las consultas de los Actores.</li>
          <li>El Usuario debe consentir expresamente el uso del asistente; la activación es voluntaria y desactivable.</li>
          <li>El asistente <strong>no toma decisiones con efectos jurídicos</strong> sin confirmación humana del Usuario.</li>
          <li>Los registros de conversación se conservan por <Todo>plazo — sugerido 90 días</Todo>, salvo que el Usuario los borre antes desde su panel.</li>
        </ul>

        {/* ────────── 20. Modificaciones ────────── */}
        <H id="s20" n="20">Modificaciones de esta política</H>
        <p style={paragraphStyle}>
          El Operador podrá modificar esta política para reflejar cambios legislativos,
          jurisprudenciales, técnicos o de modelo de servicio. Las modificaciones
          sustanciales se notificarán al Usuario con al menos <Todo>plazo — sugerido 30
          días</Todo> de antelación a su entrada en vigor por correo electrónico y aviso en
          la Plataforma. La continuidad del uso tras la entrada en vigor se entenderá como
          aceptación de la nueva versión, sin perjuicio del derecho del Usuario a retirar el
          consentimiento o ejercer cualquier otro derecho.
        </p>

        {/* ────────── 21. Reclamaciones ────────── */}
        <H id="s21" n="21">Cómo presentar una reclamación</H>
        <p style={paragraphStyle}>
          Antes de acudir a la autoridad de control, animamos al Usuario a contactar al DPO
          en <Todo>privacy@1503.global</Todo>: el Operador se compromete a responder de
          forma motivada en el plazo aplicable a su jurisdicción.
        </p>
        <p style={paragraphStyle}>
          Si la respuesta no es satisfactoria, el Usuario puede presentar reclamación ante la
          autoridad de control competente identificada en la sección 11 según su jurisdicción
          de residencia. La presente cláusula no limita el derecho de los Actores a acudir
          directamente a la vía administrativa o judicial cuando lo consideren oportuno.
        </p>

        {/* ────────── 22. Contacto ────────── */}
        <H id="s22" n="22">Datos de contacto del Responsable y DPO</H>
        <ul style={listStyle}>
          <li><strong>Responsable:</strong> <Todo>razón social</Todo>, <Todo>domicilio</Todo>.</li>
          <li><strong>Correo del DPO / Privacidad:</strong> <Todo>privacy@1503.global</Todo>.</li>
          <li><strong>Correo general:</strong> <Todo>contacto@1503.global</Todo>.</li>
          <li><strong>Representante en la UE</strong> (si el Responsable no estuviera establecido en la UE): <Todo>indicar representante art. 27 RGPD si procede</Todo>.</li>
          <li><strong>Representante en UK</strong> (si procede): <Todo>indicar representante art. 27 UK GDPR si procede</Todo>.</li>
        </ul>

        {/* ────────── 23. Aceptación ────────── */}
        <H id="s23" n="23">Aceptación</H>
        <p style={paragraphStyle}>
          La aceptación de esta política se manifiesta marcando expresamente la casilla{' '}
          <em>«He leído y acepto la Política de Privacidad»</em> durante el registro. La
          Plataforma registrará la fecha, hora y versión aceptada como prueba del
          consentimiento informado, conforme al art. 7.1 RGPD.
        </p>
        <p style={paragraphStyle}>
          Esta política forma parte integrante de los{' '}
          <Link href="/legal/terms" style={{ color: '#00A3FF' }}>Términos de Servicio</Link>{' '}
          y debe leerse conjuntamente con ellos.
        </p>

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
