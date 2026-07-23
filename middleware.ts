import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  detectCountry,
  evaluateCountry,
  getClientIp,
  logGeofenceDecision,
  pathNeedsGeofence,
} from './app/lib/geofence'
import { getVpnProvider } from './app/lib/vpn'

/**
 * Candado de DEMO cerrada (HTTP Basic Auth) — capa 0, por delante de todo.
 * Se activa SOLO si están definidas las variables de entorno DEMO_GATE_USER y
 * DEMO_GATE_PASSWORD (que se ponen en el despliegue de demo). Sin ellas — en
 * local o en cualquier entorno no configurado — el candado queda DESACTIVADO y
 * no afecta a nada.
 *
 * NOTA HONESTA: es un portero de demo para que "no entre nadie libremente". NO
 * es un sustituto del WAF/pentest profesional ni de la auth real (bloqueantes
 * pre-deploy). Comparación simple, suficiente para gatear una demo SIN datos
 * reales; no protege producción.
 */
function demoGate(req: NextRequest): NextResponse | null {
  const user = process.env.DEMO_GATE_USER
  const pass = process.env.DEMO_GATE_PASSWORD
  if (!user || !pass) return null // candado desactivado (local / sin configurar)

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6))
      const sep = decoded.indexOf(':')
      if (sep !== -1 && decoded.slice(0, sep) === user && decoded.slice(sep + 1) === pass) {
        return null // credenciales correctas → pasa
      }
    } catch {
      // header malformado → tratar como no autorizado
    }
  }
  return new NextResponse('Autenticación requerida — demo privada 1503', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="1503 demo", charset="UTF-8"' },
  })
}

/**
 * Middleware único con TRES guards distintos según la ruta:
 *
 * - Sprint 1 Compliance MiCA (ADR 0001) — `/registro/*` (excepto sector):
 *   geofence por país detectado en cabecera del CDN (Vercel/Cloudflare).
 *   Bloquea sanciones OFAC/UE/UN. Redirige a waitlist los mercados aún no
 *   abiertos. Permite UE + EFTA. Log inmutable en `geofence_log`.
 *
 * - Bloque 3b.5.2 — `/escritorio/*`: workspace del Actor. Requiere sesión +
 *   email verificado + `actors.kyc_status === 'approved'`. Si falla cualquier
 *   condición, redirige a `/registro/en-revision` (que muestra el motivo
 *   exacto: pendiente de email, pendiente de KYC, rechazado, suspendido).
 *
 * - Bloque 3b.5.3.d — `/operador/*` (excepto `/operador/login`): panel del
 *   operador (staff). Requiere sesión + email del usuario presente en la
 *   variable de entorno `OPERATOR_EMAILS` (lista separada por comas). Si
 *   falla, redirige a `/operador/login`.
 *
 * Las páginas públicas (landing, sectores, continentes, legal, login del
 * operador) solo pasan por la capa 0 (candado de demo); NO se les aplican los
 * guards de geofence ni de sesión (early-return en el cuerpo). Con el candado
 * desactivado (sin las env vars) se comportan exactamente como antes.
 */
export async function middleware(req: NextRequest) {
  // ── Capa 0 · candado de demo cerrada (solo si está configurado) ──
  const gate = demoGate(req)
  if (gate) return gate

  const res = NextResponse.next({ request: req })
  const path = req.nextUrl.pathname

  // El matcher es catch-all (para que el candado cubra TODAS las páginas). Las
  // rutas públicas solo deben pasar por el candado: si el path no es de geofence
  // ni una ruta protegida, no aplicamos más guards (mismo comportamiento que
  // antes, cuando el matcher solo incluía /register, /escritorio, /operador y
  // /registro/sector).
  const isProtectedPath =
    path.startsWith('/escritorio') ||
    (path.startsWith('/operador') && path !== '/operador/login') ||
    path === '/registro/sector'
  if (!pathNeedsGeofence(path) && !isProtectedPath) {
    return res
  }

  // ── Guard geofence (Sprint 1 Compliance) ──
  // Aplica a /register/[code] (alta de nuevos Actores). Comprueba DOS
  // señales independientes: (1) IP del visitante, (2) código de país en
  // la URL. Aplica la regla más estricta de las dos.
  //
  // Razón: si un visitante alemán pincha sobre USA en el mapa, la IP es DE
  // (allowed) pero el code es US (blocked_pending_license). Sin esta
  // comprobación doble, el alemán podría darse de alta como Actor US.
  if (pathNeedsGeofence(path)) {
    const { country: ipCountry, via } = detectCountry(req)

    // Extraer code de la URL /register/[code]
    const urlCodeMatch = path.match(/^\/register\/([a-z]{2})(?:\/|$)/i)
    const urlCountry = urlCodeMatch ? urlCodeMatch[1]!.toUpperCase() : null

    const ip = getClientIp(req)
    const ua = req.headers.get('user-agent') ?? undefined

    // ── VPN-1 lite — capa 1.5: detección de anonimización ──
    // Tor invalida la confianza en el país (un sancionado puede salir por
    // una IP UE). Por eso se comprueba ANTES que el país y bloquea
    // siempre. vpn/proxy NO bloquean (muchos B2B usan VPN corporativa):
    // solo se registran como contexto en el log de auditoría.
    const vpnSignals = await getVpnProvider().detect({ ip, headers: req.headers })

    if (vpnSignals.tor) {
      await logGeofenceDecision({
        ip, country: ipCountry, via,
        pathAttempted: path, actionTaken: 'blocked_tor', userAgent: ua,
        vpn: vpnSignals.vpn, tor: true, proxy: vpnSignals.proxy,
      })
      const url = new URL('/restricted/blocked', req.url)
      if (ipCountry) url.searchParams.set('c', ipCountry)
      return NextResponse.rewrite(url)
    }

    // Evaluar ambas señales (en paralelo cuando aplique)
    const [ipRestriction, urlRestriction] = await Promise.all([
      ipCountry ? evaluateCountry(ipCountry) : Promise.resolve(null),
      urlCountry ? evaluateCountry(urlCountry) : Promise.resolve(null),
    ])

    // Determinar el estado más restrictivo. Orden de severidad:
    // blocked_sanctions > blocked_pending_license > waitlist > allowed
    const severity: Record<string, number> = {
      allowed: 0,
      waitlist: 1,
      blocked_pending_license: 2,
      blocked_sanctions: 3,
    }
    const candidates = [ipRestriction, urlRestriction].filter(Boolean) as NonNullable<typeof ipRestriction>[]
    const worst = candidates.length > 0
      ? candidates.reduce((acc, r) => (severity[r.status]! > severity[acc.status]! ? r : acc))
      : null
    // Logueamos con el código que disparó la decisión (URL tiene prioridad
    // visual porque es la intención del Actor)
    const triggerCountry = urlRestriction && severity[urlRestriction.status]! >= severity[worst?.status ?? 'allowed']!
      ? urlCountry
      : ipCountry

    if (worst?.status === 'blocked_sanctions') {
      await logGeofenceDecision({
        ip, country: triggerCountry, via: urlCountry ? `${via}+url` : via,
        pathAttempted: path, actionTaken: 'blocked_sanctions', userAgent: ua,
        vpn: vpnSignals.vpn, tor: vpnSignals.tor, proxy: vpnSignals.proxy,
      })
      const url = new URL('/restricted/sanctioned', req.url)
      if (triggerCountry) url.searchParams.set('c', triggerCountry)
      return NextResponse.rewrite(url)
    }

    // Política 24-may: blocked_pending_license y waitlist quedan como
    // estados LEGADO. Si aún hay países con esos estados en la BD (de
    // antes de la migración 011) los tratamos como `allowed` — el
    // marketplace acepta a cualquiera salvo sancionados. Solo logueamos
    // que pasó por aquí para visibilidad temporal hasta que se complete
    // la migración 011.
    if (worst?.status === 'blocked_pending_license' || worst?.status === 'waitlist') {
      await logGeofenceDecision({
        ip, country: triggerCountry, via: urlCountry ? `${via}+url` : via,
        pathAttempted: path, actionTaken: `allowed_legacy_${worst.status}`, userAgent: ua,
        vpn: vpnSignals.vpn, tor: vpnSignals.tor, proxy: vpnSignals.proxy,
      })
      // Sin rewrite — pasa como allowed.
    }

    // País permitido pero VPN heurística detectada: NO se bloquea (evitar
    // falsos positivos con VPN corporativa), solo se registra para
    // visibilidad/forense y futuro risk-scoring.
    if (vpnSignals.vpn) {
      await logGeofenceDecision({
        ip, country: triggerCountry, via: urlCountry ? `${via}+url` : via,
        pathAttempted: path, actionTaken: 'allowed_flagged_vpn', userAgent: ua,
        vpn: true, tor: false, proxy: vpnSignals.proxy,
      })
    }
    // worst.status === 'allowed' (o sin candidatos) → continúa
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    // Sin credenciales no podemos resolver la sesión; lo más seguro es bloquear.
    return NextResponse.redirect(new URL('/register/es', req.url))
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Tokens refrescados se escriben tanto al request en curso como al
        // response que volverá al navegador, para mantener la sesión
        // sincronizada en todo momento.
        for (const { name, value, options } of cookiesToSet) {
          req.cookies.set(name, value)
          res.cookies.set(name, value, options)
        }
      },
    },
  })

  const isOperatorRoute = path.startsWith('/operador') && path !== '/operador/login'
  const isSectorPicker = path === '/registro/sector'
  const isPrivateRoute = path.startsWith('/escritorio') || isOperatorRoute || isSectorPicker

  // Si el path no es privado (solo está aquí por el geofence de /registro),
  // no aplicamos guards de sesión. El geofence ya hizo su trabajo arriba y
  // /registro/[code] es público para Actores que vienen a darse de alta.
  if (!isPrivateRoute) {
    return res
  }

  // getUser() valida el JWT contra el server de Supabase (más seguro que
  // getSession(), que confía solo en la cookie local). Coste: 1 round-trip
  // extra por request, asumible para rutas privadas.
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    // Sin sesión: cada zona redirige a su propia "puerta de entrada".
    return NextResponse.redirect(
      new URL(isOperatorRoute ? '/operador/login' : '/register/es', req.url),
    )
  }

  // ── Guard del panel del operador ──
  if (isOperatorRoute) {
    const operatorEmails = (process.env.OPERATOR_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const userEmail = (user.email ?? '').toLowerCase()
    const isOperator = operatorEmails.includes(userEmail)

    if (!isOperator) {
      // Sesión válida pero no es operador: redirigir a la home (sin pista de
      // que /operador existe).
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  }

  // ── Guard del workspace del Actor (/escritorio/*) ──
  if (!user.email_confirmed_at) {
    return NextResponse.redirect(new URL('/registro/en-revision', req.url))
  }

  const { data: actor } = await supabase
    .from('actors')
    .select('kyc_status, sector_chosen_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!actor || actor.kyc_status !== 'approved') {
    return NextResponse.redirect(new URL('/registro/en-revision', req.url))
  }

  // Bloque 4 — primera entrada post-KYC:
  // Si está en /registro/sector pero YA eligió sector, mandarlo al
  // escritorio (no debería volver aquí). Si está en /escritorio/* pero
  // todavía NO eligió sector, redirigirlo a /registro/sector para que
  // cierre el onboarding y descargue su acceso directo.
  if (isSectorPicker && actor.sector_chosen_at != null) {
    return NextResponse.redirect(new URL('/escritorio/init', req.url))
  }
  if (!isSectorPicker && actor.sector_chosen_at == null) {
    return NextResponse.redirect(new URL('/registro/sector', req.url))
  }

  return res
}

export const config = {
  // El middleware se ejecuta en estas rutas:
  //  - /escritorio/* y /registro/sector: guard de sesión + KYC + sector_chosen
  //  - /operador/* (excepto login): guard de operador
  //  - /register/*: guard de geofence (Sprint 1 Compliance MiCA)
  //
  // El matcher excluye explícitamente /operador/login para que cualquiera
  // pueda acceder a la página de login del operador.
  matcher: [
    // Catch-all (excluye assets estáticos de Next y favicon) para que el
    // CANDADO DE DEMO cubra TODAS las páginas. Los guards internos
    // (geofence en /register/*, sesión en /escritorio·/operador·/registro/sector)
    // siguen aplicándose solo a sus rutas mediante las comprobaciones del cuerpo.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
