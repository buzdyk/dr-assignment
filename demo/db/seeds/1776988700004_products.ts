import { faker } from '@faker-js/faker'
import type { Insertable, Kysely } from 'kysely'
import type { Database, ProductsTable } from '../types'
import {
  CATEGORIES,
  COLOURS,
  FAKER_SEED,
  SUPPLIER_1_ID,
  SUPPLIER_2_ID,
} from '../seed-data'

const PRODUCTS_PER_VENDOR = 12

export async function seed(db: Kysely<Database>): Promise<void> {
  faker.seed(FAKER_SEED)

  const rows: Insertable<ProductsTable>[] = []
  for (const vendorId of [SUPPLIER_1_ID, SUPPLIER_2_ID]) {
    const vendorSlug = vendorId === SUPPLIER_1_ID ? 'S1' : 'S2'

    for (let i = 0; i < PRODUCTS_PER_VENDOR; i++) {
      const colour = COLOURS[i % COLOURS.length]
      const category = CATEGORIES[i % CATEGORIES.length]
      const noun = category.slice(0, -1)
      const unitPrice = faker.number.float({ min: 5, max: 250, fractionDigits: 2 })

      rows.push({
        vendor_id: vendorId,
        sku: `${vendorSlug}-${String(i + 1).padStart(3, '0')}`,
        name: `${colour} ${noun}`,
        category,
        unit_price: unitPrice.toFixed(2),
      })
    }
  }

  await db.insertInto('products').values(rows).execute()
}
