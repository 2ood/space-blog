/**
 * migrate-connections.ts
 *
 * One-time migration script.
 * Reads all existing posts, then patches each one's `relatedPosts` field
 * using the same directional edge list that was previously stored in the
 * `connections` collection.
 *
 * Run with:
 *   npx tsx migrate-connections.ts
 *
 * Safe to run multiple times — it overwrites relatedPosts each time,
 * it does not append. Remove the script once migration is confirmed.
 */

// Must be first — loads .env.local before any Payload config is evaluated
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import payload from 'payload'

// ── Directional edges (slug A → slug B) ──────────────────────────────────────
// Each entry means: post A lists post B in its relatedPosts.
// Signal pulses will travel A → B in the constellation view.

const EDGES: [string, string][] = [
  // Blue cluster — Transformers / NLP (ring)
  ['attention-is-all-you-need-revisited',         'bert-vs-gpt-encoder-wars'],
  ['bert-vs-gpt-encoder-wars',                    'positional-encoding-demystified'],
  ['positional-encoding-demystified',             'the-tokenization-problem'],
  ['the-tokenization-problem',                    'flash-attention-and-the-memory-wall'],
  ['flash-attention-and-the-memory-wall',         'mixture-of-experts-a-practical-guide'],
  ['mixture-of-experts-a-practical-guide',        'long-context-the-1m-token-frontier'],
  ['long-context-the-1m-token-frontier',          'multilingual-models-and-the-curse-of-babel'],
  ['multilingual-models-and-the-curse-of-babel',  'attention-is-all-you-need-revisited'],

  // Purple cluster — Alignment / Safety (ring)
  ['the-alignment-problem-is-not-what-you-think', 'rlhf-reward-hacking-in-the-wild'],
  ['rlhf-reward-hacking-in-the-wild',             'constitutional-ai-explained'],
  ['constitutional-ai-explained',                 'interpretability-reading-the-models-mind'],
  ['interpretability-reading-the-models-mind',    'deceptive-alignment-a-thought-experiment'],
  ['deceptive-alignment-a-thought-experiment',    'red-teaming-at-scale'],
  ['red-teaming-at-scale',                        'the-corrigibility-spectrum'],
  ['the-corrigibility-spectrum',                  'evaluating-honesty-in-language-models'],
  ['evaluating-honesty-in-language-models',       'the-alignment-problem-is-not-what-you-think'],

  // Orange cluster — Scaling / Empirics (ring)
  ['scaling-laws-and-their-limits',               'chinchilla-and-the-compute-frontier'],
  ['chinchilla-and-the-compute-frontier',         'emergent-abilities-real-or-mirage'],
  ['emergent-abilities-real-or-mirage',           'the-bitter-lesson-5-years-later'],
  ['the-bitter-lesson-5-years-later',             'data-scaling-vs-model-scaling'],
  ['data-scaling-vs-model-scaling',               'inference-compute-and-test-time-scaling'],
  ['inference-compute-and-test-time-scaling',     'benchmark-contamination-and-evaluation-debt'],
  ['benchmark-contamination-and-evaluation-debt', 'the-plateau-hypothesis'],
  ['the-plateau-hypothesis',                      'scaling-laws-and-their-limits'],
]

// ─────────────────────────────────────────────────────────────────────────────

async function migrate() {
  const { default: config } = await import('./src/payload.config')
  await payload.init({ config })

  // 1. Load all posts and build a slug → id map
  console.log('Loading posts...')
  const result = await payload.find({ collection: 'posts', limit: 1000, depth: 0 })

  if (result.totalDocs === 0) {
    console.error('No posts found. Run seed.ts first.')
    process.exit(1)
  }

  const slugToId: Record<string, string> = {}
  for (const doc of result.docs) {
    slugToId[doc.slug as string] = String(doc.id)
  }
  console.log(`Found ${result.totalDocs} posts.\n`)

  // 2. Build a map of postId → relatedPost IDs from the edge list
  const relatedMap: Record<string, string[]> = {}

  for (const [slugA, slugB] of EDGES) {
    const fromId = slugToId[slugA]
    const toId   = slugToId[slugB]

    if (!fromId) { console.warn(`  ⚠ Unknown slug (from): ${slugA}`); continue }
    if (!toId)   { console.warn(`  ⚠ Unknown slug (to):   ${slugB}`); continue }

    if (!relatedMap[fromId]) relatedMap[fromId] = []
    relatedMap[fromId].push(toId)
  }

  // 3. Patch each post that has outgoing edges
  console.log('Patching relatedPosts...')
  let patched = 0
  let skipped = 0

  for (const [postId, relatedIds] of Object.entries(relatedMap)) {
    const slug = Object.keys(slugToId).find(s => slugToId[s] === postId) ?? postId

    await payload.update({
      collection: 'posts',
      id: postId,
      data: { relatedPosts: relatedIds },
    })

    console.log(`  ✓ ${slug} → [${relatedIds.length} connection${relatedIds.length > 1 ? 's' : ''}]`)
    patched++
  }

  // Posts with no outgoing edges — log for visibility
  for (const doc of result.docs) {
    const id = String(doc.id)
    if (!relatedMap[id]) {
      console.log(`  · ${doc.slug} — no outgoing connections`)
      skipped++
    }
  }

  console.log(`\nDone. ${patched} posts patched, ${skipped} with no outgoing edges.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
