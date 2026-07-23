-- Migration: 039_create_order_with_lines_rpc
-- Created: 2026-06-04
-- Purpose: Inserción ATÓMICA de un pedido (orders) + sus líneas (order_lines) en
--          una sola transacción. Backbone del "Pedido Vivo" → BD real (mig 038).
--          Evita pedidos huérfanos (order sin líneas) si una línea falla.
--
-- CONTEXTO (sesión 4-jun · marca 1503 · test fábrica→transitario)
-- ---------------------------------------------------------------
-- La ruta POST /api/orders (server-side, service_role) valida sesión + KYC de
-- ambas partes + forma, y delega la escritura a este RPC para garantizar la
-- atomicidad (PostgREST/supabase-js no abre transacciones multi-statement).
--
-- SEGURIDAD (canon ~/.claude/CLAUDE.md §1 · hardening mig 035/037)
-- ---------------------------------------------------------------
-- - SECURITY INVOKER: corre con el rol que invoca. Solo se concede EXECUTE a
--   service_role → anon/authenticated NO pueden llamarlo vía PostgREST. El
--   service_role (BYPASSRLS en Supabase) inserta saltando RLS, que es justo lo
--   que la mig 038 reserva al canal server-side (no hay policy INSERT de cliente).
-- - search_path = '' fijado → evita function_search_path_mutable y secuestro de
--   resolución de nombres. Todas las referencias van calificadas (public.*).
--
-- NO custodial: este RPC NO toca pagos/escrow. total_amount es informativo.
--
-- IDEMPOTENCIA: create or replace + revoke/grant reaplicables sin error.
--
-- ESTADO: APLICADA a la BD viva (proyecto sqsjmmybzokcwurgruaw) el 2026-06-04
--         vía MCP apply_migration (luz verde explícita de José esta sesión).
--
-- PRECONDICIONES: mig 038 (orders · order_lines).

-- ═════════════════════════════════════════════════════════════════════════════
-- FUNCIÓN create_order_with_lines
-- ═════════════════════════════════════════════════════════════════════════════
-- Parámetros:
--   p_buyer_user_id / p_seller_user_id : partes (auth.users · distintas).
--   p_origin_country / p_destination_country : corredor ISO-3166-1 alpha-2 (o null).
--   p_incoterm        : Incoterm 2020 (o null).
--   p_total_amount    : importe INFORMATIVO (o null).
--   p_currency        : ISO-4217 (default EUR).
--   p_notes           : notas (o null).
--   p_created_by      : autor (normalmente = buyer · auth.users · o null).
--   p_lines           : jsonb array. Cada elemento:
--                         { product_id?, dpp_registry_id?, sku_snapshot?,
--                           title_snapshot?(jsonb), quantity(>0), unit_price? }
-- Devuelve: uuid del pedido creado.
-- Errores (rollback completo): array de líneas vacío, quantity inválida, FK rota
--   (product_id/dpp_registry_id inexistente), o cualquier CHECK de la mig 038.

create or replace function public.create_order_with_lines(
  p_buyer_user_id       uuid,
  p_seller_user_id      uuid,
  p_origin_country      text    default null,
  p_destination_country text    default null,
  p_incoterm            text    default null,
  p_total_amount        numeric default null,
  p_currency            text    default 'EUR',
  p_notes               text    default null,
  p_created_by          uuid    default null,
  p_lines               jsonb   default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $body$
declare
  v_order_id uuid;
  v_line     jsonb;
begin
  -- Un pedido sin líneas no tiene sentido comercial → rechazo explícito.
  if p_lines is null
     or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) = 0 then
    raise exception 'order must have at least one line'
      using errcode = 'check_violation';
  end if;

  -- Cabecera (status='draft' SIEMPRE · confirmar es acción posterior gated).
  insert into public.orders (
    buyer_user_id, seller_user_id, status,
    origin_country, destination_country, incoterm,
    total_amount, currency, notes, created_by, updated_by
  ) values (
    p_buyer_user_id, p_seller_user_id, 'draft',
    p_origin_country, p_destination_country, p_incoterm,
    p_total_amount, coalesce(p_currency, 'EUR'), p_notes, p_created_by, p_created_by
  )
  returning id into v_order_id;

  -- Líneas (mismo tx · cualquier fallo revierte también la cabecera).
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    insert into public.order_lines (
      order_id, product_id, dpp_registry_id,
      sku_snapshot, title_snapshot, quantity, unit_price
    ) values (
      v_order_id,
      nullif(v_line->>'product_id', '')::uuid,
      nullif(v_line->>'dpp_registry_id', '')::uuid,
      nullif(v_line->>'sku_snapshot', ''),
      case when jsonb_typeof(v_line->'title_snapshot') = 'object'
           then v_line->'title_snapshot' else null end,
      (v_line->>'quantity')::numeric,
      nullif(v_line->>'unit_price', '')::numeric
    );
  end loop;

  return v_order_id;
end;
$body$;

-- ── Permisos: solo el canal server-side (service_role) puede invocarlo ──
revoke execute on function public.create_order_with_lines(
  uuid, uuid, text, text, text, numeric, text, text, uuid, jsonb
) from public;

grant execute on function public.create_order_with_lines(
  uuid, uuid, text, text, text, numeric, text, text, uuid, jsonb
) to service_role;

comment on function public.create_order_with_lines(
  uuid, uuid, text, text, text, numeric, text, text, uuid, jsonb
) is
  'Inserción atómica de orders + order_lines (mig 038). Backbone del Pedido Vivo (marca 1503). SECURITY INVOKER · EXECUTE solo service_role (canal server-side /api/orders). NO custodial: total_amount informativo.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN MIGRACIÓN 039
-- ─────────────────────────────────────────────────────────────────────────────
