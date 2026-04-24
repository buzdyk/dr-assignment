import { describe, expect, it } from 'vitest'
import { orderStatusMix } from '../../../server/ai/tools/order-status-mix'
import { SUPPLIER_1_ID, SUPPLIER_2_ID } from '../../../db/seed-data'
import { withTestTx } from '../../helpers/db'

describe('get_order_status_mix', () => {
  it('total_orders equals sum of per-status counts and includes cancelled rows', async () => {
    await withTestTx(async (db) => {
      const result = await orderStatusMix.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const sum = result.rows.reduce((a, r) => a + r.order_count, 0)
      expect(sum).toBe(result.total_orders)
      expect(result.rows.some((r) => r.status === 'cancelled')).toBe(true)
      expect(result.chart).toEqual({
        kind: 'pie',
        x: 'status',
        y: 'order_count',
      })
    })
  })

  it('overview reports a cancellation percentage that matches the row data', async () => {
    await withTestTx(async (db) => {
      const result = await orderStatusMix.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const cancelled =
        result.rows.find((r) => r.status === 'cancelled')?.order_count ?? 0
      const expectedPct = ((cancelled / result.total_orders) * 100).toFixed(1)
      expect(result.overview).toContain(`${expectedPct}% cancelled`)
    })
  })

  it('vendor scoping yields different totals for the two suppliers', async () => {
    await withTestTx(async (db) => {
      const s1 = await orderStatusMix.execute(
        { db, vendorId: SUPPLIER_1_ID },
        {},
      )
      const s2 = await orderStatusMix.execute(
        { db, vendorId: SUPPLIER_2_ID },
        {},
      )
      expect(s1.total_orders).toBeGreaterThan(0)
      expect(s2.total_orders).toBeGreaterThan(0)
      expect(s1.total_orders).not.toBe(s2.total_orders)
    })
  })

  it('returns zero total for a window with no orders', async () => {
    await withTestTx(async (db) => {
      const result = await orderStatusMix.execute(
        { db, vendorId: SUPPLIER_1_ID },
        { start_date: '2000-01-01', end_date: '2000-01-31' },
      )
      expect(result.rows).toEqual([])
      expect(result.total_orders).toBe(0)
      expect(result.overview).toMatch(/no orders/i)
    })
  })
})
