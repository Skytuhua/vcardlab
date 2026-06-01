import { defineConfig } from 'vitest/config'

// The core is pure, framework-free TypeScript, so tests need no React/Vite plugins.
// Kept separate from vite.config.ts to avoid Vite/Vitest plugin-type version clashes.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
    },
  },
})
