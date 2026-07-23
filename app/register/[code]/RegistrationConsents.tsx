'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = '1503:registrationConsents'

// Versions of the legal documents currently published. Must match the VERSION
// constant of each /legal/* page. When a document is updated, bump the value
// here and the persisted record will reflect which version the user accepted.
const DOC_VERSIONS = {
  tos: 'v0.2-draft',
  privacy: 'v0.1-draft',
  consentKyc: 'v0.1-draft',
  consentMarketing: 'v0.1-draft',
} as const

export type ConsentLabels = {
  eyebrow: string
  title: string
  body: string
  required: string
  optional: string
  readDoc: string
  kycIdentityLabel: string
  kycIdentityDescription: string
  kycSocietaryLabel: string
  kycSocietaryDescription: string
  kycAuthoritiesLabel: string
  kycAuthoritiesDescription: string
  termsPrivacyLabel: string
  termsPrivacyDescription: string
  kycBiometricLabel: string
  kycBiometricDescription: string
  marketingLabel: string
  marketingDescription: string
  readToS: string
  readPrivacy: string
  readConsentKyc: string
  readConsentMarketing: string
  missingNotice: string
  // Visibilidad RGPD (mig. 015/016) — bloque adicional con elección binaria
  // verde/rojo. Ambas obligatorias para enviar el formulario.
  visibilitySectionEyebrow: string
  visibilitySectionTitle: string
  visibilityDirectoryQuestion: string
  visibilityDirectoryDetail: string
  visibilityTrajectoryQuestion: string
  visibilityTrajectoryDetail: string
  visibilityConsentYes: string
  visibilityConsentNo: string
  visibilityMissingNotice: string
}

type ConsentKey =
  | 'kycIdentity'
  | 'kycSocietary'
  | 'kycAuthorities'
  | 'termsPrivacy'
  | 'kycBiometric'
  | 'marketing'

type ConsentState = Record<ConsentKey, boolean>

// Visibilidad RGPD: elección ternaria (null = no contestado todavía).
// El usuario DEBE elegir explícitamente sí o no. No marcar nada NO equivale
// a "no consiento" — equivale a "no ha decidido" y el CTA queda bloqueado.
type VisibilityChoice = boolean | null
type VisibilityState = {
  directoryVisibility: VisibilityChoice
  trajectoryVisibility: VisibilityChoice
}

const INITIAL: ConsentState = {
  kycIdentity: false,
  kycSocietary: false,
  kycAuthorities: false,
  termsPrivacy: false,
  kycBiometric: false,
  marketing: false,
}

const INITIAL_VISIBILITY: VisibilityState = {
  directoryVisibility: null,
  trajectoryVisibility: null,
}

type Stored = {
  accepted?: Partial<ConsentState & VisibilityState>
  versions?: typeof DOC_VERSIONS
  acceptedAt?: string
  userAgent?: string
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
  fontSize: '0.68rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  fontWeight: 500,
}

const requiredTagStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.6rem',
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

type Row = {
  key: ConsentKey
  required: boolean
  label: string
  description: string
  docs: { href: string; label: string }[]
}

export default function RegistrationConsents({
  labels,
  onValidChange,
}: {
  labels: ConsentLabels
  onValidChange?: (valid: boolean) => void
}) {
  const [state, setState] = useState<ConsentState>(INITIAL)
  const [visibility, setVisibility] = useState<VisibilityState>(INITIAL_VISIBILITY)
  const [hydrated, setHydrated] = useState(false)

  // Restore previously accepted consents (cross-session within the browser).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Stored
        if (stored.accepted) {
          const accepted = stored.accepted
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
          setState((s) => ({
            ...s,
            kycIdentity: accepted.kycIdentity ?? s.kycIdentity,
            kycSocietary: accepted.kycSocietary ?? s.kycSocietary,
            kycAuthorities: accepted.kycAuthorities ?? s.kycAuthorities,
            termsPrivacy: accepted.termsPrivacy ?? s.termsPrivacy,
            kycBiometric: accepted.kycBiometric ?? s.kycBiometric,
            marketing: accepted.marketing ?? s.marketing,
          }))
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
          setVisibility((v) => ({
            directoryVisibility:
              typeof accepted.directoryVisibility === 'boolean'
                ? accepted.directoryVisibility
                : v.directoryVisibility,
            trajectoryVisibility:
              typeof accepted.trajectoryVisibility === 'boolean'
                ? accepted.trajectoryVisibility
                : v.trajectoryVisibility,
          }))
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca de hidratación completa
    setHydrated(true)
  }, [])

  // Persist whenever state changes. Only after the first hydration so we don't
  // clobber a pre-existing record on initial mount.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      const anyAccepted = Object.values(state).some(Boolean) ||
        visibility.directoryVisibility !== null ||
        visibility.trajectoryVisibility !== null
      if (!anyAccepted) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }
      const payload: Stored = {
        accepted: {
          ...state,
          // Solo persistimos las visibilidades si el usuario eligió (no null).
          ...(visibility.directoryVisibility !== null && {
            directoryVisibility: visibility.directoryVisibility,
          }),
          ...(visibility.trajectoryVisibility !== null && {
            trajectoryVisibility: visibility.trajectoryVisibility,
          }),
        },
        versions: DOC_VERSIONS,
        acceptedAt: new Date().toISOString(),
        userAgent: window.navigator.userAgent,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }, [state, visibility, hydrated])

  // Para activar el CTA hacen falta:
  //  - los 4 consents obligatorios (KYC + ToS)
  //  - elección explícita en ambas preguntas de visibilidad RGPD (no null)
  const requiredConsentsOk =
    state.kycIdentity && state.kycSocietary && state.kycAuthorities && state.termsPrivacy
  const visibilityAnswered =
    visibility.directoryVisibility !== null && visibility.trajectoryVisibility !== null
  const isValid = requiredConsentsOk && visibilityAnswered

  useEffect(() => {
    onValidChange?.(isValid)
  }, [isValid, onValidChange])

  const toggle = (key: ConsentKey) => {
    setState((s) => ({ ...s, [key]: !s[key] }))
  }

  const setVisibilityChoice = (key: keyof VisibilityState, value: boolean) => {
    setVisibility((v) => ({ ...v, [key]: value }))
  }

  const rows: Row[] = [
    {
      key: 'kycIdentity',
      required: true,
      label: labels.kycIdentityLabel,
      description: labels.kycIdentityDescription,
      docs: [{ href: '/legal/consent-kyc', label: labels.readConsentKyc }],
    },
    {
      key: 'kycSocietary',
      required: true,
      label: labels.kycSocietaryLabel,
      description: labels.kycSocietaryDescription,
      docs: [{ href: '/legal/consent-kyc', label: labels.readConsentKyc }],
    },
    {
      key: 'kycAuthorities',
      required: true,
      label: labels.kycAuthoritiesLabel,
      description: labels.kycAuthoritiesDescription,
      docs: [{ href: '/legal/consent-kyc', label: labels.readConsentKyc }],
    },
    {
      key: 'termsPrivacy',
      required: true,
      label: labels.termsPrivacyLabel,
      description: labels.termsPrivacyDescription,
      docs: [
        { href: '/legal/terms', label: labels.readToS },
        { href: '/legal/privacy', label: labels.readPrivacy },
      ],
    },
    {
      key: 'kycBiometric',
      required: false,
      label: labels.kycBiometricLabel,
      description: labels.kycBiometricDescription,
      docs: [{ href: '/legal/consent-kyc', label: labels.readConsentKyc }],
    },
    {
      key: 'marketing',
      required: false,
      label: labels.marketingLabel,
      description: labels.marketingDescription,
      docs: [{ href: '/legal/consent-marketing', label: labels.readConsentMarketing }],
    },
  ]

  const missingRequired = rows.filter((r) => r.required && !state[r.key]).length

  return (
    <div style={cardStyle}>
      <span style={eyebrowStyle}>{labels.eyebrow}</span>
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 600,
          color: '#E8EDF5',
          marginTop: '0.6rem',
          marginBottom: '1rem',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
        }}
      >
        {labels.title}
      </h2>
      <p
        style={{
          fontSize: '0.85rem',
          color: '#7A8899',
          lineHeight: 1.65,
          marginBottom: '1.5rem',
          maxWidth: 720,
        }}
      >
        {labels.body}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {rows.map((row) => {
          const checked = state[row.key]
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => toggle(row.key)}
              aria-pressed={checked}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
                width: '100%',
                background: checked ? 'rgba(0,163,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: checked
                  ? '1px solid rgba(0,163,255,0.45)'
                  : '1px solid #1E2530',
                borderRadius: 4,
                padding: '0.95rem 1.1rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  minWidth: 18,
                  marginTop: '3px',
                  border: checked ? '1.5px solid #00A3FF' : '1.5px solid #4A5566',
                  borderRadius: 3,
                  background: checked ? '#00A3FF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                aria-hidden
              >
                {checked && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path
                      d="M2 5.5L4.5 8L9 3"
                      stroke="#08090F"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={row.required ? requiredTagStyle : optionalTagStyle}>
                    {row.required ? labels.required : labels.optional}
                  </span>
                  <strong style={{ color: '#E8EDF5', fontSize: '0.92rem' }}>
                    {row.label}
                  </strong>
                </div>
                <div
                  style={{
                    color: '#9FB6CC',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-chakra-petch), sans-serif',
                  }}
                >
                  {row.description}
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    gap: '1.1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {row.docs.map((d) => (
                    <Link
                      key={d.href}
                      href={d.href}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#00A3FF',
                        fontSize: '0.74rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        textDecoration: 'none',
                        borderBottom: '1px dashed rgba(0,163,255,0.4)',
                        paddingBottom: 1,
                      }}
                    >
                      {d.label} ↗
                    </Link>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Bloque "Privacidad y visibilidad" (RGPD mig. 015/016).
          Dos preguntas con elección binaria verde/rojo equilibrada.
          Sin pre-selección, sin dark patterns: ambas opciones tienen
          exactamente el mismo peso visual.
          ───────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #1E2530' }}>
        <span style={eyebrowStyle}>{labels.visibilitySectionEyebrow}</span>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: '#E8EDF5',
            marginTop: '0.6rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
          }}
        >
          {labels.visibilitySectionTitle}
        </h3>

        <VisibilityQuestion
          question={labels.visibilityDirectoryQuestion}
          detail={labels.visibilityDirectoryDetail}
          yesLabel={labels.visibilityConsentYes}
          noLabel={labels.visibilityConsentNo}
          value={visibility.directoryVisibility}
          onChoose={(v) => setVisibilityChoice('directoryVisibility', v)}
        />

        <div style={{ height: '1.5rem' }} />

        <VisibilityQuestion
          question={labels.visibilityTrajectoryQuestion}
          detail={labels.visibilityTrajectoryDetail}
          yesLabel={labels.visibilityConsentYes}
          noLabel={labels.visibilityConsentNo}
          value={visibility.trajectoryVisibility}
          onChoose={(v) => setVisibilityChoice('trajectoryVisibility', v)}
        />

        {!visibilityAnswered && (
          <div
            style={{
              marginTop: '1.5rem',
              fontSize: '0.78rem',
              color: '#F0B429',
              fontFamily: 'var(--font-dm-mono), monospace',
              letterSpacing: '0.06em',
            }}
          >
            ◆ {labels.visibilityMissingNotice}
          </div>
        )}
      </div>

      {missingRequired > 0 && (
        <div
          style={{
            marginTop: '1.25rem',
            fontSize: '0.78rem',
            color: '#FF6B6B',
            fontFamily: 'var(--font-dm-mono), monospace',
            letterSpacing: '0.06em',
          }}
        >
          ◆ {labels.missingNotice}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Pregunta binaria verde/rojo (RGPD-compliant, sin dark patterns).
   Las dos cards tienen el mismo tamaño, padding y tipografía. Solo
   se diferencian en color cuando una está seleccionada.
   ────────────────────────────────────────────────────────────────── */
function VisibilityQuestion({
  question,
  detail,
  yesLabel,
  noLabel,
  value,
  onChoose,
}: {
  question: string
  detail: string
  yesLabel: string
  noLabel: string
  value: boolean | null
  onChoose: (v: boolean) => void
}) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.95rem',
          color: '#E8EDF5',
          fontWeight: 600,
          marginBottom: '0.35rem',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
        }}
      >
        {question}
      </div>
      <div
        style={{
          fontSize: '0.82rem',
          color: '#9FB6CC',
          marginBottom: '1rem',
          lineHeight: 1.55,
          fontFamily: 'var(--font-chakra-petch), sans-serif',
        }}
      >
        {detail}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        <VisibilityChoiceCard
          label={yesLabel}
          color="#3FB950"
          active={value === true}
          onClick={() => onChoose(true)}
          symbol="✓"
        />
        <VisibilityChoiceCard
          label={noLabel}
          color="#FF5A6A"
          active={value === false}
          onClick={() => onChoose(false)}
          symbol="✕"
        />
      </div>
    </div>
  )
}

function VisibilityChoiceCard({
  label,
  color,
  active,
  onClick,
  symbol,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
  symbol: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? `${color}1A` : 'rgba(255,255,255,0.02)',
        border: active ? `1.5px solid ${color}` : '1px solid #2A3A52',
        borderRadius: 4,
        padding: '1rem 1.1rem',
        cursor: 'pointer',
        fontFamily: 'var(--font-dm-mono), monospace',
        fontSize: '0.82rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: active ? color : '#9FB6CC',
        textAlign: 'center',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        boxShadow: active ? `0 0 12px ${color}33` : 'none',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: active ? color : 'transparent',
          border: active ? 'none' : `1.5px solid ${color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? '#08090F' : color,
          fontWeight: 700,
          fontSize: '0.78rem',
          flexShrink: 0,
        }}
        aria-hidden
      >
        {symbol}
      </span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </button>
  )
}
