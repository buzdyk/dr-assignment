import { describe, expect, it } from 'vitest'
import { salesTrend } from '../../../server/ai/tools/sales-trend'
import { ToolInputError } from '../../../server/ai/tools/types'
import { SUPPLIER_1_ID, SUPPLIER_2_ID } from '../../../db/seed-data'
import { withTestTx } from '../../helpers/db'

describe('get_sales_trend', () => {
  it('buckets by day with sortable date strings', async () => {
    await withTestTx(async (db) => {
      const result = await salesTrend.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { granularity: 'day' },
      )
      expect(result.granularity).toBe('day')
      expect(result.rows.length).toBeGreaterThan(0)
      const buckets = result.rows.map((r) => r.bucket)
      expect([...buckets].sort()).toEqual(buckets)
      // Each bucket is a YYYY-MM-DD string (date_trunc('day', ...) → 1 unique per day).
      expect(buckets.every((b) => /^\d{4}-\d{2}-\d{2}$/.test(b))).toBe(true)
    })
  })

  it('day buckets one row per calendar day; week/month are strictly coarser', async () => {
    await withTestTx(async (db) => {
      const ctx = { db, vendorId: SUPPLIER_1_ID }
      // Pin a 21-day window ending 3 days ago — fully inside the 45-day seed
      // range regardless of when tests run. Every seeded day has 5–15 orders,
      // so "day" must produce exactly one row per calendar day in the window.
      const end = new Date()
      end.setUTCHours(0, 0, 0, 0)
      end.setUTCDate(end.getUTCDate() - 3)
      const start = new Date(end)
      start.setUTCDate(start.getUTCDate() - 20)
      const window = {
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      }

      const day = await salesTrend.execute(ctx, { granularity: 'day', ...window })
      const week = await salesTrend.execute(ctx, { granularity: 'week', ...window })
      const month = await salesTrend.execute(ctx, { granularity: 'month', ...window })

      expect(day.rows.length).toBe(21)
      // 21 days spans 3 or 4 ISO weeks depending on weekday alignment.
      expect(week.rows.length).toBeGreaterThanOrEqual(3)
      expect(week.rows.length).toBeLessThanOrEqual(4)
      // 21 days spans 1 or 2 calendar months.
      expect(month.rows.length).toBeGreaterThanOrEqual(1)
      expect(month.rows.length).toBeLessThanOrEqual(2)
    })
  })

  it('isolates supplier 2 from supplier 1', async () => {
    await withTestTx(async (db) => {
      const s1 = await salesTrend.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { granularity: 'day' },
      )
      const s2 = await salesTrend.execute(
        { db, vendorId: SUPPLIER_2_ID },
        { granularity: 'day' },
      )
      // Different supplier → independent revenue numbers per shared bucket.
      const s2ByBucket = new Map(s2.rows.map((r) => [r.bucket, r.revenue]))
      const overlapping = s1.rows.filter((r) => s2ByBucket.has(r.bucket))
      expect(overlapping.length).toBeGreaterThan(0)
      const anyDifferent = overlapping.some(
        (r) => Math.abs(r.revenue - (s2ByBucket.get(r.bucket) ?? 0)) > 0.01,
      )
      expect(anyDifferent).toBe(true)
    })
  })

  it('returns zero rows for a window with no orders', async () => {
    await withTestTx(async (db) => {
      const result = await salesTrend.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {
          granularity: 'day',
          start_date: '2000-01-01',
          end_date: '2000-01-31',
        },
      )
      expect(result.rows).toEqual([])
      expect(result.overview).toMatch(/no sales/i)
    })
  })

  it('rejects unknown granularity', async () => {
    await withTestTx(async (db) => {
      await expect(
        salesTrend.execute(
          { db, vendorId: SUPPLIER_1_ID },
          { granularity: 'hour' as never },
        ),
      ).rejects.toBeInstanceOf(ToolInputError)
    })
  })
})
