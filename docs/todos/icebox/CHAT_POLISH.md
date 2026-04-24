---
type: todo
status: icebox
description: Conversation history, persistence, and multi-turn refinement for the chat endpoint
reason: Stateless one-shot chat covers the demo prompts; multi-turn history is only worth the design work once a real user flow asks for follow-ups or chart-refinement turns
---
# Chat Polish

## Problem

The first cut of the chat endpoint ([[../completed/CHAT_ENDPOINT]]) is stateless — each request is an independent one-shot `{ prompt, vendor_id }` call with no memory of prior turns. That's fine to ship the pipeline, but the eventual UX is a real conversation: follow-up questions ("drill into that Tuesday spike"), reference-to-previous-chart ("show that as a pie instead"), and recovery from "I don't have that data" with a reframed question.

## Approach

Open questions, not a decision:

- **Transport of history.** Client sends the full message array on each request (simplest, no server state) vs. server persists per-session (needed if we want history to survive reloads or share across tabs).
- **Persistence shape.** If server-side: one row per message? One row per conversation with a JSON blob? How does vendor isolation apply to stored conversations?
- **Context window management.** Trim/summarize old turns once the prompt gets long. Not a concern until real usage hits it.
- **Conversation identifiers.** A `conversation_id` field on requests — generated client-side or server-side on first message?
- **Replay of tool results.** Do we re-send prior `tool_result` blocks on each turn, or summarize them back as assistant prose to save tokens?

## Related

- [[../completed/CHAT_ENDPOINT]] — the stateless first cut this polishes
- [[../../adr/008-TEXT_TO_SQL]]
- [[../../artefacts/kickoff_audio_sync]]
