'use client'

/**
 * MÓDULO EXPORTACIÓN del escritorio TRANSITARIO (pestaña «Exportación»).
 *
 * REUTILIZA el motor real de cumplimiento de comercio (ADR 0022,
 * app/data/tradeCompliance.ts): getCorridorRequirements + groupByLayer +
 * splitConditional. NO se duplica lógica ni reglas.
 *
 * A diferencia de la vista general (ExportComplianceView, con selectores
 * genéricos y tema claro), aquí los corredores se DERIVAN de los envíos en
 * custodia (origen del producto → país del destino UN/LOCODE, con el HS del
 * bulto) y se pinta con el Desk Kit oscuro para que case con el escritorio.
 *
 * Honesto (canon José · 0 atajos): cada regla muestra su fuente oficial y su
 * estado `subject_to_expert` (la suficiencia la sella un abogado = bloqueante
 * pre-deploy). Lo no cubierto se dice ("marco en construcción"), no se finge.
 */

import { useMemo, useState } from 'react'
import {
  getCorridorRequirements, groupByLayer, splitConditional, type TradeRule,
} from '../data/tradeCompliance'
import { getLabel, type Lang } from '../data/actorGroups'
import { flagEmoji } from '../data/continents'
import { Card } from '../components/workspace/ui/DeskKit'
import {
  AMBER, FONT_MONO, GREEN, MUTE, TEAL, TEXT, TEXT_DIM,
} from '../components/workspace/ui/tokens'
import type { CustodyShipment } from './custody'

const LANG: Lang = 'es'

const STATUS_LABEL: Record<string, string> = {
  subject_to_expert: 'sujeto a validación experta',
  validated: 'validado',
  proposed: 'propuesto',
  draft: 'borrador',
}

interface Corridor {
  key: string
  origin: string // ISO alpha-2 (país de origen del producto)
  dest: string //   ISO alpha-2 (primeras 2 letras del UN/LOCODE de destino)
  count: number
  hs: string[] //   códigos HS distintos de la carga del corredor
}

function deriveCorridors(shipments: CustodyShipment[]): Corridor[] {
  const map = new Map<string, Corridor>()
  for (const s of shipments) {
    if (s.custodyEndedAt !== null) continue // solo carga viva
    const origin = (s.originCountry ?? '').toUpperCase()
    const dest = (s.deliveryLocation ?? '').slice(0, 2).toUpperCase() // UN/LOCODE → ISO país
    if (origin.length !== 2 || dest.length !== 2) continue // sin corredor fiable → fuera
    const key = `${origin}->${dest}`
    const c = map.get(key) ?? { key, origin, dest, count: 0, hs: [] }
    c.count += 1
    if (s.hsCode && !c.hs.includes(s.hsCode)) c.hs.push(s.hsCode)
    map.set(key, c)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export function ExportacionModule({ shipments }: { shipments: CustodyShipment[] }) {
  const corridors = useMemo(() => deriveCorridors(shipments), [shipments])
  const [activeKey, setActiveKey] = useState(corridors[0]?.key ?? '')
  const corridor = corridors.find((c) => c.key === activeKey) ?? corridors[0]

  if (corridors.length === 0) return <EmptyExport />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Corredor</span>
        {corridors.map((c) => (
          <button key={c.key} className="dk-chip" data-active={c.key === corridor?.key} onClick={() => setActiveKey(c.key)}>
            {flagEmoji(c.origin)} {c.origin} → {flagEmoji(c.dest)} {c.dest} · {c.count}
          </button>
        ))}
      </div>
      {corridor ? <CorridorReqs key={corridor.key} corridor={corridor} /> : null}
    </div>
  )
}

function CorridorReqs({ corridor }: { corridor: Corridor }) {
  const rules = useMemo(() => {
    // Une la consulta general (sin HS) con una por cada HS de la carga, y dedup
    // por id → afloran tanto el marco general como las reglas por producto (HS).
    const queries: { origin: string; destination: string; hsCode?: string }[] = [
      { origin: corridor.origin, destination: corridor.dest },
      ...corridor.hs.map((hsCode) => ({ origin: corridor.origin, destination: corridor.dest, hsCode })),
    ]
    const seen = new Map<string, TradeRule>()
    for (const q of queries) for (const r of getCorridorRequirements(q)) seen.set(r.id, r)
    return [...seen.values()]
  }, [corridor])

  const byLayer = useMemo(() => groupByLayer(rules), [rules])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card eyebrow={`Corredor · ${corridor.origin} → ${corridor.dest}`} title="Qué exige tu corredor de comercio">
        <p style={{ fontSize: '0.84rem', color: TEXT_DIM, lineHeight: 1.6, margin: 0 }}>
          1503 compone las reglas reales de <strong style={{ color: TEXT }}>salida</strong> (exportación) y{' '}
          <strong style={{ color: TEXT }}>entrada</strong> (importación) para este corredor, cada una con su fuente oficial
          trazable. La aplicabilidad fina y la suficiencia las confirma un <strong>abogado</strong> — aquí se facilita, no se sella.
        </p>
        <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.72rem', color: MUTE, fontFamily: FONT_MONO }}>
          <span>{rules.length} {rules.length === 1 ? 'regla aplicable' : 'reglas aplicables'}</span>
          {corridor.hs.length ? <span>· HS en la carga: {corridor.hs.join(', ')}</span> : null}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <LayerCol
          title="Salida · exportación"
          badge={`${flagEmoji(corridor.origin)} ${corridor.origin}`}
          rules={byLayer.exit}
          emptyMsg={`Marco de salida para ${corridor.origin}: en construcción. Hoy el catálogo verificado cubre la exportación desde la UE-27.`}
        />
        <LayerCol
          title="Entrada · importación"
          badge={`${flagEmoji(corridor.dest)} ${corridor.dest}`}
          rules={byLayer.entry}
          emptyMsg={`Marco de entrada para ${corridor.dest}: en construcción. Hoy el catálogo verificado cubre la importación a Colombia (CO).`}
        />
      </div>

      <p style={{ fontSize: '0.7rem', color: MUTE, lineHeight: 1.5, margin: 0 }}>
        Capa 3 (acuerdos comerciales · origen preferente) y Capa 4 (requisitos sectoriales del producto): en construcción.
        Motor composicional ADR 0022 · fuentes EUR-Lex · DG TAXUD · DIAN · ICA · INVIMA.
      </p>
    </div>
  )
}

function LayerCol({ title, badge, rules, emptyMsg }: { title: string; badge: string; rules: TradeRule[]; emptyMsg: string }) {
  const { always, conditional } = splitConditional(rules)
  return (
    <div style={{ flex: 1, minWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontSize: '0.74rem', fontWeight: 700, color: TEXT, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: '0.72rem', color: MUTE, fontFamily: FONT_MONO }}>{badge}</span>
      </div>
      {rules.length === 0 ? (
        <Card style={{ borderStyle: 'dashed' }}>
          <span style={{ fontSize: '0.82rem', color: TEXT_DIM, lineHeight: 1.55 }}>{emptyMsg}</span>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...always, ...conditional].map((r) => <RuleCard key={r.id} rule={r} />)}
        </div>
      )}
    </div>
  )
}

function RuleCard({ rule }: { rule: TradeRule }) {
  const tone = rule.conditional ? AMBER : GREEN
  return (
    <Card pad={16} style={{ borderLeft: `3px solid ${tone}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 650, color: TEXT }}>{getLabel(rule.label, LANG)}</div>
        <span style={{ flex: 'none', fontSize: '0.6rem', fontFamily: FONT_MONO, letterSpacing: '0.04em', color: tone, border: `1px solid ${tone}55`, borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase' }}>
          {rule.conditional ? 'Según producto' : 'Siempre'}
        </span>
      </div>
      <div style={{ fontSize: '0.8rem', color: TEXT_DIM, marginTop: 6, lineHeight: 1.5 }}>{getLabel(rule.description, LANG)}</div>
      {rule.conditional && rule.condition_note ? (
        <div style={{ fontSize: '0.74rem', color: AMBER, marginTop: 6, lineHeight: 1.45 }}>◆ {getLabel(rule.condition_note, LANG)}</div>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10, fontSize: '0.68rem', color: MUTE, fontFamily: FONT_MONO }}>
        <span>{getLabel(rule.authority, LANG)}</span>
        <span>· {rule.legal_basis}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 12 }}>
        <span style={{ fontSize: '0.64rem', color: MUTE, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {STATUS_LABEL[rule.status] ?? rule.status}{rule.source_verified_at ? ` · fuente ${rule.source_verified_at}` : ''}
        </span>
        <a href={rule.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.74rem', color: TEAL, textDecoration: 'none', fontWeight: 600, flex: 'none' }}>
          Fuente oficial ↗
        </a>
      </div>
    </Card>
  )
}

function EmptyExport() {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧾</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Sin corredores que evaluar</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        Cuando tengas envíos en custodia con origen y destino, aquí se agrupan por corredor (país de origen → país de
        destino) y 1503 compone las reglas reales de exportación e importación, con su fuente oficial.
      </div>
    </Card>
  )
}
