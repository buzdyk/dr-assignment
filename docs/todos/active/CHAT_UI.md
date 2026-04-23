---
type: todo
status: pending
description: Minimal chat UI consuming the SSE endpoint
---
# Chat UI

## Problem

Need a minimal chat surface that exercises the BYOK + SSE path end-to-end, so the MVP is demo-able.

## Approach

- Single page with message list + input box
- On submit: POST prompt + key header, open `EventSource`-style read on the response body, append tokens to the latest assistant bubble
- Surface error frames as an inline message
- No persistence — in-memory conversation is fine for MVP

## Related

- [[SSE_AI_ENDPOINT]]
- [[BYOK_KEY_HANDLING]]
