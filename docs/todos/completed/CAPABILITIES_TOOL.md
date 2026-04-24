---
type: todo
status: done
description: Add a meta tool the model can call to enumerate every available tool with its description when the user asks "what can you do?"
---
# Capabilities summary tool

## Problem

When a user asks the chat "what can you do?" / "what data can I see?" / "list your tools", there is currently no authoritative path. The model will answer from whatever the system prompt has seeded, which:

- Drifts from the real registry (tools added in `demo/server/ai/tools/index.ts:8-14` are invisible to the prompt until someone edits it).
- Is terse by necessity — full tool descriptions don't belong in the system prompt, so users get paraphrases rather than ground truth.
- Can't show the input schema, so a user never learns that `get_top_n_products` takes `n` and `metric`.

We already expose this list over `GET /api/debug/tools` for humans, but the model has no equivalent. Giving the model a tool to call puts the capability list on the same surface as any other answer — overview line, chart card, table rows — and it stays automatically up to date as we add tools.

## Approach

### New tool: `list_capabilities`

Lives at `demo/server/ai/tools/list-capabilities.ts`, registered in `tools/index.ts` alongside the others.

- **Input schema:** empty object (`{ type: 'object', properties: {} }`). No args — the full list is always the same for every vendor.
- **Handler:** reads `toolRegistry` (lazily, to avoid the import cycle that comes from self-reference), emits `{ name, description }` rows for every entry, optionally excluding itself.
- **Presentation:** `overview` is a one-line count ("5 tools available: top-N products, sales trend, ..."). `filters` empty. `chart` — this is the open question (see Decisions).

### Decisions to make

- **Chart shape.** `ChartHint` in `tools/types.ts:18-22` is `'bar' | 'line' | 'pie'`. A capability list is tabular, not chartable. Options:
  - (a) Make `chart` optional on the envelope and render nothing in the card body for this tool.
  - (b) Extend `ChartHint` with a `'table'` / `'none'` kind and handle it in the chart card.
  - (c) Abuse `bar` with a dummy y — ugly, do not do this.
  - **Preferred:** (a), because it's the first real example of "a tool whose useful output is the rows themselves, not a chart" and sets the precedent cleanly. Pairs naturally with [[EXPANDABLE_TOOL_CARD]].

- **Self-inclusion.** Does `list_capabilities` appear in its own output? **Exclude** — users asking "what can you do?" want domain capabilities, not the meta tool describing itself.

- **System-prompt nudge.** Add one sentence to the vendor system prompt telling the model to call `list_capabilities` when the user asks about its scope. Without the nudge, the model may keep paraphrasing from prompt context instead of calling the tool.

- **Naming.** `list_capabilities` reads better than `list_tools` to a non-technical user — "tools" is an implementation word. The internal registry name stays `tools/`.

## Out of scope

- Per-vendor scoping of capabilities (all vendors see all tools today; nothing to filter).
- Showing `input_schema` in the UI — rows carry only `name` + `description` for now. Schema introspection is a follow-up if someone asks for it.
- A natural-language tutorial/help flow — this is a flat list, not a walkthrough.

## Related

- [[EXPANDABLE_TOOL_CARD]] — once shipped, the capability rows render as a real table in the expanded card
- [[../active/CLAUDE_PROVIDER_ADAPT]] — the provider this tool calls through; no provider change needed, just registry addition
- [[../completed/SSE_AI_ENDPOINT]] — the envelope shape `chart` lives on
