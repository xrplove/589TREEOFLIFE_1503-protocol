import { redirect } from 'next/navigation'

/**
 * /escritorio es ahora un wrapper que redirige a /escritorio/init.
 * La página de inicialización lee el Actor de Supabase, escribe sus datos
 * a localStorage y redirige al WorkspaceShell del sector correspondiente
 * (/sector/<sector_id>) — el escritorio real con sus 8 pestañas.
 *
 * El middleware ya bloquea el acceso sin sesión + KYC aprobado.
 */
export default function EscritorioRedirectPage() {
  redirect('/escritorio/init')
}
