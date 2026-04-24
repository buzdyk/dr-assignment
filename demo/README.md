# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Database migrations

Postgres schema is managed with [Kysely](https://kysely.dev/) + [`kysely-ctl`](https://github.com/kysely-org/kysely-ctl). Config lives in `kysely.config.ts`; migrations in `db/migrations/`; the hand-maintained `Database` TS interface in `db/types.ts`.

Set `DATABASE_URL` (defaults to `postgres://postgres:postgres@localhost:5432/nextrade`), then:

```bash
npm run db:migrate           # apply all pending migrations
npm run db:migrate:list      # show completed + pending
npm run db:migrate:down      # rollback the last migration
npm run db:migrate:make <name>  # scaffold a new migration
```

Every schema change must also be mirrored in `db/types.ts`.

## Seed data

Demo seed data lives in `db/seeds/` and is typed against the `Database` interface. Tunable constants (vendor UUIDs, day range, cancellation rate, faker seed) are centralised in `db/seed-data.ts`. Runs are deterministic via a pinned faker seed.

```bash
npm run db:seed     # truncate + reseed (idempotent)
npm run db:reset    # rollback all migrations + re-migrate + reseed
```

The first seed file truncates all tables, so re-running `db:seed` is safe.
