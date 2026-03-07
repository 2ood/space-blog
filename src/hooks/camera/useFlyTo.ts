/**
 * useFlyTo
 *
 * Shared camera focus logic for desktop click and mobile tap.
 *
 * Modes:
 *   fly    — full position + rotation lerp toward star (desktop free roam & observer)
 *   tilt   — rotation slerp only, no position change (mobile, trajectory)
 *
 * PostCard is shown only after the tilt/fly animation completes.
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'
import { computeStopPosition } from '@/utils/cameraUtils'
import {
  FLY_STOP_DISTANCE,
  FLY_LERP,
  FLY_SLERP,
  FLY_ARRIVE_THRESHOLD,
  MAX_WORLD_DISTANCE,
} from '@/config/desktopConfig'

const TILT_SLERP      = 0.06
const TILT_ARRIVE_RAD = 0.002  // ~0.11° remaining — imperceptible, no visible snap

export interface FlyToHandle {
  startFlyTo:  (starPos: THREE.Vector3, post?: { id: string } | null, isMobile?: boolean) => void
  flyTick:     () => boolean
  isFlyingRef: React.MutableRefObject<boolean>
}

export function useFlyTo(camera: THREE.Camera): FlyToHandle {
  const setActivePost = useSpaceStore((s) => s.setActivePost)

  const postsRef      = useRef(useSpaceStore.getState().posts)
  const navModeRef    = useRef(useSpaceStore.getState().navMode)
  const isFreeroamRef = useRef(useSpaceStore.getState().isFreeroam)
  useRef(useSpaceStore.subscribe((s) => { postsRef.current      = s.posts }))
  useRef(useSpaceStore.subscribe((s) => { navModeRef.current    = s.navMode }))
  useRef(useSpaceStore.subscribe((s) => { isFreeroamRef.current = s.isFreeroam }))

  // ── Fly state ─────────────────────────────────────────────────────
  const flyStarPos  = useRef<THREE.Vector3 | null>(null)
  const flyDest     = useRef<THREE.Vector3 | null>(null)
  const flyTargetId = useRef<string | null>(null)

  // ── Tilt state ────────────────────────────────────────────────────
  const tiltTargetQ = useRef<THREE.Quaternion | null>(null)
  const tiltPostId  = useRef<string | null>(null)

  const isFlying = useRef(false)

  const resolvePost = (post?: { id: string } | null) =>
    post ? (postsRef.current.find(p => p.id === post.id) ?? null) : null

  /** Compute the quaternion that faces the camera toward starPos. */
  const lookAtQ = (starPos: THREE.Vector3): THREE.Quaternion => {
    const up = new THREE.Vector3(0, 1, 0)
    const m  = new THREE.Matrix4().lookAt(camera.position, starPos, up)
    return new THREE.Quaternion().setFromRotationMatrix(m)
  }

  /** Begin a smooth tilt-only animation toward starPos, show PostCard on arrival. */
  const startTilt = (starPos: THREE.Vector3, post?: { id: string } | null) => {
    tiltTargetQ.current = lookAtQ(starPos)
    tiltPostId.current  = post?.id ?? null
    isFlying.current    = true
    setActivePost(null) // clear previous card while tilting
  }

  const startFlyTo = (starPos: THREE.Vector3, post?: { id: string } | null, isMobile = false) => {
    const mode     = navModeRef.current
    const freeroam = isFreeroamRef.current  // true = pointer locked on desktop

    // ── Mobile: smooth tilt + PostCard on arrival, never fly ─────
    if (isMobile) {
      startTilt(starPos, post)
      return
    }

    // ── Desktop trajectory + free roam (breakout): show confirm dialog ──
    if (mode === 'trajectory' && freeroam) {
      useSpaceStore.getState().setTrajectoryExitConfirm({ starPos: starPos.toArray() as [number, number, number], postId: post?.id ?? null })
      return
    }

    // ── Desktop trajectory + observer: smooth tilt + PostCard ────
    if (mode === 'trajectory' && !freeroam) {
      startTilt(starPos, post)
      return
    }

    // ── Desktop observer (free mode, not pointer locked): tilt only ─
    if (!freeroam) {
      startTilt(starPos, post)
      return
    }

    // ── Desktop free roam (pointer locked): full fly-to ───────────
    flyStarPos.current  = starPos.clone()
    flyDest.current     = computeStopPosition(camera.position, starPos, FLY_STOP_DISTANCE)
    flyTargetId.current = post?.id ?? null
    tiltTargetQ.current = lookAtQ(starPos)
    isFlying.current    = true
    setActivePost(null)
  }

  const flyTick = (): boolean => {
    // ── Consume any outside-Canvas fly request ────────────────────
    const pending = useSpaceStore.getState().pendingFlyTo
    if (pending) {
      useSpaceStore.getState().setPendingFlyTo(null)
      const post = pending.postId ? postsRef.current.find(p => p.id === pending.postId) ?? null : null
      startFlyTo(new THREE.Vector3(...pending.starPos), post)
    }
    // ── Tilt-only animation ───────────────────────────────────────
    if (tiltTargetQ.current && !flyStarPos.current) {
      camera.quaternion.slerp(tiltTargetQ.current, TILT_SLERP)
      if (camera.quaternion.angleTo(tiltTargetQ.current) < TILT_ARRIVE_RAD) {
        camera.quaternion.copy(tiltTargetQ.current)
        tiltTargetQ.current = null
        isFlying.current    = false
        // Show PostCard now that tilt is done
        if (tiltPostId.current) {
          setActivePost(resolvePost({ id: tiltPostId.current }))
          tiltPostId.current = null
        }
      }
      return true
    }

    // ── Fly animation (position + rotation) ──────────────────────
    if (flyStarPos.current && flyDest.current) {
      const star = flyStarPos.current

      // Smoothly face the star using lookAt slerp
      camera.quaternion.slerp(lookAtQ(star), FLY_SLERP)

      camera.position.lerp(flyDest.current, FLY_LERP)
      if (camera.position.length() > MAX_WORLD_DISTANCE) {
        camera.position.setLength(MAX_WORLD_DISTANCE)
      }

      if (camera.position.distanceTo(flyDest.current) < FLY_ARRIVE_THRESHOLD) {
        camera.position.copy(flyDest.current)
        flyStarPos.current  = null
        flyDest.current     = null
        tiltTargetQ.current = null
        isFlying.current    = false
        if (flyTargetId.current) {
          setActivePost(resolvePost({ id: flyTargetId.current }))
          flyTargetId.current = null
        }
      }
      return true
    }

    return false
  }

  return { startFlyTo, flyTick, isFlyingRef: isFlying }
}

