// i18n de la HOME pública (app/page.tsx + HomeSections).
// Mismos 8 idiomas acordados que el resto del proyecto (ver app/data/i18n.ts):
// es · en · fr · de · it · pt · zh · ja. El idioma se decide en el Server
// Component con getServerLang() (cookie 1503:lang > país de alta > Accept-Language
// > 'es'), así un visitante anglófono lee la
// home en inglés sin tocar nada.
//
// REGLA: el copy debe ser FIEL A LA REALIDAD (pre-MVP sobre XRPL testnet). No
// vende como producción lo que hoy es testnet/roadmap. Radar, pagos, legal y
// certificación descritos por lo que de verdad hace el sistema.

import type { Lang } from './i18n'

export type Kpi = { value: string; unit?: string; label: string }
export type Step = { num: string; title: string; desc: string }
export type Split = { pct: number; label: string; sub: string }
export type PaymentModel = {
  num: string
  eyebrow: string
  title: string
  desc: string
  libera: string
  split: Split[]
}
export type TraceState = { num: string; label: string; sub: string }
export type CompareRow = { label: string; ours: string; bank: string; other: string }
export type Feature = { title: string; desc: string }
export type FooterCol = { titulo: string; links: string[] }
export type Seal = { seal: string; title: string; desc: string }
export type Deadline = { sector: string; year: string; note: string }

export type HomeStrings = {
  // Metadatos de la pestaña
  metaTitle: string
  metaDescription: string
  // Nombres de continente del selector del hero (clave = código `short`: NA/SA/EU/OM/AS/AF/OC)
  continentLabels: Record<string, string>
  continentAria: string
  // Hero cinemático (VoyageHero). En heroBeatC y heroTag, la palabra a resaltar
  // va entre *asteriscos* (se renderiza con <span class="hl"> / <em>).
  heroBeatA: string
  heroBeatB: string
  heroBeatC: string
  heroKicker: string
  heroTag: string
  heroEnter: string
  scrollHint: string
  langLabel: string // etiqueta accesible del selector de idioma
  // Manifesto
  manifestoEyebrow: string
  statusBadge: string
  manifestoTitleA: string
  manifestoTitleB: string
  manifestoTagline: string
  manifestoBody: string
  kpis: Kpi[]
  tags: string[]
  // Ecosistema / respaldo (social proof) — tira sutil de miembros y backers.
  // Los nombres de programa (Claude for Startups, XRPL, …) NO se traducen; solo
  // el título discreto y el conector "Miembro de".
  ecoEyebrow: string
  ecoMemberOf: string
  // ERP
  erpEyebrow: string
  erpTitleA: string
  erpTitleB: string
  erpBody: string
  erpBullets: string[]
  erpCaption: string
  erpIllusHeader: string
  // How it works
  howEyebrow: string
  howTitle: string
  howSteps: Step[]
  // Payments
  payEyebrow: string
  payTitle: string
  paySubtitle: string
  payModels: PaymentModel[]
  payLiberaPrefix: string
  payFeeLine: string // contiene el marcador {pct}, sustituido por payFeePct en negrita
  payFeePct: string // el "0,5 %" con el formato del idioma
  payFeeMono: string
  payStatusMono: string
  // Traceability
  traceEyebrow: string
  traceTitle: string
  traceSubtitle: string
  traceStates: TraceState[]
  // Comparison
  compEyebrow: string
  compTitle: string
  compSubtitle: string
  compColConcept: string
  compColBank: string
  compColMarket: string
  compRows: CompareRow[]
  // El problema + compresión de tiempo (de 5–10 días a horas)
  probEyebrow: string
  probTitle: string
  probSubtitle: string
  probItems: Feature[] // las 4 ineficiencias
  probOutcome: string
  probStatFrom: string // "5–10 días"
  probStatTo: string // "horas"
  probStatLabel: string
  // Por qué ahora — el reloj regulatorio ESPR (el DPP ya es ley)
  whyEyebrow: string
  whyTitle: string
  whySubtitle: string
  whyDeadlines: Deadline[] // textil 2027 · mueble 2028 · construcción 2027–2030
  // Radar + Vero — el trabajo pesado, automático
  autoEyebrow: string
  autoTitle: string
  autoSubtitle: string
  autoRadarTitle: string
  autoRadarDesc: string
  autoVeroTitle: string
  autoVeroDesc: string
  autoLawTitle: string
  autoLawDesc: string
  // Capa A — protocolo de confianza sobre XRP Ledger (testnet)
  protoEyebrow: string
  protoTitle: string
  protoSubtitle: string
  protoSeals: Seal[] // 3 sellos: Producto · Parte · Operación
  protoProof: string // tira mono con la prueba on-ledger
  protoBadge: string // "vivo en testnet · tx verificables"
  // Motor de cumplimiento — el cruce de leyes del mundo
  engEyebrow: string
  engTitle: string
  engSubtitle: string
  engStats: Kpi[] // 167 corredores · 177 jurisdicciones · 97 CISG · e-CMR
  engBullets: string[]
  // Web3 / tech
  techEyebrow: string
  techTitle: string
  techSubtitle: string
  techFeatures: Feature[]
  // CTA
  ctaEyebrow: string
  ctaTitleA: string
  ctaTitleB: string
  ctaBody: string
  ctaBold: string
  ctaButton: string
  // Footer
  footerTagline: string
  footerSeal: string
  footerStandards: string
  footerCols: FooterCol[]
  footerCopyright: string
  footerVersion: string
}

/* ═══════════════════════════════ ESPAÑOL (fuente) ═══════════════════════════════ */
const HOME_ES: HomeStrings = {
  metaTitle: '1503 — El internet del comercio global',
  metaDescription:
    'Infraestructura de confianza para el comercio B2B: Pasaporte Digital de Producto, cumplimiento de exportación forzado por el sistema y pago liberado contra entrega firmada.',
  continentLabels: {
    NA: 'Norteamérica',
    SA: 'Sudamérica',
    EU: 'Europa',
    OM: 'Oriente Medio',
    AS: 'Asia',
    AF: 'África',
    OC: 'Oceanía',
  },
  continentAria: 'Selector de continente',
  heroBeatA: 'En 1503, Sevilla ordenó el comercio del mundo.',
  heroBeatB: 'La Casa de Contratación registró cada ruta.',
  heroBeatC: 'Hoy, esa ruta es una *red*.',
  heroKicker: 'Pasaporte Digital de Producto · Cumplimiento de exportación',
  heroTag: 'La infraestructura que une todo el *comercio global*.',
  heroEnter: 'Elige un continente para entrar →',
  scrollHint: '↓ Sigue bajando para conocer la plataforma',
  langLabel: 'Idioma',
  manifestoEyebrow: 'QUIÉNES SOMOS',
  statusBadge: 'Pre-MVP · Núcleo vivo en XRPL testnet',
  manifestoTitleA: '1503 no es un marketplace.',
  manifestoTitleB: 'Es infraestructura para el comercio global.',
  manifestoTagline: 'Pasaporte Digital de Producto · Cumplimiento forzado por el sistema · KYC verificado',
  manifestoBody:
    'Unimos todos los sectores y todos los países en una sola herramienta de trabajo. Cada producto nace con su Pasaporte Digital: origen, materiales, certificados y la normativa de exportación que la ley exige. El cumplimiento no es opcional —es la puerta de entrada—, y la custodia del pago se libera contra entrega firmada. Cada Pasaporte se sella con un hash canónico (RFC 8785) y firma criptográfica: a prueba de manipulación y verificable por cualquier parte.',
  kpis: [
    { value: '11', label: 'Sectores con cumplimiento integrado' },
    { value: '167', label: 'Corredores legales del mundo verificados' },
    { value: '0,5', unit: '%', label: 'Comisión por operación' },
    { value: '∞', label: 'Trazabilidad del producto' },
  ],
  tags: ['Pasaporte Digital', 'Cumplimiento forzado', 'KYC verificado', 'Custodia firmada', 'Multi-sector', 'Multi-país'],
  ecoEyebrow: 'CON EL RESPALDO DEL ECOSISTEMA',
  ecoMemberOf: 'Miembro de',
  erpEyebrow: 'TU CATÁLOGO, CONFORME DESDE EL ORIGEN',
  erpTitleA: 'Conecta tu ERP una vez.',
  erpTitleB: 'Cada producto nace con su Pasaporte Digital.',
  erpBody:
    'Conectamos tu sistema ERP y cada referencia entra a tu escritorio con su Pasaporte Digital: origen, materiales, certificados y la normativa que la ley exige para exportarla. Sin web que mantener y sin rellenar fichas a mano: tu catálogo se sincroniza en tiempo real y nace conforme, listo para operar con cualquier país del mundo.',
  erpBullets: [
    'Tu ERP conectado una vez. Catálogo vivo para siempre.',
    'Cada artículo entra con su imagen, sus datos y su Pasaporte Digital de Producto.',
    'El gate de cumplimiento valida cada ficha contra la ley antes de publicarla.',
    'Un único escritorio para vender, comprar y cumplir en todo el mundo.',
  ],
  erpCaption: 'Conectores por ERP en hoja de ruta · hoy el catálogo se ingiere por radar y API',
  erpIllusHeader: 'ERP · CATÁLOGO ACTIVO',
  howEyebrow: 'EL PROCESO',
  howTitle: 'Tan sencillo como tres pasos',
  howSteps: [
    {
      num: '01',
      title: 'Cada producto nace con su Pasaporte Digital',
      desc: 'Origen, materiales, certificados y la normativa de exportación que la ley exige. Tu identidad de empresa, verificada (KYC) en todo el planeta.',
    },
    {
      num: '02',
      title: 'El gate de cumplimiento decide si puede operar',
      desc: 'El sistema valida cada ficha contra la ley y rechaza lo que no cumple. Lo no conforme no se publica ni se vende: el cumplimiento es la puerta de entrada, no un trámite final.',
    },
    {
      num: '03',
      title: 'El pago se libera contra entrega firmada',
      desc: 'La custodia se adapta a tu operación. El importe queda en depósito y se libera cuando se confirma la entrega o el hito acordado —no antes—.',
    },
  ],
  payEyebrow: 'MODELOS DE PAGO',
  payTitle: 'El pago se adapta a tu operación',
  paySubtitle:
    'Cada tipo de transacción tiene su lógica. La custodia decide cuándo libera, según el tipo de venta —producto pequeño, B2B nacional, servicio o importación—. El dinero se mueve solo cuando se cumple la condición acordada.',
  payModels: [
    {
      num: '01',
      eyebrow: 'PRODUCTO DIRECTO',
      title: 'Importes pequeños, pago directo',
      desc: 'Pensado para operaciones rápidas hasta 500 €: pago directo, sin custodia. El vendedor cobra por su rail de siempre.',
      libera: 'Inmediata',
      split: [{ pct: 100, label: 'PAGO', sub: '3 SEG · DIRECTO' }],
    },
    {
      num: '02',
      eyebrow: 'B2B NACIONAL',
      title: 'La entrega es el oráculo',
      desc: 'Pedido de empresa a empresa, importe completo en depósito. Cuando tu cliente confirma la entrega, se libera el pago.',
      libera: 'Confirmación de entrega',
      split: [{ pct: 100, label: 'ESCROW', sub: 'LIBERA AL ENTREGAR' }],
    },
    {
      num: '03',
      eyebrow: 'SERVICIOS PROFESIONALES',
      title: 'El ritmo del proyecto manda',
      desc: '50% al arrancar, 50% al cerrar. Cada tramo se libera contra hito. Sin discusiones de cobro a mitad de proyecto.',
      libera: 'Por hitos',
      split: [
        { pct: 50, label: '50%', sub: 'ARRANQUE' },
        { pct: 50, label: '50%', sub: 'CIERRE' },
      ],
    },
    {
      num: '04',
      eyebrow: 'IMPORTACIÓN INTERNACIONAL',
      title: 'El transitario libera el pago, no tu banco',
      desc: '30% al pedido, 70% en depósito. La custodia escucha al transitario y libera al confirmar la entrega del contenedor. Sin 15 días de gestión bancaria.',
      libera: 'Albarán del transitario',
      split: [
        { pct: 30, label: '30%', sub: 'PEDIDO' },
        { pct: 70, label: '70%', sub: 'TRANSITARIO' },
      ],
    },
  ],
  payLiberaPrefix: 'Liberación:',
  payFeeLine: 'Comisión 1503 del {pct} por operación. Igual para todos los modelos, sin tarifas ocultas.',
  payFeePct: '0,5 %',
  payFeeMono: 'Custodia en depósito · Liberación contra entrega firmada · Mismo coste para todos los modelos',
  payStatusMono:
    'Escrow no-custodial vivo en XRPL testnet · rails de pago fiat (pay-by-bank · Ripple Payments) en integración · 1503 nunca custodia el dinero',
  traceEyebrow: 'CONTROL TOTAL',
  traceTitle: 'Trazabilidad del pedido en cinco pasos',
  traceSubtitle:
    'Tus clientes emiten los pedidos directamente sobre tu sistema de gestión y se genera la trazabilidad del pedido, paso a paso hasta la entrega, de forma automática. El importe queda en depósito y se libera contra entrega firmada. Cada operación queda cubierta y verificable de punta a punta.',
  traceStates: [
    { num: '01', label: 'Pedido', sub: 'Confirmado' },
    { num: '02', label: 'Pago', sub: 'En depósito' },
    { num: '03', label: 'Preparación', sub: 'En almacén' },
    { num: '04', label: 'Tránsito', sub: 'En ruta' },
    { num: '05', label: 'Entrega', sub: 'Completado' },
  ],
  compEyebrow: 'POR QUÉ ELEGIRNOS',
  compTitle: 'Lo que la banca y los marketplaces no te dan',
  compSubtitle:
    'No competimos en precio, competimos en confianza: Pasaporte Digital, cumplimiento forzado por el sistema y trazabilidad total —más la custodia del pago contra entrega— en una sola capa que ni un banco ni un marketplace reúnen.',
  compColConcept: 'Concepto',
  compColBank: 'Banca',
  compColMarket: 'Marketplaces B2B',
  compRows: [
    { label: 'Pasaporte Digital de Producto', ours: 'Nativo', bank: 'No', other: 'No' },
    { label: 'Cumplimiento normativo', ours: 'Forzado por el sistema', bank: 'No', other: 'Manual' },
    { label: 'Trazabilidad del producto', ours: 'Total', bank: 'No', other: 'No' },
    { label: 'Cumplimiento de exportación', ours: 'Reglas del corredor', bank: 'No', other: 'No' },
    { label: 'KYC empresarial', ours: 'Verificado e integrado', bank: 'Documental, semanas', other: 'Parcial' },
    { label: 'Pago asegurado', ours: 'Custodia en depósito', bank: 'Escrow manual', other: 'No' },
    { label: 'Liberación del pago', ours: 'Al confirmar entrega', bank: '1 – 3 días', other: '24 – 48 h' },
    { label: 'Integración ERP', ours: 'Vía radar / API', bank: 'No', other: 'Parcial' },
    { label: 'Acceso y registro', ours: 'Gratis', bank: 'Apertura + trámites', other: 'Cuota mensual' },
    { label: 'Comisión por operación', ours: '0,5 %', bank: '1,5 – 3,5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'EL TRABAJO PESADO, AUTOMÁTICO',
  autoTitle: 'Ni fichas a mano, ni papeleo en blanco.',
  autoSubtitle:
    'Cumplir da miedo por el trabajo manual. En 1503 ese trabajo lo hace el sistema: el catálogo se llena solo y la documentación se redacta sola.',
  autoRadarTitle: 'Radar · tu catálogo se llena solo',
  autoRadarDesc:
    'Un radar barre las fuentes de tus proveedores, monta la ficha canónica de cada producto con su Pasaporte Digital y la ingiere en el core — sin re-teclear. Ya ha cargado miles de referencias reales.',
  autoVeroTitle: 'Vero · la IA que rellena el papeleo',
  autoVeroDesc:
    'La asistente de 1503 redacta por ti la documentación de cumplimiento y exportación: propone los campos del Pasaporte, los documentos y la normativa del corredor. Tú revisas y confirmas — Vero nunca firma sola.',
  autoLawTitle: 'RegTech · las leyes, vigiladas',
  autoLawDesc:
    'Cada regla de la biblioteca se ancla a su fuente oficial (EUR-Lex, boletines, autoridad competente), con su estado de revisión legal registrado. Cuando una norma cambia, se señala para que una persona la actualice — el sistema nunca reescribe el derecho solo (§0).',
  probEyebrow: 'EL PROBLEMA QUE RESOLVEMOS',
  probTitle: 'El comercio B2B sigue tardando 5–10 días. Debería tardar horas.',
  probSubtitle:
    'El comercio mundial mueve más de 30 billones de dólares al año sobre una infraestructura de confianza que apenas ha cambiado en medio siglo. Hoy está atomizada en cuatro ineficiencias:',
  probItems: [
    { title: 'Sistemas desconectados', desc: 'Los ERP no se hablan. Los tratos nacen en emails, se cierran por teléfono y se confirman por WhatsApp — perdiendo datos por el camino.' },
    { title: 'Diez herramientas sueltas', desc: 'Una PYME paga hasta diez soluciones sin integrar: cumplimiento, trazabilidad, cubicaje, aduanas, pagos, comunicaciones…' },
    { title: 'El reloj regulatorio', desc: 'La UE exige el Pasaporte Digital (ESPR) desde 2027. Las soluciones actuales son caras y para grandes consorcios — dejan fuera al 99%.' },
    { title: 'Ciclos lentos', desc: 'Sin coordinación directa entre vendedor, transitario y comprador, cada exportación se estira a 5–10 días por re-tecleo y errores.' },
  ],
  probOutcome:
    '1503 lo resuelve de raíz: producto, papeleo internacional y liquidación convergen en tiempo real en una sola fuente de verdad. Conectar con un actor de la red es integrarse con toda la red — y el ciclo cae de 5–10 días a unas horas, desde una sola pantalla.',
  probStatFrom: '5–10 días',
  probStatTo: 'horas',
  probStatLabel: 'La compresión del tiempo de operación',
  whyEyebrow: 'POR QUÉ AHORA',
  whyTitle: 'El Pasaporte Digital ya es ley.',
  whySubtitle:
    'El Reglamento de Ecodiseño de la UE (ESPR · 2024/1781) hace el DPP obligatorio por sectores. Mientras las multinacionales gastan millones en consultoría a medida, el 99% del tejido productivo —las PYMES— arriesga quedar fuera del mercado único. No empujamos el producto: capturamos una obligación legal con fecha, y 1503 es el camino de menor coste.',
  whyDeadlines: [
    { sector: 'Textil', year: '2027', note: 'Trazabilidad de materiales, composición sostenible y reciclabilidad en origen.' },
    { sector: 'Mueble', year: '2028', note: 'Origen de la madera, huella de carbono y durabilidad. Foco inicial junto al piloto Artikalia.' },
    { sector: 'Construcción y otros', year: '2027–2030', note: 'Despliegue progresivo a casi todos los bienes físicos del mercado único.' },
  ],
  protoEyebrow: 'CAPA A · LA CAPA DE CONFIANZA',
  protoTitle: 'Anclado en el XRP Ledger.',
  protoSubtitle:
    'Bajo cada operación, un protocolo no-custodial une producto, identidad y pago en una sola verdad verificable. Vivo en XRPL testnet, con transacciones públicas.',
  protoSeals: [
    { seal: 'PRODUCTO', title: 'El Pasaporte, anclado', desc: 'El DPP se sella con un hash canónico (RFC 8785) firmado ed25519 y se ancla en el ledger. Re-verificable contra la cadena, no contra nuestra base de datos.' },
    { seal: 'PARTE', title: 'Identidad con llave propia', desc: 'Cada empresa recibe un id digital inmutable y llaves ed25519. Cada firma —custodia, e-CMR— queda ligada a una identidad real.' },
    { seal: 'OPERACIÓN', title: 'Pago no-custodial', desc: 'Escrow nativo: el importe se bloquea y se libera contra entrega verificada por el oráculo. 1503 nunca toca el dinero; si nada se cumple, el backstop lo devuelve.' },
  ],
  protoProof: 'Anclaje del DPP y escrow nativo con cripto-condición · probados en XRPL testnet con transacciones públicas (20 XRP) · escrow de RLUSD (TokenEscrow XLS-85) probado con emisor propio de pruebas, pendiente con el emisor oficial',
  protoBadge: 'Vivo en XRPL testnet · transacciones verificables en el explorador',
  engEyebrow: 'EL MOTOR DE CUMPLIMIENTO',
  engTitle: 'El cruce de leyes del mundo, en código.',
  engSubtitle:
    'No es una tabla de países: es un motor composicional que arma las obligaciones de cada corredor y bloquea lo que la ley prohíbe —antes de operar, no después.',
  engStats: [
    { value: '167', label: 'Corredores de importación' },
    { value: '177', label: 'Jurisdicciones KYB mapeadas' },
    { value: '97', label: 'Estados CISG cableados' },
    { value: 'ed25519', label: 'e-CMR firmado · 3 momentos' },
  ],
  engBullets: [
    'Gate de exportación fail-closed: si el destino o la parte no superan el cribado (OFAC · UE · ONU), la operación no se confirma.',
    'Juego documental UCP 600 + e-CMR firmado ed25519 en los 3 momentos: remitente, porteador y entrega.',
    'Radar de catálogo: barre proveedores reales y alimenta el core en automático (3.159 fichas ya cargadas).',
  ],
  techEyebrow: 'TECNOLOGÍA',
  techTitle: 'Infraestructura verificable',
  techSubtitle:
    'Un Pasaporte Digital por producto, un gate de cumplimiento que rechaza lo que la ley prohíbe, custodia del pago con liberación contra entrega firmada y una identidad verificada por operación. Todo trazable y auditable por cualquier parte autorizada.',
  techFeatures: [
    {
      title: 'Identidad verificada (KYC)',
      desc: 'KYC integrado para empresas. Cada operación está vinculada a una identidad real, verificada contra registros públicos oficiales.',
    },
    {
      title: 'Pago contra entrega firmada',
      desc: 'El importe queda en depósito y se libera cuando se confirma la entrega o el hito acordado. Sin esperar semanas a un banco intermediario.',
    },
    {
      title: 'Cumplimiento forzado por el sistema',
      desc: 'El gate de cumplimiento exige, en código, los datos y certificados que la ley pide para exportar. Lo que la norma prohíbe, no pasa.',
    },
    {
      title: 'Tres oráculos para una sola realidad',
      desc: 'Notario, albarán del transitario u Owner Key del comprador. El pago solo se libera cuando un oráculo autorizado confirma que la operación se ha cumplido.',
    },
    {
      title: 'Videollamada con subtítulos traducidos',
      desc: 'Llamadas 1-a-1 (WebRTC) con subtítulos traducidos en vivo, para negociar entre países sin barrera de idioma.',
    },
    {
      title: 'La blockchain es invisible',
      desc: 'Sin claves, sin gas, sin jerga: se entra con un código por email y se piensa en euros. La PYME opera un escritorio B2B normal; el XRP Ledger trabaja debajo, como la base de datos de tu banco.',
    },
  ],
  ctaEyebrow: 'ÚNETE HOY',
  ctaTitleA: 'Bienvenido al internet',
  ctaTitleB: 'del comercio global',
  ctaBody:
    'Únete a la infraestructura que conecta a todos los actores del comercio global: Pasaporte Digital de Producto, cumplimiento de exportación y pago liberado contra entrega firmada.',
  ctaBold: 'Registro gratuito · Sin permanencia · 0,5 % por transacción.',
  ctaButton: 'Selecciona tu continente ↑',
  footerTagline: 'Infraestructura para el comercio global.',
  footerSeal: 'Pasaporte Digital · Cumplimiento de exportación',
  footerStandards: 'Estándares · DPP · ISO 20022 · UCP 600\nGDPR · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Plataforma', links: ['Cómo funciona', 'Sectores', 'Inversores', 'Demo'] },
    { titulo: 'Sectores', links: ['Inmobiliario', 'Automoción', 'Salud', 'Alimentación', 'Transporte'] },
    { titulo: 'Para quién', links: ['Compradores', 'Profesionales', 'Proveedores'] },
    { titulo: 'Legal', links: ['Privacidad', 'Términos', 'Cookies', 'Cumplimiento'] },
  ],
  footerCopyright: '© 2026 1503 — Infraestructura de cumplimiento del comercio global',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ ENGLISH ═══════════════════════════════ */
const HOME_EN: HomeStrings = {
  metaTitle: '1503 — The internet of global trade',
  metaDescription:
    'Trust infrastructure for B2B trade: Digital Product Passport, export compliance enforced by the system, and payment released against signed delivery.',
  continentLabels: {
    NA: 'North America',
    SA: 'South America',
    EU: 'Europe',
    OM: 'Middle East',
    AS: 'Asia',
    AF: 'Africa',
    OC: 'Oceania',
  },
  continentAria: 'Continent selector',
  heroBeatA: 'In 1503, Seville set the order of world trade.',
  heroBeatB: 'The House of Trade recorded every route.',
  heroBeatC: 'Today, that route is a *network*.',
  heroKicker: 'Digital Product Passport · Export compliance',
  heroTag: 'The infrastructure that unites all of *global trade*.',
  heroEnter: 'Pick a continent to enter →',
  scrollHint: '↓ Keep scrolling to explore the platform',
  langLabel: 'Language',
  manifestoEyebrow: 'WHO WE ARE',
  statusBadge: 'Pre-MVP · Core live on XRPL testnet',
  manifestoTitleA: '1503 is not a marketplace.',
  manifestoTitleB: 'It is infrastructure for global trade.',
  manifestoTagline: 'Digital Product Passport · Compliance enforced by the system · Verified KYC',
  manifestoBody:
    'We bring every sector and every country into a single working tool. Each product is born with its Digital Product Passport: origin, materials, certificates and the export rules the law requires. Compliance is not optional —it is the entry gate—, and payment custody is released against signed delivery. Every Passport is sealed with a canonical hash (RFC 8785) and a cryptographic signature: tamper-proof and verifiable by any party.',
  kpis: [
    { value: '11', label: 'Sectors with built-in compliance' },
    { value: '167', label: 'Legal trade corridors of the world verified' },
    { value: '0.5', unit: '%', label: 'Fee per operation' },
    { value: '∞', label: 'Product traceability' },
  ],
  tags: ['Digital Passport', 'Enforced compliance', 'Verified KYC', 'Signed custody', 'Multi-sector', 'Multi-country'],
  ecoEyebrow: 'BACKED BY THE ECOSYSTEM',
  ecoMemberOf: 'Member of',
  erpEyebrow: 'YOUR CATALOG, COMPLIANT FROM THE SOURCE',
  erpTitleA: 'Connect your ERP once.',
  erpTitleB: 'Every product is born with its Digital Passport.',
  erpBody:
    'We connect your ERP system and every item enters your workspace with its Digital Passport: origin, materials, certificates and the rules the law requires to export it. No website to maintain and no filling in records by hand: your catalog syncs in real time and is born compliant, ready to trade with any country in the world.',
  erpBullets: [
    'Your ERP connected once. A live catalog forever.',
    'Every item enters with its image, its data and its Digital Product Passport.',
    'The compliance gate validates each record against the law before publishing it.',
    'A single workspace to sell, buy and comply worldwide.',
  ],
  erpCaption: 'Per-ERP connectors on the roadmap · today the catalog is ingested via radar and API',
  erpIllusHeader: 'ERP · ACTIVE CATALOG',
  howEyebrow: 'THE PROCESS',
  howTitle: 'As simple as three steps',
  howSteps: [
    {
      num: '01',
      title: 'Every product is born with its Digital Passport',
      desc: 'Origin, materials, certificates and the export rules the law requires. Your company identity, verified (KYC) across the planet.',
    },
    {
      num: '02',
      title: 'The compliance gate decides if it can trade',
      desc: 'The system validates each record against the law and rejects what does not comply. Non-compliant items are neither published nor sold: compliance is the entry gate, not a final formality.',
    },
    {
      num: '03',
      title: 'Payment is released against signed delivery',
      desc: 'Custody adapts to your operation. The amount is held in deposit and released when delivery or the agreed milestone is confirmed —not before—.',
    },
  ],
  payEyebrow: 'PAYMENT MODELS',
  payTitle: 'Payment adapts to your operation',
  paySubtitle:
    'Every type of transaction has its own logic. Custody decides when it releases, based on the kind of sale —small product, domestic B2B, service or import—. Money moves only when the agreed condition is met.',
  payModels: [
    {
      num: '01',
      eyebrow: 'DIRECT PRODUCT',
      title: 'Small amounts, direct payment',
      desc: 'Made for quick operations up to €500: direct payment, no custody. The seller gets paid through their usual rail.',
      libera: 'Immediate',
      split: [{ pct: 100, label: 'PAYMENT', sub: '3 SEC · DIRECT' }],
    },
    {
      num: '02',
      eyebrow: 'DOMESTIC B2B',
      title: 'Delivery is the oracle',
      desc: 'Company-to-company order, full amount in deposit. When your customer confirms delivery, the payment is released.',
      libera: 'Delivery confirmation',
      split: [{ pct: 100, label: 'ESCROW', sub: 'RELEASES ON DELIVERY' }],
    },
    {
      num: '03',
      eyebrow: 'PROFESSIONAL SERVICES',
      title: 'The project sets the pace',
      desc: '50% at kickoff, 50% at closing. Each tranche releases against a milestone. No arguments over payment mid-project.',
      libera: 'By milestones',
      split: [
        { pct: 50, label: '50%', sub: 'KICKOFF' },
        { pct: 50, label: '50%', sub: 'CLOSING' },
      ],
    },
    {
      num: '04',
      eyebrow: 'INTERNATIONAL IMPORT',
      title: 'The freight forwarder releases payment, not your bank',
      desc: '30% on order, 70% in deposit. Custody listens to the freight forwarder and releases when container delivery is confirmed. No 15 days of bank processing.',
      libera: 'Freight forwarder’s delivery note',
      split: [
        { pct: 30, label: '30%', sub: 'ORDER' },
        { pct: 70, label: '70%', sub: 'FORWARDER' },
      ],
    },
  ],
  payLiberaPrefix: 'Release:',
  payFeeLine: '1503 fee of {pct} per operation. The same for every model, with no hidden charges.',
  payFeePct: '0.5 %',
  payFeeMono: 'Funds held in deposit · Released against signed delivery · Same cost for every model',
  payStatusMono:
    'Non-custodial escrow live on XRPL testnet · fiat payment rails (pay-by-bank · Ripple Payments) under integration · 1503 never holds the money',
  traceEyebrow: 'FULL CONTROL',
  traceTitle: 'Order traceability in five steps',
  traceSubtitle:
    'Your customers place orders directly on your management system and the order’s traceability is generated automatically, step by step, all the way to delivery. The amount is held in deposit and released against signed delivery. Every operation is covered and verifiable end to end.',
  traceStates: [
    { num: '01', label: 'Order', sub: 'Confirmed' },
    { num: '02', label: 'Payment', sub: 'In deposit' },
    { num: '03', label: 'Preparation', sub: 'In warehouse' },
    { num: '04', label: 'Transit', sub: 'En route' },
    { num: '05', label: 'Delivery', sub: 'Completed' },
  ],
  compEyebrow: 'WHY CHOOSE US',
  compTitle: 'What banks and marketplaces don’t give you',
  compSubtitle:
    'We don’t compete on price, we compete on trust: Digital Passport, compliance enforced by the system and full traceability —plus payment custody against delivery— in a single layer that neither a bank nor a marketplace brings together.',
  compColConcept: 'Concept',
  compColBank: 'Banks',
  compColMarket: 'B2B Marketplaces',
  compRows: [
    { label: 'Digital Product Passport', ours: 'Native', bank: 'No', other: 'No' },
    { label: 'Regulatory compliance', ours: 'Enforced by the system', bank: 'No', other: 'Manual' },
    { label: 'Product traceability', ours: 'Full', bank: 'No', other: 'No' },
    { label: 'Export compliance', ours: 'Corridor rules', bank: 'No', other: 'No' },
    { label: 'Corporate KYC', ours: 'Verified and integrated', bank: 'Paperwork, weeks', other: 'Partial' },
    { label: 'Secured payment', ours: 'Funds in deposit', bank: 'Manual escrow', other: 'No' },
    { label: 'Payment release', ours: 'On delivery confirmation', bank: '1 – 3 days', other: '24 – 48 h' },
    { label: 'ERP integration', ours: 'Via radar / API', bank: 'No', other: 'Partial' },
    { label: 'Access and registration', ours: 'Free', bank: 'Account opening + paperwork', other: 'Monthly fee' },
    { label: 'Fee per operation', ours: '0.5 %', bank: '1.5 – 3.5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'THE BUSYWORK, AUTOMATED',
  autoTitle: 'No data entry by hand, no blank paperwork.',
  autoSubtitle:
    'Compliance is daunting because of the manual work. In 1503 the system does it: the catalog fills itself and the documentation drafts itself.',
  autoRadarTitle: 'Radar · your catalog fills itself',
  autoRadarDesc:
    'A radar sweeps your suppliers’ sources, builds each product’s canonical card with its Digital Passport and ingests it into the core — no re-keying. It has already loaded thousands of real items.',
  autoVeroTitle: 'Vero · the AI that fills the paperwork',
  autoVeroDesc:
    '1503’s assistant drafts your compliance and export documentation: it proposes the Passport fields, the documents and the corridor’s rules. You review and confirm — Vero never signs on its own.',
  autoLawTitle: 'RegTech · the law, watched',
  autoLawDesc:
    'Every rule in the library is anchored to its official source (EUR-Lex, national gazettes, competent authorities), with its legal-review status tracked. When a rule changes, it’s flagged for a person to update — the system never rewrites regulation on its own (§0).',
  probEyebrow: 'THE PROBLEM WE SOLVE',
  probTitle: 'B2B trade still takes 5–10 days. It should take hours.',
  probSubtitle:
    'Global trade moves more than $30 trillion a year on a trust infrastructure that has barely changed in half a century. Today it is atomized into four inefficiencies:',
  probItems: [
    { title: 'Disconnected systems', desc: 'ERPs don’t talk to each other. Deals are born in emails, run over the phone and confirmed on WhatsApp — losing essential data along the way.' },
    { title: 'Ten separate tools', desc: 'A typical SME pays for up to ten unintegrated solutions: compliance, traceability, cubing, customs, payments, communications…' },
    { title: 'The regulatory clock', desc: 'The EU mandates the Digital Product Passport (ESPR) from 2027. Today’s solutions are expensive and built for large consortia — leaving out 99%.' },
    { title: 'Slow cycles', desc: 'With no direct coordination between seller, forwarder and buyer, each export stretches to 5–10 days through re-keying and errors.' },
  ],
  probOutcome:
    '1503 solves this at the root: product, international paperwork and settlement converge in real time into a single source of truth. Connecting to one actor on the network means integrating with the whole network — and the cycle drops from 5–10 days to a few hours, from a single screen.',
  probStatFrom: '5–10 days',
  probStatTo: 'hours',
  probStatLabel: 'The compression of operating time',
  whyEyebrow: 'WHY NOW',
  whyTitle: 'The Digital Product Passport is already law.',
  whySubtitle:
    'The EU Ecodesign Regulation (ESPR · 2024/1781) makes the DPP mandatory by sector. While multinationals spend millions on bespoke consultancy, the 99% of the productive fabric —SMEs— risk being excluded from the single market. We don’t push a product: we capture a dated legal obligation, and 1503 is the lowest-cost path.',
  whyDeadlines: [
    { sector: 'Textiles', year: '2027', note: 'Material traceability, sustainable composition and recyclability at origin.' },
    { sector: 'Furniture', year: '2028', note: 'Wood provenance, carbon footprint and durability. Initial focus alongside the Artikalia pilot.' },
    { sector: 'Construction & others', year: '2027–2030', note: 'Progressive rollout across virtually all physical goods in the single market.' },
  ],
  protoEyebrow: 'LAYER A · THE TRUST LAYER',
  protoTitle: 'Anchored on the XRP Ledger.',
  protoSubtitle:
    'Beneath every operation, a non-custodial protocol binds product, identity and payment into one verifiable truth. Live on XRPL testnet, with public transactions.',
  protoSeals: [
    { seal: 'PRODUCT', title: 'The Passport, anchored', desc: 'The DPP is sealed with a canonical hash (RFC 8785) signed with ed25519 and anchored on the ledger. Re-verifiable against the chain, not against our database.' },
    { seal: 'PARTY', title: 'Identity with its own key', desc: 'Every company gets an immutable digital ID and ed25519 keys. Every signature —custody, e-CMR— is tied to a real identity.' },
    { seal: 'OPERATION', title: 'Non-custodial payment', desc: 'Native escrow: the amount is locked and released against delivery verified by the oracle. 1503 never touches the money; if nothing is fulfilled, the backstop returns it.' },
  ],
  protoProof: 'DPP anchoring and native escrow with crypto-condition · proven on XRPL testnet with public transactions (20 XRP) · RLUSD escrow (TokenEscrow XLS-85) proven with our own test issuer, pending with the official issuer',
  protoBadge: 'Live on XRPL testnet · transactions verifiable on the explorer',
  engEyebrow: 'THE COMPLIANCE ENGINE',
  engTitle: 'The world’s laws, crossed in code.',
  engSubtitle:
    'Not a table of countries: a compositional engine that assembles each corridor’s obligations and blocks what the law forbids —before trading, not after.',
  engStats: [
    { value: '167', label: 'Import corridors' },
    { value: '177', label: 'KYB jurisdictions mapped' },
    { value: '97', label: 'CISG states wired in' },
    { value: 'ed25519', label: 'e-CMR signed · 3 moments' },
  ],
  engBullets: [
    'Fail-closed export gate: if the destination or a party doesn’t pass screening (OFAC · EU · UN), the operation is not confirmed.',
    'UCP 600 document set + e-CMR signed with ed25519 at all three moments: sender, carrier and delivery.',
    'Catalog radar: it sweeps real suppliers and feeds the core automatically (3,159 items already loaded).',
  ],
  techEyebrow: 'TECHNOLOGY',
  techTitle: 'Verifiable infrastructure',
  techSubtitle:
    'One Digital Passport per product, a compliance gate that rejects what the law forbids, payment custody released against signed delivery and an identity verified per operation. All traceable and auditable by any authorized party.',
  techFeatures: [
    {
      title: 'Verified identity (KYC)',
      desc: 'Built-in KYC for companies. Every operation is tied to a real identity, verified against official public registries.',
    },
    {
      title: 'Payment against signed delivery',
      desc: 'The amount is held in deposit and released when delivery or the agreed milestone is confirmed. No waiting weeks for an intermediary bank.',
    },
    {
      title: 'Compliance enforced by the system',
      desc: 'The compliance gate requires, in code, the data and certificates the law demands to export. What the rules forbid does not get through.',
    },
    {
      title: 'Three oracles for a single truth',
      desc: 'A notary, the freight forwarder’s delivery note, or the buyer’s Owner Key. Payment is only released when an authorized oracle confirms the operation has been fulfilled.',
    },
    {
      title: 'Video calls with translated subtitles',
      desc: '1-on-1 calls (WebRTC) with live translated subtitles, to negotiate across countries with no language barrier.',
    },
    {
      title: 'The blockchain is invisible',
      desc: 'No keys, no gas, no jargon: you sign in with an email code and think in euros. The SME runs an ordinary B2B desktop; the XRP Ledger works underneath — like the database behind your bank.',
    },
  ],
  ctaEyebrow: 'JOIN TODAY',
  ctaTitleA: 'Welcome to the internet',
  ctaTitleB: 'of global trade',
  ctaBody:
    'Join the infrastructure that connects every actor in global trade: Digital Product Passport, export compliance and payment released against signed delivery.',
  ctaBold: 'Free registration · No lock-in · 0.5 % per transaction.',
  ctaButton: 'Pick your continent ↑',
  footerTagline: 'Infrastructure for global trade.',
  footerSeal: 'Digital Passport · Export compliance',
  footerStandards: 'Standards · DPP · ISO 20022 · UCP 600\nGDPR · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Platform', links: ['How it works', 'Sectors', 'Investors', 'Demo'] },
    { titulo: 'Sectors', links: ['Real estate', 'Automotive', 'Healthcare', 'Food', 'Transport'] },
    { titulo: 'For whom', links: ['Buyers', 'Professionals', 'Suppliers'] },
    { titulo: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Compliance'] },
  ],
  footerCopyright: '© 2026 1503 — Compliance infrastructure for global trade',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ FRANÇAIS ═══════════════════════════════ */
const HOME_FR: HomeStrings = {
  metaTitle: '1503 — L’internet du commerce mondial',
  metaDescription:
    'Infrastructure de confiance pour le commerce B2B : Passeport Numérique de Produit, conformité à l’export imposée par le système et paiement libéré contre livraison signée.',
  continentLabels: { NA: 'Amérique du Nord', SA: 'Amérique du Sud', EU: 'Europe', OM: 'Moyen-Orient', AS: 'Asie', AF: 'Afrique', OC: 'Océanie' },
  continentAria: 'Sélecteur de continent',
  heroBeatA: 'En 1503, Séville a ordonné le commerce du monde.',
  heroBeatB: 'La Maison de commerce consignait chaque route.',
  heroBeatC: 'Aujourd’hui, cette route est un *réseau*.',
  heroKicker: 'Passeport Numérique de Produit · Conformité à l’export',
  heroTag: 'L’infrastructure qui unit tout le *commerce mondial*.',
  heroEnter: 'Choisissez un continent pour entrer →',
  scrollHint: '↓ Continuez à défiler pour découvrir la plateforme',
  langLabel: 'Langue',
  manifestoEyebrow: 'QUI NOUS SOMMES',
  statusBadge: 'Pré-MVP · Cœur en service sur le testnet XRPL',
  manifestoTitleA: '1503 n’est pas une place de marché.',
  manifestoTitleB: 'C’est une infrastructure pour le commerce mondial.',
  manifestoTagline: 'Passeport Numérique de Produit · Conformité imposée par le système · KYC vérifié',
  manifestoBody:
    'Nous réunissons tous les secteurs et tous les pays dans un seul outil de travail. Chaque produit naît avec son Passeport Numérique : origine, matériaux, certificats et les règles d’exportation exigées par la loi. La conformité n’est pas optionnelle —c’est la porte d’entrée—, et le séquestre du paiement est libéré contre livraison signée. Chaque Passeport est scellé par un hachage canonique (RFC 8785) et une signature cryptographique : inviolable et vérifiable par toute partie.',
  kpis: [
    { value: '11', label: 'Secteurs avec conformité intégrée' },
    { value: '167', label: 'Corridors commerciaux légaux du monde vérifiés' },
    { value: '0,5', unit: '%', label: 'Commission par opération' },
    { value: '∞', label: 'Traçabilité du produit' },
  ],
  tags: ['Passeport Numérique', 'Conformité imposée', 'KYC vérifié', 'Séquestre signé', 'Multi-secteur', 'Multi-pays'],
  ecoEyebrow: "SOUTENU PAR L'ÉCOSYSTÈME",
  ecoMemberOf: 'Membre de',
  erpEyebrow: 'VOTRE CATALOGUE, CONFORME DÈS LA SOURCE',
  erpTitleA: 'Connectez votre ERP une fois.',
  erpTitleB: 'Chaque produit naît avec son Passeport Numérique.',
  erpBody:
    'Nous connectons votre système ERP et chaque référence entre dans votre bureau avec son Passeport Numérique : origine, matériaux, certificats et les règles exigées par la loi pour l’exporter. Aucun site à maintenir et aucune fiche à remplir à la main : votre catalogue se synchronise en temps réel et naît conforme, prêt à commercer avec n’importe quel pays du monde.',
  erpBullets: [
    'Votre ERP connecté une fois. Un catalogue vivant pour toujours.',
    'Chaque article entre avec son image, ses données et son Passeport Numérique de Produit.',
    'Le contrôle de conformité valide chaque fiche face à la loi avant de la publier.',
    'Un seul bureau pour vendre, acheter et se conformer dans le monde entier.',
  ],
  erpCaption: 'Connecteurs par ERP sur la feuille de route · aujourd’hui le catalogue est ingéré via radar et API',
  erpIllusHeader: 'ERP · CATALOGUE ACTIF',
  howEyebrow: 'LE PROCESSUS',
  howTitle: 'Aussi simple que trois étapes',
  howSteps: [
    { num: '01', title: 'Chaque produit naît avec son Passeport Numérique', desc: 'Origine, matériaux, certificats et les règles d’exportation exigées par la loi. Votre identité d’entreprise, vérifiée (KYC) partout sur la planète.' },
    { num: '02', title: 'Le contrôle de conformité décide s’il peut commercer', desc: 'Le système valide chaque fiche face à la loi et rejette ce qui n’est pas conforme. Le non-conforme n’est ni publié ni vendu : la conformité est la porte d’entrée, pas une formalité finale.' },
    { num: '03', title: 'Le paiement est libéré contre livraison signée', desc: 'Le séquestre s’adapte à votre opération. Le montant reste en dépôt et se libère lorsque la livraison ou le jalon convenu est confirmé —pas avant—.' },
  ],
  payEyebrow: 'MODÈLES DE PAIEMENT',
  payTitle: 'Le paiement s’adapte à votre opération',
  paySubtitle:
    'Chaque type de transaction a sa logique. Le séquestre décide quand il libère, selon le type de vente —petit produit, B2B national, service ou import—. L’argent ne bouge que lorsque la condition convenue est remplie.',
  payModels: [
    { num: '01', eyebrow: 'PRODUIT DIRECT', title: 'Petits montants, paiement direct', desc: 'Pensé pour des opérations rapides jusqu’à 500 € : paiement direct, sans séquestre. Le vendeur est payé par son canal habituel.', libera: 'Immédiate', split: [{ pct: 100, label: 'PAIEMENT', sub: '3 SEC · DIRECT' }] },
    { num: '02', eyebrow: 'B2B NATIONAL', title: 'La livraison est l’oracle', desc: 'Commande d’entreprise à entreprise, montant total en dépôt. Quand votre client confirme la livraison, le paiement est libéré.', libera: 'Confirmation de livraison', split: [{ pct: 100, label: 'ESCROW', sub: 'LIBÈRE À LA LIVRAISON' }] },
    { num: '03', eyebrow: 'SERVICES PROFESSIONNELS', title: 'Le projet donne le rythme', desc: '50 % au démarrage, 50 % à la clôture. Chaque tranche se libère sur jalon. Sans disputes de paiement en cours de projet.', libera: 'Par jalons', split: [{ pct: 50, label: '50%', sub: 'DÉMARRAGE' }, { pct: 50, label: '50%', sub: 'CLÔTURE' }] },
    { num: '04', eyebrow: 'IMPORT INTERNATIONAL', title: 'Le transitaire libère le paiement, pas votre banque', desc: '30 % à la commande, 70 % en dépôt. Le séquestre écoute le transitaire et libère à la confirmation de livraison du conteneur. Sans 15 jours de traitement bancaire.', libera: 'Bon de livraison du transitaire', split: [{ pct: 30, label: '30%', sub: 'COMMANDE' }, { pct: 70, label: '70%', sub: 'TRANSITAIRE' }] },
  ],
  payLiberaPrefix: 'Libération :',
  payFeeLine: 'Commission 1503 de {pct} par opération. Identique pour tous les modèles, sans frais cachés.',
  payFeePct: '0,5 %',
  payFeeMono: 'Fonds en dépôt · Libérés contre livraison signée · Même coût pour tous les modèles',
  payStatusMono:
    'Séquestre non dépositaire en service sur le testnet XRPL · rails de paiement fiat (pay-by-bank · Ripple Payments) en cours d’intégration · 1503 ne détient jamais l’argent',
  traceEyebrow: 'CONTRÔLE TOTAL',
  traceTitle: 'Traçabilité de la commande en cinq étapes',
  traceSubtitle:
    'Vos clients passent leurs commandes directement sur votre système de gestion et la traçabilité de la commande se génère automatiquement, étape par étape, jusqu’à la livraison. Le montant reste en dépôt et se libère contre livraison signée. Chaque opération est couverte et vérifiable de bout en bout.',
  traceStates: [
    { num: '01', label: 'Commande', sub: 'Confirmée' },
    { num: '02', label: 'Paiement', sub: 'En dépôt' },
    { num: '03', label: 'Préparation', sub: 'En entrepôt' },
    { num: '04', label: 'Transit', sub: 'En route' },
    { num: '05', label: 'Livraison', sub: 'Terminée' },
  ],
  compEyebrow: 'POURQUOI NOUS CHOISIR',
  compTitle: 'Ce que les banques et les places de marché ne vous offrent pas',
  compSubtitle:
    'Nous ne rivalisons pas sur le prix, mais sur la confiance : Passeport Numérique, conformité imposée par le système et traçabilité totale —plus le séquestre du paiement contre livraison— en une seule couche que ni une banque ni une place de marché ne réunissent.',
  compColConcept: 'Concept',
  compColBank: 'Banques',
  compColMarket: 'Places de marché B2B',
  compRows: [
    { label: 'Passeport Numérique de Produit', ours: 'Natif', bank: 'Non', other: 'Non' },
    { label: 'Conformité réglementaire', ours: 'Imposée par le système', bank: 'Non', other: 'Manuelle' },
    { label: 'Traçabilité du produit', ours: 'Totale', bank: 'Non', other: 'Non' },
    { label: 'Conformité à l’export', ours: 'Règles du corridor', bank: 'Non', other: 'Non' },
    { label: 'KYC entreprise', ours: 'Vérifié et intégré', bank: 'Paperasse, semaines', other: 'Partiel' },
    { label: 'Paiement sécurisé', ours: 'Fonds en dépôt', bank: 'Séquestre manuel', other: 'Non' },
    { label: 'Libération du paiement', ours: 'À la confirmation de livraison', bank: '1 – 3 jours', other: '24 – 48 h' },
    { label: 'Intégration ERP', ours: 'Via radar / API', bank: 'Non', other: 'Partiel' },
    { label: 'Accès et inscription', ours: 'Gratuit', bank: 'Ouverture + démarches', other: 'Abonnement mensuel' },
    { label: 'Commission par opération', ours: '0,5 %', bank: '1,5 – 3,5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'LE TRAVAIL FASTIDIEUX, AUTOMATISÉ',
  autoTitle: 'Ni saisie à la main, ni paperasse à remplir de zéro.',
  autoSubtitle:
    'La conformité fait peur à cause du travail manuel. Chez 1503, ce travail, c’est le système qui le fait : le catalogue se remplit tout seul et la documentation se rédige toute seule.',
  autoRadarTitle: 'Radar · votre catalogue se remplit tout seul',
  autoRadarDesc:
    'Un radar balaie les sources de vos fournisseurs, monte la fiche canonique de chaque produit avec son Passeport Numérique et l’ingère dans le cœur — sans ressaisie. Il a déjà chargé des milliers de références réelles.',
  autoVeroTitle: 'Vero · l’IA qui remplit la paperasse',
  autoVeroDesc:
    'L’assistante de 1503 rédige pour vous la documentation de conformité et d’export : elle propose les champs du Passeport, les documents et les règles du corridor. Vous relisez et confirmez — Vero ne signe jamais seule.',
  autoLawTitle: 'RegTech · les lois, surveillées',
  autoLawDesc:
    'Chaque règle de la bibliothèque est ancrée à sa source officielle (EUR-Lex, journaux officiels, autorité compétente), avec son statut de revue juridique suivi. Quand une norme change, elle est signalée pour qu’une personne la mette à jour — le système ne réécrit jamais le droit tout seul (§0).',
  probEyebrow: 'LE PROBLÈME QUE NOUS RÉSOLVONS',
  probTitle: 'Le commerce B2B prend encore 5–10 jours. Il devrait prendre des heures.',
  probSubtitle:
    'Le commerce mondial déplace plus de 30 000 milliards de dollars par an sur une infrastructure de confiance qui n’a quasiment pas changé en un demi-siècle. Aujourd’hui, elle est atomisée en quatre inefficacités :',
  probItems: [
    { title: 'Des systèmes déconnectés', desc: 'Les ERP ne se parlent pas. Les affaires naissent dans les emails, se traitent au téléphone et se confirment sur WhatsApp — en perdant des données en route.' },
    { title: 'Dix outils épars', desc: 'Une PME paie jusqu’à dix solutions non intégrées : conformité, traçabilité, cubage, douanes, paiements, communications…' },
    { title: 'L’horloge réglementaire', desc: 'L’UE impose le Passeport Numérique (ESPR) dès 2027. Les solutions actuelles sont chères et pensées pour de grands consortiums — elles laissent 99 % de côté.' },
    { title: 'Des cycles lents', desc: 'Sans coordination directe entre vendeur, transitaire et acheteur, chaque export s’étire sur 5–10 jours par ressaisie et erreurs.' },
  ],
  probOutcome:
    '1503 résout cela à la racine : produit, paperasse internationale et règlement convergent en temps réel en une seule source de vérité. Se connecter à un acteur du réseau, c’est s’intégrer à tout le réseau — et le cycle passe de 5–10 jours à quelques heures, depuis un seul écran.',
  probStatFrom: '5–10 jours',
  probStatTo: 'heures',
  probStatLabel: 'La compression du temps d’opération',
  whyEyebrow: 'POURQUOI MAINTENANT',
  whyTitle: 'Le Passeport Numérique est déjà la loi.',
  whySubtitle:
    'Le règlement Écoconception de l’UE (ESPR · 2024/1781) rend le DPP obligatoire par secteur. Pendant que les multinationales dépensent des millions en conseil sur mesure, 99 % du tissu productif —les PME— risquent d’être exclues du marché unique. Nous ne poussons pas un produit : nous captons une obligation légale datée, et 1503 est la voie la moins coûteuse.',
  whyDeadlines: [
    { sector: 'Textile', year: '2027', note: 'Traçabilité des matériaux, composition durable et recyclabilité à l’origine.' },
    { sector: 'Meuble', year: '2028', note: 'Provenance du bois, empreinte carbone et durabilité. Focus initial avec le pilote Artikalia.' },
    { sector: 'Construction & autres', year: '2027–2030', note: 'Déploiement progressif à presque tous les biens physiques du marché unique.' },
  ],
  protoEyebrow: 'COUCHE A · LA COUCHE DE CONFIANCE',
  protoTitle: 'Ancré sur le XRP Ledger.',
  protoSubtitle:
    'Sous chaque opération, un protocole non dépositaire relie produit, identité et paiement en une seule vérité vérifiable. En service sur le testnet XRPL, avec des transactions publiques.',
  protoSeals: [
    { seal: 'PRODUIT', title: 'Le Passeport, ancré', desc: 'Le DPP est scellé par un hachage canonique (RFC 8785) signé ed25519 et ancré sur le ledger. Re-vérifiable face à la chaîne, pas face à notre base de données.' },
    { seal: 'PARTIE', title: 'Une identité, sa clé', desc: 'Chaque entreprise reçoit un identifiant numérique immuable et des clés ed25519. Chaque signature —séquestre, e-CMR— est liée à une identité réelle.' },
    { seal: 'OPÉRATION', title: 'Paiement non dépositaire', desc: 'Séquestre natif : le montant est bloqué et libéré contre livraison vérifiée par l’oracle. 1503 ne touche jamais l’argent ; si rien n’est accompli, le backstop le rend.' },
  ],
  protoProof: 'Ancrage du DPP et séquestre natif avec crypto-condition · prouvés sur le testnet XRPL avec des transactions publiques (20 XRP) · séquestre de RLUSD (TokenEscrow XLS-85) prouvé avec notre propre émetteur de test, en attente avec l’émetteur officiel',
  protoBadge: 'En service sur le testnet XRPL · transactions vérifiables sur l’explorateur',
  engEyebrow: 'LE MOTEUR DE CONFORMITÉ',
  engTitle: 'Les lois du monde, croisées dans le code.',
  engSubtitle:
    'Pas une table de pays : un moteur compositionnel qui assemble les obligations de chaque corridor et bloque ce que la loi interdit —avant d’opérer, pas après.',
  engStats: [
    { value: '167', label: 'Corridors d’importation' },
    { value: '177', label: 'Juridictions KYB cartographiées' },
    { value: '97', label: 'États CISG câblés' },
    { value: 'ed25519', label: 'e-CMR signé · 3 moments' },
  ],
  engBullets: [
    'Contrôle d’export fail-closed : si la destination ou une partie ne passe pas le criblage (OFAC · UE · ONU), l’opération n’est pas confirmée.',
    'Jeu documentaire UCP 600 + e-CMR signé ed25519 aux trois moments : expéditeur, transporteur et livraison.',
    'Radar de catalogue : il balaie des fournisseurs réels et alimente le cœur automatiquement (3 159 fiches déjà chargées).',
  ],
  techEyebrow: 'TECHNOLOGIE',
  techTitle: 'Infrastructure vérifiable',
  techSubtitle:
    'Un Passeport Numérique par produit, un contrôle de conformité qui rejette ce que la loi interdit, un séquestre du paiement libéré contre livraison signée et une identité vérifiée par opération. Le tout traçable et auditable par toute partie autorisée.',
  techFeatures: [
    { title: 'Identité vérifiée (KYC)', desc: 'KYC intégré pour les entreprises. Chaque opération est liée à une identité réelle, vérifiée face aux registres publics officiels.' },
    { title: 'Paiement contre livraison signée', desc: 'Le montant reste en dépôt et se libère à la confirmation de la livraison ou du jalon convenu. Sans attendre des semaines une banque intermédiaire.' },
    { title: 'Conformité imposée par le système', desc: 'Le contrôle de conformité exige, dans le code, les données et certificats que la loi impose pour exporter. Ce que la règle interdit ne passe pas.' },
    { title: 'Trois oracles pour une seule vérité', desc: 'Un notaire, le bon de livraison du transitaire ou l’Owner Key de l’acheteur. Le paiement n’est libéré que lorsqu’un oracle autorisé confirme que l’opération est accomplie.' },
    { title: 'Visioconférence avec sous-titres traduits', desc: 'Appels 1-à-1 (WebRTC) avec sous-titres traduits en direct, pour négocier entre pays sans barrière de langue.' },
    { title: 'La blockchain est invisible', desc: 'Sans clés, sans gas, sans jargon : on se connecte par un code email et on raisonne en euros. La PME utilise un bureau B2B ordinaire ; le XRP Ledger travaille dessous, comme la base de données de votre banque.' },
  ],
  ctaEyebrow: 'REJOIGNEZ-NOUS',
  ctaTitleA: 'Bienvenue sur l’internet',
  ctaTitleB: 'du commerce mondial',
  ctaBody:
    'Rejoignez l’infrastructure qui connecte tous les acteurs du commerce mondial : Passeport Numérique de Produit, conformité à l’export et paiement libéré contre livraison signée.',
  ctaBold: 'Inscription gratuite · Sans engagement · 0,5 % par transaction.',
  ctaButton: 'Choisissez votre continent ↑',
  footerTagline: 'Infrastructure pour le commerce mondial.',
  footerSeal: 'Passeport Numérique · Conformité à l’export',
  footerStandards: 'Standards · DPP · ISO 20022 · UCP 600\nRGPD · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Plateforme', links: ['Comment ça marche', 'Secteurs', 'Investisseurs', 'Démo'] },
    { titulo: 'Secteurs', links: ['Immobilier', 'Automobile', 'Santé', 'Alimentaire', 'Transport'] },
    { titulo: 'Pour qui', links: ['Acheteurs', 'Professionnels', 'Fournisseurs'] },
    { titulo: 'Légal', links: ['Confidentialité', 'Conditions', 'Cookies', 'Conformité'] },
  ],
  footerCopyright: '© 2026 1503 — Infrastructure de conformité pour le commerce mondial',
  footerVersion: 'v0.2 · Pré-MVP',
}

/* ═══════════════════════════════ DEUTSCH ═══════════════════════════════ */
const HOME_DE: HomeStrings = {
  metaTitle: '1503 — Das Internet des Welthandels',
  metaDescription:
    'Vertrauensinfrastruktur für den B2B-Handel: Digitaler Produktpass, systemseitig erzwungene Exportkonformität und Zahlung, die gegen unterschriebene Lieferung freigegeben wird.',
  continentLabels: { NA: 'Nordamerika', SA: 'Südamerika', EU: 'Europa', OM: 'Naher Osten', AS: 'Asien', AF: 'Afrika', OC: 'Ozeanien' },
  continentAria: 'Kontinentauswahl',
  heroBeatA: 'Im Jahr 1503 ordnete Sevilla den Handel der Welt.',
  heroBeatB: 'Das Handelshaus verzeichnete jede Route.',
  heroBeatC: 'Heute ist diese Route ein *Netzwerk*.',
  heroKicker: 'Digitaler Produktpass · Exportkonformität',
  heroTag: 'Die Infrastruktur, die den gesamten *Welthandel* verbindet.',
  heroEnter: 'Wählen Sie einen Kontinent zum Eintreten →',
  scrollHint: '↓ Weiter scrollen, um die Plattform zu entdecken',
  langLabel: 'Sprache',
  manifestoEyebrow: 'WER WIR SIND',
  statusBadge: 'Pre-MVP · Kern live im XRPL-Testnet',
  manifestoTitleA: '1503 ist kein Marktplatz.',
  manifestoTitleB: 'Es ist Infrastruktur für den Welthandel.',
  manifestoTagline: 'Digitaler Produktpass · Systemseitig erzwungene Konformität · Verifiziertes KYC',
  manifestoBody:
    'Wir vereinen alle Branchen und alle Länder in einem einzigen Arbeitswerkzeug. Jedes Produkt entsteht mit seinem Digitalen Produktpass: Herkunft, Materialien, Zertifikate und die vom Gesetz geforderten Exportregeln. Konformität ist nicht optional —sie ist das Eingangstor—, und die Zahlungstreuhand wird gegen unterschriebene Lieferung freigegeben. Jeder Pass wird mit einem kanonischen Hash (RFC 8785) und einer kryptografischen Signatur versiegelt: manipulationssicher und von jeder Partei überprüfbar.',
  kpis: [
    { value: '11', label: 'Branchen mit integrierter Konformität' },
    { value: '167', label: 'Verifizierte legale Handelskorridore der Welt' },
    { value: '0,5', unit: '%', label: 'Gebühr pro Vorgang' },
    { value: '∞', label: 'Produktrückverfolgbarkeit' },
  ],
  tags: ['Digitaler Pass', 'Erzwungene Konformität', 'Verifiziertes KYC', 'Signierte Treuhand', 'Multi-Branche', 'Multi-Land'],
  ecoEyebrow: 'VOM ÖKOSYSTEM UNTERSTÜTZT',
  ecoMemberOf: 'Mitglied von',
  erpEyebrow: 'IHR KATALOG, KONFORM VON DER QUELLE AN',
  erpTitleA: 'Verbinden Sie Ihr ERP einmal.',
  erpTitleB: 'Jedes Produkt entsteht mit seinem Digitalen Pass.',
  erpBody:
    'Wir verbinden Ihr ERP-System, und jeder Artikel gelangt mit seinem Digitalen Pass in Ihren Arbeitsbereich: Herkunft, Materialien, Zertifikate und die vom Gesetz für den Export geforderten Regeln. Keine Website zu pflegen und keine Datenblätter von Hand: Ihr Katalog synchronisiert sich in Echtzeit und entsteht konform, bereit für den Handel mit jedem Land der Welt.',
  erpBullets: [
    'Ihr ERP einmal verbunden. Ein lebendiger Katalog für immer.',
    'Jeder Artikel kommt mit Bild, Daten und seinem Digitalen Produktpass.',
    'Das Konformitäts-Gate prüft jedes Datenblatt gegen das Gesetz, bevor es veröffentlicht wird.',
    'Ein einziger Arbeitsbereich zum Verkaufen, Kaufen und Erfüllen weltweit.',
  ],
  erpCaption: 'ERP-Konnektoren auf der Roadmap · heute wird der Katalog über Radar und API eingelesen',
  erpIllusHeader: 'ERP · AKTIVER KATALOG',
  howEyebrow: 'DER PROZESS',
  howTitle: 'So einfach wie drei Schritte',
  howSteps: [
    { num: '01', title: 'Jedes Produkt entsteht mit seinem Digitalen Pass', desc: 'Herkunft, Materialien, Zertifikate und die vom Gesetz geforderten Exportregeln. Ihre Unternehmensidentität, weltweit verifiziert (KYC).' },
    { num: '02', title: 'Das Konformitäts-Gate entscheidet, ob gehandelt werden darf', desc: 'Das System prüft jedes Datenblatt gegen das Gesetz und weist Nicht-Konformes ab. Nicht Konformes wird weder veröffentlicht noch verkauft: Konformität ist das Eingangstor, keine abschließende Formalität.' },
    { num: '03', title: 'Die Zahlung wird gegen unterschriebene Lieferung freigegeben', desc: 'Die Treuhand passt sich Ihrem Vorgang an. Der Betrag bleibt im Depot und wird freigegeben, wenn die Lieferung oder der vereinbarte Meilenstein bestätigt ist —nicht früher—.' },
  ],
  payEyebrow: 'ZAHLUNGSMODELLE',
  payTitle: 'Die Zahlung passt sich Ihrem Vorgang an',
  paySubtitle:
    'Jede Transaktionsart hat ihre Logik. Die Treuhand entscheidet je nach Verkaufsart, wann sie freigibt —Kleinprodukt, nationales B2B, Dienstleistung oder Import—. Geld bewegt sich nur, wenn die vereinbarte Bedingung erfüllt ist.',
  payModels: [
    { num: '01', eyebrow: 'DIREKTPRODUKT', title: 'Kleine Beträge, Direktzahlung', desc: 'Gedacht für schnelle Vorgänge bis 500 €: Direktzahlung, ohne Treuhand. Der Verkäufer wird über seinen gewohnten Kanal bezahlt.', libera: 'Sofort', split: [{ pct: 100, label: 'ZAHLUNG', sub: '3 SEK · DIREKT' }] },
    { num: '02', eyebrow: 'NATIONALES B2B', title: 'Die Lieferung ist das Orakel', desc: 'Bestellung von Unternehmen zu Unternehmen, voller Betrag im Depot. Wenn Ihr Kunde die Lieferung bestätigt, wird die Zahlung freigegeben.', libera: 'Lieferbestätigung', split: [{ pct: 100, label: 'TREUHAND', sub: 'GIBT BEI LIEFERUNG FREI' }] },
    { num: '03', eyebrow: 'PROFESSIONELLE DIENSTE', title: 'Das Projekt gibt den Takt vor', desc: '50 % zum Start, 50 % zum Abschluss. Jede Tranche wird gegen Meilenstein freigegeben. Keine Zahlungsdiskussionen mitten im Projekt.', libera: 'Nach Meilensteinen', split: [{ pct: 50, label: '50%', sub: 'START' }, { pct: 50, label: '50%', sub: 'ABSCHLUSS' }] },
    { num: '04', eyebrow: 'INTERNATIONALER IMPORT', title: 'Der Spediteur gibt die Zahlung frei, nicht Ihre Bank', desc: '30 % bei Bestellung, 70 % im Depot. Die Treuhand hört auf den Spediteur und gibt bei bestätigter Container-Lieferung frei. Ohne 15 Tage Bankabwicklung.', libera: 'Lieferschein des Spediteurs', split: [{ pct: 30, label: '30%', sub: 'BESTELLUNG' }, { pct: 70, label: '70%', sub: 'SPEDITEUR' }] },
  ],
  payLiberaPrefix: 'Freigabe:',
  payFeeLine: '1503-Gebühr von {pct} pro Vorgang. Für alle Modelle gleich, ohne versteckte Kosten.',
  payFeePct: '0,5 %',
  payFeeMono: 'Gelder im Depot · Freigabe gegen unterschriebene Lieferung · Gleiche Kosten für alle Modelle',
  payStatusMono:
    'Nicht-verwahrende Treuhand live im XRPL-Testnet · Fiat-Zahlungsrails (Pay-by-Bank · Ripple Payments) in Integration · 1503 hält niemals das Geld',
  traceEyebrow: 'VOLLE KONTROLLE',
  traceTitle: 'Auftragsverfolgung in fünf Schritten',
  traceSubtitle:
    'Ihre Kunden erteilen Bestellungen direkt in Ihrem Managementsystem, und die Auftragsverfolgung wird automatisch Schritt für Schritt bis zur Lieferung erzeugt. Der Betrag bleibt im Depot und wird gegen unterschriebene Lieferung freigegeben. Jeder Vorgang ist abgedeckt und Ende-zu-Ende überprüfbar.',
  traceStates: [
    { num: '01', label: 'Bestellung', sub: 'Bestätigt' },
    { num: '02', label: 'Zahlung', sub: 'Im Depot' },
    { num: '03', label: 'Vorbereitung', sub: 'Im Lager' },
    { num: '04', label: 'Transit', sub: 'Unterwegs' },
    { num: '05', label: 'Lieferung', sub: 'Abgeschlossen' },
  ],
  compEyebrow: 'WARUM WIR',
  compTitle: 'Was Banken und Marktplätze Ihnen nicht bieten',
  compSubtitle:
    'Wir konkurrieren nicht über den Preis, sondern über Vertrauen: Digitaler Pass, systemseitig erzwungene Konformität und volle Rückverfolgbarkeit —plus Zahlungstreuhand gegen Lieferung— in einer einzigen Schicht, die weder Bank noch Marktplatz vereint.',
  compColConcept: 'Konzept',
  compColBank: 'Banken',
  compColMarket: 'B2B-Marktplätze',
  compRows: [
    { label: 'Digitaler Produktpass', ours: 'Nativ', bank: 'Nein', other: 'Nein' },
    { label: 'Regulatorische Konformität', ours: 'Systemseitig erzwungen', bank: 'Nein', other: 'Manuell' },
    { label: 'Produktrückverfolgbarkeit', ours: 'Vollständig', bank: 'Nein', other: 'Nein' },
    { label: 'Exportkonformität', ours: 'Korridor-Regeln', bank: 'Nein', other: 'Nein' },
    { label: 'Unternehmens-KYC', ours: 'Verifiziert und integriert', bank: 'Papierkram, Wochen', other: 'Teilweise' },
    { label: 'Gesicherte Zahlung', ours: 'Gelder im Depot', bank: 'Manuelle Treuhand', other: 'Nein' },
    { label: 'Zahlungsfreigabe', ours: 'Bei Lieferbestätigung', bank: '1 – 3 Tage', other: '24 – 48 h' },
    { label: 'ERP-Integration', ours: 'Über Radar / API', bank: 'Nein', other: 'Teilweise' },
    { label: 'Zugang und Registrierung', ours: 'Kostenlos', bank: 'Kontoeröffnung + Formalitäten', other: 'Monatsgebühr' },
    { label: 'Gebühr pro Vorgang', ours: '0,5 %', bank: '1,5 – 3,5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'DIE FLEISSARBEIT, AUTOMATISIERT',
  autoTitle: 'Keine Handeingabe, kein leeres Formular.',
  autoSubtitle:
    'Compliance schreckt wegen der Handarbeit ab. Bei 1503 erledigt das System sie: der Katalog füllt sich selbst und die Dokumentation schreibt sich selbst.',
  autoRadarTitle: 'Radar · Ihr Katalog füllt sich selbst',
  autoRadarDesc:
    'Ein Radar durchsucht die Quellen Ihrer Lieferanten, baut die kanonische Karte jedes Produkts mit seinem Digitalen Pass und speist sie in den Core ein — ohne Neueingabe. Tausende echte Artikel sind bereits geladen.',
  autoVeroTitle: 'Vero · die KI, die den Papierkram ausfüllt',
  autoVeroDesc:
    'Die Assistentin von 1503 erstellt Ihre Compliance- und Exportdokumentation: sie schlägt die Passfelder, die Dokumente und die Korridor-Regeln vor. Sie prüfen und bestätigen — Vero unterschreibt nie allein.',
  autoLawTitle: 'RegTech · die Gesetze, überwacht',
  autoLawDesc:
    'Jede Regel der Bibliothek ist an ihre offizielle Quelle verankert (EUR-Lex, Amtsblätter, zuständige Behörden), mit verfolgtem juristischem Prüfstatus. Ändert sich eine Norm, wird sie zur Aktualisierung durch einen Menschen markiert — das System schreibt das Recht nie allein um (§0).',
  probEyebrow: 'DAS PROBLEM, DAS WIR LÖSEN',
  probTitle: 'B2B-Handel dauert immer noch 5–10 Tage. Er sollte Stunden dauern.',
  probSubtitle:
    'Der Welthandel bewegt über 30 Billionen Dollar im Jahr auf einer Vertrauensinfrastruktur, die sich in einem halben Jahrhundert kaum verändert hat. Heute ist sie in vier Ineffizienzen zersplittert:',
  probItems: [
    { title: 'Getrennte Systeme', desc: 'ERPs sprechen nicht miteinander. Geschäfte entstehen in E-Mails, laufen übers Telefon und werden per WhatsApp bestätigt — dabei gehen Daten verloren.' },
    { title: 'Zehn verstreute Tools', desc: 'Ein KMU zahlt für bis zu zehn nicht integrierte Lösungen: Compliance, Rückverfolgbarkeit, Verladung, Zoll, Zahlungen, Kommunikation…' },
    { title: 'Die regulatorische Uhr', desc: 'Die EU schreibt den Digitalen Produktpass (ESPR) ab 2027 vor. Heutige Lösungen sind teuer und für große Konsortien gedacht — 99 % bleiben außen vor.' },
    { title: 'Langsame Zyklen', desc: 'Ohne direkte Koordination zwischen Verkäufer, Spediteur und Käufer zieht sich jeder Export durch Neueingabe und Fehler auf 5–10 Tage.' },
  ],
  probOutcome:
    '1503 löst das an der Wurzel: Produkt, internationale Papiere und Abwicklung laufen in Echtzeit in einer einzigen Wahrheitsquelle zusammen. Sich mit einem Akteur zu verbinden heißt, sich mit dem ganzen Netzwerk zu integrieren — und der Zyklus sinkt von 5–10 Tagen auf wenige Stunden, von einem einzigen Bildschirm aus.',
  probStatFrom: '5–10 Tage',
  probStatTo: 'Stunden',
  probStatLabel: 'Die Verdichtung der Vorgangszeit',
  whyEyebrow: 'WARUM JETZT',
  whyTitle: 'Der Digitale Produktpass ist bereits Gesetz.',
  whySubtitle:
    'Die EU-Ökodesign-Verordnung (ESPR · 2024/1781) macht den DPP branchenweise verpflichtend. Während Konzerne Millionen für maßgeschneiderte Beratung ausgeben, drohen 99 % des Wirtschaftsgefüges —die KMU— vom Binnenmarkt ausgeschlossen zu werden. Wir drücken kein Produkt: wir greifen eine datierte gesetzliche Pflicht auf, und 1503 ist der kostengünstigste Weg.',
  whyDeadlines: [
    { sector: 'Textil', year: '2027', note: 'Materialrückverfolgbarkeit, nachhaltige Zusammensetzung und Recyclingfähigkeit am Ursprung.' },
    { sector: 'Möbel', year: '2028', note: 'Holzherkunft, CO₂-Fußabdruck und Langlebigkeit. Anfangsfokus mit dem Artikalia-Piloten.' },
    { sector: 'Bau & andere', year: '2027–2030', note: 'Schrittweiser Rollout auf praktisch alle physischen Güter des Binnenmarkts.' },
  ],
  protoEyebrow: 'EBENE A · DIE VERTRAUENSEBENE',
  protoTitle: 'Verankert im XRP Ledger.',
  protoSubtitle:
    'Unter jedem Vorgang verbindet ein nicht-verwahrendes Protokoll Produkt, Identität und Zahlung zu einer einzigen überprüfbaren Wahrheit. Live im XRPL-Testnet, mit öffentlichen Transaktionen.',
  protoSeals: [
    { seal: 'PRODUKT', title: 'Der Pass, verankert', desc: 'Der DPP wird mit einem kanonischen Hash (RFC 8785) ed25519-signiert und im Ledger verankert. Gegen die Kette überprüfbar, nicht gegen unsere Datenbank.' },
    { seal: 'PARTEI', title: 'Identität mit eigenem Schlüssel', desc: 'Jedes Unternehmen erhält eine unveränderliche digitale ID und ed25519-Schlüssel. Jede Signatur —Treuhand, e-CMR— ist mit einer echten Identität verknüpft.' },
    { seal: 'VORGANG', title: 'Nicht-verwahrende Zahlung', desc: 'Native Treuhand: der Betrag wird gesperrt und gegen vom Orakel bestätigte Lieferung freigegeben. 1503 berührt das Geld nie; wird nichts erfüllt, gibt der Backstop es zurück.' },
  ],
  protoProof: 'DPP-Verankerung und native Treuhand mit Krypto-Bedingung · im XRPL-Testnet mit öffentlichen Transaktionen bewiesen (20 XRP) · RLUSD-Treuhand (TokenEscrow XLS-85) mit eigenem Test-Emittenten bewiesen, mit dem offiziellen Emittenten ausstehend',
  protoBadge: 'Live im XRPL-Testnet · Transaktionen im Explorer überprüfbar',
  engEyebrow: 'DIE KONFORMITÄTS-ENGINE',
  engTitle: 'Die Gesetze der Welt, im Code gekreuzt.',
  engSubtitle:
    'Keine Ländertabelle: eine kompositionelle Engine, die die Pflichten jedes Korridors zusammensetzt und blockiert, was das Gesetz verbietet —vor dem Handel, nicht danach.',
  engStats: [
    { value: '167', label: 'Import-Korridore' },
    { value: '177', label: 'KYB-Jurisdiktionen kartiert' },
    { value: '97', label: 'CISG-Staaten verdrahtet' },
    { value: 'ed25519', label: 'e-CMR signiert · 3 Momente' },
  ],
  engBullets: [
    'Fail-closed Export-Gate: Besteht das Ziel oder eine Partei das Screening (OFAC · EU · UN) nicht, wird der Vorgang nicht bestätigt.',
    'UCP-600-Dokumentensatz + e-CMR ed25519-signiert zu allen drei Momenten: Absender, Frachtführer und Lieferung.',
    'Katalog-Radar: durchsucht echte Lieferanten und speist den Core automatisch (3.159 Datensätze bereits geladen).',
  ],
  techEyebrow: 'TECHNOLOGIE',
  techTitle: 'Überprüfbare Infrastruktur',
  techSubtitle:
    'Ein Digitaler Pass pro Produkt, ein Konformitäts-Gate, das ablehnt, was das Gesetz verbietet, eine Zahlungstreuhand, die gegen unterschriebene Lieferung freigibt, und eine pro Vorgang verifizierte Identität. Alles rückverfolgbar und von jeder autorisierten Partei prüfbar.',
  techFeatures: [
    { title: 'Verifizierte Identität (KYC)', desc: 'Integriertes KYC für Unternehmen. Jeder Vorgang ist mit einer echten Identität verknüpft, verifiziert gegen offizielle öffentliche Register.' },
    { title: 'Zahlung gegen unterschriebene Lieferung', desc: 'Der Betrag bleibt im Depot und wird bei Bestätigung der Lieferung oder des vereinbarten Meilensteins freigegeben. Ohne wochenlanges Warten auf eine Zwischenbank.' },
    { title: 'Systemseitig erzwungene Konformität', desc: 'Das Konformitäts-Gate verlangt im Code die Daten und Zertifikate, die das Gesetz für den Export fordert. Was die Regel verbietet, kommt nicht durch.' },
    { title: 'Drei Orakel für eine einzige Wahrheit', desc: 'Ein Notar, der Lieferschein des Spediteurs oder der Owner Key des Käufers. Die Zahlung wird erst freigegeben, wenn ein autorisiertes Orakel bestätigt, dass der Vorgang erfüllt ist.' },
    { title: 'Videoanruf mit übersetzten Untertiteln', desc: '1-zu-1-Anrufe (WebRTC) mit live übersetzten Untertiteln, um länderübergreifend ohne Sprachbarriere zu verhandeln.' },
    { title: 'Die Blockchain ist unsichtbar', desc: 'Keine Schlüssel, kein Gas, kein Fachjargon: Anmeldung per E-Mail-Code, Denken in Euro. Das KMU bedient einen gewöhnlichen B2B-Arbeitsplatz; der XRP Ledger arbeitet darunter — wie die Datenbank hinter Ihrer Bank.' },
  ],
  ctaEyebrow: 'JETZT MITMACHEN',
  ctaTitleA: 'Willkommen im Internet',
  ctaTitleB: 'des Welthandels',
  ctaBody:
    'Treten Sie der Infrastruktur bei, die alle Akteure des Welthandels verbindet: Digitaler Produktpass, Exportkonformität und Zahlung, die gegen unterschriebene Lieferung freigegeben wird.',
  ctaBold: 'Kostenlose Registrierung · Keine Bindung · 0,5 % pro Transaktion.',
  ctaButton: 'Wählen Sie Ihren Kontinent ↑',
  footerTagline: 'Infrastruktur für den Welthandel.',
  footerSeal: 'Digitaler Pass · Exportkonformität',
  footerStandards: 'Standards · DPP · ISO 20022 · UCP 600\nDSGVO · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Plattform', links: ['Wie es funktioniert', 'Branchen', 'Investoren', 'Demo'] },
    { titulo: 'Branchen', links: ['Immobilien', 'Automobil', 'Gesundheit', 'Lebensmittel', 'Transport'] },
    { titulo: 'Für wen', links: ['Käufer', 'Fachleute', 'Lieferanten'] },
    { titulo: 'Rechtliches', links: ['Datenschutz', 'AGB', 'Cookies', 'Konformität'] },
  ],
  footerCopyright: '© 2026 1503 — Konformitätsinfrastruktur für den Welthandel',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ ITALIANO ═══════════════════════════════ */
const HOME_IT: HomeStrings = {
  metaTitle: '1503 — L’internet del commercio globale',
  metaDescription:
    'Infrastruttura di fiducia per il commercio B2B: Passaporto Digitale di Prodotto, conformità all’export imposta dal sistema e pagamento rilasciato contro consegna firmata.',
  continentLabels: { NA: 'Nord America', SA: 'Sud America', EU: 'Europa', OM: 'Medio Oriente', AS: 'Asia', AF: 'Africa', OC: 'Oceania' },
  continentAria: 'Selettore di continente',
  heroBeatA: 'Nel 1503, Siviglia ordinò il commercio del mondo.',
  heroBeatB: 'La Casa de Contratación registrava ogni rotta.',
  heroBeatC: 'Oggi, quella rotta è una *rete*.',
  heroKicker: 'Passaporto Digitale di Prodotto · Conformità all’export',
  heroTag: 'L’infrastruttura che unisce tutto il *commercio globale*.',
  heroEnter: 'Scegli un continente per entrare →',
  scrollHint: '↓ Continua a scorrere per scoprire la piattaforma',
  langLabel: 'Lingua',
  manifestoEyebrow: 'CHI SIAMO',
  statusBadge: 'Pre-MVP · Nucleo attivo su XRPL testnet',
  manifestoTitleA: '1503 non è un marketplace.',
  manifestoTitleB: 'È infrastruttura per il commercio globale.',
  manifestoTagline: 'Passaporto Digitale di Prodotto · Conformità imposta dal sistema · KYC verificato',
  manifestoBody:
    'Uniamo tutti i settori e tutti i paesi in un unico strumento di lavoro. Ogni prodotto nasce con il suo Passaporto Digitale: origine, materiali, certificati e le regole di esportazione richieste dalla legge. La conformità non è opzionale —è la porta d’ingresso—, e la custodia del pagamento viene rilasciata contro consegna firmata. Ogni Passaporto è sigillato con un hash canonico (RFC 8785) e una firma crittografica: a prova di manomissione e verificabile da chiunque.',
  kpis: [
    { value: '11', label: 'Settori con conformità integrata' },
    { value: '167', label: 'Corridoi commerciali legali del mondo verificati' },
    { value: '0,5', unit: '%', label: 'Commissione per operazione' },
    { value: '∞', label: 'Tracciabilità del prodotto' },
  ],
  tags: ['Passaporto Digitale', 'Conformità imposta', 'KYC verificato', 'Custodia firmata', 'Multi-settore', 'Multi-paese'],
  ecoEyebrow: "CON IL SUPPORTO DELL'ECOSISTEMA",
  ecoMemberOf: 'Membro di',
  erpEyebrow: 'IL TUO CATALOGO, CONFORME DALL’ORIGINE',
  erpTitleA: 'Collega il tuo ERP una volta.',
  erpTitleB: 'Ogni prodotto nasce con il suo Passaporto Digitale.',
  erpBody:
    'Colleghiamo il tuo sistema ERP e ogni articolo entra nella tua scrivania con il suo Passaporto Digitale: origine, materiali, certificati e le regole richieste dalla legge per esportarlo. Nessun sito da mantenere e nessuna scheda da compilare a mano: il tuo catalogo si sincronizza in tempo reale e nasce conforme, pronto a operare con qualsiasi paese del mondo.',
  erpBullets: [
    'Il tuo ERP collegato una volta. Un catalogo vivo per sempre.',
    'Ogni articolo entra con la sua immagine, i suoi dati e il suo Passaporto Digitale di Prodotto.',
    'Il gate di conformità valida ogni scheda rispetto alla legge prima di pubblicarla.',
    'Un’unica scrivania per vendere, comprare e conformarti in tutto il mondo.',
  ],
  erpCaption: 'Connettori per ERP nella roadmap · oggi il catalogo viene acquisito via radar e API',
  erpIllusHeader: 'ERP · CATALOGO ATTIVO',
  howEyebrow: 'IL PROCESSO',
  howTitle: 'Semplice come tre passi',
  howSteps: [
    { num: '01', title: 'Ogni prodotto nasce con il suo Passaporto Digitale', desc: 'Origine, materiali, certificati e le regole di esportazione richieste dalla legge. La tua identità aziendale, verificata (KYC) in tutto il pianeta.' },
    { num: '02', title: 'Il gate di conformità decide se può operare', desc: 'Il sistema valida ogni scheda rispetto alla legge e rifiuta ciò che non è conforme. Il non conforme non viene né pubblicato né venduto: la conformità è la porta d’ingresso, non una formalità finale.' },
    { num: '03', title: 'Il pagamento viene rilasciato contro consegna firmata', desc: 'La custodia si adatta alla tua operazione. L’importo resta in deposito e viene rilasciato quando la consegna o il traguardo concordato è confermato —non prima—.' },
  ],
  payEyebrow: 'MODELLI DI PAGAMENTO',
  payTitle: 'Il pagamento si adatta alla tua operazione',
  paySubtitle:
    'Ogni tipo di transazione ha la sua logica. La custodia decide quando rilasciare, in base al tipo di vendita —piccolo prodotto, B2B nazionale, servizio o import—. Il denaro si muove solo quando la condizione concordata è soddisfatta.',
  payModels: [
    { num: '01', eyebrow: 'PRODOTTO DIRETTO', title: 'Piccoli importi, pagamento diretto', desc: 'Pensato per operazioni rapide fino a 500 €: pagamento diretto, senza custodia. Il venditore incassa dal suo canale abituale.', libera: 'Immediata', split: [{ pct: 100, label: 'PAGAMENTO', sub: '3 SEC · DIRETTO' }] },
    { num: '02', eyebrow: 'B2B NAZIONALE', title: 'La consegna è l’oracolo', desc: 'Ordine da azienda a azienda, importo intero in deposito. Quando il tuo cliente conferma la consegna, il pagamento viene rilasciato.', libera: 'Conferma di consegna', split: [{ pct: 100, label: 'ESCROW', sub: 'RILASCIA ALLA CONSEGNA' }] },
    { num: '03', eyebrow: 'SERVIZI PROFESSIONALI', title: 'Il ritmo lo detta il progetto', desc: '50% all’avvio, 50% alla chiusura. Ogni tranche si rilascia contro traguardo. Senza discussioni di pagamento a metà progetto.', libera: 'Per traguardi', split: [{ pct: 50, label: '50%', sub: 'AVVIO' }, { pct: 50, label: '50%', sub: 'CHIUSURA' }] },
    { num: '04', eyebrow: 'IMPORT INTERNAZIONALE', title: 'Lo spedizioniere rilascia il pagamento, non la tua banca', desc: '30% all’ordine, 70% in deposito. La custodia ascolta lo spedizioniere e rilascia alla conferma di consegna del container. Senza 15 giorni di gestione bancaria.', libera: 'Bolla dello spedizioniere', split: [{ pct: 30, label: '30%', sub: 'ORDINE' }, { pct: 70, label: '70%', sub: 'SPEDIZIONIERE' }] },
  ],
  payLiberaPrefix: 'Rilascio:',
  payFeeLine: 'Commissione 1503 dello {pct} per operazione. Uguale per tutti i modelli, senza costi nascosti.',
  payFeePct: '0,5 %',
  payFeeMono: 'Fondi in deposito · Rilasciati contro consegna firmata · Stesso costo per tutti i modelli',
  payStatusMono:
    'Escrow non custodiale attivo su XRPL testnet · rail di pagamento fiat (pay-by-bank · Ripple Payments) in integrazione · 1503 non detiene mai il denaro',
  traceEyebrow: 'CONTROLLO TOTALE',
  traceTitle: 'Tracciabilità dell’ordine in cinque passi',
  traceSubtitle:
    'I tuoi clienti emettono gli ordini direttamente sul tuo sistema gestionale e la tracciabilità dell’ordine si genera automaticamente, passo dopo passo, fino alla consegna. L’importo resta in deposito e viene rilasciato contro consegna firmata. Ogni operazione è coperta e verificabile end-to-end.',
  traceStates: [
    { num: '01', label: 'Ordine', sub: 'Confermato' },
    { num: '02', label: 'Pagamento', sub: 'In deposito' },
    { num: '03', label: 'Preparazione', sub: 'In magazzino' },
    { num: '04', label: 'Transito', sub: 'In viaggio' },
    { num: '05', label: 'Consegna', sub: 'Completata' },
  ],
  compEyebrow: 'PERCHÉ SCEGLIERCI',
  compTitle: 'Ciò che banche e marketplace non ti danno',
  compSubtitle:
    'Non competiamo sul prezzo, competiamo sulla fiducia: Passaporto Digitale, conformità imposta dal sistema e tracciabilità totale —più la custodia del pagamento contro consegna— in un unico livello che né una banca né un marketplace riuniscono.',
  compColConcept: 'Concetto',
  compColBank: 'Banche',
  compColMarket: 'Marketplace B2B',
  compRows: [
    { label: 'Passaporto Digitale di Prodotto', ours: 'Nativo', bank: 'No', other: 'No' },
    { label: 'Conformità normativa', ours: 'Imposta dal sistema', bank: 'No', other: 'Manuale' },
    { label: 'Tracciabilità del prodotto', ours: 'Totale', bank: 'No', other: 'No' },
    { label: 'Conformità all’export', ours: 'Regole del corridoio', bank: 'No', other: 'No' },
    { label: 'KYC aziendale', ours: 'Verificato e integrato', bank: 'Documenti, settimane', other: 'Parziale' },
    { label: 'Pagamento garantito', ours: 'Fondi in deposito', bank: 'Escrow manuale', other: 'No' },
    { label: 'Rilascio del pagamento', ours: 'Alla conferma di consegna', bank: '1 – 3 giorni', other: '24 – 48 h' },
    { label: 'Integrazione ERP', ours: 'Via radar / API', bank: 'No', other: 'Parziale' },
    { label: 'Accesso e registrazione', ours: 'Gratis', bank: 'Apertura + pratiche', other: 'Canone mensile' },
    { label: 'Commissione per operazione', ours: '0,5 %', bank: '1,5 – 3,5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'IL LAVORO PESANTE, AUTOMATICO',
  autoTitle: 'Niente schede a mano, niente moduli in bianco.',
  autoSubtitle:
    'La conformità spaventa per il lavoro manuale. In 1503 quel lavoro lo fa il sistema: il catalogo si riempie da solo e la documentazione si redige da sola.',
  autoRadarTitle: 'Radar · il tuo catalogo si riempie da solo',
  autoRadarDesc:
    'Un radar scansiona le fonti dei tuoi fornitori, costruisce la scheda canonica di ogni prodotto con il suo Passaporto Digitale e la ingerisce nel core — senza ridigitare. Ha già caricato migliaia di referenze reali.',
  autoVeroTitle: 'Vero · l’IA che compila le pratiche',
  autoVeroDesc:
    'L’assistente di 1503 redige per te la documentazione di conformità ed export: propone i campi del Passaporto, i documenti e le regole del corridoio. Tu rivedi e confermi — Vero non firma mai da sola.',
  autoLawTitle: 'RegTech · le leggi, sorvegliate',
  autoLawDesc:
    'Ogni regola della biblioteca è ancorata alla sua fonte ufficiale (EUR-Lex, gazzette, autorità competente), con lo stato di revisione legale tracciato. Quando una norma cambia, viene segnalata perché una persona la aggiorni — il sistema non riscrive mai il diritto da solo (§0).',
  probEyebrow: 'IL PROBLEMA CHE RISOLVIAMO',
  probTitle: 'Il commercio B2B richiede ancora 5–10 giorni. Dovrebbe richiedere ore.',
  probSubtitle:
    'Il commercio mondiale muove oltre 30 000 miliardi di dollari l’anno su un’infrastruttura di fiducia cambiata a malapena in mezzo secolo. Oggi è atomizzata in quattro inefficienze:',
  probItems: [
    { title: 'Sistemi scollegati', desc: 'Gli ERP non si parlano. Gli affari nascono nelle email, si trattano al telefono e si confermano su WhatsApp — perdendo dati per strada.' },
    { title: 'Dieci strumenti sparsi', desc: 'Una PMI paga fino a dieci soluzioni non integrate: conformità, tracciabilità, cubatura, dogane, pagamenti, comunicazioni…' },
    { title: 'L’orologio normativo', desc: 'L’UE impone il Passaporto Digitale (ESPR) dal 2027. Le soluzioni attuali sono care e pensate per grandi consorzi — lasciano fuori il 99%.' },
    { title: 'Cicli lenti', desc: 'Senza coordinamento diretto tra venditore, spedizioniere e compratore, ogni esportazione si allunga a 5–10 giorni per ridigitazioni ed errori.' },
  ],
  probOutcome:
    '1503 lo risolve alla radice: prodotto, documentazione internazionale e regolamento convergono in tempo reale in un’unica fonte di verità. Collegarsi a un attore della rete significa integrarsi con tutta la rete — e il ciclo scende da 5–10 giorni a poche ore, da un solo schermo.',
  probStatFrom: '5–10 giorni',
  probStatTo: 'ore',
  probStatLabel: 'La compressione del tempo di operazione',
  whyEyebrow: 'PERCHÉ ORA',
  whyTitle: 'Il Passaporto Digitale è già legge.',
  whySubtitle:
    'Il Regolamento Ecodesign UE (ESPR · 2024/1781) rende il DPP obbligatorio per settore. Mentre le multinazionali spendono milioni in consulenza su misura, il 99% del tessuto produttivo —le PMI— rischia di restare fuori dal mercato unico. Non spingiamo un prodotto: cogliamo un obbligo legale con una data, e 1503 è la via a costo più basso.',
  whyDeadlines: [
    { sector: 'Tessile', year: '2027', note: 'Tracciabilità dei materiali, composizione sostenibile e riciclabilità all’origine.' },
    { sector: 'Mobile', year: '2028', note: 'Provenienza del legno, impronta di carbonio e durabilità. Focus iniziale con il pilota Artikalia.' },
    { sector: 'Edilizia e altri', year: '2027–2030', note: 'Rollout progressivo a quasi tutti i beni fisici del mercato unico.' },
  ],
  protoEyebrow: 'STRATO A · LO STRATO DI FIDUCIA',
  protoTitle: 'Ancorato all’XRP Ledger.',
  protoSubtitle:
    'Sotto ogni operazione, un protocollo non custodiale unisce prodotto, identità e pagamento in un’unica verità verificabile. Attivo su XRPL testnet, con transazioni pubbliche.',
  protoSeals: [
    { seal: 'PRODOTTO', title: 'Il Passaporto, ancorato', desc: 'Il DPP è sigillato con un hash canonico (RFC 8785) firmato ed25519 e ancorato al ledger. Ri-verificabile contro la catena, non contro il nostro database.' },
    { seal: 'PARTE', title: 'Un’identità, la sua chiave', desc: 'Ogni azienda riceve un id digitale immutabile e chiavi ed25519. Ogni firma —custodia, e-CMR— è legata a un’identità reale.' },
    { seal: 'OPERAZIONE', title: 'Pagamento non custodiale', desc: 'Escrow nativo: l’importo viene bloccato e rilasciato contro consegna verificata dall’oracolo. 1503 non tocca mai il denaro; se nulla si adempie, il backstop lo restituisce.' },
  ],
  protoProof: 'Ancoraggio del DPP ed escrow nativo con cripto-condizione · provati su XRPL testnet con transazioni pubbliche (20 XRP) · escrow di RLUSD (TokenEscrow XLS-85) provato con emittente di prova proprio, in attesa con l’emittente ufficiale',
  protoBadge: 'Attivo su XRPL testnet · transazioni verificabili sull’explorer',
  engEyebrow: 'IL MOTORE DI CONFORMITÀ',
  engTitle: 'Le leggi del mondo, incrociate nel codice.',
  engSubtitle:
    'Non una tabella di paesi: un motore composizionale che assembla gli obblighi di ogni corridoio e blocca ciò che la legge vieta —prima di operare, non dopo.',
  engStats: [
    { value: '167', label: 'Corridoi di importazione' },
    { value: '177', label: 'Giurisdizioni KYB mappate' },
    { value: '97', label: 'Stati CISG cablati' },
    { value: 'ed25519', label: 'e-CMR firmato · 3 momenti' },
  ],
  engBullets: [
    'Gate di export fail-closed: se la destinazione o una parte non supera lo screening (OFAC · UE · ONU), l’operazione non viene confermata.',
    'Set documentale UCP 600 + e-CMR firmato ed25519 in tutti e tre i momenti: mittente, vettore e consegna.',
    'Radar di catalogo: scansiona fornitori reali e alimenta il core in automatico (3.159 schede già caricate).',
  ],
  techEyebrow: 'TECNOLOGIA',
  techTitle: 'Infrastruttura verificabile',
  techSubtitle:
    'Un Passaporto Digitale per prodotto, un gate di conformità che rifiuta ciò che la legge vieta, una custodia del pagamento rilasciata contro consegna firmata e un’identità verificata per operazione. Tutto tracciabile e verificabile da qualsiasi parte autorizzata.',
  techFeatures: [
    { title: 'Identità verificata (KYC)', desc: 'KYC integrato per le aziende. Ogni operazione è legata a un’identità reale, verificata rispetto ai registri pubblici ufficiali.' },
    { title: 'Pagamento contro consegna firmata', desc: 'L’importo resta in deposito e viene rilasciato alla conferma della consegna o del traguardo concordato. Senza aspettare settimane una banca intermediaria.' },
    { title: 'Conformità imposta dal sistema', desc: 'Il gate di conformità richiede, nel codice, i dati e i certificati che la legge impone per esportare. Ciò che la norma vieta non passa.' },
    { title: 'Tre oracoli per un’unica verità', desc: 'Un notaio, la bolla dello spedizioniere o l’Owner Key dell’acquirente. Il pagamento viene rilasciato solo quando un oracolo autorizzato conferma che l’operazione è stata adempiuta.' },
    { title: 'Videochiamata con sottotitoli tradotti', desc: 'Chiamate 1-a-1 (WebRTC) con sottotitoli tradotti in diretta, per negoziare tra paesi senza barriera linguistica.' },
    { title: 'La blockchain è invisibile', desc: 'Senza chiavi, senza gas, senza gergo: si accede con un codice via email e si ragiona in euro. La PMI usa una normale scrivania B2B; l’XRP Ledger lavora sotto, come il database della tua banca.' },
  ],
  ctaEyebrow: 'UNISCITI OGGI',
  ctaTitleA: 'Benvenuto nell’internet',
  ctaTitleB: 'del commercio globale',
  ctaBody:
    'Unisciti all’infrastruttura che connette tutti gli attori del commercio globale: Passaporto Digitale di Prodotto, conformità all’export e pagamento rilasciato contro consegna firmata.',
  ctaBold: 'Registrazione gratuita · Senza vincoli · 0,5 % per transazione.',
  ctaButton: 'Scegli il tuo continente ↑',
  footerTagline: 'Infrastruttura per il commercio globale.',
  footerSeal: 'Passaporto Digitale · Conformità all’export',
  footerStandards: 'Standard · DPP · ISO 20022 · UCP 600\nGDPR · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Piattaforma', links: ['Come funziona', 'Settori', 'Investitori', 'Demo'] },
    { titulo: 'Settori', links: ['Immobiliare', 'Automotive', 'Sanità', 'Alimentare', 'Trasporti'] },
    { titulo: 'Per chi', links: ['Acquirenti', 'Professionisti', 'Fornitori'] },
    { titulo: 'Legale', links: ['Privacy', 'Termini', 'Cookie', 'Conformità'] },
  ],
  footerCopyright: '© 2026 1503 — Infrastruttura di conformità per il commercio globale',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ PORTUGUÊS ═══════════════════════════════ */
const HOME_PT: HomeStrings = {
  metaTitle: '1503 — A internet do comércio global',
  metaDescription:
    'Infraestrutura de confiança para o comércio B2B: Passaporte Digital de Produto, conformidade de exportação imposta pelo sistema e pagamento liberado contra entrega assinada.',
  continentLabels: { NA: 'América do Norte', SA: 'América do Sul', EU: 'Europa', OM: 'Médio Oriente', AS: 'Ásia', AF: 'África', OC: 'Oceânia' },
  continentAria: 'Seletor de continente',
  heroBeatA: 'Em 1503, Sevilha ordenou o comércio do mundo.',
  heroBeatB: 'A Casa de Contratação registava cada rota.',
  heroBeatC: 'Hoje, essa rota é uma *rede*.',
  heroKicker: 'Passaporte Digital de Produto · Conformidade de exportação',
  heroTag: 'A infraestrutura que une todo o *comércio global*.',
  heroEnter: 'Escolha um continente para entrar →',
  scrollHint: '↓ Continue a deslizar para conhecer a plataforma',
  langLabel: 'Idioma',
  manifestoEyebrow: 'QUEM SOMOS',
  statusBadge: 'Pré-MVP · Núcleo ativo na testnet XRPL',
  manifestoTitleA: '1503 não é um marketplace.',
  manifestoTitleB: 'É infraestrutura para o comércio global.',
  manifestoTagline: 'Passaporte Digital de Produto · Conformidade imposta pelo sistema · KYC verificado',
  manifestoBody:
    'Unimos todos os setores e todos os países numa única ferramenta de trabalho. Cada produto nasce com o seu Passaporte Digital: origem, materiais, certificados e as regras de exportação que a lei exige. A conformidade não é opcional —é a porta de entrada—, e a custódia do pagamento é liberada contra entrega assinada. Cada Passaporte é selado com um hash canónico (RFC 8785) e assinatura criptográfica: à prova de adulteração e verificável por qualquer parte.',
  kpis: [
    { value: '11', label: 'Setores com conformidade integrada' },
    { value: '167', label: 'Corredores comerciais legais do mundo verificados' },
    { value: '0,5', unit: '%', label: 'Comissão por operação' },
    { value: '∞', label: 'Rastreabilidade do produto' },
  ],
  tags: ['Passaporte Digital', 'Conformidade imposta', 'KYC verificado', 'Custódia assinada', 'Multissetor', 'Multipaís'],
  ecoEyebrow: 'COM O APOIO DO ECOSSISTEMA',
  ecoMemberOf: 'Membro do',
  erpEyebrow: 'O SEU CATÁLOGO, CONFORME DESDE A ORIGEM',
  erpTitleA: 'Ligue o seu ERP uma vez.',
  erpTitleB: 'Cada produto nasce com o seu Passaporte Digital.',
  erpBody:
    'Ligamos o seu sistema ERP e cada referência entra na sua secretária com o seu Passaporte Digital: origem, materiais, certificados e as regras que a lei exige para exportá-la. Sem site para manter e sem preencher fichas à mão: o seu catálogo sincroniza em tempo real e nasce conforme, pronto para operar com qualquer país do mundo.',
  erpBullets: [
    'O seu ERP ligado uma vez. Um catálogo vivo para sempre.',
    'Cada artigo entra com a sua imagem, os seus dados e o seu Passaporte Digital de Produto.',
    'O gate de conformidade valida cada ficha face à lei antes de a publicar.',
    'Uma única secretária para vender, comprar e cumprir em todo o mundo.',
  ],
  erpCaption: 'Conectores por ERP no roadmap · hoje o catálogo é ingerido via radar e API',
  erpIllusHeader: 'ERP · CATÁLOGO ATIVO',
  howEyebrow: 'O PROCESSO',
  howTitle: 'Tão simples como três passos',
  howSteps: [
    { num: '01', title: 'Cada produto nasce com o seu Passaporte Digital', desc: 'Origem, materiais, certificados e as regras de exportação que a lei exige. A sua identidade de empresa, verificada (KYC) em todo o planeta.' },
    { num: '02', title: 'O gate de conformidade decide se pode operar', desc: 'O sistema valida cada ficha face à lei e rejeita o que não cumpre. O não conforme não é publicado nem vendido: a conformidade é a porta de entrada, não uma formalidade final.' },
    { num: '03', title: 'O pagamento é liberado contra entrega assinada', desc: 'A custódia adapta-se à sua operação. O montante fica em depósito e é liberado quando a entrega ou o marco acordado é confirmado —não antes—.' },
  ],
  payEyebrow: 'MODELOS DE PAGAMENTO',
  payTitle: 'O pagamento adapta-se à sua operação',
  paySubtitle:
    'Cada tipo de transação tem a sua lógica. A custódia decide quando liberta, conforme o tipo de venda —produto pequeno, B2B nacional, serviço ou importação—. O dinheiro só se move quando a condição acordada é cumprida.',
  payModels: [
    { num: '01', eyebrow: 'PRODUTO DIRETO', title: 'Valores pequenos, pagamento direto', desc: 'Pensado para operações rápidas até 500 €: pagamento direto, sem custódia. O vendedor recebe pelo seu canal habitual.', libera: 'Imediata', split: [{ pct: 100, label: 'PAGAMENTO', sub: '3 SEG · DIRETO' }] },
    { num: '02', eyebrow: 'B2B NACIONAL', title: 'A entrega é o oráculo', desc: 'Encomenda de empresa para empresa, montante total em depósito. Quando o seu cliente confirma a entrega, o pagamento é liberado.', libera: 'Confirmação de entrega', split: [{ pct: 100, label: 'ESCROW', sub: 'LIBERA NA ENTREGA' }] },
    { num: '03', eyebrow: 'SERVIÇOS PROFISSIONAIS', title: 'O ritmo é do projeto', desc: '50% no arranque, 50% no fecho. Cada tranche é liberada contra marco. Sem discussões de cobrança a meio do projeto.', libera: 'Por marcos', split: [{ pct: 50, label: '50%', sub: 'ARRANQUE' }, { pct: 50, label: '50%', sub: 'FECHO' }] },
    { num: '04', eyebrow: 'IMPORTAÇÃO INTERNACIONAL', title: 'O transitário liberta o pagamento, não o seu banco', desc: '30% na encomenda, 70% em depósito. A custódia escuta o transitário e liberta ao confirmar a entrega do contentor. Sem 15 dias de gestão bancária.', libera: 'Guia do transitário', split: [{ pct: 30, label: '30%', sub: 'ENCOMENDA' }, { pct: 70, label: '70%', sub: 'TRANSITÁRIO' }] },
  ],
  payLiberaPrefix: 'Libertação:',
  payFeeLine: 'Comissão 1503 de {pct} por operação. Igual para todos os modelos, sem taxas ocultas.',
  payFeePct: '0,5 %',
  payFeeMono: 'Fundos em depósito · Libertados contra entrega assinada · Mesmo custo para todos os modelos',
  payStatusMono:
    'Escrow não-custodial ativo na testnet XRPL · rails de pagamento fiat (pay-by-bank · Ripple Payments) em integração · a 1503 nunca detém o dinheiro',
  traceEyebrow: 'CONTROLO TOTAL',
  traceTitle: 'Rastreabilidade da encomenda em cinco passos',
  traceSubtitle:
    'Os seus clientes emitem as encomendas diretamente sobre o seu sistema de gestão e a rastreabilidade da encomenda é gerada automaticamente, passo a passo, até à entrega. O montante fica em depósito e é libertado contra entrega assinada. Cada operação fica coberta e verificável de ponta a ponta.',
  traceStates: [
    { num: '01', label: 'Encomenda', sub: 'Confirmada' },
    { num: '02', label: 'Pagamento', sub: 'Em depósito' },
    { num: '03', label: 'Preparação', sub: 'Em armazém' },
    { num: '04', label: 'Trânsito', sub: 'A caminho' },
    { num: '05', label: 'Entrega', sub: 'Concluída' },
  ],
  compEyebrow: 'PORQUÊ NÓS',
  compTitle: 'O que a banca e os marketplaces não lhe dão',
  compSubtitle:
    'Não competimos no preço, competimos na confiança: Passaporte Digital, conformidade imposta pelo sistema e rastreabilidade total —mais a custódia do pagamento contra entrega— numa única camada que nem um banco nem um marketplace reúnem.',
  compColConcept: 'Conceito',
  compColBank: 'Banca',
  compColMarket: 'Marketplaces B2B',
  compRows: [
    { label: 'Passaporte Digital de Produto', ours: 'Nativo', bank: 'Não', other: 'Não' },
    { label: 'Conformidade regulatória', ours: 'Imposta pelo sistema', bank: 'Não', other: 'Manual' },
    { label: 'Rastreabilidade do produto', ours: 'Total', bank: 'Não', other: 'Não' },
    { label: 'Conformidade de exportação', ours: 'Regras do corredor', bank: 'Não', other: 'Não' },
    { label: 'KYC empresarial', ours: 'Verificado e integrado', bank: 'Documental, semanas', other: 'Parcial' },
    { label: 'Pagamento garantido', ours: 'Fundos em depósito', bank: 'Escrow manual', other: 'Não' },
    { label: 'Libertação do pagamento', ours: 'Na confirmação de entrega', bank: '1 – 3 dias', other: '24 – 48 h' },
    { label: 'Integração ERP', ours: 'Via radar / API', bank: 'Não', other: 'Parcial' },
    { label: 'Acesso e registo', ours: 'Grátis', bank: 'Abertura + trâmites', other: 'Mensalidade' },
    { label: 'Comissão por operação', ours: '0,5 %', bank: '1,5 – 3,5 %', other: '2 – 5 %' },
  ],
  autoEyebrow: 'O TRABALHO PESADO, AUTOMÁTICO',
  autoTitle: 'Sem fichas à mão, sem papelada em branco.',
  autoSubtitle:
    'Cumprir assusta pelo trabalho manual. Na 1503 esse trabalho é o sistema que o faz: o catálogo enche-se sozinho e a documentação redige-se sozinha.',
  autoRadarTitle: 'Radar · o seu catálogo enche-se sozinho',
  autoRadarDesc:
    'Um radar varre as fontes dos seus fornecedores, monta a ficha canónica de cada produto com o seu Passaporte Digital e ingere-a no core — sem redigitar. Já carregou milhares de referências reais.',
  autoVeroTitle: 'Vero · a IA que preenche a papelada',
  autoVeroDesc:
    'A assistente da 1503 redige por si a documentação de conformidade e exportação: propõe os campos do Passaporte, os documentos e as regras do corredor. Você revê e confirma — a Vero nunca assina sozinha.',
  autoLawTitle: 'RegTech · as leis, vigiadas',
  autoLawDesc:
    'Cada regra da biblioteca está ancorada à sua fonte oficial (EUR-Lex, boletins, autoridade competente), com o estado de revisão legal registado. Quando uma norma muda, é sinalizada para que uma pessoa a atualize — o sistema nunca reescreve o direito sozinho (§0).',
  probEyebrow: 'O PROBLEMA QUE RESOLVEMOS',
  probTitle: 'O comércio B2B ainda demora 5–10 dias. Devia demorar horas.',
  probSubtitle:
    'O comércio mundial move mais de 30 biliões de dólares por ano sobre uma infraestrutura de confiança que mal mudou em meio século. Hoje está atomizada em quatro ineficiências:',
  probItems: [
    { title: 'Sistemas desligados', desc: 'Os ERP não se falam. Os negócios nascem em emails, tratam-se por telefone e confirmam-se no WhatsApp — perdendo dados pelo caminho.' },
    { title: 'Dez ferramentas soltas', desc: 'Uma PME paga até dez soluções sem integração: conformidade, rastreabilidade, cubicagem, alfândegas, pagamentos, comunicações…' },
    { title: 'O relógio regulatório', desc: 'A UE exige o Passaporte Digital (ESPR) desde 2027. As soluções atuais são caras e para grandes consórcios — deixam de fora 99%.' },
    { title: 'Ciclos lentos', desc: 'Sem coordenação direta entre vendedor, transitário e comprador, cada exportação estica-se para 5–10 dias por redigitação e erros.' },
  ],
  probOutcome:
    'A 1503 resolve isto na raiz: produto, papelada internacional e liquidação convergem em tempo real numa única fonte de verdade. Ligar-se a um ator da rede é integrar-se com toda a rede — e o ciclo cai de 5–10 dias para umas horas, a partir de um único ecrã.',
  probStatFrom: '5–10 dias',
  probStatTo: 'horas',
  probStatLabel: 'A compressão do tempo de operação',
  whyEyebrow: 'PORQUÊ AGORA',
  whyTitle: 'O Passaporte Digital já é lei.',
  whySubtitle:
    'O Regulamento de Ecodesign da UE (ESPR · 2024/1781) torna o DPP obrigatório por setor. Enquanto as multinacionais gastam milhões em consultoria à medida, 99% do tecido produtivo —as PME— arrisca ficar de fora do mercado único. Não empurramos um produto: captamos uma obrigação legal com data, e a 1503 é o caminho de menor custo.',
  whyDeadlines: [
    { sector: 'Têxtil', year: '2027', note: 'Rastreabilidade de materiais, composição sustentável e reciclabilidade na origem.' },
    { sector: 'Mobiliário', year: '2028', note: 'Origem da madeira, pegada de carbono e durabilidade. Foco inicial com o piloto Artikalia.' },
    { sector: 'Construção e outros', year: '2027–2030', note: 'Implementação progressiva a quase todos os bens físicos do mercado único.' },
  ],
  protoEyebrow: 'CAMADA A · A CAMADA DE CONFIANÇA',
  protoTitle: 'Ancorado no XRP Ledger.',
  protoSubtitle:
    'Sob cada operação, um protocolo não-custodial une produto, identidade e pagamento numa única verdade verificável. Ativo na testnet XRPL, com transações públicas.',
  protoSeals: [
    { seal: 'PRODUTO', title: 'O Passaporte, ancorado', desc: 'O DPP é selado com um hash canónico (RFC 8785) assinado ed25519 e ancorado no ledger. Reverificável contra a cadeia, não contra a nossa base de dados.' },
    { seal: 'PARTE', title: 'Uma identidade, a sua chave', desc: 'Cada empresa recebe um id digital imutável e chaves ed25519. Cada assinatura —custódia, e-CMR— fica ligada a uma identidade real.' },
    { seal: 'OPERAÇÃO', title: 'Pagamento não-custodial', desc: 'Escrow nativo: o montante é bloqueado e libertado contra entrega verificada pelo oráculo. A 1503 nunca toca no dinheiro; se nada se cumprir, o backstop devolve-o.' },
  ],
  protoProof: 'Ancoragem do DPP e escrow nativo com cripto-condição · provados na testnet XRPL com transações públicas (20 XRP) · escrow de RLUSD (TokenEscrow XLS-85) provado com emissor de testes próprio, pendente com o emissor oficial',
  protoBadge: 'Ativo na testnet XRPL · transações verificáveis no explorador',
  engEyebrow: 'O MOTOR DE CONFORMIDADE',
  engTitle: 'As leis do mundo, cruzadas em código.',
  engSubtitle:
    'Não é uma tabela de países: é um motor composicional que monta as obrigações de cada corredor e bloqueia o que a lei proíbe —antes de operar, não depois.',
  engStats: [
    { value: '167', label: 'Corredores de importação' },
    { value: '177', label: 'Jurisdições KYB mapeadas' },
    { value: '97', label: 'Estados CISG cablados' },
    { value: 'ed25519', label: 'e-CMR assinado · 3 momentos' },
  ],
  engBullets: [
    'Gate de exportação fail-closed: se o destino ou uma parte não passar no rastreio (OFAC · UE · ONU), a operação não é confirmada.',
    'Conjunto documental UCP 600 + e-CMR assinado ed25519 nos três momentos: remetente, transportador e entrega.',
    'Radar de catálogo: varre fornecedores reais e alimenta o core em automático (3.159 fichas já carregadas).',
  ],
  techEyebrow: 'TECNOLOGIA',
  techTitle: 'Infraestrutura verificável',
  techSubtitle:
    'Um Passaporte Digital por produto, um gate de conformidade que rejeita o que a lei proíbe, uma custódia do pagamento libertada contra entrega assinada e uma identidade verificada por operação. Tudo rastreável e auditável por qualquer parte autorizada.',
  techFeatures: [
    { title: 'Identidade verificada (KYC)', desc: 'KYC integrado para empresas. Cada operação está ligada a uma identidade real, verificada face a registos públicos oficiais.' },
    { title: 'Pagamento contra entrega assinada', desc: 'O montante fica em depósito e é libertado quando a entrega ou o marco acordado é confirmado. Sem esperar semanas por um banco intermediário.' },
    { title: 'Conformidade imposta pelo sistema', desc: 'O gate de conformidade exige, no código, os dados e certificados que a lei pede para exportar. O que a norma proíbe não passa.' },
    { title: 'Três oráculos para uma só verdade', desc: 'Um notário, a guia do transitário ou a Owner Key do comprador. O pagamento só é libertado quando um oráculo autorizado confirma que a operação foi cumprida.' },
    { title: 'Videochamada com legendas traduzidas', desc: 'Chamadas 1-a-1 (WebRTC) com legendas traduzidas em direto, para negociar entre países sem barreira linguística.' },
    { title: 'A blockchain é invisível', desc: 'Sem chaves, sem gas, sem jargão: entra-se com um código por email e pensa-se em euros. A PME opera uma secretária B2B normal; o XRP Ledger trabalha por baixo, como a base de dados do seu banco.' },
  ],
  ctaEyebrow: 'JUNTE-SE HOJE',
  ctaTitleA: 'Bem-vindo à internet',
  ctaTitleB: 'do comércio global',
  ctaBody:
    'Junte-se à infraestrutura que liga todos os atores do comércio global: Passaporte Digital de Produto, conformidade de exportação e pagamento libertado contra entrega assinada.',
  ctaBold: 'Registo gratuito · Sem fidelização · 0,5 % por transação.',
  ctaButton: 'Escolha o seu continente ↑',
  footerTagline: 'Infraestrutura para o comércio global.',
  footerSeal: 'Passaporte Digital · Conformidade de exportação',
  footerStandards: 'Padrões · DPP · ISO 20022 · UCP 600\nRGPD · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'Plataforma', links: ['Como funciona', 'Setores', 'Investidores', 'Demo'] },
    { titulo: 'Setores', links: ['Imobiliário', 'Automóvel', 'Saúde', 'Alimentar', 'Transporte'] },
    { titulo: 'Para quem', links: ['Compradores', 'Profissionais', 'Fornecedores'] },
    { titulo: 'Legal', links: ['Privacidade', 'Termos', 'Cookies', 'Conformidade'] },
  ],
  footerCopyright: '© 2026 1503 — Infraestrutura de conformidade para o comércio global',
  footerVersion: 'v0.2 · Pré-MVP',
}

/* ═══════════════════════════════ 中文 ═══════════════════════════════ */
const HOME_ZH: HomeStrings = {
  metaTitle: '1503 — 全球贸易的互联网',
  metaDescription: 'B2B 贸易的信任基础设施：数字产品护照、系统强制的出口合规，以及凭签收放款的支付。',
  continentLabels: { NA: '北美', SA: '南美', EU: '欧洲', OM: '中东', AS: '亚洲', AF: '非洲', OC: '大洋洲' },
  continentAria: '大洲选择器',
  heroBeatA: '1503 年，塞维利亚为世界贸易立下秩序。',
  heroBeatB: '贸易之家记录下每一条航线。',
  heroBeatC: '今天，那条航线是一张*网络*。',
  heroKicker: '数字产品护照 · 出口合规',
  heroTag: '连接整个*全球贸易*的基础设施。',
  heroEnter: '选择一个大洲进入 →',
  scrollHint: '↓ 继续下滑，了解平台',
  langLabel: '语言',
  manifestoEyebrow: '关于我们',
  statusBadge: 'Pre-MVP · 核心已在 XRPL 测试网运行',
  manifestoTitleA: '1503 不是一个交易市场。',
  manifestoTitleB: '它是面向全球贸易的基础设施。',
  manifestoTagline: '数字产品护照 · 系统强制合规 · 已验证 KYC',
  manifestoBody:
    '我们将所有行业与所有国家汇入同一个工作工具。每件产品诞生时都带有其数字产品护照：来源、材料、证书，以及法律要求的出口规则。合规并非可选——它是进入的门槛——而支付托管凭签收放款。每份护照都以规范化哈希（RFC 8785）和加密签名封存：防篡改，且任何一方均可验证。',
  kpis: [
    { value: '11', label: '内置合规的行业' },
    { value: '167', label: '已核验的全球合法贸易走廊' },
    { value: '0.5', unit: '%', label: '每笔操作的费率' },
    { value: '∞', label: '产品可追溯性' },
  ],
  tags: ['数字护照', '强制合规', '已验证 KYC', '已签署托管', '多行业', '多国家'],
  ecoEyebrow: '生态体系支持',
  ecoMemberOf: '成员：',
  erpEyebrow: '你的目录，从源头即合规',
  erpTitleA: '一次接入你的 ERP。',
  erpTitleB: '每件产品诞生即带数字护照。',
  erpBody:
    '我们接入你的 ERP 系统，每个条目都带着其数字产品护照进入你的工作台：来源、材料、证书，以及法律要求出口所需的规则。无需维护网站，也无需手工填写资料：你的目录实时同步、生而合规，随时可与世界上任何国家开展贸易。',
  erpBullets: [
    'ERP 一次接入，目录永久鲜活。',
    '每个条目都带着图片、数据与其数字产品护照进入。',
    '合规闸门在发布前依法校验每一条资料。',
    '一个工作台，即可在全球销售、采购与合规。',
  ],
  erpCaption: '各 ERP 连接器在路线图中 · 目前目录通过雷达与 API 导入',
  erpIllusHeader: 'ERP · 目录已激活',
  howEyebrow: '流程',
  howTitle: '简单如三步',
  howSteps: [
    { num: '01', title: '每件产品诞生即带数字护照', desc: '来源、材料、证书，以及法律要求的出口规则。你的企业身份，在全球范围内经 KYC 验证。' },
    { num: '02', title: '合规闸门决定它能否交易', desc: '系统依法校验每条资料，拒绝不合规者。不合规者既不发布也不出售：合规是进入的门槛，而非最后的手续。' },
    { num: '03', title: '凭签收放款', desc: '托管随你的业务而定。款项存于托管，待交付或约定里程碑确认后放款——绝不提前。' },
  ],
  payEyebrow: '支付模式',
  payTitle: '支付随你的业务而定',
  paySubtitle:
    '每类交易都有其逻辑。托管根据销售类型——小额产品、国内 B2B、服务或进口——决定何时放款。只有在约定条件满足时，资金才会流动。',
  payModels: [
    { num: '01', eyebrow: '直接产品', title: '小额，直接支付', desc: '为最高 500 欧元的快速交易而设：直接支付，无需托管。卖家通过其常用渠道收款。', libera: '即时', split: [{ pct: 100, label: '支付', sub: '3 秒 · 直接' }] },
    { num: '02', eyebrow: '国内 B2B', title: '交付即预言机', desc: '企业对企业订单，全额进入托管。当你的客户确认交付，款项即放款。', libera: '交付确认', split: [{ pct: 100, label: '托管', sub: '交付即放款' }] },
    { num: '03', eyebrow: '专业服务', title: '项目决定节奏', desc: '启动付 50%，结项付 50%。每一笔按里程碑放款。项目中途无收款争议。', libera: '按里程碑', split: [{ pct: 50, label: '50%', sub: '启动' }, { pct: 50, label: '50%', sub: '结项' }] },
    { num: '04', eyebrow: '国际进口', title: '货代放款，而非你的银行', desc: '下单付 30%，70% 进入托管。托管听从货代，在确认集装箱交付时放款。省去 15 天的银行处理。', libera: '货代交货单', split: [{ pct: 30, label: '30%', sub: '下单' }, { pct: 70, label: '70%', sub: '货代' }] },
  ],
  payLiberaPrefix: '放款：',
  payFeeLine: '1503 每笔操作收取 {pct} 费用。所有模式一致，无隐藏费用。',
  payFeePct: '0.5%',
  payFeeMono: '资金托管 · 凭签收放款 · 所有模式同一费率',
  payStatusMono:
    '非托管型 escrow 已在 XRPL 测试网运行 · 法币支付通道（pay-by-bank · Ripple Payments）对接中 · 1503 从不持有资金',
  traceEyebrow: '完全掌控',
  traceTitle: '订单可追溯，五步到位',
  traceSubtitle:
    '你的客户直接在你的管理系统上下单，订单的可追溯性自动逐步生成，直至交付。款项存于托管，凭签收放款。每笔操作均获覆盖，端到端可验证。',
  traceStates: [
    { num: '01', label: '订单', sub: '已确认' },
    { num: '02', label: '支付', sub: '托管中' },
    { num: '03', label: '备货', sub: '在仓' },
    { num: '04', label: '运输', sub: '在途' },
    { num: '05', label: '交付', sub: '已完成' },
  ],
  compEyebrow: '为何选择我们',
  compTitle: '银行与交易市场给不了你的',
  compSubtitle:
    '我们不比价格，我们比信任：数字护照、系统强制合规与完全可追溯——外加凭交付的支付托管——集于一层，银行与交易市场都无法兼得。',
  compColConcept: '项目',
  compColBank: '银行',
  compColMarket: 'B2B 交易市场',
  compRows: [
    { label: '数字产品护照', ours: '原生', bank: '无', other: '无' },
    { label: '法规合规', ours: '系统强制', bank: '无', other: '手动' },
    { label: '产品可追溯性', ours: '完全', bank: '无', other: '无' },
    { label: '出口合规', ours: '走廊规则', bank: '无', other: '无' },
    { label: '企业 KYC', ours: '已验证并集成', bank: '纸面，数周', other: '部分' },
    { label: '支付保障', ours: '资金托管', bank: '手动 escrow', other: '无' },
    { label: '放款', ours: '交付确认时', bank: '1 – 3 天', other: '24 – 48 小时' },
    { label: 'ERP 集成', ours: '通过雷达 / API', bank: '无', other: '部分' },
    { label: '接入与注册', ours: '免费', bank: '开户 + 手续', other: '按月收费' },
    { label: '每笔操作费率', ours: '0.5%', bank: '1.5 – 3.5%', other: '2 – 5%' },
  ],
  autoEyebrow: '繁琐工作，自动完成',
  autoTitle: '不必手工录入，不必面对空白表格。',
  autoSubtitle:
    '合规之所以令人却步，是因为手工劳动。在 1503，这些活由系统来做：目录自动填充，文档自动起草。',
  autoRadarTitle: '雷达 · 你的目录自动填充',
  autoRadarDesc:
    '雷达扫描你供应商的数据源，为每件产品生成带数字护照的规范化卡片并导入核心——无需重复录入。已加载数千条真实产品。',
  autoVeroTitle: 'Vero · 帮你填单证的 AI',
  autoVeroDesc:
    '1503 的助手为你起草合规与出口文档：提出护照字段、所需单证与走廊规则。你审核并确认——Vero 从不独自签署。',
  autoLawTitle: 'RegTech · 法规实时监控',
  autoLawDesc:
    '库中的每条规则都锚定到其官方来源（EUR-Lex、公报、主管机构），并记录法律复核状态。当法规变动时，会被标记以便由人工更新——系统绝不自行改写法律（§0）。',
  probEyebrow: '我们解决的问题',
  probTitle: 'B2B 贸易仍要 5–10 天。它本该只要几小时。',
  probSubtitle:
    '全球贸易每年流转逾 30 万亿美元，而其信任基础设施半个世纪几乎未变。今天它被割裂为四种低效：',
  probItems: [
    { title: '系统互不相通', desc: 'ERP 之间不对话。生意起于邮件、成于电话、确认于 WhatsApp——一路丢失关键数据。' },
    { title: '十套零散工具', desc: '一家中小企业要为多达十套互不集成的方案付费：合规、追溯、体积计算、报关、支付、通讯……' },
    { title: '监管的时钟', desc: '欧盟自 2027 年起强制数字产品护照（ESPR）。现有方案昂贵、面向大型联盟——把 99% 挡在门外。' },
    { title: '缓慢的周期', desc: '卖方、货代与买方缺乏直接协同，每笔出口因重复录入与差错被拖到 5–10 天。' },
  ],
  probOutcome:
    '1503 从根上解决：产品、国际单证与结算在同一个真相源中实时汇聚。接入网络中的一个参与方，就等于接入整张贸易网络——周期从 5–10 天降到几小时，只需一块屏幕。',
  probStatFrom: '5–10 天',
  probStatTo: '几小时',
  probStatLabel: '操作时间的压缩',
  whyEyebrow: '为何是现在',
  whyTitle: '数字产品护照已经是法律。',
  whySubtitle:
    '欧盟生态设计法规（ESPR · 2024/1781）按行业强制数字产品护照。当跨国公司花费数百万做定制咨询时，占产业 99% 的中小企业面临被逐出单一市场的风险。我们不是在推销产品：我们承接一项有明确期限的法定义务，而 1503 是成本最低的路径。',
  whyDeadlines: [
    { sector: '纺织', year: '2027', note: '材料可追溯、可持续成分与源头可回收性。' },
    { sector: '家具', year: '2028', note: '木材来源、碳足迹与耐用性。与 Artikalia 试点同步的初始重点。' },
    { sector: '建筑及其他', year: '2027–2030', note: '逐步覆盖单一市场几乎所有实体商品。' },
  ],
  protoEyebrow: 'A 层 · 信任层',
  protoTitle: '锚定于 XRP Ledger。',
  protoSubtitle:
    '在每一笔操作之下，一个非托管协议将产品、身份与支付合为同一个可验证的真相。已在 XRPL 测试网运行，附公开交易。',
  protoSeals: [
    { seal: '产品', title: '被锚定的护照', desc: '数字产品护照以规范化哈希（RFC 8785）经 ed25519 签名并锚定于账本。可对照链本身核验，而非对照我们的数据库。' },
    { seal: '当事方', title: '身份自持其钥', desc: '每家企业获得不可变的数字身份与 ed25519 密钥。每一次签名——托管、e-CMR——都绑定到真实身份。' },
    { seal: '操作', title: '非托管支付', desc: '原生托管：款项被锁定，凭预言机核验的交付放款。1503 从不接触资金；若无履行，回退机制将其退还。' },
  ],
  protoProof: 'DPP 锚定与带加密条件的原生托管 · 已在 XRPL 测试网以公开交易验证（20 XRP）· RLUSD 托管（TokenEscrow XLS-85）已用自建测试发行方验证，官方发行方尚待完成',
  protoBadge: '已在 XRPL 测试网运行 · 交易可在浏览器核验',
  engEyebrow: '合规引擎',
  engTitle: '把世界的法律，在代码中交叉。',
  engSubtitle:
    '这不是一张国家清单：而是一个组合式引擎，为每条走廊拼装义务，并在开始交易之前——而非之后——拦截法律所禁止之物。',
  engStats: [
    { value: '167', label: '进口走廊' },
    { value: '177', label: '已映射的 KYB 法域' },
    { value: '97', label: '已接入的 CISG 缔约国' },
    { value: 'ed25519', label: 'e-CMR 签名 · 3 个环节' },
  ],
  engBullets: [
    '出口闸门 fail-closed：若目的地或当事方未通过筛查（OFAC · 欧盟 · 联合国），操作不予确认。',
    'UCP 600 单据组 + 在三个环节均以 ed25519 签名的 e-CMR：发货人、承运人与交付。',
    '目录雷达：扫描真实供应商并自动供给核心（已加载 3,159 条产品）。',
  ],
  techEyebrow: '技术',
  techTitle: '可验证的基础设施',
  techSubtitle:
    '每件产品一份数字护照，一道拒绝法律禁止之物的合规闸门，凭签收放款的支付托管，以及每笔操作经验证的身份。全部可追溯，任何获授权方均可审计。',
  techFeatures: [
    { title: '已验证身份（KYC）', desc: '面向企业的内置 KYC。每笔操作都关联到真实身份，并对照官方公开登记核验。' },
    { title: '凭签收放款', desc: '款项存于托管，待交付或约定里程碑确认后放款。无需苦等中间银行数周。' },
    { title: '系统强制合规', desc: '合规闸门在代码中要求法律出口所需的数据与证书。规则所禁，皆不放行。' },
    { title: '三个预言机，一个真相', desc: '公证人、货代交货单，或买方的 Owner Key。只有当获授权的预言机确认操作已履行，才会放款。' },
    { title: '带翻译字幕的视频通话', desc: '一对一通话（WebRTC）配实时翻译字幕，让跨国谈判没有语言障碍。' },
    { title: '区块链是隐形的', desc: '无密钥、无 gas、无术语：用邮件验证码登录，以欧元思考。中小企业操作的是一个普通的 B2B 工作台；XRP Ledger 在底层运作，就像你银行背后的数据库。' },
  ],
  ctaEyebrow: '今天加入',
  ctaTitleA: '欢迎来到',
  ctaTitleB: '全球贸易的互联网',
  ctaBody:
    '加入连接全球贸易各方的基础设施：数字产品护照、出口合规，以及凭签收放款的支付。',
  ctaBold: '免费注册 · 无绑定 · 每笔交易 0.5%。',
  ctaButton: '选择你的大洲 ↑',
  footerTagline: '面向全球贸易的基础设施。',
  footerSeal: '数字护照 · 出口合规',
  footerStandards: '标准 · DPP · ISO 20022 · UCP 600\nGDPR · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: '平台', links: ['运作方式', '行业', '投资者', '演示'] },
    { titulo: '行业', links: ['房地产', '汽车', '医疗', '食品', '运输'] },
    { titulo: '面向谁', links: ['买家', '专业人士', '供应商'] },
    { titulo: '法律', links: ['隐私', '条款', 'Cookie', '合规'] },
  ],
  footerCopyright: '© 2026 1503 — 面向全球贸易的合规基础设施',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ 日本語 ═══════════════════════════════ */
const HOME_JA: HomeStrings = {
  metaTitle: '1503 — グローバル貿易のインターネット',
  metaDescription: 'B2B貿易のための信頼インフラ：デジタル製品パスポート、システムが強制する輸出コンプライアンス、署名済み配送に対して解放される支払い。',
  continentLabels: { NA: '北米', SA: '南米', EU: 'ヨーロッパ', OM: '中東', AS: 'アジア', AF: 'アフリカ', OC: 'オセアニア' },
  continentAria: '大陸セレクター',
  heroBeatA: '1503年、セビリアは世界の交易に秩序を与えた。',
  heroBeatB: '通商院はあらゆる航路を記録した。',
  heroBeatC: '今日、その航路は*ネットワーク*だ。',
  heroKicker: 'デジタル製品パスポート · 輸出コンプライアンス',
  heroTag: '*グローバル貿易*のすべてをつなぐインフラ。',
  heroEnter: '大陸を選んで入る →',
  scrollHint: '↓ スクロールしてプラットフォームを見る',
  langLabel: '言語',
  manifestoEyebrow: '私たちについて',
  statusBadge: 'Pre-MVP · コアはXRPLテストネットで稼働中',
  manifestoTitleA: '1503はマーケットプレイスではありません。',
  manifestoTitleB: 'グローバル貿易のためのインフラです。',
  manifestoTagline: 'デジタル製品パスポート · システムが強制するコンプライアンス · 検証済みKYC',
  manifestoBody:
    'あらゆる業種とあらゆる国を、ひとつの業務ツールに統合します。すべての製品は、デジタル製品パスポートとともに生まれます：原産地、素材、証明書、そして法が求める輸出規則。コンプライアンスは任意ではなく——入口そのものです——支払いのカストディは署名済み配送に対して解放されます。各パスポートは正規化ハッシュ（RFC 8785）と暗号署名で封印され、改ざん不可能で、いかなる当事者も検証できます。',
  kpis: [
    { value: '11', label: 'コンプライアンス内蔵の業種' },
    { value: '167', label: '検証済みの世界の合法貿易回廊' },
    { value: '0.5', unit: '%', label: '取引ごとの手数料' },
    { value: '∞', label: '製品トレーサビリティ' },
  ],
  tags: ['デジタルパスポート', '強制コンプライアンス', '検証済みKYC', '署名済みカストディ', 'マルチ業種', 'マルチ国家'],
  ecoEyebrow: 'エコシステムの支援',
  ecoMemberOf: '参加プログラム：',
  erpEyebrow: 'あなたのカタログ、源流からコンプライアント',
  erpTitleA: 'ERPを一度つなぐだけ。',
  erpTitleB: 'すべての製品がデジタルパスポートとともに生まれる。',
  erpBody:
    '私たちはあなたのERPを接続し、各品目はデジタルパスポートとともにあなたのデスクに入ります：原産地、素材、証明書、そして輸出に法が求める規則。維持するウェブサイトも、手入力のシートも不要：カタログはリアルタイムで同期し、コンプライアントに生まれ、世界中どの国とも取引できます。',
  erpBullets: [
    'ERPを一度接続。カタログはずっと生きたまま。',
    '各品目は画像・データ・デジタル製品パスポートとともに入ります。',
    'コンプライアンス・ゲートが公開前に各シートを法に照らして検証します。',
    '販売・購入・遵守を世界中で行う、ひとつのデスク。',
  ],
  erpCaption: 'ERP別コネクターはロードマップ上 · 現在カタログはレーダーとAPIで取り込み',
  erpIllusHeader: 'ERP · カタログ稼働中',
  howEyebrow: 'プロセス',
  howTitle: 'たった3ステップ',
  howSteps: [
    { num: '01', title: 'すべての製品がデジタルパスポートとともに生まれる', desc: '原産地、素材、証明書、そして法が求める輸出規則。あなたの企業アイデンティティは、世界中でKYC検証済み。' },
    { num: '02', title: 'コンプライアンス・ゲートが取引可否を判断', desc: 'システムは各シートを法に照らして検証し、不適合を却下します。不適合は公開も販売もされません：コンプライアンスは入口であり、最後の手続きではありません。' },
    { num: '03', title: '署名済み配送に対して支払いを解放', desc: 'カストディは取引に合わせて適応します。金額はデポジットに保持され、配送または合意したマイルストーンが確認されたときに解放されます——それより前ではありません。' },
  ],
  payEyebrow: '支払いモデル',
  payTitle: '支払いは取引に合わせて適応',
  paySubtitle:
    '取引の種類ごとに論理があります。カストディは販売の種類——小口製品、国内B2B、サービス、輸入——に応じて解放時期を決めます。合意した条件が満たされたときにのみ、お金は動きます。',
  payModels: [
    { num: '01', eyebrow: '直接製品', title: '小額、直接支払い', desc: '最大500ユーロの迅速な取引向け：カストディなしの直接支払い。売り手はいつもの決済手段で受け取ります。', libera: '即時', split: [{ pct: 100, label: '支払い', sub: '3秒 · 直接' }] },
    { num: '02', eyebrow: '国内B2B', title: '配送がオラクル', desc: '企業間の注文、全額をデポジットに。お客様が配送を確認すると、支払いが解放されます。', libera: '配送確認', split: [{ pct: 100, label: 'エスクロー', sub: '配送で解放' }] },
    { num: '03', eyebrow: 'プロフェッショナルサービス', title: 'ペースはプロジェクトが決める', desc: '開始時50%、完了時50%。各段はマイルストーンに対して解放。プロジェクト途中の支払い争いなし。', libera: 'マイルストーン別', split: [{ pct: 50, label: '50%', sub: '開始' }, { pct: 50, label: '50%', sub: '完了' }] },
    { num: '04', eyebrow: '国際輸入', title: '銀行ではなく、フォワーダーが支払いを解放', desc: '注文時30%、70%をデポジットに。カストディはフォワーダーに従い、コンテナ配送の確認時に解放。銀行処理の15日間は不要。', libera: 'フォワーダーの納品書', split: [{ pct: 30, label: '30%', sub: '注文' }, { pct: 70, label: '70%', sub: 'フォワーダー' }] },
  ],
  payLiberaPrefix: '解放：',
  payFeeLine: '1503の手数料は取引ごとに{pct}。すべてのモデルで同一、隠れた費用なし。',
  payFeePct: '0.5%',
  payFeeMono: '資金はデポジット · 署名済み配送に対して解放 · すべてのモデルで同一コスト',
  payStatusMono:
    '非カストディ型エスクローはXRPLテストネットで稼働中 · 法定通貨の決済レール（pay-by-bank · Ripple Payments）は統合中 · 1503が資金を保持することはありません',
  traceEyebrow: '完全なコントロール',
  traceTitle: '注文のトレーサビリティ、5ステップ',
  traceSubtitle:
    'お客様はあなたの管理システム上で直接注文し、注文のトレーサビリティが配送まで一歩ずつ自動生成されます。金額はデポジットに保持され、署名済み配送に対して解放されます。すべての取引がカバーされ、エンドツーエンドで検証可能です。',
  traceStates: [
    { num: '01', label: '注文', sub: '確認済み' },
    { num: '02', label: '支払い', sub: 'デポジット中' },
    { num: '03', label: '準備', sub: '倉庫内' },
    { num: '04', label: '輸送', sub: '輸送中' },
    { num: '05', label: '配送', sub: '完了' },
  ],
  compEyebrow: '選ばれる理由',
  compTitle: '銀行やマーケットプレイスが与えないもの',
  compSubtitle:
    '私たちは価格ではなく信頼で競います：デジタルパスポート、システムが強制するコンプライアンス、完全なトレーサビリティ——さらに配送に対する支払いカストディ——を、銀行にもマーケットプレイスにもまとめられない単一のレイヤーで。',
  compColConcept: '項目',
  compColBank: '銀行',
  compColMarket: 'B2Bマーケットプレイス',
  compRows: [
    { label: 'デジタル製品パスポート', ours: 'ネイティブ', bank: 'なし', other: 'なし' },
    { label: '規制コンプライアンス', ours: 'システムが強制', bank: 'なし', other: '手動' },
    { label: '製品トレーサビリティ', ours: '完全', bank: 'なし', other: 'なし' },
    { label: '輸出コンプライアンス', ours: '回廊ルール', bank: 'なし', other: 'なし' },
    { label: '企業KYC', ours: '検証済み・統合', bank: '書類、数週間', other: '部分的' },
    { label: '保証された支払い', ours: '資金はデポジット', bank: '手動エスクロー', other: 'なし' },
    { label: '支払いの解放', ours: '配送確認時', bank: '1〜3日', other: '24〜48時間' },
    { label: 'ERP統合', ours: 'レーダー / API経由', bank: 'なし', other: '部分的' },
    { label: 'アクセスと登録', ours: '無料', bank: '口座開設＋手続き', other: '月額料金' },
    { label: '取引ごとの手数料', ours: '0.5%', bank: '1.5〜3.5%', other: '2〜5%' },
  ],
  autoEyebrow: '面倒な作業を、自動で',
  autoTitle: '手入力も、白紙の書類もなし。',
  autoSubtitle:
    'コンプライアンスが怖いのは手作業のせいです。1503ではその作業をシステムが行います：カタログは自動で埋まり、書類は自動で下書きされます。',
  autoRadarTitle: 'レーダー · カタログが自動で埋まる',
  autoRadarDesc:
    'レーダーがサプライヤーの情報源を走査し、各製品の正規化カードをデジタルパスポート付きで生成してコアに取り込みます——再入力は不要。すでに数千件の実データを投入済みです。',
  autoVeroTitle: 'Vero · 書類を埋めるAI',
  autoVeroDesc:
    '1503のアシスタントがコンプライアンスと輸出の書類を下書きします：パスポートの項目、必要書類、回廊のルールを提案します。あなたが確認して承認——Veroが単独で署名することはありません。',
  autoLawTitle: 'RegTech · 法令をウォッチ',
  autoLawDesc:
    'ライブラリの各ルールは公式ソース（EUR-Lex、官報、所管当局）に紐づき、法的レビュー状況が記録されます。法令が変わると、人が更新できるようフラグが立ちます——システムが法を独りで書き換えることはありません（§0）。',
  probEyebrow: '私たちが解決する課題',
  probTitle: 'B2B取引はいまだ5〜10日。本来は数時間で済むはずです。',
  probSubtitle:
    '世界貿易は年間30兆ドル超を動かしますが、その信頼インフラは半世紀ほとんど変わっていません。今日それは4つの非効率に分断されています：',
  probItems: [
    { title: '分断されたシステム', desc: 'ERP同士が対話しません。取引はメールで生まれ、電話で進み、WhatsAppで確定する——その過程で重要なデータが失われます。' },
    { title: 'バラバラな10のツール', desc: '中小企業はコンプライアンス・トレーサビリティ・積載計算・通関・決済・通信など、最大10の非統合ソリューションに支払います。' },
    { title: '規制の時計', desc: 'EUは2027年からデジタル製品パスポート（ESPR）を義務化します。現行のソリューションは高価で大規模コンソーシアム向け——99%を締め出します。' },
    { title: '遅いサイクル', desc: '売り手・フォワーダー・買い手の直接連携がなく、各輸出は再入力とミスで5〜10日に伸びます。' },
  ],
  probOutcome:
    '1503は根本から解決します：製品・国際書類・決済がひとつの真実の源にリアルタイムで集約されます。ネットワークの一当事者につながることは、貿易ネットワーク全体と統合することを意味します——そしてサイクルは5〜10日から数時間へ、ひとつの画面から。',
  probStatFrom: '5〜10日',
  probStatTo: '数時間',
  probStatLabel: '業務時間の圧縮',
  whyEyebrow: 'なぜ今か',
  whyTitle: 'デジタル製品パスポートはすでに法律です。',
  whySubtitle:
    'EUエコデザイン規則（ESPR · 2024/1781）はDPPを分野ごとに義務化します。多国籍企業がオーダーメイドのコンサルに数百万を費やす一方、生産基盤の99%——中小企業——は単一市場から締め出される恐れがあります。私たちは製品を押し売りするのではなく、期限のある法的義務を捉えます。1503は最も低コストの道です。',
  whyDeadlines: [
    { sector: '繊維', year: '2027', note: '素材のトレーサビリティ、持続可能な組成、原産地でのリサイクル性。' },
    { sector: '家具', year: '2028', note: '木材の産地、カーボンフットプリント、耐久性。Artikaliaパイロットと並ぶ初期フォーカス。' },
    { sector: '建設・その他', year: '2027–2030', note: '単一市場のほぼすべての物理的製品へ段階的に展開。' },
  ],
  protoEyebrow: 'レイヤーA · 信頼のレイヤー',
  protoTitle: 'XRP Ledgerに固定。',
  protoSubtitle:
    'あらゆる取引の下で、非カストディのプロトコルが製品・身元・支払いをひとつの検証可能な真実に結びます。XRPLテストネットで稼働中、公開トランザクション付き。',
  protoSeals: [
    { seal: '製品', title: '固定されたパスポート', desc: 'DPPは正規化ハッシュ（RFC 8785）をed25519で署名し、レジャーに固定されます。私たちのデータベースではなく、チェーンそのものに照らして再検証できます。' },
    { seal: '当事者', title: '固有の鍵を持つ身元', desc: '各企業は不変のデジタルIDとed25519鍵を受け取ります。あらゆる署名——カストディ、e-CMR——は実在の身元に紐づきます。' },
    { seal: '取引', title: '非カストディの支払い', desc: 'ネイティブ・エスクロー：金額はロックされ、オラクルが検証した配送に対して解放されます。1503が資金に触れることはなく、何も履行されなければバックストップが返金します。' },
  ],
  protoProof: 'DPPの固定と暗号条件付きネイティブ・エスクロー · XRPLテストネットで公開トランザクションにより実証（20 XRP）· RLUSDエスクロー（TokenEscrow XLS-85）は自社テスト発行体で実証済み、公式発行体では未了',
  protoBadge: 'XRPLテストネットで稼働中 · トランザクションはエクスプローラーで検証可能',
  engEyebrow: 'コンプライアンス・エンジン',
  engTitle: '世界の法を、コードで交差させる。',
  engSubtitle:
    '国の一覧表ではありません：各回廊の義務を組み立て、法が禁じるものを——取引の後ではなく前に——遮断する組成的エンジンです。',
  engStats: [
    { value: '167', label: '輸入回廊' },
    { value: '177', label: 'マッピング済みKYB法域' },
    { value: '97', label: '接続済みCISG締約国' },
    { value: 'ed25519', label: 'e-CMR署名 · 3つの局面' },
  ],
  engBullets: [
    'フェイルクローズドの輸出ゲート：仕向地または当事者がスクリーニング（OFAC · EU · 国連）を通過しなければ、取引は確定されません。',
    'UCP 600の書類一式 + 3つの局面すべてでed25519署名されたe-CMR：荷送人、運送人、配送。',
    'カタログ・レーダー：実在のサプライヤーを走査し、コアへ自動で供給します（すでに3,159件を投入）。',
  ],
  techEyebrow: 'テクノロジー',
  techTitle: '検証可能なインフラ',
  techSubtitle:
    '製品ごとに1つのデジタルパスポート、法が禁じるものを却下するコンプライアンス・ゲート、署名済み配送に対して解放される支払いカストディ、そして取引ごとに検証されるアイデンティティ。すべてトレース可能で、権限を持つ当事者が監査できます。',
  techFeatures: [
    { title: '検証済みアイデンティティ（KYC）', desc: '企業向けの内蔵KYC。すべての取引は実在のアイデンティティに紐づき、公式の公的登録に照らして検証されます。' },
    { title: '署名済み配送に対する支払い', desc: '金額はデポジットに保持され、配送または合意したマイルストーンの確認時に解放されます。仲介銀行を数週間待つ必要はありません。' },
    { title: 'システムが強制するコンプライアンス', desc: 'コンプライアンス・ゲートは、輸出に法が求めるデータと証明書をコード上で要求します。規則が禁じるものは通しません。' },
    { title: 'ひとつの真実に3つのオラクル', desc: '公証人、フォワーダーの納品書、または買い手のOwner Key。権限を持つオラクルが取引の履行を確認したときにのみ、支払いが解放されます。' },
    { title: '翻訳字幕付きビデオ通話', desc: '1対1通話（WebRTC）にリアルタイム翻訳字幕を付け、国をまたぐ交渉を言語の壁なしに。' },
    { title: 'ブロックチェーンは見えない', desc: '鍵も、ガスも、専門用語もなし：メールコードでログインし、ユーロで考えます。中小企業が使うのは普通のB2Bデスク。XRP Ledgerはその下で動きます——銀行の裏側のデータベースのように。' },
  ],
  ctaEyebrow: '今日参加する',
  ctaTitleA: 'ようこそ',
  ctaTitleB: 'グローバル貿易のインターネットへ',
  ctaBody:
    'グローバル貿易のすべての当事者をつなぐインフラに参加しましょう：デジタル製品パスポート、輸出コンプライアンス、そして署名済み配送に対して解放される支払い。',
  ctaBold: '無料登録 · 拘束なし · 取引ごとに0.5%。',
  ctaButton: '大陸を選ぶ ↑',
  footerTagline: 'グローバル貿易のためのインフラ。',
  footerSeal: 'デジタルパスポート · 輸出コンプライアンス',
  footerStandards: '標準 · DPP · ISO 20022 · UCP 600\nGDPR · MiCA-ready · CLARITY-ready',
  footerCols: [
    { titulo: 'プラットフォーム', links: ['仕組み', '業種', '投資家', 'デモ'] },
    { titulo: '業種', links: ['不動産', '自動車', 'ヘルスケア', '食品', '輸送'] },
    { titulo: '対象', links: ['バイヤー', '専門家', 'サプライヤー'] },
    { titulo: '法務', links: ['プライバシー', '利用規約', 'Cookie', 'コンプライアンス'] },
  ],
  footerCopyright: '© 2026 1503 — グローバル貿易のためのコンプライアンス基盤',
  footerVersion: 'v0.2 · Pre-MVP',
}

/* ═══════════════════════════════ MAPA + SELECTOR ═══════════════════════════════ */
const HOME_STRINGS: Record<Lang, HomeStrings> = {
  es: HOME_ES,
  en: HOME_EN,
  fr: HOME_FR,
  de: HOME_DE,
  it: HOME_IT,
  pt: HOME_PT,
  zh: HOME_ZH,
  ja: HOME_JA,
}

export function getHomeStrings(lang: Lang): HomeStrings {
  return HOME_STRINGS[lang] || HOME_EN
}
