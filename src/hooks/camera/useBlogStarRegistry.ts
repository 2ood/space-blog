/**
 * useBlogStarRegistry
 *
 * A shared ref-based registry of blog-star meshes.
 * BlogStars registers each mesh on mount and unregisters on unmount.
 * CameraController reads the registry for raycasting — no scene.traverse() needed.
 */

import { createContext, useContext, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type StarRegistry = Map<string, THREE.Mesh> // postId → mesh

export interface StarRegistryHandle {
  register:   (postId: string, mesh: THREE.Mesh) => void
  unregister: (postId: string) => void
  meshes:     () => THREE.Mesh[]
}

/** Build a stable registry handle from a Map ref. */
export function createStarRegistryHandle(map: React.MutableRefObject<StarRegistry>): StarRegistryHandle {
  return {
    register:   (id, mesh) => map.current.set(id, mesh),
    unregister: (id)       => map.current.delete(id),
    meshes:     ()         => Array.from(map.current.values()),
  }
}

/** React context — provided once at the SpaceScene level. */
export const StarRegistryContext = createContext<StarRegistryHandle | null>(null)

/** Hook used by CameraController (and anything that needs to raycast blog stars). */
export function useStarRegistry(): StarRegistryHandle {
  const ctx = useContext(StarRegistryContext)
  if (!ctx) throw new Error('useStarRegistry must be used inside <StarRegistryProvider>')
  return ctx
}

/** Hook used at the provider level to create the registry and its handle. */
export function useCreateStarRegistry(): StarRegistryHandle {
  const map = useRef<StarRegistry>(new Map())
  return useMemo<StarRegistryHandle>(() => ({
    register:   (id, mesh) => map.current.set(id, mesh),
    unregister: (id)       => map.current.delete(id),
    meshes:     ()         => Array.from(map.current.values()),
  }), [])
}