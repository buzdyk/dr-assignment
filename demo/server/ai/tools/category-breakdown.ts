import { sql } from 'kysely'
import {
  baseFilterSchema,
  resolveDateRange,
  type BaseFilter,
  type ToolSpec,
} from './types'

type Args = BaseFilter

type Row = {
  category: string
  revenue: number
  order_count: number
  product_count: number
}

export const categoryBreakdown: ToolSpec<
  Args,
  { rows: Row[]; start_date: string; end_date: string }
> = {
  name: 'get_category_breakdown',
  description:
    "Return revenue, order count, and product count per category across the vendor's catalog over a date range. Excludes cancelled orders.",
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
      .where('p.vendor_id', '=', ctx.vendorId)
      .where('o.status', '<>', 'cancelled')
      .where(sql`o.order_date::date`, '>=', start_date)
      .where(sql`o.order_date::date`, '<=', end_date)
      .select([
        'p.category',
        sql<number>`sum(oi.quantity * oi.unit_price)::float`.as('revenue'),
        sql<number>`count(distinct o.id)::int`.as('order_count'),
        sql<number>`count(distinct p.id)::int`.as('product_count'),
      ])
      .groupBy('p.category')
      .orderBy('revenue', 'desc')
      .execute()

    return {
      rows: rows.map((r) => ({
        category: r.category,
        revenue: Number(r.revenue),
        order_count: Number(r.order_count),
        product_count: Number(r.product_count),
      })),
      start_date,
      end_date,
    }
  },
}
