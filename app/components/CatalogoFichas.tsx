'use client'

/**
 * Catálogo del actor + FICHA DE PRODUCTO EN CRISTAL (dirección dark-PRO).
 *
 * Vive en la pestaña Catálogo. La ficha muestra, por sector, las exigencias
 * reales del producto (DPP + cumplimiento), foto, y de DÓNDE sale cada campo:
 *   🟢 ERP universal · 🔵 ERP+wizard · 🟣 IA (extraído de doc) · ✍️ manual
 * con el GATE de cumplimiento que bloquea publicar hasta el 100%.
 *
 * Honestidad: campos y leyes son los REALES del motor existente
 * (productSchemas/_compliance.ts · _erpMapping.ts · _dpp.ts). Los VALORES son
 * de muestra. El cableado a datos reales se hace al conectar el ERP (post-MVP)
 * y los campos 🟣 IA quedan sujetos a IA self-host (Ola 2-3).
 */

import { useState, useEffect } from 'react'
import type { Sector } from '../data/sectors'
import PedidoVivo, { type OrderLine } from './PedidoVivo'

// Ficha REAL del catálogo (GET /api/products · tabla products). Lo que se añade
// al pedido desde aquí lleva product_id/dpp_registry_id reales (no snapshot).
type RealProduct = {
  id: string
  sku: string
  title: { es?: string } | null
  price: number | null
  currency: string | null
  sector_id: string
  dpp_registry_id: string | null
}

const PRICE: Record<string, number> = { 'cocina-roble': 2480, 'ventana-pvc': 410, 'parquet-ac5': 34 }
// Dimensiones físicas reales por unidad (cm) + peso (kg) para cubicaje real.
const BOX: Record<string, { L: number; W: number; H: number; kg: number }> = {
  'cocina-roble': { L: 240, W: 60, H: 90, kg: 85 },
  'ventana-pvc': { L: 120, W: 100, H: 12, kg: 24 },
  'parquet-ac5': { L: 100, W: 100, H: 1.5, kg: 14 }, // por m²
}

const GOLD = '#F0B429'
const TEAL = '#2FD2C9'
const TEXT = '#E8EDF5'
const MUTE = '#8A98AD'
const FAINT = '#5A6678'
const LINE = 'rgba(255,255,255,0.08)'
const OK = '#7EE0A0'
const WARN = '#E0857E'

// Origen del dato (espejo de _erpMapping.ts · 4 niveles)
type ErpSrc = 'universal' | 'extended' | 'ai' | 'manual'
const SRC: Record<ErpSrc, { tag: string; color: string; desc: string }> = {
  universal: { tag: 'ERP', color: '#7EE0A0', desc: 'auto · nativo ERP' },
  extended: { tag: 'ERP+', color: '#5FE6DD', desc: 'auto · tras wizard' },
  ai: { tag: 'IA', color: '#B59CFF', desc: 'extraído de documento' },
  manual: { tag: '✍', color: '#F0B429', desc: 'lo completas tú' },
}

type Field = { label: string; value: string | null; src: ErpSrc; law?: string; blocker?: boolean }
type Group = { group: string; items: Field[] }
type Producto = {
  id: string
  name: string
  cat: string
  hue: string
  stock: number
  unidad: string
  moq?: number
  plazo: string
  fabricante: string
  origen: string
  lote: string
  dimensiones: string
  peso: string
  groups: Group[]
}

// Grupos de Fabricación/Trazabilidad y Logística — comunes a todo producto,
// con origen de autorrelleno honesto. Trazabilidad enlaza con DPP + cadena de
// custodia G10 (ADR 0007/0013).
function extraGroups(p: Producto): Group[] {
  return [
    {
      group: 'Fabricación y trazabilidad',
      items: [
        { label: 'Fabricante', value: p.fabricante, src: 'universal' },
        { label: 'País de origen', value: p.origen, src: 'extended' },
        { label: 'Lote / nº de fabricación', value: p.lote, src: 'universal' },
        { label: 'Trazabilidad (cadena de custodia G10)', value: 'hash RFC 8785 · sello verificable', src: 'ai' },
      ],
    },
    {
      group: 'Logística y entrega',
      items: [
        { label: 'Dimensiones (unidad)', value: p.dimensiones, src: 'extended' },
        { label: 'Peso (unidad)', value: p.peso, src: 'extended' },
        { label: 'Plazo de entrega', value: p.plazo, src: 'extended' },
      ],
    },
  ]
}

// Productos de muestra del sector inmobiliario · campos/leyes REALES.
const PRODUCTOS_INMO: Producto[] = [
  {
    id: 'cocina-roble',
    name: 'Cocina roble macizo R-200',
    cat: 'Cocinas',
    hue: '#C99A4E',
    stock: 284,
    unidad: 'ud',
    plazo: '5-7 días laborables',
    fabricante: 'Maderas del Levante S.L.',
    origen: 'España',
    lote: 'L-2026-0410',
    dimensiones: '240 × 60 × 90 cm',
    peso: '85 kg',
    groups: [
      {
        group: 'Identificación',
        items: [
          { label: 'SKU', value: 'COC-R200-2026', src: 'universal' },
          { label: 'EAN-13', value: '8412345000017', src: 'universal' },
          { label: 'Precio', value: '2.480 € / ud', src: 'universal' },
          { label: 'Stock', value: '284 ud', src: 'universal' },
        ],
      },
      {
        group: 'DPP · Pasaporte Digital de Producto',
        items: [
          { label: 'Declaración ambiental (DPP)', value: 'EPD-2026-0044', src: 'ai', law: 'ESPR · Reg. (UE) 2024/1781', blocker: true },
          { label: 'Origen de la madera (FSC/PEFC)', value: 'FSC C012345', src: 'extended', law: 'EUDR · Reg. (UE) 2023/1115', blocker: true },
          { label: 'Reciclabilidad / fin de vida', value: '92% reciclable', src: 'manual' },
        ],
      },
      {
        group: 'Cumplimiento del producto',
        items: [
          { label: 'Sustancias SVHC (REACH)', value: 'Sin SVHC ≥ 0,1%', src: 'ai', law: 'REACH · Reg. (CE) 1907/2006 Art. 33', blocker: true },
          { label: 'Emisiones formaldehído (E1)', value: 'Clase E1', src: 'extended', law: 'EN 717-1', blocker: true },
          { label: 'Marcado CE / DoP', value: null, src: 'manual', law: 'Reg. (UE) 305/2011 (CPR)', blocker: true },
        ],
      },
    ],
  },
  {
    id: 'ventana-pvc',
    name: 'Ventana PVC oscilobatiente A',
    cat: 'Ventanas',
    hue: '#5E9BD0',
    stock: 231,
    unidad: 'ud',
    plazo: '3-5 días laborables',
    fabricante: 'Ventanas Aresga S.L.',
    origen: 'España',
    lote: 'L-2026-0418',
    dimensiones: '120 × 100 × 12 cm',
    peso: '24 kg',
    groups: [
      {
        group: 'Identificación',
        items: [
          { label: 'SKU', value: 'VEN-PVC-OSC-A', src: 'universal' },
          { label: 'EAN-13', value: '8412345000338', src: 'universal' },
          { label: 'Precio', value: '410 € / ud', src: 'universal' },
          { label: 'Stock', value: '231 ud', src: 'universal' },
        ],
      },
      {
        group: 'DPP · Pasaporte Digital de Producto',
        items: [
          { label: 'Declaración ambiental (DPP)', value: 'EPD-2026-0051', src: 'ai', law: 'ESPR · Reg. (UE) 2024/1781', blocker: true },
          { label: 'Transmitancia térmica (U)', value: '1,1 W/m²K', src: 'extended', law: 'EN ISO 10077-1' },
        ],
      },
      {
        group: 'Cumplimiento del producto',
        items: [
          { label: 'Marcado CE / DoP', value: 'DoP-VEN-2026-12', src: 'extended', law: 'Reg. (UE) 305/2011 (CPR) + EN 14351-1', blocker: true },
          { label: 'Clasificación energética', value: 'Clase A', src: 'manual', law: 'etiqueta declarada' },
          { label: 'Sustancias SVHC (REACH)', value: 'Sin SVHC ≥ 0,1%', src: 'ai', law: 'REACH Art. 33', blocker: true },
        ],
      },
    ],
  },
  {
    id: 'parquet-ac5',
    name: 'Parquet flotante roble AC5',
    cat: 'Suelos',
    hue: '#B07B43',
    stock: 312,
    unidad: 'm²',
    plazo: '7-10 días laborables',
    fabricante: 'Suelos Ibérica S.A.',
    origen: 'Portugal',
    lote: 'L-2026-0421',
    dimensiones: 'paquete 1,2 m²',
    peso: '14 kg/paq',
    groups: [
      {
        group: 'Identificación',
        items: [
          { label: 'SKU', value: 'SUE-PARQ-AC5', src: 'universal' },
          { label: 'EAN-13', value: '8412345000451', src: 'universal' },
          { label: 'Precio', value: '34 € / m²', src: 'universal' },
          { label: 'Stock', value: '312 m²', src: 'universal' },
        ],
      },
      {
        group: 'DPP · Pasaporte Digital de Producto',
        items: [
          { label: 'Declaración ambiental (DPP)', value: null, src: 'ai', law: 'ESPR · Reg. (UE) 2024/1781', blocker: true },
          { label: 'Origen de la madera (FSC/PEFC)', value: 'PEFC 08-0001', src: 'extended', law: 'EUDR · Reg. (UE) 2023/1115', blocker: true },
        ],
      },
      {
        group: 'Cumplimiento del producto',
        items: [
          { label: 'Reacción al fuego (Bfl-s1)', value: 'Bfl-s1', src: 'extended', law: 'EN 13501-1', blocker: true },
          { label: 'Emisiones formaldehído (E1)', value: 'Clase E1', src: 'ai', law: 'EN 717-1', blocker: true },
          { label: 'Sustancias SVHC (REACH)', value: 'Sin SVHC ≥ 0,1%', src: 'ai', law: 'REACH Art. 33', blocker: true },
        ],
      },
    ],
  },
]

function gateOf(p: Producto) {
  const blockers = p.groups.flatMap((g) => g.items).filter((i) => i.blocker)
  const ok = blockers.filter((i) => i.value !== null).length
  return { ok, total: blockers.length, pass: ok === blockers.length }
}

export default function CatalogoFichas({ sector }: { sector: Sector }) {
  const [selId, setSelId] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderLine[]>([])
  const [viewPedido, setViewPedido] = useState(false)
  // Piloto: inmobiliario con datos reales de schema. Otros sectores reusan la
  // misma ficha cargando SU schema (mismo motor, distintos campos/leyes).
  const productos = PRODUCTOS_INMO
  const sel = productos.find((p) => p.id === selId)
  const orderUds = order.reduce((s, l) => s + l.qty, 0)

  const addToOrder = (p: Producto, qty: number) =>
    setOrder((prev) => {
      const line: OrderLine = { id: p.id, name: p.name, cat: p.cat, qty, unidad: p.unidad, precio: PRICE[p.id] ?? 0, peso: p.peso, dim: p.dimensiones, hue: p.hue, box: BOX[p.id] ?? { L: 100, W: 100, H: 100, kg: 10 } }
      const exist = prev.find((l) => l.id === p.id)
      return exist ? prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + qty } : l)) : [...prev, line]
    })

  // ── Catálogo REAL del actor (BD) · líneas con product_id/dpp_registry_id reales ──
  const [realProducts, setRealProducts] = useState<RealProduct[]>([])
  useEffect(() => {
    let alive = true
    fetch('/api/products', { headers: { accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products?: RealProduct[] }) => {
        if (alive) setRealProducts(Array.isArray(d.products) ? d.products : [])
      })
      .catch(() => {
        /* sin sesión / sin red → la tira real simplemente no aparece */
      })
    return () => {
      alive = false
    }
  }, [])

  const addRealToOrder = (rp: RealProduct) =>
    setOrder((prev) => {
      const name = rp.title?.es ?? rp.sku
      // Sin dimensiones reales todavía (la ficha no las expone) → box neutro para
      // el cubicaje. Lo que importa aquí es el enlace product_id/dpp_registry_id.
      const line: OrderLine = {
        id: rp.id, name, cat: rp.sector_id, qty: 1, unidad: 'ud', precio: rp.price ?? 0,
        peso: '—', dim: '—', hue: TEAL, box: { L: 100, W: 100, H: 100, kg: 10 },
        productId: rp.id, dppRegistryId: rp.dpp_registry_id ?? undefined, sku: rp.sku,
      }
      const exist = prev.find((l) => l.id === rp.id)
      return exist ? prev.map((l) => (l.id === rp.id ? { ...l, qty: l.qty + 1 } : l)) : [...prev, line]
    })

  if (viewPedido) return <PedidoVivo lines={order} onBack={() => setViewPedido(false)} />

  return (
    <div>
      <Style />
      {!sel && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.2em' }}>
              ◆ CATÁLOGO · {sector.label.toUpperCase()}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT, margin: '6px 0 4px', letterSpacing: '-0.01em', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>
              Fichas de producto
            </h2>
            <p style={{ fontSize: 13.5, color: MUTE, margin: 0 }}>
              Cada ficha lleva sus exigencias DPP y de cumplimiento del sector. Pulsa una para ver el detalle.
            </p>
          </div>
          {realProducts.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10.5, color: TEAL, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em', marginBottom: 10 }}>
                ◢ CATÁLOGO REAL (BD) · {realProducts.length} ficha{realProducts.length > 1 ? 's' : ''} · al añadir, la línea lleva product_id real
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {realProducts.map((rp) => (
                  <div key={rp.id} style={{ background: 'rgba(47,210,201,0.06)', border: '1px solid rgba(47,210,201,0.25)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{rp.sku}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: '4px 0 8px' }}>{rp.title?.es ?? rp.sku}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, color: TEXT, fontFamily: 'var(--font-dm-mono), monospace' }}>
                        {rp.price != null ? `${rp.price.toLocaleString('es-ES')} ${rp.currency ?? 'EUR'}` : '—'}
                      </div>
                      {rp.dpp_registry_id && (
                        <span style={{ fontSize: 9.5, color: OK, fontFamily: 'var(--font-dm-mono), monospace', border: `1px solid ${OK}`, borderRadius: 999, padding: '1px 7px' }}>DPP ✓</span>
                      )}
                    </div>
                    <button
                      onClick={() => addRealToOrder(rp)}
                      style={{ marginTop: 10, width: '100%', font: 'inherit', fontSize: 12, fontWeight: 600, color: '#08201E', background: TEAL, border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer' }}
                    >
                      + Añadir al pedido
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {productos.map((p) => {
              const g = gateOf(p)
              return (
                <button key={p.id} className="cf-card" onClick={() => setSelId(p.id)}>
                  <Brackets />
                  <div className="cf-foto" style={{ background: `linear-gradient(150deg, ${p.hue}cc, ${p.hue}55), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.18), transparent 60%)` }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.15em' }}>{p.cat.toUpperCase()}</span>
                  </div>
                  <div style={{ padding: '13px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 650, color: TEXT, textAlign: 'left' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <GatePill ok={g.ok} total={g.total} pass={g.pass} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {sel && <Ficha producto={sel} sector={sector} onBack={() => setSelId(null)} onAdd={(qty) => addToOrder(sel, qty)} />}

      {order.length > 0 && (
        <button className="cf-fab" onClick={() => setViewPedido(true)}>
          🧾 Ver pedido · {order.length} ref · {orderUds} ud →
        </button>
      )}
    </div>
  )
}

function Ficha({ producto, sector, onBack, onAdd }: { producto: Producto; sector: Sector; onBack: () => void; onAdd: (qty: number) => void }) {
  const g = gateOf(producto)
  const moq = producto.moq ?? 1
  const [qty, setQty] = useState(moq)
  const [added, setAdded] = useState(false)
  const allGroups = [...producto.groups, ...extraGroups(producto)]
  const allItems = producto.groups.flatMap((x) => x.items)
  const autoCount = allItems.filter((i) => i.value !== null && (i.src === 'universal' || i.src === 'extended' || i.src === 'ai')).length
  const pendCount = allItems.filter((i) => i.value === null).length

  return (
    <div>
      <Style />
      <button onClick={onBack} className="cf-back">← Volver al catálogo</button>

      {/* Banner autorrelleno */}
      <div className="cf-banner">
        <Brackets />
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontSize: 13, color: TEXT }}>
          Autorrellenado desde ERP: <strong style={{ color: OK }}>{autoCount} campos</strong>
          {pendCount > 0 && <> · <strong style={{ color: GOLD }}>{pendCount} pendiente(s)</strong> de completar</>}
        </span>
        <div style={{ flex: 1 }} />
        <GatePill ok={g.ok} total={g.total} pass={g.pass} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Columna foto + sello */}
        <div className="cf-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <Brackets />
          <div className="cf-foto" style={{ height: 220, borderRadius: 0, background: `linear-gradient(150deg, ${producto.hue}cc, ${producto.hue}44), radial-gradient(circle at 70% 18%, rgba(255,255,255,0.2), transparent 60%)` }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.18em' }}>{producto.cat.toUpperCase()}</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{producto.name}</div>
            <div style={{ fontSize: 12, color: FAINT, marginTop: 4, fontFamily: 'var(--font-dm-mono), monospace' }}>sector {sector.label.toLowerCase()}</div>
            {/* sello cristal */}
            <div className="cf-seal" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: g.pass ? OK : GOLD, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.14em' }}>
                {g.pass ? '◆ DPP CONFORME' : '◆ DPP INCOMPLETO'}
              </div>
              <div style={{ fontSize: 11, color: FAINT, marginTop: 4, lineHeight: 1.5 }}>
                {g.pass ? 'Listo para publicar.' : `Faltan ${g.total - g.ok} requisito(s) bloqueante(s).`}
              </div>
            </div>

            {/* Barra comercial · añadir al pedido */}
            <div className="cf-buy">
              <div className="cf-buy-row"><span style={{ color: MUTE }}>Stock</span><span style={{ color: producto.stock > 0 ? OK : WARN, fontFamily: 'var(--font-dm-mono), monospace' }}>{producto.stock} {producto.unidad}</span></div>
              <div className="cf-buy-row"><span style={{ color: MUTE }}>Plazo de entrega</span><span style={{ color: TEXT }}>{producto.plazo}</span></div>
              <div className="cf-buy-row"><span style={{ color: MUTE }}>Pedido mínimo</span><span style={{ color: TEXT }}>{moq} {producto.unidad}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13 }}>
                <span style={{ fontSize: 12, color: MUTE }}>Cantidad</span>
                <div className="cf-qty">
                  <button onClick={() => setQty((q) => Math.max(moq, q - moq))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(producto.stock, q + moq))}>+</button>
                </div>
                <span style={{ fontSize: 11, color: FAINT }}>{producto.unidad}</span>
              </div>
              {g.pass ? (
                <button className="cf-btn cf-btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={() => { onAdd(qty); setAdded(true) }}>
                  {added ? '✓ Añadido al pedido' : `Añadir al pedido · ${qty} ${producto.unidad}`}
                </button>
              ) : (
                <div className="cf-locked">🔒 Ficha no operativa · completa el cumplimiento para poder venderla</div>
              )}
            </div>
          </div>
        </div>

        {/* Columna campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {allGroups.map((grp) => (
            <div key={grp.group} className="cf-panel" style={{ padding: 18 }}>
              <Brackets />
              <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em', marginBottom: 14 }}>◢ {grp.group.toUpperCase()}</div>
              {grp.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < grp.items.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                  <SrcTag src={it.src} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 550, color: TEXT }}>{it.label}</div>
                    {it.law && <div style={{ fontSize: 11, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', marginTop: 2 }}>{it.law}</div>}
                  </div>
                  {it.value !== null ? (
                    <span style={{ fontSize: 12.5, color: TEXT, fontFamily: 'var(--font-dm-mono), monospace', textAlign: 'right' }}>{it.value}</span>
                  ) : (
                    <button className="cf-complete">{it.blocker ? '⚠ Completar' : 'Completar'}</button>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="cf-btn cf-btn-ghost">Guardar borrador</button>
            <button className="cf-btn cf-btn-primary" disabled={!g.pass} title={g.pass ? '' : 'El gate exige el 100% del DPP'}>
              {g.pass ? 'Publicar ficha' : `Publicar (faltan ${g.total - g.ok})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SrcTag({ src }: { src: ErpSrc }) {
  const s = SRC[src]
  return (
    <span title={s.desc} style={{ flexShrink: 0, width: 38, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: s.color, border: `1px solid ${s.color}55`, borderRadius: 6, padding: '4px 0', fontFamily: 'var(--font-dm-mono), monospace' }}>
      {s.tag}
    </span>
  )
}

function GatePill({ ok, total, pass }: { ok: number; total: number; pass: boolean }) {
  return (
    <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 999, background: pass ? 'rgba(126,224,160,0.14)' : 'rgba(240,180,41,0.14)', border: `1px solid ${pass ? 'rgba(126,224,160,0.45)' : 'rgba(240,180,41,0.45)'}`, color: pass ? OK : GOLD, fontFamily: 'var(--font-dm-mono), monospace' }}>
      GATE {ok}/{total} {pass ? '✓' : ''}
    </span>
  )
}

function Brackets() {
  return (
    <>
      <span className="cf-brk" style={{ top: 7, left: 7, borderTop: `1.5px solid ${TEAL}`, borderLeft: `1.5px solid ${TEAL}` }} />
      <span className="cf-brk" style={{ top: 7, right: 7, borderTop: `1.5px solid ${TEAL}`, borderRight: `1.5px solid ${TEAL}` }} />
      <span className="cf-brk" style={{ bottom: 7, left: 7, borderBottom: `1.5px solid ${TEAL}`, borderLeft: `1.5px solid ${TEAL}` }} />
      <span className="cf-brk" style={{ bottom: 7, right: 7, borderBottom: `1.5px solid ${TEAL}`, borderRight: `1.5px solid ${TEAL}` }} />
    </>
  )
}

function Style() {
  return (
    <style>{`
      .cf-brk { position:absolute; width:11px; height:11px; opacity:.5; pointer-events:none; }
      .cf-card {
        position:relative; text-align:left; cursor:pointer; padding:0; overflow:hidden;
        background: rgba(14,19,32,0.6); backdrop-filter: blur(20px) saturate(1.2); -webkit-backdrop-filter: blur(20px) saturate(1.2);
        border:1px solid ${LINE}; border-radius:14px; font:inherit; color:inherit;
        box-shadow: 0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
        transition: transform .2s, border-color .2s, box-shadow .2s;
      }
      .cf-card:hover { transform: translateY(-3px); border-color: rgba(240,180,41,0.4); box-shadow: 0 18px 44px rgba(0,0,0,0.5); }
      .cf-foto { height:120px; display:grid; place-items:center; }
      .cf-panel {
        position:relative; background: rgba(14,19,32,0.6); backdrop-filter: blur(20px) saturate(1.2); -webkit-backdrop-filter: blur(20px) saturate(1.2);
        border:1px solid ${LINE}; border-radius:14px;
        box-shadow: 0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .cf-banner {
        position:relative; display:flex; align-items:center; gap:12px; padding:13px 16px; margin-bottom:16px;
        background: rgba(240,180,41,0.07); border:1px solid rgba(240,180,41,0.25); border-radius:14px;
      }
      .cf-seal { padding:11px 13px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid ${LINE}; }
      .cf-buy { margin-top:14px; padding:14px; border-radius:12px; background:rgba(240,180,41,0.05); border:1px solid rgba(240,180,41,0.22); }
      .cf-buy-row { display:flex; justify-content:space-between; font-size:12px; margin-bottom:7px; }
      .cf-qty { display:flex; align-items:center; gap:2px; }
      .cf-qty button { width:26px; height:26px; border-radius:7px; cursor:pointer; font:inherit; font-size:15px; color:${TEXT};
        background:rgba(255,255,255,0.06); border:1px solid ${LINE}; }
      .cf-qty button:hover { background:rgba(255,255,255,0.12); }
      .cf-qty span { min-width:42px; text-align:center; font-size:14px; font-weight:600; color:${TEXT}; font-family:var(--font-dm-mono), monospace; }
      .cf-locked { margin-top:14px; padding:11px 13px; border-radius:10px; font-size:12px; line-height:1.5; text-align:center;
        color:${WARN}; background:rgba(224,133,126,0.1); border:1px solid rgba(224,133,126,0.35); }
      .cf-fab { position:fixed; bottom:22px; left:50%; transform:translateX(-50%); z-index:60; font:inherit; font-size:13.5px; font-weight:600;
        color:#1A1206; cursor:pointer; padding:13px 22px; border-radius:14px; border:1px solid rgba(255,255,255,0.25);
        background:linear-gradient(180deg,#FFD166,#F0B429 48%,#D89A18);
        box-shadow:0 12px 32px rgba(240,180,41,0.4), inset 0 1px 0 rgba(255,255,255,0.7); transition:transform .12s, filter .18s; }
      .cf-fab:hover { transform:translateX(-50%) translateY(-2px); filter:brightness(1.06); }
      .cf-fab:active { transform:translateX(-50%) translateY(1px) scale(.99); }
      .cf-back { font:inherit; font-size:12.5px; color:${MUTE}; background:none; border:none; cursor:pointer; padding:0 0 14px; }
      .cf-back:hover { color:${TEXT}; }
      .cf-complete { font:inherit; font-size:11.5px; font-weight:600; color:${GOLD}; cursor:pointer;
        background:rgba(240,180,41,0.1); border:1px solid rgba(240,180,41,0.4); border-radius:8px; padding:6px 11px; }
      .cf-complete:hover { background:rgba(240,180,41,0.18); }
      .cf-btn { font:inherit; font-size:13px; font-weight:600; padding:11px 18px; border-radius:11px; cursor:pointer; transition: transform .09s, filter .18s, box-shadow .18s; }
      .cf-btn:active:not(:disabled) { transform: translateY(1px) scale(.99); }
      .cf-btn-primary { color:#1A1206; border:1px solid rgba(255,255,255,0.25);
        background: linear-gradient(180deg,#FFD166,#F0B429 48%,#D89A18);
        box-shadow: 0 6px 16px rgba(240,180,41,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(120,80,0,0.3); }
      .cf-btn-primary:hover:not(:disabled) { filter:brightness(1.06); transform:translateY(-1px); }
      .cf-btn-primary:disabled { cursor:not-allowed; filter:grayscale(.5) brightness(.7); }
      .cf-btn-ghost { color:${TEXT}; border:1px solid ${LINE}; background:linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)); }
      .cf-btn-ghost:hover { border-color:rgba(47,210,201,0.4); }
    `}</style>
  )
}
