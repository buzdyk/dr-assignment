---
type: todo
status: pending
description: Scaffold the Nuxt project skeleton (pages + server routes)
---
# Scaffold Nuxt App

## Problem

We need the base Nuxt project that will host both the frontend UI and the server routes for the Claude proxy / SSE endpoint. See [[001-NUXT_FULL_STACK]].

## Approach

- `npx nuxi init` at the repo root
- Keep TypeScript defaults
- Add a minimal landing page that will later host the chat UI
- Add a health-check server route to prove Nitro is wired up

## Related

- [[001-NUXT_FULL_STACK]]
- [[LAUNCH]]
