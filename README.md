# Diverted River assignment

A working prototype of an "AI Reporting Assistant" for the NexTrade vendor portal: a vendor types a plain-English question ("top five items last month"), and the chat replies with a summary plus a chart, backed by the vendor's own Postgres data. Stack is Nuxt + Postgres with BYOK Claude.

The brief lives in [`docs/artefacts/friday_vendor_call_email.md`](./docs/artefacts/friday_vendor_call_email.md) and the kickoff transcript in [`docs/artefacts/kickoff_audio_sync.md`](./docs/artefacts/kickoff_audio_sync.md).

## Setup

Docker is the only host dependency.

> [!IMPORTANT]
> **`ANTHROPIC_API_KEY` is a prerequisite.** Copy `.env.example` → `.env` and set `ANTHROPIC_API_KEY=sk-ant-...` **before** `make up` / `make dev` / `docker compose up`. Without it the UI loads but every chat message fails. `AI_PROVIDER=robot` is an offline stub that needs no key — useful for demos and tests.

```bash
cp .env.example .env        # then edit to add ANTHROPIC_API_KEY
docker compose up           # production-like build on http://localhost:3455
make dev                    # hot-reload dev profile (same port)
```

Other `.env` values (port, Postgres credentials, `AI_PROVIDER`) have working defaults.

Services:

- `app` / `dev` — Nuxt, published on `${PORT:-3455}`
- `db` — Postgres 16, **not exposed to the host**; reachable from other services via `db:5432` and the `DATABASE_URL` env var. Data persists in the `db-data` named volume.

Database migrations and seeds are run from inside the `demo` workspace — see [`demo/README.md`](./demo/README.md#database-migrations).

## The project is the docs

Specs come before code; docs are the source of truth. Start in [`docs/README.md`](./docs/README.md) for the full layout and conventions. Wiki-link navigation assumes [SilverBullet](https://silverbullet.md) / Obsidian semantics, but everything renders fine on GitHub too.

### Notable areas

- [`docs/adr/`](./docs/adr/ADR.md) — architectural decisions with the reasoning behind them. ADR-008 (text-to-SQL vs. predefined tools) and ADR-007 (chart library) are the two choices most worth scrutinizing.
- [`docs/todos/completed/`](./docs/todos/completed/COMPLETED.md) — **what was delivered**, one file per shipped piece of work. Each file has a "What Was Done" section.
- [`docs/todos/icebox/`](./docs/todos/icebox/ICEBOX.md) — **what was deferred, and why**. The icebox is an explicit register of scope that was considered and consciously cut, each with a `reason:` in frontmatter. Read this to see the PoC-vs-product line: CI, observability, prompt-injection hardening, multi-hop tool loop, raw-data view, self-hosted model provider, etc.
- [`docs/devlog/`](./docs/devlog/DEVLOG.md) — daily entries, auto-populated by a post-commit hook from that day's commits. The [latest entry](./docs/devlog/2026/04_APR/24.md) is the densest summary of delivered work.
- [`docs/artefacts/`](./docs/artefacts/) — the source material: kickoff transcript, Kevin's email, brand style guide, DB schema diagram.
- [`docs/reading/`](./docs/reading/READING.md) — research notes feeding the ADRs (Claude capabilities, JS DB tooling, hallucination mitigations).
- [`docs/GLOSSARY.md`](./docs/GLOSSARY.md) — shared vocabulary.

## Code tour

All app code lives in [`demo/`](./demo/). The interesting parts:

- [`demo/server/api/chat.post.ts`](./demo/server/api/chat.post.ts) — SSE chat endpoint, vendor-scoped.
- [`demo/server/ai/`](./demo/server/ai/) — the orchestration: `runner.ts` (pick → execute → summarize loop), `executor.ts` (tool runner), `providers/` (Claude + a deterministic `Robot` mock provider for tests), `tools/` (predefined query tools and `list_capabilities`), `system-prompt.ts`.
- [`demo/app/pages/chat.vue`](./demo/app/pages/chat.vue) and [`demo/app/components/chat/`](./demo/app/components/chat/) — chat UI: per-vendor windows, SSE consumer, expandable tool cards, inline charts, markdown rendering.
- [`demo/db/`](./demo/db/) — Kysely migrations, seeds (deterministic via pinned faker seed), and the hand-maintained `Database` TS interface.
- [`demo/test/`](./demo/test/) — backend tests. Uses an isolated `test` Postgres schema with triple-checked guards against touching prod data; see [`BACKEND_TESTS`](./docs/todos/completed/BACKEND_TESTS.md).
