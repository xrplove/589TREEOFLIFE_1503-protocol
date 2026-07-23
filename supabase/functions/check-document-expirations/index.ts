// Edge Function: check-document-expirations
// Path: supabase/functions/check-document-expirations/index.ts
// Runtime: Deno (Supabase Edge Functions)
// Purpose: Background job diario que actualiza lifecycle de actor_documents:
//   - Marca status='expiring_soon' a documentos con expires_at <= now() + 30 días
//   - Marca status='expired' a documentos con expires_at < now()
//   - Envía email transaccional al actor con docs expiring/expired
//
// TRIGGER · SCHEDULED CRON
// ------------------------
// Configurar en Supabase Dashboard → Edge Functions → schedule:
//   "Run daily at 06:00 UTC"
//
// O configurar via supabase CLI:
//   supabase functions deploy check-document-expirations --schedule "0 6 * * *"
//
// FLUJO
// -----
// 1. Setup Supabase service_role client
// 2. Query actor_documents con status='valid' y expires_at <= now() + 30d
//    → Update a status='expiring_soon'
// 3. Query actor_documents con status in ('valid','expiring_soon') y expires_at < now()
//    → Update a status='expired'
// 4. Agrupa por actor_user_id
// 5. Envía email vía Resend con lista de docs afectados
// 6. Devuelve summary { expiring_soon_count, expired_count, emails_sent }
//
// MATIZ CANÓNICO
// --------------
// - Audit-Ready by Design: notifica con tiempo (30 días) para que el actor
//   pueda renovar antes de bloqueo
// - PII off-chain: el email vehicula info al actor · NO se ancla nada
// - Append-only respetado: usa advance_document_status() para bypass trigger

// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

interface SummaryResponse {
  ok: boolean
  expiring_soon_marked: number
  expired_marked: number
  emails_sent: number
  errors: string[]
  duration_ms: number
}

serve(async (_req: Request) => {
  const startTime = Date.now()
  const errors: string[] = []
  let expiringSoonMarked = 0
  let expiredMarked = 0
  let emailsSent = 0

  try {
    // 1. Setup service_role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse(
        { ok: false, errors: ['SUPABASE env vars missing'] },
        500,
      )
    }

    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 2. Calcular fechas frontera
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const nowIso = now.toISOString().slice(0, 10)
    const in30DaysIso = in30Days.toISOString().slice(0, 10)

    // 3. Marcar 'expiring_soon' (valid con vencimiento próximo)
    const { data: expiringDocs, error: expiringErr } = await sb
      .from('actor_documents')
      .select('id, actor_user_id, requirement_id, expires_at')
      .eq('status', 'valid')
      .lte('expires_at', in30DaysIso)
      .gte('expires_at', nowIso)

    if (expiringErr) {
      errors.push(`Query expiring failed: ${expiringErr.message}`)
    } else if (expiringDocs && expiringDocs.length > 0) {
      // Bulk update vía RPC (mejor que individual updates)
      for (const doc of expiringDocs) {
        const { error } = await sb.rpc('advance_document_status', {
          p_document_id: doc.id,
          p_new_status: 'expiring_soon',
          p_status_reason: `Auto-flagged · expires ${doc.expires_at} (≤30 days)`,
          p_actor_user_id: doc.actor_user_id,
        })
        if (error) {
          errors.push(`Advance to expiring_soon failed for ${doc.id}: ${error.message}`)
        } else {
          expiringSoonMarked++
        }
      }
    }

    // 4. Marcar 'expired' (valid o expiring_soon ya vencidos)
    const { data: expiredDocs, error: expiredErr } = await sb
      .from('actor_documents')
      .select('id, actor_user_id, requirement_id, expires_at')
      .in('status', ['valid', 'expiring_soon'])
      .lt('expires_at', nowIso)

    if (expiredErr) {
      errors.push(`Query expired failed: ${expiredErr.message}`)
    } else if (expiredDocs && expiredDocs.length > 0) {
      for (const doc of expiredDocs) {
        const { error } = await sb.rpc('advance_document_status', {
          p_document_id: doc.id,
          p_new_status: 'expired',
          p_status_reason: `Auto-flagged · expired ${doc.expires_at}`,
          p_actor_user_id: doc.actor_user_id,
        })
        if (error) {
          errors.push(`Advance to expired failed for ${doc.id}: ${error.message}`)
        } else {
          expiredMarked++
        }
      }
    }

    // 5. Email notification (placeholder · pendiente integración Resend)
    // En producción: agrupar por actor_user_id + enviar email único con lista
    // de docs afectados. Por ahora · solo log para futura integración.
    //
    // const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // if (resendApiKey && (expiringDocs?.length || expiredDocs?.length)) {
    //   const byActor = groupByActor([...expiringDocs ?? [], ...expiredDocs ?? []])
    //   for (const [actorId, docs] of byActor) {
    //     await sendExpirationEmail(resendApiKey, actorId, docs)
    //     emailsSent++
    //   }
    // }

    // 6. Response
    const duration = Date.now() - startTime
    const response: SummaryResponse = {
      ok: errors.length === 0,
      expiring_soon_marked: expiringSoonMarked,
      expired_marked: expiredMarked,
      emails_sent: emailsSent,
      errors,
      duration_ms: duration,
    }

    return jsonResponse(response, errors.length === 0 ? 200 : 207)
  } catch (e) {
    console.error('check-document-expirations fatal error:', e)
    return jsonResponse(
      {
        ok: false,
        errors: [`Fatal: ${e instanceof Error ? e.message : String(e)}`],
        duration_ms: Date.now() - startTime,
      },
      500,
    )
  }
})

function jsonResponse(body: any, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
