'use client'

// PBRContainer · contenedor marítimo fotorrealista compartido entre vistas
// --------------------------------------------------------------------------
// Pieza visual reutilizable consumida por:
//   - ContainerLoadView    · vista PEQUEÑA dentro del panel de Pedidos
//   - CargoLoadingBridge   · vista FULLSCREEN "Modo Carga en Muelle"
//
// Construido con MeshPhysicalMaterial + texturas PBR fotorealistas Poly Haven
// CC0 (corrugated_iron_03) + corner castings ISO + puertas modeladas con
// bisagras y palanca. Las paredes laterales se transparentan (cristal-reveal)
// cuando la cámara las enfoca · permite ver la carga interior sin abrir.
//
// Heredado intacto del commit cd736f5 del 28-may. Extraído a archivo común
// el 28-may noche para eliminar duplicación entre los dos consumidores
// (audit-ready by design · canon ADR 0007 §2.3 Capa 2).
//
// Texturas servidas desde /public/textures/container/ (heredadas sesión 28-may).

import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════
// Constantes
// ════════════════════════════════════════════════════════════════════════════

export const CONTAINER_TEXTURE_PATHS = {
  color: '/textures/container/corrugated_iron_03_diff_2k.jpg',
  normal: '/textures/container/corrugated_iron_03_nor_gl_2k.jpg',
  roughness: '/textures/container/corrugated_iron_03_rough_2k.jpg',
  ao: '/textures/container/corrugated_iron_03_ao_2k.jpg',
  displacement: '/textures/container/corrugated_iron_03_disp_2k.png',
} as const

// ════════════════════════════════════════════════════════════════════════════
// Tipos
// ════════════════════════════════════════════════════════════════════════════

export type WallSide = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

interface TexMaps {
  color: THREE.Texture
  normal: THREE.Texture
  roughness: THREE.Texture
  ao: THREE.Texture
  displacement: THREE.Texture
}

const WALL_NORMAL: Record<WallSide, [number, number, number]> = {
  front: [1, 0, 0],
  back: [-1, 0, 0],
  right: [0, 0, 1],
  left: [0, 0, -1],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

export function lightenColor(hex: string, mix: number = 0.7): string {
  const c = new THREE.Color(hex)
  c.lerp(new THREE.Color('#FFFFFF'), mix)
  return '#' + c.getHexString()
}

// ════════════════════════════════════════════════════════════════════════════
// ContainerWall · una pared del contenedor con cristal-reveal por ángulo
// ════════════════════════════════════════════════════════════════════════════

interface ContainerWallProps {
  side: WallSide
  width: number
  height: number
  length: number
  tint: string
  texMaps: TexMaps
  thickness?: number
  hideThreshold?: number
}

function ContainerWall({
  side,
  width,
  height,
  length,
  tint,
  texMaps,
  thickness = 0.04,
  hideThreshold = 0.5,
}: ContainerWallProps) {
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

  // Cristal-reveal · sólo paredes laterales (no techo/suelo). Cada frame
  // compara dirección de la cámara con normal de la pared. Si la cámara
  // enfoca esta pared (dot > umbral), la pared se transparenta para que el
  // operario vea la carga interior sin abrir el contenedor.
  useFrame(({ camera }) => {
    if (!matRef.current || !isWallSide) return
    tmpVec.copy(camera.position).normalize()
    const d = tmpVec.dot(normalVec)
    const fadeT = Math.max(0, Math.min(1, (d - hideThreshold) / (1 - hideThreshold)))
    const targetOpacity = THREE.MathUtils.lerp(1.0, 0.08, fadeT)
    const targetTrans = fadeT * 0.96
    const targetRough = THREE.MathUtils.lerp(0.7, 0.08, fadeT)
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.2)
    matRef.current.transmission = THREE.MathUtils.lerp(matRef.current.transmission, targetTrans, 0.2)
    matRef.current.roughness = THREE.MathUtils.lerp(matRef.current.roughness, targetRough, 0.2)
  })

  // Texturas clonadas por pared para repeat coherente con sus dimensiones.
  // Si compartimos la misma instancia, el último repeat ganaría y unas
  // paredes se verían estiradas.
  const ownTexMaps = useMemo(() => {
    const density = 2.2 // repeticiones por metro
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
      {/* BoxGeometry subdividida 32 segments por dimensión para que el
          displacement map del corrugado pueda desplazar vértices REALES y se
          formen ondulaciones físicas (no solo textura plana). */}
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

// ════════════════════════════════════════════════════════════════════════════
// CornerCastings · 8 piezas de acero negro en las esquinas (canon ISO 1161)
// ════════════════════════════════════════════════════════════════════════════

interface CornerCastingsProps {
  width: number
  height: number
  length: number
}

export function CornerCastings({ width, height, length }: CornerCastingsProps) {
  const sz = 0.18 // tamaño de cada casting (~180mm canónico ISO)
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

// ════════════════════════════════════════════════════════════════════════════
// ContainerDoors · 2 hojas con bisagras (3 por hoja) + palanca vertical
// ════════════════════════════════════════════════════════════════════════════

/** Bisagras + palanca de cierre para una hoja · declarado fuera del padre
 *  para cumplir react-hooks/static-components. */
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

interface ContainerDoorsProps {
  width: number
  height: number
  length: number
  tint: string
}

export function ContainerDoors({ width, height, length, tint }: ContainerDoorsProps) {
  const doorWidth = width / 2 - 0.03
  const doorHeight = height - 0.04
  const x = -length / 2 - 0.03 // ligeramente fuera del back wall
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

// ════════════════════════════════════════════════════════════════════════════
// RealisticContainer · ensambla las 6 paredes con texturas PBR + tinte
// ════════════════════════════════════════════════════════════════════════════

interface RealisticContainerProps {
  width: number
  height: number
  length: number
  tint: string
  /** Paredes que NUNCA se renderizan · uso típico ['front', 'right'] vista en L. */
  hiddenSides?: WallSide[]
}

export function RealisticContainer({
  width,
  height,
  length,
  tint,
  hiddenSides = [],
}: RealisticContainerProps) {
  const texMaps = useTexture({
    color: CONTAINER_TEXTURE_PATHS.color,
    normal: CONTAINER_TEXTURE_PATHS.normal,
    roughness: CONTAINER_TEXTURE_PATHS.roughness,
    ao: CONTAINER_TEXTURE_PATHS.ao,
    displacement: CONTAINER_TEXTURE_PATHS.displacement,
  })

  // Clonamos las texturas devueltas por useTexture en lugar de mutarlas
  // (regla react-hooks/immutability · audit-ready · no compartir state
  // mutable entre componentes que consumen el mismo loader).
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

  // Tinte mezclado con blanco al 15% (color identificativo + permite ver
  // textura PBR del corrugado sin saturar a oscuro).
  const softTint = useMemo(() => lightenColor(tint, 0.15), [tint])

  const sidesToRender: WallSide[] = (
    ['front', 'back', 'left', 'right', 'top', 'bottom'] as WallSide[]
  ).filter((s) => !hiddenSides.includes(s))

  return (
    <group position={[0, 0, 0]}>
      {sidesToRender.map((side) => (
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
