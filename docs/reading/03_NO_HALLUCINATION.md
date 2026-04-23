---
type: reading
date: 2026-04-23
---
# Hallucination guardrails for the NexTrade AI assistant

Reference notes on keeping Claude's answers grounded in the NexTrade data layer. The concrete concern that drives this came from [[../artefacts/kickoff_audio_sync]]:

> Dave: "Our records show what day an item was bought, the price, and whether the order was canceled. But we do not record *why*. So if the vendor asks the AI, 'Why are my cancellation rates so high this week?', I don't want the AI making up a story about shipping delays just to be helpful."

The defensive work is about making sure the AI says "I don't have that data" when it doesn't, instead of inventing one.

## What "hallucination" means here

Hallucination, in our context, is the model returning a specific claim (a number, a trend, a reason) that isn't supported by the data it has access to. It differs from generic LLM hallucination because the authoritative answer *exists* — it's in Postgres — the model just has to admit when the answer isn't reachable through the available tools.

Three flavours to watch for:

- **Fabricated values** — invented numbers, dates, product names. Mitigated by only surfacing values returned from tool calls.
- **Unsupported explanations** — "cancellations are high because of shipping delays" when we don't track delay data.
- **Overreach from partial data** — extrapolating a trend from three data points and stating it as fact.

## Techniques and how they apply here

### 1. Constrained tool use (the most load-bearing defense)

The single biggest guardrail is to stop asking the model to *generate* facts in prose and instead have it *pick tools* that return data. Prose wraps what the tools say; it doesn't invent new values.

**For this project:** the leaning in [[../adr/008-TEXT_TO_SQL]] (predefined tools) means the AI can only answer with numbers that came from a tool call. Cancellation *reasons* have no tool, so the AI has nothing to return if asked — the structural mitigation does most of the work.

### 2. System prompt discipline

A few lines that meaningfully help:

- "If the data needed to answer is not returned by any available tool, say 'I don't have that data' and stop."
- "Do not infer, estimate, or extrapolate values that weren't returned by a tool."
- "When a tool returns zero rows, say so explicitly — do not describe what the data might have looked like."

**For this project:** the system prompt should name the cancellation-reason gap by hand, since it's the explicit landmine from the kickoff. Something like: "Our database records cancellations but not cancellation reasons. If asked why something was cancelled, say you don't have that information — do not invent reasons."

### 3. Low temperature

`temperature: 0` (or close to it) makes responses more deterministic and less "creative." It doesn't eliminate hallucination but reduces free-form embellishment around factual claims.

**For this project:** chat responses run at low temperature. Charts come from tool output so temperature is moot for chart data.

### 4. Keep rendered values out of the prose channel

Anything the UI renders as a *value* (a chart number, a headline total) should come from tool output, not from model-generated text. If the UI parses prose to extract a number, the guardrail's already gone.

**For this project:** chart payloads come directly from tool returns; the model never types the number into prose. Surrounding text can narrate tool outputs but shouldn't introduce new values.

### 5. Refusal-first prompting

Phrase the system prompt so "I don't know" is the default behaviour, not the exception:

> You are a reporting assistant with access to a specific set of tools. If a question cannot be answered by one of those tools, say so clearly and stop. Do not attempt to answer questions outside the available data.

Contrast with the default LLM tendency, which is to always produce a confident answer.

### 6. Tool-return provenance (post-MVP)

Logging tool responses server-side lets us audit prose-vs-fact drift later. If the model quotes a number that wasn't in any tool result, the logs show it. Not critical for MVP but worth knowing as a later mitigation.

## NexTrade cases worth testing explicitly

From the kickoff, the obvious traps:

- **"Why are my cancellations high this week?"** — no reason data. Expected: "Our records show cancellations happened but don't capture reasons. I can tell you the rate, not the why."
- **"What's going to happen next quarter?"** — no forecasting tool. Expected: "I can show past trends; I can't predict future sales."
- **"Compare my products to Supplier 2's."** — tenant isolation forbids this. Expected: "I can only show your own data."
- **"How many red widgets did I sell?"** when no product has a matching name/colour attribute — expected: "I don't see any products matching that description in your catalog."

Worth keeping these as a small eval set once the prompt stabilises.

## Things that don't help much

- **Asking the model to "be careful" or "be accurate"** — vague instructions are close to noise against baseline model behaviour.
- **Post-hoc fact-checking with a second LLM call** — useful for high-stakes outputs; doubles cost and latency; overkill for MVP.
- **Long system prompts with 20 rules** — effectiveness drops quickly. Pick 3-5 rules that matter and keep them precise.

## Further reading

- [[01_CLAUDE_CAPABILITIES]] — the Anthropic tool-use and system-prompt mechanics this relies on.
- Anthropic's docs on prompt engineering and tool use.
- Academic literature on LLM hallucination is broad; practical app-developer techniques are still evolving in 2026.
