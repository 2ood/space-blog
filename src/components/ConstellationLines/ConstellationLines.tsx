'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Post } from '@/components/BlogStars/BlogStars'
import { TAG_COLORS } from '@/config/spaceConfig'

const LINE_RADIUS = 0.3

interface ConstellationLinesProps {
  posts: Post[]
}

interface Connection {
  from: string
  to: string
}

export default function ConstellationLines({ posts }: ConstellationLinesProps) {
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([])
  const [connections, setConnections] = useState<Connection[]>([])

  useEffect(() => {
    fetch('/api/connections')
      .then((r) => r.json())
      .then((data: Connection[]) => setConnections(data))
      .catch((err) => console.error('Failed to load connections:', err))
  }, [])

  const posMap = useMemo(() => {
    const map: Record<string, { pos: THREE.Vector3; color: string }> = {}
    posts.forEach(p => {
      map[p.id] = {
        pos: new THREE.Vector3(...p.position),
        color: TAG_COLORS[p.tags[0]] ?? TAG_COLORS.default,
      }
    })
    return map
  }, [posts])

  const lines = useMemo(() => {
    return connections.flatMap(({ from, to }, i) => {
      const a = posMap[from]
      const b = posMap[to]
      if (!a || !b) return []

      const path = new THREE.LineCurve3(a.pos, b.pos)
      const geometry = new THREE.TubeGeometry(path, 1, LINE_RADIUS, 8, false)

      return [{ geometry, color: a.color, key: `${from}-${to}`, index: i }]
    })
  }, [connections, posMap])

  useFrame(() => {
    const t = Date.now() * 0.001
    materialsRef.current.forEach((mat, i) => {
      if (mat) mat.opacity = 0.2 + Math.sin(t * 0.5 + i * 1.1) * 0.15
    })
  })

  return (
    <group>
      {lines.map(({ geometry, color, key, index }) => (
        <mesh key={key} geometry={geometry}>
          <meshBasicMaterial
            ref={(mat) => { if (mat) materialsRef.current[index] = mat }}
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
