'use client'

import { useMemo, useState } from 'react'
import { getWorkspaceStrings, type Lang, type WorkspaceStrings } from '../../data/i18n'

/**
 * Bloque "Privacidad y visibilidad" del panel del Actor.
 * Dos preguntas independientes (directorio + trayectoria), cada una con
 * dos cards verde/rojo del mismo peso visual. Sin dark patterns: cambiar
 * de "sí" a "no" o viceversa es UN click, idéntico esfuerzo.
 *
 * Llama a PATCH /api/actors/me. Optimistic update + revert si falla.
 */
export default function VisibilityToggle({
  lang,
  initialDirectoryVisible,
  initialTrajectoryVisible,
}: {
  lang: Lang
  initialDirectoryVisible: boolean
  initialTrajectoryVisible: boolean
}) {
  const t = useMemo(() => getWorkspaceStrings(lang), [lang])
  const [directoryVisible, setDirectoryVisible] = useState(initialDirectoryVisible)
  const [trajectoryVisible, setTrajectoryVisible] = useState(initialTrajectoryVisible)
  const [savingKey, setSavingKey] = useState<'directory' | 'trajectory' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function update(
    key: 'directory' | 'trajectory',
    field: 'visible_in_directory' | 'trajectory_visible',
    next: boolean,
  ) {
    if (savingKey) return
    const prev = key === 'directory' ? directoryVisible : trajectoryVisible
    if (prev === next) return
    if (key === 'directory') setDirectoryVisible(next)
    else setTrajectoryVisible(next)
    setSavingKey(key)
    setError(null)
    try {
      const r = await fetch('/api/actors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: next }),
      })
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${r.status}`)
      }
    } catch (e) {
      if (key === 'directory') setDirectoryVisible(prev)
      else setTrajectoryVisible(prev)
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-5)' }}>
      <Question
        t={t}
        question={t.visibilityDirectoryQuestionShort}
        detail={t.visibilityDirectoryDetailShort}
        value={directoryVisible}
        saving={savingKey === 'directory'}
        onChoose={(v) => update('directory', 'visible_in_directory', v)}
      />
      <Question
        t={t}
        question={t.visibilityTrajectoryQuestionShort}
        detail={t.visibilityTrajectoryDetailShort}
        value={trajectoryVisible}
        saving={savingKey === 'trajectory'}
        onChoose={(v) => update('trajectory', 'trajectory_visible', v)}
      />
      {error && (
        <div
          style={{
            padding: 'var(--pm-space-3) var(--pm-space-4)',
            background: 'rgba(255, 90, 106, 0.08)',
            border: '1px solid var(--pm-accent-danger)',
            borderRadius: 'var(--pm-radius-sm)',
            fontFamily: 'var(--pm-font-mono)',
            fontSize: 'var(--pm-text-xs)',
            color: 'var(--pm-accent-danger)',
            letterSpacing: 'var(--pm-tracking-wide)',
          }}
        >
          {t.visibilityErrorPrefix} · {error}
        </div>
      )}
    </div>
  )
}

function Question({
  t,
  question,
  detail,
  value,
  saving,
  onChoose,
}: {
  t: WorkspaceStrings
  question: string
  detail: string
  value: boolean
  saving: boolean
  onChoose: (v: boolean) => void
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--pm-font-body)',
          fontSize: 'var(--pm-text-md)',
          color: 'var(--pm-text-primary)',
          fontWeight: 600,
          marginBottom: 'var(--pm-space-2)',
        }}
      >
        {question}
      </div>
      <div
        style={{
          fontFamily: 'var(--pm-font-body)',
          fontSize: 'var(--pm-text-sm)',
          color: 'var(--pm-text-secondary)',
          marginBottom: 'var(--pm-space-3)',
          lineHeight: 1.55,
        }}
      >
        {detail}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pm-space-3)' }}>
        <ChoiceCard
          label={t.visibilityChoiceYes}
          color="var(--pm-accent-success)"
          colorHex="#3FB950"
          symbol="✓"
          active={value === true}
          disabled={saving}
          onClick={() => onChoose(true)}
        />
        <ChoiceCard
          label={t.visibilityChoiceNo}
          color="var(--pm-accent-danger)"
          colorHex="#FF5A6A"
          symbol="✕"
          active={value === false}
          disabled={saving}
          onClick={() => onChoose(false)}
        />
      </div>
    </div>
  )
}

function ChoiceCard({
  label,
  color,
  colorHex,
  symbol,
  active,
  disabled,
  onClick,
}: {
  label: string
  color: string
  colorHex: string
  symbol: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        background: active ? `${colorHex}1A` : 'var(--pm-bg-base)',
        border: active ? `1.5px solid ${color}` : '1px solid var(--pm-border-emphasis)',
        borderRadius: 'var(--pm-radius-sm)',
        padding: 'var(--pm-space-4) var(--pm-space-3)',
        cursor: disabled ? 'wait' : 'pointer',
        fontFamily: 'var(--pm-font-mono)',
        fontSize: 'var(--pm-text-sm)',
        letterSpacing: 'var(--pm-tracking-wide)',
        textTransform: 'uppercase',
        color: active ? color : 'var(--pm-text-secondary)',
        textAlign: 'center',
        transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--pm-space-3)',
        boxShadow: active ? `0 0 12px ${colorHex}33` : 'none',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: active ? color : 'transparent',
          border: active ? 'none' : `1.5px solid ${colorHex}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'var(--pm-text-on-accent)' : color,
          fontWeight: 700,
          fontSize: 'var(--pm-text-xs)',
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
