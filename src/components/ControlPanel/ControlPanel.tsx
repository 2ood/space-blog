'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore  } from '@/store/spaceStore'
import { getPostColor, TRAJECTORY_SEQUENCES, type TrajectorySequenceId} from '@/config/spaceConfig'
import styles from './ControlPanel.module.css'

export default function ControlPanel() {
  const [visible, setVisible] = useState(true)

  const navMode       = useSpaceStore((s) => s.navMode)
  const setNavMode    = useSpaceStore((s) => s.setNavMode)
  const status        = useSpaceStore((s) => s.trajectoryStatus)
  const setStatus     = useSpaceStore((s) => s.setTrajectoryStatus)
  const index         = useSpaceStore((s) => s.trajectoryIndex)
  const setIndex      = useSpaceStore((s) => s.setTrajectoryIndex)
  const setProgress   = useSpaceStore((s) => s.setTrajectoryProgress)
  const posts         = useSpaceStore((s) => s.posts)
  const setActivePost = useSpaceStore((s) => s.setActivePost)
  const setIsFreeroam = useSpaceStore((s) => s.setIsFreeroam)
  const trajectorySequence  = useSpaceStore((s) => s.trajectorySequence)
  const setTrajectorySequence = useSpaceStore((s)=> s.setTrajectorySequence)

  const ordered  = [...(posts ?? [])].sort((a, b) => a.trajectoryOrder - b.trajectoryOrder)
  const isActive = status === 'travelling' || status === 'waiting'

  const handleSequenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as typeof trajectorySequence
    setTrajectorySequence(id)
    setIndex(0)
    setProgress(0)
    setStatus('idle')
    setActivePost(null)
  }


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') setVisible(v => !v)
      if (e.code === 'KeyT') {
        useSpaceStore.setState({ showStarNames: !useSpaceStore.getState().showStarNames })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const switchMode = (mode: 'free' | 'trajectory') => {
    setNavMode(mode)
    if (mode === 'free') { setStatus('idle'); setActivePost(null) }
    if (mode === 'trajectory') {
      if (document.pointerLockElement) document.exitPointerLock()
      setIsFreeroam(false)
    }
  }

  const handlePlay    = () => { setIndex(0); setProgress(0); setStatus('travelling'); setActivePost(null) }
  const handlePrev    = () => { setIndex(Math.max(0, index-1)); setProgress(0); setStatus('travelling'); setActivePost(null) }
  const handleNext    = () => { setIndex(Math.min(ordered.length-1, index+1)); setProgress(0); setStatus('travelling'); setActivePost(null) }
  const handleRestart = () => { setIndex(0); setProgress(0); setStatus('travelling'); setActivePost(null) }

  return (
    <div className={styles.wrapper}>
      {/* Toggle button */}
      <button className={styles.toggleButton} onClick={() => setVisible(v => !v)}>
        {visible ? `▼` : `▲`}
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Identity */}
            <div className={styles.identity}>
              <span className={styles.logo}>✦ COSMOS</span>
              <span className={styles.subtitle}>AI Research Blog</span>
            </div>

            <div className={styles.divider} />

            {/* Mode selector */}
            <div className={styles.section}>
              <p className={styles.sectionLabel}>NAVIGATION</p>
              <div className={styles.modeButtons}>
                <button
                  className={`${styles.modeBtn} ${navMode === 'free' ? styles.modeActive : ''}`}
                  onClick={() => switchMode('free')}
                >
                  ✦ Free Roam
                </button>
                <button
                  className={`${styles.modeBtn} ${navMode === 'trajectory' ? styles.modeActive : ''}`}
                  onClick={() => switchMode('trajectory')}
                >
                  ⟶ Trajectory
                </button>
              </div>
            </div>

            {/* Trajectory controls */}
            <AnimatePresence>
              {navMode === 'trajectory' && (
                <motion.div
                  className={styles.section}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  
                  <div className={styles.divider} />
                  <p className={styles.sectionLabel}>TOUR</p>
                  <div className={styles.sequenceSelect}>
                    <label className={styles.sequenceLabel} htmlFor="trajectory-sequence">Sequence</label>
                    <select
                      id="trajectory-sequence"
                      className={styles.select}
                      value={trajectorySequence}
                      onChange={handleSequenceChange}
                    >
                      {TRAJECTORY_SEQUENCES.map((seq) => (
                        <option key={seq.id} value={seq.id}>
                          {seq.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.starIndicator}>
                    <span className={styles.starLabel}>
                      {ordered.length === 0
                        ? 'No stops in this sequence'
                        : isActive
                        ? `${index + 1} / ${ordered.length} — ${ordered[index]?.title ?? ''}`
                        : `${ordered.length} stops ready`}
                    </span>
                  </div>

                  {isActive && (
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${(index / ordered.length) * 100}%` }} />
                    </div>
                  )}

                  <div className={styles.trajectoryControls}>
                    <button className={styles.trajBtn} onClick={handlePrev} disabled={index === 0 || !isActive}>⏮</button>
                    <button className={styles.trajBtn} onClick={status === 'idle' ? handlePlay : handleRestart}>
                      {status === 'idle' ? `▶` : `↺`}
                    </button>
                    <button className={styles.trajBtn} onClick={handleNext} disabled={index >= ordered.length - 1}>⏭</button>
                  </div>

                  <p className={styles.statusLabel}>
                    {status === 'travelling' && `▶ TRAVELLING`}
                    {status === 'waiting'    && `◉ ARRIVED`}
                    {status === 'idle'       && `◌ PRESS PLAY`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.divider} />
            <p className={styles.hint}>
              <kbd className={styles.kbd}>H</kbd> hide panel
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacebar prompt */}
      <AnimatePresence>
        {navMode === 'trajectory' && status === 'waiting' && (
          <motion.div
            className={styles.spacebarPrompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
          >
            <kbd className={styles.spacebarKey}>SPACE</kbd>
            <span className={styles.spacebarLabel}>
              {index + 1 < ordered.length ? `next star` : `end tour`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
