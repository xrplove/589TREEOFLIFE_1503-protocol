import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SECTORS } from '../../../data/sectors'
import { verifySameOrigin } from '../../../lib/internal-api-auth'

/**
 * POST /api/registro/choose-sector
 *
 * El Actor recién aprobado (kyc_status='approved') elige su sector tras el
 * KYC. Guarda el sector_id y sector_chosen_at en public.actors. A partir
 * de aquí el middleware ya no redirige a /registro/sector y el Actor puede
 * entrar directamente al WorkspaceShell de su sector.
 *
 * Hardening 23-may (auditoría 100%): se añadió validación same-origin para
 * cerrar CSRF. Como `sector_chosen_at` solo puede setearse una vez (lógica
 * del middleware), un attacker podía forzar al Actor recién aprobado a un
 * sector que no eligió saltándose el onboarding. Origin defense lo bloquea.
 *
 * Solo accesible con sesión válida + same-origin (frontend de la app).
 */
export async function POST(req: NextRequest) {
  // CSRF defense: Origin del request debe coincidir con NEXT_PUBLIC_SITE_URL.
  // Los navegadores modernos añaden Origin en POST cross-origin y no se puede
  // falsear desde JS (header bloqueado por la spec).
  const originCheck = verifySameOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'CSRF check failed: ' + originCheck.reason },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const sectorId = String(body?.sector_id ?? '').trim()

  if (!sectorId) {
    return NextResponse.json({ error: 'Falta sector_id' }, { status: 400 })
  }

  const validSectorIds = new Set(SECTORS.map((s) => s.id))
  if (!validSectorIds.has(sectorId)) {
    return NextResponse.json({ error: 'Sector no válido' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, sector_id: sectorId })
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          res.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { error: updateError } = await supabase
    .from('actors')
    .update({
      sector_id: sectorId,
      sector_chosen_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return res
}
