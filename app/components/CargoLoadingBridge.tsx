'use client'

// CargoLoadingBridge · overlay fullscreen "Modo Carga en Muelle"
// ----------------------------------------------------------------
// Vista cinematográfica PUNTUAL que se activa cuando una naviera o transitario
// del sector transporte decide vaciar un pedido FCL al contenedor para su
// carga física en el muelle. NO es fondo permanente del workspace · solo
// aparece durante la operación logística concreta de cubicar el envío.
//
// CAPAS (z-index ascendente)
// - z-0  · <video autoplay loop muted playsinline> · MP4 cinematográfico del
//          puerto cargado de buques (Pexels 3840442 · Tom Fisk · CC0 comercial)
// - z-10 · Canvas R3F con gl={{ alpha: true }} · contenedor PBR realista
//          (corrugado + cristal-reveal heredado del cd736f5) + cajas DPP packed
// - z-20 · HUD glassmorphism · KPIs ocupación/peso/bultos + alertas + cerrar
// - z-30 · Modal confirmación / mapa de carga (commit posterior)
//
// PROCESO OPERATIVO (commits siguientes lo expanden)
// 1. Operario click "▶ VACIAR PEDIDO AL CONTENEDOR" en PedidoCubicajePanel
// 2. Overlay se abre con bin-packing automático aplicado
// 3. Operario puede rotar/zoom + ajustar manualmente (commit D · drag boxes)
// 4. Sistema detecta sobrecarga (carga > capacidad) o sobre-espacio
//    (capacidad libre) y activa modo Grupaje · ver commit E
// 5. Operario click "✓ CONFIRMAR CARGA & GENERAR MAPA" · ver commit F
// 6. Genera Mapa de Carga PDF + JSON + correo interno 1503 con
//    Actor-IDs (ver commit G)
//
// AUDIT-READY BY DESIGN
// - Cálculos peso/centro de gravedad · status: subject_to_expert (canon ADR
//   pendiente sobre estabilidad de carga marítima · norma IMO IMSBC code)
// - Hash SHA-256 del mapa de carga · campo nullable hasta Fase 8 (anclaje XDC)
// - Comunicaciones por correo interno 1503 · no SMTP externo (RGPD +
//   feedback self-hosted independence)

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  N8AO,
  Vignette,
  SMAA,
} from '@react-three/postprocessing'
import { pack3D, type Item3D, type PackedItem3D } from 'binpackingjs/3d'
import * as THREE from 'three'

import {
  CONTAINER_SPECS,
  isCubicajeContainer,
  type ContainerType,
} from '@/app/data/containerSpecs'

// ════════════════════════════════════════════════════════════════════════════
// Tipos públicos
// ════════════════════════════════════════════════════════════════════════════

export interface CargoLoadingBridgeItem {
  id: string
  name: string
  length_mm: number
  width_mm: number
  height_mm: number
  weight_kg: number
  quantity: number
  color_hex?: string
}

export interface CargoLoadingBridgeProps {
  /** Tipo de contenedor a cargar · LCL no soportado en esta vista. */
  containerType: ContainerType
  /** Items del pedido a cubicar en el contenedor. */
  items: CargoLoadingBridgeItem[]
  /** Identificador del pedido (PM-TRA-2026-…) · se muestra en HUD. */
  orderId?: string
  /** Ruta del pedido (Valencia → Hamburgo) · se muestra en HUD. */
  routeLabel?: string
  /** Cierra la vista · vuelve al PedidoCubicajePanel. */
  onClose: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// Constantes
// ════════════════════════════════════════════════════════════════════════════

const VIDEO_SRC = '/videos/port-cargo-ships.mp4'

const CONTAINER_TEXTURE_PATHS = {
  color: '/textures/container/corrugated_iron_03_diff_2k.jpg',
  normal: '/textures/container/corrugated_iron_03_nor_gl_2k.jpg',
  roughness: '/textures/container/corrugated_iron_03_rough_2k.jpg',
  ao: '/textures/container/corrugated_iron_03_ao_2k.jpg',
  displacement: '/textures/container/corrugated_iron_03_disp_2k.png',
}

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#a855f7',
]

function colorForIndex(index: number, override?: string): string {
  if (override) return override
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}

function expandItems(items: CargoLoadingBridgeItem[]): Item3D[] {
  const expanded: Item3D[] = []
  items.forEach((item) => {
    for (let n = 0; n < item.quantity; n++) {
      expanded.push({
        name: `${item.id}_${n}`,
        width: item.width_mm,
        height: item.height_mm,
        depth: item.length_mm,
        weight: item.weight_kg,
      })
    }
  })
  return expanded
}

function lightenColor(hex: string, mix: number = 0.7): string {
  const c = new THREE.Color(hex)
  c.lerp(new THREE.Color('#FFFFFF'), mix)
  return '#' + c.getHexString()
}

// ════════════════════════════════════════════════════════════════════════════
// Contenedor REAL · 6 paredes individuales con texturas PBR fotorealistas +
// cristal-reveal (las paredes laterales se vuelven transparentes cuando la
// cámara las enfoca) · heredado intacto del commit cd736f5 del 28-may.
// ════════════════════════════════════════════════════════════════════════════

type WallSide = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

const WALL_NORMAL: Record<WallSide, [number, number, number]> = {
  front: [1, 0, 0],
  back: [-1, 0, 0],
  right: [0, 0, 1],
  left: [0, 0, -1],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
}

interface TexMaps {
  color: THREE.Texture
  normal: THREE.Texture
  roughness: THREE.Texture
  ao: THREE.Texture
  displacement: THREE.Texture
}

function ContainerWall({
  side,
  width,
  height,
  length,
  tint,
  texMaps,
  thickness = 0.04,
  hideThreshold = 0.7,
}: {
  side: WallSide
  width: number
  height: number
  length: number
  tint: string
  texMaps: TexMaps
  thickness?: number
  hideThreshold?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const normalVec = useMemo(() => new THREE.Vector3(...WALL_NORMAL[side]), [side])
  const tmpVec = useMemo(() => new THREE.Vector3(), [])
  const isWallSide = side !== 'top' && side !== 'bottom'

  const { args, position } = useMemo(() => {
    switch (side) {
      case 'front':
        return {
          args: [thickness, height, width] as [number, number, number],
          position: [length / 2, height / 2, 0] as [number, number, number],
        }
      case 'back':
        return {
          args: [thickness, height, width] as [number, number, number],
          position: [-length / 2, height / 2, 0] as [number, number, number],
        }
      case 'right':
        return {
          args: [length, height, thickness] as [number, number, number],
          position: [0, height / 2, width / 2] as [number, number, number],
        }
      case 'left':
        return {
          args: [length, height, thickness] as [number, number, number],
          position: [0, height / 2, -width / 2] as [number, number, number],
        }
      case 'top':
        return {
          args: [length, thickness, width] as [number, number, number],
          position: [0, height, 0] as [number, number, number],
        }
      case 'bottom':
        return {
          args: [length, thickness, width] as [number, number, number],
          position: [0, 0, 0] as [number, number, number],
        }
    }
  }, [side, width, height, length, thickness])

  useFrame(({ camera }) => {
    if (!matRef.current || !isWallSide) return
    tmpVec.copy(camera.position).normalize()
    const d = tmpVec.dot(normalVec)
    const fadeT = Math.max(0, Math.min(1, (d - hideThreshold) / (1 - hideThreshold)))
    const targetOpacity = THREE.MathUtils.lerp(1.0, 0.18, fadeT)
    const targetTrans = fadeT * 0.92
    const targetRough = THREE.MathUtils.lerp(0.7, 0.08, fadeT)
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.2)
    matRef.current.transmission = THREE.MathUtils.lerp(matRef.current.transmission, targetTrans, 0.2)
    matRef.current.roughness = THREE.MathUtils.lerp(matRef.current.roughness, targetRough, 0.2)
  })

  const ownTexMaps = useMemo(() => {
    const density = 2.2
    let repeatX = 1
    let repeatY = 1
    switch (side) {
      case 'front':
      case 'back':
        repeatX = width * density
        repeatY = height * density
        break
      case 'left':
      case 'right':
        repeatX = length * density
        repeatY = height * density
        break
      case 'top':
      case 'bottom':
        repeatX = length * density
        repeatY = width * density
        break
    }
    const clone = (t: THREE.Texture) => {
      const c = t.clone()
      c.needsUpdate = true
      c.wrapS = THREE.RepeatWrapping
      c.wrapT = THREE.RepeatWrapping
      c.repeat.set(Math.max(1, repeatX), Math.max(1, repeatY))
      return c
    }
    return {
      color: clone(texMaps.color),
      normal: clone(texMaps.normal),
      roughness: clone(texMaps.roughness),
      ao: clone(texMaps.ao),
      displacement: clone(texMaps.displacement),
    }
  }, [side, width, height, length, texMaps])

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[args[0], args[1], args[2], 32, 32, 4]} />
      <meshPhysicalMaterial
        ref={matRef}
        color={tint}
        map={ownTexMaps.color}
        normalMap={ownTexMaps.normal}
        normalScale={new THREE.Vector2(2.6, 2.6)}
        roughnessMap={ownTexMaps.roughness}
        aoMap={ownTexMaps.ao}
        displacementMap={ownTexMaps.displacement}
        displacementScale={0.12}
        displacementBias={-0.06}
        roughness={0.7}
        metalness={0.82}
        envMapIntensity={1.6}
        transparent
        opacity={1}
        transmission={0}
        ior={1.45}
        thickness={0.05}
        clearcoat={0.15}
        clearcoatRoughness={0.55}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function CornerCastings({
  width,
  height,
  length,
}: {
  width: number
  height: number
  length: number
}) {
  const sz = 0.18
  const xL = -length / 2 - sz / 2 + 0.04
  const xR = length / 2 + sz / 2 - 0.04
  const zL = -width / 2 - sz / 2 + 0.04
  const zR = width / 2 + sz / 2 - 0.04
  const yT = height + sz / 2 - 0.04
  const yB = sz / 2 - 0.04
  const positions: [number, number, number][] = [
    [xL, yB, zL], [xR, yB, zL], [xL, yB, zR], [xR, yB, zR],
    [xL, yT, zL], [xR, yT, zL], [xL, yT, zR], [xR, yT, zR],
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[sz, sz, sz]} />
          <meshPhysicalMaterial
            color="#0F1218"
            metalness={0.9}
            roughness={0.45}
            envMapIntensity={1.0}
            clearcoat={0.2}
          />
        </mesh>
      ))}
    </>
  )
}

/** Bisagras + palanca de cierre para una hoja de puerta · componente
 *  declarado fuera de ContainerDoors (regla react-hooks/static-components). */
function HingeBar({
  z,
  x,
  doorHeight,
}: {
  z: number
  x: number
  doorHeight: number
}) {
  return (
    <>
      {[0.18, 0.5, 0.82].map((t, i) => (
        <mesh key={i} position={[x - 0.04, doorHeight * t, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 12]} />
          <meshPhysicalMaterial
            color="#1a1a1a"
            metalness={0.85}
            roughness={0.4}
            envMapIntensity={1.0}
          />
        </mesh>
      ))}
      <mesh position={[x - 0.05, doorHeight * 0.55, z]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, doorHeight * 0.7, 10]} />
        <meshPhysicalMaterial
          color="#2a2a2a"
          metalness={0.7}
          roughness={0.55}
          envMapIntensity={0.9}
        />
      </mesh>
    </>
  )
}

function ContainerDoors({
  width,
  height,
  length,
  tint,
}: {
  width: number
  height: number
  length: number
  tint: string
}) {
  const doorWidth = width / 2 - 0.03
  const doorHeight = height - 0.04
  const x = -length / 2 - 0.03
  const zLeft = -width / 4 - 0.005
  const zRight = width / 4 + 0.005
  const yCenter = height / 2

  return (
    <>
      <mesh position={[x, yCenter, zLeft]} castShadow receiveShadow>
        <boxGeometry args={[0.03, doorHeight, doorWidth]} />
        <meshPhysicalMaterial
          color={tint}
          metalness={0.78}
          roughness={0.5}
          envMapIntensity={1.2}
          clearcoat={0.15}
          clearcoatRoughness={0.55}
        />
      </mesh>
      <HingeBar z={zLeft} x={x} doorHeight={doorHeight} />
      <mesh position={[x, yCenter, zRight]} castShadow receiveShadow>
        <boxGeometry args={[0.03, doorHeight, doorWidth]} />
        <meshPhysicalMaterial
          color={tint}
          metalness={0.78}
          roughness={0.5}
          envMapIntensity={1.2}
          clearcoat={0.15}
          clearcoatRoughness={0.55}
        />
      </mesh>
      <HingeBar z={zRight} x={x} doorHeight={doorHeight} />
    </>
  )
}

function RealisticContainer({
  width,
  height,
  length,
  tint,
}: {
  width: number
  height: number
  length: number
  tint: string
}) {
  const texMaps = useTexture({
    color: CONTAINER_TEXTURE_PATHS.color,
    normal: CONTAINER_TEXTURE_PATHS.normal,
    roughness: CONTAINER_TEXTURE_PATHS.roughness,
    ao: CONTAINER_TEXTURE_PATHS.ao,
    displacement: CONTAINER_TEXTURE_PATHS.displacement,
  })

  const configured = useMemo(() => {
    const clone = (t: THREE.Texture, asColor = false): THREE.Texture => {
      const c = t.clone()
      c.wrapS = THREE.RepeatWrapping
      c.wrapT = THREE.RepeatWrapping
      if (asColor) c.colorSpace = THREE.SRGBColorSpace
      c.needsUpdate = true
      return c
    }
    return {
      color: clone(texMaps.color, true),
      normal: clone(texMaps.normal),
      roughness: clone(texMaps.roughness),
      ao: clone(texMaps.ao),
      displacement: clone(texMaps.displacement),
    }
  }, [texMaps])

  const softTint = useMemo(() => lightenColor(tint, 0.15), [tint])

  const sides: WallSide[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

  return (
    <group position={[0, 0, 0]}>
      {sides.map((side) => (
        <ContainerWall
          key={side}
          side={side}
          width={width}
          height={height}
          length={length}
          tint={softTint}
          texMaps={configured}
        />
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Cajas DPP · BoxGeometry con textura cartón corrugado procedural (PRNG
// determinista para cumplir react-hooks/purity).
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
    </mesh>
  )
}

function CargoItems({
  packedItems,
  colorById,
  scale,
  containerWidth,
  containerLength,
}: {
  packedItems: readonly PackedItem3D[]
  colorById: Map<string, string>
  scale: number
  containerWidth: number
  containerLength: number
}) {
  const cardboardTex = useCardboardTexture()
  return (
    <>
      {packedItems.map((item) => {
        const originalId = item.name.split('_').slice(0, -1).join('_')
        const color = colorById.get(originalId) ?? '#c89860'
        // binpackingjs convenio: bin.width × height × depth · position [x,y,z]
        // donde x ∈ [0, bin.width], y ∈ [0, bin.height], z ∈ [0, bin.depth].
        // dimension[w, h, d] son las dimensiones DEL ITEM tras rotación.
        const [px, py, pz] = item.position
        const [dw, dh, dd] = item.dimension
        // Mapeo a three.js · contenedor centrado en (0, 0, 0):
        // - bin.depth (mm) ↔ three.js eje X (longitudinal · containerLength m)
        // - bin.height ↔ three.js eje Y (vertical · containerHeight)
        // - bin.width ↔ three.js eje Z (lateral · containerWidth)
        // Posicionamos el centro del bulto y centramos contra el contenedor.
        const centerX = (pz + dd / 2) * scale - containerLength / 2
        const centerY = (py + dh / 2) * scale
        const centerZ = (px + dw / 2) * scale - containerWidth / 2
        return (
          <RealisticCargoBox
            key={item.name}
            size={[dd * scale, dh * scale, dw * scale]}
            position={[centerX, centerY, centerZ]}
            color={color}
            cardboardTex={cardboardTex}
          />
        )
      })}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HUD glassmorphism overlay · top bar + paneles laterales
// ════════════════════════════════════════════════════════════════════════════

interface CargoMetrics {
  occupancyPct: number
  weightKg: number
  weightMaxKg: number
  itemCount: number
  unfitCount: number
  freeVolumeM3: number
}

function HoloCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-cyan-400/25 bg-slate-950/60 px-5 py-4 shadow-[0_0_40px_-12px_rgba(0,242,255,0.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  )
}

function KPI({
  label,
  value,
  unit,
  tone = 'normal',
}: {
  label: string
  value: string | number
  unit?: string
  tone?: 'normal' | 'warn' | 'alert'
}) {
  const toneClass =
    tone === 'alert'
      ? 'text-rose-300'
      : tone === 'warn'
      ? 'text-amber-300'
      : 'text-cyan-100'
  return (
    <div className="font-mono">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
        {unit && <span className="ml-1 text-base font-normal text-cyan-100/60">{unit}</span>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════════════

export default function CargoLoadingBridge({
  containerType,
  items,
  orderId,
  routeLabel,
  onClose,
}: CargoLoadingBridgeProps): React.ReactElement | null {
  // ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloquear scroll del body mientras el overlay está abierto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const isVisualizable = isCubicajeContainer(containerType)
  const spec = isVisualizable ? CONTAINER_SPECS[containerType] : null

  const packResult = useMemo(() => {
    if (!spec) return { packedBins: [], unfitItems: [] as Item3D[] }
    const itemsExpanded = expandItems(items)
    const bin = {
      name: spec.type,
      width: spec.inner_width_mm,
      height: spec.inner_height_mm,
      depth: spec.inner_length_mm,
      maxWeight: spec.max_payload_kg,
    }
    try {
      return pack3D({ bins: [bin], items: itemsExpanded })
    } catch (e) {
      console.error('binpackingjs error:', e)
      return { packedBins: [], unfitItems: itemsExpanded }
    }
  }, [items, spec])

  const colorById = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((item, idx) => {
      map.set(item.id, colorForIndex(idx, item.color_hex))
    })
    return map
  }, [items])

  const packedItems: readonly PackedItem3D[] = useMemo(
    () => packResult.packedBins[0]?.items ?? [],
    [packResult],
  )
  const unfitCount = packResult.unfitItems.length

  // Métricas de carga · useMemo ANTES del early return (rules-of-hooks).
  // Si spec es null, devolvemos métricas vacías que no se usarán.
  const metrics: CargoMetrics = useMemo(() => {
    if (!spec) {
      return {
        occupancyPct: 0,
        weightKg: 0,
        weightMaxKg: 0,
        itemCount: 0,
        unfitCount: 0,
        freeVolumeM3: 0,
      }
    }
    const containerVolumeMm3 =
      spec.inner_width_mm * spec.inner_height_mm * spec.inner_length_mm
    let usedVolumeMm3 = 0
    let weightKg = 0
    packedItems.forEach((it) => {
      const [w, h, d] = it.dimension
      usedVolumeMm3 += w * h * d
    })
    items.forEach((it) => {
      weightKg += it.weight_kg * it.quantity
    })
    return {
      occupancyPct: Math.min(100, (usedVolumeMm3 / containerVolumeMm3) * 100),
      weightKg,
      weightMaxKg: spec.max_payload_kg,
      itemCount: packedItems.length,
      unfitCount,
      freeVolumeM3: Math.max(0, (containerVolumeMm3 - usedVolumeMm3) / 1e9),
    }
  }, [items, packedItems, spec, unfitCount])

  // Early return DESPUÉS de todos los hooks.
  if (!isVisualizable || !spec) {
    return null
  }

  const SCALE = 0.001
  const containerWidth = spec.inner_width_mm * SCALE
  const containerHeight = spec.inner_height_mm * SCALE
  const containerLength = spec.inner_length_mm * SCALE

  const overweight = metrics.weightKg > metrics.weightMaxKg
  const hasOverflow = unfitCount > 0
  const hasFreeSpace = metrics.occupancyPct < 75 && !hasOverflow

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950">
      {/* ─── CAPA 0 · Video puerto cinematográfico ─────────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Overlay oscurecido sobre el video para realzar el contenedor + HUD */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/15 to-slate-950/65" />

      {/* ─── CAPA 1 · Canvas R3F transparente con contenedor PBR + cajas ───── */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [
              containerLength * 1.6,
              containerHeight * 1.4,
              -containerWidth * 3.4,
            ],
            fov: 38,
          }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          {/* Iluminación cálida atardecer (el ambiente lo da el vídeo) */}
          <ambientLight intensity={0.4} color="#A8C5E8" />
          <directionalLight
            position={[containerLength * 1.5, containerHeight * 3, -containerWidth * 4]}
            intensity={3.2}
            color="#FFD2A0"
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
          <directionalLight
            position={[-containerLength * 1.5, containerHeight * 2.5, containerWidth * 3]}
            intensity={0.9}
            color="#A0C8FF"
          />

          <Suspense fallback={null}>
            <RealisticContainer
              width={containerWidth}
              height={containerHeight}
              length={containerLength}
              tint={spec.color_hex}
            />
          </Suspense>

          <Suspense fallback={null}>
            <CargoItems
              packedItems={packedItems}
              colorById={colorById}
              scale={SCALE}
              containerWidth={containerWidth}
              containerLength={containerLength}
            />
          </Suspense>

          <CornerCastings
            width={containerWidth}
            height={containerHeight}
            length={containerLength}
          />

          <ContainerDoors
            width={containerWidth}
            height={containerHeight}
            length={containerLength}
            tint={spec.color_hex}
          />

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={containerLength * 8}
            target={[0, containerHeight * 0.45, 0]}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.05}
          />

          <EffectComposer multisampling={0} enableNormalPass>
            <N8AO
              aoRadius={containerLength * 0.05}
              intensity={2}
              distanceFalloff={0.5}
              color="#000000"
            />
            <Bloom
              luminanceThreshold={0.85}
              luminanceSmoothing={0.4}
              intensity={0.5}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.2} darkness={0.55} />
            <SMAA />
          </EffectComposer>
        </Canvas>
      </div>

      {/* ─── CAPA 2 · HUD glassmorphism ───────────────────────────────────── */}
      {/* Top bar · identificación del pedido + cerrar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <HoloCard className="pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 ring-1 ring-cyan-400/50">
              <span className="font-mono text-xs text-cyan-300">⚓</span>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/70">
                Modo Carga en Muelle · {spec.display_name}
              </div>
              <div className="mt-0.5 font-mono text-base text-cyan-100">
                {orderId ?? 'Pedido sin ID'}{' '}
                <span className="text-cyan-100/60">· {routeLabel ?? 'Sin ruta'}</span>
              </div>
            </div>
          </div>
        </HoloCard>

        <button
          onClick={onClose}
          aria-label="Cerrar Modo Carga"
          className="pointer-events-auto rounded-full border border-cyan-400/30 bg-slate-950/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-100 backdrop-blur-md transition hover:border-cyan-300 hover:bg-slate-900/80 hover:text-cyan-50"
        >
          × Cerrar · ESC
        </button>
      </div>

      {/* Panel izquierdo · KPIs operativos */}
      <div className="pointer-events-none absolute left-5 top-1/2 z-20 -translate-y-1/2 space-y-3">
        <HoloCard className="w-72">
          <div className="space-y-4">
            <KPI
              label="Ocupación volumétrica"
              value={metrics.occupancyPct.toFixed(1)}
              unit="%"
              tone={metrics.occupancyPct > 95 ? 'warn' : 'normal'}
            />
            <div className="h-px bg-cyan-400/10" />
            <KPI
              label="Peso de carga"
              value={metrics.weightKg.toLocaleString('es-ES')}
              unit={`/ ${metrics.weightMaxKg.toLocaleString('es-ES')} kg`}
              tone={overweight ? 'alert' : metrics.weightKg / metrics.weightMaxKg > 0.9 ? 'warn' : 'normal'}
            />
            <div className="h-px bg-cyan-400/10" />
            <KPI
              label="Bultos cargados"
              value={metrics.itemCount}
              tone="normal"
            />
            {hasOverflow && (
              <>
                <div className="h-px bg-cyan-400/10" />
                <KPI
                  label="Sin cabida"
                  value={unfitCount}
                  unit="bulto(s)"
                  tone="alert"
                />
              </>
            )}
            {hasFreeSpace && (
              <>
                <div className="h-px bg-cyan-400/10" />
                <KPI
                  label="Espacio libre"
                  value={metrics.freeVolumeM3.toFixed(1)}
                  unit="m³"
                  tone="warn"
                />
              </>
            )}
          </div>
        </HoloCard>

        {/* Alertas / acciones grupaje · commit C+E las desarrollarán */}
        {hasOverflow && (
          <HoloCard className="w-72 border-rose-400/40 shadow-[0_0_40px_-12px_rgba(244,63,94,0.45)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
              ⚠ Sobrecarga detectada
            </div>
            <p className="mt-2 text-xs leading-relaxed text-rose-100">
              {unfitCount} bulto(s) no caben en este contenedor. Sistema buscará
              automáticamente otro contenedor compatible (mismo destino + puerto +
              fecha) para grupaje (LCL).
            </p>
            <button
              className="mt-3 w-full rounded-md border border-rose-400/40 bg-rose-500/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-rose-100 transition hover:bg-rose-500/25"
              disabled
            >
              Buscar contenedor compatible →
            </button>
            <p className="mt-2 font-mono text-[9px] text-rose-200/70">
              · subject_to_expert · matching lógico Fase 8
            </p>
          </HoloCard>
        )}
        {hasFreeSpace && (
          <HoloCard className="w-72 border-amber-400/40 shadow-[0_0_40px_-12px_rgba(251,191,36,0.45)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
              ◆ Sobre-espacio disponible
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-100">
              Queda {metrics.freeVolumeM3.toFixed(1)} m³ libre. Puedes ofrecer este
              espacio a otros pedidos con mismo destino y obtener descuento por
              grupaje (reparto entre comprador, vendedor y transitario).
            </p>
            <button
              className="mt-3 w-full rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-500/25"
              disabled
            >
              Ofrecer espacio en grupaje →
            </button>
            <p className="mt-2 font-mono text-[9px] text-amber-200/70">
              · subject_to_expert · cálculo descuento Fase 8
            </p>
          </HoloCard>
        )}
      </div>

      {/* Panel derecho · acción principal · CONFIRMAR & generar mapa de carga */}
      <div className="pointer-events-none absolute right-5 top-1/2 z-20 -translate-y-1/2 space-y-3">
        <HoloCard className="w-72">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
            Instrucciones
          </div>
          <ul className="mt-3 space-y-2 font-mono text-[11px] text-cyan-100/80">
            <li>· Arrastra para rotar el contenedor</li>
            <li>· Scroll para acercar/alejar</li>
            <li>· Paredes se transparentan según ángulo</li>
            <li>· Cajas dispuestas por bin-packing</li>
          </ul>
          <button
            className="pointer-events-auto mt-5 w-full rounded-md border border-cyan-400/50 bg-cyan-500/15 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/25"
            disabled
          >
            ✓ Confirmar carga · generar mapa
          </button>
          <p className="mt-2 font-mono text-[9px] text-cyan-200/70">
            · PDF + JSON + correo interno Actor-ID · Fase G
          </p>
        </HoloCard>
      </div>

      {/* Bottom · firma + estado audit */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
          1503 · operación logística · audit-ready by design
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300/60">
          ADR 0007 · Capa 2 · cubicaje marítimo + terrestre
        </div>
      </div>
    </div>
  )
}
