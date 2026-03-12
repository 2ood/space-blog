/**
 * migrate-tags-categories.ts
 * Run with:  npx tsx migrate-tags-categories.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const CATEGORIES = [
  { name: 'NLP',          color: '#4a90d9' },
  { name: 'Alignment',    color: '#a855f7' },
  { name: 'Scaling',      color: '#f97316' },
  { name: 'RL',           color: '#22c55e' },
  { name: 'Neuroscience', color: '#ec4899' },
]

const SLUG_TO_CATEGORY: Record<string, string> = {
  'attention-is-all-you-need-revisited':         'NLP',
  'bert-vs-gpt-encoder-wars':                    'NLP',
  'positional-encoding-demystified':             'NLP',
  'the-tokenization-problem':                    'NLP',
  'flash-attention-and-the-memory-wall':         'NLP',
  'mixture-of-experts-a-practical-guide':        'NLP',
  'long-context-the-1m-token-frontier':          'NLP',
  'multilingual-models-and-the-curse-of-babel':  'NLP',

  'the-alignment-problem-is-not-what-you-think': 'Alignment',
  'rlhf-reward-hacking-in-the-wild':             'Alignment',
  'constitutional-ai-explained':                 'Alignment',
  'interpretability-reading-the-models-mind':    'Alignment',
  'deceptive-alignment-a-thought-experiment':    'Alignment',
  'red-teaming-at-scale':                        'Alignment',
  'the-corrigibility-spectrum':                  'Alignment',
  'evaluating-honesty-in-language-models':       'Alignment',

  'scaling-laws-and-their-limits':               'Scaling',
  'chinchilla-and-the-compute-frontier':         'Scaling',
  'emergent-abilities-real-or-mirage':           'Scaling',
  'the-bitter-lesson-5-years-later':             'Scaling',
  'data-scaling-vs-model-scaling':               'Scaling',
  'inference-compute-and-test-time-scaling':     'Scaling',
  'benchmark-contamination-and-evaluation-debt': 'Scaling',
  'the-plateau-hypothesis':                      'Scaling',
}

const TAG_NAMES = ['Transformers', 'NLP', 'Alignment', 'Safety', 'Scaling', 'Empirics', 'RL', 'Neuroscience']

const CATEGORY_DEFAULT_TAGS: Record<string, string[]> = {
  NLP:          ['NLP', 'Transformers'],
  Alignment:    ['Alignment', 'Safety'],
  Scaling:      ['Scaling', 'Empirics'],
  RL:           ['RL'],
  Neuroscience: ['Neuroscience'],
}

const isObjectId = (s: string) => /^[a-f0-9]{24}$/i.test(s)

async function main() {
  const { getPayload }             = await import('payload')
  const { default: configPromise } = await import('./src/payload.config.js')
  const payload = await getPayload({ config: configPromise })

  // ── 0. Delete stale docs whose name is a raw ObjectId ────────────────────
  console.log('\n── Cleaning stale docs ──────────────────────────')

  const staleCats = await payload.find({ collection: 'categories', limit: 1000, depth: 0 })
  for (const doc of staleCats.docs) {
    if (isObjectId(String(doc.name ?? ''))) {
      await payload.delete({ collection: 'categories', id: String(doc.id) })
      console.log(`  Deleted stale category: ${doc.name}`)
    }
  }

  const staleTags = await payload.find({ collection: 'tags', limit: 1000, depth: 0 })
  for (const doc of staleTags.docs) {
    if (isObjectId(String(doc.name ?? ''))) {
      await payload.delete({ collection: 'tags', id: String(doc.id) })
      console.log(`  Deleted stale tag: ${doc.name}`)
    }
  }

  // ── 1. Upsert Categories ──────────────────────────────────────────────────
  console.log('\n── Categories ───────────────────────────────────')
  const categoryIdByName = new Map<string, string>()
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories', where: { name: { equals: cat.name } }, limit: 1, depth: 0,
    })
    if (existing.totalDocs > 0) {
      const id = String(existing.docs[0].id)
      await payload.update({ collection: 'categories', id, depth: 0, data: { color: cat.color } })
      categoryIdByName.set(cat.name, id)
      console.log(`  Updated: ${cat.name} → ${cat.color}`)
    } else {
      const created = await payload.create({ collection: 'categories', data: cat })
      categoryIdByName.set(cat.name, String(created.id))
      console.log(`  Created: ${cat.name} → ${cat.color}`)
    }
  }

  // ── 2. Upsert Tags ────────────────────────────────────────────────────────
  console.log('\n── Tags ─────────────────────────────────────────')
  const tagIdByName = new Map<string, string>()
  for (const name of TAG_NAMES) {
    const existing = await payload.find({
      collection: 'tags', where: { name: { equals: name } }, limit: 1, depth: 0,
    })
    if (existing.totalDocs > 0) {
      tagIdByName.set(name, String(existing.docs[0].id))
      console.log(`  Exists: ${name}`)
    } else {
      const created = await payload.create({ collection: 'tags', data: { name } })
      tagIdByName.set(name, String(created.id))
      console.log(`  Created: ${name}`)
    }
  }

  // ── 3. Assign categories to posts by slug ─────────────────────────────────
  console.log('\n── Posts ────────────────────────────────────────')
  const posts = await payload.find({ collection: 'posts', limit: 2000, depth: 0 })
  let updated = 0, skipped = 0

  for (const post of posts.docs) {
    const slug         = String(post.slug ?? '')
    const categoryName = SLUG_TO_CATEGORY[slug]

    if (!categoryName) {
      console.log(`  ⚠ No mapping: "${slug}" — skipped`)
      skipped++
      continue
    }

    const categoryId = categoryIdByName.get(categoryName) ?? null
    const tagIds     = (CATEGORY_DEFAULT_TAGS[categoryName] ?? [])
      .map(n => tagIdByName.get(n)).filter(Boolean) as string[]

    await payload.update({
      collection: 'posts', id: String(post.id), depth: 0,
      data: { category: categoryId, tags: tagIds },
    })
    updated++
    console.log(`  ✓ "${post.title}" → ${categoryName}`)
  }

  console.log(`\n✓ Done. ${updated} updated, ${skipped} skipped.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })