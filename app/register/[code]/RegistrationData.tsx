'use client'

import { useEffect, useState } from 'react'
import type { LegalEntity } from '../../data/legalEntities'

const STORAGE_KEY = '1503:registrationData'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type RegistrationDataLabels = {
  eyebrow: string
  titleIndividual: string
  titleCompany: string
  body: string
  pickFirst: string
  firstName: string
  lastName: string
  taxIdIndividual: string
  companyName: string
  legalRep: string
  email: string
  emailHint: string
  emailInvalid: string
  phone: string
  address: string
  fiscalAddress: string
  postalCode: string
  city: string
  yearsInSector: string
  optional: string
  // Password fields (added 2026-05-10 for Fase 3b.1 — auth real Supabase).
  // The password is never persisted to localStorage; it lives only in the
  // component state and is forwarded to the parent via onPasswordChange so
  // the CTA handler can pass it to supabase.auth.signUp().
  password: string
  passwordHint: string
  passwordTooShort: string
  confirmPassword: string
  confirmPasswordMismatch: string
}

type Stored = {
  firstName?: string
  lastName?: string
  taxId?: string
  companyName?: string
  legalRep?: string
  email?: string
  phone?: string
  address?: string
  postalCode?: string
  city?: string
  yearsInSector?: string
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid #1E2530',
  borderRadius: 3,
  color: '#E8EDF5',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#7A8899',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-dm-mono), monospace',
  marginBottom: '0.4rem',
  display: 'block',
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  invalid = false,
  invalidHint,
  hint,
  span2 = false,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  invalid?: boolean
  invalidHint?: string
  hint?: string
  span2?: boolean
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
}) {
  return (
    <label style={{ display: 'block', gridColumn: span2 ? '1 / -1' : 'auto' }}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        inputMode={inputMode}
        style={{
          ...inputStyle,
          borderColor: invalid ? '#FF6B6B' : '#1E2530',
        }}
        onFocus={e => { if (!invalid) e.currentTarget.style.borderColor = '#00A3FF' }}
        onBlur={e => { if (!invalid) e.currentTarget.style.borderColor = '#1E2530' }}
      />
      {invalid && invalidHint && (
        <div style={{ fontSize: '0.72rem', color: '#FF6B6B', marginTop: '0.35rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
          ◆ {invalidHint}
        </div>
      )}
      {!invalid && hint && (
        <div style={{ fontSize: '0.72rem', color: '#4A5566', marginTop: '0.35rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
          {hint}
        </div>
      )}
    </label>
  )
}

const PASSWORD_MIN = 8

export default function RegistrationData({
  entity,
  taxIdLabelCompany,
  labels,
  onValidChange,
  onPasswordChange,
}: {
  entity: LegalEntity | null
  taxIdLabelCompany: string
  labels: RegistrationDataLabels
  onValidChange: (valid: boolean) => void
  // The password is forwarded to the parent so the CTA handler can pass it
  // to supabase.auth.signUp(). It is never persisted to localStorage.
  onPasswordChange?: (password: string) => void
}) {
  const [data, setData] = useState<Stored>({})
  const [emailTouched, setEmailTouched] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  // Hydrate from localStorage once on mount. setState dentro del effect es
  // patrón legítimo para hidratación (no se puede acceder a localStorage
  // durante SSR). La regla react-hooks/set-state-in-effect lo marca por
  // defecto — suprimida porque es uso correcto.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setData(JSON.parse(raw))
    } catch {}
  }, [])

  // Persist on change. NOTE: password is intentionally NOT persisted.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
  }, [data])

  // Forward password upward whenever it changes.
  useEffect(() => {
    onPasswordChange?.(password)
  }, [password, onPasswordChange])

  const isIndividual = entity?.kind === 'individual'
  const emailValid = !!data.email && EMAIL_RE.test(data.email)
  const nameOk = isIndividual
    ? !!data.firstName && data.firstName.trim().length > 0
    : !!data.companyName && data.companyName.trim().length > 0
  const passwordValid = password.length >= PASSWORD_MIN
  const passwordsMatch = password === confirmPassword
  const formValid = !!entity && nameOk && emailValid && passwordValid && passwordsMatch

  // Notify parent of validity changes.
  useEffect(() => {
    onValidChange(formValid)
  }, [formValid, onValidChange])

  const set = (k: keyof Stored) => (v: string) => setData(d => ({ ...d, [k]: v }))

  if (!entity) {
    return (
      <div style={cardStyle}>
        <span style={eyebrowStyle}>{labels.eyebrow}</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#E8EDF5', marginTop: '0.6rem', marginBottom: '1rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
          {labels.titleCompany}
        </h2>
        <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: '#7A8899', fontSize: '0.85rem', border: '1px dashed rgba(0,163,255,0.25)', borderRadius: 4, fontStyle: 'italic', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
          ◆ {labels.pickFirst}
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <span style={eyebrowStyle}>{labels.eyebrow}</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#E8EDF5', marginTop: '0.6rem', marginBottom: '1rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
        {isIndividual ? labels.titleIndividual : labels.titleCompany}
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#7A8899', lineHeight: 1.65, marginBottom: '1.75rem', maxWidth: 720 }}>
        {labels.body}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.1rem 1.25rem',
        }}
      >
        {isIndividual ? (
          <>
            <Field label={labels.firstName} value={data.firstName || ''} onChange={set('firstName')} />
            <Field label={labels.lastName} value={data.lastName || ''} onChange={set('lastName')} />
            <Field label={labels.taxIdIndividual} value={data.taxId || ''} onChange={set('taxId')} />
            <Field
              label={labels.email}
              value={data.email || ''}
              onChange={v => { set('email')(v); if (!emailTouched) setEmailTouched(true) }}
              type="email"
              inputMode="email"
              invalid={emailTouched && !!data.email && !emailValid}
              invalidHint={labels.emailInvalid}
              hint={labels.emailHint}
            />
            <Field label={labels.phone} value={data.phone || ''} onChange={set('phone')} type="tel" inputMode="tel" />
            <Field label={`${labels.yearsInSector} ${labels.optional}`} value={data.yearsInSector || ''} onChange={set('yearsInSector')} inputMode="numeric" />
            <Field label={labels.address} value={data.address || ''} onChange={set('address')} span2 />
            <Field label={labels.postalCode} value={data.postalCode || ''} onChange={set('postalCode')} inputMode="numeric" />
            <Field label={labels.city} value={data.city || ''} onChange={set('city')} />
          </>
        ) : (
          <>
            <Field label={labels.companyName} value={data.companyName || ''} onChange={set('companyName')} span2 />
            <Field label={taxIdLabelCompany} value={data.taxId || ''} onChange={set('taxId')} />
            <Field label={labels.legalRep} value={data.legalRep || ''} onChange={set('legalRep')} />
            <Field
              label={labels.email}
              value={data.email || ''}
              onChange={v => { set('email')(v); if (!emailTouched) setEmailTouched(true) }}
              type="email"
              inputMode="email"
              invalid={emailTouched && !!data.email && !emailValid}
              invalidHint={labels.emailInvalid}
              hint={labels.emailHint}
            />
            <Field label={labels.phone} value={data.phone || ''} onChange={set('phone')} type="tel" inputMode="tel" />
            <Field label={labels.fiscalAddress} value={data.address || ''} onChange={set('address')} span2 />
            <Field label={labels.postalCode} value={data.postalCode || ''} onChange={set('postalCode')} inputMode="numeric" />
            <Field label={labels.city} value={data.city || ''} onChange={set('city')} />
          </>
        )}

        {/* Password block — common to both individual and company. Never
            persisted to localStorage. */}
        <Field
          label={labels.password}
          value={password}
          onChange={v => { setPassword(v); if (!passwordTouched) setPasswordTouched(true) }}
          type="password"
          invalid={passwordTouched && password.length > 0 && !passwordValid}
          invalidHint={labels.passwordTooShort}
          hint={labels.passwordHint}
        />
        <Field
          label={labels.confirmPassword}
          value={confirmPassword}
          onChange={v => { setConfirmPassword(v); if (!confirmTouched) setConfirmTouched(true) }}
          type="password"
          invalid={confirmTouched && confirmPassword.length > 0 && !passwordsMatch}
          invalidHint={labels.confirmPasswordMismatch}
        />
      </div>
    </div>
  )
}
