---
type: todo
status: pending
description: Add Postgres service to docker-compose and finish one-line setup docs
---
# Docker Compose Setup

## Problem

The Nuxt `app`/`dev` services and multi-stage Dockerfile are in place, but the compose file is still single-service. [[../../adr/005-DB_TOOLING]] commits us to Postgres as a second compose service, and the "one-line setup" MVP promise isn't yet documented anywhere a reviewer would land.

## Already done

- Multi-stage Dockerfile (`deps` → `build` → `runtime`, plus `dev`) at `demo/Dockerfile`
- `app` service (production runtime) and `dev` profile (hot reload via bind-mount) in `docker-compose.yml`
- `PORT` env override wired through to both services
- `Makefile` with `make dev` / `make build` targets

## Remaining

- **`db` service** for Postgres in `docker-compose.yml`
  - Pinned image (e.g. `postgres:16-alpine`)
  - Named volume for data persistence across `docker compose down`
  - Healthcheck so `app`/`dev` can `depends_on: { db: { condition: service_healthy } }`
  - Credentials + db name sourced from env, with defaults matching `kysely.config.ts`'s fallback (`postgres`/`postgres`/`nextrade`)
- **`DATABASE_URL` wiring** into `app` and `dev` services so Kysely connects via compose DNS (`db:5432`), not `localhost`
- **`.env.example`** extended with the Postgres variables
- **One-line setup doc** in a root-level README (doesn't exist yet) — `docker compose up` for production-like, `make dev` for hot reload

## Related

- [[../../adr/004-DOCKER_COMPOSE]]
- [[../../adr/005-DB_TOOLING]]
- [[DB_MIGRATIONS]]
