import { faker } from '@faker-js/faker'
import type { Insertable, Kysely } from 'kysely'
import type { CustomersTable, Database } from '../types'
import { FAKER_SEED } from '../seed-data'

const REGIONS = ['NA', 'EU', 'APAC', 'LATAM'] as const
const CUSTOMER_COUNT = 25

export async function seed(db: Kysely<Database>): Promise<void> {
  faker.seed(FAKER_SEED)

  const now = Date.now()
  const rows: Insertable<CustomersTable>[] = Array.from(
    { length: CUSTOMER_COUNT },
    (_, i) => {
      const signupDaysAgo = faker.number.int({ min: 60, max: 365 })
      return {
        email: `customer${String(i + 1).padStart(2, '0')}@example.com`,
        region: faker.helpers.arrayElement(REGIONS),
        signup_date: new Date(now - signupDaysAgo * 24 * 60 * 60 * 1000),
      }
    },
  )

  await db.insertInto('customers').values(rows).execute()
}
