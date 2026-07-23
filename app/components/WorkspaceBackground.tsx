'use client'

/**
 * Entorno del workspace — v2 "calma premium fintech" (2026-05-31).
 *
 * Giro de ejecución tras cotejar con las referencias 2026 (Hynex/Orbix): los
 * dashboards premium oscuros tienen el fondo QUIETO y casi-negro para que el
 * dato destaque. Se retira el suelo Tron en movimiento + la scanline (restaban
 * seriedad y competían con el contenido). Se conserva una identidad sobria:
 * casi-negro con dos glows MUY tenues y estáticos (teal/oro) que se filtran a
 * través del cristal de los paneles, y una rejilla apenas perceptible.
 *
 * Norte oscuro-fintech de José (30-may) intacto; solo cambia el "cómo".
 */
export default function WorkspaceBackground({ image }: { image?: string }) {
  // PRUEBA (José 31-may): fondo de ciudad moderna (Dubai) para el escritorio
  // inmobiliario. La imagen va bajo un velo para mantener legibilidad de los
  // paneles; se ve clara en los huecos/sidebar/cabecera translúcidos.
  if (image) {
    return (
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* ciudad moderna · clara y bien renderizada */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center 28%', filter: 'saturate(1.04) contrast(1.02) brightness(0.92)' }} />
        {/* velo de legibilidad · más denso arriba/abajo, deja respirar el centro */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,10,14,0.74) 0%, rgba(8,10,14,0.46) 38%, rgba(8,10,14,0.50) 70%, rgba(7,9,13,0.72) 100%)' }} />
        {/* tinte de paleta (lila/verde) muy sutil para coser con el dashboard */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(110% 90% at 0% 0%, rgba(185,164,255,0.08), transparent 55%), radial-gradient(110% 90% at 100% 100%, rgba(84,224,140,0.06), transparent 58%)' }} />
        {/* viñeta para enfocar el contenido */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 50% 32%, transparent 52%, rgba(4,6,10,0.6) 100%)' }} />
      </div>
    )
  }
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* 1 · base casi-negro */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(140% 110% at 50% -10%, #0E131C 0%, #0A0D13 50%, #07090E 100%)' }} />

      {/* 2 · glows estáticos muy tenues (vibrancy a través del cristal) */}
      <div style={{ position: 'absolute', width: '60vw', height: '60vw', left: '-16vw', top: '-20vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(47,210,201,0.055), transparent 62%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', width: '52vw', height: '52vw', right: '-16vw', bottom: '-24vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,180,41,0.035), transparent 64%)', filter: 'blur(48px)' }} />

      {/* 3 · rejilla técnica apenas perceptible, enmascarada arriba */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(100% 80% at 50% 0%, #000 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(100% 80% at 50% 0%, #000 30%, transparent 80%)' }} />

      {/* 4 · viñeta sutil para enfocar el centro */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 50% 30%, transparent 55%, rgba(3,5,9,0.6) 100%)' }} />
    </div>
  )
}
