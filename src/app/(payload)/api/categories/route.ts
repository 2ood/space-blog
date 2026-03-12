import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    limit: 500,
    depth: 0,
    sort: 'name',
  })

  const categories = result.docs.map((doc: Record<string, unknown>) => ({
    id:    String(doc['id'] ?? ''),
    name:  String(doc['name'] ?? ''),
    color: String(doc['color'] ?? '#00d4ff'),
  }))

  return Response.json(categories)
}
