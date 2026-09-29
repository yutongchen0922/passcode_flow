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

const HINT_DIGITS = [...CORRECT_PASSCODE];

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
 * On success the field recedes and the row glides down to the centre.
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
        <div className={styles.entry}>
          <PasscodeField
            digits={view.digits}
            ghosts={view.hintVisible ? HINT_DIGITS : null}
            tileIndex={view.tileIndex}
            tile={view.tile}
            motion={view.motion}
            nudge={view.nudge}
            tone={TONE[view.phase]}
            getInputProps={getInputProps}
            onBlur={onFieldBlur}
          />
        </div>
        {/* The hint is shown as ghost digits in the cells; this says it for screen readers. */}
        <p className={styles.visuallyHidden} aria-live="polite">
          {view.hintVisible && `Hint: the passcode is ${CORRECT_PASSCODE}`}
        </p>
      </div>
    </main>
  );
}
