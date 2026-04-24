---
type: todo
status: done
description: Predefined query tools the AI picks from — shared filter shape, one slice per tool, server-side vendor scoping
---
# Query Tools

## Problem

Per [[../adr/008-TEXT_TO_SQL]] the AI answers by picking a tool from a typed menu rather than generating SQL. Each tool runs a hand-written Kysely query with unit-tested shape. This todo defines the registry layout, the shared filter contract, and the initial tools covering every question surfaced in [[../artefacts/kickoff_audio_sync]].

## Shape rule

One tool call = one data slice. Each tool returns a single result set (a `rows` array plus context) that maps cleanly onto one chart shape — bar, line, or pie. Composite answers (deltas between two days, ratios across tools, forecasts) are synthesised by the model on top of these primitives; they are not their own tools. This keeps each tool's SQL, schema, and failure mode trivially auditable.

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

Every initial tool accepts this filter; none currently override it. Future extensions to the filter (region, category-level scoping) can be added as optional fields without breaking existing tools.

## Vendor scoping rule

Every tool's SQL joins through `products.vendor_id = :ctx.vendor_id`. For tools that read `orders`, the join path is `orders → order_items → products → vendor_id`. Tools that read `order_cancellations` go through `order_cancellations → orders → order_items → products → vendor_id`. This is enforced in the hand-written SQL of each tool, not via RLS. A future ADR may revisit RLS; for MVP the rule is "every query has `WHERE products.vendor_id = $1`".

## Revenue convention

When a tool computes revenue or amount:

- Revenue per line = `order_items.quantity * order_items.unit_price` (the price snapshot at order time — do not join back to `products.unit_price`).
- Exclude orders whose `status = 'cancelled'` unless the tool is specifically about cancellations.
- Dates filter on `orders.order_date`.

## The initial tools

Five one-slice tools, mapped to the three chart shapes called out in [[../adr/007-CHART_LIBRARY]]:

| Tool | Chart | Slice |
|---|---|---|
| `get_top_n_products` | bar | products ranked |
| `get_sales_trend` | line | orders over time |
| `get_category_breakdown` | pie | products by category |
| `get_revenue_by_region` | bar | customers grouped by region |
| `get_order_status_mix` | pie | orders grouped by status (includes cancelled) |

### `get_top_n_products`

Top N of a vendor's products by the given metric over the date range.

- Model-facing params: `n` (integer, 1–50), `metric` (enum: `revenue`, `quantity`), plus the shared filter.
- Returns: `{ rows: [{ product_id, sku, name, category, value }], metric, start_date, end_date }` where `value` is the metric total.
- SQL shape: select from `products p` join `order_items oi` join `orders o`, `WHERE p.vendor_id = $1 AND o.order_date BETWEEN $2 AND $3 AND o.status <> 'cancelled'`, group by product, order by metric desc, limit N.

### `get_sales_trend`

Revenue over time, bucketed. Also powers composite questions like "Tuesday vs Wednesday" — the model picks the two buckets out of the series and computes the delta on top.

- Model-facing params: `granularity` (enum: `day`, `week`, `month`), plus the shared filter.
- Returns: `{ rows: [{ bucket, revenue, order_count }], granularity, start_date, end_date }` — `bucket` is an ISO date (the bucket's start).
- SQL shape: `date_trunc(granularity, o.order_date)`, sum of `oi.quantity * oi.unit_price`, count of distinct orders, same vendor + status + date filters.

### `get_category_breakdown`

Revenue grouped by product category.

- Model-facing params: the shared filter only.
- Returns: `{ rows: [{ category, revenue, order_count, product_count }], start_date, end_date }` sorted revenue desc.
- SQL shape: group on `p.category`; distinct counts where appropriate.

### `get_revenue_by_region`

Revenue grouped by the *customer's* region — the one slice that hits the `customers` table.

- Model-facing params: the shared filter only.
- Returns: `{ rows: [{ region, revenue, order_count, customer_count }], start_date, end_date }` sorted revenue desc.
- SQL shape: extend the standard join path with `customers c` on `o.customer_id = c.id`, group on `c.region`. Excludes cancelled orders.

### `get_order_status_mix`

Count of orders by status (`placed`, `shipped`, `delivered`, `cancelled`) over the date range. This is the source of record for cancellation-rate questions: the model derives the rate as `cancelled / total_orders` from the returned counts. No `reason_category` or `detailed_reason` ever leaves this tool — surfacing them would let the model reconstruct a "why" narrative that [[../reading/03_NO_HALLUCINATION]] forbids (Dave's landmine).

- Model-facing params: the shared filter only.
- Returns: `{ rows: [{ status, order_count }], total_orders, start_date, end_date }` sorted count desc.
- SQL shape: standard join path, *no* status filter (cancelled is included on purpose), group on `o.status`, count distinct order ids.

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
