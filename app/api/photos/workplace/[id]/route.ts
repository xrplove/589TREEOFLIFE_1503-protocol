import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifySameOrigin } from '../../../../lib/internal-api-auth'

const BUCKET = 'actor-workplace-photos'

/**
 * DELETE /api/photos/workplace/[id]
 *
 * Borra una foto del Actor. Limpieza en dos pasos:
 *   1. Leer la fila para conocer el storage_path (verifica ownership vía RLS).
 *   2. Borrar el objeto del bucket vía Storage API (Supabase prohíbe DELETE
 *      directo sobre storage.objects desde SQL; el trigger original de la
 *      mig. 010 se retira en la mig. 013).
 *   3. Borrar la fila de la tabla. Si el storage falló, NO borramos la fila.
 *
 * Defensas:
 *  - verifySameOrigin (CSRF)
 *  - supabase.auth.getUser() (auth real, no fiarse de la cookie)
 *  - RLS: la policy delete_own ya filtra por auth.uid() = user_id; aún
 *    así filtramos también en la query para defensa en profundidad y
 *    para devolver 404 limpio si el id no es del Actor.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const originCheck = verifySameOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'CSRF check failed: ' + originCheck.reason },
      { status: 403 },
    )
  }

  const { id } = await ctx.params
  if (!id || typeof id !== 'string' || id.length > 64) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
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

  // 1. Localizar la fila + path (verifica ownership vía RLS read_own).
  const { data: row, error: readError } = await supabase
    .from('actor_workplace_photos')
    .select('id, storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  // 2. Borrar el objeto del bucket. Si falla, abortamos: no queremos dejar
  //    storage huérfano sin trazabilidad en la tabla.
  const { error: removeError } = await supabase.storage.from(BUCKET).remove([row.storage_path])
  if (removeError) {
    return NextResponse.json({ error: 'Storage: ' + removeError.message }, { status: 500 })
  }

  // 3. Borrar la fila ahora que el storage está limpio.
  const { error: deleteError } = await supabase
    .from('actor_workplace_photos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: row.id })
}
