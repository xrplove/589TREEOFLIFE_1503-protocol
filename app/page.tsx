import VoyageHero from './components/VoyageHero'
import BlockchainBackground from './components/BlockchainBackground'
import HomeSections from './components/HomeSections'
import LangSwitcher from './components/LangSwitcher'
import { getServerLang } from './lib/server-lang'
import { getHomeStrings } from './data/home-i18n'
import type { Metadata } from 'next'

const OG_LOCALE: Record<string, string> = {
  es: 'es_ES', en: 'en_US', fr: 'fr_FR', de: 'de_DE', it: 'it_IT', pt: 'pt_PT', zh: 'zh_CN', ja: 'ja_JP',
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang()
  const t = getHomeStrings(lang)
  // Tarjeta social: la imagen la aporta app/opengraph-image.tsx automáticamente;
  // aquí van título/descos localizados para que Slack/LinkedIn/X muestren tarjeta.
  return {
    metadataBase: new URL('https://1503.global'),
    title: t.metaTitle,
    description: t.metaDescription,
    openGraph: {
      type: 'website',
      siteName: '1503',
      url: 'https://1503.global',
      title: t.metaTitle,
      description: t.metaDescription,
      locale: OG_LOCALE[lang] ?? 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t.metaTitle,
      description: t.metaDescription,
    },
  }
}

export default async function Home() {
  // Idioma decidido server-side: cookie 1503:lang > país de alta > Accept-Language
  // > 'es'. Un visitante anglófono lee la home
  // en inglés sin tocar nada.
  const lang = await getServerLang()
  const t = getHomeStrings(lang)

  return (
    <>
      {/* Persistent animated network background, fixed to viewport */}
      <BlockchainBackground />

      {/* Selector de idioma (8 acordados) — fija cookie 1503:lang y recarga */}
      <LangSwitcher current={lang} label={t.langLabel} />

      {/* Sin botones de acceso en la home: la única forma de entrar es el
          acceso directo descargable desde el escritorio del usuario. La web
          solo se navega como invitado (sectores, continentes, registro
          inicial vía bandera de país). El usuario logueado NO pasa por la
          home (entra por su acceso directo → /acceso → /escritorio); por eso
          la cinemática solo la ven invitados y se reproduce una vez por sesión. */}

      <main
        id="hero"
        style={{
          minHeight: '100vh',
          background: '#08090F',
          color: '#E8EDF5',
          fontFamily: 'var(--font-chakra-petch), system-ui, sans-serif',
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        {/* HERO — cinemática "La travesía de 1503" (globo + nodos selector de
            continente + estampado del sello). Una sola pieza, scroll-away. */}
        <VoyageHero
          hero={{
            beatA: t.heroBeatA,
            beatB: t.heroBeatB,
            beatC: t.heroBeatC,
            kicker: t.heroKicker,
            tag: t.heroTag,
            enter: t.heroEnter,
          }}
          nodeLabels={t.continentLabels}
          nodeAria={t.continentAria}
          memberOf={t.ecoMemberOf}
        >
          {/* Hint de scroll dentro del hero (z10, por encima de la cinemática) */}
          <p className="home-scroll-hint">{t.scrollHint}</p>
          <style>{HERO_HINT_CSS}</style>
        </VoyageHero>

        {/* SCROLL CONTENT — manifesto, 3 pasos, trazabilidad, comparativa, web3, CTA, footer */}
        <HomeSections t={t} />
      </main>
    </>
  )
}

const HERO_HINT_CSS = `
.home-scroll-hint {
  position: absolute; bottom: 1.6rem; left: 50%; transform: translateX(-50%);
  z-index: 10; margin: 0;
  color: #3A4050; font-size: 0.7rem; letter-spacing: 0.4em; text-transform: uppercase;
  font-family: var(--font-dm-mono), monospace;
  animation: homeScrollHint 2.8s ease-in-out 13.6s infinite;
  opacity: 0;
}
.is-instant .home-scroll-hint { animation: homeScrollHint 2.8s ease-in-out infinite; }
@keyframes homeScrollHint {
  0%, 100% { opacity: 0.25; } 50% { opacity: 0.7; }
}
@media (prefers-reduced-motion: reduce) {
  .home-scroll-hint { animation: none; opacity: 0.55; }
}
`
