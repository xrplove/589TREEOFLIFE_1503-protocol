'use client'

import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n-context'
import { IconCamera } from '../icons'

/* ────────────────────────────── AVATAR UPLOADER ──────────────────────────────
   Avatar circular del Actor en el header del workspace. Click → file picker
   con accept image/* + límite 4 MB. Se guarda en localStorage bajo
   AVATAR_STORAGE_KEY como data URL. Hover sobre avatar lleno muestra overlay
   con cámara para reemplazar. Escucha 'storage' para sincronizar entre
   pestañas. */

export const AVATAR_STORAGE_KEY = '1503:avatar'

export function AvatarUploader() {
  const t = useT()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hover, setHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
      if (saved) setAvatarUrl(saved)
    } catch {}
    // Hardening 23-may auditoría: escuchar 'storage' para sincronizar entre
    // pestañas (igual que hace CompanyLogo). Si el usuario cambia su
    // avatar en otra pestaña, el header de esta pestaña se actualiza.
    const onStorage = (e: StorageEvent) => {
      if (e.key === AVATAR_STORAGE_KEY) setAvatarUrl(e.newValue || null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handlePick(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 4 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      setAvatarUrl(url)
      try { window.localStorage.setItem(AVATAR_STORAGE_KEY, url) } catch {}
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={avatarUrl ? t.avatarChangeTitle : t.avatarUploadTitle}
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: avatarUrl ? 'rgba(255,255,255,0.04)' : 'rgba(185,164,255,0.10)',
          border: avatarUrl ? '1px solid rgba(255,255,255,0.10)' : '1px dashed rgba(185,164,255,0.5)',
          color: '#B9A4FF',
          cursor: 'pointer',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={t.profilePlaceholderText}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <IconCamera />
        )}
        {avatarUrl && hover && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8,9,15,0.6)',
              color: '#EAEFF6',
              borderRadius: '50%',
            }}
          >
            <IconCamera />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handlePick(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
