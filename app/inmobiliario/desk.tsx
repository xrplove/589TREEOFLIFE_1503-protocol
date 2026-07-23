'use client'

/**
 * Escritorio VENDEDOR (inmobiliario) · montado sobre el DeskFrame COMPARTIDO.
 *
 * Igual que el transitario y el legal: la cabecera 1503, el switcher de sector,
 * el cluster de comms y los módulos compartidos (agenda/correo/archivos) los
 * aporta el DeskFrame. Aquí solo vive el módulo ESPECÍFICO del vendedor:
 * el CATÁLOGO (público/privado, con DPP y preparación 2028).
 *
 * Los demás módulos del set de inmobiliario (pedidos, dpp, exportación,
 * compliance, …) aún no tienen impl real → el DeskFrame los muestra como panel
 * honesto "vive en otro sitio", sin fingir dato. Se irán cableando en orden.
 */

import { useMemo } from 'react'
import { DeskFrame, type DeskRegistry } from '../components/workspace/DeskFrame'
import { type ModuleId } from '../data/sectorDashboardConfig'
import { CatalogoModule } from './CatalogoModule'
import type { TenantCatalog } from './catalogo'

export function InmobiliarioDesk({
  catalog,
  modules,
  roleId,
  hrefBase,
  tenantName,
  canPublish = true,
  preview,
}: {
  catalog: TenantCatalog
  modules: ModuleId[]
  roleId?: string | null
  hrefBase: string
  tenantName?: string
  canPublish?: boolean
  preview?: boolean
}) {
  const registry: DeskRegistry = useMemo(
    () => ({
      catalogo: {
        eyebrow: 'Escritorio · vendedor',
        title: 'Catálogo',
        subtitle: 'Tus productos · decide cuáles son públicos (cruzan al hub Global) y cuáles privados',
        render: () => <CatalogoModule catalog={catalog} canPublish={canPublish} tenantName={tenantName} />,
      },
    }),
    [catalog, canPublish, tenantName],
  )

  return (
    <DeskFrame
      deskLabel="Vendedor"
      sectorId="inmobiliario"
      modules={modules}
      registry={registry}
      roleId={roleId}
      hrefBase={hrefBase}
      preview={preview}
    />
  )
}
