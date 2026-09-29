import '@testing-library/jest-dom/vitest';

// Testing Library flushes its async work with a setTimeout(0) and only advances fake timers
// when it finds a global `jest`. Point it at Vitest's clock so fake-timer tests don't hang.
Object.assign(globalThis, {
  jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) },
});
