import { sql, type Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  await sql`truncate table order_cancellations, order_items, orders, products, customers, vendors restart identity cascade`.execute(
    db,
  )
}
