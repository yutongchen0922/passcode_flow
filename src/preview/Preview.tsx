import { PasscodeScreen } from '../passcode/PasscodeScreen';
import type { PasscodeView } from '../passcode/types';

const EMPTY = ['', '', '', ''];
const FULL = ['1', '2', '3', '4'];

const BASE: PasscodeView = {
  phase: 'editing',
  status: null,
  digits: EMPTY,
  tileIndex: 0,
  tileVisible: false,
  nudge: 0,
  rewinding: false,
  hintVisible: false,
};

/**
 * Static screens for review, opened with `?preview=<name>`. The first four are the Figma
 * frames checked by `npm run pixel-diff`; the rest are states Figma doesn't show.
 */
export const PREVIEW_STATES = {
  empty: {},
  filling: { digits: ['1', '2', '2', ''], tileIndex: 2, tileVisible: true },
  verifying: { phase: 'verifying', status: 'verifying', digits: FULL },
  authenticated: { phase: 'success', status: 'success', digits: FULL },
  'tile-first': { tileVisible: true },
  'tile-last': { digits: FULL, tileIndex: 3, tileVisible: true },
  error: { phase: 'error', status: 'error', digits: ['5', '5', '5', '5'], hintVisible: true },
  'error-cleared': { status: 'error', tileVisible: true, hintVisible: true },
} satisfies Record<string, Partial<PasscodeView>>;

export type PreviewName = keyof typeof PREVIEW_STATES;

export function isPreviewName(name: string): name is PreviewName {
  return name in PREVIEW_STATES;
}

export function Preview({ name }: { name: PreviewName }) {
  return <PasscodeScreen view={{ ...BASE, ...PREVIEW_STATES[name] }} />;
}
