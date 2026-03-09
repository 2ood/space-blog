'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/spaceStore'
import type { Post } from '@/components/BlogStars/BlogStars'
import styles from './SearchBar.module.css'

// ── Fuzzy match ───────────────────────────────────────────────────────────────
interface MatchResult {
  post:    Post
  score:   number   // higher = better match
  field:   'title' | 'tag' | 'excerpt'
  excerpt: string   // snippet to show in result
}

function search(query: string, posts: Post[]): MatchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: MatchResult[] = []

  posts.forEach(post => {
    const titleLower   = post.title.toLowerCase()
    const tagsLower    = post.tags.map(t => t.toLowerCase())
    const excerptLower = post.excerpt.toLowerCase()

    if (titleLower.includes(q)) {
      results.push({ post, score: 3, field: 'title', excerpt: post.title })
    } else if (tagsLower.some(t => t.includes(q))) {
      results.push({ post, score: 2, field: 'tag', excerpt: post.tags.join(', ') })
    } else if (excerptLower.includes(q)) {
      // Grab a snippet around the match
      const idx   = excerptLower.indexOf(q)
      const start = Math.max(0, idx - 20)
      const end   = Math.min(post.excerpt.length, idx + q.length + 40)
      const snip  = (start > 0 ? '…' : '') + post.excerpt.slice(start, end) + (end < post.excerpt.length ? '…' : '')
      results.push({ post, score: 1, field: 'excerpt', excerpt: snip })
    }
  })

  return results.sort((a, b) => b.score - a.score).slice(0, 6)
}

/** Wrap matching substring in a <mark> */
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SearchBar() {
  const posts          = useSpaceStore((s) => s.posts)
  const setPendingFlyTo = useSpaceStore((s) => s.setPendingFlyTo)

  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(-1)   // keyboard-nav index

  const inputRef    = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => search(query, posts), [query, posts])

  // ── Open / close ──────────────────────────────────────────────────
  const openBar = useCallback(() => {
    setOpen(true)
    setFocused(-1)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const closeBar = useCallback(() => {
    setOpen(false)
    setQuery('')
    setFocused(-1)
    inputRef.current?.blur()
  }, [])

  // ── Select a result ───────────────────────────────────────────────
  const selectResult = useCallback((post: Post) => {
    setPendingFlyTo({
      starPos: post.position as [number, number, number],
      postId:  post.id,
    })
    closeBar()
  }, [setPendingFlyTo, closeBar])

  // ── Global '/' shortcut ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept when pointer-locked (WASD movement active)
      if (document.pointerLockElement) return
      if (e.key === '/' && !open) {
        e.preventDefault()
        openBar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openBar])

  // ── Keyboard navigation inside the bar ───────────────────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { closeBar(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocused(f => Math.min(f + 1, results.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocused(f => Math.max(f - 1, -1))
    }
    if (e.key === 'Enter' && focused >= 0 && results[focused]) {
      selectResult(results[focused].post)
    }
  }, [closeBar, focused, results, selectResult])

  // ── Click outside to close ────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeBar()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closeBar])

  const fieldLabel = (f: MatchResult['field']) =>
    f === 'title' ? null : <span className={styles.fieldTag}>{f}</span>

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <AnimatePresence mode="wait">
        {!open ? (
          // ── Collapsed pill ─────────────────────────────────────────
          <motion.button
            key="pill"
            className={styles.pill}
            onClick={openBar}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            aria-label="Search posts"
          >
            <SearchIcon />
            <span className={styles.pillText}>search</span>
            <span className={styles.pillShortcut}>/</span>
          </motion.button>
        ) : (
          // ── Expanded input ─────────────────────────────────────────
          <motion.div
            key="expanded"
            className={styles.expanded}
            initial={{ opacity: 0, scaleX: 0.85, y: -4 }}
            animate={{ opacity: 1, scaleX: 1,    y: 0  }}
            exit={{ opacity: 0, scaleX: 0.85, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.inputRow}>
              <SearchIcon dim />
              <input
                ref={inputRef}
                className={styles.input}
                value={query}
                onChange={e => { setQuery(e.target.value); setFocused(-1) }}
                onKeyDown={onKeyDown}
                placeholder="title, tag, or keyword…"
                spellCheck={false}
                autoComplete="off"
              />
              {query && (
                <button className={styles.clearBtn} onClick={() => { setQuery(''); inputRef.current?.focus() }}>
                  ✕
                </button>
              )}
              <button className={styles.escBtn} onClick={closeBar}>ESC</button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.ul
                  className={styles.results}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                >
                  {results.map(({ post, field, excerpt }, i) => (
                    <li
                      key={post.id}
                      className={`${styles.result} ${i === focused ? styles.resultFocused : ''}`}
                      onMouseEnter={() => setFocused(i)}
                      onMouseDown={(e) => { e.preventDefault(); selectResult(post) }}
                    >
                      <span className={styles.resultTitle}>
                        {highlight(post.title, query)}
                      </span>
                      <span className={styles.resultMeta}>
                        {fieldLabel(field)}
                        <span className={styles.resultExcerpt}>
                          {field !== 'title' ? highlight(excerpt, query) : post.tags[0] ?? ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </motion.ul>
              )}

              {query.trim() && results.length === 0 && (
                <motion.div
                  className={styles.empty}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  no stars found for &ldquo;{query}&rdquo;
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SearchIcon({ dim }: { dim?: boolean }) {
  return (
    <svg
      className={`${styles.icon} ${dim ? styles.iconDim : ''}`}
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" stroke="currentColor" strokeWidth="1.5"
    >
      <circle cx="6" cy="6" r="4.5" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  )
}
