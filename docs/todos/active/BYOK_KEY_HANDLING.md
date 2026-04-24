---
type: todo
status: active
description: Wire the Claude API key from a server-side env var into the Anthropic client
---
# BYOK Key Handling

## Problem

The app must call Claude without shipping a bundled key. Reviewers supply their own via environment. See [[../../adr/002-BYOK_CLAUDE]].

## Approach

- `.env.example` documents `ANTHROPIC_API_KEY=` with a placeholder — reviewer copies to `.env`
- `docker-compose.yml` forwards `ANTHROPIC_API_KEY` into the app container via `environment:` (not baked into the image)
- Nuxt reads it via `useRuntimeConfig()` / `process.env` in the server layer only; never exposed to the client bundle
- Server routes build the Anthropic client on request using the env value
- Fail fast with a clear error message at boot if the variable is missing

## Related

- [[../../adr/002-BYOK_CLAUDE]]
- [[SSE_AI_ENDPOINT]]
- [[DOCKER_COMPOSE_SETUP]]
