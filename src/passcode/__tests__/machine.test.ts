import {
  clampFocus,
  initialState,
  passcodeReducer,
  selectView,
  type PasscodeAction,
  type PasscodeState,
} from '../machine';

const run = (actions: PasscodeAction[], from: PasscodeState = initialState) =>
  actions.reduce(passcodeReducer, from);

const typed = (code: string) =>
  run([...code].map((digit, index) => ({ type: 'input', index, text: digit }) as const));

describe('input', () => {
  it('fills the cell and advances focus, staying on the last cell', () => {
    const state = typed('1234');
    expect(state.digits).toEqual(['1', '2', '3', '4']);
    expect(state.focusIndex).toBe(3);
  });

  it('distributes pasted digits from the given cell and drops the overflow', () => {
    const state = run([{ type: 'input', index: 1, text: '98765' }]);
    // Clamped to the first empty cell, so it starts at 0 rather than leaving a gap.
    expect(state.digits).toEqual(['9', '8', '7', '6']);
  });

  it('ignores non-digits and records a nudge', () => {
    const state = run([{ type: 'input', index: 0, text: 'a' }]);
    expect(state.digits).toEqual(['', '', '', '']);
    expect(state.nudge).toBe(1);
  });

  it('overwrites a filled cell', () => {
    const state = run([{ type: 'input', index: 1, text: '9' }], typed('123'));
    expect(state.digits).toEqual(['1', '9', '3', '']);
    expect(state.focusIndex).toBe(2);
  });
});

describe('erase', () => {
  it('clears a filled cell and keeps focus there', () => {
    const state = run([{ type: 'erase', index: 3 }], typed('1234'));
    expect(state.digits).toEqual(['1', '2', '3', '']);
    expect(state.focusIndex).toBe(3);
  });

  it('moves back from an empty cell without clearing the previous one', () => {
    const state = run([{ type: 'erase', index: 2 }], typed('12'));
    expect(state.digits).toEqual(['1', '2', '', '']);
    expect(state.focusIndex).toBe(1);
  });

  it('does nothing on the first cell when empty', () => {
    expect(run([{ type: 'erase', index: 0 }])).toMatchObject({ focusIndex: 0 });
  });
});

describe('clampFocus', () => {
  it('allows filled cells and the first empty cell only', () => {
    const digits = ['1', '', '3', ''];
    expect(clampFocus(digits, 0)).toBe(0);
    expect(clampFocus(digits, 1)).toBe(1);
    expect(clampFocus(digits, 2)).toBe(2);
    expect(clampFocus(digits, 3)).toBe(1);
    expect(clampFocus(digits, -1)).toBe(0);
  });
});

describe('submission', () => {
  it('refuses an incomplete code, focusing the first empty cell with a nudge', () => {
    const state = run([{ type: 'submit' }], typed('12'));
    expect(state.phase).toBe('editing');
    expect(state.focusIndex).toBe(2);
    expect(state.nudge).toBe(1);
  });

  it('goes verifying → success when accepted', () => {
    const verifying = run([{ type: 'submit' }], typed('1234'));
    expect(verifying.phase).toBe('verifying');
    const done = run([{ type: 'verified', attempt: verifying.attempt, accepted: true }], verifying);
    expect(done.phase).toBe('success');
  });

  it('ignores a result from an earlier attempt', () => {
    const verifying = run([{ type: 'submit' }], typed('1234'));
    const stale = run([{ type: 'verified', attempt: verifying.attempt - 1, accepted: true }], verifying);
    expect(stale.phase).toBe('verifying');
  });

  it('locks input while verifying', () => {
    const verifying = run([{ type: 'submit' }], typed('1234'));
    expect(run([{ type: 'erase', index: 3 }], verifying).digits).toEqual(verifying.digits);
  });

  it('after a rejection, clears the code, refocuses cell 1 and keeps the error until typing', () => {
    const rejected = run(
      [
        { type: 'submit' },
        { type: 'verified', attempt: 1, accepted: false },
      ],
      typed('1111'),
    );
    expect(selectView(rejected)).toMatchObject({ phase: 'error', status: 'error' });

    const cleared = run([{ type: 'rejectionShown' }], rejected);
    expect(cleared).toMatchObject({ phase: 'editing', digits: ['', '', '', ''], focusIndex: 0 });
    expect(selectView(cleared).status).toBe('error');

    const typing = run([{ type: 'input', index: 0, text: '5' }], cleared);
    expect(selectView(typing).status).toBeNull();
  });
});

describe('selectView', () => {
  it('shows the tile only while editing with the field focused', () => {
    expect(selectView(initialState).activeIndex).toBeNull();
    expect(selectView(typed('1')).activeIndex).toBe(1);
    expect(selectView(run([{ type: 'blur' }], typed('1'))).activeIndex).toBeNull();
  });
});
