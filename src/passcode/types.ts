import type { InputHTMLAttributes, Ref } from 'react';

export const CODE_LENGTH = 4;

export type Phase = 'editing' | 'verifying' | 'error' | 'success';

/** Visual treatment of the four cells. */
export type CellTone = 'default' | 'disabled' | 'error';

/** Message shown in the status row. */
export type StatusKind = 'verifying' | 'success' | 'error';

/**
 * The focus tile: hidden until the field is used, active on the focus cell while editing,
 * and wrapped around the whole code (then fading) once it's submitted.
 */
export type TileMode = 'hidden' | 'active' | 'wrap';

/**
 * How the next change animates. `instant` for held keys and fast typing, where motion would
 * lag behind the fingers; `rewind` when the whole code clears at once.
 */
export type Motion = 'default' | 'instant' | 'rewind';

/** Everything the screen renders, derived from the state machine (see selectView). */
export type PasscodeView = {
  phase: Phase;
  status: StatusKind | null;
  digits: readonly string[];
  /** Cell the tile sits on. Kept while hidden, so the tile fades out in place. */
  tileIndex: number;
  tile: TileMode;
  motion: Motion;
  /** Changes on a rejected keystroke or early Enter; each change plays a small wiggle. */
  nudge: number;
  /** After the first wrong code, empty cells show the passcode as faint ghost digits. */
  hintVisible: boolean;
};

/** Behaviour a cell's input receives from usePasscode. */
export type CellInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'tabIndex' | 'readOnly' | 'onKeyDown' | 'onChange' | 'onPaste' | 'onFocus'
> & { ref?: Ref<HTMLInputElement> };
