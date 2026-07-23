'use client'

/**
 * DESKFRAME · marco compartido de TODOS los escritorios config-driven (decisión
 * de José 16-jun, opción A: extraer el chrome común en vez de forkarlo por sector).
 *
 * Aporta, una sola vez para los 17 sectores:
 *  · Fondo + piel Desk Kit (calma premium fintech).
 *  · Cabecera: marca 1503 + nombre del escritorio + SWITCHER DE SECTOR (filtro por
 *    vertical, navega vía landingPathFor) + indicador de mercado + CLUSTER DE COMMS
 *    (mensajes · llamada · videollamada · reunión).
 *  · Barra lateral dirigida por `modulesFor()` (config), con resolución de módulos
 *    vía un registro: módulos de SECTOR (los pasa cada escritorio) + módulos
 *    COMPARTIDOS que tienen todos (agenda · correo · archivos).
 *  · Chat drawer + Stage de llamada (honesto: infra real pendiente, ver Comms.tsx).
 *
 * Cada escritorio (transitario, legal, …) = <DeskFrame> + su registro de módulos.
 */

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Aurora, Card, Eyebrow, Grain, StatusPill, DeskStyle,
} from './ui/DeskKit'
import {
  BG, FONT, FONT_BRAND, FONT_MONO, GOLD, HAIR, LILAC, MUTE, TEXT, TEXT_DIM,
} from './ui/tokens'
import { CallStage, ChatDrawer, CommsCluster, useComms } from './comms/Comms'
import { MODULES, landingPathFor, type ModuleId } from '../../data/sectorDashboardConfig'
import { SECTORS } from '../../data/sectors'
import { I18nCtx } from './i18n-context'
import { getWorkspaceStrings, langForCountry } from '../../data/i18n'
import AgendaView from '../AgendaView'

// ── Contrato de módulo ───────────────────────────────────────────────────────
export interface DeskModuleCtx {
  hrefBase: string
  roleId: string | null
  /** Cambia el módulo activo (para cockpits/home que enlazan a otras pestañas). */
  navigate: (id: ModuleId) => void
}
export interface DeskModuleImpl {
  eyebrow: string
  title: string
  subtitle: string
  render: (ctx: DeskModuleCtx) => ReactNode
}
export type DeskRegistry = Partial<Record<ModuleId, DeskModuleImpl>>

// ── Iconos por módulo (línea, heredan color) ─────────────────────────────────
function svg(children: ReactNode) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
}
const I = {
  home: () => svg(<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  grid: () => svg(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>),
  users: () => svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>),
  box: () => svg(<><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>),
  doc: () => svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></>),
  mail: () => svg(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7 10-7" /></>),
  cal: () => svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></>),
  ship: () => svg(<><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1" /><path d="M19.4 13 12 4 4.6 13" /><path d="M5 13V7h14v6" /></>),
}
const MODULE_ICON: Record<ModuleId, ReactNode> = {
  inicio: I.home(), catalogo: I.grid(), actores: I.users(), pedidos: I.box(), 'mi-catalogo': I.grid(),
  archivos: I.doc(), mensajes: I.mail(), agenda: I.cal(), exportacion: I.ship(),
  custodia: I.box(), documentacion: I.doc(), dpp: I.grid(), 'cadena-frio': I.box(), trazabilidad: I.ship(),
  compliance: I.doc(), colegiacion: I.users(), reservas: I.cal(), licitaciones: I.doc(), firma: I.doc(), acreditacion: I.users(),
  expedientes: I.box(), plazos: I.cal(), conflicto: I.users(), penal: I.doc(), facturacion: I.doc(),
}

// ── Módulos COMPARTIDOS por todos los escritorios ────────────────────────────
// Aquí vive lo que José pide compartir: agenda (real), correo, archivos. El resto
// (comms videollamada/chat) va en la cabecera, disponible en cualquier módulo.
function sharedModules(onStartComms: (ch: 'chat' | 'call' | 'video') => void): DeskRegistry {
  const t = getWorkspaceStrings(langForCountry('ES'))
  const lang = langForCountry('ES')
  return {
    agenda: {
      eyebrow: 'Compartido · planificación', title: 'Agenda', subtitle: 'Citas, vistas y plazos · la reunión arranca a su hora',
      render: () => (
        <I18nCtx.Provider value={{ t, lang }}>
          <AgendaView t={t} lang={lang} onStartComms={onStartComms} />
        </I18nCtx.Provider>
      ),
    },
    mensajes: {
      eyebrow: 'Compartido · comunicación', title: 'Mensajes', subtitle: 'Correo interno del escritorio',
      render: () => <Honest icon="📨" title="Bandeja de correo interno" body="El correo interno se conecta cuando la infraestructura de comunicaciones esté desplegada (adapter Mailcow ya existe en el ecosistema). El chat rápido está en el cluster de la cabecera." />,
    },
    archivos: {
      eyebrow: 'Compartido · documentos', title: 'Archivos', subtitle: 'Documentos generales del escritorio',
      render: () => <Honest icon="🗂️" title="Archivos del escritorio" body="Documentos generales (PII off-chain, referencia + hash). Se cablea al almacenamiento real por escritorio." />,
    },
  }
}

function Honest({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>{body}</div>
    </Card>
  )
}

// ── Frame ────────────────────────────────────────────────────────────────────
export function DeskFrame({
  deskLabel, sectorId, modules, registry, roleId, hrefBase, preview,
}: {
  deskLabel: string
  sectorId: string
  modules: ModuleId[]
  registry: DeskRegistry
  roleId?: string | null
  hrefBase: string
  preview?: boolean
}) {
  const comms = useComms(`1503:${sectorId}:lobby`)
  const onStartComms = (ch: 'chat' | 'call' | 'video') => { void comms.onCluster(ch) }
  const fullRegistry: DeskRegistry = useMemo(
    () => ({ ...sharedModules(onStartComms), ...registry }),
    // registry/onStartComms estables por render del escritorio
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry],
  )
  const firstImpl = modules.find((m) => fullRegistry[m]) ?? modules[0]
  const [active, setActive] = useState<ModuleId>(firstImpl ?? 'inicio')
  const impl = fullRegistry[active]
  const ctx: DeskModuleCtx = { hrefBase, roleId: roleId ?? null, navigate: setActive }

  return (
    <div style={{ fontFamily: FONT, color: TEXT, minHeight: '100vh' }}>
      <DeskStyle />
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, background: BG, overflow: 'hidden' }}>
        <Aurora opacity={0.9} />
        <Grain opacity={0.05} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar deskLabel={deskLabel} sectorId={sectorId} comms={comms} />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <Sidebar modules={modules} registry={fullRegistry} active={active} onSelect={setActive} />
          <main style={{ flex: 1, minWidth: 0, padding: '30px clamp(16px, 4vw, 44px) 80px', maxWidth: 1180 }}>
            <header style={{ marginBottom: 24 }}>
              <Eyebrow color={LILAC}>{impl?.eyebrow ?? 'Escritorio'}</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{impl?.title ?? (MODULES[active]?.label ?? deskLabel)}</h1>
                {preview ? <StatusPill tone="info">Vista de muestra</StatusPill> : null}
              </div>
              {impl?.subtitle ? <p style={{ fontSize: '0.88rem', color: TEXT_DIM, margin: '6px 0 0' }}>{impl.subtitle}</p> : null}
            </header>
            {impl ? impl.render(ctx) : <ElsewherePanel id={active} />}
          </main>
        </div>
      </div>

      <ChatDrawer open={comms.chatOpen} onClose={comms.closeChat} />
      <CallStage api={comms} />
    </div>
  )
}

function TopBar({ deskLabel, sectorId, comms }: { deskLabel: string; sectorId: string; comms: ReturnType<typeof useComms> }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 16, padding: '0 clamp(16px, 4vw, 28px)', height: 60, borderBottom: `1px solid ${HAIR}`, background: 'rgba(10,12,17,0.72)', backdropFilter: 'blur(18px) saturate(1.1)' }}>
      <Link href="/sectors" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: FONT_BRAND, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.04em', color: TEXT }}>15<span style={{ color: GOLD }}>03</span></span>
        <span style={{ fontFamily: FONT_MONO, fontSize: '0.56rem', letterSpacing: '0.22em', color: MUTE, textTransform: 'uppercase' }}>{deskLabel}</span>
      </Link>
      <SectorSwitcher current={sectorId} />
      <div style={{ flex: 1 }} />
      <CommsCluster state={comms.state} stage={comms.stage} chatOpen={comms.chatOpen} onCluster={comms.onCluster} />
    </header>
  )
}

function SectorSwitcher({ current }: { current: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const currentLabel = SECTORS.find((s) => s.id === current)?.label ?? current
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 9, border: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.04)', color: TEXT, cursor: 'pointer', fontSize: '0.82rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: LILAC }} />
        {currentLabel}
        <span style={{ color: MUTE, fontSize: '0.7rem' }}>▾</span>
      </button>
      {open ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 80, width: 230, maxHeight: 360, overflowY: 'auto', background: '#0E1117', border: `1px solid ${HAIR}`, borderRadius: 12, padding: 6, boxShadow: '0 18px 50px rgba(0,0,0,0.5)' }}>
          {SECTORS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setOpen(false); router.push(landingPathFor({ sectorId: s.id })) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: s.id === current ? 'rgba(185,164,255,0.12)' : 'transparent', color: s.id === current ? LILAC : TEXT_DIM, cursor: 'pointer', fontSize: '0.82rem' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Sidebar({ modules, registry, active, onSelect }: { modules: ModuleId[]; registry: DeskRegistry; active: ModuleId; onSelect: (id: ModuleId) => void }) {
  return (
    <aside style={{ width: 222, flexShrink: 0, borderRight: `1px solid ${HAIR}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 60, alignSelf: 'flex-start', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div className="dk-navgroup">Escritorio</div>
      {modules.map((id) => {
        const here = Boolean(registry[id])
        return (
          <button key={id} className="dk-nav" data-active={active === id} onClick={() => onSelect(id)} title={MODULES[id]?.why}>
            <span className="dk-nav-ico">{MODULE_ICON[id]}</span>
            <span style={{ flex: 1 }}>{MODULES[id]?.label ?? id}</span>
            {!here ? <span style={{ fontSize: '0.5rem', color: MUTE, fontFamily: FONT_MONO }}>↗</span> : null}
          </button>
        )
      })}
    </aside>
  )
}

function ElsewherePanel({ id }: { id: ModuleId }) {
  const label = MODULES[id]?.label ?? id
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 12, color: LILAC }}>{MODULE_ICON[id]}</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>«{label}» aún no está integrado en este escritorio</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 18px' }}>
        {MODULES[id]?.why ?? 'Módulo del sector pendiente de construir.'} Por ahora, disponible en el espacio de trabajo general.
      </div>
      <Link href="/sectors" className="dk-chip" style={{ textDecoration: 'none' }}>Ver sectores →</Link>
    </Card>
  )
}
