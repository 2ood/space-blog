// Must be first — loads .env.local before any Payload config is evaluated
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import payload from 'payload'

const DUMMY_POSTS = [
  // ── Blue: Transformers / NLP ──────────────────────────────────────────
  { slug: 'attention-is-all-you-need-revisited',        size: 3, title: 'Attention Is All You Need — Revisited',         date: '2024-11-01', tags: [{tag:'Transformers'}], excerpt: 'Three years on, what did the transformer architecture actually change?',            trajectoryOrder: 1,  position: { x:  50, y:  12, z:  -75 } },
  { slug: 'bert-vs-gpt-encoder-wars',                   size: 4, title: 'BERT vs GPT: Encoder Wars',                     date: '2024-10-20', tags: [{tag:'Transformers'}], excerpt: 'A deep dive into bidirectional versus autoregressive pretraining objectives.',      trajectoryOrder: 2,  position: { x:  70, y:  30, z: -112 } },
  { slug: 'positional-encoding-demystified',            size: 2, title: 'Positional Encoding Demystified',               date: '2024-09-15', tags: [{tag:'NLP'}],          excerpt: 'From sinusoidal to RoPE — how models learn where tokens live.',                     trajectoryOrder: 3,  position: { x:  35, y: -10, z: -138 } },
  { slug: 'the-tokenization-problem',                   size: 3, title: 'The Tokenization Problem',                      date: '2024-08-30', tags: [{tag:'NLP'}],          excerpt: "Why the way we split text is still one of the field's dirtiest secrets.",           trajectoryOrder: 4,  position: { x:  88, y:   5, z: -100 } },
  { slug: 'flash-attention-and-the-memory-wall',        size: 5, title: 'Flash Attention and the Memory Wall',           date: '2024-07-18', tags: [{tag:'Transformers'}], excerpt: 'How IO-aware attention rewrote the rules of efficient training.',                   trajectoryOrder: 5,  position: { x:  55, y: -25, z: -162 } },
  { slug: 'mixture-of-experts-a-practical-guide',       size: 3, title: 'Mixture of Experts: A Practical Guide',         date: '2024-06-05', tags: [{tag:'Transformers'}], excerpt: 'Sparse activation, routing collapse, and why MoE is harder than it looks.',         trajectoryOrder: 6,  position: { x:  25, y:  45, z: -125 } },
  { slug: 'long-context-the-1m-token-frontier',         size: 4, title: 'Long Context: The 1M Token Frontier',           date: '2024-05-22', tags: [{tag:'NLP'}],          excerpt: 'What actually breaks when you extend context windows to a million tokens.',          trajectoryOrder: 7,  position: { x:  75, y: -20, z: -188 } },
  { slug: 'multilingual-models-and-the-curse-of-babel', size: 2, title: 'Multilingual Models and the Curse of Babel',   date: '2024-04-10', tags: [{tag:'NLP'}],          excerpt: 'Cross-lingual transfer learning — progress, pitfalls, and open questions.',           trajectoryOrder: 8,  position: { x:  45, y:  55, z:  -88 } },
  // ── Purple: Alignment / Safety ────────────────────────────────────────
  { slug: 'the-alignment-problem-is-not-what-you-think',size: 4, title: 'The Alignment Problem Is Not What You Think',  date: '2024-10-15', tags: [{tag:'Alignment'}],   excerpt: 'A reframing of what we mean when we talk about aligning AI systems.',             trajectoryOrder: 9,  position: { x: -62, y: -20, z: -125 } },
  { slug: 'rlhf-reward-hacking-in-the-wild',            size: 3, title: 'RLHF: Reward Hacking in the Wild',             date: '2024-09-28', tags: [{tag:'Alignment'}],   excerpt: 'Documented cases where reward models were gamed — and what we learned.',           trajectoryOrder: 10, position: { x: -88, y:  12, z: -100 } },
  { slug: 'constitutional-ai-explained',                size: 5, title: 'Constitutional AI Explained',                   date: '2024-08-14', tags: [{tag:'Safety'}],      excerpt: 'How self-critique loops can substitute for human feedback at scale.',               trajectoryOrder: 11, position: { x: -45, y:  38, z: -162 } },
  { slug: 'interpretability-reading-the-models-mind',   size: 3, title: "Interpretability: Reading the Model's Mind",   date: '2024-07-01', tags: [{tag:'Safety'}],      excerpt: 'Circuits, superposition, and the slow science of understanding neural nets.',       trajectoryOrder: 12, position: { x: -75, y: -38, z: -175 } },
  { slug: 'deceptive-alignment-a-thought-experiment',   size: 4, title: 'Deceptive Alignment: A Thought Experiment',    date: '2024-06-20', tags: [{tag:'Alignment'}],   excerpt: 'What would a model that hides its goals during training actually look like?',       trajectoryOrder: 13, position: { x:-105, y:   0, z: -138 } },
  { slug: 'red-teaming-at-scale',                       size: 2, title: 'Red-Teaming at Scale',                         date: '2024-05-09', tags: [{tag:'Safety'}],      excerpt: 'Lessons from running thousands of adversarial probes against frontier models.',     trajectoryOrder: 14, position: { x: -50, y:  -5, z: -212 } },
  { slug: 'the-corrigibility-spectrum',                 size: 3, title: 'The Corrigibility Spectrum',                   date: '2024-04-25', tags: [{tag:'Alignment'}],   excerpt: 'Between fully corrigible and fully autonomous — where should we aim?',             trajectoryOrder: 15, position: { x: -35, y:  25, z: -112 } },
  { slug: 'evaluating-honesty-in-language-models',      size: 4, title: 'Evaluating Honesty in Language Models',        date: '2024-03-30', tags: [{tag:'Safety'}],      excerpt: 'TruthfulQA and beyond: how do we measure whether a model is actually honest?',     trajectoryOrder: 16, position: { x: -95, y:  45, z: -150 } },
  // ── Orange: Scaling / Empirics ────────────────────────────────────────
  { slug: 'scaling-laws-and-their-limits',              size: 5, title: 'Scaling Laws and Their Limits',                date: '2024-09-28', tags: [{tag:'Scaling'}],     excerpt: 'When do the curves bend? An empirical look at where scaling breaks down.',        trajectoryOrder: 17, position: { x:  25, y:  38, z: -200 } },
  { slug: 'chinchilla-and-the-compute-frontier',        size: 4, title: 'Chinchilla and the Compute Frontier',          date: '2024-08-18', tags: [{tag:'Scaling'}],     excerpt: "What the compute-optimal training paper actually tells us — and what it doesn't.",  trajectoryOrder: 18, position: { x:   5, y:  20, z: -250 } },
  { slug: 'emergent-abilities-real-or-mirage',          size: 3, title: 'Emergent Abilities: Real or Mirage?',          date: '2024-07-30', tags: [{tag:'Empirics'}],    excerpt: 'Revisiting the sharp capability jumps seen in large models under the microscope.',   trajectoryOrder: 19, position: { x:  45, y: -12, z: -238 } },
  { slug: 'the-bitter-lesson-5-years-later',            size: 4, title: 'The Bitter Lesson, 5 Years Later',             date: '2024-06-15', tags: [{tag:'Empirics'}],    excerpt: 'Sutton was right. How does that change what we should be building today?',          trajectoryOrder: 20, position: { x: -12, y:  50, z: -225 } },
  { slug: 'data-scaling-vs-model-scaling',              size: 2, title: 'Data Scaling vs Model Scaling',                date: '2024-05-30', tags: [{tag:'Scaling'}],     excerpt: 'Is quality data the new bottleneck? Evidence from recent training runs.',            trajectoryOrder: 21, position: { x:  20, y: -45, z: -275 } },
  { slug: 'inference-compute-and-test-time-scaling',    size: 3, title: 'Inference Compute and Test-Time Scaling',      date: '2024-04-20', tags: [{tag:'Scaling'}],     excerpt: 'Chain-of-thought, self-consistency, and the new axis of scaling at inference.',     trajectoryOrder: 22, position: { x:  62, y:  30, z: -250 } },
  { slug: 'benchmark-contamination-and-evaluation-debt',size: 4, title: 'Benchmark Contamination and Evaluation Debt', date: '2024-03-15', tags: [{tag:'Empirics'}],    excerpt: 'How much of SOTA is actually memorisation? A look at evaluation methodology.',      trajectoryOrder: 23, position: { x: -20, y:  12, z: -300 } },
  { slug: 'the-plateau-hypothesis',                     size: 3, title: 'The Plateau Hypothesis',                       date: '2024-02-28', tags: [{tag:'Empirics'}],    excerpt: 'Are we approaching a wall, or just the end of the easy gains?',                     trajectoryOrder: 24, position: { x:  38, y: -30, z: -288 } },
]

const CONNECTION_SLUGS: [string, string][] = [
  // Blue — Transformers / NLP
  ['attention-is-all-you-need-revisited',         'bert-vs-gpt-encoder-wars'],
  ['bert-vs-gpt-encoder-wars',                    'positional-encoding-demystified'],
  ['positional-encoding-demystified',             'the-tokenization-problem'],
  ['the-tokenization-problem',                    'flash-attention-and-the-memory-wall'],
  ['flash-attention-and-the-memory-wall',         'mixture-of-experts-a-practical-guide'],
  ['mixture-of-experts-a-practical-guide',        'long-context-the-1m-token-frontier'],
  ['long-context-the-1m-token-frontier',          'multilingual-models-and-the-curse-of-babel'],
  ['multilingual-models-and-the-curse-of-babel',  'attention-is-all-you-need-revisited'],
  // Purple — Alignment / Safety
  ['the-alignment-problem-is-not-what-you-think', 'rlhf-reward-hacking-in-the-wild'],
  ['rlhf-reward-hacking-in-the-wild',             'constitutional-ai-explained'],
  ['constitutional-ai-explained',                 'interpretability-reading-the-models-mind'],
  ['interpretability-reading-the-models-mind',    'deceptive-alignment-a-thought-experiment'],
  ['deceptive-alignment-a-thought-experiment',    'red-teaming-at-scale'],
  ['red-teaming-at-scale',                        'the-corrigibility-spectrum'],
  ['the-corrigibility-spectrum',                  'evaluating-honesty-in-language-models'],
  ['evaluating-honesty-in-language-models',       'the-alignment-problem-is-not-what-you-think'],
  // Orange — Scaling / Empirics
  ['scaling-laws-and-their-limits',               'chinchilla-and-the-compute-frontier'],
  ['chinchilla-and-the-compute-frontier',         'emergent-abilities-real-or-mirage'],
  ['emergent-abilities-real-or-mirage',           'the-bitter-lesson-5-years-later'],
  ['the-bitter-lesson-5-years-later',             'data-scaling-vs-model-scaling'],
  ['data-scaling-vs-model-scaling',               'inference-compute-and-test-time-scaling'],
  ['inference-compute-and-test-time-scaling',     'benchmark-contamination-and-evaluation-debt'],
  ['benchmark-contamination-and-evaluation-debt', 'the-plateau-hypothesis'],
  ['the-plateau-hypothesis',                      'scaling-laws-and-their-limits'],
]

async function seed() {
  const { default: config } = await import('./src/payload.config')
  await payload.init({ config })

  // ── Posts ─────────────────────────────────────────────────────────────
  const existingPosts = await payload.find({ collection: 'posts', limit: 1 })
  if (existingPosts.totalDocs > 0) {
    console.log(`Posts: ${existingPosts.totalDocs} already exist — skipping.`)
  } else {
    console.log(`Seeding ${DUMMY_POSTS.length} posts...`)
    for (const post of DUMMY_POSTS) {
      await payload.create({ collection: 'posts', data: post })
      console.log(`  ✓ ${post.title}`)
    }
  }

  // ── Connections ───────────────────────────────────────────────────────
  const existingConns = await payload.find({ collection: 'connections', limit: 1 })
  if (existingConns.totalDocs > 0) {
    console.log(`Connections: ${existingConns.totalDocs} already exist — skipping.`)
  } else {
    console.log('Seeding connections...')
    const allPosts = await payload.find({ collection: 'posts', limit: 1000, depth: 0 })
    const slugToId: Record<string, string> = {}
    for (const doc of allPosts.docs) {
      slugToId[doc.slug as string] = String(doc.id)
    }
    for (const [slugA, slugB] of CONNECTION_SLUGS) {
      const fromId = slugToId[slugA]
      const toId   = slugToId[slugB]
      if (!fromId || !toId) {
        console.warn(`  ⚠ Missing: ${slugA} → ${slugB}`)
        continue
      }
      await payload.create({ collection: 'connections', data: { from: fromId, to: toId } })
      console.log(`  ✓ ${slugA} → ${slugB}`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})