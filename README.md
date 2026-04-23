# Diverted River assignment

Nuxt app with a BYOK Claude integration over Postgres. The project is the docs — start in [`docs/`](./docs/README.md).

## Setup

Docker is the only host dependency.

```bash
docker compose up           # production-like build on http://localhost:3455
make dev                    # hot-reload dev profile (same port)
```

Compose defaults work with no `.env` file; copy `.env.example` to `.env` to override the port or Postgres credentials.

Services:

- `app` / `dev` — Nuxt, published on `${PORT:-3455}`
- `db` — Postgres 16, **not exposed to the host**; reachable from other services via `db:5432` and the `DATABASE_URL` env var. Data persists in the `db-data` named volume.

Database migrations are run from inside the `demo` workspace — see [`demo/README.md`](./demo/README.md#database-migrations).
