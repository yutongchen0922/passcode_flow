export const CODE_LENGTH = 4;

/** What the screen is showing. Drives layout, cell tone and the status row. */
export type Phase = 'editing' | 'verifying' | 'error' | 'success';

/** Visual treatment of the four cells. */
export type CellTone = 'default' | 'disabled' | 'error';

/** Message shown in the status row, or `null` when the row is hidden. */
export type StatusKind = 'verifying' | 'success' | 'error';
