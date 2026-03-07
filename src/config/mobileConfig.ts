/**
 * mobileConfig.ts
 * Single source of truth for all mobile touch & camera constants.
 * Adjust here — changes propagate to MobileControls and useMobileCamera.
 */

// ── 1-finger pan ─────────────────────────────────────────────────────────────
/** Multiplier converting raw touch px/frame into velocity units. */
export const SWIPE_FORCE = 0.08
/** Velocity decay per frame during active swipe (0 = instant stop, 1 = no decay). */
export const SWIPE_FRICTION = 0.88
/** Velocity magnitude below which inertia decay stops completely. */
export const SWIPE_VELOCITY_CUTOFF = 0.001
/** World-units-per-second scale applied to velocity in the camera tick. */
export const SWIPE_SPEED = 60

// ── Pinch zoom ───────────────────────────────────────────────────────────────
/** Scale factor converting pinch distDelta (px) to world-unit camera movement. */
export const PINCH_SENSITIVITY = 0.3
/** Minimum distance from the star cluster center the camera can zoom to. */
export const PINCH_MIN_DIST = 2
/** Maximum distance from the star cluster center the camera can zoom out to. */
export const PINCH_MAX_DIST = 300

// ── Two-finger orbit (look) ───────────────────────────────────────────────────
/** Scale factor converting orbit translation delta (px) to radians/frame. */
export const ORBIT_SENSITIVITY = 0.006
/** Slerp factor for smoothing camera orientation during orbit. */
export const ORBIT_SLERP = 0.15
/** Speeds up orbit angular delta each tick (matches SWIPE_SPEED scale). */
export const ORBIT_SPEED = 60

// ── Two-finger roll ───────────────────────────────────────────────────────────
/**
 * Scale factor applied to the raw angleDelta (radians) when comparing roll
 * signal strength against pinch and orbit signals (which are in px).
 * Higher = roll is easier to trigger relative to other gestures.
 */
export const ROLL_SIGNAL_SCALE = 100

// ── Gesture classifier ────────────────────────────────────────────────────────
/**
 * Minimum signal strength (px-equivalent) a gesture must exceed before it
 * is committed. Lower = more responsive to slow gestures; higher = less
 * accidental triggering.
 */
export const GESTURE_THRESHOLD = 3

// ── Tap detection ─────────────────────────────────────────────────────────────
/** Max finger travel in CSS pixels for a touch to count as a tap (not a swipe). */
export const TAP_MAX_MOVE = 8
/** Max duration in ms for a touch to count as a tap. */
export const TAP_MAX_MS   = 220

// ── Camera limits ─────────────────────────────────────────────────────────────
/** Maximum pitch up or down in radians (applied to both desktop and mobile). */
export const PITCH_LIMIT = Math.PI / 2.5
