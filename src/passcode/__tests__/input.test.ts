import { extractDigits, keyToAction } from '../input';

const key = (
  value: string,
  modifiers: Partial<Record<'metaKey' | 'ctrlKey' | 'altKey', boolean>> = {},
) => ({
  key: value,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...modifiers,
});

describe('extractDigits', () => {
  it('keeps ASCII digits only', () => {
    expect(extractDigits(' 12-3a4 ')).toBe('1234');
  });

  it('folds full-width digits', () => {
    expect(extractDigits('１２３４')).toBe('1234');
  });
});

describe('keyToAction', () => {
  it('maps digits and other printable keys to input', () => {
    expect(keyToAction(key('7'), 2)).toEqual({ type: 'input', index: 2, text: '7' });
    expect(keyToAction(key('x'), 2)).toEqual({ type: 'input', index: 2, text: 'x' });
  });

  it('treats Backspace and Delete the same', () => {
    expect(keyToAction(key('Backspace'), 1)).toEqual({ type: 'erase', index: 1 });
    expect(keyToAction(key('Delete'), 1)).toEqual({ type: 'erase', index: 1 });
  });

  it('clears everything on ⌥⌫ / ⌘⌫', () => {
    expect(keyToAction(key('Backspace', { altKey: true }), 1)).toEqual({ type: 'clear' });
    expect(keyToAction(key('Backspace', { metaKey: true }), 1)).toEqual({ type: 'clear' });
  });

  it('submits on Enter', () => {
    expect(keyToAction(key('Enter'), 0)).toEqual({ type: 'submit' });
  });

  it('moves with arrows, Home and End', () => {
    expect(keyToAction(key('ArrowLeft'), 2)).toEqual({ type: 'move', index: 1 });
    expect(keyToAction(key('ArrowRight'), 2)).toEqual({ type: 'move', index: 3 });
    expect(keyToAction(key('Home'), 2)).toEqual({ type: 'move', index: 0 });
    expect(keyToAction(key('End'), 0)).toEqual({ type: 'move', index: 3 });
  });

  it('leaves shortcuts, Tab and IME composition to the browser', () => {
    expect(keyToAction(key('v', { metaKey: true }), 0)).toBeNull();
    expect(keyToAction(key('r', { ctrlKey: true }), 0)).toBeNull();
    expect(keyToAction(key('Tab'), 0)).toBeNull();
    expect(keyToAction({ ...key('1'), isComposing: true }, 0)).toBeNull();
  });
});
