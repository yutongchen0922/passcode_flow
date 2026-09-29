import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from 'react';
import { AUTO_SUBMIT_DELAY_MS, ERROR_HOLD_MS, RAPID_KEY_MS } from './config';
import { keyToAction } from './input';
import { initialState, isComplete, passcodeReducer, selectView } from './machine';
import { CODE_LENGTH, type CellInputProps } from './types';
import { CORRECT_PASSCODE, verifyPasscode } from './verify';

/**
 * Connects the pure state machine to the DOM and to time:
 * keyboard, paste and autofill → actions; state → DOM focus; timers and verification → actions.
 */
export function usePasscode() {
  const [state, dispatch] = useReducer(passcodeReducer, initialState);
  const { phase, digits, focusIndex, engaged } = state;
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  // One stable ref callback per cell, so React doesn't detach and re-attach them every render.
  const inputRefs = useMemo(
    () =>
      Array.from({ length: CODE_LENGTH }, (_, index) => (element: HTMLInputElement | null) => {
        inputs.current[index] = element;
      }),
    [],
  );
  const [instant, setInstant] = useState(false);
  const lastKeyAt = useRef(-Infinity);

  function handleKey(event: KeyboardEvent, index: number) {
    const action = keyToAction(event, index);
    if (!action) return;
    event.preventDefault();
    // Held keys and fast typing change the field without animating (see RAPID_KEY_MS).
    // Submitting always animates.
    const rapid = event.repeat || event.timeStamp - lastKeyAt.current < RAPID_KEY_MS;
    lastKeyAt.current = event.timeStamp;
    setInstant(rapid && action.type !== 'submit');
    dispatch(action);
  }

  // Animations come back as soon as the keys are released, or if the window loses focus
  // mid-press (it would never see the key-up).
  useEffect(() => {
    const endBurst = () => setInstant(false);
    window.addEventListener('keyup', endBurst);
    window.addEventListener('blur', endBurst);
    return () => {
      window.removeEventListener('keyup', endBurst);
      window.removeEventListener('blur', endBurst);
    };
  }, []);

  // Keep DOM focus on the state's focus cell. Key events flush synchronously, so this runs
  // before the next key-repeat event arrives and held Backspace never hits a stale cell.
  useLayoutEffect(() => {
    if (!engaged || phase === 'success') return;
    const input = inputs.current[focusIndex];
    if (input && document.activeElement !== input) input.focus({ preventScroll: true });
  }, [engaged, focusIndex, phase]);

  // Auto-submit shortly after the code is complete. Any edit in the meantime cancels it.
  const complete = phase === 'editing' && isComplete(digits);
  useEffect(() => {
    if (!complete) return;
    const timer = setTimeout(() => dispatch({ type: 'submit' }), AUTO_SUBMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [complete, digits]);

  useEffect(() => {
    if (phase !== 'verifying') return;
    const controller = new AbortController();
    verifyPasscode(digits.join(''), controller.signal).then(
      (accepted) => dispatch({ type: 'verified', accepted }),
      () => {}, // aborted on unmount
    );
    return () => controller.abort();
  }, [phase, digits]);

  // Leave the wrong code up long enough to read and shake, then clear it.
  useEffect(() => {
    if (phase !== 'error') return;
    const timer = setTimeout(() => dispatch({ type: 'dismissError' }), ERROR_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Typing works before anything is focused: the page loads looking like the Figma empty
  // state (no tile), and the first keystroke goes to the focus cell.
  useEffect(() => {
    if (phase !== 'editing' && phase !== 'error') return;
    function onWindowKeyDown(event: KeyboardEvent) {
      const nothingFocused = !document.activeElement || document.activeElement === document.body;
      if (nothingFocused && event.key !== 'Tab') handleKey(event, focusIndex);
    }
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [phase, focusIndex]);

  function getInputProps(index: number): CellInputProps {
    return {
      ref: inputRefs[index],
      // One tab stop for the whole field (roving tabindex); arrows move between cells.
      tabIndex: index === focusIndex ? 0 : -1,
      // Locked while verifying and after success. A wrong code can be typed over.
      readOnly: phase === 'verifying' || phase === 'success',
      onKeyDown: (event) => handleKey(event.nativeEvent, index),
      // Desktop typing is handled on keydown. This catches what arrives as a value change
      // instead: mobile keyboards, SMS one-time-code autofill and IME input.
      onChange: (event) => {
        const value = event.currentTarget.value;
        const previous = digits[index] ?? '';
        const typed = previous && value.startsWith(previous) ? value.slice(previous.length) : value;
        dispatch(typed ? { type: 'input', index, text: typed } : { type: 'erase', index });
      },
      onPaste: (event) => {
        event.preventDefault();
        dispatch({ type: 'input', index, text: event.clipboardData.getData('text') });
      },
      onFocus: (event) => {
        event.currentTarget.select();
        dispatch({ type: 'focus', index });
      },
    };
  }

  function onFieldBlur(event: FocusEvent<HTMLDivElement>) {
    // Focus moving between cells isn't a blur of the field.
    if (!event.currentTarget.contains(event.relatedTarget)) dispatch({ type: 'blur' });
  }

  // A press anywhere on the page activates the field: the tile appears on the current cell
  // and typing goes there. preventDefault keeps focus in the field instead of on the page.
  function onScreenPress(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    dispatch({ type: 'focus', index: focusIndex });
  }

  // The hint is a reviewer convenience: the mock knows the answer, so it can offer it.
  const view = selectView(state, { instant, hint: CORRECT_PASSCODE });

  return { view, getInputProps, onFieldBlur, onScreenPress };
}
