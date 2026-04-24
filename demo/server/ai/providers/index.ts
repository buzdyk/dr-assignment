import { createClaudeProvider } from './claude'
import { createRobotProvider } from './robot'
import type { AIProvider } from './types'

export function resolveProvider(): AIProvider {
  const choice = (process.env.AI_PROVIDER ?? 'claude').toLowerCase()
  if (choice === 'robot') return createRobotProvider()
  if (choice === 'claude') return createClaudeProvider()
  throw new Error(`Unknown AI_PROVIDER "${choice}" — expected "claude" or "robot"`)
}

export type { AIProvider } from './types'
export { ProviderError } from './types'
