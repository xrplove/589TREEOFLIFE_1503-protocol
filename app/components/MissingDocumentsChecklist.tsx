'use client'

// MissingDocumentsChecklist · UI visual checklist documentos faltantes
//
// Fase 1.8 · UX bloqueo claro + IA guía
//
// USO desde Server Component:
//   import dynamic from 'next/dynamic'
//
//   const MissingDocumentsChecklist = dynamic(
//     () => import('@/app/components/MissingDocumentsChecklist'),
//     { ssr: false }
//   )
//
//   <MissingDocumentsChecklist lang="es" operation="listing" />
//
// PATRÓN CANÓNICO Next.js modificado
// ----------------------------------
// 'use client' obligatorio (usa useState · useEffect · fetch).

import { useEffect, useState } from 'react'

import type { Lang } from '@/app/data/actorGroups'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface MissingDocumentInfo {
  requirement_id: string
  document_type: string
  label: string
  description: string
  issuer_authority: string
  issuer_authority_url?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  legal_basis: string
}

export interface MissingDocumentsApiResponse {
  ok: boolean
  missing_documents: MissingDocumentInfo[]
  expiring_soon_documents: MissingDocumentInfo[]
  expired_documents: MissingDocumentInfo[]
  valid_documents: { requirement_id: string; expires_at: string | null }[]
  total_required: number
  total_missing: number
  blocked_operations: string[]
  lang_used: Lang
}

// Alias interno usado por el componente y los sub-componentes.
type ApiResponse = MissingDocumentsApiResponse

export interface MissingDocumentsChecklistProps {
  /** Idioma de los mensajes. */
  lang?: Lang
  /** Filtrar solo docs que bloquean operación específica. */
  operation?: 'listing' | 'purchase' | 'transport' | 'escrow_release'
  /** Compact mode (sin descripción · solo título). */
  compact?: boolean
  /** Datos pre-poblados. Si se proporciona, se renderiza sin fetch a la API.
      Útil para demos · presentaciones inversores R0 · y tests. Cuando llegan
      las migraciones 028-031 a producción se omite y se hace fetch real. */
  initialData?: ApiResponse | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function MissingDocumentsChecklist({
  lang = 'es',
  operation,
  compact = false,
  initialData,
}: MissingDocumentsChecklistProps): React.ReactElement {
  const [data, setData] = useState<ApiResponse | null>(initialData ?? null)
  const [loading, setLoading] = useState(initialData ? false : true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si recibimos initialData, NO disparamos fetch — modo demo / SSR-friendly.
    // El estado ya se inicializó con initialData (useState arriba), así que no
    // hace falta volver a setearlo aquí: solo evitamos el fetch.
    if (initialData) {
      return
    }

    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ lang })
        if (operation) params.set('operation', operation)
        const res = await fetch(`/api/me/missing-documents?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json: ApiResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [lang, operation, initialData])

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          {lang === 'es' ? 'Cargando documentación...' : 'Loading documents...'}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          {lang === 'es' ? 'Error: ' : 'Error: '}{error}
        </p>
      </div>
    )
  }

  if (!data) return <></>

  const allOk = data.total_missing === 0 && data.expired_documents.length === 0

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div
        className={`rounded-lg border p-4 ${
          allOk
            ? 'border-green-200 bg-green-50'
            : data.blocked_operations.length > 0
            ? 'border-red-200 bg-red-50'
            : 'border-yellow-200 bg-yellow-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {allOk
              ? lang === 'es'
                ? '✓ Documentación completa'
                : '✓ Documentation complete'
              : lang === 'es'
              ? '⚠ Documentación pendiente'
              : '⚠ Pending documentation'}
          </h3>
          <span className="text-sm">
            {data.valid_documents.length} / {data.total_required}
          </span>
        </div>
        {data.blocked_operations.length > 0 && (
          <p className="mt-2 text-sm">
            {lang === 'es' ? 'Operaciones bloqueadas: ' : 'Blocked operations: '}
            <span className="font-medium">{data.blocked_operations.join(' · ')}</span>
          </p>
        )}
      </div>

      {/* Expired (más crítico · arriba) */}
      {data.expired_documents.length > 0 && (
        <DocumentSection
          title={
            lang === 'es'
              ? `Documentos caducados (${data.expired_documents.length})`
              : `Expired documents (${data.expired_documents.length})`
          }
          docs={data.expired_documents}
          severity="critical"
          compact={compact}
          lang={lang}
        />
      )}

      {/* Missing (crítico) */}
      {data.missing_documents.length > 0 && (
        <DocumentSection
          title={
            lang === 'es'
              ? `Documentos requeridos faltantes (${data.missing_documents.length})`
              : `Missing required documents (${data.missing_documents.length})`
          }
          docs={data.missing_documents}
          severity="error"
          compact={compact}
          lang={lang}
        />
      )}

      {/* Expiring soon (warning) */}
      {data.expiring_soon_documents.length > 0 && (
        <DocumentSection
          title={
            lang === 'es'
              ? `Documentos próximos a vencer (${data.expiring_soon_documents.length})`
              : `Documents expiring soon (${data.expiring_soon_documents.length})`
          }
          docs={data.expiring_soon_documents}
          severity="warning"
          compact={compact}
          lang={lang}
        />
      )}

      {/* Help footer */}
      <p className="text-xs text-gray-500">
        {lang === 'es'
          ? 'Sube los documentos faltantes desde tu escritorio profesional · Estado actualizado en tiempo real.'
          : 'Upload missing documents from your dashboard · Status updated in real-time.'}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ════════════════════════════════════════════════════════════════════════════

function DocumentSection({
  title,
  docs,
  severity,
  compact,
  lang,
}: {
  title: string
  docs: MissingDocumentInfo[]
  severity: 'critical' | 'error' | 'warning'
  compact: boolean
  lang: Lang
}): React.ReactElement {
  const colors = {
    critical: 'border-red-300 bg-red-50',
    error: 'border-orange-300 bg-orange-50',
    warning: 'border-yellow-300 bg-yellow-50',
  }[severity]

  return (
    <div className={`rounded-lg border p-4 ${colors}`}>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2">
        {docs.map((doc) => (
          <li
            key={doc.requirement_id}
            className="rounded border border-white bg-white/50 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{doc.label}</p>
                {!compact && (
                  <>
                    <p className="mt-1 text-xs text-gray-700">{doc.description}</p>
                    <p className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">
                        {lang === 'es' ? 'Emite: ' : 'Issuer: '}
                      </span>
                      {doc.issuer_authority}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">
                        {lang === 'es' ? 'Base legal: ' : 'Legal basis: '}
                      </span>
                      {doc.legal_basis}
                    </p>
                  </>
                )}
              </div>
              {doc.issuer_authority_url && (
                <a
                  href={doc.issuer_authority_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  {lang === 'es' ? 'Solicitar →' : 'Request →'}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
