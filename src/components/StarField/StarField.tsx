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

export default function StarField({
  count = 8000,
  spread = 1000,
  opacity = 0.85,
  size = 0.8,
}: StarFieldProps) {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    const starColors = [
      new THREE.Color('#f0f4ff'),
      new THREE.Color('#a8c8ff'),
      new THREE.Color('#ffd580'),
      new THREE.Color('#c8e0ff'),
      new THREE.Color('#ffffff'),
    ]

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * spread

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = Math.random() < 0.95
        ? Math.random() * 1.5 + 0.3
        : Math.random() * 3 + 2

      const color = starColors[Math.floor(Math.random() * starColors.length)]
      colors[i * 3]     = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, sizes, colors }
  }, [count, spread])

  // Distant stars rotate imperceptibly slow; close stars slightly faster
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
