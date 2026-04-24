import { sql } from 'kysely'
import {
  baseFilterSchema,
  resolveDateRange,
  ToolInputError,
  type BaseFilter,
  type ToolSpec,
} from './types'

type Granularity = 'day' | 'week' | 'month'
type Args = BaseFilter & { granularity: Granularity }

type Row = {
  bucket: string
  revenue: number
  order_count: number
}

export const salesTrend: ToolSpec<
  Args,
  {
    rows: Row[]
    granularity: Granularity
    start_date: string
    end_date: string
  }
> = {
  name: 'get_sales_trend',
  description:
    "Return the vendor's revenue and order count over time, bucketed by day, week, or month. Excludes cancelled orders.",
  input_schema: {
    type: 'object',
    properties: {
      granularity: {
        type: 'string',
        enum: ['day', 'week', 'month'],
      },
      ...baseFilterSchema,
    },
    required: ['granularity'],
  },
  async execute(ctx, args) {
    if (!['day', 'week', 'month'].includes(args.granularity)) {
      throw new ToolInputError('granularity must be day, week, or month')
    }
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
        sql<string>`to_char(date_trunc(${args.granularity}, o.order_date), 'YYYY-MM-DD')`.as(
          'bucket',
        ),
        sql<number>`sum(oi.quantity * oi.unit_price)::float`.as('revenue'),
        sql<number>`count(distinct o.id)::int`.as('order_count'),
      ])
      .groupBy('bucket')
      .orderBy('bucket', 'asc')
      .execute()

    return {
      rows: rows.map((r) => ({
        bucket: r.bucket,
        revenue: Number(r.revenue),
        order_count: Number(r.order_count),
      })),
      granularity: args.granularity,
      start_date,
      end_date,
    }
  },
}
