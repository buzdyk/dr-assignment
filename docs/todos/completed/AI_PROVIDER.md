---
type: todo
status: done
description: AIProvider interface with Claude and Robot implementations
---
# AI Provider

## Problem

The chat endpoint must not depend directly on the Anthropic SDK — tests need a deterministic replacement, and the abstraction lets us swap or add providers later without rewriting the route. Two implementations for MVP: `ClaudeProvider` (real Anthropic calls per [[../../adr/002-BYOK_CLAUDE]]) and `RobotProvider` (a minimal offline stub for smoke tests). The fixture-driven, test-grade version of the mock is owned by [[BACKEND_TESTS]] — this todo only needs the simplest thing that runs.

## The interface

A single exported type `AIProvider` with one method. Semantics:

- **Input:** an object with `system` (string), `tools` (array of model-facing tool specs — name, description, JSON-schema for params, no `vendor_id`), `messages` (array of `{ role, content }` — initially one user turn), and `onToolCall` (async callback `(name, args) → result`). The callback is what the executor injects to reach [[QUERY_TOOLS]] with `vendor_id` bound in closure; the provider never sees `vendor_id`.
- **Output:** a promise resolving to `{ text, tool_calls }`. `text` is the final assistant prose after the loop settles. `tool_calls` is the ordered list of `{ name, args, result }` the provider observed while looping. The endpoint returns this list verbatim.
- **Contract on the loop:** the provider owns the tool-use cycle internally. It calls `messages.create` (or its equivalent), on any `tool_use` block it invokes `onToolCall` with the model-facing args and folds the result back in as a `tool_result` block, and it continues until `stop_reason !== 'tool_use'`. The caller (handler) never sees individual turns, only the final aggregate.
- **Errors:** recoverable tool errors stay inside the loop (returned as `tool_result` with `is_error: true` so the model can retry or apologize). Unrecoverable failures (provider HTTP errors after retry, malformed tool-use blocks) throw — the handler maps them to `provider_error` / `tool_error`.

Interface location: `demo/server/ai/providers/types.ts`.

## ClaudeProvider

Location: `demo/server/ai/providers/claude.ts`.

- Uses `@anthropic-ai/sdk`. Add dependency.
- Model: `claude-sonnet-4-6` per [[../../adr/008-TEXT_TO_SQL]] and [[../../reading/01_CLAUDE_CAPABILITIES]]. Temperature `0`. `max_tokens` configurable with a sensible default (2048).
- Reads the API key from `ANTHROPIC_API_KEY` (server env, per [[../../adr/002-BYOK_CLAUDE]]). Per-request BYOK is deferred to [[BYOK_KEY_HANDLING]].
- Non-streaming calls for now (`messages.create` without `stream: true`). Streaming variants are the concern of [[SSE_AI_ENDPOINT]].
- Retry policy: rely on the SDK's built-in retries for `429` / `529`. No custom backoff in MVP.
- Does not log prompts or completions by default.

## RobotProvider

Location: `demo/server/ai/providers/robot.ts`.

Intentionally dumb for MVP. Goal: let us hit `/api/chat` end-to-end in local dev and CI without a key and without network, and prove the executor + tools wire up correctly.

- Behavior: substring match on the user's prompt against a hardcoded table of canned responses. Each entry produces one of:
  - A final-text response (no tool calls), or
  - A sequence: call tool X with fixed args → after the real tool result comes back, emit a canned final-text template that interpolates a couple of fields from the result.
- The substring table covers one example per predefined tool so the Friday demo can be walked through offline. Exact prompts and tools listed in [[QUERY_TOOLS]].
- Default fallback when nothing matches: a final-text response saying "I don't have a tool for that" — mirrors the no-hallucination stance so the fallback still reads like the real assistant.
- No fixture files, no scripting DSL. That lives in [[BACKEND_TESTS]].

## Provider selection

- Env var `AI_PROVIDER` with values `claude` (default) and `robot`.
- Resolution in a factory at `demo/server/ai/providers/index.ts`. The chat handler calls the factory once per request.
- No DI framework.

## Out of scope

- Streaming/SSE variants → [[SSE_AI_ENDPOINT]]
- Fixture-driven scripted responses, error injection, tool-call assertions → [[BACKEND_TESTS]]
- Per-request BYOK key handling → [[BYOK_KEY_HANDLING]]
- Prompt caching → future concern, ADR when it matters
