/** Interaction timings in ms. Motion durations live in tokens.css. */

/**
 * `?slowmo` plays every transition at 1/5 speed for reviewing the choreography. CSS reads
 * the same flag (main.tsx sets `data-slowmo`, tokens.css scales its durations).
 */
export const MOTION_SCALE = new URLSearchParams(window.location.search).has('slowmo') ? 5 : 1;

/** Beat between the 4th digit landing and auto-submit, so the digit is seen. Enter skips it. */
export const AUTO_SUBMIT_DELAY_MS = 350 * MOTION_SCALE;

/**
 * Keys closer together than this (or auto-repeating) skip the tile glide and digit pop, so
 * fast typing and held Backspace never trail behind the fingers. Roughly the glide length.
 */
export const RAPID_KEY_MS = 120;

/** Simulated verification round trip. Not motion, so `?slowmo` leaves it alone. */
export const VERIFY_DELAY_MS = 2000;

/** How long a wrong code stays on screen (shake + hold) before the cells clear. */
export const ERROR_HOLD_MS = 700 * MOTION_SCALE;

/**
 * The outgoing status message fades out before the next one takes its place, so the row's
 * width change (e.g. 163px → 204px) happens while nothing is visible. Matches --dur-fade.
 */
export const STATUS_FADE_OUT_MS = 150 * MOTION_SCALE;
