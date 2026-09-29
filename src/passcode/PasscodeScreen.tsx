import type { FocusEventHandler, MouseEventHandler } from 'react';
import { PasscodeField } from './PasscodeField';
import { StatusRow } from './StatusRow';
import type { CellInputProps, CellTone, PasscodeView, Phase } from './types';
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
  view: PasscodeView;
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
  view,
  getInputProps = readOnlyInput,
  onFieldBlur,
  onScreenPress,
}: PasscodeScreenProps) {
  return (
    <main className={styles.screen} data-phase={view.phase} onMouseDown={onScreenPress}>
      <div className={styles.stage}>
        <div className={styles.status} role="status" aria-live="polite">
          <StatusRow status={view.status} />
        </div>
        {/* Everything that leaves on success: the field and the hint below it. */}
        <div className={styles.entry}>
          <PasscodeField
            digits={view.digits}
            tileIndex={view.tileIndex}
            tileVisible={view.tileVisible}
            nudge={view.nudge}
            rewinding={view.rewinding}
            tone={TONE[view.phase]}
            getInputProps={getInputProps}
            onBlur={onFieldBlur}
          />
          <p className={styles.hint} data-visible={view.hintVisible} aria-live="polite">
            {view.hintVisible && `Hint: the passcode is ${CORRECT_PASSCODE}`}
          </p>
        </div>
      </div>
    </main>
  );
}
