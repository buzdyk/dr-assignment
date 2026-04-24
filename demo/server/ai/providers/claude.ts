import Anthropic from '@anthropic-ai/sdk'
import type {
  AIProvider,
  RunConversationInput,
  RunConversationResult,
} from './types'
import { ProviderError } from './types'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048
const MAX_ITERATIONS = 10

export function createClaudeProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new ProviderError('ANTHROPIC_API_KEY is not set')
  }
  const client = new Anthropic({ apiKey })

  return {
    async runConversation(
      input: RunConversationInput,
    ): Promise<RunConversationResult> {
      const messages: Anthropic.MessageParam[] = input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        let response: Anthropic.Message
        try {
          response = await client.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            temperature: 0,
            system: input.system,
            tools: input.tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema as Anthropic.Tool.InputSchema,
            })),
            messages,
          })
        } catch (err) {
          throw new ProviderError(
            err instanceof Error ? err.message : String(err),
            err,
          )
        }

        messages.push({ role: 'assistant', content: response.content })

        if (response.stop_reason !== 'tool_use') {
          const text = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('\n')
            .trim()
          return { text }
        }

        const toolUses = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        )

        const toolResults: Anthropic.ToolResultBlockParam[] = []
        for (const use of toolUses) {
          const { output, is_error } = await input.onToolCall(use.name, use.input)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: use.id,
            content: output,
            is_error,
          })
        }

        messages.push({ role: 'user', content: toolResults })
      }

      throw new ProviderError(
        `Tool loop did not settle within ${MAX_ITERATIONS} iterations`,
      )
    },
  }
}
