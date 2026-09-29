import { extractDigits } from './input';
import { CODE_LENGTH, type Phase, type StatusKind } from './types';

/**
 * Passcode state machine. Pure: no timers, no DOM. Side effects (focus, auto-submit,
 * verification, the rejection hold) live in usePasscode and feed results back as actions.
 *
 *   editing ──submit (4/4)──▶ verifying ──accepted──▶ success
 *      ▲                          │
 *      └──── rejectionShown ◀── rejected (shake, then clear and refocus cell 1)
 */

export type MachinePhase = 'editing' | 'verifying' | 'rejected' | 'success';

export type PasscodeState = Readonly<{
  digits: readonly string[];
  /** Cell with keyboard focus: where the next digit goes. */
  focusIndex: number;
  /** Whether the field has focus. The tile only shows while it does. */
  engaged: boolean;
  phase: MachinePhase;
  /** Keeps "Incorrect passcode" up after the cells clear, until the next digit. */
  showError: boolean;
  /** Increments per submission so a stale verification result is ignored. */
  attempt: number;
  /** Increments on a rejected keystroke or an early Enter; the UI plays a small nudge. */
  nudge: number;
}>;

export type PasscodeAction =
  | { type: 'input'; index: number; text: string }
  | { type: 'erase'; index: number }
  | { type: 'clear' }
  | { type: 'focus'; index: number }
  | { type: 'move'; index: number }
  | { type: 'blur' }
  | { type: 'submit' }
  | { type: 'verified'; attempt: number; accepted: boolean }
  | { type: 'rejectionShown' };

const EMPTY_DIGITS: readonly string[] = Array.from({ length: CODE_LENGTH }, () => '');
const LAST_INDEX = CODE_LENGTH - 1;

export const initialState: PasscodeState = {
  digits: EMPTY_DIGITS,
  focusIndex: 0,
  engaged: false,
  phase: 'editing',
  showError: false,
  attempt: 0,
  nudge: 0,
};

export function isComplete(digits: readonly string[]): boolean {
  return digits.every(Boolean);
}

export function firstEmptyIndex(digits: readonly string[]): number {
  const index = digits.indexOf('');
  return index === -1 ? LAST_INDEX : index;
}

/**
 * Focus can land on any filled cell or on the first empty one, never further along,
 * so the code can't end up with a gap in front of the cursor.
 */
export function clampFocus(digits: readonly string[], index: number): number {
  const bounded = Math.min(Math.max(index, 0), LAST_INDEX);
  return digits[bounded] ? bounded : Math.min(bounded, firstEmptyIndex(digits));
}

export function passcodeReducer(state: PasscodeState, action: PasscodeAction): PasscodeState {
  switch (action.type) {
    case 'input': {
      if (state.phase !== 'editing') return state;
      const incoming = extractDigits(action.text);
      if (!incoming) return { ...state, nudge: state.nudge + 1, engaged: true };

      // A single keystroke fills one cell; a paste or autofill fills from here onwards.
      const start = clampFocus(state.digits, action.index);
      const digits = [...state.digits];
      const written = incoming.slice(0, CODE_LENGTH - start);
      [...written].forEach((digit, offset) => {
        digits[start + offset] = digit;
      });

      return {
        ...state,
        digits,
        focusIndex: Math.min(start + written.length, LAST_INDEX),
        engaged: true,
        showError: false,
      };
    }

    case 'erase': {
      if (state.phase !== 'editing') return state;
      const index = action.index;
      if (state.digits[index]) {
        const digits = [...state.digits];
        digits[index] = '';
        return { ...state, digits, focusIndex: index, engaged: true };
      }
      // Already empty: step back without clearing, so held Backspace alternates clear / move.
      return { ...state, focusIndex: Math.max(index - 1, 0), engaged: true };
    }

    case 'clear':
      if (state.phase !== 'editing') return state;
      return { ...state, digits: EMPTY_DIGITS, focusIndex: 0, engaged: true };

    case 'focus':
      return {
        ...state,
        engaged: true,
        focusIndex: state.phase === 'editing' ? clampFocus(state.digits, action.index) : state.focusIndex,
      };

    case 'move':
      if (state.phase !== 'editing') return state;
      return { ...state, engaged: true, focusIndex: clampFocus(state.digits, action.index) };

    case 'blur':
      return { ...state, engaged: false };

    case 'submit':
      if (state.phase !== 'editing') return state;
      if (!isComplete(state.digits)) {
        return {
          ...state,
          engaged: true,
          focusIndex: firstEmptyIndex(state.digits),
          nudge: state.nudge + 1,
        };
      }
      return { ...state, phase: 'verifying', attempt: state.attempt + 1, showError: false };

    case 'verified':
      if (state.phase !== 'verifying' || action.attempt !== state.attempt) return state;
      return { ...state, phase: action.accepted ? 'success' : 'rejected' };

    case 'rejectionShown':
      if (state.phase !== 'rejected') return state;
      return { ...state, phase: 'editing', digits: EMPTY_DIGITS, focusIndex: 0, showError: true };
  }
}

export type PasscodeView = {
  phase: Phase;
  status: StatusKind | null;
  digits: readonly string[];
  /** Cell the tile sits on, or `null` when hidden. */
  activeIndex: number | null;
  nudge: number;
};

/** What the screen renders for a given state. */
export function selectView(state: PasscodeState): PasscodeView {
  const phase: Phase = state.phase === 'rejected' ? 'error' : state.phase;
  const status: StatusKind | null =
    phase === 'verifying' || phase === 'success' || phase === 'error'
      ? phase
      : state.showError
        ? 'error'
        : null;

  return {
    phase,
    status,
    digits: state.digits,
    activeIndex: state.phase === 'editing' && state.engaged ? state.focusIndex : null,
    nudge: state.nudge,
  };
}
