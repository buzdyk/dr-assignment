---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-003: Server-Sent Events for AI frontend comms

## Status
Accepted

## Context
Claude responses can take several seconds to complete. Rendering them only after the full response arrives feels unresponsive. The frontend needs to display tokens incrementally as the model produces them. The transport only needs to be server → client; the client does not need to push mid-stream.

## Decision
Use Server-Sent Events (SSE) for streaming Claude output from the Nuxt server to the browser. The client opens a regular HTTP request to the Nuxt API route and consumes an `EventSource`-style token stream; user input is sent via a separate POST that initiates the SSE response.

## Consequences
- Simpler than WebSockets: plain HTTP, auto-reconnect in the browser, works through most proxies.
- Aligns with the Anthropic SDK's streaming format — tokens can be forwarded with minimal transformation.
- One-way by design; if we later need mid-stream client messages (cancel, interrupt), we'll do it over a sidecar HTTP call or upgrade to WebSockets.
