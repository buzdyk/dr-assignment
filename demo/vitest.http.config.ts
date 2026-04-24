import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./test/http/**/*.test.ts'],
    globalSetup: ['./test/setup/global-http.ts'],
    testTimeout: 60_000,
    hookTimeout: 240_000,
    pool: 'forks',
    forks: { singleFork: true },
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      'bun:test': fileURLToPath(
        new URL('./test/setup/bun-test-stub.ts', import.meta.url),
      ),
    },
  },
})
