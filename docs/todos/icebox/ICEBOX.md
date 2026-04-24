# Icebox

Deferred indefinitely. Each item includes a reason.

<!-- GENERATED:START -->
| Todo | Description | Reason |
|------|-------------|--------|
| [CHART_LIBRARY_SWAP_TO_SHADCN](./CHART_LIBRARY_SWAP_TO_SHADCN.md) | Replace the hand-rolled SVG ResultChart with shadcn-vue Chart on unovis-vue | ADR-007 was amended to ratify the in-house SVG choice (Option G) — three chart shapes on a curated dataset don't justify a library; thaw only when the chart UX needs interactivity, animations, or shapes the SVG can't easily give us |
| [CHAT_POLISH](./CHAT_POLISH.md) | Conversation history, persistence, and multi-turn refinement for the chat endpoint | Stateless one-shot chat covers the demo prompts; multi-turn history is only worth the design work once a real user flow asks for follow-ups or chart-refinement turns |
| [CI_GITHUB_ACTIONS](./CI_GITHUB_ACTIONS.md) | Run the Vitest unit + HTTP suites on every push and pull request via GitHub Actions, with a Postgres service container | PoC is local-only by design; CI plumbing is busywork until there's a collaboration model (external contributors, more than a couple of people, or a "broke main without noticing" incident) that actually needs the safety net |
| [CLAUDE_MODEL_CONFIGURABLE](./CLAUDE_MODEL_CONFIGURABLE.md) | Lift the hardcoded `claude-sonnet-4-6` model name (and the two max_tokens values) out of claude.ts and into env config | PoC pins a single model on purpose — only meaningful to extract once we want to A/B versions, support multi-deployment with different model needs, or roll forward to a new model without a code change |
| [MULTI_HOP_TOOL_LOOP](./MULTI_HOP_TOOL_LOOP.md) | True multi-hop agentic loop where the model can call tools, see results, and decide on follow-up tools before answering | No user query yet needs it; current single-shot pick → execute → summarize covers the demo prompts |
| [OBSERVABILITY_AND_AUDIT](./OBSERVABILITY_AND_AUDIT.md) | Structured logging, per-tool metrics, model token accounting, and a vendor-scoped audit trail for compliance and post-incident debugging | PoC has zero server-side observability and that's intentional — adding it before there's a real deployment to point telemetry at is busywork |
| [PROMPT_INJECTION_HARDENING](./PROMPT_INJECTION_HARDENING.md) | Adversarial-prompt test suite, vendor-scope smuggling defenses, output-side leakage checks, and rendering-policy lockdown for tool outputs | Single-vendor demo with curated tools — adversarial surface is small; revisit before any multi-tenant launch with untrusted users |
| [RAW_DATA_VIEW_AND_DOWNLOAD](./RAW_DATA_VIEW_AND_DOWNLOAD.md) | Extend the tool envelope with un-aggregated joined rows so the table view and CSV download can show what actually went into each chart, not just the chart's own data | Today's table + CSV both render the post-aggregation result, which validates nothing — but extending the envelope is real work and only worth it once a real validation workflow exists |
| [SELF_HOSTED_MODEL_PROVIDER](./SELF_HOSTED_MODEL_PROVIDER.md) | Add a self-hosted / OpenAI-compatible model as a third AIProvider implementation for vendors with data-residency or cost constraints | PoC uses BYOK Claude; on-prem inference only justified once a real vendor needs it |
<!-- GENERATED:END -->

_Regenerate with `scripts/todos-index`._
