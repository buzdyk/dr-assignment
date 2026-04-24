import Anthropic from '@anthropic-ai/sdk'
import type {
  AIProvider,
  ChatMessage,
  PickResult,
  PickToolsInput,
  SummarizeInput,
  ToolCall,
  ToolCallResult,
} from './types'
import { ProviderError } from './types'

const MODEL = 'claude-sonnet-4-6'
const PICK_MAX_TOKENS = 1024
const SUMMARIZE_MAX_TOKENS = 2048

export function createClaudeProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new ProviderError('ANTHROPIC_API_KEY is not set')
  }
  const client = new Anthropic({ apiKey })

  return {
    async pickTools(input: PickToolsInput): Promise<PickResult> {
      let response: Anthropic.Messages.Message
      try {
        response = await client.messages.create({
          model: MODEL,
          max_tokens: PICK_MAX_TOKENS,
          system: input.system,
          messages: input.messages.map(toAnthropicMessage),
          tools: input.tools.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema as Anthropic.Messages.Tool.InputSchema,
          })),
        })
      } catch (err) {
        throw new ProviderError(claudeErrorMessage('pickTools', err), err)
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
      )
      if (toolUses.length > 0) {
        return {
          kind: 'tools',
          calls: toolUses.map((b) => ({ name: b.name, args: b.input })),
        }
      }

      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      return { kind: 'text', text }
    },

    async *summarize(input: SummarizeInput): AsyncIterable<string> {
      const messages = [
        ...input.messages.map(toAnthropicMessage),
        {
          role: 'user' as const,
          content: buildToolTracePrompt(input.calls, input.results),
        },
      ]

      let stream: Awaited<ReturnType<typeof client.messages.create>>
      try {
        stream = await client.messages.create({
          model: MODEL,
          max_tokens: SUMMARIZE_MAX_TOKENS,
          system: input.system,
          messages,
          stream: true,
        })
      } catch (err) {
        throw new ProviderError(claudeErrorMessage('summarize', err), err)
      }

      try {
        for await (const event of stream as AsyncIterable<Anthropic.Messages.RawMessageStreamEvent>) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            yield event.delta.text
          }
        }
      } catch (err) {
        throw new ProviderError(claudeErrorMessage('summarize stream', err), err)
      }
    },
  }
}

function toAnthropicMessage(m: ChatMessage): Anthropic.Messages.MessageParam {
  return { role: m.role, content: m.content }
}

function buildToolTracePrompt(
  calls: ToolCall[],
  results: ToolCallResult[],
): string {
  const trace = calls
    .map((call, i) => {
      const result = results[i]
      const argsStr = JSON.stringify(call.args)
      if (!result) {
        return `- ${call.name}(${argsStr}) — no result returned.`
      }
      if (result.is_error) {
        return `- ${call.name}(${argsStr}) — FAILED: ${result.output}`
      }
      return `- ${call.name}(${argsStr}) → ${result.output}`
    })
    .join('\n')
  return [
    'Tool results from this turn:',
    '',
    trace,
    '',
    'Write the answer to my previous question using only the data above. Keep it conversational — the per-tool previews and charts are already shown to me in the UI, so do not restate each row.',
  ].join('\n')
}

function claudeErrorMessage(stage: string, err: unknown): string {
  const base = `Claude ${stage} call failed`
  if (err instanceof Anthropic.APIError) {
    return `${base}: ${err.status ?? ''} ${err.message}`.trim()
  }
  if (err instanceof Error) {
    return `${base}: ${err.message}`
  }
  return `${base}: ${String(err)}`
}
