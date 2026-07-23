-- Migration: 017_actor_public_avatar
-- Created: 2026-05-25
-- Purpose: Fase 3c — foto pública del Actor (avatar individual / logo
-- empresa) para mostrar en la ficha pública.
--
-- IMPORTANTE — distinción crítica con `actor-workplace-photos`:
--   - `actor-workplace-photos` (mig. 010): galería del puesto de trabajo,
--     100% PRIVADA, solo visible al propio Actor.
--   - `actor-public-avatars` (esta migración): UNA foto pública por Actor
--     (avatar profesional o logo empresa) visible en la ficha pública a
--     otros Actores KYC-verificados.
--   Nunca confundir los dos buckets.
--
-- Modelo:
--   - Columna directa `actors.public_avatar_path` (text nullable).
--   - 1 foto por Actor; subir nueva REEMPLAZA la anterior.
--   - Bucket privado con signed URLs (anti-scraping/hotlinking).
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Columna en public.actors
-- ─────────────────────────────────────────────────────────────────────
alter table public.actors
  add column if not exists public_avatar_path text;

comment on column public.actors.public_avatar_path is
  'Path del avatar/logo público en bucket actor-public-avatars. Convención: {user_id}/{uuid}.jpg. NULL = sin avatar (UI muestra iniciales).';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Bucket privado actor-public-avatars
-- ─────────────────────────────────────────────────────────────────────
-- Privado: lectura solo vía signed URLs generadas server-side. Esto
-- evita scraping/hotlinking — incluso siendo pública en la ficha, la URL
-- final caduca en 1h.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'actor-public-avatars', 'actor-public-avatars', false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS sobre storage.objects (bucket actor-public-avatars)
-- ─────────────────────────────────────────────────────────────────────
-- Lectura: solo el dueño (otros leen vía signed URL del server con
-- service_role, no via RLS directa). Esto previene listado/enumeración.
-- Escritura: solo el dueño.

drop policy if exists "public_avatar_owner_select" on storage.objects;
create policy "public_avatar_owner_select" on storage.objects
  for select using (
    bucket_id = 'actor-public-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_avatar_owner_insert" on storage.objects;
create policy "public_avatar_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'actor-public-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_avatar_owner_update" on storage.objects;
create policy "public_avatar_owner_update" on storage.objects
  for update using (
    bucket_id = 'actor-public-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "public_avatar_owner_delete" on storage.objects;
create policy "public_avatar_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'actor-public-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────
-- 4. Trigger cleanup en actors — reemplazo de avatar
-- ─────────────────────────────────────────────────────────────────────
-- Cuando el Actor sube un avatar nuevo, el endpoint UPDATEa la columna
-- `public_avatar_path` al nuevo path. El path ANTERIOR queda huérfano en
-- storage si no lo limpiamos. Trigger AFTER UPDATE: si cambia el path,
-- borra el objeto antiguo.
create or replace function public.cleanup_old_public_avatar()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if old.public_avatar_path is not null
     and old.public_avatar_path is distinct from new.public_avatar_path then
    delete from storage.objects
      where bucket_id = 'actor-public-avatars'
      and name = old.public_avatar_path;
  end if;
  return new;
end;
$$;

drop trigger if exists actors_public_avatar_cleanup on public.actors;
create trigger actors_public_avatar_cleanup
  after update of public_avatar_path on public.actors
  for each row execute function public.cleanup_old_public_avatar();

-- Cleanup también al borrar el Actor (RGPD Art. 17 + no dejar huérfanos).
create or replace function public.delete_public_avatar_on_actor_delete()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if old.public_avatar_path is not null then
    delete from storage.objects
      where bucket_id = 'actor-public-avatars'
      and name = old.public_avatar_path;
  end if;
  return old;
end;
$$;

drop trigger if exists actors_public_avatar_delete_cleanup on public.actors;
create trigger actors_public_avatar_delete_cleanup
  after delete on public.actors
  for each row execute function public.delete_public_avatar_on_actor_delete();
