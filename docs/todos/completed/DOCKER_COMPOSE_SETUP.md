---
type: todo
status: done
description: Add Postgres service to docker-compose and finish one-line setup docs
---
# Docker Compose Setup

## Problem

The Nuxt `app`/`dev` services and multi-stage Dockerfile were in place, but the compose file was still single-service. [[../../adr/005-DB_TOOLING]] commits us to Postgres as a second compose service, and the "one-line setup" MVP promise wasn't documented anywhere a reviewer would land.

## What was done

- **`db` service** added to `docker-compose.yml`: `postgres:16-alpine`, named `db-data` volume, `pg_isready` healthcheck. Not published to the host — only reachable from other services over the compose network.
- **Credentials** (`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`) pulled from env with defaults matching `kysely.config.ts`'s fallback (`postgres`/`postgres`/`nextrade`).
- **`DATABASE_URL`** wired into `app` and `dev` services pointing at `db:5432` via compose DNS.
- **`depends_on`** with `condition: service_healthy` so the app waits for Postgres to accept connections.
- **`.env.example`** extended with the Postgres block.
- **Root `README.md`** created with the one-line setup (`docker compose up` / `make dev`).

## Previously done (earlier pass)

- Multi-stage Dockerfile (`deps` → `build` → `runtime`, plus `dev`) at `demo/Dockerfile`
- `app` service (production runtime) and `dev` profile (hot reload via bind-mount)
- `PORT` env override wired through to both services
- `Makefile` with `make dev` / `make build` targets

## Related

- [[../../adr/004-DOCKER_COMPOSE]]
- [[../../adr/005-DB_TOOLING]]
- [[DB_MIGRATIONS]]
