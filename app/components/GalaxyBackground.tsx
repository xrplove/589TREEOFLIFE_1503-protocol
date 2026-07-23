export default function GalaxyBackground() {
  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}>
        <img
          src="/escalera_mecanica.PNG"
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            opacity: 0.85,
            filter: 'brightness(0.7) saturate(1.2) contrast(1.1)',
          }}
        />
      </div>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,10,30,0.4) 0%, rgba(0,10,30,0.2) 50%, rgba(0,10,30,0.5) 100%)',
      }} />
    </>
  )
}