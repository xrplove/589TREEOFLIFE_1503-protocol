'use client'

/**
 * Módulo CATÁLOGO del escritorio del vendedor (tenant) · piel.
 *
 * Recibe el catálogo por props (el server lo lee de BD) y deja a Dirección
 * decidir qué fichas son PÚBLICAS (cruzan al hub Global) y cuáles PRIVADAS
 * (negocio interno). El toggle llama a `PATCH /api/products/[id]` (acción gated,
 * RLS `products_update_own`) con actualización optimista.
 *
 * `canPublish=false` → modo preview/solo-lectura (sin sesión): el toggle se ve
 * pero está deshabilitado, con nota honesta de que publica Dirección en el real.
 */

import { useMemo, useState } from 'react'
import {
  Card, Eyebrow, Stat, StatusPill, DeskStyle,
} from '../components/workspace/ui/DeskKit'
import {
  GREEN, AMBER, TEXT, TEXT_DIM, MUTE, HAIR, LILAC, FONT_MONO, NUM, R_SM,
} from '../components/workspace/ui/tokens'
import type { CatalogItem, TenantCatalog } from './catalogo'

function titleOf(t: CatalogItem['title'], sku: string): string {
  if (!t) return sku
  return t.es || t.en || Object.values(t)[0] || sku
}

type Filter = 'all' | 'public' | 'private' | 'ready2028'

export function CatalogoModule({
  catalog,
  canPublish = false,
  tenantName = 'Artihome SL',
}: {
  catalog: TenantCatalog
  canPublish?: boolean
  tenantName?: string
}) {
  const [items, setItems] = useState<CatalogItem[]>(catalog.items)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(
    () => ({
      total: items.length,
      public: items.filter((i) => i.isPublic).length,
      private: items.filter((i) => !i.isPublic).length,
      ready2028: items.filter((i) => i.espr2028.ready).length,
    }),
    [items],
  )

  const shown = useMemo(() => {
    switch (filter) {
      case 'public': return items.filter((i) => i.isPublic)
      case 'private': return items.filter((i) => !i.isPublic)
      case 'ready2028': return items.filter((i) => i.espr2028.ready)
      default: return items
    }
  }, [items, filter])

  async function toggle(item: CatalogItem) {
    if (!canPublish || busy) return
    const next = !item.isPublic
    setError(null)
    setBusy(item.id)
    // Optimista.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPublic: next, status: next ? 'published' : 'draft' } : i)))
    try {
      const r = await fetch(`/api/products/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ public: next }),
      })
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || r.statusText)
      }
    } catch (e) {
      // Revertir.
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPublic: item.isPublic, status: item.status } : i)))
      setError(`No se pudo cambiar ${item.sku}: ${e instanceof Error ? e.message : 'error'}`)
    } finally {
      setBusy(null)
    }
  }

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: summary.total },
    { id: 'public', label: 'Públicos', count: summary.public },
    { id: 'private', label: 'Privados', count: summary.private },
    { id: 'ready2028', label: 'Listos 2028', count: summary.ready2028 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <DeskStyle />

      {/* Cabecera + contadores */}
      <Card eyebrow={`Catálogo · ${tenantName}`} title="Productos a la venta">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 14 }}>
          <Stat value={String(summary.total)} label="Productos" />
          <Stat value={String(summary.public)} label="Públicos · en el hub Global" accent={GREEN} />
          <Stat value={String(summary.private)} label="Privados · solo tú" accent={TEXT_DIM} />
          <Stat value={`${summary.ready2028}`} unit={`/ ${summary.total}`} label="Listos para la ley 2028" accent={LILAC} />
        </div>
        <p style={{ fontSize: '0.78rem', color: MUTE, margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: GREEN }}>Público</strong> = la ficha cruza al hub Global (exportable, liquidación 1503 con el 0,5%).{' '}
          <strong style={{ color: TEXT_DIM }}>Privado</strong> = solo en tu negocio interno. {canPublish ? 'Cambia el estado con el botón de cada fila.' : 'En el escritorio real, Dirección publica desde aquí.'}
        </p>
      </Card>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                cursor: 'pointer', fontFamily: FONT_MONO, fontSize: '0.7rem', letterSpacing: '0.05em',
                color: active ? '#0A0C11' : TEXT_DIM, background: active ? LILAC : 'transparent',
                border: `1px solid ${active ? LILAC : HAIR}`, borderRadius: 999, padding: '5px 12px',
              }}
            >
              {f.label} <span style={{ ...NUM, opacity: 0.7 }}>{f.count}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{ fontSize: '0.78rem', color: '#EDA39C', background: 'rgba(224,133,126,0.10)', border: '1px solid rgba(224,133,126,0.3)', borderRadius: R_SM, padding: '8px 12px' }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: MUTE, fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <th style={{ padding: '11px 16px', fontWeight: 500 }}>Producto</th>
                <th style={{ padding: '11px 10px', fontWeight: 500 }}>Precio</th>
                <th style={{ padding: '11px 10px', fontWeight: 500 }}>DPP</th>
                <th style={{ padding: '11px 10px', fontWeight: 500 }}>Ley 2028</th>
                <th style={{ padding: '11px 10px', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '11px 16px', fontWeight: 500, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => (
                <tr key={it.id} style={{ borderTop: `1px solid ${HAIR}` }}>
                  <td style={{ padding: '10px 16px', color: TEXT }}>
                    <div style={{ fontWeight: 500 }}>{titleOf(it.title, it.sku)}</div>
                    <div style={{ ...NUM, fontSize: '0.68rem', color: MUTE }}>{it.sku}{it.hs_code ? ` · HS ${it.hs_code}` : ''}{it.country_of_origin ? ` · ${it.country_of_origin}` : ''}</div>
                  </td>
                  <td style={{ ...NUM, padding: '10px 10px', color: TEXT_DIM, whiteSpace: 'nowrap' }}>
                    {it.price != null ? `${it.price.toLocaleString('es-ES')} ${it.currency ?? ''}` : '—'}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    {it.hasDpp ? <StatusPill tone="info">DPP</StatusPill> : <span style={{ color: MUTE }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    {it.espr2028.ready
                      ? <StatusPill tone="ok">Listo</StatusPill>
                      : <StatusPill tone="warn">falta {it.espr2028.missing.length}</StatusPill>}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    {it.isPublic
                      ? <StatusPill tone="ok">Público</StatusPill>
                      : <StatusPill tone="neutral">Privado</StatusPill>}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => toggle(it)}
                      disabled={!canPublish || busy === it.id}
                      title={canPublish ? '' : 'Disponible en el escritorio real (Dirección)'}
                      style={{
                        cursor: canPublish ? 'pointer' : 'not-allowed', opacity: canPublish ? 1 : 0.45,
                        fontFamily: FONT_MONO, fontSize: '0.68rem', letterSpacing: '0.04em',
                        color: it.isPublic ? AMBER : GREEN, background: 'transparent',
                        border: `1px solid ${it.isPublic ? 'rgba(232,177,76,0.32)' : 'rgba(70,209,127,0.32)'}`,
                        borderRadius: R_SM, padding: '5px 11px', whiteSpace: 'nowrap',
                      }}
                    >
                      {busy === it.id ? '…' : it.isPublic ? 'Despublicar' : 'Publicar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
