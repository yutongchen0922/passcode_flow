import { VERIFY_DELAY_MS } from './config';

export const CORRECT_PASSCODE = '1234';

/** Mock verification endpoint: resolves after a delay with whether the code is accepted. */
export function verifyPasscode(code: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(code === CORRECT_PASSCODE), VERIFY_DELAY_MS);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
