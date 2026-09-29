import { useState } from 'react';
import { CODE_LENGTH, type CellInputProps, type CellTone, type Motion } from './types';
import styles from './DigitCell.module.css';

type DigitCellProps = {
  index: number;
  digit: string;
  /** Faint hint digit shown while the cell is empty. */
  ghost?: string;
  tone: CellTone;
  motion: Motion;
  inputProps: CellInputProps;
};

/**
 * One cell of the passcode bar. The visible digit is a separate glyph so it can animate;
 * the input on top is transparent and only handles focus and typing.
 */
export function DigitCell({ index, digit, ghost, tone, motion, inputProps }: DigitCellProps) {
  // Over a ghost the digit appears solid at once: the ghost already showed its shape there,
  // so a fade-in would read as the ghost lingering.
  const glyph = useGlyph(digit, motion !== 'instant' && !ghost);

  return (
    <div className={styles.cell} data-index={index} data-tone={tone} data-motion={motion}>
      {ghost && (
        <span
          className={styles.ghost}
          data-testid="ghost"
          data-visible={!digit}
          aria-hidden="true"
        >
          {ghost}
        </span>
      )}
      <span
        // A new key per digit remounts the glyph, which replays its entrance animation.
        key={glyph.key}
        className={styles.glyph}
        data-filled={glyph.filled}
        data-pop={glyph.pop || undefined}
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
 * each newly typed digit gets a fresh key so it can animate in. Whether it animates is decided
 * when it appears, so digits typed in a burst don't all animate later when the keys are
 * released. Digits present on first render appear without animation.
 *
 * The state is adjusted during render (React's documented pattern for deriving state from a
 * changed prop) rather than in an effect, so the outgoing digit is still in the DOM on the very
 * frame its fade-out starts.
 */
function useGlyph(digit: string, animate: boolean) {
  const [glyph, setGlyph] = useState({ text: digit, filled: digit !== '', key: 0, pop: false });

  if (digit && (!glyph.filled || digit !== glyph.text)) {
    setGlyph({ text: digit, filled: true, key: glyph.key + 1, pop: animate });
  } else if (!digit && glyph.filled) {
    setGlyph({ ...glyph, filled: false });
  }

  return glyph;
}
