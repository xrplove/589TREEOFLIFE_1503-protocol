'use client'

/**
 * MÓDULO ACTORES del escritorio TRANSITARIO (pestaña «Actores»).
 *
 * La RED de la cadena de custodia del transitario: con qué contrapartes (por ROL:
 * fabricante, transportista, consignatario, aduana…) comparte envíos. Dato REAL
 * (fetchCustodyActors), sin PII — nombres/contacto/“llamar a persona” = directorio
 * aparte, pendiente (misma pieza que el directorio de comms).
 */

import Link from 'next/link'
import { Card, StatusPill } from '../components/workspace/ui/DeskKit'
import { FONT_MONO, GREEN, HAIR, LILAC, MUTE, NUM, TEXT, TEXT_DIM } from '../components/workspace/ui/tokens'
import { CUSTODY_ROLE_LABEL, type CustodyActor } from './custody'

const ROLE_ACCENT: Record<string, string> = {
  manufacturer: LILAC,
  owner: LILAC,
  carrier: GREEN,
  customs: '#5E9DFF',
  consignee: '#F0B429',
}

export function ActoresModule({ actors, hrefBase }: { actors: CustodyActor[]; hrefBase: string }) {
  if (actors.length === 0) return <EmptyActores />

  // Reparto por rol (resumen honesto de la red).
  const byRole = new Map<string, number>()
  for (const a of actors) for (const r of a.roles) byRole.set(r, (byRole.get(r) ?? 0) + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card eyebrow="Red · cadena de custodia" title="Con quién compartes custodia">
        <p style={{ fontSize: '0.84rem', color: TEXT_DIM, lineHeight: 1.6, margin: '0 0 12px' }}>
          Las contrapartes de tus cadenas de custodia, por su rol. Los datos de contacto y la llamada directa a una
          persona viven en el <strong>directorio</strong> (pendiente, con su propia decisión de privacidad); aquí se
          muestra la red sin exponer datos personales.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[...byRole.entries()].map(([role, n]) => (
            <span key={role} style={{ fontSize: '0.72rem', color: TEXT_DIM, fontFamily: FONT_MONO, border: `1px solid ${HAIR}`, borderRadius: 7, padding: '4px 10px' }}>
              {CUSTODY_ROLE_LABEL[role] ?? role} · {n}
            </span>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {actors.map((a) => <ActorCard key={a.actorUserId} actor={a} hrefBase={hrefBase} />)}
      </div>
    </div>
  )
}

function ActorCard({ actor, hrefBase }: { actor: CustodyActor; hrefBase: string }) {
  const primaryRole = actor.roles[0] ?? 'actor'
  const accent = ROLE_ACCENT[primaryRole] ?? MUTE
  const initials = (CUSTODY_ROLE_LABEL[primaryRole] ?? primaryRole).slice(0, 2).toUpperCase()
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}1f`, color: accent, display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: FONT_MONO, fontSize: '0.8rem', fontWeight: 700 }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {actor.roles.map((r) => (
              <span key={r} style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{CUSTODY_ROLE_LABEL[r] ?? r}</span>
            ))}
            <span style={{ ...NUM, fontSize: '0.72rem', color: MUTE, fontFamily: FONT_MONO }}>· {actor.shipmentCount} envío{actor.shipmentCount > 1 ? 's' : ''} contigo</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actor.shipments.slice(0, 4).map((s) => (
              <Link key={s.dppId} href={`${hrefBase}/${s.dppId}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: TEXT_DIM }}>
                  <span style={{ width: 5, height: 5, borderRadius: 99, background: accent, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.productName}</span>
                  <span style={{ color: MUTE, fontFamily: FONT_MONO, fontSize: '0.7rem' }}>· {CUSTODY_ROLE_LABEL[s.role] ?? s.role}</span>
                </div>
              </Link>
            ))}
            {actor.shipments.length > 4 ? (
              <span style={{ fontSize: '0.72rem', color: MUTE }}>+{actor.shipments.length - 4} más</span>
            ) : null}
          </div>
        </div>
        <StatusPill tone="neutral">Sin contacto aún</StatusPill>
      </div>
    </Card>
  )
}

function EmptyActores() {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>🤝</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>Aún no hay actores en tu red</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        Cuando participes en cadenas de custodia, aquí aparecerán las contrapartes (fabricantes, transportistas,
        consignatarios, aduana) con las que compartes envíos.
      </div>
    </Card>
  )
}
