'use client'

import { useMemo, useRef, useState } from 'react'
import { getWorkspaceStrings, type Lang, type WorkspaceStrings } from '../../data/i18n'

/**
 * Subida/cambio/borrado de la foto pública (avatar individual / logo empresa).
 *
 * Llama a /api/photos/public-avatar (POST upload, DELETE quitar).
 * Optimistic preview (objectURL local) hasta que el server confirme.
 */
export default function AvatarUpload({
  lang,
  initialAvatarUrl,
  initialName,
}: {
  lang: Lang
  initialAvatarUrl: string | null
  initialName: string
}) {
  const t = useMemo(() => getWorkspaceStrings(lang), [lang])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = computeInitials(initialName)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSaving(true)
    // Preview optimista local mientras sube
    const localUrl = URL.createObjectURL(file)
    setAvatarUrl(localUrl)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/photos/public-avatar', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${r.status}`)
      }
      const data = (await r.json()) as { avatar?: { url?: string | null } }
      URL.revokeObjectURL(localUrl)
      setAvatarUrl(data.avatar?.url ?? null)
    } catch (err) {
      URL.revokeObjectURL(localUrl)
      setAvatarUrl(initialAvatarUrl)
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onDelete() {
    if (saving || !avatarUrl) return
    setSaving(true)
    setError(null)
    const prev = avatarUrl
    setAvatarUrl(null)
    try {
      const r = await fetch('/api/photos/public-avatar', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${r.status}`)
      }
    } catch (err) {
      setAvatarUrl(prev)
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
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
        {t.perfilAvatarTitle}
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
        {t.perfilAvatarHint}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pm-space-4)', marginTop: 'var(--pm-space-2)' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 'var(--pm-radius-md)',
            background: 'var(--pm-bg-base)',
            border: '1px solid var(--pm-border-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--pm-font-display)',
            fontSize: 'var(--pm-text-2xl)',
            color: 'var(--pm-accent-primary)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={initialName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pm-space-2)' }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            style={btnStyle(false)}
          >
            {saving ? t.perfilAvatarUploading : avatarUrl ? t.perfilAvatarReplaceBtn : t.perfilAvatarUploadBtn}
          </button>
          {avatarUrl && (
            <button type="button" onClick={onDelete} disabled={saving} style={btnStyle(true)}>
              {t.perfilAvatarDeleteBtn}
            </button>
          )}
        </div>
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

function btnStyle(danger: boolean): React.CSSProperties {
  return {
    background: danger ? 'transparent' : 'var(--pm-accent-primary)',
    color: danger ? 'var(--pm-accent-danger)' : 'var(--pm-text-on-accent)',
    padding: 'var(--pm-space-2) var(--pm-space-4)',
    border: danger ? '1px solid var(--pm-accent-danger)' : 'none',
    borderRadius: 'var(--pm-radius-sm)',
    fontFamily: 'var(--pm-font-mono)',
    fontSize: 'var(--pm-text-xs)',
    letterSpacing: 'var(--pm-tracking-wide)',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all var(--pm-duration-base) var(--pm-ease-out)',
  }
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
