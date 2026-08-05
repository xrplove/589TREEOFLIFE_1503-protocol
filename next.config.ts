import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Content-Security-Policy  ·  ENFORCE (verificado 2026-06-05)
//
// Política pragmática para una SPA Next.js 16 + React-Three-Fiber con estilos
// inline (style={{…}}) y framer-motion. Se sirve en modo ENFORCE (header
// `Content-Security-Policy`) tras la pasada de verificación con la app en
// navegador (perfil aislado Playwright): home + globo 3D, /preview/escritorio
// (vídeo + contenedor PBR), workspace autenticado y catálogo → 0 violaciones CSP.
//
// `'unsafe-inline'`/`'unsafe-eval'` debilitan la defensa XSS pero hoy son
// necesarios sin integración de nonces (estilos inline + R3F/shaders); aun así
// se prohíbe script/objeto de orígenes externos, base-uri y frame-ancestors.
//
// connect-src incluye el origen del WS de chat (Correo interno · useChat.ts):
// en dev ws://localhost:8787; en prod NEXT_PUBLIC_CHAT_WS_URL apunta al servidor
// real. Sin esto, enforce bloquearía el chat. (XRPL/blockchain está dormido; si
// despierta con conexión wss DESDE EL NAVEGADOR, añadir aquí su origen.)
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV !== 'production';

const chatWsUrl = process.env.NEXT_PUBLIC_CHAT_WS_URL || (isDev ? 'ws://localhost:8787' : '');
let chatOrigin = '';
try {
  if (chatWsUrl) chatOrigin = new URL(chatWsUrl).origin;
} catch {
  chatOrigin = '';
}

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // 5-ago-2026 · fuera `https://*.vercel.app` de connect-src. Era legado de cuando
  // esto vivía en Vercel: hoy prod es self-host y NADA en el código se conecta a un
  // `.vercel.app` (verificado por barrido). Un comodín sobre un dominio de hosting
  // COMPARTIDO en `connect-src` es una vía de exfiltración: cualquiera puede
  // desplegar `lo-que-sea.vercel.app`, así que autorizarlo entero es autorizar a
  // cualquier atacante que consiga inyectar script. Se quita porque no cuesta nada
  // y porque un auditor lo mira.
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${chatOrigin ? ' ' + chatOrigin : ''}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  // HTTPS estricto (ignorado por el navegador sobre http/localhost).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Se desactivan capacidades potentes no usadas hoy. Reactivar camera/microphone
  // cuando entren las comunicaciones (LiveKit, ADR 0018).
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  // Salida autónoma para contenedores (self-host en VPS Netcup): `next build` crea
  // `.next/standalone` con su `server.js` mínimo, desplegable sin instalar node_modules.
  // Vercel lo ignora (usa su propio build) → no afecta al despliegue actual.
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
