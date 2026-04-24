import type {
  AIProvider,
  RunConversationInput,
  RunConversationResult,
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
        if (!rows.length) return "No sales in that window."
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
    match: /tuesday|wednesday|compare.*(day|date)/i,
    reply: {
      kind: 'tool',
      tool: 'compare_days',
      args: {
        day_a: yesterday(2),
        day_b: yesterday(1),
        metric: 'revenue',
      },
      template: (res) => {
        const r = res as {
          day_a: { date: string; value: number }
          day_b: { date: string; value: number }
          delta: number
        }
        return `${r.day_a.date}: $${r.day_a.value.toFixed(2)} vs ${r.day_b.date}: $${r.day_b.value.toFixed(2)} (delta $${r.delta.toFixed(2)}).`
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
    match: /cancel/i,
    reply: {
      kind: 'tool',
      tool: 'get_cancellation_rate',
      args: {},
      template: (res) => {
        const r = res as {
          total_orders: number
          cancelled_orders: number
          cancellation_rate: number | null
        }
        if (r.total_orders === 0) return 'No orders in that window.'
        const pct = ((r.cancellation_rate ?? 0) * 100).toFixed(1)
        return `${r.cancelled_orders} of ${r.total_orders} orders were cancelled (${pct}%).`
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

function yesterday(daysBack: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysBack)
  return d.toISOString().slice(0, 10)
}

export function createRobotProvider(): AIProvider {
  return {
    async runConversation(
      input: RunConversationInput,
    ): Promise<RunConversationResult> {
      const last = input.messages.findLast((m) => m.role === 'user')
      const prompt = last?.content ?? ''
      const script = SCRIPTS.find((s) => s.match.test(prompt))?.reply ?? FALLBACK

      if (script.kind === 'text') {
        return { text: script.text }
      }

      const { output, is_error } = await input.onToolCall(script.tool, script.args)
      if (is_error) {
        return { text: `Tool ${script.tool} errored: ${output}` }
      }
      return { text: script.template(JSON.parse(output)) }
    },
  }
}
