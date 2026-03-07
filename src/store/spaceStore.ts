import { create } from 'zustand'
import type { Post } from '@/components/BlogStars/BlogStars'
import type { TrajectorySequenceId } from '@/config/spaceConfig'

export type NavMode = 'free' | 'trajectory'
export type TrajectoryStatus = 'idle' | 'travelling' | 'waiting'

interface SpaceStore {
  posts: Post[]
  setPosts: (posts: Post[]) => void

  activePost: Post | null
  setActivePost: (post: Post | null) => void

  isFreeroam: boolean
  setIsFreeroam: (v: boolean) => void

  navMode: NavMode
  setNavMode: (mode: NavMode) => void

  trajectorySequence: TrajectorySequenceId
  setTrajectorySequence: (id: TrajectorySequenceId) => void

  trajectoryStatus: TrajectoryStatus
  setTrajectoryStatus: (s: TrajectoryStatus) => void
  trajectoryIndex: number
  setTrajectoryIndex: (i: number) => void
  trajectoryProgress: number
  setTrajectoryProgress: (p: number) => void

  /** When true, user entered free roam from a trajectory stop; restore camera on pointer unlock */
  trajectoryBreakout: boolean
  setTrajectoryBreakout: (v: boolean) => void
  /** Saved camera state when entering breakout from trajectory */
  trajectoryAnchor: { position: [number, number, number]; quaternion: [number, number, number, number] } | null
  setTrajectoryAnchor: (a: { position: [number, number, number]; quaternion: [number, number, number, number] } | null) => void

  showStarNames: boolean
  setShowStarNames: (v: boolean) => void

  /** Mobile touch: camera look delta per frame */
  mobileLook: { dx: number; dy: number }
  setMobileLook: (v: { dx: number; dy: number }) => void
  /** Mobile touch: move delta per frame */
  mobileMove: { forward: number; right: number, up:number }
  setMobileMove: (v: { forward: number; right: number, up:number }) => void
  /** Mobile pinch: move toward a specific world-space direction */
  mobilePinch: { dx: number; dy: number; dz: number } | null
  setMobilePinch: (v: { dx: number; dy: number; dz: number } | null) => void

  mobileOrbit: { yaw: number; pitch: number }
  setMobileOrbit: (o: { yaw: number; pitch: number }) => void
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  activePost: null,
  setActivePost: (post) => set({ activePost: post }),
  isFreeroam: false,
  setIsFreeroam: (v) => set({ isFreeroam: v }),
  navMode: 'free',
  setNavMode: (mode) => set({ navMode: mode }),

  trajectorySequence: 'default',
  setTrajectorySequence: (id) => set({ trajectorySequence: id }),
  trajectoryStatus: 'idle',
  setTrajectoryStatus: (s) => set({ trajectoryStatus: s }),
  trajectoryIndex: 0,
  setTrajectoryIndex: (i) => set({ trajectoryIndex: i }),
  trajectoryProgress: 0,
  setTrajectoryProgress: (p) => set({ trajectoryProgress: p }),
  trajectoryBreakout: false,
  setTrajectoryBreakout: (v) => set({ trajectoryBreakout: v }),
  trajectoryAnchor: null,
  setTrajectoryAnchor: (a) => set({ trajectoryAnchor: a }),

  showStarNames: false,
  setShowStarNames: (v) => set({ showStarNames: v }),

  mobileLook: { dx: 0, dy: 0 },
  setMobileLook: (v) => set({ mobileLook: v }),
  mobileMove: { forward: 0, right: 0, up: 0},
  setMobileMove: (v) => set({ mobileMove: v }),
  mobilePinch: null,
  setMobilePinch: (v) => set({ mobilePinch: v }),
  mobileOrbit: { yaw: 0, pitch: 0 },
  setMobileOrbit: (o) => set({ mobileOrbit: o }),
}))
