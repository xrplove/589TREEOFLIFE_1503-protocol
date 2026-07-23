'use client'

import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Html, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

/**
 * Tierra REAL — corazón 3D de la cinemática v2 "Travesía 1503 · REAL".
 *
 * v2.1 (feedback de José, 13-jun):
 *  - FUERA el aro atmosférico (quedaba dibujado). El scattering va INTEGRADO en
 *    el shader del planeta (un velo azul sutil solo en el limbo iluminado).
 *  - LA TIERRA ES AZUL: día y noche reales — NASA Blue Marble (océanos azules,
 *    lado día) + NASA Black Marble (luces de ciudades, lado noche), fundidos por
 *    el TERMINADOR (el amanecer/anochecer) con un shader día/noche. El sol entra
 *    desde el este (el Atlántico amanece); la noche americana enseña sus luces.
 *  - FUERA las bolitas-misil: las rutas son ESTELAS de luz fluyendo por el arco
 *    (banda suave recorriendo un tubo, shader por uv), comercio no balística.
 *
 * Texturas (dominio público NASA · eoimages.gsfc.nasa.gov):
 *   public/textures/earth-day.jpg   — Blue Marble Next Gen (world.200412)
 *   public/textures/earth-night.jpg — Black Marble 2016
 */

const R = 2
const ROT_SPEED = 0.0085 // rad/s — deriva orbital casi imperceptible (real)
const ARCS_AT = 7.4 // s — los arcos nacen cuando la frase dice "…es una RED"
const DOLLY_END = 9.5
const CAM_FROM = 13.2
const CAM_TO = 8.3 // globo final algo más pequeño y centrado: deja aire a ambos lados para los nodos

// El sol, fijo en mundo: ilumina desde el este (derecha de cámara) → el limbo
// derecho amanece azul y América queda en noche con las ciudades encendidas.
const SUN_DIR = new THREE.Vector3(1.0, 0.15, 0.1).normalize()

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// Las rutas: la Carrera de Indias (1503) + el comercio global que 1503 une hoy.
const CIUDADES: Record<string, [number, number]> = {
  // — Carrera de Indias + España (maestras) —
  sevilla: [37.39, -5.99],
  cadiz: [36.53, -6.29],
  valencia: [39.47, -0.38],
  veracruz: [19.17, -96.13],
  cartagena: [10.39, -75.51],
  bogota: [4.71, -74.07],
  // — Hubs del comercio global (la red) —
  nuevayork: [40.71, -74.01],
  rotterdam: [51.92, 4.48],
  singapur: [1.35, 103.82],
  shanghai: [31.23, 121.47],
  hamburgo: [53.55, 9.99],
  amberes: [51.26, 4.4],
  genova: [44.41, 8.93],
  pireo: [37.94, 23.64],
  lisboa: [38.72, -9.14],
  losangeles: [33.74, -118.27],
  houston: [29.76, -95.36],
  santos: [-23.96, -46.33],
  buenosaires: [-34.6, -58.38],
  callao: [-12.05, -77.15],
  panama: [8.97, -79.53],
  dubai: [25.27, 55.3],
  mumbai: [18.96, 72.83],
  hongkong: [22.32, 114.17],
  yokohama: [35.44, 139.64],
  busan: [35.1, 129.04],
  durban: [-29.87, 31.03],
  lagos: [6.45, 3.39],
  montreal: [45.5, -73.55],
  jeddah: [21.49, 39.19],
  colombo: [6.94, 79.84],
}
// 6 rutas MAESTRAS (Carrera de Indias + ejes): brillantes y gruesas.
const RUTAS_MAESTRAS: [string, string][] = [
  ['sevilla', 'veracruz'],
  ['cadiz', 'cartagena'],
  ['valencia', 'bogota'],
  ['rotterdam', 'nuevayork'],
  ['valencia', 'singapur'],
  ['shanghai', 'rotterdam'],
]
// ~29 rutas SECUNDARIAS: la red densa del comercio real, finas y tenues.
const RUTAS_SECUNDARIAS: [string, string][] = [
  ['hamburgo', 'nuevayork'], ['amberes', 'montreal'], ['rotterdam', 'houston'],
  ['genova', 'nuevayork'], ['lisboa', 'santos'], ['sevilla', 'buenosaires'],
  ['cadiz', 'panama'], ['valencia', 'veracruz'], ['shanghai', 'losangeles'],
  ['busan', 'losangeles'], ['yokohama', 'losangeles'], ['hongkong', 'losangeles'],
  ['shanghai', 'callao'], ['panama', 'shanghai'], ['rotterdam', 'singapur'],
  ['hamburgo', 'singapur'], ['genova', 'dubai'], ['pireo', 'singapur'],
  ['rotterdam', 'hongkong'], ['dubai', 'singapur'], ['dubai', 'mumbai'],
  ['jeddah', 'mumbai'], ['mumbai', 'durban'], ['colombo', 'singapur'],
  ['dubai', 'rotterdam'], ['santos', 'rotterdam'], ['durban', 'singapur'],
  ['lagos', 'rotterdam'], ['buenosaires', 'rotterdam'],
]

// Rótulos HUD anclados al 3D (vista de satélite operativa). Pocos y finos.
const HUD_CIUDADES: { ciudad: keyof typeof CIUDADES; linea1: string; linea2: string }[] = [
  { ciudad: 'sevilla', linea1: 'SEVILLA · ES', linea2: 'casa 1503 · origen' },
  { ciudad: 'veracruz', linea1: 'VERACRUZ · MX', linea2: 'nodo activo' },
  { ciudad: 'bogota', linea1: 'BOGOTÁ · CO', linea2: 'ruta verificada' },
  { ciudad: 'nuevayork', linea1: 'NUEVA YORK · US', linea2: 'DPP sellado' },
]

// Constelación de satélites 1503: órbitas finas, inclinadas, con su satélite.
// OJO encuadre: con la cámara final a z=7.4 y fov 42°, el medio-encuadre vertical
// es ~2.84 → ningún aro puede superar r≈2.5 o se recorta (feedback José 13-jun).
const ORBITAS: { r: number; tiltX: number; tiltZ: number; speed: number; phase: number }[] = [
  { r: 2.22, tiltX: 0.45, tiltZ: 0.2, speed: 0.16, phase: 0.0 },
  { r: 2.34, tiltX: -0.6, tiltZ: -0.35, speed: 0.11, phase: 2.1 },
  { r: 2.48, tiltX: 0.15, tiltZ: 0.9, speed: 0.085, phase: 4.2 },
]

// Disco radial con halo (puntos de ciudad redondos, nunca cuadraditos).
function makeDotTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const s = 64
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
  ctx.fill()
  return new THREE.CanvasTexture(cv)
}

function arcCurve(a: THREE.Vector3, b: THREE.Vector3): THREE.CubicBezierCurve3 {
  const lift = 1 + Math.min(0.42, a.distanceTo(b) / (R * 4))
  const m1 = a.clone().lerp(b, 0.33).normalize().multiplyScalar(R * lift)
  const m2 = a.clone().lerp(b, 0.66).normalize().multiplyScalar(R * lift)
  return new THREE.CubicBezierCurve3(a, m1, m2, b)
}

// ── Shader del planeta: día/noche por terminador + scattering en el limbo ──
const EARTH_VERT = `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vPosW = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const EARTH_FRAG = `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
uniform sampler2D dayTex;
uniform sampler2D nightTex;
uniform vec3 sunDir;
uniform float uStamp; // 0..1 — onda de activación del sello recorriendo el planeta
void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  float ndl = dot(n, normalize(sunDir));

  // Terminador suave: día ←→ noche
  float dayMix = smoothstep(-0.12, 0.28, ndl);

  vec3 day = texture2D(dayTex, vUv).rgb * (0.18 + 1.05 * max(ndl, 0.0));
  vec3 night = texture2D(nightTex, vUv).rgb * 1.55;
  vec3 col = mix(night, day, dayMix);

  // Scattering atmosférico INTEGRADO: velo azul fino en el limbo (también separa
  // la silueta nocturna del negro del espacio)
  float rim = pow(1.0 - abs(dot(n, v)), 4.0);
  col += vec3(0.22, 0.5, 1.0) * rim * (0.16 + 0.26 * dayMix);

  // La ONDA del sello: al estampar el galeón, un frente de luz recorre el
  // planeta desde el punto de impacto (el sistema 1503 activándose sobre el mundo)
  if (uStamp > 0.001 && uStamp < 0.999) {
    float dAng = acos(clamp(dot(n, normalize(vec3(0.0, 0.15, 1.0))), -1.0, 1.0));
    float wave = exp(-pow((dAng - uStamp * 3.3) / 0.16, 2.0));
    col += vec3(0.45, 0.7, 1.0) * wave * (1.0 - uStamp) * 0.55;
  }

  gl_FragColor = vec4(col, 1.0);
}`

// ── Shader de las estelas: banda de luz fluyendo por el tubo (uv.x = avance) ──
const TRAIL_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const TRAIL_FRAG = `
varying vec2 vUv;
uniform float uTime;
uniform float uOn;
uniform float uPhase;
uniform float uMaster; // 1.0 maestra · ~0.32 secundaria (la red por capas)
void main() {
  // Estela: cabeza brillante con cola que se desvanece (fluye de origen a destino)
  float x = fract(vUv.x - uTime * 0.085 - uPhase);
  float head = smoothstep(0.0, 0.02, x) * (1.0 - smoothstep(0.02, 0.30, x));
  float base = 0.155; // el hilo persistente de la ruta (la malla de la red)
  vec3 col = mix(vec3(0.42, 0.66, 0.95), vec3(0.95, 0.98, 1.0), head);
  float a = (base + head * 0.85) * uOn * uMaster;
  gl_FragColor = vec4(col, a);
}`

interface Timeline {
  t0: number
  instant: boolean
}

function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

// ── Red neuronal de base bajo el globo: malla orgánica + impulsos de luz ──
// La infraestructura digital del comercio. NO es la retícula Tron de la v1:
// nodos irregulares (jitter determinista), líneas finas, fuerte fade-out hacia
// el fondo (no domina), e impulsos sutiles recorriendo las conexiones (señales).
const NEURAL_Y = -2.85
const PULSE_COUNT = 22
function NeuralBase({ tl }: { tl: Timeline }) {
  const dot = useMemo(makeDotTexture, [])
  const lineMat = useRef<THREE.LineBasicMaterial>(null)
  const nodeMat = useRef<THREE.PointsMaterial>(null)

  const { nodes, edges, segGeom, nodeGeom, flashGeom } = useMemo(() => {
    const COLS = 18
    const ROWS = 12
    const SPAN_X = 19
    const SPAN_Z = 16
    const Z_NEAR = 3.5 // borde cercano a cámara; el resto se hunde hacia -Z
    const nodes: THREE.Vector3[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const jx = Math.sin(r * 21.3 + c * 4.7) * 0.5
        const jz = Math.cos(r * 7.1 + c * 13.9) * 0.5
        const x = -SPAN_X / 2 + (c / (COLS - 1)) * SPAN_X + jx
        const z = Z_NEAR - (r / (ROWS - 1)) * SPAN_Z + jz
        nodes.push(new THREE.Vector3(x, NEURAL_Y, z))
      }
    }
    // Fade por profundidad: alpha 1 cerca de cámara → 0 al fondo.
    const depthAlpha = (z: number) => {
      const f = (z - (Z_NEAR - SPAN_Z)) / SPAN_Z
      return 0.5 + 0.5 * Math.pow(Math.max(0, Math.min(1, f)), 1.2)
    }
    // Conexiones por proximidad (malla, no cuadrícula).
    const edges: [number, number][] = []
    const D = (SPAN_X / COLS) * 1.65
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < D) edges.push([i, j])
      }
    }
    // Líneas con vertex colors (fade en profundidad).
    const base = new THREE.Color('#8AC0EE')
    const segPts: number[] = []
    const segCol: number[] = []
    for (const [a, b] of edges) {
      const na = nodes[a]
      const nb = nodes[b]
      const aa = depthAlpha(na.z)
      const ab = depthAlpha(nb.z)
      segPts.push(na.x, na.y, na.z, nb.x, nb.y, nb.z)
      segCol.push(base.r * aa, base.g * aa, base.b * aa, base.r * ab, base.g * ab, base.b * ab)
    }
    const segGeom = new THREE.BufferGeometry()
    segGeom.setAttribute('position', new THREE.Float32BufferAttribute(segPts, 3))
    segGeom.setAttribute('color', new THREE.Float32BufferAttribute(segCol, 3))
    const nodeGeom = new THREE.BufferGeometry().setFromPoints(nodes)
    // Destellos = SEGMENTOS de luz (no bolitas): un tramo brillante que corre por
    // DENTRO de la línea. Cabeza blanca intensa → cola tenue. Con Bloom = flash/glow.
    const flashGeom = new THREE.BufferGeometry()
    flashGeom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(PULSE_COUNT * 2 * 3), 3))
    const fcol = new Float32Array(PULSE_COUNT * 2 * 3)
    for (let i = 0; i < PULSE_COUNT; i++) {
      const tIdx = i * 2 * 3
      const hIdx = (i * 2 + 1) * 3
      fcol[tIdx] = 0.16; fcol[tIdx + 1] = 0.4; fcol[tIdx + 2] = 0.72 // cola: azul tenue
      fcol[hIdx] = 1.0; fcol[hIdx + 1] = 1.0; fcol[hIdx + 2] = 1.0 // cabeza: blanco intenso
    }
    flashGeom.setAttribute('color', new THREE.Float32BufferAttribute(fcol, 3))
    return { nodes, edges, segGeom, nodeGeom, flashGeom }
  }, [])

  const pulses = useRef(
    Array.from({ length: PULSE_COUNT }, (_, i) => ({ t: i / PULSE_COUNT, spd: 2.6 + (i % 5) * 0.5 })),
  )

  useFrame((_, delta) => {
    const t = tl.instant ? 99 : (performance.now() - tl.t0) / 1000
    // La red se revela tras las frases (la infraestructura "se enciende").
    const on = tl.instant ? 1 : Math.max(0, Math.min(1, (t - 6.5) / 3.2))
    if (lineMat.current) lineMat.current.opacity = 0.95 * on
    if (nodeMat.current) nodeMat.current.opacity = 0.85 * on
    const nE = edges.length
    if (!nE) return
    const arr = flashGeom.getAttribute('position').array as Float32Array
    const FLASH_LEN = 0.22 // longitud del tramo de luz (fracción de la edge)
    pulses.current.forEach((p, i) => {
      p.t += delta * p.spd
      const cyc = Math.floor(p.t)
      const frac = p.t - cyc
      const e = (i * 53 + cyc * 97) % nE
      const a = nodes[edges[e][0]]
      const b = nodes[edges[e][1]]
      const ft = Math.max(0, frac - FLASH_LEN)
      const it = i * 6
      arr[it] = a.x + (b.x - a.x) * ft // cola
      arr[it + 1] = a.y + (b.y - a.y) * ft
      arr[it + 2] = a.z + (b.z - a.z) * ft
      arr[it + 3] = a.x + (b.x - a.x) * frac // cabeza
      arr[it + 4] = a.y + (b.y - a.y) * frac
      arr[it + 5] = a.z + (b.z - a.z) * frac
    })
    ;(flashGeom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <group>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <lineSegments geometry={segGeom}>
        <lineBasicMaterial ref={lineMat} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points geometry={nodeGeom}>
        <pointsMaterial ref={nodeMat} map={dot ?? undefined} color="#9FC8F0" size={0.08} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <lineSegments geometry={flashGeom}>
        <lineBasicMaterial vertexColors transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  )
}

// ── Gemelo digital: contornos de países como holograma sobre la Tierra real ──
// La Fusión: el mundo físico + su registro digital encima. Se ENCIENDE con la
// onda del sello (~t10.75). Contornos desde TopoJSON Natural Earth 50m.
function useCountryLines(): THREE.BufferGeometry[] {
  const [lines, setLines] = useState<THREE.BufferGeometry[]>([])
  useEffect(() => {
    let cancelled = false
    fetch('/data/countries-50m.json')
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return
        const fc = feature(topo, topo.objects.countries as GeometryCollection) as unknown as {
          features: Feature<Polygon | MultiPolygon>[]
        }
        const geos: THREE.BufferGeometry[] = []
        const SEG = 5
        for (const f of fc.features) {
          const g = f.geometry
          const polys: number[][][][] =
            g.type === 'Polygon' ? [g.coordinates as number[][][]] : (g.coordinates as number[][][][])
          for (const poly of polys) {
            for (const ring of poly) {
              const pts: THREE.Vector3[] = []
              for (let i = 0; i < ring.length - 1; i++) {
                const [lon1, lat1] = ring[i]
                const [lon2, lat2] = ring[i + 1]
                for (let s = 0; s < SEG; s++) {
                  const tt = s / SEG
                  pts.push(latLonToVec3(lat1 + (lat2 - lat1) * tt, lon1 + (lon2 - lon1) * tt, R * 1.02))
                }
              }
              const last = ring[ring.length - 1]
              pts.push(latLonToVec3(last[1], last[0], R * 1.02))
              if (pts.length > 1) geos.push(new THREE.BufferGeometry().setFromPoints(pts))
            }
          }
        }
        if (!cancelled) setLines(geos)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return lines
}

function CountryHologram({ tl }: { tl: Timeline }) {
  const lines = useCountryLines()
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#4FC3FF',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useFrame(() => {
    const t = tl.instant ? 99 : (performance.now() - tl.t0) / 1000
    // Se enciende con la onda del sello y se queda como holograma fino.
    const on = tl.instant ? 1 : Math.max(0, Math.min(1, (t - 10.75) / 2.4))
    mat.opacity = 0.6 * on
  })
  return (
    <>
      {lines.map((g, i) => (
        // eslint-disable-next-line react/no-unknown-property
        <line key={i}>
          <primitive attach="geometry" object={g} />
          <primitive attach="material" object={mat} />
        </line>
      ))}
    </>
  )
}

function Escena({ tl }: { tl: Timeline }) {
  const [dayTex, nightTex] = useLoader(THREE.TextureLoader, [
    '/textures/earth-day.jpg',
    '/textures/earth-night.jpg',
  ])
  dayTex.colorSpace = THREE.SRGBColorSpace
  nightTex.colorSpace = THREE.SRGBColorSpace
  dayTex.anisotropy = 8
  nightTex.anisotropy = 8

  const dot = useMemo(makeDotTexture, [])
  const earthRef = useRef<THREE.Group>(null)
  const earthMesh = useRef<THREE.Mesh>(null)
  const trailMats = useRef<THREE.ShaderMaterial[]>([])
  const satRefs = useRef<THREE.Sprite[]>([])
  const [hudOn, setHudOn] = useState(false)

  const earthUniforms = useMemo(
    () => ({
      dayTex: { value: dayTex },
      nightTex: { value: nightTex },
      sunDir: { value: SUN_DIR },
      uStamp: { value: 0 },
    }),
    [dayTex, nightTex],
  )

  // Órbitas de la constelación (círculos finos, memoizados).
  const orbitGeom = useMemo(() => {
    const out: THREE.BufferGeometry[] = []
    for (const o of ORBITAS) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * o.r, Math.sin(a) * o.r, 0))
      }
      out.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    return out
  }, [])

  // Arcos de las rutas (red densa) + puntos de ciudad (estáticos).
  // Maestras: gruesas y brillantes (master=1). Secundarias: finas y tenues (master≈0.32).
  const { arcs, cityPoints } = useMemo(() => {
    const build = (pairs: [string, string][], radius: number, master: number) =>
      pairs.map(([a, b]) => {
        const curve = arcCurve(
          latLonToVec3(CIUDADES[a][0], CIUDADES[a][1], R * 1.002),
          latLonToVec3(CIUDADES[b][0], CIUDADES[b][1], R * 1.002),
        )
        return { geom: new THREE.TubeGeometry(curve, 100, radius, 5, false), master }
      })
    // Secundarias primero → las maestras se dibujan encima.
    const arcs = [
      ...build(RUTAS_SECUNDARIAS, 0.0028, 0.5),
      ...build(RUTAS_MAESTRAS, 0.0048, 1.0),
    ]
    const cityPoints = Object.values(CIUDADES).map(([lat, lon]) => latLonToVec3(lat, lon, R * 1.004))
    return { arcs, cityPoints }
  }, [])

  useFrame(({ camera, clock }) => {
    const t = tl.instant ? 99 : (performance.now() - tl.t0) / 1000

    const k = easeInOut(Math.min(1, t / DOLLY_END))
    camera.position.z = CAM_FROM + (CAM_TO - CAM_FROM) * k
    camera.position.y = 0.5 * (1 - k)
    camera.lookAt(0, 0, 0)

    if (earthRef.current) {
      earthRef.current.rotation.y = -0.5 + ROT_SPEED * Math.min(t, 9999)
    }

    const on = tl.instant ? 1 : Math.max(0, Math.min(1, (t - ARCS_AT) / 1.8))
    trailMats.current.forEach((m) => {
      if (!m) return
      m.uniforms.uTime.value = clock.elapsedTime
      m.uniforms.uOn.value = on
    })

    // Onda del sello sobre el planeta (sincronizada con el estampado CSS, t≈10.8s)
    earthUniforms.uStamp.value = tl.instant ? 0 : Math.max(0, Math.min(1, (t - 10.75) / 2.1))

    // Satélites recorriendo sus órbitas (con parpadeo de baliza)
    satRefs.current.forEach((sp, i) => {
      if (!sp) return
      const o = ORBITAS[i]
      const a = clock.elapsedTime * o.speed + o.phase
      sp.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0)
      ;(sp.material as THREE.SpriteMaterial).opacity = 0.55 + 0.4 * Math.sin(clock.elapsedTime * 2.4 + i * 2)
    })

    // Rótulos HUD: emergen con los nodos (~12.5s)
    if (!hudOn && (tl.instant || t > 12.5)) setHudOn(true)
  })

  return (
    <>
      {/* Espacio profundo: negro real, estrellas tenues */}
      <Stars radius={120} depth={60} count={5500} factor={4.5} saturation={0} fade speed={0.2} />

      {/* Red neuronal de base bajo el globo (infraestructura digital · impulsos) */}
      <NeuralBase tl={tl} />

      <group ref={earthRef}>
        {/* La Tierra AZUL: día/noche por terminador (shader, texturas NASA) */}
        <mesh ref={earthMesh}>
          <sphereGeometry args={[R, 128, 128]} />
          <shaderMaterial uniforms={earthUniforms} vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} />
        </mesh>

        {/* GEMELO DIGITAL: contornos de países como holograma (se enciende con el sello) */}
        <CountryHologram tl={tl} />

        {/* Rótulos HUD anclados a ciudades reales (se ocultan tras el planeta) */}
        {HUD_CIUDADES.map((h) => {
          const [lat, lon] = CIUDADES[h.ciudad]
          return (
            <Html
              key={h.ciudad}
              position={latLonToVec3(lat, lon, R * 1.01)}
              occlude={[earthMesh as React.RefObject<THREE.Object3D>]}
              zIndexRange={[4, 0]}
              style={{
                opacity: hudOn ? 1 : 0,
                transition: 'opacity 1.4s ease',
                pointerEvents: 'none',
                fontFamily: 'var(--font-dm-mono), monospace',
                whiteSpace: 'nowrap',
                borderLeft: '1px solid rgba(159,217,255,0.55)',
                paddingLeft: 7,
                marginLeft: 10,
                background: 'rgba(2,6,14,0.32)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <div style={{ color: '#CFE6FF', fontSize: 10, letterSpacing: '0.18em' }}>{h.linea1}</div>
              <div style={{ color: '#5E84A8', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{h.linea2}</div>
            </Html>
          )
        })}

        {/* Puntos de ciudad (brasa mínima) */}
        {dot &&
          cityPoints.map((p, i) => (
            <sprite key={i} position={p} scale={[0.035, 0.035, 1]}>
              <spriteMaterial map={dot} color="#CFE6FF" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          ))}

        {/* Rutas: ESTELAS de luz fluyendo (no proyectiles) · red densa por capas */}
        {arcs.map(({ geom, master }, i) => (
          <mesh key={`r${i}`} geometry={geom}>
            <shaderMaterial
              ref={(el) => {
                if (el) trailMats.current[i] = el
              }}
              uniforms={{ uTime: { value: 0 }, uOn: { value: 0 }, uPhase: { value: i * 0.37 }, uMaster: { value: master } }}
              vertexShader={TRAIL_VERT}
              fragmentShader={TRAIL_FRAG}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Constelación de satélites 1503: órbitas finas + balizas (fuera del grupo
          de la Tierra: la infraestructura no gira con el planeta) */}
      {ORBITAS.map((o, i) => (
        <group key={`orb${i}`} rotation={[o.tiltX, 0, o.tiltZ]}>
          {/* eslint-disable-next-line react/no-unknown-property */}
          <lineLoop>
            <primitive object={orbitGeom[i]} attach="geometry" />
            <lineBasicMaterial color="#6E9FCB" transparent opacity={0.35} depthWrite={false} />
          </lineLoop>
          {dot && (
            <sprite
              ref={(el) => {
                if (el) satRefs.current[i] = el
              }}
              scale={[0.055, 0.055, 1]}
            >
              <spriteMaterial map={dot} color="#DCEBFF" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          )}
        </group>
      ))}

      {/* Bloom muy contenido: brasa de luces de ciudad, no neón */}
      <EffectComposer>
        <Bloom intensity={0.42} luminanceThreshold={0.22} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function RealEarthVoyage({ instant = false }: { instant?: boolean }) {
  const tl = useMemo<Timeline>(() => ({ t0: performance.now(), instant }), [instant])
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden>
      <Canvas camera={{ position: [0, 0.5, CAM_FROM], fov: 42 }} gl={{ antialias: true }} dpr={[1, 1.75]}>
        <Suspense fallback={null}>
          <Escena tl={tl} />
        </Suspense>
      </Canvas>
    </div>
  )
}
