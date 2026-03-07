/**
 * useUniverseBounds
 *
 * Derives the centroid and approximate radius of the blog-star cloud
 * from the posts array. Used by the orbit fallback in useMobileCamera.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Post } from '@/components/BlogStars/BlogStars'

export interface UniverseBounds {
  /** Centroid of all blog-star positions. */
  center: React.MutableRefObject<THREE.Vector3>
  /** Distance from centroid to the farthest star. */
  radius: React.MutableRefObject<number>
}

export function useUniverseBounds(posts: Post[]): UniverseBounds {
  const center = useRef(new THREE.Vector3())
  const radius = useRef(0)

  useEffect(() => {
    if (!posts.length) return

    const c = new THREE.Vector3()
    for (const p of posts) c.add(new THREE.Vector3(...p.position))
    c.divideScalar(posts.length)
    center.current.copy(c)

    let maxDist = 0
    for (const p of posts) {
      const d = c.distanceTo(new THREE.Vector3(...p.position))
      if (d > maxDist) maxDist = d
    }
    radius.current = maxDist
  }, [posts])

  return { center, radius }
}
