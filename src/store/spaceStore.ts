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
  /** Star currently under cursor in observer mode — drives title hint, not PostCard */
  hoveredPost: Post | null
  setHoveredPost: (post: Post | null) => void
  /** Screen position of the hovered star for cursor-following title hint */
  hoverPos: { x: number; y: number } | null
  setHoverPos: (pos: { x: number; y: number } | null) => void
  /** Slug of the post whose full content should be shown in the overlay. Null = no overlay. */
  openPostSlug: string | null
  setOpenPostSlug: (slug: string | null) => void

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

  /** Pending trajectory exit — set when user clicks a star during trajectory+freeroam breakout */
  trajectoryExitConfirm: { starPos: [number, number, number]; postId: string | null } | null
  setTrajectoryExitConfirm: (v: { starPos: [number, number, number]; postId: string | null } | null) => void
  /** One-shot fly-to request set by outside-Canvas components; consumed and cleared by useFlyTo tick */
  pendingFlyTo: { starPos: [number, number, number]; postId: string | null } | null
  setPendingFlyTo: (v: { starPos: [number, number, number]; postId: string | null } | null) => void
  /** When true, user entered free roam from a trajectory stop; restore camera on pointer unlock */
  trajectoryBreakout: boolean
  setTrajectoryBreakout: (v: boolean) => void
  /** Saved camera state when entering breakout from trajectory */
  trajectoryAnchor: { position: [number, number, number]; quaternion: [number, number, number, number] } | null
  setTrajectoryAnchor: (a: { position: [number, number, number]; quaternion: [number, number, number, number] } | null) => void

  showStarNames: boolean
  setShowStarNames: (v: boolean) => void

  /** True once the big-bang expansion animation completes — gates loading screen removal */
  bigBangDone: boolean
  setBigBangDone: (v: boolean) => void

  /** Mobile touch: world-space pan delta per frame (x = left/right, y = up/down) */
  mobileMove: { x: number; y: number }
  setMobileMove: (v: { x: number; y: number }) => void
  /** Mobile pinch: finger spread/close delta in screen pixels */
  mobilePinch: { distDelta: number } | null
  setMobilePinch: (v: { distDelta: number } | null) => void
  /** Mobile roll: two-finger clockwise rotation delta in radians */
  mobileRoll: { delta: number } | null
  setMobileRoll: (v: { delta: number } | null) => void

  mobileOrbit: { yaw: number; pitch: number }
  setMobileOrbit: (o: { yaw: number; pitch: number }) => void
  /** Mobile tap: screen + NDC coords of a detected tap. Null between taps. */
  mobileTap: { x: number; y: number; ndcX: number; ndcY: number } | null
  setMobileTap: (v: { x: number; y: number; ndcX: number; ndcY: number } | null) => void
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  activePost: null,
  setActivePost: (post) => set({ activePost: post }),
  hoveredPost: null,
  setHoveredPost: (post) => set({ hoveredPost: post }),
  hoverPos: null,
  setHoverPos: (pos) => set({ hoverPos: pos }),
  openPostSlug: null,
  setOpenPostSlug: (slug) => set({ openPostSlug: slug }),
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
  trajectoryExitConfirm: null,
  setTrajectoryExitConfirm: (v) => set({ trajectoryExitConfirm: v }),
  pendingFlyTo: null,
  setPendingFlyTo: (v) => set({ pendingFlyTo: v }),
  trajectoryBreakout: false,
  setTrajectoryBreakout: (v) => set({ trajectoryBreakout: v }),
  trajectoryAnchor: null,
  setTrajectoryAnchor: (a) => set({ trajectoryAnchor: a }),

  showStarNames: false,
  setShowStarNames: (v) => set({ showStarNames: v }),

  bigBangDone: false,
  setBigBangDone: (v) => set({ bigBangDone: v }),

  mobileMove: { x: 0, y: 0 },
  setMobileMove: (v) => set({ mobileMove: v }),
  mobilePinch: null,
  setMobilePinch: (v) => set({ mobilePinch: v }),
  mobileRoll: null,
  setMobileRoll: (v) => set({ mobileRoll: v }),
  mobileOrbit: { yaw: 0, pitch: 0 },
  setMobileOrbit: (o) => set({ mobileOrbit: o }),
  mobileTap: null,
  setMobileTap: (v) => set({ mobileTap: v }),
}))
