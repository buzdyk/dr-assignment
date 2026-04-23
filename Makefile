.PHONY: dev build

dev:
	docker compose --profile dev up --build dev

build:
	docker compose build app
