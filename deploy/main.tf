terraform {
  required_version = ">= 1.5"

  required_providers {
    ovh = {
      source  = "ovh/ovh"
      version = "~> 2.6"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "ovh" {
  endpoint           = var.ovh_endpoint
  application_key    = var.ovh_application_key
  application_secret = var.ovh_application_secret
  consumer_key       = var.ovh_consumer_key
}

resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "ovh_cloud_project_ssh_key" "deploy" {
  service_name = var.ovh_project_id
  name         = "${var.instance_name}-key"
  public_key   = var.ssh_public_key
  region       = var.region
}

data "ovh_cloud_project_flavors" "selected" {
  service_name = var.ovh_project_id
  region       = var.region
  name_filter  = var.flavor_name
}

data "ovh_cloud_project_images" "linux" {
  service_name = var.ovh_project_id
  region       = var.region
  os_type      = "linux"
}

locals {
  flavor_id = one([for f in data.ovh_cloud_project_flavors.selected.flavors : f.id])
  image_id  = one([for i in data.ovh_cloud_project_images.linux.images : i.id if i.name == var.image_name])

  cloud_init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    domain            = var.domain
    app_image         = var.app_image
    migrate_image     = var.migrate_image
    postgres_password = random_password.postgres.result
    basic_auth_user   = var.basic_auth_user
    basic_auth_hash   = var.basic_auth_hash
    anthropic_api_key = var.anthropic_api_key
    compose_content   = file("${path.module}/docker-compose.prod.yml")
    caddyfile_content = file("${path.module}/Caddyfile")
  })
}

resource "ovh_cloud_project_instance" "app" {
  service_name   = var.ovh_project_id
  region         = var.region
  billing_period = "hourly"
  name           = var.instance_name

  boot_from {
    image_id = local.image_id
  }

  flavor {
    flavor_id = local.flavor_id
  }

  network {
    public = true
  }

  ssh_key {
    name = ovh_cloud_project_ssh_key.deploy.name
  }

  user_data = local.cloud_init
}
