-- Migration: 035_hardening_search_path_execute
-- Created: 2026-06-04
-- Purpose: Endurecimiento de seguridad de la BD a partir de los advisors de
--          Supabase (lints 0011 + 0028/0029). NO toca datos ni RLS.
--
-- 1. search_path fijo en TODAS las funciones propias del esquema public que no
--    lo tengan (lint 0011 · evita schema hijacking en SECURITY DEFINER). Se
--    excluyen funciones de extensiones (deptype 'e').
--
-- 2. REVOKE EXECUTE a anon/authenticated en funciones SECURITY DEFINER que NO
--    están pensadas para llamarse por RPC público (lints 0028/0029). Son
--    trigger-functions y helpers de operador llamados server-side con
--    service_role (que conserva EXECUTE). Verificado en código: la única RPC
--    llamada por la app desde cliente es is_point_in_hub_geofence (no aquí) y
--    advance_document_status (desde Edge Function con service_role).
--
-- Idempotente: el DO block solo altera las que faltan; REVOKE es idempotente.

-- 1 · search_path
do $body$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, array[]::text[])) c
        where c like 'search_path=%'
      )
      and not exists (
        select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end $body$;

-- 2 · revoke EXECUTE (service_role conserva acceso · server-side sigue operando)
revoke execute on function public.handle_new_actor() from anon, authenticated;
revoke execute on function public.handle_email_confirmed() from anon, authenticated;
revoke execute on function public.trigger_container_load_complete() from anon, authenticated;
revoke execute on function public.advance_notice_status(uuid, public.notice_status, uuid) from anon, authenticated;
revoke execute on function public.advance_document_status(uuid, text, text, uuid) from anon, authenticated;
revoke execute on function public.get_active_actor_roles(uuid) from anon, authenticated;
