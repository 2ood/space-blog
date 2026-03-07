'use client'

/**
 * PostOverlay
 *
 * Full-content post reader rendered as an overlay over the 3D scene.
 * Triggered by openPostSlug in the store (set by PostCard's "READ TRANSMISSION" button).
 * Keeps the space scene alive behind it — no page navigation.
 */

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { useSpaceStore } from '@/store/spaceStore'
import styles from './PostOverlay.module.css'

interface FullPost {
  id: string
  title: string
  slug: string
  date: string
  excerpt: string
  tags: string[]
  content: SerializedEditorState | null
}

// SSR-safe mount check
const useIsMounted = () =>
  useSyncExternalStore(
    (cb) => { cb(); return () => {} },
    () => true,
    () => false,
  )

export default function PostOverlay() {
  const mounted       = useIsMounted()
  const slug          = useSpaceStore((s) => s.openPostSlug)
  const setSlug       = useSpaceStore((s) => s.setOpenPostSlug)
  const setActivePost = useSpaceStore((s) => s.setActivePost)

  const [fetchState, setFetchState] = useState<
    | { slug: null;   status: 'idle' }
    | { slug: string; status: 'loading' }
    | { slug: string; status: 'done';  post: FullPost }
    | { slug: string; status: 'error'; message: string }
  >({ slug: null, status: 'idle' })

  // Fetch full content whenever slug changes
  useEffect(() => {
    if (!slug) return

    let cancelled = false

    fetch(`/api/posts/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load post (${res.status})`)
        return res.json() as Promise<FullPost>
      })
      .then((data) => { if (!cancelled) setFetchState({ slug, status: 'done', post: data }) })
      .catch((err: Error) => { if (!cancelled) setFetchState({ slug, status: 'error', message: err.message }) })

    return () => { cancelled = true }
  }, [slug])

  // Derive loading/post/error — "loading" when slug doesn't match last settled fetch
  const isFetching = slug !== null && (fetchState.slug !== slug || fetchState.status === 'loading')
  const post    = fetchState.status === 'done'  && fetchState.slug === slug ? fetchState.post    : null
  const loading = isFetching
  const error   = fetchState.status === 'error' && fetchState.slug === slug ? fetchState.message : null

  const close = useCallback(() => {
    setSlug(null)
    setActivePost(null)
  }, [setSlug, setActivePost])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {slug && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header bar */}
            <div className={styles.header}>
              <button className={styles.closeBtn} onClick={close} aria-label="Close">
                ✕ CLOSE
              </button>
            </div>

            <div className={styles.scroll}>
              {loading && (
                <div className={styles.loading}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                </div>
              )}

              {error && (
                <p className={styles.error}>⚠ {error}</p>
              )}

              {post && !loading && (
                <article className={styles.article}>
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className={styles.tags}>
                      {post.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h1 className={styles.title}>{post.title}</h1>

                  {/* Date */}
                  {post.date && (
                    <p className={styles.date}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  )}

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className={styles.excerpt}>{post.excerpt}</p>
                  )}

                  <div className={styles.divider} />

                  {/* Rich text body */}
                  {post.content && (
                    <div className={styles.body}>
                      <RichText data={post.content} />
                    </div>
                  )}
                </article>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
