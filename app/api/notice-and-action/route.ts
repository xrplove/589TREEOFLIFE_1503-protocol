// API Route · POST /api/notice-and-action
//
// Recibe denuncias (Notices) sobre productos · actores · contenido conforme a:
//   - GPSR Reg. UE 2023/988 Art. 22 (productos peligrosos · SLA 2 días hábiles)
//   - DSA Reg. UE 2022/2065 Art. 16 (Notice and Action obligatorio)
//   - P2B Reg. UE 2019/1150 Art. 4 (notificación motivada al vendedor afectado)
//
// FLUJO (en orden · cualquier fallo aborta y devuelve 4xx)
// -------------------------------------------------------
// 1. Rate limit · 5 Notices/IP/hora · 50/IP/día (prevenir spam)
// 2. Validación Zod del body
// 3. Hash SHA-256 de la IP del denunciante (PII off-chain canónico)
// 4. Cálculo de prioridad según notifier_relationship
// 5. Cálculo SLA expira at (2 días hábiles GPSR Art. 22)
// 6. INSERT en notices con service_role
// 7. Devuelve notice_id + sla_expires_at (acuse de recibo)
// 8. (Async background) si trusted_flagger · alerta inmediata operador
//
// NOTAS DE IMPLEMENTACIÓN
// -----------------------
// - Notices anónimos PERMITIDOS (DSA permite · pero menor prioridad)
// - notifier_email opcional · si dado, futuro envío de SoR
// - Sin verificación de captcha v1 (añadir hCaptcha self-host si surge spam)
//
// NEXT.JS APP ROUTER
// ------------------
// File path = ruta · este archivo está en app/api/notice-and-action/route.ts
// → endpoint = POST /api/notice-and-action

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { clientIpFromHeaders, clientUserAgent } from '../../lib/request-ip'

// Rate limit (GPSR/DSA · prevenir spam de la tabla append-only `notices`).
const RATE_LIMIT_PER_HOUR = 5
const RATE_LIMIT_PER_DAY = 50

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN ZOD
// ════════════════════════════════════════════════════════════════════════════

const NoticeTargetTypeSchema = z.enum(['product', 'actor', 'content', 'external_url'])

const NotifierRelationshipSchema = z.enum([
  'consumer',
  'authority',
  'competitor',
  'trusted_flagger',
  'anonymous',
  'other',
])

const NoticeBodySchema = z
  .object({
    // Denunciante (todo opcional · anónimos permitidos · DSA).
    notifier_email: z
      .string()
      .email('notifier_email debe ser email válido')
      .max(320)
      .optional(),
    notifier_name: z.string().min(1).max(200).optional(),
    notifier_relationship: NotifierRelationshipSchema.default('consumer'),

    // Target.
    target_type: NoticeTargetTypeSchema,
    target_id: z.string().uuid('target_id debe ser UUID v4').optional(),
    target_external_url: z.string().url('target_external_url debe ser URL válida').optional(),

    // Contenido del Notice.
    category: z
      .string()
      .min(2, 'category mínimo 2 chars')
      .max(64, 'category máximo 64 chars'),
    description: z
      .string()
      .min(10, 'description mínimo 10 chars (DSA Art. 16.2.b)')
      .max(10000, 'description máximo 10000 chars'),
    evidence_urls: z.array(z.string().url()).max(20).optional(),
    legal_basis: z
      .string()
      .min(2, 'legal_basis es obligatorio (DSA Art. 16.2.c)')
      .max(200),
  })
  .refine(
    (data) => {
      // Si target_type='external_url', target_external_url es obligatorio.
      if (data.target_type === 'external_url') {
        return data.target_external_url !== undefined
      }
      // Si target_type es product/actor/content, target_id obligatorio.
      return data.target_id !== undefined
    },
    {
      message:
        'target_id obligatorio para target_type product/actor/content · target_external_url obligatorio para target_type external_url',
      path: ['target_id'],
    },
  )
  .refine(
    (data) => {
      // Si declara trusted_flagger, debe dar email (necesario para verificar status).
      if (data.notifier_relationship === 'trusted_flagger') {
        return data.notifier_email !== undefined && data.notifier_name !== undefined
      }
      return true
    },
    {
      message: 'trusted_flagger requiere notifier_email + notifier_name para verificar status DSA Art. 22',
      path: ['notifier_email'],
    },
  )

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Hash SHA-256 de la IP del denunciante (PII off-chain).
 * El IP original NUNCA se guarda · solo el hash para auditoría forense.
 */
function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

/**
 * Calcula prioridad del Notice según notifier_relationship.
 * 10 = top · 0 = bottom.
 */
function computePriority(relationship: z.infer<typeof NotifierRelationshipSchema>): number {
  switch (relationship) {
    case 'trusted_flagger': return 10  // DSA Art. 22 · prioridad obligatoria
    case 'authority': return 8
    case 'consumer': return 3
    case 'competitor': return 2
    case 'anonymous': return 1
    case 'other':
    default: return 1
  }
}

/**
 * Calcula timestamp de expiración SLA · 2 días hábiles (GPSR Art. 22).
 *
 * "Días hábiles" = de lunes a viernes excluyendo festivos. Para v1 usamos
 * implementación simple (5 días laborables sin festivos). En producción
 * integrar con calendario AEAT/Banco de España para precisión.
 */
function computeSlaExpiresAt(receivedAt: Date): Date {
  const result = new Date(receivedAt)
  let businessDaysAdded = 0
  while (businessDaysAdded < 2) {
    result.setUTCDate(result.getUTCDate() + 1)
    const day = result.getUTCDay()
    if (day !== 0 && day !== 6) {
      // No es domingo (0) ni sábado (6).
      businessDaysAdded++
    }
  }
  return result
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER · POST
// ════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  // 1. Setup Supabase service_role (cliente con permisos para INSERT en notices).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Server misconfigured · SUPABASE env vars missing' },
      { status: 500 },
    )
  }

  // Cliente service_role (lo necesitamos ya para el rate limit).
  const sb = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 2. Forensics (modelo de confianza explícito · IP no spoofeable en prod).
  const clientIp = clientIpFromHeaders(req.headers)
  const ipHash = clientIp ? hashIp(clientIp) : null
  const userAgent = clientUserAgent(req)

  // 3. Rate limit · 5 Notices/IP/hora · 50/IP/día (best-effort sobre la tabla
  //    append-only `notices`). Si no hay IP de confianza (sin CDN/edge, dev sin
  //    TRUST_FORWARDED_FOR), no se puede limitar por IP → se deja pasar. En prod
  //    (Vercel) siempre hay ipHash. Conteo basado en filas: ante ráfagas
  //    concurrentes puede colarse alguna de más, pero frena el spam sostenido.
  if (ipHash) {
    const nowMs = Date.now()
    const hourAgo = new Date(nowMs - 60 * 60 * 1000).toISOString()
    const dayAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString()

    const [{ count: lastHour }, { count: lastDay }] = await Promise.all([
      sb
        .from('notices')
        .select('id', { count: 'exact', head: true })
        .eq('received_ip_hash', ipHash)
        .gte('received_at', hourAgo),
      sb
        .from('notices')
        .select('id', { count: 'exact', head: true })
        .eq('received_ip_hash', ipHash)
        .gte('received_at', dayAgo),
    ])

    if ((lastHour ?? 0) >= RATE_LIMIT_PER_HOUR || (lastDay ?? 0) >= RATE_LIMIT_PER_DAY) {
      return NextResponse.json(
        { error: 'Too many notices from this IP · try again later' },
        { status: 429, headers: { 'Retry-After': '3600' } },
      )
    }
  }

  // 4. Parse body.
  let body: unknown
  try {
    body = await req.json()
  } catch (_e) {
    return NextResponse.json(
      { error: 'Body must be valid JSON' },
      { status: 400 },
    )
  }

  // 5. Validate.
  const parsed = NoticeBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((iss) => ({
          path: iss.path,
          message: iss.message,
        })),
      },
      { status: 400 },
    )
  }
  const data = parsed.data

  // 6. Receive timestamp + SLA.
  const receivedAt = new Date()
  const slaExpiresAt = computeSlaExpiresAt(receivedAt)
  const priority = computePriority(data.notifier_relationship)

  // Intenta obtener user_id si el caller está autenticado.
  let notifierUserId: string | null = null
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7)
      const { data: userData } = await sb.auth.getUser(token)
      notifierUserId = userData.user?.id ?? null
    } catch (_e) {
      // Token inválido · seguimos como anónimo.
      notifierUserId = null
    }
  }

  const { data: inserted, error: insertError } = await sb
    .from('notices')
    .insert({
      notifier_email: data.notifier_email ?? null,
      notifier_name: data.notifier_name ?? null,
      notifier_relationship: data.notifier_relationship,
      notifier_user_id: notifierUserId,
      target_type: data.target_type,
      target_id: data.target_id ?? null,
      target_external_url: data.target_external_url ?? null,
      category: data.category,
      description: data.description,
      evidence_urls: data.evidence_urls ?? null,
      legal_basis: data.legal_basis,
      received_at: receivedAt.toISOString(),
      received_ip_hash: ipHash,
      received_user_agent: userAgent,
      received_timezone: 'UTC',
      sla_expires_at: slaExpiresAt.toISOString(),
      priority,
      status: 'received',
    })
    .select('id, sla_expires_at, priority')
    .single()

  if (insertError || !inserted) {
    console.error('Notice insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to record notice' },
      { status: 500 },
    )
  }

  // 7. Acuse de recibo (DSA Art. 16.4).
  return NextResponse.json(
    {
      ok: true,
      notice_id: inserted.id,
      received_at: receivedAt.toISOString(),
      sla_expires_at: inserted.sla_expires_at,
      priority: inserted.priority,
      next_steps: {
        message:
          'Notice received and registered. 1503 reviewing under GPSR Art. 22 / DSA Art. 16.',
        sla_business_days: 2,
        contact_url: '/legal/notice-and-action',
      },
    },
    { status: 201 },
  )
}

// Otros métodos no soportados.
export async function GET() {
  return NextResponse.json(
    { error: 'GET not supported · use POST to submit a Notice' },
    { status: 405 },
  )
}
