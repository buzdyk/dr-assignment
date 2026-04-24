import type { ToolPresentation, ToolSpec } from './types'

type Args = Record<string, never>

type Row = { name: string; description: string }

type Result = ToolPresentation & {
  rows: Row[]
}

export const listCapabilities: ToolSpec<Args, Result> = {
  name: 'list_capabilities',
  description:
    "Return the list of every other available tool with its full description. Call this when the user asks 'what can you do?', 'what data do you have access to?', 'list your tools', 'what kinds of questions can I ask?', or any other meta question about scope. Always prefer calling this tool over paraphrasing from memory — the registry is the source of truth.",
  input_schema: {
    type: 'object',
    properties: {},
  },
  async execute() {
    const { toolRegistry } = await import('./index')
    const rows: Row[] = Object.values(toolRegistry)
      .filter((t) => t.name !== 'list_capabilities')
      .map((t) => ({ name: t.name, description: t.description }))

    return {
      rows,
      overview: `${rows.length} ${rows.length === 1 ? 'tool' : 'tools'} available`,
      filters: [],
    }
  },
}
