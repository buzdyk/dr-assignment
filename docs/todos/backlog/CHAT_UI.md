---
type: todo
status: backlog
description: Minimal chat UI with vendor switcher, consuming the SSE endpoint
---
# Chat UI

## Problem

A minimal chat surface that exercises the SSE path end-to-end, demonstrates tenant isolation via a vendor switcher (Alex's kickoff ask), and looks like a NexTrade product rather than a weekend hackathon.

## Approach

- Single page with the chat surface dominating the viewport (per Sarah's kickoff constraint — details captured in [[../backlog/CHAT_PAGE]])
- **Vendor switcher** — dropdown in the header that switches between `Supplier 1` / `Supplier 2` (stable UUIDs seeded in [[DB_SEEDS]]). Selection is the tenant identity sent with every query; the server uses it to inject `vendor_id` into tool calls. Alex explicitly promised Dave this as the "data isolation proof" during the Friday demo.
- Message list + input box
- On submit: POST the prompt + current vendor id, open a streaming read on the response body, append tokens to the latest assistant bubble
- Surface error frames as an inline message
- Chart payloads from tool output render inline (chart lib picked in [[../../adr/007-CHART_LIBRARY]])
- No persistence — in-memory conversation is fine for MVP

## Related

- [[SSE_AI_ENDPOINT]]
- [[DB_SEEDS]]
- [[../../adr/007-CHART_LIBRARY]]
- [[../../adr/008-TEXT_TO_SQL]]
- [[CHAT_PAGE]] — layout breakdown (tbd)
- [[STYLE_GUIDE]] — component styling
