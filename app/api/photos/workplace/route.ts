import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { randomUUID } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { verifySameOrigin } from '../../../lib/internal-api-auth'

/**
 * Endpoint del panel personal de fotos del puesto (B3.3 MVP Lite).
 *
 *  POST /api/photos/workplace  → subir una foto (multipart form: field "file")
 *  GET  /api/photos/workplace  → listar las fotos del Actor logado, con
 *                                 signed URLs de 1 hora.
 *
 * Mitigaciones server-side (las 10 brechas detectadas en el diseño 24-may):
 *  1. EXIF leak    → sharp.rotate().jpeg() re-encoda y limpia metadata.
 *  2. MIME spoof   → file-type lee magic bytes, no nos fiamos de la extensión.
 *  3. SVG con JS   → allowlist estricta: solo image/jpeg|png|webp.
 *  4. Image bomb   → sharp.metadata() valida dimensiones ≤ 4096×4096
 *                    antes de procesar el buffer entero.
 *  5. Tamaño       → 5 MB por foto (constraint en bucket + check aquí),
 *                    3 fotos máx por Actor (trigger SQL + check aquí).
 *  6. Cross-tenant → RLS de storage por carpeta {user_id}/.
 *  7. CSRF         → verifySameOrigin sobre Origin/Referer.
 *  8. URLs predec. → path con UUID + signed URLs con expiración.
 *  9. GDPR erasure → cascade delete auth.users → actors → photos +
 *                    trigger AFTER DELETE limpia storage.
 * 10. Inapropiado  → fuera de scope MVP, plan de denuncia + operador Fase 5.
 */

const MAX_BYTES = 5 * 1024 * 1024
const MAX_DIM = 4096
const MAX_PHOTOS = 3
const BUCKET = 'actor-workplace-photos'

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

  // Quota check (defensa antes del trigger, mejor UX que esperar al error SQL).
  const { count: currentCount, error: countError } = await supabase
    .from('actor_workplace_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }
  if ((currentCount ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_PHOTOS} fotos. Borra alguna antes de subir otra.` },
      { status: 409 },
    )
  }

  // Parse multipart form (Next 16 nativo).
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

  // Magic bytes: NO confiamos en la extensión ni en el header Content-Type
  // que envía el navegador. file-type lee los primeros bytes del buffer.
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

  // Validar dimensiones antes de re-encodear: image bomb defense.
  let processed: Buffer
  let outWidth = 0
  let outHeight = 0
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
    // .rotate() aplica orientación EXIF antes de eliminarla. .jpeg() re-encoda
    // a JPEG estándar sin metadata. Esto cierra EXIF leak y normaliza el
    // formato (todo el bucket queda en JPEG uniformes).
    const out = await sharp(buffer)
      .rotate()
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true })
    processed = out.data
    outWidth = out.info.width
    outHeight = out.info.height
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la imagen' }, { status: 500 })
  }

  // Path con UUID — no enumerable. Convención: {user_id}/{uuid}.jpg.
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

  // Insertar metadata. Si el insert falla, intentamos limpiar el storage
  // para no dejar huérfano (no podemos esperar al trigger porque la fila
  // no llegó a crearse).
  const { data: inserted, error: insertError } = await supabase
    .from('actor_workplace_photos')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      file_size_bytes: processed.length,
      mime_type: 'image/jpeg',
      width_px: outWidth,
      height_px: outHeight,
    })
    .select('id, storage_path, file_size_bytes, width_px, height_px, created_at')
    .single()

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => null)
    return NextResponse.json(
      { error: 'DB insert: ' + (insertError?.message ?? 'unknown') },
      { status: 500 },
    )
  }

  // Devolver signed URL para que el cliente pueda mostrar inmediatamente.
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({
    ok: true,
    photo: {
      id: inserted.id,
      url: signed?.signedUrl ?? null,
      width: inserted.width_px,
      height: inserted.height_px,
      size: inserted.file_size_bytes,
      createdAt: inserted.created_at,
    },
  })
}

export async function GET(req: NextRequest) {
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

  const { data: rows, error } = await supabase
    .from('actor_workplace_photos')
    .select('id, storage_path, file_size_bytes, width_px, height_px, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generar signed URLs en batch (1h validez).
  const photos = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, 3600)
      return {
        id: row.id,
        url: signed?.signedUrl ?? null,
        width: row.width_px,
        height: row.height_px,
        size: row.file_size_bytes,
        createdAt: row.created_at,
      }
    }),
  )

  return NextResponse.json({ photos, max: MAX_PHOTOS })
}
