---
type: todo
status: pending
description: Dockerfile and docker-compose.yml for one-line project setup
---
# Docker Compose Setup

## Problem

MVP calls for a one-line setup. We need a Dockerfile for the Nuxt app and a `docker-compose.yml` so `docker compose up` boots the whole project. See [[004-DOCKER_COMPOSE]].

## Approach

- Multi-stage Dockerfile: install → build → runtime (Node slim)
- `docker-compose.yml` with a single `app` service, exposing the Nuxt port
- Mount source for hot reload in dev profile
- Document the one-line command in the root README

## Related

- [[004-DOCKER_COMPOSE]]
- [[SCAFFOLD_NUXT_APP]]
