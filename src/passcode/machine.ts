import { extractDigits } from './input';
import {
  CODE_LENGTH,
  type Motion,
  type PasscodeView,
  type Phase,
  type StatusKind,
  type TileMode,
} from './types';

/**
 * Passcode state machine. Pure: no timers, no DOM. Side effects (focus, auto-submit,
 * verification, the error hold) live in usePasscode and feed results back as actions.
 *
 *   editing ──submit (4/4)──▶ verifying ──accepted──▶ success
 *      ▲                          │
 *      └──── dismissError ◀──── error (red frame + shake, then clear right to left and
 *                                        return to cell 1, with the passcode as ghost digits)
 */

export type PasscodeState = Readonly<{
  digits: readonly string[];
  /** Cell with keyboard focus: where the next digit goes. */
  focusIndex: number;
  /** Whether the field has focus. The tile only shows while it does. */
  engaged: boolean;
  phase: Phase;
  /** Keeps "Incorrect passcode" up after the cells clear, until the next digit. */
  showError: boolean;
  /** Increments on a rejected keystroke or an early Enter; the UI plays a small nudge. */
  nudge: number;
  /** Wrong codes so far. After the first, a hint with the passcode is shown. */
  failures: number;
  /**
   * The code was just cleared all at once (after an error, or ⌥⌫). The UI clears the
   * digits right to left while the tile closes back onto cell 1. Ends on the next edit.
   */
  rewinding: boolean;
}>;

export type PasscodeAction =
  | { type: 'input'; index: number; text: string }
  | { type: 'erase'; index: number }
  | { type: 'clear' }
  | { type: 'focus'; index: number }
  | { type: 'move'; index: number }
  | { type: 'blur' }
  | { type: 'submit' }
  | { type: 'verified'; accepted: boolean }
  | { type: 'dismissError' };

const EMPTY_DIGITS: readonly string[] = Array.from({ length: CODE_LENGTH }, () => '');
const LAST_INDEX = CODE_LENGTH - 1;

export const initialState: PasscodeState = {
  digits: EMPTY_DIGITS,
  focusIndex: 0,
  engaged: false,
  phase: 'editing',
  showError: false,
  nudge: 0,
  failures: 0,
  rewinding: false,
};

export function isComplete(digits: readonly string[]): boolean {
  return digits.every(Boolean);
}

function firstEmptyIndex(digits: readonly string[]): number {
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

/** The wrong code leaves: cells clear (right to left) and focus returns to cell 1. */
function dismissError(state: PasscodeState): PasscodeState {
  return {
    ...state,
    phase: 'editing',
    digits: EMPTY_DIGITS,
    focusIndex: 0,
    showError: true,
    rewinding: true,
  };
}

export function passcodeReducer(state: PasscodeState, action: PasscodeAction): PasscodeState {
  // Typing or deleting while a wrong code is still on screen cuts the hold short: the code
  // clears at once and the keystroke applies to the fresh field, so fast typers lose nothing.
  if (state.phase === 'error' && ['input', 'erase', 'clear'].includes(action.type)) {
    const cleared = dismissError(state);
    return action.type === 'input' ? passcodeReducer(cleared, action) : cleared;
  }

  switch (action.type) {
    case 'input': {
      if (state.phase !== 'editing') return state;
      const incoming = extractDigits(action.text);
      if (!incoming) return { ...state, nudge: state.nudge + 1, engaged: true };

      // A single keystroke fills one cell; a paste or autofill fills from here onwards.
      const start = clampFocus(state.digits, action.index);
      const written = incoming.slice(0, CODE_LENGTH - start);
      const digits = [...state.digits];
      digits.splice(start, written.length, ...written);

      return {
        ...state,
        digits,
        focusIndex: Math.min(start + written.length, LAST_INDEX),
        engaged: true,
        showError: false,
        rewinding: false,
      };
    }

    case 'erase': {
      if (state.phase !== 'editing') return state;
      const { index } = action;
      if (state.digits[index]) {
        const digits = state.digits.with(index, '');
        return { ...state, digits, focusIndex: index, engaged: true, rewinding: false };
      }
      // Already empty: step back without clearing, so held Backspace alternates clear / move.
      return { ...state, focusIndex: Math.max(index - 1, 0), engaged: true, rewinding: false };
    }

    case 'clear':
      if (state.phase !== 'editing') return state;
      return { ...state, digits: EMPTY_DIGITS, focusIndex: 0, engaged: true, rewinding: true };

    case 'focus':
      return {
        ...state,
        engaged: true,
        focusIndex:
          state.phase === 'editing' ? clampFocus(state.digits, action.index) : state.focusIndex,
      };

    case 'move':
      if (state.phase !== 'editing') return state;
      return {
        ...state,
        engaged: true,
        focusIndex: clampFocus(state.digits, action.index),
        rewinding: false,
      };

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
      return { ...state, phase: 'verifying', showError: false };

    case 'verified':
      if (state.phase !== 'verifying') return state;
      return action.accepted
        ? { ...state, phase: 'success' }
        : { ...state, phase: 'error', failures: state.failures + 1 };

    case 'dismissError':
      return state.phase === 'error' ? dismissError(state) : state;
  }
}

type ViewContext = {
  /** The latest key was held or typed in quick succession (known to the hook, not here). */
  instant?: boolean;
  /** What to offer as a hint once a code has been rejected. */
  hint?: string;
};

/** What the screen renders for a given state. */
export function selectView(
  state: PasscodeState,
  { instant = false, hint }: ViewContext = {},
): PasscodeView {
  const editing = state.phase === 'editing';
  const status: StatusKind | null = editing ? (state.showError ? 'error' : null) : state.phase;
  const tile: TileMode = !editing ? 'wrap' : state.engaged ? 'active' : 'hidden';
  const motion: Motion = state.rewinding ? 'rewind' : instant ? 'instant' : 'default';

  return {
    phase: state.phase,
    status,
    digits: state.digits,
    tileIndex: state.focusIndex,
    tile,
    motion,
    nudge: state.nudge,
    hint: state.failures > 0 ? (hint ?? null) : null,
  };
}
