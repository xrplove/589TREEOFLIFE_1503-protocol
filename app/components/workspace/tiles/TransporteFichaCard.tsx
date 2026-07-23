'use client'

/**
 * TransporteFichaCard · adapter que renderiza un TransporteProduct
 * (cualquiera de las 3 sub-categorías: servicio_transitario · operacion_transporte
 *  · servicio_naviero) como ProductTile.
 *
 * NO conoce el sistema i18n del workspace · recibe los strings ya localizados
 * vía la prop `labels` (cliente envuelve con sus propios labels traducidos).
 * Esto mantiene el componente desacoplado y testeable.
 *
 * Cada sub-categoría tiene su propia composición de meta (campos clave
 * relevantes para esa sub-categoría · no se muestran TODOS los campos
 * del schema · solo los más útiles para escanear rápido).
 *
 * Patrón "card de un vistazo": el Actor que ojea el catálogo debe poder
 * decidir en 2 segundos si la ficha le interesa antes de hacer click.
 */

import { ProductTile } from './ProductTile'
import {
  type TransporteProduct,
  type ServicioTransitarioProduct,
  type OperacionTransporteProduct,
  type ServicioNavieroProduct,
  isServicioTransitario,
  isOperacionTransporte,
  isServicioNaviero,
} from '@/app/data/productSchemas/transporte'
import type { Lang } from '@/app/data/actorGroups'

// ============================================================================
// LABELS · todos los strings localizados que el componente puede mostrar
// ============================================================================

/** Labels que el componente usa · todos pre-localizados por el padre. */
export type TransporteFichaCardLabels = {
  // Sub-category names
  servicioTransitario: string
  operacionTransporte: string
  servicioNaviero: string

  // Meta labels (key column)
  origen: string
  destino: string
  modo: string
  transito: string
  tipoServicio: string
  takeRate: string
  capacidad: string
  incoterm: string
  regimenAduanero: string
  buque: string
  voyage: string
  etd: string
  eta: string
  capacidadDisponible: string
  tarifa20ST: string
  tarifa40ST: string
  mercanciaPeso: string
  mercanciaVolumen: string

  // Status badges
  borrador: string  // when schema_status === 'draft'
  validado: string

  // Aria
  ariaCard: (title: string) => string
}

// ============================================================================
// HELPERS · formatters
// ============================================================================

function formatCurrency(value: number, currency: string, lang: Lang = 'es'): string {
  try {
    // USDC · EURC · RLUSD no son ISO currency · usar manual format
    const isStablecoin = ['USDC', 'EURC', 'RLUSD'].includes(currency)
    if (isStablecoin) {
      const formatter = new Intl.NumberFormat(lang === 'es' ? 'es-ES' : lang, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `${formatter.format(value)} ${currency}`
    }
    return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : lang, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value} ${currency}`
  }
}

function formatTransitDays(min: number, max: number): string {
  if (min === max) return `${min} días`
  return `${min}-${max} días`
}

function formatLocation(locode: string, name: string): string {
  return `${locode} · ${name}`
}

// ============================================================================
// SUB-CATEGORY RENDERERS · build meta + badge + subtitle per sub-category
// ============================================================================

function buildServicioTransitarioMeta(
  p: ServicioTransitarioProduct,
  labels: TransporteFichaCardLabels,
  lang: Lang,
) {
  return {
    subtitle: labels.servicioTransitario,
    meta: [
      { label: labels.modo, value: p.modo.replace(/_/g, ' ') },
      {
        label: labels.transito,
        value: formatTransitDays(p.tiempo_transito_dias_min, p.tiempo_transito_dias_max),
      },
      {
        label: labels.tipoServicio,
        value: p.tipo_servicio.toUpperCase().replace(/_/g, ' '),
      },
      {
        label: labels.takeRate,
        value: `${formatCurrency(p.price.value, p.price.currency, lang)} / ${p.price.unit ?? 'unidad'}`,
        mono: true,
      },
    ],
  }
}

function buildOperacionTransporteMeta(
  p: OperacionTransporteProduct,
  labels: TransporteFichaCardLabels,
  lang: Lang,
) {
  const m = p.mercancia
  return {
    subtitle: labels.operacionTransporte,
    meta: [
      { label: labels.incoterm, value: p.incoterm_propuesto, mono: true },
      { label: labels.regimenAduanero, value: p.regimen_aduanero.replace(/_/g, ' ') },
      {
        label: labels.mercanciaPeso,
        value: `${new Intl.NumberFormat(lang === 'es' ? 'es-ES' : lang).format(m.peso_bruto_kg)} kg`,
        mono: true,
      },
      {
        label: labels.mercanciaVolumen,
        value: `${m.volumen_m3} m³`,
        mono: true,
      },
    ],
  }
}

function buildServicioNavieroMeta(
  p: ServicioNavieroProduct,
  labels: TransporteFichaCardLabels,
  lang: Lang,
) {
  // Format ETD/ETA as short date in user locale
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : lang, {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const meta: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: labels.etd, value: formatDate(p.etd), mono: true },
    { label: labels.eta, value: formatDate(p.eta), mono: true },
  ]

  if (p.capacidad_disponible_teu !== undefined) {
    meta.push({
      label: labels.capacidadDisponible,
      value: `${p.capacidad_disponible_teu} TEU`,
      mono: true,
    })
  }
  if (p.tarifa_base_20ST !== undefined) {
    meta.push({
      label: labels.tarifa20ST,
      value: formatCurrency(p.tarifa_base_20ST, p.price.currency, lang),
      mono: true,
    })
  }

  return {
    subtitle: p.nombre_buque_o_vuelo
      ? `${labels.servicioNaviero} · ${p.nombre_buque_o_vuelo}`
      : labels.servicioNaviero,
    meta,
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export type TransporteFichaCardProps = {
  product: TransporteProduct
  labels: TransporteFichaCardLabels
  /** Idioma para formatear números/fechas (default 'es'). */
  lang?: Lang
  /** Click handler · típicamente abrir detalle de la ficha. */
  onClick?: () => void
  /** ¿Tile seleccionado? */
  selected?: boolean
  /** Disabled state. */
  disabled?: boolean
  /** Loading state (skeleton). */
  loading?: boolean
}

export function TransporteFichaCard(props: TransporteFichaCardProps) {
  const { product, labels, lang = 'es', onClick, selected, disabled, loading } = props

  // Build title in the requested language with fallback cascade
  const title = product.title[lang] || product.title.en || product.title.es

  // Determine subtitle + meta + badge per sub-category
  let composed: { subtitle: string; meta: Array<{ label: string; value: string; mono?: boolean }> }
  if (isServicioTransitario(product)) {
    composed = buildServicioTransitarioMeta(product, labels, lang)
  } else if (isOperacionTransporte(product)) {
    composed = buildOperacionTransporteMeta(product, labels, lang)
  } else if (isServicioNaviero(product)) {
    composed = buildServicioNavieroMeta(product, labels, lang)
  } else {
    // Exhaustiveness check (should never reach if types complete)
    composed = { subtitle: '', meta: [] }
  }

  // Schema status badge (BORRADOR vs VALIDADO)
  const badge =
    product.schema_status === 'draft'
      ? { label: labels.borrador, tone: 'warning' as const }
      : { label: labels.validado, tone: 'success' as const }

  // Primary image · use first image marked as primary, else first image, else placeholder
  const primaryImage = product.images.find((img) => img.is_primary) ?? product.images[0]
  const image = primaryImage
    ? {
        url: primaryImage.url,
        alt: primaryImage.alt[lang] || primaryImage.alt.en || primaryImage.alt.es,
      }
    : undefined

  return (
    <ProductTile
      image={image}
      title={title}
      subtitle={composed.subtitle}
      badge={badge}
      meta={composed.meta}
      onClick={onClick}
      ariaLabel={labels.ariaCard(title)}
      selected={selected}
      disabled={disabled}
      loading={loading}
    />
  )
}
