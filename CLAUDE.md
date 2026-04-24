# CLAUDE.md

Entry point: **[`docs/README.md`](./docs/README.md)**. It covers the directory layout, naming rules, frontmatter schema, cross-reference conventions, and how the generated indexes / devlog / ADRs work.

The project is the docs. Specs come before code; docs are the source of truth and kept tidy. Before making non-trivial changes, read the relevant ADR / todo / reading note.

## Quick map

- [`docs/adr/`](./docs/adr/ADR.md) — architectural decisions (append-only, numbered)
- [`docs/todos/`](./docs/todos/index.md) — `active/`, `backlog/`, `completed/`, `icebox/`; index tables are **generated** from frontmatter by `scripts/todos-index` (pre-commit hook) — don't edit the generated blocks by hand
- [`docs/devlog/`](./docs/devlog/DEVLOG.md) — daily entries, populated by a post-commit hook from that day's commits
- [`docs/artefacts/`](./docs/artefacts/) — kickoff transcript, brief, style guide, schema diagram
- [`docs/reading/`](./docs/reading/READING.md) — research notes backing the ADRs
- [`demo/`](./demo/) — Nuxt app (server + UI + db + tests); see [`demo/README.md`](./demo/README.md) for migrations and seeds

## House rules

- Obey the conventions in [`docs/README.md`](./docs/README.md) — file naming, frontmatter fields, wiki-link style (no `.md` in link targets), ADR append-only, "What Was Done" sections on completed todos.
- Don't run `scripts/todos-index` manually unless asked. The pre-commit hook regenerates it.
- When deferring scope, add an icebox todo with a `reason:` in frontmatter — don't silently drop it.
- Every DB schema change must also be mirrored in `demo/db/types.ts`.
