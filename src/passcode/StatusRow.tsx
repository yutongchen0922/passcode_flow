import { useEffect, useState } from 'react';
import { STATUS_FADE_OUT_MS } from './config';
import spinnerIcon from './icons/spinner.svg';
import checkSquareIcon from './icons/check-square.svg';
import type { StatusKind } from './types';
import styles from './StatusRow.module.css';

const LABELS: Record<StatusKind, string> = {
  verifying: 'Verifying...',
  success: 'Authenticated',
  error: 'Incorrect passcode',
};

const ICONS: Partial<Record<StatusKind, string>> = {
  verifying: spinnerIcon,
  success: checkSquareIcon,
};

type StatusRowProps = {
  status: StatusKind | null;
};

/**
 * Icon + label, as in the Figma "Verifying..." and "Authenticated" frames.
 *
 * When the status changes, the current message fades out first and only then is replaced,
 * so the row's width change (163px → 204px for "Authenticated") happens while nothing is
 * visible and neither the icon nor the text is seen to jump sideways.
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
  const icon = ICONS[shown];

  return (
    <div className={styles.row} data-status={shown} data-leaving={leaving}>
      {icon && (
        <span key={`${shown}-icon`} className={styles.icon}>
          <img src={icon} alt="" width={32} height={32} />
        </span>
      )}
      <span key={`${shown}-label`} className={styles.label}>
        {LABELS[shown]}
      </span>
    </div>
  );
}
