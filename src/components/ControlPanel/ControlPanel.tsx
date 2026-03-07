'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore  } from '@/store/spaceStore'
import { TRAJECTORY_SEQUENCES } from '@/config/spaceConfig'
import { useTrajectory } from '@/hooks/useTrajectory'
import styles from './ControlPanel.module.css'
import { useMobile } from '@/hooks/useMobile'

export default function ControlPanel() {
  const [visible, setVisible] = useState(true)
  const isMobile = useMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const dragStartY = useRef<number | null>(null)

  const {
    navMode, status, index, ordered, isActive, trajectorySequence,
    play, restart, prev, next, changeSequence, switchMode,
  } = useTrajectory()


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

  const panelContent = (
    <>
      {/* Identity */}
      <div className={styles.identity}>
        <span className={styles.logo}>✦ COSMOS</span>
        <span className={styles.subtitle}>AI Research Blog</span>
      </div>
      <div className={styles.divider} />
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
                onChange={(e) => changeSequence(e.target.value as typeof trajectorySequence)}
              >
                {TRAJECTORY_SEQUENCES.map((seq) => (
                  <option key={seq.id} value={seq.id}>{seq.label}</option>
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
              <button className={styles.trajBtn} onClick={prev} disabled={index === 0 || !isActive}>⏮</button>
              <button className={styles.trajBtn} onClick={status === 'idle' ? play : restart}>
                {status === 'idle' ? `▶` : `↺`}
              </button>
              <button className={styles.trajBtn} onClick={next} disabled={index >= ordered.length - 1}>⏭</button>
            </div>
            <p className={styles.statusLabel}>
              {status === 'travelling' && `▶ TRAVELLING`}
              {status === 'waiting'    && `◉ ARRIVED`}
              {status === 'idle'       && `◌ PRESS PLAY`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {!isMobile && (
        <>
          <div className={styles.divider} />
          <p className={styles.hint}>
            <kbd className={styles.kbd}>H</kbd> hide panel
          </p>
        </>
      )}
    </>
  )

  // ── Mobile: bottom drawer ─────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Drawer */}
        <motion.div
          className={styles.drawer}
          initial={false}
          animate={{ y: drawerOpen ? 0 : 'calc(100% - 52px)' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Drag handle */}
          <div
            className={styles.drawerHandle}
            onPointerDown={(e) => { dragStartY.current = e.clientY }}
            onPointerMove={(e) => {
              if (dragStartY.current === null) return
              const dy = e.clientY - dragStartY.current
              if (dy < -30) { setDrawerOpen(true);  dragStartY.current = null }
              if (dy >  30) { setDrawerOpen(false); dragStartY.current = null }
            }}
            onPointerUp={() => { dragStartY.current = null }}
            onClick={() => setDrawerOpen(v => !v)}
          >
            <div className={styles.drawerPill} />
        <span className={styles.drawerTitle}>✦ COSMOS</span>
            <span className={styles.drawerChevron}>{drawerOpen ? '▼' : '▲'}</span>
          </div>
          <div className={styles.drawerContent}>
            {panelContent}
          </div>
        </motion.div>

        {/* Spacebar prompt (tap to advance on mobile) */}
        <AnimatePresence>
          {navMode === 'trajectory' && status === 'waiting' && (
            <motion.div
              className={styles.spacebarPrompt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              onClick={() => next()}
            >
              <kbd className={styles.spacebarKey}>TAP</kbd>
              <span className={styles.spacebarLabel}>
                {index + 1 < ordered.length ? `next star` : `end tour`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Desktop layout ────────────────────────────────────────────────
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
            {panelContent}
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
