---
type: todo
status: done
description: Full-viewport chat page layout (Sarah's kickoff constraint) — static first cut
---
# Chat Page

## Problem

The product needs a dedicated chat page where the chat surface dominates the viewport — not a tiny sidebar. This todo owns the layout, header composition, and vendor-switcher placement. Wiring to the real endpoint lives in [[../backlog/CHAT_UI]].

First cut is static — canned messages only, no fetch calls — so we can eyeball the composition before the data layer arrives.

## Source

From [[../../artefacts/kickoff_audio_sync]]:

> Sarah: "make sure the chat window actually takes up most of the screen so it's easy to use. Don't shove it in a tiny sidebar."

## Approach

- Full-viewport layout (`h-dvh`, flex column) with the chat surface as the primary element
- Slim top bar: NexTrade wordmark on the left, vendor switcher on the right (Alex's data-isolation proof — see [[../../artefacts/kickoff_audio_sync]])
- `<ChatShell>` fills the remaining viewport; its own header keeps the `NexTrade AI · AI READY` treatment from the brand guide
- Message panel (inside `ChatShell`) scrolls while the input + keyboard hints stay sticky at the bottom
- Static canned messages seeded to demo the three landmines from the kickoff: top-N list, day-vs-day comparison, cancellation-rate question (with the no-hallucination response)
- Charts are placeholders only — [[../../adr/007-CHART_LIBRARY]] is still proposed

## Out of scope

- Real fetch to `/api/chat` → [[../backlog/CHAT_UI]]
- Chart rendering from tool results → [[../../adr/007-CHART_LIBRARY]]
- Multi-turn, persistence → [[../backlog/CHAT_POLISH]]

## Related

- [[../backlog/CHAT_UI]] — wires this static page to the live endpoint
- [[../../adr/006-FRONTEND_TOOLING]]
- [[../../adr/007-CHART_LIBRARY]]
- [[../completed/style-guide/03-COMPONENTS]] — component styling for the chat shell lives here
