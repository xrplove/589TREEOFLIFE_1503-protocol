'use client'

import { supabase } from './supabase'

// Convention: bucket paths are namespaced by user id.
//   logos/{userId}/logo.{ext}
//   kyc-docs/{userId}/{slugified-label}.{ext}

const LOGO_BUCKET = 'logos'
const KYC_BUCKET = 'kyc-docs'

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

function extFromMime(mime: string, fallback = 'bin'): string {
  return MIME_TO_EXT[mime] ?? fallback
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  const mime = match[1]
  const b64 = match[2]
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { blob: new Blob([bytes], { type: mime }), mime }
}

function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Uploads the company logo (kept as data URL in localStorage) to the public
 * 'logos' bucket. Returns the path inside the bucket on success, null on
 * failure or if there is no logo to upload.
 */
export async function uploadLogoFromDataUrl(
  userId: string,
  dataUrl: string,
): Promise<string | null> {
  const decoded = dataUrlToBlob(dataUrl)
  if (!decoded) return null
  const ext = extFromMime(decoded.mime, 'png')
  const path = `${userId}/logo.${ext}`
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, decoded.blob, {
      contentType: decoded.mime,
      upsert: true,
    })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('uploadLogoFromDataUrl error:', error.message)
    return null
  }
  return path
}

export type UploadedDocMeta = {
  idx: number
  label: string
  filename: string
  mime: string
  size: number
  path: string
}

/**
 * Uploads a single KYC document (kept as data URL in localStorage) to the
 * private 'kyc-docs' bucket. Returns the metadata of the upload on success,
 * null on failure.
 */
export async function uploadKycDocFromDataUrl(
  userId: string,
  meta: { idx: number; label: string; filename: string; mime: string; size: number },
  dataUrl: string,
): Promise<UploadedDocMeta | null> {
  const decoded = dataUrlToBlob(dataUrl)
  if (!decoded) return null
  const ext = extFromMime(meta.mime, 'bin')
  const slug = slugify(meta.label) || `doc-${meta.idx}`
  const path = `${userId}/${meta.idx.toString().padStart(2, '0')}-${slug}.${ext}`
  const { error } = await supabase.storage
    .from(KYC_BUCKET)
    .upload(path, decoded.blob, {
      contentType: meta.mime || decoded.mime,
      upsert: true,
    })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('uploadKycDocFromDataUrl error:', error.message)
    return null
  }
  return {
    idx: meta.idx,
    label: meta.label,
    filename: meta.filename,
    mime: meta.mime,
    size: meta.size,
    path,
  }
}
