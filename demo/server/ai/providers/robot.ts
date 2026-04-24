import type {
  AIProvider,
  ChatMessage,
  PickResult,
  PickToolsInput,
  SummarizeInput,
} from './types'

type Script =
  | { kind: 'text'; text: string }
  | {
      kind: 'tool'
      tool: string
      args: Record<string, unknown>
      template: (result: unknown) => string
    }

const SCRIPTS: { match: RegExp; reply: Script }[] = [
  {
    match: /top.*(3|three|5|five).*(product|selling)/i,
    reply: {
      kind: 'tool',
      tool: 'get_top_n_products',
      args: { n: 3, metric: 'revenue' },
      template: (res) => {
        const rows = (res as { rows: Array<{ name: string; value: number }> }).rows
        if (!rows.length) return "You don't have any sales in that window."
        const list = rows
          .map((r, i) => `${i + 1}. ${r.name} — $${r.value.toFixed(2)}`)
          .join('\n')
        return `Top products by revenue over the last 30 days:\n${list}`
      },
    },
  },
  {
    match: /trend|over time|last.*30|last.*month/i,
    reply: {
      kind: 'tool',
      tool: 'get_sales_trend',
      args: { granularity: 'day' },
      template: (res) => {
        const rows = (res as { rows: Array<{ bucket: string; revenue: number }> }).rows
        if (!rows.length) return 'No sales in that window.'
        const total = rows.reduce((a, r) => a + r.revenue, 0)
        return `Daily revenue totaled $${total.toFixed(2)} across ${rows.length} days.`
      },
    },
  },
  {
    match: /categor/i,
    reply: {
      kind: 'tool',
      tool: 'get_category_breakdown',
      args: {},
      template: (res) => {
        const rows = (res as { rows: Array<{ category: string; revenue: number }> }).rows
        if (!rows.length) return 'No category activity in that window.'
        return rows
          .map((r) => `${r.category}: $${r.revenue.toFixed(2)}`)
          .join('\n')
      },
    },
  },
  {
    match: /region|na|eu|apac|latam/i,
    reply: {
      kind: 'tool',
      tool: 'get_revenue_by_region',
      args: {},
      template: (res) => {
        const rows = (res as { rows: Array<{ region: string; revenue: number }> }).rows
        if (!rows.length) return 'No regional activity in that window.'
        return rows
          .map((r) => `${r.region}: $${r.revenue.toFixed(2)}`)
          .join('\n')
      },
    },
  },
  {
    match: /cancel.*(why|reason|cause)/i,
    reply: {
      kind: 'text',
      text: "Our records show which orders were cancelled but don't capture the reasons. I can tell you the cancellation rate but not why customers cancelled.",
    },
  },
  {
    match: /status|mix|cancel/i,
    reply: {
      kind: 'tool',
      tool: 'get_order_status_mix',
      args: {},
      template: (res) => {
        const r = res as {
          rows: Array<{ status: string; order_count: number }>
          total_orders: number
        }
        if (r.total_orders === 0) return 'No orders in that window.'
        const cancelled =
          r.rows.find((row) => row.status === 'cancelled')?.order_count ?? 0
        const pct = ((cancelled / r.total_orders) * 100).toFixed(1)
        const mix = r.rows
          .map((row) => `${row.status}: ${row.order_count}`)
          .join(', ')
        return `${r.total_orders} orders — ${mix}. Cancellation rate: ${pct}%.`
      },
    },
  },
  {
    match: /forecast|predict|next (quarter|month|week)/i,
    reply: {
      kind: 'text',
      text: "I can describe past trends but can't predict future sales.",
    },
  },
]

const FALLBACK: Script = {
  kind: 'text',
  text: "I don't have a tool for that question.",
}

const CHUNK_DELAY_MS = Number(process.env.ROBOT_CHUNK_DELAY_MS ?? 150)
const PICK_DELAY_MS = Number(process.env.ROBOT_PICK_DELAY_MS ?? 250)

function scriptForMessages(messages: ChatMessage[]): Script {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  const prompt = last?.content ?? ''
  return SCRIPTS.find((s) => s.match.test(prompt))?.reply ?? FALLBACK
}

function chunkText(text: string, pieces: number): string[] {
  if (pieces <= 1 || text.length <= pieces) return [text]
  const words = text.split(/(\s+)/)
  const out: string[] = []
  const bucketSize = Math.ceil(words.length / pieces)
  for (let i = 0; i < words.length; i += bucketSize) {
    out.push(words.slice(i, i + bucketSize).join(''))
  }
  return out.filter((c) => c.length > 0)
}

export function createRobotProvider(): AIProvider {
  return {
    async pickTools(input: PickToolsInput): Promise<PickResult> {
      if (PICK_DELAY_MS > 0) await new Promise((r) => setTimeout(r, PICK_DELAY_MS))
      const script = scriptForMessages(input.messages)
      if (script.kind === 'text') {
        return { kind: 'text', text: script.text }
      }
      return {
        kind: 'tools',
        calls: [{ name: script.tool, args: script.args }],
      }
    },

    async *summarize(input: SummarizeInput): AsyncIterable<string> {
      const script = scriptForMessages(input.messages)
      let summary: string
      if (script.kind === 'text') {
        summary = script.text
      } else {
        const result = input.results[0]
        if (!result || result.is_error) {
          summary = `The ${input.calls[0]?.name ?? 'tool'} call failed.`
        } else {
          try {
            summary = script.template(JSON.parse(result.output))
          } catch {
            summary = 'Could not parse tool output.'
          }
        }
      }

      const chunks = chunkText(summary, 8)
      for (const chunk of chunks) {
        yield chunk
        if (CHUNK_DELAY_MS > 0) await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS))
      }
    },
  }
}
