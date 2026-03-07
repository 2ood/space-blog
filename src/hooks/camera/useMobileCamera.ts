/**
 * useMobileCamera
 *
 * Owns all mobile touch camera behaviour consumed from the Zustand store:
 *   - 1-finger swipe  → forward/strafe/up movement (mobileMove)
 *   - 2-finger swipe  → camera look (mobileOrbit)
 *   - Pinch           → zoom toward pinch midpoint (mobilePinch)
 *   - Orbital gesture → orbit around aimed star or view-direction fallback (mobileOrbit)
 *
 * Returns a `tickMobile` function that CameraController calls at the top of
 * useFrame, before the free-roam tick runs.
 */

import { useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'
import type { StarRegistryHandle } from '@/hooks/camera/useBlogStarRegistry'
import type { UniverseBounds } from '@/hooks/camera/useUniverseBounds'
import { useFlyTo } from '@/hooks/camera/useFlyTo'
import {
  PINCH_SENSITIVITY,
  PINCH_MIN_DIST,
  PINCH_MAX_DIST,
  ORBIT_SPEED,
  SWIPE_SPEED,
} from '@/config/mobileConfig'

export interface MobileCameraTick {
  /** Call at top of useFrame. Returns true if an orbit gesture is active. */
  (delta: number): boolean
}

export function useMobileCamera(
  registry: StarRegistryHandle,
  bounds: UniverseBounds,
): MobileCameraTick {
  const { camera } = useThree()

  const orbitCenter      = useRef(new THREE.Vector3())
  const orbitActive      = useRef(false)
  const orbitJustStarted = useRef(false)
  const raycaster        = useRef(new THREE.Raycaster())

  const { startFlyTo, flyTick } = useFlyTo(camera)

  const postsRef = useRef(useSpaceStore.getState().posts)
  useRef(useSpaceStore.subscribe((s) => { postsRef.current = s.posts }))

  const getAimedStarPos = (): THREE.Vector3 | null => {
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
    const hits = raycaster.current.intersectObjects(registry.meshes(), false)
    if (!hits.length) return null
    const post = postsRef.current.find(p => p.id === hits[0].object.userData.postId)
    return post ? new THREE.Vector3(...post.position) : null
  }

  return (delta: number): boolean => {
    const { mobileMove, mobilePinch, mobileOrbit, mobileRoll, mobileTap, setMobileTap } = useSpaceStore.getState()

    // ── Fly-to (tap initiated) ────────────────────────────────────
    if (flyTick()) return true

    // ── Tap: raycast at tap NDC coords, fly to hit star ──────────
    if (mobileTap) {
      raycaster.current.setFromCamera(new THREE.Vector2(mobileTap.ndcX, mobileTap.ndcY), camera)
      const hits = raycaster.current.intersectObjects(registry.meshes(), false)
      if (hits.length) {
        const post = postsRef.current.find(p => p.id === hits[0].object.userData.postId)
        if (post) startFlyTo(new THREE.Vector3(...post.position), post, true)
      }
      setMobileTap(null)
    }

    // ── Orbital gesture ──────────────────────────────────────────
    // Checked first — when orbiting, move/pinch must not run or they'll
    // shift camera.position away from the fixed orbitCenter each frame.
    if (mobileOrbit.yaw !== 0 || mobileOrbit.pitch !== 0) {
      if (!orbitActive.current) {
        const aimed = getAimedStarPos()

        if (aimed) {
          orbitCenter.current.copy(aimed)
        } else {
          const dir  = new THREE.Vector3()
          camera.getWorldDirection(dir)
          const dist = camera.position.distanceTo(bounds.center.current)
          const orbitRadius = Math.max(dist, bounds.radius.current * 0.6)
          orbitCenter.current.copy(camera.position).addScaledVector(dir, orbitRadius)
        }

        orbitActive.current = true
        orbitJustStarted.current = true
        return true // skip this frame's delta — it may be large due to threshold accumulation
      }

      // Skip the first real delta frame so accumulated threshold px don't cause a snap
      if (orbitJustStarted.current) {
        orbitJustStarted.current = false
        return true
      }

      const center = orbitCenter.current
      const offset = camera.position.clone().sub(center)
      const radius = offset.length()

      // Apply yaw (world Y) and pitch (camera right) directly to the quaternion.
      // No lookAt — that causes flipping at poles. Rotate the quaternion first,
      // then reposition the camera at the same radius along the new forward axis.
      const yawQ   = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
        -mobileOrbit.yaw * ORBIT_SPEED * delta,
      )
      const pitchQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
        -mobileOrbit.pitch * ORBIT_SPEED * delta,
      )

      camera.quaternion.premultiply(yawQ).premultiply(pitchQ)

      // Reposition: camera sits at `radius` behind the new forward direction
      const newForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      camera.position.copy(center).addScaledVector(newForward, -radius)

      return true
    }

    orbitActive.current      = false
    orbitJustStarted.current = false

    // ── 1-finger swipe: pan in camera screen-space ───────────────
    // Both axes derived from camera quaternion so they always match what's
    // on screen — top-down, side-on, any angle.
    // mobileMove.x = raw screen dx (+ = finger right)
    // mobileMove.y = raw screen dy (+ = finger down)
    if (mobileMove.x !== 0 || mobileMove.y !== 0) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      const up    = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
      camera.position.addScaledVector(right, -mobileMove.x * delta * SWIPE_SPEED)  // swipe right → stars follow right
      camera.position.addScaledVector(up,     mobileMove.y * delta * SWIPE_SPEED)  // swipe down  → stars follow down
    }

    // ── Pinch: zoom along camera forward axis ───────────────────
    // Clamps are measured from the star cluster center, not world origin,
    // so zoom limits are consistent regardless of where the cluster sits.
    // We skip the movement rather than rescaling position, so no drift occurs.
    if (mobilePinch) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      const step = mobilePinch.distDelta * PINCH_SENSITIVITY

      const distFromCenter = camera.position.distanceTo(bounds.center.current)
      const wouldExceedMax = step < 0 && distFromCenter >= PINCH_MAX_DIST
      const wouldExceedMin = step > 0 && distFromCenter <= PINCH_MIN_DIST

      if (!wouldExceedMax && !wouldExceedMin) {
        camera.position.addScaledVector(forward, step)
      }
    }

    // ── Roll: two-finger rotation around camera's Z axis ─────────
    // angleDelta is in radians, positive = clockwise on screen.
    // camera.rotateZ rotates around the camera's local Z (into the screen),
    // so positive delta rolls the view clockwise.
    if (mobileRoll) {
      camera.rotateZ(mobileRoll.delta)
    }

    return false
  }
}
