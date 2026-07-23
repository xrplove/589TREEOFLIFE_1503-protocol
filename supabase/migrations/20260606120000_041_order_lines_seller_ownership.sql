-- Migration: 041_order_lines_seller_ownership
-- Created: 2026-06-06
-- Purpose: ENDURECER la integridad catálogo→pedido. Hasta ahora una línea de
--          pedido podía referenciar CUALQUIER product_id/dpp_registry_id existente
--          (la FK de mig 038 solo exige EXISTENCIA, no PROPIEDAD). Esta migración
--          reemplaza create_order_with_lines (mig 039) para exigir que todo
--          producto/DPP referenciado en una línea PERTENEZCA al vendedor del pedido.
--
-- POR QUÉ (marca 1503 = capa de cumplimiento / trazabilidad / CONFIANZA)
-- ---------------------------------------------------------------------
-- Un "Pedido Vivo" cuyas líneas no son demostrablemente del vendedor rompe la
-- tesis del producto: la cadena catálogo→pedido→custodia→entrega debe ser íntegra
-- de extremo a extremo. Sin esta comprobación, el comprador podía construir un
-- pedido con seller=X pero líneas apuntando a fichas de Y (o propias). Defensa en
-- profundidad: la API (/api/orders) pre-valida para un 422 limpio; este RPC es la
-- GARANTÍA a nivel BD (atómica, no saltable aunque un caller futuro lo olvide).
--
-- MODELO ACTUAL (decisión canónica · test fábrica→transitario): vendedor = dueño
-- del catálogo (owner_user_id). Un modelo futuro de distribuidor/reventa (vender
-- ficha de un tercero con autorización) sería otra invariante → ADR de delegación
-- (dpp_roles_delegations · mig 021), NO un relajamiento de esta. Por ahora, la
-- línea solo referencia items del propio vendedor.
--
-- SEGURIDAD: idéntica a mig 039 — SECURITY INVOKER · search_path='' · EXECUTE solo
-- service_role. Las comprobaciones de propiedad corren con el privilegio del
-- invocador (service_role · BYPASSRLS), leyendo products/dpp_registry directamente.
--
-- ERRORES (rollback completo · mapeados a 422 en la API):
--   - errcode 23514 (check_violation): array vacío  → 'order must have at least one line'
--   - errcode 23514 (check_violation): propiedad    → 'order line references a {product|DPP} not owned by the seller'
--   La API devuelve un mensaje genérico controlado (no revela existencia/propietario).
--
-- IDEMPOTENCIA: create or replace + revoke/grant reaplicables sin error.
--
-- ESTADO: pendiente de aplicar a la BD viva (proyecto sqsjmmybzokcwurgruaw) vía MCP.
--
-- PRECONDICIONES: mig 038 (orders·order_lines) · mig 039 (función previa) ·
--                 products.owner_user_id · dpp_registry.owner_user_id (verificadas en vivo).

-- ═════════════════════════════════════════════════════════════════════════════
-- FUNCIÓN create_order_with_lines (reemplaza mig 039 · + comprobación de propiedad)
-- ═════════════════════════════════════════════════════════════════════════════

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
  v_order_id   uuid;
  v_line       jsonb;
  v_product_id uuid;
  v_dpp_id     uuid;
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
    v_product_id := nullif(v_line->>'product_id', '')::uuid;
    v_dpp_id     := nullif(v_line->>'dpp_registry_id', '')::uuid;

    -- ── INTEGRIDAD catálogo→pedido (mig 041): el item referenciado debe ser del
    --    VENDEDOR. Cubre también el caso "no existe" (mismo mensaje genérico →
    --    opacidad: no revela existencia ni propietario). Reemplaza el 23503 de FK
    --    por una comprobación de propiedad más fuerte y más opaca.
    if v_product_id is not null
       and not exists (
         select 1 from public.products p
         where p.id = v_product_id and p.owner_user_id = p_seller_user_id
       ) then
      raise exception 'order line references a product not owned by the seller'
        using errcode = 'check_violation';
    end if;

    if v_dpp_id is not null
       and not exists (
         select 1 from public.dpp_registry d
         where d.id = v_dpp_id and d.owner_user_id = p_seller_user_id
       ) then
      raise exception 'order line references a DPP not owned by the seller'
        using errcode = 'check_violation';
    end if;

    insert into public.order_lines (
      order_id, product_id, dpp_registry_id,
      sku_snapshot, title_snapshot, quantity, unit_price
    ) values (
      v_order_id,
      v_product_id,
      v_dpp_id,
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
  'Inserción atómica de orders + order_lines (mig 038). Backbone del Pedido Vivo (marca 1503). SECURITY INVOKER · EXECUTE solo service_role. mig 041: cada product_id/dpp_registry_id de una línea DEBE pertenecer al vendedor (integridad catálogo→pedido); referencia ajena/inexistente → check_violation (rollback). NO custodial: total_amount informativo.';

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN MIGRACIÓN 041
-- ─────────────────────────────────────────────────────────────────────────────
