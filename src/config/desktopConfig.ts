/**
 * desktopConfig.ts
 * Single source of truth for all desktop free-roam camera constants.
 * Adjust here — changes propagate to useFreeRoam.
 */

// ── Mouse look ────────────────────────────────────────────────────────────────
/** Radians of rotation per pixel of mouse movement. */
export const LOOK_SPEED = 0.002

// ── Keyboard movement ─────────────────────────────────────────────────────────
/** World-units per second added to velocity per frame while a key is held. */
export const MOVE_SPEED = 8
/** Velocity decay multiplier per frame (0 = instant stop, 1 = no friction). */
export const MOVE_DAMPING = 0.85

// ── Scroll dolly ──────────────────────────────────────────────────────────────
/** Scale factor applied to wheel deltaY before adding to dolly accumulator. */
export const SCROLL_SPEED = 0.2

// ── Fly-to ────────────────────────────────────────────────────────────────────
/** How many world units in front of a star the camera stops when flying to it. */
export const FLY_STOP_DISTANCE = 20
/** Lerp factor applied each frame during fly-to approach. */
export const FLY_LERP = 0.03
/** Slerp factor applied each frame to rotate camera toward the target star. */
export const FLY_SLERP = 0.15
/** Distance threshold in world units at which the fly-to is considered arrived. */
export const FLY_ARRIVE_THRESHOLD = 0.5

// ── World bounds ──────────────────────────────────────────────────────────────
/** Maximum distance from origin the camera is allowed to travel. */
export const MAX_WORLD_DISTANCE = 1000
