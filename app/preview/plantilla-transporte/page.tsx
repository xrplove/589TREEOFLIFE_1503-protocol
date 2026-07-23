// PREVIEW · el sector TRANSPORTE dentro de la PLANTILLA inmobiliaria (WorkspaceShell).
// Demuestra la Fase A: cada sector hereda las virtudes de inmobiliario (ID Digital,
// catálogo/actores/buscador filtrados, comms, agenda) y AÑADE sus funciones propias
// (Carga/cubicaje, Custodia, Documentación, Exportación). Datos de muestra, sin login.
import WorkspaceShell from '../../components/WorkspaceShell'
import { getSector } from '../../data/sectors'
import { SAMPLE_SHIPMENTS, SAMPLE_DOCS, SAMPLE_ACTORS } from '../transitario/sample'

export const metadata = { title: '1503 · Plantilla · Transporte (muestra)' }

export default function PreviewPlantillaTransportePage() {
  const sector = getSector('transporte')
  if (!sector) return null
  return (
    <WorkspaceShell
      sector={sector}
      sectorData={{
        shipments: SAMPLE_SHIPMENTS,
        documents: SAMPLE_DOCS,
        actors: SAMPLE_ACTORS,
        roleId: 'transitarios-mar',
        hrefBase: '/preview/transitario',
      }}
    />
  )
}
