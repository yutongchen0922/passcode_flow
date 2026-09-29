import type { FocusEventHandler } from 'react';
import { DigitCell } from './DigitCell';
import type { CellInputProps, CellTone, Motion, TileMode } from './types';
import styles from './PasscodeField.module.css';

type PasscodeFieldProps = {
  digits: readonly string[];
  /** Faint digits shown in empty cells (the hint), or `null` for none. */
  ghosts: readonly string[] | null;
  /** Cell the focus tile sits on; kept while hidden so it fades out in place. */
  tileIndex: number;
  tile: TileMode;
  motion: Motion;
  /** Changes on a rejected keystroke or early Enter; each change plays a small wiggle. */
  nudge: number;
  tone: CellTone;
  getInputProps: (index: number) => CellInputProps;
  onBlur?: FocusEventHandler<HTMLDivElement>;
};

export function PasscodeField({
  digits,
  ghosts,
  tileIndex,
  tile,
  motion,
  nudge,
  tone,
  getInputProps,
  onBlur,
}: PasscodeFieldProps) {
  return (
    <div
      className={styles.field}
      role="group"
      aria-label="Passcode"
      data-tone={tone}
      onBlur={onBlur}
    >
      {digits.map((digit, index) => (
        <DigitCell
          key={index}
          index={index}
          digit={digit}
          ghost={ghosts?.[index]}
          tone={tone}
          motion={motion}
          inputProps={getInputProps(index)}
        />
      ))}
      <div
        className={styles.tile}
        data-index={tileIndex}
        data-mode={tile}
        data-motion={motion}
        // Alternating between two identical animations restarts the wiggle on every nudge.
        data-nudge={nudge === 0 ? undefined : nudge % 2 ? 'odd' : 'even'}
        aria-hidden="true"
      />
    </div>
  );
}
