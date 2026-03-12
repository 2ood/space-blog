'use client'

import { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { getCategoryColor } from '@/config/spaceConfig'
import { useSpaceStore } from '@/store/spaceStore'
import { StarRegistryContext } from '@/hooks/camera/useBlogStarRegistry'

// Big Bang spring constants
const BB_STIFFNESS  = 0.045   // how fast each planet rushes to its position
const BB_DONE_RAD   = 0.08    // distance threshold to consider a planet "arrived"
const BB_SETTLE_MS  = 800     // extra wait after last planet lands before showing lines

export interface Category {
  id: string
  name: string
  color: string
}

export interface Tag {
  id: string
  name: string
}

export interface Post {
  id: string
  title: string
  slug: string
  date: string
  category: Category | null
  tags: Tag[]
  excerpt: string
  position: [number, number, number]
  trajectoryOrder: number
  size: 1 | 2 | 3 | 4 | 5
  relatedPosts: string[]   // IDs of outgoing directional connections
}

const SIZE_RADII: Record<number, number> = { 1:0.7, 2:1.0, 3:1.4, 4:1.9, 5:2.6 }

// Whether this planet gets a ring
const hasRing  = (order: number) => order % 7 === 0
// Whether this planet gets a moon
const hasMoon  = (order: number) => order % 5 === 0

// ── Shader: single smooth style, brighter tag color ────────────────────────────

const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function makePlanetFragmentShader(color: string): string {
  const c = new THREE.Color(color)
  // Brighten: mix base color with white so planets read clearly
  const bright = c.clone().lerp(new THREE.Color(0xffffff), 0.35)
  const r = bright.r.toFixed(3), g = bright.g.toFixed(3), b = bright.b.toFixed(3)
  return `
    varying vec3 vNormal;
    void main() {
      vec3 lightDir = normalize(vec3(1.2, 1.5, 1.0));
      float diff = max(dot(vNormal, lightDir), 0.0);
      float ambient = 0.5;
      float light = ambient + diff * 0.5;
      vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
      float limb = pow(max(dot(vNormal, viewDir), 0.0), 0.35);
      light *= mix(0.55, 1.0, limb);
      vec3 col = vec3(${r}, ${g}, ${b});
      gl_FragColor = vec4(col * light, 1.0);
    }
  `
}

// ── Ring component ────────────────────────────────────────────────────────────
function PlanetRing({ radius, color }: { radius: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => {
    const c = new THREE.Color(color)
    return new THREE.ShaderMaterial({
      uniforms: { uColor: { value: c } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float ring = smoothstep(0.55,0.6,r) * (1.0 - smoothstep(0.85,0.9,r));
          float band = smoothstep(0.65,0.68,r) * (1.0 - smoothstep(0.72,0.75,r));
          float alpha = ring * 0.55 + band * 0.3;
          gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.3), alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [color])

  return (
    <mesh ref={meshRef} rotation={[Math.PI * 0.35, 0.3, 0.1]} material={mat}>
      <planeGeometry args={[radius * 6, radius * 6]} />
    </mesh>
  )
}

// ── Moon component ────────────────────────────────────────────────────────────
function Moon({ parentRadius, color }: { parentRadius: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const moonRadius = parentRadius * 0.28
  const orbitRadius = parentRadius * 3.2
  // useRef so the random value is stable across re-renders
  const speedRef = useRef(0.4 + (parentRadius * 137.508) % 0.3) // deterministic from radius
  const speed = speedRef.current

  useFrame(() => {
    if (!groupRef.current) return
    const t = Date.now() * 0.001 * speed
    groupRef.current.position.set(
      Math.cos(t) * orbitRadius,
      Math.sin(t * 0.3) * parentRadius * 0.5,
      Math.sin(t) * orbitRadius
    )
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[moonRadius, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  )
}

// ── Star label (HTML overlay): HUD-sized font, constant screen size at any distance ─
const LABEL_DISTANCE_FACTOR = 1.5// tune so 14px matches HUD at typical view distance
const labelStyles: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '14px',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  textShadow: '0 0 8px rgba(0,212,255,0.6)',
  letterSpacing: '0.05em',
}

// ── BlogStar ──────────────────────────────────────────────────────────────────
function BlogStar({ post, centroid, onArrived }: {
  post:      Post
  centroid:  THREE.Vector3
  onArrived: () => void
}) {
  const groupRef  = useRef<THREE.Group>(null)
  const meshRef   = useRef<THREE.Mesh>(null)
  const hitboxRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const showStarNames = useSpaceStore((s) => s.showStarNames)

  const color       = getCategoryColor(post.category?.color, post.category?.name)
  const radius      = SIZE_RADII[post.size] ?? SIZE_RADII[3]
  const showRing    = hasRing(post.trajectoryOrder)
  const showMoon    = hasMoon(post.trajectoryOrder)

  // ── Big Bang spring ───────────────────────────────────────────────
  const target      = useMemo(() => new THREE.Vector3(...post.position), [post.position])
  const currentPos  = useRef(centroid.clone())   // start at centroid, not world origin
  const arrivedRef  = useRef(false)

  const labelWorldPos = useMemo(
    () => new THREE.Vector3(post.position[0], post.position[1] + radius + 1.2, post.position[2]),
    [post.position, radius]
  )
  const [distanceFactor, setDistanceFactor] = useState(12)
  const prevFactorRef = useRef(12)

  useFrame(() => {
    if (!groupRef.current) return

    // Spring toward target
    if (!arrivedRef.current) {
      currentPos.current.lerp(target, BB_STIFFNESS)
      groupRef.current.position.copy(currentPos.current)

      if (currentPos.current.distanceTo(target) < BB_DONE_RAD) {
        groupRef.current.position.copy(target)
        currentPos.current.copy(target)
        arrivedRef.current = true
        onArrived()
      }
    }

    // Planet self-rotation
    groupRef.current.rotation.y += 0.002

    // Label distance factor
    if (showStarNames) {
      const d = camera.position.distanceTo(labelWorldPos)
      const next = Math.max(1, d * LABEL_DISTANCE_FACTOR)
      if (Math.abs(next - prevFactorRef.current) > 0.5) {
        prevFactorRef.current = next
        setDistanceFactor(next)
      }
    }
  })

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: makePlanetFragmentShader(color),
  }), [color])

  // Register the hitbox mesh (2.5× radius) so raycasts are generous.
  const registry = useContext(StarRegistryContext)
  useEffect(() => {
    const mesh = hitboxRef.current ?? meshRef.current
    if (!mesh || !registry) return
    mesh.userData.isBlogStar = true
    mesh.userData.postId = post.id
    if (meshRef.current) {
      meshRef.current.userData.isBlogStar = true
      meshRef.current.userData.postId = post.id
    }
    registry.register(post.id, mesh)
    return () => registry.unregister(post.id)
  }, [post.id, registry])

  return (
    // group starts at [0,0,0]; useFrame spring drives it to post.position
    <group ref={groupRef}>
      <mesh ref={meshRef} material={shaderMat}>
        <sphereGeometry args={[radius, 48, 48]} />
      </mesh>

      {showRing && <PlanetRing radius={radius} color={color} />}
      {showMoon && <Moon parentRadius={radius} color={color} />}

      {/* Invisible hit-area — 2.5× the visual radius for generous tap/click targets */}
      <mesh ref={hitboxRef} visible={false}>
        <sphereGeometry args={[radius * 2.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Soft glow halo */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[radius * 1.6, 16, 16]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.85}
          transparent opacity={0.28} depthWrite={false}
        />
      </mesh>

      {/* Scene light */}
      <pointLight color={color} intensity={10} distance={radius * 28} decay={2} />

      {showStarNames && (
        <Html position={[0, radius + 1.2, 0]} center distanceFactor={distanceFactor} style={labelStyles}>
          {post.title}
        </Html>
      )}
    </group>
  )
}

export default function BlogStars({ posts }: { posts: Post[] }) {
  const setBigBangDone = useSpaceStore((s) => s.setBigBangDone)
  const arrivedCount   = useRef(0)

  const handleArrived = useCallback(() => {
    arrivedCount.current += 1
    if (arrivedCount.current >= posts.length) {
      setTimeout(() => setBigBangDone(true), BB_SETTLE_MS)
    }
  }, [posts.length, setBigBangDone])

  // Average position of all stars — big bang explodes outward from here
  const centroid = useMemo(() => {
    if (posts.length === 0) return new THREE.Vector3()
    const sum = posts.reduce(
      (acc, p) => acc.add(new THREE.Vector3(...p.position)),
      new THREE.Vector3()
    )
    return sum.divideScalar(posts.length)
  }, [posts])

  // Reset counter when posts change (e.g. refetch)
  useEffect(() => {
    arrivedCount.current = 0
  }, [posts])

  if (posts.length === 0) return null

  return (
    <>
      {posts.map(post => (
        <BlogStar key={post.id} post={post} centroid={centroid} onArrived={handleArrived} />
      ))}
    </>
  )
}
