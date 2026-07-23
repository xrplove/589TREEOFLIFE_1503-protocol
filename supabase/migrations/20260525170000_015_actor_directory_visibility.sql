-- Migration: 015_actor_directory_visibility
-- Created: 2026-05-25
-- Purpose: Fase 3c — opt-out de visibilidad en el directorio público (RGPD).
--
-- La ficha pública actual es accesible a todos los Actors KYC-approved.
-- RGPD Art. 7 (consentimiento revocable) + Art. 25 (privacy by design)
-- requieren que el Actor pueda OCULTAR su ficha en cualquier momento.
--
-- Modelo "opt-out con transparencia clara" (estándar B2B tipo LinkedIn):
--   - Por defecto: visible (la mayoría se registra precisamente PARA ser
--     encontrada en el marketplace).
--   - El Actor puede ocultar su ficha desde su panel; toma efecto inmediato.
--   - Cuando está oculta:
--       · GET /api/actors/[id] devuelve 404 a OTROS Actors.
--       · No aparece en GET /api/actors (listado del sector).
--       · El propio Actor SIEMPRE ve su ficha (excepción para gestión).
--   - El registro debe avisar claramente que ocultar la ficha limita
--     la operativa en el marketplace (no aparecer = no ser contactado).
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

alter table public.actors
  add column if not exists visible_in_directory boolean not null default true;

-- Índice parcial: las queries del directorio filtran por
-- (kyc_status='approved' AND visible_in_directory=true). El índice
-- parcial es más pequeño y rápido que uno sobre toda la tabla.
create index if not exists actors_directory_visible_idx
  on public.actors (sector_id, created_at desc)
  where kyc_status = 'approved' and visible_in_directory = true;

comment on column public.actors.visible_in_directory is
  'Opt-out de visibilidad en directorio público. Por defecto true. Si false: la ficha devuelve 404 a otros, no aparece en listados. Excepción: el propio user siempre ve su ficha para poder gestionarla.';
