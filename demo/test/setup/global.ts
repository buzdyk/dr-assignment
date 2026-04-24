import { bootstrapTestSchema } from './bootstrap-schema'

export default async function globalSetup() {
  await bootstrapTestSchema()
  return async function teardown() {
    // Intentionally do NOT drop the schema here — leaving it makes
    // post-mortem debugging easier. Next run drops + recreates anyway.
  }
}
