import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AUTO_SUBMIT_DELAY_MS,
  ERROR_HOLD_MS,
  STATUS_FADE_OUT_MS,
  VERIFY_DELAY_MS,
} from '../config';
import { PasscodeEntry } from '../PasscodeEntry';

/**
 * The challenge's rules, each exercised through the real component with simulated
 * keyboard and clipboard input.
 */

function setup() {
  vi.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
  render(<PasscodeEntry />);
  const cells = screen.getAllByRole<HTMLInputElement>('textbox');
  return {
    user,
    cells,
    values: () => cells.map((cell) => cell.value),
    status: () => screen.getByRole('status').textContent,
    focused: () => cells.indexOf(document.activeElement as HTMLInputElement),
  };
}

// Each call is its own act(), so updates (and the timers their effects start) are applied
// before the next wait.
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

afterEach(() => {
  vi.useRealTimers();
});

describe('Rule 1 · only numeric input', () => {
  it('ignores letters, symbols and spaces', async () => {
    const { user, values } = setup();
    await user.keyboard('a! 5x');
    expect(values()).toEqual(['5', '', '', '']);
  });

  it('keeps just the digits from a paste', async () => {
    const { user, cells, values } = setup();
    await user.click(cells[0]!);
    await user.paste('12-34');
    expect(values()).toEqual(['1', '2', '3', '4']);
  });

  it('ignores a paste with no digits', async () => {
    const { user, cells, values } = setup();
    await user.click(cells[0]!);
    await user.paste('abcd');
    expect(values()).toEqual(['', '', '', '']);
  });
});

describe('Rules 2 & 4 · simulated verification of 1234', () => {
  it('shows "Verifying..." for the delay, then "Authenticated"', async () => {
    const { user, status } = setup();
    await user.keyboard('1234{Enter}');
    expect(status()).toBe('Verifying...');

    await wait(VERIFY_DELAY_MS - 1);
    expect(status()).toBe('Verifying...');

    // The result arrives; "Verifying..." fades out before "Authenticated" replaces it.
    await wait(1);
    await wait(STATUS_FADE_OUT_MS);
    expect(status()).toBe('Authenticated');
  });

  it('rejects a wrong code, then clears it and returns focus to the first cell', async () => {
    const { user, status, values, focused } = setup();
    await user.keyboard('1111{Enter}');
    await wait(VERIFY_DELAY_MS);
    await wait(STATUS_FADE_OUT_MS);
    expect(status()).toBe('Incorrect passcode');
    expect(values()).toEqual(['1', '1', '1', '1']);

    await wait(ERROR_HOLD_MS - STATUS_FADE_OUT_MS);
    expect(values()).toEqual(['', '', '', '']);
    expect(focused()).toBe(0);
    expect(status()).toBe('Incorrect passcode');

    await user.keyboard('5');
    await wait(STATUS_FADE_OUT_MS);
    expect(status()).toBe('');
  });

  it('accepts the next code straight away, even while the wrong one is still shown', async () => {
    const { user, values, status } = setup();
    await user.keyboard('1111{Enter}');
    await wait(VERIFY_DELAY_MS);
    await user.keyboard('1234');
    expect(values()).toEqual(['1', '2', '3', '4']);
    await user.keyboard('{Enter}');
    await wait(VERIFY_DELAY_MS);
    await wait(STATUS_FADE_OUT_MS);
    expect(status()).toBe('Authenticated');
  });

  it('hints the passcode as ghost digits in the empty cells after a wrong attempt', async () => {
    const { user } = setup();
    const ghosts = () =>
      [...document.querySelectorAll('[data-visible="true"]')].map((el) => el.textContent);
    expect(ghosts()).toEqual([]);

    await user.keyboard('1111{Enter}');
    await wait(VERIFY_DELAY_MS);
    await wait(ERROR_HOLD_MS);
    expect(ghosts()).toEqual(['1', '2', '3', '4']);
    // Screen readers get the same hint as text.
    expect(screen.getByText('Hint: the passcode is 1234')).toBeInTheDocument();

    await user.keyboard('1');
    expect(ghosts()).toEqual(['2', '3', '4']);
  });

  it('locks the cells while verifying', async () => {
    const { user, values } = setup();
    await user.keyboard('1234{Enter}{Backspace}9');
    expect(values()).toEqual(['1', '2', '3', '4']);
  });
});

describe('Rule 5 · Enter submits', () => {
  it('submits immediately, without waiting for auto-submit', async () => {
    const { user, status } = setup();
    await user.keyboard('1234{Enter}');
    expect(status()).toBe('Verifying...');
  });

  it('does not submit an incomplete code; focus jumps to the first empty cell', async () => {
    const { user, cells, status, focused } = setup();
    await user.keyboard('12');
    await user.click(cells[0]!);
    await user.keyboard('{Enter}');
    expect(status()).toBe('');
    expect(focused()).toBe(2);
  });
});

describe('Auto-submit', () => {
  it('submits a short beat after the fourth digit', async () => {
    const { user, status } = setup();
    await user.keyboard('1234');
    await wait(AUTO_SUBMIT_DELAY_MS - 1);
    expect(status()).toBe('');
    await wait(1);
    expect(status()).toBe('Verifying...');
  });

  it('is cancelled by an edit during the beat', async () => {
    const { user, status, values } = setup();
    await user.keyboard('1234{Backspace}');
    await wait(AUTO_SUBMIT_DELAY_MS * 2);
    expect(status()).toBe('');
    expect(values()).toEqual(['1', '2', '3', '']);
  });
});

describe('Rule 6 · typing advances focus', () => {
  it('moves to the next cell after each digit and stays on the last', async () => {
    const { user, focused } = setup();
    await user.keyboard('1');
    expect(focused()).toBe(1);
    await user.keyboard('23');
    expect(focused()).toBe(3);
    await user.keyboard('4');
    expect(focused()).toBe(3);
  });
});

describe('Rule 7 · Backspace clears the current cell', () => {
  it('clears a filled cell and keeps focus on it', async () => {
    const { user, values, focused } = setup();
    await user.keyboard('123{ArrowLeft}{Backspace}');
    expect(values()).toEqual(['1', '2', '', '']);
    expect(focused()).toBe(2);
  });

  it('works the same with Delete', async () => {
    const { user, values } = setup();
    await user.keyboard('123{ArrowLeft}{Delete}');
    expect(values()).toEqual(['1', '2', '', '']);
  });
});

describe('Rule 8 · Backspace on an empty cell moves back', () => {
  it('moves focus to the previous cell without clearing it', async () => {
    const { user, values, focused } = setup();
    await user.keyboard('12');
    expect(focused()).toBe(2);
    await user.keyboard('{Backspace}');
    expect(focused()).toBe(1);
    expect(values()).toEqual(['1', '2', '', '']);
  });
});

describe('Rule 9 · holding Backspace', () => {
  it('keeps clearing previous cells while held', async () => {
    const { user, values, focused } = setup();
    await user.keyboard('123');
    // Held key: six auto-repeated keydowns (move, clear, move, clear, move, clear).
    await user.keyboard('{Backspace>6/}');
    expect(values()).toEqual(['', '', '', '']);
    expect(focused()).toBe(0);
  });

  it('skips the animations while the key is held, and restores them on release', async () => {
    const { user } = setup();
    const motion = () => document.querySelector('[data-mode]')?.getAttribute('data-motion');
    await user.keyboard('123');
    await user.keyboard('{Backspace>3}');
    expect(motion()).toBe('instant');
    await user.keyboard('{/Backspace}');
    expect(motion()).toBe('default');
  });
});

describe('Focus', () => {
  it('accepts typing before the field is focused', async () => {
    const { user, values, focused } = setup();
    expect(focused()).toBe(-1);
    await user.keyboard('7');
    expect(values()).toEqual(['7', '', '', '']);
    expect(focused()).toBe(1);
  });

  it('activates the field on a click anywhere on the page', async () => {
    const { user, values, focused } = setup();
    const tile = () => document.querySelector('[data-mode]')?.getAttribute('data-mode');
    expect(tile()).toBe('hidden');

    await user.click(screen.getByRole('main'));
    expect(focused()).toBe(0);
    expect(tile()).toBe('active');

    await user.keyboard('4');
    expect(values()).toEqual(['4', '', '', '']);
  });

  it('keeps focus in the field when the page is clicked mid-entry', async () => {
    const { user, focused } = setup();
    await user.keyboard('12');
    await user.click(screen.getByRole('main'));
    expect(focused()).toBe(2);
  });

  it('cannot skip ahead of the first empty cell', async () => {
    const { user, cells, focused } = setup();
    await user.click(cells[3]!);
    expect(focused()).toBe(0);
  });

  it('is a single tab stop', async () => {
    const { user, cells } = setup();
    await user.keyboard('12');
    expect(cells.map((cell) => cell.tabIndex)).toEqual([-1, -1, 0, -1]);
  });
});
