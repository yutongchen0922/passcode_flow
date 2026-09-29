import { DigitCell } from './DigitCell';
import type { CellTone } from './types';
import styles from './PasscodeField.module.css';

type PasscodeFieldProps = {
  digits: readonly string[];
  /** Cell the focus tile sits on, or `null` to hide it. */
  activeIndex: number | null;
  tone: CellTone;
  readOnly: boolean;
};

export function PasscodeField({ digits, activeIndex, tone, readOnly }: PasscodeFieldProps) {
  return (
    <div className={styles.field} role="group" aria-label="Passcode">
      {digits.map((digit, index) => (
        <DigitCell key={index} index={index} digit={digit} tone={tone} readOnly={readOnly} />
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
