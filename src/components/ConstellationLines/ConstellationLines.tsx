'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Post } from '@/components/BlogStars/BlogStars'
import { TAG_COLORS } from '@/config/spaceConfig'
import {
  CONSTELLATION_DOT_LENGTH,
  CONSTELLATION_SCROLL_SPEED,
  CONSTELLATION_OPACITY,
  CONSTELLATION_TUBE_RADIUS,
  CONSTELLATION_TUBE_SIDES,
  CONSTELLATION_PERIOD,
  CONSTELLATION_SLOTS,
  CONSTELLATION_BIDIR_OPACITY,
} from '@/config/spaceConfig'

interface ConstellationLinesProps {
  posts: Post[]
}

// ── Bidirectional detection ───────────────────────────────────────────────────
interface EdgeData {
  fromPos: THREE.Vector3
  toPos:   THREE.Vector3
  color:   string   // source post colour
  key:     string
}

function deriveEdges(posts: Post[], posMap: Record<string, { pos: THREE.Vector3; color: string }>) {
  // Build full edge set for O(1) reverse lookup
  const edgeSet = new Set<string>()
  posts.forEach(post => {
    post.relatedPosts.forEach(toId => edgeSet.add(`${post.id}|${toId}`))
  })

  const directional:    EdgeData[] = []
  const bidirectional:  EdgeData[] = []
  const consumed = new Set<string>()   // pairs already handled as bidirectional

  posts.forEach(post => {
    const a = posMap[post.id]
    if (!a) return

    post.relatedPosts.forEach(toId => {
      const b = posMap[toId]
      if (!b) return

      const fwd = `${post.id}|${toId}`
      const rev = `${toId}|${post.id}`

      if (consumed.has(fwd)) return   // already emitted as bidirectional

      if (edgeSet.has(rev)) {
        // Bidirectional pair — emit once, mark both directions consumed
        consumed.add(fwd)
        consumed.add(rev)
        bidirectional.push({
          fromPos: a.pos,
          toPos:   b.pos,
          color:   a.color,
          key:     `bidir-${post.id}-${toId}`,
        })
      } else {
        // Purely directional
        directional.push({
          fromPos: a.pos,
          toPos:   b.pos,
          color:   a.color,
          key:     `dir-${post.id}-${toId}`,
        })
      }
    })
  })

  return { directional, bidirectional }
}

// ── Directional: marching dot cylinders ──────────────────────────────────────
function DirectionalConnection({ fromPos, toPos, color, phaseOffset }: {
  fromPos:     THREE.Vector3
  toPos:       THREE.Vector3
  color:       string
  phaseOffset: number
}) {
  const offsetRef = useRef(phaseOffset * CONSTELLATION_PERIOD)
  const matsRef   = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const meshesRef = useRef<(THREE.Mesh | null)[]>([])

  const { dir, len, alignQ, dashGeo } = useMemo(() => {
    const d    = toPos.clone().sub(fromPos)
    const len  = d.length()
    const dir  = d.normalize()
    const alignQ = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), dir
    )
    const dashLen = CONSTELLATION_DOT_LENGTH * len
    const dashGeo = new THREE.CylinderGeometry(
      CONSTELLATION_TUBE_RADIUS, CONSTELLATION_TUBE_RADIUS,
      dashLen, CONSTELLATION_TUBE_SIDES, 1, false
    )
    return { dir, len, alignQ, dashGeo }
  }, [fromPos, toPos])

  useFrame((_, delta) => {
    offsetRef.current = (offsetRef.current + CONSTELLATION_SCROLL_SPEED * delta) % CONSTELLATION_PERIOD
    const off = offsetRef.current
    const breathe = CONSTELLATION_OPACITY + Math.sin(Date.now() * 0.001 * 0.4) * 0.08

    for (let k = 0; k < CONSTELLATION_SLOTS; k++) {
      const mesh = meshesRef.current[k]
      const mat  = matsRef.current[k]
      if (!mesh || !mat) continue

      const t     = -CONSTELLATION_PERIOD + (off % CONSTELLATION_PERIOD) + k * CONSTELLATION_PERIOD
      const t0    = Math.max(t, 0)
      const t1    = Math.min(t + CONSTELLATION_DOT_LENGTH, 1.0)
      const visible = t1 > t0 + 0.001

      mesh.visible = visible
      if (visible) {
        const mid = (t0 + t1) / 2
        mesh.position.copy(fromPos).addScaledVector(dir, mid * len)
        mesh.quaternion.copy(alignQ)
        mat.opacity = breathe
      }
    }
  })

  return (
    <group>
      {Array.from({ length: CONSTELLATION_SLOTS }, (_, k) => (
        <mesh key={k} ref={(m) => { meshesRef.current[k] = m }} geometry={dashGeo} visible={false}>
          <meshBasicMaterial
            ref={(m) => { matsRef.current[k] = m }}
            color={color}
            transparent
            opacity={CONSTELLATION_OPACITY}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Bidirectional: solid tube ─────────────────────────────────────────────────
function BidirectionalConnection({ fromPos, toPos, color }: {
  fromPos: THREE.Vector3
  toPos:   THREE.Vector3
  color:   string
}) {
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null)

  const geometry = useMemo(() => {
    const path = new THREE.LineCurve3(fromPos, toPos)
    return new THREE.TubeGeometry(
      path, 1,
      CONSTELLATION_TUBE_RADIUS,
      CONSTELLATION_TUBE_SIDES,
      false
    )
  }, [fromPos, toPos])

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = CONSTELLATION_BIDIR_OPACITY
        + Math.sin(Date.now() * 0.001 * 0.4) * 0.05
    }
  })

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        ref={(m) => { matRef.current = m }}
        color={color}
        transparent
        opacity={CONSTELLATION_BIDIR_OPACITY}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function ConstellationLines({ posts }: ConstellationLinesProps) {
  const posMap = useMemo(() => {
    const map: Record<string, { pos: THREE.Vector3; color: string }> = {}
    posts.forEach(p => {
      map[p.id] = {
        pos:   new THREE.Vector3(...p.position),
        color: TAG_COLORS[p.tags[0]] ?? TAG_COLORS.default,
      }
    })
    return map
  }, [posts])

  const { directional, bidirectional } = useMemo(
    () => deriveEdges(posts, posMap),
    [posts, posMap]
  )

  return (
    <group>
      {bidirectional.map(({ fromPos, toPos, color, key }) => (
        <BidirectionalConnection key={key} fromPos={fromPos} toPos={toPos} color={color} />
      ))}
      {directional.map(({ fromPos, toPos, color, key }, i) => (
        <DirectionalConnection
          key={key}
          fromPos={fromPos}
          toPos={toPos}
          color={color}
          phaseOffset={i / Math.max(directional.length, 1)}
        />
      ))}
    </group>
  )
}
