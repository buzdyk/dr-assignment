import { faker } from '@faker-js/faker'
import type { Insertable, Kysely } from 'kysely'
import type { Database, OrderCancellationsTable } from '../types'
import { CANCELLATION_RATE, FAKER_SEED } from '../seed-data'

const DAY_MS = 24 * 60 * 60 * 1000

export async function seed(db: Kysely<Database>): Promise<void> {
  faker.seed(FAKER_SEED + 2)

  const orders = await db
    .selectFrom('orders')
    .select(['id', 'order_date'])
    .execute()

  const shuffled = faker.helpers.shuffle(orders)
  const cancelCount = Math.round(orders.length * CANCELLATION_RATE)
  const cancelled = shuffled.slice(0, cancelCount)

  if (cancelled.length === 0) return

  const rows: Insertable<OrderCancellationsTable>[] = cancelled.map((o) => ({
    order_id: o.id,
    reason_category: null,
    detailed_reason: null,
    cancelled_at: new Date(
      new Date(o.order_date).getTime() +
        faker.number.int({ min: 1, max: 3 }) * DAY_MS,
    ),
  }))

  await db.insertInto('order_cancellations').values(rows).execute()

  await db
    .updateTable('orders')
    .set({ status: 'cancelled' })
    .where(
      'id',
      'in',
      cancelled.map((o) => o.id),
    )
    .execute()
}
