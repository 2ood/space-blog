/**
 * useFreeRoam
 *
 * Owns all desktop free-roam camera behaviour:
 *   - Pointer lock enter/exit (right-click)
 *   - Mouse-look (movementX/Y while locked)
 *   - WASD / arrow / E / Q / C keyboard movement with damped velocity
 *   - Scroll-wheel dolly
 *   - Left-click fly-to aimed blog star
 *   - Trajectory breakout: save/restore camera anchor on pointer-lock toggle
 *
 * Runs its per-frame logic via the returned `tickFreeRoam` function,
 * which CameraController calls inside useFrame after mobile input is processed.
 */

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'
import type { StarRegistryHandle } from '@/hooks/camera/useBlogStarRegistry'
import { useFlyTo } from '@/hooks/camera/useFlyTo'
import {
  LOOK_SPEED,
  MOVE_SPEED,
  MOVE_DAMPING,
  SCROLL_SPEED,
} from '@/config/desktopConfig'

export interface FreeRoamTick {
  /** Call once per useFrame, before applying the camera position. Returns true while a fly-to is active. */
  (delta: number): boolean
}

export function useFreeRoam(registry: StarRegistryHandle): FreeRoamTick {
  const { camera, gl } = useThree()

  // ── Refs shared between event handlers and useFrame ──────────────
  const keys            = useRef<Set<string>>(new Set())
  const velocity        = useRef(new THREE.Vector3())
  const isPointerLocked = useRef(false)
  const scrollDolly     = useRef(0)

  const { startFlyTo, flyTick, isFlyingRef } = useFlyTo(camera)

  const raycaster = useRef(new THREE.Raycaster())

  // ── Store actions / reactive state (read as refs where possible) ──
  const setActivePost         = useSpaceStore((s) => s.setActivePost)
  const setHoveredPost        = useSpaceStore((s) => s.setHoveredPost)
  const setHoverPos           = useSpaceStore((s) => s.setHoverPos)
  const setIsFreeroam         = useSpaceStore((s) => s.setIsFreeroam)
  const setTrajectoryBreakout = useSpaceStore((s) => s.setTrajectoryBreakout)
  const setTrajectoryAnchor   = useSpaceStore((s) => s.setTrajectoryAnchor)

  // Stable refs for values read inside event handlers (avoids stale closures)
  const navModeRef          = useRef(useSpaceStore.getState().navMode)
  const trajectoryStatusRef = useRef(useSpaceStore.getState().trajectoryStatus)
  const postsRef            = useRef(useSpaceStore.getState().posts)

  useEffect(() => useSpaceStore.subscribe(
    (s) => { navModeRef.current = s.navMode }
  ), [])
  useEffect(() => useSpaceStore.subscribe(
    (s) => { trajectoryStatusRef.current = s.trajectoryStatus }
  ), [])
  useEffect(() => useSpaceStore.subscribe(
    (s) => { postsRef.current = s.posts }
  ), [])

  // ── Camera init ───────────────────────────────────────────────────
  useEffect(() => {
    camera.position.set(0, 0, 5)
  }, [camera])

  // ── Helpers ───────────────────────────────────────────────────────
  const getAimedPost = () => {
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
    const hits = raycaster.current.intersectObjects(registry.meshes(), false)
    if (!hits.length) return null
    return postsRef.current.find(p => p.id === hits[0].object.userData.postId) ?? null
  }

  // ── Event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = gl.domElement

    const isInputFocused = () => {
      const el = document.activeElement
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    }

    const onKeyDown = (e: KeyboardEvent) => { if (!isInputFocused()) keys.current.add(e.code) }
    const onKeyUp   = (e: KeyboardEvent) => { if (!isInputFocused()) keys.current.delete(e.code) }

    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    const onMouseDown = (e: MouseEvent) => {
      // Right-click: toggle pointer lock
      if (e.button === 2) {
        if (isPointerLocked.current) {
          document.exitPointerLock()
        } else {
          if (
            navModeRef.current === 'trajectory' &&
            trajectoryStatusRef.current === 'waiting'
          ) {
            setTrajectoryAnchor({
              position:   camera.position.toArray() as [number, number, number],
              quaternion: camera.quaternion.toArray() as [number, number, number, number],
            })
            setTrajectoryBreakout(true)
          }
          canvas.requestPointerLock()
        }
        return
      }

      if (e.button !== 0) return

      // Left-click while pointer-locked: fly to crosshair-aimed star
      if (isPointerLocked.current && navModeRef.current === 'free') {
        const post = getAimedPost()
        if (post) startFlyTo(new THREE.Vector3(...post.position), post)
        return
      }

      // Left-click without pointer lock: raycast from mouse position
      if (!isPointerLocked.current) {
        const rect = canvas.getBoundingClientRect()
        const ndc  = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width)  * 2 - 1,
          -((e.clientY - rect.top)  / rect.height) * 2 + 1,
        )
        raycaster.current.setFromCamera(ndc, camera)
        const hits = raycaster.current.intersectObjects(registry.meshes(), false)
        if (hits.length) {
          const post = postsRef.current.find(p => p.id === hits[0].object.userData.postId)
          if (post) startFlyTo(new THREE.Vector3(...post.position), post)
        }
      }
    }

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas
      isPointerLocked.current = locked
      setIsFreeroam(locked)
      setHoveredPost(null) // clear title hint on lock state change
      setHoverPos(null)

      if (!locked) {
        // Restore saved position when exiting trajectory breakout
        const {
          trajectoryBreakout,
          trajectoryAnchor,
          setTrajectoryBreakout: stb,
          setTrajectoryAnchor: sta,
        } = useSpaceStore.getState()

        if (trajectoryBreakout && trajectoryAnchor) {
          camera.position.set(...trajectoryAnchor.position)
          camera.quaternion.set(...trajectoryAnchor.quaternion)
          velocity.current.set(0, 0, 0)
          stb(false)
          sta(null)
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      // ── Pointer-locked: mouse-look ───────────────────────────────
      if (isPointerLocked.current) {
        if (isFlyingRef.current) return
        const yawQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
          -e.movementX * LOOK_SPEED,
        )
        const pitchQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
          -e.movementY * LOOK_SPEED,
        )
        camera.quaternion.premultiply(yawQ).premultiply(pitchQ)
        return
      }

      // ── Observer mode: hover raycast for title hint ──────────────
      const rect = canvas.getBoundingClientRect()
      const ndc  = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      )
      raycaster.current.setFromCamera(ndc, camera)
      const hits = raycaster.current.intersectObjects(registry.meshes(), false)
      if (hits.length) {
        const post = postsRef.current.find(p => p.id === hits[0].object.userData.postId) ?? null
        setHoveredPost(post)
        // Project the star's world position to screen coords for the tooltip
        if (post) {
          const starWorld = new THREE.Vector3(...post.position)
          starWorld.project(camera)
          setHoverPos({
            x: (starWorld.x *  0.5 + 0.5) * rect.width  + rect.left,
            y: (starWorld.y * -0.5 + 0.5) * rect.height + rect.top,
          })
        }
      } else {
        setHoveredPost(null)
        setHoverPos(null)
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      scrollDolly.current += e.deltaY * SCROLL_SPEED
    }

    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        keys.current.clear()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('contextmenu', onContextMenu)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('wheel', onWheel)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
    // gl is stable for the lifetime of the Canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  // ── Per-frame tick (called from CameraController's useFrame) ─────
  return (delta: number): boolean => {

    // ── Fly-to ────────────────────────────────────────────────────
    if (flyTick()) return true

    // ── Hover detection (crosshair raycast while pointer-locked) ─────
    if (isPointerLocked.current) {
      setActivePost(getAimedPost())
    }

    // ── Keyboard movement ─────────────────────────────────────────
    // All axes derived from camera quaternion — consistent at any orientation.
    const forward = new THREE.Vector3(0,  0, -1).applyQuaternion(camera.quaternion)
    const right   = new THREE.Vector3(1,  0,  0).applyQuaternion(camera.quaternion)
    const up      = new THREE.Vector3(0,  1,  0).applyQuaternion(camera.quaternion)

    const moveDir = new THREE.Vector3()
    const k = keys.current

    if (k.has('KeyW') || k.has('ArrowUp'))    moveDir.add(forward)
    if (k.has('KeyS') || k.has('ArrowDown'))  moveDir.sub(forward)
    if (k.has('KeyA') || k.has('ArrowLeft'))  moveDir.sub(right)
    if (k.has('KeyD') || k.has('ArrowRight')) moveDir.add(right)
    if (k.has('KeyE'))                         moveDir.add(up)
    if (k.has('KeyQ') || k.has('KeyZ') || k.has('KeyC')) moveDir.sub(up)

    if (moveDir.lengthSq() > 0) {
      velocity.current.add(moveDir.normalize().multiplyScalar(MOVE_SPEED * delta))
    }

    // ── Scroll dolly ──────────────────────────────────────────────
    if (Math.abs(scrollDolly.current) > 0.01) {
      velocity.current.add(
        forward.clone().multiplyScalar(-scrollDolly.current * delta * 2),
      )
      scrollDolly.current *= 0.85
    }

    // ── Apply damped velocity ─────────────────────────────────────
    velocity.current.multiplyScalar(MOVE_DAMPING)
    camera.position.add(velocity.current)

    return false
  }
}
