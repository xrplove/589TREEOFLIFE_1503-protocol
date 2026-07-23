'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Sector } from '../data/sectors'
import { SECTORS } from '../data/sectors'
import type { PublicActor } from '../lib/actor-public'
import { getActorGroups, sectorHasDraft, type ActorGroup } from '../data/actorGroups'
import { CONTINENTS, flagEmoji } from '../data/continents'
import { fill, getWorkspaceStrings, langForCountry, type Lang, type WorkspaceStrings } from '../data/i18n'
import { getLabel } from '../data/actorGroups'
import DemoBanner from './DemoBanner'
import WorkspaceBackground from './WorkspaceBackground'
import ChatPanel from './ChatPanel'
import AgendaView from './AgendaView'
import ExportComplianceView from './ExportComplianceView'
import CatalogoFichas from './CatalogoFichas'
import DesktopBackground from './DesktopBackground'
// Funciones de SECTOR reutilizadas en la plantilla (transporte). El contenido
// real ya construido para el transitario se monta como pestañas del sector.
import { CargaModule } from '../transitario/carga'
import { ExportacionModule } from '../transitario/exportacion'
import { CustodiaModule, DocumentacionModule } from '../transitario/desk'
import type { CustodyShipment, ShipmentDocs, CustodyActor } from '../transitario/custody'
import { I18nCtx, useT, useLang } from './workspace/i18n-context'
import type { Tab } from './workspace/types'
import {
  IconHome,
  IconSearch, IconGrid, IconUsers, IconBox, IconUpload, IconChat, IconMail,
  IconCalendar, IconFile, IconDownload, IconBell, IconChevron,
  IconStar, IconCamera, IconPhone, IconVideo,
  IconShip, IconTruck, IconTrain, IconPlane, IconInfo,
} from './workspace/icons'
import { Hex } from './workspace/shared/Hex'
import { SectionLabel } from './workspace/shared/SectionLabel'
import { SectionHeader } from './workspace/shared/SectionHeader'
import { PlaceholderGrid } from './workspace/shared/PlaceholderGrid'
import { CompanyLogo } from './workspace/header/CompanyLogo'
import { ProfileName, NAME_STORAGE_KEY } from './workspace/header/ProfileName'
import { AvatarUploader } from './workspace/header/AvatarUploader'
import { ActorIdBadge } from './workspace/header/ActorIdBadge'
import type { MissingDocumentsApiResponse } from './MissingDocumentsChecklist'
import type { ContainerLoadViewItem } from './ContainerLoadView'
import type { ContainerType } from '../data/containerSpecs'
import ContainerLoad from './ContainerLoad'
import PedidoDocs from './PedidoDocs'
import type { OrderLine } from './PedidoVivo'
import {
  DeskStyle, IconButton, Card, StatusPill, Eyebrow, Stat,
  Donut, SegmentBar, PrimaryButton, GhostButton,
  MultiArea, Legend, Aurora, Grain, WHITE,
} from './workspace/ui/DeskKit'
import * as DK from './workspace/ui/tokens'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/* Lazy-load piezas R0 (checklist documentos). Patrón canónico Next.js
   modificado · pesan o requieren window (no SSR). ssr:false válido porque
   WorkspaceShell es Client.
   NOTA: el cubicaje del pedido lo dibuja ahora `ContainerLoad` (isométrico
   real, nace de las líneas) · la antigua vista fotoreal `ContainerLoadView`
   queda solo para el overlay "Modo Carga en Muelle" (CargoLoadingBridge). */
const MissingDocumentsChecklist = dynamic(() => import('./MissingDocumentsChecklist'), {
  ssr: false,
  loading: () => (
    <div style={{
      padding: '1rem', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 4, background: 'rgba(14,17,24,0.5)',
      color: '#9AA7B8', fontSize: '0.85rem',
    }}>
      Cargando checklist documentos…
    </div>
  ),
})

/* NOTA: se eliminó el overlay fotoreal "Modo Carga en Muelle"
   (CargoLoadingBridge) por decisión de José (2026-05-30: "quedó fatal").
   El contenedor se carga DEL PEDIDO con el cubicaje real isométrico
   (ContainerLoad), que nace de las líneas. El componente CargoLoadingBridge
   sigue en el repo por si se rescata, pero no se monta. */

/** Default home country code (uppercase ISO 3166-1 alpha-2). When the user
    lands on /register/[code] this gets overridden via localStorage. */
const DEFAULT_HOME_COUNTRY = 'ES'

/** Default operating market in lowercase form (matches existing behaviour). */
const HOME_MARKET = 'es'

function getCountryName(code: string): string {
  if (!code) return ''
  const upper = code.toUpperCase()
  for (const c of CONTINENTS) {
    const found = c.countries.find((co) => co.code === upper)
    if (found) return found.name
  }
  return code.toUpperCase()
}

/* Fondo-firma por SECTOR (imagen temática propia, aplica a TODAS las pestañas
   salvo override más específico). Fuente: Wikimedia Commons CC/PD · atribución
   en public/bg/CREDITS.md. Los 16 sectores cubiertos (José 31-may: "imágenes a
   todos"). Velo + cristal esmerilado mantienen legibilidad sobre cualquier foto. */
const SECTOR_BG: Record<string, string> = {
  inmobiliario: '/bg/dubai-a.jpg', //        ciudad moderna · skyline
  automocion: '/bg/sector-automocion.jpg', // automóvil
  salud: '/bg/sector-salud.jpg', //          hospital moderno
  agroalimentario: '/bg/sector-agroalimentario.jpg', // campo · cosecha
  transporte: '/bg/sector-transporte.jpg', // puerto de contenedores
  metalurgico: '/bg/sector-metalurgico.jpg', // acería de noche
  energia: '/bg/sector-energia.jpg', //      planta solar
  tecnologia: '/bg/sector-tecnologia.jpg', // data center
  turismo: '/bg/sector-turismo.jpg', //      resort
  legal: '/bg/sector-legal.jpg', //          palacio de justicia
  textil: '/bg/sector-textil.jpg', //        telar · fábrica textil
  cultura: '/bg/sector-cultura.jpg', //      museo · arquitectura
  institucional: '/bg/sector-institucional.jpg', // parlamento
  educacion: '/bg/sector-educacion.jpg', //  biblioteca universitaria
  medioambiente: '/bg/sector-medioambiente.jpg', // paisaje verde
  financiero: '/bg/sector-financiero.jpg', // distrito financiero
}

/* Override por sector + PESTAÑA concreta (pisa al fondo-firma del sector cuando
   una pestaña merece su propia imagen). Pestaña sin entrada → cae al SECTOR_BG. */
const SECTOR_TAB_BG: Record<string, Partial<Record<Tab, string>>> = {
  inmobiliario: {
    catalogo: '/bg/inmo-catalogo.jpg', //  Catálogo · diseño de elementos interiores (madera)
  },
  automocion: {
    catalogo: '/bg/auto-catalogo.jpg', //  Catálogo · producción robotizada (carrocería)
  },
}

/* Fondo por PESTAÑA FUNCIONAL (transversal a todos los sectores) — las secciones
   utilitarias merecen su propio tema, no el del sector (José 31-may: "archivo,
   correo interno, agenda… cada una con su tema, en el formato del dashboard").
   Pisa al SECTOR_BG pero cede ante un override sector+pestaña explícito. Las
   pestañas de contenido (Inicio/Catálogo/Pedidos/Actores) NO van aquí → usan el
   fondo-firma del sector. */
const TAB_BG: Partial<Record<Tab, string>> = {
  archivos: '/bg/tab-archivos.jpg', //   sala de archivo · estanterías de documentos
  mensajes: '/bg/tab-mensajes.jpg', //   correo interno · pared de buzones
  agenda: '/bg/tab-agenda.jpg', //       agenda · sala de reuniones
  'mi-catalogo': '/bg/tab-mi-catalogo.jpg', // almacén · carretilla (stock propio)
}

/* Fondo por OFICIO (rol seleccionado en Actores) — "la imagen que corresponde a
   cada sección": carpinteros→su oficio, fontaneros, albañiles… Misma piel de
   dashboard, fondo contextual. Clave = id de rol (ver actorGroups). Extensible:
   añadir una línea por oficio. Pisa al fondo de pestaña cuando hay rol activo. */
const ROLE_BG: Record<string, string> = {
  carpinteros: '/bg/trade-carpinteros.jpg',
  fontaneros: '/bg/trade-fontaneros.jpg',
  albaniles: '/bg/trade-albaniles.jpg',
}

// Definición de cada pestaña (label + icono). Fuente para todos los sectores.
function tabDefs(t: WorkspaceStrings): Record<Tab, { label: string; icon: React.ReactNode }> {
  return {
    buscador: { label: t.tabInicio, icon: <IconHome /> },
    catalogo: { label: t.tabCatalogo, icon: <IconGrid /> },
    actores: { label: t.tabActores, icon: <IconUsers /> },
    pedidos: { label: t.tabPedidos, icon: <IconBox /> },
    'mi-catalogo': { label: t.tabMiCatalogo, icon: <IconUpload /> },
    archivos: { label: t.tabArchivos, icon: <IconFile /> },
    mensajes: { label: t.tabMensajes, icon: <IconMail /> },
    agenda: { label: t.tabAgenda, icon: <IconCalendar /> },
    exportacion: { label: t.tabExportacion, icon: <IconShip /> },
    custodia: { label: 'Custodia', icon: <IconBox /> },
    documentacion: { label: 'Documentación', icon: <IconFile /> },
  }
}

// Set CANÓNICO de inmobiliario (= plantilla base). NO se toca: cualquier sector
// sin entrada propia abajo hereda exactamente este orden.
const DEFAULT_TAB_IDS: Tab[] = [
  'buscador', 'catalogo', 'actores', 'pedidos', 'mi-catalogo', 'archivos', 'mensajes', 'agenda', 'exportacion',
]

// Sets por sector: cada sector hereda la BASE (virtudes de inmobiliario:
// inicio/buscador, actores, archivos, mensajes, agenda) + AÑADE sus funciones.
const SECTOR_TAB_IDS: Record<string, Tab[]> = {
  // Transporte (transitario): no vende catálogo; gestiona logística y papeles.
  transporte: ['buscador', 'pedidos', 'custodia', 'documentacion', 'exportacion', 'actores', 'archivos', 'mensajes', 'agenda'],
}

function getTabs(t: WorkspaceStrings, sectorId?: string): { id: Tab; label: string; icon: React.ReactNode }[] {
  const defs = tabDefs(t)
  const ids = (sectorId && SECTOR_TAB_IDS[sectorId]) || DEFAULT_TAB_IDS
  return ids.map((id) => ({ id, ...defs[id] }))
}

/* ────────────────────────────── COMMS CLUSTER ──────────────────────────────
   Cluster de 4 botones de comunicaciones en el header. Reemplaza el botón
   único de mensajes anterior. Patrón de aviso:
   - Llamada/Vídeo/Reunión "ringing" → parpadeo verde rítmico hasta que el
     usuario acepta/rechaza (clase .comms-ring).
   - Chat con mensajes sin leer → badge contador estático + flash único de
     1s al recibir (clase .comms-flash, no se queda parpadeando de fondo).
   El estado vive en WorkspaceShell para que el panel DEV de simulación
   pueda dispararlo independientemente del chat real. */
export type CommsState = {
  chatUnread: number
  chatFlash: boolean
  callRinging: boolean
  videoRinging: boolean
  meetRinging: boolean
  /** Numero total de participantes en la reunion (incluido yo). El
      Stage usa este valor para dimensionar la grid. Cambiable desde
      el panel DEV mientras la infra real no existe. */
  meetParticipants: number
}

function CommsButton({
  title,
  ringing,
  active,
  flash,
  badge,
  onClick,
  children,
}: {
  title: string
  /** Llamada entrante esperando aceptar/rechazar — verde parpadeante. */
  ringing?: boolean
  /** Stage activo de este canal — verde solido + halo, sin parpadeo. */
  active?: boolean
  flash?: boolean
  badge?: number
  onClick?: () => void
  children: React.ReactNode
}) {
  // active manda sobre ringing si por casualidad llegan ambos.
  const classes = [
    !active && ringing && 'comms-ring',
    active && 'comms-active',
    flash && 'comms-flash',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      title={title}
      onClick={onClick}
      className={classes || undefined}
      style={{
        position: 'relative',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9,
        padding: 8,
        color: ringing || active ? '#54E08C' : '#9AA7B8',
        cursor: 'pointer',
        transition: 'color 0.2s, border-color 0.2s, background 0.2s',
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 14,
            height: 14,
            padding: '0 3px',
            borderRadius: 7,
            background: '#54E08C',
            color: '#08090F',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function CommsCluster({
  state,
  activeStage,
  chatOpen,
  onChatClick,
  onCallClick,
  onVideoClick,
  onMeetClick,
}: {
  state: CommsState
  /** Tipo de Stage en curso, si lo hay. Pinta el icono en verde solido. */
  activeStage: StageKind | null
  /** Drawer del chat abierto. Pinta el icono de chat en verde solido. */
  chatOpen: boolean
  onChatClick?: () => void
  onCallClick?: () => void
  onVideoClick?: () => void
  onMeetClick?: () => void
}) {
  const t = useT()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: 4,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 11,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <CommsButton
        title={t.tabMensajes}
        flash={state.chatFlash}
        badge={state.chatUnread}
        active={chatOpen}
        onClick={onChatClick}
      >
        <IconChat />
      </CommsButton>
      <CommsButton
        title="Llamada"
        ringing={state.callRinging}
        active={activeStage === 'call'}
        onClick={onCallClick}
      >
        <IconPhone />
      </CommsButton>
      <CommsButton
        title="Videollamada"
        ringing={state.videoRinging}
        active={activeStage === 'video'}
        onClick={onVideoClick}
      >
        <IconVideo />
      </CommsButton>
      <CommsButton
        title="Reunión"
        ringing={state.meetRinging}
        active={activeStage === 'meet'}
        onClick={onMeetClick}
      >
        <IconUsers />
      </CommsButton>
    </div>
  )
}

/* ChatDrawer: panel lateral derecho fijo para el chat texto. Se abre con
   el icono 💬 del CommsCluster y se cierra con X o ESC. Sustituye a la
   columna fija de 360 px que vivia entre el sidebar y el main — el chat
   ya no esta SIEMPRE presente, sino bajo demanda. */
function ChatDrawer({
  open,
  onClose,
  t,
}: {
  open: boolean
  onClose: () => void
  t: WorkspaceStrings
}) {
  // ESC cierra el drawer cuando esta abierto.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <aside
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        width: 380,
        height: 'calc(100vh - 64px)',
        background: 'rgba(10,12,18,0.92)',
        backdropFilter: 'blur(22px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease-out, box-shadow 0.25s',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#9AA7B8',
        }}
      >
        <span>{t.tabMensajes}</span>
        <button
          onClick={onClose}
          title="Cerrar (ESC)"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#9AA7B8',
            width: 24,
            height: 24,
            borderRadius: 7,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatPanel t={t} hideActionBar borderSide="left" />
      </div>
    </aside>
  )
}

/* CommsStage: panel que se monta cuando hay llamada/video/reunion
   activa. Dos modos:
   - SLIM: franja inferior ~320px, respeta el escritorio arriba.
   - FULL: ocupa toda el area entre el sidebar y el drawer (si abierto).
   Hoy el video es un placeholder visual — la infra WebRTC llega en
   Fase 5 (project_1503_call_model). */
type StageKind = 'call' | 'video' | 'meet'
type StageMode = 'slim' | 'full' | 'pip'
/** Preferencia persistente del usuario sobre el modo inicial del Stage.
   - 'auto': call/video → slim, meet → full (regla por defecto sensata)
   - 'slim'/'full': fuerza ese modo en todo Stage nuevo */
type StageDefaultMode = 'auto' | 'slim' | 'full'
const STAGE_DEFAULT_MODE_KEY = '1503:stage:defaultMode'

function resolveInitialStageMode(kind: StageKind, pref: StageDefaultMode): StageMode {
  // El Stage nunca arranca en pip — pip es estado transitorio
  // activado por el usuario para aparcar el Stage Slim en una esquina.
  if (pref === 'slim' || pref === 'full') return pref
  return kind === 'meet' ? 'full' : 'slim'
}

const STAGE_LABELS: Record<StageKind, { title: string }> = {
  call: { title: 'Llamada de voz' },
  video: { title: 'Videollamada' },
  meet: { title: 'Reunión' },
}

/** Identidad de cada participante en un Stage. En B2B regulado saber quién
   está en la sala es tan crítico como las palabras: identidad siempre visible,
   credencial KYC visible, Actor-ID legal visible, y un solo click para ver
   la ficha completa. Ver project_1503_presencia_identidad. */
type StageParticipant = {
  id: string
  /** Actor-ID visible: código corto derivado del DID del Actor en
     1503. Sirve como "DNI digital de la plataforma": permite
     identificar inequívocamente sin exhibir NIF/dirección. Formato
     ACT-XXXX-XXXX. Ver project_1503_identity_model. */
  actorId: string
  /** DID completo del Actor en 1503. Aparece en tooltip y en el
     acta de reunión. Fase 6+ resuelve a DID estándar; hoy es placeholder. */
  did: string
  name: string
  company: string
  role?: string
  kycVerified: boolean
  isMe?: boolean
  isOrganizer?: boolean
}

/* Datos placeholder. Fase 5 los reemplaza por la lista real del room
   (Jitsi/WebRTC) cruzada con la tabla de actores KYC-verificados.
   Actor-IDs estables (hardcoded) para que las pruebas locales no
   varíen entre recargas — Fase 5 los genera del DID real. */
const DEMO_OTHERS: Omit<StageParticipant, 'isMe' | 'isOrganizer'>[] = [
  { id: 'a1', actorId: 'ACT-7K4M-2P9X', did: 'did:propm:7k4m2p9x4a1b3c5d', name: 'María García', company: 'Inversiones Solana SL', role: 'Directora', kycVerified: true },
  { id: 'a2', actorId: 'ACT-3F8H-9Q2R', did: 'did:propm:3f8h9q2r8e7f1g2h', name: 'Carlos López', company: 'Construcciones Madrid SA', role: 'CEO', kycVerified: true },
  { id: 'a3', actorId: 'ACT-5B2D-7N4K', did: 'did:propm:5b2d7n4k6c8d2e3f', name: 'Ana Martín', company: 'Notaría Núñez & Asociados', role: 'Notaria', kycVerified: true },
  { id: 'a4', actorId: 'ACT-9J6L-1V8W', did: 'did:propm:9j6l1v8w5g4h6i7j', name: 'David Sánchez', company: 'Banca corporativa', role: 'Asesor financiero', kycVerified: true },
  { id: 'a5', actorId: 'ACT-4Y3T-6M1P', did: 'did:propm:4y3t6m1p8k9l3m4n', name: 'Lucía Pérez', company: 'Transitarios del Sur', role: 'Operaciones', kycVerified: true },
  { id: 'a6', actorId: 'ACT-8C5G-3Z7B', did: 'did:propm:8c5g3z7b1o2p5q6r', name: 'Javier Ruiz', company: 'Auditora Iberia', role: 'Auditor', kycVerified: true },
  { id: 'a7', actorId: 'ACT-2A9F-5X4D', did: 'did:propm:2a9f5x4d9s8t4u5v', name: 'Elena Torres', company: 'Bufete Mediterráneo', role: 'Abogada fintech', kycVerified: true },
  { id: 'a8', actorId: 'ACT-6H1S-8W7E', did: 'did:propm:6h1s8w7e3w2x6y7z', name: 'Pablo Navarro', company: 'Logística Atlántica', role: 'Director', kycVerified: true },
  { id: 'a9', actorId: 'ACT-1L4P-2R9N', did: 'did:propm:1l4p2r9n7a6b8c9d', name: 'Sara Castro', company: 'Constructora Levante', role: 'Project manager', kycVerified: true },
  { id: 'a10', actorId: 'ACT-7E3K-4Q6V', did: 'did:propm:7e3k4q6v5e4f9g1h', name: 'Miguel Romero', company: 'Promotora Norte', role: 'Promotor', kycVerified: true },
  { id: 'a11', actorId: 'ACT-5T8B-9C2J', did: 'did:propm:5t8b9c2j3i2k7l8m', name: 'Beatriz Vidal', company: 'Servicios Energéticos', role: 'Ingeniera', kycVerified: true },
  { id: 'a12', actorId: 'ACT-3M7R-1F5L', did: 'did:propm:3m7r1f5l9n8o4p5q', name: 'Roberto Gil', company: 'Aseguradora Hispana', role: 'Tasador', kycVerified: true },
  { id: 'a13', actorId: 'ACT-9N2Y-6A8H', did: 'did:propm:9n2y6a8h7r6s1t2u', name: 'Cristina Vega', company: 'Cooperativa Agraria', role: 'Gerente', kycVerified: true },
  { id: 'a14', actorId: 'ACT-4X6V-7K3D', did: 'did:propm:4x6v7k3d5v4w8x9y', name: 'Daniel Ortega', company: 'Inmobiliaria Costa', role: 'Comercial', kycVerified: true },
  { id: 'a15', actorId: 'ACT-8U1Q-2G5W', did: 'did:propm:8u1q2g5w3z2a6b7c', name: 'Marta Iglesias', company: 'Estudio de Arquitectura', role: 'Arquitecta', kycVerified: true },
]

function buildStageParticipants(count: number, myName: string, myCompany: string): StageParticipant[] {
  const me: StageParticipant = {
    id: 'me',
    actorId: 'ACT-0000-YOU0', // placeholder; Fase 3a-bis lo lee del Actor del usuario logueado
    did: 'did:propm:me-placeholder',
    name: myName.trim() || 'Tú',
    company: myCompany.trim() || 'Mi empresa',
    kycVerified: true,
    isMe: true,
    isOrganizer: count >= 3,
  }
  const otherCount = Math.max(0, count - 1)
  const others = DEMO_OTHERS.slice(0, otherCount).map((p) => ({ ...p }))
  return [me, ...others]
}

function StageDefaultModeControl({
  value,
  onChange,
}: {
  value: StageDefaultMode
  onChange: (next: StageDefaultMode) => void
}) {
  const opts: { id: StageDefaultMode; label: string; title: string }[] = [
    { id: 'auto', label: 'Auto', title: 'Llamada/video → compacto · Reunión → amplio' },
    { id: 'slim', label: 'Slim', title: 'Siempre compacto (escritorio visible arriba)' },
    { id: 'full', label: 'Full', title: 'Siempre amplio (ocupa el escritorio)' },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Modo por defecto del Stage"
      title="Modo por defecto al abrir una llamada/video/reunión"
      style={{
        display: 'inline-flex',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
      }}
    >
      {opts.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.id)}
            style={{
              background: active ? 'rgba(185,164,255,0.12)' : 'transparent',
              border: 'none',
              borderRight: o.id === 'full' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: active ? '#B9A4FF' : '#6B7A8F',
              padding: '4px 8px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function CommsStage({
  kind,
  mode,
  participants,
  rightOffset,
  topOffset,
  defaultMode,
  onChangeDefaultMode,
  onToggleMode,
  onMinimizeToPip,
  onRestoreFromPip,
  onHangup,
}: {
  kind: StageKind
  mode: StageMode
  /** Lista de participantes (incluido yo en index 0). 2 para
      llamada/video 1-a-1, N para reunión. La identidad va siempre
      visible — ver memoria project_1503_presencia_identidad. */
  participants: StageParticipant[]
  rightOffset: number
  /** Altura real del bloque banner+header+marketbanner medida con
      ResizeObserver en WorkspaceShell. El Stage FULL la usa como
      `top` para anclarse justo debajo. */
  topOffset: number
  defaultMode: StageDefaultMode
  onChangeDefaultMode: (next: StageDefaultMode) => void
  onToggleMode: () => void
  /** Aparcar el Stage Slim como thumbnail flotante en la esquina
      inferior derecha. Disponible solo en modo Slim. */
  onMinimizeToPip: () => void
  /** Restaurar a Slim desde el modo Pip (click en el thumbnail). */
  onRestoreFromPip: () => void
  onHangup: () => void
}) {
  const info = STAGE_LABELS[kind]
  const total = participants.length
  const unverified = participants.filter((p) => !p.kycVerified).length

  // Cronómetro de la sesión. Arranca al montar el Stage, se reinicia
  // cuando el Stage se desmonta y vuelve a montar (nueva llamada).
  // Formato HH:MM:SS si supera 1h, MM:SS si no.
  //
  // Hardening 23-may auditoría: el modelo anterior con `setElapsedSec((s)=>s+1)`
  // contaba pasos del timer. Cuando la pestaña pasa a background los
  // navegadores ralentizan setInterval (a veces a 1Hz, otras a 1/60Hz) →
  // el cronómetro mostrado divergía del tiempo real de la sesión. Crítico
  // porque va al acta legal de la reunión.
  //
  // Solución: guardar el timestamp de inicio en un ref y derivar segundos
  // transcurridos del wallclock cada tick. Aunque el setInterval se
  // ralentice, el valor mostrado siempre refleja tiempo real.
  //
  // El ref se inicializa a null para evitar llamar Date.now() durante el
  // render (regla `react-hooks/purity` de React 19+ / Next 16: Date.now es
  // impura). Se popula en el useEffect en su primer tick.
  const startTimeRef = useRef<number | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  useEffect(() => {
    // Anclar el inicio al wallclock en el primer tick del effect.
    startTimeRef.current = Date.now()
    const id = window.setInterval(() => {
      const start = startTimeRef.current ?? Date.now()
      setElapsedSec(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])
  const elapsedLabel = (() => {
    const h = Math.floor(elapsedSec / 3600)
    const m = Math.floor((elapsedSec % 3600) / 60)
    const s = elapsedSec % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  })()

  // Modo PIP: thumbnail flotante en esquina inferior derecha. No se
  // renderiza el section grande — el escritorio queda libre. Click
  // en el thumbnail restaura a Slim.
  if (mode === 'pip') {
    return (
      <StagePip
        kind={kind}
        participants={participants}
        rightOffset={rightOffset}
        elapsedLabel={elapsedLabel}
        onRestore={onRestoreFromPip}
        onHangup={onHangup}
      />
    )
  }

  const containerStyle: React.CSSProperties =
    mode === 'slim'
      ? {
          position: 'fixed',
          left: 230,
          right: rightOffset,
          bottom: 0,
          height: 320,
          background: 'linear-gradient(180deg, #08090F 0%, #0A0C12 100%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          zIndex: 35,
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          transition: 'all 0.25s ease-out',
        }
      : {
          position: 'fixed',
          left: 230,
          right: rightOffset,
          top: topOffset,
          bottom: 0,
          background: '#08090F',
          zIndex: 35,
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          transition: 'all 0.25s ease-out',
        }

  return (
    <section style={containerStyle} aria-label={`${info.title} activa`}>
      {/* Video area + controles */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: '#05070C',
          overflow: 'hidden',
        }}
      >
        {/* Barra superior del stage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(8,9,15,0.6)',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.74rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#C9D4E6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#54E08C',
                boxShadow: '0 0 8px #54E08C',
              }}
            />
            <span>{info.title} · en curso</span>
            {/* Cronómetro de la sesión — útil para conciencia de tiempo
                y como base del modelo de receso (ver memoria
                project_1503_modelo_admision_reuniones). */}
            <span
              title="Tiempo transcurrido desde el inicio de la sesión"
              style={{
                color: '#EAEFF6',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontWeight: 600,
                background: 'rgba(185,164,255,0.06)',
                padding: '2px 8px',
                borderRadius: 2,
                letterSpacing: '0.12em',
              }}
            >
              ⏱ {elapsedLabel}
            </span>
            <span style={{ color: '#6B7686' }}>· {total} part.</span>
            {/* Contador KYC: verde si todos verificados, rojo si alguno no.
                En B2B regulado saber QUIÉN está en la sala es crítico. */}
            <span
              title={
                unverified === 0
                  ? 'Todos los participantes tienen credencial KYC verificada'
                  : `${unverified} participante(s) sin verificación KYC válida`
              }
              style={{
                color: unverified === 0 ? '#54E08C' : '#E5484D',
                letterSpacing: '0.14em',
                fontWeight: 600,
              }}
            >
              · {unverified === 0 ? '✓ todos kyc' : `⚠ ${unverified} sin verificar`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Setting persistente: modo por defecto al abrir un Stage nuevo.
                Auto = call/video → slim, meet → full. El toggle ↕/↧ de
                la derecha sigue siendo efímero (modo del Stage en curso). */}
            <StageDefaultModeControl value={defaultMode} onChange={onChangeDefaultMode} />
            {/* Aparcar: visible en Slim y Full. Manda el Stage a un
                thumbnail flotante en esquina inferior derecha (modo Pip).
                Estado SOLO local del cliente — los demás siguen viendo
                tu participación normal en la reunión. */}
            <button
              onClick={onMinimizeToPip}
              title="Aparcar tu vista del Stage como miniatura flotante (solo afecta a tu pantalla; la reunión sigue activa para todos)"
              style={{
                background: 'rgba(159,182,204,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#C9D4E6',
                padding: '4px 10px',
                borderRadius: 3,
                cursor: 'pointer',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ▭ Aparcar
            </button>
            <button
              onClick={onToggleMode}
              title={mode === 'slim' ? 'Expandir a pantalla completa' : 'Minimizar a franja inferior'}
              style={{
                background: 'rgba(185,164,255,0.08)',
                border: '1px solid rgba(185,164,255,0.3)',
                color: '#B9A4FF',
                padding: '4px 10px',
                borderRadius: 3,
                cursor: 'pointer',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {mode === 'slim' ? '↕ Expandir' : '↧ Minimizar'}
            </button>
          </div>
        </div>

        {/* Video placeholder (Fase 5 = WebRTC real) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background:
              'radial-gradient(circle at center, rgba(185,164,255,0.06) 0%, transparent 60%)',
          }}
        >
          {kind === 'meet' ? (
            <StageGrid participants={participants} mode={mode} />
          ) : (
            <StageSinglePeer kind={kind} participants={participants} />
          )}
          {/* Etiqueta de placeholder */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 16,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              color: '#6B7686',
              textTransform: 'uppercase',
            }}
          >
            placeholder · Fase 5 conectará WebRTC
          </div>
        </div>

        {/* Controles */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(8,9,15,0.8)',
          }}
        >
          <StageCtrl label="🎙" title="Silenciar micro" />
          {/* Camara solo en video/meet — la llamada de voz no la tiene */}
          {kind !== 'call' && <StageCtrl label="📹" title="Apagar cámara" />}
          {/* Compartir pantalla — modelo de permisos por tipo de stage.
              Voz: no aplica. Video 1-a-1: ambos pueden, con aviso
              pre-share. Reunion: solo organizador (Fase 5 cablea el rol).
              Ver project_1503_screen_share_security. */}
          {kind === 'video' && (
            <StageCtrl
              label="📺"
              title="Compartir pantalla"
              onClick={() => {
                const ok = window.confirm(
                  'Vas a compartir tu pantalla con los otros participantes. Asegúrate de no tener otras ventanas con información sensible abiertas.\n\n¿Continuar?',
                )
                if (ok) {
                  // Fase 5 cableará getDisplayMedia con seleccion granular
                  // (ventana / pestaña / pantalla entera con confirmacion extra).
                  console.log('[placeholder] compartir pantalla aprobado')
                }
              }}
            />
          )}
          {kind === 'meet' && (
            <StageCtrl
              label="📺"
              title="Solo el organizador puede compartir pantalla (Fase 5)"
              disabled
            />
          )}
          <StageCtrl label="💬" title="Chat de la llamada" />
          <button
            onClick={onHangup}
            title="Colgar"
            style={{
              background: '#A03133',
              border: '1px solid #C2474A',
              color: '#FFE6E7',
              borderRadius: 3,
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontWeight: 600,
            }}
          >
            ⏏ Colgar
          </button>
        </div>
      </div>

      {/* Panel lateral derecho del stage: chat + asistentes + agenda */}
      <aside
        style={{
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          background: '#0A0C12',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <StageSidePanel kind={kind} participants={participants} />
      </aside>
    </section>
  )
}

/** Thumbnail flotante en esquina inferior derecha cuando el usuario
   aparca el Stage Slim para seguir trabajando en el escritorio. La
   llamada/reunión sigue activa — el thumbnail muestra info mínima
   y un mini-mosaico de los participantes. Click → restaura a Slim. */
function StagePip({
  kind,
  participants,
  rightOffset,
  elapsedLabel,
  onRestore,
  onHangup,
}: {
  kind: StageKind
  participants: StageParticipant[]
  rightOffset: number
  elapsedLabel: string
  onRestore: () => void
  onHangup: () => void
}) {
  const info = STAGE_LABELS[kind]
  const PIP_W = 280
  const PIP_H = 168
  return (
    <div
      role="button"
      aria-label={`${info.title} aparcada — click para restaurar`}
      onClick={onRestore}
      title="Click para restaurar"
      style={{
        position: 'fixed',
        right: rightOffset + 20,
        bottom: 20,
        width: PIP_W,
        height: PIP_H,
        background: '#0A0C12',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        zIndex: 40,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabecera mínima: tipo + cronómetro */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8,9,15,0.8)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.6rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#C9D4E6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#54E08C',
              boxShadow: '0 0 6px #54E08C',
            }}
          />
          <span>{info.title}</span>
          <span style={{ color: '#EAEFF6', fontWeight: 600 }}>⏱ {elapsedLabel}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onHangup()
          }}
          title="Colgar"
          style={{
            background: '#A03133',
            border: 'none',
            color: '#FFE6E7',
            borderRadius: 2,
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          ✕
        </button>
      </div>
      {/* Cuerpo: mini-mosaico de iniciales */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: kind === 'meet' && participants.length > 4 ? 'repeat(3, 1fr)' : `repeat(${Math.min(participants.length, 2)}, 1fr)`,
          gridAutoRows: '1fr',
          gap: 3,
          padding: 5,
          background: '#05070C',
        }}
      >
        {participants.slice(0, 6).map((p) => {
          const initials = p.name
            .split(/\s+/)
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()
          return (
            <div
              key={p.id}
              title={`${p.name} · ${p.actorId}`}
              style={{
                background: '#0E1118',
                border: '1px solid ' + (p.isMe ? 'rgba(185,164,255,0.4)' : 'rgba(255,255,255,0.08)'),
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: p.isMe ? '#B9A4FF' : '#C9D4E6',
                fontFamily: 'var(--font-chakra-petch), sans-serif',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {initials || (p.isMe ? 'TÚ' : '?')}
            </div>
          )
        })}
        {participants.length > 6 && (
          <div
            style={{
              background: '#0E1118',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9AA7B8',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 10,
              letterSpacing: '0.08em',
            }}
          >
            +{participants.length - 6}
          </div>
        )}
      </div>
      {/* Pie: indicación de click */}
      <div
        style={{
          padding: '3px 8px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8,9,15,0.6)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.58rem',
          letterSpacing: '0.1em',
          color: '#6B7686',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        click para restaurar
      </div>
    </div>
  )
}

function StageCtrl({
  label,
  title,
  disabled,
  onClick,
}: {
  label: string
  title: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: '1px solid ' + (disabled ? 'rgba(30,37,48,0.5)' : 'rgba(255,255,255,0.08)'),
        color: disabled ? '#6B7686' : '#C9D4E6',
        borderRadius: 3,
        padding: '8px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 15,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  )
}

function StageSinglePeer({ kind, participants }: { kind: StageKind; participants: StageParticipant[] }) {
  // El otro = primer participante que no soy yo. En 1-a-1 siempre hay
  // exactamente uno; fallback a placeholder si la lista viene corta.
  const other = participants.find((p) => !p.isMe)
  return (
    <div
      style={{
        width: '70%',
        maxWidth: 520,
        aspectRatio: '16 / 9',
        background: '#0E1118',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 16,
        gap: 12,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), #0E1118)',
          border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          color: '#6B7686',
          fontFamily: 'var(--font-chakra-petch), sans-serif',
          fontWeight: 600,
        }}
      >
        {kind === 'video' ? '🎥' : '📞'}
      </div>
      {/* Identidad del otro participante: nombre + empresa + credencial.
          En B2B regulado, esto debe estar SIEMPRE visible, no oculto en
          un tab. Click → ficha completa (Fase 5). */}
      {other && (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              fontSize: '1rem',
              color: '#EAEFF6',
              fontWeight: 600,
            }}
          >
            {other.name}
            <span
              title="Credencial KYC verificada"
              style={{ color: '#54E08C', marginLeft: 6, fontSize: '0.86rem' }}
            >
              ✓
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.7rem',
              color: '#C9D4E6',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}
          >
            {other.company}
            {other.role ? ` · ${other.role}` : ''}
          </div>
          {/* Actor-ID: identidad legal en 1503 — queda en el acta */}
          <div
            title={`DID completo: ${other.did}`}
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.66rem',
              color: '#B9A4FF',
              letterSpacing: '0.1em',
              marginTop: 4,
            }}
          >
            {other.actorId}
          </div>
        </div>
      )}
    </div>
  )
}

/** Tile layout convencional para hasta 16 participantes. Para 17+
 *  cambiamos a modo "speaker view" (un grande + thumbnails laterales)
 *  porque por debajo de ~150px de lado el rostro deja de leerse. */
function gridDims(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 }
  if (n === 2) return { cols: 2, rows: 1 }
  if (n <= 4) return { cols: 2, rows: 2 }
  if (n <= 6) return { cols: 3, rows: 2 }
  if (n <= 9) return { cols: 3, rows: 3 }
  if (n <= 12) return { cols: 4, rows: 3 }
  return { cols: 4, rows: 4 } // 13-16
}

const SPEAKER_PAGE = 8 // thumbnails visibles por página en speaker view

function StageGrid({ participants, mode }: { participants: StageParticipant[]; mode: StageMode }) {
  // Hasta 16: tile uniforme. 17+: speaker view con paginación manual.
  if (participants.length <= 16) return <StageTileGrid participants={participants} mode={mode} />
  return <StageSpeakerView participants={participants} mode={mode} />
}

function StageTileGrid({ participants, mode }: { participants: StageParticipant[]; mode: StageMode }) {
  const count = participants.length
  const { cols, rows } = gridDims(count)

  // FULL: el grid llena todo el área entre header y controles, dividida
  // en partes iguales (cols × rows). Cada tile crece al máximo
  // posible respetando la ratio del contenedor — sin maxWidth ni
  // aspectRatio forzado.
  // SLIM: el grid se mantiene contenido (maxWidth 780, aspectRatio
  // 16:9 o 32:9 para 2 tiles) porque la franja inferior tiene solo
  // 320px de alto y un grid expandido se vería distorsionado.
  const style: React.CSSProperties =
    mode === 'full'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 12,
          width: '100%',
          height: '100%',
          padding: 16,
          boxSizing: 'border-box',
        }
      : {
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
          width: count === 1 ? '50%' : '85%',
          maxWidth: 780,
          aspectRatio: count === 2 ? '32 / 9' : '16 / 9',
        }

  return (
    <div style={style}>
      {participants.map((p) => (
        <ParticipantTile key={p.id} participant={p} />
      ))}
    </div>
  )
}

function StageSpeakerView({ participants, mode }: { participants: StageParticipant[]; mode: StageMode }) {
  // Tile grande (el "orador") + carrusel paginado de thumbnails. El
  // orador activo se detectará por audio energy en Fase 5; mientras
  // tanto el usuario elige por click. Default = primer no-yo.
  const defaultSpeaker = participants.findIndex((p) => !p.isMe)
  const [speakerIdx, setSpeakerIdx] = useState(defaultSpeaker === -1 ? 0 : defaultSpeaker)
  const [page, setPage] = useState(0)

  const others: number[] = []
  for (let i = 0; i < participants.length; i++) if (i !== speakerIdx) others.push(i)
  const pages = Math.max(1, Math.ceil(others.length / SPEAKER_PAGE))
  const slice = others.slice(page * SPEAKER_PAGE, (page + 1) * SPEAKER_PAGE)

  // FULL: usar todo el área disponible. El orador ocupa la mayor parte
  // (flex:1) y el carrusel de thumbnails va abajo a altura fija.
  // SLIM: contenido (max 900 ancho, aspect 16:9 para el orador).
  const containerStyle: React.CSSProperties =
    mode === 'full'
      ? {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          boxSizing: 'border-box',
        }
      : {
          width: '90%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }
  const speakerWrap: React.CSSProperties =
    mode === 'full'
      ? { flex: 1, minHeight: 0 }
      : { aspectRatio: '16 / 9' }

  return (
    <div style={containerStyle}>
      <div style={speakerWrap}>
        <ParticipantTile participant={participants[speakerIdx]} large />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          style={pageBtn(page === 0)}
          title="Página anterior"
        >
          ‹
        </button>
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${SPEAKER_PAGE}, 1fr)`,
            gap: 6,
          }}
        >
          {slice.map((i) => (
            <button
              key={participants[i].id}
              onClick={() => setSpeakerIdx(i)}
              title={`Mostrar como orador: ${participants[i].name}`}
              style={{
                aspectRatio: '1 / 1',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <ParticipantTile participant={participants[i]} thumb />
            </button>
          ))}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          disabled={page >= pages - 1}
          style={pageBtn(page >= pages - 1)}
          title="Página siguiente"
        >
          ›
        </button>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.66rem',
            color: '#9AA7B8',
            letterSpacing: '0.12em',
            minWidth: 48,
            textAlign: 'right',
          }}
        >
          {page + 1}/{pages}
        </span>
      </div>
    </div>
  )
}

function pageBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'transparent' : 'rgba(185,164,255,0.08)',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(185,164,255,0.3)'}`,
    color: disabled ? '#6B7686' : '#B9A4FF',
    width: 26,
    height: 26,
    borderRadius: 3,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 16,
    lineHeight: 1,
  }
}

function ParticipantTile({
  participant,
  large,
  thumb,
}: {
  participant: StageParticipant
  large?: boolean
  thumb?: boolean
}) {
  const p = participant
  // Iniciales como avatar provisional (Fase 5 = avatar real).
  const initials = p.name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Borde rojo si la credencial KYC no es válida — segunda línea de
  // defensa visual aunque a este Stage no debería llegar nadie sin KYC.
  const borderColor = !p.kycVerified
    ? '#E5484D'
    : large
      ? '#B9A4FF'
      : p.isMe
        ? 'rgba(185,164,255,0.4)'
        : 'rgba(255,255,255,0.08)'

  return (
    <div
      title={`${p.name} · ${p.actorId}\n${p.did}\n${p.company}${p.role ? ' · ' + p.role : ''}\n${p.kycVerified ? 'KYC ✓ verificado' : 'SIN KYC ⚠ — no entrar en negociación'}`}
      style={{
        width: '100%',
        height: '100%',
        background: '#0E1118',
        border: '1px solid ' + borderColor,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        color: '#9AA7B8',
        fontSize: 11,
        fontWeight: 600,
        overflow: 'hidden',
      }}
    >
      {thumb ? (
        initials || (p.isMe ? 'TÚ' : '?')
      ) : (
        // Avatar circular (no "watermark"): chip lila con iniciales, como en ActorCard.
        <div
          style={{
            width: large ? 76 : 50,
            height: large ? 76 : 50,
            borderRadius: '50%',
            background: 'rgba(185,164,255,0.14)',
            border: '1px solid rgba(185,164,255,0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C7B8FF',
            fontSize: large ? 28 : 19,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {initials || (p.isMe ? 'TÚ' : '?')}
        </div>
      )}
      {/* Insignia organizador (corona arriba-derecha) */}
      {p.isOrganizer && !thumb && (
        <span
          title="Organizador de la reunión"
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontSize: large ? '0.9rem' : '0.7rem',
          }}
        >
          👑
        </span>
      )}
      {/* Aviso KYC inválido — banda superior roja */}
      {!p.kycVerified && !thumb && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(229,72,77,0.18)',
            color: '#FFB4B6',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: large ? '0.7rem' : '0.55rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '2px 0',
          }}
        >
          ⚠ sin verificar
        </span>
      )}
      {/* Overlay de identidad abajo-izquierda: nombre + empresa + KYC ✓ */}
      {!thumb && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'rgba(8,9,15,0.6)',
            padding: '2px 6px',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              fontSize: large ? '0.86rem' : '0.7rem',
              color: '#EAEFF6',
              fontWeight: 600,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.isMe ? 'Tú' : p.name}
            </span>
            {p.kycVerified && (
              <span style={{ color: '#54E08C', fontSize: large ? '0.8rem' : '0.65rem' }}>✓</span>
            )}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: large ? '0.62rem' : '0.5rem',
              color: '#C9D4E6',
              letterSpacing: '0.08em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {p.company}
          </div>
          {/* Actor-ID: identidad legal en 1503. Click → ficha
              completa (Fase 5). Visible siempre, queda en el acta. */}
          <div
            style={{
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: large ? '0.56rem' : '0.46rem',
              color: '#B9A4FF',
              letterSpacing: '0.1em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {p.actorId}
          </div>
        </div>
      )}
      {/* Thumbnail compacto: sólo nombre corto sin company para no saturar */}
      {thumb && (
        <span
          style={{
            position: 'absolute',
            bottom: 1,
            left: 2,
            right: 2,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.5rem',
            color: '#C9D4E6',
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            background: 'rgba(8,9,15,0.7)',
            padding: '1px 2px',
            borderRadius: 1,
          }}
          title={p.name}
        >
          {p.isMe ? 'Tú' : p.name.split(' ')[0]}
        </span>
      )}
    </div>
  )
}

function StageSidePanel({ kind, participants }: { kind: StageKind; participants: StageParticipant[] }) {
  // En reunión: Asistentes primero (identidad es lo más crítico).
  // En 1-a-1: Chat primero (el otro ya está identificado en el peer).
  const tabLabels =
    kind === 'meet'
      ? ['Asistentes', 'Chat', 'Agenda']
      : ['Chat', 'Asistentes']
  const [tab, setTab] = useState(0)
  return (
    <>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#08090F',
        }}
      >
        {tabLabels.map((l, i) => (
          <button
            key={l}
            onClick={() => setTab(i)}
            style={{
              flex: 1,
              background: tab === i ? 'rgba(185,164,255,0.08)' : 'transparent',
              border: 'none',
              borderBottom: tab === i ? '2px solid #B9A4FF' : '2px solid transparent',
              color: tab === i ? '#B9A4FF' : '#9AA7B8',
              padding: '10px 6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {tabLabels[tab] === 'Asistentes' && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {participants.map((p) => {
              const initials = p.name
                .split(/\s+/)
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase()
              const borderBad = !p.kycVerified
              return (
                <li
                  key={p.id}
                  title={`${p.name}${p.role ? ' · ' + p.role : ''}${p.kycVerified ? ' · KYC ✓' : ' · SIN KYC ⚠'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 8,
                    border: '1px solid ' + (borderBad ? '#E5484D' : p.isMe ? 'rgba(185,164,255,0.4)' : 'rgba(255,255,255,0.08)'),
                    borderRadius: 3,
                    background: borderBad
                      ? 'rgba(229,72,77,0.06)'
                      : p.isMe
                        ? 'rgba(185,164,255,0.06)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: p.isMe ? 'rgba(185,164,255,0.18)' : 'rgba(255,255,255,0.08)',
                      border: '1px solid ' + (p.isMe ? '#B9A4FF' : 'rgba(255,255,255,0.10)'),
                      color: p.isMe ? '#B9A4FF' : '#C9D4E6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontFamily: 'var(--font-geist-mono), monospace',
                      flexShrink: 0,
                    }}
                  >
                    {initials || (p.isMe ? 'YO' : '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          color: '#EAEFF6',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.isMe ? 'Tú' : p.name}
                      </span>
                      {p.kycVerified ? (
                        <span title="KYC verificado" style={{ color: '#54E08C', fontSize: '0.76rem' }}>✓</span>
                      ) : (
                        <span title="Sin KYC válido" style={{ color: '#E5484D', fontSize: '0.76rem' }}>⚠</span>
                      )}
                      {p.isOrganizer && (
                        <span title="Organizador" style={{ fontSize: '0.78rem' }}>👑</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontSize: '0.62rem',
                        color: '#9AA7B8',
                        letterSpacing: '0.06em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.company}
                      {p.role ? ` · ${p.role}` : ''}
                    </div>
                    {/* Actor-ID: identificación legal del Actor en
                        1503. Visible siempre, queda en el acta. */}
                    <div
                      title={`DID completo: ${p.did}`}
                      style={{
                        fontFamily: 'var(--font-geist-mono), monospace',
                        fontSize: '0.58rem',
                        color: '#B9A4FF',
                        letterSpacing: '0.08em',
                        marginTop: 1,
                      }}
                    >
                      {p.actorId}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {tabLabels[tab] === 'Chat' && (
          <div style={{ color: '#6B7686', fontSize: '0.82rem', lineHeight: 1.6 }}>
            Chat de la llamada — llega con la infra WebRTC (Fase 5).
            Mensajes efímeros mientras dure la sesión.
          </div>
        )}
        {tabLabels[tab] === 'Agenda' && (
          <div style={{ color: '#6B7686', fontSize: '0.82rem', lineHeight: 1.6 }}>
            Orden del día / notas compartidas. Sincronizará con el tab
            Agenda del workspace.
          </div>
        )}
      </div>
    </>
  )
}

/* DEV-only panel para simular eventos entrantes mientras la infra de
   llamadas no existe. Se monta solo si NODE_ENV !== 'production'. */
function CommsDevPanel({
  state,
  setState,
}: {
  state: CommsState
  setState: React.Dispatch<React.SetStateAction<CommsState>>
}) {
  // Hardening 23-may: ref para el timeout del flash del chat. Antes el
  // setTimeout vivía dentro de un callback de setState sin cleanup —
  // si el panel se desmontaba antes del segundo, generaba setState
  // post-unmount (warning + memory leak silencioso).
  const chatFlashTimer = useRef<number | null>(null)
  useEffect(() => {
    return () => {
      if (chatFlashTimer.current) {
        clearTimeout(chatFlashTimer.current)
        chatFlashTimer.current = null
      }
    }
  }, [])

  if (process.env.NODE_ENV === 'production') return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 100,
        background: 'rgba(8,9,15,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '10px 12px',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: '0.7rem',
        color: '#9AA7B8',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        maxWidth: 240,
      }}
    >
      <div style={{ marginBottom: 8, color: '#F0B429' }}>DEV · simular evento</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <button
          onClick={() => setState((s) => ({ ...s, callRinging: !s.callRinging }))}
          style={devBtn(state.callRinging)}
        >
          {state.callRinging ? '⏹ parar' : '▶'} llamada
        </button>
        <button
          onClick={() => setState((s) => ({ ...s, videoRinging: !s.videoRinging }))}
          style={devBtn(state.videoRinging)}
        >
          {state.videoRinging ? '⏹ parar' : '▶'} videollamada
        </button>
        <button
          onClick={() => setState((s) => ({ ...s, meetRinging: !s.meetRinging }))}
          style={devBtn(state.meetRinging)}
        >
          {state.meetRinging ? '⏹ parar' : '▶'} reunión
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 0',
          }}
        >
          <span style={{ color: '#9AA7B8', fontSize: '0.62rem', flex: 1 }}>
            participantes reunión: {state.meetParticipants}
          </span>
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                meetParticipants: Math.max(2, s.meetParticipants - 1),
              }))
            }
            style={devBtn(false)}
            title="Quitar uno"
          >
            −
          </button>
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                meetParticipants: Math.min(25, s.meetParticipants + 1),
              }))
            }
            style={devBtn(false)}
            title="Añadir uno"
          >
            +
          </button>
        </div>
        <button
          onClick={() => {
            setState((s) => ({ ...s, chatUnread: s.chatUnread + 1, chatFlash: true }))
            // Hardening 23-may: el setTimeout antes vivía dentro del callback
            // de setState. Si el componente se desmontaba en ese segundo
            // (cambio de sector → unmount), el segundo setState ejecutaba
            // sobre componente desmontado (warning + memory leak silencioso).
            // Ahora va fuera del callback y se almacena en chatFlashTimer
            // para poder limpiarlo si CommsDevPanel se desmonta antes.
            if (chatFlashTimer.current) clearTimeout(chatFlashTimer.current)
            chatFlashTimer.current = window.setTimeout(() => {
              setState((p) => ({ ...p, chatFlash: false }))
              chatFlashTimer.current = null
            }, 1000)
          }}
          style={devBtn(false)}
        >
          ▶ chat nuevo (+1)
        </button>
        <button
          onClick={() => setState((s) => ({ ...s, chatUnread: 0, chatFlash: false }))}
          style={devBtn(false)}
        >
          ⏹ marcar chat leído
        </button>
      </div>
    </div>
  )
}

function devBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(63,185,80,0.12)' : 'transparent',
    border: '1px solid ' + (active ? '#54E08C' : 'rgba(255,255,255,0.08)'),
    color: active ? '#54E08C' : '#C9D4E6',
    borderRadius: 3,
    padding: '4px 8px',
    fontFamily: 'var(--font-geist-mono), monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    textAlign: 'left' as const,
    textTransform: 'uppercase' as const,
  }
}

/* ────────────────────────────── MARKET SWITCHER ────────────────────────────── */
function MarketSwitcher({ current, onChange }: { current: string; onChange: (code: string) => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const homeName = getCountryName(HOME_MARKET)
  const currentName = getCountryName(current)
  const isHome = current.toLowerCase() === HOME_MARKET

  const matches = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    const hits: { code: string; name: string; continent: string }[] = []
    for (const c of CONTINENTS) {
      for (const co of c.countries) {
        if (co.name.toLowerCase().includes(q) || co.code.toLowerCase().includes(q)) {
          hits.push({ code: co.code, name: co.name, continent: c.label })
        }
      }
    }
    return hits.slice(0, 30)
  }, [query])

  function pick(code: string) {
    onChange(code.toLowerCase())
    setOpen(false)
    setQuery('')
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={t.marketSwitchTitle}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 1,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${isHome ? 'rgba(255,255,255,0.08)' : 'rgba(240,180,41,0.45)'}`,
          borderRadius: 9,
          padding: '5px 12px 6px',
          cursor: 'pointer',
          minWidth: 158,
        }}
      >
        <span
          style={{
            fontSize: '0.58rem',
            color: isHome ? '#6B7686' : '#F0B429',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontWeight: 500,
          }}
        >
          {t.marketLabel}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: isHome ? '#C9D4E6' : '#F0B429',
            fontSize: '0.84rem',
            fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
            fontWeight: 600,
            letterSpacing: '0',
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{flagEmoji(current)}</span>
          {currentName}
          <span style={{ color: '#6B7686', marginLeft: 'auto' }}>▼</span>
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'rgba(13,16,22,0.92)',
            backdropFilter: 'blur(22px) saturate(1.15)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            width: 360,
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 16px 44px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {/* Header / prompt */}
          <div
            style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(185,164,255,0.06), transparent)',
            }}
          >
            <div
              style={{
                fontSize: '0.6rem',
                color: '#B9A4FF',
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-geist-mono), monospace',
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              ◆ {t.marketGlobal.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                color: '#EAEFF6',
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              ¿Con quién quieres hacer negocio hoy?
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#9AA7B8',
                marginTop: 4,
                lineHeight: 1.45,
                fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              Cambia el país y verás el catálogo, los actores y los precios de ese mercado. Operas sin
              fronteras.
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px 6px' }}>
            <input
              className="dk-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${t.marketSearchPlaceholder}  ${t.marketSearchExamples}`}
              autoFocus
            />
          </div>

          {/* Body: search results OR home + grouped list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 6px 10px' }}>
            {matches ? (
              matches.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                    color: '#9AA7B8',
                    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  }}
                >
                  Sin resultados para &ldquo;{query}&rdquo;
                </div>
              ) : (
                matches.map((m) => (
                  <CountryRow
                    key={m.code}
                    code={m.code}
                    name={m.name}
                    sub={m.continent}
                    selected={m.code.toLowerCase() === current.toLowerCase()}
                    onPick={pick}
                  />
                ))
              )
            ) : (
              <>
                {/* Home country */}
                <SectionLabel>★ TU SEDE</SectionLabel>
                <CountryRow
                  code={HOME_MARKET}
                  name={homeName}
                  sub={t.marketHomeSub}
                  selected={isHome}
                  onPick={pick}
                  highlighted
                />

                {/* Continents list */}
                {CONTINENTS.map((c) => (
                  <div key={c.id}>
                    <SectionLabel>{c.label.toUpperCase()}</SectionLabel>
                    {c.countries.slice(0, 12).map((co) => (
                      <CountryRow
                        key={co.code}
                        code={co.code}
                        name={co.name}
                        selected={co.code.toLowerCase() === current.toLowerCase()}
                        onPick={pick}
                      />
                    ))}
                    {c.countries.length > 12 && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#6B7686',
                          padding: '4px 12px 8px',
                          fontStyle: 'italic',
                          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                        }}
                      >
                        + {c.countries.length - 12} más · usa el buscador
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CountryRow({
  code,
  name,
  sub,
  selected,
  onPick,
  highlighted = false,
}: {
  code: string
  name: string
  sub?: string
  selected: boolean
  onPick: (code: string) => void
  highlighted?: boolean
}) {
  return (
    <button
      onClick={() => onPick(code)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        background: selected ? 'rgba(185,164,255,0.12)' : highlighted ? 'rgba(240,180,41,0.05)' : 'transparent',
        border: 'none',
        borderLeft: selected ? '2px solid #B9A4FF' : '2px solid transparent',
        color: selected ? '#F3EFFF' : '#EAEFF6',
        padding: '8px 10px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        borderRadius: 8,
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = highlighted ? 'rgba(240,180,41,0.05)' : 'transparent'
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(code)}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.02em' }}>{name}</div>
        {sub && (
          <div
            style={{
              fontSize: '0.66rem',
              color: '#6B7686',
              fontFamily: 'var(--font-geist-mono), monospace',
              letterSpacing: '0.1em',
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: '0.62rem',
          color: '#6B7686',
          fontFamily: 'var(--font-geist-mono), monospace',
          letterSpacing: '0.16em',
        }}
      >
        {code.toUpperCase()}
      </span>
    </button>
  )
}

/* ────────────────────────────── HEADER ────────────────────────────── */
function WorkspaceHeader({
  sector,
  onSectorChange,
  currentMarket,
  onMarketChange,
  comms,
  activeStage,
  chatOpen,
  onCommsClick,
}: {
  sector: Sector
  onSectorChange: (id: string) => void
  currentMarket: string
  onMarketChange: (code: string) => void
  comms: CommsState
  activeStage: StageKind | null
  chatOpen: boolean
  onCommsClick: (channel: 'chat' | 'call' | 'video' | 'meet') => void
}) {
  const t = useT()
  const [showSectorDropdown, setShowSectorDropdown] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(13,16,22,0.80)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(22px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '0 2rem',
          height: 64,
          maxWidth: 1600,
          margin: '0 auto',
        }}
      >
        {/* Brand */}
        <Link
          href="/sectors"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#EAEFF6',
            letterSpacing: '0.06em',
          }}
        >
          <Hex size={16} color="#B9A4FF" />
          15<span style={{ color: '#B9A4FF' }}>03</span>
        </Link>

        {/* Sector switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSectorDropdown(!showSectorDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#9AA7B8',
              padding: '7px 12px',
              borderRadius: 9,
              fontSize: '0.74rem',
              fontFamily: 'var(--font-geist-mono), monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#B9A4FF' }}>[{sector.short}]</span>
            {sector.label}
            <IconChevron />
          </button>

          {showSectorDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                background: 'rgba(13,16,22,0.92)',
                backdropFilter: 'blur(22px) saturate(1.15)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 12,
                minWidth: 220,
                boxShadow: '0 16px 44px rgba(0,0,0,0.6)',
                overflow: 'hidden',
              }}
            >
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setShowSectorDropdown(false)
                    onSectorChange(s.id)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: s.id === sector.id ? 'rgba(185,164,255,0.12)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: s.id === sector.id ? '#F3EFFF' : '#C9D4E6',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    letterSpacing: '0',
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist-mono), monospace', color: '#6B7686' }}>
                    {s.short}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global search */}
        <div style={{ position: 'relative', maxWidth: 480 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7686' }}>
            <IconSearch />
          </span>
          <input
            className="dk-field"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`${fill(t.searchInSector, { sector: sector.label.toLowerCase() })}  ${t.searchExamples}`}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Right cluster: market, comms, mensajes, profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Market switcher (was: static country chip) */}
          <MarketSwitcher current={currentMarket} onChange={onMarketChange} />

          {/* Comms cluster: chat / call / video / meet con parpadeo verde */}
          <CommsCluster
            state={comms}
            activeStage={activeStage}
            chatOpen={chatOpen}
            onChatClick={() => onCommsClick('chat')}
            onCallClick={() => onCommsClick('call')}
            onVideoClick={() => onCommsClick('video')}
            onMeetClick={() => onCommsClick('meet')}
          />

          {/* Notificaciones */}
          <IconButton title="Notificaciones">
            <IconBell />
          </IconButton>

          {/* Logo de la empresa (subido en /register/[code]) + operador (foto + nombre, editable) */}
          <CompanyLogo />
          <ProfileName />
          <AvatarUploader />
          <ActorIdBadge sector={sector} />
        </div>
      </div>
    </header>
  )
}

/* ────────────────────────────── SIDEBAR ────────────────────────────── */
function WorkspaceSidebar({ tab, onTab, sectorId }: { tab: Tab; onTab: (t: Tab) => void; sectorId?: string }) {
  const t = useT()
  const tabs = getTabs(t, sectorId)
  return (
    <aside
      style={{
        background: 'rgba(13,16,22,0.74)',
        backdropFilter: 'blur(22px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.15)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: '1.4rem 0.7rem',
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: '0.6rem',
          color: '#4A5160',
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-geist-mono), monospace',
          padding: '0 0.75rem',
          marginBottom: '0.7rem',
        }}
      >
        {t.workspaceLabel}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tabs.map((tabItem) => {
          const active = tabItem.id === tab
          return (
            <button key={tabItem.id} className="dk-nav" data-active={active} onClick={() => onTab(tabItem.id)}>
              <span className="dk-nav-ico">{tabItem.icon}</span>
              {tabItem.label}
            </button>
          )
        })}
      </nav>

      <div
        style={{
          marginTop: '1.6rem',
          padding: '0.9rem 0.9rem',
          background: 'rgba(255,255,255,0.024)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          fontSize: '0.7rem',
          color: '#9AA7B8',
          lineHeight: 1.55,
          fontFamily: 'var(--font-geist-sans), sans-serif',
          letterSpacing: '0.01em',
        }}
      >
        <div style={{ color: '#F0B429', marginBottom: 5, letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: '0.6rem', fontFamily: 'var(--font-geist-mono), monospace' }}>
          ◆ {t.dgmLabel}
        </div>
        {t.dgmBody}
      </div>
    </aside>
  )
}

/* Hero con TEXTURA FOTOGRÁFICA REAL (madera CC0 Poly Haven · /public/textures).
   Material real bajo un velo oscuro + tinte de paleta + grano → profundidad
   premium "WanderWheels", on-brand (madera). El texto vive sobre el velo para
   legibilidad AAA. */
function HomeHero({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', marginBottom: '1.9rem', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* textura madera real */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/textures/wood/wood_planks_dirt_diff_2k.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'saturate(0.8) brightness(0.62) contrast(1.05)' }} />
      {/* velo oscuro · degradado para legibilidad a la izquierda */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,10,14,0.95) 0%, rgba(8,10,14,0.86) 44%, rgba(10,12,18,0.58) 100%)' }} />
      {/* tinte de paleta (lila→verde) muy sutil */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 150% at 0% 0%, rgba(185,164,255,0.12), transparent 52%), radial-gradient(120% 140% at 100% 100%, rgba(84,224,140,0.08), transparent 55%)' }} />
      <Grain opacity={0.06} />
      <div style={{ position: 'relative', padding: '30px 32px' }}>
        <span style={{ color: DK.LILAC, fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: 'var(--font-geist-mono), monospace', fontWeight: 500 }}>◆ {eyebrow}</span>
        <h1 style={{ fontFamily: 'var(--font-chakra-petch), sans-serif', fontSize: 'clamp(1.7rem, 3.2vw, 2.5rem)', fontWeight: 700, color: WHITE, margin: '0.5rem 0 0.55rem', letterSpacing: '0.01em', lineHeight: 1.12, textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>{title}</h1>
        <p style={{ color: '#C2CCDA', fontSize: '0.94rem', lineHeight: 1.6, maxWidth: 640, fontFamily: 'var(--font-geist-sans), sans-serif' }}>{body}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────── BUSCADOR VIEW ────────────────────────────── */
function BuscadorView({ sector, onRoleClick }: { sector: Sector; onRoleClick: (groupId: string, roleId: string) => void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const groups = getActorGroups(sector.id)

  return (
    <div>
      <HomeHero
        eyebrow={fill(t.buscadorEyebrow, { sector: sector.label })}
        title={t.buscadorTitle}
        body={t.buscadorBody}
      />

      {/* Big search · cristal calmado */}
      <div
        style={{
          background: 'rgba(13,16,22,0.62)',
          backdropFilter: 'blur(16px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.15)',
          border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: 13,
          padding: '0.55rem 0.55rem 0.55rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          maxWidth: 820,
          marginBottom: '1.9rem',
        }}
      >
        <span style={{ color: '#6B7686', display: 'flex' }}>
          <IconSearch />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.buscadorInputPlaceholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#EAEFF6',
            fontSize: '0.95rem',
            outline: 'none',
            fontFamily: 'var(--font-geist-sans), sans-serif',
          }}
        />
        <PrimaryButton style={{ padding: '10px 20px' }}>{t.buscadorButton}</PrimaryButton>
      </div>

      {/* Overview · pulso del mercado sectorial (gráficas reales · muestra) */}
      <MarketPulse sector={sector} />

      {/* Actor groups graph */}
      <div
        style={{
          fontSize: '0.7rem',
          color: '#6B7686',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-geist-mono), monospace',
          marginBottom: '1rem',
        }}
      >
        ◆ {t.buscadorActorsLabel}
      </div>
      {sectorHasDraft(groups) && (
        <div
          style={{
            fontSize: '0.68rem',
            color: '#F0B429',
            fontFamily: 'var(--font-geist-mono), monospace',
            letterSpacing: '0.04em',
            marginBottom: '1rem',
            opacity: 0.85,
          }}
        >
          {t.taxonomyDraftNote}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {groups.map((g) => (
          <ActorGroupCard key={g.id} group={g} onRoleClick={(rid) => onRoleClick(g.id, rid)} />
        ))}
      </div>
    </div>
  )
}

/* ─ Pulso del mercado · overview con gráficas reales (firma Hynex) ─
   Datos de MUESTRA deterministas por sector (sin Math.random → SSR-safe, sin
   hydration mismatch). Es piel-demostración: cuando llegue la telemetría real
   (Fase posterior) se enchufan las series de verdad. Honestidad: rotulado
   "muestra" para no fingir métricas reales. */
function pulseSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function pulseSeries(seed: number, n: number, base: number, amp: number): number[] {
  const out: number[] = []
  let x = seed || 1
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    const r = x / 0x7fffffff
    out.push(Math.max(0, base + Math.sin(i / 1.6) * amp * 0.45 + r * amp))
  }
  return out
}

function PulseStat({ value, unit, label, color }: { value: string; unit?: string; label: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 8, height: 8, borderRadius: 3, background: color, boxShadow: `0 0 7px ${color}aa`, flexShrink: 0 }} />
        <span style={{ ...DK.NUM, fontSize: '1.55rem', fontWeight: 600, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.72rem', color: DK.MUTE, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '0.74rem', color: DK.TEXT_DIM, marginTop: 6 }}>{label}</div>
    </div>
  )
}

function MarketPulse({ sector }: { sector: Sector }) {
  const seed = pulseSeed(sector.id)
  const ops = pulseSeries(seed, 18, 60, 50)
  const vol = pulseSeries(seed ^ 0x9e3779b9, 18, 90, 70)
  const act = pulseSeries(seed ^ 0x51ed270b, 18, 36, 30) // nuevos actores (violeta)
  const opsNow = Math.round(ops[ops.length - 1]!)
  const volNow = Math.round(vol[vol.length - 1]! * 14)
  const actNow = Math.round(act[act.length - 1]!)
  const dppPct = 62 + (seed % 30)
  // Reparto de pedidos por estado (muestra determinista)
  const enCurso = 8 + (seed % 9)
  const enTransito = 5 + ((seed >> 2) % 7)
  const enEscrow = 4 + ((seed >> 3) % 6)
  const entregado = 18 + ((seed >> 6) % 16)
  return (
    <div style={{ position: 'relative', marginBottom: '2.6rem' }}>
      {/* textura premium · aurora de color detrás del overview */}
      <div style={{ position: 'absolute', inset: '-14px -14px -8px', borderRadius: 22, overflow: 'hidden' }}>
        <Aurora opacity={0.85} />
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
          <Eyebrow>◆ Pulso del mercado</Eyebrow>
          <StatusPill tone="neutral">muestra</StatusPill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: '1rem', alignItems: 'stretch' }}>
          {/* HERO · gráfica grande multi-serie */}
          <Card pad={20} style={{ position: 'relative', overflow: 'hidden' }}>
            <Grain opacity={0.05} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
                  <PulseStat value={opsNow.toLocaleString('es-ES')} label="Operaciones activas" color={DK.GREEN} />
                  <PulseStat value={volNow.toLocaleString('es-ES')} unit="€" label="Liquidado · 30 días" color={DK.GOLD} />
                  <PulseStat value={actNow.toLocaleString('es-ES')} label="Nuevos actores" color={DK.LILAC} />
                </div>
                <span style={{ ...DK.NUM, fontSize: '0.72rem', fontWeight: 600, color: DK.GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>▲ 6,4% · 30d</span>
              </div>
              <div style={{ marginTop: 18 }}>
                <MultiArea
                  height={168}
                  series={[
                    { data: ops, color: DK.GREEN, label: 'Operaciones' },
                    { data: vol, color: DK.GOLD, label: 'Liquidado' },
                    { data: act, color: DK.LILAC, label: 'Nuevos actores' },
                  ]}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <Legend items={[
                  { label: 'Operaciones', color: DK.GREEN },
                  { label: 'Liquidado', color: DK.GOLD },
                  { label: 'Nuevos actores', color: DK.LILAC },
                ]} />
              </div>
            </div>
          </Card>

          {/* Columna derecha · donut degradado + barra segmentada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card pad={18} style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Donut value={dppPct} size={88} color={DK.GREEN} color2={DK.LILAC} sub="DPP 100%" />
                <div>
                  <div style={{ fontSize: '0.84rem', color: WHITE, fontWeight: 550, lineHeight: 1.35 }}>Fichas con<br />DPP completo</div>
                  <div style={{ marginTop: 9 }}><StatusPill tone="ok">gate activo</StatusPill></div>
                </div>
              </div>
            </Card>
            <Card pad={18}>
              <div style={{ fontSize: '0.8rem', color: DK.TEXT_DIM, marginBottom: 14 }}>Pedidos por estado</div>
              <SegmentBar
                segments={[
                  { label: 'En curso', value: enCurso, color: DK.GREEN },
                  { label: 'En tránsito', value: enTransito, color: DK.LILAC },
                  { label: 'En escrow', value: enEscrow, color: DK.GOLD },
                  { label: 'Entregado', value: entregado, color: DK.SLATE },
                ]}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActorGroupCard({ group, onRoleClick }: { group: ActorGroup; onRoleClick: (roleId: string) => void }) {
  // Acordeón: colapsado por defecto para aligerar el escritorio. La cabecera
  // (título + contador) está siempre visible; los roles se despliegan al pulsar.
  const [open, setOpen] = useState(false)
  const lang = useLang()
  const total = group.roles.length
  return (
    <div
      className="dk-card"
      style={{
        background: open ? 'rgba(255,255,255,0.045)' : undefined,
        border: `1px solid ${open ? 'rgba(185,164,255,0.30)' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .2s, box-shadow .2s, transform .2s, background .2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '1.05rem 1.2rem',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Hex size={18} color="#F0B429" />
          <h3
            style={{
              fontFamily: 'var(--font-chakra-petch), sans-serif',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#EAEFF6',
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            {getLabel(group.label, lang)}
          </h3>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span
            style={{
              fontSize: '0.66rem',
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#6B7686',
              letterSpacing: '0.16em',
            }}
          >
            [{group.short}] · {total}
          </span>
          <span
            style={{
              display: 'inline-flex',
              color: open ? '#F0B429' : '#9AA7B8',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s',
            }}
          >
            <IconChevron />
          </span>
        </span>
      </button>
      {open && (
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 1.2rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {group.roles.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onRoleClick(r.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: 'none',
                  color: '#C9D4E6',
                  padding: '7px 0',
                  fontFamily: 'var(--font-chakra-petch), sans-serif',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(30,37,48,0.5)',
                  textAlign: 'left',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0B429')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#C9D4E6')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hex size={9} color="#F0B429" />
                  {getLabel(r.label, lang)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ────────────────────────────── PEDIDOS VIEW ────────────────────────────── */
type OrderState = 'recibido' | 'confirmado' | 'transito' | 'entregado' | 'cerrado'

type MultiSignatureSlot = {
  id: 'comprador' | 'vendedor' | 'transitario'
  label: string
  signer: string
  status: 'signed' | 'pending'
  signedAt?: string
  txHash?: string
}

type Order = {
  id: string
  ref: string
  product: string
  qty: string
  amount: string
  supplier: string
  state: OrderState
  history: { state: OrderState; at: string; via: string }[]
  /** Campos opcionales · presentes cuando el pedido tiene carga física que
      cabe en contenedor. La PRESENCIA de `container_items` activa el panel
      cubicaje 3D en PedidosView · sin importar el sector del Actor.
      Filosofía: el cubicaje es propiedad del pedido (fabricante · distribuidor
      · exportador · transitario lo necesitan por igual) · no del sector. */
  container_type?: ContainerType
  container_items?: ContainerLoadViewItem[]
  container_payload_kg?: number
  container_occupation_label?: string
  container_skus_count?: number
  container_transport_mode?: string
  multi_signature?: MultiSignatureSlot[]
}

const ORDER_STATES: { id: OrderState; label: string; sub: string }[] = [
  { id: 'recibido', label: 'Recibido', sub: 'ERP del proveedor' },
  { id: 'confirmado', label: 'Confirmado', sub: 'En preparación' },
  { id: 'transito', label: 'En tránsito', sub: 'Albarán emitido' },
  { id: 'entregado', label: 'Entregado', sub: 'Confirmación' },
  { id: 'cerrado', label: 'Cerrado', sub: 'Pago liberado' },
]

/* ──────────────────────────── MOCK ORDERS POR SECTOR ─────────────────────
   Datos de demo R0. Cuando las migraciones 028-031 lleguen a Supabase y
   `products` / `orders` se llenen vía workflows reales, este bloque se
   reemplaza por una consulta a Supabase con join a `dpp_registry`. Filosofía
   Audit-Ready by Design · interfaces extensibles (cambio = datos, no código).

   REGLA CANÓNICA: el cubicaje 3D NO es propiedad del sector transporte.
   El fabricante, distribuidor o exportador de CUALQUIER sector con carga
   física necesita ver cómo se carga el contenedor antes de firmar. Por eso
   `container_items` está en `Order`, no en `Sector`. Sectores de servicios
   puros (legal · financiero · educacion · turismo · cultura · institucional)
   tienen Order sin `container_items` · el panel cubicaje no se renderiza.   */

/** Multifirma típica 3-de-3 cuando hay carga física y comercio internacional. */
const STANDARD_MULTISIG_PENDING_TRANSITARIO: MultiSignatureSlot[] = [
  { id: 'comprador',  label: 'Comprador',   signer: 'Industrias Norte, S.A.',      status: 'signed', signedAt: 'Hoy · 09:10', txHash: '0x8e42…71ad' },
  { id: 'vendedor',   label: 'Vendedor',    signer: 'Maquinaria Sur Export, S.L.', status: 'signed', signedAt: 'Hoy · 11:48', txHash: '0xa1f7…9c20' },
  { id: 'transitario', label: 'Transitario', signer: 'MSC Iberia · Naviera',       status: 'pending' },
]

const STANDARD_MULTISIG_PENDING_VENDEDOR: MultiSignatureSlot[] = [
  { id: 'comprador',  label: 'Comprador',   signer: 'Reformas y Construcciones Levante, S.L.', status: 'signed', signedAt: 'Hoy · 08:55', txHash: '0xd1e0…3402' },
  { id: 'vendedor',   label: 'Vendedor',    signer: 'Cementos Atlántico, S.A.',                status: 'pending' },
  { id: 'transitario', label: 'Transitario', signer: 'Transportes Iberia Sur',                status: 'pending' },
]

/** Catálogo de pedidos por sector. Cada sector con carga física trae al menos
    un Order con `container_items` para que el panel cubicaje 3D se vea. Los
    sectores de servicios puros mantienen pedidos sin `container_items` · el
    panel no se renderiza para ellos. */
const MOCK_ORDERS_BY_SECTOR: Record<string, Order[]> = {
  /* ── TRANSPORTE ──────────────────────────────────────────────────────── */
  transporte: [
    {
      id: 't1',
      ref: 'PM-TRA-2026-0042',
      product: 'Carga FCL 40HC · Valencia → Hamburgo',
      qty: '12 paletas · 18.450 kg',
      amount: '18.500,00 €',
      supplier: 'MSC Iberia · Naviera',
      state: 'transito',
      history: [
        { state: 'recibido', at: 'Hoy · 08:30', via: 'API transitario · INTTRA' },
        { state: 'confirmado', at: 'Hoy · 09:14', via: 'Booking BL-MSC-2026-9482' },
        { state: 'transito', at: 'Hoy · 14:55', via: 'Estiba terminal MSC Valencia' },
      ],
      container_type: '40HC',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 18450,
      container_skus_count: 3,
      container_occupation_label: '~65% · espacios sobrantes',
      container_items: [
        { id: 'PAL-EUR-A',  name: 'Paleta EUR · acabados',          length_mm: 1200, width_mm: 800,  height_mm: 1500, weight_kg: 540,  quantity: 6, color_hex: '#3b82f6' },
        { id: 'CAJA-IND',   name: 'Caja industrial 1500×1000',      length_mm: 1500, width_mm: 1000, height_mm: 1200, weight_kg: 820,  quantity: 4, color_hex: '#22c55e' },
        { id: 'CUNA-OE',    name: 'Cuña OE · equipo pesado',        length_mm: 2000, width_mm: 1200, height_mm: 1500, weight_kg: 1450, quantity: 2, color_hex: '#f97316' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 't2',
      ref: 'PM-TRA-2026-0041',
      product: 'Grupaje LCL · Madrid → Casablanca',
      qty: '6 m³ · 1.240 kg',
      amount: '4.350,00 €',
      supplier: 'Transitario Atlántico, S.L.',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 07:12', via: 'Webhook ERP · Odoo' },
        { state: 'confirmado', at: 'Hoy · 11:02', via: 'Consolidación CFR pendiente' },
      ],
    },
    {
      id: 't3',
      ref: 'PM-TRA-2026-0040',
      product: 'Carga ferroviaria · Bilbao → Lyon',
      qty: '15.000 kg · vagón cerrado',
      amount: '9.800,00 €',
      supplier: 'Renfe Mercancías',
      state: 'entregado',
      history: [
        { state: 'recibido', at: 'Ayer · 09:00', via: 'CIM Rail · contrato F-220' },
        { state: 'confirmado', at: 'Ayer · 10:14', via: 'Asignación vagón 84-7752' },
        { state: 'transito', at: 'Ayer · 22:30', via: 'Salida Abando' },
        { state: 'entregado', at: 'Hoy · 13:48', via: 'Recepción Lyon-Guillotière' },
      ],
    },
    {
      id: 't4',
      ref: 'PM-TRA-2026-0039',
      product: 'Multimodal mar + carretera · Valencia → Tánger',
      qty: '32.000 kg · 2 contenedores 40HC',
      amount: '22.100,00 €',
      supplier: 'BergéLogistics · 4PL',
      state: 'cerrado',
      history: [
        { state: 'recibido', at: '21 may · 16:00', via: 'API 4PL · Bergé' },
        { state: 'confirmado', at: '21 may · 18:42', via: 'Booking + dossier aduana' },
        { state: 'transito', at: '23 may · 06:15', via: 'Embarque Valencia → Tanger Med' },
        { state: 'entregado', at: '25 may · 18:21', via: 'Última milla en destino' },
        { state: 'cerrado', at: '25 may · 18:22', via: 'Pago liberado contra entrega' },
      ],
    },
  ],

  /* ── INMOBILIARIO ────────────────────────────────────────────────────── */
  inmobiliario: [
    {
      id: 'im1',
      ref: 'PM-INM-2026-0142',
      product: 'Cemento Portland CEM II 42,5 R · Pedido obra Marsella',
      qty: '32 paletas · 19.200 kg',
      amount: '11.840,00 €',
      supplier: 'Cementos Atlántico, S.A.',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 09:12', via: 'Webhook ERP · Holded' },
        { state: 'confirmado', at: 'Hoy · 09:42', via: 'ERP confirma stock' },
      ],
      container_type: '20ST',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 19200,
      container_skus_count: 1,
      container_occupation_label: '~88% · carga homogénea',
      container_items: [
        { id: 'PAL-CEM',  name: 'Paleta cemento 1200×800', length_mm: 1200, width_mm: 800, height_mm: 1100, weight_kg: 600, quantity: 32, color_hex: '#94a3b8' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_VENDEDOR,
    },
    {
      id: 'im2',
      ref: 'PM-INM-2026-0141',
      product: 'Puertas blindadas Premium · Roble (lote constructora)',
      qty: '40 unidades',
      amount: '23.800,00 €',
      supplier: 'Puertas García, S.L.',
      state: 'transito',
      history: [
        { state: 'recibido', at: 'Ayer · 14:18', via: 'Webhook ERP · Odoo' },
        { state: 'confirmado', at: 'Ayer · 14:32', via: 'Reserva en stock' },
        { state: 'transito', at: 'Ayer · 18:05', via: 'Albarán A-2026-7712' },
      ],
      container_type: '40HC',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 8400,
      container_skus_count: 2,
      container_occupation_label: '~55% · queda hueco para complementos',
      container_items: [
        { id: 'CJ-PB',  name: 'Caja puerta blindada',  length_mm: 2150, width_mm: 1000, height_mm: 150, weight_kg: 180, quantity: 40, color_hex: '#a16207' },
        { id: 'PAL-HER', name: 'Paleta herrajes/cerraduras', length_mm: 1200, width_mm: 800, height_mm: 1100, weight_kg: 600, quantity: 2, color_hex: '#737373' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 'im3',
      ref: 'PM-INM-2026-0140',
      product: 'Cocina modular Linea 90',
      qty: '1 conjunto',
      amount: '8.940,00 €',
      supplier: 'Cocinas Iberia',
      state: 'cerrado',
      history: [
        { state: 'recibido', at: '4 mar · 10:00', via: 'Webhook ERP · SAP' },
        { state: 'confirmado', at: '4 mar · 10:18', via: 'Producción asignada' },
        { state: 'transito', at: '11 mar · 09:15', via: 'Albarán A-2026-2210' },
        { state: 'entregado', at: '12 mar · 16:42', via: 'Albarán firmado' },
        { state: 'cerrado', at: '12 mar · 16:43', via: 'Pago liberado contra entrega' },
      ],
    },
  ],

  /* ── METALÚRGICO ─────────────────────────────────────────────────────── */
  metalurgico: [
    {
      id: 'me1',
      ref: 'PM-MET-2026-0078',
      product: 'Perfiles IPE 240 acero S275JR · estructura naval',
      qty: '22 toneladas',
      amount: '24.420,00 €',
      supplier: 'Acerías del Norte',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 10:42', via: 'Webhook ERP · SAP' },
        { state: 'confirmado', at: 'Hoy · 11:18', via: 'Reserva colada + certif. EN 10204 3.1' },
      ],
      container_type: '40HC',
      container_transport_mode: 'Marítimo FCL · carga larga',
      container_payload_kg: 22000,
      container_skus_count: 1,
      container_occupation_label: 'Perfiles 11.8m · slot longitudinal',
      container_items: [
        { id: 'PERF-IPE', name: 'Haz perfiles IPE 240 · 11.8m', length_mm: 11800, width_mm: 240, height_mm: 240, weight_kg: 650, quantity: 33, color_hex: '#475569' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 'me2',
      ref: 'PM-MET-2026-0077',
      product: 'Chapa inoxidable AISI 316L 2mm · industria alimentaria',
      qty: '14.500 kg',
      amount: '32.190,00 €',
      supplier: 'Inox Ibérica, S.A.',
      state: 'transito',
      history: [
        { state: 'recibido', at: 'Ayer · 09:00', via: 'API distribuidor' },
        { state: 'confirmado', at: 'Ayer · 12:30', via: 'Stock asignado lote L-77129' },
        { state: 'transito', at: 'Hoy · 06:45', via: 'Salida Bilbao destino Génova' },
      ],
      container_type: '20ST',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 14500,
      container_skus_count: 1,
      container_occupation_label: '~68% peso máx · carga pesada',
      container_items: [
        { id: 'CHA-INOX', name: 'Paleta chapa inox 1250×2500', length_mm: 2500, width_mm: 1250, height_mm: 200, weight_kg: 580, quantity: 25, color_hex: '#94a3b8' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
  ],

  /* ── TEXTIL ──────────────────────────────────────────────────────────── */
  textil: [
    {
      id: 'tx1',
      ref: 'PM-TXT-2026-0033',
      product: 'Tejido denim 12oz crudo · 8.400 m lineales',
      qty: '42 rollos',
      amount: '15.330,00 €',
      supplier: 'Tejidos Albacete, S.A.',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 11:50', via: 'API EDI · GS1' },
        { state: 'confirmado', at: 'Hoy · 12:30', via: 'OEKO-TEX cert. en orden' },
      ],
      container_type: '40HC',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 9240,
      container_skus_count: 1,
      container_occupation_label: '~70% · acepta consolidar accesorios',
      container_items: [
        { id: 'ROL-DEN', name: 'Rollo denim 12oz · 200 m', length_mm: 1700, width_mm: 500, height_mm: 500, weight_kg: 220, quantity: 42, color_hex: '#2563eb' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 'tx2',
      ref: 'PM-TXT-2026-0032',
      product: 'Hilado algodón Ne 30/1 · lote textil hogar',
      qty: '5.600 kg',
      amount: '21.840,00 €',
      supplier: 'Hilatura Mediterránea',
      state: 'transito',
      history: [
        { state: 'recibido', at: '24 may · 09:00', via: 'API distribuidor' },
        { state: 'confirmado', at: '24 may · 11:00', via: 'BCI verificado' },
        { state: 'transito', at: 'Hoy · 07:20', via: 'Salida Alicante destino Estambul' },
      ],
    },
  ],

  /* ── AGROALIMENTARIO ─────────────────────────────────────────────────── */
  agroalimentario: [
    {
      id: 'ag1',
      ref: 'PM-AGR-2026-0204',
      product: 'Aceite oliva virgen extra ECO · campaña 2026',
      qty: '14.400 botellas 500 ml',
      amount: '78.480,00 €',
      supplier: 'Oleos del Sur · DOP Sierra Mágina',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 08:42', via: 'API distribuidor exportación' },
        { state: 'confirmado', at: 'Hoy · 10:05', via: 'Lote L-AOVE-2026-08 reservado' },
      ],
      container_type: '20RF',
      container_transport_mode: 'Marítimo reefer (cadena de frío)',
      container_payload_kg: 14760,
      container_skus_count: 1,
      container_occupation_label: '~82% · pile-up estable',
      container_items: [
        { id: 'CJ-AOVE', name: 'Caja 12 botellas 500ml', length_mm: 320, width_mm: 240, height_mm: 250, weight_kg: 8.2, quantity: 1200, color_hex: '#65a30d' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 'ag2',
      ref: 'PM-AGR-2026-0203',
      product: 'Jamón ibérico bellota 50% · vacío para HORECA Asia',
      qty: '420 kg · 60 piezas',
      amount: '38.400,00 €',
      supplier: 'Ibéricos Salamanca, S.L.',
      state: 'transito',
      history: [
        { state: 'recibido', at: 'Ayer · 18:00', via: 'API HORECA Singapur' },
        { state: 'confirmado', at: 'Hoy · 08:40', via: 'Lote sellado · vacío' },
        { state: 'transito', at: 'Hoy · 12:14', via: 'Aéreo SAS · MAD → SIN' },
      ],
    },
  ],

  /* ── AUTOMOCIÓN ──────────────────────────────────────────────────────── */
  automocion: [
    {
      id: 'au1',
      ref: 'PM-AUT-2026-0091',
      product: 'Recambios OEM frenos · Disco + pastilla (12 referencias)',
      qty: '480 conjuntos',
      amount: '54.720,00 €',
      supplier: 'Componentes Industriales del Sur',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 09:00', via: 'EDI VDA 4905' },
        { state: 'confirmado', at: 'Hoy · 09:45', via: 'IATF 16949 trazabilidad OK' },
      ],
      container_type: '40HC',
      container_transport_mode: 'Marítimo FCL',
      container_payload_kg: 11280,
      container_skus_count: 2,
      container_occupation_label: '~58% · slots de seguridad para palé alto',
      container_items: [
        { id: 'CJ-DISC',  name: 'Caja discos freno (12u)',     length_mm: 600, width_mm: 600, height_mm: 350, weight_kg: 36, quantity: 240, color_hex: '#1f2937' },
        { id: 'CJ-PAST',  name: 'Caja pastillas freno (24u)',  length_mm: 400, width_mm: 400, height_mm: 250, weight_kg: 11, quantity: 240, color_hex: '#dc2626' },
      ],
      multi_signature: STANDARD_MULTISIG_PENDING_TRANSITARIO,
    },
    {
      id: 'au2',
      ref: 'PM-AUT-2026-0090',
      product: 'Neumáticos all-season 225/45 R17 · gestor de flota',
      qty: '320 unidades',
      amount: '28.800,00 €',
      supplier: 'Distribuidor Neumáticos Levante',
      state: 'entregado',
      history: [
        { state: 'recibido', at: '22 may · 11:30', via: 'API distribuidor' },
        { state: 'confirmado', at: '22 may · 12:00', via: 'Stock distribuidor' },
        { state: 'transito', at: '23 may · 18:00', via: 'Reparto camión nacional' },
        { state: 'entregado', at: '25 may · 09:48', via: 'Albarán + firma flota' },
      ],
    },
  ],

  /* ── SECTORES DE SERVICIOS (sin carga física · sin cubicaje) ─────────── */
  legal: [
    {
      id: 'lg1',
      ref: 'PM-LEG-2026-0058',
      product: 'Constitución SL + pactos de socios · startup tech',
      qty: '1 expediente',
      amount: '2.450,00 €',
      supplier: 'Despacho Mercantil Madrid',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 10:14', via: 'Webhook 1503 legal' },
        { state: 'confirmado', at: 'Hoy · 11:02', via: 'Abogada asignada · presupuesto cerrado' },
      ],
    },
    {
      id: 'lg2',
      ref: 'PM-LEG-2026-0057',
      product: 'Modelo 200 IS · cierre fiscal anual',
      qty: '1 informe',
      amount: '780,00 €',
      supplier: 'Asesoría Fiscal del Norte',
      state: 'cerrado',
      history: [
        { state: 'recibido', at: '12 may · 09:00', via: 'Solicitud cliente' },
        { state: 'confirmado', at: '12 may · 09:30', via: 'Documentación recibida' },
        { state: 'entregado', at: '23 may · 18:22', via: 'Modelo presentado AEAT' },
        { state: 'cerrado', at: '23 may · 18:23', via: 'Pago liberado contra entrega' },
      ],
    },
  ],

  financiero: [
    {
      id: 'fi1',
      ref: 'PM-FIN-2026-0019',
      product: 'Línea de crédito 250k € · revolving 12 meses',
      qty: '1 contrato',
      amount: '7.500,00 €',
      supplier: 'Banco Comercial Mediterráneo',
      state: 'confirmado',
      history: [
        { state: 'recibido', at: 'Hoy · 09:00', via: 'API banca' },
        { state: 'confirmado', at: 'Hoy · 12:15', via: 'Rating asignado · pendiente firma' },
      ],
    },
  ],
}

/** Fallback genérico si el sector no tiene entrada en `MOCK_ORDERS_BY_SECTOR`.
    Pedidos sin cubicaje · razonables para servicios. */
const FALLBACK_ORDERS: Order[] = [
  {
    id: 'fb1',
    ref: 'PM-DEMO-2026-0001',
    product: 'Operación tipo de tu sector',
    qty: '1 servicio',
    amount: '—',
    supplier: 'Proveedor demo',
    state: 'recibido',
    history: [{ state: 'recibido', at: 'Hace 14 min', via: 'Demo · sin datos sectoriales' }],
  },
]

function getMockOrdersForSector(sectorId: string): Order[] {
  return MOCK_ORDERS_BY_SECTOR[sectorId] ?? FALLBACK_ORDERS
}

/** Documentos pendientes mock para la checklist del tab Archivos. Refleja
    qué pediría la Edge Function `check-document-expirations` cuando las
    migraciones 028-031 estén aplicadas y haya datos reales. Mantenemos
    enfoque transporte para R0 · al expandir generamos uno por sector. */
const TRANSPORT_MISSING_DOCS: MissingDocumentsApiResponse = {
  ok: true,
  total_required: 5,
  total_missing: 2,
  blocked_operations: ['transport', 'escrow_release'],
  lang_used: 'es',
  valid_documents: [
    { requirement_id: 'lic-transitario', expires_at: '2027-03-12' },
    { requirement_id: 'seguro-rc',       expires_at: '2026-12-31' },
    { requirement_id: 'cert-iso-9001',   expires_at: '2027-06-30' },
  ],
  missing_documents: [
    {
      requirement_id: 'autorizacion-oea',
      document_type: 'customs_authorization',
      label: 'Autorización OEA (Operador Económico Autorizado)',
      description: 'Autorización aduanera UE que da estatus de operador fiable y agiliza despachos. Requerida para operar tráfico extra-UE con descuento de garantías.',
      issuer_authority: 'AEAT · Aduanas e Impuestos Especiales',
      issuer_authority_url: 'https://sede.agenciatributaria.gob.es/',
      severity: 'critical',
      legal_basis: 'Reglamento (UE) 952/2013 · Código Aduanero Unión Art. 38',
    },
    {
      requirement_id: 'cert-iata-dgr',
      document_type: 'training_certificate',
      label: 'Certificado IATA-DGR carga aérea peligrosa',
      description: 'Habilitación del personal para manipular mercancías peligrosas en transporte aéreo. Renovación bienal.',
      issuer_authority: 'Centro formación IATA acreditado',
      issuer_authority_url: 'https://www.iata.org/dgr',
      severity: 'error',
      legal_basis: 'IATA Dangerous Goods Regulations 65.ª ed. · Anexo 18 OACI',
    },
  ],
  expiring_soon_documents: [
    {
      requirement_id: 'permiso-adr',
      document_type: 'transport_permit',
      label: 'Permiso ADR transporte mercancías peligrosas por carretera',
      description: 'Caduca en 18 días. Inicia renovación con tu Jefatura provincial de Tráfico.',
      issuer_authority: 'DGT · Dirección General de Tráfico',
      issuer_authority_url: 'https://sede.dgt.gob.es/',
      severity: 'warning',
      legal_basis: 'Acuerdo ADR 2025 · Real Decreto 97/2014',
    },
  ],
  expired_documents: [],
}

function orderHasCubicaje(order: Order | undefined): boolean {
  return !!order && !!order.container_items && order.container_items.length > 0
}

function PedidosView({ sector }: { sector: Sector }) {
  const t = useT()
  const orders = useMemo(() => getMockOrdersForSector(sector.id), [sector.id])
  // Hay al menos un pedido del sector con cubicaje? Si no, ni siquiera
  // activamos el modo seleccionable de filas. Coherente con la regla
  // canónica: cubicaje es propiedad del pedido, no del sector.
  const anyOrderHasCubicaje = useMemo(() => orders.some(orderHasCubicaje), [orders])

  // Por defecto seleccionamos el primer pedido con cubicaje · cae al primero
  // si ninguno trae carga física (caso servicios: no se renderiza el panel).
  const initialId = useMemo(
    () => orders.find(orderHasCubicaje)?.id ?? orders[0]?.id ?? '',
    [orders],
  )
  const [selectedId, setSelectedId] = useState<string>(initialId)

  // Resync si el usuario cambia de sector mientras está en este tab.
  // Intencional: realineamos el estado seleccionado cuando cambia el conjunto de
  // pedidos (cambio de sector). Patrón de "ajustar estado al cambiar una prop".
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(initialId)
  }, [initialId])

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? orders[0]
  const showCubicaje = orderHasCubicaje(selectedOrder)

  return (
    <div>
      <SectionHeader
        eyebrow={t.pedidosEyebrow}
        title={t.pedidosTitle}
        body={t.pedidosBody}
      />

      {showCubicaje && selectedOrder && (
        <PedidoCubicajePanel order={selectedOrder} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map((o) => (
          <OrderRow
            key={o.id}
            order={o}
            selectable={anyOrderHasCubicaje && orderHasCubicaje(o)}
            selected={o.id === selectedId}
            onSelect={() => setSelectedId(o.id)}
          />
        ))}
      </div>
    </div>
  )
}

/** NumberTicker · número animado spring · estilo Bloomberg terminal. */
function NumberTicker({
  value,
  format = (n) => n.toLocaleString('es-ES'),
  duration = 1.2,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
}) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (current) => format(Math.round(current)))

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  return <motion.span>{display}</motion.span>
}

/** LiveIndicator · pulse verde "vivo" + label · paleta v3. */
function LiveIndicator({ label = 'LIVE' }: { label?: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: DK.GREEN,
          boxShadow: `0 0 8px ${DK.GREEN}`,
        }}
      />
      <span
        style={{
          fontSize: '0.6rem',
          fontFamily: DK.FONT_MONO,
          letterSpacing: '0.2em',
          color: DK.GREEN,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** Panel Bloomberg-style del pedido seleccionado · bento grid 4 columnas.
    Layout:
      - Card hero (col-span 2): cubicaje 3D · 420px alto
      - 4 KPI cards laterales (col 3-4): ocupación · peso · multifirma · pago
    Estética industrial densa · KPIs con number ticker · indicadores LIVE. */
// Paleta de respaldo para líneas sin color declarado (coherente con la del cubicaje).
const LINE_HUES = ['#3FCFC4', '#F0B429', '#7EE0A0', '#9D8CFF', '#FF9F6E', '#5FB0FF', '#FF7EA8', '#C0CC4A']

// ── Modos de transporte ────────────────────────────────────────────────
// No todo va en contenedor marítimo. El cubicaje 3D solo aplica al marítimo;
// el aéreo es AWB documental (no clasificamos DGR · responde el transitario).
type TransportMode = 'maritimo' | 'terrestre' | 'ferrocarril' | 'aereo'

const TRANSPORT_MODES: { id: TransportMode; label: string; icon: React.ReactNode }[] = [
  { id: 'maritimo', label: 'Marítimo', icon: <IconShip size={17} /> },
  { id: 'terrestre', label: 'Terrestre', icon: <IconTruck size={17} /> },
  { id: 'ferrocarril', label: 'Ferrocarril', icon: <IconTrain size={17} /> },
  { id: 'aereo', label: 'Aéreo', icon: <IconPlane size={17} /> },
]

type CarrierOffer = { carrier: string; service: string; eta: string; basis: string }

const TRANSPORT_CONFIG: Record<Exclude<TransportMode, 'maritimo'>, {
  title: string; unit: string; route: string; note: string; offers: CarrierOffer[]
}> = {
  terrestre: {
    title: 'Transporte terrestre · camión',
    unit: 'Carga paletizada · FTL / grupaje LTL',
    route: 'Valencia → Marsella · 1.040 km',
    note: 'Se cobra por carga completa (FTL) o por metro lineal/peso en grupaje (LTL).',
    offers: [
      { carrier: 'Transportes Iberia Sur', service: 'FTL · lona', eta: '2 días', basis: 'camión completo' },
      { carrier: 'DB Schenker', service: 'Grupaje LTL', eta: '3-4 días', basis: 'metro lineal' },
    ],
  },
  ferrocarril: {
    title: 'Transporte ferroviario · intermodal',
    unit: 'Vagón / unidad intermodal',
    route: 'Valencia → Marsella · corredor mediterráneo',
    note: 'Intermodal: primera/última milla por camión + tramo principal en tren.',
    offers: [
      { carrier: 'Renfe Mercancías', service: 'Intermodal', eta: '3 días', basis: 'vagón' },
      { carrier: 'Combistar Rail', service: 'Bloque dedicado', eta: '2-3 días', basis: 'tonelada' },
    ],
  },
  aereo: {
    title: 'Transporte aéreo · AWB',
    unit: 'Peso facturable (real vs volumétrico)',
    route: 'Valencia (VLC) → Marsella (MRS)',
    note: 'AWB documental. La clasificación de mercancía peligrosa (IATA-DGR) la asume el transitario certificado — 1503 no la clasifica.',
    offers: [
      { carrier: 'IAG Cargo', service: 'AWB express', eta: '1 día', basis: 'peso facturable' },
      { carrier: 'DHL Aviation', service: 'Consolidado', eta: '1-2 días', basis: 'peso facturable' },
    ],
  },
}

function TransportModeSelector({ mode, onChange }: { mode: TransportMode; onChange: (m: TransportMode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {TRANSPORT_MODES.map((m) => {
        const active = m.id === mode
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 6px', borderRadius: 9, cursor: 'pointer',
              fontFamily: DK.FONT, fontSize: '0.74rem', fontWeight: 600,
              letterSpacing: '0', transition: 'all .16s',
              background: active ? 'rgba(185,164,255,0.12)' : 'rgba(255,255,255,0.035)',
              border: `1px solid ${active ? 'rgba(185,164,255,0.4)' : DK.HAIR}`,
              color: active ? '#F3EFFF' : DK.TEXT_DIM,
            }}
          >
            <span style={{ display: 'flex', opacity: active ? 1 : 0.6 }}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TransportSearch({ mode, lines }: { mode: Exclude<TransportMode, 'maritimo'>; lines: OrderLine[] }) {
  const cfg = TRANSPORT_CONFIG[mode]
  const totalKg = lines.reduce((s, l) => s + l.qty * l.box.kg, 0)
  const totalCm3 = lines.reduce((s, l) => s + l.qty * l.box.L * l.box.W * l.box.H, 0)
  const totalM3 = totalCm3 / 1_000_000
  // Peso volumétrico aéreo (IATA estándar 1:6000 cm³/kg).
  const volKg = totalCm3 / 6000
  const chargeableKg = Math.max(totalKg, volKg)

  return (
    <div>
      <div style={{ fontSize: '1rem', fontWeight: 650, color: WHITE, marginBottom: 2, letterSpacing: '-0.01em' }}>
        {cfg.title}
      </div>
      <div style={{ fontSize: '0.74rem', color: DK.TEXT_DIM, marginBottom: 14 }}>{cfg.unit}</div>

      {/* Ruta + métricas de la carga (de las líneas del pedido) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <TPill label="Ruta" value={cfg.route} />
        <TPill label="Peso" value={`${totalKg.toLocaleString('es-ES')} kg`} />
        <TPill label="Volumen" value={`${totalM3.toLocaleString('es-ES', { maximumFractionDigits: 2 })} m³`} />
        {mode === 'aereo' && (
          <TPill label="Peso facturable" value={`${Math.round(chargeableKg).toLocaleString('es-ES')} kg`} gold />
        )}
      </div>

      {/* Ofertas de transportistas (match por modo + ruta) */}
      <div style={{ fontFamily: DK.FONT_MONO, fontSize: '0.6rem', color: DK.MUTE, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 9 }}>
        Transportistas en esta ruta
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {cfg.offers.map((o) => (
          <div key={o.carrier} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            padding: '11px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.035)', border: `1px solid ${DK.HAIR}`,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.84rem', color: DK.TEXT, fontWeight: 600 }}>{o.carrier}</div>
              <div style={{ fontFamily: DK.FONT_MONO, fontSize: '0.64rem', color: DK.TEXT_DIM, marginTop: 2 }}>
                {o.service} · {o.basis}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: DK.FONT_MONO, fontSize: '0.6rem', color: DK.MUTE, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ETA</div>
              <div style={{ ...DK.NUM, fontSize: '0.84rem', color: DK.GREEN, fontWeight: 650 }}>{o.eta}</div>
            </div>
          </div>
        ))}
      </div>

      <PrimaryButton full style={{ marginBottom: 12 }}>Buscar transportistas · solicitar oferta</PrimaryButton>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.68rem', color: DK.TEXT_DIM, lineHeight: 1.45 }}>
        <span style={{ color: DK.GOLD, flexShrink: 0, display: 'flex', marginTop: 1 }}><IconInfo size={13} /></span>
        <span>{cfg.note}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: '0.58rem', color: DK.MUTE, fontFamily: DK.FONT_MONO, letterSpacing: '0.06em' }}>
        ofertas de muestra · matching real con transitarios certificados · subject_to_expert
      </div>
    </div>
  )
}

function TPill({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{
      padding: '8px 13px', borderRadius: 9,
      background: gold ? 'rgba(240,180,41,0.08)' : 'rgba(255,255,255,0.035)',
      border: `1px solid ${gold ? 'rgba(240,180,41,0.3)' : DK.HAIR}`,
    }}>
      <div style={{ fontFamily: DK.FONT_MONO, fontSize: '0.56rem', color: DK.MUTE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ ...DK.NUM, fontSize: '0.8rem', color: gold ? DK.GOLD : DK.TEXT, fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  )
}

function PedidoCubicajePanel({ order }: { order: Order }) {
  const items = order.container_items ?? []
  const containerType = order.container_type ?? '40HC'
  const multisig = order.multi_signature ?? []
  const signed = multisig.filter((s) => s.status === 'signed').length
  const total = multisig.length

  // El cubicaje NACE de las líneas del pedido: cada artículo añadido es una
  // línea con su dimensión física real (mm→cm) y peso. Esto alimenta el
  // contenedor isométrico real (ContainerLoad) — no una escena decorativa.
  const lines: OrderLine[] = items.map((it, i) => ({
    id: it.id,
    name: it.name,
    cat: '',
    qty: it.quantity,
    unidad: 'ud',
    precio: 0,
    peso: `${it.weight_kg} kg`,
    dim: `${it.length_mm}×${it.width_mm}×${it.height_mm} mm`,
    hue: it.color_hex ?? LINE_HUES[i % LINE_HUES.length],
    box: { L: it.length_mm / 10, W: it.width_mm / 10, H: it.height_mm / 10, kg: it.weight_kg },
  }))

  // Importe numérico del order (eliminar separadores + €) para el ticker.
  const amountNumber = useMemo(() => {
    const cleaned = order.amount.replace(/[^\d,]/g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return isNaN(n) ? 0 : n
  }, [order.amount])

  // Métricas de cubicaje REAL del pedido · nacen de las líneas (no decorativas).
  // Contenedor 40'HC interior útil ≈ 76,07 m³ · payload ≈ 28.200 kg (ADR 0019).
  const cubeCm3 = lines.reduce((s, l) => s + l.qty * l.box.L * l.box.W * l.box.H, 0)
  const cube = {
    m3: cubeCm3 / 1_000_000,
    kg: lines.reduce((s, l) => s + l.qty * l.box.kg, 0),
    occ: Math.min(100, Math.round((cubeCm3 / 1_000_000 / 76.07) * 100)),
    skus: lines.length,
  }

  // Modo de transporte del pedido. No todo va en contenedor marítimo: el
  // comprador/vendedor puede NO cargar a contenedor y buscar transporte
  // terrestre, ferroviario o aéreo (boceto José 2026-05-30). El cubicaje 3D
  // solo aplica al contenedor marítimo; el aéreo es AWB documental.
  const [transportMode, setTransportMode] = useState<TransportMode>('maritimo')

  // Pestañas internas del pedido · una vista limpia cada vez (decisión José
  // 2026-05-30: "todo confuso para inspeccionar la compra"). Compra = el
  // documento A4 del pedido · Transporte = carga/cubicaje · Pago = escrow/
  // multifirma/custodia · Documentos = la carpeta con todos los documentos.
  const [panelTab, setPanelTab] = useState<'compra' | 'transporte' | 'pago' | 'docs'>('compra')
  const PANEL_TABS: { id: typeof panelTab; label: string }[] = [
    { id: 'compra', label: 'Compra' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'pago', label: 'Pago & Custodia' },
    { id: 'docs', label: 'Documentos' },
  ]

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Header pedido · barra de cristal esmerilado (kit calmado) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="dk-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          padding: '0.95rem 1.3rem',
          marginBottom: '0.75rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flexWrap: 'wrap' }}>
          <LiveIndicator label="PEDIDO ACTIVO" />
          <div
            style={{
              fontFamily: DK.FONT_MONO,
              fontSize: '0.74rem',
              color: DK.LILAC,
              letterSpacing: '0.08em',
            }}
          >
            {order.ref}
          </div>
          <div
            style={{
              fontSize: '0.92rem',
              color: WHITE,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {order.product}
          </div>
          <StatusPill tone={order.state === 'cerrado' ? 'ok' : order.state === 'entregado' ? 'info' : 'pending'}>
            {ORDER_STATES.find((s) => s.id === order.state)?.label ?? order.state}
          </StatusPill>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: DK.FONT_MONO,
              fontSize: '0.6rem',
              color: DK.MUTE,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Importe · pago garantizado
          </div>
          <div
            style={{
              ...DK.NUM,
              fontSize: '1.35rem',
              fontWeight: 650,
              color: DK.GOLD,
              letterSpacing: '-0.01em',
              marginTop: 3,
            }}
          >
            <NumberTicker
              value={amountNumber}
              format={(n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            />
            <span style={{ marginLeft: 4, fontSize: '0.9rem', color: DK.MUTE }}>€</span>
          </div>
        </div>
      </motion.div>

      {/* Overview del pedido · gráficas que lucen el CUBICAJE REAL (nace de las
          líneas) + escrow. Donut de ocupación del 40'HC + volumen/peso exactos +
          progreso de multifirma. Siempre visible, sin importar la pestaña. */}
      <Card pad={16} style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1px 1fr 1fr 1px 1.3fr', gap: '1.1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Donut value={cube.occ} size={84} color={DK.GREEN} color2={DK.LILAC} sub={`${containerType}`} />
            <div>
              <Eyebrow>Cubicaje</Eyebrow>
              <div style={{ fontSize: '0.82rem', color: WHITE, fontWeight: 550, marginTop: 4, lineHeight: 1.3 }}>
                Ocupación del<br />contenedor
              </div>
              <div style={{ marginTop: 8 }}>
                <StatusPill tone={cube.occ < 50 ? 'warn' : 'ok'}>{cube.occ < 50 ? 'grupaje recomendado' : 'carga consolidada'}</StatusPill>
              </div>
            </div>
          </div>
          <div style={{ width: 1, height: 56, background: DK.HAIR, justifySelf: 'center' }} />
          <Stat value={cube.m3.toLocaleString('es-ES', { maximumFractionDigits: 2 })} unit="m³" label="Volumen real" accent={WHITE} />
          <Stat value={cube.kg.toLocaleString('es-ES')} unit="kg" label="Peso de la carga" accent={WHITE} />
          <div style={{ width: 1, height: 56, background: DK.HAIR, justifySelf: 'center' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
              <Eyebrow>Escrow · multifirma</Eyebrow>
              <span style={{ ...DK.NUM, fontSize: '0.86rem', fontWeight: 650, color: total > 0 && signed === total ? DK.GOLD : WHITE }}>{signed}/{total || 0}</span>
            </div>
            {total > 0 ? (
              <SegmentBar
                legend={false}
                segments={multisig.map((s) => ({
                  label: s.label,
                  value: 1,
                  color: s.status === 'signed' ? DK.GREEN : 'rgba(255,255,255,0.08)',
                }))}
              />
            ) : (
              <div style={{ fontSize: '0.74rem', color: DK.MUTE }}>Sin multifirma en este pedido</div>
            )}
            <div style={{ marginTop: 9, fontSize: '0.66rem', color: DK.MUTE }}>
              Liberación a la entrega firmada · {cube.skus} {cube.skus === 1 ? 'línea' : 'líneas'}
            </div>
          </div>
        </div>
      </Card>

      {/* Pestañas internas del pedido · chips del kit · una vista limpia cada vez */}
      <div style={{ display: 'flex', gap: 7, marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        {PANEL_TABS.map((pt) => {
          const on = pt.id === panelTab
          return (
            <button
              key={pt.id}
              type="button"
              className="dk-chip"
              data-active={on}
              onClick={() => setPanelTab(pt.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              {pt.label}
              {pt.id === 'pago' && total > 0 && (
                <span style={{ ...DK.NUM, fontSize: '0.66rem', fontWeight: 650, color: on ? '#1A1140' : (signed === total ? DK.GOLD : DK.GREEN) }}>
                  {signed}/{total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* COMPRA · el pedido como documento A4 para inspeccionar (líneas ▸ DPP) */}
      {panelTab === 'compra' && (
        <PedidoDocs single="pedido" orderRef={order.ref} orderTitle={order.product} lines={lines} amount={amountNumber} seller={order.supplier} />
      )}

      {/* TRANSPORTE · modo (marítimo/terrestre/ferrocarril/aéreo) + carga */}
      {panelTab === 'transporte' && (
        <Card pad={18}>
          <TransportModeSelector mode={transportMode} onChange={setTransportMode} />
          {transportMode === 'maritimo' ? (
            <>
              <div style={{ fontFamily: DK.FONT_MONO, fontSize: '0.6rem', color: DK.MUTE, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '4px 0 12px' }}>
                Contenedor {containerType} · cubicaje real · nace de las líneas
              </div>
              <ContainerLoad lines={lines} mode="auto" />
            </>
          ) : (
            <TransportSearch mode={transportMode} lines={lines} />
          )}
        </Card>
      )}

      {/* PAGO & CUSTODIA · escrow multifirma + custodia */}
      {panelTab === 'pago' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem', alignItems: 'start' }}>
          <Card eyebrow="Multifirma · escrow" right={signed === total && total > 0 ? <StatusPill tone="ok">completa</StatusPill> : total > 0 ? <StatusPill tone="pending">en curso</StatusPill> : undefined}>
            {multisig.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                  <span style={{ ...DK.NUM, fontSize: '1.7rem', fontWeight: 650, color: signed === total ? DK.GOLD : WHITE, lineHeight: 1 }}>
                    <NumberTicker value={signed} />/<NumberTicker value={total} />
                  </span>
                  <span style={{ fontSize: '0.8rem', color: DK.MUTE }}>firmas</span>
                </div>
                <SegmentBar
                  legend={false}
                  segments={multisig.map((s) => ({
                    label: s.label,
                    value: 1,
                    color: s.status === 'signed' ? DK.GREEN : 'rgba(255,255,255,0.08)',
                  }))}
                />
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {multisig.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                      <span style={{ color: DK.TEXT_DIM }}>{s.label} · <span style={{ color: DK.MUTE }}>{s.signer}</span></span>
                      <StatusPill tone={s.status === 'signed' ? 'ok' : 'pending'}>
                        {s.status === 'signed' ? '✓ Firmado' : 'Pendiente'}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.8rem', color: DK.MUTE }}>
                Sin multifirma definida en este pedido.
              </div>
            )}
          </Card>

          <Card eyebrow="Custodia" right={<StatusPill tone="info">firmada</StatusPill>}>
            <div style={{ fontSize: '0.92rem', color: DK.LILAC, fontWeight: 600, marginBottom: 12 }}>
              Custodia firmada criptográficamente
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: DK.MUTE }}>Sello</span><span style={{ color: DK.TEXT }}>firma Ed25519 + hash</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: DK.MUTE }}>Escrow</span><span style={{ color: DK.TEXT }}>en depósito</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: DK.MUTE }}>Integridad</span><span style={{ color: DK.GREEN }}>sello verificable</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: DK.MUTE }}>Liberación</span><span style={{ color: DK.TEXT }}>a la entrega firmada</span></div>
            </div>
          </Card>
        </div>
      )}

      {/* DOCUMENTOS · carpeta con todos los documentos guardados (formato A4) */}
      {panelTab === 'docs' && (
        <PedidoDocs orderRef={order.ref} orderTitle={order.product} lines={lines} amount={amountNumber} seller={order.supplier} />
      )}
    </div>
  )
}

function OrderRow({
  order,
  selectable = false,
  selected = false,
  onSelect,
}: {
  order: Order
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const currentIdx = ORDER_STATES.findIndex((s) => s.id === order.state)
  const isInteractive = selectable && !!onSelect
  return (
    <div
      className="dk-card"
      onClick={isInteractive ? onSelect : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      style={{
        background: selected ? 'rgba(185,164,255,0.07)' : undefined,
        border: `1px solid ${selected ? 'rgba(185,164,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
        padding: '1.25rem 1.5rem',
        cursor: isInteractive ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 2rem', marginBottom: '1.4rem' }}>
        <div>
          <Eyebrow color={DK.MUTE}>{order.ref}</Eyebrow>
          <div style={{ fontSize: '1rem', color: WHITE, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 5 }}>{order.product}</div>
          <div style={{ fontSize: '0.78rem', color: DK.TEXT_DIM, marginTop: 5 }}>
            {order.qty} · <span style={{ color: DK.LILAC, fontWeight: 550 }}>{order.supplier}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              ...DK.NUM,
              fontSize: '1.25rem',
              color: DK.GOLD,
              fontWeight: 650,
              letterSpacing: '-0.01em',
            }}
          >
            {order.amount}
          </div>
          <div
            style={{
              fontSize: '0.6rem',
              color: DK.FAINT,
              fontFamily: DK.FONT_MONO,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Pago contra entrega
          </div>
        </div>
      </div>

      {/* 5-state timeline · paleta v3 (verde alcanzado · lila actual · hairline pendiente) */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, padding: '0 4px' }}>
        {/* Connector line */}
        <div
          style={{
            position: 'absolute',
            top: 13,
            left: '10%',
            right: '10%',
            height: 1.5,
            background: 'rgba(255,255,255,0.08)',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 13,
            left: '10%',
            width: `calc(${(currentIdx / 4) * 80}%)`,
            height: 1.5,
            background: `linear-gradient(90deg, ${DK.GREEN}, ${DK.LILAC})`,
            zIndex: 0,
            transition: 'width 0.4s',
          }}
        />
        {ORDER_STATES.map((s, i) => {
          const reached = i <= currentIdx
          const isCurrent = i === currentIdx
          const reachedRecord = order.history.find((h) => h.state === s.id)
          return (
            <div key={s.id} style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 6px' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isCurrent ? DK.LILAC : reached ? 'rgba(84,224,140,0.16)' : 'rgba(255,255,255,0.04)',
                  border: `1.4px solid ${isCurrent ? 'transparent' : reached ? 'rgba(84,224,140,0.5)' : 'rgba(255,255,255,0.10)'}`,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: DK.FONT_MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  color: isCurrent ? '#1A1140' : reached ? DK.GREEN : DK.FAINT,
                  boxShadow: isCurrent ? '0 2px 12px rgba(185,164,255,0.5)' : 'none',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: reached ? DK.TEXT : DK.FAINT,
                  fontWeight: 600,
                  marginTop: 7,
                  letterSpacing: '0',
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: '0.64rem',
                  color: reached ? DK.MUTE : DK.FAINT,
                  marginTop: 2,
                  fontFamily: DK.FONT_MONO,
                  letterSpacing: '0.04em',
                }}
              >
                {reachedRecord ? reachedRecord.at : s.sub}
              </div>
              {reachedRecord && (
                <div
                  style={{
                    fontSize: '0.58rem',
                    color: DK.FAINT,
                    marginTop: 1,
                    fontFamily: DK.FONT_MONO,
                    letterSpacing: '0.04em',
                  }}
                >
                  {reachedRecord.via}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}



/* ────────────────────────────── ACTORES (filtered list) ────────────────────────────── */
function ActoresView({
  sector,
  filter,
  onClear,
}: {
  sector: Sector
  filter: { groupId: string; roleId: string } | null
  onClear: () => void
}) {
  const t = useT()
  const [actors, setActors] = useState<PublicActor[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Intencional: patrón estándar de fetch · marcamos loading antes de pedir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading')
    setError(null)
    const params = new URLSearchParams({ sector: sector.id, limit: '24' })
    if (filter?.roleId) params.set('role', filter.roleId)
    fetch(`/api/actors?${params}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? `HTTP ${r.status}`)
        }
        return r.json() as Promise<{ actors: PublicActor[]; nextCursor: string | null }>
      })
      .then((data) => {
        if (cancelled) return
        setActors(data.actors)
        setNextCursor(data.nextCursor)
        setStatus('loaded')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [sector.id, filter?.roleId])

  function loadMore() {
    if (!nextCursor || status === 'loading') return
    setStatus('loading')
    const params = new URLSearchParams({ sector: sector.id, limit: '24', cursor: nextCursor })
    if (filter?.roleId) params.set('role', filter.roleId)
    fetch(`/api/actors?${params}`, { credentials: 'include' })
      .then((r) => r.json() as Promise<{ actors: PublicActor[]; nextCursor: string | null }>)
      .then((data) => {
        setActors((prev) => [...prev, ...data.actors])
        setNextCursor(data.nextCursor)
        setStatus('loaded')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setStatus('error')
      })
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t.actoresEyebrow}
        title={filter ? t.actoresTitleFiltered : t.actoresTitleAll}
        body={
          filter
            ? fill(t.actoresBodyFiltered, { role: filter.roleId.replace(/-/g, ' ') })
            : t.actoresBodyAll
        }
      />
      {filter && (
        <div style={{ marginBottom: '1.5rem' }}>
          <GhostButton onClick={onClear}>✕ {t.actoresClearFilter}</GhostButton>
        </div>
      )}

      {status === 'loading' && actors.length === 0 && <ActorListSkeleton />}
      {status === 'error' && <ActorListError detail={error} />}
      {status === 'loaded' && actors.length === 0 && <ActorListEmpty />}

      {actors.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {actors.map((a) => (
              <ActorCard key={a.user_id} actor={a} />
            ))}
          </div>
          {nextCursor && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <GhostButton onClick={loadMore} disabled={status === 'loading'}>
                {status === 'loading' ? t.actoresLoadingMore : t.actoresLoadMore}
              </GhostButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActorCard({ actor }: { actor: PublicActor }) {
  const initials = computeActorInitials(actor.display_name)
  const subtitle = [actor.role_id, actor.country_code, actor.city].filter(Boolean).join(' · ')
  return (
    <Link
      href={`/actor/${actor.user_id}`}
      className="dk-card dk-card-hover"
      style={{
        display: 'block',
        padding: '1.25rem',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'rgba(185,164,255,0.12)',
            border: '1px solid rgba(185,164,255,0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: DK.FONT,
            fontSize: '1.1rem',
            fontWeight: 600,
            color: DK.LILAC,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.98rem',
              color: WHITE,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {actor.display_name}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily: DK.FONT_MONO,
                fontSize: '0.7rem',
                color: DK.TEXT_DIM,
                letterSpacing: '0.08em',
                marginTop: 3,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: DK.FONT_MONO,
          fontSize: '0.68rem',
          color: DK.GREEN,
          letterSpacing: '0.1em',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: DK.GREEN }} />
        KYC ✓
      </div>
    </Link>
  )
}

function ActorListSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.024)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '1.25rem',
            height: 110,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  )
}

function ActorListEmpty() {
  const t = useT()
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.024)',
        border: '1px dashed rgba(255,255,255,0.10)',
        borderRadius: 14,
        padding: '3rem 2rem',
        textAlign: 'center',
        color: DK.TEXT_DIM,
        fontFamily: DK.FONT,
        fontSize: '0.92rem',
      }}
    >
      {t.actoresEmpty}
    </div>
  )
}

function ActorListError({ detail }: { detail: string | null }) {
  const t = useT()
  return (
    <div
      style={{
        background: 'rgba(224,133,126,0.10)',
        border: '1px solid rgba(224,133,126,0.4)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        color: '#E0857E',
        fontFamily: DK.FONT_MONO,
        fontSize: '0.78rem',
        letterSpacing: '0.06em',
      }}
    >
      {t.actoresError}{detail ? ` · ${detail}` : ''}
    </div>
  )
}

function computeActorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/* ────────────────────────────── CATÁLOGO ────────────────────────────── */
function CatalogoView() {
  const t = useT()
  return (
    <div>
      <SectionHeader
        eyebrow={t.catalogoEyebrow}
        title={t.catalogoTitle}
        body={t.catalogoBody}
      />
      <PlaceholderGrid title={t.catalogoPlaceholder} />
    </div>
  )
}

function MiCatalogoView() {
  const t = useT()
  return (
    <div>
      <SectionHeader
        eyebrow={t.miCatalogoEyebrow}
        title={t.miCatalogoTitle}
        body={t.miCatalogoBody}
      />
      <div
        className="dk-card"
        style={{
          border: '1px dashed rgba(185,164,255,0.3)',
          padding: '3rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '0.66rem',
            color: DK.LILAC,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            fontFamily: DK.FONT_MONO,
            marginBottom: '1rem',
          }}
        >
          ◆ CONECTA TU ERP
        </div>
        <p style={{ color: DK.TEXT_DIM, fontSize: '0.95rem', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 1.5rem' }}>
          Sincronización vía Make.com a SAP · Odoo · Holded · Sage · webhook personalizado. Plug & play.
        </p>
        <PrimaryButton>{t.miCatalogoButton}</PrimaryButton>
      </div>
    </div>
  )
}

type LegalDocMeta = {
  idx: number
  label: string
  filename: string
  mime: string
  size: number
  uploadedAt: number
}

function formatDocSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function ArchivosView() {
  const t = useT()
  const [docs, setDocs] = useState<LegalDocMeta[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    function load() {
      try {
        const raw = window.localStorage.getItem('1503:legalDocs')
        const arr = raw ? (JSON.parse(raw) as LegalDocMeta[]) : []
        arr.sort((a, b) => a.idx - b.idx)
        setDocs(arr)
      } catch {
        setDocs([])
      }
    }
    load()
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  function downloadDoc(meta: LegalDocMeta) {
    try {
      const dataUrl = window.localStorage.getItem(`1503:legalDoc:${meta.idx}`)
      if (!dataUrl) return
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = meta.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {}
  }

  function removeDoc(meta: LegalDocMeta) {
    if (!confirm(fill(t.archivosRemoveConfirm, { filename: meta.filename }))) return
    try {
      window.localStorage.removeItem(`1503:legalDoc:${meta.idx}`)
      const remaining = docs.filter((d) => d.idx !== meta.idx)
      window.localStorage.setItem('1503:legalDocs', JSON.stringify(remaining))
      setDocs(remaining)
    } catch {}
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t.archivosEyebrow}
        title={t.archivosTitle}
        body={t.archivosBody}
      />

      {/* Checklist documentos requeridos por sector · Fase 1.8 R0 demo.
          initialData hardcoded mientras mig 028-031 no estén aplicadas en
          Supabase. En producción se omite y el componente fetchea la API
          `/api/me/missing-documents`. */}
      <div style={{ marginBottom: '1.5rem' }}>
        <MissingDocumentsChecklist
          lang="es"
          initialData={TRANSPORT_MISSING_DOCS}
        />
      </div>

      {docs.length === 0 ? (
        <div
          className="dk-card"
          style={{
            border: '1px dashed rgba(255,255,255,0.12)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <Hex size={28} color={DK.LILAC} />
          <p
            style={{
              color: DK.TEXT_DIM,
              fontSize: '0.95rem',
              marginTop: '1rem',
              fontFamily: DK.FONT,
            }}
          >
            {t.archivosEmpty}
          </p>
          <p
            style={{
              color: DK.MUTE,
              fontSize: '0.78rem',
              marginTop: '0.4rem',
            }}
          >
            {t.archivosEmptyHint}
          </p>
        </div>
      ) : (
        <Card pad={0}>
          {docs.map((d, i) => (
            <div
              key={d.idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderBottom: i === docs.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Hex size={14} color={DK.GREEN} filled />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: DK.TEXT,
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.label}
                </div>
                <div
                  style={{
                    color: DK.MUTE,
                    fontSize: '0.75rem',
                    marginTop: 3,
                    fontFamily: DK.FONT_MONO,
                    letterSpacing: '0.04em',
                  }}
                >
                  {d.filename} · {formatDocSize(d.size)} · {new Date(d.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <GhostButton onClick={() => downloadDoc(d)}>
                <IconDownload />
                {t.archivosDownload}
              </GhostButton>
              <IconButton title="Eliminar" onClick={() => removeDoc(d)}>×</IconButton>
            </div>
          ))}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              color: DK.MUTE,
              fontSize: '0.66rem',
              fontFamily: DK.FONT_MONO,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            ◆ {t.archivosFooter}
          </div>
        </Card>
      )}
    </div>
  )
}

function MensajesView() {
  const t = useT()
  return (
    <div>
      <SectionHeader
        eyebrow={t.mensajesEyebrow}
        title={t.mensajesTitle}
        body={t.mensajesBody}
      />
      <PlaceholderGrid title={t.mensajesEyebrow} />
    </div>
  )
}

/* ────────────────────────────── SHELL ────────────────────────────── */
/** Datos REALES de las funciones de un sector (hoy: transporte). Opcional: si no
 *  se pasan, las pestañas de función muestran su estado vacío honesto. */
export interface SectorDeskData {
  shipments?: CustodyShipment[]
  documents?: ShipmentDocs[]
  actors?: CustodyActor[]
  roleId?: string | null
  /** Base de enlaces a detalle de envío (p.ej. '/transitario' o '/preview/transitario'). */
  hrefBase?: string
}

export default function WorkspaceShell({ sector, sectorData }: { sector: Sector; sectorData?: SectorDeskData }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('buscador')
  const [actorFilter, setActorFilter] = useState<{ groupId: string; roleId: string } | null>(null)
  // Display language is derived from the user's home country (set in /register/[code]).
  // Defaults to Spanish when no country is stored yet.
  const [homeCountry, setHomeCountry] = useState<string>(DEFAULT_HOME_COUNTRY)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('1503:homeCountry')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
      if (saved) setHomeCountry(saved.toUpperCase())
    } catch {}
  }, [])
  const lang = langForCountry(homeCountry)
  const tStrings = useMemo(() => getWorkspaceStrings(lang), [lang])

  // Sector con funciones propias portadas a la plantilla (hoy: transporte).
  const isTransporte = sector.id === 'transporte'
  const deskHref = sectorData?.hrefBase ?? '/transitario'

  // Current market the user wants to operate in. Persists in sessionStorage
  // so it survives sector navigation; resets on a new browser session.
  const [currentMarket, setCurrentMarket] = useState(HOME_MARKET)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.sessionStorage.getItem('1503:currentMarket')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
    if (saved && saved !== currentMarket) setCurrentMarket(saved)
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('1503:currentMarket', currentMarket)
    }
  }, [currentMarket])

  // Estado del cluster de comunicaciones (chat / call / video / meet).
  // Hoy se alimenta solo del CommsDevPanel; cuando llegue la infra real
  // de llamadas (Fase 5) se conectará a los eventos del socket.
  const [comms, setComms] = useState<CommsState>({
    chatUnread: 0,
    chatFlash: false,
    callRinging: false,
    videoRinging: false,
    meetRinging: false,
    meetParticipants: 6,
  })

  // Drawer del chat texto (sustituye la columna fija de 360 px).
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false)

  // Stage activo (llamada/video/reunion). null cuando no hay nada en curso.
  const [stageKind, setStageKind] = useState<StageKind | null>(null)
  const [stageMode, setStageMode] = useState<StageMode>('slim')
  // Preferencia persistente del usuario para el modo inicial del Stage.
  const [stageDefaultMode, setStageDefaultModeState] = useState<StageDefaultMode>('auto')
  // Nombre del usuario actual (para identidad en Stage). Se hidrata
  // desde el mismo localStorage que usa ProfileName.
  const [myDisplayName, setMyDisplayName] = useState('')
  // Altura real del bloque DemoBanner + Header + MarketBanner, medida
  // con ResizeObserver. El Stage FULL la usa como `top` para no taparlo.
  const headerWrapRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(64)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = headerWrapRef.current
    if (!el) return
    const measure = () => setHeaderHeight(el.getBoundingClientRect().height)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mide DOM real
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(STAGE_DEFAULT_MODE_KEY)
      if (saved === 'auto' || saved === 'slim' || saved === 'full') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
        setStageDefaultModeState(saved)
      }
    } catch {}
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación SSR-safe
      setMyDisplayName(window.localStorage.getItem(NAME_STORAGE_KEY) || '')
    } catch {}
  }, [])
  function setStageDefaultMode(next: StageDefaultMode) {
    setStageDefaultModeState(next)
    try { window.localStorage.setItem(STAGE_DEFAULT_MODE_KEY, next) } catch {}
    // Si hay un Stage en curso y la preferencia no es Auto, aplicar al
    // vuelo (feedback inmediato). Auto deja el modo actual sin tocar.
    // Hardening 23-may auditoría: NO restaurar desde Pip. Si el usuario
    // aparcó el Stage, cambiar la preferencia no debe sacarlo del Pip
    // (eso le sorprende). El Pip es estado deliberado del usuario.
    if (stageKind && stageMode !== 'pip' && (next === 'slim' || next === 'full')) {
      setStageMode(next)
    }
  }

  function handleCommsClick(channel: 'chat' | 'call' | 'video' | 'meet') {
    if (channel === 'chat') {
      setComms((s) => ({ ...s, chatUnread: 0, chatFlash: false }))
      setChatDrawerOpen((v) => !v)
      return
    }
    // Llamada/Video/Reunion: apagar ringing y montar el Stage. Si ya
    // habia uno activo de otro tipo, lo sustituye (decision: solo un
    // Stage a la vez; aparcar un Stage llega con pipping en B3).
    let nextKind: StageKind
    if (channel === 'call') {
      setComms((s) => ({ ...s, callRinging: false }))
      nextKind = 'call'
    } else if (channel === 'video') {
      setComms((s) => ({ ...s, videoRinging: false }))
      nextKind = 'video'
    } else {
      setComms((s) => ({ ...s, meetRinging: false }))
      nextKind = 'meet'
    }
    setStageKind(nextKind)
    // Modo inicial = preferencia persistente (Auto aplica la regla
    // sensata por kind). El toggle ↕/↧ del Stage sigue cambiando
    // efímeramente el modo en curso sin tocar la preferencia.
    setStageMode(resolveInitialStageMode(nextKind, stageDefaultMode))
  }

  function handleHangup() {
    setStageKind(null)
    setStageMode('slim')
  }

  function handleRoleClick(groupId: string, roleId: string) {
    setActorFilter({ groupId, roleId })
    setTab('actores')
  }

  function handleSectorChange(id: string) {
    if (id !== sector.id) router.push(`/sector/${id}`)
  }

  return (
    <I18nCtx.Provider value={{ t: tStrings, lang }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0A0C11', color: '#EAEFF6', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
        <DeskStyle />
        {/* Fondo reactivo al contexto (imagen real + velo · misma norma). Cascada
            de especificidad: oficio (Actores+rol) > override sector+pestaña >
            pestaña funcional (archivos/correo/agenda…) > fondo-firma del sector >
            fondo sereno casi-negro. */}
        <WorkspaceBackground
          image={
            (tab === 'actores' && actorFilter?.roleId && ROLE_BG[actorFilter.roleId]) ||
            SECTOR_TAB_BG[sector.id]?.[tab] ||
            TAB_BG[tab] ||
            SECTOR_BG[sector.id]
          }
        />
        {/* Bloque cabecera medido en runtime — el Stage FULL lee su
            altura para anclarse justo debajo (en vez de top:64 fijo). */}
        <div ref={headerWrapRef}>
          <DemoBanner />
          <WorkspaceHeader
            sector={sector}
            onSectorChange={handleSectorChange}
            currentMarket={currentMarket}
            onMarketChange={setCurrentMarket}
            comms={comms}
            activeStage={stageKind}
            chatOpen={chatDrawerOpen}
            onCommsClick={handleCommsClick}
          />
          {currentMarket.toLowerCase() !== HOME_MARKET && (
            <MarketBanner
              market={currentMarket}
              sector={sector}
              onBackHome={() => setCurrentMarket(HOME_MARKET)}
            />
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', flex: 1, position: 'relative', zIndex: 1 }}>
          <WorkspaceSidebar tab={tab} onTab={setTab} sectorId={sector.id} />
          <main style={{ padding: '2.5rem 3rem 4rem', maxWidth: 1280, margin: '0 auto', width: '100%', position: 'relative' }}>
            {/* Escritorio personalizado (logo + fotos) SOLO en la pestaña home
                (Buscador). En pestañas de trabajo densas (Catálogo, Pedidos…)
                clobbering el contenido → workspace PRO disciplinado y con aire. */}
            <DesktopBackground hidden={stageKind !== null || tab !== 'buscador'} t={tStrings} />
            {/* Virtudes COMUNES de la plantilla (todas los sectores las heredan) */}
            {tab === 'buscador' && <BuscadorView sector={sector} onRoleClick={handleRoleClick} />}
            {tab === 'catalogo' && <CatalogoFichas sector={sector} />}
            {tab === 'actores' && <ActoresView sector={sector} filter={actorFilter} onClear={() => setActorFilter(null)} />}
            {tab === 'mi-catalogo' && <MiCatalogoView />}
            {tab === 'archivos' && <ArchivosView />}
            {tab === 'mensajes' && <MensajesView />}
            {tab === 'agenda' && <AgendaView t={tStrings} lang={lang} onStartComms={handleCommsClick} />}
            {/* PEDIDOS: transporte → cubicaje del transitario; resto → vista de pedidos del sector */}
            {tab === 'pedidos' && (isTransporte
              ? <CargaModule shipments={sectorData?.shipments ?? []} hrefBase={deskHref} preview />
              : <PedidosView sector={sector} />)}
            {/* EXPORTACIÓN: transporte → corredores del transitario; resto → motor por corredor genérico */}
            {tab === 'exportacion' && (isTransporte
              ? <ExportacionModule shipments={sectorData?.shipments ?? []} />
              : <ExportComplianceView lang={lang} sectorId={sector.id} />)}
            {/* Funciones PROPIAS de transporte (solo aparecen en su set de pestañas) */}
            {tab === 'custodia' && <CustodiaModule shipments={sectorData?.shipments ?? []} hrefBase={deskHref} />}
            {tab === 'documentacion' && <DocumentacionModule documents={sectorData?.documents ?? []} roleId={sectorData?.roleId ?? null} hrefBase={deskHref} />}
          </main>
        </div>
        <ChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} t={tStrings} />
        {stageKind && (
          <CommsStage
            kind={stageKind}
            mode={stageMode}
            participants={buildStageParticipants(
              stageKind === 'meet' ? comms.meetParticipants : 2,
              myDisplayName,
              'Mi empresa', // placeholder; Fase 3a-bis añade el dato real del Actor
            )}
            rightOffset={chatDrawerOpen ? 380 : 0}
            topOffset={headerHeight}
            defaultMode={stageDefaultMode}
            onChangeDefaultMode={setStageDefaultMode}
            onToggleMode={() => setStageMode((m) => (m === 'slim' ? 'full' : 'slim'))}
            onMinimizeToPip={() => setStageMode('pip')}
            onRestoreFromPip={() => setStageMode('slim')}
            onHangup={handleHangup}
          />
        )}
        <CommsDevPanel state={comms} setState={setComms} />
      </div>
    </I18nCtx.Provider>
  )
}

/** Sticky banner shown when the user operates in a foreign market.
    Includes inline sector switcher so the user can jump verticals without
    leaving the foreign-market context. */
function MarketBanner({
  market,
  sector,
  onBackHome,
}: {
  market: string
  sector: Sector
  onBackHome: () => void
}) {
  const t = useT()
  const router = useRouter()
  const [showSectorMenu, setShowSectorMenu] = useState(false)

  return (
    <div
      style={{
        position: 'sticky',
        top: 64,
        zIndex: 40,
        background: 'linear-gradient(90deg, rgba(240,180,41,0.08), rgba(185,164,255,0.04))',
        borderBottom: '1px solid rgba(240,180,41,0.25)',
        padding: '10px 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-chakra-petch), sans-serif',
        color: '#EAEFF6',
        letterSpacing: '0.04em',
      }}
    >
      {/* Operating in country */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{flagEmoji(market)}</span>
        <span style={{ color: '#F0B429', fontWeight: 600 }}>{fill(t.operatingIn, { country: getCountryName(market) })}</span>
      </span>

      <span style={{ color: '#3A4050' }}>×</span>

      {/* Sector mini-switcher */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSectorMenu(!showSectorMenu)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(185,164,255,0.08)',
            border: '1px solid rgba(185,164,255,0.3)',
            color: '#9FC5E8',
            padding: '5px 12px',
            borderRadius: 3,
            fontSize: '0.78rem',
            fontFamily: 'var(--font-chakra-petch), sans-serif',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-geist-mono), monospace',
              color: '#B9A4FF',
            }}
          >
            {t.marketSectorLabel}
          </span>
          <span style={{ color: '#EAEFF6' }}>{sector.label}</span>
          <span style={{ color: '#6B7686' }}>▼</span>
        </button>

        {showSectorMenu && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: '#0E1118',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              minWidth: 260,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: '10px 14px 6px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.66rem',
                color: '#9AA7B8',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              {fill(t.jumpToSectorIn, { country: getCountryName(market) })}
            </div>
            {SECTORS.map((s) => {
              const active = s.id === sector.id
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setShowSectorMenu(false)
                    if (!active) router.push(`/sector/${s.id}`)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: active ? 'rgba(185,164,255,0.1)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(30,37,48,0.5)',
                    color: active ? '#B9A4FF' : '#C9D4E6',
                    padding: '9px 14px',
                    cursor: active ? 'default' : 'pointer',
                    fontFamily: 'var(--font-chakra-petch), sans-serif',
                    fontSize: '0.86rem',
                    textAlign: 'left',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span>{s.label}</span>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      color: '#6B7686',
                      letterSpacing: '0.16em',
                    }}
                  >
                    {s.short}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <span style={{ color: '#3A4050' }}>·</span>
      <span
        style={{
          color: '#9AA7B8',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {t.marketCaption}
      </span>

      <button
        onClick={onBackHome}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#9AA7B8',
          padding: '5px 12px',
          borderRadius: 3,
          fontSize: '0.7rem',
          fontFamily: 'var(--font-geist-mono), monospace',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {t.backToHomeMarket}
      </button>
    </div>
  )
}
