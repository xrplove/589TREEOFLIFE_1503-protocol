'use client'

import { useEffect, useState } from 'react'
import DataSea from './DataSea'
import WorldGlobeWireframe from './WorldGlobeWireframe'
import VoyageNodes from './VoyageNodes'

/**
 * Hero cinemático "La travesía de 1503" — pieza reutilizable.
 *
 * Composición por capas (todas `absolute` dentro de la propia sección, para que
 * el hero haga scroll-away y no invada el contenido inferior de la home):
 *   z0 · DataSea             — mar de datos corriendo hacia el espectador (Beat 1)
 *   z0 · WorldGlobeWireframe — el globo se forma desde la constelación (Beat 4)
 *   z2 · viñeta · z4 nébula · z5 overlay editorial · z6 nodos · z7/8 sello+anillo
 *
 * Reproducción:
 *   - Primera visita de la sesión → cinemática completa (sessionStorage).
 *   - Visitas siguientes dentro de la sesión → ESTADO FINAL al instante (sin
 *     re-reproducir): globo formado, nodos visibles, sello acomodado arriba-dcha.
 *   - prefers-reduced-motion → estado final directo.
 *   - `forceReplay` (sandbox /preview/voyage) ignora la sesión y siempre reproduce.
 *
 * El usuario LOGUEADO nunca pasa por la home (entra por su acceso directo →
 * /acceso → /escritorio), así que la home — y por tanto esta cinemática — solo
 * la ven invitados/prospectos. Por eso prima no re-reproducirla al volver.
 *
 * `children` se pinta por encima (z10) para el "chrome" propio de cada página
 * (HUD del sandbox, o el hint de scroll de la home).
 */

type PlayMode = 'play' | 'instant'

/** Copy del hero. beatC y tag pueden llevar la palabra a resaltar entre *asteriscos*. */
export type HeroCopy = {
  beatA: string
  beatB: string
  beatC: string
  kicker: string
  tag: string
  enter: string
}

const HERO_ES: HeroCopy = {
  beatA: 'En 1503, Sevilla ordenó el comercio del mundo.',
  beatB: 'La Casa de Contratación registró cada ruta.',
  beatC: 'Hoy, esa ruta es una *red*.',
  kicker: 'Pasaporte Digital de Producto · Cumplimiento de exportación',
  tag: 'La infraestructura que une todo el *comercio global*.',
  enter: 'Elige un continente para entrar →',
}

/** Renderiza el texto resaltando lo que va entre *asteriscos* con el envoltorio dado. */
function mark(text: string, kind: 'hl' | 'em'): React.ReactNode[] {
  return text.split('*').map((part, i) => {
    if (i % 2 === 0) return part
    return kind === 'hl' ? (
      <span key={i} className="hl">
        {part}
      </span>
    ) : (
      <em key={i}>{part}</em>
    )
  })
}

export default function VoyageHero({
  forceReplay = false,
  hero = HERO_ES,
  nodeLabels,
  nodeAria,
  memberOf = 'Miembro de',
  children,
}: {
  forceReplay?: boolean
  hero?: HeroCopy
  /** Nombres de continente por código `short` para el selector (i18n). */
  nodeLabels?: Record<string, string>
  nodeAria?: string
  /** Conector i18n del distintivo de respaldo ("Miembro de" / "Member of"…). */
  memberOf?: string
  children?: React.ReactNode
}) {
  // SSR y primer render de cliente comparten 'play' (determinista → sin mismatch
  // de hidratación). Tras montar decidimos si degradar a 'instant'.
  const [mode, setMode] = useState<PlayMode>('play')

  // El setState en este effect es intencionado: la decisión play/instant
  // depende de señales SOLO de cliente (prefers-reduced-motion vía matchMedia y
  // sessionStorage). Hacerlo tras montar mantiene SSR y primer render de
  // cliente idénticos (= 'play') → sin mismatch de hidratación; el render extra
  // a 'instant' es justo lo deseado.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setMode('instant')
      return
    }
    if (forceReplay) {
      setMode('play')
      return
    }
    try {
      if (sessionStorage.getItem('voyage-seen')) {
        setMode('instant')
      } else {
        sessionStorage.setItem('voyage-seen', '1')
        setMode('play')
      }
    } catch {
      // sessionStorage no disponible (modo privado estricto) → reproducir.
      setMode('play')
    }
  }, [forceReplay])
  /* eslint-enable react-hooks/set-state-in-effect */

  // revealStart muy negativo → el globo ya está formado en t=0 (estado instantáneo).
  const revealStart = mode === 'instant' ? -100 : 8

  return (
    <section className={`voyage-hero ${mode === 'instant' ? 'is-instant' : 'is-playing'}`}>
      <style>{CSS}</style>

      {/* Capas 3D (absolute → scroll-away) */}
      <DataSea mode="absolute" />
      <WorldGlobeWireframe
        mode="absolute"
        opacity={1}
        cameraDistance={7.6}
        monochrome
        revealStart={revealStart}
      />

      {/* Viñeta para asentar el contraste */}
      <div className="voyage-vignette" aria-hidden />

      {/* Nébula que se acerca y se disipa, revelando los nodos */}
      <div className="voyage-nebula" aria-hidden />

      {/* Nodos de continente que orbitan el globo */}
      <VoyageNodes labels={nodeLabels} ariaLabel={nodeAria} />

      {/* Anillo de impacto del estampado (shockwave) */}
      <div className="voyage-seal-ring" aria-hidden />

      {/* Sello de certificación — cae al centro, estampa y se acomoda arriba-dcha */}
      <div className="voyage-seal" aria-hidden>
        {/* Sello real (galeón de José) extraído a transparente · scripts/extract-galeon.mjs.
            El PNG original es cian; el filtro lo recolorea a ORO (#F0B429) preservando el
            grabado (sepia fija el tono cálido, saturate+hue-rotate lo llevan al dorado). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sello-1503.png"
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            filter:
              'sepia(1) saturate(5.5) hue-rotate(3deg) brightness(1.18) contrast(1.02) drop-shadow(0 0 14px rgba(240,180,41,0.5))',
          }}
        />
      </div>

      {/* Distintivo de respaldo — tono ORO, bajo el sello (par visual con él).
          El nombre del programa no se traduce; "Miembro de" sí (i18n). */}
      <a
        className="voyage-member"
        href="https://www.anthropic.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="voyage-member-dot" aria-hidden />
        <span className="voyage-member-of">{memberOf}</span>
        <span className="voyage-member-name">Claude for Startups</span>
      </a>

      {/* ───────── Overlay editorial — la historia ───────── */}
      <div className="voyage-overlay">
        {/* Tres frases (ANTES de que se forme el globo) */}
        <p className="voyage-beat beat-a">{hero.beatA}</p>
        <p className="voyage-beat beat-b">{hero.beatB}</p>
        <p className="voyage-beat beat-c">{mark(hero.beatC, 'hl')}</p>

        {/* Titular final (entra y permanece) — arriba a la izquierda */}
        <div className="voyage-title">
          <p className="voyage-kicker">{hero.kicker}</p>
          <h1 className="voyage-h1">1503</h1>
          <p className="voyage-tag">{mark(hero.tag, 'em')}</p>
          <p className="voyage-hint">{hero.enter}</p>
        </div>
      </div>

      {/* Chrome específico de cada página (HUD sandbox / hint de scroll) */}
      {children}
    </section>
  )
}

const CSS = `
.voyage-hero {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #05070d;
  color: #E8EDF5;
  font-family: var(--font-chakra-petch), system-ui, sans-serif;
}

.voyage-vignette {
  position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(120% 90% at 50% 38%, transparent 45%, rgba(5,7,13,0.55) 100%);
}

/* Nébula: se acerca (scale) y se disipa, dejando los nodos a la vista */
.voyage-nebula {
  position: absolute; inset: 0; z-index: 4; pointer-events: none; opacity: 0;
  background:
    radial-gradient(38% 40% at 32% 58%, rgba(0,163,255,0.20), transparent 70%),
    radial-gradient(44% 46% at 68% 42%, rgba(90,190,255,0.16), transparent 70%),
    radial-gradient(34% 34% at 52% 52%, rgba(0,140,255,0.14), transparent 72%);
  filter: blur(22px);
}
.is-playing .voyage-nebula { animation: voyageNebula 2.8s ease-in-out 11.8s both; }
@keyframes voyageNebula {
  0%   { opacity: 0;    transform: scale(0.55); }
  45%  { opacity: 0.95; transform: scale(1.15); }
  100% { opacity: 0;    transform: scale(2.3); }
}

/* Nodos de continente orbitando el globo */
.voyage-nodes {
  position: absolute; inset: 0; z-index: 6; width: 100%; height: 100%;
  pointer-events: none; overflow: visible; opacity: 0;
}
.is-playing .voyage-nodes { animation: voyageIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) 12.7s both; }
.voyage-node { cursor: pointer; pointer-events: auto; }
.voyage-node polygon { transition: fill 0.25s, stroke 0.25s; }
.voyage-node:hover polygon { fill: #12243b; stroke: #7FD4FF; stroke-width: 1.9; }

.voyage-overlay {
  position: absolute; inset: 0; z-index: 5; pointer-events: none;
}

/* Beats históricos — centrados (momento dramático) */
.voyage-beat {
  position: absolute;
  top: 44%; left: 50%; transform: translate(-50%, -50%);
  width: 90%; max-width: 900px; text-align: center;
  margin: 0;
  color: #C7D6E8;
  font-family: var(--font-chakra-petch), system-ui, sans-serif;
  font-weight: 400; letter-spacing: 0.02em;
  font-size: clamp(1.2rem, 2.8vw, 2rem);
  opacity: 0;
}
.is-playing .voyage-beat { animation: voyageBeat 3.2s ease both; }
.is-playing .beat-a { animation-delay: 0.4s; }
.is-playing .beat-b { animation-delay: 3.6s; }
.is-playing .beat-c { animation-delay: 6.8s; }
.voyage-beat .hl { color: #7FD4FF; font-style: italic; text-shadow: 0 0 22px rgba(0,163,255,0.55); }

@keyframes voyageBeat {
  0%   { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); filter: blur(4px); }
  10%  { opacity: 1; transform: translate(-50%, -50%);             filter: blur(0); }
  88%  { opacity: 1; transform: translate(-50%, -50%); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 8px)); filter: blur(4px); }
}

/* ───────── Sello: estampado con impacto ─────────
   Cae grande al centro, "sella" (impacto + leve sacudida) y vuela a su sitio
   arriba-dcha encogiéndose. La traslación a la esquina es responsive y exacta:
   anclado en left/top:50%, se mueve a right:4vw/top:7vh con calc(46vw - 100%)
   (100% = ancho del sello) y -43vh, sin depender del alto del sello. */
.voyage-seal {
  position: absolute; left: 50%; top: 50%; z-index: 8;
  width: clamp(120px, 13vw, 165px);
  transform-origin: center center;
  transform: translate(-50%, -50%) scale(3); /* estado base (oculto vía opacity) */
  opacity: 0; pointer-events: none;
}
.is-playing .voyage-seal { animation: voyageStamp 2.2s 10.6s both; }
@keyframes voyageStamp {
  0%   { transform: translate(-50%, -50%) scale(3);    opacity: 0; filter: blur(10px);
         animation-timing-function: cubic-bezier(0.5, 0, 0.75, 0); }
  11%  { transform: translate(-50%, -50%) scale(2.15); opacity: 1; filter: blur(0);
         animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
  16%  { transform: translate(-50%, -50%) scale(1.98); }
  20%  { transform: translate(-50.6%, -49.4%) scale(2.08) rotate(-0.5deg); }
  24%  { transform: translate(-49.5%, -50.5%) scale(2.03) rotate(0.4deg); }
  28%  { transform: translate(-50%, -50%) scale(2.05) rotate(0deg); }
  45%  { transform: translate(-50%, -50%) scale(2.05);
         animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); }
  100% { transform: translate(calc(43vw - 100%), -40vh) scale(1); opacity: 1; }
}

/* Distintivo "Miembro de Claude for Startups" — ORO, bajo el sello.
   Aparece cuando el sello ya se ha acomodado arriba-dcha (par visual). */
.voyage-member {
  /* top = ancla del sello (10vh) + su alto + margen, para caer SIN taparlo. */
  position: absolute; top: calc(10vh + 185px); right: 3.4vw; z-index: 9;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  border: 1px solid rgba(240,180,41,0.45); border-radius: 999px;
  background: rgba(240,180,41,0.06); backdrop-filter: blur(3px);
  text-decoration: none; opacity: 0;
}
.voyage-member-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: #F0B429; box-shadow: 0 0 8px rgba(240,180,41,0.7);
}
.voyage-member-of {
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase;
  color: #F0B429; opacity: 0.9;
}
.voyage-member-name {
  font-family: var(--font-chakra-petch), system-ui, sans-serif;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; color: #F7D98A;
}
.is-playing .voyage-member { animation: voyageIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) 13s both; }
.is-instant .voyage-member { opacity: 1; }
@media (max-width: 820px) {
  /* En móvil el hero va apretado: llevamos el distintivo a pie centrado. */
  .voyage-member { top: auto; bottom: 2.6vh; right: auto; left: 50%; transform: translateX(-50%); }
}

/* Anillo de impacto (shockwave) — solo durante el estampado */
.voyage-seal-ring {
  position: absolute; left: 50%; top: 50%; z-index: 7;
  width: clamp(220px, 28vw, 360px); aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 2px solid rgba(127, 212, 255, 0.7);
  box-shadow: 0 0 44px rgba(0, 163, 255, 0.45), inset 0 0 30px rgba(0, 163, 255, 0.22);
  transform-origin: center center;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0; pointer-events: none;
}
.is-playing .voyage-seal-ring { animation: voyageRing 0.7s ease-out 10.82s both; }
@keyframes voyageRing {
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  18%  { opacity: 0.85; }
  100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
}

/* Titular final — confinado al rincón superior-izquierdo (no invade globo/nodos) */
.voyage-title {
  position: absolute; top: 10vh; left: 4vw; text-align: left;
  max-width: min(34vw, 400px);
  opacity: 0;
}
.is-playing .voyage-title { animation: voyageIn 1.7s cubic-bezier(0.16, 1, 0.3, 1) 10.5s both; }
.voyage-kicker {
  margin: 0 0 0.8rem;
  color: #59B6F0;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.58rem; letter-spacing: 0.24em; text-transform: uppercase;
  text-shadow: 0 0 16px rgba(5,7,13,0.9), 0 2px 12px rgba(5,7,13,0.9);
}
.voyage-h1 {
  margin: 0; font-weight: 700; line-height: 0.95;
  font-size: clamp(2.6rem, 6.5vw, 5.4rem); letter-spacing: 0.06em; color: #E8EDF5;
  text-shadow: 0 0 38px rgba(0,163,255,0.35);
}
.voyage-tag {
  margin: 0.5rem 0 0; color: #9FB6CC; font-weight: 400;
  font-size: clamp(0.9rem, 1.4vw, 1.2rem); letter-spacing: 0.03em; line-height: 1.35;
}
.voyage-tag em { color: #7FD4FF; font-style: normal; font-weight: 600; text-shadow: 0 0 26px rgba(0,163,255,0.55); }
.voyage-hint {
  margin: 2.4rem 0 0; color: #4A5566;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.72rem; letter-spacing: 0.24em; text-transform: uppercase;
}
.is-playing .voyage-hint { animation: voyagePulse 2.6s ease-in-out 13.2s infinite; }

@keyframes voyageIn {
  0%   { opacity: 0; transform: translateY(14px); filter: blur(8px); }
  100% { opacity: 1; transform: none;             filter: blur(0); }
}
@keyframes voyagePulse {
  0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; }
}

/* ───────── Estado final instantáneo (visitas siguientes en la sesión) ───────── */
.is-instant .voyage-beat { display: none; }
.is-instant .voyage-nebula { display: none; }
.is-instant .voyage-seal-ring { display: none; }
.is-instant .voyage-title { opacity: 1; }
.is-instant .voyage-nodes { opacity: 1; }
.is-instant .voyage-hint { opacity: 0.7; animation: voyagePulse 2.6s ease-in-out infinite; }
.is-instant .voyage-seal {
  opacity: 1;
  transform: translate(calc(43vw - 100%), -40vh) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .voyage-beat { display: none; }
  .voyage-nebula { display: none; }
  .voyage-seal-ring { display: none; }
  .voyage-title { opacity: 1; animation: none; }
  .voyage-nodes { opacity: 1; animation: none; }
  .voyage-hint { animation: none; opacity: 0.7; }
  .voyage-seal {
    opacity: 1; animation: none;
    transform: translate(calc(43vw - 100%), -40vh) scale(1);
  }
  .voyage-member { opacity: 1; animation: none; }
}
`
