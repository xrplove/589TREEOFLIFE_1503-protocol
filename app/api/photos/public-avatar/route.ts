import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { verifySameOrigin } from '../../../lib/internal-api-auth'

/**
 * Endpoint de la foto PÚBLICA del Actor (avatar individual / logo empresa).
 *
 *  POST   /api/photos/public-avatar  → subir/reemplazar (multipart "file")
 *  DELETE /api/photos/public-avatar  → quitar avatar
 *
 * Diferencia crítica con /api/photos/workplace:
 *  - Workplace: galería privada del puesto (hasta 3 fotos, solo el propio Actor las ve).
 *  - Public avatar: UNA foto pública en la ficha (visible a otros KYC).
 *  NUNCA confundir los dos buckets — son aislados por diseño.
 *
 * Mitigaciones server-side (mismas que workplace):
 *  1. EXIF leak → sharp.rotate().jpeg() re-encoda sin metadata.
 *  2. MIME spoof → file-type por magic bytes.
 *  3. SVG con JS → allowlist JPG/PNG/WebP.
 *  4. Image bomb → metadata check antes de procesar.
 *  5. Tamaño → 5 MB.
 *  6. Cross-tenant → RLS por carpeta {user_id}/.
 *  7. CSRF → verifySameOrigin.
 *  8. Reemplazo seguro → trigger SQL borra el path anterior cuando cambia.
 */

const MAX_BYTES = 5 * 1024 * 1024
const MAX_DIM = 4096
const BUCKET = 'actor-public-avatars'

function supabaseFromCookies(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createServerClient(url, anonKey, {
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
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(req: NextRequest) {
  const originCheck = verifySameOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'CSRF check failed: ' + originCheck.reason },
      { status: 403 },
    )
  }

  const res = NextResponse.json({ ok: true })
  const supabase = supabaseFromCookies(req, res)
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el form' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Falta archivo (field "file")' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Archivo demasiado grande. Máximo ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ft = await fileTypeFromBuffer(buffer)
  if (!ft) {
    return NextResponse.json({ error: 'Tipo de archivo no detectable' }, { status: 415 })
  }
  const validMimes = new Set(['image/jpeg', 'image/png', 'image/webp'])
  if (!validMimes.has(ft.mime)) {
    return NextResponse.json(
      { error: `Tipo no permitido (${ft.mime}). Solo JPG, PNG o WebP.` },
      { status: 415 },
    )
  }

  let processed: Buffer
  try {
    const meta = await sharp(buffer).metadata()
    const w = meta.width ?? 0
    const h = meta.height ?? 0
    if (w === 0 || h === 0) {
      return NextResponse.json({ error: 'Imagen sin dimensiones válidas' }, { status: 415 })
    }
    if (w > MAX_DIM || h > MAX_DIM) {
      return NextResponse.json(
        { error: `Imagen demasiado grande. Máximo ${MAX_DIM}×${MAX_DIM} px.` },
        { status: 413 },
      )
    }
    // Avatar/logo: square crop hacia el centro + redimensionar a 512×512.
    // Esto homogeneiza la galería: todos los avatares mismo aspecto.
    const out = await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer()
    processed = out
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la imagen' }, { status: 500 })
  }

  const photoId = randomUUID()
  const storagePath = `${user.id}/${photoId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, processed, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadError) {
    return NextResponse.json({ error: 'Storage: ' + uploadError.message }, { status: 500 })
  }

  // Actualizar la columna en actors. La limpieza del avatar anterior vive en
  // la capa de app (aquí), donde storage.remove() sí funciona; NO se delega en
  // un trigger SQL (delete from storage.objects no es fiable desde Postgres y
  // dejaría el blob anterior huérfano en cada reemplazo · RGPD).
  const admin = adminClient()
  if (!admin) {
    // Si falla la admin, intentamos limpiar el storage subido para no dejar huérfano.
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => null)
    return NextResponse.json({ error: 'Service role missing' }, { status: 500 })
  }
  // Leer el avatar anterior ANTES de sobreescribir la columna.
  const { data: prevRow } = await admin
    .from('actors')
    .select('public_avatar_path')
    .eq('user_id', user.id)
    .single()
  const oldPath = (prevRow as { public_avatar_path?: string | null } | null)?.public_avatar_path ?? null

  const { error: updErr } = await admin
    .from('actors')
    .update({ public_avatar_path: storagePath })
    .eq('user_id', user.id)
  if (updErr) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => null)
    return NextResponse.json({ error: 'DB update: ' + updErr.message }, { status: 500 })
  }

  // Reemplazo exitoso: borrar el avatar anterior del storage (evita huérfanos).
  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => null)
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    ok: true,
    avatar: {
      path: storagePath,
      url: signed?.signedUrl ?? null,
    },
  })
}

export async function DELETE(req: NextRequest) {
  const originCheck = verifySameOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'CSRF check failed: ' + originCheck.reason },
      { status: 403 },
    )
  }

  const res = NextResponse.json({ ok: true })
  const supabase = supabaseFromCookies(req, res)
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const admin = adminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Service role missing' }, { status: 500 })
  }
  // UPDATE a NULL → el trigger SQL limpia el objeto en storage.
  const { error: updErr } = await admin
    .from('actors')
    .update({ public_avatar_path: null })
    .eq('user_id', user.id)
  if (updErr) {
    return NextResponse.json({ error: 'DB update: ' + updErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
