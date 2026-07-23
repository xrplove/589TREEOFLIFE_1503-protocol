-- Migration: 018_actor_employer_company
-- Created: 2026-05-25
-- Purpose: Fase 3c — slot preparado para "empresa empleadora" del individual.
--
-- Caso de uso: una persona física (entity_kind='individual') puede declarar
-- en qué empresa trabaja. Hoy NO está verificado cross-actor — es campo
-- auto-declarado y la UI debe etiquetarlo como tal ("AUTO-DECLARADO").
--
-- La verificación cross-actor (la empresa empleadora confirma al empleado)
-- se difiere a Fase 6+, junto con el modelo de relaciones entre actores.
--
-- Cuando llegue la verificación cross-actor:
--   - Añadir columna `employer_verified_at timestamptz`
--   - Añadir tabla `employer_relationships` con flow de invitación/aceptación
--   - La UI cambia etiqueta a "VERIFICADO POR EMPRESA"
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

alter table public.actors
  add column if not exists employer_company_name text;

-- Tope de longitud razonable. Sin CHECK regex porque nombres de empresas
-- contienen caracteres muy variados (S.A., GmbH, Ltd., 株式会社, etc.).
-- Postgres no soporta `ADD CONSTRAINT IF NOT EXISTS` para CHECK; usamos DO.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'actors_employer_company_name_length'
  ) then
    alter table public.actors
      add constraint actors_employer_company_name_length
        check (employer_company_name is null or char_length(employer_company_name) between 2 and 200);
  end if;
end$$;

comment on column public.actors.employer_company_name is
  'Empresa empleadora del Actor cuando entity_kind=individual. AUTO-DECLARADO (no verificado cross-actor). Verificación real diferida a Fase 6+. La UI debe etiquetar como tal.';
