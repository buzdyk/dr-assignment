import type { ChartHint, FilterChip, ModelFacingSpec } from './tools'
import type { DispatchResult } from './executor'
import type {
  AIProvider,
  ChatMessage,
  ToolCall,
  ToolCallResult,
} from './providers/types'
import { ProviderError } from './providers/types'

export type ToolEnvelope = {
  overview: string
  filters: FilterChip[]
  rows: unknown[]
  chart?: ChartHint
}

export type ChatEvent =
  | { type: 'tool_start'; name: string; args: unknown }
  | ({ type: 'tool_result'; name: string; args: unknown; is_error?: boolean } & ToolEnvelope)
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

type RunnerInput = {
  provider: AIProvider
  system: string
  messages: ChatMessage[]
  tools: ModelFacingSpec[]
  dispatch: (name: string, args: unknown) => Promise<DispatchResult>
  emit: (event: ChatEvent) => void | Promise<void>
  toolLatencyMs?: number
}

const ERROR_ENVELOPE: ToolEnvelope = {
  overview: 'tool failed',
  filters: [],
  rows: [],
}

export async function runChat(input: RunnerInput): Promise<void> {
  try {
    const picked = await input.provider.pickTools({
      system: input.system,
      tools: input.tools,
      messages: input.messages,
    })

    if (picked.kind === 'text') {
      await input.emit({ type: 'text', text: picked.text })
      await input.emit({ type: 'done' })
      return
    }

    const resultsForSummary: ToolCallResult[] = []

    for (const call of picked.calls) {
      await input.emit({ type: 'tool_start', name: call.name, args: call.args })
      if (input.toolLatencyMs && input.toolLatencyMs > 0) {
        await new Promise((r) => setTimeout(r, input.toolLatencyMs))
      }
      const dispatched = await input.dispatch(call.name, call.args)
      resultsForSummary.push({
        output: dispatched.output,
        is_error: dispatched.is_error,
      })

      const envelope = extractEnvelope(dispatched)
      await input.emit({
        type: 'tool_result',
        name: call.name,
        args: call.args,
        ...envelope,
        ...(dispatched.is_error ? { is_error: true } : {}),
      })
    }

    const stream = input.provider.summarize({
      system: input.system,
      messages: input.messages,
      calls: picked.calls,
      results: resultsForSummary,
    })
    for await (const chunk of stream) {
      if (chunk) await input.emit({ type: 'text', text: chunk })
    }

    await input.emit({ type: 'done' })
  } catch (err) {
    const message =
      err instanceof ProviderError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err)
    await input.emit({ type: 'error', message })
  }
}

function extractEnvelope(d: DispatchResult): ToolEnvelope {
  if (d.is_error || !d.result || typeof d.result !== 'object') {
    const msg =
      d.result && typeof d.result === 'object' && 'message' in d.result
        ? String((d.result as { message: unknown }).message)
        : 'tool failed'
    return { ...ERROR_ENVELOPE, overview: msg }
  }
  const r = d.result as Partial<ToolEnvelope>
  return {
    overview: typeof r.overview === 'string' ? r.overview : '',
    filters: Array.isArray(r.filters) ? r.filters : [],
    rows: Array.isArray(r.rows) ? r.rows : [],
    ...(r.chart && typeof r.chart === 'object'
      ? { chart: r.chart as ChartHint }
      : {}),
  }
}
