/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: false,
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'chrome130',
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173, strictPort: true },
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
  },
});
