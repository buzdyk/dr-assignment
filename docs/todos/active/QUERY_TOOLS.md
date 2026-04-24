---
type: todo
status: in_progress
description: Predefined query tools the AI picks from — shared filter shape, five initial tools, server-side vendor scoping
---
# Query Tools

## Problem

Per [[../adr/008-TEXT_TO_SQL]] the AI answers by picking a tool from a typed menu rather than generating SQL. Each tool runs a hand-written Kysely query with unit-tested shape. This todo defines the registry layout, the shared filter contract, and the five initial tools covering every question surfaced in [[../artefacts/kickoff_audio_sync]].

## Tool registry

Location: `demo/server/ai/tools/`.

- Each tool is a module exporting an object with: `name` (stable string matched against `tool_use.name`), `description` (one sentence for the model), `input_schema` (JSON Schema for the model-facing parameters — never mentions `vendor_id`), `execute` (async function receiving `(ctx, args)` and returning the raw result).
- `index.ts` in the same directory exports the registry — an object keyed by tool name — and a `toolSpecs()` helper that returns the array the provider hands to Claude (`name`, `description`, `input_schema` only).
- The executor ([[CHAT_ENDPOINT]]) looks up by name and calls `execute(ctx, args)`. Unknown tool name throws `tool_error`.

## Tool context

The second argument the executor binds in closure before passing to the provider's `onToolCall` callback:

| Field | Type | Source |
|---|---|---|
| `vendor_id` | string (UUID) | Request body, validated in the handler |
| `db` | Kysely instance | Nuxt server singleton |

This is the *only* path `vendor_id` reaches SQL. Tool authors never accept it as a function parameter under model control.

## Shared filter

All tools accept — on top of their own specific params — a base filter:

| Field | Type | Required | Notes |
|---|---|---|---|
| `start_date` | string (ISO date, `YYYY-MM-DD`) | no | Inclusive lower bound. Default: 30 days before `end_date` (or 30 days ago if `end_date` absent). |
| `end_date` | string (ISO date, `YYYY-MM-DD`) | no | Inclusive upper bound. Default: today. |

Tools that operate on specific dates rather than a range (currently only `compare_days`) don't include these fields in their schema. Future extensions to the filter (region, category-level scoping) can be added as optional fields without breaking existing tools.

## Vendor scoping rule

Every tool's SQL joins through `products.vendor_id = :ctx.vendor_id`. For tools that read `orders`, the join path is `orders → order_items → products → vendor_id`. Tools that read `order_cancellations` go through `order_cancellations → orders → order_items → products → vendor_id`. This is enforced in the hand-written SQL of each tool, not via RLS. A future ADR may revisit RLS; for MVP the rule is "every query has `WHERE products.vendor_id = $1`".

## Revenue convention

When a tool computes revenue or amount:

- Revenue per line = `order_items.quantity * order_items.unit_price` (the price snapshot at order time — do not join back to `products.unit_price`).
- Exclude orders whose `status = 'cancelled'` unless the tool is specifically about cancellations.
- Dates filter on `orders.order_date`.

## The five initial tools

### `get_top_n_products`

Top N of a vendor's products by the given metric over the date range.

- Model-facing params: `n` (integer, 1–50), `metric` (enum: `revenue`, `quantity`), plus the shared filter.
- Returns: `{ rows: [{ product_id, sku, name, category, value }], metric, start_date, end_date }` where `value` is the metric total.
- SQL shape: select from `products p` join `order_items oi` join `orders o`, `WHERE p.vendor_id = $1 AND o.order_date BETWEEN $2 AND $3 AND o.status <> 'cancelled'`, group by product, order by metric desc, limit N.

### `get_sales_trend`

Revenue over time, bucketed.

- Model-facing params: `granularity` (enum: `day`, `week`, `month`), plus the shared filter.
- Returns: `{ rows: [{ bucket, revenue, order_count }], granularity, start_date, end_date }` — `bucket` is an ISO date (the bucket's start).
- SQL shape: `date_trunc(granularity, o.order_date)`, sum of `oi.quantity * oi.unit_price`, count of distinct orders, same vendor + status + date filters.

### `get_category_breakdown`

Revenue grouped by product category.

- Model-facing params: the shared filter only.
- Returns: `{ rows: [{ category, revenue, order_count, product_count }], start_date, end_date }` sorted revenue desc.
- SQL shape: group on `p.category`; distinct counts where appropriate.

### `compare_days`

Single-metric comparison between two specific dates (Kevin's "Tuesday vs Wednesday" example).

- Model-facing params: `day_a` (ISO date), `day_b` (ISO date), `metric` (enum: `revenue`, `quantity`, `order_count`). **No `start_date`/`end_date`** — this tool overrides the base filter.
- Returns: `{ day_a: { date, value }, day_b: { date, value }, metric, delta, delta_pct }`.
- SQL shape: two parameterized single-day aggregates, wrap in a small adapter to compute delta server-side.

### `get_cancellation_rate`

Proportion of orders cancelled in the range, plus the absolute count — no reasons (Dave's landmine).

- Model-facing params: the shared filter only.
- Returns: `{ total_orders, cancelled_orders, cancellation_rate, start_date, end_date }`. No `reason_category` or `detailed_reason` ever leaves this tool even though the columns exist — surfacing them would let the model reconstruct a "why" narrative that [[../reading/03_NO_HALLUCINATION]] forbids.
- SQL shape: count all orders touching the vendor's products in range, then count the subset with `orders.status = 'cancelled'`. Rate is `cancelled / total`, zero-safe (if total = 0, return rate `null` and explain-in-return, not an error).

## Error and empty handling

- Zero rows is not an error. Tools return an empty `rows` array and the model says so plainly.
- Invalid params (out-of-range `n`, malformed dates) → tool returns `{ error: 'invalid_params', message }` with the executor translating to a `tool_result` with `is_error: true` so Claude can correct and retry. This is recoverable, not fatal.
- DB errors propagate as thrown exceptions caught by the executor and returned as `tool_result` with `is_error: true`. Three consecutive failures on the same tool call escalate to `tool_error` in [[CHAT_ENDPOINT]].

## RobotProvider coverage

The substring-matched canned prompts in [[AI_PROVIDER]] exercise at least one example per tool above so the demo walks end-to-end offline. Example prompt strings live colocated with the RobotProvider, not here.

## Out of scope

- New tools for regional breakdowns, seasonality, customer-segmenting — added when the need appears; one-file changes.
- Row-level security — current mechanism is per-query `WHERE`; RLS may come later.
- Tool-call provenance logging → [[../reading/03_NO_HALLUCINATION]] section 6, post-MVP.

## Related

- [[CHAT_ENDPOINT]] — what binds the executor to `ToolContext` and loops over tool calls
- [[AI_PROVIDER]] — what hands the tool specs to the model
- [[../adr/008-TEXT_TO_SQL]]
- [[../adr/005-DB_TOOLING]]
- [[../reading/03_NO_HALLUCINATION]]
- [[../artefacts/kickoff_audio_sync]]
