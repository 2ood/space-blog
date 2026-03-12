/**
 * positionUtils.ts
 *
 * Computes the 3D position for a new planet.
 *
 * Priority:
 *   1. Connected posts supplied  → geometric placement relative to them (DOF by count)
 *   2. No connections, tags given → find the void point in the tag cluster
 *   3. No connections, no tags   → random sparse point in the universe
 *
 * Degrees of freedom when using connections:
 *   1 planet  → full sphere  (3 DOF)
 *   2 planets → torus around axis (height along axis free)
 *   3 planets → midpoint in plane + random height off plane (1 DOF)
 *   4+        → midpoint + small jitter (0 DOF)
 */

import * as THREE from 'three'
import type { Post } from '@/components/BlogStars/BlogStars'

// Inlined — avoids @/ alias resolution issues when imported from API routes
const PLANET_PLACEMENT_RADIUS = 18
const PLANET_MIN_CLEARANCE    = 12
const PLANET_FALLBACK_SPREAD  = 80
const VOID_CANDIDATES         = 24

const MAX_ATTEMPTS = 30

// ── Random helpers ────────────────────────────────────────────────────────────

function randomSphere(radius: number): THREE.Vector3 {
  let v = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  )
  if (v.lengthSq() < 1e-6) v = new THREE.Vector3(1, 0, 0)
  v.normalize()
  return v.multiplyScalar(radius * (0.6 + Math.random() * 0.4))
}

function randomInDisk(radius: number, normal: THREE.Vector3): THREE.Vector3 {
  const { perp1, perp2 } = orthoBasis(normal)
  const angle = Math.random() * Math.PI * 2
  const r     = Math.sqrt(Math.random()) * radius
  return perp1.clone().multiplyScalar(r * Math.cos(angle))
        .add(perp2.clone().multiplyScalar(r * Math.sin(angle)))
}

function orthoBasis(n: THREE.Vector3): { perp1: THREE.Vector3; perp2: THREE.Vector3 } {
  const up = Math.abs(n.y) < 0.99
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0)
  const perp1 = new THREE.Vector3().crossVectors(n, up).normalize()
  const perp2 = new THREE.Vector3().crossVectors(n, perp1).normalize()
  return { perp1, perp2 }
}

// ── Clearance helpers ─────────────────────────────────────────────────────────

function closestDistance(candidate: THREE.Vector3, allPosts: Post[]): number {
  let min = Infinity
  for (const p of allPosts) {
    const d = candidate.distanceTo(new THREE.Vector3(...p.position))
    if (d < min) min = d
  }
  return min
}

function enforceClearance(
  candidate: THREE.Vector3,
  midpoint: THREE.Vector3,
  allPosts: Post[],
): THREE.Vector3 {
  let best      = candidate.clone()
  let bestClear = closestDistance(best, allPosts)
  if (bestClear >= PLANET_MIN_CLEARANCE) return best

  const dir = candidate.clone().sub(midpoint)
  if (dir.lengthSq() < 0.001) dir.set(1, 0, 0)
  dir.normalize()

  let dist = candidate.distanceTo(midpoint)
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    dist += PLANET_MIN_CLEARANCE * 0.5
    const attempt = midpoint.clone().addScaledVector(dir, dist)
    const clear   = closestDistance(attempt, allPosts)
    if (clear > bestClear) { best = attempt.clone(); bestClear = clear }
    if (clear >= PLANET_MIN_CLEARANCE) return attempt
  }
  return best
}

// ── Tag-cluster void finder ───────────────────────────────────────────────────

function findVoidInTagCluster(names: string[], allPosts: Post[]): THREE.Vector3 {
  const primaryTag = names[0]

  let clusterPosts = primaryTag
    ? allPosts.filter(p => p.category?.name === primaryTag)
    : []

  if (clusterPosts.length === 0 && names.length > 1) {
    clusterPosts = allPosts.filter(p => p.category && names.includes(p.category.name))
  }

  // No cluster — random sparse
  if (clusterPosts.length === 0) {
    const s = PLANET_FALLBACK_SPREAD
    return new THREE.Vector3(
      (Math.random() - 0.5) * s,
      (Math.random() - 0.5) * s * 0.4,
      (Math.random() - 0.5) * s,
    )
  }

  const centroid = clusterPosts.reduce(
    (acc, p) => acc.add(new THREE.Vector3(...p.position)),
    new THREE.Vector3(),
  ).divideScalar(clusterPosts.length)

  const spread = clusterPosts.reduce((max, p) => {
    return Math.max(max, centroid.distanceTo(new THREE.Vector3(...p.position)))
  }, 0)

  const probeRadius = Math.max(spread, PLANET_PLACEMENT_RADIUS) + PLANET_PLACEMENT_RADIUS

  let best: THREE.Vector3 | null = null
  let bestScore = -Infinity

  for (let i = 0; i < VOID_CANDIDATES; i++) {
    const probe = centroid.clone().add(randomSphere(probeRadius))
    const score = closestDistance(probe, allPosts)
    if (score > bestScore) {
      bestScore = score
      best = probe.clone()
    }
  }

  return best!
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computePosition(
  connectedPosts: Post[],
  allPosts: Post[],
  categoryNames: string[] = [],
): [number, number, number] {
  const R = PLANET_PLACEMENT_RADIUS

  let candidate: THREE.Vector3

  if (connectedPosts.length === 0) {
    candidate = findVoidInTagCluster(categoryNames, allPosts)

  } else if (connectedPosts.length === 1) {
    const p0 = new THREE.Vector3(...connectedPosts[0].position)
    candidate = p0.clone().add(randomSphere(R))

  } else if (connectedPosts.length === 2) {
    const p0   = new THREE.Vector3(...connectedPosts[0].position)
    const p1   = new THREE.Vector3(...connectedPosts[1].position)
    const mid  = p0.clone().add(p1).multiplyScalar(0.5)
    const axis = p1.clone().sub(p0)
    if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0)
    axis.normalize()

    const { perp1, perp2 } = orthoBasis(axis)
    const angle  = Math.random() * Math.PI * 2
    const radial = R * (0.5 + Math.random() * 0.5)
    const height = (Math.random() - 0.5) * 2 * R

    candidate = mid.clone()
      .addScaledVector(perp1, radial * Math.cos(angle))
      .addScaledVector(perp2, radial * Math.sin(angle))
      .addScaledVector(axis,  height)

  } else if (connectedPosts.length === 3) {
    const p0  = new THREE.Vector3(...connectedPosts[0].position)
    const p1  = new THREE.Vector3(...connectedPosts[1].position)
    const p2  = new THREE.Vector3(...connectedPosts[2].position)
    const mid = p0.clone().add(p1).add(p2).divideScalar(3)

    const e1     = p1.clone().sub(p0)
    const e2     = p2.clone().sub(p0)
    const normal = new THREE.Vector3().crossVectors(e1, e2)

    if (normal.lengthSq() < 0.001) {
      candidate = mid.clone().add(randomSphere(R))
    } else {
      normal.normalize()
      const height      = (Math.random() - 0.5) * 2 * R
      const inPlaneDisk = randomInDisk(R * 0.4, normal)
      candidate = mid.clone().add(inPlaneDisk).addScaledVector(normal, height)
    }

  } else {
    const sum = connectedPosts.reduce(
      (acc, p) => acc.add(new THREE.Vector3(...p.position)),
      new THREE.Vector3(),
    )
    const mid = sum.divideScalar(connectedPosts.length)
    candidate = mid.clone().add(randomSphere(R * 0.3))
  }

  const midpoint = connectedPosts.length > 0
    ? connectedPosts.reduce(
        (acc, p) => acc.add(new THREE.Vector3(...p.position)),
        new THREE.Vector3(),
      ).divideScalar(connectedPosts.length)
    : candidate.clone()

  const final = enforceClearance(candidate, midpoint, allPosts)

  return [
    Math.round(final.x * 100) / 100,
    Math.round(final.y * 100) / 100,
    Math.round(final.z * 100) / 100,
  ]
}
