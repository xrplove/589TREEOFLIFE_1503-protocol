'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

const AXIAL_TILT = 0.41 // ~23.5° in radians

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [colorMap, normalMap, specularMap, bumpMap] = useTexture([
    '/textures/earth-blue-marble.jpg',
    '/textures/earth-normal.jpg',
    '/textures/earth-specular.jpg',
    '/textures/earth-topology.png',
  ])

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.12
  })

  return (
    <mesh ref={meshRef} rotation={[0, 0, AXIAL_TILT]}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshPhongMaterial
        map={colorMap}
        normalMap={normalMap}
        specularMap={specularMap}
        bumpMap={bumpMap}
        bumpScale={0.04}
        specular={new THREE.Color('#9CB6CC')}
        shininess={32}
      />
    </mesh>
  )
}

function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const map = useTexture('/textures/earth-clouds.png')

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.17
  })

  return (
    <mesh ref={meshRef} rotation={[0, 0, AXIAL_TILT]}>
      <sphereGeometry args={[1.013, 64, 64]} />
      <meshPhongMaterial
        map={map}
        transparent
        opacity={0.62}
        depthWrite={false}
      />
    </mesh>
  )
}

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.085, 32, 32]} />
      <meshBasicMaterial
        color="#4DA9FF"
        transparent
        opacity={0.14}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function EarthGlobe() {
  return (
    <span
      aria-label="Globo terrestre"
      role="img"
      style={{
        display: 'inline-block',
        width: '1em',
        height: '1em',
        verticalAlign: '-0.14em',
        position: 'relative',
        lineHeight: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 28 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 2, 4]} intensity={2.4} color="#FFFFFF" />
        <pointLight position={[-3, -2, -3]} intensity={0.45} color="#3D6FA8" />
        <Suspense fallback={null}>
          <Atmosphere />
          <Earth />
          <Clouds />
        </Suspense>
      </Canvas>
    </span>
  )
}
