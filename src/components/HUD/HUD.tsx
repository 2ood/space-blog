'use client'

import { useSpaceStore } from '@/store/spaceStore'
import styles from './HUD.module.css'

export default function HUD() {
  const isFreeroam = useSpaceStore((s) => s.isFreeroam)

  return (
    <div className={styles.hud}>
      {/* Bottom left — controls hint + H/T shortcuts */}
      <div className={styles.bottomLeft}>
        {!isFreeroam ? (
          <p className={styles.hint}>
            <span className={styles.key}>RIGHT-CLICK</span> to enter free roam
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

      {/* Top right — status */}
      <div className={styles.topRight}>
        <span className={styles.status}>
          <span className={styles.statusDot} />
          {isFreeroam ? 'FREE ROAM' : 'OBSERVER'}
        </span>
      </div>

      {/* Center crosshair */}
      <div className={styles.crosshairWrapper}>
        <div className={`${styles.crosshair} ${isFreeroam ? styles.crosshairFreeroam : styles.crosshairObserver}`}>
          {!isFreeroam && <div className={styles.crosshairRing} />}
          <div className={styles.crosshairH} />
          <div className={styles.crosshairV} />
          {!isFreeroam && <div className={styles.crosshairDot} />}
        </div>
      </div>
    </div>
  )
}
