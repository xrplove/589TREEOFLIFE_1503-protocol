'use client'

import { useEffect, useRef, useState } from 'react'

const META_KEY = '1503:legalDocs'
const BLOB_KEY = (i: number) => `1503:legalDoc:${i}`

export type LegalDocMeta = {
  idx: number
  label: string
  filename: string
  mime: string
  size: number
  uploadedAt: number
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
      <polygon points={pts.join(' ')} fill={color === '#5DD9A4' ? color : 'none'} stroke={color} strokeWidth={1.3} />
      {color !== '#5DD9A4' && <circle cx={r} cy={r} r={r * 0.32} fill={color} />}
    </svg>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocsUpload({
  docs,
  labels,
}: {
  docs: string[]
  labels: {
    click: string
    uploaded: string
    replace: string
    tooBig: string
  }
}) {
  const [metas, setMetas] = useState<Record<number, LegalDocMeta>>({})
  const inputsRef = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(META_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as LegalDocMeta[]
        const map: Record<number, LegalDocMeta> = {}
        arr.forEach((m) => { map[m.idx] = m })
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
        setMetas(map)
      }
    } catch {}
  }, [])

  function persist(map: Record<number, LegalDocMeta>) {
    try {
      window.localStorage.setItem(META_KEY, JSON.stringify(Object.values(map)))
    } catch {}
  }

  function handlePick(idx: number, label: string, file: File) {
    if (file.size > 3 * 1024 * 1024) {
      alert(labels.tooBig)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      try {
        window.localStorage.setItem(BLOB_KEY(idx), dataUrl)
      } catch {
        alert(labels.tooBig)
        return
      }
      const meta: LegalDocMeta = {
        idx,
        label,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: Date.now(),
      }
      const next = { ...metas, [idx]: meta }
      setMetas(next)
      persist(next)
    }
    reader.readAsDataURL(file)
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      {docs.map((d, i) => {
        const meta = metas[i]
        const uploaded = !!meta
        return (
          <li key={i} style={{ margin: 0 }}>
            <button
              type="button"
              onClick={() => inputsRef.current[i]?.click()}
              style={{
                display: 'flex',
                width: '100%',
                gap: '0.75rem',
                alignItems: 'flex-start',
                background: uploaded ? 'rgba(93,217,164,0.05)' : 'transparent',
                border: uploaded ? '1px solid rgba(93,217,164,0.25)' : '1px solid transparent',
                borderRadius: 3,
                padding: uploaded ? '8px 10px' : '4px 0',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <HexBullet color={uploaded ? '#5DD9A4' : '#00A3FF'} />
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    color: '#9FB6CC',
                    lineHeight: 1.45,
                    fontFamily: 'var(--font-chakra-petch), sans-serif',
                  }}
                >
                  {d}
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 2,
                    fontSize: '0.7rem',
                    color: uploaded ? '#5DD9A4' : '#4A5566',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {uploaded
                    ? `✓ ${meta.filename} · ${formatSize(meta.size)} · ${labels.replace}`
                    : labels.click}
                </span>
              </span>
            </button>
            <input
              ref={(el) => { inputsRef.current[i] = el }}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handlePick(i, d, file)
                e.target.value = ''
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}
