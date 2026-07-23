'use client'

import { useEffect, useState } from 'react'
import RealEarthVoyage from './RealEarthVoyage'
import VoyageNodes from './VoyageNodes'

/**
 * Hero cinemático v2 — "La travesía de 1503 · REAL".
 *
 * Misma dramaturgia que la v1 (3 frases → revelado → estampado del galeón →
 * nodos → titular) pero con dirección de arte REAL (encargo José 12-jun,
 * docs/cinematica-v2-real.md): espacio profundo con estrellas, la Tierra de
 * noche con luces de ciudades reales (NASA), limbo atmosférico y rutas
 * comerciales como arcos de luz. SIN retícula, SIN nébula, SIN neón saturado.
 *
 * Capas: z0 RealEarthVoyage (estrellas+Tierra+arcos) · z2 viñeta ·
 * z5 overlay editorial · z6 nodos · z7/8 sello+anillo · z10 children (HUD).
 *
 * Reproducción: idéntica a v1 (1ª visita reproduce · siguientes → estado final ·
 * prefers-reduced-motion → final · forceReplay para el sandbox /preview/voyage2).
 */

type PlayMode = 'play' | 'instant'

export default function VoyageHeroReal({
  forceReplay = false,
  children,
}: {
  forceReplay?: boolean
  children?: React.ReactNode
}) {
  const [mode, setMode] = useState<PlayMode>('play')

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
      if (sessionStorage.getItem('voyage2-seen')) {
        setMode('instant')
      } else {
        sessionStorage.setItem('voyage2-seen', '1')
        setMode('play')
      }
    } catch {
      setMode('play')
    }
  }, [forceReplay])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <section className={`voyage2-hero ${mode === 'instant' ? 'is-instant' : 'is-playing'}`}>
      <style>{CSS}</style>

      {/* Espacio + Tierra real + arcos (la pieza 3D gobierna sus propios tiempos) */}
      <RealEarthVoyage instant={mode === 'instant'} />

      {/* Viñeta suave para asentar texto en los bordes */}
      <div className="voyage2-vignette" aria-hidden />

      {/* Nodos de continente (componente v1, clicables) */}
      <VoyageNodes />

      {/* Anillo de impacto del estampado */}
      <div className="voyage2-seal-ring" aria-hidden />

      {/* Sello real (galeón) — cae, estampa y se acomoda arriba-dcha */}
      <div className="voyage2-seal" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sello-1503.png" alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
      </div>

      {/* ── Overlay editorial — la historia ── */}
      <div className="voyage2-overlay">
        <p className="voyage2-beat beat-a">En 1503, Sevilla ordenó el comercio del mundo.</p>
        <p className="voyage2-beat beat-b">La Casa de Contratación registró cada ruta.</p>
        <p className="voyage2-beat beat-c">
          Hoy, esa ruta es una <span className="hl">red</span>.
        </p>

        <div className="voyage2-title">
          <p className="voyage2-kicker">Pasaporte Digital de Producto · Cumplimiento de exportación</p>
          <h1 className="voyage2-h1">1503</h1>
          <p className="voyage2-tag">
            La infraestructura que une todo el <em>comercio global</em>.
          </p>
          <p className="voyage2-hint">Elige un continente para entrar →</p>
        </div>
      </div>

      {children}
    </section>
  )
}

const CSS = `
.voyage2-hero {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #02030a;
  color: #E8EDF5;
  font-family: var(--font-chakra-petch), system-ui, sans-serif;
}

.voyage2-vignette {
  position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(125% 95% at 50% 40%, transparent 52%, rgba(2,3,10,0.6) 100%);
}

/* Nodos (reutiliza .voyage-nodes del componente compartido) */
.voyage2-hero .voyage-nodes {
  position: absolute; inset: 0; z-index: 6; width: 100%; height: 100%;
  pointer-events: none; overflow: visible; opacity: 0;
}
.voyage2-hero.is-playing .voyage-nodes { animation: v2In 1.6s cubic-bezier(0.16, 1, 0.3, 1) 12.7s both; }
/* v2.6: los nodos de continente son ahora un GRAFO (1503 hub + columna derecha +
   conexiones + destellos). El estilo vive en VoyageNodes (NODE_CSS); aquí solo
   el click. */
.voyage2-hero .voyage-node { cursor: pointer; pointer-events: auto; }

.voyage2-overlay { position: absolute; inset: 0; z-index: 5; pointer-events: none; }

/* Frases históricas — ARRIBA del planeta (legibles sobre el espacio, no sobre las luces) */
.voyage2-beat {
  position: absolute;
  top: 24%; left: 50%; transform: translate(-50%, -50%);
  width: 90%; max-width: 900px; text-align: center;
  margin: 0;
  color: #E4EDF6;
  font-weight: 400; letter-spacing: 0.02em;
  font-size: clamp(1.2rem, 2.8vw, 2rem);
  text-shadow: 0 0 14px rgba(2,3,10,1), 0 2px 30px rgba(2,3,10,0.95), 0 0 60px rgba(2,3,10,0.9);
  opacity: 0;
}
.is-playing .voyage2-beat { animation: v2Beat 3.2s ease both; }
.is-playing .beat-a { animation-delay: 0.4s; }
.is-playing .beat-b { animation-delay: 3.6s; }
.is-playing .beat-c { animation-delay: 6.8s; }
.voyage2-beat .hl { color: #9FD9FF; font-style: italic; text-shadow: 0 0 22px rgba(90,170,255,0.5); }

@keyframes v2Beat {
  0%   { opacity: 0; transform: translate(-50%, calc(-50% + 8px)); filter: blur(4px); }
  10%  { opacity: 1; transform: translate(-50%, -50%);             filter: blur(0); }
  88%  { opacity: 1; transform: translate(-50%, -50%); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 8px)); filter: blur(4px); }
}

/* Sello: caída + estampado + vuelo a esquina (anillo más sobrio que v1) */
.voyage2-seal {
  position: absolute; left: 50%; top: 50%; z-index: 8;
  width: clamp(120px, 13vw, 165px);
  transform-origin: center center;
  transform: translate(-50%, -50%) scale(3);
  opacity: 0; pointer-events: none;
}
.is-playing .voyage2-seal { animation: v2Stamp 2.2s 10.6s both; }
@keyframes v2Stamp {
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

.voyage2-seal-ring {
  position: absolute; left: 50%; top: 50%; z-index: 7;
  width: clamp(220px, 28vw, 360px); aspect-ratio: 1 / 1;
  border-radius: 50%;
  border: 1.5px solid rgba(220, 236, 255, 0.65);
  box-shadow: 0 0 34px rgba(140, 190, 255, 0.3);
  transform-origin: center center;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0; pointer-events: none;
}
.is-playing .voyage2-seal-ring { animation: v2Ring 0.7s ease-out 10.82s both; }
@keyframes v2Ring {
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  18%  { opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
}

/* Titular — rincón superior-izquierdo */
.voyage2-title {
  position: absolute; top: 10vh; left: 4vw; text-align: left;
  max-width: min(34vw, 400px);
  opacity: 0;
}
.is-playing .voyage2-title { animation: v2In 1.7s cubic-bezier(0.16, 1, 0.3, 1) 10.5s both; }
.voyage2-kicker {
  margin: 0 0 0.8rem;
  color: #6FB6E8;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.58rem; letter-spacing: 0.24em; text-transform: uppercase;
  text-shadow: 0 0 16px rgba(2,3,10,0.9), 0 2px 12px rgba(2,3,10,0.9);
}
.voyage2-h1 {
  margin: 0; font-weight: 700; line-height: 0.95;
  font-size: clamp(2.6rem, 6.5vw, 5.4rem); letter-spacing: 0.06em; color: #EEF3F9;
  text-shadow: 0 0 38px rgba(70,140,255,0.28);
}
.voyage2-tag {
  margin: 0.5rem 0 0; color: #A9BDD2; font-weight: 400;
  font-size: clamp(0.9rem, 1.4vw, 1.2rem); letter-spacing: 0.03em; line-height: 1.35;
}
.voyage2-tag em { color: #9FD9FF; font-style: normal; font-weight: 600; text-shadow: 0 0 24px rgba(90,170,255,0.45); }
.voyage2-hint {
  margin: 2.4rem 0 0; color: #51607A;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.72rem; letter-spacing: 0.24em; text-transform: uppercase;
}
.is-playing .voyage2-hint { animation: v2Pulse 2.6s ease-in-out 13.2s infinite; }

@keyframes v2In {
  0%   { opacity: 0; transform: translateY(14px); filter: blur(8px); }
  100% { opacity: 1; transform: none;             filter: blur(0); }
}
@keyframes v2Pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }

/* Estado final instantáneo */
.is-instant .voyage2-beat { display: none; }
.is-instant .voyage2-seal-ring { display: none; }
.is-instant .voyage2-title { opacity: 1; }
.voyage2-hero.is-instant .voyage-nodes { opacity: 1; }
.is-instant .voyage2-hint { opacity: 0.7; animation: v2Pulse 2.6s ease-in-out infinite; }
.is-instant .voyage2-seal {
  opacity: 1;
  transform: translate(calc(43vw - 100%), -40vh) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .voyage2-beat { display: none; }
  .voyage2-seal-ring { display: none; }
  .voyage2-title { opacity: 1; animation: none; }
  .voyage2-hero .voyage-nodes { opacity: 1; animation: none; }
  .voyage2-hint { animation: none; opacity: 0.7; }
  .voyage2-seal {
    opacity: 1; animation: none;
    transform: translate(calc(43vw - 100%), -40vh) scale(1);
  }
}
`
