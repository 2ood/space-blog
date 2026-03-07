import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'connections',
    limit: 10000,
    depth: 0, // just return IDs, not full post objects
  })

  const connections = result.docs.map((doc) => ({
    from: String((doc.from as any)?.id ?? doc.from),
    to:   String((doc.to   as any)?.id ?? doc.to),
  }))

  return Response.json(connections)
}
