/**
 * useTrajectory
 *
 * Owns all trajectory navigation logic, extracted from ControlPanel so that
 * the tutorial and intro overlay features can also drive or observe trajectory
 * state without importing ControlPanel.
 *
 * Returns actions and derived state needed by UI components.
 */

import { useSpaceStore } from '@/store/spaceStore'
import type { TrajectorySequenceId } from '@/config/spaceConfig'

export function useTrajectory() {
  const navMode               = useSpaceStore((s) => s.navMode)
  const setNavMode            = useSpaceStore((s) => s.setNavMode)
  const status                = useSpaceStore((s) => s.trajectoryStatus)
  const setStatus             = useSpaceStore((s) => s.setTrajectoryStatus)
  const index                 = useSpaceStore((s) => s.trajectoryIndex)
  const setIndex              = useSpaceStore((s) => s.setTrajectoryIndex)
  const setProgress           = useSpaceStore((s) => s.setTrajectoryProgress)
  const posts                 = useSpaceStore((s) => s.posts)
  const setActivePost         = useSpaceStore((s) => s.setActivePost)
  const setIsFreeroam         = useSpaceStore((s) => s.setIsFreeroam)
  const trajectorySequence    = useSpaceStore((s) => s.trajectorySequence)
  const setTrajectorySequence = useSpaceStore((s) => s.setTrajectorySequence)

  const ordered = [...(posts ?? [])].sort((a, b) => a.trajectoryOrder - b.trajectoryOrder)
  const isActive = status === 'travelling' || status === 'waiting'

  const reset = () => { setIndex(0); setProgress(0); setActivePost(null) }

  const play    = () => { reset(); setStatus('travelling') }
  const restart = () => { reset(); setStatus('travelling') }
  const prev    = () => { setIndex(Math.max(0, index - 1)); setProgress(0); setStatus('travelling'); setActivePost(null) }
  const next    = () => {
    const nextIndex = index + 1
    if (nextIndex >= ordered.length) { setStatus('idle'); setActivePost(null) }
    else { setIndex(nextIndex); setProgress(0); setStatus('travelling'); setActivePost(null) }
  }

  const changeSequence = (id: TrajectorySequenceId) => {
    setTrajectorySequence(id)
    setIndex(0)
    setProgress(0)
    setStatus('idle')
    setActivePost(null)
  }

  const switchMode = (mode: 'free' | 'trajectory') => {
    setNavMode(mode)
    if (mode === 'free') { setStatus('idle'); setActivePost(null) }
    if (mode === 'trajectory') {
      if (document.pointerLockElement) document.exitPointerLock()
      setIsFreeroam(false)
    }
  }

  return {
    // State
    navMode,
    status,
    index,
    ordered,
    isActive,
    trajectorySequence,
    // Actions
    play,
    restart,
    prev,
    next,
    changeSequence,
    switchMode,
  }
}
