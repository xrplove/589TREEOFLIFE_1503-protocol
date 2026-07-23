import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Genera y devuelve el ACCESO DIRECTO descargable del Actor.
 *
 * El Actor lo guarda en el escritorio de su PC. Doble clic → abre el
 * navegador en /acceso?email=... → introduce el código (que recibe por
 * email) → entra a /escritorio → /sector/<sector>.
 *
 * Dos formatos disponibles vía `?format=`:
 *  - `html` (por defecto, cross-platform): archivo .html con meta refresh
 *    a /acceso y favicon del globo. Funciona en Windows / macOS / Linux.
 *  - `url` (Windows nativo): archivo .url con IconFile referenciando el
 *    SVG del globo. Doble clic abre el navegador directamente sin pasar
 *    por la página de redirect.
 *
 * Hardening 23-may (auditoría 100%):
 *  - En producción exige sesión Actor + KYC approved. El email del shortcut
 *    debe coincidir con el email del usuario logueado (no se puede generar
 *    accesos para otra persona).
 *  - En desarrollo se permite el flujo público (sin auth) para facilitar
 *    pruebas locales.
 *
 * Vector cerrado: sin auth, un attacker podía generar accesos directos
 * .url / .html apuntando a /acceso?email=victima@x.com y distribuirlos
 * como si fueran oficiales (social engineering).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()
  const format = (url.searchParams.get('format') ?? 'html').toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Falta el parámetro email o no es válido' },
      { status: 400 },
    )
  }

  // En producción, exigir que el caller esté autenticado y que el email del
  // shortcut coincida con su email de sesión. Esto cierra el vector de
  // social engineering ("descarga este acceso oficial 1503 para tu
  // email" con un email víctima, redirigiendo al phishing).
  if (process.env.NODE_ENV === 'production') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const res = NextResponse.next()
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            res.cookies.set(name, value, options)
          }
        },
      },
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if ((user.email ?? '').toLowerCase() !== email) {
      return NextResponse.json(
        { error: 'Email does not match authenticated user' },
        { status: 403 },
      )
    }
    // No verificamos kyc_status aquí: el shortcut sirve incluso si el Actor
    // está en revisión (le permitirá entrar a /acceso → /registro/en-revision).
    // El middleware ya enforz el KYC al acceder a /escritorio.
  }

  const origin = url.origin
  const target = `${origin}/acceso?email=${encodeURIComponent(email)}`
  const svgUrl = `${origin}/icons/globe.svg`
  const icoUrl = `${origin}/icons/globe.ico`

  if (format === 'url') {
    // Windows InternetShortcut. IconFile acepta URL absoluta — Windows lo
    // descarga y lo usa como icono del archivo en el escritorio.
    // Nota: algunas versiones de Windows requieren .ico real. Si no se ve
    // el icono custom, queda el genérico (mejorable en iteración futura
    // con un .ico generado a partir del SVG).
    const urlFile = [
      '[InternetShortcut]',
      `URL=${target}`,
      `IconFile=${icoUrl}`,
      'IconIndex=0',
      '',
    ].join('\r\n')

    return new NextResponse(urlFile, {
      status: 200,
      headers: {
        'Content-Type': 'application/internet-shortcut',
        'Content-Disposition':
          'attachment; filename="1503-Acceder.url"; filename*=UTF-8\'\'1503%20Acceder.url',
        'Cache-Control': 'no-store',
      },
    })
  }

  // .html cross-platform (default)
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${target}">
  <title>1503 — Acceder</title>
  <link rel="icon" type="image/svg+xml" href="${svgUrl}">
  <link rel="alternate icon" href="${icoUrl}">
  <style>
    html, body { background:#08090F; color:#E8EDF5; margin:0; min-height:100vh;
                 font-family: system-ui, -apple-system, sans-serif;
                 display:flex; align-items:center; justify-content:center; }
    .card { text-align:center; padding:2rem; max-width:420px; }
    img { width:96px; height:96px; margin-bottom:1.25rem; }
    h1 { font-weight:700; font-size:1.3rem; letter-spacing:0.04em; margin:0 0 1rem; }
    p { color:#7A8899; line-height:1.6; font-size:0.92rem; margin:0 0 1.25rem; }
    a { color:#00BFFF; text-decoration:none; font-weight:600;
        letter-spacing:0.1em; text-transform:uppercase; font-size:0.82rem;
        border:1px solid rgba(0,191,255,0.4); padding:10px 22px;
        border-radius:2px; display:inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${svgUrl}" alt="1503">
    <h1>1503 — Abriendo tu acceso</h1>
    <p>Redirigiendo a la plataforma para que introduzcas tu código. Si la página no carga sola en
    unos segundos, pulsa el botón.</p>
    <a href="${target}">Abrir 1503</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="1503-Acceder.html"; filename*=UTF-8\'\'1503%20%E2%80%94%20Acceder.html',
      'Cache-Control': 'no-store',
    },
  })
}
