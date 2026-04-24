import { faker } from '@faker-js/faker'
import type { Insertable, Kysely } from 'kysely'
import type { Database, OrderItemsTable, OrdersTable } from '../types'
import {
  FAKER_SEED,
  ORDERS_PER_DAY_MAX,
  ORDERS_PER_DAY_MIN,
  SEED_DAYS,
} from '../seed-data'

const DAY_MS = 24 * 60 * 60 * 1000

export async function seed(db: Kysely<Database>): Promise<void> {
  faker.seed(FAKER_SEED + 1)

  const customers = await db.selectFrom('customers').select('id').execute()
  const products = await db
    .selectFrom('products')
    .select(['id', 'vendor_id', 'unit_price'])
    .execute()

  const productsByVendor = new Map<string, typeof products>()
  for (const p of products) {
    const list = productsByVendor.get(p.vendor_id) ?? []
    list.push(p)
    productsByVendor.set(p.vendor_id, list)
  }
  const vendorIds = Array.from(productsByVendor.keys())

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const orderRows: Insertable<OrdersTable>[] = []
  const itemRows: Insertable<OrderItemsTable>[] = []

  for (let daysAgo = SEED_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const dayStart = today.getTime() - daysAgo * DAY_MS
    const ordersToday = faker.number.int({
      min: ORDERS_PER_DAY_MIN,
      max: ORDERS_PER_DAY_MAX,
    })

    for (let i = 0; i < ordersToday; i++) {
      const orderId = faker.string.uuid()
      const vendorId = faker.helpers.arrayElement(vendorIds)
      const vendorProducts = productsByVendor.get(vendorId)!
      const customer = faker.helpers.arrayElement(customers)

      const orderDate = new Date(dayStart + faker.number.int({ min: 0, max: DAY_MS - 1 }))
      const lineCount = faker.number.int({ min: 1, max: 4 })
      const picks = faker.helpers.arrayElements(vendorProducts, lineCount)

      let total = 0
      for (const product of picks) {
        const quantity = faker.number.int({ min: 1, max: 5 })
        const unitPrice = Number(product.unit_price)
        total += quantity * unitPrice

        itemRows.push({
          order_id: orderId,
          product_id: product.id,
          quantity,
          unit_price: unitPrice.toFixed(2),
        })
      }

      const status = daysAgo >= 3 ? 'delivered' : daysAgo >= 1 ? 'shipped' : 'placed'
      const shippedAt =
        status === 'shipped' || status === 'delivered'
          ? new Date(orderDate.getTime() + DAY_MS)
          : null
      const deliveredAt =
        status === 'delivered'
          ? new Date(orderDate.getTime() + 3 * DAY_MS)
          : null

      orderRows.push({
        id: orderId,
        customer_id: customer.id,
        order_date: orderDate,
        status,
        total_amount: total.toFixed(2),
        shipped_at: shippedAt,
        delivered_at: deliveredAt,
      })
    }
  }

  const CHUNK = 500
  for (let i = 0; i < orderRows.length; i += CHUNK) {
    await db.insertInto('orders').values(orderRows.slice(i, i + CHUNK)).execute()
  }
  for (let i = 0; i < itemRows.length; i += CHUNK) {
    await db
      .insertInto('order_items')
      .values(itemRows.slice(i, i + CHUNK))
      .execute()
  }
}
