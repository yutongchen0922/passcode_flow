import type { InputHTMLAttributes, Ref } from 'react';

export const CODE_LENGTH = 4;

export type Phase = 'editing' | 'verifying' | 'error' | 'success';

/** Visual treatment of the four cells. */
export type CellTone = 'default' | 'disabled' | 'error';

/** Message shown in the status row. */
export type StatusKind = 'verifying' | 'success' | 'error';

/** Everything the screen renders, derived from the state machine (see selectView). */
export type PasscodeView = {
  phase: Phase;
  status: StatusKind | null;
  digits: readonly string[];
  /** Cell the tile sits on. Kept while hidden, so the tile fades out in place. */
  tileIndex: number;
  tileVisible: boolean;
  /** Changes on a rejected keystroke or early Enter; each change plays a small wiggle. */
  nudge: number;
  /** The code was just cleared at once: digits clear right to left, the tile sweeps back. */
  rewinding: boolean;
  /** "Hint: the passcode is 1234", after the first wrong code. */
  hintVisible: boolean;
};

/** Behaviour a cell's input receives from usePasscode. */
export type CellInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'tabIndex' | 'readOnly' | 'onKeyDown' | 'onChange' | 'onPaste' | 'onFocus'
> & { ref?: Ref<HTMLInputElement> };
