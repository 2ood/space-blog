import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })

  const posts = result.docs.map((doc) => {
    const tags = ((doc.tags ?? []) as { tag?: string }[])
      .map((t) => t.tag ?? '')
      .filter(Boolean)

    const pos = doc.position as { x?: number; y?: number; z?: number } | undefined

    return {
      id:              String(doc.id),
      title:           String(doc.title ?? ''),
      slug:            String(doc.slug ?? ''),
      date:            doc.date ? String(doc.date) : '',
      excerpt:         String(doc.excerpt ?? ''),
      tags,
      size:            Math.min(5, Math.max(1, Number(doc.size ?? 3))) as 1|2|3|4|5,
      trajectoryOrder: Number(doc.trajectoryOrder ?? 0),
      position: [
        Number(pos?.x ?? 0),
        Number(pos?.y ?? 0),
        Number(pos?.z ?? 0),
      ] as [number, number, number],
      // depth:0 returns relationship fields as raw ID strings
      relatedPosts: ((doc.relatedPosts ?? []) as (string | { id: string })[])
        .map((r) => (typeof r === 'string' ? r : String(r.id)))
        .filter(Boolean),
    }
  })

  return Response.json(posts)
}