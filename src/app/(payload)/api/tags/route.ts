import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'tags',
    limit: 1000,
    depth: 0,
    sort: 'name',
  })

  const tags = result.docs.map((doc: Record<string, unknown>) => ({
    id:   String(doc['id'] ?? ''),
    name: String(doc['name'] ?? ''),
  }))

  return Response.json(tags)
}
