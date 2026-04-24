import type { Insertable, Kysely } from 'kysely'
import type { Database, VendorsTable } from '../types'
import { VENDORS } from '../seed-data'

export async function seed(db: Kysely<Database>): Promise<void> {
  const rows: Insertable<VendorsTable>[] = VENDORS.map((v) => ({
    id: v.id,
    company_name: v.company_name,
    contact_email: v.contact_email,
    status: v.status,
  }))

  await db.insertInto('vendors').values(rows).execute()
}
