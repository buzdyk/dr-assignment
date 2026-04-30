---
type: todo
status: done
description: SSE chat endpoint with a split provider interface, shared runner, tool envelope, and debug flag
---
# SSE AI Endpoint

## Problem

The frontend needs to render Claude output progressively — both tool calls (each should appear as it's chosen and again when results land) and the final summary (token-streamed, not dumped at once). Today `chat.post.ts` returns a single JSON blob after the Claude agentic loop settles, and the `robot` provider is the only stub — selectable only server-wide via `AI_PROVIDER=robot`. We want per-request control, a cleaner provider shape that lets us test pick-vs-summarize behaviour in isolation, and an SSE transport so the chat UI can render tool cards and tokens as they arrive.

## Approach

### Tool envelope (pre-req)

Every tool's `execute` returns a normalised envelope so the UI can render the collapsed tab, filter chips, expanded raw data, and an inline chart deterministically — with no second round-trip and no AI summarisation of the data shape. The envelope carries: an `overview` string used as the collapsed-tab label (deterministic, derived from args + result — not the AI's prose); a `filters` list of `{label, value}` pairs that show the effective date range and any tool-specific controls (n, metric, granularity); the raw `rows` used both for the expanded view and as graph data; and a `chart` hint naming the chart kind (bar / line / pie) plus the keys to plot. Shape is kept extensible — additional presentation fields can be added later without changing consumers that only read the ones they need.

### Provider interface split

Replace the single `runConversation` method with two methods on `AIProvider`: `pickTools` (plural — returns either a list of tool calls to execute or a direct text response if no tool fits) and `summarize` (given the original messages plus the tool calls and their results, produce the final text). Providers are dumb — they do not know about SSE, the executor, or the tool registry. Orchestration moves into a shared runner that executes the single loop: call `pickTools`, dispatch each chosen tool through the executor, then call `summarize`.

One-loop-only for now — we give up Claude's native multi-tool-hop ability, in exchange for a provider shape that maps cleanly onto Robot and onto any future mock or non-agentic provider. Multi-hop can be revisited as a follow-up if a real query needs it.

For the summarize call, the provider receives tool calls and results as a synthetic structured input — not the raw Anthropic tool_use / tool_result blocks from the pick round-trip. This keeps the interface provider-neutral (Robot does not need real conversation state) and means each provider formats the results into its own prompt however it prefers. Trade-off: Claude loses the tight tool_use ↔ tool_result pairing it would otherwise use; acceptable for MVP.

### Robot provider (hardcoded)

`pickTools` matches the user prompt against a small script table (same style as today's inline SCRIPTS) and returns either a single tool call with fixed args or a direct text response. `summarize` returns a hardcoded string per matched script — no real summarisation logic. To stay consistent with the token-streamed `text` event, Robot does not emit its summary as one chunk: it splits the hardcoded string into 5–10 pieces and yields them sequentially with a small delay, so the frontend exercises the same streaming code path it will hit with Claude.

### Claude provider

`pickTools` makes one `messages.create` call with tools attached. If the model returns tool_use blocks, they become the `calls` list; if it returns only text, that's the `text` branch. `summarize` makes a second streaming call with the original system + user turn plus a synthetic assistant-then-user exchange representing the tool calls and their results in prose ("I called tool X with args Y and got Z"), yielding tokens as they arrive.

### Shared runner

One function in `server/ai/runner.ts`. Takes the provider, system prompt, messages, tool specs, executor, and an `emit` callback. Sequence: `pickTools` → if text branch, stream the text and emit `done`; otherwise, for each call emit `tool_start`, dispatch via executor, emit `tool_result` with the tool's envelope merged in; then `summarize` → stream tokens as they arrive → `done`. Errors at any stage emit an `error` event and terminate.

### SSE endpoint

`server/api/chat.post.ts` switches from returning JSON to writing `text/event-stream`. Body accepts `prompt`, `vendor_id`, and optional `debug: boolean`. Precedence for provider selection: body `debug: true` > `AI_PROVIDER` env > default `claude`. Events on the wire, one per SSE frame: `tool_start` (name, args); `tool_result` (name, args, overview, filters, rows, chart, optional is_error); `text` (chunk — many frames); `done`; `error` (message). Invalid-request validation (missing prompt, bad UUID, unknown vendor) stays pre-stream and returns a regular HTTP error.

### Debug flag semantics

`debug: true` forces Robot for that single request — it does not persist. Useful for deterministic integration tests, for exercising the SSE frontend without burning tokens, and for comparing real vs stub for the same prompt from the same server.

## Out of scope

- Multi-turn conversation history (stays single-shot, per [[../icebox/CHAT_POLISH]]).
- Multi-hop tool loops (single pick → execute → summarize only).
- Persisting chat history.
- True token-level streaming for Robot (we fake it by chunking).
