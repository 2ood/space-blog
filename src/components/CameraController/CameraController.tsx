'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'

const MOVE_SPEED    = 8
const LOOK_SPEED    = 0.002
const DAMPING       = 0.85
const SCROLL_SPEED  = 0.2
const STOP_DISTANCE = 20
const FLY_LERP      = 0.03

export default function CameraController() {
  const { camera, gl, scene } = useThree()

  const keys            = useRef<Set<string>>(new Set())
  const velocity        = useRef(new THREE.Vector3())
  const euler           = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const isPointerLocked = useRef(false)
  const scrollDolly     = useRef(0)

  const flyStarPos = useRef<THREE.Vector3 | null>(null)
  const flyDest    = useRef<THREE.Vector3 | null>(null)

  const raycaster = useRef(new THREE.Raycaster())

  const setActivePost       = useSpaceStore((s) => s.setActivePost)
  const setIsFreeroam       = useSpaceStore((s) => s.setIsFreeroam)
  const posts               = useSpaceStore((s) => s.posts)
  const navMode             = useSpaceStore((s) => s.navMode)
  const trajectoryStatus    = useSpaceStore((s) => s.trajectoryStatus)
  const trajectoryBreakout  = useSpaceStore((s) => s.trajectoryBreakout)
  const mobileLook          = useSpaceStore((s) => s.mobileLook)
  const mobileMove          = useSpaceStore((s) => s.mobileMove)
  const mobilePinch         = useSpaceStore((s) => s.mobilePinch)
  const mobileOrbit = useSpaceStore((s) => s.mobileOrbit)
  const setTrajectoryBreakout = useSpaceStore((s) => s.setTrajectoryBreakout)
  const setTrajectoryAnchor = useSpaceStore((s) => s.setTrajectoryAnchor)

  const postsRef   = useRef(posts)
  const navModeRef = useRef(navMode)
  const trajectoryStatusRef = useRef(trajectoryStatus)
  const trajectoryBreakoutRef = useRef(trajectoryBreakout)
  const orbitCenter = useRef(new THREE.Vector3())
  const orbitActive = useRef(false)
  const universeRadius = useRef(0)
  const starCenter = useRef(new THREE.Vector3())

  useEffect(() => { postsRef.current = posts }, [posts])
  useEffect(() => { navModeRef.current = navMode }, [navMode])
  useEffect(() => { trajectoryStatusRef.current = trajectoryStatus }, [trajectoryStatus])
  useEffect(() => { trajectoryBreakoutRef.current = trajectoryBreakout }, [trajectoryBreakout])

  useEffect(() => {
    camera.position.set(0, 0, 5)
  }, [camera])

  useEffect(() => {
    if (!posts.length) return
  
    const center = new THREE.Vector3()
  
    for (const p of posts) {
      center.add(new THREE.Vector3(...p.position))
    }
  
    center.divideScalar(posts.length)
    starCenter.current.copy(center)
  
    // compute approximate universe radius
    let maxDist = 0
    for (const p of posts) {
      const d = center.distanceTo(new THREE.Vector3(...p.position))
      if (d > maxDist) maxDist = d
    }
  
    universeRadius.current = maxDist
  
  }, [posts])

  const computeDest = (camPos: THREE.Vector3, starPos: THREE.Vector3) => {

    const dir = camPos.clone().sub(starPos)
  
    if (dir.lengthSq() < 0.001) {
      // fallback direction if camera is too close
      dir.set(0, 0, 1)
    }
  
    dir.normalize()
  
    const dest = starPos.clone().addScaledVector(dir, STOP_DISTANCE)
  
    // clamp world bounds so camera never jumps away
    dest.clamp(
      new THREE.Vector3(-1000, -1000, -1000),
      new THREE.Vector3(1000, 1000, 1000)
    )
  
    return dest
  }

  const getAimedStarPos = (): THREE.Vector3 | null => {
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)

    const meshes: THREE.Mesh[] = []

    scene.traverse(child => {
      const m = child as THREE.Mesh
      if (m.isMesh && m.userData.isBlogStar) meshes.push(m)
    })

    const hits = raycaster.current.intersectObjects(meshes, false)

    if (hits.length === 0) return null

    const post = postsRef.current.find(
      p => p.id === hits[0].object.userData.postId
    )

    return post ? new THREE.Vector3(...post.position) : null
  }

  const startFlyTo = (starPos: THREE.Vector3) => {

    flyStarPos.current = starPos.clone()
    flyDest.current = computeDest(camera.position, starPos)

    camera.up.set(0,1,0)

    const m = new THREE.Matrix4()
    m.lookAt(camera.position, starPos, camera.up)

    const q = new THREE.Quaternion().setFromRotationMatrix(m)

    camera.quaternion.copy(q)

    euler.current.setFromQuaternion(camera.quaternion,'YXZ')
  }

  useEffect(() => {

    const canvas = gl.domElement

    const onKeyDown = (e: KeyboardEvent) => keys.current.add(e.code)
    const onKeyUp   = (e: KeyboardEvent) => keys.current.delete(e.code)

    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    const onMouseDown = (e: MouseEvent) => {

      if (e.button === 2) {

        if (isPointerLocked.current) {
          document.exitPointerLock()
        } else {
          // When trajectory + waiting, entering free roam saves anchor for restore on return
          if (navModeRef.current === 'trajectory' && trajectoryStatusRef.current === 'waiting') {
            setTrajectoryAnchor({
              position: camera.position.toArray() as [number, number, number],
              quaternion: camera.quaternion.toArray() as [number, number, number, number],
            })
            setTrajectoryBreakout(true)
          }
          canvas.requestPointerLock()
        }

        return
      }

      if (
        e.button === 0 &&
        isPointerLocked.current &&
        navModeRef.current === 'free'
      ) {

        const starPos = getAimedStarPos()

        if (starPos) startFlyTo(starPos)
      }
    }

    const onPointerLockChange = () => {

      const locked = document.pointerLockElement === canvas

      isPointerLocked.current = locked

      setIsFreeroam(locked)

      if (locked) {
        euler.current.setFromQuaternion(camera.quaternion,'YXZ')
      } else {
        // Returning from trajectory breakout: restore camera to where we were
        const { trajectoryBreakout, trajectoryAnchor, setTrajectoryBreakout, setTrajectoryAnchor } = useSpaceStore.getState()
        if (trajectoryBreakout && trajectoryAnchor) {
          camera.position.set(...trajectoryAnchor.position)
          camera.quaternion.set(...trajectoryAnchor.quaternion)
          euler.current.setFromQuaternion(camera.quaternion, 'YXZ')
          velocity.current.set(0, 0, 0)
          setTrajectoryBreakout(false)
          setTrajectoryAnchor(null)
        }
      }
    }

    const onMouseMove = (e: MouseEvent) => {

      if (!isPointerLocked.current) return
      if (flyStarPos.current) return

      euler.current.y -= e.movementX * LOOK_SPEED
      euler.current.x -= e.movementY * LOOK_SPEED

      euler.current.x = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, euler.current.x)
      )
    }

    const onWheel = (e: WheelEvent) => {

      e.preventDefault()

      scrollDolly.current += e.deltaY * SCROLL_SPEED
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)

    canvas.addEventListener('contextmenu', onContextMenu)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)

    return () => {

      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)

      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('wheel', onWheel)

      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  useFrame((_, delta) => {
    // ── Mobile touch input (horizontal plane only, no vertical drift) ─
    if (mobileMove.forward !== 0 || mobileMove.right !== 0 || mobileMove.up !== 0) {
      // Project camera forward onto XZ plane so swipe never moves vertically
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
      right.y = 0
      right.normalize()
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
      up.normalize()
      camera.position.addScaledVector(forward, mobileMove.forward * delta * 60)
      camera.position.addScaledVector(right,   mobileMove.right   * delta * 60)
      camera.position.addScaledVector(up,   mobileMove.up   * delta * 60)
    }
    // ── Mobile pinch: move toward pinch midpoint ray ────────────────
    // ── Mobile pinch: stable zoom toward pinch midpoint ─────────────
    if (mobilePinch) {

      const pinchVec = new THREE.Vector3(
        mobilePinch.dx,
        mobilePinch.dy,
        mobilePinch.dz
      )

      // Apply movement directly (NO 60x amplification)
      camera.position.addScaledVector(pinchVec, 1)

      // Clamp distance so camera cannot fly away
      const dist = camera.position.length()

      const MIN_DIST = 2
      const MAX_DIST = 300

      if (dist < MIN_DIST) camera.position.setLength(MIN_DIST)
      if (dist > MAX_DIST) camera.position.setLength(MAX_DIST)
    }

    if (mobileLook.dx !== 0 || mobileLook.dy !== 0) {
      camera.rotation.y -= mobileLook.dx * 60
      camera.rotation.x -= mobileLook.dy * 60
      camera.rotation.x  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))
    }

    // ── Mobile orbit (true orbital camera) ─────────────

    if (mobileOrbit.yaw !== 0 || mobileOrbit.pitch !== 0) {

      // initialize orbit center only once
      if (!orbitActive.current) {

        const aimedStar = getAimedStarPos()
      
        if (aimedStar) {
      
          // orbit around the star you're looking at
          orbitCenter.current.copy(aimedStar)
      
        } else {
      
          // fallback: orbit along current view direction
          const dir = new THREE.Vector3()
          camera.getWorldDirection(dir)
      
          const dist = camera.position.distanceTo(starCenter.current)
      
          const orbitRadius = Math.max(
            dist,
            universeRadius.current * 0.6
          )
      
          orbitCenter.current
            .copy(camera.position)
            .addScaledVector(dir, orbitRadius)
        }
      
        orbitActive.current = true
      }
    
      const center = orbitCenter.current
      const offset = camera.position.clone().sub(center)
    
      // horizontal orbit
      offset.applyAxisAngle(
        new THREE.Vector3(0,-1,0),
        mobileOrbit.yaw * 60 * delta
      )
    
      // vertical orbit
      const right = new THREE.Vector3()
        .crossVectors(offset, new THREE.Vector3(0,1,0))
        .normalize()
    
      offset.applyAxisAngle(
        right,
        mobileOrbit.pitch * 60 * delta
      )
    
      camera.position.copy(center.clone().add(offset))
      const m = new THREE.Matrix4()
      m.lookAt(camera.position, center, camera.up)

      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m)

      camera.quaternion.slerp(targetQuat, 0.15)
    
    } else {
    
      // orbit gesture ended
      orbitActive.current = false
    }

    // In trajectory mode, only run free roam when in breakout (right-click look-around)
    if (navModeRef.current === 'trajectory' && !trajectoryBreakoutRef.current) return

    // ---------- FLY TO ----------

    if (flyStarPos.current && flyDest.current) {

      const star = flyStarPos.current
      const m = new THREE.Matrix4()
      m.lookAt(camera.position, star, camera.up)
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m)

      camera.quaternion.slerp(targetQuat, 0.15)
      camera.position.lerp(flyDest.current, FLY_LERP)

      const dist = camera.position.length()
      if (dist > 1000) {
        camera.position.setLength(1000)
      }

      if (camera.position.distanceTo(flyDest.current) < 0.5) {
        camera.position.copy(flyDest.current)
        euler.current.setFromQuaternion(camera.quaternion,'YXZ')
        flyStarPos.current = null
        flyDest.current = null
      }

      return
    }

    // ---------- FREE ROAM ----------

    if (!orbitActive.current) {
      camera.quaternion.setFromEuler(euler.current)
    }

    if (isPointerLocked.current) {
      raycaster.current.setFromCamera(new THREE.Vector2(0,0), camera)
      const meshes: THREE.Mesh[] = []

      scene.traverse(child => {
        const m = child as THREE.Mesh
        if (m.isMesh && m.userData.isBlogStar) meshes.push(m)
      })

      const hits = raycaster.current.intersectObjects(meshes,false)

      if (hits.length > 0) {
        const post = postsRef.current.find(
            p => p.id === hits[0].object.userData.postId
          ) ?? null
        setActivePost(post)
      } else {
        setActivePost(null)
      }
    }

    const forward = new THREE.Vector3()
    const right   = new THREE.Vector3()
    const up      = new THREE.Vector3()

    camera.getWorldDirection(forward)
    right.crossVectors(forward, camera.up).normalize()
    up.crossVectors(right, forward).normalize()

    const moveDir = new THREE.Vector3()
    const k = keys.current

    if (k.has('KeyW') || k.has('ArrowUp')) moveDir.add(forward)
    if (k.has('KeyS') || k.has('ArrowDown')) moveDir.sub(forward)
    if (k.has('KeyA') || k.has('ArrowLeft')) moveDir.sub(right)
    if (k.has('KeyD') || k.has('ArrowRight')) moveDir.add(right)
    if (k.has('KeyE')) moveDir.add(up)
    if (k.has('KeyQ') || k.has('KeyZ') || k.has('KeyC')) moveDir.sub(up)

    if (moveDir.length() > 0) {
      moveDir.normalize()
      velocity.current.add(
        moveDir.multiplyScalar(MOVE_SPEED * delta)
      )
    }
    if (Math.abs(scrollDolly.current) > 0.01) {
      velocity.current.add(
        forward.clone().multiplyScalar(
          -scrollDolly.current * delta * 2
        )
      )
      scrollDolly.current *= 0.85
    }
    velocity.current.multiplyScalar(DAMPING)
    camera.position.add(velocity.current)

  })

  return null
}