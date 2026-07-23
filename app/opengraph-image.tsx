import { ImageResponse } from 'next/og'

// Tarjeta social (Open Graph + Twitter) de 1503, generada en el build/edge.
// Es lo que sale cuando se pega el enlace de 1503.global en Slack / email /
// LinkedIn / X: fondo oscuro de marca, "1503" y el encuadre honesto. Next añade
// automáticamente og:image y twitter:image para todo el sitio desde este archivo.

export const alt = '1503 — Infraestructura de confianza para el comercio global'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #08090F 0%, #0B0D14 55%, #0E1524 100%)',
          padding: '72px 80px',
          color: '#E8EDF5',
          fontFamily: 'sans-serif',
        }}
      >
        {/* top row: eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#00A3FF',
          }}
        >
          Digital Product Passport · Export compliance
        </div>

        {/* center: wordmark + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 200, fontWeight: 800, lineHeight: 1, letterSpacing: -4 }}>15</div>
            <div style={{ fontSize: 200, fontWeight: 800, lineHeight: 1, letterSpacing: -4, color: '#00A3FF' }}>03</div>
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: '#9FB6CC', marginTop: 18 }}>
            The internet of global trade.
          </div>
        </div>

        {/* bottom row: honest protocol line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: '#F0B429',
          }}
        >
          Non-custodial · Anchored on the XRP Ledger · Live on testnet
        </div>
      </div>
    ),
    { ...size },
  )
}
