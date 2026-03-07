import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  const doc = result.docs[0]
  if (!doc) return new Response('Not found', { status: 404 })

  const tags = ((doc.tags ?? []) as { tag?: string }[])
    .map((t) => t.tag ?? '')
    .filter(Boolean)

  return Response.json({
    id:      String(doc.id),
    title:   String(doc.title ?? ''),
    slug:    String(doc.slug ?? ''),
    date:    doc.date ? String(doc.date) : '',
    excerpt: String(doc.excerpt ?? ''),
    tags,
    content: doc.content ?? null,
  })
}
