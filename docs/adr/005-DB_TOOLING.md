---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-005: Database tooling — Kysely + kysely-ctl

## Status
Accepted

## Context

The project runs on Postgres (see [[004-DOCKER_COMPOSE]]) against the NexTrade relational schema provided in the artefacts. From the data layer we need three things:

1. **Migrations** — schema evolution checked into git, reproducible on a fresh clone.
2. **Seeders** — deterministic demo data, minimally two mock suppliers to exercise tenant isolation as flagged in [[../artefacts/kickoff_audio_sync]].
3. **Query layer** — typed access to the schema from Nuxt server routes.

Active-Record-with-models ORMs have no TS-first, well-maintained, Nuxt-friendly counterpart in 2026. The ecosystem has converged on Data Mapper / query-builder styles.

## Decision

- **Query layer:** [Kysely](https://kysely.dev/).
- **Migrations + seeders:** [`kysely-ctl`](https://github.com/kysely-org/kysely-ctl) (first-party CLI that wraps Kysely's built-in `Migrator` plus a seeder runner).

## Why Kysely

**Motivation: the most lightweight option in the TS data-layer landscape.**

- No ORM, no codegen, no DSL, no binary engine — just a query builder and TS types.
- Minimal runtime footprint: Kysely + the Postgres driver is effectively the whole stack.
- Best TS inference in the ecosystem for handwritten queries — types flow through composition, inserts/updates/selects are distinctly typed via `Insertable<T>`, `Updateable<T>`, `Selectable<T>`.
- `kysely-ctl` keeps migrations and seeders in one first-party tool, with TS migration files and typed seed scripts using the same Kysely instance.
- Cheap to rip out: Kysely produces plain SQL, the schema lives in migration files — nothing locks us in.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Drizzle** | Close runner-up. Schema-as-TS + bundled `drizzle-kit` is ergonomic, but adds a schema layer and a diff-based migration flow on top of what Kysely does with less machinery. |
| **Prisma** | Schema DSL + generated client + Rust binary engine. Biggest feature set; heaviest footprint. Opposite of the lightweight motivation. |
| **MikroORM** | Data Mapper with Unit of Work — extra ceremony (EntityManager, identity map) for a prototype that doesn't need rich domain modelling. |
| **TypeORM** | Supports both active-record and data-mapper modes, but maintenance has been shaky for a long time and the TS DX trails Kysely. |
| **Sequelize** | Active-record classic; TS DX noticeably behind the modern pack. |
| **Knex** | Bundled migrations + seeders, but no typed queries — loses the main reason to be in TypeScript. |

## Consequences

- **The `Database` TS interface is hand-maintained** (or later generated via `kysely-codegen` against the live DB). Every schema change touches both a migration file and the interface type.
- **Active-Record muscle memory will not transfer directly.** There is no `user.save()` or `user.orders`. Every query is explicit: `db.selectFrom('vendors').where(...).execute()`.
- **No change tracking, no lifecycle hooks, no magic** — what you write is what runs.
- **Migrations are TS files** scaffolded by `kysely-ctl`, using Kysely's `Migrator` under the hood. Up/down functions called through the CLI.
- **Seeders are typed TS scripts** — `Insertable<DB['table']>` types catch column mistakes at compile time. Pair with `@faker-js/faker` for volume, pin a faker seed for deterministic demo data.
- **Escape hatch for raw SQL** is Kysely's `sql` template tag, which embeds parameterized SQL cleanly — relevant to the forthcoming text-to-SQL tool layer.

## Related

- [[004-DOCKER_COMPOSE]] — Postgres will be a second service in the compose file.
- [[../artefacts/kickoff_audio_sync]] — source of the "two-supplier demo + tenant isolation" requirement that drives the seed scripts.
- [[../reading/02_JS_DB_TOOLING]] — broader tooling landscape this decision sits inside.
