'use client'

import { useMemo, useState } from 'react'
import { getWorkspaceStrings, type Lang } from '../../data/i18n'

/**
 * Campo "Empresa empleadora" del Actor individual. AUTO-DECLARADO sin
 * verificación cross-actor (eso llega en Fase 6+).
 *
 * Solo aparece si entity_kind=individual (la decisión la toma la page padre).
 * Guarda en `actors.employer_company_name` via PATCH /api/actors/me.
 */
export default function EmployerField({
  lang,
  initialValue,
}: {
  lang: Lang
  initialValue: string | null
}) {
  const t = useMemo(() => getWorkspaceStrings(lang), [lang])
  const [value, setValue] = useState(initialValue ?? '')
  const [savedValue, setSavedValue] = useState(initialValue ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = value.trim() !== (savedValue ?? '').trim()

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    const trimmed = value.trim()
    const payload =
      trimmed === '' ? { employer_company_name: null } : { employer_company_name: trimmed }
    try {
      const r = await fetch('/api/actors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${r.status}`)
      }
      setSavedValue(trimmed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  function clear() {
    setValue('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-3)' }}>
      <h3
        style={{
          fontFamily: 'var(--pm-font-mono)',
          fontSize: 'var(--pm-text-sm)',
          color: 'var(--pm-text-cyan)',
          letterSpacing: 'var(--pm-tracking-widest)',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        {t.perfilEmployerTitle}
      </h3>
      <p
        style={{
          fontFamily: 'var(--pm-font-body)',
          fontSize: 'var(--pm-text-sm)',
          color: 'var(--pm-text-muted)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {t.perfilEmployerHint}
      </p>
      <div style={{ display: 'flex', gap: 'var(--pm-space-3)', alignItems: 'stretch' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.perfilEmployerPlaceholder}
          maxLength={200}
          disabled={saving}
          style={{
            flex: 1,
            padding: 'var(--pm-space-3) var(--pm-space-4)',
            background: 'var(--pm-bg-input)',
            border: '1px solid var(--pm-border-subtle)',
            borderRadius: 'var(--pm-radius-sm)',
            color: 'var(--pm-text-primary)',
            fontFamily: 'var(--pm-font-body)',
            fontSize: 'var(--pm-text-base)',
            outline: 'none',
          }}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={clear}
            disabled={saving}
            style={btnGhost()}
            aria-label={t.perfilEmployerClear}
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          style={btnPrimary(!dirty)}
        >
          {saving ? t.perfilEmployerSaving : t.perfilEmployerSaveBtn}
        </button>
      </div>
      {error && (
        <div
          style={{
            padding: 'var(--pm-space-2) var(--pm-space-3)',
            background: 'rgba(255, 90, 106, 0.08)',
            border: '1px solid var(--pm-accent-danger)',
            borderRadius: 'var(--pm-radius-sm)',
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-xs)',
            color: 'var(--pm-accent-danger)',
            letterSpacing: 'var(--pm-tracking-wide)',
          }}
        >
          ERROR · {error}
        </div>
      )}
    </div>
  )
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--pm-bg-elev)' : 'var(--pm-accent-primary)',
    color: disabled ? 'var(--pm-text-muted)' : 'var(--pm-text-on-accent)',
    padding: '0 var(--pm-space-4)',
    border: 'none',
    borderRadius: 'var(--pm-radius-sm)',
    fontFamily: 'var(--pm-font-mono)',
    fontSize: 'var(--pm-text-xs)',
    letterSpacing: 'var(--pm-tracking-wide)',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
  }
}

function btnGhost(): React.CSSProperties {
  return {
    background: 'transparent',
    color: 'var(--pm-text-muted)',
    padding: '0 var(--pm-space-3)',
    border: '1px solid var(--pm-border-emphasis)',
    borderRadius: 'var(--pm-radius-sm)',
    fontFamily: 'var(--pm-font-mono)',
    fontSize: 'var(--pm-text-base)',
    cursor: 'pointer',
    transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
  }
}
