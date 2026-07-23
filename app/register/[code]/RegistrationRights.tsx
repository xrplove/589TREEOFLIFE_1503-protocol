'use client'

import { useState } from 'react'
import Link from 'next/link'

// Maps the country selected at signup to the regional privacy block that
// applies to the Actor's residence. The map covers the largest privacy regimes
// referenced in the Privacy Policy (section 11). Every country not listed here
// falls back to the generic "other" block, which points the Actor to the
// Privacy Policy for the full list of jurisdictional rights.
type RegionId = 'eu' | 'uk' | 'ch' | 'us' | 'ca' | 'br' | 'jp' | 'cn' | 'in' | 'other'

const COUNTRY_TO_REGION: Record<string, RegionId> = {
  // EU / EEA (RGPD)
  ES: 'eu', FR: 'eu', DE: 'eu', IT: 'eu', PT: 'eu', NL: 'eu', BE: 'eu', LU: 'eu',
  AT: 'eu', PL: 'eu', GR: 'eu', IE: 'eu', SE: 'eu', FI: 'eu', DK: 'eu',
  CZ: 'eu', SK: 'eu', HU: 'eu', RO: 'eu', BG: 'eu', SI: 'eu', HR: 'eu',
  EE: 'eu', LV: 'eu', LT: 'eu', MT: 'eu', CY: 'eu',
  IS: 'eu', NO: 'eu', LI: 'eu',
  // United Kingdom
  GB: 'uk',
  // Switzerland
  CH: 'ch',
  // United States
  US: 'us',
  // Canada
  CA: 'ca',
  // Brazil
  BR: 'br',
  // Japan
  JP: 'jp',
  // China
  CN: 'cn',
  // India
  IN: 'in',
}

type RegionData = {
  flag: string
  shortLabel: string
  longLabel: string
  intro: string
  rights: string[]
  responseTime?: string
  authority: { name: string; url: string }
  anchor: string
}

// Spanish-only for v0.1-draft; mirrors section 11 of the Privacy Policy. When
// the legal docs are translated, replicate this map per language.
// TODO: i18n — translate to English, French, German, etc. as the legal docs
// gain non-Spanish versions.
const REGIONS: Record<RegionId, RegionData> = {
  eu: {
    flag: '🇪🇺',
    shortLabel: 'RGPD · Unión Europea / EEE',
    longLabel: 'Reglamento (UE) 2016/679',
    intro: 'Como residente en un Estado miembro de la UE o del Espacio Económico Europeo, dispones de los siguientes derechos frente a 1503 en su condición de Responsable del tratamiento:',
    rights: [
      'Acceso a tus datos y a la información del tratamiento (art. 15).',
      'Rectificación y supresión («derecho al olvido», arts. 16-17).',
      'Limitación del tratamiento (art. 18).',
      'Portabilidad en formato estructurado y de uso común (art. 20).',
      'Oposición, incluido el marketing directo (art. 21).',
      'Retirada del consentimiento en cualquier momento, sin afectar a la licitud previa.',
      'No ser objeto de decisiones individuales automatizadas con efectos jurídicos (art. 22).',
      'Reclamación ante la autoridad de control competente.',
    ],
    responseTime: 'Plazo de respuesta: un mes desde la solicitud, prorrogable dos meses adicionales en casos complejos con notificación al solicitante.',
    authority: { name: 'AEPD (España) · autoridad de control de tu Estado miembro', url: 'https://www.aepd.es' },
    anchor: '#s11-eu',
  },
  uk: {
    flag: '🇬🇧',
    shortLabel: 'UK GDPR · Reino Unido',
    longLabel: 'Data Protection Act 2018 + UK GDPR',
    intro: 'Como residente en Reino Unido, dispones de derechos sustancialmente equivalentes a los del RGPD europeo:',
    rights: [
      'Acceso, rectificación, supresión y limitación.',
      'Portabilidad de tus datos en formato estructurado.',
      'Oposición, incluido el marketing directo.',
      'Retirada del consentimiento en cualquier momento.',
      'No ser objeto de decisiones únicamente automatizadas con efectos significativos.',
      'Reclamación ante el ICO.',
    ],
    responseTime: 'Plazo de respuesta: un mes, prorrogable dos meses en casos complejos.',
    authority: { name: 'Information Commissioner\'s Office (ICO)', url: 'https://ico.org.uk' },
    anchor: '#s11-uk',
  },
  ch: {
    flag: '🇨🇭',
    shortLabel: 'revLPD · Suiza',
    longLabel: 'Loi fédérale sur la protection des données (revisada 2023)',
    intro: 'Como residente en Suiza, la revLPD en vigor desde el 1 de septiembre de 2023 te reconoce los siguientes derechos:',
    rights: [
      'Acceso a tus datos personales.',
      'Rectificación, supresión y oposición al tratamiento.',
      'Información sobre el procesamiento, incluida la lógica de decisiones automatizadas significativas.',
      'Reclamación ante el FDPIC.',
    ],
    authority: { name: 'Préposé fédéral à la protection des données et à la transparence (FDPIC)', url: 'https://www.edoeb.admin.ch' },
    anchor: '#s11-ch',
  },
  us: {
    flag: '🇺🇸',
    shortLabel: 'CCPA / CPRA · Estados Unidos',
    longLabel: 'California Consumer Privacy Act + multi-state',
    intro: 'Como residente en California (CCPA/CPRA) tienes los siguientes derechos. Otros estados con normativa propia (Virginia, Colorado, Connecticut, Utah, Texas) reconocen derechos análogos con plazos específicos.',
    rights: [
      'Right to know: categorías y finalidades concretas de la información personal recogida.',
      'Right to delete, con las excepciones del § 1798.105.',
      'Right to correct información inexacta (CPRA § 1798.106).',
      'Right to opt-out of sale or sharing. 1503 no vende ni comparte información personal en el sentido CCPA, pero habilitará el enlace «Do Not Sell or Share» y respetará la señal Global Privacy Control (GPC).',
      'Right to limit use of sensitive personal information (CPRA § 1798.121).',
      'Right to non-discrimination por ejercer estos derechos.',
      'Authorized agent: puedes actuar mediante representante autorizado.',
    ],
    responseTime: 'Plazo de respuesta CCPA: 45 días, prorrogables 45 adicionales con aviso motivado.',
    authority: { name: 'California Privacy Protection Agency (CPPA)', url: 'https://cppa.ca.gov' },
    anchor: '#s11-us',
  },
  ca: {
    flag: '🇨🇦',
    shortLabel: 'PIPEDA + leyes provinciales · Canadá',
    longLabel: 'Personal Information Protection and Electronic Documents Act',
    intro: 'Como residente en Canadá, dispones de los siguientes derechos bajo PIPEDA federal y, según tu provincia, normativa provincial reforzada (Quebec Law 25, Alberta PIPA, BC PIPA):',
    rights: [
      'Acceso, rectificación e impugnación de la exactitud.',
      'Retirada del consentimiento, con las consecuencias contractuales que correspondan.',
      'Para residentes en Quebec: portabilidad e información sobre decisiones automatizadas (Law 25).',
      'Reclamación ante el OPC federal o el comisionado provincial competente.',
    ],
    authority: { name: 'Office of the Privacy Commissioner of Canada (OPC)', url: 'https://www.priv.gc.ca' },
    anchor: '#s11-ca',
  },
  br: {
    flag: '🇧🇷',
    shortLabel: 'LGPD · Brasil',
    longLabel: 'Lei Geral de Proteção de Dados (Lei 13.709/2018)',
    intro: 'Como residente en Brasil, la LGPD te reconoce los siguientes derechos como titular de datos personales:',
    rights: [
      'Confirmación del tratamiento.',
      'Acceso, corrección, anonimización, bloqueo o eliminación.',
      'Portabilidad a otro proveedor.',
      'Eliminación de los datos tratados con base en consentimiento.',
      'Información sobre el uso compartido y posibilidad de no consentir, con consecuencias.',
      'Revisión de decisiones automatizadas que afecten tus intereses.',
      'Reclamación ante la ANPD.',
    ],
    authority: { name: 'Autoridade Nacional de Proteção de Dados (ANPD)', url: 'https://www.gov.br/anpd' },
    anchor: '#s11-br',
  },
  jp: {
    flag: '🇯🇵',
    shortLabel: 'APPI · Japón',
    longLabel: 'Act on the Protection of Personal Information',
    intro: 'Como residente en Japón, la APPI revisada te reconoce los siguientes derechos:',
    rights: [
      'Divulgación de los datos tratados sobre tu persona.',
      'Corrección, suspensión del uso y suspensión del suministro a terceros.',
      'Eliminación.',
      'Notificación previa antes de transferencias internacionales con identificación del país de destino y de las medidas equivalentes.',
      'Reclamación ante el PPC.',
    ],
    authority: { name: 'Personal Information Protection Commission (PPC)', url: 'https://www.ppc.go.jp/en' },
    anchor: '#s11-jp',
  },
  cn: {
    flag: '🇨🇳',
    shortLabel: 'PIPL · China',
    longLabel: 'Personal Information Protection Law',
    intro: 'Como residente en la República Popular China, la PIPL te reconoce los siguientes derechos:',
    rights: [
      'Acceso, copia, corrección y eliminación de tus datos.',
      'Portabilidad a otros tratantes designados que cumplan los requisitos de la CAC.',
      'Retirada del consentimiento, incluido el consentimiento separado para transferencias internacionales y para tratamiento de información personal sensible.',
      'Explicación del tratamiento y oposición a decisiones automatizadas con impacto significativo.',
      'Reclamación ante la CAC y autoridades provinciales.',
    ],
    responseTime: 'Las transferencias internacionales requieren consentimiento separado, evaluación de impacto y, según el caso, certificación, cláusulas tipo de la CAC o evaluación de seguridad obligatoria.',
    authority: { name: 'Cyberspace Administration of China (CAC)', url: 'http://www.cac.gov.cn' },
    anchor: '#s11-cn',
  },
  in: {
    flag: '🇮🇳',
    shortLabel: 'DPDP 2023 · India',
    longLabel: 'Digital Personal Data Protection Act',
    intro: 'Como residente en India, la DPDP 2023 te reconoce los siguientes derechos como Data Principal:',
    rights: [
      'Acceso a la información tratada y al resumen de tratamientos.',
      'Corrección, complemento, actualización y borrado.',
      'Designación de un representante en caso de incapacidad o fallecimiento.',
      'Mecanismo de presentación de quejas ante 1503 (Data Fiduciary) y, en segunda instancia, ante el Data Protection Board of India.',
    ],
    responseTime: '1503 respetará la lista negativa de países restringidos cuando se publique conforme al art. 16 de la DPDP.',
    authority: { name: 'Data Protection Board of India', url: 'https://www.meity.gov.in' },
    anchor: '#s11-in',
  },
  other: {
    flag: '🌐',
    shortLabel: 'Otra jurisdicción',
    longLabel: 'Normativa local + protección extraterritorial cuando aplica',
    intro: 'Tu jurisdicción no figura entre las cubiertas en detalle por nuestra Política de Privacidad. 1503 aplica los principios del RGPD como estándar mínimo universal y respeta la legislación local de protección de datos que te resulte aplicable. Como Actor de 1503 tienes en todo caso:',
    rights: [
      'Acceso a tus datos personales y a la información del tratamiento.',
      'Rectificación y eliminación con las limitaciones legales aplicables.',
      'Oposición y retirada del consentimiento en cualquier momento.',
      'Portabilidad de tus datos.',
      'Reclamación ante 1503 y, si la respuesta no te satisface, ante la autoridad de control que te resulte aplicable.',
    ],
    responseTime: 'Plazo objetivo de respuesta: 30 días desde la solicitud.',
    authority: { name: 'Autoridad de control aplicable según tu residencia', url: 'https://www.aepd.es' },
    anchor: '#s11',
  },
}

// English overlay. Currently the US region (any English visitor's path).
// Regions without an English entry fall back to the Spanish text until the legal
// docs are translated per language (see TODO above).
const REGIONS_EN: Partial<Record<RegionId, RegionData>> = {
  us: {
    flag: '🇺🇸',
    shortLabel: 'CCPA / CPRA · United States',
    longLabel: 'California Consumer Privacy Act + multi-state',
    intro:
      'As a California resident (CCPA/CPRA) you have the following rights. Other states with their own statutes (Virginia, Colorado, Connecticut, Utah, Texas) grant analogous rights with their own timelines.',
    rights: [
      'Right to know: the specific categories and purposes of the personal information collected.',
      'Right to delete, subject to the exceptions in § 1798.105.',
      'Right to correct inaccurate information (CPRA § 1798.106).',
      'Right to opt out of the sale or sharing of personal information. 1503 does not sell or share personal information in the CCPA sense, but will provide a "Do Not Sell or Share" link and honor the Global Privacy Control (GPC) signal.',
      'Right to limit the use of sensitive personal information (CPRA § 1798.121).',
      'Right to non-discrimination for exercising these rights.',
      'Authorized agent: you may act through an authorized representative.',
    ],
    responseTime: 'CCPA response time: 45 days, extendable by a further 45 days with justified notice.',
    authority: { name: 'California Privacy Protection Agency (CPPA)', url: 'https://cppa.ca.gov' },
    anchor: '#s11-us',
  },
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,17,24,0.7)',
  border: '1px solid #1E2530',
  borderRadius: 4,
  padding: 0,
  backdropFilter: 'blur(4px)',
  overflow: 'hidden',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.66rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

export default function RegistrationRights({ countryCode, lang }: { countryCode: string; lang?: string }) {
  const [open, setOpen] = useState(false)
  const code = (countryCode || '').toUpperCase()
  const regionId: RegionId = COUNTRY_TO_REGION[code] || 'other'
  const isEs = lang == null || lang === 'es'
  const r = (!isEs && REGIONS_EN[regionId]) || REGIONS[regionId]
  const T = isEs
    ? { yourRights: 'Tus derechos', open: '▾ Ver derechos', close: '▴ Cerrar', authority: 'Autoridad de control', readPrivacy: 'Leer texto completo en Privacy ↗', terms: 'Términos de Servicio ↗' }
    : { yourRights: 'Your rights', open: '▾ View rights', close: '▴ Close', authority: 'Supervisory authority', readPrivacy: 'Read the full text in Privacy ↗', terms: 'Terms of Service ↗' }

  return (
    <div style={cardStyle}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          padding: '1.5rem 1.75rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{r.flag}</span>
        <div style={{ flex: 1 }}>
          <div style={eyebrowStyle}>{T.yourRights}</div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#E8EDF5',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              marginTop: '0.25rem',
            }}
          >
            {r.shortLabel}
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: '#7A8899',
              marginTop: '0.15rem',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.04em',
            }}
          >
            {r.longLabel}
          </div>
        </div>
        <span
          style={{
            color: '#7A8899',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-dm-mono), monospace',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
          aria-hidden
        >
          {open ? T.close : T.open}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: '0 1.75rem 1.75rem',
            borderTop: '1px solid #1E2530',
            paddingTop: '1.5rem',
          }}
        >
          <p
            style={{
              color: '#9FB6CC',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            {r.intro}
          </p>
          <ul
            style={{
              color: '#9FB6CC',
              fontSize: '0.9rem',
              lineHeight: 1.7,
              paddingLeft: '1.4rem',
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
            }}
          >
            {r.rights.map((right, i) => (
              <li key={i} style={{ marginBottom: '0.35rem' }}>
                {right}
              </li>
            ))}
          </ul>
          {r.responseTime && (
            <p
              style={{
                color: '#7A8899',
                fontSize: '0.82rem',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontStyle: 'italic',
              }}
            >
              {r.responseTime}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              background: 'rgba(0,163,255,0.04)',
              border: '1px solid rgba(0,163,255,0.2)',
              borderRadius: 3,
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                fontSize: '0.66rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#00A3FF',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontWeight: 600,
              }}
            >
              {T.authority}
            </div>
            <a
              href={r.authority.url}
              target="_blank"
              rel="noopener"
              style={{
                color: '#9FB6CC',
                fontSize: '0.88rem',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(159,182,204,0.4)',
                paddingBottom: 1,
                width: 'fit-content',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {r.authority.name} ↗
            </a>
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <Link
              href={`/legal/privacy${r.anchor}`}
              target="_blank"
              rel="noopener"
              style={{
                color: '#00A3FF',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(0,163,255,0.4)',
                paddingBottom: 1,
              }}
            >
              {T.readPrivacy}
            </Link>
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener"
              style={{
                color: '#7A8899',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                textDecoration: 'none',
                borderBottom: '1px dashed rgba(122,136,153,0.4)',
                paddingBottom: 1,
              }}
            >
              {T.terms}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
