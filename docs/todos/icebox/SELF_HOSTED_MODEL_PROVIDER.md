---
type: todo
status: icebox
description: Add a self-hosted / OpenAI-compatible model as a third AIProvider implementation for vendors with data-residency or cost constraints
reason: PoC uses BYOK Claude; on-prem inference only justified once a real vendor needs it
---
# Self-hosted model provider

## Problem

Today the only real backend is Claude via BYOK ([[../../adr/002-BYOK_CLAUDE]]). Vendors in regulated regions (EU, healthcare, gov), customers with strict data-residency rules, or anyone trying to cap inference cost at scale will not be willing to send vendor data to a hosted third party. The `AIProvider` seam in [[../completed/SSE_AI_ENDPOINT]] was deliberately built to absorb this — we just have not used the seam yet.

## Approach

Add a third implementation behind the existing interface. Likely two viable shapes:

- **OpenAI-compatible HTTP backend** (vLLM, Ollama, llama.cpp server, LM Studio, TGI). One adapter against `/v1/chat/completions` with `tools` and `tool_choice`. Configured via env: `AI_PROVIDER=local`, `LOCAL_MODEL_BASE_URL=...`, `LOCAL_MODEL_NAME=...`, `LOCAL_MODEL_API_KEY=...`. Most modern open models (Llama 3.1 70B Instruct, Qwen 2.5 72B Instruct, DeepSeek V3, Mistral Large) expose function-calling through this surface.
- **Native HF / transformers serving** as a fallback. Heavier wrapping; only worth it if a target deployment can't host an OpenAI-compatible front end.

Streaming normalisation: the SSE chunk format differs between vLLM (OpenAI-shape `delta.content`), Ollama (`message.content` per chunk), and TGI (token events). Adapter normalises to the existing `summarize` async iterator.

Tool-call reliability: the gap vs Claude is real. Mitigations to write into the spec when this thaws:

- Smaller toolset surfaced per request (top-k semantic match) instead of all five.
- Stricter system prompt with explicit "if no tool fits, say so" rule.
- Validation/retry loop on malformed `tool_calls` JSON.

## Trade-offs

- **Tool-pick quality** drops, especially on quantised or sub-30B models. Probably acceptable for the curated five-tool surface; fragile if the toolset grows.
- **Latency** depends on hosting hardware. A 70B-class model on 1×H100 streams ~30 tok/s; on commodity GPUs the chat will feel sluggish.
- **Hardware floor**: usable 70B serving needs ≥40 GB VRAM. 8B-class models (Llama 3.1 8B) fit on consumer GPUs but tool selection becomes coin-flip on ambiguous prompts.
- **Maintenance surface**: every new open-model release potentially shifts the tool-call output format. Pin a model + version per deployment.

## Triggers to thaw

- A vendor explicitly requires on-prem / EU-only / no-third-party inference.
- Claude API spend at scale exceeds the cost of running a self-hosted instance.
- A platform partner wants to embed this in an environment that has no outbound internet to api.anthropic.com.
