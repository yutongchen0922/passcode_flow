import { VERIFY_DELAY_MS } from './config';

export const CORRECT_PASSCODE = '1234';

type VerifyOptions = {
  signal?: AbortSignal;
  delayMs?: number;
};

/** Mock verification endpoint: resolves after a delay with whether the code is accepted. */
export function verifyPasscode(
  code: string,
  { signal, delayMs = VERIFY_DELAY_MS }: VerifyOptions = {},
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => resolve(code === CORRECT_PASSCODE), delayMs);
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
