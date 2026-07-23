'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

/** Textura radial (disco con halo) para que los puntos sean REDONDOS y con
 *  glow, no cuadraditos. Cliente-only (usa canvas 2D). */
function makeDotTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const s = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(cv)
  tex.needsUpdate = true
  return tex
}

/**
 * Globo terráqueo wireframe digital monocromo azul, wallpaper de la home.
 *
 * REVELADO "la constelación se vuelve globo" (marca 1503 · "el comercio se
 * volvió orden"):
 *  - Fase 0 (deriva): una nube de ~2200 partículas flota dispersa en el espacio
 *    (la red del comercio global), con deriva suave.
 *  - Fase 1 (convergencia): las partículas vuelan hacia dentro y se POSAN sobre
 *    la superficie de la esfera (ease in-out). Al formarse, el cuerpo del globo
 *    + contornos de países + rejilla se ENCIENDEN (fade), un destello aditivo
 *    marca el instante, y la rotación arranca con rampa.
 *  - Fase 2 (vivo): globo girando, partículas como polvo de superficie, arcos
 *    great-circle dorados entre hubs (flujo comercial).
 *  Respeta `prefers-reduced-motion`: arranca ya formado, sin convergencia.
 *
 *  - Contornos de países desde TopoJSON Natural Earth (50m).
 *  - Esfera densa muy oscura para que las líneas resalten.
 *  - Rotación suave sobre eje Y (1 vuelta cada ~2 min) una vez formado.
 */

const RADIUS = 2
const ROTATION_SPEED = 0.05 // rad/s ≈ 1 vuelta cada 2min (a plena rampa)

const COLOR_LINE = '#00A3FF'
const COLOR_LINE_DIM = '#1F4F80'
const COLOR_PULSE = '#F0B429' // dorado · pulso de flujo comercial (mismo que ContinentsGraph)
const COLOR_BG_SPHERE = '#020409'
const COLOR_PARTICLE = '#00A3FF'
const COLOR_FLASH = '#7FD4FF'

// ── Línea de tiempo del revelado (segundos desde el montaje del Canvas) ──
const T_DRIFT_END = 1.1 // (default) la constelación deriva sola hasta aquí
const CONVERGE_DUR = 2.0 // s que tarda la constelación en formar el globo
const PARTICLE_COUNT = 2200

/** Progreso compartido del revelado (mutado por RevealController cada frame). */
type Reveal = {
  conv: number // 0..1 convergencia de partículas (scatter → superficie)
  formed: number // 0..1 opacidad del globo (cuerpo + contornos + rejilla + arcos)
  rot: number // 0..1 rampa de rotación
  flash: number // 0..1 destello de formación
}

const HUBS: { name: string; lat: number; lon: number }[] = [
  { name: 'Madrid', lat: 40.4, lon: -3.7 },
  { name: 'New York', lat: 40.7, lon: -74.0 },
  { name: 'São Paulo', lat: -23.5, lon: -46.6 },
  { name: 'Cape Town', lat: -33.9, lon: 18.4 },
  { name: 'Dubai', lat: 25.2, lon: 55.3 },
  { name: 'Singapore', lat: 1.35, lon: 103.8 },
  { name: 'Tokyo', lat: 35.7, lon: 139.7 },
  { name: 'Sydney', lat: -33.9, lon: 151.2 },
]

const ACTIVE_PAYMENTS = 6 // bolitas simultáneas en vuelo
const ROUTE_DURATION = 3 // s — ritmo de la animación de flujo
const ARC_HEIGHT = 0.35

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

function buildArcCurve(from: THREE.Vector3, to: THREE.Vector3): THREE.QuadraticBezierCurve3 {
  const mid = from.clone().add(to).multiplyScalar(0.5)
  const distance = from.distanceTo(to)
  const liftFactor = 1 + ARC_HEIGHT * (distance / (2 * RADIUS))
  mid.normalize().multiplyScalar(RADIUS * liftFactor)
  return new THREE.QuadraticBezierCurve3(from, mid, to)
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

// ─── Continentes desde TopoJSON ──────────────────────────────────

function useCountryLines() {
  const [lines, setLines] = useState<THREE.BufferGeometry[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/data/countries-50m.json')
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return
        const fc = feature(
          topo,
          topo.objects.countries as GeometryCollection,
        ) as unknown as { features: Feature<Polygon | MultiPolygon>[] }

        const geos: THREE.BufferGeometry[] = []
        const SEGS_PER_EDGE = 6 // subdivide cada borde para que se curve sobre la esfera

        for (const f of fc.features) {
          const geom = f.geometry
          const polygons: number[][][][] =
            geom.type === 'Polygon'
              ? [geom.coordinates as number[][][]]
              : (geom.coordinates as number[][][][])

          for (const polygon of polygons) {
            for (const ring of polygon) {
              const points: THREE.Vector3[] = []
              for (let i = 0; i < ring.length - 1; i++) {
                const [lon1, lat1] = ring[i]
                const [lon2, lat2] = ring[i + 1]
                for (let s = 0; s < SEGS_PER_EDGE; s++) {
                  const t = s / SEGS_PER_EDGE
                  const lat = lat1 + (lat2 - lat1) * t
                  const lon = lon1 + (lon2 - lon1) * t
                  points.push(latLonToVec3(lat, lon, RADIUS * 1.003))
                }
              }
              const last = ring[ring.length - 1]
              points.push(latLonToVec3(last[1], last[0], RADIUS * 1.003))

              if (points.length > 1) {
                geos.push(new THREE.BufferGeometry().setFromPoints(points))
              }
            }
          }
        }

        setLines(geos)
      })
      .catch((e) => console.error('Failed to load TopoJSON', e))

    return () => {
      cancelled = true
    }
  }, [])

  return lines
}

/** Contornos de países. Comparten UNA sola material para poder fundir el
 *  encendido (opacidad) de todas las líneas a la vez desde el controlador. */
function CountryOutlines({ matRef }: { matRef: React.RefObject<THREE.LineBasicMaterial | null> }) {
  const lines = useCountryLines()
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: COLOR_LINE, transparent: true, opacity: 0 }),
    [],
  )
  useEffect(() => {
    matRef.current = material
  }, [material, matRef])

  return (
    <>
      {lines.map((geo, i) => (
        <line key={i}>
          <primitive attach="geometry" object={geo} />
          <primitive attach="material" object={material} />
        </line>
      ))}
    </>
  )
}

// ─── Meridianos / paralelos discretos como rejilla muy tenue ─────

function GridLines({ matRef }: { matRef: React.RefObject<THREE.LineBasicMaterial | null> }) {
  const geos = useMemo(() => {
    const meridianCount = 12
    const parallelCount = 5
    const segPerLine = 64
    const list: THREE.BufferGeometry[] = []
    for (let m = 0; m < meridianCount; m++) {
      const lon = (m / meridianCount) * 360 - 180
      const points: THREE.Vector3[] = []
      for (let s = 0; s <= segPerLine; s++) {
        const lat = -90 + (s / segPerLine) * 180
        points.push(latLonToVec3(lat, lon, RADIUS * 0.999))
      }
      list.push(new THREE.BufferGeometry().setFromPoints(points))
    }
    for (let p = 1; p <= parallelCount; p++) {
      const lat = -75 + ((p - 1) / (parallelCount - 1)) * 150
      const points: THREE.Vector3[] = []
      for (let s = 0; s <= segPerLine; s++) {
        const lon = -180 + (s / segPerLine) * 360
        points.push(latLonToVec3(lat, lon, RADIUS * 0.999))
      }
      list.push(new THREE.BufferGeometry().setFromPoints(points))
    }
    return list
  }, [])

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: COLOR_LINE_DIM, transparent: true, opacity: 0 }),
    [],
  )
  useEffect(() => {
    matRef.current = material
  }, [material, matRef])

  return (
    <>
      {geos.map((geo, i) => (
        <line key={i}>
          <primitive attach="geometry" object={geo} />
          <primitive attach="material" object={material} />
        </line>
      ))}
    </>
  )
}

// ─── Constelación → globo: nube de partículas que converge a la superficie ──

function ConstellationReveal({ reveal }: { reveal: React.MutableRefObject<Reveal> }) {
  const { geo, scatter, target, drift, material } = useMemo(() => {
    const scatter = new Float32Array(PARTICLE_COUNT * 3)
    const target = new Float32Array(PARTICLE_COUNT * 3)
    const drift = new Float32Array(PARTICLE_COUNT * 3) // fase/amplitud de deriva por partícula
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      // Destino: punto distribuido uniformemente sobre la esfera (superficie).
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const rr = RADIUS * 1.004
      target[ix] = rr * Math.sin(phi) * Math.cos(theta)
      target[ix + 1] = rr * Math.cos(phi)
      target[ix + 2] = rr * Math.sin(phi) * Math.sin(theta)
      // Origen disperso: concha esférica amplia alrededor (la red dispersa).
      const sr = 3.6 + Math.random() * 4.4
      const st = Math.random() * Math.PI * 2
      const sp = Math.acos(2 * Math.random() - 1)
      scatter[ix] = sr * Math.sin(sp) * Math.cos(st)
      scatter[ix + 1] = sr * Math.cos(sp)
      scatter[ix + 2] = sr * Math.sin(sp) * Math.sin(st)
      drift[ix] = Math.random() * Math.PI * 2
      drift[ix + 1] = 0.25 + Math.random() * 0.85
      drift[ix + 2] = Math.random() * Math.PI * 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(scatter.slice(), 3))
    const dot = makeDotTexture()
    const material = new THREE.PointsMaterial({
      color: COLOR_PARTICLE,
      map: dot ?? undefined,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return { geo, scatter, target, drift, material }
  }, [])

  useFrame(({ clock }) => {
    const conv = reveal.current.conv
    const e = easeInOutCubic(conv)
    const driftAmp = (1 - conv) * 0.28
    const time = clock.getElapsedTime()
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      const iy = ix + 1
      const iz = ix + 2
      const dx = Math.sin(time * drift[iy] + drift[ix]) * driftAmp
      const dy = Math.cos(time * drift[iy] * 0.8 + drift[iz]) * driftAmp
      const sx = scatter[ix] + dx
      const sy = scatter[iy] + dy
      const sz = scatter[iz] + dx
      arr[ix] = sx + (target[ix] - sx) * e
      arr[iy] = sy + (target[iy] - sy) * e
      arr[iz] = sz + (target[iz] - sz) * e
    }
    pos.needsUpdate = true
    // Tras formarse, las partículas bajan a "polvo de superficie" y dejan
    // protagonismo a los contornos de país.
    material.opacity = 0.9 * (1 - reveal.current.formed * 0.6)
  })

  return (
    <points>
      <primitive attach="geometry" object={geo} />
      <primitive attach="material" object={material} />
    </points>
  )
}

/** Destello aditivo en el centro que marca el instante de formación. */
function FormationFlash({ reveal }: { reveal: React.MutableRefObject<Reveal> }) {
  const ref = useRef<THREE.Mesh>(null!)
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: COLOR_FLASH,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )
  useFrame(() => {
    const f = reveal.current.flash
    ref.current.scale.setScalar(RADIUS * (0.55 + f * 1.5))
    material.opacity = f * 0.45
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

// ─── Pagos: bolitas aleatorias viajando entre hubs ───────────────

function pickRandomRoute(avoidFrom?: number, avoidTo?: number): { from: number; to: number } {
  const from = (() => {
    let f = Math.floor(Math.random() * HUBS.length)
    if (avoidFrom !== undefined && f === avoidFrom) f = (f + 1) % HUBS.length
    return f
  })()
  let to = Math.floor(Math.random() * HUBS.length)
  while (to === from || to === avoidTo) to = (to + 1) % HUBS.length
  return { from, to }
}

function PaymentArcs({
  reveal,
  pulseColor,
}: {
  reveal: React.MutableRefObject<Reveal>
  pulseColor: string
}) {
  return (
    <>
      {Array.from({ length: ACTIVE_PAYMENTS }).map((_, i) => (
        <PaymentArc key={i} slotIndex={i} reveal={reveal} pulseColor={pulseColor} />
      ))}
    </>
  )
}

function PaymentArc({
  slotIndex,
  reveal,
  pulseColor,
}: {
  slotIndex: number
  reveal: React.MutableRefObject<Reveal>
  pulseColor: string
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const haloRef = useRef<THREE.Mesh>(null!)

  // Estado del slot mantenido en refs (sin re-render).
  const stateRef = useRef<{
    fromIdx: number
    toIdx: number
    startTime: number
    curve: THREE.QuadraticBezierCurve3
  }>(null!)

  if (stateRef.current === null) {
    const r = pickRandomRoute()
    stateRef.current = {
      fromIdx: r.from,
      toIdx: r.to,
      // Stagger inicial: cada slot empieza desfasado
      startTime: -((slotIndex / ACTIVE_PAYMENTS) * ROUTE_DURATION),
      curve: buildArcCurve(
        latLonToVec3(HUBS[r.from].lat, HUBS[r.from].lon, RADIUS * 1.005),
        latLonToVec3(HUBS[r.to].lat, HUBS[r.to].lon, RADIUS * 1.005),
      ),
    }
  }

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime()
    const elapsed = now - stateRef.current.startTime

    if (elapsed > ROUTE_DURATION) {
      // Trayecto terminado: nueva ruta aleatoria evitando misma origen/destino consecutivo
      const r = pickRandomRoute(stateRef.current.fromIdx, stateRef.current.toIdx)
      stateRef.current.fromIdx = r.from
      stateRef.current.toIdx = r.to
      stateRef.current.startTime = now
      stateRef.current.curve = buildArcCurve(
        latLonToVec3(HUBS[r.from].lat, HUBS[r.from].lon, RADIUS * 1.005),
        latLonToVec3(HUBS[r.to].lat, HUBS[r.to].lon, RADIUS * 1.005),
      )
      return
    }

    const t = elapsed / ROUTE_DURATION
    const point = stateRef.current.curve.getPointAt(Math.max(0, t))

    if (meshRef.current) meshRef.current.position.copy(point)
    if (haloRef.current) haloRef.current.position.copy(point)

    let scale = 1
    if (t > 0.42 && t < 0.58) {
      const localT = (t - 0.42) / 0.16
      scale = 1 + Math.sin(localT * Math.PI) * 0.6
    }

    let opacity = 1
    if (t < 0) opacity = 0
    else if (t < 0.1) opacity = t / 0.1
    else if (t > 0.9) opacity = (1 - t) / 0.1
    // Los arcos solo aparecen una vez formado el globo.
    opacity *= reveal.current.formed

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale)
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
    }
    if (haloRef.current) {
      haloRef.current.scale.setScalar(scale * 1.6)
      ;(haloRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.28
    }
  })

  return (
    <>
      {/* Halo sutil */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial
          color={pulseColor}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Núcleo */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={pulseColor} transparent opacity={0} />
      </mesh>
    </>
  )
}

// ─── Estrellas de fondo muy sutiles ──────────────────────────────

function StarField() {
  // Math.random aquí es deliberado: estrellas con distribución aleatoria
  // diferente cada montaje. El useMemo cachea el resultado, así que no se
  // re-evalúa entre renders. La regla `react-hooks/purity` lo marca pero
  // no es un problema de pureza real.
  /* eslint-disable react-hooks/purity */
  const geo = useMemo(() => {
    const count = 800
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 20
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])
  /* eslint-enable react-hooks/purity */

  const dot = useMemo(makeDotTexture, [])

  return (
    <points>
      <primitive attach="geometry" object={geo} />
      <pointsMaterial
        color="#9FB6CC"
        map={dot ?? undefined}
        size={0.09}
        sizeAttenuation
        transparent
        depthWrite={false}
        opacity={0.55}
      />
    </points>
  )
}

// ─── Controlador del revelado: muta el progreso compartido cada frame ──

function RevealController({
  reveal,
  sphereMatRef,
  countryMatRef,
  gridMatRef,
  reduced,
  revealStart,
}: {
  reveal: React.MutableRefObject<Reveal>
  sphereMatRef: React.RefObject<THREE.MeshBasicMaterial | null>
  countryMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  gridMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  reduced: boolean
  revealStart: number
}) {
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    let conv: number
    let formed: number
    let rot: number
    let flash: number

    if (reduced) {
      conv = 1
      formed = 1
      rot = 1
      flash = 0
    } else {
      const c = THREE.MathUtils.clamp((t - revealStart) / CONVERGE_DUR, 0, 1)
      conv = c
      // El cuerpo del globo se enciende en el último tramo de la convergencia.
      formed = THREE.MathUtils.clamp((c - 0.55) / 0.45, 0, 1)
      // Rotación arranca con rampa suave una vez casi formado.
      rot = easeOutCubic(THREE.MathUtils.clamp((c - 0.6) / 0.4, 0, 1))
      // Destello con pico cerca de c≈0.82.
      const f = THREE.MathUtils.clamp(1 - Math.abs(c - 0.82) / 0.18, 0, 1)
      flash = f * f
    }

    reveal.current.conv = conv
    reveal.current.formed = formed
    reveal.current.rot = rot
    reveal.current.flash = flash

    if (sphereMatRef.current) {
      sphereMatRef.current.opacity = 0.9 * formed
      sphereMatRef.current.depthWrite = formed > 0.02
    }
    if (countryMatRef.current) countryMatRef.current.opacity = 0.55 * formed
    if (gridMatRef.current) gridMatRef.current.opacity = 0.18 * formed
  })
  return null
}

// ─── Grupo rotatorio ─────────────────────────────────────────────

function Globe({
  reveal,
  pulseColor,
  revealStart,
}: {
  reveal: React.MutableRefObject<Reveal>
  pulseColor: string
  revealStart: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const sphereMatRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const countryMatRef = useRef<THREE.LineBasicMaterial | null>(null)
  const gridMatRef = useRef<THREE.LineBasicMaterial | null>(null)

  const reduced = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * ROTATION_SPEED * reveal.current.rot
  })

  return (
    <>
      <RevealController
        reveal={reveal}
        sphereMatRef={sphereMatRef}
        countryMatRef={countryMatRef}
        gridMatRef={gridMatRef}
        reduced={reduced}
        revealStart={revealStart}
      />
      <group ref={groupRef} rotation={[0, 0, 0.41]}>
        <mesh>
          <sphereGeometry args={[RADIUS * 0.998, 96, 96]} />
          <meshBasicMaterial
            ref={sphereMatRef}
            color={COLOR_BG_SPHERE}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        <GridLines matRef={gridMatRef} />
        <CountryOutlines matRef={countryMatRef} />
        <ConstellationReveal reveal={reveal} />
        <FormationFlash reveal={reveal} />
        <PaymentArcs reveal={reveal} pulseColor={pulseColor} />
      </group>
    </>
  )
}

// ─── Wrapper exportado ────────────────────────────────────────────

/**
 * mode='fixed' → cubre todo el viewport (uso en /preview/globo).
 * mode='absolute' → ocupa al 100% del padre relative (uso en home, dentro
 *   del hero section). Al hacer scroll, queda fuera de viewport con el
 *   section, no flota sobre el resto de la página.
 */
export default function WorldGlobeWireframe({
  mode = 'absolute',
  opacity = 1,
  cameraDistance = 7,
  monochrome = false,
  revealStart = T_DRIFT_END,
}: {
  mode?: 'fixed' | 'absolute'
  opacity?: number
  cameraDistance?: number
  /** true → sin dorado: el pulso de flujo va en cian/blanco (universo monocromo). */
  monochrome?: boolean
  /** Segundos antes de que la constelación empiece a converger en el globo
   *  (la cinemática del voyage lo retrasa para que el globo salga tras las frases). */
  revealStart?: number
}) {
  // Progreso del revelado compartido por toda la escena (ref · sin re-render).
  const reveal = useRef<Reveal>({ conv: 0, formed: 0, rot: 0, flash: 0 })
  const pulseColor = monochrome ? '#9FD8FF' : COLOR_PULSE

  return (
    <div
      aria-hidden
      style={{
        position: mode,
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <StarField />
          <Globe reveal={reveal} pulseColor={pulseColor} revealStart={revealStart} />
        </Suspense>
        {/* Bloom: el glow cinematográfico que separa "real" de "dibujito". */}
        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.75}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
