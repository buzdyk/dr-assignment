---
type: todo
status: icebox
description: True multi-hop agentic loop where the model can call tools, see results, and decide on follow-up tools before answering
reason: No user query yet needs it; current single-shot pick → execute → summarize covers the demo prompts
---
# Multi-hop tool loop

## Problem

The current runner ([[../../../demo/server/ai/runner.ts]]) is single-shot: `pickTools` returns one batch of tool calls, the runner executes all of them, and `summarize` produces the final text. Claude can't see a tool's result and decide to call another tool based on it. That rules out queries like:

- "Which region drove the cancellation spike?" → first look at `get_order_status_mix`, see cancellations are concentrated in EU, then call `get_revenue_by_region` filtered to those orders.
- "Compare top product revenue against the category trend" → fetch top products, then fetch category breakdown for whichever category the leader belongs to.

It also blocks the natural Claude convention of streaming `tool_use` blocks → `tool_result` blocks → `tool_use` blocks → … → final text in a single conversation thread.

## Approach

Collapse `pickTools` + `summarize` into one method:

```ts
interface AIProvider {
  nextStep(input: StepInput): AsyncIterable<StepEvent>
}

type StepInput = {
  system: string
  tools: ModelFacingSpec[]
  messages: ChatMessage[]   // grows across hops
}

type StepEvent =
  | { type: 'tool_use'; id: string; name: string; args: unknown }
  | { type: 'text_delta'; text: string }
  | { type: 'turn_end'; stop_reason: 'tool_use' | 'end_turn' }
```

The runner drives the loop:

```
loop:
  for event in provider.nextStep({ system, tools, messages }):
    if event is text_delta:    emit('text', delta)         # stream straight through
    if event is tool_use:      pendingCalls.push(event)
    if event is turn_end:
      if stop_reason == 'end_turn': break loop
      results = await dispatch(pendingCalls)
      messages.push(assistantMsg(pendingCalls))            # tool_use blocks
      messages.push(userMsg(results))                      # tool_result blocks
      emit('tool_start' / 'tool_result') for each
```

Termination: cap at e.g. 5 hops to bound runaway loops; emit an `error` event if exceeded.

For the Robot provider, multi-hop is not meaningful — keep it as a single-step adapter that yields one batch and a `turn_end: end_turn`. Or fake a two-hop script for one specific test prompt.

Real `tool_use` / `tool_result` blocks (not the prose reconstruction in [[../backlog/CLAUDE_PROVIDER_ADAPT]]) are part of this — multi-hop only works if Claude sees its own prior tool calls as structured blocks on the next call.

## Trade-offs

- **Latency stacks per hop.** Each round-trip adds the model's TTFB plus the tool's runtime. A 3-hop answer may take 6–10s vs ~2s today.
- **Cost stacks per hop.** Each hop re-sends the growing message history; tokens scale roughly linearly with hop count.
- **Provider abstraction gets thinner.** `nextStep` is closer to Claude's native shape than the current `pickTools` / `summarize` split. Adapting another LLM that doesn't expose a streaming tool loop becomes harder. Acceptable — Claude is the only target.
- **Robot loses parity.** With a multi-hop interface, the Robot stub is a degenerate case (single step). Tests that exercise hop accumulation can't run against Robot at all.

## Triggers to thaw

- A real user query needs cross-tool reasoning.
- Single-shot summary quality drops because Claude can't pick a tool informed by another tool's output.
- The synthetic-prose tool-result reconstruction in [[../backlog/CLAUDE_PROVIDER_ADAPT]] visibly degrades summaries.

## Related

- [[../backlog/CLAUDE_PROVIDER_ADAPT]] — the current single-shot Claude adapter; this supersedes its provider interface
- [[../active/SSE_AI_ENDPOINT]] — defined the original `pickTools` + `summarize` split
- [[../../adr/008-TEXT_TO_SQL]]
