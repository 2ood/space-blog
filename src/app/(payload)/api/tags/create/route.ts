import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name } = (body ?? {}) as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  // Uniqueness check (case-insensitive via exact match — Payload handles case)
  const existing = await payload.find({
    collection: 'tags',
    where: { name: { equals: name.trim() } },
    limit: 1,
    depth: 0,
  })
  if (existing.totalDocs > 0) {
    // Return the existing tag rather than erroring — idempotent create
    const doc = existing.docs[0]
    return Response.json({ id: String(doc.id), name: String(doc.name) }, { status: 200 })
  }

  const created = await payload.create({
    collection: 'tags',
    data: { name: name.trim() },
  })

  return Response.json({
    id:   String(created.id),
    name: String(created.name),
  }, { status: 201 })
}
