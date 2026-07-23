// Pantallas de fallback del escritorio transitario (config / KYC), con la piel
// del Desk Kit para no romper la estética.
import { BG, FONT, GOLD, TEXT, TEXT_DIM } from '../components/workspace/ui/tokens'

function Frame({ title, body }: { title: string; body: string }) {
  return (
    <main style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT, display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-chakra-petch), sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>
          15<span style={{ color: GOLD }}>03</span>
        </div>
        <h1 style={{ fontSize: '1.1rem', margin: '1rem 0 0.6rem' }}>{title}</h1>
        <p style={{ fontSize: '0.88rem', color: TEXT_DIM, lineHeight: 1.6 }}>{body}</p>
      </div>
    </main>
  )
}

export function ConfigMissing() {
  return <Frame title="Configuración pendiente" body="Faltan las variables de Supabase (URL, anon key, service role). Defínelas en .env.local." />
}

export function KycRequired() {
  return <Frame title="Necesitas el alta aprobada (KYC)" body="Este escritorio es para actores verificados. Cuando tu alta esté aprobada, verás aquí tus envíos en custodia." />
}
