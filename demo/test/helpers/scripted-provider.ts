import type {
  AIProvider,
  PickResult,
  PickToolsInput,
  SummarizeInput,
} from '../../server/ai/providers/types'

export type Script = {
  pick: PickResult | ((input: PickToolsInput) => PickResult | Promise<PickResult>)
  summary?:
    | string[]
    | ((input: SummarizeInput) => string[] | Promise<string[]>)
  pickError?: Error
  summarizeError?: Error
}

export function createScriptedProvider(script: Script): AIProvider {
  return {
    async pickTools(input) {
      if (script.pickError) throw script.pickError
      return typeof script.pick === 'function' ? script.pick(input) : script.pick
    },
    async *summarize(input) {
      if (script.summarizeError) throw script.summarizeError
      const chunks =
        typeof script.summary === 'function'
          ? await script.summary(input)
          : (script.summary ?? [])
      for (const chunk of chunks) yield chunk
    },
  }
}
