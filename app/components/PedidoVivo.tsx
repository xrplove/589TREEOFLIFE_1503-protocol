'use client'

/**
 * PEDIDO VIVO · documento maestro que se autorrellena al añadir artículos desde
 * el catálogo (idea José 30-may). Refleja SIEMPRE todos los datos + el
 * cumplimiento de TODAS las partes (comprador · vendedor · transitario). El
 * packing list ES el propio pedido (se compró en la plataforma). Opción de
 * cargar al contenedor (manual o automático) + anclaje on-chain (simulado).
 *
 * Maqueta: estructura y leyes reales; valores de muestra; on-chain SIMULADO
 * (la lógica de hash existe — ADR 0013 — la conexión XRPL/XDC es post-ronda).
 * Regla B: solo entran fichas gate-completas → el pedido se autocertifica.
 */

import { useState } from 'react'
import ContainerLoad from './ContainerLoad'

const GOLD = '#F0B429'
const TEAL = '#2FD2C9'
const TEXT = '#E8EDF5'
const MUTE = '#8A98AD'
const FAINT = '#5A6678'
const LINE = 'rgba(255,255,255,0.08)'
const OK = '#7EE0A0'

// Países para el selector de corredor (alimenta el gate de cumplimiento al confirmar).
// Incluye RU (sancionado) a propósito para poder ver el bloqueo en vivo.
const CORRIDOR_COUNTRIES: { code: string; label: string }[] = [
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'FR', label: '🇫🇷 Francia' },
  { code: 'DE', label: '🇩🇪 Alemania' },
  { code: 'IT', label: '🇮🇹 Italia' },
  { code: 'PT', label: '🇵🇹 Portugal' },
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'US', label: '🇺🇸 EE. UU.' },
  { code: 'MA', label: '🇲🇦 Marruecos' },
  { code: 'RU', label: '🇷🇺 Rusia (sancionado)' },
]

export type OrderLine = {
  id: string; name: string; cat: string; qty: number; unidad: string; precio: number; peso: string; dim: string; hue: string;
  box: { L: number; W: number; H: number; kg: number }
  // Presentes solo cuando la línea viene del catálogo REAL (tabla products · GET
  // /api/products). Ausentes en las líneas de maqueta → se guardan como snapshot.
  productId?: string
  dppRegistryId?: string
  sku?: string
}

// ── Estado REAL del pedido en BD (mig 038) · espejo del server ──
type DbOrderStatus = 'draft' | 'confirmed' | 'in_transit' | 'delivered' | 'closed' | 'cancelled'

const DB_STATUS_LABEL: Record<DbOrderStatus, string> = {
  draft: 'Borrador', confirmed: 'Confirmado', in_transit: 'En tránsito',
  delivered: 'Entregado', closed: 'Cerrado', cancelled: 'Cancelado',
}

// Próximas transiciones legales (espejo de app/api/orders/[id]/transition).
const NEXT_TRANSITIONS: Record<DbOrderStatus, { to: DbOrderStatus; label: string; primary?: boolean }[]> = {
  draft: [{ to: 'confirmed', label: 'Confirmar pedido (gate cumplimiento)', primary: true }, { to: 'cancelled', label: 'Cancelar' }],
  confirmed: [{ to: 'in_transit', label: 'Marcar en tránsito', primary: true }, { to: 'cancelled', label: 'Cancelar' }],
  in_transit: [{ to: 'delivered', label: 'Marcar entregado', primary: true }, { to: 'cancelled', label: 'Cancelar' }],
  delivered: [{ to: 'closed', label: 'Cerrar pedido', primary: true }],
  closed: [],
  cancelled: [],
}

type CorridorCompliance = {
  total: number
  mandatory: number
  conditional: number
  obligations: { id: string; label: string; conditional: boolean; status: string; legal_basis: string; source_url: string }[]
}

// Máquina de estados del pedido · cada transición = evento auditable con evidencia.
const STEPS = [
  { k: 'borrador', label: 'En construcción', detail: 'Añadiendo artículos conformes al pedido.', ev: '—' },
  { k: 'escrow', label: 'Escrow depositado', detail: 'El comprador deposita los fondos en escrow · fondos asegurados hasta la entrega. PEDIDO OK.', ev: 'firma comprador · 1/3' },
  { k: 'transitario', label: 'Transitario valida', detail: 'El transitario seleccionado recibe petición + documentación, valida carga y docs, y firma.', ev: 'firma transitario · 2/3' },
  { k: 'precinto', label: 'Precinto + carga', detail: 'Contenedor cargado y sellado con precinto digital (hash packing-list + GPS + timestamp · custodia G10).', ev: 'precinto 0x5fa1…digital' },
  { k: 'transito', label: 'En tránsito', detail: 'Envío en ruta · DPP + GPS del transitario actualizan la trazabilidad en tiempo real.', ev: 'GPS live · DPP enlazado' },
  { k: 'entrega', label: 'Entrega + firma', detail: 'Receptor firma con Actor-ID (Ed25519) + GPS + timestamp. Firma verificable, no garabato.', ev: 'firma receptor · 3/3' },
  { k: 'liberado', label: 'Escrow liberado', detail: 'Entrega confirmada → el escrow libera al vendedor · pedido cerrado.', ev: 'liberación del pago' },
]

const PARTES = [
  { rol: 'Comprador', nombre: 'Reformas y Construcciones Levante, S.L.', checks: ['KYC nivel 2 ✓', 'OFAC limpio ✓', 'Actor-ID ✓'], ok: true },
  { rol: 'Vendedor', nombre: 'Maderas del Levante, S.L.', checks: ['KYC ✓', 'Certificaciones ✓', 'VIES (IVA UE) ✓'], ok: true },
  { rol: 'Transitario', nombre: 'MSC Iberia · Naviera', checks: ['KYC ✓', 'Licencia transitario ✓', 'Firma pendiente'], ok: false },
]

export default function PedidoVivo({ lines, onBack }: { lines: OrderLine[]; onBack: () => void }) {
  const [cargar, setCargar] = useState<null | 'manual' | 'auto'>(null)
  const [step, setStep] = useState(1) // arranca con escrow depositado (PEDIDO OK)
  const firmas = step >= 5 ? 3 : step >= 2 ? 2 : step >= 1 ? 1 : 0
  const total = lines.reduce((s, l) => s + l.precio * l.qty, 0)
  const bultos = lines.reduce((s, l) => s + l.qty, 0)

  // ── Guardar pedido → BD real (POST /api/orders · mig 038/039) ──
  // El comprador es la sesión (server-side). La contraparte (vendedor) se
  // resuelve del directorio de Actors approved (GET /api/actors). Las líneas
  // de la maqueta no llevan product_id → se persisten como snapshots.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMsg, setSaveMsg] = useState('')

  // Corredor de exportación (origen→destino) · se fija al guardar y alimenta el
  // gate de cumplimiento al confirmar. Default ES→CO (corredor canónico del motor).
  const [originCountry, setOriginCountry] = useState('ES')
  const [destinationCountry, setDestinationCountry] = useState('CO')

  // Estado real del pedido en BD una vez guardado (habilita las transiciones).
  const [orderId, setOrderId] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<DbOrderStatus>('draft')
  const [trans, setTrans] = useState<'idle' | 'busy'>('idle')
  const [transMsg, setTransMsg] = useState('')
  const [compliance, setCompliance] = useState<CorridorCompliance | null>(null)

  async function handleTransition(to: DbOrderStatus) {
    if (!orderId || trans === 'busy') return
    setTrans('busy')
    setTransMsg('')
    try {
      const res = await fetch(`/api/orders/${orderId}/transition`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        order?: { status?: DbOrderStatus }
        corridor_compliance?: CorridorCompliance
        error?: string
      }
      if (res.ok && data.order?.status) {
        setDbStatus(data.order.status)
        if (data.corridor_compliance) setCompliance(data.corridor_compliance)
      } else {
        setTransMsg(`${res.status} · ${data.error ?? 'error en la transición'}`)
      }
    } catch {
      setTransMsg('Fallo de red en la transición.')
    } finally {
      setTrans('idle')
    }
  }

  async function handleSave() {
    if (saveState === 'saving') return
    if (lines.length === 0) {
      setSaveState('error')
      setSaveMsg('El pedido no tiene líneas.')
      return
    }
    setSaveState('saving')
    setSaveMsg('')
    try {
      // 1) Resolver contraparte (vendedor) del directorio real.
      const dirRes = await fetch('/api/actors?limit=10', { headers: { accept: 'application/json' } })
      if (dirRes.status === 401) {
        setSaveState('error')
        setSaveMsg('Necesitas sesión iniciada (entra por el login demo).')
        return
      }
      if (!dirRes.ok) {
        setSaveState('error')
        setSaveMsg(`No se pudo cargar el directorio (${dirRes.status}).`)
        return
      }
      const dir = (await dirRes.json()) as { actors?: { user_id?: string }[] }
      const candidates = (dir.actors ?? [])
        .map((a) => a.user_id)
        .filter((x): x is string => typeof x === 'string')
      if (candidates.length === 0) {
        setSaveState('error')
        setSaveMsg('No hay contraparte approved visible en el directorio para el test.')
        return
      }

      // 2) Líneas → snapshots (product_id null en la maqueta).
      const payloadLines = lines.map((l) => ({
        ...(l.productId ? { product_id: l.productId } : {}),
        ...(l.dppRegistryId ? { dpp_registry_id: l.dppRegistryId } : {}),
        sku_snapshot: (l.sku ?? l.id).slice(0, 64),
        title_snapshot: { es: l.name },
        quantity: l.qty,
        unit_price: l.precio,
      }))

      // 3) POST probando candidatos hasta uno ≠ comprador (la ruta rechaza
      //    buyer==seller con 400 · evita necesitar saber el id propio aquí).
      let sawSelfOnly = false
      for (const seller of candidates) {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            seller_user_id: seller,
            origin_country: originCountry,
            destination_country: destinationCountry,
            currency: 'EUR',
            notes: 'Pedido creado desde el Pedido Vivo.',
            lines: payloadLines,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { order?: { id?: string }; error?: string }
        if (res.ok) {
          setSaveState('saved')
          setSaveMsg(`Pedido borrador creado en BD · id ${data.order?.id ?? '—'}`)
          if (data.order?.id) {
            setOrderId(data.order.id)
            setDbStatus('draft')
          }
          return
        }
        if (res.status === 400 && /differ/i.test(data.error ?? '')) {
          sawSelfOnly = true
          continue // el candidato es el propio comprador → siguiente
        }
        setSaveState('error')
        setSaveMsg(`${res.status} · ${data.error ?? 'error al crear el pedido'}`)
        return
      }
      setSaveState('error')
      setSaveMsg(
        sawSelfOnly
          ? 'La única contraparte approved disponible es el propio comprador.'
          : 'No se pudo crear el pedido con ninguna contraparte.',
      )
    } catch {
      setSaveState('error')
      setSaveMsg('Fallo de red al guardar el pedido.')
    }
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <Style />
      <button onClick={onBack} className="pv-back">← Volver al catálogo</button>

      {/* Cabecera del pedido */}
      <div className="pv-panel pv-head">
        <Brk />
        <div>
          <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.18em' }}>◆ PEDIDO EN CONSTRUCCIÓN · TRAZABILIDAD EN TIEMPO REAL</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: TEXT, margin: '6px 0 2px', fontFamily: 'var(--font-chakra-petch), sans-serif' }}>PM-INM-2026-0142</h2>
          <div style={{ fontSize: 12.5, color: MUTE }}>{lines.length} referencias · {bultos} bultos · el packing list ES este pedido</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: TEXT, fontFamily: 'var(--font-dm-mono), monospace' }}>{total.toLocaleString('es-ES')} €</div>
          <div style={{ fontSize: 11, color: GOLD, fontFamily: 'var(--font-dm-mono), monospace' }}>· pago contra entrega confirmada</div>
          <span className="pv-gate">CUMPLIMIENTO GLOBAL ✓</span>
        </div>
      </div>

      {/* Corredor de exportación · se fija al guardar · alimenta el gate al confirmar */}
      <div className="pv-panel" style={{ padding: '14px 18px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Brk />
        <span style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em' }}>◢ CORREDOR DE EXPORTACIÓN</span>
        <select
          value={originCountry}
          onChange={(e) => setOriginCountry(e.target.value)}
          disabled={orderId !== null}
          style={{ font: 'inherit', fontSize: 12.5, color: TEXT, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 10px', cursor: orderId ? 'default' : 'pointer', opacity: orderId ? 0.6 : 1 }}
        >
          {CORRIDOR_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} style={{ color: '#111' }}>{c.label}</option>
          ))}
        </select>
        <span style={{ color: MUTE }}>→</span>
        <select
          value={destinationCountry}
          onChange={(e) => setDestinationCountry(e.target.value)}
          disabled={orderId !== null}
          style={{ font: 'inherit', fontSize: 12.5, color: TEXT, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 10px', cursor: orderId ? 'default' : 'pointer', opacity: orderId ? 0.6 : 1 }}
        >
          {CORRIDOR_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} style={{ color: '#111' }}>{c.label}</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: FAINT }}>
          {orderId ? 'fijado en el pedido' : 'alimenta el gate de cumplimiento al confirmar'}
        </span>
      </div>

      {/* Stepper · máquina de estados auditable */}
      <div className="pv-panel" style={{ padding: '18px 18px 16px', marginTop: 16 }}>
        <Brk />
        <div className="pv-eyebrow">◢ ESTADO DEL PEDIDO · máquina de estados auditable</div>
        <div className="pv-stepper">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <div key={s.k} className={`pv-step ${state}`}>
                <span className="pv-dot">{i < step ? '✓' : i + 1}</span>
                <span className="pv-step-label">{s.label}</span>
                {i < STEPS.length - 1 && <span className="pv-line" />}
              </div>
            )
          })}
        </div>
        <div className="pv-state">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: TEXT }}>{step + 1}. {STEPS[step].label}</div>
            <div style={{ fontSize: 12, color: MUTE, marginTop: 3, lineHeight: 1.5 }}>{STEPS[step].detail}</div>
            <div style={{ fontSize: 10.5, color: TEAL, marginTop: 6, fontFamily: 'var(--font-dm-mono), monospace' }}>evidencia: {STEPS[step].ev}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {step < STEPS.length - 1 ? (
              <button className="pv-btn pv-btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Avanzar estado →</button>
            ) : (
              <span style={{ fontSize: 12, color: OK, fontFamily: 'var(--font-dm-mono), monospace' }}>✓ ciclo completo</span>
            )}
            <button className="pv-btn pv-btn-ghost" style={{ fontSize: 11.5, padding: '7px 12px' }} onClick={() => setStep(1)}>Reiniciar</button>
          </div>
        </div>

        {/* Acción contextual del estado */}
        {step === 1 && (
          <div className="pv-act">🚚 <span>Selecciona el transitario verificado para esta ruta.</span><button className="pv-btn pv-btn-ghost" onClick={() => setStep(2)}>Seleccionar transitario</button></div>
        )}
        {step === 2 && (
          <div className="pv-act">📨 <span>El transitario recibe la petición + documentación (packing list = pedido · DPP · certificados) para validar.</span></div>
        )}
        {step === 3 && (
          <div className="pv-act">🔒 <span>Precinto digital aplicado · contenedor sellado · cadena de custodia G10 activa.</span></div>
        )}
        {step === 5 && (
          <div className="pv-act">✍️ <span>Firma de entrega del receptor (Actor-ID Ed25519 + GPS) · libera el escrow al confirmar.</span></div>
        )}
      </div>

      {/* Partes y cumplimiento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16 }}>
        {PARTES.map((p) => (
          <div key={p.rol} className="pv-panel" style={{ padding: 15 }}>
            <Brk />
            <div style={{ fontSize: 10, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.16em' }}>◢ {p.rol.toUpperCase()}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, margin: '6px 0 10px' }}>{p.nombre}</div>
            {(p.rol === 'Transitario' ? p.checks.map((c) => (c.includes('Firma') ? (step >= 2 ? 'Firmado ✓' : 'Firma pendiente') : c)) : p.checks).map((c) => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: c.includes('pendiente') ? GOLD : OK, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.includes('pendiente') ? GOLD : OK }} />
                {c}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Líneas del pedido */}
      <div className="pv-panel" style={{ padding: 18, marginTop: 16 }}>
        <Brk />
        <div className="pv-eyebrow">◢ LÍNEAS DEL PEDIDO · cada artículo con ficha conforme</div>
        {lines.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < lines.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.hue, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 550, color: TEXT }}>{l.name}</div>
              <div style={{ fontSize: 11, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace' }}>{l.cat} · {l.dim} · {l.peso} · gate ✓</div>
            </div>
            <div style={{ fontSize: 12.5, color: MUTE, fontFamily: 'var(--font-dm-mono), monospace' }}>{l.qty} {l.unidad}</div>
            <div style={{ fontSize: 13, color: TEXT, fontFamily: 'var(--font-dm-mono), monospace', minWidth: 90, textAlign: 'right' }}>{(l.precio * l.qty).toLocaleString('es-ES')} €</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, alignItems: 'start' }}>
        {/* Documentación */}
        <div className="pv-panel" style={{ padding: 18 }}>
          <Brk />
          <div className="pv-eyebrow">◢ DOCUMENTACIÓN DEL PEDIDO</div>
          {['DPP de cada artículo · auto', 'Certificados CE / DoP · auto', 'Factura proforma · auto del pedido', 'Packing list · = este pedido'].map((d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: TEXT, padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ color: OK }}>📎</span> {d}
            </div>
          ))}
          <button className="pv-btn pv-btn-ghost" style={{ width: '100%', marginTop: 12 }}>↥ Adjuntar documento (seguro · aduanas · BL)</button>
        </div>

        {/* Cargar al contenedor */}
        <div className="pv-panel" style={{ padding: 18 }}>
          <Brk />
          <div className="pv-eyebrow">◢ CARGA AL CONTENEDOR · opcional</div>
          <p style={{ fontSize: 12, color: MUTE, lineHeight: 1.55, margin: '0 0 12px' }}>
            Como el pedido ya conoce dimensiones y peso de cada artículo, puede estibar la carga.
          </p>
          <div style={{ display: 'flex', gap: 9 }}>
            <button className={`pv-seg ${cargar === 'manual' ? 'on' : ''}`} onClick={() => setCargar('manual')}>Manual</button>
            <button className={`pv-seg ${cargar === 'auto' ? 'on' : ''}`} onClick={() => setCargar('auto')}>Automático (auto-estiba)</button>
          </div>
          {cargar && (
            <div className="pv-cont">
              <ContainerLoad lines={lines} mode={cargar} />
            </div>
          )}
        </div>
      </div>

      {/* Anclaje on-chain */}
      <div className="pv-panel" style={{ padding: 18, marginTop: 16 }}>
        <Brk />
        <div className="pv-eyebrow">◢ SELLO DE INTEGRIDAD · SHA-256 <span style={{ color: GOLD }}>· SIMULADO (maqueta)</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            ['Hash del pedido', 'RFC 8785 JCS · SHA-256', '0x8e42…71ad', TEAL],
            ['Pago / liberación', 'Escrow · contra entrega', 'al entregar', OK],
            ['Escrow multifirma', 'Firma múltiple · 3 partes', `${firmas}/3 firmas`, GOLD],
          ].map(([t, d, v, c]) => (
            <div key={t as string}>
              <div style={{ fontSize: 11, color: MUTE }}>{t}</div>
              <div style={{ fontSize: 10.5, color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', margin: '3px 0' }}>{d}</div>
              <div style={{ fontSize: 13, color: c as string, fontFamily: 'var(--font-dm-mono), monospace' }}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>
          On-chain solo viaja el hash (PII off-chain · RGPD). El anclaje real se enchufa con ronda + auditoría de smart contracts.
        </p>
      </div>

      {/* Estado REAL en BD · habilitado tras guardar · transiciones reales */}
      {orderId && (
        <div className="pv-panel" style={{ padding: 18, marginTop: 16 }}>
          <Brk />
          <div className="pv-eyebrow">
            ◢ ESTADO REAL EN BD · pedido {orderId.slice(0, 8)}… · <span style={{ color: OK }}>persistido</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="pv-gate" style={{ marginTop: 0 }}>{DB_STATUS_LABEL[dbStatus]}</span>
            {NEXT_TRANSITIONS[dbStatus].length === 0 && (
              <span style={{ fontSize: 12, color: MUTE }}>estado terminal</span>
            )}
            {NEXT_TRANSITIONS[dbStatus].map((t) => (
              <button
                key={t.to}
                className={`pv-btn ${t.primary ? 'pv-btn-primary' : 'pv-btn-ghost'}`}
                style={{ fontSize: 12.5, padding: '9px 14px', ...(trans === 'busy' ? { opacity: 0.6, cursor: 'wait' } : {}) }}
                disabled={trans === 'busy'}
                onClick={() => handleTransition(t.to)}
              >
                {trans === 'busy' ? '…' : t.label}
              </button>
            ))}
            {transMsg && (
              <span style={{ fontSize: 11.5, color: GOLD, fontFamily: 'var(--font-dm-mono), monospace' }}>⚠ {transMsg}</span>
            )}
          </div>

          {compliance && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'rgba(47,210,201,0.06)', border: '1px solid rgba(47,210,201,0.25)' }}>
              <div style={{ fontSize: 11.5, color: TEAL, fontFamily: 'var(--font-dm-mono), monospace', marginBottom: 8 }}>
                CUMPLIMIENTO DEL CORREDOR · {compliance.total} obligaciones ({compliance.mandatory} siempre · {compliance.conditional} según producto)
              </div>
              {compliance.obligations.slice(0, 6).map((o) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: TEXT, padding: '4px 0' }}>
                  <span style={{ color: o.conditional ? GOLD : OK }}>{o.conditional ? '◇' : '◆'}</span>
                  <a href={o.source_url} target="_blank" rel="noopener noreferrer" style={{ color: TEXT, textDecoration: 'none', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.label}
                  </a>
                  <span style={{ color: FAINT, fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10 }}>{o.legal_basis.slice(0, 38)}</span>
                </div>
              ))}
              {compliance.obligations.length > 6 && (
                <div style={{ fontSize: 10.5, color: FAINT, marginTop: 4 }}>+{compliance.obligations.length - 6} más…</div>
              )}
              <p style={{ fontSize: 10.5, color: FAINT, marginTop: 8, lineHeight: 1.5 }}>
                ◆ siempre aplicable · ◇ según el producto · todas subject_to_expert · informativas (no bloquean la confirmación).
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 18 }}>
        {saveMsg && (
          <span
            style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-dm-mono), monospace',
              color: saveState === 'saved' ? OK : saveState === 'error' ? GOLD : MUTE,
              maxWidth: 460,
              textAlign: 'right',
            }}
          >
            {saveState === 'saved' ? '✓ ' : saveState === 'error' ? '⚠ ' : ''}
            {saveMsg}
          </span>
        )}
        <button
          className="pv-btn pv-btn-ghost"
          onClick={handleSave}
          disabled={saveState === 'saving' || orderId !== null}
          style={saveState === 'saving' || orderId !== null ? { opacity: 0.6, cursor: orderId ? 'default' : 'wait' } : undefined}
        >
          {orderId ? 'Pedido guardado ✓' : saveState === 'saving' ? 'Guardando…' : 'Guardar pedido'}
        </button>
        <button className="pv-btn pv-btn-primary">Finalizar compra →</button>
      </div>
    </div>
  )
}

function Brk() {
  return (
    <>
      <span className="pv-brk" style={{ top: 7, left: 7, borderTop: `1.5px solid ${TEAL}`, borderLeft: `1.5px solid ${TEAL}` }} />
      <span className="pv-brk" style={{ top: 7, right: 7, borderTop: `1.5px solid ${TEAL}`, borderRight: `1.5px solid ${TEAL}` }} />
      <span className="pv-brk" style={{ bottom: 7, left: 7, borderBottom: `1.5px solid ${TEAL}`, borderLeft: `1.5px solid ${TEAL}` }} />
      <span className="pv-brk" style={{ bottom: 7, right: 7, borderBottom: `1.5px solid ${TEAL}`, borderRight: `1.5px solid ${TEAL}` }} />
    </>
  )
}

function Style() {
  return (
    <style>{`
      .pv-brk { position:absolute; width:11px; height:11px; opacity:.5; pointer-events:none; }
      .pv-panel { position:relative; background:rgba(14,19,32,0.6); backdrop-filter:blur(20px) saturate(1.2); -webkit-backdrop-filter:blur(20px) saturate(1.2);
        border:1px solid ${LINE}; border-radius:14px; box-shadow:0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05); }
      .pv-head { display:flex; justify-content:space-between; align-items:flex-start; padding:20px; }
      .pv-eyebrow { font-size:10.5px; color:${FAINT}; font-family:var(--font-dm-mono), monospace; letter-spacing:0.16em; margin-bottom:13px; }
      .pv-gate { display:inline-block; margin-top:8px; font-size:10px; padding:3px 9px; border-radius:999px; font-family:var(--font-dm-mono), monospace;
        color:${OK}; background:rgba(126,224,160,0.14); border:1px solid rgba(126,224,160,0.45); }
      .pv-back { font:inherit; font-size:12.5px; color:${MUTE}; background:none; border:none; cursor:pointer; padding:0 0 14px; }
      .pv-back:hover { color:${TEXT}; }
      .pv-seg { flex:1; font:inherit; font-size:12px; font-weight:600; padding:9px; border-radius:9px; cursor:pointer; color:${MUTE};
        background:rgba(255,255,255,0.04); border:1px solid ${LINE}; transition:all .15s; }
      .pv-seg:hover { color:${TEXT}; background:rgba(255,255,255,0.08); }
      .pv-seg.on { color:#1A1206; border-color:rgba(255,255,255,0.3); background:linear-gradient(180deg,#FFD166,${GOLD}); }
      .pv-cont { margin-top:13px; padding:13px; border-radius:10px; background:rgba(47,210,201,0.06); border:1px solid rgba(47,210,201,0.25); }
      .pv-stepper { display:flex; align-items:flex-start; margin:4px 0 16px; }
      .pv-step { position:relative; flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; }
      .pv-dot { width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:11px; font-weight:700;
        font-family:var(--font-dm-mono), monospace; z-index:1; border:1.5px solid; }
      .pv-step.done .pv-dot { background:rgba(126,224,160,0.18); border-color:${OK}; color:${OK}; }
      .pv-step.active .pv-dot { background:linear-gradient(180deg,#FFD166,${GOLD}); border-color:rgba(255,255,255,0.3); color:#1A1206; box-shadow:0 0 14px rgba(240,180,41,0.5); }
      .pv-step.todo .pv-dot { background:rgba(255,255,255,0.04); border-color:${LINE}; color:${FAINT}; }
      .pv-step-label { font-size:10px; text-align:center; line-height:1.3; max-width:80px; }
      .pv-step.done .pv-step-label { color:${MUTE}; }
      .pv-step.active .pv-step-label { color:${TEXT}; font-weight:600; }
      .pv-step.todo .pv-step-label { color:${FAINT}; }
      .pv-line { position:absolute; top:13px; left:50%; width:100%; height:1.5px; background:${LINE}; z-index:0; }
      .pv-step.done .pv-line { background:${OK}; opacity:.5; }
      .pv-state { display:flex; align-items:center; gap:16px; padding:14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid ${LINE}; }
      .pv-act { display:flex; align-items:center; gap:11px; margin-top:12px; padding:11px 14px; border-radius:10px; font-size:12.5px; color:${TEXT};
        background:rgba(240,180,41,0.06); border:1px solid rgba(240,180,41,0.22); }
      .pv-act span { flex:1; color:${MUTE}; }
      .pv-btn { font:inherit; font-size:13px; font-weight:600; padding:11px 18px; border-radius:11px; cursor:pointer; transition:transform .09s, filter .18s; }
      .pv-btn:active { transform:translateY(1px) scale(.99); }
      .pv-btn-primary { color:#1A1206; border:1px solid rgba(255,255,255,0.25); background:linear-gradient(180deg,#FFD166,#F0B429 48%,#D89A18);
        box-shadow:0 6px 16px rgba(240,180,41,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(120,80,0,0.3); }
      .pv-btn-primary:hover { filter:brightness(1.06); transform:translateY(-1px); }
      .pv-btn-ghost { color:${TEXT}; border:1px solid ${LINE}; background:linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)); }
      .pv-btn-ghost:hover { border-color:rgba(47,210,201,0.4); }
    `}</style>
  )
}
