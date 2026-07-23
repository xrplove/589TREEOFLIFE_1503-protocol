-- Migration: 002_storage_setup
-- Created: 2026-05-10
-- Purpose: Bloque 3b.2 — buckets de Supabase Storage para los uploads del
-- alta (logo de empresa + documentos KYC) y columnas de actors que guardan
-- los paths de los archivos subidos.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run

-- ─────────────────────────────────────────────────────────────────────
-- 1. Buckets
-- ─────────────────────────────────────────────────────────────────────
-- Bucket "logos": público (los logos se ven en fichas públicas de Actores).
-- Tamaño máximo por archivo 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos', 'logos', true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket "kyc-docs": privado (docs sensibles de KYC). Solo el dueño puede
-- leer; el Operador accede via service_role cuando hace falta para
-- comprobaciones AML.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-docs', 'kyc-docs', false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────
-- 2. RLS policies sobre storage.objects
-- ─────────────────────────────────────────────────────────────────────
-- Convención de paths: {bucket}/{user_id}/{filename}. La policy lee la
-- primera carpeta del path con storage.foldername() y la compara con
-- auth.uid()::text para autorizar.

-- ── logos: público leer, solo dueño escribir ──
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_owner_insert" on storage.objects;
create policy "logos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_owner_update" on storage.objects;
create policy "logos_owner_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_owner_delete" on storage.objects;
create policy "logos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── kyc-docs: solo dueño leer/escribir/borrar ──
drop policy if exists "kyc_docs_owner_select" on storage.objects;
create policy "kyc_docs_owner_select" on storage.objects
  for select using (
    bucket_id = 'kyc-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc_docs_owner_insert" on storage.objects;
create policy "kyc_docs_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'kyc-docs'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc_docs_owner_update" on storage.objects;
create policy "kyc_docs_owner_update" on storage.objects
  for update using (
    bucket_id = 'kyc-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc_docs_owner_delete" on storage.objects;
create policy "kyc_docs_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'kyc-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────
-- 3. Columnas en public.actors para los paths de los archivos subidos
-- ─────────────────────────────────────────────────────────────────────
-- logo_path:  ruta relativa dentro del bucket 'logos' (ej. 'uuid/logo.png').
-- docs_paths: array JSON con metadata por documento subido (label, path,
--             filename, mime, size).
alter table public.actors
  add column if not exists logo_path text,
  add column if not exists docs_paths jsonb default '[]'::jsonb;
