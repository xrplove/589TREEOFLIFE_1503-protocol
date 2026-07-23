'use client'

// Fase 5.2 — Agenda interna del escritorio (roadmap activo §5.2).
// Calendario mensual + CRUD de reuniones del actor.
//
// v1 single-actor: invitar a OTROS actores se difiere a Fase 6 (necesita
// el directorio de actores, mismo bloqueante que el recipientId del chat).
//
// Persistencia v1: localStorage (igual que ArchivosView). El backend real
// (tabla Supabase + invitaciones cross-actor) es follow-up explícito —
// marcado en el pie de la vista, no se finge que está hecho.
//
// Nombres de meses y días: Intl.DateTimeFormat con el idioma del actor —
// nada de 19 cadenas × 8 idiomas en i18n.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { Lang, WorkspaceStrings } from '../data/i18n'
import { IconChat, IconPhone, IconVideo } from './workspace/icons'

const STORE_KEY = '1503:calendar:events'

const C = {
  panel: 'rgba(13,16,22,0.66)',
  panelSoft: 'rgba(255,255,255,0.024)',
  border: 'rgba(255,255,255,0.10)',
  borderSoft: 'rgba(255,255,255,0.07)',
  accent: '#B9A4FF',
  amber: '#F0B429',
  text: '#EAEFF6',
  dim: '#9AA7B8',
  faint: '#6B7686',
  sans: 'var(--font-geist-sans), system-ui, sans-serif',
  mono: 'var(--font-geist-mono), monospace',
}

/**
 * CalEvent — entrada de la Agenda del Actor.
 *
 * Campos básicos: id, fecha, horas, título, nota.
 *
 * Hardening 23-may tarde: ampliado con los campos del modelo de admisión a
 * reuniones cerrado en `project_1503_modelo_admision_reuniones`. Hoy
 * estos campos son OPCIONALES y solo se rellenan en eventos tipo "reunión".
 * Cuando llegue el backend de meetings (Fase 4-5 con Jitsi + WS), pasarán a
 * ser obligatorios para `kind === 'meeting'` y se enforz a nivel SQL.
 *
 * Capturarlos hoy aunque no se rendericen UI evita perder el modelo cuando
 * llegue la implementación real.
 */
interface CalEvent {
  id: string
  date: string // YYYY-MM-DD
  start: string // HH:MM ('' si no se indicó)
  end: string // HH:MM ('' si no se indicó)
  title: string
  note: string
  /** Tipo de entrada. 'note' (default) = recordatorio simple. 'meeting' =
     reunión con allowlist + acta + escrow on-chain de comisiones. */
  kind?: 'note' | 'meeting'
  /** Motivo/concepto detallado de la reunión (obligatorio en `kind:'meeting'`
     según el modelo de acta). */
  motivo?: string
  /** Organizer = Actor-ID del creador. Tiene voto de desempate en admisión,
     puede admitir invitados con su cuota + cerrar la reunión + transferir rol. */
  organizadorActorId?: string
  /** Allowlist: Actor-IDs de los invitados ESPERADOS. Solo estos podrán
     entrar directamente al Stage cuando se abra la sala. */
  participantesEsperados?: string[]
  /** Cuota de invitados extra del organizador. Default 0 (sin invitaciones
     unilaterales — los invitados de última hora pasan por voto democrático). */
  cuotaInvitados?: number
  /** Modo del voto democrático para admisión de invitados de última hora. */
  modoVoto?: 'anonimo' | 'publico'
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `e-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

// Empty start ordena al final del día.
function byStart(a: CalEvent, b: CalEvent): number {
  return (a.start || '99:99').localeCompare(b.start || '99:99')
}

// Combina fecha (YYYY-MM-DD) + hora (HH:MM) en un Date local. null si sin hora.
function toDateTime(date: string, time: string): Date | null {
  if (!time) return null
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
}

/** ¿La reunión está EN CURSO ahora? Ventana = 10 min antes del inicio hasta
   el fin (o inicio+1h si no hay fin). Esto activa llamada/vídeo/chat en la
   agenda al llegar el día y la hora (visión José 2026-05-30). */
function isLiveNow(ev: CalEvent, now: Date): boolean {
  const s = toDateTime(ev.date, ev.start)
  if (!s) return false
  const e = ev.end ? toDateTime(ev.date, ev.end) : null
  const end = e ?? new Date(s.getTime() + 60 * 60000)
  const open = new Date(s.getTime() - 10 * 60000)
  return now >= open && now <= end
}

/** ¿Es una reunión (tiene participantes)? */
function isMeeting(ev: CalEvent): boolean {
  return (ev.participantesEsperados?.length ?? 0) > 0 || ev.kind === 'meeting'
}

function loadEvents(): CalEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e) =>
          e &&
          typeof e.id === 'string' &&
          typeof e.date === 'string' &&
          typeof e.title === 'string',
      )
      .map((e) => ({
        id: e.id,
        date: e.date,
        start: typeof e.start === 'string' ? e.start : '',
        end: typeof e.end === 'string' ? e.end : '',
        title: e.title,
        note: typeof e.note === 'string' ? e.note : '',
        // Campos del modelo de admisión (opcionales en eventos antiguos).
        kind: e.kind === 'meeting' ? 'meeting' : 'note',
        motivo: typeof e.motivo === 'string' ? e.motivo : undefined,
        organizadorActorId:
          typeof e.organizadorActorId === 'string' ? e.organizadorActorId : undefined,
        participantesEsperados: Array.isArray(e.participantesEsperados)
          ? e.participantesEsperados.filter((id: unknown): id is string => typeof id === 'string')
          : undefined,
        cuotaInvitados: typeof e.cuotaInvitados === 'number' ? e.cuotaInvitados : undefined,
        modoVoto:
          e.modoVoto === 'anonimo' || e.modoVoto === 'publico' ? e.modoVoto : undefined,
      }))
  } catch {
    return []
  }
}

function persist(list: CalEvent[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(list))
  } catch {
    // localStorage lleno/bloqueado: no es fatal, sigue en memoria.
  }
}

export default function AgendaView({
  t,
  lang,
  onStartComms,
}: {
  t: WorkspaceStrings
  lang: Lang
  /** Lanza la comunicación real (reusa el cluster de comms del workspace /
     LiveKit cuando esté desplegado). Solo se invoca si la reunión está en curso. */
  onStartComms?: (channel: 'chat' | 'call' | 'video') => void
}) {
  const [events, setEvents] = useState<CalEvent[]>([])
  // 1.º día del mes mostrado.
  const [viewDate, setViewDate] = useState<Date>(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<string>(() => ymd(new Date()))

  // Formulario de alta/edición.
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fStart, setFStart] = useState('')
  const [fEnd, setFEnd] = useState('')
  const [fNote, setFNote] = useState('')
  const [fParticipants, setFParticipants] = useState<string[]>([])
  const [fPartInput, setFPartInput] = useState('')

  // Reloj que avanza · activa la comunicación al llegar la hora de la reunión.
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  // Carga en useEffect (no en initializer perezoso) a propósito: leer
  // localStorage durante el render inicial provocaría desajuste de
  // hidratación SSR (servidor pinta [], cliente pintaría los eventos).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(loadEvents())
  }, [])

  const todayYmd = ymd(new Date())

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const e of events) {
      ;(map[e.date] ??= []).push(e)
    }
    for (const k in map) map[k].sort(byStart)
    return map
  }, [events])

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= todayYmd)
        .sort((a, b) => a.date.localeCompare(b.date) || byStart(a, b))
        .slice(0, 6),
    [events, todayYmd],
  )

  // Aviso del sistema: reunión en curso ahora, o la próxima de hoy.
  const liveMeeting = useMemo(() => events.find((e) => isMeeting(e) && isLiveNow(e, now)), [events, now])
  const todayMeeting = useMemo(
    () => events.filter((e) => isMeeting(e) && e.date === todayYmd).sort(byStart)[0],
    [events, todayYmd],
  )
  const alertMeeting = liveMeeting ?? todayMeeting

  // Cabeceras de los 7 días, semana empezando en lunes.
  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short' })
    const monday = new Date(2024, 0, 1) // 1-ene-2024 fue lunes
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return fmt.format(d)
    })
  }, [lang])

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, {
        month: 'long',
        year: 'numeric',
      }).format(viewDate),
    [lang, viewDate],
  )

  const selectedLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(parseYmd(selectedDay)),
    [lang, selectedDay],
  )

  // Celdas del mes: huecos iniciales (lunes=0) + días, completadas a /7.
  const cells = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const list: (string | null)[] = []
    for (let i = 0; i < firstDow; i++) list.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(`${y}-${pad2(m + 1)}-${pad2(d)}`)
    }
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [viewDate])

  const dayEvents = eventsByDay[selectedDay] ?? []

  function shiftMonth(delta: number) {
    setViewDate(
      (v) => new Date(v.getFullYear(), v.getMonth() + delta, 1),
    )
  }

  function goToday() {
    const n = new Date()
    setViewDate(new Date(n.getFullYear(), n.getMonth(), 1))
    setSelectedDay(ymd(n))
    closeForm()
  }

  function pickDay(day: string) {
    setSelectedDay(day)
    closeForm()
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setFTitle('')
    setFStart('')
    setFEnd('')
    setFNote('')
    setFParticipants([])
    setFPartInput('')
  }

  function addParticipant() {
    const id = fPartInput.trim()
    if (!id) return
    setFParticipants((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setFPartInput('')
  }

  function removeParticipant(id: string) {
    setFParticipants((prev) => prev.filter((p) => p !== id))
  }

  function openNew() {
    closeForm()
    setFormOpen(true)
  }

  function openEdit(ev: CalEvent) {
    setEditingId(ev.id)
    setFTitle(ev.title)
    setFStart(ev.start)
    setFEnd(ev.end)
    setFNote(ev.note)
    setFParticipants(ev.participantesEsperados ?? [])
    setFPartInput('')
    setFormOpen(true)
  }

  function saveEvent() {
    const title = fTitle.trim()
    if (!title) return
    setEvents((prev) => {
      let next: CalEvent[]
      const meeting = fParticipants.length > 0
      if (editingId) {
        next = prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                title,
                start: fStart,
                end: fEnd,
                note: fNote.trim(),
                kind: meeting ? 'meeting' : 'note',
                participantesEsperados: meeting ? fParticipants : undefined,
              }
            : e,
        )
      } else {
        next = [
          ...prev,
          {
            id: uid(),
            date: selectedDay,
            start: fStart,
            end: fEnd,
            title,
            note: fNote.trim(),
            kind: meeting ? 'meeting' : 'note',
            participantesEsperados: meeting ? fParticipants : undefined,
          },
        ]
      }
      persist(next)
      return next
    })
    closeForm()
  }

  function deleteEvent(id: string) {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id)
      persist(next)
      return next
    })
    if (editingId === id) closeForm()
  }

  function timeRange(e: CalEvent): string {
    if (!e.start) return ''
    return e.end ? `${e.start}–${e.end}` : e.start
  }

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      {/* Cabecera de sección (estilo SectionHeader del escritorio) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <span
          style={{
            color: C.accent,
            fontSize: '0.7rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            fontFamily: C.mono,
            fontWeight: 500,
          }}
        >
          ◆ {t.agendaEyebrow}
        </span>
        <h1
          style={{
            fontFamily: C.sans,
            fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
            fontWeight: 700,
            color: C.text,
            margin: '0.5rem 0 0.6rem',
            letterSpacing: '0.02em',
            lineHeight: 1.15,
          }}
        >
          {t.agendaTitle}
        </h1>
        <p
          style={{
            color: C.dim,
            fontSize: '0.95rem',
            lineHeight: 1.6,
            maxWidth: 680,
            margin: 0,
            fontFamily: C.sans,
          }}
        >
          {t.agendaBody}
        </p>
      </div>

      {/* Aviso del sistema · reunión en curso / de hoy */}
      {alertMeeting && (
        <button
          onClick={() => {
            const d = parseYmd(alertMeeting.date)
            setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
            pickDay(alertMeeting.date)
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            marginBottom: '1.25rem', padding: '0.85rem 1.1rem', borderRadius: 6, cursor: 'pointer',
            background: liveMeeting ? 'rgba(84,224,140,0.08)' : 'rgba(240,180,41,0.07)',
            border: `1px solid ${liveMeeting ? 'rgba(84,224,140,0.4)' : 'rgba(240,180,41,0.35)'}`,
          }}
        >
          <span style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: liveMeeting ? '#54E08C' : C.amber,
            boxShadow: `0 0 8px ${liveMeeting ? '#54E08C' : C.amber}`,
            animation: liveMeeting ? 'pulse 1.5s infinite' : 'none',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: C.mono, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: liveMeeting ? '#54E08C' : C.amber }}>
              {liveMeeting ? '● Reunión en curso · comunicación activa' : 'Tienes una reunión hoy'}
            </div>
            <div style={{ fontFamily: C.sans, fontSize: '0.92rem', fontWeight: 600, color: C.text, marginTop: 2 }}>
              {alertMeeting.title}{alertMeeting.start ? ` · ${alertMeeting.start}` : ''}
              {alertMeeting.participantesEsperados && alertMeeting.participantesEsperados.length > 0 && (
                <span style={{ color: C.dim, fontWeight: 400, fontSize: '0.8rem' }}> · {alertMeeting.participantesEsperados.length} participante{alertMeeting.participantesEsperados.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <span style={{ fontFamily: C.mono, fontSize: '0.62rem', color: C.dim, flexShrink: 0 }}>{liveMeeting ? 'unirse →' : 'ver →'}</span>
        </button>
      )}

      {/* Calendario + panel del día */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* ── Calendario mensual ── */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: '1.1rem 1.1rem 1.25rem',
          }}
        >
          {/* Navegación de mes */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: '1rem',
            }}
          >
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="-1"
              style={navBtn}
            >
              ‹
            </button>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: C.sans,
                fontSize: '1.02rem',
                fontWeight: 700,
                color: C.text,
                textTransform: 'capitalize',
                letterSpacing: '0.02em',
              }}
            >
              {monthLabel}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="+1"
              style={navBtn}
            >
              ›
            </button>
            <button onClick={goToday} style={todayBtn}>
              {t.agendaToday}
            </button>
          </div>

          {/* Cabeceras de días */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginBottom: 4,
            }}
          >
            {weekdayNames.map((w, i) => (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  fontFamily: C.mono,
                  fontSize: '0.62rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: C.faint,
                  padding: '2px 0',
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Rejilla de días */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const count = eventsByDay[day]?.length ?? 0
              const isToday = day === todayYmd
              const isSel = day === selectedDay
              const dayNum = Number(day.slice(8, 10))
              return (
                <button
                  key={i}
                  onClick={() => pickDay(day)}
                  style={{
                    minHeight: 62,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '5px 6px',
                    background: isSel
                      ? 'rgba(185,164,255,0.14)'
                      : C.panelSoft,
                    border: isSel
                      ? `1px solid ${C.accent}`
                      : isToday
                      ? `1px solid ${C.amber}`
                      : `1px solid ${C.borderSoft}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontFamily: C.sans,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: isToday || isSel ? 700 : 500,
                      color: isToday
                        ? C.amber
                        : count > 0
                        ? C.text
                        : C.dim,
                    }}
                  >
                    {dayNum}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        fontFamily: C.mono,
                        fontSize: '0.56rem',
                        color: C.accent,
                        background: 'rgba(185,164,255,0.14)',
                        border: `1px solid rgba(185,164,255,0.32)`,
                        borderRadius: 2,
                        padding: '1px 5px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      ● {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Panel del día seleccionado ── */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: '1.1rem 1.1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
          }}
        >
          <div
            style={{
              fontFamily: C.sans,
              fontSize: '0.98rem',
              fontWeight: 700,
              color: C.text,
              textTransform: 'capitalize',
            }}
          >
            {selectedLabel}
          </div>

          {!formOpen && (
            <button onClick={openNew} style={primaryBtn}>
              + {t.agendaNewMeeting}
            </button>
          )}

          {/* Formulario de alta/edición */}
          {formOpen && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                border: `1px solid ${C.borderSoft}`,
                borderRadius: 3,
                padding: '0.85rem',
                background: C.panelSoft,
              }}
            >
              <label style={fieldLabel}>{t.agendaEventTitle}</label>
              <input
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value.slice(0, 90))}
                placeholder={t.agendaEventTitlePlaceholder}
                style={textInput}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>{t.agendaStart}</label>
                  <input
                    type="time"
                    value={fStart}
                    onChange={(e) => setFStart(e.target.value)}
                    style={{ ...textInput, width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>{t.agendaEnd}</label>
                  <input
                    type="time"
                    value={fEnd}
                    onChange={(e) => setFEnd(e.target.value)}
                    style={{ ...textInput, width: '100%' }}
                  />
                </div>
              </div>
              <label style={fieldLabel}>{t.agendaNote}</label>
              <textarea
                value={fNote}
                onChange={(e) => setFNote(e.target.value.slice(0, 500))}
                placeholder={t.agendaNotePlaceholder}
                rows={2}
                style={{ ...textInput, resize: 'none', lineHeight: 1.4 }}
              />

              {/* Participantes por Actor-ID · convierte la cita en REUNIÓN con
                  comunicación (chat/llamada/vídeo) que se activa a la hora. */}
              <label style={fieldLabel}>Participantes · Actor-ID</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={fPartInput}
                  onChange={(e) => setFPartInput(e.target.value.slice(0, 40))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addParticipant() } }}
                  placeholder="p. ej. AGR-US-7K2F-… (proveedor)"
                  style={{ ...textInput, flex: 1 }}
                />
                <button onClick={addParticipant} disabled={!fPartInput.trim()} style={{ ...ghostBtn, opacity: fPartInput.trim() ? 1 : 0.4, cursor: fPartInput.trim() ? 'pointer' : 'not-allowed' }}>+</button>
              </div>
              {fParticipants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {fParticipants.map((id) => (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(185,164,255,0.12)', border: '1px solid rgba(185,164,255,0.32)', borderRadius: 999, padding: '3px 10px', fontFamily: C.mono, fontSize: '0.66rem', color: C.accent }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                      {id}
                      <button onClick={() => removeParticipant(id)} aria-label="Quitar" style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 0, fontSize: '0.8rem', lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  onClick={saveEvent}
                  disabled={!fTitle.trim()}
                  style={{
                    ...primaryBtn,
                    flex: 1,
                    opacity: fTitle.trim() ? 1 : 0.4,
                    cursor: fTitle.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {t.agendaSave}
                </button>
                <button onClick={closeForm} style={ghostBtn}>
                  {t.agendaCancel}
                </button>
              </div>
            </div>
          )}

          {/* Reuniones del día */}
          {dayEvents.length === 0 && !formOpen && (
            <div
              style={{
                color: C.faint,
                fontSize: '0.82rem',
                fontFamily: C.sans,
                padding: '0.4rem 0',
              }}
            >
              {t.agendaNoEventsDay}
            </div>
          )}
          {dayEvents.map((ev) => (
            <EventRow
              key={ev.id}
              ev={ev}
              range={timeRange(ev)}
              t={t}
              lang={lang}
              now={now}
              onEdit={() => openEdit(ev)}
              onDelete={() => deleteEvent(ev.id)}
              onStartComms={onStartComms}
            />
          ))}
        </div>
      </div>

      {/* ── Próximas reuniones ── */}
      <div style={{ marginTop: '1.5rem' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.accent,
            marginBottom: '0.7rem',
          }}
        >
          {t.agendaUpcoming}
        </div>
        {upcoming.length === 0 ? (
          <div
            style={{
              color: C.faint,
              fontSize: '0.82rem',
              fontFamily: C.sans,
            }}
          >
            {t.agendaNoUpcoming}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {upcoming.map((ev) => (
              <button
                key={ev.id}
                onClick={() => {
                  const d = parseYmd(ev.date)
                  setViewDate(
                    new Date(d.getFullYear(), d.getMonth(), 1),
                  )
                  pickDay(ev.date)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  background: C.panelSoft,
                  border: `1px solid ${C.borderSoft}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: C.sans,
                }}
              >
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: '0.68rem',
                    color: C.dim,
                    minWidth: 116,
                  }}
                >
                  {new Intl.DateTimeFormat(lang, {
                    day: 'numeric',
                    month: 'short',
                  }).format(parseYmd(ev.date))}
                  {ev.start ? ` · ${ev.start}` : ''}
                </span>
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: C.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ev.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pie honesto: localStorage + invitaciones cross-actor diferidas */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '0.9rem',
          borderTop: `1px solid ${C.borderSoft}`,
          color: C.faint,
          fontSize: '0.72rem',
          fontFamily: C.mono,
          letterSpacing: '0.04em',
        }}
      >
        {t.agendaFooter}
      </div>
    </div>
  )
}

function EventRow({
  ev,
  range,
  t,
  lang,
  now,
  onEdit,
  onDelete,
  onStartComms,
}: {
  ev: CalEvent
  range: string
  t: WorkspaceStrings
  lang: Lang
  now: Date
  onEdit: () => void
  onDelete: () => void
  onStartComms?: (channel: 'chat' | 'call' | 'video') => void
}) {
  const meeting = isMeeting(ev)
  const live = meeting && isLiveNow(ev, now)
  const startLabel = ev.start
    ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(parseYmd(ev.date)) + ` · ${ev.start}`
    : new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(parseYmd(ev.date))
  return (
    <div
      style={{
        border: `1px solid ${live ? 'rgba(84,224,140,0.4)' : C.borderSoft}`,
        borderLeft: `2px solid ${live ? '#54E08C' : C.accent}`,
        borderRadius: 3,
        padding: '8px 10px',
        background: live ? 'rgba(84,224,140,0.05)' : C.panelSoft,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {range && (
          <span style={{ fontFamily: C.mono, fontSize: '0.68rem', color: C.accent, flexShrink: 0 }}>{range}</span>
        )}
        <span style={{ fontFamily: C.sans, fontSize: '0.86rem', fontWeight: 600, color: C.text, flex: 1, wordBreak: 'break-word' }}>
          {ev.title}
        </span>
        {meeting && (
          <span style={{ fontFamily: C.mono, fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: live ? '#54E08C' : C.faint, flexShrink: 0 }}>
            {live ? '● en curso' : 'reunión'}
          </span>
        )}
      </div>
      {ev.note && (
        <div style={{ marginTop: 3, fontSize: '0.78rem', color: C.dim, fontFamily: C.sans, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {ev.note}
        </div>
      )}

      {/* Participantes por Actor-ID */}
      {meeting && ev.participantesEsperados && ev.participantesEsperados.length > 0 && (
        <div style={{ marginTop: 7 }}>
          <div style={{ fontFamily: C.mono, fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.faint, marginBottom: 4 }}>
            Participantes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {ev.participantesEsperados.map((id) => (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(185,164,255,0.10)', border: '1px solid rgba(185,164,255,0.28)', borderRadius: 999, padding: '2px 9px', fontFamily: C.mono, fontSize: '0.62rem', color: C.accent }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent }} />{id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comunicación · se ACTIVA al llegar el día y la hora */}
      {meeting && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <CommsBtn label="Chat" icon={<IconChat />} live={live} onClick={() => onStartComms?.('chat')} />
            <CommsBtn label="Llamada" icon={<IconPhone />} live={live} onClick={() => onStartComms?.('call')} />
            <CommsBtn label="Vídeo" icon={<IconVideo />} live={live} onClick={() => onStartComms?.('video')} />
          </div>
          <div style={{ marginTop: 5, fontFamily: C.mono, fontSize: '0.58rem', color: live ? '#54E08C' : C.faint, letterSpacing: '0.03em' }}>
            {live ? '✓ comunicación activa ahora' : `se activa el ${startLabel}`}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onEdit} style={miniBtn}>{t.agendaEdit}</button>
        <button onClick={onDelete} style={{ ...miniBtn, color: '#E0857E' }}>{t.agendaDelete}</button>
      </div>
    </div>
  )
}

function CommsBtn({ label, icon, live, onClick }: { label: string; icon: ReactNode; live: boolean; onClick: () => void }) {
  return (
    <button
      onClick={live ? onClick : undefined}
      disabled={!live}
      title={live ? `${label} ahora` : `${label} · disponible a la hora de la reunión`}
      style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '11px 4px 9px', borderRadius: 8, fontFamily: C.mono, fontSize: '0.56rem',
        letterSpacing: '0.1em', textTransform: 'uppercase', overflow: 'hidden',
        cursor: live ? 'pointer' : 'not-allowed',
        background: live ? 'rgba(84,224,140,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${live ? 'rgba(84,224,140,0.5)' : C.borderSoft}`,
        color: live ? '#8BE6AC' : C.faint,
        boxShadow: live ? '0 0 16px rgba(84,224,140,0.18), inset 0 0 12px rgba(84,224,140,0.05)' : 'none',
        opacity: live ? 1 : 0.6,
        transition: 'all .18s',
      }}
    >
      {/* corner-brackets de instrumento (estética futurista) */}
      <span style={{ position: 'absolute', top: 4, left: 4, width: 6, height: 6, borderTop: `1px solid ${live ? '#8BE6AC' : C.faint}`, borderLeft: `1px solid ${live ? '#8BE6AC' : C.faint}`, opacity: 0.6 }} />
      <span style={{ position: 'absolute', bottom: 4, right: 4, width: 6, height: 6, borderBottom: `1px solid ${live ? '#8BE6AC' : C.faint}`, borderRight: `1px solid ${live ? '#8BE6AC' : C.faint}`, opacity: 0.6 }} />
      <span style={{ display: 'flex' }}>{icon}</span>
      {label}
    </button>
  )
}

/* ── estilos compartidos ── */
const navBtn: CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: `1px solid ${C.borderSoft}`,
  borderRadius: 3,
  color: C.dim,
  fontSize: '1rem',
  cursor: 'pointer',
  fontFamily: C.sans,
}

const todayBtn: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${C.borderSoft}`,
  borderRadius: 3,
  color: C.dim,
  fontSize: '0.7rem',
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: C.mono,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const primaryBtn: CSSProperties = {
  background: 'rgba(185,164,255,0.12)',
  border: `1px solid rgba(185,164,255,0.32)`,
  color: C.accent,
  borderRadius: 3,
  padding: '8px 14px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontFamily: C.sans,
  letterSpacing: '0.03em',
}

const ghostBtn: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${C.borderSoft}`,
  color: C.dim,
  borderRadius: 3,
  padding: '8px 14px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontFamily: C.sans,
}

const miniBtn: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${C.borderSoft}`,
  color: C.dim,
  borderRadius: 2,
  padding: '3px 9px',
  fontSize: '0.68rem',
  cursor: 'pointer',
  fontFamily: C.mono,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const fieldLabel: CSSProperties = {
  fontFamily: C.mono,
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: C.faint,
}

const textInput: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  padding: '7px 10px',
  fontSize: '0.82rem',
  fontFamily: C.sans,
  outline: 'none',
}
