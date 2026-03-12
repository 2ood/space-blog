import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, color } = (body ?? {}) as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  if (typeof color !== 'string' || !color.trim()) {
    return Response.json({ error: 'color is required' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  // Uniqueness check
  const existing = await payload.find({
    collection: 'categories',
    where: { name: { equals: name.trim() } },
    limit: 1,
    depth: 0,
  })
  if (existing.totalDocs > 0) {
    return Response.json({ error: `Category "${name.trim()}" already exists` }, { status: 409 })
  }

  const created = await payload.create({
    collection: 'categories',
    data: { name: name.trim(), color: color.trim() },
  })

  return Response.json({
    id:    String(created.id),
    name:  String(created.name),
    color: String(created.color),
  }, { status: 201 })
}
