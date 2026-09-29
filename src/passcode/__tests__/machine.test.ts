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

/** A wrong code, still on screen. */
const wrong = () => run([{ type: 'submit' }, { type: 'verified', accepted: false }], typed('1111'));

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
    expect(run([{ type: 'verified', accepted: true }], verifying).phase).toBe('success');
  });

  it('ignores a verification result outside verifying', () => {
    expect(run([{ type: 'verified', accepted: true }], typed('1234')).phase).toBe('editing');
  });

  it('locks input while verifying', () => {
    const verifying = run([{ type: 'submit' }], typed('1234'));
    expect(run([{ type: 'erase', index: 3 }], verifying).digits).toEqual(verifying.digits);
  });

  it('after a wrong code, clears it, refocuses cell 1 and keeps the error until typing', () => {
    expect(selectView(wrong())).toMatchObject({ phase: 'error', status: 'error' });

    const cleared = run([{ type: 'dismissError' }], wrong());
    expect(cleared).toMatchObject({ phase: 'editing', digits: ['', '', '', ''], focusIndex: 0 });
    expect(selectView(cleared).status).toBe('error');

    const typing = run([{ type: 'input', index: 0, text: '5' }], cleared);
    expect(selectView(typing).status).toBeNull();
  });

  it('lets typing over a wrong code start the next attempt immediately', () => {
    const typing = run([{ type: 'input', index: 3, text: '1' }], wrong());
    expect(typing).toMatchObject({ phase: 'editing', digits: ['1', '', '', ''], focusIndex: 1 });
    expect(run([{ type: 'erase', index: 3 }], wrong())).toMatchObject({
      phase: 'editing',
      digits: ['', '', '', ''],
    });
    expect(run([{ type: 'submit' }], wrong()).phase).toBe('error');
  });

  it('shows the hint only after a wrong code, and keeps it', () => {
    expect(selectView(typed('1234')).hintVisible).toBe(false);
    expect(selectView(wrong()).hintVisible).toBe(true);
    const retyping = run(
      [{ type: 'dismissError' }, { type: 'input', index: 0, text: '1' }],
      wrong(),
    );
    expect(selectView(retyping).hintVisible).toBe(true);
  });

  it('rewinds on a clear-all until the next edit', () => {
    const cleared = run([{ type: 'clear' }], typed('12'));
    expect(cleared).toMatchObject({ rewinding: true, digits: ['', '', '', ''], focusIndex: 0 });
    // Focus alone (the tile arriving on cell 1) doesn't end it; typing does.
    expect(run([{ type: 'focus', index: 0 }], cleared).rewinding).toBe(true);
    expect(run([{ type: 'input', index: 0, text: '3' }], cleared).rewinding).toBe(false);
  });
});

describe('selectView', () => {
  it('shows the tile while editing with the field focused, and wraps it on submit', () => {
    expect(selectView(initialState).tile).toBe('hidden');
    expect(selectView(typed('1'))).toMatchObject({ tile: 'active', tileIndex: 1 });
    // Hidden on blur, but stays on its cell so it fades out in place.
    expect(selectView(run([{ type: 'blur' }], typed('1')))).toMatchObject({
      tile: 'hidden',
      tileIndex: 1,
    });
    expect(selectView(run([{ type: 'submit' }], typed('1234'))).tile).toBe('wrap');
  });

  it('animates by default, instantly for rapid keys, and rewinds on a clear-all', () => {
    expect(selectView(typed('1')).motion).toBe('default');
    expect(selectView(typed('1'), true).motion).toBe('instant');
    expect(selectView(run([{ type: 'clear' }], typed('1')), true).motion).toBe('rewind');
  });
});
