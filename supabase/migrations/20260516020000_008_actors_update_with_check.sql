-- Migration: 008_actors_update_with_check
-- Created: 2026-05-16
-- Purpose: Hardening de RLS (sprint auditoría RLS). La política
-- `actors_update_own` (migración 001) tenía `using` pero NO `with check`.
--
-- La auditoría (scripts/rls-audit.mjs) confirmó que HOY la fila no se
-- puede re-parentar (otras restricciones lo impiden), así que NO es un
-- agujero explotable. Pero depender de salvaguardas incidentales es mala
-- higiene: una política UPDATE sin WITH CHECK permite, en teoría, mutar
-- la fila a valores que ya no satisfacen la propia política (p. ej.
-- cambiar user_id). Hacemos la intención EXPLÍCITA: el Actor solo puede
-- dejar su fila apuntando a sí mismo.
--
-- No cambia el comportamiento observable (defensa en profundidad).
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

drop policy if exists "actors_update_own" on public.actors;
create policy "actors_update_own" on public.actors
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
