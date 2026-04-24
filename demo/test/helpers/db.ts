import { Kysely, PostgresDialect, sql, type Transaction } from 'kysely'
import type { Database } from '~~/db/types'
import { TEST_SCHEMA, makeTestPool } from '../setup/schema-guard'
import type pg from 'pg'

let pool: pg.Pool | null = null
let db: Kysely<Database> | null = null

function getDb(): Kysely<Database> {
  if (!db) {
    pool = makeTestPool()
    db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    })
  }
  return db
}

export async function closeSharedTestPool(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
    pool = null
  }
}

const ROLLBACK = Symbol('test-tx-rollback')

/**
 * Run `fn` inside a transaction on a `test`-schema-bound connection, then
 * roll back. The transaction-scoped Kysely is what gets passed to tools as
 * `ToolContext.db`, so anything the test mutates vanishes at the end.
 *
 * GUARD: re-asserts `current_schema()='test'` inside the transaction
 * (so it sees the *actual* connection Kysely is about to use, not just
 * pool config). Any mismatch throws and aborts BEFORE the test body runs.
 */
export async function withTestTx<T>(
  fn: (db: Transaction<Database>) => Promise<T>,
): Promise<T> {
  let captured: T | undefined
  let captureError: unknown
  try {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const probe = await sql<{
          current_schema: string | null
        }>`select current_schema() as current_schema`.execute(trx)
        const active = probe.rows[0]?.current_schema
        if (active !== TEST_SCHEMA) {
          throw new Error(
            `[withTestTx] aborting — current_schema() returned "${active}" ` +
              `but tests REQUIRE "${TEST_SCHEMA}". This guard exists to make ` +
              `sure no test ever touches the dev \`public\` schema.`,
          )
        }

        try {
          captured = await fn(trx)
        } catch (err) {
          captureError = err
        }
        // Always abort the transaction — even on success, so DB state is
        // unchanged after the test.
        throw ROLLBACK
      })
  } catch (err) {
    if (err !== ROLLBACK) throw err
  }
  if (captureError) throw captureError
  return captured as T
}

export { TEST_SCHEMA }
