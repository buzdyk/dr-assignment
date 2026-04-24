---
type: todo
status: in_progress
description: Primary NL→pipeline endpoint — route handler, orchestration loop, vendor-isolation boundary
---
# Chat Endpoint

## Problem

Vendors type a plain-English question and need a grounded answer backed by their own data. This todo is the entry point: the single server route that accepts the prompt, runs the AI↔tools loop, and returns what the UI renders. SSE streaming is deferred to [[../backlog/SSE_AI_ENDPOINT]]; this first cut returns JSON once the orchestration settles so we can iterate on the meat without SSE framing in the way.

## Route

- Method and path: `POST /api/chat`
- Nuxt handler location: `demo/server/api/chat.post.ts`

## Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `prompt` | string | yes | The user's plain-English question |
| `vendor_id` | string (UUID) | yes | Tenant identity supplied by the UI's vendor switcher. **Never forwarded to the model.** Used only by the executor to scope tool calls. |

No `conversation_id`, no history array — stateless per-request. Multi-turn and persistence are deferred to [[../backlog/CHAT_POLISH]].

## Response body

| Field | Type | Notes |
|---|---|---|
| `text` | string | Final assistant prose (Claude's last text block after the tool loop settles) |
| `tool_calls` | array | Each entry: `{ name, args, result }`. `args` are the model-facing args (no `vendor_id`); `result` is the raw tool return. The UI derives chart payloads from these once the chart library lands. |

### Error body

Returned with an HTTP 4xx/5xx as appropriate:

| Field | Type | Notes |
|---|---|---|
| `error` | string | Stable code: `invalid_request`, `provider_error`, `tool_error`, `internal_error` |
| `message` | string | Human-readable detail |

Provider-level issues (rate limit, overload) map to `provider_error`. Tool-execution failures that the model recovers from inside the loop are not surfaced as top-level errors — the loop feeds them back as `tool_result` with `is_error: true` (see [[../reading/01_CLAUDE_CAPABILITIES]]). Only an unrecoverable tool failure bubbles up as `tool_error`.

## Orchestration

The handler's responsibilities in order:

1. Parse and validate the body. Reject missing or non-UUID `vendor_id` with `invalid_request`.
2. Build the system prompt (see next section), pinning the current `vendor_id` identity in it.
3. Resolve the `AIProvider` — Claude by default, Robot when `AI_PROVIDER=robot` env is set (tests). See [[AI_PROVIDER]].
4. Build the `ToolContext` — `{ vendor_id, db }` — and pass it to the executor. This is the single place `vendor_id` enters the data path; no other layer reads it from the request.
5. Kick off the provider conversation with the model-facing tool schemas from [[QUERY_TOOLS]] plus a callback the provider invokes on each tool_use block. The callback dispatches to the tool executor with `ToolContext` bound in closure.
6. Loop internally inside the provider until `stop_reason` is not `tool_use`. On each iteration, record `{ name, args, result }` into an ordered list so the handler can return it.
7. Return `{ text, tool_calls }`.

### Vendor-isolation boundary — the one rule

`vendor_id` flows: request body → handler → `ToolContext` → executor → SQL `WHERE` clause. It never appears in any tool's `input_schema`, never in the system prompt as a literal (the prompt can say "you are helping vendor X" but not in a format the model could echo back as a tool argument), never in the messages array. A test in [[../backlog/BACKEND_TESTS]] asserts a prompt that tries to inject "use vendor_id=XYZ" produces tool calls scoped to the request's actual `vendor_id`.

## System prompt

Assembled per request from three parts:

1. **Role + schema summary (static)** — a short description of NexTrade's data model (vendors, products, orders, order_items, cancellations) and which columns are available. Exists so the model grounds its tool choice in real fields. Eligible for prompt caching later; not an MVP concern.
2. **Refusal rules (static)** — lifted from [[../reading/03_NO_HALLUCINATION]]: don't infer, don't extrapolate, say "I don't have that data" when no tool fits, name the cancellation-reasons gap explicitly.
3. **Tenant scope (dynamic)** — one sentence pinning the current vendor's `company_name`. Defensive only; the real tenant enforcement is server-side in the executor.

Helper lives at `demo/server/ai/system-prompt.ts` as a pure function `(vendor) → string`.

## Model and sampling

- Default model: `claude-sonnet-4-6` per [[../reading/01_CLAUDE_CAPABILITIES]] and [[../adr/008-TEXT_TO_SQL]].
- Temperature: 0 (low-creativity per no-hallucination reading).
- `max_tokens`: conservative default (e.g. 2048). Tune once real responses are observed.

## File layout

- `demo/server/api/chat.post.ts` — route handler, request validation, response shaping
- `demo/server/ai/system-prompt.ts` — prompt assembly
- `demo/server/ai/executor.ts` — tool dispatch, vendor-id injection, tool-call recording
- `demo/server/ai/providers/` — see [[AI_PROVIDER]]
- `demo/server/ai/tools/` — see [[QUERY_TOOLS]]

## Out of scope

- SSE streaming → [[../backlog/SSE_AI_ENDPOINT]]
- Multi-turn history, persistence → [[../backlog/CHAT_POLISH]]
- BYOK key supplied per-request → [[../backlog/BYOK_KEY_HANDLING]] (for now the key comes from `ANTHROPIC_API_KEY` server env)
- Test coverage and fixture-driven RobotProvider → [[../backlog/BACKEND_TESTS]]
- Chart payloads from tool results → [[../adr/007-CHART_LIBRARY]]
- UI wiring → [[../backlog/CHAT_UI]]

## Related

- [[AI_PROVIDER]] — the provider interface this handler depends on
- [[QUERY_TOOLS]] — the tool set the executor dispatches to
- [[../adr/002-BYOK_CLAUDE]]
- [[../adr/003-SSE_FOR_AI_STREAMING]] — why this first cut is JSON not SSE
- [[../adr/008-TEXT_TO_SQL]] — why predefined tools, not raw SQL
- [[../reading/01_CLAUDE_CAPABILITIES]]
- [[../reading/03_NO_HALLUCINATION]]
- [[../artefacts/kickoff_audio_sync]]
