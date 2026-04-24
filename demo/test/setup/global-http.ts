import {
  bootstrapTestSchema,
  buildTestSchemaDatabaseUrl,
} from './bootstrap-schema'

export default async function globalSetup() {
  // CRITICAL: do this BEFORE @nuxt/test-utils' setup() spawns Nitro, so the
  // app's `useDb()` (which reads process.env.DATABASE_URL once and caches a
  // pool) connects to the test-schema-qualified URL — never `public`.
  process.env.DATABASE_URL = buildTestSchemaDatabaseUrl()

  // Force Robot provider for HTTP tests so they're deterministic and don't
  // need a Claude key.
  process.env.AI_PROVIDER = 'robot'
  // Robot's chunk delays slow tests down without value here.
  process.env.ROBOT_CHUNK_DELAY_MS = '0'
  process.env.ROBOT_PICK_DELAY_MS = '0'
  process.env.ROBOT_TOOL_LATENCY_MS = '0'

  await bootstrapTestSchema()
  return async function teardown() {}
}
