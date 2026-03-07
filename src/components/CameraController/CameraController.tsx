'use client'

/**
 * CameraController
 *
 * Thin orchestrator — wires together the focused hooks:
 *
 *   useBlogStarRegistry  → mesh registry for O(1) raycasting (no scene.traverse)
 *   useUniverseBounds    → centroid + radius of the star cloud (for orbit fallback)
 *   useMobileCamera      → all touch input (move / look / pinch / orbit)
 *   useFreeRoam          → pointer-lock, WASD, mouse-look, fly-to, trajectory breakout
 */

import { useFrame } from '@react-three/fiber'
import { useSpaceStore } from '@/store/spaceStore'
import { useStarRegistry } from '@/hooks/camera/useBlogStarRegistry'
import { useUniverseBounds } from '@/hooks/camera/useUniverseBounds'
import { useMobileCamera } from '@/hooks/camera/useMobileCamera'
import { useFreeRoam } from '@/hooks/camera/useFreeRoam'
import { useMobile } from '@/hooks/useMobile'

export default function CameraController() {
  const isMobile = useMobile()
  const registry = useStarRegistry()
  const posts    = useSpaceStore((s) => s.posts)
  const bounds   = useUniverseBounds(posts)

  const tickMobile   = useMobileCamera(registry, bounds)
  const tickFreeRoam = useFreeRoam(registry)

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  useFrame((_, delta) => {
    const { navMode, trajectoryBreakout } = useSpaceStore.getState()

    const orbitActive = tickMobile(delta)

    // On mobile, skip free-roam entirely — mobile tick handles everything
    if (isMobile) return

    if (navMode === 'trajectory' && !trajectoryBreakout) return

    if (!orbitActive) {
      tickFreeRoam(delta)
    }
  })

  return null
}
