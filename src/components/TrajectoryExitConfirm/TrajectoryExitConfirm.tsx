'use client'

import { createPortal } from 'react-dom'
import { useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/spaceStore'
import styles from './TrajectoryExitConfirm.module.css'

const useIsMounted = () =>
  useSyncExternalStore(
    (cb) => { cb(); return () => {} },
    () => true,
    () => false,
  )

export default function TrajectoryExitConfirm() {
  const mounted    = useIsMounted()
  const confirm    = useSpaceStore((s) => s.trajectoryExitConfirm)
  const setConfirm = useSpaceStore((s) => s.setTrajectoryExitConfirm)

  const dismiss = () => setConfirm(null)

  const handleConfirm = () => {
    if (!confirm) return

    const {
      setNavMode,
      setTrajectoryStatus,
      setTrajectoryBreakout,
      setTrajectoryAnchor,
      setPendingFlyTo,
    } = useSpaceStore.getState()

    // Exit trajectory mode
    setNavMode('free')
    setTrajectoryStatus('idle')
    setTrajectoryBreakout(false)
    setTrajectoryAnchor(null)
    document.exitPointerLock()

    // Queue the fly-to — consumed by useFlyTo inside Canvas on next frame
    setPendingFlyTo({ starPos: confirm.starPos, postId: confirm.postId })

    setConfirm(null)
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {confirm && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
          />
          <motion.div
            className={styles.dialog}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={styles.message}>
              Leave the trajectory tour and fly to this star?
            </p>
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={dismiss}>
                STAY IN TOUR
              </button>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                LEAVE &amp; FLY →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
