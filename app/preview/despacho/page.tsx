// PREVIEW · escritorio LEGAL (despacho) sin login. Misma UI/chrome que /despacho.
import { LegalDesk } from '../../despacho/desk'
import { modulesFor } from '../../data/sectorDashboardConfig'

export const metadata = { title: '1503 · Despacho legal (muestra)' }

export default function PreviewDespachoPage() {
  const modules = modulesFor({ sectorId: 'legal' })
  return <LegalDesk modules={modules} roleId="abogados" hrefBase="/preview/despacho" preview />
}
