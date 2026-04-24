import { describe, expect, it } from 'vitest'
import { categoryBreakdown } from '../../../server/ai/tools/category-breakdown'
import {
  CATEGORIES,
  SUPPLIER_1_ID,
  SUPPLIER_2_ID,
} from '../../../db/seed-data'
import { withTestTx } from '../../helpers/db'

describe('get_category_breakdown', () => {
  it('returns one row per category with revenue desc and chart hint pie', async () => {
    await withTestTx(async (db) => {
      const result = await categoryBreakdown.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      expect(result.rows.length).toBeGreaterThan(0)
      expect(result.rows.length).toBeLessThanOrEqual(CATEGORIES.length)
      const revenues = result.rows.map((r) => r.revenue)
      expect([...revenues].sort((a, b) => b - a)).toEqual(revenues)
      expect(result.chart).toEqual({ kind: 'pie', x: 'category', y: 'revenue' })
    })
  })

  it('every returned category exists in the seed catalog', async () => {
    await withTestTx(async (db) => {
      const result = await categoryBreakdown.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const known = new Set<string>(CATEGORIES)
      expect(result.rows.every((r) => known.has(r.category))).toBe(true)
    })
  })

  it('vendor scoping yields different revenue mixes', async () => {
    await withTestTx(async (db) => {
      const s1 = await categoryBreakdown.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const s2 = await categoryBreakdown.execute(
        { db, vendorId: SUPPLIER_2_ID },
        {},
      )
      const totalS1 = s1.rows.reduce((a, r) => a + r.revenue, 0)
      const totalS2 = s2.rows.reduce((a, r) => a + r.revenue, 0)
      expect(totalS1).toBeGreaterThan(0)
      expect(totalS2).toBeGreaterThan(0)
      expect(totalS1).not.toBe(totalS2)
    })
  })

  it('returns zero rows for a window with no orders', async () => {
    await withTestTx(async (db) => {
      const result = await categoryBreakdown.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { start_date: '2000-01-01', end_date: '2000-01-31' },
      )
      expect(result.rows).toEqual([])
      expect(result.overview).toMatch(/no sales/i)
    })
  })
})
