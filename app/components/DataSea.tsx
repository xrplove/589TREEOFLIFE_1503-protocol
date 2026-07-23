'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * "Mar de datos" — suelo de LÍNEAS tecnológicas con LUZ VIAJANDO por ellas.
 * Beat 1 de la travesía de 1503.
 *
 *  - Rejilla de líneas finas en perspectiva (sin "cuadraditos": nada de puntos).
 *  - Bandas de luz que recorren la rejilla desde el horizonte hacia el
 *    espectador (datos fluyendo) → vía color por vértice (vertexColors), no por
 *    opacidad global. Aditivo: los picos de luz tiran a cian-blanco.
 *  - La malla además avanza hacia la cámara y recicla (loop) + oleaje suave.
 *  - Niebla que funde el horizonte ("espacio"). Respeta prefers-reduced-motion.
 *
 * Capa de fondo (position:fixed, zIndex 0). Cámara elevada mirando al horizonte.
 */

const COLS = 66
const ROWS = 96
const SPAN_X = 54 // semiancho en X
const DEPTH = 76 // profundidad total en Z
const NEAR_Z = 9 // límite cercano (algo por delante de la cámara)
const FAR_Z = NEAR_Z - DEPTH
const SPEED = 7.5 // unidades/s: avance de la propia rejilla hacia la cámara (ritmo calmado)
const FOG = '#05070d'

// Luz viajando
const BANDS = 3 // nº de pulsos de luz simultáneos
const BAND_SPEED = 14 // unidades/s del pulso (más rápido que la malla → la recorre)
const BAND_SIGMA = 3.2 // anchura del pulso
const BASE = 0.14 // brillo base de la rejilla en reposo
const CYAN: [number, number, number] = [0.0, 0.64, 1.0] // #00A3FF normalizado

function nodeIndex(r: number, c: number) {
  return r * COLS + c
}

function SeaGrid({ reduced }: { reduced: boolean }) {
  const { positionAttr, colorAttr, geo, base, mat } = useMemo(() => {
    const count = COLS * ROWS
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const base = new Float32Array(count * 2) // (x, z0) por nodo
    let i = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c / (COLS - 1) - 0.5) * SPAN_X * 2
        const z = NEAR_Z - (r / (ROWS - 1)) * DEPTH
        positions[i * 3] = x
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = z
        base[i * 2] = x
        base[i * 2 + 1] = z
        i++
      }
    }
    const positionAttr = new THREE.BufferAttribute(positions, 3)
    const colorAttr = new THREE.BufferAttribute(colors, 3)

    // Índice de la rejilla: conecta cada nodo con su vecino a la derecha y abajo.
    const indices: number[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1) indices.push(nodeIndex(r, c), nodeIndex(r, c + 1))
        if (r < ROWS - 1) indices.push(nodeIndex(r, c), nodeIndex(r + 1, c))
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', positionAttr)
    geo.setAttribute('color', colorAttr)
    geo.setIndex(indices)

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    })

    return { positionAttr, colorAttr, geo, base, mat }
  }, [])

  const offsetRef = useRef(0)

  useFrame(({ clock }, delta) => {
    if (!reduced) offsetRef.current += delta * SPEED
    const off = offsetRef.current % DEPTH
    const t = clock.getElapsedTime()
    const pos = positionAttr.array as Float32Array
    const col = colorAttr.array as Float32Array
    const count = COLS * ROWS

    // Posición Z de las bandas de luz (van del horizonte hacia la cámara).
    const bandZ: number[] = []
    for (let k = 0; k < BANDS; k++) {
      const phase = (t * BAND_SPEED + (k * DEPTH) / BANDS) % DEPTH
      bandZ.push(FAR_Z + phase)
    }

    for (let i = 0; i < count; i++) {
      const x = base[i * 2]
      const z0 = base[i * 2 + 1]
      let z = z0 + off
      if (z > NEAR_Z) z -= DEPTH // reciclaje continuo
      pos[i * 3 + 2] = z
      pos[i * 3 + 1] =
        Math.sin(x * 0.16 + t * 0.85) * 0.32 + Math.sin(z * 0.11 - t * 0.62) * 0.44

      // Intensidad: base + acercamiento a la cámara + bandas de luz viajando.
      let inten = BASE + 0.1 * ((z - FAR_Z) / DEPTH)
      if (!reduced) {
        for (let k = 0; k < BANDS; k++) {
          const d = z - bandZ[k]
          inten += Math.exp(-(d * d) / (2 * BAND_SIGMA * BAND_SIGMA))
        }
      }
      if (inten > 2.3) inten = 2.3
      col[i * 3] = CYAN[0] * inten
      col[i * 3 + 1] = CYAN[1] * inten
      col[i * 3 + 2] = CYAN[2] * inten
    }
    positionAttr.needsUpdate = true
    colorAttr.needsUpdate = true
  })

  return (
    <lineSegments>
      <primitive attach="geometry" object={geo} />
      <primitive attach="material" object={mat} />
    </lineSegments>
  )
}

export default function DataSea({ mode = 'fixed' }: { mode?: 'fixed' | 'absolute' }) {
  const reduced = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  return (
    <div aria-hidden style={{ position: mode, inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 2.6, 7], fov: 64 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        onCreated={({ camera }) => camera.lookAt(0, -1.2, -28)}
      >
        <fog attach="fog" args={[FOG, 9, 60]} />
        <SeaGrid reduced={reduced} />
      </Canvas>
    </div>
  )
}
