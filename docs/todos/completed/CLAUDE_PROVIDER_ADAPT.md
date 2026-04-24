---
type: todo
status: done
description: Adapt the Claude provider to the split pickTools / summarize interface with real token streaming
---
# Adapt Claude provider to pickTools / summarize

## Problem

The provider interface was split in [[../completed/SSE_AI_ENDPOINT]] into `pickTools` + `summarize` to give us a seam the Robot stub can fill and to fit the single-loop runner. The Robot provider has been fully rewritten; the Claude provider currently throws "not adapted yet" from both methods. Until it's filled in, the chat endpoint only works with `debug: true` in the request body.

## Approach

`pickTools` makes a non-streaming `messages.create` call with the vendor system prompt, the user messages, and all tool specs attached. If the response contains tool_use blocks, they become the `calls: [{ name, args }]` array returned to the runner. If the response is pure text, it becomes the `text` branch.

`summarize` makes a second call, this time streaming. The prompt is reconstructed from the runner's input: the original system prompt, the user turn, and a synthetic turn describing the tool calls and their results in prose (not as real tool_use / tool_result blocks — that pairing is lost when the interface split is provider-neutral). Tokens are yielded from the Anthropic SDK's streaming iterator as they arrive.

Error handling wraps each call in `ProviderError`; the runner maps those to the SSE `error` event.

## Decisions

- **Model:** hardcode `claude-sonnet-4-6` for both calls. Extracting to an env var is deferred — see [[../icebox/CLAUDE_MODEL_CONFIGURABLE]].
- **`max_tokens`:** 1024 for `pickTools`, 2048 for `summarize`.
- **Tool narration is not Claude's job.** Each tool envelope already carries a deterministic `overview` string — that is the per-tool preview line, rendered straight in the UI alongside the chart. Claude's summary is the conversational layer *on top* of those previews, not a re-narration of each tool result. This is why the synthetic-prose tool-result reconstruction in `summarize` is acceptable: the prose only has to give Claude enough context to write a coherent answer, not enough to faithfully reproduce the data — the data is already on screen.

## Trade-offs

- Claude loses its native multi-hop tool loop — we only do one pick → execute-all → summarize per request. Multi-hop can be revisited as a separate todo if a real user query needs it. See [[../icebox/MULTI_HOP_TOOL_LOOP]].
- Reconstructing tool calls as prose rather than tool_use / tool_result blocks drifts from the Anthropic convention. Accepted because the deterministic `overview` covers the per-tool narration in the UI; Claude only needs enough context to write the conversational summary.

## Related

- [[../completed/SSE_AI_ENDPOINT]] — the interface and runner this fills in
- [[../completed/BYOK_KEY_HANDLING]] — env wiring + fail-fast already in place
- [[../../adr/003-SSE_FOR_AI_STREAMING]]
- [[../../adr/002-BYOK_CLAUDE]]
- [[../icebox/CLAUDE_MODEL_CONFIGURABLE]] — extracting the hardcoded model to env
