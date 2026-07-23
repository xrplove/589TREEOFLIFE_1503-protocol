'use client'

/**
 * Escritorio TRANSITARIO · montado sobre el DeskFrame COMPARTIDO (Fase 1b, 17-jun).
 *
 * Antes tenía su propio frame (sidebar/cabecera/host). Ahora reusa
 * `app/components/workspace/DeskFrame` igual que el escritorio legal: cabecera 1503
 * + switcher de sector + comms (audio/videollamada/chat) + agenda/correo/archivos
 * compartidos vienen del frame. Aquí solo viven los módulos ESPECÍFICOS del
 * transitario (Custodia, Documentación) + la pantalla de detalle del envío.
 *
 * Es solo PIEL: recibe los datos por props desde el server component (page.tsx,
 * que los lee de BD REAL).
 */

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  BG, BLUE, FONT, FONT_MONO, GOLD, GREEN, HAIR, HAIR_STRONG, LILAC, MINT,
  MUTE, NUM, SLATE, TEXT, TEXT_DIM,
} from '../components/workspace/ui/tokens'
import {
  Aurora, Card, Donut, Grain, SegmentBar, AreaSparkline, StatusPill, DeskStyle,
} from '../components/workspace/ui/DeskKit'
import { type ModuleId } from '../data/sectorDashboardConfig'
import { DeskFrame, type DeskRegistry } from '../components/workspace/DeskFrame'
import { CargaModule } from './carga'
import { ExportacionModule } from './exportacion'
import { InicioModule } from './inicio'
import { ActoresModule } from './actores'
import {
  CUSTODY_ROLE_LABEL, LIFECYCLE_LABEL, LIFECYCLE_ORDER, transportDocKind,
  type AttachedDoc, type CustodyActor, type CustodyLink, type CustodyShipment, type ShipmentDetail, type ShipmentDocs,
} from './custody'

// ── Mapas de presentación ────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  created_pending_completion: MUTE,
  created: SLATE,
  loaded: BLUE,
  in_transit: GOLD,
  arrived: MINT,
  delivered: GREEN,
}
function stateTone(state: string | null): 'ok' | 'info' | 'warn' | 'neutral' {
  if (state === 'delivered' || state === 'arrived') return 'ok'
  if (state === 'in_transit') return 'warn'
  if (state === 'loaded') return 'info'
  return 'neutral'
}
function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HOST · fondo + barra lateral dirigida por config + cabecera
// ════════════════════════════════════════════════════════════════════════════

function Background() {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, background: BG, overflow: 'hidden' }}>
      <Aurora opacity={0.9} />
      <Grain opacity={0.05} />
    </div>
  )
}

export function TransitarioDesk({
  shipments, documents, actors, modules, roleId, roleNote, hrefBase, preview,
}: {
  shipments: CustodyShipment[]
  documents: ShipmentDocs[]
  actors: CustodyActor[]
  modules: ModuleId[]
  roleId?: string | null
  roleNote?: string | null
  hrefBase: string
  preview?: boolean
}) {
  // Solo los módulos ESPECÍFICOS del transitario; la cabecera 1503, el switcher de
  // sector, el cluster de comms (audio/videollamada/chat) y los módulos compartidos
  // (agenda/correo/archivos) los aporta el DeskFrame.
  const registry: DeskRegistry = useMemo(
    () => ({
      inicio: {
        eyebrow: 'Escritorio · transitario',
        title: 'Inicio',
        subtitle: 'Resumen de tu operación: carga, corredores, documentación y red',
        render: (ctx) => <InicioModule shipments={shipments} documents={documents} navigate={ctx.navigate} />,
      },
      pedidos: {
        eyebrow: 'Escritorio · logística de carga',
        title: 'Carga y cubicaje',
        subtitle: 'Tu mercancía en custodia agrupada por destino · asignación automática de contenedor + vista 3D',
        render: (ctx) => <CargaModule shipments={shipments} hrefBase={ctx.hrefBase} preview={preview} />,
      },
      exportacion: {
        eyebrow: 'Escritorio · cumplimiento de comercio',
        title: 'Exportación',
        subtitle: 'Reglas reales de salida e importación por corredor de tus envíos · fuente oficial trazable',
        render: () => <ExportacionModule shipments={shipments} />,
      },
      actores: {
        eyebrow: 'Escritorio · red de la cadena',
        title: 'Actores',
        subtitle: 'Contrapartes con las que compartes cadena de custodia · por rol, sin datos personales',
        render: (ctx) => <ActoresModule actors={actors} hrefBase={ctx.hrefBase} />,
      },
      custodia: {
        eyebrow: 'Escritorio · cadena de custodia',
        title: 'Custodia',
        subtitle: 'Envíos bajo tu custodia · trazabilidad firmada de origen a destino',
        render: (ctx) => <CustodiaModule shipments={shipments} hrefBase={ctx.hrefBase} />,
      },
      documentacion: {
        eyebrow: 'Escritorio · documentación',
        title: 'Documentación',
        subtitle: 'Papeles de transporte y aduana por envío · B/L · AWB · CMR · evidencias',
        render: (ctx) => <DocumentacionModule documents={documents} roleId={ctx.roleId} hrefBase={ctx.hrefBase} />,
      },
    }),
    [shipments, documents, actors, preview],
  )
  return (
    <>
      {roleNote ? (
        <div style={{ position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 55 }}>
          <StatusPill tone="warn">{roleNote}</StatusPill>
        </div>
      ) : null}
      <DeskFrame
        deskLabel="Transitario"
        sectorId="transporte"
        modules={modules}
        registry={registry}
        roleId={roleId}
        hrefBase={hrefBase}
        preview={preview}
      />
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO CUSTODIA · resumen (stats + gráficas + arte) ↔ envíos
// ════════════════════════════════════════════════════════════════════════════

export function CustodiaModule({ shipments, hrefBase }: { shipments: CustodyShipment[]; hrefBase: string }) {
  const [view, setView] = useState<'resumen' | 'envios'>('resumen')
  if (shipments.length === 0) return <EmptyCustodia />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dk-chip" data-active={view === 'resumen'} onClick={() => setView('resumen')}>Resumen</button>
        <button className="dk-chip" data-active={view === 'envios'} onClick={() => setView('envios')}>Envíos · {shipments.length}</button>
      </div>
      {view === 'resumen'
        ? <Resumen shipments={shipments} hrefBase={hrefBase} onSeeAll={() => setView('envios')} />
        : <Envios shipments={shipments} hrefBase={hrefBase} />}
    </div>
  )
}

function Resumen({
  shipments, hrefBase, onSeeAll,
}: {
  shipments: CustodyShipment[]
  hrefBase: string
  onSeeAll: () => void
}) {
  const m = useMemo(() => metrics(shipments), [shipments])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Fila de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <BigStat value={String(m.enCustodia)} label="En custodia ahora" accent={GOLD} />
        <BigStat value={String(m.enTransito)} label="En tránsito" accent={LILAC} />
        <BigStat value={String(m.entregados)} label="Entregados" accent={GREEN} />
        <BigStat value={String(m.paises)} label="Destinos distintos" accent={SLATE} />
      </div>

      {/* Gráficas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16 }} className="tr-cols">
        <Card eyebrow="Actividad" title="Custodias iniciadas">
          <AreaSparkline data={m.activity} color={LILAC} height={92} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.66rem', color: MUTE, fontFamily: FONT_MONO }}>
            <span>{m.activityFrom}</span>
            <span>{m.activityTo}</span>
          </div>
        </Card>
        <Card eyebrow="Reparto" title="Por estado">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <Donut value={m.pctActivo} color={GOLD} color2={LILAC} label={`${m.pctActivo}%`} sub="activos" />
            <div style={{ flex: 1, minWidth: 160 }}>
              <SegmentBar segments={m.segments} />
            </div>
          </div>
        </Card>
      </div>

      {/* Arte: rutas activas */}
      <Card eyebrow="Mapa" title="Rutas activas" right={<button className="dk-chip" onClick={onSeeAll}>Ver todos →</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {shipments.filter((s) => s.custodyEndedAt === null).slice(0, 4).map((s) => (
            <RouteArc key={s.linkId} s={s} hrefBase={hrefBase} />
          ))}
          {m.enCustodia === 0 ? <span style={{ color: MUTE, fontSize: '0.84rem' }}>Sin envíos activos ahora mismo.</span> : null}
        </div>
      </Card>
    </div>
  )
}

function BigStat({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <Card pad={18}>
      <div style={{ ...NUM, fontSize: '2rem', fontWeight: 600, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.74rem', color: TEXT_DIM, marginTop: 8 }}>{label}</div>
    </Card>
  )
}

// Arco de ruta: SVG curvo origen→destino con dos nodos. El "arte".
function RouteArc({ s, hrefBase }: { s: CustodyShipment; hrefBase: string }) {
  const tone = STATE_COLOR[s.lifecycleState ?? ''] ?? MUTE
  return (
    <Link href={`${hrefBase}/${s.dppId}`} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: '0.82rem', color: TEXT, width: 48, textAlign: 'right' }}>
          {s.originCountry ?? '—'}
        </span>
        <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ flex: 1, height: 40 }}>
          <path d="M 6 32 Q 100 -8 194 32" fill="none" stroke={HAIR_STRONG} strokeWidth="1" />
          <path d="M 6 32 Q 100 -8 194 32" fill="none" stroke={tone} strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${tone}66)` }} />
          <circle cx="6" cy="32" r="3.5" fill={SLATE} />
          <circle cx="194" cy="32" r="4" fill={tone} style={{ filter: `drop-shadow(0 0 5px ${tone})` }} />
        </svg>
        <span style={{ fontFamily: FONT_MONO, fontSize: '0.82rem', color: TEXT, width: 56 }}>
          {s.deliveryLocation ?? '—'}
        </span>
        <div style={{ width: 150, textAlign: 'right' }}>
          <div style={{ fontSize: '0.82rem', color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.productName}</div>
          <div style={{ fontSize: '0.66rem', color: MUTE, fontFamily: FONT_MONO }}>{s.incoterm ?? '—'}</div>
        </div>
      </div>
    </Link>
  )
}

function Envios({ shipments, hrefBase }: { shipments: CustodyShipment[]; hrefBase: string }) {
  const enCurso = shipments.filter((s) => s.custodyEndedAt === null)
  const cerrados = shipments.filter((s) => s.custodyEndedAt !== null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <ShipmentGroup heading="En custodia ahora" items={enCurso} hrefBase={hrefBase} />
      <ShipmentGroup heading="Histórico" items={cerrados} hrefBase={hrefBase} />
    </div>
  )
}

function ShipmentGroup({ heading, items, hrefBase }: { heading: string; items: CustodyShipment[]; hrefBase: string }) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="dk-navgroup" style={{ padding: 0, margin: '0 0 10px' }}>{heading} · {items.length}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((s) => (
          <Link key={s.linkId} href={`${hrefBase}/${s.dppId}`} style={{ textDecoration: 'none' }}>
            <Card hover pad={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: TEXT }}>
                    {s.productName}
                    {s.sku ? <span style={{ color: MUTE, fontWeight: 400, fontFamily: FONT_MONO, fontSize: '0.8rem' }}> · {s.sku}</span> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontFamily: FONT_MONO, fontSize: '0.84rem', color: TEXT_DIM }}>
                    <span>{s.originCountry ?? '—'}</span>
                    <span style={{ color: LILAC }}>→</span>
                    <span>{s.deliveryLocation ?? '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <StatusPill tone={stateTone(s.lifecycleState)}>
                    {(s.lifecycleState && LIFECYCLE_LABEL[s.lifecycleState]) || '—'}
                  </StatusPill>
                  <div style={{ fontSize: '0.7rem', color: MUTE, fontFamily: FONT_MONO }}>
                    {s.incoterm ?? '—'}{s.blReference ? ` · BL ${s.blReference}` : ''}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function EmptyCustodia() {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧭</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Aún no tienes envíos en custodia</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        Cuando un fabricante o propietario te transfiera la custodia de un envío (cadena de custodia G10), aparecerá
        aquí con su origen, destino, incoterm y estado en tiempo real.
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO DOCUMENTACIÓN · papeles de transporte/aduana por envío (datos reales)
// ════════════════════════════════════════════════════════════════════════════

export function DocumentacionModule({
  documents, roleId, hrefBase,
}: {
  documents: ShipmentDocs[]
  roleId: string | null
  hrefBase: string
}) {
  if (documents.length === 0) return <EmptyDocs />
  const kind = transportDocKind(roleId)
  const totalDocs = documents.reduce((n, d) => n + d.docs.length, 0)
  const sinPapel = documents.filter((d) => d.docs.length === 0 && !d.blReference).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <BigStat value={String(documents.length)} label="Envíos con expediente" accent={LILAC} />
        <BigStat value={String(totalDocs)} label="Documentos adjuntos" accent={GOLD} />
        <BigStat value={String(sinPapel)} label="Sin documentación aún" accent={sinPapel ? GOLD : GREEN} />
      </div>

      <Card eyebrow="Tu modo" title={`Documento de transporte esperado · ${kind.code}`}>
        <p style={{ fontSize: '0.84rem', color: TEXT_DIM, margin: 0, lineHeight: 1.6 }}>
          Según tu rol de transitario, el documento de transporte de tus envíos es el <strong style={{ color: TEXT }}>{kind.label}</strong>.
          Abajo, por cada envío, su referencia (cuando consta) y las evidencias documentales adjuntadas a lo largo de la
          cadena de custodia. El original vive cifrado en almacenamiento; aquí se referencia con su hash SHA-256.
        </p>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {documents.map((d) => (
          <DocsRow key={d.dppId} d={d} kind={kind} hrefBase={hrefBase} />
        ))}
      </div>
    </div>
  )
}

function DocsRow({ d, kind, hrefBase }: { d: ShipmentDocs; kind: { code: string; label: string }; hrefBase: string }) {
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 12 }}>
        <Link href={`${hrefBase}/${d.dppId}`} style={{ textDecoration: 'none', minWidth: 0 }}>
          <div style={{ fontSize: '0.98rem', fontWeight: 600, color: TEXT }}>{d.productName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontFamily: FONT_MONO, fontSize: '0.82rem', color: TEXT_DIM }}>
            <span>{d.originCountry ?? '—'}</span>
            <span style={{ color: LILAC }}>→</span>
            <span>{d.deliveryLocation ?? '—'}</span>
            {d.incoterm ? <span style={{ color: MUTE }}>· {d.incoterm}</span> : null}
          </div>
        </Link>
        <StatusPill tone={stateTone(d.lifecycleState)}>
          {(d.lifecycleState && LIFECYCLE_LABEL[d.lifecycleState]) || '—'}
        </StatusPill>
      </div>

      {/* Documento de transporte (referencia, derivada del modo) */}
      <DocLine
        label={kind.code}
        value={d.blReference}
        hint={d.maritimeConvention ?? undefined}
        emptyText="referencia no aportada"
      />

      {/* Evidencias documentales reales de la cadena */}
      {d.docs.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: MUTE, marginTop: 8 }}>Sin evidencias documentales adjuntas todavía.</div>
      ) : (
        <div style={{ marginTop: 4 }}>
          {d.docs.map((doc, i) => <EvidenceLine key={i} doc={doc} />)}
        </div>
      )}
    </Card>
  )
}

function DocLine({ label, value, hint, emptyText }: { label: string; value: string | null; hint?: string; emptyText: string }) {
  const present = Boolean(value)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: `1px solid ${HAIR}` }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', color: present ? GOLD : MUTE, border: `1px solid ${present ? `${GOLD}55` : HAIR}`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.84rem', color: present ? TEXT : MUTE, fontFamily: present ? FONT_MONO : FONT, fontStyle: present ? 'normal' : 'italic' }}>
        {value ?? emptyText}
      </span>
      {hint ? <span style={{ fontSize: '0.7rem', color: MUTE, marginLeft: 'auto', fontFamily: FONT_MONO }}>{hint}</span> : null}
    </div>
  )
}

function EvidenceLine({ doc }: { doc: AttachedDoc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: `1px solid ${HAIR}` }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: BLUE, flexShrink: 0, boxShadow: `0 0 6px ${BLUE}aa` }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.84rem', color: TEXT }}>
          {doc.documentType ?? 'Documento'}
          <span style={{ color: MUTE, fontFamily: FONT_MONO, fontSize: '0.72rem' }}> · {CUSTODY_ROLE_LABEL[doc.byRole] ?? doc.byRole}</span>
        </div>
        {doc.documentHash ? (
          <div style={{ fontSize: '0.66rem', color: MUTE, fontFamily: FONT_MONO, marginTop: 2 }} title={doc.documentHash}>
            sha256 {doc.documentHash.slice(0, 12)}… · {fmt(doc.at)}
          </div>
        ) : (
          <div style={{ fontSize: '0.66rem', color: MUTE, fontFamily: FONT_MONO, marginTop: 2 }}>{fmt(doc.at)}</div>
        )}
      </div>
      {doc.documentUrl ? (
        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="dk-chip" style={{ marginLeft: 'auto', textDecoration: 'none', flexShrink: 0 }}>
          Ver
        </a>
      ) : null}
    </div>
  )
}

function EmptyDocs() {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>📄</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Sin expedientes documentales</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        Cuando tengas envíos en custodia, aquí verás su documento de transporte (B/L · AWB · CMR) y las evidencias
        documentales (DUA, certificados, fotos de carga) adjuntadas en cada transferencia de custodia.
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DETALLE (sin cambios funcionales · una pantalla por envío)
// ════════════════════════════════════════════════════════════════════════════

export function ShipmentDetailDesk({ s, backHref, preview }: { s: ShipmentDetail; backHref: string; preview?: boolean }) {
  return (
    <div style={{ fontFamily: FONT, color: TEXT, minHeight: '100vh' }}>
      <DeskStyle />
      <Background />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto', padding: '30px clamp(16px, 4vw, 36px) 80px' }}>
        <Link href={backHref} style={{ color: TEXT_DIM, fontSize: '0.82rem', textDecoration: 'none' }}>← Envíos en custodia</Link>
        <div style={{ height: 16 }} />

        <Card pad={22} style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Aurora opacity={0.5} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                {preview ? <div style={{ marginBottom: 8 }}><StatusPill tone="info">Muestra</StatusPill></div> : null}
                <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{s.productName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_MONO, fontSize: '0.95rem', color: TEXT }}>
                  <span>{s.originCountry ?? '—'}</span>
                  <span style={{ color: LILAC }}>→</span>
                  <span>{s.deliveryLocation ?? '—'}</span>
                </div>
              </div>
              <StatusPill tone={stateTone(s.lifecycleState)}>
                {(s.lifecycleState && LIFECYCLE_LABEL[s.lifecycleState]) || '—'}
              </StatusPill>
            </div>
          </div>
        </Card>

        <Card eyebrow="Estado" title="Progreso del envío" style={{ marginBottom: 16 }}>
          <Stepper state={s.lifecycleState} />
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
          <Card eyebrow="Comercio" title="Datos logísticos">
            <Rows
              rows={[
                ['Incoterm', s.incoterm],
                ['Bill of Lading', s.blReference],
                ['Transportista', s.carrierId],
                ['Convenio marítimo', s.maritimeConvention],
                ['HS code', s.hsCode],
                ['Destino (UN/LOCODE)', s.deliveryLocation],
              ]}
            />
          </Card>
          <Card eyebrow="Carga" title="Bulto y manipulación">
            <Rows
              rows={[
                ['Tipo de bulto', s.packageType],
                ['Dimensiones (mm)', dims(s)],
                ['Peso', s.packageWeightKg != null ? `${s.packageWeightKg} kg` : null],
                ['Apilable', s.stackable == null ? null : s.stackable ? 'Sí' : 'No'],
                ['Refrigerado', reefer(s)],
                ['Mercancía peligrosa', s.imdgClass ? `IMDG clase ${s.imdgClass}` : 'No declarada'],
              ]}
            />
          </Card>
        </div>

        <Card eyebrow="Trazabilidad" title="Cadena de custodia" style={{ marginBottom: 16 }}>
          {s.chain.length === 0 ? (
            <span style={{ color: MUTE, fontSize: '0.85rem' }}>Sin eslabones registrados.</span>
          ) : (
            <div>{s.chain.map((l, i) => <ChainNode key={l.id} link={l} isLast={i === s.chain.length - 1} isMe={l.id === s.linkId} />)}</div>
          )}
        </Card>

        {s.transitions.length > 0 ? (
          <Card eyebrow="Auditoría" title="Historial de estados">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {s.transitions.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: '0.82rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span style={{ color: MUTE, fontFamily: FONT_MONO, minWidth: 120 }}>{fmt(t.transitionedAt)}</span>
                  <span style={{ color: TEXT }}>
                    {(t.fromState && LIFECYCLE_LABEL[t.fromState]) || 'inicio'} <span style={{ color: LILAC }}>→</span>{' '}
                    {LIFECYCLE_LABEL[t.toState] || t.toState}
                  </span>
                  {t.reason ? <span style={{ color: MUTE }}>· {t.reason}</span> : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderTop: i ? `1px solid ${HAIR}` : undefined }}>
          <span style={{ fontSize: '0.78rem', color: MUTE }}>{k}</span>
          <span style={{ fontSize: '0.86rem', color: TEXT, fontFamily: FONT_MONO, textAlign: 'right' }}>{v ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

function Stepper({ state }: { state: string | null }) {
  const idx = state ? LIFECYCLE_ORDER.indexOf(state as (typeof LIFECYCLE_ORDER)[number]) : -1
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {LIFECYCLE_ORDER.map((st, i) => {
        const done = idx >= 0 && i <= idx
        const current = i === idx
        return (
          <div key={st} style={{ flex: 1, minWidth: 84 }}>
            <div style={{ height: 5, borderRadius: 3, background: done ? `linear-gradient(90deg, ${LILAC}, ${GOLD})` : HAIR, boxShadow: current ? `0 0 8px ${GOLD}88` : undefined }} />
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: done ? TEXT : MUTE, marginTop: 7, fontFamily: FONT_MONO }}>
              {LIFECYCLE_LABEL[st]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChainNode({ link, isLast, isMe }: { link: CustodyLink; isLast: boolean; isMe: boolean }) {
  const dot = isMe ? GOLD : link.custodyEndedAt === null ? GREEN : MUTE
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: dot, marginTop: 4, boxShadow: `0 0 7px ${dot}aa` }} />
        {!isLast ? <span style={{ width: 2, flex: 1, background: HAIR, marginTop: 3 }} /> : null}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 18, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', color: TEXT, fontWeight: isMe ? 600 : 400 }}>
          {CUSTODY_ROLE_LABEL[link.custodyRole] ?? link.custodyRole}
          {isMe ? <span style={{ color: GOLD, fontSize: '0.68rem', fontFamily: FONT_MONO }}> · TÚ</span> : null}
        </div>
        <div style={{ fontSize: '0.74rem', color: MUTE, fontFamily: FONT_MONO, marginTop: 3 }}>
          {fmt(link.custodyStartedAt)}{link.custodyEndedAt ? ` → ${fmt(link.custodyEndedAt)}` : ' · vigente'}
          {link.gpsLat != null && link.gpsLng != null ? ` · GPS ${link.gpsLat}, ${link.gpsLng}` : ''}
        </div>
        {link.evidence?.document_type ? (
          <div style={{ fontSize: '0.74rem', color: BLUE, marginTop: 4 }}>
            Doc {link.evidence.document_type}
            {link.evidence.document_url ? <> · <a href={link.evidence.document_url} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>ver</a></> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── helpers de detalle ─────────────────────────────────────────────────────
function dims(s: ShipmentDetail): string | null {
  const { packageLengthMm: l, packageWidthMm: w, packageHeightMm: h } = s
  if (l == null && w == null && h == null) return null
  return `${l ?? '?'} × ${w ?? '?'} × ${h ?? '?'}`
}
function reefer(s: ShipmentDetail): string {
  if (s.reeferTempMinC == null && s.reeferTempMaxC == null) return 'No'
  return `${s.reeferTempMinC ?? '?'} a ${s.reeferTempMaxC ?? '?'} °C`
}

// ── métricas derivadas (reales, calculadas sobre los envíos) ─────────────────
function metrics(shipments: CustodyShipment[]) {
  const enCustodia = shipments.filter((s) => s.custodyEndedAt === null).length
  const enTransito = shipments.filter((s) => s.lifecycleState === 'in_transit').length
  const entregados = shipments.filter((s) => s.lifecycleState === 'delivered' || s.lifecycleState === 'arrived').length
  const paises = new Set(shipments.map((s) => s.deliveryLocation).filter(Boolean)).size

  // Reparto por estado → barra segmentada.
  const counts = new Map<string, number>()
  for (const s of shipments) {
    const k = s.lifecycleState ?? 'created'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const segments = [...counts.entries()].map(([k, v]) => ({
    label: LIFECYCLE_LABEL[k] ?? k,
    value: v,
    color: STATE_COLOR[k] ?? MUTE,
  }))
  const activos = shipments.filter((s) => s.custodyEndedAt === null).length
  const pctActivo = shipments.length ? Math.round((activos / shipments.length) * 100) : 0

  // Actividad: custodias iniciadas por mes (serie real).
  const byMonth = new Map<string, number>()
  for (const s of shipments) {
    const key = s.custodyStartedAt.slice(0, 7) // YYYY-MM
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1)
  }
  const sorted = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  let activity = sorted.map(([, v]) => v)
  if (activity.length < 2) activity = [0, ...activity, 0] // que la línea respire
  const activityFrom = sorted[0]?.[0] ?? ''
  const activityTo = sorted[sorted.length - 1]?.[0] ?? ''

  return { enCustodia, enTransito, entregados, paises, segments, pctActivo, activity, activityFrom, activityTo }
}
