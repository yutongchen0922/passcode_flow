import { PasscodeScreen } from '../passcode/PasscodeScreen';
import type { Phase } from '../passcode/types';

type PreviewState = {
  phase: Phase;
  digits: readonly string[];
  activeIndex: number | null;
};

/**
 * Each Figma frame as a static screen, for side-by-side review and `npm run pixel-diff`.
 * Open with `?preview=<name>`.
 */
export const PREVIEW_STATES = {
  empty: { phase: 'editing', digits: ['', '', '', ''], activeIndex: null },
  filling: { phase: 'editing', digits: ['1', '2', '2', ''], activeIndex: 2 },
  verifying: { phase: 'verifying', digits: ['1', '2', '3', '4'], activeIndex: null },
  authenticated: { phase: 'success', digits: ['1', '2', '3', '4'], activeIndex: null },
} satisfies Record<string, PreviewState>;

export type PreviewName = keyof typeof PREVIEW_STATES;

export function isPreviewName(name: string): name is PreviewName {
  return name in PREVIEW_STATES;
}

export function Preview({ name }: { name: PreviewName }) {
  const state: PreviewState = PREVIEW_STATES[name];
  return <PasscodeScreen {...state} />;
}
