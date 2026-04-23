---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-001: Nuxt for frontend and backend

## Status
Accepted

## Context
The project needs both a frontend UI and a backend that can call the Claude API and stream responses. As a single-developer test assignment, running two separate stacks (e.g. React + a Node API) would multiply build config, deployment units, and dev-loop overhead without delivering assignment value.

## Decision
Use Nuxt as the single full-stack framework. Pages render the UI; Nitro server routes (`server/api/**`) serve the backend, including the Claude proxy and the SSE endpoint.

## Consequences
- One app, one Dockerfile, one dev server — aligns with the "one-line setup" MVP goal.
- Server routes and the UI share types and utilities directly.
- Frontend and backend scale together. If later growth needs them on separate footprints, the Nitro server routes can be extracted into a standalone Nitro app without rewriting — but not for free.
