---
type: todo
status: pending
description: Build + push the runtime and migrate images to GHCR; add docker-compose.prod.yml that pulls them instead of building locally
---
# GHCR Images + Prod Compose

Part of [[../DEPLOYMENT]].

## Problem

The existing `demo/Dockerfile` builds the runtime image locally (`docker compose build app`). On the server we don't want a source checkout — the VM should `docker compose pull` pre-built images and start. Two images needed: the runtime (app) and a migrate/seed image that has `db/`, `kysely.config.ts`, and dev dependencies (for `kysely-ctl`).

## Approach

### Dockerfile — add a `migrate` stage

The current runtime stage only copies `.output/`, so it can't run migrations. Add a sibling stage:

```dockerfile
FROM deps AS migrate
ENV NODE_ENV=production
COPY db ./db
COPY kysely.config.ts ./
# keep dev deps from `deps` stage so kysely-ctl is available
CMD ["npm", "run", "db:migrate"]
```

Nothing in the existing `runtime`, `dev`, or `build` stages needs to change. The `deps` stage already has `node_modules` with dev deps — migrate just copies the DB assets in on top.

### Manual build + push (first deploy)

```bash
# from demo/
IMAGE=ghcr.io/buzdyk/dr-assignment
TAG=$(git rev-parse --short HEAD)

docker buildx build --target runtime -t $IMAGE:$TAG -t $IMAGE:latest --push .
docker buildx build --target migrate -t $IMAGE-migrate:$TAG -t $IMAGE-migrate:latest --push .
```

Prereq: `docker login ghcr.io -u buzdyk` with a PAT that has `write:packages`. Done once per machine.

**Visibility: public.** After the first push, flip each package to public in GHCR's UI (`Package settings → Change visibility → Public`). That removes any credential surface from the VM — cloud-init can `docker compose pull` without a registry login.

### `docker-compose.prod.yml` (at `deploy/docker-compose.prod.yml`)

Override of the existing root-level `docker-compose.yml` for production. Dropped on the VM by cloud-init as `/opt/app/docker-compose.yml` (no build context exists on the host, so this file can't `extends:` — it's standalone).

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  app:
    image: ${APP_IMAGE}
    environment:
      NITRO_PORT: 3455
      NITRO_HOST: 0.0.0.0
      DATABASE_URL: ${DATABASE_URL}
      AI_PROVIDER: claude
    depends_on:
      db: { condition: service_healthy }
    restart: unless-stopped

  migrate:
    image: ${MIGRATE_IMAGE}
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      db: { condition: service_healthy }
    profiles: ["oneoff"]

  seed:
    image: ${MIGRATE_IMAGE}
    command: ["npm", "run", "db:seed"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      db: { condition: service_healthy }
    profiles: ["oneoff"]

  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    environment:
      DOMAIN: ${DOMAIN}
    volumes:
      - /opt/app/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on: [app]
    restart: unless-stopped

volumes:
  db-data:
  caddy-data:
  caddy-config:
```

`profiles: ["oneoff"]` keeps migrate/seed from coming up on `docker compose up -d` — they're only executed explicitly via `docker compose run --rm migrate` in [[02-CLOUD_INIT]].

`ANTHROPIC_API_KEY` is passed through from `.env`, sourced from the required `anthropic_api_key` in `terraform.tfvars`. See [[../../../adr/010-BAKED_CLAUDE_KEY]] (supersedes [[../../../adr/002-BYOK_CLAUDE]]).

## Notes

- **Tag strategy.** Push both `:latest` and `:<short-sha>` on every build. `:latest` is what the VM tracks; `:<sha>` is how you roll back (`APP_IMAGE=…:<sha>` in `.env` + `docker compose up -d`).
- **Image size.** The migrate image carries dev deps and `db/` — ~300 MB. Fine. Not worth optimizing until CI exists.
- **Architecture.** OVH `b2-7` is x86_64. Build single-arch (`--platform linux/amd64`) to skip buildx multi-platform overhead. If you're on Apple Silicon, this matters — `docker build` without `--platform` produces arm64 which will `exec format error` on the VM.

## Related

- [[02-CLOUD_INIT]] — consumes these images.
- [[../../completed/DB_MIGRATIONS]] / [[../../completed/DB_SEEDS]] — the commands the migrate image wraps.
- [[../../icebox/CI_GITHUB_ACTIONS]] — where the manual build + push should eventually live.
