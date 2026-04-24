---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-008: Text-to-SQL — AI ↔ data access approach

## Status
Accepted — predefined tools (Option B). Implemented in `demo/server/ai/tools/` and consumed via `pickTools` / `summarize` in the Claude provider.

## Context

Vendors ask plain-English questions ("top five items last month", "Tuesday vs Wednesday sales") and the AI needs to turn those into answers against the NexTrade schema. Two non-negotiables from [[../artefacts/kickoff_audio_sync]]:

- **Tenant isolation.** Dave: "the code itself has to block it." A vendor can never see another vendor's data.
- **No hallucination.** Dave: cancellation *reasons* aren't captured, so the AI can't invent them. More generally, the AI must be restricted to what the data layer actually exposes.

This ADR picks the shape of the AI↔data contract. [[005-DB_TOOLING]] covers the query layer (Kysely); this one covers how the LLM calls it.

## Options

### A. Raw text-to-SQL (AI generates SQL strings)

- AI given the schema in its system prompt and a `run_sql` tool.
- AI writes the SQL, server executes it with a `WHERE vendor_id = ...` guard (or Postgres row-level security) to enforce isolation.

Trade-offs:
- **Flexibility:** highest — any question expressible in SQL.
- **Determinism:** lowest — the model can emit subtly wrong SQL (wrong aggregation, wrong join, miscounted nulls) and we wouldn't know.
- **Attack surface:** wide — even a SELECT-only wrapper lets the model construct expensive or misleading queries.
- **Dev cost:** cheap upfront, expensive to debug when answers are wrong.

### B. Predefined query tools (AI picks from a menu)

- Fixed set of typed tools the AI can call, e.g.:
  - `get_top_n_products(n, metric, time_range)`
  - `get_sales_trend(time_range, granularity)`
  - `get_category_breakdown(time_range)`
  - `compare_days(day_a, day_b, metric)` — for the "Tuesday vs Wednesday" case
  - `get_cancellation_rate(time_range)`
- AI picks a tool and fills typed parameters; each tool has a hand-written, unit-tested SQL implementation.
- `vendor_id` is injected server-side from the current tenant — not a parameter the AI controls.

Trade-offs:
- **Flexibility:** constrained — only the menu gets answered; off-menu questions become "I can't answer that from the available data."
- **Determinism:** high — SQL is hand-written and tested.
- **Attack surface:** narrow — params are typed enums/primitives; no model-generated SQL.
- **Dev cost:** higher upfront (write each tool), lower ongoing (answers don't drift with model versions).

### C. Hybrid (predefined + `run_sql` escape hatch)

- Predefined tools for common patterns, `run_sql` as last resort.

Trade-offs:
- Keeps A's flexibility for edge cases; inherits A's attack surface whenever the escape hatch fires.
- Adds a prompt-engineering problem: when should the model escape-hatch vs. use a tool?

### D. AI emits a structured query spec, server translates to SQL

- AI returns `{ action: "top_n", params: {...} }`; server maps action+params onto hand-written SQL.
- Functionally equivalent to B — just a different tool shape (one dispatcher vs. many typed tools).
- Slightly less idiomatic with Anthropic SDK tool-use, which already provides per-tool schemas.

## Comparison

| Option | Flexibility | Determinism | Attack surface | Dev cost |
|---|---|---|---|---|
| A. Raw text-to-SQL | Highest | Low | Wide | Cheap upfront, expensive long-term |
| B. Predefined tools | Medium | High | Narrow | Medium |
| C. Hybrid | High | Mixed | Medium | High |
| D. Structured spec | Medium | High | Narrow | Medium |

## Leaning

**B. Predefined tools.** Reasons:

- **Matches the artefacts.** Every query from the kickoff (top-N, trends, category breakdown, day-vs-day, cancellation rate) fits a small menu. The spread isn't wide enough to justify open-ended SQL generation for MVP.
- **Tenant isolation is trivially enforceable.** Each tool takes `vendor_id` as a server-side-only parameter, injected from the tenant picker (or eventually auth). The AI never sees `vendor_id` as a parameter and therefore cannot ask about another vendor.
- **No-hallucination falls out for free.** If a vendor asks "why are cancellations high?" there's no tool covering *reasons* — so the honest AI response is "I don't have that data," which is exactly what Dave asked for.
- **Debuggable.** Each tool's SQL is a handful of lines with unit tests. Wrong answers are a code bug, not a prompt-engineering problem.

Trade-off accepted: new question shapes (regional breakdowns, seasonality, etc.) each require a new tool, which is a one-file change.

## Decision

**Option B — predefined query tools.** Each tool takes typed params; `vendor_id` is injected server-side from the tenant picker so the AI can never reach across vendors. The MVP menu covers every query shape from the kickoff artefacts; new shapes are a one-file change. Implementation lives under `demo/server/ai/tools/`, with `list_capabilities` exposing the menu to the model.

## Related

- [[005-DB_TOOLING]] — the query layer these tools will be built on (Kysely).
- [[../reading/01_CLAUDE_CAPABILITIES]] — tool-use mechanics in the Anthropic SDK.
- [[../reading/03_NO_HALLUCINATION]] — how the guardrails work in practice, including against this project's cancellation-reasons case.
- [[../artefacts/kickoff_audio_sync]] — source of the example queries and the isolation / no-hallucination constraints.
