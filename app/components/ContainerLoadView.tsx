'use client'

// ContainerLoadView · visualización 3D React Three Fiber del cubicaje
// Capa 2 ADR 0007 · vista PEQUEÑA dentro del panel de Pedidos (HoloCard
// derecha del PedidoCubicajePanel · ~540px de alto).
//
// 28-may v3 · CONSISTENCIA VISUAL: usa el contenedor PBR fotorrealista
// compartido (PBRContainer.tsx) en lugar del wireframe holográfico cyan
// del v2. Ambas vistas — esta (pequeña) y CargoLoadingBridge (fullscreen)
// — comparten ahora la misma estética PBR + cristal-reveal del 28-may.
//
// USO (desde Server Component con dynamic import + ssr: false):
//
//   import dynamic from 'next/dynamic'
//
//   const ContainerLoadView = dynamic(
//     () => import('@/app/components/ContainerLoadView'),
//     { ssr: false, loading: () => <p>Cargando visualizador 3D...</p> }
//   )
//
//   <ContainerLoadView containerType="40HC" items={mockItems} />
//
// PATRÓN CANÓNICO Next.js modificado (validado sesión 28-may contra
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md):
// - 'use client' obligatorio (Canvas WebGL usa window/document)
// - ssr: false en dynamic import (server no tiene WebGL context)
// - loading fallback para tiempo de bundle (three.js + R3F + drei pesan ~500KB)
//
// MATIZ CANÓNICO AVIACIÓN (ADR 0007 §2.7)
// ---------------------------------------
// Este componente NO renderiza ULDs aéreos. El cubicaje 3D aplica SOLO a
// marítimo + terrestre + ferroviario + fluvial. Comercio aéreo documental
// sigue válido (AWB en custody chain) pero W&B + cubicaje aéreo son
// responsabilidad del transitario certificado.
//
// ALGORITMO BIN PACKING
// ---------------------
// Usa `pack3D` de binpackingjs client-side para preview rápida. La fuente
// de verdad canónica es la Edge Function `optimize-container-load` (ADR
// 0007 §2.3). El refactor a llamada server-side será commit D' del roadmap
// "Modo Carga Muelle".

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Stats,
  Environment,
  MeshReflectorMaterial,
  Grid,
  Edges,
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  N8AO,
  Vignette,
  SMAA,
} from '@react-three/postprocessing'
import * as THREE from 'three'

import {
  CONTAINER_SPECS,
  isCubicajeContainer,
  type ContainerType,
} from '@/app/data/containerSpecs'
import {
  RealisticContainer,
  CornerCastings,
  ContainerDoors,
  type WallSide,
} from './cargo/PBRContainer'
import { packCargoLayout, type PlacedBox } from '@/app/lib/cargoPack'

// ════════════════════════════════════════════════════════════════════════════
// Tipos
// ════════════════════════════════════════════════════════════════════════════

export interface ContainerLoadViewItem {
  /** Identificador único del bulto (DPP id o sku). */
  id: string
  /** Nombre legible (para tooltip). */
  name: string
  /** Largo del bulto (mm). */
  length_mm: number
  /** Anchura del bulto (mm). */
  width_mm: number
  /** Altura del bulto (mm). */
  height_mm: number
  /** Peso del bulto (kg). */
  weight_kg: number
  /** Cantidad de bultos idénticos. */
  quantity: number
  /** Color sugerido (hex) · si no se da, se asigna automáticamente. */
  color_hex?: string
}

export interface ContainerLoadViewProps {
  /** Tipo de contenedor a visualizar. LCL no se renderiza (no es contenedor único). */
  containerType: ContainerType
  /** Lista de items a cargar. */
  items: ContainerLoadViewItem[]
  /** Mostrar performance stats (FPS). Solo dev. */
  showStats?: boolean
  /** Mostrar tooltips al hover (no implementado todavía). */
  showTooltips?: boolean
  /** Paredes que se dejan SIEMPRE abiertas (transparentes) para ver la carga.
   *  Típico: ['front'] → pared de cara a la cámara abierta. Default: ninguna
   *  (se conserva el cristal-reveal dinámico por ángulo). */
  openSides?: WallSide[]
  /** Si true, girar requiere mantener Ctrl (evita secuestrar el scroll de la
   *  página en vistas embebidas). Default: false (giro libre con arrastrar). */
  rotateWithCtrl?: boolean
}

// El empaquetado (expand + sort + binpackingjs + colores) vive en el módulo
// compartido app/lib/cargoPack.ts · lo consumen también el mapa de carga 2D.

// ════════════════════════════════════════════════════════════════════════════
// Cajas DPP · BoxGeometry con textura cartón corrugado procedural (PRNG
// determinista para cumplir react-hooks/purity de React 19).
// ════════════════════════════════════════════════════════════════════════════

function useCardboardTexture(): THREE.Texture {
  return useMemo(() => {
    let seed = 0x12345678
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = seed
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const ctx = c.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, '#c89860')
    grad.addColorStop(0.5, '#b8804a')
    grad.addColorStop(1, '#a87238')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = 'rgba(120, 75, 30, 0.35)'
    ctx.lineWidth = 1
    for (let y = 0; y < 512; y += 8) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }
    for (let i = 0; i < 80; i++) {
      const x = rand() * 512
      const y = rand() * 512
      const r = rand() * 2 + 1
      ctx.fillStyle = `rgba(80, 50, 20, ${rand() * 0.18 + 0.05})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(80, 50, 20, 0.28)'
    ctx.font = 'bold 14px monospace'
    ctx.fillText('1503', 16, 32)
    ctx.fillText('FRAGILE', 16, 56)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])
}

function RealisticCargoBox({
  size,
  position,
  color,
  cardboardTex,
}: {
  size: [number, number, number]
  position: [number, number, number]
  color: string
  cardboardTex: THREE.Texture
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        map={cardboardTex}
        roughness={0.85}
        metalness={0.02}
        clearcoat={0.15}
        clearcoatRoughness={0.65}
        envMapIntensity={0.7}
      />
      {/* Arista fina oscura: separa bulto de bulto (canon "líneas") */}
      <Edges scale={1.002} threshold={15} color="#0a0f14" />
    </mesh>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BAHÍA DE CARGA 1503 · estudio oscuro monocromo: suelo reflectante + rejilla
// de líneas técnicas (canon visual José: oscuro · líneas · sin dibujitos).
// Sustituye al "muelle portuario" del 28-may (HDRI atardecer/agua/bolardos).
// ════════════════════════════════════════════════════════════════════════════

const HDRI_SUNSET_PORT = '/textures/hdri/industrial_sunset_02_puresky_1k.hdr'

function StudioBay({
  containerLength,
  containerWidth,
}: {
  containerLength: number
  containerWidth: number
}) {
  const floorSize = Math.max(containerLength, containerWidth) * 9
  return (
    <>
      {/* Suelo: lámina reflectante oscura (el contenedor "flota" sobre su reflejo) */}
      <mesh position={[containerLength / 2, -0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={22}
          roughness={0.82}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0a0f16"
          metalness={0.45}
          mirror={0.35}
        />
      </mesh>

      {/* Rejilla técnica de líneas, desvanecida a la distancia */}
      <Grid
        position={[containerLength / 2, 0.002, 0]}
        args={[floorSize, floorSize]}
        cellSize={0.6}
        cellThickness={0.55}
        cellColor="#16202e"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#2a3a4f"
        fadeDistance={floorSize * 0.62}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Charco de luz bajo el contenedor (lo ancla al suelo) */}
      <spotLight
        position={[containerLength / 2, containerLength * 1.6, 0]}
        angle={0.7}
        penumbra={1}
        intensity={1.1}
        color="#dfe9f5"
        distance={containerLength * 6}
      />
    </>
  )
}

/** Componente que renderiza todos los bultos packed con look fotorealista.
 *  Consume el layout compartido (PlacedBox · mm · x=largo, y=alto, z=ancho). */
function CargoItems({
  placed,
  scale,
}: {
  placed: PlacedBox[]
  scale: number
}) {
  const cardboardTex = useCardboardTexture()
  return (
    <>
      {placed.map((b, i) => (
        <RealisticCargoBox
          key={`${b.id}_${i}`}
          size={[b.l * scale, b.h * scale, b.w * scale]}
          position={[(b.x + b.l / 2) * scale, (b.y + b.h / 2) * scale, (b.z + b.w / 2) * scale]}
          color={b.color}
          cardboardTex={cardboardTex}
        />
      ))}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════════════

export default function ContainerLoadView({
  containerType,
  items,
  showStats = false,
  openSides = [],
  rotateWithCtrl = false,
}: ContainerLoadViewProps): React.ReactElement {
  // ─── Hooks · todos al principio (rules-of-hooks · early return al final) ──
  const isVisualizable = isCubicajeContainer(containerType)
  const spec = isVisualizable ? CONTAINER_SPECS[containerType] : null

  // Giro gateado por Ctrl (vistas embebidas): solo se gira mientras Ctrl está
  // pulsado, así el arrastre normal no secuestra el scroll de la página.
  const [ctrlHeld, setCtrlHeld] = useState(false)
  useEffect(() => {
    if (!rotateWithCtrl) return
    const down = (e: KeyboardEvent) => { if (e.key === 'Control') setCtrlHeld(true) }
    const up = (e: KeyboardEvent) => { if (e.key === 'Control') setCtrlHeld(false) }
    const blur = () => setCtrlHeld(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [rotateWithCtrl])
  const rotateEnabled = rotateWithCtrl ? ctrlHeld : true

  // Layout compartido (mismo binpackingjs que el mapa de carga 2D).
  const layout = useMemo(() => packCargoLayout(containerType, items), [containerType, items])

  // Asegurar que useEffect/useMemo se llaman SIEMPRE en el mismo orden ·
  // ningún hook después del early return.
  useEffect(() => {
    /* hook placeholder · futuras animaciones se montan aquí */
  }, [])

  // ─── Early return DESPUÉS de todos los hooks ─────────────────────────────
  if (!isVisualizable || !spec) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-600">
          LCL grupaje cross-tenant · este pedido se consolidará con otros pedidos.
          Sin visualización individual hasta la consolidación final del transitario
          (ADR 0007 §2.4).
        </p>
      </div>
    )
  }

  const placed = layout.placed
  const unfitCount = layout.unfitCount

  const SCALE = 0.001

  const containerWidth = spec.inner_width_mm * SCALE
  const containerHeight = spec.inner_height_mm * SCALE
  const containerLength = spec.inner_length_mm * SCALE

  return (
    <div className="relative h-full w-full" style={{ minHeight: 480 }}>
      {/* HUD · datos de carga (paleta 1503: hueso + latón sobre oscuro) */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-[#2a3a4f] bg-[#0a0f16]/85 px-3 py-2 font-mono text-[11px] tracking-wider text-[#c7d5e3] shadow-lg backdrop-blur-md">
        <p className="font-semibold text-[#c2a36b]">{spec.display_name}</p>
        <p className="text-[#c7d5e3]/85">
          {placed.length} bultos · {unfitCount > 0 ? (
            <span className="text-rose-300">{unfitCount} sin cabida</span>
          ) : (
            <span className="text-emerald-300">100% cabe</span>
          )}
        </p>
        <p className="text-[#c7d5e3]/55">
          {containerLength.toFixed(2)}m × {containerWidth.toFixed(2)}m × {containerHeight.toFixed(2)}m · {spec.inner_volume_m3} m³ · max {spec.max_payload_kg} kg
        </p>
      </div>

      {/* Pista de interacción · giro gateado por Ctrl en vistas embebidas */}
      {rotateWithCtrl && (
        <div
          className={`pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border px-2.5 py-1.5 font-mono text-[10px] tracking-wider backdrop-blur-md transition-colors ${
            ctrlHeld
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
              : 'border-[#2a3a4f] bg-[#0a0f16]/85 text-[#c7d5e3]/70'
          }`}
        >
          {ctrlHeld ? '↻ girando · arrastra' : 'mantén Ctrl + arrastra para girar'}
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          // Tres cuartos elevado: el contenedor entero en cuadro, puertas a la
          // derecha, aire arriba. Calculado del tamaño real del contenedor.
          position: [
            containerLength * 1.18,
            containerHeight * 2.1,
            containerWidth * 3.4,
          ],
          fov: 32,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Vacío de estudio: fondo profundo + niebla que funde el suelo */}
        <color attach="background" args={['#070c13']} />
        <fog attach="fog" args={['#070c13', containerLength * 4, containerLength * 11]} />

        {/* Luz clave: blanco frío desde arriba-derecha (técnica, sombras largas) */}
        <directionalLight
          position={[containerLength * 1.1, containerHeight * 3.4, containerWidth * 3]}
          intensity={2.4}
          color="#dfe9f5"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0005}
          shadow-camera-left={-containerLength * 2}
          shadow-camera-right={containerLength * 2}
          shadow-camera-top={containerLength * 1.5}
          shadow-camera-bottom={-containerLength * 1.5}
          shadow-camera-near={0.1}
          shadow-camera-far={containerLength * 10}
        />
        {/* Rim dorado 1503 desde atrás: recorta la silueta del contenedor */}
        <directionalLight
          position={[-containerLength * 0.6, containerHeight * 1.6, -containerWidth * 3.4]}
          intensity={1.5}
          color="#c2a36b"
        />
        <ambientLight intensity={0.22} color="#9FB6CC" />

        {/* HDRI solo para REFLEJOS del metal (no de fondo: el fondo es el vacío) */}
        <Suspense fallback={null}>
          <Environment
            files={HDRI_SUNSET_PORT}
            resolution={256}
            background={false}
          />
        </Suspense>

        {/* BAHÍA 1503 · suelo reflectante + rejilla de líneas */}
        <Suspense fallback={null}>
          <StudioBay
            containerLength={containerLength}
            containerWidth={containerWidth}
          />
        </Suspense>

        {/* CONTENEDOR REAL fotorrealista · 6 paredes corrugado PBR con
            cristal-reveal por ángulo de cámara · idéntico al CargoLoadingBridge
            (consistencia visual). Componente compartido desde cargo/PBRContainer. */}
        <Suspense fallback={null}>
          <RealisticContainer
            width={containerWidth}
            height={containerHeight}
            length={containerLength}
            tint={spec.color_hex}
            hiddenSides={openSides}
          />
        </Suspense>

        {/* Cajas DPP packed */}
        <Suspense fallback={null}>
          <CargoItems placed={placed} scale={SCALE} />
        </Suspense>

        {/* Corner castings ISO 1161 · 8 piezas acero negro en esquinas */}
        <CornerCastings
          width={containerWidth}
          height={containerHeight}
          length={containerLength}
        />

        {/* Puertas back · 2 hojas + bisagras + palanca cierre */}
        <ContainerDoors
          width={containerWidth}
          height={containerHeight}
          length={containerLength}
          tint={spec.color_hex}
        />

        {/* Controles cámara · damping + escala al contenedor + sin picado bajo el suelo */}
        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={containerLength * 0.8}
          maxDistance={containerLength * 4}
          target={[containerLength * 0.5, containerHeight * 0.5, 0]}
          minPolarAngle={Math.PI / 7}
          maxPolarAngle={Math.PI / 2.08}
          enablePan={false}
          enableRotate={rotateEnabled}
        />

        {showStats && <Stats />}

        {/* POSTPROCESSING · oclusión + bloom contenido + viñeta (canon: bloom sí, artificios no) */}
        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO
            aoRadius={containerLength * 0.05}
            intensity={2.2}
            distanceFalloff={0.5}
            color="#000000"
          />
          <Bloom
            luminanceThreshold={0.8}
            luminanceSmoothing={0.45}
            intensity={0.5}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.18} darkness={0.66} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
