---
type: todo
status: done
description: Provision a single OVH Public Cloud VM + SSH keypair via Terraform; emit the public IPv4 as output
---
# OVH Terraform Provisioning

Part of [[../DEPLOYMENT]].

## Problem

The deploy target is a single OVH Public Cloud VM. We want it declarative — one `terraform apply` from a fresh checkout yields a running host with the cloud-init script wired in. Everything downstream ([[02-CLOUD_INIT]], [[04-TLS_AND_DNS]]) assumes an IP and an SSH key exist.

## Prerequisites

One-time, manual, before Terraform can authenticate. Not in code because they require human clicks in the OVH UI.

1. **OVH account + Public Cloud project.** Create at [ovh.com](https://ovh.com) → "Public Cloud" → new project. Note the project ID (UUID).
2. **API credentials.** Generate at [api.ovh.com/createToken](https://api.ovh.com/createToken) with rights `GET/POST/PUT/DELETE` on `/cloud/project/*`. Yields `application_key`, `application_secret`, `consumer_key`.
3. **`terraform.tfvars`** — gitignored, at `deploy/terraform.tfvars` (template at `deploy/terraform.tfvars.example`):
   ```hcl
   ovh_application_key    = "..."
   ovh_application_secret = "..."
   ovh_consumer_key       = "..."
   ovh_project_id         = "..."
   ssh_public_key         = "ssh-ed25519 AAAA... greg@laptop"
   ```
   No GHCR token — images are public ([[03-GHCR_IMAGE]]), so the VM doesn't need credentials to pull.

## Approach

Terraform lives in the top-level `deploy/` directory alongside the prod compose + Caddyfile:

- `deploy/main.tf` — provider, data-source lookups, instance + ssh-key resources, random postgres password.
- `deploy/variables.tf` — variables declared above, plus overridable defaults (`region`, `flavor_name`, `image_name`, `domain`, image refs).
- `deploy/outputs.tf` — `instance_ipv4`, `ssh_command`, `postgres_password` (sensitive).
- `deploy/cloud-init.yaml.tftpl` — templated user-data ([[02-CLOUD_INIT]]).
- `deploy/docker-compose.prod.yml` + `deploy/Caddyfile` — embedded into `write_files` at render time via `file()`.
- `deploy/.gitignore` — state, tfvars, plan files.

Provider: `ovh/ovh ~> 2.6`. Exposes `ovh_cloud_project_instance` directly. `flavor` and `boot_from` are nested blocks taking IDs (not names), so we look names up via the `ovh_cloud_project_flavors` and `ovh_cloud_project_images` data sources. Alternative is the `openstack` provider pointed at OVH's Keystone endpoint — more flexible (floating IPs, security groups) but more ceremony. Start with `ovh/ovh`; swap only if something it can't express blocks us.

Resource sketch:

```hcl
data "ovh_cloud_project_flavors" "selected" {
  service_name = var.ovh_project_id
  region       = var.region
  name_filter  = var.flavor_name          # strict equality, e.g. "b2-7"
}

data "ovh_cloud_project_images" "linux" {
  service_name = var.ovh_project_id
  region       = var.region
  os_type      = "linux"
}

locals {
  flavor_id = one([for f in data.ovh_cloud_project_flavors.selected.flavors : f.id])
  image_id  = one([for i in data.ovh_cloud_project_images.linux.images : i.id if i.name == var.image_name])
}

resource "ovh_cloud_project_ssh_key" "deploy" {
  service_name = var.ovh_project_id
  name         = "${var.instance_name}-key"
  public_key   = var.ssh_public_key
  region       = var.region
}

resource "ovh_cloud_project_instance" "app" {
  service_name   = var.ovh_project_id
  region         = var.region
  billing_period = "hourly"
  name           = var.instance_name

  boot_from { image_id  = local.image_id }
  flavor    { flavor_id = local.flavor_id }
  network   { public    = true }
  ssh_key   { name      = ovh_cloud_project_ssh_key.deploy.name }

  user_data = local.cloud_init
}
```

Outputs (IPv4 is extracted from the `addresses` attribute):

```hcl
locals {
  ipv4 = one([for a in ovh_cloud_project_instance.app.addresses : a.ip if a.version == 4])
}
output "instance_ipv4" { value = local.ipv4 }
output "ssh_command"   { value = "ssh ubuntu@${local.ipv4}" }
```

## Notes

- **State** lives locally at `deploy/terraform.tfstate` — small enough, single-operator. Promote to a remote backend (OVH Object Storage is S3-compatible, works with the `s3` backend) the first time a second operator needs to apply.
- **Changing flavor or region** is destructive — Terraform replaces the instance, and the Postgres volume goes with it. Plan accordingly; take a `pg_dump` first if the demo has state worth preserving.
- **No firewall rules** beyond what cloud-init's UFW config sets ([[02-CLOUD_INIT]]) — OVH Public Cloud instances are open by default. 22 / 80 / 443 only; Postgres is never exposed.
- **Image name collisions.** The `ovh_cloud_project_images` data source returns every `linux` image for the region. `one([... if i.name == var.image_name])` errors if multiple images share the exact name — tighten the filter (e.g. add `flavor_type == null` for the universal variant) if that happens.

## Related

- [[02-CLOUD_INIT]] — the `user_data` this module templates.
- [[../DEPLOYMENT]] — parent epic.
- [[../../../adr/009-OVH_SINGLE_VM]] — why OVH, why a single VM.

## What Was Done

Landed as `deploy/main.tf`, `variables.tf`, `outputs.tf` plus `terraform.tfvars.example`. Uses the `ovh/ovh ~> 2.6` provider with the `ovh_cloud_project_flavors` / `ovh_cloud_project_images` data sources to look IDs up by name, a `random_password` for the Postgres credential, and an `ovh_cloud_project_instance` whose `user_data` is rendered from `cloud-init.yaml.tftpl`. Outputs `instance_ipv4` and `ssh_command` as planned. State stays local (`deploy/terraform.tfstate`); the provider lock file was committed in 644ca64 for reproducible `terraform init`. `make cloud-plan` / `cloud-apply` / `cloud-destroy` / `cloud-ip` / `cloud-ssh` wrap the common flows from the repo root.
