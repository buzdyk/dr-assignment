---
type: todo
status: icebox
description: Structured logging, per-tool metrics, model token accounting, and a vendor-scoped audit trail for compliance and post-incident debugging
reason: PoC has zero server-side observability and that's intentional — adding it before there's a real deployment to point telemetry at is busywork
---
# Observability and audit

## Problem

The chat endpoint, runner, executor, and tools all emit nothing to the server today. Errors surface to the SSE `error` event and disappear; there is no trace of which tool ran, with what args, how long it took, what the model picked, or how many tokens were spent. On a real deployment this means:

- The first incident has no debugging trail.
- We can't answer "which tool is slowest?" or "which prompts make Claude pick wrong?" without re-running them by hand.
- A vendor asking "what did your AI do with my data on Tuesday?" gets a shrug.

## Approach

Three layers, separable — implement bottom-up:

**1. Structured runtime logging.**
A small logger (pino, or Nuxt's built-in) at three boundaries:

- **Request** (`chat.post.ts`): `{ vendor_id, prompt_chars, provider, debug }` on entry; `{ duration_ms, status }` on exit.
- **Provider** (`providers/claude.ts` once adapted): `{ model, op: 'pickTools' | 'summarize', input_tokens, output_tokens, duration_ms }` per call.
- **Tool dispatch** (`executor.ts`): `{ tool, args, row_count, duration_ms, is_error }` per call. Args summarised — never log full prompts at this level (they go in the audit log).

JSON-formatted, request_id-correlated, ship to stdout (Nitro convention; downstream collector picks them up).

**2. Per-tool metrics.**
Counters and histograms exposed via OpenTelemetry or a `/metrics` Prometheus endpoint:

- `tool_dispatch_duration_ms{tool,vendor_id}` (histogram)
- `tool_dispatch_errors_total{tool,vendor_id,error_kind}` (counter)
- `provider_tokens_total{model,direction,vendor_id}` (counter)
- `chat_request_duration_ms{provider,outcome}` (histogram)
- `chat_picks_total{tool}` and `chat_picks_total{tool="__none__"}` for pure-text answers

These give the dashboards needed to answer "p95 tool latency by tool", "tokens per request", "% of requests that needed tools".

**3. Vendor-scoped audit log.**
Distinct from runtime logs — append-only DB table:

```
audit_chat_event (
  id, vendor_id, request_id, ts,
  prompt, picked_tools jsonb, tool_results jsonb, response_text
)
```

Required for compliance ("show me everything you did for vendor X in March") and for offline replay when a vendor reports a wrong answer. Encryption at rest, retention policy, redaction rules for PII in prompts — all pre-launch checklist items.

## Trade-offs

- **Token-counting** requires reading `usage` off every Anthropic response. Cheap, but adds bookkeeping in the provider adapter.
- **Audit log of full prompts is sensitive data.** Once the table exists, GDPR/DSR obligations apply (delete on vendor offboarding, customer data subject requests). Don't write the schema until legal has weighed in on retention.
- **Telemetry pipeline** (OTLP collector, Prometheus, Grafana, log shipper) is its own deploy story. Doing layer 1 only — JSON to stdout — gets ~80% of the debugging value with ~20% of the ops cost.
- **High-cardinality labels** (`vendor_id` on every metric) blow up Prometheus storage at scale. Drop `vendor_id` from metric labels and keep it only in logs/audit if cardinality is a problem.

## Triggers to thaw

- First non-demo deployment.
- First incident that we can't debug from the user's screenshot.
- First vendor compliance ask ("we need an audit trail").
- First "is Claude getting slower?" suspicion that we can't answer with data.

## Related

- [[../completed/CHAT_ENDPOINT]] — the request boundary where logging starts
- [[../completed/CLAUDE_PROVIDER_ADAPT]] — token-usage extraction lives here
- [[../../adr/002-BYOK_CLAUDE]] — vendor-scoped key handling has its own audit needs
- [[PROMPT_INJECTION_HARDENING]] — audit log is part of the detection story for adversarial prompts
