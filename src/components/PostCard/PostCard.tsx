'use client'

import { createPortal } from 'react-dom'
import { useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/spaceStore'
import styles from './PostCard.module.css'

// SSR-safe mount check — avoids the setState-in-effect pattern
const useIsMounted = () =>
  useSyncExternalStore(
    (cb) => { cb(); return () => {} },
    () => true,
    () => false
  )

export default function PostCard() {
  const mounted = useIsMounted()
  const post = useSpaceStore((s) => s.activePost)
  const setActivePost  = useSpaceStore((s) => s.setActivePost)
  const setOpenPostSlug = useSpaceStore((s) => s.setOpenPostSlug)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePost(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setActivePost])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {post && (
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.scanline} />

          <div className={styles.header}>
            <div className={styles.tags}>
              {post.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
            <button className={styles.close} onClick={() => setActivePost(null)} aria-label="Close">
              ✕
            </button>
          </div>

          <h2 className={styles.title}>{post.title}</h2>

          <p className={styles.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <p className={styles.excerpt}>{post.excerpt}</p>

          <div className={styles.footer}>
            <span className={styles.proximity}>● PUBLISHED</span>
            <button
              className={styles.readButton}
              onClick={() => setOpenPostSlug(post.slug)}
            >
              READ →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
