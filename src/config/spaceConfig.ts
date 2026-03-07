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
// Stars sharing the same color (tag group) are connected.
// Each pair [idA, idB] draws a glowing line between those two stars.
export const CONNECTIONS: [string, string][] = [
  // Blue cluster — Transformers / NLP
  ['b1', 'b2'],
  ['b2', 'b3'],
  ['b3', 'b4'],
  ['b4', 'b5'],
  ['b5', 'b6'],
  ['b6', 'b7'],
  ['b7', 'b8'],
  ['b8', 'b9'],
  ['b9', 'b10'],
  ['b10', 'b11'],
  ['b11', 'b12'],
  ['b12', 'b13'],
  ['b13', 'b14'],
  ['b14', 'b15'],
  ['b15', 'b16'],
  ['b16', 'b17'],
  ['b17', 'b18'],
  ['b18', 'b19'],
  ['b19', 'b20'],
  ['b20', 'b21'],
  ['b21', 'b22'],
  ['b22', 'b23'],
  ['b23', 'b24'],
  ['b4', 'b1'], // close the loop

  // Purple cluster — Alignment / Safety
  ['p1', 'p2'],
  ['p2', 'p3'],
  ['p3', 'p4'],
  ['p4', 'p5'],
  ['p5', 'p6'],
  ['p6', 'p7'],
  ['p7', 'p8'],
  ['p8', 'p1'], // close the loop

  // Orange cluster — Scaling / Empirics
  ['o1', 'o2'],
  ['o2', 'o3'],
  ['o3', 'o4'],
  ['o4', 'o5'],
  ['o5', 'o6'],
  ['o6', 'o7'],
  ['o7', 'o8'],
  ['o8', 'o1'], // close the loop
]
