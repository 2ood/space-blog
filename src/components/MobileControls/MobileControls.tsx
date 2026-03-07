'use client'

/**
 * MobileControls — touch input with inertia/velocity
 *
 *   1-finger swipe   → pan (world X/Y). Stars follow finger: swipe right → camera moves left, swipe up → camera moves down.
 *   2-finger swipe   → camera look (orbit)
 *   pinch            → zoom forward along camera axis
 */

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useSpaceStore } from '@/store/spaceStore'
import { useMobile } from '@/hooks/useMobile'

import {
  SWIPE_FORCE,
  SWIPE_FRICTION,
  SWIPE_VELOCITY_CUTOFF,
  ORBIT_SENSITIVITY,
  ROLL_SIGNAL_SCALE,
  GESTURE_THRESHOLD,
  TAP_MAX_MOVE,
  TAP_MAX_MS,
} from '@/config/mobileConfig'

export default function MobileControls() {
  const isMobile       = useMobile()
  const setMobileMove  = useSpaceStore((s) => s.setMobileMove)
  const setMobilePinch = useSpaceStore((s) => s.setMobilePinch)
  const setMobileOrbit = useSpaceStore((s) => s.setMobileOrbit)
  const setMobileRoll  = useSpaceStore((s) => s.setMobileRoll)
  const setMobileTap   = useSpaceStore((s) => s.setMobileTap)
  const { gl } = useThree()
  const gestureMode = useRef<'pinch' | 'orbit' | 'roll' | null>(null)

  const touches         = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist   = useRef<number | null>(null)
  const lastFingerAngle = useRef<number | null>(null)
  const velocity        = useRef({ x: 0, y: 0 })
  const rafId           = useRef<number | null>(null)

  // Tap detection: track start position + time for the first touch
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    if (!isMobile) return

    const getPos = (t: Touch) => ({ x: t.clientX, y: t.clientY })
    const pinchDist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    const decayLoop = () => {
      velocity.current.x *= SWIPE_FRICTION
      velocity.current.y *= SWIPE_FRICTION

      const speed = Math.hypot(velocity.current.x, velocity.current.y)
      if (speed < SWIPE_VELOCITY_CUTOFF) {
        velocity.current = { x: 0, y: 0 }
        setMobileMove({ x: 0, y: 0 })
        rafId.current = null
        return
      }

      setMobileMove({ x: velocity.current.x, y: velocity.current.y })
      rafId.current = requestAnimationFrame(decayLoop)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      for (const t of Array.from(e.changedTouches))
        touches.current.set(t.identifier, getPos(t))

      // Record tap candidate only for the very first finger down
      if (e.touches.length === 1) {
        const t = e.touches[0]
        tapStart.current = { x: t.clientX, y: t.clientY, t: Date.now() }
      } else {
        tapStart.current = null // multi-touch cancels tap
      }

      if (e.touches.length === 2) {
        const [a, b] = Array.from(e.touches)
        lastPinchDist.current  = pinchDist(a, b)
        lastFingerAngle.current = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX)
        gestureMode.current = null

        // Kill any residual 1-finger inertia — if mobileMove keeps running
        // while the orbit center is fixed, camera.position drifts and the
        // center appears to wobble during the swipe.
        velocity.current = { x: 0, y: 0 }
        setMobileMove({ x: 0, y: 0 })
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const active = Array.from(e.touches)

      // ── Two fingers: pinch zoom + orbit look ─────────────────────
      if (active.length === 2) {
        const [a, b] = active
        const dist = pinchDist(a, b)

        const prevA = touches.current.get(a.identifier)
        const prevB = touches.current.get(b.identifier)
        if (!prevA || !prevB) return

        const dx = ((a.clientX - prevA.x) + (b.clientX - prevB.x)) / 2
        const dy = ((a.clientY - prevA.y) + (b.clientY - prevB.y)) / 2
        const distDelta = dist - (lastPinchDist.current ?? dist)

        // Angle of the line between the two fingers
        const angle = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX)
        let angleDelta = 0
        if (lastFingerAngle.current !== null) {
          angleDelta = angle - lastFingerAngle.current
          // Wrap to [-π, π] to handle atan2 discontinuity
          if (angleDelta >  Math.PI) angleDelta -= 2 * Math.PI
          if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI
        }

        // Classify: whichever signal dominates wins.
        // angleDelta is in radians — scale to px-equivalent for fair comparison.
        if (gestureMode.current === null) {
          const rollSignal  = Math.abs(angleDelta) * ROLL_SIGNAL_SCALE
          const pinchSignal = Math.abs(distDelta)
          const orbitSignal = Math.abs(dx) + Math.abs(dy)
          const dominant    = Math.max(rollSignal, pinchSignal, orbitSignal)
          if (dominant > GESTURE_THRESHOLD) {
            if (rollSignal  >= pinchSignal && rollSignal  >= orbitSignal) gestureMode.current = 'roll'
            else if (pinchSignal >= orbitSignal)                          gestureMode.current = 'pinch'
            else                                                           gestureMode.current = 'orbit'
          }
        }

        if (gestureMode.current === 'pinch') setMobilePinch({ distDelta })
        if (gestureMode.current === 'roll')  setMobileRoll({ delta: angleDelta })
        if (gestureMode.current === 'orbit') setMobileOrbit({ yaw: dx * ORBIT_SENSITIVITY, pitch: dy * ORBIT_SENSITIVITY })

        lastPinchDist.current   = dist
        lastFingerAngle.current = angle
        for (const t of active) touches.current.set(t.identifier, getPos(t))

        return
      }

      // ── One finger: pan world X/Y with inertia ───────────────────
      // "Drag universe" feel: swipe right → stars follow right → camera moves left (-X)
      //                       swipe up    → stars follow up    → camera moves down (-Y)
      if (active.length === 1) {
        lastPinchDist.current  = null
        const t    = active[0]
        const prev = touches.current.get(t.identifier)
        if (!prev) return

        const dx = t.clientX - prev.x
        const dy = t.clientY - prev.y

        // Cancel tap if finger has moved beyond threshold
        if (tapStart.current) {
          const moved = Math.hypot(t.clientX - tapStart.current.x, t.clientY - tapStart.current.y)
          if (moved > TAP_MAX_MOVE) tapStart.current = null
        }

        velocity.current.x *= 0.9
        velocity.current.y *= 0.9

        // Raw screen deltas — sign convention handled in useMobileCamera
        velocity.current.x += dx * SWIPE_FORCE
        velocity.current.y += dy * SWIPE_FORCE

        setMobileMove({ x: velocity.current.x, y: velocity.current.y })
        touches.current.set(t.identifier, getPos(t))
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches))
        touches.current.delete(t.identifier)

      // ── Tap detection ─────────────────────────────────────────────
      if (e.touches.length === 0 && tapStart.current) {
        const elapsed = Date.now() - tapStart.current.t
        if (elapsed < TAP_MAX_MS) {
          const rect = gl.domElement.getBoundingClientRect()
          const changedTouch = e.changedTouches[0]
          // Account for visualViewport offset (address bar, pinch zoom on Android/Samsung)
          const vvOffsetX = window.visualViewport?.offsetLeft ?? 0
          const vvOffsetY = window.visualViewport?.offsetTop  ?? 0
          const cx = changedTouch.clientX - vvOffsetX
          const cy = changedTouch.clientY - vvOffsetY
          setMobileTap({
            x: cx,
            y: cy,
            ndcX: ((cx - rect.left) / rect.width)  * 2 - 1,
            ndcY: -((cy - rect.top)  / rect.height) * 2 + 1,
          })
        }
        tapStart.current = null
      }

      if (e.touches.length === 0) {
        lastPinchDist.current   = null
        lastFingerAngle.current = null
        setMobilePinch(null)
        setMobileRoll(null)

        const speed = Math.hypot(velocity.current.x, velocity.current.y)

        if (speed > SWIPE_VELOCITY_CUTOFF) {
          rafId.current = requestAnimationFrame(decayLoop)
        } else {
          velocity.current = { x: 0, y: 0 }
          setMobileMove({ x: 0, y: 0 })
        }
      } else if (e.touches.length < 2) {
        setMobilePinch(null)
        setMobileRoll(null)
        lastPinchDist.current   = null
        lastFingerAngle.current = null
      }

      setMobileOrbit({ yaw: 0, pitch: 0 })
      gestureMode.current = null
    }

    const canvas = gl.domElement

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
  }, [isMobile, gl, setMobileMove, setMobilePinch, setMobileOrbit, setMobileRoll, setMobileTap])

  return null
}
