// @nuxt/test-utils unconditionally imports `bun:test` to detect/setup the
// bun runner. We run under vitest, never bun, so route the import to a
// no-op that Vite is happy to bundle.
const noop = (..._args: unknown[]) => {}
export const mock = noop
export const beforeAll = noop
export const afterAll = noop
export const beforeEach = noop
export const afterEach = noop
export const test = noop
export const describe = noop
export const expect = noop
export default {}
