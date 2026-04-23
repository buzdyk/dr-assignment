---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-002: BYOK Claude as managed LLM

## Status
Accepted

## Context
The MVP needs an LLM backend. Self-hosting a model adds infra cost, latency, and complexity irrelevant to the assignment. Bundling a shared API key would require a billing relationship and secret management for a test project that multiple reviewers may run.

## Decision
Use Anthropic's Claude as a managed LLM, accessed in Bring-Your-Own-Key (BYOK) mode. The user provides their own Claude API key at runtime; the server never stores a key of its own.

## Consequences
- No secrets to ship, rotate, or leak in the repo — the app is safe to clone and run.
- Each reviewer pays for their own tokens; no billing concerns on our side.
- The key has to be handed from the browser to the server securely for each request (e.g. request header, session-scoped storage) — not persisted server-side.
- We rely on Anthropic's availability and rate limits; no fallback provider in MVP.
