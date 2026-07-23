import Link from 'next/link'
import type { Metadata } from 'next'

// Hard "noindex" while the document is in BORRADOR. Search engines must not
// index legal text that has not been validated by counsel.
export const metadata: Metadata = {
  title: 'Términos de Servicio (BORRADOR) · 1503',
  robots: { index: false, follow: false },
}

const VERSION = 'v0.2-draft'
const UPDATED = '2026-05-09'

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
      <span style={{ color: '#4A5566', fontFamily: 'var(--font-dm-mono), monospace', fontSize: '0.85rem', marginRight: '0.6rem', letterSpacing: '0.08em' }}>
        {n}
      </span>
      {children}
    </h2>
  )
}

export default function TermsPage() {
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
          <span style={{ ...eyebrowStyle, fontSize: '0.7rem' }}>LEGAL · TÉRMINOS DE SERVICIO</span>
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
            Este documento es un <strong>borrador estructural</strong> redactado para reflejar las
            secciones obligatorias bajo el Reglamento (UE) 2016/679 (RGPD), la Ley 34/2002 (LSSI),
            la Ley General para la Defensa de los Consumidores y Usuarios y la normativa AML/MiCA
            aplicable. <strong>No tiene validez legal hasta que un asesor jurídico colegiado lo
            valide y se publique una versión final.</strong> Los campos marcados como{' '}
            <span style={{ color: '#F0B429', fontFamily: 'var(--font-dm-mono), monospace' }}>[TODO: …]</span>{' '}
            requieren decisión del Operador antes de la publicación.
          </p>
        </div>

        {/* Title */}
        <header style={{ marginBottom: '2.5rem' }}>
          <span style={eyebrowStyle}>DOCUMENTO 1 DE 4 · ToS</span>
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
            Términos de Servicio
          </h1>
          <p style={{ color: '#7A8899', fontSize: '0.85rem', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.06em' }}>
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
            <li><a href="#s1" style={{ color: '#9FB6CC' }}>Objeto y partes</a></li>
            <li><a href="#s2" style={{ color: '#9FB6CC' }}>Definiciones</a></li>
            <li><a href="#s3" style={{ color: '#9FB6CC' }}>Servicios prestados</a></li>
            <li><a href="#s4" style={{ color: '#9FB6CC' }}>Registro y cuenta</a></li>
            <li><a href="#s5" style={{ color: '#9FB6CC' }}>Obligaciones del Usuario</a></li>
            <li><a href="#s6" style={{ color: '#9FB6CC' }}>Prohibiciones</a></li>
            <li><a href="#s7" style={{ color: '#9FB6CC' }}>Comisiones y facturación</a></li>
            <li><a href="#s8" style={{ color: '#9FB6CC' }}>Tecnología de registro distribuido (XRPL)</a></li>
            <li><a href="#s9" style={{ color: '#9FB6CC' }}>Propiedad intelectual</a></li>
            <li><a href="#s10" style={{ color: '#9FB6CC' }}>Privacidad</a></li>
            <li><a href="#s11" style={{ color: '#9FB6CC' }}>Suspensión y terminación</a></li>
            <li><a href="#s12" style={{ color: '#9FB6CC' }}>Limitación de responsabilidad</a></li>
            <li><a href="#s13" style={{ color: '#9FB6CC' }}>Modificaciones</a></li>
            <li><a href="#s14" style={{ color: '#9FB6CC' }}>Comunicaciones</a></li>
            <li><a href="#s15" style={{ color: '#9FB6CC' }}>Ley aplicable y jurisdicción</a></li>
            <li><a href="#s16" style={{ color: '#9FB6CC' }}>Disposiciones generales</a></li>
            <li><a href="#s17" style={{ color: '#9FB6CC' }}>Aceptación</a></li>
          </ol>
        </nav>

        {/* ────────── 1. Objeto y partes ────────── */}
        <H id="s1" n="01">Objeto y partes</H>
        <p style={paragraphStyle}>
          Los presentes Términos de Servicio (en adelante, los <strong>«Términos»</strong>) regulan
          el acceso, registro y uso de la plataforma 1503 (en adelante, la{' '}
          <strong>«Plataforma»</strong>), una <strong>herramienta digital de interconexión
          profesional cross-border</strong> que conecta a actores profesionales —personas físicas
          con actividad económica y personas jurídicas— de cualquier sector y país del mundo para la
          contratación y liquidación de operaciones comerciales B2B y B2C.
        </p>
        <p style={paragraphStyle}>
          <strong>1503 es una herramienta, no un marketplace tradicional.</strong> El Operador
          no compra, no vende, no almacena inventario, no asume responsabilidad sobre los bienes o
          servicios intercambiados, y no es parte de las Operaciones celebradas entre los Actores.
          La Plataforma se limita a facilitar la conexión, la verificación de identidad
          profesional, la custodia técnica de los fondos en escrow y la trazabilidad inmutable de
          la Operación. La retribución del Operador consiste exclusivamente en una comisión por
          Operación liquidada, sin perjuicio de funcionalidades opcionales que puedan habilitarse
          en el futuro mediante aceptación expresa del Usuario.
        </p>
        <p style={paragraphStyle}>
          Las partes vinculadas por estos Términos son:
        </p>
        <ul style={listStyle}>
          <li>
            El <strong>«Operador»</strong>: <Todo>razón social</Todo>, con domicilio en{' '}
            <Todo>domicilio fiscal completo</Todo>, identificación fiscal{' '}
            <Todo>CIF/NIF</Todo>, inscrita en <Todo>registro mercantil y datos registrales</Todo>,
            con correo de contacto <Todo>contacto@1503.global</Todo>.
          </li>
          <li>
            El <strong>«Usuario»</strong> o <strong>«Actor»</strong>: cualquier persona física con
            capacidad legal para contratar (mayor de edad, no incapacitada) o persona jurídica
            válidamente constituida que se registre en la Plataforma.
          </li>
        </ul>
        <p style={paragraphStyle}>
          La aceptación de estos Términos por parte del Usuario es condición previa e
          imprescindible para acceder a la Plataforma. La aceptación se manifiesta marcando la
          casilla correspondiente durante el proceso de registro.
        </p>

        {/* ────────── 2. Definiciones ────────── */}
        <H id="s2" n="02">Definiciones</H>
        <ul style={listStyle}>
          <li><strong>1503</strong>: la Plataforma operada por el Operador, accesible en{' '}
            <Todo>dominio principal</Todo> y dominios asociados.
          </li>
          <li><strong>Actor</strong>: persona física o jurídica registrada en la Plataforma con KYC verificado.</li>
          <li><strong>KYC verificado</strong>: estado del Actor cuya identidad y documentación han sido validadas por el Operador conforme al procedimiento descrito en estos Términos y en la normativa aplicable de prevención de blanqueo de capitales (Ley 10/2010, en lo aplicable; Reglamento (UE) 2024/1624 cuando entre en vigor).</li>
          <li><strong>Operación</strong>: cualquier transacción de bienes o servicios entre Actores facilitada a través de la Plataforma.</li>
          <li><strong>XRPL</strong>: XRP Ledger, infraestructura de registro distribuido pública y descentralizada operada por terceros, no controlada por el Operador. La Plataforma puede utilizarla únicamente como capa de <strong>verificación de liquidación</strong> (verify-on-ledger), de carácter no custodial. <strong>La Plataforma no emite, ofrece ni comercializa ningún criptoactivo propio.</strong></li>
          <li><strong>Servicio</strong>: el conjunto de funcionalidades ofrecidas a través de la Plataforma.</li>
        </ul>

        {/* ────────── 3. Servicios ────────── */}
        <H id="s3" n="03">Servicios prestados</H>
        <p style={paragraphStyle}>
          El Operador pone a disposición del Usuario los siguientes servicios, todos ellos
          accesibles desde un único escritorio profesional especializado según el rol del Actor:
        </p>
        <ul style={listStyle}>
          <li><strong>Plataforma de interconexión multisector</strong> (a la fecha, 11 sectores activos).</li>
          <li><strong>Verificación de identidad y documentación profesional</strong> del Actor (KYC).</li>
          <li><strong>Catálogo</strong> de productos, servicios e inmuebles publicados por los Actores, con tres tipos de Operación que comparten infraestructura común (escrow, trazabilidad, KYC) pero divergen en flujo concreto:
            <ul style={{ ...listStyle, marginTop: '0.6rem', paddingLeft: '1.2rem' }}>
              <li><strong>Producto físico</strong> — ficha con stock y precio, pedido, escrow, entrega logística, liberación al confirmar recepción.</li>
              <li><strong>Bien inmueble</strong> — ficha con metros, ubicación y certificados, oferta, escrow, cierre legal ante el fedatario público competente, liberación al confirmar inscripción registral.</li>
              <li><strong>Servicio profesional</strong> — encargo, escrow, entrega del trabajo en una <strong>carpeta digital cifrada de extremo a extremo</strong> accesible solo a las partes autorizadas, liberación al aceptar el cliente el trabajo entregado.</li>
            </ul>
          </li>
          <li><strong>Mensajería interna</strong> entre Actores (texto, con opción de traducción cuando los Actores hablan idiomas distintos).</li>
          <li><strong>Llamadas de voz y videollamada</strong> con consentimiento expreso de las partes.</li>
          <li><strong>Gestión de pedidos, facturación y trazabilidad inmutable on-chain</strong>.</li>
          <li><strong>Verificación de liquidación sobre registro público (verify-on-ledger)</strong>: comprobación no custodial de hitos de liquidación sobre XRPL. La factura se denomina siempre en moneda fiat (ISO 4217) <em>(funcionalidad en desarrollo; no operativa en la fecha de este documento)</em>.</li>
        </ul>
        <p style={paragraphStyle}>
          El Operador podrá habilitar en el futuro las siguientes <strong>funcionalidades
          opcionales</strong>, cada una sujeta a aceptación expresa del Usuario y, cuando proceda,
          a la obtención de las autorizaciones regulatorias correspondientes:
        </p>
        <ul style={listStyle}>
          <li><strong>Integración con fedatarios públicos</strong> registrados como Actores en la Plataforma (notarios, shihō shoshi, closing attorneys, solicitors u otros equivalentes según jurisdicción), lo que permitirá coordinar el cierre legal de Operaciones desde el propio escritorio profesional. Véase la sección 12 sobre el alcance preciso de esta integración.</li>
          <li><strong>Asistente conversacional con inteligencia artificial</strong> integrado en el escritorio del Actor, capaz de explicar el funcionamiento de la Plataforma, consultar el estado del Usuario y, eventualmente, ejecutar acciones bajo confirmación humana. El uso del asistente es voluntario y desactivable.</li>
          <li><strong>Traducción de mensajes y voz</strong> cross-idioma como ayuda a la comunicación entre Actores, sin sustituir en ningún caso a intérpretes certificados cuando la normativa aplicable los exija (actos notariales, judiciales o administrativos con extranjeros, entre otros).</li>
          <li><strong>Modelos de inversión fraccional inmobiliaria</strong> mediante vehículos societarios (tokenización vía SPV) sujeta a las autorizaciones de los supervisores de mercados financieros aplicables (CNMV, ESMA, MiCA u otras).</li>
        </ul>
        <p style={paragraphStyle}>
          El Operador <strong>no es parte</strong> de las Operaciones celebradas entre Actores: se
          limita a facilitar la conexión, la verificación, la custodia técnica del escrow y la
          trazabilidad. La responsabilidad por el cumplimiento, calidad, legalidad y conformidad
          de los bienes y servicios intercambiados recae <strong>exclusivamente sobre los Actores
          intervinientes</strong>.
        </p>

        {/* ────────── 4. Registro y cuenta ────────── */}
        <H id="s4" n="04">Registro y cuenta</H>
        <p style={paragraphStyle}>
          Para registrarse el Usuario debe ser mayor de edad o, tratándose de persona jurídica,
          estar válidamente constituida y representada por persona con poder bastante. El registro
          requiere aportar datos veraces, exactos y actualizados, así como la documentación de
          KYC requerida según la forma jurídica y país de operación del Actor.
        </p>
        <p style={paragraphStyle}>
          <strong>El alta unitaria del Actor habilita simultáneamente dos roles bajo una misma
          cuenta y un único KYC:</strong>
        </p>
        <ul style={listStyle}>
          <li><strong>Rol oferente</strong> en el sector y país de origen donde el Actor se da de alta. En su escritorio publica fichas (productos, servicios o inmuebles), recibe pedidos y cobra a través del escrow.</li>
          <li><strong>Rol cliente</strong> en cualquier otro sector y cualquier otro país. Sin necesidad de segundo registro ni segundo KYC, el Actor puede contratar a otros Actores verificados de cualquier parte del mundo.</li>
        </ul>
        <p style={paragraphStyle}>
          Cada Actor dispondrá de una única cuenta. El Usuario es responsable de la
          confidencialidad de sus credenciales y de toda actividad realizada bajo su cuenta. Si
          detecta uso no autorizado debe notificarlo de inmediato al Operador.
        </p>
        <p style={paragraphStyle}>
          El Operador podrá rechazar el registro o suspender una cuenta cuando los datos o
          documentos aportados sean falsos, incompletos o no superen las verificaciones AML/KYC
          aplicables.
        </p>

        {/* ────────── 5. Obligaciones del Usuario ────────── */}
        <H id="s5" n="05">Obligaciones del Usuario</H>
        <ul style={listStyle}>
          <li>Aportar y mantener actualizada información veraz sobre su identidad, forma jurídica y actividad.</li>
          <li>Respetar la legislación vigente en sus operaciones, incluida la normativa fiscal, laboral, de consumo, sanitaria, sectorial y de protección de datos aplicable a su actividad.</li>
          <li>Cumplir sus obligaciones AML/KYC propias frente a sus contrapartes y autoridades.</li>
          <li>Respetar los derechos de propiedad intelectual e industrial de terceros y del Operador.</li>
          <li>No utilizar la Plataforma para fines ilícitos, fraudulentos o contrarios al orden público.</li>
          <li>Conducirse con buena fe y respeto en las comunicaciones con otros Actores.</li>
        </ul>

        {/* ────────── 6. Prohibiciones ────────── */}
        <H id="s6" n="06">Prohibiciones</H>
        <p style={paragraphStyle}>
          Queda expresamente prohibido al Usuario, sin que la enumeración tenga carácter
          exhaustivo:
        </p>
        <ul style={listStyle}>
          <li>Suplantar la identidad de otra persona, física o jurídica.</li>
          <li>Manipular precios, generar oferta o demanda artificial o coordinar prácticas anticompetitivas con otros Actores.</li>
          <li>Comerciar bienes o servicios cuya venta esté prohibida o restringida por ley.</li>
          <li>Utilizar la Plataforma para envío masivo no solicitado, automatización maliciosa, scraping abusivo o ataques contra la infraestructura.</li>
          <li>Hacer ingeniería inversa, descompilar o intentar acceder al código fuente de la Plataforma.</li>
          <li>Eludir las medidas de KYC o presentar documentación falsa.</li>
        </ul>

        {/* ────────── 7. Comisiones ────────── */}
        <H id="s7" n="07">Comisiones y facturación</H>
        <p style={paragraphStyle}>
          El registro y uso básico de la Plataforma son gratuitos. El Operador percibe una
          comisión de <Todo>0,5 % — confirmar</Todo> sobre el importe de cada Operación liquidada
          a través de la Plataforma. Los impuestos aplicables (IVA, en su caso) se aplicarán
          adicionalmente conforme a la normativa fiscal vigente.
        </p>
        <p style={paragraphStyle}>
          No existe permanencia mínima ni cuotas fijas. Las modificaciones de la comisión serán
          notificadas con <Todo>plazo de preaviso — sugerido 30 días</Todo> de antelación. Si el
          Usuario no acepta la nueva comisión, podrá dar de baja su cuenta sin penalización antes
          de su entrada en vigor.
        </p>
        <p style={paragraphStyle}>
          El Operador emitirá factura por las comisiones devengadas conforme al Real Decreto
          1619/2012 y disposiciones concordantes.
        </p>

        {/* ────────── 8. Tecnología de registro distribuido (XRPL) ────────── */}
        <H id="s8" n="08">Tecnología de registro distribuido (XRPL)</H>
        <p style={paragraphStyle}>
          La Plataforma puede apoyarse en XRP Ledger (XRPL), una infraestructura pública y
          descentralizada gestionada por validadores independientes, exclusivamente como capa de
          <strong> verificación de liquidación</strong> (verify-on-ledger), de carácter
          <strong> no custodial</strong>: el Operador no custodia fondos ni criptoactivos del
          Usuario, y la facturación se denomina siempre en moneda fiat (ISO 4217).
          <strong> El Operador no controla XRPL</strong> y no responde de la disponibilidad,
          integridad o rendimiento de dicha red.
        </p>
        <p style={paragraphStyle}>
          <strong>La Plataforma no emite, ofrece ni comercializa ningún criptoactivo propio</strong>,
          ni presta servicios de custodia, cambio o inversión sobre criptoactivos. Cualquier
          eventual evolución futura en este ámbito requeriría las autorizaciones regulatorias
          correspondientes (Reglamento (UE) 2023/1114 — MiCA) y la aceptación expresa de nuevos
          términos por el Usuario.
        </p>
        <p style={paragraphStyle}>
          La información disponible en la Plataforma sobre tecnología de registro distribuido
          tiene carácter informativo y <strong>no constituye asesoramiento financiero, fiscal ni
          de inversión</strong>.
        </p>
        <p style={paragraphStyle}>
          <strong>El smart contract de escrow no sustituye en ningún caso al fedatario público.</strong>
          {' '}En las Operaciones que requieran intervención de fedatario público competente
          (notario en sistemas civilistas, shihō shoshi en Japón, closing attorney o title agent en
          Estados Unidos, solicitor en Reino Unido u otros equivalentes según jurisdicción), el
          smart contract <strong>custodia los fondos en escrow</strong> hasta que el fedatario
          público autorizado <strong>confirma el otorgamiento</strong> del acto y, cuando proceda,
          su <strong>inscripción en el registro público correspondiente</strong>. Solo entonces el
          smart contract libera los fondos al receptor previsto. La transmisión legal de la
          propiedad, la fe pública del acto y la inscripción registral son competencia exclusiva
          del fedatario y del registro público de la jurisdicción del bien, conforme a la regla
          internacional <em>lex rei sitae</em>.
        </p>

        {/* ────────── 9. Propiedad intelectual ────────── */}
        <H id="s9" n="09">Propiedad intelectual</H>
        <p style={paragraphStyle}>
          El software, diseño, código, marcas, logotipos, dominios y cualquier otro elemento de la
          Plataforma son propiedad del Operador o de sus licenciantes y están protegidos por la
          legislación de propiedad intelectual e industrial aplicable.
        </p>
        <p style={paragraphStyle}>
          El contenido subido o generado por el Usuario (catálogos, fichas de producto, mensajes,
          archivos, fotografías) sigue siendo de su titularidad. No obstante, el Usuario otorga
          al Operador una licencia <strong>gratuita, no exclusiva, mundial y limitada en su
          duración a la vigencia de su cuenta</strong> para reproducir, almacenar, mostrar y
          transmitir dicho contenido en la medida estrictamente necesaria para la prestación del
          Servicio.
        </p>

        {/* ────────── 10. Privacidad ────────── */}
        <H id="s10" n="10">Privacidad</H>
        <p style={paragraphStyle}>
          El tratamiento de los datos personales del Usuario se rige por la{' '}
          <Link href="/legal/privacy" style={{ color: '#00A3FF' }}>Política de Privacidad</Link>,
          que forma parte integrante de estos Términos y debe ser aceptada por separado durante
          el registro.
        </p>

        {/* ────────── 11. Suspensión y terminación ────────── */}
        <H id="s11" n="11">Suspensión y terminación</H>
        <p style={paragraphStyle}>
          El Usuario podrá dar de baja su cuenta en cualquier momento desde el panel de la
          Plataforma o solicitándolo a <Todo>privacy@1503.global</Todo>. La baja será efectiva
          en un plazo máximo de <Todo>plazo — sugerido 30 días</Todo>, sin perjuicio de la
          conservación de datos por obligaciones legales:
        </p>
        <ul style={listStyle}>
          <li>Datos contables y fiscales: 6 años (artículo 30 del Código de Comercio).</li>
          <li>Datos KYC y de prevención de blanqueo: 10 años (artículo 25 de la Ley 10/2010).</li>
          <li>Comunicaciones electrónicas comerciales y registros de aceptación: <Todo>plazo a definir</Todo>.</li>
        </ul>
        <p style={paragraphStyle}>
          El Operador podrá suspender o cancelar la cuenta del Usuario, con notificación previa
          razonable cuando sea posible, en los siguientes supuestos enumerados de forma específica:
        </p>
        <ul style={listStyle}>
          <li><strong>Documentación KYC no aportada</strong> en el plazo razonable indicado tras el alta o tras una solicitud de actualización por parte del Operador.</li>
          <li><strong>Documentación KYC falsa, manipulada o caducada</strong> que comprometa la veracidad del perfil del Actor.</li>
          <li><strong>Incumplimiento de la legalidad sectorial</strong> aplicable a la actividad del Actor (licencias, autorizaciones, certificaciones obligatorias, normativa sanitaria, fiscal, laboral o de consumo).</li>
          <li><strong>Operaciones que infrinjan la legalidad</strong> (comercio prohibido, blanqueo de capitales, financiación del terrorismo, vulneración de embargos internacionales).</li>
          <li><strong>Reclamaciones reiteradas y fundadas de otros Actores</strong> no resueltas razonablemente por el Usuario.</li>
          <li><strong>Suplantación de identidad o uso indebido de credenciales</strong>.</li>
          <li><strong>Manipulación de precios, prácticas anticompetitivas</strong> coordinadas con otros Actores o uso fraudulento del escrow.</li>
          <li><strong>Requerimiento de autoridad competente</strong> (judicial, administrativa, supervisora) que ordene la suspensión o cierre.</li>
          <li><strong>Incumplimiento grave</strong> de estos Términos no encuadrable en los supuestos anteriores, motivado por escrito.</li>
        </ul>
        <p style={paragraphStyle}>
          La suspensión podrá ser <strong>cautelar</strong> mientras se investiga el supuesto, con
          posibilidad de levantamiento si la investigación no confirma el incumplimiento. La
          cancelación definitiva requerirá comunicación motivada al Usuario, con derecho a réplica
          y, en su caso, devolución de los fondos en escrow no afectados por reclamaciones de
          terceros.
        </p>

        {/* ────────── 12. Limitación de responsabilidad ────────── */}
        <H id="s12" n="12">Limitación de responsabilidad</H>
        <p style={paragraphStyle}>
          La Plataforma se presta «tal cual» y «según disponibilidad». El Operador adoptará
          medidas técnicas y organizativas razonables para asegurar la continuidad del Servicio
          pero <strong>no garantiza disponibilidad ininterrumpida</strong> ni la ausencia de
          errores, sin perjuicio de las garantías legales aplicables a consumidores.
        </p>
        <p style={paragraphStyle}>
          El Operador no responde de los daños derivados del incumplimiento contractual o
          extracontractual entre Actores, ni de la calidad, conformidad, legalidad o veracidad de
          los bienes, servicios o contenidos publicados por los Actores.
        </p>
        <p style={paragraphStyle}>
          La responsabilidad total acumulada del Operador frente al Usuario, por cualquier
          concepto, queda limitada al menor de los siguientes importes: <Todo>importe — sugerido
          1.000 €</Todo> o el total de comisiones efectivamente cobradas por el Operador al
          Usuario en los <Todo>plazo — sugerido 12 meses</Todo> anteriores al hecho que motive la
          reclamación. Esta limitación no se aplica a daños derivados de dolo o negligencia
          grave, ni a los supuestos en que la legislación tuitiva del consumidor lo prohíba.
        </p>
        <p style={paragraphStyle}>
          <strong>El Operador no garantiza ni la fe pública del acto, ni la inscripción registral,
          ni la transmisión legal de la propiedad sobre bienes inmuebles, derechos reales o
          participaciones societarias.</strong> Estas funciones son competencia exclusiva del
          fedatario público y del registro público correspondiente en la jurisdicción del bien o
          del acto. La Plataforma facilita la coordinación, la custodia técnica del escrow y la
          trazabilidad on-chain, pero no es —ni puede ser— sustituta de las formalidades legales
          aplicables. Cualquier afirmación contraria será considerada contraria a estos Términos.
        </p>
        <p style={paragraphStyle}>
          De forma análoga, el Operador no garantiza la calidad de las traducciones automáticas
          que la Plataforma pueda ofrecer como ayuda a la comunicación entre Actores. Cuando la
          normativa exija intervención de intérprete certificado (actos notariales o judiciales
          con extranjeros, entre otros), corresponde a las partes recurrir a un profesional
          habilitado conforme a la legislación aplicable. La traducción automática es una ayuda,
          no fe pública lingüística.
        </p>

        {/* ────────── 13. Modificaciones ────────── */}
        <H id="s13" n="13">Modificaciones de los Términos</H>
        <p style={paragraphStyle}>
          El Operador podrá modificar estos Términos para reflejar cambios legales, técnicos o de
          modelo de negocio. Las modificaciones sustanciales se notificarán al Usuario por correo
          electrónico con al menos <Todo>plazo — sugerido 30 días</Todo> de antelación a su
          entrada en vigor.
        </p>
        <p style={paragraphStyle}>
          Si el Usuario no acepta la nueva versión, podrá dar de baja su cuenta sin penalización
          antes de la entrada en vigor de los nuevos Términos. La continuidad del uso de la
          Plataforma tras dicha fecha se entenderá como aceptación de la versión modificada.
        </p>

        {/* ────────── 14. Comunicaciones ────────── */}
        <H id="s14" n="14">Comunicaciones</H>
        <p style={paragraphStyle}>
          Las comunicaciones del Operador al Usuario se dirigirán al correo electrónico que figure
          en la cuenta. El Usuario es responsable de mantener actualizada esta dirección.
        </p>
        <p style={paragraphStyle}>
          El Usuario puede dirigirse al Operador en <Todo>contacto@1503.global</Todo> para
          cualquier consulta general y en <Todo>privacy@1503.global</Todo> para asuntos
          relativos a protección de datos.
        </p>

        {/* ────────── 15. Ley aplicable y jurisdicción ────────── */}
        <H id="s15" n="15">Ley aplicable y jurisdicción</H>
        <p style={paragraphStyle}>
          Estos Términos se rigen por la legislación <Todo>jurisdicción — sugerido España y
          Unión Europea</Todo>. Cualquier controversia derivada de los mismos se someterá a los
          juzgados y tribunales de <Todo>partido judicial — sugerido Madrid o domicilio del
          Operador</Todo>, con renuncia expresa a cualquier otro fuero que pudiera corresponder a
          las partes, salvo que el Usuario tenga la condición de consumidor, en cuyo caso será de
          aplicación la legislación tuitiva de su país de residencia y los fueros previstos por
          ésta.
        </p>

        {/* ────────── 16. Disposiciones generales ────────── */}
        <H id="s16" n="16">Disposiciones generales</H>
        <ul style={listStyle}>
          <li><strong>Nulidad parcial:</strong> si alguna cláusula resulta nula, ilegal o inejecutable, el resto permanecerá en vigor.</li>
          <li><strong>No cesión:</strong> el Usuario no podrá ceder su posición contractual ni sus derechos derivados de estos Términos sin consentimiento previo y escrito del Operador.</li>
          <li><strong>Fuerza mayor:</strong> ninguna parte responderá del incumplimiento causado por circunstancias imprevisibles o inevitables ajenas a su control razonable.</li>
          <li><strong>Acuerdo completo:</strong> estos Términos, junto con la Política de Privacidad y los consentimientos específicos aceptados durante el registro, constituyen el acuerdo completo entre las partes y reemplazan cualquier acuerdo o entendimiento previo sobre la misma materia.</li>
          <li><strong>Idioma:</strong> en caso de divergencia entre versiones lingüísticas, prevalecerá la versión en castellano.</li>
        </ul>

        {/* ────────── 17. Aceptación ────────── */}
        <H id="s17" n="17">Aceptación</H>
        <p style={paragraphStyle}>
          La aceptación de estos Términos se manifiesta marcando expresamente la casilla{' '}
          <em>«He leído y acepto los Términos de Servicio»</em> durante el registro. La
          Plataforma registrará la fecha, hora y versión aceptada para constancia. El Usuario
          puede consultar y descargar en cualquier momento la versión vigente desde su panel.
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
          <div style={{ marginBottom: '0.4rem' }}>VERSIÓN {VERSION} · ACTUALIZADO {UPDATED}</div>
          <div style={{ marginBottom: '0.4rem' }}>BORRADOR · pendiente revisión por asesor jurídico</div>
          <div>
            Documento disponible solo en español. Versión inglesa próximamente. Para otros idiomas
            escribe a <Todo>privacy@1503.global</Todo>.
          </div>
        </div>
      </div>
    </main>
  )
}
