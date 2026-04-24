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

type Row = { status: string; order_count: number }

type Result = ToolPresentation & {
  rows: Row[]
  total_orders: number
  start_date: string
  end_date: string
}

export const orderStatusMix: ToolSpec<Args, Result> = {
  name: 'get_order_status_mix',
  description:
    "Return the vendor's order counts broken down by status (placed, shipped, delivered, cancelled) over a date range. Natural fit: pie chart. Includes cancelled orders — this is the source of record for cancellation-rate questions. Does NOT return cancellation reasons; those are not captured.",
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
      .where(sql`o.order_date::date`, '>=', start_date)
      .where(sql`o.order_date::date`, '<=', end_date)
      .select([
        'o.status',
        sql<number>`count(distinct o.id)::int`.as('order_count'),
      ])
      .groupBy('o.status')
      .orderBy('order_count', 'desc')
      .execute()

    const mapped = rows.map((r) => ({
      status: r.status,
      order_count: Number(r.order_count),
    }))
    const total = mapped.reduce((a, r) => a + r.order_count, 0)
    const cancelled =
      mapped.find((r) => r.status === 'cancelled')?.order_count ?? 0
    const cancelPct = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0.0'
    const overview = total
      ? `${total} orders · ${cancelPct}% cancelled · ${start_date} → ${end_date}`
      : `No orders between ${start_date} and ${end_date}`

    return {
      rows: mapped,
      total_orders: total,
      start_date,
      end_date,
      overview,
      filters: dateRangeFilters(start_date, end_date),
      chart: { kind: 'pie', x: 'status', y: 'order_count' },
    }
  },
}
