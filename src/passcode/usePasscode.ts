import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { AUTO_SUBMIT_DELAY_MS, REJECTION_HOLD_MS } from './config';
import { keyToAction } from './input';
import { initialState, isComplete, passcodeReducer, selectView, type PasscodeAction } from './machine';
import type { CellInputProps } from './types';
import { verifyPasscode } from './verify';

/**
 * Connects the pure state machine to the DOM and to time:
 * keyboard, paste and autofill → actions; state → DOM focus; timers and verification → actions.
 */
export function usePasscode() {
  const [state, dispatch] = useReducer(passcodeReducer, initialState);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  // Latest state for event handlers that aren't recreated on every render.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  // Keep DOM focus on the state's focus cell. Key events flush synchronously, so this runs
  // before the next key-repeat event arrives and held Backspace never hits a stale cell.
  useLayoutEffect(() => {
    if (!state.engaged || state.phase === 'success') return;
    const input = inputs.current[state.focusIndex];
    if (input && document.activeElement !== input) input.focus({ preventScroll: true });
  }, [state.engaged, state.focusIndex, state.phase]);

  // Auto-submit shortly after the code is complete. Any edit in the meantime cancels it.
  const complete = state.phase === 'editing' && isComplete(state.digits);
  useEffect(() => {
    if (!complete) return;
    const timer = setTimeout(() => dispatch({ type: 'submit' }), AUTO_SUBMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [complete, state.digits]);

  // Verify once per submission; abandoned if the component unmounts.
  const { phase, attempt, digits } = state;
  useEffect(() => {
    if (phase !== 'verifying') return;
    const controller = new AbortController();
    verifyPasscode(digits.join(''), { signal: controller.signal }).then(
      (accepted) => dispatch({ type: 'verified', attempt, accepted }),
      () => {}, // aborted
    );
    return () => controller.abort();
  }, [phase, attempt, digits]);

  // Leave the rejected code up long enough to read and shake, then clear it.
  useEffect(() => {
    if (phase !== 'rejected') return;
    const timer = setTimeout(() => dispatch({ type: 'rejectionShown' }), REJECTION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Typing works before anything is focused: the page loads looking like the Figma empty
  // state (no tile), and the first keystroke goes to the focus cell.
  useEffect(() => {
    function onWindowKeyDown(event: globalThis.KeyboardEvent) {
      const nothingFocused = !document.activeElement || document.activeElement === document.body;
      if (!nothingFocused || stateRef.current.phase !== 'editing' || event.key === 'Tab') return;
      const action = keyToAction(event, stateRef.current.focusIndex);
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    }
    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, []);

  const handleKeyDown = useCallback((index: number, event: KeyboardEvent<HTMLInputElement>) => {
    const action = keyToAction(
      {
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        isComposing: event.nativeEvent.isComposing,
      },
      index,
    );
    if (!action) return;
    event.preventDefault();
    dispatch(action);
  }, []);

  // Desktop typing is handled on keydown. This catches what arrives as a value change
  // instead: mobile keyboards, SMS one-time-code autofill and IME input.
  const handleChange = useCallback((index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    const previous = stateRef.current.digits[index] ?? '';
    const typed = previous && value.startsWith(previous) ? value.slice(previous.length) : value;
    const action: PasscodeAction = typed ? { type: 'input', index, text: typed } : { type: 'erase', index };
    dispatch(action);
  }, []);

  const handlePaste = useCallback((index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    dispatch({ type: 'input', index, text: event.clipboardData.getData('text') });
  }, []);

  const handleFocus = useCallback((index: number, event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
    dispatch({ type: 'focus', index });
  }, []);

  const handleFieldBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    // Focus moving between cells isn't a blur of the field.
    if (event.currentTarget.contains(event.relatedTarget)) return;
    dispatch({ type: 'blur' });
  }, []);

  // A press anywhere on the page activates the field: the tile appears on the current cell
  // and typing goes there. preventDefault keeps focus in the field instead of on the page.
  const handleScreenPress = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    dispatch({ type: 'focus', index: stateRef.current.focusIndex });
  }, []);

  const getInputProps = useCallback(
    (index: number): CellInputProps => ({
      ref: (element: HTMLInputElement | null) => {
        inputs.current[index] = element;
      },
      // One tab stop for the whole field (roving tabindex); arrows move between cells.
      tabIndex: index === state.focusIndex ? 0 : -1,
      readOnly: state.phase !== 'editing',
      onKeyDown: (event) => handleKeyDown(index, event),
      onChange: (event) => handleChange(index, event),
      onPaste: (event) => handlePaste(index, event),
      onFocus: (event) => handleFocus(index, event),
    }),
    [state.focusIndex, state.phase, handleKeyDown, handleChange, handlePaste, handleFocus],
  );

  return {
    view: selectView(state),
    getInputProps,
    onFieldBlur: handleFieldBlur,
    onScreenPress: handleScreenPress,
  };
}
