-- Migration: 037_revoke_public_execute_security_definer
-- Created: 2026-06-04
-- Purpose: Corregir el REVOKE de la mig 035. En Postgres el privilegio EXECUTE
--          de una función se concede por defecto a PUBLIC; revocar solo a
--          anon/authenticated NO quita el acceso (lo conservan vía PUBLIC). Hay
--          que revocar a PUBLIC. Se re-concede a service_role en las 3 que se
--          invocan server-side por RPC para no romperlas.
--
-- Funciones afectadas (advisors 0028/0029):
--   · Trigger-functions (las llaman triggers, NO necesitan EXECUTE): seguro.
--     - handle_new_actor() · handle_email_confirmed() · trigger_container_load_complete()
--   · Helpers server-side (self-authorize internamente · llamadas con service_role):
--     - advance_notice_status() · advance_document_status() · get_active_actor_roles()
--       Se revoca a PUBLIC y se re-concede a service_role.
--       get_active_actor_roles la invoca además el auth hook (SECURITY DEFINER,
--       owner postgres → ejecuta con privilegios del owner, sin depender de este grant).
--
-- Idempotente.

revoke execute on function public.handle_new_actor() from public, anon, authenticated;
revoke execute on function public.handle_email_confirmed() from public, anon, authenticated;
revoke execute on function public.trigger_container_load_complete() from public, anon, authenticated;

revoke execute on function public.advance_notice_status(uuid, public.notice_status, uuid) from public, anon, authenticated;
revoke execute on function public.advance_document_status(uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.get_active_actor_roles(uuid) from public, anon, authenticated;

grant execute on function public.advance_notice_status(uuid, public.notice_status, uuid) to service_role;
grant execute on function public.advance_document_status(uuid, text, text, uuid) to service_role;
grant execute on function public.get_active_actor_roles(uuid) to service_role;
