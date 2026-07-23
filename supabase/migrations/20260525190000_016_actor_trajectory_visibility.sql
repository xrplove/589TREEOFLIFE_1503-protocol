-- Migration: 016_actor_trajectory_visibility
-- Created: 2026-05-25
-- Purpose: Fase 3c — segundo eje de consentimiento RGPD: visibilidad de
-- la trayectoria de operaciones (independiente de visibilidad del
-- directorio).
--
-- Por qué dos ejes separados:
--   RGPD Art. 7 exige granularidad: un usuario puede consentir aparecer
--   en el directorio (que otros le encuentren) PERO no que se vean sus
--   números (operaciones cerradas, métricas computadas). Son finalidades
--   distintas y se deben tratar como consents independientes.
--
-- Modelo operativo "opt-in pragmático":
--   - Default `true` en BD para retrocompatibilidad con usuarios YA
--     registrados antes de mig. 015/016 (no romper su visibilidad actual).
--   - Pero el endpoint /api/auth/persist-consents en el registro NUEVO
--     respeta lo que el Actor marca: si no marca el check verde "sí
--     consiento", la columna se actualiza a false post-INSERT.
--   - Re-consent automático para antiguos: pendiente v1.1.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

alter table public.actors
  add column if not exists trajectory_visible boolean not null default true;

comment on column public.actors.trajectory_visible is
  'Opt-out de visibilidad de la trayectoria de operaciones en la ficha pública. Por defecto true. Si false: la sección "Trayectoria" de la ficha se oculta a otros. Excepción: el propio user siempre la ve.';
