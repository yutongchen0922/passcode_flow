import type { FocusEventHandler, MouseEventHandler } from 'react';
import { PasscodeField } from './PasscodeField';
import { StatusRow } from './StatusRow';
import type { CellInputProps, CellTone, Phase, StatusKind } from './types';
import { CORRECT_PASSCODE } from './verify';
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
  tileIndex: number;
  tileVisible: boolean;
  nudge?: number;
  rewinding?: boolean;
  /** Shows the passcode below the field; for reviewers, after a wrong attempt. */
  hintVisible?: boolean;
  /** Omitted for static previews, which render read-only cells. */
  getInputProps?: (index: number) => CellInputProps;
  onFieldBlur?: FocusEventHandler<HTMLDivElement>;
  /** A press anywhere on the screen, used to activate the field. */
  onScreenPress?: MouseEventHandler<HTMLElement>;
};

/**
 * Centres the passcode field in the viewport and places the status row 16px above it.
 * On success the field fades away and the row glides down to the centre.
 */
export function PasscodeScreen({
  phase,
  status,
  digits,
  tileIndex,
  tileVisible,
  nudge = 0,
  rewinding = false,
  hintVisible = false,
  getInputProps = readOnlyInput,
  onFieldBlur,
  onScreenPress,
}: PasscodeScreenProps) {
  return (
    <main className={styles.screen} data-phase={phase} onMouseDown={onScreenPress}>
      <div className={styles.stage}>
        <div className={styles.status} role="status" aria-live="polite">
          <StatusRow status={status} />
        </div>
        {/* Everything that leaves on success: the field and the hint below it. */}
        <div className={styles.entry}>
          <PasscodeField
            digits={digits}
            tileIndex={tileIndex}
            tileVisible={tileVisible}
            nudge={nudge}
            rewinding={rewinding}
            tone={TONE[phase]}
            getInputProps={getInputProps}
            onBlur={onFieldBlur}
          />
          <p className={styles.hint} data-visible={hintVisible} aria-live="polite">
            {hintVisible && `Hint: the passcode is ${CORRECT_PASSCODE}`}
          </p>
        </div>
      </div>
    </main>
  );
}
