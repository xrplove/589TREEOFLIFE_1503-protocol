'use client'

import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n-context'

/* ────────────────────────────── PROFILE NAME ──────────────────────────────
   Nombre editable del Actor en el header del workspace. Se guarda en
   localStorage bajo NAME_STORAGE_KEY. Click → editing → blur o Enter guarda;
   Escape cancela. Escucha 'storage' para sincronizar entre pestañas. */

export const NAME_STORAGE_KEY = '1503:displayName'

export function ProfileName() {
  const t = useT()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(NAME_STORAGE_KEY) || ''
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
      setName(saved)
    } catch {}
    // Hardening 23-may auditoría: escuchar 'storage' para sincronizar entre
    // pestañas (igual que hace CompanyLogo). Si el usuario cambia su
    // nombre en otra pestaña, el header de esta pestaña se actualiza.
    const onStorage = (e: StorageEvent) => {
      if (e.key === NAME_STORAGE_KEY) setName(e.newValue || '')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function save(value: string) {
    const v = value.trim()
    setName(v)
    try { window.localStorage.setItem(NAME_STORAGE_KEY, v) } catch {}
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        defaultValue={name}
        placeholder={t.profileNamePlaceholder}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save((e.target as HTMLInputElement).value)
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          color: '#EAEFF6',
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
          fontSize: '0.82rem',
          padding: '6px 10px',
          outline: 'none',
          width: 200,
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title={t.profileEditTitle}
      style={{
        background: 'transparent',
        border: 'none',
        color: name ? '#EAEFF6' : '#6B7686',
        cursor: 'pointer',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        fontSize: '0.82rem',
        padding: '6px 4px',
        maxWidth: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: name ? 500 : 400,
        fontStyle: name ? 'normal' : 'italic',
        letterSpacing: '0.02em',
      }}
    >
      {name || t.profilePlaceholderText}
    </button>
  )
}
