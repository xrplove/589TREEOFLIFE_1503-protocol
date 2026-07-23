-- Migration: 036_drop_legacy_prototype_tables
-- Created: 2026-06-04
-- Purpose: Eliminar restos del prototipo original (create-next-app + primer
--          esquema) que el código actual NO usa y que generan ruido/riesgo:
--
--   · public.productos  — tabla del primer catálogo (español). 10 filas demo.
--     Tenía RLS DESHABILITADA (advisor 0013 · ERROR · expuesta a la anon key).
--     El código actual usa public.products (mig 028), nunca 'productos'.
--   · public.profiles   — tabla de perfiles del primer login. 0 filas. El
--     código actual usa public.actors, nunca 'profiles'.
--   · public.handle_new_user() — trigger-function legacy que insertaba en
--     profiles. HUÉRFANA (ningún trigger la usa; el alta usa handle_new_actor).
--
-- Verificado antes de dropear (4-jun): sin FKs entrantes, sin vistas/funciones
-- dependientes, sin referencias en el código (grep app/server/middleware).
-- Sin CASCADE a propósito: si hubiera un dependiente imprevisto, que falle y
-- haga rollback en vez de borrar de más.

drop table if exists public.productos;
drop table if exists public.profiles;
drop function if exists public.handle_new_user();
