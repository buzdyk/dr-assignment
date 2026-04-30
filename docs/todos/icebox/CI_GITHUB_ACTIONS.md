---
type: todo
status: icebox
description: Run the Vitest unit + HTTP suites on every push and pull request via GitHub Actions, with a Postgres service container
reason: PoC is local-only by design; CI plumbing is busywork until there's a collaboration model (external contributors, more than a couple of people, or a "broke main without noticing" incident) that actually needs the safety net
---
# Tests on GitHub Actions

## Problem

The test suite added in [[../completed/BACKEND_TESTS]] runs only on demand inside the dev container (`make test`). Nothing prevents a regression from landing in `main` short of someone remembering to run the suite before pushing. Fine for a single-author PoC; not fine the moment a second contributor (human or agent) starts pushing.

A CI gate would also catch the long tail of environment-specific issues — Node version drift, lock-file misalignment, Postgres-version-specific SQL — that the local Docker setup masks.

## Approach

Single workflow, two jobs (or one job with two steps if startup cost is dominated by setup):

- **`unit`** — Node 24 LTS, install deps with `npm ci`, run `npm run test:unit` against a Postgres service container. Cheap, ~5–10 s of test runtime once Postgres is up.
- **`http`** — same setup but runs `npm run test:http`. Slower because each suite does a fresh Nuxt prod build (~10 s/file × 2 files); cache `.output/` and `node_modules/.cache/nuxt` between runs.

Service container shape:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nextrade
    options: >-
      --health-cmd pg_isready
      --health-interval 5s
      --health-timeout 5s
      --health-retries 10
    ports: ['5432:5432']
```

Schema isolation is already in place — set `DATABASE_URL_TEST=postgres://postgres:postgres@localhost:5432/nextrade` in the job env and the existing globalSetup creates the `test` schema cleanly. The dev `public` schema doesn't exist on the CI container, so the schema-guard's "never touch public" property is also CI-friendly: no public state to leak into.

Triggers: `pull_request` against any branch, `push` to `main`. No deploy step — the workflow's only output is a green check or a red failure annotated against the failing test file.

## Out of scope

- **Build / deploy pipeline.** This todo is test gating only. Anything beyond `npm test` is a separate item.
- **Browser / E2E tests.** Backend tests cover the SSE contract; UI screenshots and Playwright runs aren't worth CI minutes for a PoC.
- **Lint / typecheck job.** If/when stricter formatting lands in the project, that's its own workflow.
- **Caching beyond the obvious.** Use `actions/setup-node` cache for `node_modules` and a manual cache step for the Nuxt build output. Nothing exotic.

## Triggers to thaw

- A second person (human or agent) starts merging into `main`.
- A regression makes it past local testing and into a published commit.
- We start running the demo against a real shared environment where "main is broken" has user-visible cost.
