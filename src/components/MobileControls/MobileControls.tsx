'use client'

/**
 * MobileControls — touch input with inertia/velocity
 *
 *   1-finger swipe   → move (horizontal plane: forward/strafe with inertia)
 *   2-finger swipe   → camera look
 *   pinch            → zoom toward the world point under the pinch midpoint
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useSpaceStore } from '@/store/spaceStore'
import { useMobile } from '@/hooks/useMobile'

const PINCH_SENSITIVITY = 0.3
const SWIPE_FORCE       = 0.08
const FRICTION          = 0.88
const VELOCITY_CUTOFF   = 0.001

export default function MobileControls() {
  const isMobile       = useMobile()
  const setMobileLook  = useSpaceStore((s) => s.setMobileLook)
  const setMobileMove  = useSpaceStore((s) => s.setMobileMove)
  const setMobilePinch = useSpaceStore((s) => s.setMobilePinch)
  const setMobileOrbit = useSpaceStore((s) => s.setMobileOrbit)
  const { camera, size } = useThree()
  const gestureMode = useRef<'pinch' | 'orbit' | null>(null)

  const touches        = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist  = useRef<number | null>(null)
  const pinchDirection = useRef<THREE.Vector3 | null>(null)
  const velocity       = useRef({ forward: 0, right: 0, up: 0 })
  const rafId          = useRef<number | null>(null)

  useEffect(() => {
    if (!isMobile) return

    const getPos = (t: Touch) => ({ x: t.clientX, y: t.clientY })
    const pinchDist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    // Convert screen px → normalized device coords → world-space ray direction
    const screenToRayDir = (screenX: number, screenY: number): THREE.Vector3 => {
      const ndcX =  (screenX / size.width)  * 2 - 1
      const ndcY = -(screenY / size.height) * 2 + 1
      const vec = new THREE.Vector3(ndcX, ndcY, 0.5)
      vec.unproject(camera)
      vec.sub(camera.position).normalize()
      return vec
    }

    // Decay loop for swipe inertia
    const decayLoop = () => {
      velocity.current.forward *= FRICTION
      velocity.current.right   *= FRICTION
      velocity.current.up      *= FRICTION

      const speed = Math.hypot(velocity.current.forward, velocity.current.right)
      if (speed < VELOCITY_CUTOFF) {
        velocity.current ={ forward: 0, right: 0, up: 0 }
        setMobileMove({ forward: 0, right: 0, up: 0 })
        rafId.current = null
        return
      }

      setMobileMove({
        forward: velocity.current.forward,
        right: velocity.current.right,
        up: velocity.current.up
      })
      rafId.current = requestAnimationFrame(decayLoop)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      for (const t of Array.from(e.changedTouches))
        touches.current.set(t.identifier, getPos(t))

      // On two-finger start, compute the pinch target ray from midpoint
      if (e.touches.length === 2) {
        const [a, b] = Array.from(e.touches)
        const midX = (a.clientX + b.clientX) / 2
        const midY = (a.clientY + b.clientY) / 2
      
        pinchDirection.current = screenToRayDir(midX, midY)
        lastPinchDist.current  = pinchDist(a, b)
        gestureMode.current = null
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const active = Array.from(e.touches)

      // ── Two fingers: pinch zoom + look ───────────────────────────
      if (active.length === 2) {

        const [a, b] = active
        const dist = pinchDist(a, b)
      
        const prevA = touches.current.get(a.identifier)
        const prevB = touches.current.get(b.identifier)
        if (!prevA || !prevB) return
      
        const dx = ((a.clientX - prevA.x) + (b.clientX - prevB.x)) / 2
        const dy = ((a.clientY - prevA.y) + (b.clientY - prevB.y)) / 2
        const distDelta = dist - (lastPinchDist.current ?? dist)
      
        // Decide gesture type
        if (gestureMode.current === null) {
          if (Math.abs(distDelta) > 6) {
            gestureMode.current = 'pinch'
          } else if (Math.abs(dx) + Math.abs(dy) > 6) {
            gestureMode.current = 'orbit'
          }
        }
      
        // PINCH
        if (gestureMode.current === 'pinch' && pinchDirection.current) {
          const delta = distDelta * PINCH_SENSITIVITY
          const dir = pinchDirection.current
      
          setMobilePinch({
            dx: dir.x * delta,
            dy: dir.y * delta,
            dz: dir.z * delta
          })
        }
      
        // ORBIT
        if (gestureMode.current === 'orbit') {
          setMobileOrbit({
            yaw: dx * 0.006,
            pitch: dy * 0.006
          })
        }

        lastPinchDist.current = dist
        for (const t of active) touches.current.set(t.identifier, getPos(t))
      
        return
      }

      // ── One finger: move with inertia ─────────────────────────────
      if (active.length === 1) {
        lastPinchDist.current  = null
        pinchDirection.current = null
        const t    = active[0]
        const prev = touches.current.get(t.identifier)
        if (!prev) return

        const dx = t.clientX - prev.x
        const dy = t.clientY - prev.y

        // apply damping so velocity decays even while finger stays down
        velocity.current.forward *= 0.9
        velocity.current.right   *= 0.9
        velocity.current.up      *= 0.9

        // horizontal swipe still strafes
        velocity.current.right += -dx * SWIPE_FORCE

        // vertical swipe now controls camera height
        velocity.current.up += dy * SWIPE_FORCE

        setMobileMove({ ...velocity.current })
        touches.current.set(t.identifier, getPos(t))
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches))
        touches.current.delete(t.identifier)

      if (e.touches.length === 0) {
        lastPinchDist.current  = null
        pinchDirection.current = null
        setMobileLook({ dx: 0, dy: 0 })
        setMobilePinch(null)

        const speed = Math.hypot(
          velocity.current.forward,
          velocity.current.right,
          velocity.current.up
        )

        if (speed > VELOCITY_CUTOFF) {
          rafId.current = requestAnimationFrame(decayLoop)
        } else {
          velocity.current = { forward: 0, right: 0, up: 0 }
          setMobileMove({ forward: 0, right: 0, up: 0 })
        }
      } else if (e.touches.length < 2) {
        // Dropped to one finger mid-pinch
        setMobilePinch(null)
        lastPinchDist.current  = null
        pinchDirection.current = null
      }

      setMobileOrbit({ yaw: 0, pitch: 0 })
      gestureMode.current = null
    }

    const canvas = document.querySelector('canvas')
    if (!canvas) return

    canvas.addEventListener('touchstart',  onTouchStart, { passive: false })
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd,   { passive: false })

    return () => {
      canvas.removeEventListener('touchstart',  onTouchStart)
      canvas.removeEventListener('touchmove',   onTouchMove)
      canvas.removeEventListener('touchend',    onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [isMobile, camera, size, setMobileLook, setMobileMove, setMobilePinch, setMobileOrbit])

  return null
}
