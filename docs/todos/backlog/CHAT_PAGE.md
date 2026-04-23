---
type: todo
status: backlog
description: Full-viewport chat page layout (Sarah's kickoff constraint) — composition TBD
---
# Chat Page

## Problem

The product needs a dedicated chat page where the chat surface dominates the viewport — not a tiny sidebar. Exact composition (header, switcher placement, message panel, input, status indicators, chart rendering) is TBD.

## Source

From [[../../artefacts/kickoff_audio_sync]]:

> Sarah: "make sure the chat window actually takes up most of the screen so it's easy to use. Don't shove it in a tiny sidebar."

## Approach (TBD)

- Full-page layout with the chat surface as the primary element, not a secondary panel
- Header area for branding + vendor switcher (see [[../active/CHAT_UI]])
- Message panel consuming the bulk of the viewport
- Sticky input at the bottom
- Keyboard hints ("ENTER to send • SHIFT + ENTER for newline") visible per the brand guide
- Status indicator (e.g. "AI READY") per the brand-guide chat composition

Detailed breakdown pending — likely splits into several child todos once the composition is decided.

## Related

- [[../active/CHAT_UI]]
- [[../../adr/006-FRONTEND_TOOLING]]
- [[style-guide/03-COMPONENTS]] — component styling for the chat shell lives here
