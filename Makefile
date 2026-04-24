.PHONY: dev build up down logs migrate migrate-down migrate-list migrate-make seed reset-db db-shell

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
