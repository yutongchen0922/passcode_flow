/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  css: {
    modules: {
      // Readable class names in dev (e.g. `DigitCell_glyph`), hashed in production.
      generateScopedName: command === 'build' ? '[hash:base64:6]' : '[name]_[local]',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}));
