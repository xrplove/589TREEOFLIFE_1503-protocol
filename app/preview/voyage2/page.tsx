import Link from 'next/link'
import VoyageHeroReal from '../../components/VoyageHeroReal'

/**
 * Sandbox de la cinemática v2 — "La travesía de 1503 · REAL".
 *
 * Encargo de José (12-jun, docs/cinematica-v2-real.md): espacio real, la Tierra
 * de noche con luces de ciudades reales, arcos de rutas comerciales — sin
 * retícula. Se revisa aquí (forceReplay: siempre reproduce) y se compara lado a
 * lado con la v1 (/preview/voyage) antes de decidir si sustituye al hero de la home.
 */
export default function Voyage2PreviewPage() {
  return (
    <VoyageHeroReal forceReplay>
      <div className="voyage2-hud voyage2-hud-tl">Preview · Travesía 1503 · v2 REAL (sandbox)</div>
      <Link href="/preview/voyage" className="voyage2-hud voyage2-hud-tr">
        ⇄ Comparar con la v1
      </Link>
      <div className="voyage2-hud voyage2-hud-bottom">
        Sandbox — siempre reproduce (refresca para repetir) · la home sigue con la v1 hasta tu visto bueno
      </div>

      <style>{HUD_CSS}</style>
    </VoyageHeroReal>
  )
}

const HUD_CSS = `
.voyage2-hud {
  position: absolute; z-index: 10;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
  color: #7A8899;
}
.voyage2-hud-tl { top: 1.4rem; left: 1.6rem; }
.voyage2-hud-tr {
  top: 1.4rem; right: 1.6rem; text-decoration: none;
  padding: 0.45rem 0.85rem; border: 1px solid rgba(122,136,153,0.3); border-radius: 3px;
  background: rgba(8,9,15,0.6); backdrop-filter: blur(8px);
}
.voyage2-hud-bottom {
  bottom: 1.4rem; left: 50%; transform: translateX(-50%);
  color: #4A5566; text-align: center;
}
`
