import type { PasscodeAction } from './machine';
import { CODE_LENGTH } from './types';

/**
 * Keeps only 0–9. NFKC first folds full-width digits (e.g. "１２３４" from a CJK keyboard)
 * into ASCII so they count as digits.
 */
export function extractDigits(text: string): string {
  return text.normalize('NFKC').replace(/\D/g, '');
}

type KeyInfo = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  isComposing?: boolean;
};

/**
 * Maps a keydown on cell `index` to an action, or `null` to leave the key to the browser
 * (Tab, shortcuts like ⌘V, IME composition).
 */
export function keyToAction(event: KeyInfo, index: number): PasscodeAction | null {
  const { key, metaKey, ctrlKey, altKey, isComposing } = event;
  if (isComposing) return null;

  switch (key) {
    case 'Enter':
      return { type: 'submit' };
    case 'Backspace':
    case 'Delete':
      // ⌥⌫ / ⌘⌫ / Ctrl+⌫ delete a word or line elsewhere; here that means the whole code.
      return metaKey || altKey || ctrlKey ? { type: 'clear' } : { type: 'erase', index };
  }

  if (metaKey || ctrlKey) return null;

  switch (key) {
    case 'ArrowLeft':
      return { type: 'move', index: index - 1 };
    case 'ArrowRight':
      return { type: 'move', index: index + 1 };
    case 'Home':
      return { type: 'move', index: 0 };
    case 'End':
      return { type: 'move', index: CODE_LENGTH - 1 };
  }

  // Any other printable character; the reducer rejects non-digits.
  return key.length === 1 ? { type: 'input', index, text: key } : null;
}
