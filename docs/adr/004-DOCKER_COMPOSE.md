---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-004: Docker Compose for one-line setup

## Status
Accepted

## Context
A "one-line setup" is an explicit MVP requirement. Reviewers should be able to clone the repo and run a single command to get the app running, without installing Node, matching versions, or configuring anything locally.

## Decision
Ship a `docker-compose.yml` that builds and runs the Nuxt app. The documented setup is `docker compose up`. Any future services (cache, db) slot into the same compose file.

## Consequences
- Reviewer-friendly: Docker is the only host dependency.
- Consistent runtime between machines — no "works on my Node version" issues.
- Slightly slower iteration than running Nuxt directly on the host; the compose file should mount source for hot reload in dev.
