import { useState } from 'react';
import { CODE_LENGTH, type CellInputProps, type CellTone } from './types';
import styles from './DigitCell.module.css';

type DigitCellProps = {
  index: number;
  digit: string;
  tone: CellTone;
  /** Part of a clear-all: the digit fades after the ones to its right. */
  rewinding: boolean;
  inputProps: CellInputProps;
};

/**
 * One cell of the passcode bar. The visible digit is a separate glyph so it can animate;
 * the input on top is transparent and only handles focus and typing.
 */
export function DigitCell({ index, digit, tone, rewinding, inputProps }: DigitCellProps) {
  const glyph = useGlyph(digit);

  return (
    <div
      className={styles.cell}
      data-index={index}
      data-tone={tone}
      data-rewind={rewinding || undefined}
    >
      <span
        // A new key per digit remounts the glyph, which replays the pop-in animation.
        key={glyph.key}
        className={styles.glyph}
        data-filled={glyph.filled}
        data-pop={glyph.key > 0 || undefined}
        aria-hidden="true"
      >
        {glyph.text}
      </span>
      <input
        {...inputProps}
        className={styles.input}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
        aria-invalid={tone === 'error' || undefined}
        value={digit}
      />
    </div>
  );
}

/**
 * What the glyph shows. A cleared digit stays in the DOM (unfilled) so it can fade out, and
 * each newly typed digit gets a fresh key so it pops in. Digits present on first render
 * (key 0) appear without animation.
 */
function useGlyph(digit: string) {
  const [glyph, setGlyph] = useState({ text: digit, filled: digit !== '', key: 0 });

  if (digit && (!glyph.filled || digit !== glyph.text)) {
    setGlyph({ text: digit, filled: true, key: glyph.key + 1 });
  } else if (!digit && glyph.filled) {
    setGlyph({ ...glyph, filled: false });
  }

  return glyph;
}
