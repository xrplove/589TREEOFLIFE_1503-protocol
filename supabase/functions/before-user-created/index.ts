// supabase/functions/before-user-created/index.ts
//
// H-5 — Capa C (defensa en profundidad). Auth Hook "Before User Created" de
// GoTrue. Es la segunda barrera: aunque alguien evite la API Route
// server-side (capa A) y llame a GoTrue directamente, este hook se ejecuta
// igual ANTES de crear el usuario, con la IP REAL capturada por GoTrue, y
// aplica el geofence MiCA. Fail-closed estricto: ante cualquier duda, se
// aborta el alta.
//
// Requisitos de despliegue (gestión externa — NO asumidos hechos):
//   - GeoLite2-Country.mmdb de MaxMind junto a este index.ts (cuenta + licencia).
//   - Hook "Before User Created" registrado en Supabase apuntando a esta función.
//   - Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//     BEFORE_USER_CREATED_SECRET (el `v1,whsec_...` de la sección Auth Hooks).
//   - Deploy: `supabase functions deploy before-user-created --no-verify-jwt`
//     (la autenticidad la da la firma Standard Webhooks, no el JWT).
//
// A VERIFICAR en staging (no son hechos, son supuestos): que el specifier
// npm:@maxmind/geoip2-node funcione en el runtime Deno de Supabase; que el
// .mmdb empotrado sea legible con Deno.readFile en el entorno desplegado;
// que GoTrue propague el error.message al cliente con el 4xx elegido.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
// ⚠️ RIESGO CONOCIDO (revisión independiente 2026-05-17): el specifier
// `npm:@maxmind/geoip2-node` PUEDE no funcionar de forma fiable en el
// runtime Deno de Supabase Edge Functions (la lib oficial de MaxMind para
// Node se apoya en mmdb-lib; aunque mmdb-lib es JS puro, la compat `npm:`
// + lectura de fichero en el sandbox no está verificada). NO está probado
// bloqueante, pero ANTES de activar este hook hay que: (a) verificar en
// staging que resuelve IPs sin error, o (b) sustituir por un lector MMDB
// nativo de Deno verificado. NO intercambiar a ciegas. Ver
// docs/audit/2026-05-17-plan-h5-capa-a.md §6.
import { Reader } from "npm:@maxmind/geoip2-node@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const HOOK_SECRET = Deno.env.get("BEFORE_USER_CREATED_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// La librería standardwebhooks espera el secreto base64 (acepta el prefijo
// `whsec_`). Supabase lo entrega como `v1,whsec_<base64>`: se quita solo el
// `v1,` y se conserva `whsec_<base64>`.
const webhook = HOOK_SECRET
  ? new Webhook(HOOK_SECRET.replace(/^v1,/, ""))
  : null;

// Carga única de la BD GeoLite2 al levantar el isolate (no por request).
// Si falla, geoReader queda null → todo alta se rechaza (fail-closed).
let geoReader: Awaited<ReturnType<typeof Reader.openBuffer>> | null = null;
try {
  const dbBuffer = await Deno.readFile(
    new URL("./GeoLite2-Country.mmdb", import.meta.url),
  );
  geoReader = await Reader.openBuffer(dbBuffer);
} catch (err) {
  console.error("[before-user-created] No se pudo cargar GeoLite2:", err);
}

function reject(message: string, httpCode = 403): Response {
  return new Response(
    JSON.stringify({ error: { http_code: httpCode, message } }),
    { status: httpCode, headers: { "Content-Type": "application/json" } },
  );
}

function allow(): Response {
  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  try {
    // 1. Autenticidad: firma Standard Webhooks (única puerta, deploy es
    //    --no-verify-jwt). Las TRES cabeceras son obligatorias; verify()
    //    valida firma + ventana anti-replay del timestamp.
    if (!webhook) {
      return reject("Hook mal configurado (secreto ausente).", 500);
    }
    const wid = req.headers.get("webhook-id");
    const wts = req.headers.get("webhook-timestamp");
    const wsig = req.headers.get("webhook-signature");
    if (!wid || !wts || !wsig) {
      return reject("Cabeceras de webhook ausentes.", 401);
    }

    const rawBody = await req.text();
    try {
      webhook.verify(rawBody, {
        "webhook-id": wid,
        "webhook-timestamp": wts,
        "webhook-signature": wsig,
      });
    } catch {
      return reject("Firma de webhook inválida.", 401);
    }

    // 2. IP real capturada por GoTrue (NO de cabeceras del salto al hook).
    const payload = JSON.parse(rawBody);
    const ipAddress: string | undefined = payload?.metadata?.ip_address;
    if (!ipAddress) {
      return reject("No se pudo determinar la IP de origen.", 422);
    }

    // 3. IP → país con BD local (sin llamada externa, sin enviar IP a
    //    terceros). Sin reader o sin país resoluble → fail-closed.
    if (!geoReader) {
      return reject("Servicio de geolocalización no disponible.", 503);
    }
    let countryCode: string | null = null;
    try {
      const r = geoReader.country(ipAddress);
      countryCode = r.country?.isoCode ?? null;
    } catch {
      return reject("País de origen no identificable.", 422);
    }
    if (!countryCode) {
      return reject("País de origen no identificable.", 422);
    }

    // 4. Lista (fuente única: country_restrictions, igual que el middleware).
    //    Solo `status === 'allowed'` permite avanzar. Cualquier otro estado,
    //    fila ausente o error de BD → fail-closed.
    const { data: restriction, error: dbError } = await supabase
      .from("country_restrictions")
      .select("status")
      .eq("country_code", countryCode.toUpperCase())
      .maybeSingle();

    if (dbError) {
      console.error("[before-user-created] Error consultando restricciones:", dbError);
      return reject("Error de validación de jurisdicción.", 503);
    }
    if (!restriction || restriction.status !== "allowed") {
      return reject(
        "Registro no disponible en su jurisdicción (cumplimiento MiCA).",
        403,
      );
    }

    return allow();
  } catch (err) {
    console.error("[before-user-created] Excepción no controlada:", err);
    return reject("Error crítico de seguridad en el alta.", 500);
  }
});
