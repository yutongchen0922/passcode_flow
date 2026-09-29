import tokens from '../../styles/tokens.css?raw';
import { ERROR_HOLD_MS, STATUS_FADE_OUT_MS } from '../config';

/**
 * A few timings exist on both sides: JS decides when a step happens, CSS animates it. These
 * checks fail if one side changes without the other, instead of the choreography quietly
 * breaking on screen.
 */

/** A motion token's base duration in ms, as written in tokens.css (before ?slowmo scaling). */
function tokenMs(name: string): number {
  const pattern = new RegExp(`--${name}:\\s*calc\\(([\\d.]+)(ms|s) \\* var\\(--motion-scale\\)\\)`);
  const match = tokens.match(pattern);
  if (!match) throw new Error(`--${name} not found in tokens.css`);
  const [, value, unit] = match;
  return Number(value) * (unit === 's' ? 1000 : 1);
}

describe('timings shared by config.ts and tokens.css', () => {
  it('swaps the status message exactly when the outgoing one has faded (and exhaled)', () => {
    expect(STATUS_FADE_OUT_MS).toBe(tokenMs('dur-fade'));
  });

  it('keeps a wrong code on screen until its shake has finished', () => {
    expect(ERROR_HOLD_MS).toBeGreaterThanOrEqual(tokenMs('dur-shake'));
  });
});
