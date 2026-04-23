# Launch Plan

## Current State

A test assignment for Diverted River (DR). Project is at initial docs scaffolding — no application code yet.

## Launch Stages

### Stage 1 — MVP

One-line setup Docker Compose project with BYOK Claude integration.

- [ ] Nuxt project scaffolded (frontend + backend in the same app)
- [ ] Dockerfile for the Nuxt app
- [ ] `docker-compose.yml` wiring the app service for one-command startup
- [ ] `README` with the one-line setup command
- [ ] BYOK flow — user supplies their Claude API key (no server-side secret)
- [ ] Server-side Nuxt API route that calls Claude using the user-supplied key
- [ ] SSE endpoint streaming Claude responses token-by-token
- [ ] Frontend SSE consumer rendering streamed output
- [ ] Basic chat UI exercising the BYOK + SSE path end-to-end

## Launch Blockers

- [ ] None yet identified
