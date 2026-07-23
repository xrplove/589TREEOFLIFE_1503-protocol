'use client'

/**
 * Módulo PEDIDOS del escritorio del COMPRADOR · piel.
 *
 * Recibe los dossiers de sus pedidos (el server los lee de BD reusando
 * fetchOrderDossier) y los pinta enfocados al comprador: tu pedido · lo que
 * pagas (total + comisión 0,5%) · documentos · autenticidad (precinto firmado) ·
 * estado del pago. Honesto: el pago es SIMULADO (verify-on-ledger = paso 5).
 */

import {
  Card, Eyebrow, Stat, StatusPill, DeskStyle,
} from '../components/workspace/ui/DeskKit'
import { GREEN, GOLD, LILAC, TEXT, TEXT_DIM, MUTE, HAIR, FONT_MONO, NUM } from '../components/workspace/ui/tokens'
import type { DossierData } from '../transitario/dossier'

const DOC_LABEL: Record<string, string> = {
  commercial_invoice: 'Factura comercial',
  packing_list: 'Packing list',
  insurance_certificate: 'Certificado de seguro',
  dua_sad: 'DUA (aduana)', // Single Administrative Document (valor real en BD)
}

function money(n: number | null | undefined, ccy: string | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString('es-ES')} ${ccy ?? ''}`.trim()
}

function OrderCard({ d }: { d: DossierData }) {
  const { order, lines, documents, settlement, precinto } = d
  const sealOk = precinto.chainOk && precinto.links > 0 && precinto.signaturesOk === precinto.links
  const total = settlement?.gross ?? order.total_amount ?? null
  const ccy = settlement?.currency ?? order.currency ?? null

  return (
    <Card eyebrow={`Pedido · ${order.id.slice(0, 8)}`} title={`${order.origin_country ?? '—'} → ${order.destination_country ?? '—'}`}
      right={<StatusPill tone={order.status === 'delivered' || order.status === 'closed' ? 'ok' : 'info'}>{order.status}</StatusPill>}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 18 }}>
        <Stat value={money(total, ccy)} label="Total del pedido" />
        <Stat value={money(settlement?.fee_1503, ccy)} label="Comisión 1503 (0,5%)" accent={GOLD} />
        <Stat value={String(lines.length)} label="Líneas" />
        <Stat value={String(documents.length)} label="Documentos" accent={LILAC} />
      </div>

      {/* Documentos */}
      <div style={{ marginBottom: 16 }}>
        <Eyebrow>Documentación del pedido</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {documents.length === 0
            ? <span style={{ color: MUTE, fontSize: '0.8rem' }}>Sin documentos adjuntos</span>
            : documents.map((doc, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: TEXT_DIM, background: 'rgba(255,255,255,0.04)', border: `1px solid ${HAIR}`, borderRadius: 8, padding: '5px 10px' }}>
                  <span style={{ color: GREEN }}>✓</span>
                  {DOC_LABEL[doc.doc_type] ?? doc.doc_type}
                  {doc.reference ? <span style={{ ...NUM, color: MUTE }}>· {doc.reference}</span> : null}
                </span>
              ))}
        </div>
      </div>

      {/* Autenticidad / precinto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <Eyebrow>Autenticidad</Eyebrow>
        {sealOk
          ? <StatusPill tone="ok">Precinto verificado · {precinto.signaturesOk}/{precinto.links} firmas</StatusPill>
          : <StatusPill tone="warn">Precinto sin verificar</StatusPill>}
        <span style={{ fontSize: '0.74rem', color: MUTE }}>cadena de custodia firmada de origen a destino</span>
      </div>

      {/* Pago */}
      {settlement ? (
        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Eyebrow>Pago</Eyebrow>
          <StatusPill tone="info">{settlement.status}</StatusPill>
          {!settlement.verified_on_ledger
            ? <span style={{ fontSize: '0.74rem', color: GOLD }}>simulado · verify-on-ledger pendiente (paso 5)</span>
            : <span style={{ fontSize: '0.74rem', color: GREEN }}>verificado on-ledger ✓</span>}
        </div>
      ) : null}
    </Card>
  )
}

export function CompradorModule({ dossiers, buyerName = 'Importadora Andina' }: { dossiers: DossierData[]; buyerName?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <DeskStyle />
      <Card eyebrow={`Comprador · ${buyerName}`} title="Tus pedidos">
        <p style={{ fontSize: '0.82rem', color: MUTE, margin: 0, lineHeight: 1.5 }}>
          Cada pedido con su documentación, su precinto de autenticidad verificable y el estado del pago.
          {dossiers.length === 0 ? ' Aún no tienes pedidos.' : ''}
        </p>
      </Card>
      {dossiers.map((d) => <OrderCard key={d.order.id} d={d} />)}
    </div>
  )
}
