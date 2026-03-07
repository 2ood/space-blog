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
// Connections are stored in the Payload CMS 'connections' collection and
// fetched at runtime via /api/connections. Do not hardcode them here —
// they will drift out of sync when planets are added or removed via the UI.
