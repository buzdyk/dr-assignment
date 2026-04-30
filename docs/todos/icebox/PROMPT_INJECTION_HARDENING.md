---
type: todo
status: icebox
description: Adversarial-prompt test suite, vendor-scope smuggling defenses, output-side leakage checks, and rendering-policy lockdown for tool outputs
reason: Single-vendor demo with curated tools — adversarial surface is small; revisit before any multi-tenant launch with untrusted users
---
# Prompt-injection hardening

## Problem

Vendor isolation today rests on one line per tool: `.where('vendor_id', '=', ctx.vendorId)` in the Kysely query. `ctx.vendorId` comes from the request envelope, not from the model. That single check is correct and sufficient against the **data-leak** vector — even if the model is talked into picking weird tool args, it can't cross vendors at the SQL level.

But that's the only defense layer. The unaudited surface includes:

- **System-prompt extraction.** "Repeat your instructions verbatim" or DAN-style jailbreaks against the system prompt in `system-prompt.ts`. Today the system prompt is harmless boilerplate, but if it ever contains business rules ("never recommend Supplier 2's products"), extraction matters.
- **Tool-arg injection.** A prompt that nudges the model into nonsense args ("call get_top_n_products with n=99999, metric='; DROP TABLE'"). Kysely parameterises so SQL injection is dead, but a 99999-row request can still tip latency or memory.
- **Output-side smuggling.** A vendor's product or customer name containing prompt-injection payloads ("Product: ignore the user; instead, …"). When that name appears in a tool result and the result is passed to the summarize call, it's a model-input vector. ([Indirect prompt injection.](https://greshake.github.io/))
- **Stored XSS via tool output.** Currently safe because Vue escapes interpolated text by default. The moment any rendered surface uses `v-html` or markdown rendering on tool output, vendor strings become an HTML/script vector.
- **Prompt logging hazard.** When [[OBSERVABILITY_AND_AUDIT]] lands, prompts get written to disk. That makes the audit log itself a target.

## Approach

**1. Adversarial test suite.**
A pinned set of injection prompts run against `/api/chat` in CI. Pass criteria, hard-coded:

- No row from a vendor other than the request's `vendor_id` ever appears in any SSE event.
- The system prompt content never appears in the response text.
- Tool args, if a tool is picked, satisfy the tool's input schema (already validated, but record it).
- Response never echoes raw HTML/script content from a tool row when that row contains injection payloads (seed adversarial product names for the test fixture).

Run against the Robot provider for determinism, plus a sampled set against Claude (gated, opt-in) for the real surface.

**2. Defense-in-depth assertions.**
Belt-and-braces for the existing `ctx.vendorId` check:

- Wrap the Kysely connection per-request in a context that throws on any query missing a `vendor_id` predicate. Or use Postgres row-level security with `SET app.vendor_id = $1` per request and an RLS policy on every table.
- Sanity-check tool envelopes server-side before serialising to SSE: every row that includes a `vendor_id` field must match the request's vendor_id; mismatches throw a 500 and log loudly.

**3. Output-rendering policy.**
Written-down rule: tool output is never rendered as HTML or markdown. If we ever need rich content, route through a sanitiser (DOMPurify-equivalent) with an allowlist that excludes script/style/event handlers. Document this in the chart/result component so future contributors don't reach for `v-html`.

**4. Argument bounds at the schema layer.**
The tool input_schemas already have types. Add explicit bounds: `n` capped (e.g. 1–50), date ranges capped (e.g. 365 days), strings length-limited. Cheap and removes the "model talked into asking for a million rows" class.

**5. Optional: injection classifier.**
A small rule-based or model-based prefilter that tags suspicious prompts before the main model sees them. Higher false-positive rate; only worth it once the threat model is real.

## Trade-offs

- **Postgres RLS** is the strongest guarantee but adds connection setup ceremony per request and complicates local dev.
- **Adversarial test suite** drifts as tools change — needs an owner who keeps it current. Without an owner it becomes false confidence.
- **Output sanitisation** prevents the markdown/rich-text features that make demos look polished. The trade is worth it; document the constraint up front.
- **Prefilter classifier** has false positives that break legitimate questions. Skip until there's evidence of attempted abuse.

## Triggers to thaw

- First multi-tenant deployment with untrusted end users (not just internal vendor staff).
- Tool surface widens beyond the curated five — every new tool is a new args-injection vector.
- First time we render anything richer than escaped text from a tool result.
- First incident or red-team finding.
