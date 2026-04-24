---
type: adr
status: accepted
date: 2026-04-24
---
# ADR-010: Bake the Anthropic API key into the server deploy

## Status
Accepted — supersedes [[002-BYOK_CLAUDE]].

## Context

[[002-BYOK_CLAUDE]] defined the LLM strategy for the MVP: no server-stored key; each operator / reviewer supplies their own `ANTHROPIC_API_KEY` at runtime. That calculus assumed a loose set of self-serve reviewers cloning the repo locally and paying their own tokens.

The actual deploy (see [[009-OVH_SINGLE_VM]] and [[../todos/active/DEPLOYMENT]]) is a single public URL aimed at a handful of DR reviewers over a short window. Asking the reviewer to procure a Claude key before they can exercise the feature *being reviewed* is friction that fights the point of the demo. The BYOK posture was protecting against risks that don't match this deployment shape — shared host, tightly scoped audience, revocable key, basic-auth'd URL.

## Decision

Bake the operator's Anthropic key into the server deploy.

- `anthropic_api_key` is a required Terraform variable (no default) in `deploy/variables.tf`.
- Value travels: `terraform.tfvars` (gitignored) → `templatefile()` → cloud-init `/opt/app/.env` → compose → app container env as `ANTHROPIC_API_KEY`.
- The app reads the server env directly. No browser-side BYOK path.

## Consequences

- **Operator pays for all reviewer tokens** during the demo window. Accepted — the demo lifetime is short and bounded.
- **Key is plaintext in multiple places on the operator's infrastructure**: tfvars (gitignored), local Terraform state (gitignored), OVH user-data metadata, `/opt/app/.env` on the VM, container env. None are committed; all are on machines the operator controls. An attacker with OVH project access or shell on the VM can read it — acceptable threat surface for a demo, not for production.
- **Rotation** is a tfvars edit + `terraform apply` (destructive — replaces the VM), or a live `scp`/edit of `/opt/app/.env` + `docker compose up -d app` for a non-destructive update.
- **The Caddy basic-auth gate ([[../todos/active/deployment/04-TLS_AND_DNS]]) becomes the key's real perimeter** — anyone past basic auth can burn tokens. Accepted at demo scale; would not survive production.
- **Revisit if** the repo goes multi-reviewer / self-serve: flip the variable back to optional, restore a `${ANTHROPIC_API_KEY:-}` compose fallback, and reintroduce a per-user key-entry UI.

## Related

- [[002-BYOK_CLAUDE]] — the decision this supersedes.
- [[009-OVH_SINGLE_VM]] — the deploy shape that made this trade-off reasonable.
- [[../todos/active/deployment/04-TLS_AND_DNS]] — basic-auth gate standing in for end-user auth.
