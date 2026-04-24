---
type: epic
status: done
description: Deploy the NexTrade demo to a single OVH Public Cloud VM via Terraform + cloud-init, fronted by Caddy auto-TLS
---
# Deployment to OVH

Goal: publish the demo on a public URL for DR review, from a single OVH Public Cloud VM, reproducibly, via Terraform + cloud-init. The domain and edge basic-auth credentials are supplied at apply time via a gitignored `deploy/terraform.tfvars` — never committed. Fastest clean path — one host, the existing compose file with a prod override, auto-TLS via Caddy, runtime image pulled from GHCR. No HA, no managed Postgres, no CI/CD yet.

## Todos

| # | Todo | Scope |
|---|------|-------|
| 01 | [[deployment/01-OVH_TERRAFORM]] | OVH account prereqs + Terraform module that provisions the VM, SSH key, and outputs the public IPv4 |
| 02 | [[deployment/02-CLOUD_INIT]] | First-boot user-data: install Docker, write `.env`, log in to GHCR, run migrations + seeds, bring the stack up |
| 03 | [[deployment/03-GHCR_IMAGE]] | Build + push the runtime and migrate images to GHCR; `docker-compose.prod.yml` override that pulls them |
| 04 | [[deployment/04-TLS_AND_DNS]] | Caddy sidecar for auto-TLS + basic-auth gate; A record pointing the chosen hostname at the instance |

## Bootstrap order

1. **One-time OVH bootstrap** ([[deployment/01-OVH_TERRAFORM#prerequisites]]) — create Public Cloud project, generate API credentials, stash in a gitignored `terraform.tfvars`.
2. **Build & push the image** ([[deployment/03-GHCR_IMAGE]]) — tag `ghcr.io/<owner>/dr-assignment:latest` and `…-migrate:latest`, push. First deploy is manual; future CI can own it.
3. **Terraform apply** ([[deployment/01-OVH_TERRAFORM]]) — provisions the VM with cloud-init baked in as `user_data`. Output is the public IPv4.
4. **Point DNS** — A record (hostname from `terraform.tfvars`) → `instance_ipv4` output.
5. **Wait for cloud-init** ([[deployment/02-CLOUD_INIT]]) — Docker installs, compose file + `.env` land on disk, migrations + seeds run, stack starts. Caddy obtains the LE cert once DNS has propagated.
6. **Smoke test** — `curl -u <user>:<password> https://<domain>/` with the basic-auth creds from `terraform.tfvars`, then walk through a chat turn end-to-end. No key entry needed — the server has one baked in per [[../../adr/010-BAKED_CLAUDE_KEY]].

## Scope

- Single `b2-7` (or smaller) VM in a European region (`GRA11` default).
- Postgres runs on the same host, persisted to a named Docker volume on the instance disk.
- Prod compose override; no source checkout on the VM — only the compose file, the Caddyfile, and `.env`.
- Operator's Anthropic key is baked into the deploy — see [[../../adr/010-BAKED_CLAUDE_KEY]].

## Out of scope

- **HA / multi-AZ.** Single VM is explicit. A reboot or host failure takes the demo offline.
- **Managed Postgres.** Same host as the app; backups are manual snapshots if/when needed.
- **Zero-downtime deploys.** `docker compose pull && up -d` is acceptable.
- **CI push to GHCR.** Manual build + push for now; see [[../icebox/CI_GITHUB_ACTIONS]] for the thaw trigger — the same workflow would own the push step.
- **Observability.** No log aggregation, no metrics endpoint beyond Docker + Caddy access logs on the host.

## Related

- [[../../adr/009-OVH_SINGLE_VM]] — the platform + shape decision this epic implements.
- [[../../adr/004-DOCKER_COMPOSE]] — the compose file this epic ships as-is plus a prod override.
- [[../../adr/010-BAKED_CLAUDE_KEY]] — server-baked Claude key (supersedes [[../../adr/002-BYOK_CLAUDE]]).
- [[../icebox/CI_GITHUB_ACTIONS]] — future home of the GHCR push step.

## Open questions

- **Instance size.** `b2-7` (2 vCPU / 7 GB) is safe with Postgres colocated; `d2-2` (1 vCPU / 2 GB) probably also works. Pick at provisioning; it's a one-line change in `deploy/terraform.tfvars`.

## What Was Done

All four children landed in the `deploy/` directory plus a `cloud-*` Make target family at the repo root. Single `terraform apply` + manual A-record + first manual `make cloud-build cloud-push` is the end-to-end flow; cloud-init takes the VM from fresh Ubuntu 24.04 to a Caddy-fronted, basic-auth-gated HTTPS endpoint with migrations + seeds applied. ADR-010 was accepted in parallel and supersedes the BYOK assumption from ADR-002 — the operator's Anthropic key is baked into `terraform.tfvars` and forwarded into the app container's env. State remains local, no CI yet (deferred to [[../icebox/CI_GITHUB_ACTIONS]]).
