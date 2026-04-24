---
type: adr
status: accepted
date: 2026-04-24
---
# ADR-009: Single-VM OVH deploy for the demo

## Status
Accepted — implemented in `deploy/` (Terraform + cloud-init).

## Context

The demo needs a public URL for DR to review. No user accounts, no persistent state the reviewer cares about beyond their session, BYOK so no long-lived server secrets. One reviewer at a time; low, bursty traffic; short lifetime (weeks, not years).

Platform choice was largely a personal-preference + speed call, not a technical optimum. I already have an OVH account, SSH flow, and billing set up, so "provision a VM and move on" is meaningfully faster than onboarding to any PaaS I'd otherwise recommend for a production system.

## Options

### A. OVH Public Cloud single VM + Docker Compose (chosen)

- One `b2-7` instance (2 vCPU / 7 GB) via the `ovh/ovh` Terraform provider.
- cloud-init installs Docker, drops compose + Caddyfile + `.env`, runs migrations + seeds, starts the stack.
- Caddy for auto-TLS (Let's Encrypt) + basic auth in front.
- Postgres in the same compose file, volume on the instance disk.

### B. Fly.io / Railway / Render (managed PaaS)

- `fly deploy` from the existing Dockerfile; managed Postgres add-on; TLS + DNS handled by the platform.
- Less YAML, less cloud-init plumbing.

### C. AWS / GCP (EC2 or Cloud Run + RDS)

- Closest to an industry-standard production deploy.
- Terraform resource count is much higher (VPC, SG, IAM, RDS, ALB, etc.).

## Comparison

| Option | Setup speed | Ongoing ops | Cost | Fit for demo |
|---|---|---|---|---|
| A. OVH VM | Fastest *for me* — existing account, creds, muscle memory | Manual rebuilds, manual backups | ~€15/mo | Excellent |
| B. Fly/Railway/Render | Fast *in general* | Platform handles restarts, scaling, TLS | Free tier to ~$10/mo | Excellent |
| C. AWS/GCP | Slowest — more Terraform, more concepts to reason about | Cheapest at scale | Comparable after free tier | Overkill |

## Decision

**Option A — single OVH VM.** Two reasons, stated plainly:

1. **Personal preference and existing footprint.** I already have an OVH Public Cloud project, API keys issued, SSH workflow, and a mental model of their UI. Onboarding to a new PaaS (even one I'd recommend to someone starting fresh) is a slower path to a running URL than provisioning a VM I can reason about in my sleep.
2. **Fastest time-to-demo.** The existing compose file runs as-is on a Docker host. Wrapping it in Terraform + cloud-init is ~150 lines of HCL + YAML. A PaaS deploy would be fewer lines but would need a Postgres add-on wired up and a platform-specific Procfile/fly.toml/etc. — same work, different flavour, and I'd be looking up syntax instead of writing it.

This is an explicit time-vs-cleanliness trade. At production scale none of the reasons above survive: managed Postgres beats a colocated DB, a PaaS or Kubernetes beats per-VM Terraform, and the first real user session deserves more than a single instance. See the consequences below.

## Consequences

- **Single point of failure.** A host reboot or OVH outage takes the demo offline. Acceptable for this lifetime.
- **No HA, no managed Postgres.** DB lives in a Docker named volume on the instance disk. `pg_dump` by hand if there's ever state worth preserving.
- **Manual GHCR build + push.** No CI pipeline yet; see [[../todos/icebox/CI_GITHUB_ACTIONS]] for the thaw trigger. The same workflow would eventually own the image push.
- **Rebuild > patch.** Changing flavor, region, or base OS is destructive (Terraform replaces the instance and loses the DB volume). That's fine — the redeploy path *is* the operational story, and it's fast.
- **Basic-auth gate on the public URL.** The app has no real auth layer yet; Caddy's `basic_auth` with a shared password is sufficient for a reviewer-only demo. Removing it or swapping for real auth is a one-line Caddyfile change.

## Related

- [[004-DOCKER_COMPOSE]] — the compose shape this deploy reuses, with a prod override.
- [[002-BYOK_CLAUDE]] — why no `ANTHROPIC_API_KEY` is shipped to the server.
- [[../todos/active/DEPLOYMENT]] — the epic that implements this ADR.
