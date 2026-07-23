-- Migration: 012_sanctions_audit
-- Created: 2026-05-24
-- Purpose: Auditoría de los 18 países en blocked_sanctions contra
-- fuentes oficiales actualizadas (FATF feb 2026 + EU Consolidated +
-- OFAC May 2026 EO Cuba). Reclasificar los que no son sanciones
-- comprehensivas aplicables a marketplace B2B UE.
--
-- DECISIÓN ESTRATÉGICA (24-may): el usuario prioriza OFAC compliance
-- para tener acceso al mercado US (CLARITY Act esperada julio 2026 +
-- contrapartes operativas US como Vercel/AWS/Anthropic/Stripe que
-- exigen ese cumplimiento). Por tanto se mantienen bloqueados TODOS
-- los países que OFAC sanciona, aunque la UE no lo haga con la misma
-- intensidad: Cuba, Venezuela, Nicaragua adicionales. Esto es más
-- conservador que la posición "solo UE", pero coherente con vocación
-- global y mercado US como objetivo estratégico Fase 7+.
--
-- Fuentes consultadas:
--   - FATF "High-Risk Jurisdictions subject to a Call for Action"
--     (febrero 2026): Iran, North Korea, Myanmar
--   - FATF "Jurisdictions under Increased Monitoring" (grey list,
--     febrero 2026): VE, YE, SS, CD entre otros — enhanced KYC, NO bloqueo
--   - EU Consolidated Sanctions Map (sanctionsmap.eu)
--   - OFAC Cuba EO 1-May-2026: secondary sanctions risk a no-US FIs
--   - OFAC Venezuela Sanctions Regulations (VSR) — sectorial activo
--   - OFAC Nicaragua program — individuos gobierno Ortega
--   - EU Sudan listings extendidos hasta 10 oct 2026
--
-- Decisión: 11 mantenidos / 7 reclasificados a allowed. Los reclasificados
-- son países con sanciones a INDIVIDUOS específicos (no a empresas
-- privadas) y SIN programa OFAC comprehensive de país: YE, SS, LY, CF,
-- CD, SO, IQ. El KYC siguiente + sanctions screening individual
-- (Sumsub/ComplyAdvantage en Fase 4+) filtran personas concretas en
-- listas SDN/EU/UN.
--
-- ⚠️ ESTE CAMBIO REQUIERE VALIDACIÓN DE ABOGADO FINTECH ANTES DEL DEPLOY
-- A PRODUCCIÓN. La justificación de cada país está en los comments. La
-- migración se aplica pero el dossier debe revisarse legalmente antes
-- del primer alta real desde uno de los reclasificados.
--
-- Cómo aplicar (manual desde Dashboard):
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Pegar el contenido entero de este archivo
--   3. Click en Run (o Ctrl + Enter)
--   4. Esperar "Success. No rows returned."

-- ─────────────────────────────────────────────────────────────────────
-- 1. MANTENER bloqueados — actualizar razones con evidencia oficial 2026
-- ─────────────────────────────────────────────────────────────────────
update public.country_restrictions
   set reason = 'OFAC + UN comprehensive + FATF black list (feb 2026)'
 where country_code = 'KP';

update public.country_restrictions
   set reason = 'OFAC + UE comprehensive + FATF black list (feb 2026)'
 where country_code = 'IR';

update public.country_restrictions
   set reason = 'UE + UK + US — sanciones sectoriales amplias post-2022 (servicios cripto incluidos)'
 where country_code = 'RU';

update public.country_restrictions
   set reason = 'UE — sanciones comprehensivas post-2022'
 where country_code = 'BY';

update public.country_restrictions
   set reason = 'UE comprehensive (en levantamiento parcial 2024-25, mantener por seguridad)'
 where country_code = 'SY';

-- MYANMAR (MM): NUEVO añadido a FATF black list en feb 2026, ya estaba
-- bloqueado. Solo actualizar la razón con evidencia oficial.
update public.country_restrictions
   set reason = 'FATF black list (feb 2026) + UE sanctions regime'
 where country_code = 'MM';

-- AFGANISTÁN (AF): Talibán en poder. Sanciones técnicamente a Talibán
-- como grupo, no país, PERO riesgo reputacional + operacional alto.
-- Decisión conservadora: mantener bloqueado hasta abogado fintech valide.
update public.country_restrictions
   set reason = 'Talibán en poder — riesgo reputacional + operacional. Conservador hasta validación abogado fintech'
 where country_code = 'AF';

-- CUBA (CU): EO Trump 1-may-2026 expone a instituciones financieras
-- no-US a secondary sanctions. Para una SL ES que toca USD o tiene
-- contrapartes US (Vercel, AWS, Anthropic...), riesgo real.
-- Conservador: mantener bloqueado pendiente abogado.
update public.country_restrictions
   set reason = 'OFAC secondary sanctions risk (EO Trump 1-may-2026 sectores energy/finance/defense/mining)'
 where country_code = 'CU';

-- SUDÁN (SD): conflicto activo RSF vs SAF. UE extendió listings hasta
-- 10 oct 2026 + añadió 7 individuos en enero 2026. Zona de conflicto
-- activo con AML/CTF concerns reales.
update public.country_restrictions
   set reason = 'Conflicto activo RSF/SAF + UE listings extendidos hasta oct 2026 + 7 nuevos individuos ene 2026'
 where country_code = 'SD';

-- ─────────────────────────────────────────────────────────────────────
-- 2. RECLASIFICAR a allowed — sanciones a individuos/armas, no país
-- ─────────────────────────────────────────────────────────────────────
-- Para todos los reclasificados: la sanción real es a INDIVIDUOS o
-- EMBARGO DE ARMAS, no a empresas privadas. Un marketplace B2B no
-- financiero NO está obligado a bloquearlos a nivel país. El sanctions
-- screening individual en el KYC (Fase 4+) filtra personas concretas
-- en SDN/EU/UN lists.

-- VE Venezuela: MANTENER bloqueado por OFAC Venezuela Sanctions Regulations
-- (VSR) activo. Secondary sanctions risk para SL UE que quiere acceder
-- a mercado US. Decisión estratégica 24-may: OFAC-friendly.
update public.country_restrictions
   set reason = 'OFAC Venezuela Sanctions Regulations (VSR) sectorial activo + FATF grey. Mantener por compatibilidad OFAC para acceso futuro mercado US.'
 where country_code = 'VE';

-- NI Nicaragua: MANTENER bloqueado por OFAC Nicaragua program activo.
-- Mismo razonamiento que VE.
update public.country_restrictions
   set reason = 'OFAC Nicaragua program activo (individuos gobierno Ortega + entidades). Mantener por compatibilidad OFAC para acceso futuro mercado US.'
 where country_code = 'NI';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UN sanciones a individuos houthi/AQAP, no país. FATF grey (enhanced KYC). Empresas privadas yemeníes no sancionadas.',
       estimated_until = null
 where country_code = 'YE';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UN sanciones a individuos. FATF grey (enhanced KYC). Empresas privadas no sancionadas.',
       estimated_until = null
 where country_code = 'SS';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UN embargo armas, no servicios B2B. Empresas privadas libias no sancionadas para marketplace no-financiero.',
       estimated_until = null
 where country_code = 'LY';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UN embargo armas, no servicios B2B. Empresas privadas centroafricanas no sancionadas para marketplace no-financiero.',
       estimated_until = null
 where country_code = 'CF';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UE a 31 individuos + 2 entidades específicas (renovado dic 2025). FATF grey (enhanced KYC). Empresas privadas congoleñas no sancionadas.',
       estimated_until = null
 where country_code = 'CD';

update public.country_restrictions
   set status = 'allowed',
       reason = 'UN embargo armas Al-Shabaab, no servicios B2B. Empresas privadas somalíes no sancionadas para marketplace no-financiero.',
       estimated_until = null
 where country_code = 'SO';

update public.country_restrictions
   set status = 'allowed',
       reason = 'OFAC sectorial residual histórico. Iraq es socio comercial UE. Empresas privadas iraquíes no sancionadas.',
       estimated_until = null
 where country_code = 'IQ';

-- ─────────────────────────────────────────────────────────────────────
-- 3. Verificación post-migración (informativo)
-- ─────────────────────────────────────────────────────────────────────
-- Tras ejecutar:
--   - blocked_sanctions: 11 países (KP, IR, MM, RU, BY, SY, AF, CU, SD, VE, NI)
--   - allowed: 39 + 7 reclasificados = 46 países explícitos
--     (UE-27 + EFTA-4 + US/GB/SG/HK/JP/AU/CA/AE/CH + YE/SS/LY/CF/CD/SO/IQ)
--   - resto del mundo (~150 países): allowed por fallback en geofence.ts
--
-- Si quieres ver el snapshot:
--   select status, count(*) from public.country_restrictions group by status;
