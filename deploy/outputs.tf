locals {
  ipv4 = one([for a in ovh_cloud_project_instance.app.addresses : a.ip if a.version == 4])
}

output "instance_ipv4" {
  value       = local.ipv4
  description = "Public IPv4 address — point the domain's A record at this"
}

output "ssh_command" {
  value       = "ssh ubuntu@${local.ipv4}"
  description = "Ready-to-run SSH command for the new instance"
}

output "postgres_password" {
  value       = random_password.postgres.result
  sensitive   = true
  description = "Generated Postgres password, baked into /opt/app/.env via cloud-init"
}
