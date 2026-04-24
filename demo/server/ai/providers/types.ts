import type { ModelFacingSpec } from '../tools'

export type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

export type ToolCall = { name: string; args: unknown }

export type ToolCallResult = {
  output: string
  is_error: boolean
}

export type PickResult =
  | { kind: 'tools'; calls: ToolCall[] }
  | { kind: 'text'; text: string }

export type PickToolsInput = {
  system: string
  tools: ModelFacingSpec[]
  messages: ChatMessage[]
}

export type SummarizeInput = {
  system: string
  messages: ChatMessage[]
  calls: ToolCall[]
  results: ToolCallResult[]
}

export interface AIProvider {
  pickTools(input: PickToolsInput): Promise<PickResult>
  summarize(input: SummarizeInput): AsyncIterable<string>
}

export class ProviderError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message)
    this.name = 'ProviderError'
  }
}
