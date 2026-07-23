// PREVIEW · escritorio transitario con datos de MUESTRA (sin login, sin BD).
// Misma UI/arte que la ruta real /transitario.
import { TransitarioDesk } from '../../transitario/desk'
import { modulesFor } from '../../data/sectorDashboardConfig'
import { SAMPLE_SHIPMENTS, SAMPLE_DOCS, SAMPLE_ACTORS } from './sample'

export const metadata = { title: '1503 · Transitario (muestra)' }

const SAMPLE_ROLE = 'transitarios-mar'

export default function PreviewTransitarioPage() {
  const modules = modulesFor({ roleId: SAMPLE_ROLE })
  return (
    <TransitarioDesk
      shipments={SAMPLE_SHIPMENTS}
      documents={SAMPLE_DOCS}
      actors={SAMPLE_ACTORS}
      modules={modules}
      roleId={SAMPLE_ROLE}
      hrefBase="/preview/transitario"
      preview
    />
  )
}
