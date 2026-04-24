import { sql } from 'kysely'
import {
  parseDate,
  ToolInputError,
  type ToolContext,
  type ToolSpec,
} from './types'

type Metric = 'revenue' | 'quantity' | 'order_count'

type Args = {
  day_a: string
  day_b: string
  metric: Metric
}

type DayResult = { date: string; value: number }

export const compareDays: ToolSpec<
  Args,
  {
    day_a: DayResult
    day_b: DayResult
    metric: Metric
    delta: number
    delta_pct: number | null
  }
> = {
  name: 'compare_days',
  description:
    "Compare the vendor's activity on two specific dates by revenue, quantity sold, or order count. Excludes cancelled orders.",
  input_schema: {
    type: 'object',
    properties: {
      day_a: { type: 'string', format: 'date' },
      day_b: { type: 'string', format: 'date' },
      metric: {
        type: 'string',
        enum: ['revenue', 'quantity', 'order_count'],
      },
    },
    required: ['day_a', 'day_b', 'metric'],
  },
  async execute(ctx, args) {
    if (!['revenue', 'quantity', 'order_count'].includes(args.metric)) {
      throw new ToolInputError(
        'metric must be revenue, quantity, or order_count',
      )
    }
    parseDate(args.day_a)
    parseDate(args.day_b)

    const [a, b] = await Promise.all([
      measureDay(ctx, args.day_a, args.metric),
      measureDay(ctx, args.day_b, args.metric),
    ])

    const delta = b - a
    const delta_pct = a === 0 ? null : (delta / a) * 100

    return {
      day_a: { date: args.day_a, value: a },
      day_b: { date: args.day_b, value: b },
      metric: args.metric,
      delta,
      delta_pct,
    }
  },
}

async function measureDay(
  ctx: ToolContext,
  date: string,
  metric: Metric,
): Promise<number> {
  const selector =
    metric === 'revenue'
      ? sql<number>`coalesce(sum(oi.quantity * oi.unit_price), 0)::float`
      : metric === 'quantity'
        ? sql<number>`coalesce(sum(oi.quantity), 0)::float`
        : sql<number>`count(distinct o.id)::int`

  const row = await ctx.db
    .selectFrom('products as p')
    .innerJoin('order_items as oi', 'oi.product_id', 'p.id')
    .innerJoin('orders as o', 'o.id', 'oi.order_id')
    .where('p.vendor_id', '=', ctx.vendorId)
    .where('o.status', '<>', 'cancelled')
    .where(sql`o.order_date::date`, '=', date)
    .select(selector.as('value'))
    .executeTakeFirst()

  return Number(row?.value ?? 0)
}
