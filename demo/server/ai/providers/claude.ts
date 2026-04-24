import type {
  AIProvider,
  PickResult,
  PickToolsInput,
  SummarizeInput,
} from './types'
import { ProviderError } from './types'

const NOT_ADAPTED_MESSAGE =
  'Claude provider has not been adapted to the pickTools/summarize interface yet. Pass `debug: true` in the request body to use the Robot stub. See docs/todos/backlog/CLAUDE_PROVIDER_ADAPT.md.'

export function createClaudeProvider(): AIProvider {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ProviderError('ANTHROPIC_API_KEY is not set')
  }

  return {
    async pickTools(_input: PickToolsInput): Promise<PickResult> {
      throw new ProviderError(NOT_ADAPTED_MESSAGE)
    },
    async *summarize(_input: SummarizeInput): AsyncIterable<string> {
      throw new ProviderError(NOT_ADAPTED_MESSAGE)
    },
  }
}
