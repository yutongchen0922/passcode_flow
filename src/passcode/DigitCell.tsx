import type { CellTone } from './types';
import styles from './DigitCell.module.css';

type DigitCellProps = {
  index: number;
  digit: string;
  tone: CellTone;
  readOnly: boolean;
};

/**
 * One cell of the passcode bar. The visible digit is a separate glyph so it can animate;
 * the input on top is transparent and only handles focus and typing.
 */
export function DigitCell({ index, digit, tone, readOnly }: DigitCellProps) {
  return (
    <div className={styles.cell} data-index={index} data-tone={tone}>
      <span className={styles.glyph} aria-hidden="true">
        {digit}
      </span>
      <input
        className={styles.input}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        aria-label={`Digit ${index + 1} of 4`}
        value={digit}
        readOnly={readOnly}
      />
    </div>
  );
}
