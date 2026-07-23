'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { landingPathFor } from '../../data/sectorDashboardConfig'

/**
 * Página intermedia tras autenticarse.
 *
 * El "escritorio" real del Actor es el WorkspaceShell que vive en
 * /sector/[id] con las 8 pestañas (Buscador, Catálogo, Actores, Pedidos,
 * Mi catálogo, Archivos, Mensajes, Wallet). El shell lee los datos del
 * Actor desde localStorage (sector, rol, país, logo, nombre, etc.).
 *
 * Esta página:
 *   1. Verifica sesión Supabase.
 *   2. Lee el row del Actor en public.actors.
 *   3. Escribe sus datos a localStorage (las mismas claves
 *      1503:* que usa el modo demo, pero SIN flag demoMode).
 *   4. Redirige a /sector/<sector_id>.
 *
 * El middleware ya protege /escritorio/* — si llegan sin sesión, los
 * redirige fuera.
 */

const STORAGE_KEYS = {
  HOME_COUNTRY: '1503:homeCountry',
  REG_ENTITY: '1503:registrationEntity',
  REG_KIND: '1503:registrationKind',
  REG_SECTOR: '1503:registrationSector',
  REG_ROLE: '1503:registrationRole',
  REG_DATA: '1503:registrationData',
  DISPLAY_NAME: '1503:displayName',
  DEMO_MODE: '1503:demoMode',
  DEMO_ACTOR_ID: '1503:demoActorId',
}

export default function EscritorioInitPage() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    ;(async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        router.replace('/')
        return
      }

      const { data: actor } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!actor) {
        router.replace('/')
        return
      }

      // Defensa en profundidad: si por algún motivo el middleware no
      // intervino (ej. la columna sector_chosen_at no existe todavía
      // porque la migración 005 no se ha aplicado), igual mandamos al
      // Actor a /registro/sector para que cierre el onboarding.
      if (!actor.sector_chosen_at) {
        router.replace('/registro/sector')
        return
      }

      try {
        const ls = window.localStorage
        // Limpiar marcadores de modo demo por si quedaron de una sesión
        // anterior (entrar como Actor real cancela el modo demo).
        ls.removeItem(STORAGE_KEYS.DEMO_MODE)
        ls.removeItem(STORAGE_KEYS.DEMO_ACTOR_ID)

        ls.setItem(STORAGE_KEYS.HOME_COUNTRY, actor.country_code ?? 'ES')
        if (actor.entity_code) ls.setItem(STORAGE_KEYS.REG_ENTITY, actor.entity_code)
        if (actor.entity_kind) ls.setItem(STORAGE_KEYS.REG_KIND, actor.entity_kind)
        if (actor.sector_id) ls.setItem(STORAGE_KEYS.REG_SECTOR, actor.sector_id)
        if (actor.role_id) ls.setItem(STORAGE_KEYS.REG_ROLE, actor.role_id)

        const displayName =
          actor.company_name ||
          [actor.first_name, actor.last_name].filter(Boolean).join(' ') ||
          actor.email ||
          'Actor'
        ls.setItem(STORAGE_KEYS.DISPLAY_NAME, displayName)

        ls.setItem(
          STORAGE_KEYS.REG_DATA,
          JSON.stringify({
            first_name: actor.first_name,
            last_name: actor.last_name,
            tax_id: actor.tax_id,
            company_name: actor.company_name,
            legal_rep: actor.legal_rep,
            email: actor.email,
            phone: actor.phone,
            address: actor.address,
            postal_code: actor.postal_code,
            city: actor.city,
            years_in_sector: actor.years_in_sector,
          }),
        )
      } catch (err) {
        console.error('[escritorio/init] localStorage write failed', err)
      }

      // Plataforma multisector: sin sector no se asume ninguno (era deuda
      // legacy del origen inmobiliario). Coherente con el middleware, que
      // manda a elegir sector a quien no lo tiene.
      //
      // Enrutado dirigido por config: el actor aterriza en el escritorio que
      // le corresponde por rol/sector. Los transitarios van a su escritorio
      // REAL (/transitario); el resto, al WorkspaceShell general /sector/<id>.
      // Anclar un sector a su escritorio propio = una línea en landingPathFor.
      router.replace(landingPathFor({ sectorId: actor.sector_id, roleId: actor.role_id }))
    })()
  }, [router])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#08090F',
        color: '#7A8899',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-dm-mono), monospace',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontSize: '0.78rem',
      }}
    >
      Cargando tu escritorio…
    </main>
  )
}
