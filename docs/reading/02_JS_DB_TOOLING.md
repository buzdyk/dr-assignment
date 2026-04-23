---
type: reading
date: 2026-04-23
---
# JS/Node DB tooling: what covers what

Reference matrix and per-tool notes for picking TypeScript/Node database tooling across three concerns: **data access** (querying), **migrations** (schema evolution), and **seeders** (demo/test data).

Scope: TS/Node backends against a relational database (Postgres / MySQL / SQLite). Document stores and ODMs (Mongoose etc.) are out of scope.

---

## Feature matrix

| Tool | Data access | Migrations | Seeders | Schema lives in | TS DX |
|---|---|---|---|---|---|
| **Drizzle** | Query builder + relational helper | `drizzle-kit` — bundled | None; custom scripts | TS files | Excellent |
| **Prisma** | Typed generated client | `prisma migrate` — bundled | `prisma db seed` hook (runs any script) | `schema.prisma` DSL | Excellent |
| **Kysely** | Query builder (pure) | No bundled migrator; `@kysely/kysely-ctl` or community CLIs | None; custom scripts | Hand-written or codegen'd `Database` interface | Excellent |
| **MikroORM** | ORM (Data Mapper) | `@mikro-orm/migrations` — bundled | `@mikro-orm/seeder` — bundled | Entity classes (decorators) | Good |
| **TypeORM** | ORM (AR or DM modes) | TypeORM CLI — bundled | No first-party seeder; community libs | Entity classes (decorators) | OK |
| **Sequelize** | ORM (Active Record) | `sequelize-cli` — bundled | `sequelize-cli db:seed` — bundled | Model classes | Weak |
| **Knex** | Query builder (dynamic) | `knex migrate` — bundled | `knex seed` — bundled | None (you type results yourself) | Weak |

Quick reads from the matrix:

- **All-in-one:** Prisma, MikroORM, Sequelize, Knex — every concern bundled.
- **Assemble-the-stack:** Drizzle or Kysely — query layer only; pair with a separate migrator and hand-rolled seed scripts.
- **No seeder out of the box:** Drizzle, Kysely, TypeORM (first-party). Everyone else ships one.
- **Schema-as-code:** Drizzle (TS), Prisma (DSL), MikroORM / TypeORM (decorators on classes).
- **No schema at all:** Kysely (interface-only), Knex (runtime strings).

---

## Per-tool notes

### Drizzle

- Query builder surface with a light relational helper: `db.query.users.findFirst({ with: { orders: true } })`.
- Schema declared in `.ts` files — column types flow into query result types without codegen.
- **Migrations:** `drizzle-kit generate` diffs the TS schema against the migrations folder and emits SQL; `drizzle-kit migrate` applies them; `drizzle-kit push` is a dev-only schema sync.
- **Seeders:** none bundled. Convention is `db/seeds/*.ts` run via an `npm run db:seed` script.
- Lightweight runtime: no binary engine, no generated client.

### Prisma

- Schema-first. You write `schema.prisma` (DSL), run `prisma generate`, and import a typed client.
- **Migrations:** `prisma migrate dev` (creates + applies + regenerates client) and `prisma migrate deploy` for prod. Migrations stored as SQL plus metadata.
- **Seeders:** `prisma db seed` hooks into a `seed` script path you declare in `package.json`. The script itself is yours to write — Prisma just invokes it at the right times (e.g. after `migrate reset`).
- Biggest footprint of the bunch: DSL + codegen step + Rust query engine binary at runtime. DX is excellent; weight is real.

### Kysely

- Pure query builder. No schema definition baked in — you define a `Database` TS interface (hand-written or generated via `kysely-codegen`) and Kysely infers everything from there.
- **Migrations:** no bundled CLI; `@kysely/kysely-ctl` is the official-ish newer CLI (migrate + seed commands). Community predecessors like `kysely-migration-cli` are still around.
- **Seeders:** same story — scaffolded by kysely-ctl if you use it; otherwise custom scripts.
- Best TS inference in the ecosystem for handwritten queries.

### MikroORM

- Data Mapper ORM with Unit of Work. Mutate entities, call `em.flush()`, one transaction.
- **Migrations:** `@mikro-orm/migrations` generates migrations by diffing entity decorators against the DB.
- **Seeders:** `@mikro-orm/seeder` provides a `Seeder` base class and factory helpers; pairs well with faker.
- The only serious first-party DM option in TS right now.

### TypeORM

- Hybrid: entity classes support both Active Record (`user.save()`) and Data Mapper (`repo.save(user)`) styles on the same schema.
- **Migrations:** `typeorm migration:generate` / `migration:run` — generates migrations by diffing decorator metadata vs DB.
- **Seeders:** no first-party seeder. Community packages (`typeorm-seeding`, `typeorm-fixtures-cli`) exist but maintenance is uneven.
- Widely seen in existing codebases. Check recent commit activity on the repo before adopting fresh.

### Sequelize

- Classic Active Record ORM. `sequelize-cli` bundles migrations and seeders as first-class subcommands (`db:migrate`, `db:seed`).
- TS support layered on via `@types/sequelize` / `sequelize-typescript`; DX noticeably behind Drizzle / Prisma / Kysely.
- Solid battle-tested runtime; dated ergonomics.

### Knex

- Dynamic query builder. No schema, no inferred types — results get typed via generics you supply at call sites.
- **Migrations:** `knex migrate:make` + `knex migrate:latest` / `migrate:rollback`. Stable and minimal.
- **Seeders:** `knex seed:make` + `knex seed:run`.
- Still reasonable if you don't need inferred types in queries. Sometimes paired with Objection.js for a thin ORM layer on top.

---

## Standalone migration runners

If you want migrations decoupled from whichever query layer you're using:

| Tool | Shape | Notes |
|---|---|---|
| **node-pg-migrate** | JS or SQL files | Postgres-only; battle-tested; well-maintained |
| **Umzug** | Framework-agnostic engine | The engine under Sequelize/TypeORM CLIs; usable directly |
| **postgres-migrations** | Plain `.sql` files | Minimal runner; no config, no opinions |
| **graphile-migrate** | Dev-loop oriented | Shadow DB + hot reload; opinionated |
| **dbmate** | Go binary, polyglot | Language-agnostic; popular in mixed-stack teams |

Pair well with **Drizzle** (if you prefer bare SQL migrations over schema-diff) or **Kysely** (which expects BYO migrator).

---

## Seeding in practice

Seeding rarely needs a framework — the ingredients are usually:

1. **Fake-data generator:** `@faker-js/faker` is the canonical choice. Alternatives: `casual`, `chance.js`.
2. **Seed runner:** bundled (Prisma, MikroORM, Sequelize, Knex) or hand-rolled TS script invoked via `npm run db:seed`.
3. **Determinism:** pin a faker seed (`faker.seed(123)`) so repeated runs produce the same data — crucial for demos where "Supplier 1" and "Supplier 2" need stable IDs across machines.

Pattern that works with every stack in the matrix:

- One seed file per logical dataset (`seed-vendors.ts`, `seed-orders.ts`, `seed-cancellations.ts`).
- Idempotent inserts (`onConflict: doNothing` / delete-then-insert / truncate-and-insert).
- Load order fixed in an `npm` script: `run-s seed:vendors seed:orders seed:cancellations`.

---

## Further reading

- Each tool's own docs — especially the "migrations" and "getting started" pages, which are where the bundled-vs-BYO story is most visible.
- `@faker-js/faker` API reference if you end up writing seeders by hand.
- Fowler, *Patterns of Enterprise Application Architecture* — background on why these tools split into ORM vs query-builder camps.
