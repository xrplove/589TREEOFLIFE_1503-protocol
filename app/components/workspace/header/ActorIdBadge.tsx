import type { Sector } from '../../../data/sectors'

/* ────────────────── ACTOR ID (placeholder, Fase 6) ──────────────────
   El ID de actor con formato acordado en ADR 0004
   ([SECTOR-CNAE]-[SERIAL-1503]-[EMPRESA]-[TRABAJADOR]) NO existe
   todavía: depende del modelo de identidad (companies + serial +
   credencial de vinculación), que es Fase 6 y está bloqueado por C-7.
   Aquí solo se RESERVA el sitio con el esqueleto del formato + badge
   BORRADOR — NO es un ID real, no se inventa ninguno (disciplina
   "nunca inventar identificadores" del proyecto). */
export function ActorIdBadge({ sector }: { sector: Sector }) {
  return (
    <div
      title="Formato de ID de actor pendiente del modelo de identidad (ADR 0004 · Fase 6). Aún no asignado."
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
        paddingLeft: 10,
        marginLeft: 4,
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.74rem',
          letterSpacing: '0.08em',
          color: '#6B7686',
        }}
      >
        {sector.short}-······-····-··
      </span>
      <span
        style={{
          fontFamily: 'var(--font-dm-mono), monospace',
          fontSize: '0.54rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#A37C18',
          background: 'rgba(240,180,41,0.08)',
          border: '1px solid rgba(240,180,41,0.25)',
          borderRadius: 5,
          padding: '1px 5px',
        }}
      >
        Borrador · Fase 6
      </span>
    </div>
  )
}
