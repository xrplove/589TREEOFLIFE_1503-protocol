import { createBrowserClient } from '@supabase/ssr'

// Cliente Supabase para el navegador, basado en cookies (no en localStorage).
// Esto es lo que permite que el middleware server-side vea la sesión del Actor
// inmediatamente después de un signUp / signInWithOtp / verificación de email.
//
// flowType: 'pkce' obliga a que las redirecciones de Supabase Auth (email
// verification y magic link) lleguen con `?code=` en la query en lugar de
// `#access_token=` en el hash. El intercambio de ese code por sesión + cookies
// se hace en app/auth/callback/route.ts (server route handler).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
  },
})

/** True when the real Supabase credentials are configured. UI can use this
    to surface a friendly "configura .env.local" hint instead of a network
    error when the user submits login/registro. */
export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
