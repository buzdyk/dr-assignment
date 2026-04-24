import { sql } from 'kysely'
import {
  baseFilterSchema,
  resolveDateRange,
  type BaseFilter,
  type ToolSpec,
} from './types'

type Args = BaseFilter

export const cancellationRate: ToolSpec<
  Args,
  {
    total_orders: number
    cancelled_orders: number
    cancellation_rate: number | null
    start_date: string
    end_date: string
  }
> = {
  name: 'get_cancellation_rate',
  description:
    "Return how many of the vendor's orders were cancelled in a date range and the cancellation rate. Does NOT return reasons — cancellation reasons are not captured in the data.",
  input_schema: {
    type: 'object',
    properties: { ...baseFilterSchema },
  },
  async execute(ctx, args) {
    const { start_date, end_date } = resolveDateRange(args)

    const row = await ctx.db
      .selectFrom('products as p')
      .innerJoin('order_items as oi', 'oi.product_id', 'p.id')
      .innerJoin('orders as o', 'o.id', 'oi.order_id')
      .where('p.vendor_id', '=', ctx.vendorId)
      .where(sql`o.order_date::date`, '>=', start_date)
      .where(sql`o.order_date::date`, '<=', end_date)
      .select([
        sql<number>`count(distinct o.id)::int`.as('total_orders'),
        sql<number>`count(distinct o.id) filter (where o.status = 'cancelled')::int`.as(
          'cancelled_orders',
        ),
      ])
      .executeTakeFirst()

    const total = Number(row?.total_orders ?? 0)
    const cancelled = Number(row?.cancelled_orders ?? 0)
    const rate = total === 0 ? null : cancelled / total

    return {
      total_orders: total,
      cancelled_orders: cancelled,
      cancellation_rate: rate,
      start_date,
      end_date,
    }
  },
}
