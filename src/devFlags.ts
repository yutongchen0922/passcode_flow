/**
 * Review switches, read from the URL on the dev server only (`npm run dev`):
 *
 *   ?preview=<state>   a static screen (see preview/Preview.tsx)
 *   ?still             motion off, so screenshots are deterministic (scripts/pixel-diff.mjs)
 *   ?slowmo            every transition at 1/5 speed, for reviewing the choreography
 *
 * Production builds ignore them.
 */
const params = new URLSearchParams(import.meta.env.DEV ? window.location.search : '');

export const devFlags = {
  preview: params.get('preview'),
  still: params.has('still'),
  slowmo: params.has('slowmo'),
};
