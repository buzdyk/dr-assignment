import { ToolInputError, toolRegistry, type ToolContext } from './tools'

export type ToolOutput = { output: string; is_error: boolean }

export type ToolCallRecord = {
  name: string
  args: unknown
  result: unknown
  is_error: boolean
}

export function createExecutor(ctx: ToolContext) {
  const calls: ToolCallRecord[] = []

  async function dispatch(name: string, args: unknown): Promise<ToolOutput> {
    const tool = toolRegistry[name]
    if (!tool) {
      const message = `Unknown tool "${name}"`
      calls.push({ name, args, result: { error: message }, is_error: true })
      return { output: JSON.stringify({ error: message }), is_error: true }
    }

    try {
      const result = await tool.execute(ctx, args as never)
      calls.push({ name, args, result, is_error: false })
      return { output: JSON.stringify(result), is_error: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const kind = err instanceof ToolInputError ? 'invalid_params' : 'tool_error'
      const payload = { error: kind, message }
      calls.push({ name, args, result: payload, is_error: true })
      return { output: JSON.stringify(payload), is_error: true }
    }
  }

  return { dispatch, calls }
}
