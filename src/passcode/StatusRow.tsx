import { useEffect, useState, type ComponentType } from 'react';
import { STATUS_FADE_OUT_MS } from './config';
import { CheckIcon, SpinnerIcon } from './icons';
import type { StatusKind } from './types';
import styles from './StatusRow.module.css';

const LABELS: Record<StatusKind, string> = {
  verifying: 'Verifying...',
  success: 'Authenticated',
  error: 'Incorrect passcode',
};

/** "Incorrect passcode" has no icon: the red field already says it. */
const ICONS: Partial<Record<StatusKind, ComponentType<{ className?: string }>>> = {
  verifying: SpinnerIcon,
  success: CheckIcon,
};

type StatusRowProps = {
  status: StatusKind | null;
};

/**
 * Icon + label, as in the Figma "Verifying..." and "Authenticated" frames; "Incorrect
 * passcode" is the label alone.
 *
 * When the status changes, the current message leaves first (the spinner exhales, the label
 * blurs out) and only then is replaced, so the row's width change (163px → 204px for
 * "Authenticated") happens while nothing is visible and nothing is seen to jump sideways.
 */
export function StatusRow({ status }: StatusRowProps) {
  const [shown, setShown] = useState(status);
  if (shown === null && status !== null) setShown(status); // nothing to fade out first

  const leaving = shown !== status;
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setShown(status), STATUS_FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [leaving, status]);

  if (shown === null) return null;
  const Icon = ICONS[shown];

  return (
    <div className={styles.row} data-status={shown} data-leaving={leaving}>
      {Icon && (
        <span key={`${shown}-icon`} className={styles.icon}>
          <Icon />
        </span>
      )}
      <span key={`${shown}-label`} className={styles.label}>
        {LABELS[shown]}
      </span>
    </div>
  );
}
