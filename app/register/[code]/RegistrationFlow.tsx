'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORS } from '../../data/sectors'
import { getActorGroups, getLabel, sectorHasDraft } from '../../data/actorGroups'
import { langForCountry } from '../../data/i18n'
import type { LegalEntity } from '../../data/legalEntities'
import { supabase } from '../../lib/supabase'
import {
  uploadLogoFromDataUrl,
  uploadKycDocFromDataUrl,
  type UploadedDocMeta,
} from '../../lib/uploadStorage'
import LogoUpload from './LogoUpload'
import DocsUpload from './DocsUpload'
import RegistrationData, { type RegistrationDataLabels } from './RegistrationData'
import RegistrationConsents, { type ConsentLabels } from './RegistrationConsents'
import RegistrationRights from './RegistrationRights'

const REG_ENTITY_KEY = '1503:registrationEntity'
const REG_KIND_KEY = '1503:registrationKind'
const REG_SECTOR_KEY = '1503:registrationSector'
const REG_SUBSECTOR_KEY = '1503:registrationSubsector'
const REG_ROLE_KEY = '1503:registrationRole'
const REG_DATA_KEY = '1503:registrationData'
const REG_CONSENTS_KEY = '1503:registrationConsents'
// Logo and KYC docs are kept locally as data URLs while the user fills the
// form. Once the signUp succeeds we migrate them to Supabase Storage.
const LOGO_KEY = '1503:companyLogo'
const DOCS_META_KEY = '1503:legalDocs'
const DOC_BLOB_KEY = (i: number) => `1503:legalDoc:${i}`

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

function HexBullet({ color = '#00A3FF', size = 12, filled = false }: { color?: string; size?: number; filled?: boolean }) {
  const r = size / 2
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 30) * (Math.PI / 180)
    pts.push(`${r + r * Math.cos(a)},${r + r * Math.sin(a)}`)
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, marginTop: 4 }}>
      <polygon points={pts.join(' ')} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.3} />
      {!filled && <circle cx={r} cy={r} r={r * 0.32} fill={color} />}
    </svg>
  )
}

type LogoLabels = {
  eyebrow: string
  title: string
  body: string
  ctaUpload: string
  ctaReplace: string
  ctaRemove: string
}

type DocsLabels = {
  click: string
  uploaded: string
  replace: string
  tooBig: string
}

export default function RegistrationFlow({
  countryCode,
  countryName,
  entities,
  registry,
  taxIdLabel,
  extraDocs,
  individualDocs,
  companyDocs,
  // labels — legal entity card
  legalEyebrow,
  legalTitle,
  legalBody,
  legalRegistry,
  legalTaxId,
  // labels — docs card
  docsEyebrow,
  docsTitle,
  docsBody,
  docsDraftBadge,
  docsDraftBody,
  selectEntityFirst,
  // labels — sector / role card
  sectorEyebrow,
  sectorTitle,
  sectorBody,
  sectorPickFirst,
  subsectorLabel,
  subsectorPickFirst,
  roleLabel,
  roleOptional,
  roleDraftNote,
  // labels — CTA card
  ctaEyebrow,
  ctaTitle,
  ctaBody,
  ctaPrimary,
  // labels for child components
  logoLabels,
  docsLabels,
  dataLabels,
  consentLabels,
  // tag labels for individual / company entity badges
  labelIndividual,
  labelCompany,
}: {
  countryCode: string
  countryName: string
  entities: LegalEntity[]
  registry: string
  taxIdLabel: string
  extraDocs: string[]
  individualDocs: string[]
  companyDocs: string[]
  legalEyebrow: string
  legalTitle: string
  legalBody: string
  legalRegistry: string
  legalTaxId: string
  docsEyebrow: string
  docsTitle: string
  docsBody: string
  docsDraftBadge: string
  docsDraftBody: string
  selectEntityFirst: string
  sectorEyebrow: string
  sectorTitle: string
  sectorBody: string
  sectorPickFirst: string
  subsectorLabel: string
  subsectorPickFirst: string
  roleLabel: string
  roleOptional: string
  roleDraftNote: string
  ctaEyebrow: string
  ctaTitle: string
  ctaBody: string
  ctaPrimary: string
  logoLabels: LogoLabels
  docsLabels: DocsLabels
  dataLabels: RegistrationDataLabels
  consentLabels: ConsentLabels
  labelIndividual: string
  labelCompany: string
}) {
  const router = useRouter()
  const [entityCode, setEntityCode] = useState<string | null>(null)
  const [sectorId, setSectorId] = useState<string | null>(null)
  const [subsectorId, setSubsectorId] = useState<string | null>(null)
  const [roleId, setRoleId] = useState<string | null>(null)
  const [dataValid, setDataValid] = useState(false)
  const [consentsValid, setConsentsValid] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const handleDataValidChange = useCallback((v: boolean) => setDataValid(v), [])
  const handleConsentsValidChange = useCallback((v: boolean) => setConsentsValid(v), [])
  const handlePasswordChange = useCallback((p: string) => setPassword(p), [])

  // Restore previous selections (cross-session within the browser).
  // setState en effect es legítimo en hidratación desde localStorage —
  // suprimimos la regla react-hooks/set-state-in-effect.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const e = window.localStorage.getItem(REG_ENTITY_KEY)
      const s = window.localStorage.getItem(REG_SECTOR_KEY)
      const sub = window.localStorage.getItem(REG_SUBSECTOR_KEY)
      const r = window.localStorage.getItem(REG_ROLE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (e && entities.some(x => x.code === e)) setEntityCode(e)
      const sectorOk = s && SECTORS.some(x => x.id === s)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sectorOk) setSectorId(s)
      // El subsector solo se restaura si pertenece al sector restaurado
      // (los grupos viven en actorGroups; un subsector huérfano se descarta).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sectorOk && sub && getActorGroups(s!).some(g => g.id === sub)) setSubsectorId(sub)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (r) setRoleId(r)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist entity + kind whenever entity changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (entityCode) {
        window.localStorage.setItem(REG_ENTITY_KEY, entityCode)
        const entity = entities.find(e => e.code === entityCode)
        if (entity) window.localStorage.setItem(REG_KIND_KEY, entity.kind)
      } else {
        window.localStorage.removeItem(REG_ENTITY_KEY)
        window.localStorage.removeItem(REG_KIND_KEY)
      }
    } catch {}
  }, [entityCode, entities])

  // Persist sector.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sectorId) window.localStorage.setItem(REG_SECTOR_KEY, sectorId)
      else window.localStorage.removeItem(REG_SECTOR_KEY)
    } catch {}
  }, [sectorId])

  // Persist subsector.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (subsectorId) window.localStorage.setItem(REG_SUBSECTOR_KEY, subsectorId)
      else window.localStorage.removeItem(REG_SUBSECTOR_KEY)
    } catch {}
  }, [subsectorId])

  // Persist role.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (roleId) window.localStorage.setItem(REG_ROLE_KEY, roleId)
      else window.localStorage.removeItem(REG_ROLE_KEY)
    } catch {}
  }, [roleId])

  const entity = entities.find(e => e.code === entityCode) || null
  const isIndividual = entity?.kind === 'individual'

  const filteredDocs = useMemo(() => {
    if (!entity) return []
    const base = entity.kind === 'individual' ? individualDocs : companyDocs
    const specific = entity.specificDocs || []
    // If the entity replaces the kind-based set entirely (e.g. cooperative
    // is registered in a different registry), skip both the base list and
    // the country-level extraDocs (which assume the standard registry).
    if (entity.specificDocsReplace) return specific
    return [...base, ...specific, ...extraDocs]
  }, [entity, individualDocs, companyDocs, extraDocs])

  const showDraftBadge = entity?.docsStatus === 'draft'

  const groups = useMemo(() => (sectorId ? getActorGroups(sectorId) : []), [sectorId])
  // Derivamos lang desde countryCode (mismo patrón que /register/[code]/page.tsx)
  // para localizar los labels de grupos y roles. Si el sector no se ha migrado
  // todavía a LocalizedLabel, getLabel devuelve el string ES de fallback.
  const lang = langForCountry(countryCode)
  // Subsectores = grupos de actorGroups del sector elegido. Son el nivel que el
  // motor de documentación (getApplicableRequirements) usa para afinar KYC/docs.
  const subsectors = useMemo(
    () => groups.map(g => ({ id: g.id, label: getLabel(g.label, lang) })),
    [groups, lang],
  )
  const selectedGroup = useMemo(
    () => groups.find(g => g.id === subsectorId) ?? null,
    [groups, subsectorId],
  )
  // Roles SOLO del subsector elegido (antes se aplanaban todos los grupos).
  const rolesOfSubsector = useMemo(
    () => (selectedGroup ? selectedGroup.roles.map(r => ({
      roleId: r.id,
      label: getLabel(r.label, lang),
    })) : []),
    [selectedGroup, lang],
  )

  // CTA enabled when entity + sector are picked, role is set (individuals only),
  // the registration data card is valid (name + email at minimum) AND the four
  // mandatory legal consents are accepted (KYC identity, KYC societary, KYC
  // authorities cession, ToS+Privacy). The optional liveness biometric and the
  // marketing consent do not block the CTA.
  // Subsector es obligatorio para TODOS (empresa o autónomo): país + sector +
  // subsector determinan la documentación/KYC aplicable. El rol solo se exige
  // a autónomos (las empresas pueden cubrir varios roles dentro del subsector).
  const ctaEnabled =
    !!entity && !!sectorId && !!subsectorId &&
    (isIndividual ? !!roleId : true) && dataValid && consentsValid

  const ctaTitleFilled = ctaTitle.replace('{country}', countryName)

  // Sign-up handler: bundles all state from localStorage + in-memory password
  // and calls supabase.auth.signUp(). On success redirects to the email
  // confirmation page; on error surfaces the message inline.
  const handleSignUp = async () => {
    if (!ctaEnabled || submitting || typeof window === 'undefined') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const rawData = window.localStorage.getItem(REG_DATA_KEY)
      const rawConsents = window.localStorage.getItem(REG_CONSENTS_KEY)
      const regData: Record<string, string | undefined> = rawData ? JSON.parse(rawData) : {}
      const consents: unknown = rawConsents ? JSON.parse(rawConsents) : {}

      const email = (regData.email || '').trim().toLowerCase()
      if (!email) {
        setSubmitError('Falta el correo electrónico.')
        return
      }

      const userMeta = {
        entity_code: entityCode || '',
        entity_kind: entity?.kind || '',
        country_code: countryCode || '',
        sector_id: sectorId || '',
        subsector_id: subsectorId || '',
        role_id: roleId || '',
        first_name: regData.firstName || '',
        last_name: regData.lastName || '',
        tax_id: regData.taxId || '',
        company_name: regData.companyName || '',
        legal_rep: regData.legalRep || '',
        phone: regData.phone || '',
        address: regData.address || '',
        postal_code: regData.postalCode || '',
        city: regData.city || '',
        years_in_sector: regData.yearsInSector || '',
        consents,
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMeta,
          // PKCE: Supabase devuelve `?code=` en la query. /auth/callback
          // intercambia el code por sesión + cookies (necesario para que el
          // middleware vea al Actor autenticado al instante) y redirige a
          // /registro/en-revision, que muestra el estado KYC actual.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/registro/en-revision`,
        },
      })

      if (error) {
        setSubmitError(error.message || 'No se ha podido crear la cuenta. Inténtalo de nuevo.')
        return
      }

      // Migrate the logo + KYC docs from localStorage to Supabase Storage.
      // The signUp call above populated supabase.auth with a session for the
      // new user, so the upload calls are authenticated and the storage RLS
      // policies allow writes inside `<bucket>/<userId>/...`.
      // Errors here are logged but do not block the alta — the Actor can
      // re-upload from their workspace later if any single file fails.
      const userId = signUpData.user?.id
      if (userId) {
        try {
          const logoDataUrl = window.localStorage.getItem(LOGO_KEY)
          const docsMetaRaw = window.localStorage.getItem(DOCS_META_KEY)
          const docsMeta = docsMetaRaw
            ? (JSON.parse(docsMetaRaw) as Array<{
                idx: number
                label: string
                filename: string
                mime: string
                size: number
              }>)
            : []

          const [logoPath, ...docResults] = await Promise.all([
            logoDataUrl ? uploadLogoFromDataUrl(userId, logoDataUrl) : Promise.resolve(null),
            ...docsMeta.map((m) => {
              const blob = window.localStorage.getItem(DOC_BLOB_KEY(m.idx))
              if (!blob) return Promise.resolve<UploadedDocMeta | null>(null)
              return uploadKycDocFromDataUrl(userId, m, blob)
            }),
          ])
          const docsPaths = docResults.filter((d): d is UploadedDocMeta => d !== null)

          // Update the actors row with the storage paths. The RLS policy
          // 'actors_update_own' restricts the update to auth.uid() = user_id.
          if (logoPath || docsPaths.length > 0) {
            const { error: updErr } = await supabase
              .from('actors')
              .update({
                logo_path: logoPath ?? null,
                docs_paths: docsPaths,
              })
              .eq('user_id', userId)
            if (updErr) {
              // eslint-disable-next-line no-console
              console.error('actors.update paths error:', updErr.message)
            }
          }

          // Clean the heavy data URLs from localStorage now that they live
          // in Storage. Keep the lightweight `1503:legalDocs` meta so
          // the user can see what was already uploaded if they revisit the
          // form (purely cosmetic).
          window.localStorage.removeItem(LOGO_KEY)
          for (const m of docsMeta) {
            window.localStorage.removeItem(DOC_BLOB_KEY(m.idx))
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('storage upload step failed:', e)
        }

        // Bloque 3b.3 — persist the consent snapshot server-side, capturing the
        // request IP and User-Agent server-authoritatively. The denormalised
        // actors.consents column is already written by the on_auth_user_created
        // trigger from raw_user_meta_data, so this audit row is additive: it
        // adds the IP + a tamper-evident immutable history. Fire-and-forget
        // because actors.consents alone is enough to not block the alta.
        //
        // The endpoint authenticates the caller by access token and derives
        // the user_id from it (H-1), so we must send the post-signUp session
        // token. If signUp didn't yield a session (e.g. email-confirm-only
        // config) the snapshot still lives in actors.consents via the trigger.
        const accessToken = signUpData.session?.access_token
        if (accessToken) {
          void fetch('/api/auth/persist-consents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ consents }),
          }).catch((e) => {
            // eslint-disable-next-line no-console
            console.error('persist-consents failed', e)
          })
        }
      }

      // Welcome email NOT sent here on purpose: with Supabase "Confirm email"
      // active the only email the Actor needs at this moment is the verification
      // link that Supabase sends automatically. Sending a parallel branded
      // welcome saying "your account is active" would be both spammy and false
      // until they click the verification link. The branded welcome will be
      // re-introduced as a post-confirmation email triggered by an auth webhook
      // when the user transitions to email_confirmed_at != null.
      // The route handler app/api/auth/welcome-email/route.ts is preserved for
      // that future reactivation.

      // Success — redirect to the email confirmation page with the email
      // shown so the Actor knows where to look.
      router.push(`/registro/confirmar?email=${encodeURIComponent(email)}`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Error inesperado durante el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ── Two-column body: Legal entity + Documents ────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Legal entity types — INTERACTIVE */}
        <div style={cardStyle}>
          <span style={{ ...eyebrowStyle, fontSize: '0.68rem' }}>{legalEyebrow}</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#E8EDF5', marginTop: '0.6rem', marginBottom: '1rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
            {legalTitle}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#7A8899', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            {legalBody}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entities.map(e => {
              const selected = e.code === entityCode
              return (
                <li key={e.code} style={{ margin: 0 }}>
                  <button
                    type="button"
                    onClick={() => setEntityCode(e.code)}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      width: '100%',
                      background: selected ? 'rgba(240,180,41,0.06)' : 'transparent',
                      border: selected ? '1px solid rgba(240,180,41,0.4)' : '1px solid transparent',
                      borderRadius: 3,
                      padding: '0.55rem 0.6rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                  >
                    <HexBullet color="#F0B429" filled={selected} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.92rem', color: '#E8EDF5', fontWeight: 600, fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
                        {e.nameLocal}
                        <span style={{ marginLeft: 8, fontSize: '0.66rem', color: e.kind === 'individual' ? '#5DD9A4' : '#9D7AFF', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                          ◆ {e.kind === 'individual' ? labelIndividual : labelCompany}
                        </span>
                      </div>
                      {(lang === 'es' ? e.nameES : e.nameEN) && (
                        <div style={{ fontSize: '0.78rem', color: '#7A8899', marginTop: 2 }}>
                          {lang === 'es' ? e.nameES : e.nameEN}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', color: '#4A5566', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.06em', lineHeight: 1.7 }}>
            <div>{legalRegistry} {registry.toUpperCase()}</div>
            <div>{legalTaxId} {taxIdLabel}</div>
          </div>
        </div>

        {/* Card 2: Required documents — FILTERED by entity kind */}
        <div style={cardStyle}>
          <span style={{ ...eyebrowStyle, fontSize: '0.68rem' }}>{docsEyebrow}</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#E8EDF5', marginTop: '0.6rem', marginBottom: '1rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
            {docsTitle}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#7A8899', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            {docsBody}
          </p>
          {entity && showDraftBadge && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 0.85rem',
                border: '1px solid rgba(240,180,41,0.35)',
                background: 'rgba(240,180,41,0.06)',
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  fontSize: '0.66rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#F0B429',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                }}
              >
                ◆ {docsDraftBadge}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#9FB6CC',
                  lineHeight: 1.55,
                  fontFamily: 'var(--font-chakra-petch), sans-serif',
                }}
              >
                {docsDraftBody}
              </div>
            </div>
          )}
          {entity ? (
            <DocsUpload docs={filteredDocs} labels={docsLabels} />
          ) : (
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: '#7A8899', fontSize: '0.85rem', border: '1px dashed rgba(0,163,255,0.25)', borderRadius: 4, fontStyle: 'italic', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
              ◆ {selectEntityFirst}
            </div>
          )}
        </div>
      </div>

      {/* ── Registration data card (operator/company details) ───────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <RegistrationData
          entity={entity}
          taxIdLabelCompany={taxIdLabel}
          labels={dataLabels}
          onValidChange={handleDataValidChange}
          onPasswordChange={handlePasswordChange}
        />
      </div>

      {/* ── Card 3: Sector + role picker ─────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <span style={{ ...eyebrowStyle, fontSize: '0.68rem' }}>{sectorEyebrow}</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#E8EDF5', marginTop: '0.6rem', marginBottom: '1rem', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
          {sectorTitle}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#7A8899', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 720 }}>
          {sectorBody}
        </p>

        {!entity ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#7A8899', fontSize: '0.85rem', border: '1px dashed rgba(0,163,255,0.25)', borderRadius: 4, fontStyle: 'italic', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
            ◆ {sectorPickFirst}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {SECTORS.map(s => {
                const selected = s.id === sectorId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSectorId(s.id); setSubsectorId(null); setRoleId(null) }}
                    style={{
                      background: selected ? 'rgba(0,163,255,0.12)' : 'rgba(255,255,255,0.02)',
                      border: selected ? '1px solid #00A3FF' : '1px solid #1E2530',
                      borderRadius: 3,
                      padding: '0.7rem 0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-chakra-petch), sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '0.62rem', color: selected ? '#00A3FF' : '#4A5566', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>
                      {s.short}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: selected ? '#E8EDF5' : '#9FB6CC', fontWeight: 600, marginTop: 2 }}>
                      {s.label}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Subsector picker (= grupo de actorGroups). País + sector +
                subsector determinan la documentación/KYC aplicable. Obligatorio
                para todos; aparece en cuanto hay sector elegido. */}
            {sectorId && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#7A8899', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '0.85rem' }}>
                  {subsectorLabel}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {subsectors.map(sub => {
                    const selected = sub.id === subsectorId
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => { setSubsectorId(sub.id); setRoleId(null) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          background: selected ? 'rgba(0,163,255,0.10)' : 'rgba(255,255,255,0.02)',
                          border: selected ? '1px solid #00A3FF' : '1px solid #1E2530',
                          borderRadius: 3,
                          padding: '0.55rem 0.75rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'var(--font-chakra-petch), sans-serif',
                          transition: 'all 0.15s',
                        }}
                      >
                        <HexBullet color="#00A3FF" size={10} filled={selected} />
                        <span style={{ flex: 1, fontSize: '0.82rem', color: selected ? '#E8EDF5' : '#9FB6CC' }}>
                          {sub.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.7rem', color: '#7A8899', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '0.85rem' }}>
                {roleLabel} {!isIndividual && <span style={{ color: '#4A5566' }}>{roleOptional}</span>}
              </div>
              {sectorId && sectorHasDraft(groups) && (
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#F0B429',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    letterSpacing: '0.04em',
                    marginBottom: '0.85rem',
                    opacity: 0.85,
                  }}
                >
                  {roleDraftNote}
                </div>
              )}
              {!subsectorId ? (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#4A5566', fontSize: '0.82rem', border: '1px dashed rgba(0,163,255,0.18)', borderRadius: 4, fontStyle: 'italic', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
                  {subsectorPickFirst}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                  {rolesOfSubsector.map(r => {
                    const selected = r.roleId === roleId
                    return (
                      <button
                        key={r.roleId}
                        type="button"
                        onClick={() => setRoleId(r.roleId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          background: selected ? 'rgba(240,180,41,0.06)' : 'rgba(255,255,255,0.02)',
                          border: selected ? '1px solid rgba(240,180,41,0.45)' : '1px solid #1E2530',
                          borderRadius: 3,
                          padding: '0.55rem 0.75rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'var(--font-chakra-petch), sans-serif',
                        }}
                      >
                        <HexBullet color="#F0B429" size={10} filled={selected} />
                        <span style={{ flex: 1, fontSize: '0.82rem', color: selected ? '#E8EDF5' : '#9FB6CC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Logo upload ──────────────────────────────────────────────────── */}
      <LogoUpload
        eyebrow={logoLabels.eyebrow}
        title={logoLabels.title}
        body={logoLabels.body}
        ctaUpload={logoLabels.ctaUpload}
        ctaReplace={logoLabels.ctaReplace}
        ctaRemove={logoLabels.ctaRemove}
      />

      {/* ── Rights summary by jurisdiction (informational, collapsible) ─── */}
      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <RegistrationRights countryCode={countryCode} lang={lang} />
      </div>

      {/* ── Legal consents (4 mandatory + 2 optional) ────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <RegistrationConsents
          labels={consentLabels}
          onValidChange={handleConsentsValidChange}
        />
      </div>

      {/* ── Big CTA card (uses chosen sector for the link target) ────────── */}
      <div
        style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, rgba(0,163,255,0.06), rgba(240,180,41,0.04))',
          border: '1px solid rgba(0,163,255,0.25)',
          padding: '3rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <span style={eyebrowStyle}>{ctaEyebrow}</span>
        <h2
          style={{
            fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
            fontWeight: 700,
            color: '#E8EDF5',
            marginTop: '0.7rem',
            marginBottom: '0.6rem',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          {ctaTitleFilled}
        </h2>
        <p style={{ color: '#7A8899', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: 540, margin: '0 auto 2rem' }}>
          {ctaBody}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            disabled={!ctaEnabled || submitting}
            onClick={handleSignUp}
            style={{
              background: ctaEnabled && !submitting ? '#F0B429' : 'rgba(240,180,41,0.18)',
              color: ctaEnabled && !submitting ? '#08090F' : 'rgba(8,9,15,0.45)',
              padding: '14px 32px',
              borderRadius: 2,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              textTransform: 'uppercase',
              cursor: ctaEnabled && !submitting ? 'pointer' : 'not-allowed',
              boxShadow: ctaEnabled && !submitting ? '0 6px 22px rgba(240,180,41,0.32)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Creando cuenta…' : ctaPrimary}
          </button>
          {submitError && (
            <div
              style={{
                marginTop: '0.5rem',
                color: '#FF6B6B',
                fontSize: '0.85rem',
                lineHeight: 1.55,
                maxWidth: 480,
                textAlign: 'center',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                padding: '0.75rem 1rem',
                background: 'rgba(255,107,107,0.06)',
                border: '1px solid rgba(255,107,107,0.35)',
                borderRadius: 3,
              }}
            >
              ◆ {submitError}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
