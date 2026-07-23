// API Route · GET /api/me/missing-documents
//
// Fase 1.8 · UX bloqueo claro + IA guía documentos faltantes.
//
// FLUJO
// -----
// 1. Verifica JWT del caller
// 2. Recupera perfil del actor (sector · subsector · rol · país · legal_entity_kind)
// 3. Calcula requirements aplicables vía getApplicableRequirements
// 4. Para cada requirement · verifica si el actor lo tiene en actor_documents
//    con status válido (valid o expiring_soon)
// 5. Devuelve lista de documentos faltantes + estado de los presentes
//
// QUERY PARAMS
// ------------
//   - lang: idioma para mensajes user-friendly (default: 'es')
//   - operation: filtrar solo docs que bloquean operación específica
//     (listing | purchase | transport | escrow_release)
//
// RESPONSE
// --------
// {
//   actor_profile: { sector_id, subsector_id, role_id, country_code, legal_entity_kind },
//   missing_documents: [
//     { requirement_id, document_type, label, action_required, severity, help_url }
//   ],
//   expiring_soon_documents: [...],
//   expired_documents: [...],
//   valid_documents: [...],
//   total_required: int,
//   total_missing: int,
//   blocked_operations: ['listing', 'transport', ...]
// }

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import {
  getApplicableRequirements,
  getBlockingRequirements,
  type SectorDocumentRequirement,
} from '@/app/data/sectorDocumentRequirements'
import type { Lang } from '@/app/data/actorGroups'

interface ActorProfile {
  sector_id?: string
  subsector_id?: string
  role_id?: string
  country_code?: string
  legal_entity_kind?: 'individual' | 'company'
}

interface ActorDocumentStatus {
  requirement_id: string
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'under_review' | 'rejected'
  expires_at: string | null
}

interface MissingDocumentInfo {
  requirement_id: string
  document_type: string
  label: string
  description: string
  issuer_authority: string
  issuer_authority_url?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  legal_basis: string
}

const VALID_LANGS: Lang[] = ['es', 'en', 'fr', 'de', 'it', 'pt', 'zh', 'ja']

export async function GET(req: NextRequest) {
  // 1. Setup Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 },
    )
  }

  // 2. Parse query params
  const params = req.nextUrl.searchParams
  const langParam = params.get('lang')?.trim() ?? 'es'
  const lang: Lang = VALID_LANGS.includes(langParam as Lang) ? (langParam as Lang) : 'es'
  const operationParam = params.get('operation')?.trim()
  const operation = ['listing', 'purchase', 'transport', 'escrow_release'].includes(
    operationParam ?? '',
  )
    ? (operationParam as 'listing' | 'purchase' | 'transport' | 'escrow_release')
    : null

  // 3. Authenticate caller
  const res = NextResponse.json({ ok: true })
  const sb = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        )
      },
    },
  })

  const { data: { user }, error: authError } = await sb.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthenticated · Bearer JWT required' },
      { status: 401 },
    )
  }

  // 4. Get actor profile
  const { data: actorData, error: actorError } = await sb
    .from('actors')
    .select('sector_id, subsector_id, role_id, country_code, entity_kind')
    .eq('user_id', user.id)
    .single()

  if (actorError || !actorData) {
    return NextResponse.json(
      { error: 'Actor profile not found · complete onboarding first' },
      { status: 404 },
    )
  }

  const actorProfile: ActorProfile = {
    sector_id: actorData.sector_id ?? undefined,
    subsector_id: actorData.subsector_id ?? undefined,
    role_id: actorData.role_id ?? undefined,
    country_code: actorData.country_code ?? undefined,
    legal_entity_kind: actorData.entity_kind === 'company' || actorData.entity_kind === 'individual'
      ? actorData.entity_kind
      : undefined,
  }

  // 5. Get applicable requirements
  const applicableRequirements: SectorDocumentRequirement[] = operation
    ? getBlockingRequirements(actorProfile, operation)
    : getApplicableRequirements(actorProfile)

  // 6. Get actor's existing documents
  const requirementIds = applicableRequirements.map((r) => r.id)
  const { data: existingDocs, error: docsError } = await sb
    .from('actor_documents')
    .select('requirement_id, status, expires_at')
    .eq('actor_user_id', user.id)
    .in('requirement_id', requirementIds)
    .in('status', ['valid', 'expiring_soon', 'expired', 'pending', 'under_review', 'rejected'])

  if (docsError) {
    return NextResponse.json(
      { error: `Database query failed: ${docsError.message}` },
      { status: 500 },
    )
  }

  const docsByRequirement = new Map<string, ActorDocumentStatus>()
  if (existingDocs) {
    for (const doc of existingDocs) {
      // Mantener el más reciente si hay duplicados (status valid > expired)
      const existing = docsByRequirement.get(doc.requirement_id)
      if (!existing || (doc.status === 'valid' && existing.status !== 'valid')) {
        docsByRequirement.set(doc.requirement_id, doc as ActorDocumentStatus)
      }
    }
  }

  // 7. Classify documents
  const missing: MissingDocumentInfo[] = []
  const expiringSoon: MissingDocumentInfo[] = []
  const expired: MissingDocumentInfo[] = []
  const valid: { requirement_id: string; expires_at: string | null }[] = []
  const blockedOperations = new Set<string>()

  for (const req of applicableRequirements) {
    const existing = docsByRequirement.get(req.id)

    const info: MissingDocumentInfo = {
      requirement_id: req.id,
      document_type: req.document_type,
      label: req.label[lang] || req.label.en || req.label.es,
      description: req.description[lang] || req.description.en || req.description.es,
      issuer_authority: req.issuer_authority[lang] || req.issuer_authority.en || req.issuer_authority.es,
      issuer_authority_url: req.issuer_authority_url,
      severity: req.mandatory ? 'critical' : 'warning',
      legal_basis: req.legal_basis,
    }

    if (!existing) {
      // No subido
      missing.push(info)
      if (req.mandatory && req.blocks_operation_if_missing.length > 0) {
        for (const op of req.blocks_operation_if_missing) {
          blockedOperations.add(op)
        }
      }
    } else if (existing.status === 'expired') {
      expired.push({ ...info, severity: 'critical' })
      if (req.mandatory && req.blocks_operation_if_missing.length > 0) {
        for (const op of req.blocks_operation_if_missing) {
          blockedOperations.add(op)
        }
      }
    } else if (existing.status === 'expiring_soon') {
      expiringSoon.push({ ...info, severity: 'warning' })
    } else if (existing.status === 'valid') {
      valid.push({ requirement_id: req.id, expires_at: existing.expires_at })
    }
    // 'pending' · 'under_review' · 'rejected' se omiten del missing pero no son válidos
    // (UI puede mostrarlos en otra sección si surge necesidad)
  }

  return NextResponse.json({
    ok: true,
    actor_profile: actorProfile,
    missing_documents: missing,
    expiring_soon_documents: expiringSoon,
    expired_documents: expired,
    valid_documents: valid,
    total_required: applicableRequirements.length,
    total_missing: missing.length + expired.length,
    blocked_operations: Array.from(blockedOperations),
    lang_used: lang,
  })
}

// Otros métodos no soportados
export async function POST() {
  return NextResponse.json(
    { error: 'POST not supported · use GET' },
    { status: 405 },
  )
}
