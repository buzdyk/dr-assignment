---
type: todo
status: icebox
description: Lift the hardcoded `claude-sonnet-4-6` model name (and the two max_tokens values) out of claude.ts and into env config
reason: PoC pins a single model on purpose — only meaningful to extract once we want to A/B versions, support multi-deployment with different model needs, or roll forward to a new model without a code change
---
# Claude model configurable via env

## Problem

The Claude provider hardcodes `claude-sonnet-4-6` and the `max_tokens` values (1024 for `pickTools`, 2048 for `summarize`) inside `demo/server/ai/providers/claude.ts`, decided in [[../completed/CLAUDE_PROVIDER_ADAPT]]. Changing any of them — to test a new Claude release, run a different vendor on Opus, or bump token budget for verbose summaries — requires a code edit and a redeploy.

For the PoC this is correct: one model, one config, no knob to misset. But it stops being correct the moment any of these is true:

- A new Sonnet release ships and we want to switch deployments incrementally.
- A vendor has a quality requirement that justifies Opus, or a cost requirement that justifies Haiku.
- We want to A/B compare model versions on the same prompt set.
- Someone running the demo locally wants to point at a different model for cost reasons.

## Approach

Three env vars, all optional with the current values as defaults:

```
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_MAX_TOKENS_PICK=1024
CLAUDE_MAX_TOKENS_SUMMARIZE=2048
```

Read inside `createClaudeProvider`, fall back to the literals already in code. Document in `.env.example`. No runtime config file, no per-request override — this is config, not policy.

If multi-vendor model selection is ever needed (one vendor on Opus, another on Haiku), that's a separate item — keep this one strictly about per-deployment env override.

## Trade-offs

- One more knob someone can misconfigure (typo'd model name → API errors at request time, not boot). Cheap mitigation: validate the model name at provider construction against a small allowlist.
- Adds a tiny bit of indirection for a value that mostly never changes. Acceptable.

## Triggers to thaw

- New Claude model release we want to deploy without a code change.
- Need to A/B compare two model versions.
- A reviewer or partner wants to point the same code at a different model locally.
