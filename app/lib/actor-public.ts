import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Helper canónico de "qué es público de un Actor". Lo usan tanto el route
 * handler `/api/actors/[id]` como la página server-side `/actor/[id]`.
 *
 * Centralizar evita el bug clásico: añadir un campo nuevo a la tabla
 * `actors` y filtrarlo desde un consumidor pero no de otro, exponiendo
 * PII por accidente. Aquí está la única lista de campos públicos.
 *
 * Cumple regla global (~/.claude/CLAUDE.md sección 1): filtrado positivo
 * de campos, nunca por exclusión. Si mañana se añade `iban` a `actors`,
 * NO se filtra a menos que se incluya explícitamente aquí.
 */

export type EntityKind = 'individual' | 'company' | null

export type PublicActor = {
  user_id: string
  actor_id: string
  entity_kind: EntityKind
  display_name: string
  country_code: string | null
  city: string | null
  sector_id: string | null
  role_id: string | null
  years_in_sector: string | null
  /** Opt-out RGPD: la ficha aparece, pero la sección Trayectoria se oculta
   *  cuando este flag es false. La UI debe respetarlo. */
  trajectory_visible: boolean
  /** Path en el bucket actor-public-avatars (mig. 017). NULL si el Actor
   *  no ha subido foto pública — la UI muestra iniciales. Para renderizar
   *  el caller debe generar signed URL del path. */
  public_avatar_path: string | null
  /** Empresa empleadora auto-declarada del individual (mig. 018). Solo
   *  presente si entity_kind=individual y el Actor la declaró. NO
   *  verificada cross-actor — la UI debe etiquetar como tal. */
  employer_company_name: string | null
  created_at: string
}

/** Columnas que el helper trae de Supabase. Pueden incluir más de las
 *  que devolvemos al exterior — el filtrado a `PublicActor` ocurre abajo.
 *  Incluye `visible_in_directory` (mig. 015), `trajectory_visible`
 *  (mig. 016), `public_avatar_path` (mig. 017) y `employer_company_name`
 *  (mig. 018) para aplicar opt-out RGPD granular y mostrar avatar/empleador. */
export const PUBLIC_ACTOR_COLUMNS =
  'id, user_id, entity_kind, first_name, last_name, company_name, country_code, city, sector_id, role_id, years_in_sector, kyc_status, visible_in_directory, trajectory_visible, public_avatar_path, employer_company_name, created_at' as const

type RawActorRow = {
  id: string
  user_id: string
  entity_kind: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  country_code: string | null
  city: string | null
  sector_id: string | null
  role_id: string | null
  years_in_sector: string | null
  kyc_status: string
  visible_in_directory: boolean
  trajectory_visible: boolean
  public_avatar_path: string | null
  employer_company_name: string | null
  created_at: string
}

export function displayName(row: {
  entity_kind: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
}): string {
  if (row.entity_kind === 'company' && row.company_name) {
    return row.company_name
  }
  const parts = [row.first_name, row.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return row.company_name ?? 'Actor'
}

export function toPublicActor(row: RawActorRow): PublicActor {
  return {
    user_id: row.user_id,
    actor_id: row.id,
    entity_kind: (row.entity_kind as EntityKind) ?? null,
    display_name: displayName(row),
    country_code: row.country_code,
    city: row.city,
    sector_id: row.sector_id,
    role_id: row.role_id,
    years_in_sector: row.years_in_sector,
    trajectory_visible: row.trajectory_visible,
    public_avatar_path: row.public_avatar_path,
    employer_company_name: row.employer_company_name,
    created_at: row.created_at,
  }
}

/**
 * Carga la ficha pública de un Actor por su `user_id`. Devuelve `null`
 * si no existe, si su `kyc_status` no es 'approved', o si tiene
 * `visible_in_directory=false` (opt-out RGPD).
 *
 * El 404 es opaco — no diferenciamos "no existe" vs "existe pero oculto/
 * no aprobado" para no revelar la pertenencia al sistema.
 *
 * `options.includeHidden=true` salta el filtro de visibilidad. Reservado
 * para el caso "el propio Actor consulta su propia ficha" (siempre debe
 * poder verla para gestionarla).
 */
export async function fetchPublicActor(
  sbAdmin: SupabaseClient,
  userId: string,
  options: { includeHidden?: boolean } = {},
): Promise<PublicActor | null> {
  const { data, error } = await sbAdmin
    .from('actors')
    .select(PUBLIC_ACTOR_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<RawActorRow>()
  if (error || !data) return null
  if (data.kyc_status !== 'approved') return null
  if (!options.includeHidden && !data.visible_in_directory) return null
  return toPublicActor(data)
}

/**
 * Verifica que el caller está autenticado y tiene `kyc_status='approved'`.
 * Es el gating de la "puerta 5" para lectura de fichas/listado, idéntico
 * al que aplica el server WS para iniciar conversaciones.
 *
 * Devuelve el `user.id` del caller en caso favorable, o un código de error
 * que el invocador traduce a HTTP status (route handler) o redirect (page).
 */
export type CallerCheck =
  | { ok: true; userId: string; countryActor: string | null }
  | { ok: false; reason: 'unauthenticated' | 'not_approved' | 'db_error'; detail?: string }

export async function requireApprovedCaller(
  sbAuth: SupabaseClient,
  sbAdmin: SupabaseClient,
): Promise<CallerCheck> {
  const {
    data: { user },
    error: authErr,
  } = await sbAuth.auth.getUser()
  if (authErr || !user) {
    return { ok: false, reason: 'unauthenticated' }
  }
  const { data, error } = await sbAdmin
    .from('actors')
    .select('kyc_status, country_code')
    .eq('user_id', user.id)
    .maybeSingle<{ kyc_status: string; country_code: string | null }>()
  if (error) {
    return { ok: false, reason: 'db_error', detail: error.message }
  }
  if (!data || data.kyc_status !== 'approved') {
    return { ok: false, reason: 'not_approved' }
  }
  // country_code = país de establecimiento del actor (KYC · fuente autoritativa para
  // resolver la jurisdicción aplicable a sus operaciones · ADR 0020).
  return { ok: true, userId: user.id, countryActor: data.country_code ?? null }
}
