import type { FocusEventHandler } from 'react';
import { DigitCell } from './DigitCell';
import type { CellInputProps, CellTone } from './types';
import styles from './PasscodeField.module.css';

type PasscodeFieldProps = {
  digits: readonly string[];
  /** Cell the focus tile sits on, or `null` to hide it. */
  activeIndex: number | null;
  tone: CellTone;
  getInputProps: (index: number) => CellInputProps;
  onBlur?: FocusEventHandler<HTMLDivElement>;
};

export function PasscodeField({ digits, activeIndex, tone, getInputProps, onBlur }: PasscodeFieldProps) {
  return (
    <div className={styles.field} role="group" aria-label="Passcode" onBlur={onBlur}>
      {digits.map((digit, index) => (
        <DigitCell key={index} index={index} digit={digit} tone={tone} inputProps={getInputProps(index)} />
      ))}
      <div
        className={styles.tile}
        data-index={activeIndex ?? 0}
        data-visible={activeIndex !== null}
        aria-hidden="true"
      />
    </div>
  );
}
