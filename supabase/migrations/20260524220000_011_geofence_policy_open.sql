-- Migration: 011_geofence_policy_open
-- Created: 2026-05-24
-- Purpose: Reabrir geofence al mercado global. Decisión de producto
-- 24-may tras conversación con José: la política inicial (UE+EFTA
-- permitido / resto bloqueado) era excesivamente conservadora. China,
-- India, Brasil, USA, etc. NO están sancionados y bloquearles con
-- "coming soon" rechaza a 6.000 millones de personas de un marketplace
-- global B2B.
--
-- Nueva política simple (2 estados de bloqueo, no 4):
--   - blocked_sanctions: bloqueo permanente (18 países OFAC/UE/UN). Igual.
--   - allowed: TODOS los demás países. Pueden registrarse, usar
--     directorio + chat + reuniones. KYC sigue obligatorio (eso no cambia).
--     feature flag por país cuando se activen (Fase 7+), no bloqueando
--     el alta entera.
--
-- Los estados `blocked_pending_license` y `waitlist` se MANTIENEN en el
-- CHECK constraint por compatibilidad (no romper datos existentes) pero
-- ya NO se usan en el seed. El middleware los trata como `allowed` a
-- partir de ahora.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. Reclasificar los 9 países pending_license → allowed
-- ─────────────────────────────────────────────────────────────────────
update public.country_restrictions
   set status = 'allowed',
       reason = 'Marketplace abierto. Funciones de pago/escrow se activarán cuando obtengamos la licencia local correspondiente (Fase 7+).',
       estimated_until = null
 where country_code in ('US', 'GB', 'SG', 'HK', 'JP', 'AU', 'CA', 'AE', 'CH')
   and status = 'blocked_pending_license';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Documentar la nueva política
-- ─────────────────────────────────────────────────────────────────────
comment on table public.country_restrictions is
  'Política 24-may-2026: 2 estados activos (allowed / blocked_sanctions). Los estados blocked_pending_license y waitlist quedan en el CHECK por compatibilidad pero ya no se usan. El middleware trata cualquier estado distinto de blocked_sanctions como allowed. KYC sigue siendo obligatorio para todos. Las funciones de pago/escrow se gating por feature flag por país cuando se activen.';

-- ─────────────────────────────────────────────────────────────────────
-- 3. Verificación post-migración
-- ─────────────────────────────────────────────────────────────────────
-- Tras ejecutar, deberías ver:
--   - allowed: 39 países (UE-27 + EFTA-4 + los 9 reabiertos hoy incl. CH)
--   - blocked_sanctions: 18 países (igual que antes)
--   - blocked_pending_license: 0 (vacío tras migración)
--   - waitlist: 0 (siempre lo fue, era solo el default)
-- Y CUALQUIER OTRO país (CN, IN, BR, MX, AR, KR, TR, etc.) no listado
-- pasa a comportarse como `allowed` por la lógica del middleware
-- (cambio en app/lib/geofence.ts línea ~73 — fallback de país no listado).
