'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/spaceStore'
import { useMobile } from '@/hooks/useMobile'
import styles from './HUD.module.css'

export default function HUD() {
  const isFreeroam  = useSpaceStore((s) => s.isFreeroam)
  const hoveredPost = useSpaceStore((s) => s.hoveredPost)
  const hoverPos    = useSpaceStore((s) => s.hoverPos)
  const isMobile    = useMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  // ── Mobile: hamburger + dropdown hint menu ────────────────────────
  if (isMobile) {
    return (
      <div className={styles.hud}>
        {/* Status dot top-right */}
        <div className={styles.topRight}>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Controls"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Crosshair */}
        <div className={styles.crosshairWrapper}>
          <div className={`${styles.crosshair} ${styles.crosshairObserver}`}>
            <div className={styles.crosshairRing} />
            <div className={styles.crosshairH} />
            <div className={styles.crosshairV} />
            <div className={styles.crosshairDot} />
          </div>
        </div>

        {/* Dropdown hint sheet */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className={styles.mobileMenuTitle}>TOUCH CONTROLS</p>
              <div className={styles.mobileMenuRow}>
                <span className={styles.key}>1-FINGER SWIPE</span>
                <span className={styles.controlLabel}>move</span>
              </div>
              <div className={styles.mobileMenuRow}>
                <span className={styles.key}>2-FINGER SWIPE</span>
                <span className={styles.controlLabel}>look</span>
              </div>
              <div className={styles.mobileMenuRow}>
                <span className={styles.key}>PINCH</span>
                <span className={styles.controlLabel}>zoom</span>
              </div>
              <div className={styles.mobileMenuRow}>
                <span className={styles.key}>TAP STAR</span>
                <span className={styles.controlLabel}>focus</span>
              </div>
              <button
                className={styles.mobileMenuClose}
                onClick={() => setMenuOpen(false)}
              >
                ✕ close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Desktop HUD ───────────────────────────────────────────────────
  return (
    <div className={styles.hud}>
      <div className={styles.bottomLeft}>
        {!isFreeroam ? (
          <p className={styles.hint}>
            <span><span className={styles.key}>RIGHT-CLICK</span> free roam</span>
            <span><span className={styles.key}>CLICK STAR</span> focus</span>
          </p>
        ) : (
          <div className={styles.controls}>
            <div className={styles.controlRow}>
              <span className={styles.key}>W A S D</span>
              <span className={styles.controlLabel}>move</span>
            </div>
            <div className={styles.controlRow}>
              <span className={styles.key}>MOUSE</span>
              <span className={styles.controlLabel}>look</span>
            </div>
            <div className={styles.controlRow}>
              <span className={styles.key}>E / C</span>
              <span className={styles.controlLabel}>up / down</span>
            </div>
            <div className={styles.controlRow}>
              <span className={styles.key}>LEFT-CLICK</span>
              <span className={styles.controlLabel}>teleport to star</span>
            </div>
            <div className={styles.controlRow}>
              <span className={styles.key}>RIGHT-CLICK</span>
              <span className={styles.controlLabel}>exit free roam</span>
            </div>
          </div>
        )}
        <p className={styles.hint}>
          <span><span className={styles.key}>H</span> hide panel</span>
          <span><span className={styles.key}>T</span> star names</span>
        </p>
      </div>

      <div className={styles.topRight}>
        <span className={styles.status}>
          <span className={styles.statusDot} />
          {isFreeroam ? 'FREE ROAM' : 'OBSERVER'}
        </span>
      </div>

      <div className={styles.crosshairWrapper}>
        <div className={`${styles.crosshair} ${isFreeroam ? styles.crosshairFreeroam : styles.crosshairObserver}`}>
          {!isFreeroam && <div className={styles.crosshairRing} />}
          <div className={styles.crosshairH} />
          <div className={styles.crosshairV} />
          {!isFreeroam && <div className={styles.crosshairDot} />}
        </div>
      </div>

      {/* Observer hover: title floats above the planet in screen space */}
      <AnimatePresence>
        {!isFreeroam && hoveredPost && hoverPos && (
          <motion.div
            className={styles.hoverTitle}
            style={{ left: hoverPos.x, top: hoverPos.y }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {hoveredPost.title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
