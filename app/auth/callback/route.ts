import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Auth callback compartido para el flujo PKCE de Supabase Auth.
 *
 * Llega aquí cualquier redirect tras una verificación de email o magic link
 * (signUp, signInWithOtp, recovery). Supabase pone `?code=...` en la query.
 *
 * Lo intercambiamos server-side por una sesión, las cookies quedan escritas
 * en la respuesta, y redirigimos al destino que el flujo originario pidió
 * vía `?next=`. Si no se especifica `next`, vamos a la home.
 *
 * Esta ruta debe estar excluida del middleware (lo está: el matcher solo
 * cubre /escritorio/* y /operador/*-no-login).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'
  const errorDescription = url.searchParams.get('error_description')

  // Si Supabase devuelve un error (token expirado, etc.) lo propagamos al
  // origen del flujo si está claro, o al login del operador como fallback.
  if (errorDescription) {
    const fallback = next.startsWith('/operador') ? '/operador/login' : '/register/es'
    return NextResponse.redirect(
      new URL(`${fallback}?error=${encodeURIComponent(errorDescription)}`, url.origin),
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/operador/login?error=no_code', url.origin))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const fallback = next.startsWith('/operador') ? '/operador/login' : '/register/es'
    return NextResponse.redirect(
      new URL(`${fallback}?error=${encodeURIComponent(error.message)}`, url.origin),
    )
  }

  // Sesión establecida + cookies escritas. El middleware en la siguiente
  // navegación ya verá al usuario autenticado.
  return NextResponse.redirect(new URL(next, url.origin))
}
