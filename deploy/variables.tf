variable "ovh_application_key" {
  type        = string
  sensitive   = true
  description = "OVH API application key"
}

variable "ovh_application_secret" {
  type        = string
  sensitive   = true
  description = "OVH API application secret"
}

variable "ovh_consumer_key" {
  type        = string
  sensitive   = true
  description = "OVH API consumer key"
}

variable "ovh_endpoint" {
  type        = string
  default     = "ovh-ca"
  description = "OVH API endpoint — ovh-ca, ovh-eu, ovh-us. Must match the region your account was opened in (tokens are not cross-region)."
}

variable "ovh_project_id" {
  type        = string
  description = "OVH Public Cloud project (service) ID — UUID"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key authorized for ubuntu@<instance>"
}

variable "region" {
  type        = string
  default     = "BHS5"
  description = "OVH region for the instance. Must be in your Public Cloud project's enabled regions — BHS5 (Montréal) for CA accounts, GRA11/SBG5/etc. for EU."
}

variable "flavor_name" {
  type        = string
  default     = "b2-7"
  description = "OVH flavor name (b2-7 = 2 vCPU / 7 GB)"
}

variable "image_name" {
  type        = string
  default     = "Ubuntu 24.04"
  description = "Exact OVH image name to boot from"
}

variable "domain" {
  type        = string
  description = "Public hostname Caddy serves (e.g. demo.example.com). Required — no default so it can't leak into the repo."
}

variable "basic_auth_user" {
  type        = string
  sensitive   = true
  description = "Username for Caddy's edge basic-auth gate"
}

variable "basic_auth_hash" {
  type        = string
  sensitive   = true
  description = "Bcrypt hash of the basic-auth password. Generate with: docker run --rm caddy:2-alpine caddy hash-password --plaintext '<password>'"
}

variable "anthropic_api_key" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Optional Anthropic API key baked into the server's env. Leave empty to keep the BYOK flow where each operator supplies their own at runtime."
}

variable "app_image" {
  type        = string
  default     = "ghcr.io/buzdyk/dr-assignment:latest"
  description = "Runtime image pulled from GHCR (public)"
}

variable "migrate_image" {
  type        = string
  default     = "ghcr.io/buzdyk/dr-assignment-migrate:latest"
  description = "Migration/seed image pulled from GHCR (public)"
}

variable "instance_name" {
  type        = string
  default     = "dr-demo"
  description = "Name tag for the OVH instance"
}
