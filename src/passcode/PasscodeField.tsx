import type { FocusEventHandler } from 'react';
import { DigitCell } from './DigitCell';
import type { CellInputProps, CellTone } from './types';
import styles from './PasscodeField.module.css';

type PasscodeFieldProps = {
  digits: readonly string[];
  /** Cell the focus tile sits on; kept while hidden so it fades out in place. */
  tileIndex: number;
  tileVisible: boolean;
  /** Changes on a rejected keystroke or early Enter; each change plays a small wiggle. */
  nudge: number;
  tone: CellTone;
  getInputProps: (index: number) => CellInputProps;
  onBlur?: FocusEventHandler<HTMLDivElement>;
};

export function PasscodeField({
  digits,
  tileIndex,
  tileVisible,
  nudge,
  tone,
  getInputProps,
  onBlur,
}: PasscodeFieldProps) {
  return (
    <div className={styles.field} role="group" aria-label="Passcode" onBlur={onBlur}>
      {digits.map((digit, index) => (
        <DigitCell key={index} index={index} digit={digit} tone={tone} inputProps={getInputProps(index)} />
      ))}
      <div
        className={styles.tile}
        data-index={tileIndex}
        data-visible={tileVisible}
        // Alternating between two identical animations restarts the wiggle on every nudge.
        data-nudge={nudge === 0 ? undefined : nudge % 2 ? 'odd' : 'even'}
        aria-hidden="true"
      />
    </div>
  );
}
