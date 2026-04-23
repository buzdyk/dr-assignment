---
type: todo
status: pending
description: Capture and forward the user-supplied Claude API key without server-side persistence
---
# BYOK Key Handling

## Problem

The app must accept a Claude API key from the user and use it to make calls, without storing the key server-side. See [[002-BYOK_CLAUDE]].

## Approach

- UI: simple settings panel / first-run prompt to collect the key; keep it in browser storage (sessionStorage for MVP)
- Transport: send the key on each request via an `Authorization`-style header, not a cookie
- Server: accept the key per-request, use it to build the Anthropic client for that request only, never log or persist it

## Related

- [[002-BYOK_CLAUDE]]
- [[SSE_AI_ENDPOINT]]
