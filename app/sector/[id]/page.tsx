import { notFound } from 'next/navigation'
import WorkspaceShell from '../../components/WorkspaceShell'
import { SECTORS, getSector } from '../../data/sectors'

export function generateStaticParams() {
  return SECTORS.map((s) => ({ id: s.id }))
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sector = getSector(id)
  if (!sector) notFound()

  // El fondo lo gestiona WorkspaceShell (reactivo a la pestaña activa).
  return <WorkspaceShell sector={sector} />
}
