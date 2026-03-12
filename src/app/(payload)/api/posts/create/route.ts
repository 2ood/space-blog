import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { computePosition } from '@/components/AddPostDrawer/positionUtils'
import type { Post } from '@/components/BlogStars/BlogStars'

export const dynamic = 'force-dynamic'

interface CreatePostBody {
  title:      string
  slug:       string
  date:       string
  excerpt:    string
  categoryId: string        // ID of the Category doc
  tagIds:     string[]      // IDs of Tag docs
  size:       1 | 2 | 3 | 4 | 5
  outgoing:   string[]      // post IDs this post links to
  incoming:   string[]      // post IDs that should link back
}

function isValidBody(b: unknown): b is CreatePostBody {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  return (
    typeof o.title      === 'string' && o.title.trim().length > 0 &&
    typeof o.slug       === 'string' && o.slug.trim().length  > 0 &&
    typeof o.date       === 'string' &&
    typeof o.categoryId === 'string' &&
    Array.isArray(o.tagIds) &&
    typeof o.size       === 'number' &&
    Array.isArray(o.outgoing) &&
    Array.isArray(o.incoming)
  )
}

function toIdArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return (raw as (string | { id: string })[])
    .map(r => (typeof r === 'string' ? r : String(r.id)))
    .filter(Boolean)
}

function docToPost(doc: Record<string, unknown>): Post {
  const pos    = doc.position as { x?: number; y?: number; z?: number } | undefined
  const rawCat = doc.category as { id?: string; name?: string; color?: string } | string | null | undefined
  const category = rawCat && typeof rawCat === 'object'
    ? { id: String(rawCat.id ?? ''), name: String(rawCat.name ?? ''), color: String(rawCat.color ?? '#00d4ff') }
    : null
  const rawTags = (doc.tags ?? []) as ({ id?: string; name?: string } | string)[]
  const tags = rawTags.map(t => typeof t === 'string'
    ? { id: t, name: '' }
    : { id: String(t.id ?? ''), name: String(t.name ?? '') }
  ).filter(t => t.id)

  return {
    id:              String(doc.id),
    title:           String(doc.title ?? ''),
    slug:            String(doc.slug  ?? ''),
    date:            doc.date ? String(doc.date) : '',
    excerpt:         String(doc.excerpt ?? ''),
    category,
    tags,
    size:            Math.min(5, Math.max(1, Number(doc.size ?? 3))) as 1|2|3|4|5,
    trajectoryOrder: Number(doc.trajectoryOrder ?? 0),
    position: [
      Number(pos?.x ?? 0),
      Number(pos?.y ?? 0),
      Number(pos?.z ?? 0),
    ] as [number, number, number],
    relatedPosts: toIdArray(doc.relatedPosts),
  }
}

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!isValidBody(body)) {
    return Response.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const { title, slug, date, excerpt, categoryId, tagIds, size, outgoing, incoming } = body

  const payload = await getPayload({ config: configPromise })

  // Slug uniqueness
  const existing = await payload.find({
    collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0,
  })
  if (existing.totalDocs > 0) {
    return Response.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
  }

  // Fetch category for position computation (cluster placement uses category name)
  let categoryName = ''
  if (categoryId) {
    try {
      const cat = await payload.findByID({ collection: 'categories', id: categoryId, depth: 0 })
      categoryName = String(cat.name ?? '')
    } catch { /* category not found — proceed without it */ }
  }

  // Fetch all posts to compute placement
  const allResult  = await payload.find({ collection: 'posts', limit: 1000, depth: 1 })
  const allPosts   = allResult.docs.map(doc => docToPost(doc as Record<string, unknown>))

  const connectionIds  = new Set([...outgoing, ...incoming])
  const connectedPosts = allPosts.filter((p: Post) => connectionIds.has(p.id))
  const [x, y, z]     = computePosition(connectedPosts, allPosts, categoryName ? [categoryName] : [])

  // Create the post
  let created
  try {
    created = await payload.create({
      collection: 'posts',
      depth: 1,
      data: {
        title, slug, date, excerpt,
        category:        categoryId || null,
        tags:            tagIds,
        size:            Math.min(5, Math.max(1, size)),
        trajectoryOrder: 0,
        position:        { x, y, z },
        relatedPosts:    outgoing,
      },
    })
  } catch (err) {
    console.error('[create-post] payload.create failed:', err)
    return Response.json({ error: 'Failed to create post' }, { status: 500 })
  }

  const newId = String(created.id)

  // Patch incoming posts
  if (incoming.length > 0) {
    await Promise.allSettled(
      incoming.map(async (sourceId: string) => {
        const source  = await payload.findByID({ collection: 'posts', id: sourceId, depth: 0 })
        const current = toIdArray(source.relatedPosts)
        if (current.includes(newId)) return
        await payload.update({ collection: 'posts', id: sourceId, depth: 0,
          data: { relatedPosts: [...current, newId] } })
      })
    )
  }

  // Build response using the created doc
  const createdDoc = docToPost(created as unknown as Record<string, unknown>)

  return Response.json({
    ...createdDoc,
    position: [x, y, z] as [number, number, number],
  }, { status: 201 })
}
