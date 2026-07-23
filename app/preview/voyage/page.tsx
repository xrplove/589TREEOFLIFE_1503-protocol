import Link from 'next/link'
import VoyageHero from '../../components/VoyageHero'

/**
 * Sandbox de la cinemática del hero — "La travesía de 1503".
 *
 * Aquí se itera la pieza en aislamiento (forceReplay → ignora la sesión y
 * siempre reproduce, para poder verla una y otra vez al refrescar). La misma
 * pieza está implantada como hero de la home (`app/page.tsx`), donde se
 * reproduce una sola vez por sesión.
 */
export default function VoyagePreviewPage() {
  return (
    <VoyageHero forceReplay>
      {/* HUD de preview (z10, por encima de la cinemática) */}
      <div className="voyage-hud voyage-hud-tl">Preview · Travesía 1503 (sandbox)</div>
      <Link href="/" className="voyage-hud voyage-hud-tr">
        ← Volver a la home
      </Link>
      <div className="voyage-hud voyage-hud-bottom">
        Sandbox — siempre reproduce (refresca para repetir) · en la home se ve una vez por sesión
      </div>

      <style>{HUD_CSS}</style>
    </VoyageHero>
  )
}

const HUD_CSS = `
.voyage-hud {
  position: absolute; z-index: 10;
  font-family: var(--font-dm-mono), monospace;
  font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
  color: #7A8899;
}
.voyage-hud-tl { top: 1.4rem; left: 1.6rem; }
.voyage-hud-tr {
  top: 1.4rem; right: 1.6rem; text-decoration: none;
  padding: 0.45rem 0.85rem; border: 1px solid rgba(122,136,153,0.3); border-radius: 3px;
  background: rgba(8,9,15,0.6); backdrop-filter: blur(8px);
}
.voyage-hud-bottom {
  bottom: 1.4rem; left: 50%; transform: translateX(-50%);
  color: #4A5566; text-align: center;
}
`
