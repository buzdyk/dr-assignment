---
type: todo
status: done
description: Caddy sidecar for auto-TLS with basic-auth gate; A record setup at the DNS provider. Domain + credentials supplied via gitignored tfvars — never committed.
---
# TLS + DNS

Part of [[../DEPLOYMENT]].

## Problem

The app listens on `:3455` inside the compose network. We want it on the public internet under the operator's chosen hostname, with a real cert, with as little operator effort as possible. Let's Encrypt via Caddy's automatic cert management is the lowest-touch option — no certbot cronjob, no nginx config templates, no renewal scripts. The hostname and the basic-auth credentials are provided at apply time via `deploy/terraform.tfvars` (gitignored); nothing identifying lands in `Caddyfile` or any spec.

## Approach

### DNS (manual, one step)

After [[01-OVH_TERRAFORM]] outputs `instance_ipv4`, create at the DNS provider for the chosen domain:

```
<subdomain>   A   <instance_ipv4>   TTL 300
```

Propagation is usually < 5 minutes. Caddy will retry the ACME challenge until DNS resolves.

### Caddy service in prod compose

Added to `docker-compose.prod.yml` ([[03-GHCR_IMAGE]]):

```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN}
    volumes:
      - /opt/app/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - app
    restart: unless-stopped
```

`caddy-data` persists the LE account key + issued certs across restarts — critical, or every boot re-requests certs and eventually hits Let's Encrypt's rate limit. `DOMAIN` is passed through so the same Caddyfile works if we ever want to target another hostname.

### Caddyfile

Dropped at `/opt/app/Caddyfile` by cloud-init, lives at `deploy/Caddyfile` in the repo. Nothing identifying is committed — hostname, username, and bcrypt hash are all env-var placeholders resolved at Caddy startup from values `.env` picks up (values originate in `terraform.tfvars`, gitignored):

```
{$DOMAIN} {
  encode gzip

  basic_auth {
    {$BASIC_AUTH_USER} {$BASIC_AUTH_HASH}
  }

  reverse_proxy app:3455

  log {
    output stdout
    format console
  }
}
```

That's it. Caddy handles:

- ACME HTTP-01 challenge on `:80`.
- Cert issue + renewal (30 days before expiry, automatic).
- HTTP → HTTPS redirect (implicit for any site block with a hostname).
- HTTP/2 + gzip.
- Basic-auth gate on every route (including the SSE stream).

### Basic auth

Reviewer-only access; no real auth layer in the app yet.

- **Where it lives:** `basic_auth_user` and `basic_auth_hash` in `deploy/terraform.tfvars` (gitignored). Terraform passes both into cloud-init's `.env`; compose forwards them into the Caddy container as `BASIC_AUTH_USER` / `BASIC_AUTH_HASH`; Caddyfile references them as `{$…}`.
- **Hash generation:** `docker run --rm caddy:2-alpine caddy hash-password --plaintext '<password>'`. Bcrypt; never paste the plaintext into any file under the repo.
- **Scope:** all routes. Caddy's `basic_auth` works cleanly with SSE — the initial request carries the `Authorization` header and the stream keeps running after auth succeeds.
- **Rotation:** update the hash in `terraform.tfvars`, re-run `terraform apply` (destructive on the VM) *or* for a cheap rotation `scp` a new `.env` to `/opt/app/.env` and `docker compose up -d caddy` on the host.
- **Removal:** delete the `basic_auth` block from the Caddyfile once there's a real auth flow in the app.

### SSE compatibility

The app streams chat responses over SSE ([[../../../adr/003-SSE_FOR_AI_STREAMING]]). Caddy's `reverse_proxy` handles SSE out of the box — no buffering, no flush tuning required. Verified once manually with a chat turn; no config needed beyond the block above.

## Notes

- **Staging env.** If you want to avoid Let's Encrypt's production rate limits while iterating on the compose file, add `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` globally in the Caddyfile. Remove before the real deploy — staging certs aren't trusted by browsers.
- **Port 3455 exposure.** The `app` service does NOT publish port 3455 in the prod compose — it's only reachable via the Docker network. Caddy is the sole public entry point. Matches the UFW rules in [[02-CLOUD_INIT]] (80 + 443 + 22 only).
- **Cert persistence on instance replacement.** Terraform replacing the VM ([[01-OVH_TERRAFORM]] flavor or region change) loses the `caddy-data` volume, so LE re-issues. Fine at demo scale; mention if we ever hit rate limits.

## What Was Done

`deploy/Caddyfile` is the three-line site block planned: `{$DOMAIN}` site, `basic_auth` gated on `{$BASIC_AUTH_USER}` / `{$BASIC_AUTH_HASH}`, `reverse_proxy app:3455`, gzip, console logs. The Caddy sidecar in `deploy/docker-compose.prod.yml` exposes 80/443, mounts `caddy-data` + `caddy-config` for cert persistence, and reads the env vars cloud-init writes to `/opt/app/.env` (origin: `terraform.tfvars`). Hostname, basic-auth user, and bcrypt hash stay out of the repo entirely. DNS A record remains a manual step after `terraform apply` — Caddy waits out propagation and ACME-issues on its own.
