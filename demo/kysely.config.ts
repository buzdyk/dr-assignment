import { PostgresDialect } from 'kysely'
import { defineConfig } from 'kysely-ctl'
import pg from 'pg'

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ??
        'postgres://postgres:postgres@localhost:5432/nextrade',
    }),
  }),
  migrations: {
    migrationFolder: 'db/migrations',
  },
  seeds: {
    seedFolder: 'db/seeds',
  },
})
