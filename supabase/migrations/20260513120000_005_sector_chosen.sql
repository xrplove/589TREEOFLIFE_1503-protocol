-- Migration: 005_sector_chosen
-- Created: 2026-05-13
-- Purpose: Añade la columna `sector_chosen_at` en public.actors. Marca el
-- momento en el que el Actor recién aprobado eligió su sector tras el KYC.
-- Se usa en el middleware del workspace para forzar el paso por
-- /registro/sector la primera vez (después de aprobación KYC pero antes
-- de aterrizar en /sector/<sector_id>).
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido de este archivo entero
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

alter table public.actors
  add column if not exists sector_chosen_at timestamptz;

-- Index para queries del middleware que filtran por
-- "actors aprobados que aún no han elegido sector" (caso poco frecuente
-- pero crítico durante el bootstrap).
create index if not exists actors_sector_chosen_idx
  on public.actors (sector_chosen_at)
  where sector_chosen_at is null;

-- Nota: los Actores ya existentes (anteriores a esta migración) tienen
-- sector_chosen_at NULL. La primera vez que entren tras el deploy serán
-- redirigidos a /registro/sector. Esto es intencional — confirman su
-- sector y descargan el acceso directo.
