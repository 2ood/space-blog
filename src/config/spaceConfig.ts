// ─── Tag → Star Color Mapping ───────────────────────────────────────────────
export const TAG_COLORS: Record<string, string> = {
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

// Post color from first tag (for trajectory filtering)
export type PostLike = { tags: string[] }
export function getPostColor(post: PostLike): string {
  return TAG_COLORS[post.tags[0]] ?? TAG_COLORS.default
}

// ─── Trajectory sequence options (for tour dropdown) ─────────────────────────
export type TrajectorySequenceId = 'default' | 'chronological' | 'blue' | 'purple' | 'orange' | 'green' | 'pink' | 'cyan'

export const TRAJECTORY_SEQUENCES: { id: TrajectorySequenceId; label: string; color?: string }[] = [
  { id: 'default', label: 'Default order' },
  { id: 'chronological', label: 'Chronological (newest first)' },
  { id: 'blue', label: 'Blue — Transformers / NLP', color: '#4a90d9' },
  { id: 'purple', label: 'Purple — Alignment / Safety', color: '#a855f7' },
  { id: 'orange', label: 'Orange — Scaling / Empirics', color: '#f97316' },
  { id: 'green', label: 'Green — RL', color: '#22c55e' },
  { id: 'pink', label: 'Pink — Neuroscience', color: '#ec4899' },
  { id: 'cyan', label: 'Cyan — Default', color: '#00d4ff' },
]

// ─── Constellation Connections ───────────────────────────────────────────────
// Connections are now derived from posts.relatedPosts — no separate collection.

// Directional (A→B only) — marching dotted cylinders
export const CONSTELLATION_DOT_LENGTH   = 0.04   // fraction of line each dash occupies
export const CONSTELLATION_GAP_LENGTH   = 0.01   // fraction of line each gap occupies
export const CONSTELLATION_SCROLL_SPEED = 0.02   // offset units per second
export const CONSTELLATION_OPACITY      = 0.4    // base opacity (breathes gently)
export const CONSTELLATION_TUBE_RADIUS  = 0.2    // world-space cylinder radius
export const CONSTELLATION_TUBE_SIDES   = 5      // pentagon cross-section

export const CONSTELLATION_PERIOD = CONSTELLATION_DOT_LENGTH + CONSTELLATION_GAP_LENGTH
export const CONSTELLATION_SLOTS   = Math.ceil(1.0 / CONSTELLATION_PERIOD) + 2

// Bidirectional (A↔B) — solid tube, same radius
export const CONSTELLATION_BIDIR_OPACITY = 0.25  // slightly dimmer than dots so it recedes

