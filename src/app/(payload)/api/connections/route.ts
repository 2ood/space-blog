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

  type MaybeRef = { id?: string } | string | null | undefined
  const resolveId = (val: MaybeRef) =>
    typeof val === 'object' && val !== null ? String(val.id ?? '') : String(val ?? '')

  const connections = result.docs.map((doc) => ({
    from: resolveId(doc.from as MaybeRef),
    to:   resolveId(doc.to   as MaybeRef),
  }))

  return Response.json(connections)
}