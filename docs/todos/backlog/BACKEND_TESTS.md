---
type: todo
status: backlog
description: Backend test coverage with a provider-abstracted AI interface and a mock provider for deterministic tests
---
# Backend Tests

## Problem

The backend has no test coverage yet. AI interactions are the hardest part to test reliably — real Claude calls are non-deterministic, cost money, and require a key. We need a provider abstraction so tests run against a mock and swapping in other providers later (e.g. OpenAI, Bedrock) is a one-file addition rather than a rewrite.

## Approach

- **Provider interface** — define an `AIProvider` interface (e.g. `streamChat(messages, tools) → AsyncIterable<Event>`) that both the Claude adapter and the mock implement. Server routes depend on the interface, not the Anthropic SDK directly.
- **Mock provider** — a test-only implementation that replays scripted responses (token streams, tool calls, errors) from fixtures. Deterministic, no network, no key.
- **DI at the route layer** — the provider is resolved per-request via a factory that defaults to Claude in prod and the mock in tests. Keep it dead simple — no DI framework.
- **Test surface** — cover SSE framing, tool dispatch, tenant-id injection, error propagation. Integration-style tests hitting the real route handlers with the mock provider wired in.
- **Runner** — whatever Nuxt/Nitro's default is (likely Vitest). Hit a real DB via the same migrations/seeds used in dev.

## Related

- [[SSE_AI_ENDPOINT]]
- [[../../adr/002-BYOK_CLAUDE]]
- [[../../adr/008-TEXT_TO_SQL]]
