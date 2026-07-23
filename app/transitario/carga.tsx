'use client'

/**
 * MÓDULO CARGA / CUBICAJE del escritorio TRANSITARIO (pestaña «Pedidos»).
 *
 * Cumple el pendiente del ESTADO §0: «cablear assignContainer + visor al
 * escritorio (pestaña Carga del transitario), con override manual».
 *
 * REUTILIZA, sin duplicar nada:
 *  · `assignContainer` (app/lib/containerAssign.ts) — motor puro de asignación
 *    de contenedor + grupaje (regla José <40% → LCL).
 *  · `ContainerLoadView` (app/components/ContainerLoadView.tsx) — visor 3D PBR,
 *    cargado con dynamic + ssr:false (mismo patrón que /preview/carga).
 *  · `LoadMap` (app/components/LoadMap.tsx) — mapa de carga 2D (planta + perfil).
 *  · `packCargoLayout` (app/lib/cargoPack.ts) — cubicaje real compartido por 3D y mapa.
 *  · `CONTAINER_SPECS` (app/data/containerSpecs.ts) — specs ISO 6346 (fuente única).
 *
 * DATO REAL Y HONESTO: agrupa la mercancía EN CUSTODIA del transitario por
 * DESTINO (no se mezcla carga de corredores distintos en un contenedor) y
 * corre el motor sobre las MEDIDAS REALES del bulto (dpp_registry). Los envíos
 * sin medidas/peso NO se inventan: se listan aparte como «falta medir».
 */

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  assignContainer,
  LCL_THRESHOLD_FRACTION,
  type AssignMode,
  type CargoItem,
} from '../lib/containerAssign'
import {
  CONTAINER_SPECS,
  getContainerSpec,
  isCubicajeContainer,
  type ContainerType,
} from '../data/containerSpecs'
import type { ContainerLoadViewItem } from '../components/ContainerLoadView'
import LoadMap from '../components/LoadMap'
import { Card, StatusPill } from '../components/workspace/ui/DeskKit'
import {
  FONT_MONO, GOLD, GREEN, HAIR, LILAC, MUTE, NUM, RED, TEXT, TEXT_DIM,
} from '../components/workspace/ui/tokens'
import type { CustodyShipment } from './custody'

// Visor 3D · cliente puro (WebGL). Mismo dynamic/ssr:false que /preview/carga.
const ContainerLoadView = dynamic(() => import('../components/ContainerLoadView'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '3rem', textAlign: 'center', color: TEXT_DIM, fontSize: '0.84rem' }}>Cargando visor 3D…</div>
  ),
})

// ── Mapa de modo → tono/etiqueta (alineado con la paleta Desk Kit) ────────────
const MODE_META: Record<AssignMode, { label: string; tone: 'ok' | 'warn' | 'info' | 'bad'; color: string }> = {
  FCL: { label: 'Contenedor completo (FCL)', tone: 'ok', color: GREEN },
  LCL: { label: 'Grupaje (LCL)', tone: 'warn', color: GOLD },
  MULTI: { label: 'Multi-contenedor', tone: 'info', color: LILAC },
  UNFIT: { label: 'Carga especial', tone: 'bad', color: RED },
}

const PALETTE = ['#5E9DFF', '#54E08C', '#B9A4FF', '#F0B429', '#86E8C0', '#E0857E', '#3FCFC4', '#F08AC0']

// ── Tipos derivados ────────────────────────────────────────────────────────
interface CargoLine {
  s: CustodyShipment
  color: string
}
interface DestinoGroup {
  destino: string
  measured: CargoLine[] //  bultos con medidas → entran al motor
  unmeasured: CustodyShipment[] // sin medidas → honesto, fuera del cubicaje
}

function hasDims(s: CustodyShipment): boolean {
  return (
    s.packageLengthMm != null && s.packageWidthMm != null &&
    s.packageHeightMm != null && s.packageWeightKg != null &&
    s.packageLengthMm > 0 && s.packageWidthMm > 0 && s.packageHeightMm > 0
  )
}

/** Volumen del bulto en m³ (mm³ → m³). El dato que decide grupaje/cubicaje. */
function volM3(s: CustodyShipment): number {
  if (!hasDims(s)) return 0
  return Math.round((s.packageLengthMm! * s.packageWidthMm! * s.packageHeightMm!) / 1e9 * 1000) / 1000
}

function toCargoItem(s: CustodyShipment): CargoItem {
  return {
    id: s.dppId,
    length_mm: s.packageLengthMm!,
    width_mm: s.packageWidthMm!,
    height_mm: s.packageHeightMm!,
    weight_kg: s.packageWeightKg!,
    quantity: 1,
    required_orientation: s.stackable === false ? 'this_way_up' : undefined,
    refrigerated: s.reeferTempMinC != null || s.reeferTempMaxC != null,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Módulo
// ════════════════════════════════════════════════════════════════════════════

export function CargaModule({ shipments, hrefBase, preview }: { shipments: CustodyShipment[]; hrefBase: string; preview?: boolean }) {
  // Solo la carga EN CUSTODIA (la entregada/cerrada ya no se planifica).
  const activos = useMemo(() => shipments.filter((s) => s.custodyEndedAt === null), [shipments])

  // Agrupa por destino; asigna color estable por bulto dentro del grupo.
  const groups = useMemo<DestinoGroup[]>(() => {
    const byDest = new Map<string, CustodyShipment[]>()
    for (const s of activos) {
      const k = s.deliveryLocation ?? '—'
      byDest.set(k, [...(byDest.get(k) ?? []), s])
    }
    return [...byDest.entries()]
      .map(([destino, list]) => {
        const measured: CargoLine[] = []
        const unmeasured: CustodyShipment[] = []
        let ci = 0
        for (const s of list) {
          if (hasDims(s)) measured.push({ s, color: PALETTE[ci++ % PALETTE.length]! })
          else unmeasured.push(s)
        }
        return { destino, measured, unmeasured }
      })
      .sort((a, b) => b.measured.length - a.measured.length)
  }, [activos])

  const [activeDest, setActiveDest] = useState<string>(groups[0]?.destino ?? '')
  const group = groups.find((g) => g.destino === activeDest) ?? groups[0]

  if (activos.length === 0) return <EmptyCarga />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selector de destino (corredor de consolidación) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Destino</span>
        {groups.map((g) => (
          <button
            key={g.destino}
            className="dk-chip"
            data-active={g.destino === group?.destino}
            onClick={() => setActiveDest(g.destino)}
          >
            {g.destino} · {g.measured.length + g.unmeasured.length}
          </button>
        ))}
      </div>

      {group ? <DestinoCarga key={group.destino} group={group} hrefBase={hrefBase} preview={preview} /> : null}
    </div>
  )
}

// ── Asignación + visor 3D de un destino ──────────────────────────────────────
function DestinoCarga({ group, hrefBase, preview }: { group: DestinoGroup; hrefBase: string; preview?: boolean }) {
  const cargo = useMemo<CargoItem[]>(() => group.measured.map((l) => toCargoItem(l.s)), [group.measured])
  const result = useMemo(() => assignContainer(cargo), [cargo])
  const meta = MODE_META[result.mode]

  // Override manual del transitario: forzar un contenedor para visualizar.
  const [override, setOverride] = useState<ContainerType | ''>('')
  // Vista del cubicaje: 3D fotorrealista o mapa de carga 2D imprimible.
  const [view, setView] = useState<'3d' | 'mapa'>('3d')
  const shown: ContainerType | null =
    override !== '' ? override : result.container ?? null

  const viewItems = useMemo<ContainerLoadViewItem[]>(
    () =>
      group.measured.map((l) => ({
        id: l.s.dppId,
        name: l.s.productName,
        length_mm: l.s.packageLengthMm!,
        width_mm: l.s.packageWidthMm!,
        height_mm: l.s.packageHeightMm!,
        weight_kg: l.s.packageWeightKg!,
        quantity: 1,
        color_hex: l.color,
      })),
    [group.measured],
  )

  // Ocupación frente al contenedor mostrado (auto o forzado) — honesto.
  const shownSpec = shown ? getContainerSpec(shown) : undefined
  const shownUtil =
    shownSpec && result.total_volume_m3 > 0
      ? Math.round((result.total_volume_m3 / shownSpec.inner_volume_m3) * 100)
      : null

  const can3D = shown != null && isCubicajeContainer(shown) && viewItems.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Decisión del motor */}
      <Card eyebrow={`Corredor · destino ${group.destino}`} title="Asignación automática de contenedor" style={{ borderColor: `${meta.color}55` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          {result.container ? (
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: TEXT }}>
              {getContainerSpec(result.container)?.display_name ?? result.container}
              {result.count > 1 ? ` × ${result.count}` : ''}
            </span>
          ) : null}
          <span style={{ fontSize: '0.8rem', color: TEXT_DIM, fontFamily: FONT_MONO, marginLeft: 'auto' }}>
            {result.total_volume_m3} m³ · {result.total_weight_kg} kg
            {result.mode !== 'UNFIT' ? ` · ocupación ${result.utilization_pct}%` : ''}
          </span>
        </div>
        <p style={{ fontSize: '0.84rem', color: TEXT_DIM, lineHeight: 1.6, margin: '12px 0 0' }}>{result.reason}</p>
      </Card>

      {/* Bultos del corredor */}
      <Card eyebrow="Carga" title={`Bultos en custodia · ${group.measured.length}`}>
        {group.measured.length === 0 ? (
          <span style={{ fontSize: '0.84rem', color: MUTE }}>Ningún bulto con medidas en este destino.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.measured.map((l) => (
              <BultoRow key={l.s.dppId} line={l} hrefBase={hrefBase} />
            ))}
          </div>
        )}
        {group.unmeasured.length > 0 ? <UnmeasuredNote items={group.unmeasured} hrefBase={hrefBase} /> : null}
      </Card>

      {/* Visor 3D del empaquetado (FCL/MULTI o override) */}
      {can3D ? (
        <Card eyebrow="Cubicaje" title={view === '3d' ? 'Empaquetado 3D' : 'Mapa de carga'} pad={0} style={{ overflow: 'hidden' }} right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="dk-chip" data-active={view === '3d'} onClick={() => setView('3d')}>3D</button>
              <button className="dk-chip" data-active={view === 'mapa'} onClick={() => setView('mapa')}>Mapa</button>
            </div>
            <ContainerOverride value={override} onChange={setOverride} auto={result.container ?? null} />
          </div>
        }>
          {view === '3d' ? (
            <div style={{ height: 520 }}>
              <ContainerLoadView containerType={shown!} items={viewItems} openSides={['front']} rotateWithCtrl />
            </div>
          ) : (
            <div style={{ padding: '14px 16px' }}>
              <LoadMap containerType={shown!} items={viewItems} />
            </div>
          )}
          <div style={{ padding: '0.7rem 1rem 1rem', fontSize: '0.74rem', color: MUTE, lineHeight: 1.5 }}>
            {override !== '' ? (
              <>
                <strong style={{ color: GOLD }}>Vista forzada por ti</strong> · {getContainerSpec(shown!)?.display_name}
                {shownUtil != null ? ` · ocupación ${shownUtil}%` : ''}. El motor proponía{' '}
                {result.container ? getContainerSpec(result.container)?.display_name : 'grupaje'}.
              </>
            ) : result.mode === 'MULTI' ? (
              `Vista del primer contenedor de ${result.count}; el reparto fino entre contenedores lo consolidas tú.`
            ) : (
              'Cubicaje real (dimensiones del bulto en mm, sin solapes) · el 3D y el mapa de carga parten del mismo cálculo. La consolidación final la confirma el transitario.'
            )}
          </div>
        </Card>
      ) : result.mode === 'LCL' ? (
        <GrupajeReady
          group={group}
          m3={result.total_volume_m3}
          kg={result.total_weight_kg}
          preview={preview}
          override={override}
          onOverride={setOverride}
        />
      ) : (
        <Card eyebrow="Cubicaje" title="Sin visor 3D para este modo" style={{ borderStyle: 'dashed' }}>
          <p style={{ fontSize: '0.84rem', color: TEXT_DIM, lineHeight: 1.6, margin: 0 }}>
            {result.mode === 'UNFIT'
              ? `Hay bulto(s) que no caben en ningún contenedor soportado (${result.unfit_items.join(', ') || '—'}): se tratan como carga especial (break-bulk / flat rack), fuera del cubicaje 3D.`
              : 'Aún no hay carga con medidas para cubicar en este destino.'}
          </p>
        </Card>
      )}

      <p style={{ fontSize: '0.66rem', color: MUTE, fontFamily: FONT_MONO, margin: 0 }}>
        Motor: containerAssign.ts (regla José · ISO 6346) · estiba: cargoPack.ts (cubicaje real) · medidas reales del bulto (DPP).
      </p>
    </div>
  )
}

function BultoRow({ line, hrefBase }: { line: CargoLine; hrefBase: string }) {
  const { s, color } = line
  const dims = `${s.packageLengthMm}×${s.packageWidthMm}×${s.packageHeightMm} mm`
  return (
    <Link href={`${hrefBase}/${s.dppId}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${HAIR}` }}>
        <span style={{ width: 11, height: 11, borderRadius: 3, background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}88` }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.88rem', color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.productName}
            {s.reeferTempMinC != null || s.reeferTempMaxC != null ? <span style={{ color: '#0ea5e9', fontSize: '0.7rem' }}> · ❄ frío</span> : null}
            {s.stackable === false ? <span style={{ color: GOLD, fontSize: '0.7rem' }}> · ⬆ no volcar</span> : null}
          </div>
          <div style={{ fontSize: '0.7rem', color: MUTE, fontFamily: FONT_MONO, marginTop: 2 }}>{s.packageType ?? 'bulto'} · {dims}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ ...NUM, fontSize: '0.82rem', color: TEXT, fontFamily: FONT_MONO }}>{volM3(s)} m³</div>
          <div style={{ ...NUM, fontSize: '0.7rem', color: TEXT_DIM, fontFamily: FONT_MONO }}>{s.packageWeightKg} kg</div>
        </div>
      </div>
    </Link>
  )
}

function UnmeasuredNote({ items, hrefBase }: { items: CustodyShipment[]; hrefBase: string }) {
  return (
    <div style={{ marginTop: 14, padding: '12px 14px', border: `1px solid ${GOLD}33`, borderRadius: 10, background: 'rgba(240,180,41,0.05)' }}>
      <div style={{ fontSize: '0.74rem', color: GOLD, fontWeight: 600, marginBottom: 6 }}>
        Falta medir · {items.length} envío{items.length > 1 ? 's' : ''} fuera del cubicaje
      </div>
      <div style={{ fontSize: '0.78rem', color: TEXT_DIM, lineHeight: 1.55 }}>
        Sin peso o medidas del bulto no se puede calcular su m³ (el DPP los exige para mercancía física). En cuanto se midan, su volumen los encaja en este contenedor o en un grupaje. Quedan fuera del cálculo hasta completarlos:{' '}
        {items.map((s, i) => (
          <span key={s.dppId}>
            <Link href={`${hrefBase}/${s.dppId}`} style={{ color: TEXT, textDecoration: 'underline' }}>{s.productName}</Link>
            {i < items.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </div>
    </div>
  )
}

function ContainerOverride({
  value, onChange, auto,
}: {
  value: ContainerType | ''
  onChange: (v: ContainerType | '') => void
  auto: ContainerType | null
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ContainerType | '')}
      title="Forzar un contenedor para previsualizar (override manual)"
      style={{
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${HAIR}`, borderRadius: 8,
        color: TEXT, padding: '6px 10px', fontSize: '0.76rem', fontFamily: FONT_MONO, cursor: 'pointer',
      }}
    >
      <option value="">{auto ? `Auto · ${getContainerSpec(auto)?.display_name ?? auto}` : 'Forzar contenedor…'}</option>
      {Object.values(CONTAINER_SPECS).map((spec) => (
        <option key={spec.type} value={spec.type}>{spec.display_name}{spec.refrigerated ? ' ❄' : ''}</option>
      ))}
    </select>
  )
}

// ── Grupaje · mercancía LCL lista para consolidar (aviso + buscar grupaje) ────
function GrupajeReady({
  group, m3, kg, preview, override, onOverride,
}: {
  group: DestinoGroup
  m3: number
  kg: number
  preview?: boolean
  override: ContainerType | ''
  onOverride: (v: ContainerType | '') => void
}) {
  const [searching, setSearching] = useState(false)
  const origen = group.measured[0]?.s.originCountry ?? '—'
  return (
    <Card
      eyebrow="Grupaje (LCL)"
      title="Mercancía lista para consolidar"
      style={{ borderColor: `${GOLD}44` }}
      right={<ContainerOverride value={override} onChange={onOverride} auto={null} />}
    >
      {/* Aviso: queda en m³ lista para grupaje, anclada al corredor */}
      <div style={{ padding: '12px 14px', border: `1px solid ${GOLD}33`, borderRadius: 10, background: 'rgba(240,180,41,0.05)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>📦</span>
        <div style={{ fontSize: '0.84rem', color: TEXT_DIM, lineHeight: 1.55 }}>
          <strong style={{ color: TEXT }}>{m3} m³ · {kg} kg</strong> listos para grupaje · corredor{' '}
          <strong style={{ color: TEXT, fontFamily: FONT_MONO }}>{origen} → {group.destino}</strong>.
          No llena un contenedor completo: se consolida con otra carga del <strong>mismo puerto de carga y destino</strong>,
          repartiendo el coste por volumen/peso (W/M). Puedes forzar un contenedor arriba para previsualizar la consolidación.
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="dk-chip"
          data-active={searching}
          onClick={() => setSearching((v) => !v)}
          style={{ fontWeight: 600 }}
        >
          🔍 Buscar grupaje
        </button>
        <span style={{ fontSize: '0.72rem', color: MUTE }}>cruza cargas del mismo corredor para llenar un contenedor compartido</span>
      </div>

      {searching ? <GrupajeSearch destino={group.destino} origen={origen} m3={m3} preview={preview} /> : null}
    </Card>
  )
}

function GrupajeSearch({ destino, origen, m3, preview }: { destino: string; origen: string; m3: number; preview?: boolean }) {
  // Ruta REAL: el emparejamiento cross-tenant (ver carga de otros) es backend +
  // privacidad/RLS, pendiente. No se finge dato.
  if (!preview) {
    return (
      <div style={{ marginTop: 14, padding: '14px 16px', border: `1px dashed ${HAIR}`, borderRadius: 10 }}>
        <div style={{ fontSize: '0.84rem', color: TEXT, fontWeight: 600, marginBottom: 6 }}>Buscando en la red de consolidación…</div>
        <p style={{ fontSize: '0.8rem', color: TEXT_DIM, lineHeight: 1.55, margin: 0 }}>
          Se cruzan cargas con el mismo puerto de carga y destino (<strong style={{ fontFamily: FONT_MONO }}>{origen} → {destino}</strong>).
          En cuanto haya carga compatible, aquí se propone un contenedor compartido con el reparto de coste por W/M.
          La red de consolidación cross-tenant se activa con la infraestructura desplegada (sin exponer datos del otro expedidor).
        </p>
      </div>
    )
  }

  // PREVIEW: coincidencias de MUESTRA para enseñar el flujo (no es BD).
  const offers = [
    { ref: 'CONS-2291', m3: 9.4, kg: 1180, note: 'Mobiliario de expositor' },
    { ref: 'CONS-1043', m3: 6.1, kg: 640, note: 'Decoración y menaje' },
  ]
  const combined = Math.round((m3 + offers.reduce((n, o) => n + o.m3, 0)) * 10) / 10
  const fill = Math.round((combined / CONTAINER_SPECS['20ST'].inner_volume_m3) * 100)
  return (
    <div style={{ marginTop: 14, padding: '14px 16px', border: `1px solid ${GREEN}33`, borderRadius: 10, background: 'rgba(84,224,140,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: '0.84rem', color: TEXT, fontWeight: 600 }}>Carga compatible en {origen} → {destino}</div>
        <StatusPill tone="info">Muestra</StatusPill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {offers.map((o) => (
          <div key={o.ref} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: `1px solid ${HAIR}` }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: GREEN, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', color: TEXT }}>{o.note} <span style={{ color: MUTE, fontFamily: FONT_MONO, fontSize: '0.72rem' }}>· {o.ref}</span></div>
            </div>
            <span style={{ ...NUM, fontSize: '0.8rem', color: TEXT_DIM, fontFamily: FONT_MONO }}>{o.m3} m³ · {o.kg} kg</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.8rem', color: TEXT_DIM, lineHeight: 1.55, margin: '12px 0 0' }}>
        Juntas suman <strong style={{ color: TEXT }}>{combined} m³</strong> → llenan un <strong>20&apos; Standard al ~{fill}%</strong>.
        Al confirmar, 1503 reserva el contenedor compartido y reparte el coste por W/M entre los expedidores.
      </p>
    </div>
  )
}

function EmptyCarga() {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>📦</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Sin carga que planificar</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        Cuando tengas envíos en custodia, aquí se agrupan por destino y el motor asigna el contenedor óptimo
        (o grupaje si no llena el {LCL_THRESHOLD_FRACTION * 100}% del más pequeño), con vista 3D del empaquetado.
      </div>
    </Card>
  )
}
