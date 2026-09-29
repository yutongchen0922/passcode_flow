import type { InputHTMLAttributes, Ref } from 'react';

export const CODE_LENGTH = 4;

/** What the screen is showing. Drives layout, cell tone and whether cells are editable. */
export type Phase = 'editing' | 'verifying' | 'error' | 'success';

/** Visual treatment of the four cells. */
export type CellTone = 'default' | 'disabled' | 'error';

/** Message shown in the status row. */
export type StatusKind = 'verifying' | 'success' | 'error';

/** Behaviour a cell's input receives from usePasscode. */
export type CellInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'tabIndex' | 'readOnly' | 'onKeyDown' | 'onChange' | 'onPaste' | 'onFocus'
> & { ref?: Ref<HTMLInputElement> };
