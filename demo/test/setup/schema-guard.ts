// CENTRAL SAFETY MODULE — every test connection MUST go through here.
//
// Three layers of defense to make sure tests can never read or mutate the
// `public` schema (which is dev's seeded data):
//
//   1. URL guard: refuse to start if DATABASE_URL_TEST is missing, or if it
//      is byte-identical to DATABASE_URL (common foot-gun when someone copies
//      the dev URL into .env.test).
//   2. Connection guard: every pg.Pool we hand back is constructed with
//      options=`-c search_path=test` AND verified via current_schema()='test'
//      on its first checkout.
//   3. Pre-DDL guard: the globalSetup re-asserts current_schema()='test'
//      immediately before AND after the destructive DROP/CREATE SCHEMA.

import pg from 'pg'

export const TEST_SCHEMA = 'test'

const REQUIRED_SCHEMA_OPTIONS = `-c search_path=${TEST_SCHEMA}`

export function getTestDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_TEST
  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Tests must NEVER reuse DATABASE_URL ' +
        '(which points at the dev `public` schema). Set DATABASE_URL_TEST ' +
        'to a Postgres URL that targets the same database; the test harness ' +
        'will isolate everything inside the `test` schema.',
    )
  }
  if (process.env.DATABASE_URL && url === process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL_TEST is identical to DATABASE_URL. The schema guard ' +
        'would still force search_path=test, but keeping them distinct ' +
        'prevents accidentally pointing the test harness at a production ' +
        'host. Give DATABASE_URL_TEST its own connection string.',
    )
  }
  return url
}

export function makeTestPool(): pg.Pool {
  const pool = new pg.Pool({
    connectionString: getTestDatabaseUrl(),
    options: REQUIRED_SCHEMA_OPTIONS,
  })
  pool.on('error', (err) => {
    console.error('[test pool] unexpected error', err)
  })
  return pool
}

export async function assertActiveSchemaIsTest(
  client: pg.PoolClient | pg.Client,
  context: string,
): Promise<void> {
  const result = await client.query<{ current_schema: string | null }>(
    'select current_schema() as current_schema',
  )
  const active = result.rows[0]?.current_schema
  if (active !== TEST_SCHEMA) {
    throw new Error(
      `[schema-guard] aborting — current_schema() returned "${active}" ` +
        `but tests REQUIRE "${TEST_SCHEMA}" (context: ${context}). ` +
        `This guard exists to make sure no test ever touches the dev ` +
        `\`public\` schema. Investigate the connection wiring before ` +
        `disabling this check.`,
    )
  }
}

export async function withGuardedClient<T>(
  pool: pg.Pool,
  context: string,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await assertActiveSchemaIsTest(client, context)
    return await fn(client)
  } finally {
    client.release()
  }
}
