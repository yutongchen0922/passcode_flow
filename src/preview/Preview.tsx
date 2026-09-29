import { PasscodeScreen } from '../passcode/PasscodeScreen';
import type { Phase, StatusKind } from '../passcode/types';

type PreviewState = {
  phase: Phase;
  status: StatusKind | null;
  digits: readonly string[];
  /** Cell the tile is shown on, or `null` for no tile. */
  activeIndex: number | null;
  hintVisible?: boolean;
};

/**
 * Static screens for review, opened with `?preview=<name>`. The first four are the Figma
 * frames checked by `npm run pixel-diff`; the rest are states Figma doesn't show.
 */
export const PREVIEW_STATES = {
  empty: { phase: 'editing', status: null, digits: ['', '', '', ''], activeIndex: null },
  filling: { phase: 'editing', status: null, digits: ['1', '2', '2', ''], activeIndex: 2 },
  verifying: { phase: 'verifying', status: 'verifying', digits: ['1', '2', '3', '4'], activeIndex: null },
  authenticated: { phase: 'success', status: 'success', digits: ['1', '2', '3', '4'], activeIndex: null },
  'tile-first': { phase: 'editing', status: null, digits: ['', '', '', ''], activeIndex: 0 },
  'tile-last': { phase: 'editing', status: null, digits: ['1', '2', '3', '4'], activeIndex: 3 },
  // Wrong code: red and shaking, then cleared and back on cell 1 with the hint below.
  error: { phase: 'error', status: 'error', digits: ['5', '5', '5', '5'], activeIndex: null, hintVisible: true },
  'error-cleared': {
    phase: 'editing',
    status: 'error',
    digits: ['', '', '', ''],
    activeIndex: 0,
    hintVisible: true,
  },
} satisfies Record<string, PreviewState>;

export type PreviewName = keyof typeof PREVIEW_STATES;

export function isPreviewName(name: string): name is PreviewName {
  return name in PREVIEW_STATES;
}

export function Preview({ name }: { name: PreviewName }) {
  const { activeIndex, ...state }: PreviewState = PREVIEW_STATES[name];
  return <PasscodeScreen {...state} tileIndex={activeIndex ?? 0} tileVisible={activeIndex !== null} />;
}
