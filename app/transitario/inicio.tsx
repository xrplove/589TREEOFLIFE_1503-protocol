'use client'

/**
 * MÓDULO INICIO del escritorio TRANSITARIO · cockpit / home.
 *
 * Resumen REAL calculado sobre los envíos en custodia + documentación ya cargados
 * (no recalcula motores: cuentas simples). Tres bloques: KPIs · alertas accionables
 * (saltan al módulo que toca vía navigate) · accesos rápidos. Honesto: si no hay
 * dato, lo dice; nada inventado.
 */

import { useMemo } from 'react'
import { Card, Stat, StatusPill } from '../components/workspace/ui/DeskKit'
import { FONT_MONO, GOLD, GREEN, LILAC, MUTE, SLATE, TEXT, TEXT_DIM } from '../components/workspace/ui/tokens'
import { type ModuleId } from '../data/sectorDashboardConfig'
import type { CustodyShipment, ShipmentDocs } from './custody'

function hasDims(s: CustodyShipment): boolean {
  return (
    s.packageLengthMm != null && s.packageWidthMm != null && s.packageHeightMm != null &&
    s.packageWeightKg != null && s.packageLengthMm > 0 && s.packageWidthMm > 0 && s.packageHeightMm > 0
  )
}

export function InicioModule({
  shipments, documents, navigate,
}: {
  shipments: CustodyShipment[]
  documents: ShipmentDocs[]
  navigate: (id: ModuleId) => void
}) {
  const m = useMemo(() => {
    const activos = shipments.filter((s) => s.custodyEndedAt === null)
    const enTransito = activos.filter((s) => s.lifecycleState === 'in_transit').length
    const entregados = shipments.filter((s) => s.lifecycleState === 'delivered' || s.lifecycleState === 'arrived').length
    const m3 = Math.round(
      activos.reduce((n, s) => n + (hasDims(s) ? (s.packageLengthMm! * s.packageWidthMm! * s.packageHeightMm!) / 1e9 : 0), 0) * 10,
    ) / 10
    const sinMedir = activos.filter((s) => !hasDims(s)).length
    const corredores = new Set(
      activos
        .filter((s) => s.originCountry && s.deliveryLocation)
        .map((s) => `${s.originCountry!.toUpperCase()}->${s.deliveryLocation!.slice(0, 2).toUpperCase()}`),
    ).size
    const sinDocs = documents.filter((d) => d.docs.length === 0 && !d.blReference).length
    return { enCustodia: activos.length, enTransito, entregados, m3, sinMedir, corredores, sinDocs }
  }, [shipments, documents])

  const alerts: { tone: 'warn' | 'info'; text: string; cta: string; to: ModuleId }[] = []
  if (m.sinMedir > 0) alerts.push({ tone: 'warn', text: `${m.sinMedir} envío${m.sinMedir > 1 ? 's' : ''} sin medidas → no se pueden cubicar`, cta: 'Ir a Carga', to: 'pedidos' })
  if (m.sinDocs > 0) alerts.push({ tone: 'warn', text: `${m.sinDocs} envío${m.sinDocs > 1 ? 's' : ''} sin documentación`, cta: 'Ir a Documentación', to: 'documentacion' })
  if (m.corredores > 0) alerts.push({ tone: 'info', text: `${m.corredores} corredor${m.corredores > 1 ? 'es' : ''} de comercio en tu carga`, cta: 'Ver Exportación', to: 'exportacion' })

  const QUICK: { id: ModuleId; label: string; desc: string; accent: string }[] = [
    { id: 'pedidos', label: 'Carga y cubicaje', desc: 'Asignación de contenedor + mapa de carga', accent: GOLD },
    { id: 'exportacion', label: 'Exportación', desc: 'Reglas de tu corredor, fuente oficial', accent: GREEN },
    { id: 'custodia', label: 'Custodia', desc: 'Envíos bajo tu custodia, trazabilidad', accent: LILAC },
    { id: 'documentacion', label: 'Documentación', desc: 'B/L · AWB · CMR + evidencias', accent: SLATE },
    { id: 'actores', label: 'Actores', desc: 'Tu red en la cadena de custodia', accent: '#5E9DFF' },
  ]

  if (shipments.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧭</div>
        <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Tu escritorio de transitario</div>
        <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
          Cuando te transfieran la custodia de un envío, aquí verás el resumen: carga, corredores, documentación y tu red.
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <Card pad={18}><Stat value={String(m.enCustodia)} label="En custodia ahora" accent={GOLD} /></Card>
        <Card pad={18}><Stat value={String(m.enTransito)} label="En tránsito" accent={LILAC} /></Card>
        <Card pad={18}><Stat value={String(m.entregados)} label="Entregados" accent={GREEN} /></Card>
        <Card pad={18}><Stat value={String(m.m3)} unit="m³" label="Volumen en custodia" accent={SLATE} /></Card>
        <Card pad={18}><Stat value={String(m.corredores)} label="Corredores activos" accent="#5E9DFF" /></Card>
      </div>

      {/* Alertas accionables */}
      {alerts.length > 0 ? (
        <Card eyebrow="Atención" title="Próximas acciones">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <StatusPill tone={a.tone}>{a.tone === 'warn' ? 'Pendiente' : 'Info'}</StatusPill>
                <span style={{ flex: 1, minWidth: 180, fontSize: '0.86rem', color: TEXT }}>{a.text}</span>
                <button className="dk-chip" onClick={() => navigate(a.to)}>{a.cta} →</button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card><span style={{ fontSize: '0.86rem', color: TEXT_DIM }}>Todo al día: sin envíos sin medir ni sin documentación. 👌</span></Card>
      )}

      {/* Accesos rápidos */}
      <div>
        <div style={{ fontSize: '0.62rem', color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>Accesos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {QUICK.map((q) => (
            <button key={q.id} onClick={() => navigate(q.id)} style={{ textAlign: 'left', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
              <Card hover pad={16} style={{ borderLeft: `3px solid ${q.accent}`, height: '100%' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: TEXT }}>{q.label}</div>
                <div style={{ fontSize: '0.76rem', color: TEXT_DIM, marginTop: 4, lineHeight: 1.45 }}>{q.desc}</div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
