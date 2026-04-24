.PHONY: dev build up down logs migrate migrate-down migrate-list migrate-make seed reset-db db-shell test test-unit test-http
.PHONY: cloud-build cloud-push cloud-plan cloud-apply cloud-destroy cloud-output cloud-ip cloud-ssh cloud-logs

dev:
	docker compose --profile dev up --build dev

build:
	docker compose build app

up:
	docker compose --profile dev up -d dev

down:
	docker compose --profile dev down

logs:
	docker compose --profile dev logs -f dev

migrate:
	docker compose exec dev npm run db:migrate

migrate-down:
	docker compose exec dev npm run db:migrate:down

migrate-list:
	docker compose exec dev npm run db:migrate:list

migrate-make:
ifndef NAME
	$(error NAME is required, e.g. make migrate-make NAME=add_foo)
endif
	docker compose exec dev npm run db:migrate:make -- $(NAME)

seed:
	docker compose exec dev npm run db:seed

reset-db:
	docker compose exec dev npm run db:reset

db-shell:
	docker compose exec db psql -U postgres -d nextrade

test:
	docker compose exec dev npm test

test-unit:
	docker compose exec dev npm run test:unit

test-http:
	docker compose exec dev npm run test:http

# ---- Cloud (OVH deploy) ------------------------------------------------
# GHCR image coordinates. TAG defaults to "latest"; override with TAG=<short-sha> for rollbacks.
CLOUD_OWNER := buzdyk
CLOUD_TAG   ?= latest
RUNTIME_IMG := ghcr.io/$(CLOUD_OWNER)/dr-assignment:$(CLOUD_TAG)
MIGRATE_IMG := ghcr.io/$(CLOUD_OWNER)/dr-assignment-migrate:$(CLOUD_TAG)

cloud-build:
	docker buildx build --target runtime --platform linux/amd64 -t $(RUNTIME_IMG) --load demo
	docker buildx build --target migrate --platform linux/amd64 -t $(MIGRATE_IMG) --load demo

cloud-push:
	docker buildx build --target runtime --platform linux/amd64 -t $(RUNTIME_IMG) --push demo
	docker buildx build --target migrate --platform linux/amd64 -t $(MIGRATE_IMG) --push demo

cloud-plan:
	cd deploy && terraform init -upgrade && terraform plan

cloud-apply:
	cd deploy && terraform init -upgrade && terraform apply

cloud-destroy:
	cd deploy && terraform destroy

cloud-output:
	cd deploy && terraform output

cloud-ip:
	@cd deploy && terraform output -raw instance_ipv4

cloud-ssh:
	@cd deploy && ssh ubuntu@$$(terraform output -raw instance_ipv4)

cloud-logs:
	@cd deploy && ssh ubuntu@$$(terraform output -raw instance_ipv4) 'sudo tail -f /var/log/cloud-init-output.log'
