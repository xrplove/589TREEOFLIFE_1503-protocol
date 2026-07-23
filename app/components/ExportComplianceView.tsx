'use client'

/**
 * EXPORT COMPLIANCE VIEW · pestaña "Exportación" del workspace.
 *
 * Superficie de UI del motor de cumplimiento de comercio (ADR 0022,
 * `data/tradeCompliance.ts`). El usuario elige corredor origen → destino y la
 * vista resuelve, COMPONIENDO capas, las reglas reales verificadas:
 *   Capa 1 SALIDA (exportación) + Capa 2 ENTRADA (importación) [+ 3/4 en construcción].
 *
 * Canon (José): son leyes, 0 atajos. Cada regla muestra su `source_url` oficial
 * trazable + base legal + estado. La aplicabilidad fina es `subject_to_expert`
 * (la confirma el abogado fintech · bloqueante pre-deploy). Lo no cubierto se
 * dice abiertamente ("marco en construcción"), nunca se finge.
 *
 * Hoy el catálogo cubre: SALIDA = UE-27 · ENTRADA = Colombia (corredor ES→CO).
 */

import { useMemo, useState } from 'react'
import { getLabel, type Lang } from '../data/actorGroups'
import { flagEmoji } from '../data/continents'
import {
  getCorridorRequirements,
  groupByLayer,
  splitConditional,
  type TradeRule,
} from '../data/tradeCompliance'

// Selección curada para la maqueta. Orígenes con marco de SALIDA hoy = UE-27
// (más un par no-UE para mostrar honestamente el "en construcción"). Destinos
// con marco de ENTRADA hoy = Colombia (resto: en construcción).
const ORIGINS = [
  { code: 'ES', name: 'España' },
  { code: 'DE', name: 'Alemania' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Países Bajos' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CN', name: 'China' },
]
const DESTINATIONS = [
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'DE', name: 'Alemania' },
  { code: 'BR', name: 'Brasil' },
  { code: 'MA', name: 'Marruecos' },
]

const C = {
  text: '#1F2A37',
  dim: '#5A6678',
  faint: '#8A98AD',
  line: 'rgba(31,42,55,0.12)',
  card: '#FFFFFF',
  panel: '#F6F8FB',
  teal: '#0E8C82',
  green: '#1F8F4E',
  amber: '#B7791F',
  amberBg: 'rgba(183,121,31,0.08)',
  mono: 'var(--font-dm-mono), monospace',
}

const STATUS_LABEL: Record<string, string> = {
  subject_to_expert: 'sujeto a validación experta',
  validated: 'validado',
  proposed: 'propuesto',
  draft: 'borrador',
}

function RuleCard({ rule, lang }: { rule: TradeRule; lang: Lang }) {
  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${rule.conditional ? C.amber : C.green}`,
        borderRadius: 10,
        background: C.card,
        padding: '14px 16px',
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: C.text }}>{getLabel(rule.label, lang)}</div>
        <span
          style={{
            flex: 'none',
            fontSize: 10,
            fontFamily: C.mono,
            letterSpacing: '0.04em',
            color: rule.conditional ? C.amber : C.green,
            background: rule.conditional ? C.amberBg : 'rgba(31,143,78,0.08)',
            borderRadius: 6,
            padding: '2px 8px',
            textTransform: 'uppercase',
          }}
        >
          {rule.conditional ? 'Según producto' : 'Siempre'}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>{getLabel(rule.description, lang)}</div>
      {rule.conditional && rule.condition_note && (
        <div style={{ fontSize: 11.5, color: C.amber, marginTop: 6, lineHeight: 1.45 }}>
          ◆ {getLabel(rule.condition_note, lang)}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10, fontSize: 11, color: C.faint, fontFamily: C.mono }}>
        <span>{getLabel(rule.authority, lang)}</span>
        <span>· {rule.legal_basis}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 12 }}>
        <span style={{ fontSize: 10.5, color: C.faint, fontFamily: C.mono, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {STATUS_LABEL[rule.status] ?? rule.status}
          {rule.source_verified_at ? ` · fuente verificada ${rule.source_verified_at}` : ''}
        </span>
        <a
          href={rule.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11.5, color: C.teal, textDecoration: 'none', fontWeight: 600, flex: 'none' }}
        >
          Fuente oficial ↗
        </a>
      </div>
    </div>
  )
}

function LayerColumn({
  title,
  badge,
  rules,
  lang,
  emptyMsg,
}: {
  title: string
  badge: string
  rules: TradeRule[]
  lang: Lang
  emptyMsg: string
}) {
  const { always, conditional } = splitConditional(rules)
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 11, color: C.faint, fontFamily: C.mono }}>{badge}</span>
      </div>
      {rules.length === 0 ? (
        <div style={{ border: `1px dashed ${C.line}`, borderRadius: 10, padding: '16px', fontSize: 12.5, color: C.dim, lineHeight: 1.5, background: C.panel }}>
          {emptyMsg}
        </div>
      ) : (
        <>
          {always.map((r) => <RuleCard key={r.id} rule={r} lang={lang} />)}
          {conditional.map((r) => <RuleCard key={r.id} rule={r} lang={lang} />)}
        </>
      )}
    </div>
  )
}

export default function ExportComplianceView({ lang, sectorId }: { lang: Lang; sectorId: string }) {
  const [origin, setOrigin] = useState('ES')
  const [destination, setDestination] = useState('CO')

  const rules = useMemo(
    () => getCorridorRequirements({ origin, destination, sector: sectorId }),
    [origin, destination, sectorId],
  )
  const byLayer = useMemo(() => groupByLayer(rules), [rules])
  const oName = ORIGINS.find((o) => o.code === origin)?.name ?? origin
  const dName = DESTINATIONS.find((d) => d.code === destination)?.name ?? destination

  const selectStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: 9,
    padding: '8px 12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 6, fontSize: 11, color: C.teal, fontFamily: C.mono, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        ◆ Cumplimiento de exportación · corredor
      </div>
      <h1 style={{ fontSize: 23, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Qué exige tu corredor de comercio</h1>
      <p style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.55, margin: '0 0 18px', maxWidth: 680 }}>
        Elige origen y destino. 1503 compone las reglas reales de salida (exportación) y entrada
        (importación), cada una con su fuente oficial. La aplicabilidad fina y la suficiencia las confirma
        un experto humano — aquí se facilita, no se sella.
      </p>

      {/* Selector de corredor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <select aria-label="Origen" value={origin} onChange={(e) => setOrigin(e.target.value)} style={selectStyle}>
          {ORIGINS.map((o) => <option key={o.code} value={o.code}>{flagEmoji(o.code)} {o.name}</option>)}
        </select>
        <span style={{ fontSize: 18, color: C.faint }}>→</span>
        <select aria-label="Destino" value={destination} onChange={(e) => setDestination(e.target.value)} style={selectStyle}>
          {DESTINATIONS.map((d) => <option key={d.code} value={d.code}>{flagEmoji(d.code)} {d.name}</option>)}
        </select>
        <span style={{ fontSize: 12.5, color: C.faint, fontFamily: C.mono }}>
          {rules.length} {rules.length === 1 ? 'regla aplicable' : 'reglas aplicables'}
        </span>
      </div>

      <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 22, lineHeight: 1.5 }}>
        Marco verificado contra fuentes oficiales (EUR-Lex · DG TAXUD · DIAN · ICA · INVIMA). Estado de cada
        regla: <strong style={{ color: C.amber }}>sujeto a validación experta</strong> — bloqueante pre-deploy.
      </div>

      {/* Columnas SALIDA / ENTRADA */}
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        <LayerColumn
          title="Salida · exportación"
          badge={`${flagEmoji(origin)} ${oName}`}
          rules={byLayer.exit}
          lang={lang}
          emptyMsg={`Marco de salida para ${oName}: en construcción. Hoy el catálogo cubre la exportación desde la UE-27. Elige un origen de la Unión (p. ej. España) para ver el marco verificado.`}
        />
        <LayerColumn
          title="Entrada · importación"
          badge={`${flagEmoji(destination)} ${dName}`}
          rules={byLayer.entry}
          lang={lang}
          emptyMsg={`Marco de entrada para ${dName}: en construcción. Hoy el catálogo cubre la importación a Colombia. Elige Colombia como destino para ver el marco verificado.`}
        />
      </div>

      {/* Capas pendientes (honestidad) */}
      <div style={{ marginTop: 20, borderTop: `1px solid ${C.line}`, paddingTop: 14, fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>
        Capa 3 (acuerdos comerciales · trato preferente de origen) y Capa 4 (requisitos sectoriales del
        producto) — <strong>en construcción</strong>. El motor es composicional: cada lote verificado se
        suma sin reescribir lo anterior.
      </div>
    </div>
  )
}
