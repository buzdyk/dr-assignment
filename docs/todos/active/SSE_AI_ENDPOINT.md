---
type: todo
status: pending
description: Nuxt server route that streams Claude responses over SSE
---
# SSE AI Endpoint

## Problem

The frontend needs to render Claude output token-by-token. We need a Nuxt server route that calls the Anthropic SDK in streaming mode and re-emits tokens as SSE events. See [[003-SSE_FOR_AI_STREAMING]].

## Approach

- `server/api/chat.post.ts` (or similar): accepts the prompt + user-supplied key
- Uses the Anthropic SDK's streaming API
- Writes an SSE stream to the response (`text/event-stream`, flush per chunk)
- Propagates errors as an `event: error` frame so the client can surface them

## Related

- [[003-SSE_FOR_AI_STREAMING]]
- [[002-BYOK_CLAUDE]]
- [[BYOK_KEY_HANDLING]]
