// Dossier del pedido · vista del escritorio del transitario (datos REALES de BD).
// Presentacional (server component): recibe DossierData y lo pinta por secciones.
// Honesto: el pago se marca SIMULADO; el precinto muestra su verificación real.

import { getLabel, type Lang, type LabelOrLocalized } from '../data/actorGroups'
import type { DossierData } from './dossier'

const C = {
  ink: '#1F2A37',
  dim: '#5A6678',
  faint: '#8A98AD',
  line: 'rgba(31,42,55,0.12)',
  card: '#FFFFFF',
  panel: '#F6F8FB',
  teal: '#0E8C82',
  green: '#1F8F4E',
  amber: '#B7791F',
  mono: 'var(--font-dm-mono), monospace',
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10.5, color: C.teal, fontFamily: C.mono, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  )
}

function Pill({ children, tone = 'dim' }: { children: React.ReactNode; tone?: 'dim' | 'green' | 'amber' }) {
  const col = tone === 'green' ? C.green : tone === 'amber' ? C.amber : C.faint
  return (
    <span style={{ fontSize: 10.5, fontFamily: C.mono, color: col, background: `${col}14`, borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </span>
  )
}

export default function PedidoDossier({ data, lang = 'es' }: { data: DossierData; lang?: Lang }) {
  const { order, lines, corridor, cargo, documents, settlement, custody, precinto } = data
  const cur = order.currency ?? 'EUR'
  const DOC_LABEL: Record<string, string> = {
    commercial_invoice: 'Factura comercial', packing_list: 'Packing list', insurance_certificate: 'Certificado de seguro', dua_sad: 'DUA (exportación)',
  }
  const ROLE_LABEL: Record<string, string> = {
    manufacturer: 'Fabricante', freight_forwarder: 'Transitario', consignee: 'Consignatario', carrier: 'Transportista', customs: 'Aduana', owner: 'Titular',
  }

  return (
    <div style={{ maxWidth: 980 }}>
      {/* Cabecera */}
      <div style={{ fontSize: 11, color: C.teal, fontFamily: C.mono, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>◆ Dossier del pedido · prueba seria</div>
      <h1 style={{ fontSize: 23, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>
        Pedido {order.origin_country} → {order.destination_country} · {order.incoterm}
      </h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
        <Pill>{order.id.slice(0, 8)}</Pill>
        <Pill tone="amber">{order.status}</Pill>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{order.total_amount?.toLocaleString('es-ES')} {cur}</span>
        <span style={{ fontSize: 12, color: C.faint }}>· datos reales de BD · pago simulado</span>
      </div>

      {/* Líneas */}
      <Section eyebrow="Mercancía" title={`${lines.length} líneas`}>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
          {lines.map((l, i) => (
            <div key={l.sku + i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: i ? `1px solid ${C.line}` : undefined, fontSize: 13, color: C.ink }}>
              <span style={{ flex: 1 }}>{l.title ? getLabel(l.title as LabelOrLocalized, lang) : l.sku}</span>
              <span style={{ color: C.faint, fontFamily: C.mono }}>{l.hs_code ?? ''}</span>
              <span style={{ color: C.dim }}>{l.quantity} ×</span>
              <span style={{ fontWeight: 600, minWidth: 90, textAlign: 'right' }}>{l.amount.toLocaleString('es-ES')} {cur}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Corredor */}
      <Section eyebrow="Cumplimiento · motor real" title={`Corredor ${order.origin_country}→${order.destination_country} · ${corridor.exit.length + corridor.entry.length} reglas`}>
        <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 10 }}>
          {corridor.alwaysCount} siempre exigibles · {corridor.conditionalCount} según producto · fuente oficial trazable
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[{ t: 'Salida (UE)', rs: corridor.exit }, { t: 'Entrada (destino)', rs: corridor.entry }].map((col) => (
            <div key={col.t} style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{col.t}</div>
              {col.rs.map((r) => (
                <div key={r.id} style={{ borderLeft: `3px solid ${r.conditional ? C.amber : C.green}`, background: C.panel, borderRadius: 6, padding: '7px 10px', marginBottom: 6, fontSize: 12, color: C.ink }}>
                  {getLabel(r.label, lang)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Carga 3D */}
      {cargo && (
        <Section eyebrow="Logística · motor real" title="Carga / cubicaje">
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: C.ink }}>
            <div><strong>{cargo.mode}</strong> · {cargo.count}×{cargo.container ?? ''}</div>
            <div>{cargo.utilization_pct}% ocupación</div>
            <div>{cargo.total_volume_m3} m³</div>
            <div>{cargo.total_weight_kg} kg</div>
          </div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 6 }}>{cargo.reason}</div>
        </Section>
      )}

      {/* Documentación */}
      <Section eyebrow="Documentación" title="Papeles del transitario">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {documents.map((d) => (
            <div key={d.doc_type} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', minWidth: 180 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{DOC_LABEL[d.doc_type] ?? d.doc_type}</div>
              <div style={{ fontSize: 11, color: C.faint, fontFamily: C.mono, marginTop: 2 }}>{d.reference}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Precinto / trazabilidad */}
      <Section eyebrow="Precinto digital · trazabilidad" title="Cadena de custodia firmada">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <Pill tone={precinto.chainOk && precinto.signaturesOk === precinto.links ? 'green' : 'amber'}>
            {precinto.chainOk ? 'cadena íntegra' : 'cadena rota'} · {precinto.signaturesOk}/{precinto.links} firmas ed25519
          </Pill>
          {precinto.leadDppId && <span style={{ fontSize: 11, color: C.faint, fontFamily: C.mono }}>DPP {precinto.leadDppId.slice(0, 8)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {custody.map((c, i) => (
            <div key={c.custody_role + i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span style={{ color: C.faint }}>→</span>}
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 12px', background: C.card }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{ROLE_LABEL[c.custody_role] ?? c.custody_role}</div>
                <div style={{ fontSize: 10, color: C.faint, fontFamily: C.mono }}>{c.link_hash?.slice(0, 10) ?? ''}…</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pago */}
      {settlement && (
        <Section eyebrow="Pago · lado Global" title="Liquidación 0,5%">
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', background: C.panel }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <div><div style={{ fontSize: 11, color: C.faint }}>Bruto</div><div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{settlement.gross.toLocaleString('es-ES')} {settlement.currency}</div></div>
              <div><div style={{ fontSize: 11, color: C.faint }}>Comisión 1503 (0,5%)</div><div style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>{settlement.fee_1503.toLocaleString('es-ES')} {settlement.currency}</div></div>
              <div><div style={{ fontSize: 11, color: C.faint }}>Neto al vendedor</div><div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{settlement.net_to_seller.toLocaleString('es-ES')} {settlement.currency}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Pill tone="amber">{settlement.status}</Pill>
              <Pill>{settlement.rail}</Pill>
              <Pill tone="amber">verify-on-ledger: {String(settlement.verified_on_ledger)}</Pill>
            </div>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
              SIMULADO · 1503 no custodia. La liquidación real se verificará leyendo el ledger XRPL (pendiente · testnet).
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
