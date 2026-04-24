import { sql } from 'kysely'
import {
  baseFilterSchema,
  dateRangeFilters,
  resolveDateRange,
  ToolInputError,
  type BaseFilter,
  type ToolPresentation,
  type ToolSpec,
} from './types'

type Args = BaseFilter & {
  n: number
  metric: 'revenue' | 'quantity'
}

type Row = {
  product_id: string
  sku: string
  name: string
  category: string
  value: number
}

type Result = ToolPresentation & {
  rows: Row[]
  metric: Args['metric']
  start_date: string
  end_date: string
}

export const topNProducts: ToolSpec<Args, Result> = {
  name: 'get_top_n_products',
  description:
    "Return the vendor's top N products over a date range, ranked by revenue or units sold. Excludes cancelled orders.",
  input_schema: {
    type: 'object',
    properties: {
      n: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'How many products to return (1-50).',
      },
      metric: {
        type: 'string',
        enum: ['revenue', 'quantity'],
        description: '"revenue" ranks by sum(quantity * unit_price); "quantity" ranks by units sold.',
      },
      ...baseFilterSchema,
    },
    required: ['n', 'metric'],
  },
  async execute(ctx, args) {
    if (!Number.isInteger(args.n) || args.n < 1 || args.n > 50) {
      throw new ToolInputError('n must be an integer between 1 and 50')
    }
    if (args.metric !== 'revenue' && args.metric !== 'quantity') {
      throw new ToolInputError('metric must be "revenue" or "quantity"')
    }
    const { start_date, end_date } = resolveDateRange(args)

    const value =
      args.metric === 'revenue'
        ? sql<number>`sum(oi.quantity * oi.unit_price)::float`
        : sql<number>`sum(oi.quantity)::float`

    const rows = await ctx.db
      .selectFrom('products as p')
      .innerJoin('order_items as oi', 'oi.product_id', 'p.id')
      .innerJoin('orders as o', 'o.id', 'oi.order_id')
      .where('p.vendor_id', '=', ctx.vendorId)
      .where('o.status', '<>', 'cancelled')
      .where(sql`o.order_date::date`, '>=', start_date)
      .where(sql`o.order_date::date`, '<=', end_date)
      .select([
        'p.id as product_id',
        'p.sku',
        'p.name',
        'p.category',
        value.as('value'),
      ])
      .groupBy(['p.id', 'p.sku', 'p.name', 'p.category'])
      .orderBy('value', 'desc')
      .limit(args.n)
      .execute()

    const mapped = rows.map((r) => ({ ...r, value: Number(r.value) }))
    const metricLabel = args.metric === 'revenue' ? 'revenue' : 'units sold'
    const overview = mapped.length
      ? `Top ${args.n} by ${metricLabel} · ${start_date} → ${end_date}`
      : `No sales between ${start_date} and ${end_date}`

    return {
      rows: mapped,
      metric: args.metric,
      start_date,
      end_date,
      overview,
      filters: [
        { label: 'n', value: String(args.n) },
        { label: 'metric', value: args.metric },
        ...dateRangeFilters(start_date, end_date),
      ],
      chart: { kind: 'bar', x: 'name', y: 'value' },
    }
  },
}
