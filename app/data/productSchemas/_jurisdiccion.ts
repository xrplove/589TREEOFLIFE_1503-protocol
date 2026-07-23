// Modelo de jurisdicción para la Capa 2 de cumplimiento · ADR 0020.
//
// 1503 es global, pero las leyes NO son universales: una Directiva UE solo
// vincula en la UE, el BOE solo en España. Cada regla de cumplimiento declara de
// qué ordenamiento emana (`JurisdiccionScope`) y este módulo resuelve qué scopes
// aplican a una operación concreta según país del actor + mercado de destino.
//
// Regla canónica José 2026-05-31: "0 atajos, son leyes, no podemos fallar, siempre
// fuentes oficiales". Las agrupaciones (UE-27, EEE) están VERIFICADAS contra fuente
// oficial (URLs abajo). NO sustituye dictamen experto en conflicto de leyes (DIPr).

import type { ISOCountryCode } from './_universal'

/** Ordenamiento del que emana una regla de cumplimiento.
 *  - 'global': principio transversal de la plataforma (aplica siempre).
 *  - 'UE': Derecho de la Unión (Directivas/Reglamentos · EUR-Lex).
 *  - 'EEE': Espacio Económico Europeo (UE-27 + IS/LI/NO).
 *  - código ISO 3166-1 alpha-2: Derecho nacional ('ES', 'FR', 'US', 'BR'…). */
export type JurisdiccionScope = 'global' | 'UE' | 'EEE' | ISOCountryCode

/** Estados miembros de la UE (27 · 2026). ISO 3166-1 alpha-2.
 *  Nota: Grecia es 'GR' en ISO (las instituciones UE usan 'EL').
 *  Fuente oficial VERIFICADA (2026-05-31):
 *  https://european-union.europa.eu/principles-countries-history/eu-countries_en */
export const UE_27: readonly string[] = [
  'BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'GR', 'ES', 'FR', 'HR', 'IT', 'CY',
  'LV', 'LT', 'LU', 'HU', 'MT', 'NL', 'AT', 'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE',
] as const

/** Espacio Económico Europeo = UE-27 + Islandia, Liechtenstein, Noruega.
 *  Suiza (CH) es EFTA pero NO forma parte del EEE.
 *  Fuente oficial VERIFICADA (2026-05-31):
 *  https://www.efta.int/eea-relations-eu/eea-institutions-two-pillar-structure/eea-efta-states */
export const EEE: readonly string[] = [...UE_27, 'IS', 'LI', 'NO'] as const

const up = (c?: string): string => (c ?? '').trim().toUpperCase()

/** Conjunto de jurisdicciones aplicables a una operación.
 *
 *  Heurística conservadora (ADR 0020 §2.2): una regla 'UE' aplica si el actor O el
 *  mercado están en la UE (vender HACIA la UE activa el Derecho de producto/consumo
 *  UE; estar establecido en la UE activa las obligaciones UE). Una operación
 *  puramente no-UE (p. ej. US→US) NO activa reglas 'UE'. Igual para 'EEE' y para
 *  cada Derecho nacional. La determinación fina (DIPr) es subject_to_expert. */
export function jurisdiccionesAplicables(
  paisActor?: string,
  paisMercado?: string,
): Set<JurisdiccionScope> {
  const a = up(paisActor)
  const m = up(paisMercado)
  const set = new Set<JurisdiccionScope>(['global'])
  if (a) set.add(a)
  if (m) set.add(m)
  if (UE_27.includes(a) || UE_27.includes(m)) set.add('UE')
  if (EEE.includes(a) || EEE.includes(m)) set.add('EEE')
  return set
}

/** ¿Aplica una regla con el scope dado al conjunto de jurisdicciones de la operación?
 *  Las reglas 'global' aplican siempre. Una regla SIN scope declarado (undefined) se
 *  trata como aplicable (conservador: no se descarta cumplimiento por falta de etiqueta). */
export function reglaAplica(
  scope: JurisdiccionScope | undefined,
  aplicables: Set<JurisdiccionScope>,
): boolean {
  if (scope === undefined || scope === 'global') return true
  return aplicables.has(scope)
}

/** Código ISO 3166-1 alpha-2 (dos letras). Filtro defensivo del input de mercados. */
const ISO2_RE = /^[A-Za-z]{2}$/

/** Resuelve el conjunto de jurisdicciones aplicables a una OPERACIÓN concreta (país del
 *  actor + mercados de destino) con semántica **SAFE-BY-DEFAULT** para gates legales:
 *  devuelve `null` cuando NO hay evidencia suficiente para filtrar con seguridad — el
 *  caller debe entonces NO suprimir ninguna regla (conservador · evita falso negativo).
 *
 *  Devuelve un `Set` (sobre el que el caller aplica `reglaAplica`) SOLO si:
 *   (a) se conoce el país del actor (debe venir del KYC · NO de `country_of_origin`, que
 *       es el origen del producto, no el establecimiento del vendedor), y
 *   (b) hay mercados de destino explícitos y no vacíos, y
 *   (c) TODOS los mercados son códigos ISO 3166-1 alpha-2.
 *  El Set es la unión de `jurisdiccionesAplicables(actor, mercado_i)` sobre cada mercado
 *  (una regla 'UE' se conserva si el actor o CUALQUIER mercado está en la UE).
 *
 *  Devuelve `null` (= no filtrar) si falta el país del actor, no hay mercados declarados
 *  (mercado indeterminado = potencialmente global en una plataforma global), o hay datos
 *  sucios/sentinelas. La determinación fina de conflicto de leyes (DIPr) es
 *  subject_to_expert (ADR 0020 §2.5). */
export function jurisdiccionesAplicablesOperacion(
  paisActor: string | null | undefined,
  mercados: readonly string[] | null | undefined,
): Set<JurisdiccionScope> | null {
  const actor = typeof paisActor === 'string' ? paisActor.trim() : ''
  const mkts = Array.isArray(mercados)
    ? mercados.filter((m): m is string => typeof m === 'string' && m.trim() !== '')
    : []
  // Evidencia insuficiente para suprimir con seguridad → null (el caller conserva todo).
  if (actor === '' || mkts.length === 0 || !mkts.every((m) => ISO2_RE.test(m.trim()))) {
    return null
  }
  const aplicables = new Set<JurisdiccionScope>()
  for (const m of mkts) {
    for (const scope of jurisdiccionesAplicables(actor, m)) aplicables.add(scope)
  }
  return aplicables
}
