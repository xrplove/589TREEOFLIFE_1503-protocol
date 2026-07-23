'use client'

import dynamic from 'next/dynamic'

/**
 * Globo wireframe pequeño para la esquina de la capa 2 (continente).
 *
 * Reutiliza `WorldGlobeWireframe` (mismo lenguaje visual que la home)
 * envuelto en una caja absoluta de tamaño fijo. Pure decoración: no
 * tiene interactividad y mantiene la coherencia "globo digital" entre
 * capa 1 y capa 2.
 *
 * Se carga dinámicamente sin SSR porque depende de three.js + WebGL.
 */
const WorldGlobeWireframe = dynamic(() => import('./WorldGlobeWireframe'), {
  ssr: false,
  loading: () => null,
})

export default function MiniGlobe() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 48,
        right: 60,
        width: 180,
        height: 180,
        borderRadius: '50%',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.9,
        boxShadow: '0 0 32px rgba(0,163,255,0.22)',
        border: '1px solid rgba(0,163,255,0.3)',
      }}
    >
      <WorldGlobeWireframe mode="absolute" cameraDistance={6.2} opacity={1} />
    </div>
  )
}
