// ─── Legacy seed palette (used by migration script) ──────────────────────────
// These are the colours used when seeding the Categories collection from
// existing post tags. Don't remove — referenced by migrate-tags-categories.ts.
export const SEED_CATEGORY_COLORS: Record<string, string> = {
  Transformers: '#4a90d9',
  NLP:          '#4a90d9',
  Alignment:    '#a855f7',
  Safety:       '#a855f7',
  Scaling:      '#f97316',
  Empirics:     '#f97316',
  RL:           '#22c55e',
  Neuroscience: '#ec4899',
  default:      '#00d4ff',
}

// ─── Runtime colour helpers ───────────────────────────────────────────────────

/**
 * Returns a colour for a category.
 * Accepts an explicit colour string (from the Category doc) or falls back to
 * a deterministic hsl derived from the name via djb2 hash.
 */
export function getCategoryColor(color?: string | null, name?: string | null): string {
  if (color) return color
  if (!name) return '#00d4ff'
  let hash = 5381
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i)
    hash = hash >>> 0
  }
  return `hsl(${hash % 360}, 70%, 65%)`
}

export type PostLike = {
  category: { id: string; name: string; color: string } | null
}

export function getPostColor(post: PostLike): string {
  return post.category ? getCategoryColor(post.category.color, post.category.name) : '#00d4ff'
}

// ─── Trajectory sequence options ─────────────────────────────────────────────
// Sequences are now dynamic (driven by category IDs) — these are kept for the
// static options (default, chronological) and as a legacy reference.
export type TrajectorySequenceId = 'default' | 'chronological' | string

export const TRAJECTORY_SEQUENCES: { id: TrajectorySequenceId; label: string; color?: string }[] = [
  { id: 'default',       label: 'Default order' },
  { id: 'chronological', label: 'Chronological (newest first)' },
]

// ─── Planet Placement ─────────────────────────────────────────────────────────
export const PLANET_PLACEMENT_RADIUS  = 18
export const PLANET_MIN_CLEARANCE     = 12
export const PLANET_FALLBACK_SPREAD   = 80

// ─── Constellation lines ──────────────────────────────────────────────────────
export const CONSTELLATION_DOT_LENGTH   = 0.04
export const CONSTELLATION_GAP_LENGTH   = 0.01
export const CONSTELLATION_SCROLL_SPEED = 0.02
export const CONSTELLATION_OPACITY      = 0.4
export const CONSTELLATION_TUBE_RADIUS  = 0.2
export const CONSTELLATION_TUBE_SIDES   = 5

export const CONSTELLATION_PERIOD = CONSTELLATION_DOT_LENGTH + CONSTELLATION_GAP_LENGTH
export const CONSTELLATION_SLOTS   = Math.ceil(1.0 / CONSTELLATION_PERIOD) + 2

export const CONSTELLATION_BIDIR_OPACITY        = 0.25
export const CONSTELLATION_OPACITY_MOBILE       = 0.85
export const CONSTELLATION_BIDIR_OPACITY_MOBILE = 0.65
