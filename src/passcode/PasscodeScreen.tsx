import { PasscodeField } from './PasscodeField';
import { StatusRow } from './StatusRow';
import type { CellTone, Phase, StatusKind } from './types';
import styles from './PasscodeScreen.module.css';

const TONE: Record<Phase, CellTone> = {
  editing: 'default',
  verifying: 'disabled',
  error: 'error',
  success: 'disabled',
};

const STATUS: Record<Phase, StatusKind | null> = {
  editing: null,
  verifying: 'verifying',
  error: 'error',
  success: 'success',
};

type PasscodeScreenProps = {
  phase: Phase;
  digits: readonly string[];
  activeIndex: number | null;
};

/**
 * Centres the passcode field in the viewport and places the status row 16px above it.
 * On success the field fades away and the row moves down to the centre.
 */
export function PasscodeScreen({ phase, digits, activeIndex }: PasscodeScreenProps) {
  const status = STATUS[phase];

  return (
    <main className={styles.screen} data-phase={phase}>
      <div className={styles.stage}>
        <div className={styles.status} role="status" aria-live="polite">
          {status && <StatusRow status={status} />}
        </div>
        <div className={styles.field}>
          <PasscodeField
            digits={digits}
            activeIndex={activeIndex}
            tone={TONE[phase]}
            readOnly={phase !== 'editing'}
          />
        </div>
      </div>
    </main>
  );
}
