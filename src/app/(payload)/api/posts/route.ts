import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 1,   // populate category and tags relationships
  })

  const posts = result.docs.map((doc: Record<string, unknown>) => {
    const pos = doc.position as { x?: number; y?: number; z?: number } | undefined

    // category may be null or a populated object or a bare ID string (depth:1 should populate)
    const rawCat = doc.category as { id?: string; name?: string; color?: string } | string | null | undefined
    const category = rawCat && typeof rawCat === 'object'
      ? { id: String(rawCat.id ?? ''), name: String(rawCat.name ?? ''), color: String(rawCat.color ?? '#00d4ff') }
      : null

    // tags is hasMany relationship — depth:1 returns populated objects
    const rawTags = (doc.tags ?? []) as ({ id?: string; name?: string } | string)[]
    const tags = rawTags
      .map(t => typeof t === 'string'
        ? { id: t, name: '' }
        : { id: String(t.id ?? ''), name: String(t.name ?? '') }
      )
      .filter(t => t.id)

    return {
      id:              String(doc.id),
      title:           String(doc.title ?? ''),
      slug:            String(doc.slug ?? ''),
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
      relatedPosts: ((doc.relatedPosts ?? []) as (string | { id: string })[])
        .map(r => (typeof r === 'string' ? r : String(r.id)))
        .filter(Boolean),
    }
  })

  return Response.json(posts)
}
