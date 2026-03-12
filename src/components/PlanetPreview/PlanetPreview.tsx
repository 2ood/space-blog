'use client'

/**
 * PlanetPreview
 *
 * Renders a glowing pulsing sphere at `pendingPlanetPreview` while the
 * AddPostDrawer is open. Lives inside Canvas so it sits in 3D space.
 * Zero React re-renders during the pulse — opacity driven by useFrame.
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'

export default function PlanetPreview() {
  const position = useSpaceStore((s) => s.pendingPlanetPreview)

  const meshRef  = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    const t       = clock.getElapsedTime()
    const pulse   = 0.55 + Math.sin(t * 2.2) * 0.35
    const scale   = 0.85 + Math.sin(t * 1.6) * 0.15

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity  = pulse
      meshRef.current.scale.setScalar(scale)
    }
    if (lightRef.current) {
      lightRef.current.intensity = pulse * 4
    }
  })

  if (!position) return null

  return (
    <group position={position}>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light so nearby planets catch the glow */}
      <pointLight ref={lightRef} color="#00d4ff" intensity={4} distance={30} />
    </group>
  )
}
