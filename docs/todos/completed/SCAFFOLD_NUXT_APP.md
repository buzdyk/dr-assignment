---
type: todo
status: done
description: Scaffold the Nuxt project skeleton in /demo (pages + server routes)
---
# Scaffold Nuxt App

## Problem

We need the base Nuxt project that will host both the frontend UI and the server routes for the Claude proxy / SSE endpoint. See [[../../adr/001-NUXT_FULL_STACK]].

The app lives in `/demo` (not the repo root) so assignment docs, ADRs, and devlog can stay siblings to the app.

## Approach

- `npx nuxi@latest init demo` from repo root
- Keep TypeScript defaults, npm as package manager
- Verify default template boots via `npm run dev` on the host machine
- Follow-up: minimal landing page that will later host the chat UI
- Follow-up: health-check server route to prove Nitro is wired up
