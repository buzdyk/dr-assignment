import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./test/unit/**/*.test.ts'],
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/per-test.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    pool: 'forks',
    forks: { singleFork: true },
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
