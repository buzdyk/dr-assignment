# Icebox

Deferred indefinitely. Each item includes a reason.

<!-- GENERATED:START -->
| Todo | Description | Reason |
|------|-------------|--------|
| [MULTI_HOP_TOOL_LOOP](./MULTI_HOP_TOOL_LOOP.md) | True multi-hop agentic loop where the model can call tools, see results, and decide on follow-up tools before answering | No user query yet needs it; current single-shot pick → execute → summarize covers the demo prompts |
| [OBSERVABILITY_AND_AUDIT](./OBSERVABILITY_AND_AUDIT.md) | Structured logging, per-tool metrics, model token accounting, and a vendor-scoped audit trail for compliance and post-incident debugging | PoC has zero server-side observability and that's intentional — adding it before there's a real deployment to point telemetry at is busywork |
| [PROMPT_INJECTION_HARDENING](./PROMPT_INJECTION_HARDENING.md) | Adversarial-prompt test suite, vendor-scope smuggling defenses, output-side leakage checks, and rendering-policy lockdown for tool outputs | Single-vendor demo with curated tools — adversarial surface is small; revisit before any multi-tenant launch with untrusted users |
| [SELF_HOSTED_MODEL_PROVIDER](./SELF_HOSTED_MODEL_PROVIDER.md) | Add a self-hosted / OpenAI-compatible model as a third AIProvider implementation for vendors with data-residency or cost constraints | PoC uses BYOK Claude; on-prem inference only justified once a real vendor needs it |
<!-- GENERATED:END -->

_Regenerate with `scripts/todos-index`._
