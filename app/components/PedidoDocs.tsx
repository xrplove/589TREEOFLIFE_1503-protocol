'use client'

/**
 * PedidoDocs · "Expediente del pedido" — los documentos del pedido como
 * DOCUMENTOS REALES tamaño A4 (un pedido/factura impreso), no miniaturas.
 *
 * Visión de José (2026-05-30): un documento como los reales, con sus líneas,
 * donde interactúas EN la propia línea (click → DPP del artículo), que
 * IDENTIFIQUE a las partes (emisor/receptor con sus datos). Tira de pestañas
 * con los documentos de la carpeta; cada uno con check verde si está
 * verificado y registrado.
 *
 * Maqueta R0 · idioma de comercio · lo fiscal es subject_to_expert.
 */

import { Fragment, useState } from 'react'
import type { OrderLine } from './PedidoVivo'

// ── Paleta ──────────────────────────────────────────────────────────────
const TEAL = '#2FD2C9'
const GOLD = '#F0B429'
const GREEN = '#1FB465'
const INK = '#26323F'
const INK_SOFT = '#5C6B7A'
const INK_FAINT = '#8a96a3'
const PAPER_A = '#FBF8F1'
const PAPER_B = '#F1EADb'
const TXT = '#E8F0FA'
const MUTE = '#A8BCD6'
const FAINT = '#6B7E9A'

type DocStatus = 'verified' | 'pending' | 'draft'
type DocKind = 'pedido' | 'factura' | 'packing' | 'bl' | 'dpp' | 'origen' | 'precinto'

type DocTab = { kind: DocKind; tab: string; title: string; status: DocStatus; ref: string; date: string }

const DOC_TABS: DocTab[] = [
  { kind: 'pedido',   tab: 'Pedido',      title: 'Pedido · Proforma',          status: 'verified', ref: 'PRO-2026-1188', date: '30 may 2026' },
  { kind: 'factura',  tab: 'Factura',     title: 'Factura',                    status: 'verified', ref: 'FRA-2026-04417', date: '30 may 2026' },
  { kind: 'packing',  tab: 'Packing',     title: 'Lista de contenido',         status: 'verified', ref: 'PL-2026-0142',  date: '30 may 2026' },
  { kind: 'bl',       tab: 'B/L',         title: 'Conocimiento de embarque',   status: 'pending',  ref: 'BL-—',          date: '—' },
  { kind: 'dpp',      tab: 'DPP',         title: 'Pasaporte digital de producto', status: 'verified', ref: 'DPP-2026-0061', date: '30 may 2026' },
  { kind: 'origen',   tab: 'Origen',      title: 'Certificado de origen',      status: 'draft',    ref: 'CO-2026-7741',  date: '30 may 2026' },
  { kind: 'precinto', tab: 'Precinto',    title: 'Precinto digital',           status: 'pending',  ref: 'SEAL-—',        date: '—' },
]

const STATUS_META: Record<DocStatus, { label: string; color: string }> = {
  verified: { label: 'Verificado · registrado', color: GREEN },
  pending: { label: 'Pendiente', color: GOLD },
  draft: { label: 'Borrador', color: FAINT },
}

// DPP por defecto de una línea (para la demo de cemento es exacto).
function lineDpp(l: OrderLine) {
  return [
    { label: 'Producto', value: l.name },
    { label: 'Norma', value: 'EN 197-1 · marcado CE' },
    { label: 'Origen', value: 'España (UE)' },
    { label: 'Lote', value: 'L-2026-0418' },
    { label: 'Cumplimiento', value: 'ESPR 2024/1781 · REACH Art. 33' },
    { label: 'Cadena de custodia', value: 'G10 · sello criptográfico verificable' },
    { label: 'Dimensiones / ud', value: l.dim },
    { label: 'Peso / ud', value: `${l.box.kg} kg` },
  ]
}

// ════════════════════════════════════════════════════════════════════════
export default function PedidoDocs({
  orderRef = 'PM-INM-2026-0142',
  orderTitle = 'Cemento Portland CEM II 42,5 R · Pedido obra Marsella',
  lines = [],
  amount = 11840,
  seller = 'Cementos Atlántico, S.A.',
  single,
}: {
  orderRef?: string
  orderTitle?: string
  lines?: OrderLine[]
  amount?: number
  seller?: string
  /** Si se indica, muestra SOLO ese documento (sin carpeta/pestañas) — usado
      para la pestaña "Compra" que inspecciona el pedido como documento A4. */
  single?: DocKind
}) {
  const [active, setActive] = useState<DocKind>(single ?? 'pedido')
  const doc = DOC_TABS.find((d) => d.kind === (single ?? active)) ?? DOC_TABS[0]
  const verifiedCount = DOC_TABS.filter((d) => d.status === 'verified').length

  // Partes del pedido (identificadas) · cross-border EU B2B.
  const emisor = { rol: 'Emisor · Vendedor', name: seller, tax: 'NIF A-46721934', addr: 'Pol. Ind. El Oliveral, 12 · 46394 Ribarroja del Turia, Valencia · España' }
  const receptor = { rol: 'Receptor · Comprador', name: 'BTP Méditerranée S.A.R.L.', tax: 'TVA FR21 904512763', addr: "Chantier · 14 Quai de la Joliette · 13002 Marseille · France" }

  // Importes (base/IVA/total) a partir del total con IVA 21%.
  const base = amount / 1.21
  const iva = amount - base
  // Reparto del importe por línea proporcional al volumen (consistente con cubicaje).
  const totalVol = lines.reduce((s, l) => s + l.qty * l.box.L * l.box.W * l.box.H, 0) || 1
  const priced = lines.map((l) => {
    const share = (l.qty * l.box.L * l.box.W * l.box.H) / totalVol
    const importe = base * share
    return { line: l, importe, unit: importe / Math.max(1, l.qty) }
  })

  return (
    <div className="pd-wrap">
      {/* Cabecera + carpeta de pestañas · solo en modo carpeta (no en 'single') */}
      {!single && (
        <>
          <div className="pd-head">
            <div>
              <div className="pd-eyebrow">◆ CARPETA DEL PEDIDO · {orderRef}</div>
              <h3 className="pd-title">Documentos guardados</h3>
              <p className="pd-sub">{orderTitle} · comprobación visual</p>
            </div>
            <div className="pd-counter">
              <span className="pd-counter-num">{verifiedCount}<span className="pd-counter-den">/{DOC_TABS.length}</span></span>
              <span className="pd-counter-lbl">verificados</span>
            </div>
          </div>

          <div className="pd-tabs" role="tablist">
            {DOC_TABS.map((d) => {
              const sm = STATUS_META[d.status]
              const on = d.kind === active
              return (
                <button key={d.kind} role="tab" aria-selected={on} className={`pd-tab ${on ? 'pd-tab-on' : ''}`} onClick={() => setActive(d.kind)}>
                  <span className="pd-tab-dot" style={{ background: sm.color, boxShadow: on ? `0 0 7px ${sm.color}` : 'none' }} />
                  {d.tab}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Documento A4 real */}
      <div className={`pd-stage ${single ? 'pd-stage-solo' : ''}`}>
        <span className="pd-brk pd-brk-tl" /><span className="pd-brk pd-brk-tr" />
        <span className="pd-brk pd-brk-bl" /><span className="pd-brk pd-brk-br" />
        <Sheet
          doc={doc}
          orderRef={orderRef}
          emisor={emisor}
          receptor={receptor}
          priced={priced}
          base={base}
          iva={iva}
          total={amount}
        />
      </div>

      <style>{css}</style>
    </div>
  )
}

// ── Hoja A4 ───────────────────────────────────────────────────────────
type Party = { rol: string; name: string; tax: string; addr: string }
function Sheet({
  doc, orderRef, emisor, receptor, priced, base, iva, total,
}: {
  doc: DocTab
  orderRef: string
  emisor: Party
  receptor: Party
  priced: { line: OrderLine; importe: number; unit: number }[]
  base: number; iva: number; total: number
}) {
  const st = STATUS_META[doc.status]
  const hasLines = doc.kind === 'pedido' || doc.kind === 'factura' || doc.kind === 'packing'
  return (
    <div className="pd-sheet">
      {/* watermark diagonal */}
      <div className="pd-watermark">1503</div>

      {/* membrete */}
      <header className="pd-sh-head">
        <div className="pd-sh-brand">
          <span className="pd-sh-mark">◆</span>
          <div>
            <div className="pd-sh-brandname">1503</div>
            <div className="pd-sh-brandsub">Documento del pedido · {orderRef}</div>
          </div>
        </div>
        <div className="pd-sh-docmeta">
          <div className="pd-sh-doctype">{doc.title}</div>
          <div className="pd-sh-docref">Nº {doc.ref}</div>
          <div className="pd-sh-docref">Fecha {doc.date}</div>
        </div>
      </header>

      {/* partes · identifica emisor y receptor */}
      <div className="pd-sh-parties">
        <PartyBlock p={emisor} />
        <PartyBlock p={receptor} align="right" />
      </div>

      {/* cuerpo segun tipo */}
      {hasLines ? (
        <LineTable kind={doc.kind} priced={priced} base={base} iva={iva} total={total} />
      ) : (
        <FieldDoc kind={doc.kind} emisor={emisor} receptor={receptor} />
      )}

      {/* pie · estado + sello */}
      <footer className="pd-sh-foot">
        <div className="pd-sh-status">
          <span className="pd-sh-dot" style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
          <div>
            <div className="pd-sh-status-lbl" style={{ color: st.color }}>{st.label}</div>
            <div className="pd-sh-status-sub">
              {doc.status === 'verified' ? 'Sello de integridad · hash canónico verificable' : 'A la espera de verificación y registro'}
            </div>
          </div>
        </div>
        <Seal status={doc.status} />
      </footer>
      <div className="pd-sh-expert">sujeto a validación fiscal experta · la factura la emite el vendedor en su ERP</div>
    </div>
  )
}

function PartyBlock({ p, align }: { p: Party; align?: 'right' }) {
  return (
    <div className="pd-party" style={{ textAlign: align === 'right' ? 'right' : 'left' }}>
      <div className="pd-party-rol">{p.rol}</div>
      <div className="pd-party-name">{p.name}</div>
      <div className="pd-party-tax">{p.tax}</div>
      <div className="pd-party-addr">{p.addr}</div>
    </div>
  )
}

// ── Tabla de líneas · filas interactivas (click → DPP) ─────────────────
function LineTable({
  kind, priced, base, iva, total,
}: {
  kind: DocKind
  priced: { line: OrderLine; importe: number; unit: number }[]
  base: number; iva: number; total: number
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const showMoney = kind !== 'packing'
  const eur = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  return (
    <div className="pd-tbl-wrap">
      <div className="pd-tbl-hint">Pulsa una línea para ver su pasaporte digital (DPP) ▾</div>
      <table className="pd-tbl">
        <thead>
          <tr>
            <th className="pd-th-l">#</th>
            <th className="pd-th-l">Descripción</th>
            <th className="pd-th-r">Cantidad</th>
            <th className="pd-th-r">Dimensiones / ud</th>
            {showMoney && <th className="pd-th-r">Precio ud</th>}
            {showMoney && <th className="pd-th-r">Importe</th>}
          </tr>
        </thead>
        <tbody>
          {priced.map((p, i) => {
            const open = openId === p.line.id
            return (
              <Fragment key={p.line.id}>
                <tr className={`pd-row ${open ? 'pd-row-open' : ''}`} onClick={() => setOpenId(open ? null : p.line.id)}>
                  <td className="pd-td-l"><span className="pd-row-hue" style={{ background: p.line.hue }} />{String(i + 1).padStart(2, '0')}</td>
                  <td className="pd-td-l">
                    <span className="pd-row-name">{p.line.name}</span>
                    <span className="pd-row-caret">{open ? '▾' : '▸'}</span>
                  </td>
                  <td className="pd-td-r">{p.line.qty} {p.line.unidad}</td>
                  <td className="pd-td-r pd-td-mono">{p.line.dim}</td>
                  {showMoney && <td className="pd-td-r pd-td-mono">{eur(p.unit)}</td>}
                  {showMoney && <td className="pd-td-r pd-td-mono pd-td-strong">{eur(p.importe)}</td>}
                </tr>
                {open && (
                  <tr className="pd-dpp-row">
                    <td colSpan={showMoney ? 6 : 4}>
                      <div className="pd-dpp">
                        <div className="pd-dpp-head">◆ Pasaporte digital de producto · línea {String(i + 1).padStart(2, '0')}</div>
                        <div className="pd-dpp-grid">
                          {lineDpp(p.line).map((f) => (
                            <div key={f.label} className="pd-dpp-field">
                              <span className="pd-dpp-flabel">{f.label}</span>
                              <span className="pd-dpp-fvalue">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {priced.length === 0 && (
            <tr><td colSpan={showMoney ? 6 : 4} className="pd-td-empty">Añade artículos al pedido para verlos aquí.</td></tr>
          )}
        </tbody>
      </table>

      {showMoney && (
        <div className="pd-totals">
          <div className="pd-tot-row"><span>Base imponible</span><span className="pd-td-mono">{eur(base)}</span></div>
          <div className="pd-tot-row"><span>IVA (21%)</span><span className="pd-td-mono">{eur(iva)}</span></div>
          <div className="pd-tot-row pd-tot-grand"><span>Total</span><span className="pd-td-mono">{eur(total)}</span></div>
        </div>
      )}
    </div>
  )
}

// ── Documentos de campos (B/L, DPP general, origen, precinto) ──────────
function FieldDoc({ kind, emisor }: { kind: DocKind; emisor: Party; receptor: Party }) {
  const FIELDS: Record<string, { label: string; value: string }[]> = {
    bl: [
      { label: 'Expedidor', value: emisor.name },
      { label: 'Puerto de carga', value: 'Valencia (ESVLC)' },
      { label: 'Puerto de destino', value: 'Marsella (FRMRS)' },
      { label: 'Buque', value: 'por asignar' },
      { label: 'Contenedor', value: "40' HC · #0142" },
      { label: 'Estado', value: 'A la espera de firma del transitario' },
    ],
    dpp: [
      { label: 'Producto', value: 'Cemento CEM II 42,5 R' },
      { label: 'Norma', value: 'EN 197-1 · marcado CE' },
      { label: 'Origen', value: 'España (UE)' },
      { label: 'Marco', value: 'ESPR 2024/1781' },
      { label: 'REACH', value: 'sin SVHC ≥ 0,1%' },
      { label: 'Cadena de custodia', value: 'G10 · sello criptográfico verificable' },
    ],
    origen: [
      { label: 'País de origen', value: 'España (UE)' },
      { label: 'Partida arancelaria', value: '2523.29' },
      { label: 'Emisor', value: 'Cámara de Comercio' },
      { label: 'Estado', value: 'Borrador · pendiente de registro' },
    ],
    precinto: [
      { label: 'Sella', value: 'packing list + GPS + hora' },
      { label: 'Firma', value: 'transitario certificado' },
      { label: 'Custodia', value: 'cadena G10' },
      { label: 'Momento', value: 'al cerrar la carga del contenedor' },
    ],
  }
  const fields = FIELDS[kind] ?? []
  return (
    <table className="pd-fld">
      <tbody>
        {fields.map((f) => (
          <tr key={f.label}>
            <td className="pd-fld-l">{f.label}</td>
            <td className="pd-fld-r">{f.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Cuño de verificación ───────────────────────────────────────────────
function Seal({ status }: { status: DocStatus }) {
  if (status === 'draft') return <span className="pd-ribbon" style={{ color: FAINT, borderColor: FAINT }}>BORRADOR</span>
  if (status === 'pending') return <span className="pd-ribbon" style={{ color: '#9A6B00', borderColor: GOLD, background: 'rgba(240,180,41,0.14)' }}>PENDIENTE</span>
  return (
    <span className="pd-seal" aria-label="Verificado y registrado">
      <span className="pd-seal-ring">
        <span className="pd-seal-arc">VERIFICADO</span>
        <span className="pd-seal-check">✓</span>
        <span className="pd-seal-arc">REGISTRADO</span>
      </span>
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════
const css = `
.pd-wrap { font-family: var(--font-chakra-petch), system-ui, sans-serif; }
.pd-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:14px; }
.pd-eyebrow { font-family: var(--font-dm-mono), monospace; font-size:0.62rem; letter-spacing:0.22em; color:${TEAL}; text-transform:uppercase; }
.pd-title { font-size:1.5rem; font-weight:700; color:${TXT}; margin:4px 0 2px; }
.pd-sub { font-size:0.8rem; color:${MUTE}; margin:0; }
.pd-counter { text-align:right; flex-shrink:0; }
.pd-counter-num { font-family: var(--font-dm-mono), monospace; font-size:1.5rem; font-weight:700; color:${GREEN}; line-height:1; }
.pd-counter-den { font-size:0.9rem; color:${FAINT}; }
.pd-counter-lbl { display:block; font-family: var(--font-dm-mono), monospace; font-size:0.58rem; letter-spacing:0.2em; color:${FAINT}; text-transform:uppercase; margin-top:3px; }

/* tabs */
.pd-tabs { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:0; position:relative; z-index:2; }
.pd-tab { display:flex; align-items:center; gap:7px; padding:9px 15px; cursor:pointer; border:none;
  font-family: var(--font-dm-mono), monospace; font-size:0.66rem; letter-spacing:0.06em; text-transform:uppercase;
  color:${MUTE}; background:rgba(20,35,64,0.4); border:1px solid rgba(47,210,201,0.12); border-bottom:none;
  border-radius:8px 8px 0 0; transition:all .15s; position:relative; top:1px; }
.pd-tab:hover { color:${TXT}; background:rgba(20,35,64,0.7); }
.pd-tab-on { color:${INK}; background:${PAPER_A}; border-color:rgba(47,210,201,0.3); font-weight:700; }
.pd-tab-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

/* escenario del documento */
.pd-stage { position:relative; padding:30px 26px; border-radius:0 12px 12px 12px;
  background: linear-gradient(180deg, rgba(20,35,64,0.5), rgba(10,20,40,0.6));
  border:1px solid rgba(47,210,201,0.18); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  display:flex; justify-content:center; }
.pd-stage-solo { border-radius:12px; }
.pd-brk { position:absolute; width:13px; height:13px; opacity:.5; pointer-events:none; }
.pd-brk-tl { top:9px; left:9px; border-top:1.5px solid ${TEAL}; border-left:1.5px solid ${TEAL}; }
.pd-brk-tr { top:9px; right:9px; border-top:1.5px solid ${TEAL}; border-right:1.5px solid ${TEAL}; }
.pd-brk-bl { bottom:9px; left:9px; border-bottom:1.5px solid ${TEAL}; border-left:1.5px solid ${TEAL}; }
.pd-brk-br { bottom:9px; right:9px; border-bottom:1.5px solid ${TEAL}; border-right:1.5px solid ${TEAL}; }

/* hoja A4 */
.pd-sheet { position:relative; width:100%; max-width:760px; padding:38px 44px 30px;
  background: linear-gradient(172deg, ${PAPER_A}, ${PAPER_B}); color:${INK};
  font-family: Georgia, 'Times New Roman', serif; overflow:hidden;
  box-shadow: 0 30px 70px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.5) inset;
  border-radius:3px; animation: pdIn .35s cubic-bezier(.16,1,.3,1); }
@keyframes pdIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
.pd-watermark { position:absolute; top:46%; left:50%; transform:translate(-50%,-50%) rotate(-24deg);
  font-family: var(--font-chakra-petch), sans-serif; font-weight:800; font-size:5rem; letter-spacing:0.1em;
  color: rgba(38,50,63,0.04); pointer-events:none; white-space:nowrap; }

.pd-sh-head { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:2px solid ${INK}; }
.pd-sh-brand { display:flex; align-items:center; gap:11px; }
.pd-sh-mark { font-size:1.6rem; color:${TEAL}; }
.pd-sh-brandname { font-family: var(--font-chakra-petch), sans-serif; font-weight:700; font-size:1.15rem; letter-spacing:0.05em; color:${INK}; }
.pd-sh-brandsub { font-family: var(--font-dm-mono), monospace; font-size:0.6rem; letter-spacing:0.08em; color:${INK_SOFT}; margin-top:2px; }
.pd-sh-docmeta { text-align:right; }
.pd-sh-doctype { font-size:1.05rem; font-weight:700; color:${INK}; }
.pd-sh-docref { font-family: var(--font-dm-mono), monospace; font-size:0.66rem; color:${INK_SOFT}; margin-top:2px; }

.pd-sh-parties { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:18px 0; border-bottom:1px solid rgba(38,50,63,0.18); }
.pd-party-rol { font-family: var(--font-dm-mono), monospace; font-size:0.58rem; letter-spacing:0.16em; text-transform:uppercase; color:${INK_FAINT}; }
.pd-party-name { font-size:1rem; font-weight:700; color:${INK}; margin-top:4px; }
.pd-party-tax { font-family: var(--font-dm-mono), monospace; font-size:0.68rem; color:${INK_SOFT}; margin-top:2px; }
.pd-party-addr { font-size:0.74rem; color:${INK_SOFT}; margin-top:4px; line-height:1.4; }

/* tabla líneas */
.pd-tbl-wrap { padding-top:16px; }
.pd-tbl-hint { font-family: var(--font-dm-mono), monospace; font-size:0.6rem; letter-spacing:0.06em; color:${INK_FAINT}; margin-bottom:6px; }
.pd-tbl { width:100%; border-collapse:collapse; }
.pd-tbl thead th { font-family: var(--font-dm-mono), monospace; font-size:0.58rem; letter-spacing:0.1em; text-transform:uppercase; color:${INK_FAINT}; font-weight:600; padding:6px 8px; border-bottom:1.5px solid ${INK}; }
.pd-th-l { text-align:left; } .pd-th-r { text-align:right; }
.pd-row { cursor:pointer; transition:background .14s; }
.pd-row:hover { background: rgba(47,150,140,0.07); }
.pd-row-open { background: rgba(47,150,140,0.10); }
.pd-row td { padding:11px 8px; border-bottom:1px solid rgba(38,50,63,0.12); font-size:0.82rem; vertical-align:middle; }
.pd-td-l { text-align:left; color:${INK}; } .pd-td-r { text-align:right; color:${INK}; }
.pd-td-mono { font-family: var(--font-dm-mono), monospace; font-size:0.76rem; }
.pd-td-strong { font-weight:700; }
.pd-row-hue { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:7px; vertical-align:middle; }
.pd-row-name { font-weight:600; }
.pd-row-caret { color:${TEAL}; margin-left:8px; font-size:0.7rem; }
.pd-td-empty { text-align:center; color:${INK_FAINT}; padding:22px; font-style:italic; }

/* fila DPP desplegada */
.pd-dpp-row td { padding:0; border-bottom:1px solid rgba(38,50,63,0.12); }
.pd-dpp { background: rgba(38,50,63,0.05); border-left:3px solid ${TEAL}; padding:14px 16px; animation: pdDpp .25s ease; }
@keyframes pdDpp { from { opacity:0; } to { opacity:1; } }
.pd-dpp-head { font-family: var(--font-dm-mono), monospace; font-size:0.62rem; letter-spacing:0.1em; text-transform:uppercase; color:${INK_SOFT}; margin-bottom:10px; }
.pd-dpp-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px 24px; }
.pd-dpp-field { display:flex; justify-content:space-between; gap:10px; font-size:0.76rem; border-bottom:1px dotted rgba(38,50,63,0.2); padding-bottom:4px; }
.pd-dpp-flabel { color:${INK_SOFT}; } .pd-dpp-fvalue { color:${INK}; font-weight:600; text-align:right; }

/* totales */
.pd-totals { margin-top:16px; margin-left:auto; width:min(280px,100%); }
.pd-tot-row { display:flex; justify-content:space-between; padding:6px 0; font-size:0.82rem; color:${INK_SOFT}; border-bottom:1px solid rgba(38,50,63,0.1); }
.pd-tot-grand { border-bottom:none; border-top:2px solid ${INK}; margin-top:4px; padding-top:9px; font-size:1.05rem; font-weight:700; color:${INK}; }

/* doc de campos */
.pd-fld { width:100%; border-collapse:collapse; margin-top:18px; }
.pd-fld tr { border-bottom:1px solid rgba(38,50,63,0.14); }
.pd-fld-l { padding:11px 4px; font-size:0.84rem; color:${INK_SOFT}; }
.pd-fld-r { padding:11px 4px; font-size:0.84rem; color:${INK}; font-weight:600; text-align:right; }

/* pie */
.pd-sh-foot { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:24px; padding-top:18px; border-top:1px dashed rgba(38,50,63,0.3); min-height:88px; }
.pd-sh-status { display:flex; align-items:center; gap:11px; }
.pd-sh-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.pd-sh-status-lbl { font-family: var(--font-chakra-petch), sans-serif; font-weight:700; font-size:0.92rem; }
.pd-sh-status-sub { font-size:0.68rem; color:${INK_SOFT}; margin-top:2px; }
.pd-sh-expert { margin-top:8px; font-family: var(--font-dm-mono), monospace; font-size:0.56rem; letter-spacing:0.06em; color:${INK_FAINT}; }

/* sello */
.pd-seal { transform: rotate(-11deg); pointer-events:none; }
.pd-seal-ring { display:flex; flex-direction:column; align-items:center; justify-content:center; width:80px; height:80px;
  border-radius:50%; border:2.5px solid ${GREEN}; box-shadow: inset 0 0 0 2px rgba(31,180,101,0.35); color:${GREEN};
  background: radial-gradient(circle, rgba(31,180,101,0.10), rgba(31,180,101,0.02)); opacity:0.9;
  animation: pdStamp .4s cubic-bezier(.5,1.6,.6,1) backwards; }
@keyframes pdStamp { from { opacity:0; transform:scale(1.5); } to { opacity:.9; transform:scale(1); } }
.pd-seal-arc { font-family: var(--font-dm-mono), monospace; font-size:0.44rem; letter-spacing:0.14em; font-weight:700; }
.pd-seal-check { font-size:1.6rem; line-height:0.7; margin:1px 0; }
.pd-ribbon { padding:4px 11px; border:1.4px solid; border-radius:3px; font-family: var(--font-dm-mono), monospace; font-size:0.6rem; letter-spacing:0.14em; font-weight:700; transform: rotate(-5deg); }

@media (prefers-reduced-motion: reduce) { .pd-sheet, .pd-seal-ring, .pd-dpp { animation:none !important; } }
@media (max-width: 720px) { .pd-sh-parties, .pd-dpp-grid { grid-template-columns:1fr; } .pd-watermark { font-size:3rem; } }
`
