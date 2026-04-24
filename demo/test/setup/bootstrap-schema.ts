import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Kysely, Migrator, FileMigrationProvider, PostgresDialect } from 'kysely'
import {
  TEST_SCHEMA,
  assertActiveSchemaIsTest,
  makeTestPool,
} from './schema-guard'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(HERE, '..', '..')
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'db', 'migrations')
const SEEDS_DIR = path.join(REPO_ROOT, 'db', 'seeds')

/**
 * Drops and recreates the `test` schema, then runs migrations + seeders
 * against it. Triple-guards before any destructive op.
 *
 * Safe to call from both vitest globalSetup and any per-suite hook that
 * needs a fresh seeded baseline (HTTP tests do too, since their requests
 * eventually hit useDb()).
 */
export async function bootstrapTestSchema(): Promise<void> {
  const pool = makeTestPool()
  try {
    const client = await pool.connect()
    try {
      // Bootstrap: the test schema may not exist yet on first run, in which
      // case `current_schema()` returns NULL even though our search_path is
      // `test`. Create the schema first (idempotent), THEN we can guard.
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${TEST_SCHEMA}`)

      // GUARD #1: confirm `options=-c search_path=test` actually took effect.
      await assertActiveSchemaIsTest(client, 'bootstrap before DROP')

      // Destructive: wipe and recreate the test schema. Guard above ensures
      // we are operating in `test`, not `public`.
      await client.query(`DROP SCHEMA ${TEST_SCHEMA} CASCADE`)
      await client.query(`CREATE SCHEMA ${TEST_SCHEMA}`)

      // GUARD #2: re-confirm after recreating the schema.
      await assertActiveSchemaIsTest(client, 'bootstrap after CREATE')
    } finally {
      client.release()
    }

    const db = new Kysely<unknown>({
      dialect: new PostgresDialect({ pool }),
    })
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: MIGRATIONS_DIR,
      }),
      migrationTableSchema: TEST_SCHEMA,
    })

    const { error: migrationError, results } = await migrator.migrateToLatest()
    if (migrationError) {
      throw new Error(
        `[bootstrap] migrations failed: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`,
      )
    }
    const migrated = results?.filter((r) => r.status === 'Success') ?? []
    console.log(
      `[bootstrap] migrations applied to "${TEST_SCHEMA}": ${migrated.length}`,
    )

    const seedFiles = (await fs.readdir(SEEDS_DIR))
      .filter((f) => f.endsWith('.ts'))
      .sort()
    for (const file of seedFiles) {
      const url = new URL(`file://${path.join(SEEDS_DIR, file)}`)
      const mod = (await import(url.href)) as {
        seed: (db: Kysely<unknown>) => Promise<void>
      }
      await mod.seed(db)
    }
    console.log(
      `[bootstrap] seeded "${TEST_SCHEMA}" with ${seedFiles.length} seed files`,
    )

    // GUARD #3: sanity check via Kysely.
    const result = await db
      .selectFrom('vendors' as never)
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst()
    const count = result ? Number((result as { count: number }).count) : 0
    if (count === 0) {
      throw new Error(
        '[bootstrap] no rows in vendors after seeding — seeders likely targeted the wrong schema.',
      )
    }

    // db.destroy() already ends the underlying pool — no separate pool.end() needed.
    await db.destroy()
  } catch (err) {
    // Best-effort: if we never got to db.destroy, make sure the pool is gone.
    try {
      await pool.end()
    } catch {
      // ignore double-end errors during the catch path
    }
    throw err
  }
}

/**
 * Build the search-path-qualified DATABASE_URL the app should use when
 * running against the test schema. Suitable for `process.env.DATABASE_URL`
 * before booting Nuxt for HTTP tests.
 */
export function buildTestSchemaDatabaseUrl(): string {
  const base = process.env.DATABASE_URL_TEST
  if (!base) {
    throw new Error('DATABASE_URL_TEST is not set')
  }
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}options=${encodeURIComponent(`-c search_path=${TEST_SCHEMA}`)}`
}
