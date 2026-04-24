---
type: todo
status: backlog
description: Expand a tool card to reveal the raw rows as a table, alongside the existing overview + chart
---
# Expandable tool card

## Problem

[[../completed/CHAT_UI]] originally specified that each tool card would be **collapsible**: the collapsed state shows the deterministic overview, and the expanded state shows the raw rows as a table. The shipped version only renders overview + chart — there is no way to see the underlying rows in the UI.

That gap matters whenever a chart hides detail the user needs:

- A pie slice labelled "Other" with no breakdown.
- A line chart with a spike on a date the user wants the exact value for.
- Vendor support / debugging where someone needs to see the actual values, not a chart approximation.

It's also the obvious "I don't trust this chart, show me the data" affordance that turns the chat from a black box into something auditable.

## Approach

- Add a small disclosure control to the tool card header (chevron + "show data" / "hide data") wired to a per-card boolean.
- Expanded body renders the rows as a table — column headers from the keys of the first row, cell values stringified, with monospace numerics for column alignment.
- Cap visible rows at, say, 200; if the tool returned more, show "and N more" beneath the table. Avoid a virtualised grid for now.
- Apply the same brand styling tokens already used by the chart (hairline borders, off-white row stripes, label typography for headers).
- Default state: collapsed. The chart is the primary view; raw rows are an opt-in.

The data is already there — `block.rows` is on the envelope and currently passed only to `ResultChart`. No backend change.

## Out of scope

- Sortable / filterable table (just render in source order).
- Column type inference (numbers vs dates vs strings — leave as stringified).
- Column hiding / pinning.
- CSV export — that's a [[../icebox/CHART_INTERACTIVITY]]-shaped conversation if it ever comes up.

## Related

- [[../completed/CHAT_UI]] — the spec where this was originally bundled and dropped
- [[../completed/SSE_AI_ENDPOINT]] — the envelope that already carries `rows`
