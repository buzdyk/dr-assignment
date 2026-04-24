---
type: todo
status: done
description: Chat UI consuming the SSE endpoint with collapsible tool cards, inline charts, and streamed summary text
---
# Chat UI

## Problem

A minimal chat surface that exercises the SSE path end-to-end, demonstrates tenant isolation via a vendor switcher (Alex's kickoff ask), and looks like a NexTrade product rather than a weekend hackathon. The frontend today renders a hardcoded mock conversation; it needs to consume the live SSE stream defined in [[SSE_AI_ENDPOINT]] and render each tool call as a rich, collapsible card rather than as a caption + table.

## Approach

- Single page with the chat surface dominating the viewport (per Sarah's kickoff constraint — details captured in [[../backlog/CHAT_PAGE]]).
- **Vendor switcher** — dropdown in the header that switches between `Supplier 1` / `Supplier 2` (stable UUIDs seeded in [[../backlog/DB_SEEDS]]). Selection is the tenant identity sent with every query; the server uses it to inject `vendor_id` into tool calls. Alex explicitly promised Dave this as the "data isolation proof" during the Friday demo.
- Message list + input box.
- On submit: POST the prompt + current vendor id, open a streaming read on the response body, and mutate the latest assistant bubble as SSE events arrive.

### Per-tool-call cards

Each `tool_result` event renders as its own card inside the assistant bubble. Cards appear in order, as soon as their result lands — not after the whole conversation settles. Collapsed by default, showing only the deterministic `overview` string returned by the tool plus a row of filter chips (from the envelope's `filters` array — date range, plus tool-specific controls like n, metric, granularity). Expanded, the card shows the raw rows as a table. Every bit of text on the card is sourced from the tool envelope, not from the AI — so it renders deterministically and the exact same way every time for the same data.

### Inline chart

Each tool card renders its chart next to the collapsible area (not inside it), using the `chart` hint from the envelope (kind: bar / line / pie; x, y: the keys of rows to plot). Chart library is shadcn-vue Chart on top of unovis-vue, per [[../../adr/007-CHART_LIBRARY]]. The chart appears as soon as the `tool_result` event lands; no placeholder state after that.

### Streamed summary

The AI's final summary renders below all tool cards. `text` chunks append to the same assistant bubble as they arrive, so the user sees the summary grow token by token. This exercises the same code path whether the provider is Claude (real tokens) or Robot in `debug: true` mode (5–10 pre-chunked pieces with a small delay).

### Errors

`tool_result` events with `is_error: true` render the card in an error state (no chart, error message in place of rows). A top-level `error` event renders an inline message in the chat and ends the assistant bubble.

## Out of scope

- Persistence / history across page reloads.
- Multi-turn conversation memory (single-shot per prompt, per [[../backlog/CHAT_POLISH]]).
- Re-running / editing prior messages.

## Related

- [[SSE_AI_ENDPOINT]] — the transport and event shapes this consumes
- [[../backlog/DB_SEEDS]]
- [[../../adr/007-CHART_LIBRARY]]
- [[../../adr/008-TEXT_TO_SQL]]
- [[../backlog/CHAT_PAGE]] — layout breakdown (tbd)
- [[../backlog/STYLE_GUIDE]] — component styling
