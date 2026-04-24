---
type: reading
date: 2026-04-23
---
# Claude API capabilities relevant to the NexTrade AI assistant

Reference notes on the Anthropic Claude features this prototype will actually touch. Not a spec — a cheat sheet to come back to while building.

## At a glance

| Capability | Why it matters here | Related |
|---|---|---|
| Streaming responses | Chat feels alive; tokens appear as Claude produces them | [[../adr/003-SSE_FOR_AI_STREAMING]], [[../todos/completed/SSE_AI_ENDPOINT]] |
| Tool use | Text-to-SQL and structured chart payloads both ride on it | (forthcoming text-to-SQL ADR) |
| System prompts | Constrain the model to the schema; refuse instead of hallucinating | [[../artefacts/kickoff_audio_sync]] |
| Prompt caching | Keep cost and first-token latency down when schema is always in context | — |
| Model selection | Pick a tier that matches SQL complexity vs. budget | — |

Capabilities intentionally **not** used in the MVP: Vision, PDF support, Files API, Batch API, Citations. Flag them here so we don't spend time on them by accident.

---

## Streaming

The Anthropic SDK exposes streaming in two flavours:

1. **High-level helper** — `client.messages.stream({...})`. Returns an object with typed events: `.on('text', delta => ...)`, `.on('message', final => ...)`. Good when you just want text deltas.
2. **Low-level iterator** — `client.messages.create({ stream: true, ... })`. Yields raw SSE events one-by-one. Use this when you need to forward every event, including tool-use events, to the browser.

### Event types to know

- `message_start` — metadata, usage estimates.
- `content_block_start` — a new block begins (text, tool_use, thinking, etc.).
- `content_block_delta` — the one you forward: `delta.type = "text_delta"` carries the actual tokens; `input_json_delta` carries streaming tool arguments.
- `content_block_stop` — block ended.
- `message_delta` — cumulative stop reason, updated usage.
- `message_stop` — final frame; close the SSE stream after this.
- `ping` — keep-alive, ignore.
- `error` — something went wrong; surface it.

### Relaying through Nuxt/Nitro

Nitro supports SSE directly via h3's `createEventStream`:

```ts
// server/api/chat.post.ts
export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event)
  const eventStream = createEventStream(event)

  // Don't await — respond immediately, push as tokens arrive
  ;(async () => {
    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      stream.on('text', (delta) => {
        eventStream.push({ event: 'token', data: JSON.stringify({ text: delta }) })
      })

      stream.on('finalMessage', () => {
        eventStream.push({ event: 'done', data: '{}' })
        eventStream.close()
      })

      stream.on('error', (err) => {
        eventStream.push({ event: 'error', data: JSON.stringify({ message: err.message }) })
        eventStream.close()
      })
    } catch (err) {
      eventStream.push({ event: 'error', data: JSON.stringify({ message: String(err) }) })
      eventStream.close()
    }
  })()

  return eventStream.send()
})
```

Notes:
- Flatten the Anthropic event schema into an app-level one (`token`, `tool`, `done`, `error`). The browser shouldn't care about `content_block_delta`.
- When tool use lands, add a `tool` event type so the UI can show "running query…" while the tool executes server-side.
- On the browser, `EventSource` doesn't support custom POST bodies — use `fetch()` with a streaming response reader, or split into a `POST /chat` + `GET /chat/stream?id=...` pattern.

---

## Tool use

The mechanism behind text-to-SQL and structured chart output in this project.

### Shape

1. Define tools with `input_schema` (JSON Schema).
2. Send `messages.create({ tools: [...], ... })`.
3. If the response includes a `tool_use` block, execute the tool server-side using `input` as the args.
4. Send a follow-up turn with a `tool_result` block referencing the `tool_use_id`.
5. Loop until `stop_reason !== 'tool_use'`.

### Two tools we'll likely want

- **`run_sql`** — executes a SELECT against the NexTrade schema, with `vendor_id` forced at the execution layer (see tenant isolation in [[../artefacts/kickoff_audio_sync]]). The model generates SQL; the server wraps and runs it.
- **`render_chart`** — "tool" the model calls with `{ chart_type, title, data }` when it wants to show a visualization. The server doesn't do anything with it except forward the payload to the UI.

Using a tool for structured output (instead of asking for JSON in prose) is the idiomatic Anthropic approach — there's no separate "JSON mode."

### Streaming with tools

`input_json_delta` events stream the tool arguments piece-by-piece. For `run_sql` you usually want to wait for the full tool call before executing. For `render_chart` you can either wait for the whole payload or stream partial data if we want progressive rendering (probably not for MVP).

---

## System prompts

Passed as the `system` field on `messages.create`. Use it to encode three things:

1. **Schema context** — paste the NexTrade schema or a summary, so Claude can generate valid SQL without guessing column names.
2. **Tenant scope reminder** — "you are talking to vendor X, only answer questions about their data." Back this up with server-side SQL enforcement; don't trust the prompt alone (Dave's requirement).
3. **No-hallucination rule** — "if the data needed to answer isn't in the schema, say you don't have that information. Do not invent reasons, trends, or values." Critical for the cancellation-reasons case.

---

## Prompt caching

Reduces cost and latency when the start of your prompt is stable across calls. Relevant here because every request will include the NexTrade schema in the system prompt.

- Mark cacheable spans with `cache_control: { type: 'ephemeral' }` on a content block.
- Ephemeral cache TTL is 5 minutes (longer TTLs available in beta).
- Cache hits bill at a heavy discount; cache writes bill slightly above base.
- Put the schema and tool definitions inside a cached block; put the user's question and conversation history outside it.

---

## Model selection

| Model | Use when | Notes |
|---|---|---|
| `claude-haiku-4-5-20251001` | Follow-up calls, cheap post-processing | Fast and cheap; SQL quality drops on complex joins |
| `claude-sonnet-4-6` | Default for this project | Balanced; handles text-to-SQL and tool use well |
| `claude-opus-4-7` | Complex analytical questions or when Sonnet underperforms | Slowest and priciest; overkill for most vendor queries |

Start with Sonnet 4.6 everywhere. If we spot concrete failure modes on specific question types, escalate just those to Opus rather than moving the whole app.

---

## Error handling patterns

- **Rate limit (`429`)** — back off and retry with jitter. The SDK exposes `rateLimitRemaining` headers on responses.
- **Overloaded (`529`)** — retry with exponential backoff; surface a "model is busy, retrying" event on the SSE stream.
- **Tool execution failure** — return a `tool_result` with `is_error: true` and a short message; Claude can recover and either retry or explain.
- **Invalid SQL from the model** — capture the DB error, return it as a `tool_result` with `is_error: true`; Claude usually corrects and retries.

Surface errors as their own `error` frame on the SSE stream so the UI can show an inline message rather than a broken chat bubble.

---

## Open questions to revisit

- Do we stream tool arguments to the UI in real time, or wait for the full tool call? (Probably wait for MVP.)
- Where exactly does tenant scoping get injected — into the SQL string the model produces, or enforced at the driver layer via Postgres RLS? Both are valid; preferable option is the one that's hardest to bypass.
- Schema-in-system-prompt vs. schema-as-tool-description — both work; caching implications differ slightly.
