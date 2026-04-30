---
type: todo
status: done
description: First backend test pass — runner, DB-isolation strategy, mock provider, and a concrete coverage target across tools, runner, and SSE route
---
# Backend Tests

## Problem

The backend has zero automated tests. Everything we ship — provider switching, tool dispatch, SSE framing, vendor scoping, date defaulting — is currently verified by clicking around in the chat UI with a real Claude key. That's fine for a PoC but blocks every refactor and lets regressions slip in (the date-anchor bug shipped silently for one).

The provider split landed in [[../completed/SSE_AI_ENDPOINT]] / [[../completed/CLAUDE_PROVIDER_ADAPT]] gives us most of what's needed for testable AI code: routes depend on `AIProvider` (`pickTools` + `summarize`), not the Anthropic SDK. The Robot stub already serves as a deterministic provider for demos. So the testing question now is mostly: pick a runner, pick a DB-isolation strategy, decide on a per-test mock mechanism, and write the first batch.

## Approach

### Decisions

- **Runner — split.** `@nuxt/test-utils` for the SSE route and the two debug endpoints (it boots Nitro and gives `$fetch` against real handlers). Bare Vitest for tool units, runner logic, and `resolveDateRange`. Two Vitest configs sharing one node_modules.

- **DB isolation — Postgres `test` schema, transaction-per-test.** Same dev Postgres container, separate `test` schema so dev's `public` schema stays pristine.
  - **globalSetup** (runs once per Vitest invocation): connect with `search_path=test`, `DROP SCHEMA IF EXISTS test CASCADE; CREATE SCHEMA test;`, run all Kysely migrations against that connection (they create unqualified tables → land in `test`), run seeders.
  - **Per-test**: open a transaction on a connection bound to `search_path=test`, hand the transaction-scoped Kysely as `ToolContext.db`, roll back in `afterEach`. Pristine baseline + zero cross-test bleed, no truncate/reseed cost.
  - Connection-side `search_path` is set via `pg.Pool({ options: '-c search_path=test' })` (or a `?options=...` query param on `DATABASE_URL_TEST`).

- **Mock provider — new `createScriptedProvider({ pick, summary })`.** Takes an explicit `PickResult` and an array of summary chunks. ~30 lines. Robot stays the "demo bot" with its own regex-script matcher; tests get a no-magic mock.

- **Date anchoring — frozen clock.** `vi.useFakeTimers()` + `vi.setSystemTime(...)` per test. No changes to seeders or `resolveDateRange`. Plays well with the "Today's date" line in the system prompt.

### Test surface (first pass)

- **Tool units** (one file per tool, against a transactional DB):
  - `get_top_n_products`: vendor scoping (Supplier 1 ≠ Supplier 2 results), date defaulting (omit args → 30-day window), `metric` switch (revenue vs quantity), zero-row handling, cancelled-orders exclusion, `n` bounds (1, 50).
  - `get_sales_trend`: granularity bucketing (`day` / `week` / `month`), zero-row handling, vendor scoping.
  - `get_category_breakdown`, `get_revenue_by_region`, `get_order_status_mix`: same shape — defaults, scoping, zero-row.
  - `list_capabilities`: stays in sync with `toolRegistry` (snapshot-style — fail loudly when a tool is added without considering the meta tool).
  - `resolveDateRange` direct unit tests — invalid dates, start > end, defaulting math.
- **Runner** (`runChat` directly, scripted provider):
  - `picked.kind === 'text'` → emits `text` + `done`, no tool dispatch.
  - `picked.kind === 'tools'` → emits `tool_start` + `tool_result` per call, then summary `text` chunks, then `done`.
  - Tool dispatch error → envelope marks `is_error: true`, summary still runs.
  - Provider throws `ProviderError` → emits `error` event, no `done`.
- **SSE route** (`@nuxt/test-utils`, scripted provider injected via the existing `debug: true` seam or a test-only env hook):
  - Happy path: full event sequence in order, `data` payloads parse as JSON.
  - Validation: missing `prompt`, non-UUID `vendor_id`, unknown vendor → 400/404 shapes.
  - Provider boot failure (no `ANTHROPIC_API_KEY`) → 502 with `provider_error`.
  - Mid-stream provider error → SSE `error` event, stream closes cleanly.
- **Debug endpoints**: `/api/debug/tools` returns the registry; `/api/debug/tool` dispatches by name and surfaces tool errors.

### What gets wired up

- `demo/test/` directory; one Vitest config for unit tests, one Nuxt-aware config for HTTP tests.
- `demo/test/setup/global.ts` — Vitest globalSetup that drops + recreates the `test` schema and runs migrations + seeders against it.
- `demo/test/helpers/db.ts` — opens a transaction on a `test`-schema-bound connection, hands the inner Kysely to the test, rolls back in `afterEach`.
- `demo/test/helpers/scripted-provider.ts` — the new `createScriptedProvider`.
- `DATABASE_URL_TEST` env var (or derived from `DATABASE_URL` + `?options=-csearch_path%3Dtest`) used only by the test runner.
- `make test` target wrapping `docker compose exec dev npm test` so the suite always runs against the dev container's Postgres.

## Out of scope

- **CI pipeline.** Out of scope for this todo, period — green-locally is the bar; any later CI work is a separate item.
- **`claude.ts` provider.** Not under test. Live Anthropic calls are non-deterministic and cost money; mocking `@anthropic-ai/sdk` at the module boundary is hairy and would test the mock more than the provider. The scripted provider exercises the runner-side contract; the Claude implementation is verified manually in the chat UI.
- **Frontend / Vue component tests** (chat.vue, ToolCard, ResultChart). Backend-only for this pass.
- **E2E browser tests** (Playwright / Cypress). The HTTP-level SSE tests cover most of the UI's contract.
- **Load, fuzz, or mutation testing.**
