import { describe, expect, it } from 'vitest'
import { topNProducts } from '../../../server/ai/tools/top-n-products'
import { ToolInputError } from '../../../server/ai/tools/types'
import { SUPPLIER_1_ID, SUPPLIER_2_ID } from '../../../db/seed-data'
import { withTestTx } from '../../helpers/db'

describe('get_top_n_products', () => {
  it('returns rows ranked by revenue, scoped to the requested vendor', async () => {
    await withTestTx(async (db) => {
      const result = await topNProducts.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { n: 5, metric: 'revenue' },
      )
      expect(result.rows.length).toBeGreaterThan(0)
      expect(result.rows.length).toBeLessThanOrEqual(5)
      // descending revenue
      const values = result.rows.map((r) => r.value)
      expect([...values].sort((a, b) => b - a)).toEqual(values)
      // every row is a Supplier 1 product (we'll check via SQL since rows
      // don't include vendor_id)
      const ids = result.rows.map((r) => r.product_id)
      const owners = await db
        .selectFrom('products')
        .select(['id', 'vendor_id'])
        .where('id', 'in', ids)
        .execute()
      expect(owners.every((p) => p.vendor_id === SUPPLIER_1_ID)).toBe(true)
    })
  })

  it('isolates supplier 1 from supplier 2', async () => {
    await withTestTx(async (db) => {
      const s1 = await topNProducts.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { n: 50, metric: 'revenue' },
      )
      const s2 = await topNProducts.execute(
        { db, vendorId: SUPPLIER_2_ID },
        { n: 50, metric: 'revenue' },
      )
      const s1Ids = new Set(s1.rows.map((r) => r.product_id))
      const s2Ids = new Set(s2.rows.map((r) => r.product_id))
      const overlap = [...s1Ids].filter((id) => s2Ids.has(id))
      expect(overlap).toEqual([])
    })
  })

  it('returns zero rows for a date window with no orders', async () => {
    await withTestTx(async (db) => {
      const result = await topNProducts.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {
          n: 5,
          metric: 'revenue',
          start_date: '2000-01-01',
          end_date: '2000-01-31',
        },
      )
      expect(result.rows).toEqual([])
      expect(result.overview).toMatch(/no sales/i)
    })
  })

  it('rejects invalid n', async () => {
    await withTestTx(async (db) => {
      await expect(
        topNProducts.execute(
          { db, vendorId: SUPPLIER_1_ID },
          { n: 0, metric: 'revenue' },
        ),
      ).rejects.toBeInstanceOf(ToolInputError)
      await expect(
        topNProducts.execute(
          { db, vendorId: SUPPLIER_1_ID },
          { n: 999, metric: 'revenue' },
        ),
      ).rejects.toBeInstanceOf(ToolInputError)
    })
  })

  it('rejects unknown metric', async () => {
    await withTestTx(async (db) => {
      await expect(
        topNProducts.execute(
          { db, vendorId: SUPPLIER_1_ID },
          { n: 5, metric: 'units' as never },
        ),
      ).rejects.toBeInstanceOf(ToolInputError)
    })
  })
})
