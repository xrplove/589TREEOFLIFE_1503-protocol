/**
 * Tokens visuales del workspace — Desk Kit v2 "calma premium fintech".
 *
 * Giro de ejecución decidido por José (2026-05-31) tras cotejar contra las
 * referencias de muz.li/2026 — en particular el dashboard Hynex (Orbix Studio):
 * oscuro, SÍ, pero CALMADO. La premium-ness nace de la contención, no del neón:
 * cards casi planas con borde finísimo, brillo solo en gráficas/activos,
 * números grandes y seguros, tipografía neutra legible para el dato.
 *
 * La dirección oscuro-fintech (norte de José 30-may) se mantiene; lo que cambia
 * es el "cómo": menos HUD-gamer (brackets+glow por todo), más Bloomberg/fintech.
 */

// ── Superficies (casi-negro quieto; el dato manda) ───────────────────────────
export const BG = '#0A0C11' //            fondo base
export const BG_RAISE = '#0E1117' //      panel/superficie elevada
export const CARD = 'rgba(255,255,255,0.024)' // cristal calmado sobre el fondo
export const CARD_HOVER = 'rgba(255,255,255,0.04)'

// Bordes hairline — la clave del look calmado (1px finísimo, no glow)
export const HAIR = 'rgba(255,255,255,0.07)'
export const HAIR_STRONG = 'rgba(255,255,255,0.12)'

// ── Acentos · paleta v3 (José 31-may): blancos · verdes · lilas · oro ─────────
// Se retira el teal como protagonista. El acento interactivo/activo pasa a LILA;
// el VERDE es "vivo/dato"; el ORO es valor; el BLANCO manda en cifras.
export const LILAC = '#B9A4FF' //     acento principal / activo (lila)
export const LILAC_DIM = 'rgba(185,164,255,0.5)'
export const GREEN = '#54E08C' //     vivo / dato / positivo
export const MINT = '#86E8C0' //      verde suave (serie / acento frío)
export const GOLD = '#F0B429' //      valor / wallet / primario
export const SLATE = '#C9D4E6' //     blanco frío (serie / dato neutro)
export const AMBER = '#E8B14C' //     aviso / pendiente
export const RED = '#E0857E' //       error / negativo
export const VIOLET = LILAC //        alias retro-compat (antes #9A8CFF)
export const BLUE = '#5E9DFF' //      serie terciaria (puntual)
// Teal degradado a acento MUY puntual (ya no protagonista)
export const TEAL = '#3FCFC4'

// ── Texto ────────────────────────────────────────────────────────────────────
export const TEXT = '#EAEFF6' //      primario
export const TEXT_DIM = '#9AA7B8' //  secundario
export const MUTE = '#6B7686' //      terciario / labels
export const FAINT = '#4A5160' //     sutil

// ── Tipografía ───────────────────────────────────────────────────────────────
// Hynex-class = sans neutra legible para el dato. Geist ya está cableada.
// Chakra Petch queda reservada para el wordmark de marca (carácter), no el dato.
export const FONT = 'var(--font-geist-sans), system-ui, sans-serif'
export const FONT_MONO = 'var(--font-geist-mono), var(--font-dm-mono), monospace'
export const FONT_BRAND = 'var(--font-chakra-petch), sans-serif'

// Números tabulares (alineados en columnas, como un terminal financiero)
export const NUM = { fontFamily: FONT, fontVariantNumeric: 'tabular-nums' as const }

// ── Métricas ─────────────────────────────────────────────────────────────────
export const R = 14 //   radio card
export const R_SM = 10 // radio control
