'use client'

/**
 * Escritorio del gremio LEGAL (despacho/notaría) · montado sobre el DeskFrame
 * compartido (cabecera 1503 + switcher sector + comms audio/videollamada/chat +
 * agenda + correo + archivos vienen del frame).
 *
 * Módulos reconstruidos con la INVESTIGACIÓN 17-jun (deep-research verificado):
 * docs/escritorios/2026-06-17-investigacion-escritorio-abogado.md. Reflejan el
 * flujo real del abogado en España, incluido el BLOQUE PENAL (turno de oficio).
 *
 * HONESTIDAD (regla 0-atajos): LexNet, firma cualificada (ACA/QES), verificación
 * colegial (CGAE/colegios) y bases jurídicas son INTEGRACIONES EXTERNAS REALES no
 * conectadas. No se finge "verificado", ni una notificación de LexNet, ni una
 * firma con valor legal: se muestra la estructura real con estado pendiente.
 */

import type { ReactNode } from 'react'
import type { ModuleId } from '../data/sectorDashboardConfig'
import { DeskFrame, type DeskRegistry } from '../components/workspace/DeskFrame'
import { Card, StatusPill } from '../components/workspace/ui/DeskKit'
import { FONT_MONO, GOLD, GREEN, HAIR, LILAC, MUTE, RED, TEXT, TEXT_DIM } from '../components/workspace/ui/tokens'

// Áreas de práctica (incluye PENAL de forma destacada · esquema legal.ts + investigación).
const AREAS = [
  'Penal · defensa', 'Penal económico', 'Mercantil · societario', 'Mercantil · contratos', 'Mercantil · M&A',
  'Civil · familia y sucesiones', 'Civil · inmobiliario', 'Laboral', 'Administrativo', 'Fiscal · tributario',
  'Concursal', 'Datos · GDPR', 'Propiedad intelectual', 'Fintech · blockchain',
]
const ACTOS_NOTARIALES = ['Poder general', 'Poder especial', 'Escritura de compraventa', 'Constitución de sociedad', 'Testamento', 'Apostilla', 'Fe pública remota (videoconferencia · Ley 11/2023)']
const TARIFAS = ['Por hora', 'Fija por proyecto', 'Iguala mensual', 'Contingencia / éxito', 'Turno de oficio (baremo)']

// ── helpers de presentación ──────────────────────────────────────────────────
function Row({ k, v, tone }: { k: string; v: ReactNode; tone?: 'ok' | 'warn' | 'pend' }) {
  const color = tone === 'ok' ? GREEN : tone === 'warn' ? GOLD : tone === 'pend' ? MUTE : TEXT
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderTop: `1px solid ${HAIR}` }}>
      <span style={{ fontSize: '0.78rem', color: MUTE }}>{k}</span>
      <span style={{ fontSize: '0.86rem', color, fontFamily: FONT_MONO, textAlign: 'right' }}>{v}</span>
    </div>
  )
}
function Note({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  const bg = tone === 'info' ? 'rgba(94,157,255,0.06)' : 'rgba(240,180,41,0.06)'
  return <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, border: `1px solid ${HAIR}`, background: bg, fontSize: '0.78rem', color: TEXT_DIM, lineHeight: 1.55 }}>{children}</div>
}
function Chips({ items, accent }: { items: string[]; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((a) => (
        <span key={a} style={{ fontSize: '0.78rem', color: accent ?? TEXT, border: `1px solid ${accent ? `${accent}55` : HAIR}`, borderRadius: 8, padding: '5px 10px', background: 'rgba(255,255,255,0.03)' }}>{a}</span>
      ))}
    </div>
  )
}
function Empty({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 600, color: TEXT, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: '0.86rem', color: TEXT_DIM, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>{body}</div>
    </Card>
  )
}

const LEGAL_REGISTRY: DeskRegistry = {
  // ── INICIO ──────────────────────────────────────────────────────────────
  inicio: {
    eyebrow: 'Despacho · resumen', title: 'Tu despacho', subtitle: 'Habilitación, carga de trabajo, plazos y guardia',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <Card eyebrow="Habilitación" title="¿Puedes ejercer?">
          <Row k="Colegiación" v={<StatusPill tone="warn">por verificar</StatusPill>} />
          <Row k="Ejerciente" v="—" tone="pend" />
          <Row k="Seguro RCP" v="—" tone="pend" />
          <Note>Verificación contra el registro colegial (CGAE/ICAM/ICAB/ICAV) pendiente de conectar.</Note>
        </Card>
        <Card eyebrow="Trabajo" title="Expedientes y plazos">
          <Row k="Expedientes activos" v="0" tone="pend" />
          <Row k="Próximos vencimientos (7 días)" v="ver Plazos" />
          <Row k="Notificaciones LexNet sin abrir" v="—" tone="pend" />
          <Note tone="info">El reloj de plazos corre desde el 4º día hábil de una notificación LexNet sin abrir (art. 162.2 LEC).</Note>
        </Card>
        <Card eyebrow="Penal" title="Guardia / turno de oficio">
          <Row k="¿De guardia hoy?" v="No" tone="pend" />
          <Row k="Asistencias en cola" v="0" tone="pend" />
          <Row k="Designaciones vigentes" v="0" tone="pend" />
          <Note>Si estás de guardia, las asistencias al detenido entran aquí (módulo «Guardia penal»).</Note>
        </Card>
      </div>
    ),
  },

  // ── EXPEDIENTES ─────────────────────────────────────────────────────────
  expedientes: {
    eyebrow: 'Despacho · asuntos', title: 'Expedientes', subtitle: 'Asuntos/casos: ciclo de vida, partes y documentos',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="Estructura" title="Ciclo de vida del asunto">
          <Chips items={['Intake', 'Conflicto OK', 'Hoja de encargo', 'Abierto', 'En trámite', 'Recurso', 'Archivado']} accent={LILAC} />
          <Note tone="info">Cada expediente vincula partes, área de práctica, documentos, plazos y minuta. Es el centro del despacho: todo cuelga de aquí.</Note>
        </Card>
        <Empty icon="📁" title="Sin expedientes todavía" body="Cuando des de alta un asunto (tras la criba de conflicto y la hoja de encargo), aparecerá aquí con sus partes, estado, documentos y plazos asociados. El dato real se guarda con RLS cerrada y secreto profesional reforzado." />
      </div>
    ),
  },

  // ── PLAZOS · LEXNET ───────────────────────────────────────────────────────
  plazos: {
    eyebrow: 'Despacho · procesal', title: 'Plazos · LexNet', subtitle: 'Cómputo procesal y bandeja de notificaciones judiciales',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="Motor de cómputo" title="Reglas que aplica (LEC)">
          <Row k="Notificación sin abrir" v="efectiva a los 3 días hábiles" tone="warn" />
          <Row k="Inicio del plazo" v="desde el 4º día hábil" />
          <Row k="Día de gracia" v="hasta las 15:00 del día hábil siguiente" tone="ok" />
          <Row k="Día/hora inhábil" v="→ primer día y hora hábil siguiente" />
          <Note tone="info">Arts. 162.2 y 135 LEC. El motor descuenta sábados, domingos, festivos y el mes de agosto, y avisa antes del vencimiento.</Note>
        </Card>
        <Card eyebrow="Bandeja" title="Notificaciones LexNet">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: RED }} />
            <span style={{ fontSize: '0.86rem', color: TEXT }}>LexNet no conectado</span>
          </div>
          <Note>LexNet es el canal oficial OBLIGATORIO (desde 2016) para presentar escritos y recibir notificaciones. Requiere certificado reconocido (ACA) e <strong>integración externa real</strong> — no se simula. Aquí irá la bandeja de notificaciones con su cómputo automático de plazo.</Note>
        </Card>
      </div>
    ),
  },

  // ── CONFLICTO DE INTERÉS ─────────────────────────────────────────────────
  conflicto: {
    eyebrow: 'Despacho · deontología', title: 'Conflicto de interés', subtitle: 'Criba obligatoria ANTES de aceptar el encargo',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="Regla" title="Qué se comprueba">
          <p style={{ fontSize: '0.86rem', color: TEXT_DIM, margin: 0, lineHeight: 1.6 }}>
            Ningún abogado puede aceptar un encargo en condiciones de conflicto. La criba busca <strong style={{ color: TEXT }}>colisión
            de derechos o intereses</strong> que coloque al letrado en posición equívoca con riesgo para su independencia o
            rectitud (Código Deontológico de la Abogacía Española). Se cruza la parte contraria contra la cartera de clientes y asuntos.
          </p>
        </Card>
        <Card eyebrow="Cribado" title="Comprobación previa">
          <Row k="Parte contraria contra cartera" v="pendiente de cruzar" tone="pend" />
          <Row k="Asuntos relacionados" v="—" tone="pend" />
          <Row k="Resultado" v={<StatusPill tone="warn">sin ejecutar</StatusPill>} />
          <Note>El cruce real se ejecuta sobre los expedientes del despacho (dato cerrado por RLS). Si hay conflicto, el alta del expediente se bloquea salvo consentimiento expreso de ambas partes.</Note>
        </Card>
      </div>
    ),
  },

  // ── GUARDIA PENAL (turno de oficio) ──────────────────────────────────────
  penal: {
    eyebrow: 'Despacho · penal', title: 'Guardia penal', subtitle: 'Turno de oficio · asistencia al detenido · designación',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="On-call" title="Turno de guardia">
          <Row k="Horario de guardia" v="09:00 → 09:00 (24 h)" tone="warn" />
          <Row k="Localización" v="móvil conectado · siempre localizable" />
          <Row k="¿Rechazar el caso?" v="No · sin objeción" tone="warn" />
          <Row k="Obligaciones derivadas" v="hasta 72 h después de la guardia" />
          <Note>La asignación llega por notificación al móvil. El defensor penal tiene un modelo operativo propio que el civil/mercantil no requiere.</Note>
        </Card>
        <Card eyebrow="Asistencias" title="Cola de asistencia al detenido">
          <Chips items={['Calabozos / comisaría', 'Juzgado de guardia', 'Videoconferencia', 'Cliente en prisión']} accent={GOLD} />
          <Empty icon="⚖️" title="Sin asistencias en cola" body="Cuando estés de guardia, cada asistencia al detenido entra aquí con su lugar (calabozos, juzgado o videoconferencia), hora y estado. La videollamada del cluster sirve para la asistencia telemática." />
        </Card>
        <Card eyebrow="Continuidad" title="Designación">
          <Row k="Designaciones vigentes" v="0" tone="pend" />
          <Note tone="info">La asistencia al detenido genera <strong>«designación»</strong>: vincula al MISMO letrado al procedimiento en todas sus fases hasta su finalización, salvo 4 excepciones tasadas. El expediente penal hereda esa continuidad.</Note>
        </Card>
      </div>
    ),
  },

  // ── COLEGIACIÓN ───────────────────────────────────────────────────────────
  colegiacion: {
    eyebrow: 'Despacho · habilitación', title: 'Colegiación', subtitle: 'Verificación profesional contra el colegio oficial',
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card eyebrow="Abogado" title="Datos colegiales">
          <Row k="Colegio" v="— (ICAM / ICAB / ICAV…)" tone="pend" />
          <Row k="Nº de colegiado" v="—" tone="pend" />
          <Row k="Ejerciente" v="—" tone="pend" />
          <Row k="Seguro RCP" v="—" tone="pend" />
          <Row k="Verificado por 1503" v={<StatusPill tone="warn">no</StatusPill>} />
          <Note>Legal y salud son los únicos sectores con regla de colegiación dura: sin colegiado ejerciente no hay actuación procesal. La verificación exige conexión a CGAE/colegios — pendiente.</Note>
        </Card>
        <Card eyebrow="Notario" title="Acreditación notarial">
          <Row k="Plaza notarial" v="—" tone="pend" />
          <Row k="QES eIDAS (ANCERT)" v="—" tone="pend" />
          <Row k="Fe pública remota (Ley 11/2023)" v="—" tone="pend" />
          <Row k="Sello digital" v="—" tone="pend" />
        </Card>
      </div>
    ),
  },

  // ── FIRMA (ACA / QES) ────────────────────────────────────────────────────
  firma: {
    eyebrow: 'Despacho · firma', title: 'Firma electrónica', subtitle: 'Certificado ACA = firma cualificada eIDAS (art. 25)',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="Certificado" title="ACA · firma cualificada (QES)">
          <Row k="Equivalencia legal" v="= firma manuscrita (eIDAS art. 25)" tone="ok" />
          <Row k="Usos" v="LexNet · firma de documentos · identidad" />
          <Row k="Formato" v="tarjeta criptográfica o software (desde nov-2024)" />
          <Row k="Estado en 1503" v={<StatusPill tone="warn">requiere proveedor cualificado</StatusPill>} />
          <Note>No se fabrica firma: la firma cualificada (ACA/QES) y la fe pública notarial remota requieren proveedor cualificado eIDAS / ANCERT. Se referencia el acto + su hash; el valor legal lo da el proveedor acreditado.</Note>
        </Card>
        <Card eyebrow="Actos" title="Tipos de acto soportados">
          <Chips items={ACTOS_NOTARIALES} />
        </Card>
      </div>
    ),
  },

  // ── MINUTAS / FACTURACIÓN ────────────────────────────────────────────────
  facturacion: {
    eyebrow: 'Despacho · económico', title: 'Minutas', subtitle: 'Honorarios, cuenta de terceros y factura electrónica',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card eyebrow="Honorarios" title="Modelos de tarifa">
          <Chips items={TARIFAS} accent={GREEN} />
        </Card>
        <Card eyebrow="Cumplimiento" title="Cuenta de terceros y VeriFactu">
          <Row k="Provisiones de fondos" v="cuenta separada del cliente" />
          <Row k="Factura electrónica / VeriFactu" v="pendiente de régimen" tone="pend" />
          <Note>Las provisiones del cliente se llevan en cuenta separada (régimen deontológico). El detalle contable y el calendario VeriFactu son pregunta abierta de la investigación — a cerrar antes de cablear.</Note>
        </Card>
      </div>
    ),
  },

  // ── DOCUMENTACIÓN ─────────────────────────────────────────────────────────
  documentacion: {
    eyebrow: 'Despacho · expedientes', title: 'Documentación', subtitle: 'Escritos, demandas, recursos, contratos · plantillas',
    render: () => (
      <Empty icon="📑" title="Sin documentos todavía" body="Escritos, demandas, recursos, contratos y escrituras con su referencia y hash SHA-256; el original se guarda cifrado (PII off-chain). Con plantillas y control de versiones. Reusa el patrón del módulo Documentación del transitario." />
    ),
  },

  // ── CATÁLOGO DE SERVICIOS ────────────────────────────────────────────────
  catalogo: {
    eyebrow: 'Despacho · servicios', title: 'Servicios jurídicos', subtitle: 'Áreas de práctica',
    render: () => (
      <Card eyebrow="Catálogo" title="Áreas de práctica">
        <Chips items={AREAS} />
        <Note tone="info">Servicio (no producto físico): sin cubicaje, sin DPP, sin exportación. La práctica PENAL tiene además el módulo propio «Guardia penal».</Note>
      </Card>
    ),
  },
}

export function LegalDesk({
  modules, roleId, roleNote, hrefBase, preview,
}: {
  modules: ModuleId[]
  roleId?: string | null
  roleNote?: string | null
  hrefBase: string
  preview?: boolean
}) {
  return (
    <>
      {roleNote ? (
        <div style={{ position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 55 }}>
          <StatusPill tone="warn">{roleNote}</StatusPill>
        </div>
      ) : null}
      <DeskFrame
        deskLabel="Despacho"
        sectorId="legal"
        modules={modules}
        registry={LEGAL_REGISTRY}
        roleId={roleId}
        hrefBase={hrefBase}
        preview={preview}
      />
    </>
  )
}
