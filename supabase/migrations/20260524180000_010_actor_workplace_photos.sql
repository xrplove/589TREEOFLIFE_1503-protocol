-- Migration: 010_actor_workplace_photos
-- Created: 2026-05-24
-- Purpose: Bloque B3.3 — panel personal de fotos del puesto del Actor.
-- Galería del entorno físico de trabajo (taller, despacho, sala muestras,
-- flota) para reforzar confianza B2B. MVP Lite: 3 fotos máximo, solo
-- visibles en conversaciones (no en ficha pública aún, eso llega con 3c).
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Bucket privado actor-workplace-photos
-- ─────────────────────────────────────────────────────────────────────
-- Privado: las fotos NO son públicas en este MVP. El endpoint GET genera
-- signed URLs con expiración corta cuando hay que mostrarlas.
-- file_size_limit: 5 MB (igual que logos).
-- allowed_mime_types: solo JPG/PNG/WebP. SVG REJECT por riesgo XSS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'actor-workplace-photos', 'actor-workplace-photos', false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────
-- 2. RLS policies sobre storage.objects para el bucket nuevo
-- ─────────────────────────────────────────────────────────────────────
-- Convención de paths: {user_id}/{uuid}.jpg (UUID para evitar enumeración).
-- Las queries lean storage.foldername(name)[1] = auth.uid()::text.

drop policy if exists "workplace_photos_owner_select" on storage.objects;
create policy "workplace_photos_owner_select" on storage.objects
  for select using (
    bucket_id = 'actor-workplace-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workplace_photos_owner_insert" on storage.objects;
create policy "workplace_photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'actor-workplace-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workplace_photos_owner_update" on storage.objects;
create policy "workplace_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'actor-workplace-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workplace_photos_owner_delete" on storage.objects;
create policy "workplace_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'actor-workplace-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────
-- 3. Tabla public.actor_workplace_photos
-- ─────────────────────────────────────────────────────────────────────
-- Una fila por foto. Metadata mínima: path, tamaño, MIME validado server-side.
-- Sin label ni is_public en MVP Lite (vienen en versión Completa más tarde).
create table if not exists public.actor_workplace_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 5242880),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width_px integer,
  height_px integer,
  created_at timestamptz not null default now(),
  -- storage_path debe seguir convención {user_id}/{uuid}.{ext}
  constraint workplace_photos_path_prefix
    check (storage_path like (user_id::text || '/%'))
);

create index if not exists workplace_photos_user_idx
  on public.actor_workplace_photos(user_id, created_at desc);

-- Quota check: máximo 3 fotos por usuario (MVP Lite). Se valida también
-- en server-side antes del insert, pero esta constraint es la red de
-- seguridad final por si hay race conditions.
create or replace function public.check_workplace_photos_quota()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
begin
  select count(*) into current_count
    from public.actor_workplace_photos
    where user_id = new.user_id;
  if current_count >= 3 then
    raise exception 'Workplace photos quota exceeded (max 3)';
  end if;
  return new;
end;
$$;

drop trigger if exists workplace_photos_quota_check on public.actor_workplace_photos;
create trigger workplace_photos_quota_check
  before insert on public.actor_workplace_photos
  for each row execute function public.check_workplace_photos_quota();

-- ─────────────────────────────────────────────────────────────────────
-- 4. RLS sobre public.actor_workplace_photos
-- ─────────────────────────────────────────────────────────────────────
alter table public.actor_workplace_photos enable row level security;

drop policy if exists "workplace_photos_read_own" on public.actor_workplace_photos;
create policy "workplace_photos_read_own" on public.actor_workplace_photos
  for select using (auth.uid() = user_id);

drop policy if exists "workplace_photos_insert_own" on public.actor_workplace_photos;
create policy "workplace_photos_insert_own" on public.actor_workplace_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "workplace_photos_delete_own" on public.actor_workplace_photos;
create policy "workplace_photos_delete_own" on public.actor_workplace_photos
  for delete using (auth.uid() = user_id);

-- Sin policy de UPDATE: las fotos no se editan. Si quieres cambiar una,
-- la borras y subes nueva.

-- ─────────────────────────────────────────────────────────────────────
-- 5. Trigger AFTER DELETE — limpieza del object en storage
-- ─────────────────────────────────────────────────────────────────────
-- GDPR right to erasure: cuando se borra una fila (manual del Actor o
-- cascade desde auth.users), se borra también el objeto en storage para
-- no dejar PII huérfana. Usa la API interna de storage.objects.
create or replace function public.delete_workplace_photo_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
    where bucket_id = 'actor-workplace-photos'
    and name = old.storage_path;
  return old;
end;
$$;

drop trigger if exists workplace_photos_storage_cleanup on public.actor_workplace_photos;
create trigger workplace_photos_storage_cleanup
  after delete on public.actor_workplace_photos
  for each row execute function public.delete_workplace_photo_storage();
