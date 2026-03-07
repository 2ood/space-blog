/**
 * usePosts
 *
 * Single source of truth for post data:
 *   - Fetches /api/posts on mount
 *   - Writes into spaceStore so all consumers stay in sync
 *   - Returns { posts, loading, error } for local render decisions
 *   - Exposes refetch() so the create-post flow can invalidate after saving
 */

import { useEffect, useState, startTransition } from 'react'
import { useSpaceStore } from '@/store/spaceStore'
import type { Post } from '@/components/BlogStars/BlogStars'

interface UsePostsResult {
  posts: Post[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePosts(): UsePostsResult {
  const setPosts = useSpaceStore((s) => s.setPosts)
  const [posts, setPending] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error(`/api/posts returned ${res.status}`)
        return res.json() as Promise<Post[]>
      })
      .then((data) => {
        if (cancelled) return
        setPending(data)
        setPosts(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        console.error('Failed to load posts:', err)
        setError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [tick, setPosts])

  return { posts, loading, error, refetch: () => setTick(t => t + 1) }
}
