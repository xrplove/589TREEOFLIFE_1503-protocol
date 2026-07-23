import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { verifySameOrigin } from '../../../lib/internal-api-auth'

/**
 * PATCH /api/actors/me — el Actor edita sus propias preferencias de
 * visibilidad (opt-out RGPD, mig. 015).
 *
 * Body (todos opcionales, se aplica lo que venga):
 *   { visible_in_directory: boolean }
 *
 * Devuelve el estado actualizado de los campos editables.
 *
 * Por ahora solo se permite cambiar `visible_in_directory`. Si en el futuro
 * se añaden más preferencias (idioma, notificaciones, contrapartes públicas)
 * se amplía aquí. Mantener la lista permitida explícita — nunca aceptar
 * "todo lo que venga del body" (riesgo de mass-assignment a campos PII).
 *
 * No requiere kyc_status='approved': un Actor en cualquier estado puede
 * gestionar su visibilidad. Pero sí requiere sesión válida (Art. 7 RGPD).
 */

type Patchable = {
  visible_in_directory?: boolean
  trajectory_visible?: boolean
  employer_company_name?: string | null
}

export async function PATCH(req: NextRequest) {
  const originCheck = verifySameOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'CSRF check failed: ' + originCheck.reason },
      { status: 403 },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  const sbAuth = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          res.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
    error: authErr,
  } = await sbAuth.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Allowlist explícita: solo se aceptan los flags de visibilidad RGPD.
  // Nunca expandir esta lista sin pensarlo dos veces — esta es la puerta
  // por la que el Actor edita su propia fila, y la BD tiene PII (tax_id,
  // email, address) que NO debe ser editable vía este endpoint.
  const patch: Patchable = {}
  const incoming = body as Record<string, unknown>
  if ('visible_in_directory' in incoming) {
    if (typeof incoming.visible_in_directory !== 'boolean') {
      return NextResponse.json(
        { error: 'visible_in_directory must be boolean' },
        { status: 400 },
      )
    }
    patch.visible_in_directory = incoming.visible_in_directory
  }
  if ('trajectory_visible' in incoming) {
    if (typeof incoming.trajectory_visible !== 'boolean') {
      return NextResponse.json(
        { error: 'trajectory_visible must be boolean' },
        { status: 400 },
      )
    }
    patch.trajectory_visible = incoming.trajectory_visible
  }
  if ('employer_company_name' in incoming) {
    const val = incoming.employer_company_name
    if (val === null || val === '') {
      patch.employer_company_name = null
    } else if (typeof val === 'string') {
      const trimmed = val.trim()
      if (trimmed.length < 2 || trimmed.length > 200) {
        return NextResponse.json(
          { error: 'employer_company_name length must be 2-200 characters' },
          { status: 400 },
        )
      }
      patch.employer_company_name = trimmed
    } else {
      return NextResponse.json(
        { error: 'employer_company_name must be string or null' },
        { status: 400 },
      )
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No editable fields in body' }, { status: 400 })
  }

  // Service role para escribir (la RLS solo deja al Actor tocar su propia
  // fila, pero la columna visible_in_directory es nueva — pasamos por
  // service_role para no depender de que el cliente refresque su sesión).
  const sbAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: updated, error: updErr } = await sbAdmin
    .from('actors')
    .update(patch)
    .eq('user_id', user.id)
    .select('user_id, visible_in_directory, trajectory_visible, employer_company_name')
    .single()

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 502 })
  }
  if (!updated) {
    return NextResponse.json({ error: 'Actor not found' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    actor: {
      user_id: updated.user_id,
      visible_in_directory: updated.visible_in_directory,
      trajectory_visible: updated.trajectory_visible,
      employer_company_name: updated.employer_company_name,
    },
  })
}
