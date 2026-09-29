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
  status: StatusKind;
};

/** Icon + label, as in the Figma "Verifying..." and "Authenticated" frames. */
export function StatusRow({ status }: StatusRowProps) {
  const icon = ICONS[status];

  return (
    <div className={styles.row} data-status={status}>
      {icon && (
        <span className={styles.icon}>
          <img src={icon} alt="" width={32} height={32} />
        </span>
      )}
      <span className={styles.label}>{LABELS[status]}</span>
    </div>
  );
}
