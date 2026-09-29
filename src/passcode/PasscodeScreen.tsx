import type { FocusEventHandler, MouseEventHandler } from 'react';
import { PasscodeField } from './PasscodeField';
import { StatusRow } from './StatusRow';
import type { CellInputProps, CellTone, Phase, StatusKind } from './types';
import styles from './PasscodeScreen.module.css';

const TONE: Record<Phase, CellTone> = {
  editing: 'default',
  verifying: 'disabled',
  error: 'error',
  success: 'disabled',
};

const readOnlyInput = (): CellInputProps => ({ readOnly: true, tabIndex: -1 });

type PasscodeScreenProps = {
  phase: Phase;
  status: StatusKind | null;
  digits: readonly string[];
  activeIndex: number | null;
  /** Omitted for static previews, which render read-only cells. */
  getInputProps?: (index: number) => CellInputProps;
  onFieldBlur?: FocusEventHandler<HTMLDivElement>;
  /** A press anywhere on the screen, used to activate the field. */
  onScreenPress?: MouseEventHandler<HTMLElement>;
};

/**
 * Centres the passcode field in the viewport and places the status row 16px above it.
 * On success the field fades away and the row moves down to the centre.
 */
export function PasscodeScreen({
  phase,
  status,
  digits,
  activeIndex,
  getInputProps = readOnlyInput,
  onFieldBlur,
  onScreenPress,
}: PasscodeScreenProps) {
  return (
    <main className={styles.screen} data-phase={phase} onMouseDown={onScreenPress}>
      <div className={styles.stage}>
        <div className={styles.status} role="status" aria-live="polite">
          {status && <StatusRow status={status} />}
        </div>
        <div className={styles.field}>
          <PasscodeField
            digits={digits}
            activeIndex={activeIndex}
            tone={TONE[phase]}
            getInputProps={getInputProps}
            onBlur={onFieldBlur}
          />
        </div>
      </div>
    </main>
  );
}
