/**
 * cameraUtils.ts
 *
 * Shared, pure camera math and constants used across all camera hooks.
 */

import * as THREE from 'three'

// Re-exported from mobileConfig — single source of truth for all camera tuning.
export { PITCH_LIMIT } from '@/config/mobileConfig'

const WORLD_BOUND = new THREE.Vector3(1000, 1000, 1000)
const WORLD_BOUND_NEG = WORLD_BOUND.clone().negate()

/**
 * Compute a stop position in front of a star, approaching from the camera's
 * current direction. The camera will stop `stopDistance` units away from the star,
 * on the camera-side of it.
 */
export function computeStopPosition(
  camPos: THREE.Vector3,
  starPos: THREE.Vector3,
  stopDistance: number,
): THREE.Vector3 {
  const dir = camPos.clone().sub(starPos)

  // Fallback if camera is sitting exactly on the star
  if (dir.lengthSq() < 0.001) dir.set(0, 0, 1)

  dir.normalize()

  return starPos
    .clone()
    .addScaledVector(dir, stopDistance)
    .clamp(WORLD_BOUND_NEG, WORLD_BOUND)
}

/**
 * Instantly snap the camera to face a world-space target.
 */
export function snapCameraToFace(
  camera: THREE.Camera,
  target: THREE.Vector3,
): void {
  camera.up.set(0, 1, 0)
  const m = new THREE.Matrix4().lookAt(camera.position, target, camera.up)
  camera.quaternion.setFromRotationMatrix(m)
}
