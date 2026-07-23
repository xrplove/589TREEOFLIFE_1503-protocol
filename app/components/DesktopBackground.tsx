'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WorkspaceStrings } from '../data/i18n'

const COMPANY_LOGO_STORAGE_KEY = '1503:companyLogo'
const POSITIONS_STORAGE_KEY = '1503:desktopPhotoPos'

// Panel HUD tecnológico — fondo oscuro + borde fino + glow cyan + barra inferior
// monospace con id de slot. Imagen ocupa casi todo el área interior.
const FRAME_W = 240
const FRAME_H = 280
const FOOTER_H = 28    // barra inferior tipo HUD con "SLOT · 01"
const FRAME_GAP = 24
const SLOTS = 3

// Bounds del área del escritorio cuando las Polaroids están en position:fixed.
// El sidebar mide 230, el header 64; el resto del viewport es zona de mesa.
const SIDEBAR_W = 230
const HEADER_H = 64

type Photo = {
  id: string
  url: string | null
  width: number | null
  height: number | null
}

// Posiciones guardadas como porcentaje (0..1) del padre — aguantan resize sin
// que se escapen del escritorio. La key es el slot (0..2), no el id de foto:
// así, al borrar y subir otra, la nueva ocupa la posición que el usuario eligió.
type Pos = { xPct: number; yPct: number }
type PositionsMap = Record<number, Pos>

function readPositions(): PositionsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(POSITIONS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PositionsMap
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writePositions(map: PositionsMap) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export default function DesktopBackground({
  hidden,
  t,
}: {
  hidden: boolean
  t: WorkspaceStrings
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [positions, setPositions] = useState<PositionsMap>({})
  const [busySlot, setBusySlot] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Tamaño del VIEWPORT (no del contenedor padre) — las Polaroids son fixed.
  // Se inicializa a 0 para evitar SSR mismatch y se hidrata en mount + resize.
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositions(readPositions())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    function load() {
      try {
        setLogoUrl(window.localStorage.getItem(COMPANY_LOGO_STORAGE_KEY) || null)
      } catch {}
    }
    load()
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  const fetchPhotos = useCallback(async () => {
    // En modo demo no hay sesión Supabase real: el endpoint devolvería 401.
    // Evitamos la llamada (y el error de consola); el panel de fotos queda vacío.
    try {
      if (window.localStorage.getItem('1503:demoMode') === 'true') {
        setPhotos([])
        return
      }
    } catch {}
    try {
      const res = await fetch('/api/photos/workplace', { credentials: 'same-origin' })
      if (!res.ok) {
        setPhotos([])
        return
      }
      const data = (await res.json()) as { photos?: Photo[] }
      setPhotos(Array.isArray(data.photos) ? data.photos : [])
    } catch {
      setPhotos([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPhotos()
  }, [fetchPhotos])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleDragEnd = useCallback((slot: number, pos: Pos) => {
    setPositions((prev) => {
      const next = { ...prev, [slot]: pos }
      writePositions(next)
      return next
    })
  }, [])

  const handleUpload = useCallback(
    async (slot: number, file: File) => {
      setErrorMsg(null)
      setBusySlot(slot)
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/api/photos/workplace', {
          method: 'POST',
          body: form,
          credentials: 'same-origin',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          setErrorMsg(data.error ?? t.desktopErrorUpload)
        } else {
          await fetchPhotos()
        }
      } catch {
        setErrorMsg(t.desktopErrorUpload)
      } finally {
        setBusySlot(null)
      }
    },
    [fetchPhotos, t],
  )

  const handleDelete = useCallback(
    async (slot: number, photoId: string) => {
      setErrorMsg(null)
      setBusySlot(slot)
      try {
        const res = await fetch(`/api/photos/workplace/${photoId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          setErrorMsg(data.error ?? t.desktopErrorDelete)
        } else {
          await fetchPhotos()
        }
      } catch {
        setErrorMsg(t.desktopErrorDelete)
      } finally {
        setBusySlot(null)
      }
    },
    [fetchPhotos, t],
  )

  if (hidden) return null

  // 3 slots fijos. Cada slot puede tener una foto (visible) o estar vacío.
  // Las fotos vienen ordenadas por created_at desc desde el endpoint.
  const slots: (Photo | null)[] = []
  for (let i = 0; i < SLOTS; i++) slots.push(photos[i] ?? null)

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {logoUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            // Marca de agua discreta anclada abajo-derecha (no gigante centrada):
            // sello de marca debossed, no protagonista. Deja el contenido respirar.
            right: '6%',
            bottom: '8%',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            opacity: 0.04,
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            style={{
              maxWidth: 220,
              maxHeight: 220,
              objectFit: 'contain',
              filter: 'grayscale(40%)',
            }}
          />
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            position: 'absolute',
            bottom: FRAME_GAP,
            left: FRAME_GAP,
            maxWidth: 320,
            padding: '8px 12px',
            background: '#3A1518',
            border: '1px solid #6B2228',
            borderRadius: 3,
            color: '#FBA1A1',
            fontSize: '0.75rem',
            zIndex: 10,
          }}
          onClick={() => setErrorMsg(null)}
          role="button"
          tabIndex={0}
        >
          {errorMsg}
        </div>
      )}

      {slots.map((photo, idx) => (
        <DraggablePolaroid
          key={idx}
          slot={idx}
          photo={photo}
          busy={busySlot === idx}
          savedPos={positions[idx]}
          viewportW={viewport.w}
          viewportH={viewport.h}
          zIndex={2 + idx}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onDragEnd={handleDragEnd}
          t={t}
        />
      ))}
    </div>
  )
}

function DraggablePolaroid({
  slot,
  photo,
  busy,
  savedPos,
  viewportW,
  viewportH,
  zIndex,
  onUpload,
  onDelete,
  onDragEnd,
  t,
}: {
  slot: number
  photo: Photo | null
  busy: boolean
  savedPos: Pos | undefined
  viewportW: number
  viewportH: number
  zIndex: number
  onUpload: (slot: number, file: File) => void
  onDelete: (slot: number, photoId: string) => void
  onDragEnd: (slot: number, pos: Pos) => void
  t: WorkspaceStrings
}) {
  // Área "mesa" útil dentro del viewport — debajo del header y a la derecha
  // del sidebar. Las posiciones guardadas como % son sobre este área (no del
  // viewport entero) para que escalen igual cuando el usuario cambie de
  // tamaño de ventana.
  const tableW = Math.max(0, viewportW - SIDEBAR_W)
  const tableH = Math.max(0, viewportH - HEADER_H)

  // Posición en píxeles (relativa al viewport, listo para position:fixed).
  // null mientras no haya posición guardada → se renderiza con right/bottom.
  const [px, setPx] = useState<{ x: number; y: number } | null>(() => {
    if (savedPos && tableW > 0 && tableH > 0) {
      return {
        x: SIDEBAR_W + savedPos.xPct * tableW,
        y: HEADER_H + savedPos.yPct * tableH,
      }
    }
    return null
  })
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    baseX: number
    baseY: number
    moved: boolean
  } | null>(null)
  const lastPxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (dragging) return
    if (!savedPos || tableW === 0 || tableH === 0) return
    const next = {
      x: SIDEBAR_W + savedPos.xPct * tableW,
      y: HEADER_H + savedPos.yPct * tableH,
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPx(next)
    lastPxRef.current = next
  }, [savedPos, tableW, tableH, dragging])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Si el click es sobre el botón × no arrancamos drag.
    if ((e.target as HTMLElement).dataset.role === 'delete-btn') return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const node = e.currentTarget as HTMLElement
    const parent = node.offsetParent as HTMLElement | null
    let baseX = lastPxRef.current.x
    let baseY = lastPxRef.current.y
    if (px === null && parent) {
      const nodeRect = node.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()
      baseX = nodeRect.left - parentRect.left
      baseY = nodeRect.top - parentRect.top
      setPx({ x: baseX, y: baseY })
      lastPxRef.current = { x: baseX, y: baseY }
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX,
      baseY,
      moved: false,
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    // Treshold antes de declarar "drag de verdad" — así un click normal no
    // activa el modo arrastrando.
    if (!drag.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    if (!drag.moved) {
      drag.moved = true
      setDragging(true)
    }
    // Bounds del viewport: el marco no puede entrar en el sidebar/header ni
    // salirse por los bordes inf/der de la ventana.
    const minX = SIDEBAR_W
    const minY = HEADER_H
    const maxX = Math.max(SIDEBAR_W, viewportW - FRAME_W)
    const maxY = Math.max(HEADER_H, viewportH - FRAME_H)
    const x = Math.min(maxX, Math.max(minX, drag.baseX + dx))
    const y = Math.min(maxY, Math.max(minY, drag.baseY + dy))
    const next = { x, y }
    setPx(next)
    lastPxRef.current = next
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    dragRef.current = null
    if (drag.moved) {
      setDragging(false)
      if (tableW > 0 && tableH > 0) {
        onDragEnd(slot, {
          xPct: (lastPxRef.current.x - SIDEBAR_W) / tableW,
          yPct: (lastPxRef.current.y - HEADER_H) / tableH,
        })
      }
    } else {
      // Click puro (sin drag): abrir file picker — tanto si está vacío como si
      // está lleno (en lleno, sustituye la foto). Si está borrando no abrimos.
      if (!busy) fileInputRef.current?.click()
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(slot, file)
    e.target.value = ''
  }

  const positionStyle: React.CSSProperties =
    px !== null
      ? { left: px.x, top: px.y }
      : {
          right: FRAME_GAP + slot * Math.round(FRAME_W * 0.35),
          bottom: FRAME_GAP,
        }

  const isEmpty = !photo || !photo.url
  const tooltip = isEmpty ? t.desktopFrameEmptyTitle : t.desktopFrameReplaceTitle

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={tooltip}
        style={{
          position: 'fixed',
          ...positionStyle,
          pointerEvents: 'auto',
          width: FRAME_W,
          height: FRAME_H,
          // Vacío = marco fantasma discreto (no caja negra "andamiaje").
          // Con foto = polaroid sólido real. Acento teal en hover (piel v2).
          background: isEmpty && !hovered && !dragging ? 'rgba(10,20,40,0.22)' : '#0A0C12',
          border:
            hovered || dragging
              ? '1px solid #2FD2C9'
              : isEmpty
                ? '1px dashed rgba(47,210,201,0.22)'
                : '1px solid rgba(47,210,201,0.14)',
          borderRadius: 8,
          boxShadow: dragging
            ? '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(47,210,201,0.4), 0 0 32px rgba(47,210,201,0.25)'
            : hovered
              ? '0 16px 36px rgba(0,0,0,0.6), 0 0 24px rgba(47,210,201,0.18)'
              : isEmpty
                ? 'none'
                : '0 12px 28px rgba(0,0,0,0.55)',
          transform: dragging ? 'scale(1.02)' : 'scale(1)',
          transition: 'border-color 0.15s, box-shadow 0.2s, transform 0.15s',
          cursor: busy ? 'wait' : dragging ? 'grabbing' : 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          zIndex: dragging ? 999 : zIndex,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: isEmpty ? 'transparent' : '#000',
            overflow: 'hidden',
          }}
        >
          {isEmpty ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2A3344',
                fontSize: 56,
                fontWeight: 100,
                pointerEvents: 'none',
                fontFamily: 'var(--font-dm-mono), monospace',
              }}
            >
              +
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo!.url!}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          )}
          {!isEmpty && hovered && !dragging && (
            <button
              data-role="delete-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (!busy && photo) onDelete(slot, photo.id)
              }}
              disabled={busy}
              title={t.desktopDeleteTitle}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                borderRadius: 3,
                background: 'rgba(10,12,18,0.92)',
                color: '#FBA1A1',
                border: '1px solid #1E2530',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontSize: 14,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                zIndex: 2,
              }}
            >
              ×
            </button>
          )}
          {busy && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2FD2C9',
                fontSize: '0.75rem',
                pointerEvents: 'none',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.2em',
              }}
            >
              …
            </div>
          )}
        </div>
        {/* Barra HUD inferior — se oculta cuando el marco está vacío y en
            reposo, para no parecer "andamiaje" en el dashboard calmado. Al
            pasar el ratón (o con foto) reaparece. */}
        {(!isEmpty || hovered || dragging) && (
          <div
            style={{
              height: FOOTER_H,
              flexShrink: 0,
              background: '#0E1118',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              color: hovered || dragging ? '#2FD2C9' : '#5A6678',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              transition: 'color 0.15s',
            }}
          >
            <span>SLOT · {String(slot + 1).padStart(2, '0')}</span>
            <span style={{ opacity: 0.6 }}>{isEmpty ? '○' : '●'}</span>
          </div>
        )}
      </div>
    </>
  )
}
