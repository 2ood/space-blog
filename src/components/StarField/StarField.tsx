'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarFieldProps {
  count?: number
  spread?: number
  opacity?: number
  size?: number
}

// Generate star data outside the component — truly static, no re-render concerns
function generateStars(count: number, spread: number) {
  const positions = new Float32Array(count * 3)
  const sizes     = new Float32Array(count)
  const colors    = new Float32Array(count * 3)

  const starColors = [
    new THREE.Color('#f0f4ff'),
    new THREE.Color('#a8c8ff'),
    new THREE.Color('#ffd580'),
    new THREE.Color('#c8e0ff'),
    new THREE.Color('#ffffff'),
  ]

  const rng = (() => {
    // Simple seeded PRNG (mulberry32) so output is deterministic
    let s = count ^ (spread * 31)
    return () => {
      s |= 0; s = s + 0x6D2B79F5 | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  })()

  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2
    const phi   = Math.acos(2 * rng() - 1)
    const r     = Math.cbrt(rng()) * spread

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    sizes[i] = rng() < 0.95
      ? rng() * 1.5 + 0.3
      : rng() * 3 + 2

    const color = starColors[Math.floor(rng() * starColors.length)]
    colors[i * 3]     = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  return { positions, sizes, colors }
}

export default function StarField({
  count = 8000,
  spread = 1000,
  opacity = 0.85,
  size = 0.8,
}: StarFieldProps) {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, sizes, colors } = useMemo(
    () => generateStars(count, spread),
    [count, spread]
  )

  const rotSpeed = spread > 200 ? 0.0008 : 0.005

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotSpeed
      meshRef.current.rotation.x += delta * rotSpeed * 0.4
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        <bufferAttribute attach="attributes-size"     args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        fog={false}
      />
    </points>
  )
}
