'use client'

/**
 * AddPostDrawer
 *
 * Flow:
 *   1. User selects connections (outgoing / incoming)
 *   2. User picks one category (fetched on open) — determines colour + cluster
 *   3. User picks zero or many tags (fetched on open, create inline)
 *   4. User fills identity fields (title, slug, date, size, excerpt)
 *   5. Launch → POST /api/posts/create → backend computes position
 */

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpaceStore } from '@/store/spaceStore'
import { getCategoryColor } from '@/config/spaceConfig'
import type { Post, Category, Tag } from '@/components/BlogStars/BlogStars'
import styles from './AddPostDrawer.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

const useIsMounted = () =>
  useSyncExternalStore(
    (cb) => { cb(); return () => {} },
    () => true,
    () => false,
  )

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  title:      string
  slug:       string
  slugManual: boolean
  date:       string
  excerpt:    string
  size:       1 | 2 | 3 | 4 | 5
}

// ── PostSearchPicker ──────────────────────────────────────────────────────────

function PostSearchPicker({
  label, posts, selected, onToggle,
}: {
  label: string
  posts: Post[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return posts.slice(0, 20)
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category?.name.toLowerCase().includes(q) ||
      p.tags.some(t => t.name.toLowerCase().includes(q))
    ).slice(0, 20)
  }, [query, posts])

  return (
    <div className={styles.connectionCol}>
      <span className={styles.connectionColLabel}>{label}</span>
      <input
        className={styles.input}
        placeholder="Search planets…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
      />
      {selected.size > 0 && (
        <div className={styles.selectedPills}>
          {posts.filter(p => selected.has(p.id)).map(p => {
            const color = getCategoryColor(p.category?.color, p.category?.name)
            return (
              <button key={p.id} className={styles.selectedPill}
                style={{ borderColor: color, color }}
                onClick={() => onToggle(p.id)} type="button" title="Click to remove">
                {p.title} ×
              </button>
            )
          })}
        </div>
      )}
      <div className={styles.postList}>
        {filtered.length === 0 && <span className={styles.postListEmpty}>No results</span>}
        {filtered.map(p => {
          const color  = getCategoryColor(p.category?.color, p.category?.name)
          const active = selected.has(p.id)
          return (
            <button key={p.id}
              className={`${styles.postListItem} ${active ? styles.postListItemActive : ''}`}
              onClick={() => onToggle(p.id)} type="button">
              <span className={styles.postListDot} style={{ background: color }} />
              {p.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AddPostDrawer({ onCreated }: { onCreated: () => void }) {
  const mounted         = useIsMounted()
  const open            = useSpaceStore((s) => s.addPostOpen)
  const setOpen         = useSpaceStore((s) => s.setAddPostOpen)
  const allPosts        = useSpaceStore((s) => s.posts)
  const setPendingFlyTo = useSpaceStore((s) => s.setPendingFlyTo)

  // ── Remote data ────────────────────────────────────────────────────
  const [categories,     setCategories]     = useState<Category[]>([])
  const [availableTags,  setAvailableTags]  = useState<Tag[]>([])
  const [loadingMeta,    setLoadingMeta]    = useState(false)

  // ── Form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    title: '', slug: '', slugManual: false, date: todayISO(), excerpt: '', size: 3,
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTagIds,     setSelectedTagIds]     = useState<Set<string>>(new Set())
  const [tagInput,           setTagInput]           = useState('')
  const [outgoing,           setOutgoing]           = useState<Set<string>>(new Set())
  const [incoming,           setIncoming]           = useState<Set<string>>(new Set())
  const [submitting,         setSubmitting]         = useState(false)
  const [error,              setError]              = useState<string | null>(null)

  // ── Fetch categories + tags when drawer opens ──────────────────────
  useEffect(() => {
    if (!open) return
    setLoadingMeta(true)
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/tags').then(r => r.json()),
    ]).then(([cats, tags]) => {
      setCategories(cats)
      setAvailableTags(tags)
    }).catch(console.error)
      .finally(() => setLoadingMeta(false))
  }, [open])

  // ── Reset when drawer closes ───────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setForm({ title: '', slug: '', slugManual: false, date: todayISO(), excerpt: '', size: 3 })
      setSelectedCategoryId(null)
      setSelectedTagIds(new Set())
      setTagInput('')
      setOutgoing(new Set())
      setIncoming(new Set())
      setError(null)
    }
  }, [open])

  // ── Field helpers ──────────────────────────────────────────────────
  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const onTitleChange = (v: string) =>
    setForm(f => ({ ...f, title: v, slug: f.slugManual ? f.slug : slugify(v) }))

  const toggleSet = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    setFn(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id) } else { n.add(id) }; return n })

  // ── Inline tag creation ────────────────────────────────────────────
  const commitTagInput = async () => {
    const name = tagInput.trim()
    if (!name) return
    // Check if already exists in available tags
    const existing = availableTags.find(t => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setSelectedTagIds(prev => new Set(prev).add(existing.id))
      setTagInput('')
      return
    }
    // Create it
    try {
      const res  = await fetch('/api/tags/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok || res.status === 200) {
        setAvailableTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedTagIds(prev => new Set(prev).add(data.id))
        setTagInput('')
      }
    } catch (e) { console.error('tag create error', e) }
  }

  // ── Inline category creation ───────────────────────────────────────
  const [catInput,      setCatInput]      = useState('')
  const [catColor,      setCatColor]      = useState('#a855f7')
  const [creatingCat,   setCreatingCat]   = useState(false)
  const [showCatCreate, setShowCatCreate] = useState(false)

  const commitCategoryCreate = async () => {
    const name = catInput.trim()
    if (!name) return
    setCreatingCat(true)
    try {
      const res  = await fetch('/api/categories/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: catColor }),
      })
      const data = await res.json()
      if (res.ok) {
        setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedCategoryId(data.id)
        setCatInput('')
        setShowCatCreate(false)
      } else {
        setError(data.error ?? 'Failed to create category')
      }
    } catch (e) { console.error('category create error', e) }
    finally { setCreatingCat(false) }
  }

  // ── Submit ─────────────────────────────────────────────────────────
  const canSubmit = form.title.trim().length > 0 && form.slug.trim().length > 0

  const onSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      form.title.trim(),
          slug:       form.slug.trim(),
          date:       form.date || todayISO(),
          excerpt:    form.excerpt.trim(),
          categoryId: selectedCategoryId ?? '',
          tagIds:     [...selectedTagIds],
          size:       form.size,
          outgoing:   [...outgoing],
          incoming:   [...incoming],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); return }
      onCreated()
      setOpen(false)
      setPendingFlyTo({ starPos: data.position, postId: data.id })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) ?? null

  // ── Portal render ──────────────────────────────────────────────────
  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="backdrop" className={styles.backdrop}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} onClick={() => setOpen(false)} />
      )}
      {open && (
        <motion.div className={styles.panel} key="panel"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{ opacity: 0,    scale: 0.97, y: 12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerTitle}>✦ New Planet</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>ESC</button>
          </div>

          {/* Scrollable body */}
          <div className={styles.scroll}>
            <div className={styles.article}>

              {/* ── CONNECTIONS ────────────────────────────────────── */}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Connections</p>
                <div className={styles.connectionCols}>
                  <PostSearchPicker label="Outgoing →" posts={allPosts}
                    selected={outgoing} onToggle={(id) => toggleSet(setOutgoing, id)} />
                  <PostSearchPicker label="← Incoming" posts={allPosts}
                    selected={incoming} onToggle={(id) => toggleSet(setIncoming, id)} />
                </div>
              </div>

              {/* ── CATEGORY ───────────────────────────────────────── */}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Category</p>
                {loadingMeta
                  ? <p className={styles.loadingHint}>Loading…</p>
                  : (
                  <>
                    <div className={styles.tagGrid}>
                      {categories.map(cat => {
                        const active = cat.id === selectedCategoryId
                        return (
                          <button key={cat.id} type="button"
                            className={`${styles.tagPill} ${active ? styles.tagPillActive : ''}`}
                            style={{ color: cat.color, borderColor: active ? cat.color : undefined }}
                            onClick={() => setSelectedCategoryId(active ? null : cat.id)}>
                            {cat.name}{active ? ' ✓' : ''}
                          </button>
                        )
                      })}
                      <button type="button"
                        className={`${styles.tagPill} ${styles.tagPillNew}`}
                        onClick={() => setShowCatCreate(v => !v)}>
                        + New
                      </button>
                    </div>
                    {showCatCreate && (
                      <div className={styles.inlineCreate}>
                        <input className={styles.input} placeholder="Category name"
                          value={catInput} onChange={e => setCatInput(e.target.value)}
                          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); commitCategoryCreate() } }} />
                        <input type="color" className={styles.colorPicker}
                          value={catColor} onChange={e => setCatColor(e.target.value)}
                          title="Pick colour" />
                        <button type="button" className={styles.tagAddBtn}
                          disabled={creatingCat || !catInput.trim()}
                          onClick={commitCategoryCreate}>
                          {creatingCat ? '…' : 'Create'}
                        </button>
                      </div>
                    )}
                    {selectedCategory && (
                      <p className={styles.selectedHint} style={{ color: selectedCategory.color }}>
                        ✓ {selectedCategory.name}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* ── TAGS ───────────────────────────────────────────── */}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Tags <span className={styles.labelSub}>(optional, pick any)</span></p>
                {loadingMeta
                  ? <p className={styles.loadingHint}>Loading…</p>
                  : (
                  <>
                    <div className={styles.tagGrid}>
                      {[...availableTags, ...Array.from(selectedTagIds)
                          .filter(id => !availableTags.find(t => t.id === id))
                          .map(id => ({ id, name: id }))
                      ].map(tag => {
                        const active = selectedTagIds.has(tag.id)
                        return (
                          <button key={tag.id} type="button"
                            className={`${styles.tagPill} ${active ? styles.tagPillActive : ''}`}
                            style={{ borderColor: active ? 'var(--color-accent)' : undefined,
                                     color: active ? 'var(--color-accent)' : undefined }}
                            onClick={() => toggleSet(setSelectedTagIds, tag.id)}>
                            {tag.name}{active ? ' ×' : ''}
                          </button>
                        )
                      })}
                    </div>
                    <div className={styles.tagInputRow}>
                      <input className={styles.input} placeholder="Add or create tag…"
                        value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation()
                          if (e.key === 'Enter') { e.preventDefault(); commitTagInput() }
                        }} />
                      <button type="button" className={styles.tagAddBtn}
                        onClick={commitTagInput} disabled={!tagInput.trim()}>+</button>
                    </div>
                  </>
                )}
              </div>

              {/* ── IDENTITY ───────────────────────────────────────── */}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Identity</p>

                <div className={styles.field}>
                  <label className={styles.label}>Title</label>
                  <input className={styles.input} placeholder="Attention Is All You Need"
                    value={form.title} onChange={e => onTitleChange(e.target.value)}
                    onKeyDown={e => e.stopPropagation()} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Slug</label>
                  <input className={styles.input} placeholder="attention-is-all-you-need"
                    value={form.slug}
                    onChange={e => { setField('slugManual', true); setField('slug', e.target.value) }}
                    onKeyDown={e => e.stopPropagation()} />
                  <span className={styles.slugPreview}>/post/<span>{form.slug || '…'}</span></span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Date</label>
                  <input className={styles.input} type="date" value={form.date}
                    onChange={e => setField('date', e.target.value)}
                    onKeyDown={e => e.stopPropagation()} />
                </div>

                {/* Size */}
                <div className={styles.field}>
                  <label className={styles.label}>Planet size</label>
                  <div className={styles.sizePicker}>
                    {([1, 2, 3, 4, 5] as const).map(s => (
                      <button key={s} type="button"
                        className={`${styles.sizeBtn} ${form.size === s ? styles.sizeBtnActive : ''}`}
                        style={{ width: 10 + s * 8, height: 10 + s * 8,
                          background: form.size === s
                            ? getCategoryColor(selectedCategory?.color, selectedCategory?.name)
                            : undefined }}
                        onClick={() => setField('size', s)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CONTENT ────────────────────────────────────────── */}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Content</p>
                <div className={styles.field}>
                  <label className={styles.label}>Excerpt</label>
                  <textarea className={styles.textarea}
                    placeholder="A short description of this paper or post…"
                    value={form.excerpt} onChange={e => setField('excerpt', e.target.value)}
                    onKeyDown={e => e.stopPropagation()} />
                </div>
                <p className={styles.label} style={{ opacity: 0.5 }}>
                  Full rich-text content can be edited in the Payload admin after launching.
                </p>
              </div>

              {/* ── ERROR ──────────────────────────────────────────── */}
              {error && <p className={styles.errorMsg}>⚠ {error}</p>}

            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
            <button className={styles.launchBtn} onClick={onSubmit}
              disabled={!canSubmit || submitting}>
              {submitting ? 'Launching…' : 'Launch ✦'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}