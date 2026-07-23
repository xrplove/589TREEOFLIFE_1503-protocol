-- Migration: 020_actor_reputation_cascade_fix
-- Created: 2026-05-27
-- Purpose: Hot-fix bug latente en migración 014 (`actor_reputation_events`).
--
-- BUG DETECTADO
-- -------------
-- El trigger `reject_reputation_mutation` de la migración 014 lanza una
-- excepción en CUALQUIER intento de UPDATE o DELETE sobre la tabla
-- `actor_reputation_events`, incluyendo DELETEs propagados por cascade FK.
--
-- En Postgres, un trigger BEFORE DELETE se dispara también cuando el DELETE
-- proviene de un ON DELETE CASCADE de la FK. Si el trigger lanza exception,
-- el cascade falla → no se puede borrar al usuario en `auth.users` →
-- IMPOSIBLE ejecutar el derecho al olvido GDPR Art. 17.
--
-- La nota explícita de la migración 014 ("el trigger se dispara para DELETE
-- manuales pero NO bloquea cascadas de FK · eso es comportamiento
-- intencional") era OPTIMISTA pero técnicamente INCORRECTA sin un check
-- explícito en el cuerpo de la función.
--
-- Como la tabla aún está vacía o casi vacía en producción (la trayectoria
-- es Fase 5+), el bug es latente: nadie ha ejercido derecho al olvido
-- todavía. Pero antes de que llegue ese momento, lo arreglamos.
--
-- FIX APLICADO
-- ------------
-- Sobreescribir la función `reject_reputation_mutation` (sin tocar la
-- tabla ni el trigger · `create or replace function` es atómico y el
-- trigger sigue apuntando a la misma función). Añadir check
-- `pg_trigger_depth() > 1` que distingue:
--   - DELETE manual directo sobre actor_reputation_events  →  depth = 1  →  BLOCK
--   - DELETE auth.users → cascade actor_reputation_events  →  depth ≥ 2  →  ALLOW
--
-- IDÉNTICO PATRÓN APLICADO EN MIGRACIÓN 019 (`dpp_tracking_events`).
-- A partir de hoy, todo trigger append-only nuevo en el proyecto debe
-- usar este patrón canónico.
--
-- IMPACTO
-- -------
-- - No bloquea ningún flujo actual (no hay ejercicios de derecho al olvido
--   en curso, no hay DELETEs manuales legítimos en esta tabla).
-- - Restaura el cumplimiento RGPD Art. 17 (cascade GDPR ahora funciona).
-- - Mantiene la propiedad append-only frente a DELETE/UPDATE manuales del
--   service_role.
--
-- COMO APLICAR (MANUAL DESDE DASHBOARD · feedback_sql_manual)
-- ----------------------------------------------------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (Ctrl + Enter)
--   4. Esperar "Success. No rows returned."
--
-- VERIFICACIÓN POST-APLICACIÓN
-- ----------------------------
--   - Comprobar que el trigger sigue activo:
--       select * from pg_trigger where tgname like 'actor_reputation_events_no_%';
--     Debe seguir devolviendo 2 filas (no_update + no_delete).
--   - Smoke test opcional (en una BD de staging, NO en producción real):
--       insert into auth.users (id, email) values (gen_random_uuid(), 'test@test.com');
--       insert into public.actor_reputation_events (user_id, event_type)
--         values (..., 'test_event');
--       delete from auth.users where email = 'test@test.com';
--     Antes del fix: error append-only.
--     Después del fix: cascade limpio, fila de actor_reputation_events borrada.

-- ─────────────────────────────────────────────────────────────────────
-- HOT-FIX · reemplazo atómico de la función
-- ─────────────────────────────────────────────────────────────────────
-- `create or replace function` mantiene el mismo OID de la función. El
-- trigger sigue apuntando ahí sin necesidad de re-crear nada.
create or replace function public.reject_reputation_mutation()
returns trigger
language plpgsql
as $$
begin
  -- Permitir cascades FK (GDPR Art. 17 derecho al olvido prevalece sobre
  -- inmutabilidad). Si el DELETE viene propagado por un cascade desde
  -- auth.users, pg_trigger_depth() > 1 (estamos dentro de un trigger
  -- anidado, no en la raíz del DELETE).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'actor_reputation_events is append-only · DELETE manual prohibido · use cascade FK desde auth.users para GDPR Art. 17';
end;
$$;

-- Auto-documentación.
comment on function public.reject_reputation_mutation() is
  'Append-only enforcement con excepción para cascade FK (GDPR Art. 17). Hot-fix migración 020 · patrón canónico pg_trigger_depth() > 1.';
