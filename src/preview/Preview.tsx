import { PasscodeScreen } from '../passcode/PasscodeScreen';
import type { PasscodeView } from '../passcode/types';

const EMPTY = ['', '', '', ''];
const FULL = ['1', '2', '3', '4'];

const BASE: PasscodeView = {
  phase: 'editing',
  status: null,
  digits: EMPTY,
  tileIndex: 0,
  tile: 'hidden',
  motion: 'default',
  nudge: 0,
  hintVisible: false,
};

/**
 * Static screens for review, opened with `?preview=<name>`. The first four are the Figma
 * frames checked by `npm run pixel-diff`; the rest are states Figma doesn't show.
 */
export const PREVIEW_STATES = {
  empty: {},
  filling: { digits: ['1', '2', '2', ''], tileIndex: 2, tile: 'active' },
  verifying: { phase: 'verifying', status: 'verifying', digits: FULL, tile: 'wrap' },
  authenticated: { phase: 'success', status: 'success', digits: FULL, tile: 'wrap' },
  'tile-first': { tile: 'active' },
  'tile-last': { digits: FULL, tileIndex: 3, tile: 'active' },
  error: {
    phase: 'error',
    status: 'error',
    digits: ['5', '5', '5', '5'],
    tile: 'wrap',
    hintVisible: true,
  },
  'error-cleared': { status: 'error', tile: 'active', hintVisible: true },
  'error-retyping': {
    digits: ['1', '2', '', ''],
    tileIndex: 2,
    tile: 'active',
    hintVisible: true,
  },
} satisfies Record<string, Partial<PasscodeView>>;

export type PreviewName = keyof typeof PREVIEW_STATES;

export function isPreviewName(name: string): name is PreviewName {
  return name in PREVIEW_STATES;
}

export function Preview({ name }: { name: PreviewName }) {
  return <PasscodeScreen view={{ ...BASE, ...PREVIEW_STATES[name] }} />;
}
