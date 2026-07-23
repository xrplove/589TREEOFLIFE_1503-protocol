import Link from 'next/link'
import { notFound } from 'next/navigation'
import BlockchainBackground from '../../components/BlockchainBackground'
import { CONTINENTS, flagEmoji } from '../../data/continents'
import { getLegalSetup, getRequiredDocs } from '../../data/legalEntities'
import { getRegisterStrings, langForCountry, fill, type Lang } from '../../data/i18n'
import RegisterPersist from './RegisterPersist'
import RegistrationFlow from './RegistrationFlow'
import type { RegistrationDataLabels } from './RegistrationData'
import type { ConsentLabels } from './RegistrationConsents'

export function generateStaticParams() {
  const all: { code: string }[] = []
  for (const c of CONTINENTS) {
    for (const country of c.countries) {
      all.push({ code: country.code.toLowerCase() })
    }
  }
  return all
}

function findCountry(code: string): { code: string; name: string; continentLabel: string; continentId: string } | null {
  const upper = code.toUpperCase()
  for (const c of CONTINENTS) {
    const found = c.countries.find((co) => co.code === upper)
    if (found) return { code: upper, name: found.name, continentLabel: c.label, continentId: c.id }
  }
  return null
}

const LANG_LABEL: Record<Lang, string> = {
  es: 'Español', en: 'English', fr: 'Français', de: 'Deutsch',
  it: 'Italiano', pt: 'Português', zh: '中文', ja: '日本語',
}

/** Compact badge labels shown next to each entity option to mark it as
    "individual" or "company". Kept here (not in i18n.ts) because they're
    only ever used in the registration card. */
const KIND_TAG_INDIVIDUAL: Record<Lang, string> = {
  es: 'INDIVIDUAL', en: 'INDIVIDUAL', fr: 'INDIVIDUEL', de: 'EINZELPERSON',
  it: 'INDIVIDUALE', pt: 'INDIVIDUAL', zh: '个人', ja: '個人',
}
const KIND_TAG_COMPANY: Record<Lang, string> = {
  es: 'EMPRESA', en: 'COMPANY', fr: 'ENTREPRISE', de: 'UNTERNEHMEN',
  it: 'IMPRESA', pt: 'EMPRESA', zh: '企业', ja: '法人',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,17,24,0.7)',
  border: '1px solid #1E2530',
  borderRadius: 4,
  padding: '2rem 1.75rem',
  backdropFilter: 'blur(4px)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#00A3FF',
  fontSize: '0.72rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

function HexBullet({ color = '#00A3FF', size = 12 }: { color?: string; size?: number }) {
  const r = size / 2
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`)
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, marginTop: 4 }}>
      <polygon points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.3} />
      <circle cx={r} cy={r} r={r * 0.32} fill={color} />
    </svg>
  )
}

export default async function RegisterCountryPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const country = findCountry(code)
  if (!country) notFound()

  const lang = langForCountry(country.code)
  const t = getRegisterStrings(lang)

  const setup = getLegalSetup(country.code)
  const flag = flagEmoji(country.code)

  // Localised labels for the embedded LogoUpload + DocsUpload (used inside
  // RegistrationFlow). Phase 1 covers ES + EN; the others fall back to EN.
  const logoLabels = lang === 'es'
    ? {
        eyebrow: 'Identidad visual',
        title: 'Logo de tu empresa',
        body: 'Sube el logo (PNG o JPG) que verán otros actores en tu escritorio y en cada operación. Opcional, lo puedes cambiar luego.',
        ctaUpload: 'Subir logo',
        ctaReplace: 'Cambiar logo',
        ctaRemove: 'Quitar',
      }
    : {
        eyebrow: 'Visual identity',
        title: 'Your company logo',
        body: 'Upload the logo (PNG or JPG) other actors will see on your desktop and in every operation. Optional, you can change it later.',
        ctaUpload: 'Upload logo',
        ctaReplace: 'Replace logo',
        ctaRemove: 'Remove',
      }
  const docsLabels = lang === 'es'
    ? {
        click: 'Click para subir archivo →',
        uploaded: 'Subido',
        replace: 'click para cambiar',
        tooBig: 'Por ahora el archivo debe pesar menos de 3 MB. Cuando se conecte el almacenamiento cifrado podrás subir archivos más grandes.',
      }
    : {
        click: 'Click to upload file →',
        uploaded: 'Uploaded',
        replace: 'click to replace',
        tooBig: 'For now files must be under 3 MB. When the encrypted storage is connected you will be able to upload larger files.',
      }

  // Consent labels. Los textos LEGALES específicos (kyc*Description,
  // termsPrivacyDescription, marketingDescription) NO se traducen a los 6
  // idiomas extra (FR/DE/IT/PT/ZH/JA) sin revisión legal humana — usan EN
  // como fallback. Los textos UI no-legales SÍ se traducen a los 8 idiomas.
  // Cuando los documentos legales se traduzcan oficialmente, mover todo a
  // i18n.ts.
  const consentLabels: ConsentLabels = buildConsentLabels(lang)

  const dataLabels: RegistrationDataLabels = {
    eyebrow: t.dataEyebrow,
    titleIndividual: t.dataTitleIndividual,
    titleCompany: t.dataTitleCompany,
    body: t.dataBody,
    pickFirst: t.dataPickFirst,
    firstName: t.dataFirstName,
    lastName: t.dataLastName,
    taxIdIndividual: t.dataTaxIdIndividual,
    companyName: t.dataCompanyName,
    legalRep: t.dataLegalRep,
    email: t.dataEmail,
    emailHint: t.dataEmailHint,
    emailInvalid: t.dataEmailInvalid,
    phone: t.dataPhone,
    address: t.dataAddress,
    fiscalAddress: t.dataFiscalAddress,
    postalCode: t.dataPostalCode,
    city: t.dataCity,
    yearsInSector: t.dataYearsInSector,
    optional: t.dataOptional,
    // Password labels — kept inline (ES + EN with EN fallback) until i18n.ts
    // gains password keys for all 8 languages. Same pattern as consentLabels.
    password: lang === 'es' ? 'Contraseña' : 'Password',
    passwordHint: lang === 'es' ? 'Mínimo 8 caracteres' : 'At least 8 characters',
    passwordTooShort:
      lang === 'es'
        ? 'La contraseña debe tener al menos 8 caracteres'
        : 'Password must be at least 8 characters',
    confirmPassword: lang === 'es' ? 'Confirmar contraseña' : 'Confirm password',
    confirmPasswordMismatch:
      lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match',
  }

  return (
    <>
      <BlockchainBackground />
      <RegisterPersist code={country.code} />
      <main
        lang={lang}
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          background: '#08090F',
          color: '#E8EDF5',
          padding: '5vh 2rem 5rem',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Top nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '3rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Link
              href={`/continent/${country.continentId}`}
              style={{
                color: '#7A8899',
                fontSize: '0.78rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-dm-mono), monospace',
                textDecoration: 'none',
              }}
            >
              ← {fill(t.back, { continent: country.continentLabel })}
            </Link>
            <span style={{ ...eyebrowStyle, fontSize: '0.7rem' }}>{t.eyebrow}</span>
            <span style={{ minWidth: 1 }} />
          </div>

          {/* Country hero */}
          <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                fontSize: '5rem',
                lineHeight: 1,
                marginBottom: '1rem',
                filter: 'drop-shadow(0 4px 24px rgba(0,163,255,0.18))',
              }}
            >
              {flag}
            </div>
            <span style={eyebrowStyle}>{t.registerEyebrow}</span>
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                lineHeight: 1,
                margin: '0.6rem 0',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#E8EDF5',
              }}
            >
              {country.name}
            </h1>
            <p
              style={{
                color: '#7A8899',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                maxWidth: 640,
                margin: '1rem auto 0',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
              }}
            >
              {fill(t.promise, { country: country.name })}
            </p>
            {/* Subtle language indicator */}
            <div
              style={{
                marginTop: '1.25rem',
                fontSize: '0.7rem',
                color: '#4A5566',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              ◆ {LANG_LABEL[lang]} · {lang.toUpperCase()}
            </div>
          </header>

          {/* Interactive registration flow:
              legal entity → docs (filtered) → sector + role → logo → CTA
              Lives in a client component because every step has its own state. */}
          <RegistrationFlow
            countryCode={country.code}
            countryName={country.name}
            entities={setup.entities}
            registry={setup.registry}
            taxIdLabel={setup.taxIdLabel}
            extraDocs={setup.extraDocs}
            individualDocs={t.individualDocs}
            companyDocs={t.companyDocs}
            legalEyebrow={t.legalEyebrow}
            legalTitle={t.legalTitle}
            legalBody={fill(t.legalBody, { country: country.name })}
            legalRegistry={t.legalRegistry}
            legalTaxId={t.legalTaxId}
            docsEyebrow={t.docsEyebrow}
            docsTitle={t.docsTitle}
            docsBody={t.docsBody}
            docsDraftBadge={t.docsDraftBadge}
            docsDraftBody={t.docsDraftBody}
            selectEntityFirst={t.selectEntityFirst}
            sectorEyebrow={t.sectorEyebrow}
            sectorTitle={t.sectorTitle}
            sectorBody={t.sectorBody}
            sectorPickFirst={t.sectorPickFirst}
            subsectorLabel={t.subsectorLabel}
            subsectorPickFirst={t.subsectorPickFirst}
            roleLabel={t.roleLabel}
            roleOptional={t.roleOptional}
            roleDraftNote={t.roleDraftNote}
            ctaEyebrow={t.ctaEyebrow}
            ctaTitle={t.ctaTitle}
            ctaBody={t.ctaBody}
            ctaPrimary={t.ctaPrimary}
            logoLabels={logoLabels}
            docsLabels={docsLabels}
            dataLabels={dataLabels}
            consentLabels={consentLabels}
            labelIndividual={KIND_TAG_INDIVIDUAL[lang] || 'INDIVIDUAL'}
            labelCompany={KIND_TAG_COMPANY[lang] || 'COMPANY'}
          />

          {(setup.kybLegalBasis || setup.taxAuthorityUrl || setup.registryUrl) && (
            <section
              aria-label={lang === 'es' ? 'Base legal y fuentes oficiales' : 'Legal basis and official sources'}
              style={{
                marginTop: '3rem',
                padding: '1.5rem 1.6rem',
                border: '1px solid #1E2530',
                borderRadius: 4,
                background: 'rgba(14,17,24,0.6)',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#00A3FF',
                  fontFamily: 'var(--font-dm-mono), monospace',
                }}
              >
                {lang === 'es' ? 'Base legal y fuentes oficiales' : 'Legal basis & official sources'}
              </span>
              <dl style={{ margin: '1rem 0 0', display: 'grid', gap: '0.85rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
                <div>
                  <dt style={{ color: '#7A8899', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>
                    {lang === 'es' ? 'Registro mercantil' : 'Company registry'}
                  </dt>
                  <dd style={{ margin: '0.25rem 0 0', color: '#E8EDF5' }}>
                    {setup.registry}
                    {setup.registryUrl ? (
                      <>
                        {' · '}
                        <a href={setup.registryUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00A3FF', wordBreak: 'break-all' }}>
                          {setup.registryUrl}
                        </a>
                      </>
                    ) : null}
                  </dd>
                </div>
                {setup.taxAuthority && (
                  <div>
                    <dt style={{ color: '#7A8899', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>
                      {lang === 'es' ? 'Autoridad fiscal' : 'Tax authority'}
                    </dt>
                    <dd style={{ margin: '0.25rem 0 0', color: '#E8EDF5' }}>
                      {setup.taxAuthority} ({setup.taxIdLabel})
                      {setup.taxAuthorityUrl ? (
                        <>
                          {' · '}
                          <a href={setup.taxAuthorityUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00A3FF', wordBreak: 'break-all' }}>
                            {setup.taxAuthorityUrl}
                          </a>
                        </>
                      ) : null}
                    </dd>
                  </div>
                )}
                {setup.kybLegalBasis && (
                  <div>
                    <dt style={{ color: '#7A8899', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>
                      {lang === 'es' ? 'Base legal KYB / AML' : 'KYB / AML legal basis'}
                    </dt>
                    <dd style={{ margin: '0.25rem 0 0', color: '#E8EDF5' }}>{setup.kybLegalBasis}</dd>
                  </div>
                )}
              </dl>
              <p style={{ marginTop: '1.1rem', fontSize: '0.7rem', color: '#4A5566', fontFamily: 'var(--font-dm-mono), monospace', lineHeight: 1.6 }}>
                {lang === 'es'
                  ? 'Fuentes públicas oficiales · aplicabilidad y suficiencia sujetas a revisión de un experto legal.'
                  : 'Official public sources · applicability and sufficiency subject to expert legal review.'}
              </p>
            </section>
          )}

          <p
            style={{
              marginTop: '3rem',
              textAlign: 'center',
              color: '#4A5566',
              fontSize: '0.74rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-mono), monospace',
            }}
          >
            {t.trustFooter}
          </p>
        </div>
      </main>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Consent labels por idioma (8 idiomas)
// ─────────────────────────────────────────────────────────────────────
// Diseño honesto:
//   - Los textos LEGALES (kycIdentityDescription, kycSocietaryDescription,
//     kycAuthoritiesDescription, termsPrivacyDescription, kycBiometricDescription,
//     marketingDescription) se mantienen únicamente en ES y EN. Traducirlos
//     a otros idiomas sin revisión legal humana sería temerario.
//   - Los textos UI (eyebrow, title, body, etiquetas de los nuevos checks
//     de visibilidad...) sí se traducen a los 8 idiomas.
//   - Para FR/DE/IT/PT/ZH/JA: los campos UI son del idioma local; los
//     legales heredan EN.

function buildConsentLabels(lang: Lang): ConsentLabels {
  const legal = LEGAL_DESCRIPTIONS[lang === 'es' ? 'es' : 'en']
  const ui = UI_BY_LANG[lang] ?? UI_BY_LANG.en
  return { ...legal, ...ui }
}

const LEGAL_DESCRIPTIONS: Record<'es' | 'en', Pick<ConsentLabels,
  'kycIdentityLabel' | 'kycIdentityDescription'
  | 'kycSocietaryLabel' | 'kycSocietaryDescription'
  | 'kycAuthoritiesLabel' | 'kycAuthoritiesDescription'
  | 'termsPrivacyLabel' | 'termsPrivacyDescription'
  | 'kycBiometricLabel' | 'kycBiometricDescription'
  | 'marketingLabel' | 'marketingDescription'
>> = {
  es: {
    kycIdentityLabel: 'Identificación legal y AML',
    kycIdentityDescription:
      'Acepto que 1503 trate mi documento de identidad para cumplir con la Ley 10/2010 y normativa equivalente, conservándolo durante 10 años desde el cese de la relación.',
    kycSocietaryLabel: 'Datos societarios y profesionales',
    kycSocietaryDescription:
      'Acepto el cotejo de los datos societarios o profesionales aportados con los registros públicos oficiales del país de ejercicio.',
    kycAuthoritiesLabel: 'Cesiones a autoridades por requerimiento legal',
    kycAuthoritiesDescription:
      'Acepto que 1503 pueda comunicar mis datos KYC a SEPBLAC, AEAT, autoridad judicial o supervisor financiero cuando exista requerimiento legal.',
    termsPrivacyLabel: 'Términos de Servicio y Política de Privacidad',
    termsPrivacyDescription:
      'Declaro haber leído y aceptado los Términos de Servicio y la Política de Privacidad de 1503.',
    kycBiometricLabel: 'Verificación biométrica (liveness check)',
    kycBiometricDescription:
      'Doy mi consentimiento explícito al tratamiento biométrico facial con el único fin de verificar mi identidad. La plantilla se elimina al finalizar el proceso. Si no acepto, puedo solicitar la vía de verificación humana asistida.',
    marketingLabel: 'Comunicaciones comerciales del Operador',
    marketingDescription:
      'Acepto recibir comunicaciones del Operador con novedades de la Plataforma. Puedo retirar este consentimiento con un clic en cualquier momento, sin que afecte a mi alta.',
  },
  en: {
    kycIdentityLabel: 'Legal identification and AML',
    kycIdentityDescription:
      'I agree that 1503 processes my identity document to comply with Spanish Law 10/2010 and equivalent regulations, keeping it for 10 years after the relationship ends.',
    kycSocietaryLabel: 'Corporate and professional data',
    kycSocietaryDescription:
      'I agree to the cross-check of the corporate or professional data provided against the official public registries of my country of practice.',
    kycAuthoritiesLabel: 'Disclosures to authorities upon legal request',
    kycAuthoritiesDescription:
      'I agree that 1503 may share my KYC data with SEPBLAC, the tax authority, judicial authorities or the financial supervisor when there is a legal request.',
    termsPrivacyLabel: 'Terms of Service and Privacy Policy',
    termsPrivacyDescription:
      "I declare that I have read and accept 1503's Terms of Service and Privacy Policy.",
    kycBiometricLabel: 'Biometric verification (liveness check)',
    kycBiometricDescription:
      'I give my explicit consent to facial biometric processing for the sole purpose of identity verification. The template is deleted at the end of the process. If I refuse, I may request the human-assisted verification path.',
    marketingLabel: "Operator's commercial communications",
    marketingDescription:
      'I agree to receive Operator communications about platform updates. I can withdraw this consent with one click at any time, without affecting my registration.',
  },
}

type UiLabels = Pick<ConsentLabels,
  'eyebrow' | 'title' | 'body' | 'required' | 'optional' | 'readDoc'
  | 'readToS' | 'readPrivacy' | 'readConsentKyc' | 'readConsentMarketing'
  | 'missingNotice'
  | 'visibilitySectionEyebrow' | 'visibilitySectionTitle'
  | 'visibilityDirectoryQuestion' | 'visibilityDirectoryDetail'
  | 'visibilityTrajectoryQuestion' | 'visibilityTrajectoryDetail'
  | 'visibilityConsentYes' | 'visibilityConsentNo' | 'visibilityMissingNotice'
>

const UI_BY_LANG: Record<Lang, UiLabels> = {
  es: {
    eyebrow: 'Consentimientos legales',
    title: 'Antes de continuar',
    body: 'Marca cada casilla obligatoria para activar el alta. Las opcionales no afectan al registro y puedes cambiarlas más tarde desde tu panel.',
    required: 'OBLIGATORIO',
    optional: 'OPCIONAL',
    readDoc: 'Leer documento',
    readToS: 'Términos de Servicio',
    readPrivacy: 'Política de Privacidad',
    readConsentKyc: 'Consentimiento KYC',
    readConsentMarketing: 'Consentimiento marketing',
    missingNotice: 'Faltan consentimientos obligatorios para activar el alta',
    visibilitySectionEyebrow: 'Privacidad y visibilidad',
    visibilitySectionTitle: 'Tú decides qué información es pública',
    visibilityDirectoryQuestion: '¿Aparecer en el directorio público de Actores?',
    visibilityDirectoryDetail:
      'Otros Actores KYC-verificados podrán ver tu nombre o razón social, sector, rol, país y ciudad, y podrán iniciar conversación contigo. Si dices NO, tu ficha no será encontrable y otros no podrán contactarte por la plataforma. Puedes cambiar esta decisión en cualquier momento desde Mi Perfil.',
    visibilityTrajectoryQuestion: '¿Mostrar tu trayectoria de operaciones?',
    visibilityTrajectoryDetail:
      'En tu ficha pública aparecerán métricas computadas a partir de operaciones reales en la plataforma (operaciones cerradas, entregas a tiempo, pagos puntuales). Si dices NO, esa sección se oculta a otros. Puedes cambiar esta decisión en cualquier momento desde Mi Perfil.',
    visibilityConsentYes: 'Sí consiento',
    visibilityConsentNo: 'No consiento',
    visibilityMissingNotice: 'Elige una opción en cada pregunta para continuar',
  },
  en: {
    eyebrow: 'Legal consents',
    title: 'Before continuing',
    body: 'Tick each required box to enable signup. Optional ones do not affect registration and you can change them later from your panel.',
    required: 'REQUIRED',
    optional: 'OPTIONAL',
    readDoc: 'Read document',
    readToS: 'Terms of Service',
    readPrivacy: 'Privacy Policy',
    readConsentKyc: 'KYC consent',
    readConsentMarketing: 'Marketing consent',
    missingNotice: 'Some required consents are missing to enable signup',
    visibilitySectionEyebrow: 'Privacy and visibility',
    visibilitySectionTitle: 'You decide what is public',
    visibilityDirectoryQuestion: 'Appear in the public directory of Actors?',
    visibilityDirectoryDetail:
      'Other KYC-verified Actors will be able to see your name or company, sector, role, country and city, and they will be able to start a conversation with you. If you choose NO, your profile will not be discoverable and others will not be able to contact you through the platform. You can change this decision at any time from My Profile.',
    visibilityTrajectoryQuestion: 'Show your operations history?',
    visibilityTrajectoryDetail:
      'Your public profile will display metrics computed from real platform operations (closed operations, on-time deliveries, on-time payments). If you choose NO, that section is hidden to others. You can change this decision at any time from My Profile.',
    visibilityConsentYes: 'Yes, I consent',
    visibilityConsentNo: 'No, I do not',
    visibilityMissingNotice: 'Choose an option for each question to continue',
  },
  fr: {
    eyebrow: 'Consentements légaux',
    title: 'Avant de continuer',
    body: 'Cochez chaque case obligatoire pour activer l\'inscription. Les optionnelles n\'affectent pas l\'inscription et vous pouvez les modifier plus tard depuis votre panneau.',
    required: 'OBLIGATOIRE',
    optional: 'OPTIONNEL',
    readDoc: 'Lire le document',
    readToS: 'Conditions de Service',
    readPrivacy: 'Politique de Confidentialité',
    readConsentKyc: 'Consentement KYC',
    readConsentMarketing: 'Consentement marketing',
    missingNotice: 'Il manque des consentements obligatoires pour activer l\'inscription',
    visibilitySectionEyebrow: 'Confidentialité et visibilité',
    visibilitySectionTitle: 'Vous décidez de ce qui est public',
    visibilityDirectoryQuestion: 'Apparaître dans l\'annuaire public des Acteurs ?',
    visibilityDirectoryDetail:
      'Les autres acteurs KYC-vérifiés pourront voir votre nom ou raison sociale, secteur, rôle, pays et ville, et démarrer une conversation avec vous. Si vous choisissez NON, votre fiche ne sera pas trouvable et les autres ne pourront pas vous contacter via la plateforme. Vous pouvez modifier cette décision à tout moment depuis Mon Profil.',
    visibilityTrajectoryQuestion: 'Montrer votre parcours d\'opérations ?',
    visibilityTrajectoryDetail:
      'Votre fiche publique affichera des indicateurs calculés à partir d\'opérations réelles (opérations clôturées, livraisons à temps, paiements à temps). Si vous choisissez NON, cette section est masquée aux autres. Vous pouvez modifier cette décision à tout moment depuis Mon Profil.',
    visibilityConsentYes: 'Oui, je consens',
    visibilityConsentNo: 'Non, je refuse',
    visibilityMissingNotice: 'Choisissez une option pour chaque question pour continuer',
  },
  de: {
    eyebrow: 'Rechtliche Einwilligungen',
    title: 'Bevor Sie fortfahren',
    body: 'Aktivieren Sie jedes erforderliche Kontrollkästchen, um die Anmeldung zu aktivieren. Die optionalen wirken sich nicht auf die Registrierung aus und können später über Ihr Panel geändert werden.',
    required: 'ERFORDERLICH',
    optional: 'OPTIONAL',
    readDoc: 'Dokument lesen',
    readToS: 'Nutzungsbedingungen',
    readPrivacy: 'Datenschutzerklärung',
    readConsentKyc: 'KYC-Einwilligung',
    readConsentMarketing: 'Marketing-Einwilligung',
    missingNotice: 'Es fehlen erforderliche Einwilligungen zum Aktivieren der Anmeldung',
    visibilitySectionEyebrow: 'Privatsphäre und Sichtbarkeit',
    visibilitySectionTitle: 'Sie entscheiden, was öffentlich ist',
    visibilityDirectoryQuestion: 'Im öffentlichen Akteursverzeichnis erscheinen?',
    visibilityDirectoryDetail:
      'Andere KYC-verifizierte Akteure können Ihren Namen oder Firmennamen, Sektor, Rolle, Land und Stadt sehen und eine Unterhaltung mit Ihnen beginnen. Wenn Sie NEIN wählen, ist Ihr Profil nicht auffindbar und andere können Sie nicht über die Plattform kontaktieren. Sie können diese Entscheidung jederzeit in Mein Profil ändern.',
    visibilityTrajectoryQuestion: 'Ihren Werdegang der Operationen zeigen?',
    visibilityTrajectoryDetail:
      'Ihr öffentliches Profil zeigt Kennzahlen aus echten Plattform-Operationen (abgeschlossene Operationen, pünktliche Lieferungen, pünktliche Zahlungen). Bei NEIN wird dieser Abschnitt vor anderen verborgen. Sie können diese Entscheidung jederzeit in Mein Profil ändern.',
    visibilityConsentYes: 'Ja, ich stimme zu',
    visibilityConsentNo: 'Nein, ich lehne ab',
    visibilityMissingNotice: 'Wählen Sie eine Option für jede Frage, um fortzufahren',
  },
  it: {
    eyebrow: 'Consensi legali',
    title: 'Prima di continuare',
    body: 'Seleziona ogni casella obbligatoria per attivare la registrazione. Le opzionali non influenzano la registrazione e puoi modificarle in seguito dal tuo pannello.',
    required: 'OBBLIGATORIO',
    optional: 'OPZIONALE',
    readDoc: 'Leggi il documento',
    readToS: 'Termini di Servizio',
    readPrivacy: 'Informativa sulla Privacy',
    readConsentKyc: 'Consenso KYC',
    readConsentMarketing: 'Consenso marketing',
    missingNotice: 'Mancano consensi obbligatori per attivare la registrazione',
    visibilitySectionEyebrow: 'Privacy e visibilità',
    visibilitySectionTitle: 'Decidi tu cosa è pubblico',
    visibilityDirectoryQuestion: 'Apparire nella directory pubblica degli Attori?',
    visibilityDirectoryDetail:
      'Altri attori KYC-verificati potranno vedere il tuo nome o ragione sociale, settore, ruolo, paese e città, e iniziare una conversazione con te. Se scegli NO, il tuo profilo non sarà trovabile e gli altri non potranno contattarti tramite la piattaforma. Puoi modificare questa decisione in qualsiasi momento da Il Mio Profilo.',
    visibilityTrajectoryQuestion: 'Mostrare il tuo percorso di operazioni?',
    visibilityTrajectoryDetail:
      'Il tuo profilo pubblico mostrerà metriche calcolate da operazioni reali sulla piattaforma (operazioni chiuse, consegne puntuali, pagamenti puntuali). Se scegli NO, quella sezione è nascosta agli altri. Puoi modificare questa decisione in qualsiasi momento da Il Mio Profilo.',
    visibilityConsentYes: 'Sì, acconsento',
    visibilityConsentNo: 'No, non acconsento',
    visibilityMissingNotice: 'Scegli un\'opzione per ogni domanda per continuare',
  },
  pt: {
    eyebrow: 'Consentimentos legais',
    title: 'Antes de continuar',
    body: 'Marque cada caixa obrigatória para ativar a inscrição. As opcionais não afetam a inscrição e pode alterá-las mais tarde no seu painel.',
    required: 'OBRIGATÓRIO',
    optional: 'OPCIONAL',
    readDoc: 'Ler documento',
    readToS: 'Termos de Serviço',
    readPrivacy: 'Política de Privacidade',
    readConsentKyc: 'Consentimento KYC',
    readConsentMarketing: 'Consentimento marketing',
    missingNotice: 'Faltam consentimentos obrigatórios para ativar a inscrição',
    visibilitySectionEyebrow: 'Privacidade e visibilidade',
    visibilitySectionTitle: 'Você decide o que é público',
    visibilityDirectoryQuestion: 'Aparecer na directoria pública de Atores?',
    visibilityDirectoryDetail:
      'Outros atores KYC-verificados poderão ver o seu nome ou razão social, setor, papel, país e cidade, e iniciar uma conversa consigo. Se disser NÃO, o seu perfil não será encontrável e os outros não poderão contactá-lo através da plataforma. Pode alterar esta decisão a qualquer momento em Meu Perfil.',
    visibilityTrajectoryQuestion: 'Mostrar a sua trajetória de operações?',
    visibilityTrajectoryDetail:
      'O seu perfil público mostrará métricas calculadas a partir de operações reais na plataforma (operações fechadas, entregas pontuais, pagamentos pontuais). Se disser NÃO, essa secção é ocultada aos outros. Pode alterar esta decisão a qualquer momento em Meu Perfil.',
    visibilityConsentYes: 'Sim, consinto',
    visibilityConsentNo: 'Não consinto',
    visibilityMissingNotice: 'Escolha uma opção para cada pergunta para continuar',
  },
  zh: {
    eyebrow: '法律同意',
    title: '继续之前',
    body: '勾选每个必需的复选框以激活注册。可选项不影响注册,您可以稍后从面板更改。',
    required: '必需',
    optional: '可选',
    readDoc: '阅读文档',
    readToS: '服务条款',
    readPrivacy: '隐私政策',
    readConsentKyc: 'KYC 同意',
    readConsentMarketing: '营销同意',
    missingNotice: '缺少必需的同意才能激活注册',
    visibilitySectionEyebrow: '隐私与可见性',
    visibilitySectionTitle: '您决定什么是公开的',
    visibilityDirectoryQuestion: '出现在公开的参与者目录中?',
    visibilityDirectoryDetail:
      '其他 KYC 验证的参与者将能看到您的姓名或公司、行业、角色、国家和城市,并可以与您发起对话。如果选择「否」,您的资料将无法被发现,其他人无法通过平台联系您。您可以随时在「我的资料」中更改此决定。',
    visibilityTrajectoryQuestion: '显示您的操作履历?',
    visibilityTrajectoryDetail:
      '您的公开资料将显示根据真实平台操作计算的指标(已完成操作、按时交付、按时付款)。如果选择「否」,该部分将对其他人隐藏。您可以随时在「我的资料」中更改此决定。',
    visibilityConsentYes: '是,我同意',
    visibilityConsentNo: '否,我不同意',
    visibilityMissingNotice: '为每个问题选择一个选项以继续',
  },
  ja: {
    eyebrow: '法的同意',
    title: '続行する前に',
    body: '登録を有効にするには、必須の各チェックボックスをオンにしてください。オプションは登録に影響せず、後でパネルから変更できます。',
    required: '必須',
    optional: 'オプション',
    readDoc: 'ドキュメントを読む',
    readToS: '利用規約',
    readPrivacy: 'プライバシーポリシー',
    readConsentKyc: 'KYC 同意',
    readConsentMarketing: 'マーケティング同意',
    missingNotice: '登録を有効にするには必須の同意が不足しています',
    visibilitySectionEyebrow: 'プライバシーと公開設定',
    visibilitySectionTitle: '何を公開するかはあなたが決めます',
    visibilityDirectoryQuestion: '公開アクターディレクトリに表示しますか?',
    visibilityDirectoryDetail:
      '他の KYC 認証済みアクターは、あなたの名前または社名、分野、役割、国、都市を見ることができ、あなたとの会話を開始できます。「いいえ」を選択すると、あなたのプロフィールは発見されず、他の人がプラットフォーム経由であなたに連絡することはできません。この決定はマイプロフィールでいつでも変更できます。',
    visibilityTrajectoryQuestion: '取引履歴を表示しますか?',
    visibilityTrajectoryDetail:
      '公開プロフィールには、プラットフォームでの実取引から計算された指標(完了取引、期限内納品、期限内支払い)が表示されます。「いいえ」を選択すると、このセクションは他の人から非表示になります。この決定はマイプロフィールでいつでも変更できます。',
    visibilityConsentYes: 'はい、同意します',
    visibilityConsentNo: 'いいえ、同意しません',
    visibilityMissingNotice: '続行するには各質問のオプションを選択してください',
  },
}
