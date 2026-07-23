// PREVIEW · detalle de envío con datos de MUESTRA. Misma UI/arte que /transitario/[id].
import { notFound } from 'next/navigation'
import { ShipmentDetailDesk } from '../../../transitario/desk'
import { sampleDetail } from '../sample'

export const metadata = { title: '1503 · Transitario (muestra)' }

export default async function PreviewTransitarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = sampleDetail(id)
  if (!s) notFound()
  return <ShipmentDetailDesk s={s} backHref="/preview/transitario" preview />
}
