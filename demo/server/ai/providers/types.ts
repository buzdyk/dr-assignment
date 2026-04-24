import type { ModelFacingSpec } from '../tools'
import type { ToolOutput } from '../executor'

export type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

export type RunConversationInput = {
  system: string
  tools: ModelFacingSpec[]
  messages: ChatMessage[]
  onToolCall: (name: string, args: unknown) => Promise<ToolOutput>
}

export type RunConversationResult = {
  text: string
}

export interface AIProvider {
  runConversation(input: RunConversationInput): Promise<RunConversationResult>
}

export class ProviderError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'ProviderError'
  }
}
