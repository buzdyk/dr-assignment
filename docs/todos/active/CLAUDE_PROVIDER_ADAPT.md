---
type: todo
status: active
description: Adapt the Claude provider to the split pickTools / summarize interface with real token streaming
---
# Adapt Claude provider to pickTools / summarize

## Problem

The provider interface was split in [[../active/SSE_AI_ENDPOINT]] into `pickTools` + `summarize` to give us a seam the Robot stub can fill and to fit the single-loop runner. The Robot provider has been fully rewritten; the Claude provider currently throws "not adapted yet" from both methods. Until it's filled in, the chat endpoint only works with `debug: true` in the request body.

## Approach

`pickTools` makes a non-streaming `messages.create` call with the vendor system prompt, the user messages, and all tool specs attached. If the response contains tool_use blocks, they become the `calls: [{ name, args }]` array returned to the runner. If the response is pure text, it becomes the `text` branch.

`summarize` makes a second call, this time streaming. The prompt is reconstructed from the runner's input: the original system prompt, the user turn, and a synthetic turn describing the tool calls and their results in prose (not as real tool_use / tool_result blocks — that pairing is lost when the interface split is provider-neutral). Tokens are yielded from the Anthropic SDK's streaming iterator as they arrive.

Error handling wraps each call in `ProviderError`; the runner maps those to the SSE `error` event.

## Trade-offs

- Claude loses its native multi-hop tool loop — we only do one pick → execute-all → summarize per request. Multi-hop can be revisited as a separate todo if a real user query needs it.
- Reconstructing tool calls as prose rather than tool_use / tool_result blocks drifts from the Anthropic convention. Accepted for provider-neutrality; worth revisiting if summary quality suffers.

## Related

- [[../active/SSE_AI_ENDPOINT]] — the interface and runner this fills in
- [[../../adr/003-SSE_FOR_AI_STREAMING]]
- [[../../adr/002-BYOK_CLAUDE]]
- [[BYOK_KEY_HANDLING]]
