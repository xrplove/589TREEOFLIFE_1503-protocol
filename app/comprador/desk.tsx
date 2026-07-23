'use client'

/**
 * Escritorio COMPRADOR · sobre el DeskFrame COMPARTIDO.
 *
 * Solo vive aquí el módulo PEDIDOS del comprador (sus compras con documentación,
 * precinto y pago). La cabecera 1503, el switcher, comms y los módulos compartidos
 * (agenda/correo/archivos) los aporta el DeskFrame.
 */

import { useMemo } from 'react'
import { DeskFrame, type DeskRegistry } from '../components/workspace/DeskFrame'
import { type ModuleId } from '../data/sectorDashboardConfig'
import { CompradorModule } from './CompradorModule'
import type { DossierData } from '../transitario/dossier'

export function CompradorDesk({
  dossiers,
  modules,
  roleId,
  hrefBase,
  buyerName,
  preview,
}: {
  dossiers: DossierData[]
  modules: ModuleId[]
  roleId?: string | null
  hrefBase: string
  buyerName?: string
  preview?: boolean
}) {
  const registry: DeskRegistry = useMemo(
    () => ({
      pedidos: {
        eyebrow: 'Escritorio · comprador',
        title: 'Tus pedidos',
        subtitle: 'Tus compras transfronterizas · documentación, autenticidad y pago',
        render: () => <CompradorModule dossiers={dossiers} buyerName={buyerName} />,
      },
    }),
    [dossiers, buyerName],
  )

  return (
    <DeskFrame
      deskLabel="Comprador"
      sectorId="inmobiliario"
      modules={modules}
      registry={registry}
      roleId={roleId}
      hrefBase={hrefBase}
      preview={preview}
    />
  )
}
