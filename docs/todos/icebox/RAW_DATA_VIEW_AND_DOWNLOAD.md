---
type: todo
status: icebox
description: Extend the tool envelope with un-aggregated joined rows so the table view and CSV download can show what actually went into each chart, not just the chart's own data
reason: Today's table + CSV both render the post-aggregation result, which validates nothing — but extending the envelope is real work and only worth it once a real validation workflow exists
---
# Raw data view and download

## Problem

Each tool returns aggregated rows (e.g. `top_n_products` returns `{ name, value }` per product), and the [[../completed/EXPANDABLE_TOOL_CARD]] table + CSV both render exactly those rows. The chart, the table, and the CSV all show the same five numbers. That fails the obvious "is this aggregation correct?" use case — there's no path from the UI to the underlying records that contributed to each total.

The failure mode this enables: a SUM is wrong because the JOIN duplicated rows, or a date filter silently excluded a chunk of orders, and there's no way for the user to notice without a SQL client.

## Approach

Extend the tool envelope with two optional fields:

```ts
type ToolPresentation = {
  overview: string
  filters: FilterChip[]
  chart: ChartHint
  rows: unknown[]              // existing — aggregated rows (chart data)
  raw_rows?: unknown[]         // new — un-aggregated joined rows
  raw_truncated?: boolean      // new — true when raw_rows hit the cap
}
```

Tools that aggregate (top-n-products, sales-trend, category-breakdown, revenue-by-region, order-status-mix) return the joined rows *before* the GROUP BY, capped at e.g. 1000 with `raw_truncated: true` when the cap kicked in. Tools that are already a flat SELECT just don't populate `raw_rows`.

ToolCard gains a "raw / aggregated" toggle on both the table view and the CSV download, defaulting to aggregated. When raw is selected:

- Table renders the raw row shape (different columns than aggregated).
- CSV exports the full raw set (still capped at the server-side limit; surface `raw_truncated` in the download UI).
- The "and N more" footer describes the cap explicitly.

Backend cap is the load-bearing decision: 1000 rows × 5 tool calls × N concurrent users sets the network and memory ceiling. Pick the cap based on a real worst-case envelope size, not a guess.

## Trade-offs

- **Envelope size grows** — potentially 1000 rows of a 5-table join per tool call. Network cost is meaningful; not a free addition. Could compress (gzip is on by default in Nitro) or stream raw_rows as a separate SSE event so the chart renders first.
- **Schema discipline** — raw row shape differs per tool and may not match the aggregated row shape. ToolCard has to render two column sets per tool. Not hard, but it means the table component grows a "mode" prop.
- **Half-features for non-aggregating tools** — tools that already return raw rows (none today, but conceivable later) need a clear convention: do they populate `rows` or `raw_rows`? Spec it before building.
- **PII in raw rows** — aggregated rows are anodyne (totals, counts). Raw rows include customer names, order IDs, regions. The "raw" toggle becomes a data-egress vector for vendor users; pairs naturally with [[OBSERVABILITY_AND_AUDIT]] (audit which raw downloads happen) and [[PROMPT_INJECTION_HARDENING]] (vendor scope check is the only thing keeping a malicious prompt from pulling raw rows from a different tenant).
- **Deferred Option 1 (`sql` field on the envelope) is cheaper but weaker** — adding a SQL string per tool is a 5-line change with no payload cost, and would let a developer paste the query into a SQL client to validate. It doesn't help non-developer users and feels like a debug feature, but worth keeping in mind as a smaller stepping stone if this full design is ever too heavy.

## Triggers to thaw

- A real user-side debugging workflow ("I think this number is wrong, prove it to me").
- Vendor compliance ask ("show me the records that contributed to this total").
- First time someone catches an aggregation bug and we have no UI path to surface it.

## Related

- [[../completed/EXPANDABLE_TOOL_CARD]] — built the table + CSV that this would extend
- [[../completed/SSE_AI_ENDPOINT]] — defines the envelope shape this grows
- [[OBSERVABILITY_AND_AUDIT]] — raw downloads are an audit-worthy event
- [[PROMPT_INJECTION_HARDENING]] — vendor-scope enforcement is the only barrier between a raw download and a cross-tenant leak
