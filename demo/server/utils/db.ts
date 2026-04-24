import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { Database } from '~~/db/types'

let instance: Kysely<Database> | null = null

export function useDb(): Kysely<Database> {
  if (!instance) {
    instance = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new pg.Pool({
          connectionString:
            process.env.DATABASE_URL ??
            'postgres://postgres:postgres@localhost:5432/nextrade',
        }),
      }),
    })
  }
  return instance
}
