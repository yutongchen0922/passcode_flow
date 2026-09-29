#!/usr/bin/env node
/**
 * Pixel-diffs each preview state against its Figma export.
 *
 *   npm run dev            # in another terminal
 *   npm run pixel-diff     # or: npm run pixel-diff -- filling verifying
 *
 * Screenshots come from headless Chrome at the Figma frame size (1512×982, 1×).
 * Output: design/actual/<state>.png and design/diff/<state>.png (mismatches in red).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [WIDTH, HEIGHT] = [1512, 982];

/**
 * Differences we accept, with the reason. The run fails only if a state goes over its budget,
 * so the script works as a regression check.
 */
const KNOWN = {
  empty: { budget: 0, reason: '' },
  filling: {
    budget: 150,
    reason: 'Figma hand-placed two digits 1px off the others ("1" low, third "2" high)',
  },
  verifying: {
    budget: 800,
    reason: 'Figma frame has the field 1px higher; we keep it fixed so it never jumps on submit',
  },
  authenticated: {
    budget: 150,
    reason: 'text anti-aliasing only (Figma vs Chrome rasteriser); shapes and positions match',
  },
};
const STATES = Object.keys(KNOWN);

const requested = process.argv.slice(2);
const states = requested.length ? requested : STATES;
const unknown = states.filter((state) => !(state in KNOWN));
if (unknown.length) {
  console.error(`Unknown state(s): ${unknown.join(', ')}. Expected one of: ${STATES.join(', ')}`);
  process.exit(1);
}

for (const dir of ['design/actual', 'design/diff']) mkdirSync(join(ROOT, dir), { recursive: true });

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH.`);
  process.exit(1);
}

let failed = false;

for (const state of states) {
  const expectedPath = join(ROOT, 'design/figma', `${state}.png`);
  const actualPath = join(ROOT, 'design/actual', `${state}.png`);
  const diffPath = join(ROOT, 'design/diff', `${state}.png`);

  execFileSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${WIDTH},${HEIGHT}`,
      // Lets the web font load and the spinner settle before the capture.
      '--virtual-time-budget=3000',
      `--screenshot=${actualPath}`,
      `${BASE_URL}/?preview=${state}&still`,
    ],
    { stdio: 'ignore' },
  );

  const expected = PNG.sync.read(readFileSync(expectedPath));
  const actual = PNG.sync.read(readFileSync(actualPath));
  if (expected.width !== actual.width || expected.height !== actual.height) {
    console.log(
      `${state.padEnd(14)} size mismatch: figma ${expected.width}×${expected.height}, ` +
        `actual ${actual.width}×${actual.height}`,
    );
    failed = true;
    continue;
  }

  const diff = new PNG({ width: WIDTH, height: HEIGHT });
  const mismatched = pixelmatch(expected.data, actual.data, diff.data, WIDTH, HEIGHT, {
    threshold: 0.1,
    includeAA: false,
  });
  writeFileSync(diffPath, PNG.sync.write(diff));

  const { budget, reason } = KNOWN[state];
  const overBudget = mismatched > budget;
  const verdict =
    mismatched === 0
      ? 'exact match'
      : `${mismatched} px differ${overBudget ? ` — OVER budget of ${budget}` : ` (expected: ${reason})`}`;
  console.log(`${overBudget ? '✗' : '✓'} ${state.padEnd(14)} ${verdict}`);
  if (overBudget) failed = true;
}

process.exitCode = failed ? 1 : 0;
