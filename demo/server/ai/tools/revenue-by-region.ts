import { sql } from 'kysely'
import {
  baseFilterSchema,
  dateRangeFilters,
  resolveDateRange,
  type BaseFilter,
  type ToolPresentation,
  type ToolSpec,
} from './types'

type Args = BaseFilter

type Row = {
  region: string
  revenue: number
  order_count: number
  customer_count: number
}

type Result = ToolPresentation & {
  rows: Row[]
  start_date: string
  end_date: string
}

export const revenueByRegion: ToolSpec<Args, Result> = {
  name: 'get_revenue_by_region',
  description:
    "Return revenue, order count, and distinct customer count grouped by customer region over a date range. Natural fit: bar chart. Excludes cancelled orders.",
  input_schema: {
    type: 'object',
    properties: { ...baseFilterSchema },
  },
  async execute(ctx, args) {
    const { start_date, end_date } = resolveDateRange(args)

    const rows = await ctx.db
      .selectFrom('products as p')
      .innerJoin('order_items as oi', 'oi.product_id', 'p.id')
      .innerJoin('orders as o', 'o.id', 'oi.order_id')
      .innerJoin('customers as c', 'c.id', 'o.customer_id')
      .where('p.vendor_id', '=', ctx.vendorId)
      .where('o.status', '<>', 'cancelled')
      .where(sql`o.order_date::date`, '>=', start_date)
      .where(sql`o.order_date::date`, '<=', end_date)
      .select([
        'c.region',
        sql<number>`sum(oi.quantity * oi.unit_price)::float`.as('revenue'),
        sql<number>`count(distinct o.id)::int`.as('order_count'),
        sql<number>`count(distinct c.id)::int`.as('customer_count'),
      ])
      .groupBy('c.region')
      .orderBy('revenue', 'desc')
      .execute()

    const mapped = rows.map((r) => ({
      region: r.region,
      revenue: Number(r.revenue),
      order_count: Number(r.order_count),
      customer_count: Number(r.customer_count),
    }))
    const overview = mapped.length
      ? `Revenue by region · ${start_date} → ${end_date}`
      : `No sales between ${start_date} and ${end_date}`

    return {
      rows: mapped,
      start_date,
      end_date,
      overview,
      filters: dateRangeFilters(start_date, end_date),
      chart: { kind: 'bar', x: 'region', y: 'revenue' },
    }
  },
}
