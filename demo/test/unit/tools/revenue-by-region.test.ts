import { describe, expect, it } from 'vitest'
import { revenueByRegion } from '../../../server/ai/tools/revenue-by-region'
import { SUPPLIER_1_ID, SUPPLIER_2_ID } from '../../../db/seed-data'
import { withTestTx } from '../../helpers/db'

describe('get_revenue_by_region', () => {
  it('returns rows ranked by revenue desc with bar chart hint', async () => {
    await withTestTx(async (db) => {
      const result = await revenueByRegion.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      expect(result.rows.length).toBeGreaterThan(0)
      const revenues = result.rows.map((r) => r.revenue)
      expect([...revenues].sort((a, b) => b - a)).toEqual(revenues)
      expect(result.chart).toEqual({ kind: 'bar', x: 'region', y: 'revenue' })
    })
  })

  it('customer_count never exceeds order_count per region', async () => {
    await withTestTx(async (db) => {
      const result = await revenueByRegion.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      for (const row of result.rows) {
        expect(row.customer_count).toBeGreaterThan(0)
        expect(row.customer_count).toBeLessThanOrEqual(row.order_count)
      }
    })
  })

  it('vendor scoping holds — supplier 2 yields its own totals', async () => {
    await withTestTx(async (db) => {
      const s1 = await revenueByRegion.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const s2 = await revenueByRegion.execute(
        { db, vendorId: SUPPLIER_2_ID },
        {},
      )
      const t1 = s1.rows.reduce((a, r) => a + r.revenue, 0)
      const t2 = s2.rows.reduce((a, r) => a + r.revenue, 0)
      expect(t1).toBeGreaterThan(0)
      expect(t2).toBeGreaterThan(0)
      expect(t1).not.toBe(t2)
    })
  })

  it('returns zero rows for a window with no orders', async () => {
    await withTestTx(async (db) => {
      const result = await revenueByRegion.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { start_date: '2000-01-01', end_date: '2000-01-31' },
      )
      expect(result.rows).toEqual([])
      expect(result.overview).toMatch(/no sales/i)
    })
  })
})
